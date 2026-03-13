import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Package, IndianRupee, Store, Loader2, RefreshCw, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface DailyRow { date: string; orders: number; revenue: number }
interface TopStore { name: string; order_count: number; revenue: number }

export const AnalyticsPage: React.FC = () => {
  const [daily, setDaily] = useState<DailyRow[]>([]);
  const [topStores, setTopStores] = useState<TopStore[]>([]);
  const [stats, setStats] = useState({ ordersToday: 0, totalCustomers: 0, totalDrivers: 0, revenueToday: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      const qs = params.toString();

      const [analyticsRes, statsRes, adminStatsRes] = await Promise.all([
        api.get(`/admin/analytics${qs ? `?${qs}` : ''}`),
        api.get(`/analytics/stats${qs ? `?${qs}` : ''}`),
        api.get('/admin/stats'),
      ]);
      setDaily(statsRes.data.chartData ?? analyticsRes.data.daily ?? []);
      setTopStores(analyticsRes.data.topStores ?? []);
      setStats({
        ordersToday: statsRes.data.totalOrders ?? statsRes.data.ordersToday ?? 0,
        totalCustomers: adminStatsRes.data.totalCustomers ?? statsRes.data.totalCustomers ?? 0,
        totalDrivers: statsRes.data.activeDrivers ?? statsRes.data.totalDrivers ?? 0,
        revenueToday: statsRes.data.dailyRevenue ?? statsRes.data.revenueToday ?? 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => { fetchData(false); }, [fetchData]);

  const exportCsv = async () => {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const qs = params.toString();
    const res = await api.get(`/analytics/export/orders${qs ? `?${qs}` : ''}`, {
      responseType: 'blob',
    });
    const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'fng-orders.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">Revenue and performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
            aria-label="Start date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
            aria-label="End date"
          />
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            <Download size={13} />
            Export CSV
          </button>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
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
