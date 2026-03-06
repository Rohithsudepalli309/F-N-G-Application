import React, { useEffect, useState } from 'react';
import { TrendingUp, Package, IndianRupee, Store, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface DailyRow { date: string; orders: number; revenue: number }
interface TopStore { name: string; order_count: number; revenue: number }

export const AnalyticsPage: React.FC = () => {
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [topStores, setTopStores] = useState<TopStore[]>([]);
  const [stats, setStats] = useState({ ordersToday: 0, totalCustomers: 0, totalDrivers: 0, revenueToday: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [analyticsRes, statsRes] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/admin/stats'),
        ]);
        setDaily(analyticsRes.data.daily ?? []);
        setTopStores(analyticsRes.data.topStores ?? []);
        setStats(statsRes.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const metricCards = [
    { label: 'Orders Today', value: stats.ordersToday, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Revenue Today', value: `₹${(stats.revenueToday / 100).toLocaleString('en-IN')}`, icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Customers', value: stats.totalCustomers.toLocaleString(), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Active Drivers', value: stats.totalDrivers, icon: Store, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
        <p className="text-sm text-slate-500 mt-1">Revenue and performance overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metricCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-6">Revenue – Last 7 Days</h3>
        {daily.length === 0 ? (
          <p className="text-center text-slate-400 py-10 text-sm">No delivery data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <BarChart
              data={daily.map((r) => ({
                day: new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' }),
                revenue: Math.round(r.revenue / 100),
                orders: r.orders,
              }))}
              barCategoryGap="30%"
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`}
              />
              <Tooltip
                formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
                contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #f1f5f9' }}
              />
              <Bar dataKey="revenue" fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Stores */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Top Stores (Last 30 Days)</h3>
        <div className="space-y-3">
          {topStores.length === 0 && <p className="text-slate-400 text-sm">No data yet</p>}
          {topStores.map((store, idx) => (
            <div key={store.name} className="flex items-center space-x-4">
              <span className="w-6 h-6 bg-orange-50 text-orange-600 rounded-full text-xs font-black flex items-center justify-center">{idx + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{store.name}</p>
                <p className="text-xs text-slate-400">{store.order_count} orders</p>
              </div>
              <span className="text-sm font-bold text-emerald-600">
                ₹{(store.revenue / 100).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
