import React from 'react';
import { View, TouchableOpacity,
    Image} from 'react-native';
import { Text } from '../../components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import tw from 'twrnc';
import { Restaurant } from '../../types/restaurant.types';
import colors from '../../constants/colors';

interface Props {
    restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: Props) {
    return (
        <TouchableOpacity
            style={tw`mb-4 bg-[#141414] rounded-2xl overflow-hidden`}
            onPress={() => router.push(`/(customer)/restaurant/${restaurant.id}`)}
            activeOpacity={0.8}
        >
            {/* Restaurant Image */}
            <View style={tw`h-65 bg-[#1E1E1E] items-center justify-center`}>
                {restaurant.image_url ? (
                    <Image
                        source={{ uri: restaurant.image_url }}
                        style={tw`w-full h-full`}
                        resizeMode="cover"
                    />
                ) : (
                    <Ionicons name="restaurant-outline" size={48} color={colors.textMuted} />
                )}

                {/* Open/Closed Badge */}
                <View 
                style={tw`absolute top-3 right-3 px-2 py-1 rounded-full 
                    ${restaurant.is_open ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                    <Text 
                        weight='semiBold'
                        style={tw`text-xs 
                            ${restaurant.is_open ? 'text-green-400' : 'text-red-400'
                        }`}>
                        {restaurant.is_open ? 'Open' : 'Closed'}
                    </Text>
                </View>
            </View>

            {/* Restaurant Info */}
            <View style={tw`p-4`}>
                <View style={tw`flex-row items-center justify-between mb-1`}>
                    <Text 
                        variant='heading' 
                        weight='bold'
                        style={tw`text-white text-lg flex-1`} 
                        numberOfLines={1}>
                        {restaurant.name}
                    </Text>
                    {/* Rating */}
                    <View style={tw`flex-row items-center gap-1`}>
                        <Ionicons name="star" size={14} color="#F59E0B" />
                        <Text weight='semiBold' style={tw`text-[#F59E0B] text-sm`}>
                            {restaurant.rating.toFixed(1)}
                        </Text>
                    </View>
                </View>

                <Text style={tw`text-[#A0A0A0] text-sm mb-3`} numberOfLines={1}>
                    {restaurant.description}
                </Text>

                {/* Category + Delivery Time */}
                <View style={tw`flex-row items-center gap-4`}>
                    <View style={tw`flex-row items-center gap-1`}>
                        <Ionicons name="pricetag-outline" size={13} color={colors.textMuted} />
                        <Text style={tw`text-[#555555] text-xs`}>{restaurant.category}</Text>
                    </View>
                    <View style={tw`flex-row items-center gap-1`}>
                        <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                        <Text style={tw`text-[#555555] text-xs`}>{restaurant.delivery_time} mins</Text>
                    </View>
                    <View style={tw`flex-row items-center gap-1`}>
                        <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                        <Text style={tw`text-[#555555] text-xs`} numberOfLines={1}>
                            {restaurant.address.split(',')[0]}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}