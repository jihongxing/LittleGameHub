/**
 * OAuth Status Card Component
 * OAuth 状态卡片组件
 *
 * Displays the status of OAuth provider connections for a user
 * 显示用户的OAuth提供商连接状态
 */

import React from 'react';
import { Card, Typography, Space, Button, Tag, Tooltip } from 'antd';
import { DisconnectOutlined, StarOutlined } from '@ant-design/icons';
import { OAuthProvider } from './OAuthLoginButton';

interface OAuthConnection {
  /** OAuth提供商 */
  provider: OAuthProvider;
  /** 显示名称 */
  displayName: string;
  /** 邮箱 */
  email?: string;
  /** 是否已连接 */
  connected: boolean;
  /** 最后登录时间 */
  lastLoginAt?: Date;
  /** 是否为主登录方式 */
  isPrimary?: boolean;
}

interface OAuthStatusCardProps {
  /** OAuth连接列表 */
  connections: OAuthConnection[];
  /** 连接处理函数 */
  onConnect?: (provider: OAuthProvider) => void;
  /** 断开连接处理函数 */
  onDisconnect?: (provider: OAuthProvider) => void;
  /** 设置主登录方式处理函数 */
  onSetPrimary?: (provider: OAuthProvider) => void;
  /** 是否正在加载 */
  loading?: boolean;
  /** 自定义样式 */
  sx?: any;
}

const { Title, Text } = Typography;

/**
 * 获取提供商的图标和颜色
 */
function getProviderStyle(provider: OAuthProvider) {
  const styles = {
    github: { icon: '🐙', color: '#24292e', bgColor: '#f6f8fa' },
    google: { icon: '🔍', color: '#4285f4', bgColor: '#e3f2fd' },
    wechat: { icon: '💚', color: '#07c160', bgColor: '#e8f5e8' },
    qq: { icon: '🟦', color: '#12b7f5', bgColor: '#e1f5fe' },
    apple: { icon: '🍎', color: '#000000', bgColor: '#f5f5f5' },
  };

  return styles[provider] || styles.github;
}

/**
 * 格式化最后登录时间
 */
function formatLastLogin(date?: Date): string {
  if (!date) return '从未登录';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今天';
  } else if (diffDays === 1) {
    return '昨天';
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * OAuth Status Card Component
 * OAuth 状态卡片组件
 */
export const OAuthStatusCard: React.FC<OAuthStatusCardProps> = ({
  connections,
  onConnect,
  onDisconnect,
  onSetPrimary,
  loading = false,
}) => {
  return (
    <div>
      <Title level={5} style={{ marginBottom: 8 }}>
        OAuth 账户绑定
      </Title>
      <Text type="secondary" style={{ marginBottom: 24, display: 'block' }}>
        绑定第三方账户，可以使用多种方式登录
      </Text>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {connections.map((connection) => {
          const providerStyle = getProviderStyle(connection.provider);

          return (
            <Card
              key={connection.provider}
              style={{
                border: connection.connected ? '1px solid #52c41a' : '1px solid #d9d9d9',
                transition: 'all 0.2s ease-in-out',
              }}
              hoverable
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: providerStyle.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      color: providerStyle.color,
                    }}
                  >
                    {providerStyle.icon}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 16 }}>
                        {connection.displayName}
                      </Text>
                      {connection.connected && connection.isPrimary && (
                        <Tag color="blue">主登录</Tag>
                      )}
                    </div>

                    {connection.connected ? (
                      <div>
                        {connection.email && (
                          <Text type="secondary" style={{ fontSize: 14, display: 'block' }}>
                            {connection.email}
                          </Text>
                        )}
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          最后登录: {formatLastLogin(connection.lastLoginAt)}
                        </Text>
                      </div>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        未绑定
                      </Text>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  {connection.connected ? (
                    <>
                      {!connection.isPrimary && onSetPrimary && (
                        <Tooltip title="设为主登录方式">
                          <Button
                            type="text"
                            icon={<StarOutlined />}
                            onClick={() => onSetPrimary(connection.provider)}
                            disabled={loading}
                            size="small"
                          />
                        </Tooltip>
                      )}

                      <Tooltip title="解除绑定">
                        <Button
                          type="text"
                          danger
                          icon={<DisconnectOutlined />}
                          onClick={() => onDisconnect?.(connection.provider)}
                          disabled={loading}
                          size="small"
                        />
                      </Tooltip>
                    </>
                  ) : (
                    <Button
                      type="default"
                      size="small"
                      onClick={() => onConnect?.(connection.provider)}
                      disabled={loading}
                    >
                      绑定
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </Space>
    </div>
  );
};

export default OAuthStatusCard;
