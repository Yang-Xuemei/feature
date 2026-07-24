import { useEffect, useRef, useState } from 'react';
import {
  listAllOrders,
  updateOrderStatus,
  exportOrdersToCsv,
  exportOrdersToPdf,
} from '../../lib/api';
import type { Order, OrderStatus } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAllOrders({
        date: date || undefined,
        status: status || undefined,
        department: department || undefined,
      });
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (o: Order, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(o.id, newStatus);
      setOrders((prev) =>
        prev.map((x) => (x.id === o.id ? { ...x, status: newStatus } : x)),
      );
      if (selectedOrder?.id === o.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleExportCsv = () => {
    if (orders.length === 0) {
      alert('当前筛选条件下没有订单可导出');
      return;
    }
    exportOrdersToCsv(orders);
    setShowExportMenu(false);
  };

  const handleExportPdf = () => {
    if (orders.length === 0) {
      alert('当前筛选条件下没有订单可导出');
      return;
    }
    exportOrdersToPdf(orders, date || undefined);
    setShowExportMenu(false);
  };

  return (
    <div>
      {/* 标题 */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl guo-title" style={{ letterSpacing: '0.3em' }}>
          訂 · 單 · 管 · 理
        </h2>
        <div className="guo-pattern-divider my-3">❖ ❖ ❖</div>
        {!loading && orders.length > 0 && (
          <p className="text-xs" style={{
            color: 'var(--color-sandalwood)',
            letterSpacing: '0.15em',
          }}>
            共計 {orders.length} 筆 · 記 · 錄
          </p>
        )}
      </div>

      {/* 筛选区 */}
      <div className="guo-card p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ borderRadius: 2 }}>
        <div>
          <label className="block text-xs mb-1" style={{
            color: 'var(--color-ink-light)',
            letterSpacing: '0.1em',
          }}>
            日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="guo-input w-full px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{
            color: 'var(--color-ink-light)',
            letterSpacing: '0.1em',
          }}>
            部 · 門
          </label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="如：技术部"
            className="guo-input w-full px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{
            color: 'var(--color-ink-light)',
            letterSpacing: '0.1em',
          }}>
            狀 · 態
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="guo-input w-full px-2 py-1.5 text-sm"
          >
            <option value="">全部</option>
            <option value="submitted">已提交</option>
            <option value="confirmed">已确认</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <div className="sm:col-span-3 flex justify-end gap-2" style={{
          borderTop: '1px dashed rgba(107, 68, 35, 0.3)',
          paddingTop: '0.75rem',
        }}>
          <button
            onClick={() => {
              setDate('');
              setDepartment('');
              setStatus('');
            }}
            className="guo-btn-ghost px-3 py-1.5 text-sm"
            style={{ letterSpacing: '0.1em' }}
          >
            重 · 置
          </button>
          <button
            onClick={load}
            className="guo-btn-primary px-3 py-1.5 text-sm"
            style={{ letterSpacing: '0.1em' }}
          >
            查 · 詢
          </button>
        </div>
      </div>

      {/* 导出按钮 */}
      <div className="flex justify-end mb-3 relative" ref={exportRef}>
        <button
          onClick={() => setShowExportMenu((v) => !v)}
          className="guo-btn-secondary px-3 py-1.5 text-sm"
          style={{ letterSpacing: '0.1em' }}
        >
          導 · 出 ▼
        </button>
        {showExportMenu && (
          <div className="absolute right-0 mt-1 w-40 z-10 overflow-hidden" style={{
            backgroundColor: 'var(--color-paper)',
            border: '1px solid var(--color-sandalwood)',
            boxShadow: '0 4px 12px rgba(44, 36, 22, 0.15)',
          }}>
            <button
              onClick={handleExportCsv}
              className="w-full px-3 py-2 text-sm text-left transition-colors"
              style={{
                color: 'var(--color-ink)',
                letterSpacing: '0.1em',
                borderBottom: '1px dashed rgba(107, 68, 35, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(196, 154, 108, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              導 · 出 CSV 表格
            </button>
            <button
              onClick={handleExportPdf}
              className="w-full px-3 py-2 text-sm text-left transition-colors"
              style={{
                color: 'var(--color-ink)',
                letterSpacing: '0.1em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(196, 154, 108, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              導 · 出 PDF 表格
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 guo-loading">
          請 稍 候 …
        </div>
      ) : orders.length === 0 ? (
        <div className="guo-card p-12 text-center" style={{
          color: 'var(--color-sandalwood)',
          letterSpacing: '0.15em',
          borderRadius: 2,
        }}>
          暫 · 無 · 訂 · 單
        </div>
      ) : (
        <div className="guo-card overflow-hidden" style={{ borderRadius: 2 }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="guo-table-head">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold" style={{ letterSpacing: '0.1em' }}>日期</th>
                  <th className="text-left px-3 py-2.5 font-semibold" style={{ letterSpacing: '0.1em' }}>用戶</th>
                  <th className="text-left px-3 py-2.5 font-semibold hidden sm:table-cell" style={{ letterSpacing: '0.1em' }}>
                    部 · 門
                  </th>
                  <th className="text-left px-3 py-2.5 font-semibold" style={{ letterSpacing: '0.1em' }}>狀 · 態</th>
                  <th className="text-right px-3 py-2.5 font-semibold" style={{ letterSpacing: '0.1em' }}>金 · 額</th>
                  <th className="text-right px-3 py-2.5 font-semibold" style={{ letterSpacing: '0.1em' }}>操 · 作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="guo-table-row">
                    <td className="px-3 py-2.5 whitespace-nowrap" style={{ letterSpacing: '0.05em' }}>
                      {o.order_date}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="guo-title" style={{ letterSpacing: '0.1em' }}>
                        {o.user_profiles?.username}
                      </div>
                      <div className="text-xs sm:hidden" style={{ color: 'var(--color-sandalwood)' }}>
                        {o.user_profiles?.department}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell" style={{
                      color: 'var(--color-ink-light)',
                      letterSpacing: '0.05em',
                    }}>
                      {o.user_profiles?.department}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-2.5 text-right guo-price">
                      ¥{o.total.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="text-xs mr-2 guo-link"
                        style={{ letterSpacing: '0.1em' }}
                      >
                        詳 · 情
                      </button>
                      {o.status === 'submitted' && (
                        <button
                          onClick={() => handleStatusChange(o, 'confirmed')}
                          className="text-xs mr-2"
                          style={{
                            color: 'var(--color-celadon-dark)',
                            letterSpacing: '0.1em',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          確 · 認
                        </button>
                      )}
                      {o.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(o, 'completed')}
                          className="text-xs mr-2"
                          style={{
                            color: 'var(--color-celadon-dark)',
                            letterSpacing: '0.1em',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          完 · 成
                        </button>
                      )}
                      {o.status !== 'cancelled' && o.status !== 'completed' && (
                        <button
                          onClick={() => {
                            if (confirm('确定取消该订单？')) {
                              handleStatusChange(o, 'cancelled');
                            }
                          }}
                          className="text-xs"
                          style={{
                            color: 'var(--color-vermilion)',
                            letterSpacing: '0.1em',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none';
                          }}
                        >
                          取 · 消
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 订单详情模态框 */}
      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="訂 · 單 · 詳 · 情"
      >
        {selectedOrder && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5" style={{ borderBottom: '1px dashed rgba(107, 68, 35, 0.25)' }}>
              <span style={{ color: 'var(--color-ink-light)', letterSpacing: '0.1em' }}>訂單號</span>
              <span className="guo-title">#{selectedOrder.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between py-1.5" style={{ borderBottom: '1px dashed rgba(107, 68, 35, 0.25)' }}>
              <span style={{ color: 'var(--color-ink-light)', letterSpacing: '0.1em' }}>日 · 期</span>
              <span className="guo-title">{selectedOrder.order_date}</span>
            </div>
            <div className="flex justify-between py-1.5" style={{ borderBottom: '1px dashed rgba(107, 68, 35, 0.25)' }}>
              <span style={{ color: 'var(--color-ink-light)', letterSpacing: '0.1em' }}>用 · 戶</span>
              <span className="guo-title">{selectedOrder.user_profiles?.username}</span>
            </div>
            <div className="flex justify-between py-1.5" style={{ borderBottom: '1px dashed rgba(107, 68, 35, 0.25)' }}>
              <span style={{ color: 'var(--color-ink-light)', letterSpacing: '0.1em' }}>部 · 門</span>
              <span className="guo-title">{selectedOrder.user_profiles?.department}</span>
            </div>
            <div className="flex justify-between py-1.5" style={{ borderBottom: '1px dashed rgba(107, 68, 35, 0.25)' }}>
              <span style={{ color: 'var(--color-ink-light)', letterSpacing: '0.1em' }}>手機號</span>
              <span className="guo-title">{selectedOrder.user_profiles?.phone}</span>
            </div>
            <div className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid var(--color-sandalwood)' }}>
              <span style={{ color: 'var(--color-ink-light)', letterSpacing: '0.1em' }}>狀 · 態</span>
              <StatusBadge status={selectedOrder.status} />
            </div>

            {/* 菜品明细 */}
            <div className="pt-3">
              <div className="mb-2 guo-title" style={{ letterSpacing: '0.15em', fontSize: '0.9rem' }}>
                菜 · 品 · 明 · 細
              </div>
              {(selectedOrder.order_items ?? []).map((it) => (
                <div
                  key={it.id}
                  className="flex justify-between py-1.5"
                  style={{
                    borderBottom: '1px dashed rgba(107, 68, 35, 0.2)',
                    letterSpacing: '0.05em',
                  }}
                >
                  <span>
                    {it.dish_name_snapshot} <span style={{ color: 'var(--color-sandalwood)' }}>×{it.quantity}</span>
                  </span>
                  <span className="guo-price">
                    ¥{(it.dish_price_snapshot * it.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* 合计 */}
            <div className="pt-3 flex justify-between items-center" style={{ borderTop: '1px solid var(--color-sandalwood)' }}>
              <span style={{ color: 'var(--color-ink-light)', letterSpacing: '0.15em' }}>合 · 計</span>
              <span className="guo-price text-xl">
                ¥{selectedOrder.total.toFixed(2)}
              </span>
            </div>

            {selectedOrder.note && (
              <div className="text-xs" style={{
                backgroundColor: 'rgba(196, 154, 108, 0.1)',
                border: '1px dashed rgba(107, 68, 35, 0.3)',
                padding: '0.5rem 0.75rem',
                color: 'var(--color-ink-light)',
                letterSpacing: '0.05em',
              }}>
                <span style={{ color: 'var(--color-golden-dark)' }}>◈</span> 備註：{selectedOrder.note}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="pt-3 flex flex-wrap gap-2" style={{ borderTop: '1px dashed rgba(107, 68, 35, 0.3)' }}>
              {selectedOrder.status === 'submitted' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedOrder, 'confirmed');
                  }}
                  className="px-4 py-1.5 text-sm"
                  style={{
                    backgroundColor: 'var(--color-celadon)',
                    color: 'var(--color-paper)',
                    border: '1px solid var(--color-celadon-dark)',
                    letterSpacing: '0.1em',
                  }}
                >
                  確 · 認 · 訂 · 單
                </button>
              )}
              {selectedOrder.status === 'confirmed' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedOrder, 'completed');
                  }}
                  className="px-4 py-1.5 text-sm"
                  style={{
                    backgroundColor: 'var(--color-celadon)',
                    color: 'var(--color-paper)',
                    border: '1px solid var(--color-celadon-dark)',
                    letterSpacing: '0.1em',
                  }}
                >
                  標 · 記 · 完 · 成
                </button>
              )}
              {selectedOrder.status !== 'cancelled' &&
                selectedOrder.status !== 'completed' && (
                  <button
                    onClick={() => {
                      if (confirm('确定取消该订单？')) {
                        handleStatusChange(selectedOrder, 'cancelled');
                      }
                    }}
                    className="px-4 py-1.5 text-sm"
                    style={{
                      backgroundColor: 'var(--color-vermilion)',
                      color: 'var(--color-paper)',
                      border: '1px solid var(--color-vermilion-dark)',
                      letterSpacing: '0.1em',
                    }}
                  >
                    取 · 消 · 訂 · 單
                  </button>
                )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
