// frontend/src/components/layout/Navbar.jsx
import React from 'react';
import { Menu, Button, Badge } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useLogoutMutation } from '../../store/api/authApi';
import { logout as logoutAction } from '../../store/authSlice';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [logoutApi] = useLogoutMutation();
  const username = useSelector((state) => state.auth.username) || 'nichiuser';

  const selectedKey = location.pathname.startsWith('/trades')
    ? 'trades'
    : location.pathname.startsWith('/monitor')
      ? 'monitor'
      : 'home';

  const onLogout = async () => {
    await logoutApi();
    dispatch(logoutAction());
    navigate('/');
  };

  return (
    <div className="sticky top-0 z-40 h-14 bg-brandBlue text-white flex items-center px-6 shadow">
      <div className="flex items-center gap-3 w-1/4">
        <div className="h-8 w-8 rounded-full bg-white text-brandBlue font-bold flex items-center justify-center">N</div>
        <div className="font-semibold tracking-wide">NichIn-Soft</div>
      </div>
      <div className="flex-1 flex justify-center">
        <Menu
          mode="horizontal"
          theme="dark"
          selectedKeys={[selectedKey]}
          className="bg-brandBlue min-w-[320px] justify-center"
          items={[
            { key: 'home', label: 'Home', onClick: () => navigate('/home') },
            { key: 'trades', label: 'Trade Entry', onClick: () => navigate('/trades') },
            { key: 'monitor', label: 'Monitor PL', onClick: () => navigate('/monitor') },
          ]}
        />
      </div>
      <div className="w-1/4 flex justify-end items-center gap-3">
        <Badge color="#2E86C1" text={`USERNAME: ${username}`} className="text-white" />
        <Button type="text" icon={<LogoutOutlined />} className="text-white" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
