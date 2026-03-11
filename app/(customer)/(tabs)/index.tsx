import React from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    FlatList,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import tw from 'twrnc';
import { getRestaurants, searchRestaurants } from '../../../services/restaurant.service';
import { Restaurant } from '../../../types/restaurant.types';
import RestaurantCard from '../../../components/restaurant/RestaurantCard';
import SkeletonCard from '../../../components/ui/SkeletonCard';
import useAuthStore from '../../../store/useAuthStore';
import colors from '../../../constants/colors';

const CATEGORIES = ['All', 'Fast Food', 'Nigerian', 'Grills', 'Pizza', 'Asian', 'Local'];

export default function CustomerHome() {
    const { profile } = useAuthStore();
    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [filtered, setFiltered] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const firstName = profile?.full_name?.split(' ')[0] ?? 'there';

    const loadRestaurants = async () => {
        const { data } = await getRestaurants();
        setRestaurants(data);
        setFiltered(data);
        setLoading(false);
    };

    // Reload when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadRestaurants();
        }, [])
    );

    // Handle search
    useEffect(() => {
        if (searchQuery.trim() === '') {
            applyCategory(activeCategory, restaurants);
            return;
        }

        const timeout = setTimeout(async () => {
            const { data } = await searchRestaurants(searchQuery);
            setFiltered(data);
        }, 400); // debounce 400ms

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Apply category filter
    const applyCategory = (category: string, list: Restaurant[]) => {
        setActiveCategory(category);
        if (category === 'All') {
            setFiltered(list);
        } else {
            setFiltered(list.filter(r => r.category === category));
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadRestaurants();
        setRefreshing(false);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <View style={tw`flex-1 bg-[#0A0A0A]`}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Header */}
                <View style={tw`px-5 pt-14 pb-4`}>
                    <Text style={tw`text-[#A0A0A0] text-base`}>
                        {getGreeting()},
                    </Text>
                    <Text style={tw`text-white text-2xl font-bold mt-1`}>
                        {firstName} 👋
                    </Text>
                </View>

                {/* Search Bar */}
                <View style={tw`px-5 mb-5`}>
                    <View style={tw`flex-row items-center bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 gap-3`}>
                        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                        <TextInput
                            style={tw`flex-1 text-white text-base`}
                            placeholder="Search restaurants or cuisines..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => {
                                setSearchQuery('');
                                applyCategory(activeCategory, restaurants);
                            }}>
                                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Category Pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={tw`px-5 gap-2 mb-6`}
                >
                    {CATEGORIES.map(category => (
                        <TouchableOpacity
                            key={category}
                            style={tw`px-4 py-2 rounded-full border ${activeCategory === category
                                    ? 'bg-[#7C3AED] border-[#7C3AED]'
                                    : 'bg-[#141414] border-[#2A2A2A]'
                                }`}
                            onPress={() => {
                                setSearchQuery('');
                                applyCategory(category, restaurants);
                            }}
                        >
                            <Text style={tw`text-sm font-medium ${activeCategory === category ? 'text-white' : 'text-[#A0A0A0]'
                                }`}>
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Restaurant Count */}
                <View style={tw`px-5 mb-4`}>
                    <Text style={tw`text-[#A0A0A0] text-sm`}>
                        {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''} available
                    </Text>
                </View>

                {/* Restaurant List */}
                <View style={tw`px-5 pb-6`}>
                    {loading ? (
                        // Skeleton loading state
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : filtered.length === 0 ? (
                        // Empty state
                        <View style={tw`items-center justify-center py-20`}>
                            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                            <Text style={tw`text-white font-semibold text-lg mt-4`}>
                                No restaurants found
                            </Text>
                            <Text style={tw`text-[#A0A0A0] text-sm mt-2 text-center`}>
                                Try a different search or category
                            </Text>
                        </View>
                    ) : (
                        // Restaurant cards
                        filtered.map(restaurant => (
                            <RestaurantCard 
                            key={restaurant.id} 
                            restaurant={restaurant} 
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}