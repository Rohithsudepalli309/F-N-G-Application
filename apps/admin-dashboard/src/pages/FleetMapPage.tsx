import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, MapPin, RefreshCw, Activity, Navigation } from 'lucide-react';
import api from '../services/api';
import { socketService } from '../services/socket';

// Fix for default marker icons in Leaflet + React
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DriverIcon = L.divIcon({
  className: 'custom-driver-icon',
  html: `<div class="w-10 h-10 bg-orange-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white text-lg">🛵</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

interface DriverLocation {
  id: string;
  name: string;
  current_lat: number;
  current_lng: number;
  is_available: boolean;
  vehicle_type: string;
  last_seen_at: string;
}

// Helper to center map if fleet changes significantly
function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export const FleetMapPage = () => {
  const [drivers, setDrivers] = useState<Record<string, DriverLocation>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchFleet = async () => {
    try {
      const { data } = await api.get('/admin/drivers/locations');
      const fleetMap: Record<string, DriverLocation> = {};
      data.drivers.forEach((d: any) => {
        fleetMap[d.id] = d;
      });
      setDrivers(fleetMap);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to fetch fleet locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 30000); // Poll every 30s as fallback

    // Real-time updates via Socket
    socketService.on('fleet.location.updated', (data: any) => {
      setDrivers(prev => ({
        ...prev,
        [data.driverId]: {
          ...prev[data.driverId],
          current_lat: data.payload.lat,
          current_lng: data.payload.lng,
          last_seen_at: new Date().toISOString()
        }
      }));
      setLastUpdate(new Date());
    });

    return () => {
      clearInterval(interval);
      socketService.off('fleet.location.updated');
    };
  }, []);

  const driverList = Object.values(drivers);

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Navigation className="text-orange-500" />
            Live Fleet Monitor
          </h2>
          <p className="text-sm text-slate-500">Real-time oversight of all active delivery partners</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Last Updated</p>
            <p className="text-xs font-mono text-slate-600">{lastUpdate.toLocaleTimeString()}</p>
          </div>
          <button 
            onClick={fetchFleet}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 z-[1000] bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Activity className="animate-pulse text-orange-500" size={40} />
              <p className="text-sm font-bold text-slate-700">Connecting to Live Stream...</p>
            </div>
          </div>
        )}

        <MapContainer 
          center={[12.9716, 77.5946]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {driverList.map((driver) => (
            <Marker 
              key={driver.id} 
              position={[driver.current_lat, driver.current_lng]} 
              icon={DriverIcon}
            >
              <Popup className="custom-popup">
                <div className="p-2 min-w-[150px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600">
                      {driver.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-none">{driver.name}</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Available</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-500 border-t border-slate-100 pt-2">
                    <p className="flex justify-between"><span>Vehicle:</span> <span className="text-slate-700 font-medium capitalize">{driver.vehicle_type}</span></p>
                    <p className="flex justify-between"><span>Last Seen:</span> <span className="text-slate-700 font-medium">{new Date(driver.last_seen_at).toLocaleTimeString()}</span></p>
                  </div>
                  <button className="w-full mt-3 bg-slate-900 text-white py-1.5 rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-colors">
                    View Activity Log
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-2xl space-y-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fleet Status</h4>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <span className="w-3 h-3 bg-orange-500 rounded-full ring-2 ring-orange-200" />
              Active Partner ({driverList.length})
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <span className="w-3 h-3 bg-slate-300 rounded-full" />
              Offline / Inactive
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
