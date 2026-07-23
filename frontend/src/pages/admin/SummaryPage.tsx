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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-gray-900">当日汇总</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            load(e.target.value);
          }}
          className="px-3 py-1.5 border rounded-lg text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          加载中…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500 mb-1">订单数</div>
              <div className="text-2xl font-bold text-gray-900">
                {orders.length}
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500 mb-1">菜品品类</div>
              <div className="text-2xl font-bold text-gray-900">
                {rows.length}
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500 mb-1">总份数</div>
              <div className="text-2xl font-bold text-orange-600">
                {totalQty}
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500 mb-1">总金额</div>
              <div className="text-2xl font-bold text-orange-600">
                ¥{totalAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {orders.length > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={() => exportOrdersToPdf(orders, date)}
                className="px-3 py-1.5 bg-white border text-gray-700 rounded-lg text-sm hover:bg-gray-50"
              >
                导出当日 PDF
              </button>
            </div>
          )}

          {rows.length === 0 ? (
            <div className="bg-white rounded-lg border p-12 text-center text-gray-500 text-sm">
              该日期暂无订单数据
            </div>
          ) : (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">菜品</th>
                      <th className="text-left px-3 py-2 font-medium">单位</th>
                      <th className="text-right px-3 py-2 font-medium">数量</th>
                      <th className="text-right px-3 py-2 font-medium">金额</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {r.dish_name}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{r.unit}</td>
                        <td className="px-3 py-2 text-right">
                          <span className="font-semibold">
                            {r.total_quantity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-orange-600 font-medium">
                          ¥{r.total_amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan={2} className="px-3 py-2 text-gray-700">
                        合计
                      </td>
                      <td className="px-3 py-2 text-right">{totalQty}</td>
                      <td className="px-3 py-2 text-right text-orange-600">
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
