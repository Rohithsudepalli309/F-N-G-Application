import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Area, AreaChart,
} from 'recharts';
import { ShoppingBag, Users, Truck, IndianRupee, TrendingUp } from 'lucide-react';
import api from '../services/api';

const KPI_CONFIG = [
  {
    label: 'Total Orders',
    key: 'totalOrders',
    icon: ShoppingBag,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-l-blue-500',
    badge: 'bg-blue-500/10 text-blue-600',
    delay: 'delay-100',
  },
  {
    label: 'Active Orders',
    key: 'activeOrders',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-600',
    delay: 'delay-200',
  },
  {
    label: 'Active Drivers',
    key: 'activeDrivers',
    icon: Truck,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-l-orange-500',
    badge: 'bg-orange-500/10 text-orange-600',
    delay: 'delay-300',
  },
  {
    label: 'Daily Revenue',
    key: 'dailyRevenue',
    icon: IndianRupee,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-l-purple-500',
    badge: 'bg-purple-500/10 text-purple-600',
    delay: 'delay-400',
    format: (v: number) => `₹${(v / 100).toLocaleString('en-IN')}`,
  },
];

const DEMO_STATS = {
  totalOrders: 1250,
  activeOrders: 42,
  activeDrivers: 15,
  dailyRevenue: 854000,
  chartData: [
    { name: 'Mon', orders: 120, revenue: 48000 },
    { name: 'Tue', orders: 150, revenue: 62000 },
    { name: 'Wed', orders: 180, revenue: 74000 },
    { name: 'Thu', orders: 200, revenue: 89000 },
    { name: 'Fri', orders: 250, revenue: 110000 },
    { name: 'Sat', orders: 300, revenue: 145000 },
    { name: 'Sun', orders: 280, revenue: 126000 },
  ],
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

import { DashboardMap } from '../components/DashboardMap';

export const Dashboard = () => {
  const [stats, setStats] = useState(DEMO_STATS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/analytics/stats');
        setStats(data);
      } catch {
        // Use demo data — backend not connected yet
      } finally {
        setLoaded(true);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Page Title */}
      <div className={`animate-fade-in ${loaded ? 'opacity-100' : ''}`}>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-0.5">Real-time overview of platform activity</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {KPI_CONFIG.map((kpi) => {
          const rawValue = stats[kpi.key as keyof typeof stats] as number;
          const displayValue = kpi.format ? kpi.format(rawValue) : rawValue;
          const Icon = kpi.icon;

          return (
            <div
              key={kpi.key}
              className={`bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 ${kpi.border} p-6 animate-fade-in ${kpi.delay} hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-slate-500 font-medium">{kpi.label}</span>
                <div className={`w-9 h-9 ${kpi.bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={18} className={kpi.color} />
                </div>
              </div>
              <div className={`text-2xl font-bold text-slate-800 animate-count ${kpi.delay}`}>
                {displayValue}
              </div>
              <div className={`mt-2 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${kpi.badge}`}>
                Live data
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Command Center (Map) */}
      <div className="animate-slide-up delay-150">
        <DashboardMap />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Orders Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-slide-up delay-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-800">Orders Trend</h3>
            <span className="text-xs bg-blue-50 text-blue-600 font-medium px-2.5 py-1 rounded-full">This Week</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="orders" fill="#FF5200" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Growth */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-slide-up delay-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-800">Revenue Growth</h3>
            <span className="text-xs bg-purple-50 text-purple-600 font-medium px-2.5 py-1 rounded-full">INR (paisa)</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#8b5cf6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
