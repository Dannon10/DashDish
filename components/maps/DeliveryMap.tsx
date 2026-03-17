import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import colors from '../../constants/colors';
import RoutePolyline from './RoutePolyline';
import DriverMarker from './DriverMarker';
import RestaurantMarker from './RestaurantMarker';

let MapboxGL: typeof import('@rnmapbox/maps').default | null = null;
if (Platform.OS !== 'web') {
    MapboxGL = require('@rnmapbox/maps').default;
    MapboxGL!.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);
}

interface Props {
    cameraRef?: React.RefObject<any>;
    center: [number, number];          // [lng, lat]
    zoomLevel?: number;

    // Route
    routeCoordinates?: [number, number][] | null;
    routeColor?: string;
    routeWidth?: number;

    // Driver
    driverCoordinate?: [number, number] | null;
    showDriver?: boolean;
    driverColor?: string;

    // Restaurant pin (driver screen only)
    restaurantCoordinate?: [number, number] | null;

    // Delivery pin
    deliveryCoordinate: [number, number];

    // Web fallback
    webFallback?: React.ReactNode;
}

function DeliveryPin({ coordinate }: { coordinate: [number, number] }) {
    if (!MapboxGL) return null;
    return (
        <MapboxGL.PointAnnotation id="deliveryPin" coordinate={coordinate}>
            <View style={tw`w-9 h-9 rounded-full bg-[${colors.success}] items-center justify-center border-2 border-white`}>
                <Ionicons name="home" size={16} color={colors.white} />
            </View>
        </MapboxGL.PointAnnotation>
    );
}

export default function DeliveryMap({
    cameraRef,
    center,
    zoomLevel = 14,
    routeCoordinates,
    routeColor = colors.primary,
    routeWidth = 4,
    driverCoordinate,
    showDriver = true,
    driverColor = colors.primary,
    restaurantCoordinate,
    deliveryCoordinate,
    webFallback,
}: Props) {
    if (Platform.OS === 'web') {
        return webFallback ? (
            <>{webFallback}</>
        ) : (
            <View style={tw`flex-1 bg-[${colors.surfaceElevated}] items-center justify-center`}>
                <Ionicons name="map-outline" size={48} color={colors.textMuted} />
                <Text style={tw`text-[${colors.textSecondary}] mt-2 text-sm`}>Map available on mobile</Text>
            </View>
        );
    }

    if (!MapboxGL) return null;

    return (
        <MapboxGL.MapView
            style={tw`flex-1`}
            styleURL={MapboxGL.StyleURL.Dark}
            logoEnabled={false}
            attributionEnabled={false}
            compassEnabled={false}
        >
            <MapboxGL.Camera
                ref={cameraRef}
                centerCoordinate={center}
                zoomLevel={zoomLevel}
                animationMode="flyTo"
                animationDuration={1000}
            />

            {routeCoordinates && routeCoordinates.length > 0 && (
                <RoutePolyline
                    coordinates={routeCoordinates}
                    color={routeColor}
                    width={routeWidth}
                />
            )}

            {showDriver && driverCoordinate && (
                <DriverMarker coordinate={driverCoordinate} color={driverColor} />
            )}

            {restaurantCoordinate && (
                <RestaurantMarker coordinate={restaurantCoordinate} />
            )}

            <DeliveryPin coordinate={deliveryCoordinate} />
        </MapboxGL.MapView>
    );
}