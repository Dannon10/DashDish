import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../../components/ui/AppText';
import tw from 'twrnc';
import colors from '../../../constants/colors';

export type Period = 'week' | 'month' | 'all';

const LABELS: Record<Period, string> = {
    week: 'Week',
    month: 'This Month',
    all: 'All Time',
};

interface Props {
    value: Period;
    onChange: (period: Period) => void;
}

export default function PeriodSelector({ value, onChange }: Props) {
    return (
        <View style={tw`flex-row mx-5 mb-4 bg-[${colors.surfaceElevated}] rounded-xl p-1`}>
            {(Object.keys(LABELS) as Period[]).map((p) => (
                <TouchableOpacity
                    key={p}
                    onPress={() => onChange(p)}
                    style={[
                        tw`flex-1 py-2 rounded-lg items-center`,
                        value === p && { backgroundColor: colors.primary },
                    ]}
                >
                    <Text weight='semiBold' style={[
                        tw`text-xs`,
                        { color: value === p ? colors.white : colors.textMuted },
                    ]}>
                        {LABELS[p]}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}