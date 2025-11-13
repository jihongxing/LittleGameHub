import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Checkbox, Card, Typography, message, Divider, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { Helmet } from 'react-helmet-async'
import { OAuthLoginPanel } from '../../components/auth/OAuthLoginPanel'
import { useOAuth } from '../../hooks/useOAuth'
import { OAuthProvider } from '../../components/auth/OAuthLoginButton'

const { Title, Text } = Typography

/**
 * 登录页面
 * TODO: 集成第三方登录功能
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { loginWithOAuth, loading: oauthLoading } = useOAuth()

  const onFinish = async (values: any) => {
    try {
      setLoading(true)
      // TODO: 实现传统登录逻辑
      console.log('登录信息:', values)
      message.success('登录功能开发中，敬请期待！')

      // 暂时跳转到首页
      // navigate('/')
    } catch (error) {
      message.error('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    // 只处理当前支持的提供商
    const supportedProviders: OAuthProvider[] = ['github', 'google', 'wechat', 'qq'];
    if (!supportedProviders.includes(provider)) {
      message.warning(`暂不支持 ${provider} 登录方式`);
      return;
    }
    try {
      await loginWithOAuth(provider)
    } catch (error) {
      message.error('OAuth登录启动失败，请重试')
    }
  }

  const handleTraditionalLogin = () => {
    // 滚动到传统登录表单（如果需要）
    // 目前传统登录表单就在上方，所以不需要额外操作
  }

  return (
    <>
      <Helmet>
        <title>登录 - GameHub</title>
      </Helmet>

      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-lg">
          <div className="text-center mb-8">
            <Title level={2}>欢迎回来</Title>
            <Text type="secondary">登录您的 GameHub 账号</Text>
          </div>

          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            size="large"
            autoComplete="off"
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱地址' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="邮箱地址"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item>
              <div className="flex items-center justify-between">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>记住我</Checkbox>
                </Form.Item>
                <Link to="/forgot-password" className="text-blue-500 hover:text-blue-600">
                  忘记密码？
                </Link>
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                登录
              </Button>
            </Form.Item>

            <div className="text-center">
              <Text type="secondary">
                还没有账号？{' '}
                <Link to="/register" className="text-blue-500 hover:text-blue-600 font-medium">
                  立即注册
                </Link>
              </Text>
            </div>
          </Form>

          <OAuthLoginPanel
            providers={['github', 'google', 'wechat']}
            onLogin={handleOAuthLogin}
            onTraditionalLogin={handleTraditionalLogin}
            loading={oauthLoading}
          />

          <div className="mt-6 text-center">
            <Text type="secondary" className="text-xs">
              登录即表示您同意我们的
              <Link to="/terms" className="text-blue-500 hover:text-blue-600 mx-1">
                服务条款
              </Link>
              和
              <Link to="/privacy" className="text-blue-500 hover:text-blue-600 mx-1">
                隐私政策
              </Link>
            </Text>
          </div>
        </Card>
      </div>
    </>
  )
}

export default LoginPage

