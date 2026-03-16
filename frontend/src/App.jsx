// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from './store/authSlice';
import LoadingPage from './pages/LoadingPage';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TradeEntryPage from './pages/TradeEntryPage';
import MonitorPLPage from './pages/MonitorPLPage';
import Navbar from './components/layout/Navbar';
import AppFooter from './components/layout/AppFooter';

const RequireAuth = ({ children }) => {
  const isAuthed = useSelector(selectIsAuthenticated);
  const location = useLocation();
  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-brandBg flex flex-col">
      <Navbar />
      <div className="flex-1 px-6 py-6">
        <Outlet />
      </div>
      <AppFooter />
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LoadingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/home" element={<HomePage />} />
        <Route path="/trades" element={<TradeEntryPage />} />
        <Route path="/monitor" element={<MonitorPLPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
