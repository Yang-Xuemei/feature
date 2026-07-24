import { useEffect, useState } from 'react';
import { listMyOrders } from '../lib/api';
import type { Order } from '../types';
import StatusBadge from '../components/StatusBadge';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listMyOrders();
        setOrders(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 guo-loading">
        請 稍 候 …
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-2xl guo-title" style={{ letterSpacing: '0.3em' }}>
          我 · 之 · 訂 · 單
        </h2>
        <div className="guo-pattern-divider my-3">❖ ❖ ❖</div>
      </div>

      {orders.length === 0 ? (
        <div className="guo-card p-12 text-center" style={{
          color: 'var(--color-sandalwood)',
          letterSpacing: '0.15em',
          borderRadius: 2,
        }}>
          尚 · 無 · 記 · 錄 · 請 · 前 · 往 · 「今 · 日 · 訂 · 餐」下 · 單
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="guo-card p-4 relative" style={{ borderRadius: 2 }}>
              {/* 订单头 */}
              <div className="flex items-center justify-between mb-3 pb-3" style={{
                borderBottom: '1px dashed rgba(107, 68, 35, 0.3)',
              }}>
                <div className="flex items-center gap-3">
                  <span className="guo-title" style={{ letterSpacing: '0.1em' }}>
                    {o.order_date}
                  </span>
                  <StatusBadge status={o.status} />
                </div>
                <span className="text-xs" style={{
                  color: 'var(--color-sandalwood)',
                  letterSpacing: '0.1em',
                }}>
                  #{o.id.slice(0, 8)}
                </span>
              </div>

              {/* 菜品明细 */}
              <div className="space-y-1.5 mb-3">
                {(o.order_items ?? []).map((it) => (
                  <div
                    key={it.id}
                    className="flex justify-between text-sm"
                    style={{ letterSpacing: '0.05em' }}
                  >
                    <span style={{ color: 'var(--color-ink)' }}>
                      {it.dish_name_snapshot}{' '}
                      <span style={{ color: 'var(--color-sandalwood)' }}>×{it.quantity}</span>
                    </span>
                    <span className="guo-price">
                      ¥{(it.dish_price_snapshot * it.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* 底部合计 */}
              <div className="flex items-center justify-between pt-3" style={{
                borderTop: '1px solid var(--color-sandalwood)',
              }}>
                <span className="text-xs" style={{
                  color: 'var(--color-sandalwood)',
                  letterSpacing: '0.08em',
                }}>
                  {new Date(o.created_at).toLocaleString('zh-CN')}
                </span>
                <span className="guo-price text-lg">
                  合計 ¥{o.total.toFixed(2)}
                </span>
              </div>

              {o.note && (
                <div className="mt-3 text-xs px-3 py-2" style={{
                  color: 'var(--color-ink-light)',
                  backgroundColor: 'rgba(196, 154, 108, 0.1)',
                  border: '1px dashed rgba(107, 68, 35, 0.3)',
                  letterSpacing: '0.05em',
                }}>
                  <span style={{ color: 'var(--color-golden-dark)' }}>◈</span> 備註：{o.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
