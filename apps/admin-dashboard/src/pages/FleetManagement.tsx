import React, { useEffect, useState } from 'react';
import { Truck, MapPin, Shield, Phone, Activity, X } from 'lucide-react';
import api from '../services/api';

interface Driver {
  id: string;
  name: string;
  phone: string;
  isOnline: boolean;
  kycStatus: 'not_started' | 'pending' | 'verified' | 'rejected';
  kycDocumentUrl?: string;
  kycLicenseNumber?: string;
  deliveryStatus: string | null;
  activeOrderId: string | null;
  lastLat: number | null;
  lastLng: number | null;
}

export const FleetManagement = () => {
  const [fleet, setFleet] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchFleet = async () => {
    try {
      const { data } = await api.get('/analytics/fleet');
      setFleet(data);
    } catch (err) {
      console.error('Failed to fetch fleet:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFleet(); }, []);

  const handleKycUpdate = async (driverId: string, status: 'verified' | 'rejected', reason?: string) => {
    try {
      await api.patch(`/admin/drivers/${driverId}/kyc`, { status, reason });
      fetchFleet();
      setSelectedDriver(null);
    } catch (err) {
      console.error('Failed to update KYC:', err);
      alert('Failed to update KYC status');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      await api.post('/admin/drivers', { name: formName, phone: formPhone, password: formPassword });
      setShowForm(false);
      setFormName('');
      setFormPhone('');
      setFormPassword('');
      setLoading(true);
      fetchFleet();
    } catch (err: any) {
      setFormError(err?.response?.data?.error ?? 'Failed to register driver');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fleet Management</h2>
          <p className="text-sm text-slate-500">Monitor and manage your delivery partners</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError(''); }}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Truck size={16} />
          Register New Driver
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">Register New Driver</h3>
              <button onClick={() => setShowForm(false)} aria-label="Close registration modal" title="Close registration modal" className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Min. 6 characters"
                />
              </div>
              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{formError}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                  {submitting ? 'Registering...' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Review Driver KYC: {selectedDriver.name}</h3>
              <button onClick={() => setSelectedDriver(null)} aria-label="Close KYC review" title="Close KYC review" className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group">
                  {selectedDriver.kycDocumentUrl ? (
                    <img src={selectedDriver.kycDocumentUrl} alt="KYC Document" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Shield size={32} />
                      <p className="text-sm">No document uploaded</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">License Number</p>
                  <p className="font-mono text-slate-700 text-sm">{selectedDriver.kycLicenseNumber || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Decision Required</h4>
                  <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    Verify the license number matches the image and check for expiry dates. 
                    Approving will allow this driver to accept orders.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleKycUpdate(selectedDriver.id, 'verified')}
                      className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Shield size={18} /> Approve & Verify
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Enter rejection reason:');
                        if (reason) handleKycUpdate(selectedDriver.id, 'rejected', reason);
                      }}
                      className="w-full bg-white text-rose-600 border border-rose-200 py-3 rounded-xl font-bold hover:bg-rose-50 transition-colors"
                    >
                      Reject Documentation
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center mt-6 italic">
                  Driver will be notified of the decision via push notification.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}


      {loading ? (
        <div className="bg-white p-12 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-slate-400">
           <Activity className="animate-pulse mb-2" size={32} />
           <p>Loading fleet data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 text-fng">
          {fleet.map((driver) => (
            <div key={driver.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-slate-50">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-lg">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{driver.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Phone size={12} />
                        {driver.phone}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      driver.isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                      {driver.isOnline ? 'Online' : 'Offline'}
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ring-1 ${
                      driver.kycStatus === 'verified' ? 'bg-blue-50 text-blue-600 ring-blue-100' : 
                      driver.kycStatus === 'pending' ? 'bg-orange-50 text-orange-600 ring-orange-100 animate-pulse' : 
                      'bg-slate-50 text-slate-400 ring-slate-100'
                    }`}>
                      KYC: {driver.kycStatus}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2 text-slate-600">
                      <Shield size={16} className="text-slate-400" />
                      Status
                   </div>
                   <span className={`font-medium ${driver.deliveryStatus ? 'text-orange-600' : 'text-emerald-600'}`}>
                     {driver.deliveryStatus ? `Active (${driver.deliveryStatus})` : 'Idle'}
                   </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                   <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={16} className="text-slate-400" />
                      Location
                   </div>
                   {driver.lastLat && driver.lastLng ? (
                     <a
                       href={`https://maps.google.com/?q=${driver.lastLat},${driver.lastLng}`}
                       target="_blank"
                       rel="noreferrer"
                       className="text-blue-600 hover:underline"
                     >
                       {driver.lastLat.toFixed(4)}, {driver.lastLng.toFixed(4)}
                     </a>
                   ) : (
                     <span className="text-slate-500">Unknown</span>
                   )}
                </div>

                {driver.activeOrderId && (
                  <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-blue-700 font-medium">Active Order</span>
                    <span className="text-xs font-bold text-blue-800">{driver.activeOrderId}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSelectedDriver(driver)}
                    className="py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-100 transition-colors border border-indigo-100 flex items-center justify-center gap-1.5"
                  >
                    <Shield size={14} /> KYC Review
                  </button>
                  <button className="py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-100">
                    Full Tracking
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
