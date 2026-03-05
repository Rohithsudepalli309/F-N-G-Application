import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  Star,
  RefreshCw,
  BarChart2,
} from 'lucide-react';
import api from '../services/api';

interface KpiData {
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
  avgRating: number | null;
  chart: { label: string; revenue: number; orders: number }[];
  topProducts: { name: string; units_sold: number; revenue: number }[];
}

const PERIODS = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
] as const;

const fmt = (v: number) => `₹${v.toLocaleString('en-IN')}`;

const KpiCard = ({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) => (
  <div className="card flex items-start gap-4">
    <div className={`p-2.5 rounded-xl bg-opacity-15 ${color}`}>
      <Icon size={22} strokeWidth={1.8} />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-100 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState<KpiData | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async (p: 'week' | 'month') => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/merchant/analytics?period=${p}`);
      setData(res);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(period); }, [period]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-400">Performance overview for your store</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                period === p.value
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-emerald-500" />
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <BarChart2 size={48} className="mb-3 opacity-30" />
          <p>Could not load analytics data</p>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={ShoppingBag}
              label="Orders Today"
              value={String(data.ordersToday)}
              sub={`${data.pendingOrders} pending`}
              color="text-emerald-400 bg-emerald-500"
            />
            <KpiCard
              icon={TrendingUp}
              label="Revenue Today"
              value={fmt(data.revenueToday)}
              color="text-sky-400 bg-sky-500"
            />
            <KpiCard
              icon={Clock}
              label="Pending Orders"
              value={String(data.pendingOrders)}
              sub="Awaiting accept / preparing"
              color="text-orange-400 bg-orange-500"
            />
            <KpiCard
              icon={Star}
              label="Avg Rating"
              value={data.avgRating != null ? data.avgRating.toFixed(1) : '—'}
              sub={data.avgRating ? 'Based on reviews' : 'No reviews yet'}
              color="text-yellow-400 bg-yellow-500"
            />
          </div>

          {/* Revenue chart */}
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wide">
              Revenue · {period === 'week' ? 'Last 7 Days' : 'This Month'}
            </h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.chart} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: number) => [fmt(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Orders chart */}
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wide">
              Orders · {period === 'week' ? 'Last 7 Days' : 'This Month'}
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.chart} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: number) => [value, 'Orders']}
                />
                <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Products */}
          {data.topProducts.length > 0 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wide">
                Top Products
              </h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-600 border-b border-slate-800">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium text-right">Units Sold</th>
                    <th className="pb-2 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.topProducts.map((p, i) => (
                    <tr key={p.name} className="text-slate-300">
                      <td className="py-2.5 text-slate-600">{i + 1}</td>
                      <td className="py-2.5">{p.name}</td>
                      <td className="py-2.5 text-right">{p.units_sold}</td>
                      <td className="py-2.5 text-right font-medium text-emerald-400">
                        {fmt(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
