// frontend/src/pages/HomePage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Card, Statistic, Button, Table, Badge } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import axiosInstance from '../api/axiosInstance';
import { useGetTradesQuery } from '../store/api/tradesApi';
import { useGetMonitorPLQuery } from '../store/api/monitorApi';
import { toDisplay } from '../utils/dateUtils';

const getIstDate = () => {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 330 * 60000);
};

const isMarketOpen = () => {
  const ist = getIstDate();
  const day = ist.getDay();
  if (day === 0 || day === 6) return false;
  const hours = ist.getHours();
  const minutes = ist.getMinutes();
  const total = hours * 60 + minutes;
  const open = 9 * 60 + 15;
  const close = 15 * 60 + 30;
  return total >= open && total <= close;
};

const HomePage = () => {
  const navigate = useNavigate();
  const username = useSelector((state) => state.auth.username) || 'nichiuser';
  const todayInt = Number(dayjs().format('YYYYMMDD'));
  const { data: tradesData } = useGetTradesQuery({ includeDeleted: false });
  const { data: monitorData } = useGetMonitorPLQuery(todayInt);
  const [healthTimestamp, setHealthTimestamp] = useState(null);

  useEffect(() => {
    const loadHealth = async () => {
      try {
        const response = await axiosInstance.get('/health');
        setHealthTimestamp(response.data?.data?.timestamp || null);
      } catch (err) {
        setHealthTimestamp(null);
      }
    };
    loadHealth();
  }, []);

  const trades = tradesData?.data || [];
  const monitorRows = monitorData?.data || [];
  const activePositions = monitorRows.filter((row) => row.positionT !== 0).length;

  const recentTrades = useMemo(() => trades.slice(0, 5), [trades]);
  const marketOpen = isMarketOpen();

  const tradeColumns = [
    { title: 'TradeNo', dataIndex: 'tradeNo', key: 'tradeNo' },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Side', dataIndex: 'side', key: 'side' },
    { title: 'Price', dataIndex: 'tradePrice', key: 'tradePrice' },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
    {
      title: 'Date',
      dataIndex: 'tradeDate',
      key: 'tradeDate',
      render: (value) => toDisplay(value),
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-brandBlue text-white shadow-card" styles={{ body: { padding: 24 } }}>
        <div className="text-2xl font-semibold">Welcome, {username}</div>
        <div className="text-sm mt-1">{dayjs().format('DD/MM/YYYY')}</div>
        <div className="mt-4">
          <Badge
            color={marketOpen ? '#1E8449' : '#7F8C8D'}
            text={marketOpen ? 'NSE Open' : 'NSE Closed'}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <Statistic title="Total Trades" value={trades.length} valueStyle={{ color: trades.length > 0 ? '#1E8449' : '#7F8C8D' }} />
        </Card>
        <Card className="shadow-card">
          <Statistic title="Active Positions" value={activePositions} />
        </Card>
        <Card className="shadow-card">
          <Statistic
            title="Last Price Update"
            value={healthTimestamp ? dayjs(healthTimestamp).format('DD/MM/YYYY HH:mm') : 'Unknown'}
          />
        </Card>
        <Card className="shadow-card">
          <Statistic title="Market Status" value={marketOpen ? 'Open' : 'Closed'} valueStyle={{ color: marketOpen ? '#1E8449' : '#7F8C8D' }} />
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="primary" className="bg-brandGreen" onClick={() => navigate('/trades')}>
          + New Trade
        </Button>
        <Button type="default" className="border-brandBlue text-brandBlue" onClick={() => navigate('/monitor')}>
          Open Monitor PL
        </Button>
      </div>

      <Card title="Recent Activity" className="shadow-card">
        <Table
          dataSource={recentTrades}
          columns={tradeColumns}
          rowKey="tradeNo"
          pagination={false}
          rowClassName={(record) =>
            record.side === 'B' ? 'border-l-4 border-brandGreen' : 'border-l-4 border-brandRed'
          }
        />
      </Card>
    </div>
  );
};

export default HomePage;
