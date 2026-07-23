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
      <div className="flex items-center justify-center py-20 text-gray-500">
        加载中…
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">我的订单</h2>

      {orders.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center text-gray-500 text-sm">
          还没有订单记录，快去今日订餐下单吧
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {o.order_date}
                  </span>
                  <StatusBadge status={o.status} />
                </div>
                <span className="text-sm text-gray-500">
                  #{o.id.slice(0, 8)}
                </span>
              </div>

              <div className="space-y-1.5">
                {(o.order_items ?? []).map((it) => (
                  <div
                    key={it.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-700">
                      {it.dish_name_snapshot}{' '}
                      <span className="text-gray-400">×{it.quantity}</span>
                    </span>
                    <span className="text-gray-600">
                      ¥{(it.dish_price_snapshot * it.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(o.created_at).toLocaleString('zh-CN')}
                </span>
                <span className="text-orange-600 font-semibold">
                  合计 ¥{o.total.toFixed(2)}
                </span>
              </div>
              {o.note && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                  备注：{o.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
