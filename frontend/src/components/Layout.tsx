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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      {/* 顶部装饰纹线 */}
      <div className="h-1" style={{
        background: 'linear-gradient(90deg, transparent 0%, var(--color-vermilion) 20%, var(--color-golden) 50%, var(--color-vermilion) 80%, transparent 100%)',
      }} />

      <header className="sticky top-0 z-40" style={{
        backgroundColor: 'rgba(245, 239, 230, 0.96)',
        borderBottom: '1px solid var(--color-sandalwood)',
        backdropFilter: 'blur(4px)',
      }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="guo-seal w-9 h-9 text-sm">
              膳
            </div>
            <div>
              <h1 className="text-base sm:text-lg guo-title" style={{ letterSpacing: '0.15em' }}>
                企業 · 訂餐
              </h1>
              <p className="text-[10px] hidden sm:block" style={{
                color: 'var(--color-sandalwood)',
                letterSpacing: '0.2em',
              }}>
                壹日壹膳 · 以食為天
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm hidden sm:block" style={{ color: 'var(--color-ink-light)' }}>
              {profile?.username} · {profile?.department}
            </span>
            <span
              className="text-xs px-2 py-0.5"
              style={{
                color: isAdmin ? 'var(--color-vermilion)' : 'var(--color-sandalwood)',
                border: `1px solid ${isAdmin ? 'var(--color-vermilion)' : 'var(--color-sandalwood)'}`,
                letterSpacing: '0.1em',
              }}
            >
              {isAdmin ? '掌膳' : '食客'}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm guo-link"
              style={{ letterSpacing: '0.1em' }}
            >
              退 · 出
            </button>
          </div>
        </div>

        <nav style={{ borderTop: '1px dashed rgba(107, 68, 35, 0.3)' }}>
          <div className="max-w-5xl mx-auto px-2 sm:px-4 flex gap-1 overflow-x-auto">
            {links.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`guo-tab ${active ? 'guo-tab-active' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-5 sm:py-7 relative">
        {children}
      </main>

      {/* 底部装饰 */}
      <footer className="py-6 mt-8" style={{ borderTop: '1px dashed rgba(107, 68, 35, 0.3)' }}>
        <div className="guo-pattern-divider mb-2">❖ ❖ ❖</div>
        <p className="text-center text-xs" style={{
          color: 'var(--color-sandalwood)',
          letterSpacing: '0.2em',
        }}>
          食 不 厭 精 · 膾 不 厭 細
        </p>
      </footer>
    </div>
  );
}
