import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Search, AlertTriangle } from 'lucide-react';
import api from '../services/api';

interface Entity {
  id: string;
  name: string;
  email?: string;
  role?: string;
  is_active: boolean;
  is_verified?: boolean;
  kyc_status?: string;
  metadata?: any;
  type?: string; 
}

interface Props {
  type: 'users' | 'stores' | 'drivers';
}

export const ManagementPage = ({ type }: Props) => {
  const [items, setItems] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      setPage(0);
      try {
        const { data } = await api.get(`/admin/${type}`);
        setItems(data[type] ?? data.users ?? data.stores ?? []);
      } catch {
        setError(`Failed to load ${type}. Check your network or admin permissions.`);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [type]);

  const toggleStatus = async (item: Entity) => {
    const confirmMessage = `Are you sure you want to ${item.is_active ? 'DISABLE' : 'ENABLE'} this ${type.slice(0, -1)}?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const url = type === 'users' ? `/admin/users/${item.id}/status` : `/admin/${type}/${item.id}`;
      await api.patch(url, { is_active: !item.is_active });
      setItems((prev: Entity[]) => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    } catch (err) {
      alert('Action failed. Ensure you have admin permissions.');
    }
  };

  const handleKYC = async (item: Entity, status: 'verified' | 'rejected') => {
    const reason = status === 'rejected' ? window.prompt('Reason for rejection:') : null;
    if (status === 'rejected' && reason === null) return;

    try {
      await api.patch(`/admin/${type}/${item.id}/kyc`, { status, reason });
      setItems((prev: Entity[]) => prev.map(i => i.id === item.id ? { ...i, kyc_status: status, is_verified: status === 'verified' } : i));
    } catch (err) {
      alert('KYC update failed.');
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = filteredItems.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold capitalize">{type} Management</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={`Search ${type}...`}
            className="pl-10 pr-4 py-2 border rounded-lg focus:ring-slate-500 focus:border-slate-500"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th className="px-6 py-4">Info</th>
              {type === 'stores' && <th className="px-6 py-4">Type</th>}
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : pagedItems.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No results found</td></tr>
            ) : pagedItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-800">{item.name}</div>
                    {item.metadata?.fraud_flag === "true" && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 rounded font-bold animate-pulse">FRAUD RISK</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{item.email || item.id}</div>
                </td>
                {type === 'stores' && <td className="px-6 py-4 text-sm text-gray-600">{item.type}</td>}
                <td className="px-6 py-4">
                  {item.is_active ? (
                    <span className="flex items-center text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded w-fit uppercase">
                      <ShieldCheck size={14} className="mr-1" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded w-fit uppercase">
                      <ShieldAlert size={14} className="mr-1" /> Disabled
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => toggleStatus(item)}
                      className={`px-3 py-1.5 text-[10px] font-bold rounded transition-colors border ${
                        item.is_active 
                          ? 'text-red-600 border-red-100 hover:bg-red-50' 
                          : 'text-green-600 border-green-100 hover:bg-green-50'
                      }`}
                    >
                      {item.is_active ? 'DEACTIVATE' : 'ACTIVATE'}
                    </button>
                    {(type === 'stores' || type === 'drivers') && item.kyc_status === 'pending' && (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleKYC(item, 'verified')}
                          className="flex-1 bg-emerald-600 text-white text-[9px] font-bold py-1 rounded"
                        >
                          APPROVE
                        </button>
                        <button 
                          onClick={() => handleKYC(item, 'rejected')}
                          className="flex-1 bg-red-600 text-white text-[9px] font-bold py-1 rounded"
                        >
                          REJECT
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-gray-500">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filteredItems.length)} of {filteredItems.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
