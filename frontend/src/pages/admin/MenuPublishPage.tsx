import { useEffect, useState } from 'react';
import {
  listDishes,
  getMenuByDate,
  getMenuItems,
  publishMenu,
} from '../../lib/api';
import type { Dish, DailyMenuItem } from '../../types';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function MenuPublishPage() {
  const [date, setDate] = useState(todayStr());
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [existing, setExisting] = useState<DailyMenuItem[]>([]);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const loadDishes = async () => {
    const data = await listDishes();
    setDishes(data.filter((d) => d.status === 'enabled'));
  };

  const loadMenu = async (d: string) => {
    setLoading(true);
    setError('');
    try {
      const menu = await getMenuByDate(d);
      if (menu && menu.published_at) {
        setPublished(true);
        const items = await getMenuItems(menu.id);
        setExisting(items);
        setSelected(new Set(items.map((it) => it.dish_id)));
      } else {
        setPublished(false);
        setExisting([]);
        setSelected(new Set());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadDishes();
      await loadMenu(date);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handlePublish = async () => {
    if (selected.size === 0) {
      setError('请至少选择一个菜品');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await publishMenu(date, Array.from(selected));
      setMessage(published ? '菜单已更新' : '菜单已发布');
      await loadMenu(date);
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const enabledDishes = dishes;
  const filteredDishes = enabledDishes.filter((d) => {
    if (filter === 'all') return true;
    return d.category === filter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-900">每日菜单发布</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-sm"
        />
      </div>

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

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          加载中…
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border p-3 mb-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">
                已选{' '}
                <span className="font-semibold text-orange-600">
                  {selected.size}
                </span>{' '}
                道菜品
              </span>
              {published && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                  已发布
                </span>
              )}
            </div>
            <button
              onClick={handlePublish}
              disabled={saving || selected.size === 0}
              className="px-4 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50"
            >
              {saving
                ? '发布中…'
                : published
                ? '更新菜单'
                : '发布菜单'}
            </button>
          </div>

          <div className="flex gap-2 mb-3 overflow-x-auto">
            {['all', '套餐', '单品', '饮品'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                  filter === f
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border text-gray-600'
                }`}
              >
                {f === 'all' ? '全部' : f}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredDishes.map((d) => {
              const isSel = selected.has(d.id);
              const existingItem = existing.find((it) => it.dish_id === d.id);
              return (
                <div
                  key={d.id}
                  onClick={() => toggle(d.id)}
                  className={`bg-white rounded-lg border p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSel
                      ? 'border-orange-400 bg-orange-50/30'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                      isSel
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {isSel && '✓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {d.name}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {d.category}
                      </span>
                      {existingItem && (
                        <span className="text-xs text-gray-400">
                          (当前 ¥{existingItem.price_snapshot.toFixed(2)})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-orange-600 mt-0.5">
                      ¥{d.price.toFixed(2)} / {d.unit}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDishes.length === 0 && (
            <div className="bg-white rounded-lg border p-12 text-center text-gray-500 text-sm">
              暂无启用中的菜品，请先在"菜品库"中添加
            </div>
          )}
        </>
      )}
    </div>
  );
}
