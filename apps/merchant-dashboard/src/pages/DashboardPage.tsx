import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  Star,
  Store,
  RefreshCw,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../services/api';
import { useToast } from '../components/Toast';

interface StoreProfile {
  id: string;
  name: string;
  type: string;
  rating: number | null;
  is_active: boolean;
  image_url: string | null;
  owner_name: string;
}

interface KpiData {
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
  avgRating: number | null;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  customer_name: string;
  items_count: number;
}

const STATUS_COLOR: Record<string, string> = {
  placed:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  preparing: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ready:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const fmt = (v: number) => `₹${(v / 100).toLocaleString('en-IN')}`;

const timeAgo = (iso: string) => {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const { toast } = useToast();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [profileRes, analyticsRes, ordersRes] = await Promise.all([
        api.get('/merchant/profile'),
        api.get('/merchant/analytics?period=week'),
        api.get('/merchant/orders?limit=6'),
      ]);
      setStore(profileRes.data.store);
      const a = analyticsRes.data;
      setKpis({
        ordersToday: a.ordersToday,
        revenueToday: a.revenueToday,
        pendingOrders: a.pendingOrders,
        avgRating: a.avgRating,
      });
      setOrders(ordersRes.data.orders ?? []);
    } catch {
      // Silent fail — store stays null
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleToggleStore = async () => {
    if (!store) return;
    setToggling(true);
    try {
      const { data } = await api.patch('/merchant/store/toggle');
      setStore((s) => s ? { ...s, is_active: data.store.is_active } : s);
      toast('success', data.store.is_active ? 'Store is now open.' : 'Store is now closed.');
    } catch {
      toast('error', 'Could not update store status.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw size={28} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  const kpiCards = [
    {
      label: 'Orders Today',
      value: String(kpis?.ordersToday ?? 0),
      icon: ShoppingBag,
      color: 'text-blue-400 bg-blue-500/15',
    },
    {
      label: 'Revenue Today',
      value: fmt(kpis?.revenueToday ?? 0),
      icon: TrendingUp,
      color: 'text-emerald-400 bg-emerald-500/15',
    },
    {
      label: 'Pending Orders',
      value: String(kpis?.pendingOrders ?? 0),
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/15',
    },
    {
      label: 'Avg Rating',
      value: kpis?.avgRating ? kpis.avgRating.toFixed(1) : '—',
      icon: Star,
      color: 'text-yellow-400 bg-yellow-500/15',
    },
  ];

  const actionOrders = orders.filter((o) => o.status === 'placed' || o.status === 'preparing');

  return (
    <div className="p-6 space-y-7 animate-fade-in">

      {/* ── Store Status Banner ─────────────────────────────────────── */}
      {store && (
        <div className="card flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            {store.image_url ? (
              <img
                src={store.image_url}
                alt={store.name}
                className="w-14 h-14 rounded-xl object-cover border border-slate-700"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                <Store size={26} className="text-slate-500" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-100">{store.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5 capitalize">{store.type ?? 'Restaurant'}</p>
            </div>
          </div>

          <button
            onClick={handleToggleStore}
            disabled={toggling}
            className={clsx(
              'flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all border disabled:opacity-60',
              store.is_active
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
            )}
          >
            {toggling ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : store.is_active ? (
              <ToggleRight size={20} className="text-emerald-500" />
            ) : (
              <ToggleLeft size={20} />
            )}
            {store.is_active ? 'Store is Open' : 'Store is Closed'}
          </button>
        </div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card flex items-start gap-3">
            <div className={`p-2.5 rounded-xl ${color}`}>
              <Icon size={20} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{label}</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pending / Active Orders ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            Orders Needing Action
          </h3>
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center gap-1 text-emerald-400 text-xs font-medium hover:text-emerald-300 transition-colors"
          >
            View All <ArrowRight size={13} />
          </button>
        </div>

        {actionOrders.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-12 text-slate-500">
            <CheckCircle size={36} className="mb-2 text-emerald-600 opacity-50" />
            <p className="font-medium">All caught up!</p>
            <p className="text-xs mt-1">No orders pending action right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {actionOrders.map((order) => (
              <div
                key={order.id}
                className="card flex items-center justify-between gap-3 flex-wrap cursor-pointer hover:border-slate-600 transition-colors"
                onClick={() => navigate('/orders')}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold text-slate-200 text-sm">{order.id}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.customer_name ?? 'Customer'} · {order.items_count ?? '?'} item{order.items_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={clsx(
                    'px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border',
                    STATUS_COLOR[order.status] ?? 'bg-slate-800 text-slate-400 border-slate-700'
                  )}>
                    {order.status}
                  </span>
                  <span className="text-slate-300 font-semibold text-sm">{fmt(order.total_amount)}</span>
                  <span className="text-slate-600 text-xs">{timeAgo(order.created_at)}</span>
                  <ArrowRight size={14} className="text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Links ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Manage Menu',      sub: 'Add, edit & toggle products', path: '/menu',      icon: ShoppingBag },
          { label: 'All Orders',        sub: 'View full order queue',        path: '/orders',    icon: Clock },
          { label: 'Analytics',         sub: 'Revenue trends & top items',   path: '/analytics', icon: TrendingUp },
        ].map(({ label, sub, path, icon: Icon }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="card flex items-center gap-4 text-left hover:border-slate-600 transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-slate-800 text-slate-400 group-hover:bg-emerald-500/15 group-hover:text-emerald-400 transition-all">
              <Icon size={18} strokeWidth={1.8} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-200 text-sm">{label}</p>
              <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
            </div>
            <ArrowRight size={15} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
