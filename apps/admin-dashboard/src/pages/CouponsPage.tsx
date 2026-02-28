import React, { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

interface Coupon {
  id: number;
  code: string;
  description: string;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  max_uses: number;
  used_count: number;
  valid_until: string | null;
  is_active: boolean;
}

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const CouponsPage: React.FC = () => {
  const { token } = useAuthStore() as any;
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'flat',
    discount_value: '',
    min_order_amount: '',
    max_discount: '',
    max_uses: '1000',
    valid_until: '',
  });

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/coupons`, { headers });
      const data = await res.json();
      setCoupons(data.coupons ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code || !form.discount_value) return;
    await fetch(`${API}/admin/coupons`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...form,
        discount_value: parseInt(form.discount_value),
        min_order_amount: parseInt(form.min_order_amount) || 0,
        max_discount: form.max_discount ? parseInt(form.max_discount) : undefined,
        max_uses: parseInt(form.max_uses) || 1000,
        valid_until: form.valid_until || undefined,
      }),
    });
    setShowForm(false);
    setForm({ code: '', description: '', discount_type: 'flat', discount_value: '', min_order_amount: '', max_discount: '', max_uses: '1000', valid_until: '' });
    load();
  };

  const deactivate = async (id: number) => {
    await fetch(`${API}/admin/coupons/${id}`, { method: 'DELETE', headers });
    load();
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Coupons & Offers</h2>
          <p className="text-sm text-slate-500 mt-1">Manage discount codes and promotional offers</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          <span>New Coupon</span>
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-800">Create Coupon</h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'code', label: 'Code', placeholder: 'FLAT100' },
                { key: 'description', label: 'Description', placeholder: '₹100 off on ₹299+' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
                  <input
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Type</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="flat">Flat (₹)</option>
                  <option value="percent">Percent (%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Value</label>
                <input
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  type="number" placeholder="100"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Min Order (₹)</label>
                <input
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                  type="number" placeholder="0"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Max Uses</label>
                <input
                  value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  type="number" placeholder="1000"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Valid Until</label>
                <input
                  value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={create} className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600">Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="animate-spin text-orange-500" size={28} />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expires', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {coupons.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400">No coupons yet</td></tr>
              )}
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800 flex items-center space-x-2">
                    <Tag size={14} className="text-orange-500" />
                    <span>{c.code}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${c.discount_type === 'flat' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                      {c.discount_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {c.discount_type === 'flat' ? `₹${c.discount_value / 100}` : `${c.discount_value}%`}
                  </td>
                  <td className="px-4 py-3 text-slate-500">₹{c.min_order_amount / 100}</td>
                  <td className="px-4 py-3 text-slate-500">{c.used_count}/{c.max_uses}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-IN') : '∞'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.is_active && (
                      <button onClick={() => deactivate(c.id)} className="text-red-400 hover:text-red-600 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
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
