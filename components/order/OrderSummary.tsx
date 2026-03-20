import React from 'react';
import { View } from 'react-native';
import { Text } from '../../components/ui/AppText';
import tw from 'twrnc';
import colors from '../../constants/colors';

interface OrderItem {
    id: string;
    quantity: number;
    unit_price: number;
    menu_items?: { name: string } | null;
}

interface OrderSummaryProps {
    restaurantName?: string;
    items?: OrderItem[];
    totalAmount: number;
}

export default function OrderSummary({ restaurantName, items, totalAmount }: OrderSummaryProps) {
    return (
        <View style={tw`mx-5`}>
            <Text weight="semiBold" style={tw`text-[${colors.textPrimary}] text-base mb-3`}>
                {restaurantName}
            </Text>

            {items?.map((item) => (
                <View key={item.id} style={tw`flex-row justify-between py-1.5`}>
                    <Text style={tw`text-[${colors.textSecondary}] text-sm`}>
                        {item.quantity}× {item.menu_items?.name}
                    </Text>
                    <Text style={tw`text-[${colors.textSecondary}] text-sm`}>
                        ₦{(item.unit_price * item.quantity).toLocaleString()}
                    </Text>
                </View>
            ))}

            <View
                style={tw`flex-row justify-between pt-3 mt-1 border-t border-[${colors.border}]`}
            >
                <Text weight="semiBold" style={tw`text-[${colors.textPrimary}]`}>
                    Total
                </Text>
                <Text weight="semiBold" style={tw`text-[${colors.textPrimary}]`}>
                    ₦{totalAmount.toLocaleString()}
                </Text>
            </View>
        </View>
    );
}