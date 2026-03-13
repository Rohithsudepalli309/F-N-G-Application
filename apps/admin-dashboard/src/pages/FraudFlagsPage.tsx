import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, Trash2, User, Phone, Mail, Clock } from 'lucide-react';
import api from '../services/api';

interface FraudFlag {
  id: string;
  name: string;
  phone: string;
  email: string;
  fraud_flag: string;
  fraud_reason: string;
  created_at: string;
}

const FraudFlagsPage: React.FC = () => {
  const [flags, setFlags] = useState<FraudFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/fraud/flags');
      setFlags(res.data.flags || []);
    } catch (err) {
      setError('Failed to fetch fraud flags');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const dismissFlag = async (userId: string) => {
    try {
      await api.post(`/admin/fraud/dismiss/${userId}`);
      setFlags(flags.filter(f => f.id !== userId));
    } catch (err) {
      alert('Failed to dismiss flag');
    }
  };

  const deactivateUser = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { is_active: false });
      alert('User deactivated successfully');
      setFlags(flags.filter(f => f.id !== userId));
    } catch (err) {
      alert('Failed to deactivate user');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading suspicious records...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fraud & Security Flags</h1>
          <p className="text-gray-600 mt-1">Users flagged by the automated "Vulture Detection" algorithms.</p>
        </div>
        <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg flex items-center gap-2">
          <ShieldAlert size={20} />
          <span className="font-semibold">{flags.length} Active Flags</span>
        </div>
      </div>

      {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {flags.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900">All clear!</h3>
          <p className="text-gray-500">No active fraud flags currently detected.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flags.map((flag) => (
            <div key={flag.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{flag.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <Clock size={12} />
                      {new Date(flag.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  Flagged
                </div>
              </div>

              <div className="p-5 flex-grow space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={14} />
                  {flag.phone}
                </div>
                {flag.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} />
                    {flag.email}
                  </div>
                )}
                
                <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase">Reason</span>
                  <p className="text-sm text-gray-800 mt-1 italic">"{flag.fraud_reason}"</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 flex items-center gap-2 border-t border-gray-100">
                <button 
                  onClick={() => deactivateUser(flag.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md text-sm font-medium transition-colors"
                >
                  Block User
                </button>
                <button 
                  onClick={() => dismissFlag(flag.id)}
                  className="flex-1 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 py-2 px-3 rounded-md text-sm font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FraudFlagsPage;