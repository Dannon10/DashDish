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
import { usePaystack } from 'react-native-paystack-webview';

// Lazy import Paystack WebView — only on native
let PaystackWebView: any = null;
if (Platform.OS !== 'web') {
    PaystackWebView = require('react-native-paystack-webview').PaystackWebView;
}

const SIMULATED_DRIVER_ID = '9b1a9bee-6fca-4384-967d-1907e2bfc29d';

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
    const [showPaystack, setShowPaystack] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const total = parseFloat(params.total);
    const deliveryFee = parseFloat(params.deliveryFee);
    const subtotal = parseFloat(params.subtotal);
    const { popup } = usePaystack();

    const customerEmail = profile?.id
        ? `user_${profile.id.slice(0, 8)}@dashdish.com`
        : 'test@dashdish.com';

    // Load Paystack inline script on web
    useEffect(() => {
        if (Platform.OS !== 'web') return;
        if ((window as any).PaystackPop) { setScriptLoaded(true); return; }

        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => console.error('Paystack script failed to load');
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

    // Create order + start simulation after successful payment 
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

        const restaurantLat = parseFloat(params.restaurantLat ?? '6.5244');
        const restaurantLng = parseFloat(params.restaurantLng ?? '3.3792');

        await ensureSimulatedDriver(SIMULATED_DRIVER_ID, {
            lat: restaurantLat,
            lng: restaurantLng,
        });

        // 10s window for a real driver to accept before simulation kicks in
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

    // Web — Paystack inline popup
    const handlePayWeb = () => {
        if (!(window as any).PaystackPop) {
            Alert.alert('Error', 'Payment system not ready. Please try again.');
            return;
        }
        const handler = (window as any).PaystackPop.setup({
            key: process.env.EXPO_PUBLIC_PAYSTACK_KEY ?? '',
            email: customerEmail,
            amount: total * 100,
            currency: 'NGN',
            ref: `dashdish_${Date.now()}`,
            callback: (response: any) => handleCreateOrder(response.reference),
            onClose: () => console.log('Payment popup closed'),
        });
        handler.openIframe();
    };

    // Native — show Paystack WebView
    const handlePayNative = () => {
    popup.checkout({
        email: customerEmail,
        amount: total,  // in Naira — the library handles kobo conversion
        reference: `dashdish_${Date.now()}`,
        onSuccess: (res: any) => {
            handleCreateOrder(res.transactionRef?.reference ?? `ref_${Date.now()}`);
        },
        onCancel: () => {
            Alert.alert('Payment Cancelled', 'Your payment was cancelled.');
        },
        onError: (err: any) => {
            console.error('[Paystack] error:', err);
            Alert.alert('Payment Error', 'Something went wrong. Please try again.');
        },
    });
};

    // Loading screen
    if (loading) {
        return (
            <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center`}>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text weight='semiBold' style={tw`text-white mt-4 text-base`}>
                    Processing payment...
                </Text>
                <Text style={tw`text-[${colors.textSecondary}] mt-2 text-sm`}>
                    Please don't close the app
                </Text>
            </View>
        );
    }

    // Native Paystack WebView 
    if (Platform.OS !== 'web' && showPaystack && PaystackWebView) {
        return (
            <View style={tw`flex-1 bg-[${colors.background}]`}>
                {/* Back button over the WebView */}
                <TouchableOpacity
                    onPress={() => setShowPaystack(false)}
                    style={tw`absolute top-12 left-4 w-9 h-9 rounded-full bg-[${colors.surface}] items-center justify-center z-10`}
                >
                    <Ionicons name="arrow-back" size={20} color="white" />
                </TouchableOpacity>

                <PaystackWebView
                    paystackKey={process.env.EXPO_PUBLIC_PAYSTACK_KEY ?? ''}
                    amount={total}
                    billingEmail={customerEmail}
                    currency="NGN"
                    refNumber={`dashdish_${Date.now()}`}
                    onCancel={() => {
                        setShowPaystack(false);
                        Alert.alert('Payment Cancelled', 'Your payment was cancelled.');
                    }}
                    onSuccess={(response: any) => {
                        setShowPaystack(false);
                        handleCreateOrder(response.transactionRef?.reference ?? `ref_${Date.now()}`);
                    }}
                    autoStart
                />
            </View>
        );
    }

    // Main payment screen
    return (
        <View style={tw`flex-1 bg-[${colors.background}]`}>
            {/* Header */}
            <View style={tw`px-5 pt-14 pb-4 flex-row items-center gap-4`}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={tw`w-10 h-10 bg-[${colors.surface}] rounded-full items-center justify-center`}
                >
                    <Ionicons name="arrow-back" size={20} color="white" />
                </TouchableOpacity>
                <Text weight='bold' style={tw`text-white text-2xl`}>Payment</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`pb-10`}>

                {/* Order Summary */}
                <View style={tw`mx-5 bg-[${colors.surface}] rounded-2xl p-5 mb-4`}>
                    <Text weight='bold' style={tw`text-white text-base mb-4`}>
                        Order Summary
                    </Text>
                    <View style={tw`flex-row justify-between mb-3`}>
                        <Text style={tw`text-[${colors.textSecondary}]`}>Subtotal</Text>
                        <Text weight='semiBold' style={tw`text-white`}>
                            {formatCurrency(subtotal)}
                        </Text>
                    </View>
                    <View style={tw`flex-row justify-between mb-3`}>
                        <Text style={tw`text-[${colors.textSecondary}]`}>Delivery fee</Text>
                        <Text weight='semiBold' style={tw`text-white`}>
                            {formatCurrency(deliveryFee)}
                        </Text>
                    </View>
                    <View style={tw`h-px bg-[${colors.border}] my-2`} />
                    <View style={tw`flex-row justify-between mt-2`}>
                        <Text weight='bold' style={tw`text-white text-base`}>Total</Text>
                        <Text weight='bold' style={[tw`text-lg`, { color: colors.primary }]}>
                            {formatCurrency(total)}
                        </Text>
                    </View>
                </View>

                {/* Delivery Address */}
                <View style={tw`mx-5 bg-[${colors.surface}] rounded-2xl p-5 mb-4`}>
                    <View style={tw`flex-row items-center gap-3`}>
                        <Ionicons name="location-outline" size={20} color={colors.primary} />
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[${colors.textSecondary}] text-xs mb-1`}>
                                Delivering to
                            </Text>
                            <Text weight='medium' style={tw`text-white text-sm`}>
                                {params.address}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Pay button */}
                <View style={tw`px-5`}>
                    {Platform.OS === 'web' ? (
                        <TouchableOpacity
                            style={[
                                tw`py-4 rounded-xl items-center flex-row justify-center gap-2`,
                                { backgroundColor: scriptLoaded ? colors.primary : colors.textMuted },
                            ]}
                            onPress={handlePayWeb}
                            disabled={!scriptLoaded}
                        >
                            <Ionicons name="card-outline" size={20} color="white" />
                            <Text weight='bold' style={tw`text-white text-base`}>
                                {scriptLoaded ? `Pay ${formatCurrency(total)}` : 'Loading payment...'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[tw`py-4 rounded-xl items-center flex-row justify-center gap-2`, { backgroundColor: colors.primary }]}
                            onPress={handlePayNative}
                        >
                            <Ionicons name="card-outline" size={20} color="white" />
                            <Text weight='bold' style={tw`text-white text-base`}>
                                Pay {formatCurrency(total)}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <Text style={tw`text-[${colors.textMuted}] text-xs text-center mt-3`}>
                        Secured by Paystack • Test mode
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}