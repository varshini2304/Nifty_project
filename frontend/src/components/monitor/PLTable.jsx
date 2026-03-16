// frontend/src/components/monitor/PLTable.jsx
import React from 'react';
import { Table, Typography } from 'antd';
import { getArrow, getColorClass } from '../../utils/plColors';

const { Link } = Typography;

const PLTable = ({ rows, onOpenDetails }) => {
  const columns = [
    {
      title: 'Stock',
      dataIndex: 'code',
      key: 'code',
      fixed: 'left',
      width: 120,
      render: (value) => <Link onClick={() => onOpenDetails(value)}>{value}</Link>,
    },
    { title: 'Name', dataIndex: 'name', key: 'name', fixed: 'left', width: 200 },
    {
      title: 'Position(T)',
      dataIndex: 'positionT',
      key: 'positionT',
      render: (value, record) => (
        <Link onClick={() => onOpenDetails(record.code, 'T')}>{value}</Link>
      ),
    },
    {
      title: 'Position(T-1)',
      dataIndex: 'positionT1',
      key: 'positionT1',
      render: (value, record) => (
        <Link onClick={() => onOpenDetails(record.code, 'T-1')}>{value}</Link>
      ),
    },
    {
      title: 'TradePrice',
      dataIndex: 'tradePrice',
      key: 'tradePrice',
      render: (value) => <span>{value}</span>,
    },
    {
      title: 'Cashflow',
      dataIndex: 'cashflow',
      key: 'cashflow',
      render: (value) => <span className={getColorClass(value)}>{value}</span>,
    },
    { title: 'Price(T)', dataIndex: 'priceT', key: 'priceT' },
    { title: 'Price(T-1)', dataIndex: 'priceT1', key: 'priceT1' },
    {
      title: '% Change',
      dataIndex: 'pctChange',
      key: 'pctChange',
      render: (value) => {
        const arrow = getArrow(value);
        return <span className={getColorClass(value)}>{arrow} {value}</span>;
      },
    },
    {
      title: 'PL',
      dataIndex: 'pl',
      key: 'pl',
      render: (value) => <span className={getColorClass(value)}>{value}</span>,
    },
    {
      title: 'PricePL',
      dataIndex: 'pricePL',
      key: 'pricePL',
      render: (value) => <span className={getColorClass(value)}>{value}</span>,
    },
    {
      title: 'TradePL',
      dataIndex: 'tradePL',
      key: 'tradePL',
      render: (value) => <span className={getColorClass(value)}>{value}</span>,
    },
    {
      title: 'TotalPL',
      dataIndex: 'totalPL',
      key: 'totalPL',
      render: (value) => <span className={getColorClass(value)}>{value}</span>,
    },
  ];

  return (
    <Table
      dataSource={rows}
      columns={columns}
      rowKey="code"
      pagination={false}
      scroll={{ x: 1200, y: 520 }}
      sticky
      summary={() => {
        const totals = rows.reduce(
          (acc, row) => {
            acc.pl += row.pl || 0;
            acc.pricePL += row.pricePL || 0;
            acc.tradePL += row.tradePL || 0;
            acc.totalPL += row.totalPL || 0;
            return acc;
          },
          { pl: 0, pricePL: 0, tradePL: 0, totalPL: 0 }
        );
        return (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell colSpan={9} align="right">
                Totals
              </Table.Summary.Cell>
              <Table.Summary.Cell>
                <span className={getColorClass(totals.pl)}>{totals.pl}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell>
                <span className={getColorClass(totals.pricePL)}>{totals.pricePL}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell>
                <span className={getColorClass(totals.tradePL)}>{totals.tradePL}</span>
              </Table.Summary.Cell>
              <Table.Summary.Cell>
                <span className={getColorClass(totals.totalPL)}>{totals.totalPL}</span>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        );
      }}
    />
  );
};

export default PLTable;
