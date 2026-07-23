import { useEffect, useState } from 'react';
import { listAllOrders, updateOrderStatus, exportOrdersToCsv } from '../../lib/api';
import type { Order, OrderStatus } from '../../types';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { STATUS_LABEL } from '../../types';

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

  const handleExport = () => {
    if (orders.length === 0) {
      alert('当前筛选条件下没有订单可导出');
      return;
    }
    exportOrdersToCsv(orders);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">订单管理</h2>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 bg-white border text-gray-700 rounded-lg text-sm hover:bg-gray-50"
        >
          导出 CSV
        </button>
      </div>

      <div className="bg-white rounded-lg border p-3 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-2 py-1.5 border rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">部门</label>
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="如：技术部"
            className="w-full px-2 py-1.5 border rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">状态</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-2 py-1.5 border rounded text-sm"
          >
            <option value="">全部</option>
            <option value="submitted">已提交</option>
            <option value="confirmed">已确认</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
        </div>
        <div className="sm:col-span-3 flex justify-end gap-2">
          <button
            onClick={() => {
              setDate('');
              setDepartment('');
              setStatus('');
            }}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
          >
            重置
          </button>
          <button
            onClick={load}
            className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm"
          >
            查询
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          加载中…
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center text-gray-500 text-sm">
          暂无订单
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">日期</th>
                  <th className="text-left px-3 py-2 font-medium">用户</th>
                  <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">
                    部门
                  </th>
                  <th className="text-left px-3 py-2 font-medium">状态</th>
                  <th className="text-right px-3 py-2 font-medium">金额</th>
                  <th className="text-right px-3 py-2 font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap">{o.order_date}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900">
                        {o.user_profiles?.username}
                      </div>
                      <div className="text-xs text-gray-500 sm:hidden">
                        {o.user_profiles?.department}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-600 hidden sm:table-cell">
                      {o.user_profiles?.department}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-orange-600">
                      ¥{o.total.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="text-xs text-blue-600 hover:underline mr-2"
                      >
                        详情
                      </button>
                      {o.status === 'submitted' && (
                        <button
                          onClick={() => handleStatusChange(o, 'confirmed')}
                          className="text-xs text-green-600 hover:underline mr-2"
                        >
                          确认
                        </button>
                      )}
                      {o.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(o, 'completed')}
                          className="text-xs text-green-600 hover:underline mr-2"
                        >
                          完成
                        </button>
                      )}
                      {o.status !== 'cancelled' && o.status !== 'completed' && (
                        <button
                          onClick={() => {
                            if (confirm('确定取消该订单？')) {
                              handleStatusChange(o, 'cancelled');
                            }
                          }}
                          className="text-xs text-red-600 hover:underline"
                        >
                          取消
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

      <Modal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="订单详情"
      >
        {selectedOrder && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">订单号</span>
              <span className="text-gray-900">
                #{selectedOrder.id.slice(0, 8)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">日期</span>
              <span className="text-gray-900">{selectedOrder.order_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">用户</span>
              <span className="text-gray-900">
                {selectedOrder.user_profiles?.username}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">部门</span>
              <span className="text-gray-900">
                {selectedOrder.user_profiles?.department}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">手机号</span>
              <span className="text-gray-900">
                {selectedOrder.user_profiles?.phone}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">状态</span>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="pt-3 border-t">
              <div className="text-gray-500 mb-2">菜品明细</div>
              {(selectedOrder.order_items ?? []).map((it) => (
                <div
                  key={it.id}
                  className="flex justify-between py-1 border-b last:border-0"
                >
                  <span>
                    {it.dish_name_snapshot} ×{it.quantity}
                  </span>
                  <span className="text-gray-600">
                    ¥{(it.dish_price_snapshot * it.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t flex justify-between items-center">
              <span className="text-gray-500">合计</span>
              <span className="text-lg font-bold text-orange-600">
                ¥{selectedOrder.total.toFixed(2)}
              </span>
            </div>

            {selectedOrder.note && (
              <div className="text-gray-500">
                <div className="mb-1">备注</div>
                <div className="text-gray-900 bg-gray-50 px-2 py-1 rounded">
                  {selectedOrder.note}
                </div>
              </div>
            )}

            <div className="pt-3 border-t flex flex-wrap gap-2">
              {selectedOrder.status === 'submitted' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedOrder, 'confirmed');
                  }}
                  className="px-3 py-1.5 bg-green-500 text-white rounded text-sm"
                >
                  确认订单
                </button>
              )}
              {selectedOrder.status === 'confirmed' && (
                <button
                  onClick={() => {
                    handleStatusChange(selectedOrder, 'completed');
                  }}
                  className="px-3 py-1.5 bg-green-500 text-white rounded text-sm"
                >
                  标记完成
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
                    className="px-3 py-1.5 bg-red-500 text-white rounded text-sm"
                  >
                    取消订单
                  </button>
                )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
