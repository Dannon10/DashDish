import { View, Text, TextInput } from 'react-native';
import React from 'react';
import tw from 'twrnc';
import colors from '../../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function FieldRow({
    icon,
    label,
    value,
    onChangeText,
    placeholder,
    isLast = false,
    keyboardType = 'default',
}: {
    icon: string;
    label: string;
    value: string;
    onChangeText?: (t: string) => void;
    placeholder?: string;
    isLast?: boolean;
    keyboardType?: any;
}) {
    return (
        <View style={[
            tw`flex-row items-center px-4 py-3.5`,
            !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        ]}>
            <View style={tw`w-8 h-8 rounded-full bg-[${colors.primary}22] items-center justify-center mr-3`}>
                <Ionicons name={icon as any} size={16} color={colors.primary} />
            </View>
            <View style={tw`flex-1`}>
                <Text style={tw`text-[${colors.textMuted}] text-[10px] uppercase tracking-widest mb-0.5`}>
                    {label}
                </Text>
                {onChangeText ? (
                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
                        placeholderTextColor={colors.textMuted}
                        keyboardType={keyboardType}
                        style={[tw`text-[${colors.textPrimary}] text-sm p-0`]}
                    />
                ) : (
                    <Text style={tw`text-[${colors.textSecondary}] text-sm`}>{value || placeholder}</Text>
                )}
            </View>
        </View>
    );
}