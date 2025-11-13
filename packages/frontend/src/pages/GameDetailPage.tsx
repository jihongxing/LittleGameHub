import React from 'react'
import { Typography } from 'antd'
import { useParams } from 'react-router-dom'

const GameDetailPage: React.FC = () => {
  const { id } = useParams()
  return (
    <div className="p-6">
      <Typography.Title level={3}>游戏详情</Typography.Title>
      <Typography.Paragraph>游戏ID：{id}</Typography.Paragraph>
    </div>
  )
}

export default GameDetailPage

