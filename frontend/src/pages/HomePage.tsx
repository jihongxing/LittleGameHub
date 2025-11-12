import React from 'react'
import { Typography } from 'antd'

const HomePage: React.FC = () => {
  return (
    <div className="p-6">
      <Typography.Title level={3}>欢迎来到 GameHub</Typography.Title>
      <Typography.Paragraph>在这里发现、收藏和管理您的小游戏。</Typography.Paragraph>
    </div>
  )
}

export default HomePage

