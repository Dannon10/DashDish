import React from 'react';
import { Stack } from 'expo-router';
import colors from '../../constants/colors';

export default function DriverLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
                name="active"
                options={{ animation: 'slide_from_bottom' }}
            />
        </Stack>
    );
}