import React from 'react';
import { Platform } from 'react-native';

let MapboxGL: typeof import('@rnmapbox/maps').default | null = null;
if (Platform.OS !== 'web') {
    MapboxGL = require('@rnmapbox/maps').default;
}

interface Props {
    id?: string;
    coordinates: [number, number][];
    color: string;
    width?: number;
    opacity?: number;
}

export default function RoutePolyline({
    id = 'routePolyline',
    coordinates,
    color,
    width = 4,
    opacity = 0.85,
}: Props) {
    if (!MapboxGL || Platform.OS === 'web') return null;

    return (
        <MapboxGL.ShapeSource
            id={`${id}Source`}
            shape={{
                type: 'Feature',
                geometry: { type: 'LineString', coordinates },
                properties: {},
            }}
        >
            <MapboxGL.LineLayer
                id={`${id}Line`}
                style={{
                    lineColor: color,
                    lineWidth: width,
                    lineOpacity: opacity,
                    lineCap: 'round',
                    lineJoin: 'round',
                }}
            />
        </MapboxGL.ShapeSource>
    );
}