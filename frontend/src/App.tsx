import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import OrderPage from './pages/OrderPage';
import MyOrdersPage from './pages/MyOrdersPage';
import DishesPage from './pages/admin/DishesPage';
import MenuPublishPage from './pages/admin/MenuPublishPage';
import OrdersPage from './pages/admin/OrdersPage';
import SummaryPage from './pages/admin/SummaryPage';
import SettingsPage from './pages/admin/SettingsPage';

// 使用 HashRouter 以便在任何静态托管环境下路由都能正常工作
const Router = HashRouter;

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { userId, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center guo-loading">
        請 稍 候 …
      </div>
    );
  }
  if (!userId) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { userId, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center guo-loading">
        請 稍 候 …
      </div>
    );
  }
  if (!userId) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/order" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { userId, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center guo-loading">
        請 稍 候 …
      </div>
    );
  }
  if (!userId) return <Navigate to="/auth" replace />;
  return <Navigate to={isAdmin ? '/admin/dishes' : '/order'} replace />;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/*"
            element={
              <RequireAuth>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Layout>
                        <RootRedirect />
                      </Layout>
                    }
                  />
                  <Route
                    path="/order"
                    element={
                      <Layout>
                        <OrderPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <Layout>
                        <MyOrdersPage />
                      </Layout>
                    }
                  />
                  <Route
                    path="/admin/dishes"
                    element={
                      <RequireAdmin>
                        <Layout>
                          <DishesPage />
                        </Layout>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/menu"
                    element={
                      <RequireAdmin>
                        <Layout>
                          <MenuPublishPage />
                        </Layout>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/orders"
                    element={
                      <RequireAdmin>
                        <Layout>
                          <OrdersPage />
                        </Layout>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/summary"
                    element={
                      <RequireAdmin>
                        <Layout>
                          <SummaryPage />
                        </Layout>
                      </RequireAdmin>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <RequireAdmin>
                        <Layout>
                          <SettingsPage />
                        </Layout>
                      </RequireAdmin>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
