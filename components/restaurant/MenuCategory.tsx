import React from "react";
import { View } from 'react-native';
import { Text } from '../../components/ui/AppText';
import tw from 'twrnc';
import { MenuCategoryWithItems } from '../../types/restaurant.types';
import MenuItem from './MenuItem';

interface Props {
    category: MenuCategoryWithItems;
    restaurantId: string;
    restaurantName: string;
    restaurantLat: number;
    restaurantLng: number;
}

export default function MenuCategory({
    category,
    restaurantId,
    restaurantName,
    restaurantLat,
    restaurantLng,
}: Props) {
    const availableItems = category.menu_items.filter(item => item.is_available);

    if (availableItems.length === 0) return null;

    return (
        <View style={tw`mb-6`}>
            <Text weight='bold' style={tw`text-white text-lg mb-2`}>
                {category.name}
            </Text>
            {availableItems.map(item => (
                <MenuItem
                    key={item.id}
                    item={item}
                    restaurantId={restaurantId}
                    restaurantName={restaurantName}
                    restaurantLat={restaurantLat}
                    restaurantLng={restaurantLng}
                />
            ))}
        </View>
    );
}