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

function categoryChar(c: string | undefined) {
  if (c === '飲品') return '飲';
  if (c === '套餐') return '膳';
  return '肴';
}

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

  const filters: { key: string; label: string }[] = [
    { key: 'all', label: '全 · 部' },
    { key: 'enabled', label: '啟用中' },
    { key: 'disabled', label: '已禁用' },
    { key: '套餐', label: '套 · 餐' },
    { key: '单品', label: '單 · 品' },
    { key: '饮品', label: '飲 · 品' },
  ];

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
          菜 · 品 · 庫
        </h2>
        <div className="guo-pattern-divider my-3">❖ ❖ ❖</div>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className="px-3 py-1.5 text-sm whitespace-nowrap transition-all"
              style={{
                letterSpacing: '0.1em',
                border: filter === f.key ? '1px solid var(--color-vermilion)' : '1px solid var(--color-sandalwood)',
                backgroundColor: filter === f.key ? 'var(--color-vermilion)' : 'rgba(245, 239, 230, 0.6)',
                color: filter === f.key ? 'var(--color-paper)' : 'var(--color-ink-light)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={openNew}
          className="guo-btn-primary px-4 py-1.5 text-sm"
          style={{ letterSpacing: '0.15em' }}
        >
          + 新增菜品
        </button>
      </div>

      {error && (
        <div className="mb-4 guo-error px-4 py-3 text-sm" style={{ letterSpacing: '0.05em' }}>
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="guo-card p-12 text-center" style={{
          color: 'var(--color-sandalwood)',
          letterSpacing: '0.15em',
          borderRadius: 2,
        }}>
          暫 · 無 · 菜 · 品
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((d) => (
            <div key={d.id} className="guo-card p-4 relative" style={{ borderRadius: 2 }}>
              <div className="flex items-start justify-between gap-2">
                {d.image_url ? (
                  <div className="guo-image-frame shrink-0 overflow-hidden" style={{ width: 64, height: 64 }}>
                    <img
                      src={d.image_url}
                      alt={d.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div
                    className="guo-seal shrink-0"
                    style={{
                      width: 64,
                      height: 64,
                      fontSize: '1.75rem',
                      borderRadius: 2,
                      transform: 'none',
                    }}
                  >
                    {categoryChar(d.category)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold guo-title truncate" style={{ letterSpacing: '0.1em' }}>
                      {d.name}
                    </h3>
                    <span className="guo-tag" style={{
                      color: 'var(--color-sandalwood)',
                      borderColor: 'rgba(107, 68, 35, 0.4)',
                    }}>
                      {d.category}
                    </span>
                    <span
                      className="guo-tag"
                      style={{
                        color: d.status === 'enabled' ? 'var(--color-celadon-dark)' : 'var(--color-sandalwood)',
                        borderColor: d.status === 'enabled' ? 'var(--color-celadon-dark)' : 'rgba(107, 68, 35, 0.4)',
                        opacity: d.status === 'enabled' ? 1 : 0.7,
                      }}
                    >
                      {d.status === 'enabled' ? '啟用' : '禁用'}
                    </span>
                  </div>
                  {d.description && (
                    <p className="text-xs line-clamp-2 mb-2" style={{
                      color: 'var(--color-ink-light)',
                      letterSpacing: '0.05em',
                    }}>
                      {d.description}
                    </p>
                  )}
                  <div className="flex items-baseline gap-1">
                    <span className="guo-price">
                      ¥{Number(d.price).toFixed(2)}
                    </span>
                    <span className="text-xs" style={{
                      color: 'var(--color-sandalwood)',
                      letterSpacing: '0.1em',
                    }}>
                      / {d.unit}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => openEdit(d)}
                    className="text-xs px-2 py-1 transition-colors"
                    style={{
                      color: 'var(--color-indigo)',
                      border: '1px solid var(--color-indigo)',
                      letterSpacing: '0.1em',
                      backgroundColor: 'rgba(22, 66, 91, 0.05)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(22, 66, 91, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(22, 66, 91, 0.05)';
                    }}
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleToggleStatus(d)}
                    className="text-xs px-2 py-1 transition-colors"
                    style={{
                      color: 'var(--color-sandalwood)',
                      border: '1px solid rgba(107, 68, 35, 0.4)',
                      letterSpacing: '0.1em',
                      backgroundColor: 'rgba(245, 239, 230, 0.6)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(107, 68, 35, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(245, 239, 230, 0.6)';
                    }}
                  >
                    {d.status === 'enabled' ? '禁用' : '啟用'}
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
        title={editing.id ? '編 · 輯 · 菜 · 品' : '新 · 增 · 菜 · 品'}
        footer={
          <>
            <button
              onClick={() => setShowForm(false)}
              className="guo-btn-ghost px-4 py-2 text-sm"
              style={{ letterSpacing: '0.15em' }}
            >
              取 · 消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="guo-btn-primary px-4 py-2 text-sm"
              style={{ letterSpacing: '0.15em' }}
            >
              {saving ? '保 · 存 · 中 …' : '保 · 存'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{
              color: 'var(--color-ink-light)',
              letterSpacing: '0.1em',
            }}>
              名 · 稱 <span style={{ color: 'var(--color-vermilion)' }}>*</span>
            </label>
            <input
              type="text"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="guo-input w-full px-3 py-2 text-sm"
              maxLength={50}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-2" style={{
                color: 'var(--color-ink-light)',
                letterSpacing: '0.1em',
              }}>
                單 · 價 <span style={{ color: 'var(--color-vermilion)' }}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={editing.price}
                onChange={(e) =>
                  setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })
                }
                className="guo-input w-full px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{
                color: 'var(--color-ink-light)',
                letterSpacing: '0.1em',
              }}>
                單 · 位
              </label>
              <input
                type="text"
                value={editing.unit}
                onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                className="guo-input w-full px-3 py-2 text-sm"
                placeholder="份 / 杯 / 碗"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm mb-2" style={{
              color: 'var(--color-ink-light)',
              letterSpacing: '0.1em',
            }}>
              分 · 類
            </label>
            <select
              value={editing.category}
              onChange={(e) =>
                setEditing({ ...editing, category: e.target.value as DishCategory })
              }
              className="guo-input w-full px-3 py-2 text-sm"
            >
              <option value="套餐">套餐</option>
              <option value="单品">单品</option>
              <option value="饮品">饮品</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2" style={{
              color: 'var(--color-ink-light)',
              letterSpacing: '0.1em',
            }}>
              描 · 述
            </label>
            <textarea
              value={editing.description ?? ''}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              rows={2}
              className="guo-input w-full px-3 py-2 text-sm"
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{
              color: 'var(--color-ink-light)',
              letterSpacing: '0.1em',
            }}>
              圖 · 片 · URL（可選）
            </label>
            <input
              type="text"
              value={editing.image_url ?? ''}
              onChange={(e) =>
                setEditing({ ...editing, image_url: e.target.value })
              }
              className="guo-input w-full px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </div>
          {editing.id && (
            <div>
              <label className="block text-sm mb-2" style={{
                color: 'var(--color-ink-light)',
                letterSpacing: '0.1em',
              }}>
                狀 · 態
              </label>
              <select
                value={editing.status}
                onChange={(e) =>
                  setEditing({ ...editing, status: e.target.value as DishStatus })
                }
                className="guo-input w-full px-3 py-2 text-sm"
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
