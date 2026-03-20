import { useRef, useState, useCallback } from 'react';
import { Animated, PanResponder } from 'react-native';
import { EXPANDED_HEIGHT, COLLAPSED_HEIGHT } from '../constants/orderTracking';

export function useBottomSheet() {
    const sheetHeight = useRef(new Animated.Value(EXPANDED_HEIGHT)).current;
    const lastHeight = useRef(EXPANDED_HEIGHT);
    const [isExpanded, setIsExpanded] = useState(true);

    const snapTo = useCallback(
        (targetHeight: number) => {
            lastHeight.current = targetHeight;
            setIsExpanded(targetHeight === EXPANDED_HEIGHT);
            Animated.spring(sheetHeight, {
                toValue: targetHeight,
                useNativeDriver: false,
                tension: 65,
                friction: 11,
            }).start();
        },
        [sheetHeight]
    );

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) =>
                Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
            onPanResponderMove: (_, g) => {
                const next = lastHeight.current - g.dy;
                sheetHeight.setValue(
                    Math.max(COLLAPSED_HEIGHT, Math.min(EXPANDED_HEIGHT + 20, next))
                );
            },
            onPanResponderRelease: (_, g) => {
                const current = lastHeight.current - g.dy;
                const mid = (COLLAPSED_HEIGHT + EXPANDED_HEIGHT) / 2;
                snapTo(g.vy > 0.5 || current < mid ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT);
            },
        })
    ).current;

    return { sheetHeight, isExpanded, snapTo, panResponder };
}