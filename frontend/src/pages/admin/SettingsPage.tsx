import { useEffect, useState } from 'react';
import { getConfig, updateConfig } from '../../lib/api';

export default function SettingsPage() {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:30');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const cfg = await getConfig();
        setStartTime(cfg.order_start_time || '08:00');
        setEndTime(cfg.order_end_time || '10:30');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      setError('时间格式不正确，应为 HH:MM');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await updateConfig('order_start_time', startTime);
      await updateConfig('order_end_time', endTime);
      setMessage('已保存，立即生效');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 guo-loading">
        請 稍 候 …
      </div>
    );
  }

  return (
    <div>
      {/* 标题 */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl guo-title" style={{ letterSpacing: '0.3em' }}>
          系 · 統 · 配 · 置
        </h2>
        <div className="guo-pattern-divider my-3">❖ ❖ ❖</div>
      </div>

      {error && (
        <div className="mb-4 guo-error px-4 py-3 text-sm" style={{ letterSpacing: '0.05em' }}>
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 guo-success px-4 py-3 text-sm" style={{ letterSpacing: '0.05em' }}>
          {message}
        </div>
      )}

      {/* 订餐时间窗 */}
      <div className="guo-card p-5 relative" style={{ borderRadius: 2 }}>
        <div className="mb-4 pb-3" style={{ borderBottom: '1px dashed rgba(107, 68, 35, 0.3)' }}>
          <h3 className="guo-title text-lg mb-2" style={{ letterSpacing: '0.2em' }}>
            訂 · 餐 · 時 · 辰
          </h3>
          <p className="text-sm" style={{
            color: 'var(--color-ink-light)',
            letterSpacing: '0.08em',
          }}>
            僅在此時間段內，用戶可提交訂單。修改後立即對所有用戶生效。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2" style={{
              color: 'var(--color-ink-light)',
              letterSpacing: '0.1em',
            }}>
              開 · 始 · 時 · 辰
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="guo-input w-full px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{
              color: 'var(--color-ink-light)',
              letterSpacing: '0.1em',
            }}>
              截 · 止 · 時 · 辰
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="guo-input w-full px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end" style={{ borderTop: '1px dashed rgba(107, 68, 35, 0.3)', paddingTop: '1rem' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="guo-btn-primary px-6 py-2"
            style={{ letterSpacing: '0.2em' }}
          >
            {saving ? '保 · 存 · 中 …' : '保 · 存 · 配 · 置'}
          </button>
        </div>
      </div>

      {/* 规则说明 */}
      <div className="guo-card p-5 mt-4 relative" style={{ borderRadius: 2 }}>
        <div className="mb-4 pb-3" style={{ borderBottom: '1px dashed rgba(107, 68, 35, 0.3)' }}>
          <h3 className="guo-title text-lg" style={{ letterSpacing: '0.2em' }}>
            規 · 則 · 說 · 明
          </h3>
        </div>
        <ul className="space-y-3 text-sm" style={{
          color: 'var(--color-ink)',
          letterSpacing: '0.08em',
        }}>
          {[
            '同一用户每日仅允许提交一次订单',
            '订单状态流转：已呈 → 已准 → 已毕',
            '已撤订单仅管理员有权操作',
            '菜品库中被历史订单引用的菜品不会物理删除，仅可禁用',
            '下单时价格会快照到订单中，后续修改菜品库价格不影响历史订单',
          ].map((rule, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5" style={{ color: 'var(--color-golden-dark)' }}>◈</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
