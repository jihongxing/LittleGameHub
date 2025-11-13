/**
 * OAuth Callback Page Component
 * OAuth 回调页面组件
 *
 * Handles OAuth provider callbacks and completes authentication
 * 处理OAuth提供商回调并完成认证
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Spin, Alert, Button, Space } from 'antd';
import { OAuthProvider } from '../../components/auth/OAuthLoginButton';
import { useOAuth } from '../../hooks/useOAuth';

const { Title, Text } = Typography;

/**
 * OAuth Callback Page Component
 * OAuth 回调页面组件
 */
const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleOAuthCallback, loading, error } = useOAuth();
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    const processCallback = async () => {
      if (processed) return;

      try {
        // 从URL参数中获取OAuth信息
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const provider = searchParams.get('provider') as OAuthProvider;
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // 检查是否有错误
        if (error) {
          throw new Error(errorDescription || `OAuth ${provider} 认证失败: ${error}`);
        }

        // 验证必需参数
        if (!code || !state || !provider) {
          throw new Error('OAuth回调参数不完整');
        }

        // 处理OAuth回调
        await handleOAuthCallback(code, state, provider);
        setProcessed(true);

        // 成功后会自动重定向，由useOAuth处理

      } catch (err) {
        console.error('OAuth callback processing failed:', err);
        setProcessed(true);
        // 错误已在useOAuth中处理
      }
    };

    processCallback();
  }, [searchParams, handleOAuthCallback, processed]);

  const handleRetry = () => {
    navigate('/login');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f2f5',
        padding: 16,
      }}
    >
      <Card
        style={{
          padding: 32,
          maxWidth: 400,
          width: '100%',
          textAlign: 'center',
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {loading ? (
          // 正在处理状态
          <>
            <Spin size="large" style={{ marginBottom: 16 }} />
            <Title level={4} style={{ marginBottom: 8 }}>
              正在完成登录...
            </Title>
            <Text type="secondary">
              请稍候，我们正在验证您的身份信息
            </Text>
          </>
        ) : error ? (
          // 错误状态
          <>
            <Alert
              message="登录失败"
              description={error}
              type="error"
              showIcon
              style={{ marginBottom: 24, textAlign: 'left' }}
            />

            <Space>
              <Button type="primary" onClick={handleRetry} size="small">
                重新登录
              </Button>
              <Button onClick={handleGoHome} size="small">
                返回首页
              </Button>
            </Space>
          </>
        ) : (
          // 成功状态（通常不会显示，因为会重定向）
          <>
            <Title level={4} style={{ color: '#52c41a', marginBottom: 8 }}>
              ✅ 登录成功！
            </Title>
            <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
              正在跳转到首页...
            </Text>
            <Button type="primary" onClick={handleGoHome} size="small">
              前往首页
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default OAuthCallbackPage;
