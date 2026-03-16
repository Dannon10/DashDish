import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import colors from '../../../constants/colors';

interface Props {
    todayEarnings: number;
    todayDeliveries: number;
}

export default function EarningsHero({ todayEarnings, todayDeliveries }: Props) {
    return (
        <View style={tw`mx-5 mb-4 p-5 rounded-2xl bg-[${colors.primary}]`}>
            <Text style={tw`text-white/70 text-sm mb-1`}>Today's Earnings</Text>
            <Text style={tw`text-white text-4xl font-bold`}>
                ₦{todayEarnings.toLocaleString()}
            </Text>
            <View style={tw`flex-row items-center gap-1.5 mt-2`}>
                <Ionicons name="bicycle-outline" size={14} color="rgba(255,255,255,0.7)" />
                <Text style={tw`text-white/70 text-xs`}>
                    {todayDeliveries} {todayDeliveries === 1 ? 'delivery' : 'deliveries'} today
                </Text>
            </View>
        </View>
    );
}