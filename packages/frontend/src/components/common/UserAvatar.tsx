/**
 * 用户头像组件
 * User Avatar Component
 */

import React from 'react';
import { Avatar, Dropdown, Button, Space, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

const { Text } = Typography;

const UserAvatar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  if (!isAuthenticated || !user) {
    return (
      <Space>
        <Button type="default" onClick={() => navigate('/login')}>
          登录
        </Button>
        <Button type="primary" onClick={() => navigate('/login')}>
          注册
        </Button>
      </Space>
    );
  }

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      trigger={['click']}
    >
      <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
        <Avatar
          size="small"
          src={user.avatar}
          icon={<UserOutlined />}
        />
        <Text className="hidden sm:inline max-w-20 truncate">
          {user.nickname}
        </Text>
      </div>
    </Dropdown>
  );
};

export default UserAvatar;
