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
      <div className="flex items-center justify-center py-20 text-gray-500">
        加载中…
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">系统配置</h2>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg border p-5">
        <h3 className="font-medium text-gray-900 mb-4">订餐时间窗</h3>
        <p className="text-sm text-gray-500 mb-4">
          仅在此时间段内，用户可提交订单。修改后立即对所有用户生效。
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              开始时间
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              截止时间
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? '保存中…' : '保存配置'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-5 mt-4">
        <h3 className="font-medium text-gray-900 mb-3">规则说明</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• 同一用户每天仅允许提交一次订单</li>
          <li>• 订单状态流转：已提交 → 已确认 → 已完成</li>
          <li>• 已取消订单仅管理员有权操作</li>
          <li>• 菜品库中被历史订单引用的菜品不会物理删除，仅可禁用</li>
          <li>• 下单时价格会快照到订单中，后续修改菜品库价格不影响历史订单</li>
        </ul>
      </div>
    </div>
  );
}
