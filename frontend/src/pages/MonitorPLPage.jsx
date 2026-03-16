// frontend/src/pages/MonitorPLPage.jsx
import React, { useMemo, useState } from 'react';
import { Button, DatePicker, Tooltip, Alert } from 'antd';
import dayjs from 'dayjs';
import PLTable from '../components/monitor/PLTable';
import TradeDetailsModal from '../components/trade/TradeDetailsModal';
import { exportToCsv } from '../utils/csvUtils';
import { useGetMonitorPLQuery } from '../store/api/monitorApi';

const MonitorPLPage = () => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [shouldFetch, setShouldFetch] = useState(false);
  const [modalState, setModalState] = useState({ open: false, code: null, asOfDate: null });

  const dateInt = Number(selectedDate.format('YYYYMMDD'));
  const { data, isFetching } = useGetMonitorPLQuery(dateInt, { skip: !shouldFetch });
  const rows = data?.data || [];

  const missingPrice = rows.some((row) => row.priceT === 0);

  const onLoad = () => {
    setShouldFetch(true);
  };

  const onExport = () => {
    exportToCsv(rows, `monitor_pl_${dateInt}.csv`);
  };

  const onOpenDetails = (code, mode) => {
    const asOf = mode === 'T-1'
      ? Number(dayjs(selectedDate).subtract(1, 'day').format('YYYYMMDD'))
      : dateInt;
    setModalState({ open: true, code, asOfDate: asOf });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onExport}>Export CSV</Button>
        <DatePicker
          value={selectedDate}
          format="DD/MM/YYYY"
          onChange={(date) => {
            setSelectedDate(date || dayjs());
            setShouldFetch(false);
          }}
        />
        <Button type="primary" className="bg-brandBlue" onClick={onLoad} loading={isFetching}>
          Load
        </Button>
        <Tooltip title="Monitor PL is read-only">
          <Button disabled>Save</Button>
        </Tooltip>
        <div className="ml-auto text-xs text-slate-500">USERNAME: nichiuser</div>
      </div>

      {missingPrice ? (
        <Alert type="warning" message="Price data missing for one or more stocks." showIcon />
      ) : null}

      <PLTable rows={rows} onOpenDetails={onOpenDetails} />

      <TradeDetailsModal
        open={modalState.open}
        onClose={() => setModalState({ open: false, code: null, asOfDate: null })}
        stockCode={modalState.code}
        asOfDate={modalState.asOfDate}
      />
    </div>
  );
};

export default MonitorPLPage;
