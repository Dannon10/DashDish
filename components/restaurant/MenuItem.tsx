import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { Text } from '../../components/ui/AppText';
import { MenuItem as MenuItemType } from '../../types/restaurant.types';
import useCartStore from '../../store/useCartStore';
import formatCurrency from '../../utils/formatCurrency';
import colors from '../../constants/colors';

interface Props {
    item: MenuItemType;
    restaurantId: string;
    restaurantName: string;
    restaurantLat: number;
    restaurantLng: number;
}

export default function MenuItem({
    item,
    restaurantId,
    restaurantName,
    restaurantLat,
    restaurantLng,
}: Props) {
    const { addItem, incrementItem, decrementItem, getItemQuantity } = useCartStore();
    const quantity = getItemQuantity(item.id);

    return (
        <View style={tw`flex-row items-center py-4 border-b border-[#1E1E1E]`}>
            {/* Item info */}
            <View style={tw`flex-1 mr-4`}>
                <Text weight='semiBold' style={tw`text-white text-base mb-1`}>
                    {item.name}
                </Text>
                {item.description && (
                    <Text weight='medium' style={tw`text-[#A0A0A0] text-sm mb-2`} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}
                <Text weight='bold' style={tw`text-[#7C3AED] text-base`}>
                    {formatCurrency(item.price)}
                </Text>
            </View>

            {/* Image + quantity controls */}
            <View style={tw`items-center`}>
                <View style={tw`w-30 h-25 rounded-xl bg-[#1E1E1E] items-center justify-center mb-2 overflow-hidden`}>
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

                {quantity === 0 ? (
                    <TouchableOpacity
                        style={tw`bg-[#7C3AED] px-4 py-1.5 rounded-full`}
                        onPress={() =>
                            addItem(item, restaurantId, restaurantName, restaurantLat, restaurantLng)
                        }
                    >
                        <Text weight='semiBold' style={tw`text-white text-sm`}>Add</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={tw`flex-row items-center gap-3`}>
                        <TouchableOpacity
                            style={tw`w-7 h-7 bg-[#1E1E1E] rounded-full items-center justify-center`}
                            onPress={() => decrementItem(item.id)}
                        >
                            <Ionicons name="remove" size={16} color="white" />
                        </TouchableOpacity>
                        <Text weight='bold' style={tw`text-white text-base`}>{quantity}</Text>
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