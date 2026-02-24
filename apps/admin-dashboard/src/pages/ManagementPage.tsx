import React, { useEffect, useState } from 'react';
import { ShieldCheck, ShieldAlert, Search } from 'lucide-react';
import api from '../services/api';

interface Entity {
  id: string;
  name: string;
  email?: string;
  role?: string;
  is_active: boolean;
  type?: string; 
}

interface Props {
  type: 'users' | 'stores' | 'drivers';
}

export const ManagementPage = ({ type }: Props) => {
  const [items, setItems] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/admin/${type}`);
        setItems(data);
      } catch (err) {
        console.error(`Failed to fetch ${type}`);
        // Mock data for demo
        setItems([
          { id: '1', name: `Demo ${type.slice(0, -1)} 1`, email: 'demo1@test.com', is_active: true, type: 'Restaurant' },
          { id: '2', name: `Demo ${type.slice(0, -1)} 2`, email: 'demo2@test.com', is_active: false, type: 'Grocery' },
        ]);
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
      await api.patch(`/admin/${type}/${item.id}`, { is_active: !item.is_active });
      setItems((prev: Entity[]) => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    } catch (err) {
      alert('Action failed. Ensure you have admin permissions.');
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No results found</td></tr>
            ) : filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-gray-800">{item.name}</div>
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
                  <button 
                    onClick={() => toggleStatus(item)}
                    className={`px-4 py-2 text-xs font-bold rounded transition-colors ${
                      item.is_active 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {item.is_active ? 'DISABLE' : 'ENABLE'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
