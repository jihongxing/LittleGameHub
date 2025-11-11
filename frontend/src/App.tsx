import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import { Helmet } from 'react-helmet-async'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomePage from '@/pages/HomePage'
import GamesPage from '@/pages/GamesPage'
import GameDetailPage from '@/pages/GameDetailPage'
import FavoritesPage from '@/pages/FavoritesPage'
import DownloadsPage from '@/pages/DownloadsPage'
import ProfilePage from '@/pages/ProfilePage'
import NotFoundPage from '@/pages/NotFoundPage'
import OfflineModeBanner from '@/components/OfflineModeBanner'

const { Content } = Layout

/**
 * 应用主组件
 * 定义应用路由和整体布局
 */
const App: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>GameHub - 游戏聚合平台</title>
        <meta name="description" content="发现、收藏和管理您的游戏世界" />
      </Helmet>
      
      <Layout className="min-h-screen flex flex-col">
        <Header />
        <OfflineModeBanner />
        <Content className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/:id" element={<GameDetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Content>
        <Footer />
      </Layout>
    </>
  )
}

export default App