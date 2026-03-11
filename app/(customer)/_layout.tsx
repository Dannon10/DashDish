import React from 'react';
import { Stack } from 'expo-router';
import colors from '../../constants/colors';

export default function CustomerLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            {/* Tab group */}
            <Stack.Screen name="(tabs)" />

            {/* Stack screens pushed on top of tabs */}
            <Stack.Screen name="restaurant/[id]" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="payment" />
            <Stack.Screen
                name="tracking/[orderId]"
                options={{ animation: 'slide_from_bottom' }}
            />
        </Stack>
    );
}