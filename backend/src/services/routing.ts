import axios from 'axios';
import { logger } from '../logger';

/**
 * High-performance Routing Service for FNG Application.
 * Uses OSRM (Open Source Routing Machine) for traffic-aware (optional) road distance.
 * For production with heavy traffic, replace OSRM_URL with Google Distance Matrix API.
 */

const OSRM_URL = process.env.OSRM_API_URL || 'https://router.project-osrm.org';

interface RouteResult {
  distanceKm: number;
  durationMin: number;
}

/**
 * Calculates road distance and estimated time (duration) between two points.
 */
export async function getRoadDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): Promise<RouteResult> {
  try {
    // OSRM format: lng,lat;lng,lat
    const url = `${OSRM_URL}/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=false`;
    const { data } = await axios.get(url, { timeout: 3000 });

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000;
    // Duration is in seconds, convert to minutes
    const durationMin = Math.round(route.duration / 60);

    return { distanceKm, durationMin };
  } catch (err) {
    logger.warn('[RoutingService] OSRM failed, falling back to Haversine', { err: (err as Error).message });
    // Fallback to Haversine if service is down
    const hDist = haversineKm(lat1, lng1, lat2, lng2);
    // Rough estimate: 20km/h average city speed for fallback
    return { distanceKm: hDist, durationMin: Math.round((hDist / 20) * 60) };
  }
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
