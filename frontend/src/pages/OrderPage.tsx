import { useEffect, useState } from 'react';
import {
  getMenuByDate,
  getMenuItems,
  getConfig,
  placeOrder,
  listMyOrders,
} from '../lib/api';
import type { DailyMenuItem, CartItem } from '../types';
import Modal from '../components/Modal';
import { isWithinTimeWindow } from '../lib/api';

function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// 分类对应汉字
function categoryChar(c: string | undefined) {
  if (c === '飲品') return '飲';
  if (c === '套餐') return '膳';
  return '肴';
}

export default function OrderPage() {
  const today = todayStr();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [items, setItems] = useState<DailyMenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:30');
  const [withinWindow, setWithinWindow] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [alreadyOrdered, setAlreadyOrdered] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [menu, config, myOrders] = await Promise.all([
        getMenuByDate(today),
        getConfig(),
        listMyOrders(),
      ]);
      setStartTime(config.order_start_time || '08:00');
      setEndTime(config.order_end_time || '10:30');
      setWithinWindow(
        isWithinTimeWindow(
          config.order_start_time || '08:00',
          config.order_end_time || '10:30',
        ),
      );

      if (menu) {
        setMenuId(menu.id);
        setPublished(menu.published_at !== null);
        if (menu.published_at) {
          const menuItems = await getMenuItems(menu.id);
          setItems(menuItems);
        }
      }

      const todayOrders = (myOrders ?? []).filter(
        (o) => o.order_date === today && o.status !== 'cancelled',
      );
      setAlreadyOrdered(todayOrders.length > 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const t = setInterval(() => {
      setWithinWindow(isWithinTimeWindow(startTime, endTime));
    }, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQty = (item: DailyMenuItem, delta: number) => {
    setCart((prev) => {
      const dish = item.dishes!;
      const cur = prev[dish.id];
      const newQty = Math.max(0, (cur?.quantity ?? 0) + delta);
      if (newQty === 0) {
        const { [dish.id]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [dish.id]: {
          dish_id: dish.id,
          dish_name: dish.name,
          dish_price: item.price_snapshot,
          unit: dish.unit,
          quantity: newQty,
        },
      };
    });
  };

  const cartList = Object.values(cart);
  const total = cartList.reduce((s, it) => s + it.dish_price * it.quantity, 0);

  const handleSubmit = async () => {
    if (!menuId) return;
    setSubmitting(true);
    setError('');
    try {
      await placeOrder(menuId, cartList, note);
      setSuccess('下单成功！');
      setShowConfirm(false);
      setCart({});
      setNote('');
      setAlreadyOrdered(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
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
      {/* 页面标题 */}
      <div className="mb-6 text-center relative">
        <h2 className="text-2xl guo-title" style={{ letterSpacing: '0.3em' }}>
          今 · 日 · 訂 · 餐
        </h2>
        <div className="guo-pattern-divider my-3">❖ ❖ ❖</div>
        <p className="text-xs" style={{
          color: 'var(--color-sandalwood)',
          letterSpacing: '0.15em',
        }}>
          {today} · 訂餐時辰：{startTime} — {endTime}
        </p>
      </div>

      {error && (
        <div className="mb-4 guo-error px-4 py-3 text-sm" style={{ letterSpacing: '0.05em' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 guo-success px-4 py-3 text-sm" style={{ letterSpacing: '0.05em' }}>
          {success}
        </div>
      )}

      {!published && (
        <div className="guo-card p-8 text-center" style={{ borderRadius: 2 }}>
          <div className="text-5xl mb-3" style={{ color: 'var(--color-golden)' }}>✦</div>
          <p className="text-lg guo-title mb-2" style={{ letterSpacing: '0.2em' }}>
            今 · 日 · 未 · 開 · 膳
          </p>
          <p className="text-sm" style={{
            color: 'var(--color-sandalwood)',
            letterSpacing: '0.15em',
          }}>
            請聯繫管理員發布今日菜單
          </p>
        </div>
      )}

      {published && alreadyOrdered && (
        <div className="guo-success px-4 py-3 mb-4 text-sm" style={{ letterSpacing: '0.1em' }}>
          ✓ 今 · 日 · 已 · 下 · 單 · 每 · 日 · 僅 · 許 · 一 · 次 · 可前往「我的訂單」查看。
        </div>
      )}

      {published && !alreadyOrdered && (
        <>
          <div className="space-y-3">
            {items.map((it) => {
              const dish = it.dishes;
              if (!dish) return null;
              const qty = cart[dish.id]?.quantity ?? 0;
              return (
                <div
                  key={it.id}
                  className="guo-card p-3 sm:p-4 flex items-center gap-3 relative"
                  style={{ borderRadius: 2 }}
                >
                  {/* 菜品图片 / 占位 */}
                  {dish.image_url ? (
                    <div className="guo-image-frame shrink-0 overflow-hidden" style={{ width: 72, height: 72 }}>
                      <img
                        src={dish.image_url}
                        alt={dish.name}
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
                        width: 72,
                        height: 72,
                        fontSize: '2rem',
                        borderRadius: 2,
                        transform: 'none',
                      }}
                    >
                      {categoryChar(dish.category)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="font-semibold truncate guo-title" style={{ letterSpacing: '0.1em' }}>
                        {dish.name}
                      </h3>
                      <span className="guo-tag" style={{
                        color: 'var(--color-sandalwood)',
                        borderColor: 'rgba(107, 68, 35, 0.4)',
                      }}>
                        {dish.category}
                      </span>
                    </div>
                    {dish.description && (
                      <p className="text-xs line-clamp-2 mb-2" style={{
                        color: 'var(--color-ink-light)',
                        letterSpacing: '0.05em',
                      }}>
                        {dish.description}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="guo-price text-lg">
                        ¥{it.price_snapshot.toFixed(2)}
                      </span>
                      <span className="text-xs" style={{
                        color: 'var(--color-sandalwood)',
                        letterSpacing: '0.1em',
                      }}>
                        / {dish.unit}
                      </span>
                    </div>
                  </div>

                  {/* 数量控制 */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQty(it, -1)}
                      disabled={qty === 0}
                      className="w-8 h-8 flex items-center justify-center transition-colors disabled:opacity-30"
                      style={{
                        border: '1px solid var(--color-sandalwood)',
                        color: 'var(--color-sandalwood)',
                        backgroundColor: 'rgba(245, 239, 230, 0.6)',
                      }}
                      onMouseEnter={(e) => {
                        if (qty > 0) {
                          e.currentTarget.style.borderColor = 'var(--color-vermilion)';
                          e.currentTarget.style.color = 'var(--color-vermilion)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-sandalwood)';
                        e.currentTarget.style.color = 'var(--color-sandalwood)';
                      }}
                    >
                      −
                    </button>
                    <span className="w-6 text-center guo-title">{qty}</span>
                    <button
                      onClick={() => updateQty(it, 1)}
                      className="w-8 h-8 flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: 'var(--color-vermilion)',
                        color: 'var(--color-paper)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-vermilion-light)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-vermilion)';
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {items.length === 0 && (
            <div className="guo-card p-12 text-center" style={{
              color: 'var(--color-sandalwood)',
              letterSpacing: '0.15em',
              borderRadius: 2,
            }}>
              今 · 日 · 菜 · 單 · 暫 · 無 · 菜 · 品
            </div>
          )}

          {/* 底部订单栏 */}
          {cartList.length > 0 && (
            <div
              className="guo-card sticky bottom-0 mt-5 p-3 sm:p-4"
              style={{
                borderRadius: 2,
                boxShadow: '0 -4px 12px rgba(44, 36, 22, 0.15), 0 2px 6px rgba(44, 36, 22, 0.12)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs" style={{
                    color: 'var(--color-ink-light)',
                    letterSpacing: '0.1em',
                  }}>
                    已選 {cartList.reduce((s, i) => s + i.quantity, 0)} 件
                  </span>
                  <div className="guo-price text-2xl">
                    ¥{total.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!withinWindow}
                  className="guo-btn-primary px-6 py-2.5"
                  style={{ letterSpacing: '0.2em' }}
                >
                  {!withinWindow ? '非訂餐時辰' : '提 · 交 · 訂 · 單'}
                </button>
              </div>
              {!withinWindow && (
                <p className="text-xs" style={{
                  color: 'var(--color-vermilion)',
                  letterSpacing: '0.1em',
                }}>
                  當前不在訂餐時辰（{startTime} - {endTime}）
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* 确认订单模态框 */}
      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="確 · 認 · 訂 · 單"
        footer={
          <>
            <button
              onClick={() => setShowConfirm(false)}
              className="guo-btn-ghost px-4 py-2 text-sm"
              style={{ letterSpacing: '0.15em' }}
            >
              返 · 回
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="guo-btn-primary px-4 py-2 text-sm"
              style={{ letterSpacing: '0.15em' }}
            >
              {submitting ? '提 · 交 · 中 …' : '確 · 認 · 下 · 單'}
            </button>
          </>
        }
      >
        <div className="space-y-2 mb-4">
          {cartList.map((it) => (
            <div
              key={it.dish_id}
              className="flex items-center justify-between text-sm py-2"
              style={{
                borderBottom: '1px dashed rgba(107, 68, 35, 0.2)',
                letterSpacing: '0.05em',
              }}
            >
              <span className="guo-title">
                {it.dish_name}{' '}
                <span style={{ color: 'var(--color-ink-light)' }}>×{it.quantity}</span>
              </span>
              <span className="guo-price">
                ¥{(it.dish_price * it.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs mb-2" style={{
            color: 'var(--color-ink-light)',
            letterSpacing: '0.1em',
          }}>
            備註（可選）
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="如：少放辣、不要香菜"
            className="guo-input w-full px-3 py-2 text-sm"
            maxLength={100}
          />
        </div>
        <div className="mt-5 pt-4 flex items-center justify-between" style={{
          borderTop: '1px solid var(--color-sandalwood)',
        }}>
          <span className="text-sm" style={{
            color: 'var(--color-ink-light)',
            letterSpacing: '0.1em',
          }}>
            共 {cartList.reduce((s, i) => s + i.quantity, 0)} 件
          </span>
          <span className="guo-price text-xl">
            合計 ¥{total.toFixed(2)}
          </span>
        </div>
      </Modal>
    </div>
  );
}
