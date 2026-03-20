import { useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import type { OrderStatus } from '../types/database.types';

interface UseRatingModalOptions {
    status: OrderStatus | undefined;
    driverId: string | null | undefined;
    orderId: string | undefined;
    customerId: string | null | undefined;
}

export function useRatingModal({ status, driverId, orderId, customerId }: UseRatingModalOptions) {
    const [showRating, setShowRating] = useState(false);
    const ratingShownRef = useRef(false);

    useEffect(() => {
        if (status === 'delivered' && driverId && !ratingShownRef.current) {
            ratingShownRef.current = true;
            // Small delay so the status update animation plays first
            setTimeout(() => setShowRating(true), 1200);
        }
    }, [status, driverId]);

    const handleRatingSubmit = async (rating: number) => {
        if (!driverId || !customerId || !orderId) return;

        await supabase.from('driver_ratings').insert({
            order_id: orderId,
            driver_id: driverId,
            customer_id: customerId,
            rating,
        });

        setShowRating(false);
    };

    const handleRatingSkip = () => {
        setShowRating(false);
    };

    return { showRating, handleRatingSubmit, handleRatingSkip };
}