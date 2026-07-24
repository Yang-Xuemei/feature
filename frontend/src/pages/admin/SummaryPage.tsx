import { useEffect, useState } from 'react';
import { getDailySummary, listAllOrders, exportOrdersToPdf } from '../../lib/api';
import type { DailySummaryRow, Order } from '../../types';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function SummaryPage() {
  const [date, setDate] = useState(todayStr());
  const [rows, setRows] = useState<DailySummaryRow[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (d: string) => {
    setLoading(true);
    try {
      const [data, ordersData] = await Promise.all([
        getDailySummary(d),
        listAllOrders({ date: d }),
      ]);
      setRows(data);
      setOrders(ordersData.filter((o) => o.status !== 'cancelled'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalQty = rows.reduce((s, r) => s + r.total_quantity, 0);
  const totalAmount = rows.reduce((s, r) => s + r.total_amount, 0);

  return (
    <div>
      {/* 标题 */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl guo-title" style={{ letterSpacing: '0.3em' }}>
          當 · 日 · 匯 · 總
        </h2>
        <div className="guo-pattern-divider my-3">❖ ❖ ❖</div>
        <div className="flex justify-center items-center gap-3 mt-3">
          <label className="text-sm" style={{
            color: 'var(--color-ink-light)',
            letterSpacing: '0.1em',
          }}>
            日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              load(e.target.value);
            }}
            className="guo-input px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 guo-loading">
          請 稍 候 …
        </div>
      ) : (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: '訂 · 單 · 數', value: orders.length, type: 'normal' },
              { label: '菜 · 品 · 品 · 類', value: rows.length, type: 'normal' },
              { label: '總 · 份 · 數', value: totalQty, type: 'price' },
              { label: '總 · 金 · 額', value: `¥${totalAmount.toFixed(2)}`, type: 'price' },
            ].map((c, i) => (
              <div key={i} className="guo-card p-4 relative" style={{ borderRadius: 2 }}>
                <div className="text-xs mb-2" style={{
                  color: 'var(--color-sandalwood)',
                  letterSpacing: '0.15em',
                }}>
                  {c.label}
                </div>
                <div
                  className="text-2xl font-bold"
                  style={{
                    color: c.type === 'price' ? 'var(--color-vermilion)' : 'var(--color-ink)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {c.value}
                </div>
              </div>
            ))}
          </div>

          {orders.length > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={() => exportOrdersToPdf(orders, date)}
                className="guo-btn-secondary px-3 py-1.5 text-sm"
                style={{ letterSpacing: '0.1em' }}
              >
                導 · 出 · 當 · 日 PDF
              </button>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="guo-card p-12 text-center" style={{
              color: 'var(--color-sandalwood)',
              letterSpacing: '0.15em',
              borderRadius: 2,
            }}>
              該 · 日 · 期 · 暫 · 無 · 數 · 據
            </div>
          ) : (
            <div className="guo-card overflow-hidden" style={{ borderRadius: 2 }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="guo-table-head">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold" style={{ letterSpacing: '0.1em' }}>菜 · 品</th>
                      <th className="text-left px-3 py-2.5 font-semibold" style={{ letterSpacing: '0.1em' }}>單 · 位</th>
                      <th className="text-right px-3 py-2.5 font-semibold" style={{ letterSpacing: '0.1em' }}>數 · 量</th>
                      <th className="text-right px-3 py-2.5 font-semibold" style={{ letterSpacing: '0.1em' }}>金 · 額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="guo-table-row">
                        <td className="px-3 py-2.5 guo-title" style={{ letterSpacing: '0.1em' }}>
                          {r.dish_name}
                        </td>
                        <td className="px-3 py-2.5" style={{
                          color: 'var(--color-ink-light)',
                          letterSpacing: '0.1em',
                        }}>
                          {r.unit}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold">
                          {r.total_quantity}
                        </td>
                        <td className="px-3 py-2.5 text-right guo-price">
                          ¥{r.total_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{
                      background: 'linear-gradient(180deg, rgba(232, 220, 196, 0.5) 0%, rgba(232, 220, 196, 0.3) 100%)',
                      borderTop: '1px solid var(--color-sandalwood)',
                    }}>
                      <td colSpan={2} className="px-3 py-2.5 guo-title" style={{ letterSpacing: '0.15em' }}>
                        合 · 計
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold">
                        {totalQty}
                      </td>
                      <td className="px-3 py-2.5 text-right guo-price">
                        ¥{totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
