import React from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import colors from '../../constants/colors';

let MapboxGL: typeof import('@rnmapbox/maps').default | null = null;
if (Platform.OS !== 'web') {
    MapboxGL = require('@rnmapbox/maps').default;
}

interface Props {
    id?: string;
    coordinate: [number, number]; // [lng, lat]
}

export default function RestaurantMarker({ id = 'restaurantMarker', coordinate }: Props) {
    if (!MapboxGL || Platform.OS === 'web') return null;

    return (
        <MapboxGL.PointAnnotation id={id} coordinate={coordinate}>
            <View style={tw`w-9 h-9 rounded-full bg-[${colors.warning}] items-center justify-center border-2 border-white`}>
                <Ionicons name="restaurant" size={16} color="white" />
            </View>
        </MapboxGL.PointAnnotation>
    );
}