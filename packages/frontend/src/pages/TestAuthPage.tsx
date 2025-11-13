/**
 * 认证功能测试页面
 * Authentication Test Page
 */

import React from 'react';
import { Card, Typography, Space, Button, Descriptions } from 'antd';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;

const TestAuthPage: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="container mx-auto p-6">
      <Title level={2}>认证状态测试</Title>
      
      <Space direction="vertical" size="large" className="w-full">
        <Card title="认证状态">
          <Descriptions column={1}>
            <Descriptions.Item label="是否已登录">
              {isAuthenticated ? '✅ 已登录' : '❌ 未登录'}
            </Descriptions.Item>
            {user && (
              <>
                <Descriptions.Item label="用户ID">
                  {user.id}
                </Descriptions.Item>
                <Descriptions.Item label="昵称">
                  {user.nickname}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  {user.email}
                </Descriptions.Item>
                <Descriptions.Item label="头像">
                  {user.avatar ? (
                    <img src={user.avatar} alt="头像" className="w-8 h-8 rounded-full" />
                  ) : (
                    '无头像'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="角色">
                  {user.role || '普通用户'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
          
          {isAuthenticated && (
            <div className="mt-4">
              <Button type="primary" danger onClick={handleLogout}>
                退出登录
              </Button>
            </div>
          )}
        </Card>

        <Card title="测试说明">
          <Space direction="vertical">
            <Text>
              🔐 <strong>测试账号：</strong>testuser001@gamehub.test
            </Text>
            <Text>
              🔑 <strong>密码：</strong>Test123456!
            </Text>
            <Text type="secondary">
              你可以使用上述测试账号进行登录测试，或者注册一个新账号。
            </Text>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default TestAuthPage;
