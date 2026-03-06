import React, { useEffect, useState } from 'react';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';

interface Order {
  id: string;
  customer_name: string;
  store_name: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export const OrdersMonitor = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const token = useAuthStore((state: any) => state.token);

  const fetchOrders = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get('/admin/orders?limit=50');
      setOrders(data.orders ?? []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch orders');
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);

    // Auto-refresh every 60s as socket fallback
    const interval = setInterval(() => fetchOrders(true), 60_000);

    // Setup Socket connection for live updates
    if (token) {
      socketService.connect(token);
      
      socketService.on('order.platform.update', (updatedOrder: Order) => {
        setOrders((prev: Order[]) => {
          const index = prev.findIndex((o: Order) => o.id === updatedOrder.id);
          if (index !== -1) {
            const next = [...prev];
            next[index] = updatedOrder;
            return next;
          }
          return [updatedOrder, ...prev];
        });
        setLastRefreshed(new Date());
      });
    }

    return () => {
      clearInterval(interval);
      socketService.off('order.platform.update');
    };
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'placed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Live Orders Monitor</h3>
          {lastRefreshed && (
            <p className="text-xs text-gray-400 mt-0.5">
              Updated {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchOrders(false)}
            disabled={refreshing}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <span className="flex items-center text-sm text-green-600 font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Live Feed Active
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Order ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Store</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No active orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">#{order.id.slice(0, 8)}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{order.customer_name}</td>
                  <td className="px-6 py-4 text-gray-600">{order.store_name}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">₹{order.total_amount / 100}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
