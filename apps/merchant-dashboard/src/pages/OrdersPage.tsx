import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { CheckCircle2, XCircle, PackageCheck, Clock, RefreshCw, ChefHat, ShoppingBag } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { getSocket } from '../services/socket';
import { useToast } from '../components/Toast';
import { DashboardSkeleton } from '../components/Skeletons';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  status: string;
  payment_status: string;
  total_amount: number;
  address: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  items: OrderItem[];
}

const STATUS_TABS = ['all', 'placed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

const STATUS_BADGE: Record<string, string> = {
  placed:           'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  preparing:        'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  ready:            'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  out_for_delivery: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-blue-500/30',
  delivered:        'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/30',
  cancelled:        'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
};

const ACTION_LABEL: Record<string, string> = {
  accept: 'Order accepted',
  reject: 'Order rejected',
  ready:  'Order marked as ready',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const { token, store } = useAuthStore();
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const { data } = await api.get('/merchant/orders', { params });
      setOrders(data.orders ?? []);
    } catch {
      // Silent fail — stale data is fine
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Poll + socket feed
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!token || !store?.id) return;
    const socket = getSocket(token);

    socket.emit('join:merchant', { storeId: store.id });

    const handleNewOrder = (order: Order) => {
      setOrders((prev) =>
        activeTab === 'all' || activeTab === 'placed'
          ? [order, ...prev]
          : prev
      );
    };

    const handleStatusUpdate = ({ orderId, status }: { orderId: number; status: string }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status } : o
        ).filter((o) => activeTab === 'all' || o.status === activeTab)
      );
    };

    socket.on('merchant:new_order', handleNewOrder);
    socket.on('order_status_update', handleStatusUpdate);

    return () => {
      socket.off('merchant:new_order', handleNewOrder);
      socket.off('order_status_update', handleStatusUpdate);
    };
  }, [token, store?.id, activeTab]);

  const doAction = async (orderId: number, action: 'accept' | 'reject' | 'ready') => {
    setActionLoading(orderId);
    try {
      await api.patch(`/merchant/orders/${orderId}/status`, { action });
      toast('success', ACTION_LABEL[action]);
      await fetchOrders();
    } catch {
      toast('error', 'Action failed — please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const fmt = (v: number) => `₹${(v / 100).toLocaleString('en-IN')}`;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Live order feed for your store</p>
        </div>
        <button onClick={fetchOrders} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border',
              activeTab === tab
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/50 dark:bg-emerald-500/20 dark:text-emerald-400'
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            )}
          >
            {tab === 'all' ? 'All Orders' : tab.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Order Cards */}
      {loading ? (
        <DashboardSkeleton />
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <ShoppingBag size={48} className="mb-3 opacity-30" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-sm">New orders will appear here in real-time</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="card hover:border-slate-300 dark:hover:border-slate-600/80 transition-all animate-fade-in"
            >
              {/* Order header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">#{order.id}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(order.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span
                  className={clsx(
                    'badge border',
                    STATUS_BADGE[order.status] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  )}
                >
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Customer */}
              <div className="mb-3 p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-sm border border-slate-100 dark:border-none">
                <p className="text-slate-700 dark:text-slate-200 font-medium">{order.customer_name}</p>
                <p className="text-slate-500 dark:text-slate-500 text-xs">{order.customer_phone}</p>
              </div>

              {/* Items */}
              <ul className="space-y-1 mb-3">
                {order.items?.filter(Boolean).map((item, i) => (
                  <li key={i} className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">
                      {item.quantity}× {item.name}
                    </span>
                    <span>{fmt(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{fmt(order.total_amount)}</span>
                <span
                  className={clsx(
                    'text-xs badge',
                    order.payment_status === 'paid'
                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
                      : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                  )}
                >
                  {order.payment_status}
                </span>
              </div>

              {/* Actions */}
              {order.status === 'placed' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => doAction(order.id, 'accept')}
                    disabled={actionLoading === order.id}
                    className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    {actionLoading === order.id ? 'Accepting…' : 'Accept'}
                  </button>
                  <button
                    onClick={() => doAction(order.id, 'reject')}
                    disabled={actionLoading === order.id}
                    className="flex-1 btn-danger text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </div>
              )}

              {order.status === 'preparing' && (
                <button
                  onClick={() => doAction(order.id, 'ready')}
                  disabled={actionLoading === order.id}
                  className="w-full mt-4 btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  <PackageCheck size={14} />
                  {actionLoading === order.id ? 'Marking ready…' : 'Mark as Ready'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
