import React from 'react';
import { View } from 'react-native';
import tw from 'twrnc';
import colors from '../../constants/colors';

interface WebMapProps {
    center: [number, number];
    driverCoords: [number, number] | null;
    deliveryCoords: [number, number];
}

export default function WebMap({ center, driverCoords, deliveryCoords }: WebMapProps) {
    const TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN!;
    const [lng, lat] = center;

    const pins =
        `pin-s-home+22C55E(${deliveryCoords[0]},${deliveryCoords[1]})` +
        (driverCoords
            ? `,pin-s-bicycle+7C3AED(${driverCoords[0]},${driverCoords[1]})`
            : '');

    const src = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${pins}/${lng},${lat},14,0/600x300@2x?access_token=${TOKEN}`;

    return (
        <View style={tw`flex-1 bg-[${colors.surfaceElevated}] overflow-hidden`}>
            {/* @ts-ignore */}
            <img
                src={src}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt="map"
            />
        </View>
    );
}