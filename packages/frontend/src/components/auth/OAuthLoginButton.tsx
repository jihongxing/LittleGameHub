/**
 * OAuth Login Button Component
 * OAuth 登录按钮组件
 *
 * Provides a standardized button for OAuth provider authentication
 * 提供OAuth提供商认证的标准按钮
 */

import React from 'react';
import { Button } from 'antd';
import { GithubOutlined, GoogleOutlined, WechatOutlined, AppleOutlined } from '@ant-design/icons';

export type OAuthProvider = 'github' | 'google' | 'wechat' | 'qq' | 'apple';

interface OAuthLoginButtonProps {
  /** OAuth 提供商 */
  provider: OAuthProvider;
  /** 按钮文本 */
  children?: React.ReactNode;
  /** 是否正在加载 */
  loading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击处理函数 */
  onClick?: () => void;
  /** 按钮大小 */
  size?: 'small' | 'large';
  /** 是否为中等大小（默认为large） */
  isMedium?: boolean;
  /** 是否全宽度 */
  fullWidth?: boolean;
}

/**
 * 获取提供商的显示信息
 */
function getProviderInfo(provider: OAuthProvider) {
  const providerMap = {
    github: {
      name: 'GitHub',
      icon: <GithubOutlined />,
      type: 'default' as const,
    },
    google: {
      name: 'Google',
      icon: <GoogleOutlined />,
      type: 'primary' as const,
    },
    wechat: {
      name: '微信',
      icon: <WechatOutlined />,
      type: 'default' as const,
    },
    qq: {
      name: 'QQ',
      icon: <WechatOutlined />, // QQ icon not available, use WeChat icon
      type: 'default' as const,
    },
    apple: {
      name: 'Apple',
      icon: <AppleOutlined />,
      type: 'default' as const,
    },
  };

  return providerMap[provider] || providerMap.github;
}

/**
 * OAuth Login Button Component
 * OAuth 登录按钮组件
 */
export const OAuthLoginButton: React.FC<OAuthLoginButtonProps> = ({
  provider,
  children,
  loading = false,
  disabled = false,
  onClick,
  size = 'large',
  fullWidth = false,
  ...props
}) => {
  const providerInfo = getProviderInfo(provider);
  const defaultText = `使用 ${providerInfo.name} 登录`;

  // Ant Design Button 只支持 'small' 和 'large'，这里确保只传递有效值
  const validSize = size === 'small' || size === 'large' ? size : 'large';

  return (
    <Button
      type={providerInfo.type}
      size={validSize}
      block={fullWidth}
      disabled={disabled || loading}
      onClick={onClick}
      loading={loading}
      icon={providerInfo.icon}
      {...props}
    >
      {children || defaultText}
    </Button>
  );
};

export default OAuthLoginButton;
