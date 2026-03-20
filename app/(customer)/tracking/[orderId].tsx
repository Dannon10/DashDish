import React, { useEffect, useRef } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Text } from '../../../components/ui/AppText';
import { useLocalSearchParams, useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { formatETA, formatDistance } from '../../../services/mapbox.service';
import { useOrder } from '../../../hooks/useOrder';
import useOrderStore from '../../../store/useOrderStore';
import useAuthStore from '../../../store/useAuthStore';
import DeliveryMap from '../../../components/maps/DeliveryMap';
import RatingModal from '../../../components/ui/modal/RatingModal';
import ErrorBoundary from '../../../components/ErrorBoundary';
import colors from '../../../constants/colors';

import { STATUS_COLOR, EXPANDED_HEIGHT, COLLAPSED_HEIGHT } from '../../../constants/orderTracking';
import { useBottomSheet } from '../../../hooks/useBottomSheet';
import { useDriverTracking } from '../../../hooks/useDriverTracking';
import { useDriverProfile } from '../../../hooks/useDriverProfile';
import { useRatingModal } from '../../../hooks/useRatingModal';
import WebMap from '../../../components/maps/WebMap';
import DriverCard from '../../../components/driver/DriverCard';
import OrderTimeline from '../../../components/order/OrderTimeline';
import OrderSummary from '../../../components/order/OrderSummary';
import type { OrderStatus } from '../../../types/database.types';

export default function OrderTrackingScreen() {
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const router = useRouter();
    const { profile } = useAuthStore();
    const { activeOrder, setActiveOrder, updateActiveOrderStatus } = useOrderStore();
    const { order, loading } = useOrder(orderId, activeOrder);

    // Sync order into global store
    useEffect(() => {
        if (order) {
            setActiveOrder(order);
            updateActiveOrderStatus(order.status);
        }
    }, [order?.status, order?.id]);

    // Camera ref passed into driver tracking so it can move the map
    const cameraRef = useRef<any>(null);

    // Hooks
    const { sheetHeight, isExpanded, snapTo, panResponder } = useBottomSheet();
    const { route, isDriverVisible, mapCenter, deliveryCoords, driverCoords } =
        useDriverTracking(order, cameraRef);
    const driverProfile = useDriverProfile(order?.driver_id);
    const { showRating, handleRatingSubmit, handleRatingSkip } = useRatingModal({
        status: order?.status,
        driverId: order?.driver_id,
        orderId: order?.id,
        customerId: profile?.id,
    });

    // Derived display values
    const currentStatus: OrderStatus = order?.status ?? 'placed';
    const accentColor = STATUS_COLOR[currentStatus] ?? colors.primary;

    // Loading state
    if (loading) {
        return (
            <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center`}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Not found state
    if (!order) {
        return (
            <View
                style={tw`flex-1 bg-[${colors.background}] items-center justify-center px-6`}
            >
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={tw`text-[${colors.textPrimary}] text-lg mt-3`}>
                    Order not found
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={tw`mt-4`}>
                    <Text weight="semiBold" style={tw`text-[${colors.primary}]`}>
                        Go Back
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Main render
    return (
        <ErrorBoundary onGoBack={() => router.back()}>
            <View style={tw`flex-1 bg-[${colors.background}]`}>

                {/* Rating modal */}
                <RatingModal
                    visible={showRating}
                    driverProfile={driverProfile}
                    onSubmit={handleRatingSubmit}
                    onSkip={handleRatingSkip}
                />

                {/* Map — full screen background */}
                <View style={tw`absolute inset-0`}>
                    <DeliveryMap
                        cameraRef={cameraRef}
                        center={mapCenter}
                        zoomLevel={14}
                        routeCoordinates={route?.coordinates ?? null}
                        routeColor={accentColor}
                        driverCoordinate={driverCoords}
                        showDriver={isDriverVisible}
                        deliveryCoordinate={deliveryCoords}
                        webFallback={
                            <WebMap
                                center={mapCenter}
                                driverCoords={driverCoords}
                                deliveryCoords={deliveryCoords}
                            />
                        }
                    />
                </View>

                {/* Back button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={tw`absolute top-12 left-4 w-9 h-9 rounded-full bg-[${colors.surface}] items-center justify-center z-10`}
                >
                    <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>

                {/* Expand button — only shown when sheet is collapsed */}
                {!isExpanded && (
                    <TouchableOpacity
                        onPress={() => snapTo(EXPANDED_HEIGHT)}
                        style={tw`absolute top-12 right-4 w-9 h-9 rounded-full bg-[${colors.surface}] items-center justify-center z-10`}
                    >
                        <Ionicons name="chevron-up" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                )}

                {/* Animated bottom sheet */}
                <Animated.View
                    style={[
                        tw`absolute left-0 right-0 bottom-0 bg-[${colors.surface}] rounded-t-3xl`,
                        { height: sheetHeight },
                        {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 12,
                            elevation: 20,
                        },
                    ]}
                >
                    {/* Drag handle */}
                    <View
                        style={tw`items-center pt-3 pb-1`}
                        {...panResponder.panHandlers}
                    >
                        <View style={tw`w-10 h-1 rounded-full bg-[${colors.border}]`} />
                    </View>

                    {/* ETA + status badge */}
                    <View
                        style={tw`flex-row items-center justify-between px-5 pb-3`}
                        {...panResponder.panHandlers}
                    >
                        <View>
                            <Text style={tw`text-[${colors.textSecondary}] text-xs mb-0.5`}>
                                Estimated arrival
                            </Text>
                            <Text weight="bold" style={tw`text-[${colors.textPrimary}] text-2xl`}>
                                {route ? formatETA(route.durationSeconds) : '—'}
                            </Text>
                            {route && (
                                <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                                    {formatDistance(route.distanceMeters)} away
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            onPress={() =>
                                snapTo(isExpanded ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT)
                            }
                            style={[
                                tw`px-3 py-1.5 rounded-full flex-row items-center gap-1.5`,
                                { backgroundColor: `${accentColor}22` },
                            ]}
                        >
                            <Text
                                weight="semiBold"
                                style={[tw`text-sm capitalize`, { color: accentColor }]}
                            >
                                {currentStatus.replace(/_/g, ' ')}
                            </Text>
                            <Ionicons
                                name={isExpanded ? 'chevron-down' : 'chevron-up'}
                                size={14}
                                color={accentColor}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable content */}
                    <ScrollView
                        style={tw`flex-1`}
                        contentContainerStyle={tw`pb-10`}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={isExpanded}
                    >
                        {driverProfile && order.driver_id && (
                            <DriverCard profile={driverProfile} />
                        )}

                        <OrderTimeline
                            currentStatus={currentStatus}
                            accentColor={accentColor}
                        />

                        <OrderSummary
                            restaurantName={order.restaurants?.name}
                            items={order.order_items}
                            totalAmount={order.total_amount}
                        />
                    </ScrollView>
                </Animated.View>
            </View>
        </ErrorBoundary>
    );
}