import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import colors from '../../../constants/colors';

interface Props {
    totalEarnings: number;
    totalDeliveries: number;
    totalDistanceKm: number;
}

function StatCard({
    value,
    label,
    valueColor,
}: {
    value: string;
    label: string;
    valueColor?: string;
}) {
    return (
        <View style={tw`flex-1 p-4 rounded-2xl bg-[${colors.surfaceElevated}] items-center`}>
            <Text style={[tw`text-xl font-bold`, { color: valueColor ?? colors.textPrimary }]}>
                {value}
            </Text>
            <Text style={tw`text-[${colors.textMuted}] text-[10px] mt-1 text-center`}>
                {label}
            </Text>
        </View>
    );
}

export default function EarningsStats({ totalEarnings, totalDeliveries, totalDistanceKm }: Props) {
    return (
        <View style={tw`flex-row mx-5 mb-4 gap-3`}>
            <StatCard
                value={`₦${totalEarnings.toLocaleString()}`}
                label="Total Earned"
                valueColor={colors.success}
            />
            <StatCard
                value={`${totalDeliveries}`}
                label="Deliveries"
            />
            <StatCard
                value={`${totalDistanceKm.toFixed(1)}`}
                label="km Covered"
            />
        </View>
    );
}