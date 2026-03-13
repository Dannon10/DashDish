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
            <Stack.Screen name="index" />
            <Stack.Screen name="active" />
            <Stack.Screen name="earnings" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="request" />
        </Stack>
    );
}