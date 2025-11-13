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
import LoginPage from '@/pages/LoginPage'
import TestAuthPage from '@/pages/TestAuthPage'
import TestGamePlayPage from '@/pages/TestGamePlayPage'
import TestPointsPage from '@/pages/TestPointsPage'
import OAuthCallbackPage from '@/pages/Auth/OAuthCallbackPage'
import NotFoundPage from '@/pages/NotFoundPage'
import OfflineModeBanner from '@/components/OfflineModeBanner'
import AggregatedGamesPage from '@/pages/AggregatedGamesPage'
import AggregatedGameDetailPage from '@/pages/AggregatedGameDetailPage'

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
            {/* 首页 */}
            <Route path="/" element={<HomePage />} />
            
            {/* 认证相关 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/test-auth" element={<TestAuthPage />} />
            <Route path="/test-game-play" element={<TestGamePlayPage />} />
            <Route path="/test-points" element={<TestPointsPage />} />
            <Route path="/auth/oauth/callback" element={<OAuthCallbackPage />} />
            
            {/* 游戏相关 */}
            <Route path="/games" element={<GameList />} />
            <Route path="/games/:id" element={<GameDetail />} />
            <Route path="/games/:id/play" element={<GamePlayer />} />
            
            {/* 聚合游戏 */}
            <Route path="/aggregated-games" element={<AggregatedGamesPage />} />
            <Route path="/aggregated-games/:gameId" element={<AggregatedGameDetailPage />} />
            
            {/* 用户相关 */}
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/offline" element={<OfflineGamesPage />} />
            <Route path="/downloads" element={<DownloadsPage />} />
            <Route path="/points" element={<PointsPage />} />
            <Route path="/social" element={<SocialPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            {/* 404 */}
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
