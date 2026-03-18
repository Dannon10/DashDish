import React, { useEffect, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Text } from '../../components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import colors from '../../constants/colors';
import type { OrderWithItems } from '../../types/order.types';

interface Props {
    order: OrderWithItems;
    onAccept: () => void;
    onDecline: () => void;
    isSimulated?: boolean;
    isLoading?: boolean;
    noMargin?: boolean; 
}

export default function RequestCard({
    order,
    onAccept,
    onDecline,
    isSimulated = false,
    isLoading = false,
    noMargin = false,
}: Props) {
    const totalItems = order.order_items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
    const accentColor = isSimulated ? colors.warning : colors.primary;

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    return (
        <View
            style={[
                noMargin ? tw`rounded-2xl overflow-hidden` : tw`mx-5 mb-4 rounded-2xl overflow-hidden`,
                {
                    borderWidth: 1,
                    borderColor: `${accentColor}33`,
                    shadowColor: accentColor,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 6,
                },
            ]}
        >
            {/* Colored top bar */}
            <View style={[tw`h-1 w-full`, { backgroundColor: accentColor }]} />

            <View style={tw`bg-[${colors.surfaceElevated}]`}>
                {/* Header */}
                <View style={tw`flex-row items-center justify-between px-4 pt-4 pb-3`}>
                    <View style={tw`flex-row items-center gap-2`}>
                        <Animated.View
                            style={[
                                tw`w-2 h-2 rounded-full`,
                                { backgroundColor: accentColor, transform: [{ scale: pulseAnim }] },
                            ]}
                        />
                        <Text weight='bold' style={tw`text-[${colors.textPrimary}] text-base`}>
                            {isSimulated ? 'Demo Order' : 'New Request'}
                        </Text>
                    </View>
                    <View style={[
                        tw`flex-row items-center gap-1 px-3 py-1.5 rounded-full`,
                        { backgroundColor: `${colors.success}18` },
                    ]}>
                        <Ionicons name="cash-outline" size={13} color={colors.success} />
                        <Text weight='bold' style={[tw`text-xs`, { color: colors.success }]}>
                            ₦{order.delivery_fee.toLocaleString()}
                        </Text>
                    </View>
                </View>

                {/* Route */}
                <View style={[tw`mx-4 mb-3 p-3 rounded-xl`, { backgroundColor: colors.background }]}>
                    <View style={tw`flex-row items-center gap-3`}>
                        <View style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: `${accentColor}22` }]}>
                            <Ionicons name="restaurant" size={15} color={accentColor} />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[${colors.textMuted}] text-[10px] uppercase tracking-widest mb-0.5`}>Pick up</Text>
                            <Text weight='semiBold' style={tw`text-[${colors.textPrimary}] text-sm`} numberOfLines={1}>
                                {order.restaurants?.name}
                            </Text>
                            <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`} numberOfLines={1}>
                                {order.restaurants?.address}
                            </Text>
                        </View>
                    </View>

                    <View style={tw`ml-4 my-1.5`}>
                        {[0, 1, 2].map((i) => (
                            <View key={i} style={[tw`w-0.5 h-1.5 rounded-full mb-0.5`, { backgroundColor: colors.border }]} />
                        ))}
                    </View>

                    <View style={tw`flex-row items-center gap-3`}>
                        <View style={[tw`w-8 h-8 rounded-full items-center justify-center`, { backgroundColor: `${colors.success}22` }]}>
                            <Ionicons name="home" size={15} color={colors.success} />
                        </View>
                        <View style={tw`flex-1`}>
                            <Text style={tw`text-[${colors.textMuted}] text-[10px] uppercase tracking-widest mb-0.5`}>Deliver to</Text>
                            <Text weight='semiBold' style={tw`text-[${colors.textPrimary}] text-sm`} numberOfLines={1}>
                                {order.delivery_address}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={[tw`flex-row mx-4 mb-4 rounded-xl overflow-hidden`, { backgroundColor: colors.background }]}>
                    <View style={tw`flex-1 items-center py-3`}>
                        <Text weight='bold' style={tw`text-[${colors.textPrimary}] text-base`}>{totalItems}</Text>
                        <Text style={tw`text-[${colors.textMuted}] text-[10px] mt-0.5`}>{totalItems === 1 ? 'Item' : 'Items'}</Text>
                    </View>
                    <View style={[tw`w-px my-3`, { backgroundColor: colors.border }]} />
                    <View style={tw`flex-1 items-center py-3`}>
                        <Text weight='bold' style={tw`text-[${colors.textPrimary}] text-base`}>
                            ₦{order.total_amount.toLocaleString()}
                        </Text>
                        <Text style={tw`text-[${colors.textMuted}] text-[10px] mt-0.5`}>Order value</Text>
                    </View>
                    <View style={[tw`w-px my-3`, { backgroundColor: colors.border }]} />
                    <View style={tw`flex-1 items-center py-3`}>
                        <Text weight='bold' style={[tw`text-[${colors.textPrimary}] text-base`, { color: colors.success }]}>
                            ₦{order.delivery_fee.toLocaleString()}
                        </Text>
                        <Text style={tw`text-[${colors.textMuted}] text-[10px] mt-0.5`}>Your cut</Text>
                    </View>
                </View>

                {/* Buttons */}
                <View style={tw`flex-row gap-3 px-4 pb-4`}>
                    <TouchableOpacity
                        onPress={onDecline}
                        disabled={isLoading}
                        style={[tw`flex-1 py-3.5 rounded-xl items-center justify-center`, { borderWidth: 1, borderColor: colors.border }]}
                    >
                        <Text weight='semiBold' style={tw`text-[${colors.textSecondary}] text-sm`}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onAccept}
                        disabled={isLoading}
                        style={[
                            tw`flex-1 py-3.5 rounded-xl items-center justify-center flex-row gap-2`,
                            { backgroundColor: accentColor, opacity: isLoading ? 0.7 : 1 },
                        ]}
                    >
                        <Ionicons
                            name={isSimulated ? 'play-circle-outline' : 'checkmark-circle-outline'}
                            size={18}
                            color="white"
                        />
                        <Text weight='semiBold' style={tw`text-white text-sm`}>
                            {isSimulated ? 'Simulate' : 'Accept'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}