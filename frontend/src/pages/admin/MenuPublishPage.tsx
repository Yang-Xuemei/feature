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

function categoryChar(c: string | undefined) {
  if (c === '飲品') return '飲';
  if (c === '套餐') return '膳';
  return '肴';
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

  const filteredDishes = dishes.filter((d) => {
    if (filter === 'all') return true;
    return d.category === filter;
  });

  return (
    <div>
      {/* 标题 */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl guo-title" style={{ letterSpacing: '0.3em' }}>
          每 · 日 · 菜 · 單
        </h2>
        <div className="guo-pattern-divider my-3">❖ ❖ ❖</div>
        <p className="text-xs" style={{
          color: 'var(--color-sandalwood)',
          letterSpacing: '0.15em',
        }}>
          擇 · 菜 · 成 · 單 · 以 · 告 · 來 · 客
        </p>
      </div>

      {/* 日期选择 */}
      <div className="flex items-center justify-end mb-4">
        <label className="text-sm mr-2" style={{
          color: 'var(--color-ink-light)',
          letterSpacing: '0.1em',
        }}>
          日期
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="guo-input px-3 py-1.5 text-sm"
        />
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

      {loading ? (
        <div className="flex items-center justify-center py-20 guo-loading">
          請 稍 候 …
        </div>
      ) : (
        <>
          {/* 已选信息栏 */}
          <div className="guo-card p-3 mb-4 flex items-center justify-between flex-wrap gap-2" style={{ borderRadius: 2 }}>
            <div className="flex items-center gap-3 text-sm">
              <span style={{ color: 'var(--color-ink-light)', letterSpacing: '0.1em' }}>
                已選 <span className="guo-price text-base">{selected.size}</span> 道菜品
              </span>
              {published && (
                <span className="guo-tag" style={{
                  color: 'var(--color-celadon-dark)',
                  borderColor: 'var(--color-celadon-dark)',
                  letterSpacing: '0.15em',
                }}>
                  已 · 發 · 布
                </span>
              )}
            </div>
            <button
              onClick={handlePublish}
              disabled={saving || selected.size === 0}
              className="guo-btn-primary px-4 py-1.5 text-sm"
              style={{ letterSpacing: '0.15em' }}
            >
              {saving ? '發 · 布 · 中 …' : published ? '更 · 新 · 菜 · 單' : '發 · 布 · 菜 · 單'}
            </button>
          </div>

          {/* 分类筛选 */}
          <div className="flex gap-2 mb-3 overflow-x-auto">
            {[
              { key: 'all', label: '全 · 部' },
              { key: '套餐', label: '套 · 餐' },
              { key: '单品', label: '單 · 品' },
              { key: '饮品', label: '飲 · 品' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1 text-sm whitespace-nowrap transition-all"
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

          {/* 菜品列表 */}
          <div className="space-y-2">
            {filteredDishes.map((d) => {
              const isSel = selected.has(d.id);
              const existingItem = existing.find((it) => it.dish_id === d.id);
              return (
                <div
                  key={d.id}
                  onClick={() => toggle(d.id)}
                  className={`guo-card p-3 flex items-center gap-3 cursor-pointer transition-all ${
                    isSel ? '' : ''
                  }`}
                  style={{
                    borderRadius: 2,
                    borderColor: isSel ? 'var(--color-vermilion)' : undefined,
                    backgroundColor: isSel ? 'rgba(139, 38, 53, 0.05)' : undefined,
                    boxShadow: isSel ? 'inset 0 0 0 1px rgba(139, 38, 53, 0.3), 0 2px 6px rgba(44, 36, 22, 0.12)' : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSel) {
                      e.currentTarget.style.backgroundColor = 'rgba(196, 154, 108, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSel) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                >
                  {/* 选择框 */}
                  <div
                    className="w-5 h-5 flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      border: `1px solid ${isSel ? 'var(--color-vermilion)' : 'var(--color-sandalwood)'}`,
                      backgroundColor: isSel ? 'var(--color-vermilion)' : 'transparent',
                      color: isSel ? 'var(--color-paper)' : 'transparent',
                    }}
                  >
                    {isSel && '✓'}
                  </div>

                  {/* 菜品图片/占位 */}
                  {d.image_url ? (
                    <div className="guo-image-frame shrink-0 overflow-hidden" style={{ width: 44, height: 44 }}>
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
                        width: 44,
                        height: 44,
                        fontSize: '1.25rem',
                        borderRadius: 2,
                        transform: 'none',
                      }}
                    >
                      {categoryChar(d.category)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium guo-title" style={{ letterSpacing: '0.1em' }}>
                        {d.name}
                      </span>
                      <span className="guo-tag" style={{
                        color: 'var(--color-sandalwood)',
                        borderColor: 'rgba(107, 68, 35, 0.4)',
                      }}>
                        {d.category}
                      </span>
                      {existingItem && (
                        <span className="text-xs" style={{
                          color: 'var(--color-sandalwood)',
                          letterSpacing: '0.05em',
                        }}>
                          (當前 ¥{existingItem.price_snapshot.toFixed(2)})
                        </span>
                      )}
                    </div>
                    <div className="guo-price text-sm mt-1" style={{ letterSpacing: '0.05em' }}>
                      ¥{d.price.toFixed(2)} / {d.unit}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredDishes.length === 0 && (
            <div className="guo-card p-12 text-center" style={{
              color: 'var(--color-sandalwood)',
              letterSpacing: '0.15em',
              borderRadius: 2,
            }}>
              暫無啟用中的菜品 · 請先在「菜品庫」中添加
            </div>
          )}
        </>
      )}
    </div>
  );
}
