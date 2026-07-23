import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp, signIn } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const validatePhone = (v: string) => /^\d{5,15}$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setHint('');

    if (!validatePhone(phone)) {
      setError('手机号格式不正确（5-15 位数字）');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        if (!username.trim()) {
          setError('请输入用户名');
          setLoading(false);
          return;
        }
        if (!department.trim()) {
          setError('请输入所属部门');
          setLoading(false);
          return;
        }
        await signUp(username.trim(), phone, department.trim(), password);
        setHint('注册成功！首位注册用户将自动成为管理员。正在登录…');
        // 自动登录
        await signIn(phone, password);
        await refresh();
        navigate('/');
      } else {
        await signIn(phone, password);
        await refresh();
        navigate('/');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Invalid login credentials')) {
        setError('手机号或密码错误');
      } else if (msg.includes('already registered')) {
        setError('该手机号已注册，请直接登录');
      } else if (msg.includes('User already registered')) {
        setError('该手机号已注册，请直接登录');
      } else {
        setError(msg.length > 100 ? '操作失败，请稍后重试' : msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-red-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
            餐
          </div>
          <h1 className="text-2xl font-bold text-gray-900">企业订餐系统</h1>
          <p className="text-sm text-gray-500 mt-1">
            手机号登录 · 方便快捷
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border">
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => {
                setMode('login');
                setError('');
                setHint('');
              }}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm font-medium'
                  : 'text-gray-600'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
                setHint('');
              }}
              className={`flex-1 py-2 text-sm rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-white text-gray-900 shadow-sm font-medium'
                  : 'text-gray-600'
              }`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    用户名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    所属部门 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="如：技术部 / 市场部"
                    className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                    maxLength={30}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="请输入手机号"
                className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                maxLength={15}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                密码 <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '至少 6 位' : '请输入密码'}
                className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}
            {hint && (
              <div className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                {hint}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 disabled:opacity-50 transition-all"
            >
              {loading ? '处理中…' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>

          {mode === 'register' && (
            <p className="text-xs text-gray-500 mt-4 text-center">
              首位注册的用户将自动成为管理员
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
