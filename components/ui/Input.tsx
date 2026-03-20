import React, { useState } from 'react';
import { View, TextInput as RNTextInput, TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import tw from '../../utils/tw';
import colors from '../../constants/colors';

interface Props {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    label?: string;
    error?: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    style?: ViewStyle;
}

export function Input({
    placeholder,
    value,
    onChangeText,
    label,
    error,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    style
}: Props) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const showPassword = secureTextEntry && isPasswordVisible;

    return (
        <View style={[tw`mb-4`, style]}>
            {label && (
                <Text style={tw`mb-2 text-white`} variant="label">
                    {label}
                </Text>
            )}

            <View style={tw`relative`}>
                <RNTextInput
                    style={[
                        tw`bg-[#1E1E1E] border rounded-lg px-4 py-3 text-white font-montserrat`,
                        isFocused ? tw`border-primary` : tw`border-[#333]`,
                        error ? tw`border-red-500` : tw``,
                        { minHeight: 48 }
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={secureTextEntry && !showPassword}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        style={tw`absolute right-3 top-3`}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                        <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={20}
                            color={colors.textMuted}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && (
                <Text style={tw`mt-1 text-red-500`} variant="caption">
                    {error}
                </Text>
            )}
        </View>
    );
}
