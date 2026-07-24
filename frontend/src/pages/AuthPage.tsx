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
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-8 relative"
      style={{ backgroundColor: 'var(--color-paper)' }}
    >
      {/* 装饰：四角纹饰 */}
      <div className="absolute top-6 left-6 text-2xl" style={{ color: 'rgba(196, 154, 108, 0.4)' }}>❋</div>
      <div className="absolute top-6 right-6 text-2xl" style={{ color: 'rgba(196, 154, 108, 0.4)' }}>❋</div>
      <div className="absolute bottom-6 left-6 text-2xl" style={{ color: 'rgba(196, 154, 108, 0.4)' }}>❋</div>
      <div className="absolute bottom-6 right-6 text-2xl" style={{ color: 'rgba(196, 154, 108, 0.4)' }}>❋</div>

      <div className="w-full max-w-md relative">
        {/* 顶部印章标题 */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 relative">
            <div
              className="guo-seal w-20 h-20 text-4xl"
              style={{ fontSize: '2.5rem', borderRadius: 4 }}
            >
              膳
            </div>
          </div>
          <h1 className="text-3xl guo-title mb-2" style={{ letterSpacing: '0.3em' }}>
            企業訂餐
          </h1>
          <div className="guo-pattern-divider mb-2">❖ ❖ ❖</div>
          <p className="text-xs" style={{
            color: 'var(--color-sandalwood)',
            letterSpacing: '0.25em',
          }}>
            壹日壹膳 · 以食為天
          </p>
        </div>

        {/* 主卡片 */}
        <div className="guo-card p-6 sm:p-8" style={{ borderRadius: 2 }}>
          {/* 登录/注册切换 */}
          <div
            className="flex mb-6 relative"
            style={{
              border: '1px solid var(--color-sandalwood)',
              backgroundColor: 'rgba(232, 220, 196, 0.3)',
            }}
          >
            <button
              onClick={() => {
                setMode('login');
                setError('');
                setHint('');
              }}
              className="flex-1 py-2.5 text-sm transition-colors relative"
              style={{
                letterSpacing: '0.2em',
                color: mode === 'login' ? 'var(--color-paper)' : 'var(--color-ink-light)',
                backgroundColor: mode === 'login' ? 'var(--color-vermilion)' : 'transparent',
                fontWeight: mode === 'login' ? 600 : 400,
              }}
            >
              登 · 錄
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
                setHint('');
              }}
              className="flex-1 py-2.5 text-sm transition-colors relative"
              style={{
                letterSpacing: '0.2em',
                color: mode === 'register' ? 'var(--color-paper)' : 'var(--color-ink-light)',
                backgroundColor: mode === 'register' ? 'var(--color-vermilion)' : 'transparent',
                fontWeight: mode === 'register' ? 600 : 400,
              }}
            >
              注 · 冊
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm mb-2" style={{
                    color: 'var(--color-ink-light)',
                    letterSpacing: '0.1em',
                  }}>
                    姓 名 <span style={{ color: 'var(--color-vermilion)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入姓名"
                    className="guo-input w-full px-3 py-2.5"
                    maxLength={30}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{
                    color: 'var(--color-ink-light)',
                    letterSpacing: '0.1em',
                  }}>
                    部 · 門 <span style={{ color: 'var(--color-vermilion)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="如：技术部 / 市场部"
                    className="guo-input w-full px-3 py-2.5"
                    maxLength={30}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm mb-2" style={{
                color: 'var(--color-ink-light)',
                letterSpacing: '0.1em',
              }}>
                手機號 <span style={{ color: 'var(--color-vermilion)' }}>*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="请输入手机号"
                className="guo-input w-full px-3 py-2.5"
                maxLength={15}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{
                color: 'var(--color-ink-light)',
                letterSpacing: '0.1em',
              }}>
                密 · 碼 <span style={{ color: 'var(--color-vermilion)' }}>*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? '至少 6 位' : '请输入密码'}
                className="guo-input w-full px-3 py-2.5"
                required
              />
            </div>

            {error && (
              <div className="guo-error px-3 py-2 text-sm" style={{ letterSpacing: '0.05em' }}>
                {error}
              </div>
            )}
            {hint && (
              <div className="guo-success px-3 py-2 text-sm" style={{ letterSpacing: '0.05em' }}>
                {hint}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="guo-btn-primary w-full py-2.5 mt-2"
              style={{ letterSpacing: '0.3em' }}
            >
              {loading ? '請 稍 候 …' : mode === 'login' ? '登 · 錄' : '註 · 冊'}
            </button>
          </form>

          {mode === 'register' && (
            <p className="text-xs mt-4 text-center" style={{
              color: 'var(--color-sandalwood)',
              letterSpacing: '0.15em',
            }}>
              首位註冊者將自動成為管理員
            </p>
          )}
        </div>

        {/* 底部装饰 */}
        <div className="guo-pattern-divider mt-6" style={{ opacity: 0.6 }}>
          — ❖ —
        </div>
      </div>
    </div>
  );
}
