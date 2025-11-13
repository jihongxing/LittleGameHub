/**
 * 登录页面
 * Login Page
 */

import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Divider, Space } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

interface RegisterForm {
  nickname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, register } = useAuthStore();

  const onLoginFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('登录成功！');
      navigate('/games');
    } catch (error: any) {
      message.error(error.message || '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const onRegisterFinish = async (values: RegisterForm) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await register(values.nickname, values.email, values.password);
      message.success('注册成功！');
      navigate('/games');
    } catch (error: any) {
      message.error(error.message || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <Title level={2} className="mb-2">
            🎮 GameHub
          </Title>
          <Text type="secondary">
            {isLogin ? '欢迎回来！' : '加入我们，开始游戏之旅！'}
          </Text>
        </div>

        {isLogin ? (
          // 登录表单
          <Form
            name="login"
            onFinish={onLoginFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱地址"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full"
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        ) : (
          // 注册表单
          <Form
            name="register"
            onFinish={onRegisterFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="nickname"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, message: '用户名至少2个字符' },
                { max: 20, message: '用户名最多20个字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱地址"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              rules={[
                { required: true, message: '请确认密码' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="确认密码"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full"
              >
                注册
              </Button>
            </Form.Item>
          </Form>
        )}

        <Divider />

        <div className="text-center">
          <Space>
            <Text type="secondary">
              {isLogin ? '还没有账号？' : '已有账号？'}
            </Text>
            <Button
              type="link"
              onClick={() => setIsLogin(!isLogin)}
              className="p-0"
            >
              {isLogin ? '立即注册' : '立即登录'}
            </Button>
          </Space>
        </div>

        {/* 测试账号提示 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <Text type="secondary" className="text-xs">
            💡 测试账号：testuser001@gamehub.test<br />
            密码：Test123456!
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
