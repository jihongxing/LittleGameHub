/**
 * Footer Component
 * Task: T031
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-semibold mb-4">关于 GameHub</h3>
            <p className="text-sm">
              GameHub 是一个汇聚优质小游戏的平台，让您随时随地享受游戏乐趣。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">快速链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/games" className="hover:text-white transition">
                  游戏大厅
                </Link>
              </li>
              <li>
                <Link to="/membership" className="hover:text-white transition">
                  会员中心
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-white transition">
                  帮助中心
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">支持</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-white transition">
                  隐私政策
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition">
                  服务条款
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition">
                  联系我们
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">关注我们</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-white transition">
                微信
              </a>
              <a href="#" className="hover:text-white transition">
                微博
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
          <p>&copy; 2025 GameHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
