import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { getRestaurantWithMenu } from '../../services/restaurant.service';
import { RestaurantWithMenu } from '../../types/restaurant.types';
import MenuCategory from '../../components/restaurant/MenuCategory';
import useCartStore from '../../store/useCartStore';
import formatCurrency from '../../utils/formatCurrency';
import colors from '../../constants/colors';

export default function RestaurantDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [restaurant, setRestaurant] = useState<RestaurantWithMenu | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { items, getTotalItems, getTotalPrice, restaurantId } = useCartStore();

    // Cart belongs to a different restaurant
    const cartIsFromHere = restaurantId === id;
    const cartItemCount = cartIsFromHere ? getTotalItems() : 0;
    const cartTotal = cartIsFromHere ? getTotalPrice() : 0;

    useEffect(() => {
        loadRestaurant();
    }, [id]);

    const loadRestaurant = async () => {
        if (!id) return;
        setLoading(true);
        const { data, error } = await getRestaurantWithMenu(id);
        if (error) {
            setError(error);
        } else {
            setRestaurant(data as RestaurantWithMenu);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={tw`flex-1 bg-[#0A0A0A] items-center justify-center`}>
                <ActivityIndicator color={colors.primary} size="large" />
            </View>
        );
    }

    if (error || !restaurant) {
        return (
            <View style={tw`flex-1 bg-[#0A0A0A] items-center justify-center px-6`}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
                <Text style={tw`text-white font-semibold text-lg mt-4`}>
                    Failed to load restaurant
                </Text>
                <TouchableOpacity
                    style={tw`mt-4 bg-[#7C3AED] px-6 py-3 rounded-xl`}
                    onPress={loadRestaurant}
                >
                    <Text style={tw`text-white font-semibold`}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-[#0A0A0A]`}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Hero Image */}
                <View style={tw`h-80 bg-[#141414] relative`}>
                    {restaurant.image_url ? (
                        <Image
                            source={{ uri: restaurant.image_url }}
                            style={tw`w-full h-full`}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={tw`w-full h-full items-center justify-center`}>
                            <Ionicons name="restaurant-outline" size={64} color={colors.textMuted} />
                        </View>
                    )}

                    {/* Back Button */}
                    <TouchableOpacity
                        style={tw`absolute top-12 left-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center`}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>

                    {/* Open/Closed Badge */}
                    <View style={tw`absolute top-12 right-4 px-3 py-1 rounded-full ${restaurant.is_open ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}>
                        <Text style={tw`text-xs font-semibold ${restaurant.is_open ? 'text-green-400' : 'text-red-400'
                            }`}>
                            {restaurant.is_open ? 'Open Now' : 'Closed'}
                        </Text>
                    </View>
                </View>

                {/* Restaurant Info */}
                <View style={tw`px-5 pt-5 pb-4 border-b border-[#1E1E1E]`}>
                    <Text style={tw`text-white text-2xl font-bold mb-1`}>
                        {restaurant.name}
                    </Text>
                    <Text style={tw`text-[#A0A0A0] text-sm mb-4`}>
                        {restaurant.description}
                    </Text>

                    {/* Stats Row */}
                    <View style={tw`flex-row gap-5`}>
                        <View style={tw`flex-row items-center gap-1`}>
                            <Ionicons name="star" size={15} color="#F59E0B" />
                            <Text style={tw`text-white font-semibold text-sm`}>
                                {restaurant.rating.toFixed(1)}
                            </Text>
                        </View>
                        <View style={tw`flex-row items-center gap-1`}>
                            <Ionicons name="time-outline" size={15} color={colors.textMuted} />
                            <Text style={tw`text-[#A0A0A0] text-sm`}>
                                {restaurant.delivery_time} mins
                            </Text>
                        </View>
                        <View style={tw`flex-row items-center gap-1`}>
                            <Ionicons name="location-outline" size={15} color={colors.textMuted} />
                            <Text style={tw`text-[#A0A0A0] text-sm`}>
                                {restaurant.address}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Menu */}
                <View style={tw`px-5 pt-5 pb-32`}>
                    <Text style={tw`text-white font-bold text-xl mb-4`}>Menu</Text>
                    {restaurant.menu_categories
                        .sort((a, b) => a.order_index - b.order_index)
                        .map(category => (
                            <MenuCategory
                                key={category.id}
                                category={category}
                                restaurantId={restaurant.id}
                                restaurantName={restaurant.name}
                            />
                        ))}
                </View>

            </ScrollView>

            {/* Sticky Cart Bar */}
            {cartItemCount > 0 && (
                <View style={tw`absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-[#0A0A0A] border-t border-[#1E1E1E]`}>
                    <TouchableOpacity
                        style={tw`bg-[#7C3AED] py-4 rounded-xl flex-row items-center justify-between px-5`}
                        onPress={() => router.push('/(customer)/cart')}
                    >
                        <View style={tw`bg-[#5B21B6] w-7 h-7 rounded-full items-center justify-center`}>
                            <Text style={tw`text-white font-bold text-xs`}>{cartItemCount}</Text>
                        </View>
                        <Text style={tw`text-white font-bold text-base`}>View Cart</Text>
                        <Text style={tw`text-white font-semibold text-base`}>
                            {formatCurrency(cartTotal)}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}