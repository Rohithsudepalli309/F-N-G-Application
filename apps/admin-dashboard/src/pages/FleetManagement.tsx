import React, { useEffect, useState } from 'react';
import { Truck, MapPin, Shield, Phone, Activity } from 'lucide-react';
import api from '../services/api';

interface Driver {
  id: string;
  name: string;
  phone: string;
  isOnline: boolean;
  deliveryStatus: string | null;
  activeOrderId: string | null;
  lastLat: number | null;
  lastLng: number | null;
}

export const FleetManagement = () => {
  const [fleet, setFleet] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchFleet();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fleet Management</h2>
          <p className="text-sm text-slate-500">Monitor and manage your delivery partners</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2">
          <Truck size={16} />
          Register New Driver
        </button>
      </div>

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
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    driver.isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {driver.isOnline ? 'Online' : 'Offline'}
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
                   <span className="text-slate-500">
                     {driver.lastLat ? `${driver.lastLat.toFixed(4)}, ${driver.lastLng?.toFixed(4)}` : 'Unknown'}
                   </span>
                </div>

                {driver.activeOrderId && (
                  <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-xs text-blue-700 font-medium">Active Order</span>
                    <span className="text-xs font-bold text-blue-800">{driver.activeOrderId}</span>
                  </div>
                )}

                <button className="w-full py-2 bg-slate-50 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors border border-slate-100">
                  View Full Tracking
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
