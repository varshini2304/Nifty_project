// frontend/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../store/api/authApi';
import { setCredentials } from '../store/authSlice';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [errorMessage, setErrorMessage] = useState('');

  const onFinish = async (values) => {
    setErrorMessage('');
    const result = await login(values);
    if (result.error) {
      setErrorMessage('Invalid credentials');
      return;
    }
    const { accessToken, expiresIn } = result.data.data;
    dispatch(setCredentials({ token: accessToken, username: values.username, role: 'admin', expiresIn }));
    navigate('/home');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-center items-center text-white" style={{ background: 'linear-gradient(135deg, #1B4F72 0%, #2E86C1 100%)' }}>
        <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-brandBlue text-4xl font-bold mb-4">N</div>
        <div className="text-3xl font-bold">NichIn-Soft PL Monitor</div>
        <div className="text-lg italic text-blue-200 mt-2">NSE Portfolio Tracker</div>
      </div>
      <div className="flex items-center justify-center bg-white">
        <div className="w-full max-w-sm p-8">
          <h1 className="text-2xl font-semibold text-slate-800 mb-6">Sign In</h1>
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Username"
              name="username"
              rules={[
                { required: true, message: 'Username is required' },
                { min: 3, message: 'Minimum 3 characters' },
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="nichiuser" />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Password is required' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={isLoading} className="bg-brandBlue">
              Sign In
            </Button>
            {errorMessage ? (
              <Alert className="mt-4" message={errorMessage} type="error" showIcon />
            ) : null}
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
