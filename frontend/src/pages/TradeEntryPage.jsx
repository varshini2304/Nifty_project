// frontend/src/pages/TradeEntryPage.jsx
import React, { useMemo, useRef, useState } from 'react';
import { Button, Switch, Modal, notification, Dropdown } from 'antd';
import Papa from 'papaparse';
import dayjs from 'dayjs';
import TradeTable from '../components/trade/TradeTable';
import { exportToCsv } from '../utils/csvUtils';
import {
  useLazyGetTradesQuery,
  useBatchSaveTradesMutation,
  useDeleteTradeMutation,
  useImportTradesCsvMutation,
} from '../store/api/tradesApi';

const TradeEntryPage = () => {
  const [rows, setRows] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0, rowIndex: null });
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef(null);

  const [triggerLoad, { isFetching }] = useLazyGetTradesQuery();
  const [batchSave, { isLoading: isSaving }] = useBatchSaveTradesMutation();
  const [deleteTrade] = useDeleteTradeMutation();
  const [importTrades] = useImportTradesCsvMutation();

  const onRowUpdate = (index, patch) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
    setIsDirty(true);
  };

  const onRowContextMenu = (event, record) => {
    event.preventDefault();
    const index = rows.indexOf(record);
    if (index === -1) return;
    setContextMenu({ open: true, x: event.clientX, y: event.clientY, rowIndex: index });
  };

  const closeContextMenu = () => setContextMenu((prev) => ({ ...prev, open: false }));

  const addRowAt = (index, offset) => {
    const newRow = {
      tradeNo: null,
      code: '',
      name: '',
      tradeDate: Number(dayjs().format('YYYYMMDD')),
      side: 'B',
      tradePrice: null,
      quantity: null,
      updateSource: 'tradeentrytool',
      isDeleted: 0,
    };
    setRows((prev) => {
      const next = [...prev];
      next.splice(index + offset, 0, newRow);
      return next;
    });
    setIsDirty(true);
  };

  const handleDeleteRow = async (row) => {
    if (row.tradeNo) {
      await deleteTrade(row.tradeNo);
      await loadTrades(showDeleted);
    } else {
      setRows((prev) => prev.filter((r) => r !== row));
    }
  };

  const loadTrades = async (includeDeleted) => {
    const result = await triggerLoad({ includeDeleted });
    if (result.error) {
      notification.error({ message: 'Failed to load trades' });
      return;
    }
    setRows(result.data.data || []);
    setIsDirty(false);
  };

  const onLoad = async () => {
    if (isDirty) {
      Modal.confirm({
        title: 'Unsaved changes. Continue?',
        onOk: () => loadTrades(showDeleted),
      });
      return;
    }
    await loadTrades(showDeleted);
  };

  const validateRows = () => {
    const visibleRows = rows.filter((row) => !row.isDeleted);
    for (const row of visibleRows) {
      if (!row.code || !row.tradeDate || !row.side) return false;
      if (!row.tradePrice || row.tradePrice <= 0) return false;
      if (!Number.isInteger(Number(row.quantity)) || row.quantity <= 0) return false;
    }
    return true;
  };

  const onSave = async () => {
    if (!validateRows()) {
      notification.error({ message: 'Validation failed. Check required fields.' });
      return;
    }
    const payload = rows.filter((row) => !row.isDeleted).map((row) => ({
      tradeNo: row.tradeNo,
      code: row.code,
      name: row.name,
      tradeDate: row.tradeDate,
      side: row.side,
      tradePrice: row.tradePrice,
      quantity: row.quantity,
      updateSource: row.updateSource || 'tradeentrytool',
    }));

    const result = await batchSave(payload);
    if (result.error) {
      notification.error({ message: 'Save failed' });
      return;
    }
    notification.success({ message: 'Trades saved' });
    await loadTrades(showDeleted);
  };

  const onExport = () => {
    const filename = `trades_${dayjs().format('YYYYMMDD')}.csv`;
    exportToCsv(rows, filename);
  };

  const onImportFile = (file) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setImportPreview(results.data || []);
        setImportErrors(results.errors || []);
        setIsPreviewOpen(true);
      },
      error: () => {
        notification.error({ message: 'Failed to parse CSV' });
      },
    });
  };

  const onConfirmImport = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      setIsPreviewOpen(false);
      return;
    }
    const result = await importTrades(fileInputRef.current.files[0]);
    if (result.error) {
      notification.error({ message: 'Import failed' });
      return;
    }
    notification.success({ message: 'CSV imported' });
    setIsPreviewOpen(false);
    await loadTrades(showDeleted);
  };

  const menuItems = [
    {
      key: 'addAbove',
      label: 'Add Row Above',
      onClick: () => {
        addRowAt(contextMenu.rowIndex, 0);
        closeContextMenu();
      },
    },
    {
      key: 'addBelow',
      label: 'Add Row Below',
      onClick: () => {
        addRowAt(contextMenu.rowIndex, 1);
        closeContextMenu();
      },
    },
    {
      key: 'delete',
      label: 'Delete Row',
      onClick: () => {
        const row = rows[contextMenu.rowIndex];
        if (row) {
          handleDeleteRow(row);
        }
        closeContextMenu();
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onExport}>Export CSV</Button>
        <Button onClick={onLoad} loading={isFetching}>Load</Button>
        <div className="flex items-center gap-2">
          <span>unHide</span>
          <Switch
            checked={showDeleted}
            onChange={async (checked) => {
              setShowDeleted(checked);
              await loadTrades(checked);
            }}
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button onClick={() => fileInputRef.current?.click()}>Import CSV</Button>
          <Button type="primary" className="bg-brandBlue" onClick={onSave} loading={isSaving}>
            Save
          </Button>
        </div>
      </div>

      <TradeTable
        rows={rows.filter((row) => (showDeleted ? true : !row.isDeleted))}
        onRowUpdate={onRowUpdate}
        onRowContextMenu={onRowContextMenu}
        showDeleted={showDeleted}
      />

      <Dropdown
        menu={{ items: menuItems }}
        open={contextMenu.open}
        onOpenChange={(open) => setContextMenu((prev) => ({ ...prev, open }))}
        overlayStyle={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
      >
        <div className="fixed" style={{ left: contextMenu.x, top: contextMenu.y, width: 1, height: 1 }} />
      </Dropdown>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => onImportFile(e.target.files[0])}
      />

      <Modal
        open={isPreviewOpen}
        title="Import Preview"
        onCancel={() => setIsPreviewOpen(false)}
        onOk={onConfirmImport}
      >
        <div className="text-sm mb-2">Parsed rows: {importPreview.length}</div>
        <div className="text-sm mb-2">Errors: {importErrors.length}</div>
        <div className="max-h-40 overflow-auto border rounded p-2 text-xs">
          {importErrors.length > 0 ? importErrors.map((err, idx) => (
            <div key={idx}>{err.message}</div>
          )) : 'No parsing errors detected.'}
        </div>
      </Modal>
    </div>
  );
};

export default TradeEntryPage;
