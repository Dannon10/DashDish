import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

import useCartStore from '../../store/useCartStore';
import useAuthStore from '../../store/useAuthStore';
import formatCurrency from '../../utils/formatCurrency';
import calculateFare from '../../utils/calculateFare';
import { forwardGeocode } from '../../services/mapbox.service';
import colors from '../../constants/colors';

// Fallback delivery coords (Victoria Island, Lagos) if geocoding fails
const FALLBACK_LAT = 6.4281;
const FALLBACK_LNG = 3.4219;
const DEMO_DISTANCE_KM = 3.5;

export default function CheckoutScreen() {
    const { items, restaurantName, restaurantId, restaurantLat, restaurantLng, getTotalPrice } =
        useCartStore();
    const { profile } = useAuthStore();

    const [address, setAddress] = useState('');
    const [addressError, setAddressError] = useState<string | null>(null);
    const [geocoding, setGeocoding] = useState(false);

    const subtotal = getTotalPrice();
    const deliveryFee = calculateFare(DEMO_DISTANCE_KM);
    const total = subtotal + deliveryFee;

    const handleProceedToPayment = async () => {
        if (!address.trim()) {
            setAddressError('Please enter your delivery address');
            return;
        }
        if (address.trim().length < 10) {
            setAddressError('Please enter a more detailed address');
            return;
        }

        setAddressError(null);
        setGeocoding(true);

        // Geocode the delivery address to get real coords
        let deliveryLat = FALLBACK_LAT;
        let deliveryLng = FALLBACK_LNG;

        try {
            const result = await forwardGeocode(address.trim());
            if (result) {
                deliveryLat = result.coordinates.lat;
                deliveryLng = result.coordinates.lng;
            } else {
                // Geocoding returned nothing — use fallback silently
                console.warn('[checkout] geocoding returned null, using fallback coords');
            }
        } catch (err) {
            console.warn('[checkout] geocoding failed, using fallback coords:', err);
        } finally {
            setGeocoding(false);
        }

        router.push({
            pathname: '/(customer)/payment',
            params: {
                address: address.trim(),
                deliveryLat,
                deliveryLng,
                deliveryFee,
                subtotal,
                total,
                restaurantId,
                restaurantLat: restaurantLat ?? 6.5244,
                restaurantLng: restaurantLng ?? 3.3792,
            },
        });
    };

    useEffect(() => {
    if (items.length === 0) {
        router.replace('/(customer)/(tabs)/');
        // router.replace('/(customer)/cart');
    }
}, [items.length]);

    return (
        <View style={tw`flex-1 bg-[#0A0A0A]`}>
            {/* Header */}
            <View style={tw`px-5 pt-14 pb-4 flex-row items-center gap-4`}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={tw`w-10 h-10 bg-[#141414] rounded-full items-center justify-center`}
                >
                    <Ionicons name="arrow-back" size={20} color="white" />
                </TouchableOpacity>
                <Text style={tw`text-white text-2xl font-bold`}>Checkout</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Delivery Address */}
                <View style={tw`px-5 mb-6`}>
                    <Text style={tw`text-white font-bold text-lg mb-4`}>
                        Delivery Address
                    </Text>
                    <View
                        style={tw`bg-[#141414] border ${
                            addressError ? 'border-red-500' : 'border-[#2A2A2A]'
                        } rounded-xl p-4`}
                    >
                        <View style={tw`flex-row items-start gap-3`}>
                            <Ionicons
                                name="location-outline"
                                size={20}
                                color={addressError ? colors.error : colors.primary}
                                style={tw`mt-1`}
                            />
                            <TextInput
                                style={tw`flex-1 text-white text-base`}
                                placeholder="Enter your delivery address"
                                placeholderTextColor={colors.textMuted}
                                value={address}
                                onChangeText={(v) => {
                                    setAddress(v);
                                    setAddressError(null);
                                }}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>
                    {addressError && (
                        <Text style={tw`text-red-400 text-xs mt-2 ml-1`}>{addressError}</Text>
                    )}
                    <Text style={tw`text-[#555555] text-xs mt-2 ml-1`}>
                        Your address will be geocoded for accurate tracking
                    </Text>
                </View>

                {/* Order items */}
                <View style={tw`px-5 mb-6`}>
                    <Text style={tw`text-white font-bold text-lg mb-4`}>
                        Order from {restaurantName}
                    </Text>
                    <View style={tw`bg-[#141414] rounded-2xl overflow-hidden`}>
                        {items.map(({ menuItem, quantity }, index) => (
                            <View
                                key={menuItem.id}
                                style={tw`flex-row items-center justify-between px-4 py-3 ${
                                    index < items.length - 1 ? 'border-b border-[#1E1E1E]' : ''
                                }`}
                            >
                                <View style={tw`flex-row items-center gap-3 flex-1`}>
                                    <View
                                        style={tw`w-6 h-6 bg-[#7C3AED]/20 rounded-full items-center justify-center`}
                                    >
                                        <Text style={tw`text-[#7C3AED] text-xs font-bold`}>
                                            {quantity}
                                        </Text>
                                    </View>
                                    <Text style={tw`text-white text-sm flex-1`} numberOfLines={1}>
                                        {menuItem.name}
                                    </Text>
                                </View>
                                <Text style={tw`text-white font-semibold text-sm`}>
                                    {formatCurrency(menuItem.price * quantity)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Price breakdown */}
                <View style={tw`mx-5 bg-[#141414] rounded-2xl p-5 mb-8`}>
                    <Text style={tw`text-white font-bold text-lg mb-4`}>Price Breakdown</Text>
                    <View style={tw`flex-row justify-between mb-3`}>
                        <Text style={tw`text-[#A0A0A0]`}>Subtotal</Text>
                        <Text style={tw`text-white font-semibold`}>{formatCurrency(subtotal)}</Text>
                    </View>
                    <View style={tw`flex-row justify-between mb-3`}>
                        <View style={tw`flex-row items-center gap-1`}>
                            <Text style={tw`text-[#A0A0A0]`}>Delivery fee</Text>
                            <Text style={tw`text-[#555555] text-xs`}>({DEMO_DISTANCE_KM}km)</Text>
                        </View>
                        <Text style={tw`text-white font-semibold`}>{formatCurrency(deliveryFee)}</Text>
                    </View>
                    <View style={tw`h-px bg-[#2A2A2A] my-3`} />
                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-white font-bold text-base`}>Total</Text>
                        <Text style={tw`text-[#7C3AED] font-bold text-lg`}>
                            {formatCurrency(total)}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Proceed button */}
            <View style={tw`px-5 pb-8 pt-4 bg-[#0A0A0A] border-t border-[#1E1E1E]`}>
                <TouchableOpacity
                    style={tw`bg-[#7C3AED] py-4 rounded-xl items-center flex-row justify-center gap-2 ${
                        geocoding ? 'opacity-70' : ''
                    }`}
                    onPress={handleProceedToPayment}
                    disabled={geocoding}
                >
                    {geocoding ? (
                        <>
                            <ActivityIndicator size="small" color="white" />
                            <Text style={tw`text-white font-bold text-base`}>
                                Finding your location...
                            </Text>
                        </>
                    ) : (
                        <>
                            <Ionicons name="card-outline" size={20} color="white" />
                            <Text style={tw`text-white font-bold text-base`}>
                                Pay {formatCurrency(total)}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}