import React from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import { Button } from './Button';
import { Ionicons } from '@expo/vector-icons';
import tw from '../../utils/tw';
import colors from '../../constants/colors';

interface Props {
    title: string;
    message: string;
    icon?: string;
    onRetry?: () => void;
}

export function ErrorState({
    title,
    message,
    icon = 'alert-circle-outline',
    onRetry
}: Props) {
    return (
        <View style={tw`flex-1 items-center justify-center p-8`}>
            <View style={tw`items-center mb-8`}>
                <Ionicons
                    name={icon as any}
                    size={64}
                    color={colors.error}
                    style={tw`mb-4`}
                />

                <Text
                    style={tw`text-white text-center mb-2`}
                    variant="heading"
                >
                    {title}
                </Text>

                <Text
                    style={tw`text-textMuted text-center`}
                    variant="body"
                >
                    {message}
                </Text>
            </View>

            {onRetry && (
                <Button
                    title="Try Again"
                    onPress={onRetry}
                    variant="primary"
                    size="medium"
                />
            )}
        </View>
    );
}

export { ErrorState };
