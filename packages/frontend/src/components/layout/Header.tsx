/**
 * Header Component
 * Task: T031
 * 
 * Top navigation bar with user menu and authentication
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import UserAvatar from '../common/UserAvatar';

const Header: React.FC = () => {
  const { user } = useAuthStore();

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
            <Link to="/aggregated-games" className="text-gray-700 hover:text-primary-500 transition flex items-center space-x-1">
              <span>🎮</span>
              <span>聚合游戏库</span>
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
            <UserAvatar />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
