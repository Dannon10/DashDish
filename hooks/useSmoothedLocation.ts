import { useEffect, useRef, useState } from 'react';

interface Coords {
    lat: number;
    lng: number;
}

/**
 * useSmoothedLocation
 *
 * Takes raw GPS coordinates (which update every ~2s) and returns a
 * smoothly interpolated position that updates every animation frame.
 * This gives Uber-style smooth marker movement on the map.
 *
 * @param target - The latest raw GPS coordinate from Supabase Realtime
 * @param durationMs - How long to animate between two points (default 1800ms,
 *                     slightly less than the 2s update interval)
 */
export function useSmoothedLocation(
    target: Coords | null,
    durationMs = 1800
): Coords | null {
    const [smoothed, setSmoothed] = useState<Coords | null>(target);

    const fromRef = useRef<Coords | null>(null);
    const toRef = useRef<Coords | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        if (!target) return;

        // First update — just set position directly, no animation needed
        if (!smoothed) {
            setSmoothed(target);
            fromRef.current = target;
            toRef.current = target;
            return;
        }

        // New target received — start animating from current smoothed position
        fromRef.current = smoothed;
        toRef.current = target;
        startTimeRef.current = null;

        // Cancel any in-progress animation
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
        }

        function animate(timestamp: number) {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            if (!fromRef.current || !toRef.current) return;

            const elapsed = timestamp - startTimeRef.current;
            const t = Math.min(elapsed / durationMs, 1); // 0 → 1

            // Ease in-out for natural deceleration
            const eased = t < 0.5
                ? 2 * t * t
                : 1 - Math.pow(-2 * t + 2, 2) / 2;

            const interpolated: Coords = {
                lat: fromRef.current.lat + (toRef.current.lat - fromRef.current.lat) * eased,
                lng: fromRef.current.lng + (toRef.current.lng - fromRef.current.lng) * eased,
            };

            setSmoothed(interpolated);

            if (t < 1) {
                rafRef.current = requestAnimationFrame(animate);
            } else {
                // Animation complete — snap to exact target
                setSmoothed(toRef.current);
                fromRef.current = toRef.current;
                rafRef.current = null;
            }
        }

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [target?.lat, target?.lng]);

    return smoothed;
}