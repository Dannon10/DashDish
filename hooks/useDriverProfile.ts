import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export interface DriverProfile {
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
    vehicle_info: string | null;
    deliveryCount: number;
    avgRating: number | null;
}

export function useDriverProfile(driverId: string | null | undefined): DriverProfile | null {
    const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);

    useEffect(() => {
        if (!driverId) return;

        (async () => {
            const [profileRes, deliveryRes, ratingRes] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('full_name, avatar_url, phone, vehicle_info')
                    .eq('id', driverId)
                    .single(),
                supabase
                    .from('orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('driver_id', driverId)
                    .eq('status', 'delivered'),
                supabase
                    .from('driver_ratings')
                    .select('rating')
                    .eq('driver_id', driverId),
            ]);

            if (profileRes.data) {
                const ratings = ratingRes.data ?? [];
                const avgRating = ratings.length > 0
                    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
                    : null;

                setDriverProfile({
                    ...profileRes.data,
                    deliveryCount: deliveryRes.count ?? 0,
                    avgRating,
                });
            }
        })();
    }, [driverId]);

    return driverProfile;
}