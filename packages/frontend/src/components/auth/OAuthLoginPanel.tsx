/**
 * OAuth Login Panel Component
 * OAuth 登录面板组件
 *
 * Provides a panel with multiple OAuth login buttons
 * 提供包含多个OAuth登录按钮的面板
 */

import React from 'react';
import { Card, Typography, Divider, Space } from 'antd';
import { OAuthLoginButton, OAuthProvider } from './OAuthLoginButton';

interface OAuthLoginPanelProps {
  /** 可用的OAuth提供商列表 */
  providers?: OAuthProvider[];
  /** 登录处理函数 */
  onLogin: (provider: OAuthProvider) => void;
  /** 是否显示传统登录选项 */
  showTraditionalLogin?: boolean;
  /** 传统登录处理函数 */
  onTraditionalLogin?: () => void;
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 是否正在加载 */
  loading?: boolean;
  /** 自定义样式 */
  sx?: any;
}

/**
 * 默认支持的OAuth提供商
 */
const DEFAULT_PROVIDERS: OAuthProvider[] = ['github', 'google', 'wechat', 'qq'];

const { Title, Text } = Typography;

/**
 * OAuth Login Panel Component
 * OAuth 登录面板组件
 */
export const OAuthLoginPanel: React.FC<OAuthLoginPanelProps> = ({
  providers = DEFAULT_PROVIDERS,
  onLogin,
  showTraditionalLogin = true,
  onTraditionalLogin,
  title = '选择登录方式',
  description = '使用您喜欢的平台快速登录',
  loading = false,
  ...props
}) => {
  const handleProviderClick = (provider: OAuthProvider) => {
    if (!loading) {
      onLogin(provider);
    }
  };

  return (
    <Card
      style={{ maxWidth: 400, width: '100%', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
      {...props}
    >
      {/* 标题区域 */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          {title}
        </Title>
        {description && (
          <Text type="secondary">
            {description}
          </Text>
        )}
      </div>

      {/* OAuth 登录按钮 */}
      <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 16 }}>
        {providers.map((provider) => (
          <OAuthLoginButton
            key={provider}
            provider={provider}
            onClick={() => handleProviderClick(provider)}
            loading={loading}
            fullWidth
          />
        ))}
      </Space>

      {/* 分割线和传统登录选项 */}
      {showTraditionalLogin && onTraditionalLogin && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Divider plain>
            <Text type="secondary">或者</Text>
          </Divider>

          <div
            style={{
              marginTop: 16,
              padding: '12px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: 'transparent',
            }}
            onClick={onTraditionalLogin}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#1890ff';
              e.currentTarget.style.backgroundColor = '#f0f8ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d9d9d9';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Text strong>
              使用邮箱/手机号登录
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
};

export default OAuthLoginPanel;
