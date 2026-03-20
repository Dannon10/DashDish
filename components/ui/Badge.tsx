import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Text } from './AppText';
import tw from '../../utils/tw';
import colors from '../../constants/colors';

type Variant = 'success' | 'error' | 'warning' | 'info' | 'default';
type Size = 'small' | 'medium' | 'large';

interface Props {
    text: string;
    variant?: Variant;
    size?: Size;
    style?: ViewStyle;
}

const variantStyles: Record<Variant, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
    default: 'bg-gray-500',
};

const sizeStyles: Record<Size, string> = {
    small: 'px-2 py-1',
    medium: 'px-3 py-1',
    large: 'px-4 py-2',
};

const textSizeStyles: Record<Size, any> = {
    small: { variant: 'caption' },
    medium: { variant: 'caption' },
    large: { variant: 'body' },
};

export function Badge({
    text,
    variant = 'default',
    size = 'medium',
    style
}: Props) {
    return (
        <View
            style={[
                tw`${variantStyles[variant]} ${sizeStyles[size]} rounded-full`,
                style
            ]}
        >
            <Text
                style={tw`text-white font-montserrat-medium text-center`}
                {...textSizeStyles[size]}
            >
                {text}
            </Text>
        </View>
    );
}
