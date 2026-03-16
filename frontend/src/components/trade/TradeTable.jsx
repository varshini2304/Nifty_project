// frontend/src/components/trade/TradeTable.jsx
import React from 'react';
import { Table, Input, Select, DatePicker, InputNumber, Tag } from 'antd';
import dayjs from 'dayjs';
import StockDropdown from './StockDropdown';

const TradeTable = ({ rows, onRowUpdate, onRowContextMenu, showDeleted }) => {
  const columns = [
    {
      title: 'TradeNo',
      dataIndex: 'tradeNo',
      key: 'tradeNo',
      render: (value) => (value ? <Tag>{value}</Tag> : <Tag color="blue">NEW</Tag>),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (value, record, index) => (
        <StockDropdown
          value={value}
          onChange={(code, name) => onRowUpdate(index, { code, name })}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value, record, index) => (
        <Input value={value} disabled onChange={(e) => onRowUpdate(index, { name: e.target.value })} />
      ),
    },
    {
      title: 'TradeDate',
      dataIndex: 'tradeDate',
      key: 'tradeDate',
      render: (value, record, index) => (
        <DatePicker
          value={value ? dayjs(String(value), 'YYYYMMDD') : null}
          format="DD/MM/YYYY"
          onChange={(date) => onRowUpdate(index, { tradeDate: date ? Number(date.format('YYYYMMDD')) : null })}
        />
      ),
    },
    {
      title: 'Side',
      dataIndex: 'side',
      key: 'side',
      render: (value, record, index) => (
        <Select
          value={value}
          onChange={(val) => onRowUpdate(index, { side: val })}
          options={[
            { value: 'B', label: 'B' },
            { value: 'S', label: 'S' },
          ]}
          style={{ width: 90 }}
        />
      ),
    },
    {
      title: 'TradePrice',
      dataIndex: 'tradePrice',
      key: 'tradePrice',
      render: (value, record, index) => (
        <InputNumber
          value={value}
          min={0.01}
          precision={2}
          onChange={(val) => onRowUpdate(index, { tradePrice: val })}
        />
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (value, record, index) => (
        <InputNumber
          value={value}
          min={1}
          precision={0}
          onChange={(val) => onRowUpdate(index, { quantity: val })}
        />
      ),
    },
  ];

  return (
    <Table
      dataSource={rows}
      columns={columns}
      rowKey={(record) => record.tradeNo || record._key}
      pagination={false}
      onRow={(record) => ({
        onContextMenu: (event) => onRowContextMenu(event, record),
      })}
      rowClassName={(record) => {
        if (record.isDeleted && showDeleted) {
          return 'opacity-60 line-through bg-slate-50';
        }
        if (record.side === 'B') return 'border-l-4 border-brandGreen';
        if (record.side === 'S') return 'border-l-4 border-brandRed';
        return '';
      }}
      scroll={{ x: true }}
    />
  );
};

export default TradeTable;
