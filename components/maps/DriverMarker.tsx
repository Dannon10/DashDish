import React from 'react';
import { Platform } from 'react-native';
import colors from '../../constants/colors';

let MapboxGL: typeof import('@rnmapbox/maps').default | null = null;
if (Platform.OS !== 'web') {
    MapboxGL = require('@rnmapbox/maps').default;
}

interface Props {
    id?: string;
    coordinate: [number, number]; // [lng, lat]
    color?: string;
}

export default function DriverMarker({
    id = 'driverMarker',
    coordinate,
    color = colors.primary,
}: Props) {
    if (!MapboxGL || Platform.OS === 'web') return null;

    const geoJSON = {
        type: 'FeatureCollection' as const,
        features: [{
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: coordinate,
            },
            properties: {},
        }],
    };

    return (
        <MapboxGL.ShapeSource id={`${id}Source`} shape={geoJSON}>
            <MapboxGL.CircleLayer
                id={`${id}Circle`}
                style={{
                    circleRadius: 20,
                    circleColor: color,
                    circleStrokeWidth: 2.5,
                    circleStrokeColor: '#FFFFFF',
                    circlePitchAlignment: 'map',
                }}
            />
            <MapboxGL.SymbolLayer
                id={`${id}Icon`}
                style={{
                    iconImage: 'bicycle-15',
                    iconSize: 1.3,
                    iconColor: '#FFFFFF',
                    iconAllowOverlap: true,
                    iconIgnorePlacement: true,
                }}
            />
        </MapboxGL.ShapeSource>
    );
}