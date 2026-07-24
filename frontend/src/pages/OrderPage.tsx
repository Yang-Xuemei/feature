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
  // 使用本地时区日期
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
      <div className="flex items-center justify-center py-20 text-gray-500">
        加载中…
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          今日订餐 · {today}
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          订餐时间：{startTime} - {endTime}
        </p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
          {success}
        </div>
      )}

      {!published && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-4 py-6 text-center">
          <p className="text-lg mb-1">🍽️ 今天还没发布菜单</p>
          <p className="text-sm">请联系管理员发布今日菜单</p>
        </div>
      )}

      {published && alreadyOrdered && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 mb-4 text-sm">
          ✓ 今日已下单，每天仅允许一次订餐。可前往"我的订单"查看。
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
                  className="bg-white rounded-lg border p-3 sm:p-4 flex items-center gap-3"
                >
                  {dish.image_url ? (
                    <img
                      src={dish.image_url}
                      alt={dish.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0 bg-gray-100"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center text-2xl shrink-0">
                      {dish.category === '饮品' ? '🥤' : dish.category === '套餐' ? '🍱' : '🍽️'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {dish.name}
                      </h3>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {dish.category}
                      </span>
                    </div>
                    {dish.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {dish.description}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-orange-600 font-semibold">
                        ¥{it.price_snapshot.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400">
                        / {dish.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQty(it, -1)}
                      disabled={qty === 0}
                      className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center disabled:opacity-30 hover:bg-gray-50"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-medium">
                      {qty}
                    </span>
                    <button
                      onClick={() => updateQty(it, 1)}
                      className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {items.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              今日菜单暂无菜品
            </div>
          )}

          {cartList.length > 0 && (
            <div className="sticky bottom-0 mt-4 bg-white border rounded-lg shadow-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm text-gray-600">
                    已选 {cartList.reduce((s, i) => s + i.quantity, 0)} 件
                  </span>
                  <div className="text-xl font-bold text-orange-600">
                    ¥{total.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!withinWindow}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!withinWindow ? '非订餐时段' : '提交订单'}
                </button>
              </div>
              {!withinWindow && (
                <p className="text-xs text-orange-600">
                  当前不在订餐时段（{startTime} - {endTime}）
                </p>
              )}
            </div>
          )}
        </>
      )}

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="确认订单"
        footer={
          <>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              返回修改
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {submitting ? '提交中…' : '确认下单'}
            </button>
          </>
        }
      >
        <div className="space-y-2 mb-4">
          {cartList.map((it) => (
            <div
              key={it.dish_id}
              className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0"
            >
              <span className="text-gray-900">
                {it.dish_name}{' '}
                <span className="text-gray-500">×{it.quantity}</span>
              </span>
              <span className="text-orange-600 font-medium">
                ¥{(it.dish_price * it.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">备注（可选）</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="如：少放辣、不要香菜"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            maxLength={100}
          />
        </div>
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span className="text-sm text-gray-600">
            共 {cartList.reduce((s, i) => s + i.quantity, 0)} 件
          </span>
          <span className="text-lg font-bold text-orange-600">
            合计 ¥{total.toFixed(2)}
          </span>
        </div>
      </Modal>
    </div>
  );
}
