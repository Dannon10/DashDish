import { supabase } from '../services/supabase';
import { DriverLocation } from '../types/driver.types';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN!;
const DIRECTIONS_BASE = 'https://api.mapbox.com/directions/v5/mapbox/driving';
const GEOCODING_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

// Types

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface RouteResult {
    coordinates: [number, number][];
    durationSeconds: number;
    distanceMeters: number;
}

export interface GeocodingResult {
    placeName: string;
    coordinates: Coordinates;
}

// Directions 
export async function getRoute(
    origin: Coordinates,
    destination: Coordinates
): Promise<RouteResult | null> {
    try {
        const url =
            `${DIRECTIONS_BASE}/` +
            `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` +
            `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Directions API error: ${res.status}`);

        const data = await res.json();
        const route = data.routes?.[0];
        if (!route) return null;

        return {
            coordinates: route.geometry.coordinates as [number, number][],
            durationSeconds: route.duration,
            distanceMeters: route.distance,
        };
    } catch (err) {
        console.error('[mapbox] getRoute error:', err);
        return null;
    }
}

// Geocoding
export async function forwardGeocode(
    address: string
): Promise<GeocodingResult | null> {
    try {
        const encoded = encodeURIComponent(address);
        const url = `${GEOCODING_BASE}/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Geocoding API error: ${res.status}`);

        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature) return null;

        const [lng, lat] = feature.center;
        return {
            placeName: feature.place_name,
            coordinates: { lat, lng },
        };
    } catch (err) {
        console.error('[mapbox] forwardGeocode error:', err);
        return null;
    }
}

export async function reverseGeocode(
    coords: Coordinates
): Promise<GeocodingResult | null> {
    try {
        const url =
            `${GEOCODING_BASE}/${coords.lng},${coords.lat}.json` +
            `?access_token=${MAPBOX_TOKEN}&limit=1`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Reverse geocoding API error: ${res.status}`);

        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature) return null;

        const [lng, lat] = feature.center;
        return {
            placeName: feature.place_name,
            coordinates: { lat, lng },
        };
    } catch (err) {
        console.error('[mapbox] reverseGeocode error:', err);
        return null;
    }
}

// Real-time Driver Location 
export function subscribeToDriverLocation(
    driverId: string,
    onUpdate: (location: DriverLocation) => void
): () => void {
    const channel = supabase
        .channel(`driver_location:${driverId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'driver_locations',
                filter: `driver_id=eq.${driverId}`,
            },
            (payload) => {
                const updated = payload.new as DriverLocation;
                onUpdate(updated);
            }
        )
        .subscribe();

    // Return an unsubscribe function
    return () => {
        supabase.removeChannel(channel);
    };
}

/*Fetch the current driver location once (no subscription).*/
export async function getDriverLocation(
    driverId: string
): Promise<DriverLocation | null> {
    const { data, error } = await supabase
        .from('driver_locations')
        .select('*')
        .eq('driver_id', driverId)
        .single();

    if (error) {
        console.error('[mapbox] getDriverLocation error:', error.message);
        return null;
    }
    return data;
}

// ─── ETA Helpers
export function formatETA(seconds: number): string {
    const mins = Math.round(seconds / 60);
    if (mins < 1) return 'Less than a min';
    if (mins === 1) return '1 min';
    return `${mins} mins`;
}

export function formatDistance(meters: number): string {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
}