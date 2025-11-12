/**
 * Header Component
 * Task: T031
 * 
 * Top navigation bar with user menu and authentication
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, useAuthActions } from '../../store/authStore';

const Header: React.FC = () => {
  const user = useUser();
  const { logout } = useAuthActions();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-xl font-bold text-gray-900">GameHub</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/games" className="text-gray-700 hover:text-primary-500 transition">
              游戏
            </Link>
            <Link to="/points" className="text-gray-700 hover:text-primary-500 transition">
              积分
            </Link>
            <Link to="/membership" className="text-gray-700 hover:text-primary-500 transition">
              会员
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Membership Badge (T115) */}
                {(user as any).membership_tier && (user as any).membership_tier !== 'free' && (
                  <Link
                    to="/membership"
                    className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-medium hover:shadow-lg transition"
                    data-testid="membership-badge"
                  >
                    <span>👑</span>
                    <span>{((user as any).membership_tier as string).toUpperCase()}</span>
                  </Link>
                )}

                {/* Points Display */}
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-yellow-500">🪙</span>
                  <span className="font-semibold">{user.point_balance}</span>
                </div>

                {/* User Avatar & Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2">
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.nickname}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="hidden md:inline text-sm font-medium">{user.nickname}</span>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      个人中心
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      设置
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-500"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
