import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { MenuItem as MenuItemType } from '../../types/restaurant.types';
import useCartStore from '../../store/useCartStore';
import formatCurrency from '../../utils/formatCurrency';
import colors from '../../constants/colors';

interface Props {
    item: MenuItemType;
    restaurantId: string;
    restaurantName: string;
}

export default function MenuItem({ item, restaurantId, restaurantName }: Props) {
    const { addItem, incrementItem, decrementItem, getItemQuantity } = useCartStore();
    const quantity = getItemQuantity(item.id);

    return (
        <View style={tw`flex-row items-center py-4 border-b border-[#1E1E1E]`}>
            {/* Item Info */}
            <View style={tw`flex-1 mr-4`}>
                <Text style={tw`text-white font-semibold text-base mb-1`}>
                    {item.name}
                </Text>
                {item.description && (
                    <Text style={tw`text-[#A0A0A0] text-sm mb-2`} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                <Text style={tw`text-[#7C3AED] font-bold text-base`}>
                    {formatCurrency(item.price)}
                </Text>
            </View>

            {/* Item Image + Add Button */}
            <View style={tw`items-center`}>
                {/* Image */}
                <View style={tw`w-35 h-30 rounded-xl bg-[#1E1E1E] items-center justify-center mb-2 overflow-hidden`}>
                    {item.image_url ? (
                        <Image
                            source={{ uri: item.image_url }}
                            style={tw`w-full h-full`}
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="fast-food-outline" size={32} color={colors.textMuted} />
                    )}
                </View>

                {/* Quantity Controls */}
                {quantity === 0 ? (
                    <TouchableOpacity
                        style={tw`bg-[#7C3AED] px-4 py-1.5 rounded-full`}
                        onPress={() => addItem(item, restaurantId, restaurantName)}
                    >
                        <Text style={tw`text-white font-semibold text-sm`}>Add</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={tw`flex-row items-center gap-3`}>
                        <TouchableOpacity
                            style={tw`w-7 h-7 bg-[#1E1E1E] rounded-full items-center justify-center`}
                            onPress={() => decrementItem(item.id)}
                        >
                            <Ionicons name="remove" size={16} color="white" />
                        </TouchableOpacity>
                        <Text style={tw`text-white font-bold text-base`}>{quantity}</Text>
                        <TouchableOpacity
                            style={tw`w-7 h-7 bg-[#7C3AED] rounded-full items-center justify-center`}
                            onPress={() => incrementItem(item.id)}
                        >
                            <Ionicons name="add" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}