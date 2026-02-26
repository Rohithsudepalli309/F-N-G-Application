import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { socketService } from '../services/socket';
import api from '../services/api';

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
  html: `<div class="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">🛵</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

interface DriverLocation {
  id: string;
  lat: number;
  lng: number;
  name: string;
  orderId?: string;
}

interface HeatPoint {
  lat: number;
  lng: number;
}

export const DashboardMap = () => {
  const [drivers, setDrivers] = useState<Record<string, DriverLocation>>({});
  const [heatmap, setHeatmap] = useState<HeatPoint[]>([]);

  useEffect(() => {
    // 1. Fetch initial heatmap and fleet data
    const initMapData = async () => {
      try {
        const [heatRes, fleetRes] = await Promise.all([
          api.get('/analytics/heatmap'),
          api.get('/analytics/fleet')
        ]);
        setHeatmap(heatRes.data);
        
        // Map fleet to drivers object
        const fleetMap: Record<string, DriverLocation> = {};
        fleetRes.data.forEach((d: any) => {
          if (d.lastLat && d.lastLng) {
            fleetMap[d.id] = {
              id: d.id,
              lat: d.lastLat,
              lng: d.lastLng,
              name: d.name,
              orderId: d.activeOrderId
            };
          }
        });
        setDrivers(fleetMap);
      } catch (err) {
        console.error('Failed to load map data:', err);
      }
    };

    initMapData();

    // 2. Listen for real-time location updates
    socketService.on('fleet.location.updated', (data: any) => {
      setDrivers(prev => ({
        ...prev,
        [data.driverId]: {
          ...prev[data.driverId],
          id: data.driverId,
          lat: data.payload.lat,
          lng: data.payload.lng
        }
      }));
    });

    return () => {
      socketService.off('fleet.location.updated');
    };
  }, []);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800">Live Command Center</h3>
        <div className="flex gap-4 text-xs">
           <div className="flex items-center gap-1.5 text-emerald-600">
             <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> Active Drivers
           </div>
           <div className="flex items-center gap-1.5 text-orange-600">
             <span className="w-2 h-2 bg-orange-500 rounded-full"></span> Demand Hotspots
           </div>
        </div>
      </div>
      
      <div className="h-[450px] rounded-lg border border-slate-100 overflow-hidden relative">
        <MapContainer 
          center={[12.9716, 77.5946]} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Demand Heatmap clusters (simulated via CircleMarkers) */}
          {heatmap.map((point, idx) => (
            <CircleMarker
              key={`heat-${idx}`}
              center={[point.lat, point.lng]}
              radius={15}
              pathOptions={{ fillColor: '#FF5200', fillOpacity: 0.2, color: 'transparent' }}
            />
          ))}

          {/* Live Driver Markers */}
          {Object.values(drivers).map((driver) => (
            <Marker 
              key={driver.id} 
              position={[driver.lat, driver.lng]} 
              icon={DriverIcon}
            >
              <Popup>
                <div className="text-xs p-1">
                  <p className="font-bold">{driver.name}</p>
                  <p className="text-slate-500 mt-1">Status: Delivering</p>
                  {driver.orderId && <p className="text-blue-600">Order: {driver.orderId}</p>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
