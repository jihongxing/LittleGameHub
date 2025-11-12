import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import { Helmet } from 'react-helmet-async'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ErrorBoundary from '@/components/common/ErrorBoundary'
import HomePage from '@/pages/HomePage'
import GameList from '@/pages/Home/GameList'
import GameDetail from '@/pages/Game/GameDetail'
import GamePlayer from '@/components/business/GamePlayer'
import PointsPage from '@/pages/Points/PointsPage'
import SocialPage from '@/pages/Social/SocialPage'
import CollectionsPage from '@/pages/Collections/CollectionsPage'
import OfflineGamesPage from '@/pages/Offline/OfflineGamesPage'
import AchievementsPage from '@/pages/Profile/AchievementsPage'
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
          <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/games" element={<GameList />} />
            <Route path="/games/:id" element={<GameDetail />} />
            <Route path="/games/:id/play" element={<GamePlayer />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/offline" element={<OfflineGamesPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/points" element={<PointsPage />} />
            <Route path="/social" element={<SocialPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </ErrorBoundary>
        </Content>
        <Footer />
      </Layout>
    </>
  )
}

export default App
