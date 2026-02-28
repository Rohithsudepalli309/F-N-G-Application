import React, { useEffect, useState } from 'react';
import { Wallet, CheckCircle, Clock, Loader2, Download } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface DriverPayout {
  driver_id: number;
  driver_name: string;
  phone: string;
  total_deliveries: number;
  gross_earnings: number;
  platform_commission: number;
  net_payout: number;
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const PayoutsPage: React.FC = () => {
  const { token } = useAuthStore() as any;
  const [payouts, setPayouts] = useState<DriverPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/admin/payouts?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPayouts(data.payouts ?? []);
        } else {
          // Endpoint not yet implemented — show empty state
          setPayouts([]);
        }
      } catch {
        setPayouts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [period]);

  const totalNet = payouts.reduce((sum, p) => sum + p.net_payout, 0);
  const totalGross = payouts.reduce((sum, p) => sum + p.gross_earnings, 0);

  const exportCSV = () => {
    const header = 'Driver,Phone,Deliveries,Gross Earnings,Commission,Net Payout\n';
    const rows = payouts.map((p) =>
      `${p.driver_name},${p.phone},${p.total_deliveries},${p.gross_earnings / 100},${p.platform_commission / 100},${p.net_payout / 100}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Driver Payouts</h2>
          <p className="text-sm text-slate-500 mt-1">Manage and track driver earnings</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-slate-100 rounded-xl p-1 text-xs font-semibold">
            {(['week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-all ${period === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {p === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
          <button
            onClick={exportCSV}
            disabled={payouts.length === 0}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Drivers', value: payouts.length, icon: Wallet, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Gross Earnings', value: `₹${(totalGross / 100).toLocaleString('en-IN')}`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Net Payouts', value: `₹${(totalNet / 100).toLocaleString('en-IN')}`, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-orange-500" size={28} />
          </div>
        ) : payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 text-slate-400">
            <Wallet size={36} className="opacity-30" />
            <p className="text-sm font-medium">No payout data for this period</p>
            <p className="text-xs text-slate-300">Payouts are calculated from delivered orders</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Driver', 'Phone', 'Deliveries', 'Gross Earnings', 'Commission (10%)', 'Net Payout', 'Action'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {payouts.map((p) => (
                <tr key={p.driver_id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{p.driver_name}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.phone}</td>
                  <td className="px-4 py-3 text-slate-700">{p.total_deliveries}</td>
                  <td className="px-4 py-3 text-slate-700">₹{(p.gross_earnings / 100).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-red-500">- ₹{(p.platform_commission / 100).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-bold text-emerald-600">₹{(p.net_payout / 100).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg font-semibold transition-colors">
                      Mark Paid
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
