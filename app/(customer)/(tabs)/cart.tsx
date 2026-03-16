import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import useCartStore from '../../../store/useCartStore';
import formatCurrency from '../../../utils/formatCurrency';
import colors from '../../../constants/colors';

export default function CartScreen() {
    const {
        items,
        restaurantName,
        incrementItem,
        decrementItem,
        removeItem,
        clearCart,
        getTotalItems,
        getTotalPrice,
    } = useCartStore();

    const totalItems = getTotalItems();
    const subtotal = getTotalPrice();

    // Empty state
    if (items.length === 0) {
        return (
            <View style={tw`flex-1 bg-[#0A0A0A] items-center justify-center px-6`}>
                <Ionicons name="bag-outline" size={64} color={colors.textMuted} />
                <Text style={tw`text-white font-bold text-xl mt-4`}>
                    Your cart is empty
                </Text>
                <Text style={tw`text-[#A0A0A0] text-sm mt-2 text-center`}>
                    Add items from a restaurant to get started
                </Text>
                <TouchableOpacity
                    style={tw`mt-6 bg-[#7C3AED] px-8 py-3 rounded-xl`}
                    onPress={() => router.push('/(customer)')}
                >
                    <Text style={tw`text-white font-semibold`}>Browse Restaurants</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-[#0A0A0A] pb-16`}>

            {/* Header */}
            <View style={tw`px-5 pt-14 pb-4 flex-row items-center justify-between`}>
                <View>
                    <Text style={tw`text-white text-2xl font-bold`}>Your Cart</Text>
                    <Text style={tw`text-[#A0A0A0] text-sm mt-1`}>
                        {restaurantName} • {totalItems} item{totalItems !== 1 ? 's' : ''}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={clearCart}
                    style={tw`bg-[#141414] border border-[#2A2A2A] px-3 py-2 rounded-xl`}
                >
                    <Text style={tw`text-red-400 text-sm font-medium`}>Clear</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Cart Items */}
                <View style={tw`px-5 mb-6`}>
                    {items.map(({ menuItem, quantity }) => (
                        <View
                            key={menuItem.id}
                            style={tw`flex-row items-center py-4 border-b border-[#1E1E1E]`}
                        >
                            {/* Item Image */}
                            <View style={tw`w-16 h-16 rounded-xl bg-[#1E1E1E] items-center justify-center mr-4 overflow-hidden`}>
                                {menuItem.image_url ? (
                                    <Image
                                        source={{ uri: menuItem.image_url }}
                                        style={tw`w-full h-full`}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Ionicons name="fast-food-outline" size={24} color={colors.textMuted} />
                                )}
                            </View>

                            {/* Item Details */}
                            <View style={tw`flex-1`}>
                                <Text style={tw`text-white font-semibold text-base`} numberOfLines={1}>
                                    {menuItem.name}
                                </Text>
                                <Text style={tw`text-[#7C3AED] font-bold text-sm mt-1`}>
                                    {formatCurrency(menuItem.price * quantity)}
                                </Text>
                                {quantity > 1 && (
                                    <Text style={tw`text-[#555555] text-xs mt-0.5`}>
                                        {formatCurrency(menuItem.price)} each
                                    </Text>
                                )}
                            </View>

                            {/* Quantity Controls */}
                            <View style={tw`flex-row items-center gap-3`}>
                                <TouchableOpacity
                                    style={tw`w-8 h-8 bg-[#1E1E1E] rounded-full items-center justify-center`}
                                    onPress={() => decrementItem(menuItem.id)}
                                >
                                    <Ionicons name="remove" size={16} color="white" />
                                </TouchableOpacity>
                                <Text style={tw`text-white font-bold text-base w-4 text-center`}>
                                    {quantity}
                                </Text>
                                <TouchableOpacity
                                    style={tw`w-8 h-8 bg-[#7C3AED] rounded-full items-center justify-center`}
                                    onPress={() => incrementItem(menuItem.id)}
                                >
                                    <Ionicons name="add" size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Order Summary */}
                <View style={tw`mx-5 bg-[#141414] rounded-2xl p-5 mb-6`}>
                    <Text style={tw`text-white font-bold text-lg mb-4`}>Order Summary</Text>

                    <View style={tw`flex-row justify-between mb-3`}>
                        <Text style={tw`text-[#A0A0A0]`}>Subtotal</Text>
                        <Text style={tw`text-white font-semibold`}>{formatCurrency(subtotal)}</Text>
                    </View>

                    <View style={tw`flex-row justify-between mb-3`}>
                        <Text style={tw`text-[#A0A0A0]`}>Delivery fee</Text>
                        <Text style={tw`text-[#A0A0A0] text-sm`}>Calculated at checkout</Text>
                    </View>

                    <View style={tw`h-px bg-[#2A2A2A] my-3`} />

                    <View style={tw`flex-row justify-between`}>
                        <Text style={tw`text-white font-bold text-base`}>Total</Text>
                        <Text style={tw`text-[#7C3AED] font-bold text-base`}>
                            {formatCurrency(subtotal)}+
                        </Text>
                    </View>
                </View>

            </ScrollView>

            {/* Checkout Button */}
            <View style={tw`px-5 pb-8 pt-4 bg-[#0A0A0A] border-t border-[#1E1E1E]`}>
                <TouchableOpacity
                    style={tw`bg-[#7C3AED] py-4 rounded-xl items-center`}
                    onPress={() => router.push('/(customer)/checkout')}
                >
                    <Text style={tw`text-white font-bold text-base`}>
                        Proceed to Checkout
                    </Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}