import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Search, Filter, MessageSquare, History, CreditCard, ExternalLink, RefreshCcw } from 'lucide-react';
import api from '../services/api';
import { useToast } from 'components/Toast';

interface Dispute {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  storeName: string;
  reason: string;
  description: string;
  amount: number;
  status: 'pending' | 'resolved' | 'rejected';
  resolutionNote?: string;
  createdAt: string;
}

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved' | 'rejected'>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [refunding, setRefunding] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      // Assuming endpoint exists or will be added to backend/src/routes/admin.ts
      const { data } = await api.get('/admin/disputes');
      setDisputes(data);
    } catch {
      // Mock data for initial UI if endpoint doesn't exist yet
      setDisputes([
        {
          id: 'DSP-101',
          orderId: 'ORD-7721',
          userId: 'usr_1',
          userName: 'John Doe',
          storeName: 'Burger King',
          reason: 'Missing Items',
          description: 'The fries were missing from my combo meal.',
          amount: 12.50,
          status: 'pending',
          createdAt: new Date().toISOString()
        },
        {
          id: 'DSP-102',
          orderId: 'ORD-8812',
          userId: 'usr_2',
          userName: 'Sarah Jenkins',
          storeName: 'Walmart Grocery',
          reason: 'Quality Issue',
          description: 'Apples were bruised and expired.',
          amount: 8.20,
          status: 'resolved',
          resolutionNote: 'Refund issued to original payment method.',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string, action: 'resolve' | 'reject') => {
    setRefunding(true);
    try {
      await api.post(`/admin/disputes/${id}/${action}`, { note: resolutionNote });
      toast('success', `Dispute ${action === 'resolve' ? 'resolved' : 'rejected'} successfully.`);
      setSelectedDispute(null);
      setResolutionNote('');
      fetchDisputes();
    } catch {
      toast('error', 'Operation failed.');
    } finally {
      setRefunding(false);
    }
  };

  const filtered = disputes.filter(d => {
    const matchesSearch = d.orderId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         d.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || d.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Disputes & Refunds</h1>
          <p className="text-sm text-slate-400 mt-1">Manage customer complaints and process partial or full refunds.</p>
        </div>
        <button 
          onClick={fetchDisputes}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700"
        >
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List View */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text"
                placeholder="Search by Order ID or Customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border-none rounded-xl pl-12 pr-4 py-2.5 text-sm outline-none focus:ring-2 ring-emerald-500/50"
              />
            </div>
            <select 
              aria-label="Filter disputes by status"
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="bg-slate-950 border-none rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer border border-slate-700"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-3">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-24 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />)
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-dashed border-slate-800">
                <AlertCircle className="mx-auto text-slate-600 mb-2" size={32} />
                <p className="text-slate-500">No disputes found matching your criteria.</p>
              </div>
            ) : (
              filtered.map(dispute => (
                <div 
                  key={dispute.id}
                  onClick={() => setSelectedDispute(dispute)}
                  className={`p-4 bg-slate-900 border transition-all cursor-pointer rounded-2xl flex items-center justify-between group h-full ${
                    selectedDispute?.id === dispute.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-emerald-500 uppercase font-bold tracking-tighter">#{dispute.id}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-slate-400">
                        {dispute.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">{dispute.storeName} — {dispute.reason}</h3>
                    <p className="text-xs text-slate-500">{dispute.userName} • Order {dispute.orderId}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-100">${dispute.amount.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-600 font-medium">{new Date(dispute.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedDispute ? (
            <div className="sticky top-6 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col h-fit animate-slide-up">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-lg font-bold text-slate-100 mb-1">Dispute Details</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono">{selectedDispute.orderId}</span>
                  <span>•</span>
                  <span>{new Date(selectedDispute.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="p-6 space-y-6 flex-1">
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-widest block mb-2">Issue Description</label>
                  <div className="p-4 bg-slate-950 rounded-2xl text-sm text-slate-300 italic leading-relaxed">
                    "{selectedDispute.description}"
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 rounded-2xl space-y-1 text-center">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block">Claim Amount</label>
                    <span className="text-lg font-bold text-emerald-400">${selectedDispute.amount.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl space-y-1 text-center">
                    <label className="text-[10px] font-medium text-slate-500 uppercase block">Order Total</label>
                    <span className="text-lg font-bold text-slate-100">$45.00</span>
                  </div>
                </div>

                {selectedDispute.status === 'pending' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-slate-400 block mb-2">Internal Notes / Resolution Basis</label>
                      <textarea 
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 outline-none focus:ring-2 ring-emerald-500/50 resize-none h-24"
                        placeholder="Why are you taking this action?"
                        value={resolutionNote}
                        onChange={e => setResolutionNote(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleResolve(selectedDispute.id, 'reject')}
                        disabled={refunding || !resolutionNote}
                        className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button 
                         onClick={() => handleResolve(selectedDispute.id, 'resolve')}
                         disabled={refunding || !resolutionNote}
                         className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                      >
                        Approve Refund
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                     <div className="flex items-center gap-2 text-slate-100 font-bold text-xs mb-2">
                       <CheckCircle2 size={14} className="text-emerald-500" /> Resolution Note
                     </div>
                     <p className="text-sm text-slate-400 italic">"{selectedDispute.resolutionNote || 'No notes provided.'}"</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-3xl p-12 text-center text-slate-600">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">Select a dispute from the list to view full details and take action.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
