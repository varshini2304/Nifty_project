// frontend/src/components/trade/TradeDetailsModal.jsx
import React, { useMemo } from 'react';
import { Modal, Table, Spin, Button } from 'antd';
import { useGetTradesByStockQuery } from '../../store/api/tradesApi';
import { toDisplay } from '../../utils/dateUtils';
import { exportToCsv } from '../../utils/csvUtils';

const TradeDetailsModal = ({ open, onClose, stockCode, asOfDate }) => {
  const skip = !open || !stockCode || !asOfDate;
  const { data, isFetching } = useGetTradesByStockQuery(
    { code: stockCode, asOfDate },
    { skip }
  );

  const trades = data?.data || [];

  const columns = [
    { title: 'TradeNo', dataIndex: 'tradeNo', key: 'tradeNo' },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'TradeDate', dataIndex: 'tradeDate', key: 'tradeDate', render: toDisplay },
    { title: 'Side', dataIndex: 'side', key: 'side' },
    { title: 'TradePrice', dataIndex: 'tradePrice', key: 'tradePrice' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
  ];

  const summary = useMemo(() => {
    const netPosition = trades.reduce((sum, t) => sum + (t.side === 'B' ? 1 : -1) * t.quantity, 0);
    const netCashflow = trades.reduce(
      (sum, t) => sum + (t.side === 'B' ? -1 : 1) * t.tradePrice * t.quantity,
      0
    );
    return { netPosition, netCashflow: Math.round(netCashflow * 100) / 100 };
  }, [trades]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`${stockCode} — Trade Details`}
      width="75vw"
      footer={
        <div className="flex justify-between">
          <Button onClick={() => exportToCsv(trades, `trade_details_${stockCode}_${asOfDate}.csv`)}>
            Export CSV
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      }
      destroyOnHidden
      centered
    >
      {isFetching ? (
        <div className="flex items-center justify-center py-12">
          <Spin />
        </div>
      ) : (
        <Table
          dataSource={trades}
          columns={columns}
          rowKey="tradeNo"
          pagination={false}
          rowClassName={(record) =>
            record.side === 'B'
              ? 'bg-green-50 border-l-4 border-brandGreen'
              : 'bg-red-50 border-l-4 border-brandRed'
          }
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={4}>Net Position</Table.Summary.Cell>
                <Table.Summary.Cell colSpan={3}>{summary.netPosition}</Table.Summary.Cell>
              </Table.Summary.Row>
              <Table.Summary.Row>
                <Table.Summary.Cell colSpan={4}>Net Cashflow</Table.Summary.Cell>
                <Table.Summary.Cell colSpan={3}>{summary.netCashflow}</Table.Summary.Cell>
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      )}
    </Modal>
  );
};

export default TradeDetailsModal;
