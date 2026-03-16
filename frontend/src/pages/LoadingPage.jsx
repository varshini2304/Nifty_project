// frontend/src/pages/LoadingPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { selectIsAuthenticated } from '../store/authSlice';

const messages = [
  'Connecting to server...',
  'Checking database...',
  'Loading stock list...',
  'Almost ready...',
];

const LoadingPage = () => {
  const navigate = useNavigate();
  const isAuthed = useSelector(selectIsAuthenticated);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const message = useMemo(() => messages[messageIndex % messages.length], [messageIndex]);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex((prev) => prev + 1);
    }, 800);

    return () => clearInterval(messageTimer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const poller = setInterval(async () => {
      try {
        const response = await axiosInstance.get('/health');
        if (response.data?.data?.status === 'ok' && isMounted) {
          setIsReady(true);
          clearInterval(poller);
        }
      } catch (err) {
        // keep polling
      }
    }, 500);

    return () => {
      isMounted = false;
      clearInterval(poller);
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (isAuthed) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  }, [isReady, isAuthed, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white relative" style={{ background: 'linear-gradient(135deg, #1B4F72 0%, #2E86C1 100%)' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-brandBlue text-4xl font-bold">N</div>
        <div className="text-3xl font-bold">NichIn-Soft PL Monitor</div>
        <div className="text-lg italic text-blue-200">NSE Portfolio Tracker</div>
        <Spin size="large" className="text-white" />
        <div className="text-sm text-white/80">{message}</div>
      </div>
      <div className="absolute bottom-4 text-xs text-white/50">v1.0.0</div>
    </div>
  );
};

export default LoadingPage;
