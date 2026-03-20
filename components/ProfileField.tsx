import React from 'react';
import { View, TextInput } from 'react-native';
import { Text } from './ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import colors from '../constants/colors';

interface ProfileFieldProps {
    icon: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    keyboardType?: any;
    multiline?: boolean;
}

export function ProfileField({
    icon,
    label,
    value,
    onChange,
    placeholder,
    keyboardType = 'default',
    multiline = false,
}: ProfileFieldProps) {
    return (
        <View style={tw`flex-row items-start px-4 py-3`}>
            <View style={tw`w-9 h-9 rounded-full bg-[${colors.border}] items-center justify-center mr-3 mt-0.5`}>
                <Ionicons name={icon as any} size={18} color={colors.textMuted} />
            </View>
            <View style={tw`flex-1`}>
                <Text style={tw`text-[${colors.textMuted}] text-[10px] uppercase tracking-widest mb-0.5`}>
                    {label}
                </Text>
                <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    style={[
                        tw`text-[${colors.textPrimary}] text-sm p-0`,
                        multiline && tw`mt-1`,
                        { outline: 'none' } as any,
                    ]}
                />
            </View>
        </View>
    );
}