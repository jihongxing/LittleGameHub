import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Checkbox, Card, Typography, message, Divider, Space } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, GithubOutlined, GoogleOutlined, WechatOutlined } from '@ant-design/icons'
import { Helmet } from 'react-helmet-async'

const { Title, Text } = Typography

/**
 * 注册页面
 * TODO: 集成第三方登录/注册功能
 */
const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: any) => {
    try {
      setLoading(true)
      // TODO: 实现注册逻辑
      console.log('注册信息:', values)
      message.success('注册功能开发中，敬请期待！')
      
      // 暂时跳转到登录页
      // navigate('/login')
    } catch (error) {
      message.error('注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleThirdPartyRegister = (provider: string) => {
    // TODO: 实现第三方注册
    message.info(`${provider} 注册功能开发中，敬请期待！`)
  }

  return (
    <>
      <Helmet>
        <title>注册 - GameHub</title>
      </Helmet>

      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md shadow-lg">
          <div className="text-center mb-8">
            <Title level={2}>创建账号</Title>
            <Text type="secondary">加入 GameHub 开始游戏之旅</Text>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            size="large"
            autoComplete="off"
            scrollToFirstError
          >
            <Form.Item
              name="nickname"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, max: 20, message: '用户名长度为 2-20 个字符' },
                { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '用户名只能包含字母、数字、下划线和中文' }
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
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
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="邮箱地址"
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="手机号码（可选）"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度至少为 6 位' },
                { 
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, 
                  message: '密码必须包含大小写字母和数字' 
                }
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="密码"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="确认密码"
              />
            </Form.Item>

            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value ? Promise.resolve() : Promise.reject(new Error('请阅读并同意服务条款和隐私政策')),
                },
              ]}
            >
              <Checkbox>
                我已阅读并同意
                <Link to="/terms" className="text-blue-500 hover:text-blue-600 mx-1">
                  服务条款
                </Link>
                和
                <Link to="/privacy" className="text-blue-500 hover:text-blue-600 mx-1">
                  隐私政策
                </Link>
              </Checkbox>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                注册
              </Button>
            </Form.Item>

            <div className="text-center">
              <Text type="secondary">
                已有账号？{' '}
                <Link to="/login" className="text-blue-500 hover:text-blue-600 font-medium">
                  立即登录
                </Link>
              </Text>
            </div>
          </Form>

          <Divider plain>
            <Text type="secondary">或使用第三方注册</Text>
          </Divider>

          <Space direction="vertical" size="middle" className="w-full">
            <Button
              icon={<WechatOutlined />}
              block
              size="large"
              onClick={() => handleThirdPartyRegister('微信')}
            >
              微信注册
            </Button>
            <Button
              icon={<GithubOutlined />}
              block
              size="large"
              onClick={() => handleThirdPartyRegister('GitHub')}
            >
              GitHub 注册
            </Button>
            <Button
              icon={<GoogleOutlined />}
              block
              size="large"
              onClick={() => handleThirdPartyRegister('Google')}
            >
              Google 注册
            </Button>
          </Space>
        </Card>
      </div>
    </>
  )
}

export default RegisterPage

