import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut } from '../lib/api';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, isAdmin, refresh } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    await refresh();
    navigate('/auth');
  };

  const userLinks = [
    { path: '/order', label: '今日订餐' },
    { path: '/orders', label: '我的订单' },
  ];

  const adminLinks = [
    { path: '/admin/dishes', label: '菜品库' },
    { path: '/admin/menu', label: '每日菜单' },
    { path: '/admin/orders', label: '订单管理' },
    { path: '/admin/summary', label: '当日汇总' },
    { path: '/admin/settings', label: '系统配置' },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold">
              餐
            </div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900">
              企业订餐
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">
              {profile?.username} · {profile?.department}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              {isAdmin ? '管理员' : '员工'}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm text-gray-500 hover:text-red-600"
            >
              退出
            </button>
          </div>
        </div>
        <nav className="border-t overflow-x-auto">
          <div className="max-w-5xl mx-auto px-2 sm:px-4 flex gap-1">
            {links.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-2 text-xs sm:text-sm whitespace-nowrap border-b-2 transition-colors ${
                    active
                      ? 'border-orange-500 text-orange-600 font-medium'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
