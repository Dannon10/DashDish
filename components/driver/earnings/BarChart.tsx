import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import tw from 'twrnc';
import colors from '../../../constants/colors';
import type { OrderWithItems } from '../../../types/order.types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface Props {
    deliveries: OrderWithItems[];
}

export default function WeeklyBarChart({ deliveries }: Props) {
    const today = new Date();
    const mondayOffset = (today.getDay() + 6) % 7;

    const dailyEarnings = DAYS.map((_, i) => {
        const date = new Date(today);
        date.setDate(today.getDate() - mondayOffset + i);

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        return deliveries
            .filter((d) => {
                const t = new Date(d.created_at).getTime();
                return t >= dayStart.getTime() && t <= dayEnd.getTime();
            })
            .reduce((sum, d) => sum + d.delivery_fee, 0);
    });

    const maxEarnings = Math.max(...dailyEarnings, 1);
    const todayIdx = mondayOffset > 6 ? 6 : mondayOffset;
    const chartWidth = SCREEN_WIDTH - 80;
    const barWidth = Math.floor(chartWidth / 7) - 6;

    return (
        <View style={tw`mx-5 mb-4 p-4 rounded-2xl bg-[${colors.surfaceElevated}]`}>
            <Text style={tw`text-[${colors.textPrimary}] font-semibold mb-4`}>This Week</Text>
            <View style={tw`flex-row items-end justify-between`}>
                {dailyEarnings.map((amount, i) => {
                    const isToday = i === todayIdx;
                    const heightPx = amount > 0
                        ? Math.max((amount / maxEarnings) * 120, 10)
                        : 4;

                    return (
                        <View key={i} style={[tw`items-center`, { width: barWidth + 6 }]}>
                            {amount > 0 && (
                                <Text style={tw`text-[${colors.textMuted}] text-[8px] mb-1`}>
                                    {amount >= 1000
                                        ? `₦${(amount / 1000).toFixed(1)}k`
                                        : `₦${amount}`}
                                </Text>
                            )}
                            <View
                                style={{
                                    width: barWidth,
                                    height: heightPx,
                                    borderRadius: 4,
                                    borderTopLeftRadius: 6,
                                    borderTopRightRadius: 6,
                                    backgroundColor: isToday
                                        ? colors.primary
                                        : amount > 0
                                        ? `${colors.primary}55`
                                        : colors.border,
                                }}
                            />
                            <Text
                                style={[
                                    tw`text-[10px] mt-1.5 font-medium`,
                                    { color: isToday ? colors.primary : colors.textMuted },
                                ]}
                            >
                                {DAYS[i]}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}