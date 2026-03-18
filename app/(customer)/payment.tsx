import React, { useState, useEffect } from 'react';
import {
    View,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
} from 'react-native';
import { Text } from '../../components/ui/AppText';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { createOrder } from '../../services/order.service';
import useCartStore from '../../store/useCartStore';
import useAuthStore from '../../store/useAuthStore';
import formatCurrency from '../../utils/formatCurrency';
import colors from '../../constants/colors';
import { startDeliverySimulation, ensureSimulatedDriver } from '../../utils/simulateDelivery';

export default function PaymentScreen() {
    const params = useLocalSearchParams<{
        restaurantLng: string;
        restaurantLat: string;
        address: string;
        deliveryLat: string;
        deliveryLng: string;
        deliveryFee: string;
        subtotal: string;
        total: string;
        restaurantId: string;
    }>();

    const { items, clearCart } = useCartStore();
    const { profile } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const total = parseFloat(params.total);
    const deliveryFee = parseFloat(params.deliveryFee);
    const subtotal = parseFloat(params.subtotal);

    // Load Paystack inline script on web
    useEffect(() => {
        if (Platform.OS !== 'web') return;

        // Check if already loaded
        if ((window as any).PaystackPop) {
            setScriptLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => console.error('Paystack script failed to load');
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

const handleCreateOrder = async (reference: string) => {
        setLoading(true);

        const { orderId, error } = await createOrder({
            customer_id: profile!.id,
            restaurant_id: params.restaurantId,
            items: items.map(({ menuItem, quantity }) => ({
                menu_item_id: menuItem.id,
                quantity,
                unit_price: menuItem.price,
            })),
            total_amount: total,
            delivery_fee: deliveryFee,
            delivery_address: params.address,
            delivery_lat: parseFloat(params.deliveryLat),
            delivery_lng: parseFloat(params.deliveryLng),
            payment_reference: reference,
        });

        if (error || !orderId) {
            Alert.alert('Error', 'Order creation failed. Please try again.');
            setLoading(false);
            return;
        }

        const SIMULATED_DRIVER_ID = '9b1a9bee-6fca-4384-967d-1907e2bfc29d';
        const restaurantLat = parseFloat(params.restaurantLat ?? '6.5244');
        const restaurantLng = parseFloat(params.restaurantLng ?? '3.3792');

        await ensureSimulatedDriver(SIMULATED_DRIVER_ID, {
            lat: restaurantLat,
            lng: restaurantLng,
        });

        // ── Delay simulation by 10s so the driver screen shows the request first.
        // The order sits as 'placed' with no driver_id during this window.
        // If a real driver accepts it, the simulation will still run but
        // the order updates will be ignored (status already moved forward).
        setTimeout(() => {
            startDeliverySimulation({
                orderId,
                driverId: SIMULATED_DRIVER_ID,
                restaurantCoords: { lat: restaurantLat, lng: restaurantLng },
                deliveryCoords: {
                    lat: parseFloat(params.deliveryLat),
                    lng: parseFloat(params.deliveryLng),
                },
            });
        }, 10000);

        clearCart();
        setLoading(false);
        router.replace(`/(customer)/tracking/${orderId}`);
    };

    const handlePayWeb = () => {
        if (!(window as any).PaystackPop) {
            Alert.alert('Error', 'Payment system not ready. Please wait a moment and try again.');
            return;
        }

        const handler = (window as any).PaystackPop.setup({
            key: process.env.EXPO_PUBLIC_PAYSTACK_KEY ?? '',
            email: profile?.id
                ? `user_${profile.id.slice(0, 8)}@dashdish.com`
                : 'test@dashdish.com',
            amount: total * 100,
            currency: 'NGN',
            ref: `dashdish_${Date.now()}`,
            callback: (response: any) => {
                handleCreateOrder(response.reference);
            },
            onClose: () => {
                console.log('Payment popup closed');
            },
        });

        handler.openIframe();
    };

    const handleSimulatePayment = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        await handleCreateOrder(`test_ref_${Date.now()}`);
    };

    if (loading) {
        return (
            <View style={tw`flex-1 bg-[#0A0A0A] items-center justify-center`}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text weight='semiBold' style={tw`text-white mt-4 text-base`}>
                    Processing payment...
                </Text>
                <Text style={tw`text-[#A0A0A0] mt-2 text-sm`}>
                    Please don't close the app
                </Text>
            </View>
        );
    }

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
                <Text weight='bold' style={tw`text-white text-2xl `}>Payment</Text>
            </View>

            {/* Scrollable content */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={tw`pb-10`}
            >
                {/* Test Mode Banner */}
                <View style={tw`mx-5 mb-4 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-xl p-3 flex-row items-center gap-2`}>
                    <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
                    <Text style={tw`text-[#F59E0B] text-xs flex-1`}>
                        Paystack test mode — no real charges
                    </Text>
                </View>

                {/* Order Summary */}
                <View style={tw`mx-5 bg-[#141414] rounded-2xl p-5 mb-4`}>
                    <Text weight='bold' style={tw`text-white text-base mb-4`}>
                        Order Summary
                    </Text>
                    <View style={tw`flex-row justify-between mb-3`}>
                        <Text style={tw`text-[#A0A0A0]`}>Subtotal</Text>
                        <Text weight='semiBold' style={tw`text-white`}>
                            {formatCurrency(subtotal)}
                        </Text>
                    </View>
                    <View style={tw`flex-row justify-between mb-3`}>
                        <Text style={tw`text-[#A0A0A0]`}>Delivery fee</Text>
                        <Text weight='semiBold' style={tw`text-white`}>
                            {formatCurrency(deliveryFee)}
                        </Text>
                    </View>
                    <View style={tw`h-px bg-[#2A2A2A] my-2`} />
                    <View style={tw`flex-row justify-between mt-2`}>
                        <Text weight='bold' style={tw`text-white text-base`}>Total</Text>
                        <Text weight='bold' style={tw`text-[#7C3AED] text-lg`}>
                            {formatCurrency(total)}
                        </Text>
                    </View>
                </View>

                {/* Delivery Address */}
                <View style={tw`mx-5 bg-[#141414] rounded-2xl p-5 mb-4`}>
                    <View style={tw`flex-row items-center gap-3`}>
                        <Ionicons name="location-outline" size={20} color={colors.primary} />
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[#A0A0A0] text-xs mb-1`}>Delivering to</Text>
                            <Text weight='medium' style={tw`text-white text-sm`}>
                                {params.address}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Test Card Info */}
                <View style={tw`mx-5 bg-[#141414] rounded-2xl p-5 mb-6`}>
                    <Text weight='semiBold' style={tw`text-white mb-3`}>Test Card</Text>
                    <View style={tw`gap-2`}>
                        <View style={tw`flex-row justify-between`}>
                            <Text style={tw`text-[#A0A0A0] text-sm`}>Card</Text>
                            <Text style={tw`text-white text-sm`}>4084 0840 8408 4081</Text>
                        </View>
                        <View style={tw`flex-row justify-between`}>
                            <Text style={tw`text-[#A0A0A0] text-sm`}>CVV</Text>
                            <Text style={tw`text-white text-sm`}>408</Text>
                        </View>
                        <View style={tw`flex-row justify-between`}>
                            <Text style={tw`text-[#A0A0A0] text-sm`}>Expiry</Text>
                            <Text style={tw`text-white text-sm`}>Any future date</Text>
                        </View>
                        <View style={tw`flex-row justify-between`}>
                            <Text style={tw`text-[#A0A0A0] text-sm`}>PIN</Text>
                            <Text style={tw`text-white text-sm`}>0000</Text>
                        </View>
                        <View style={tw`flex-row justify-between`}>
                            <Text style={tw`text-[#A0A0A0] text-sm`}>OTP</Text>
                            <Text style={tw`text-white text-sm`}>123456</Text>
                        </View>
                    </View>
                </View>

                {/* Pay Button */}
                <View style={tw`px-5`}>
                    {Platform.OS === 'web' ? (
                        <TouchableOpacity
                            style={tw`py-4 rounded-xl items-center flex-row justify-center gap-2 ${scriptLoaded ? 'bg-[#7C3AED]' : 'bg-[#555555]'
                                }`}
                            onPress={handlePayWeb}
                            disabled={!scriptLoaded}
                        >
                            <Ionicons name="card-outline" size={20} color="white" />
                            <Text weight='bold' style={tw`text-white text-base`}>
                                {scriptLoaded
                                    ? `Pay ${formatCurrency(total)}`
                                    : 'Loading payment...'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={tw`bg-[#7C3AED] py-4 rounded-xl items-center flex-row justify-center gap-2`}
                            onPress={handleSimulatePayment}
                        >
                            <Ionicons name="card-outline" size={20} color="white" />
                            <Text weight='bold' style={tw`text-white text-base`}>
                                Simulate Payment • {formatCurrency(total)}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <Text style={tw`text-[#555555] text-xs text-center mt-3`}>
                        Secured by Paystack • Test mode
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}