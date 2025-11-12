import React from 'react'
import { Menu } from 'antd'
import { Link, useLocation } from 'react-router-dom'

const Navigation: React.FC = () => {
  const location = useLocation()
  const selected = [location.pathname]
  return (
    <Menu theme="dark" mode="horizontal" selectedKeys={selected}>
      <Menu.Item key="/">
        <Link to="/">首页</Link>
      </Menu.Item>
      <Menu.Item key="/games">
        <Link to="/games">游戏</Link>
      </Menu.Item>
      <Menu.Item key="/favorites">
        <Link to="/favorites">收藏</Link>
      </Menu.Item>
      <Menu.Item key="/downloads">
        <Link to="/downloads">下载</Link>
      </Menu.Item>
      <Menu.Item key="/profile">
        <Link to="/profile">我的</Link>
      </Menu.Item>
    </Menu>
  )
}

export default Navigation

