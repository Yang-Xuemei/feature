import { useEffect, useState } from 'react';
import { listDishes, createDish, updateDish } from '../../lib/api';
import type { Dish, DishCategory, DishStatus } from '../../types';
import Modal from '../../components/Modal';

const EMPTY: Partial<Dish> = {
  name: '',
  price: 0,
  unit: '份',
  description: '',
  image_url: '',
  category: '单品',
  status: 'enabled',
};

export default function DishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<Dish>>(EMPTY);
  const [filter, setFilter] = useState<'all' | DishCategory | DishStatus>('all');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await listDishes();
      setDishes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing({ ...EMPTY });
    setShowForm(true);
  };

  const openEdit = (d: Dish) => {
    setEditing({ ...d });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editing.name?.trim()) {
      setError('菜品名称不能为空');
      return;
    }
    if (!editing.price || editing.price <= 0) {
      setError('单价必须大于 0');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editing.id) {
        await updateDish(editing.id, editing);
      } else {
        await createDish(editing);
      }
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (d: Dish) => {
    try {
      await updateDish(d.id, {
        status: d.status === 'enabled' ? 'disabled' : 'enabled',
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const filtered = dishes.filter((d) => {
    if (filter === 'all') return true;
    if (filter === 'enabled' || filter === 'disabled') return d.status === filter;
    return d.category === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        加载中…
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">菜品库</h2>
        <button
          onClick={openNew}
          className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
        >
          + 新增菜品
        </button>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { key: 'all', label: '全部' },
          { key: 'enabled', label: '启用中' },
          { key: 'disabled', label: '已禁用' },
          { key: '套餐', label: '套餐' },
          { key: '单品', label: '单品' },
          { key: '饮品', label: '饮品' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
              filter === f.key
                ? 'bg-gray-900 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center text-gray-500 text-sm">
          暂无菜品
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((d) => (
            <div key={d.id} className="bg-white rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                {d.image_url ? (
                  <img
                    src={d.image_url}
                    alt={d.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0 bg-gray-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-2xl shrink-0">
                    {d.category === '饮品' ? '🥤' : d.category === '套餐' ? '🍱' : '🍽️'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900 truncate">
                      {d.name}
                    </h3>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {d.category}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        d.status === 'enabled'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {d.status === 'enabled' ? '启用' : '禁用'}
                    </span>
                  </div>
                  {d.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {d.description}
                    </p>
                  )}
                  <div className="text-orange-600 font-semibold mt-2">
                    ¥{Number(d.price).toFixed(2)}
                    <span className="text-xs text-gray-400 font-normal">
                      {' '}
                      / {d.unit}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(d)}
                    className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleToggleStatus(d)}
                    className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-50 rounded"
                  >
                    {d.status === 'enabled' ? '禁用' : '启用'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing.id ? '编辑菜品' : '新增菜品'}
        footer={
          <>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-gray-600"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              maxLength={50}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                单价 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editing.price}
                onChange={(e) =>
                  setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">单位</label>
              <input
                type="text"
                value={editing.unit}
                onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="份 / 杯 / 碗"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">分类</label>
            <select
              value={editing.category}
              onChange={(e) =>
                setEditing({ ...editing, category: e.target.value as DishCategory })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="套餐">套餐</option>
              <option value="单品">单品</option>
              <option value="饮品">饮品</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">描述</label>
            <textarea
              value={editing.description ?? ''}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              图片 URL（可选）
            </label>
            <input
              type="text"
              value={editing.image_url ?? ''}
              onChange={(e) =>
                setEditing({ ...editing, image_url: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="https://..."
            />
          </div>
          {editing.id && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">状态</label>
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as DishStatus })
                }
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="enabled">启用</option>
                <option value="disabled">禁用</option>
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
