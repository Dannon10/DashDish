import React, { Component, ReactNode } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import colors from '../constants/colors';

interface Props {
    children: ReactNode;
    // Optional custom fallback — if not provided uses default error UI
    fallback?: (error: Error, reset: () => void) => ReactNode;
    // For per-screen use — show go back button
    onGoBack?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Log to console in dev — swap for Sentry/Crashlytics in production
        console.error('[ErrorBoundary] caught:', error.message, info.componentStack);
    }

    reset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        const { hasError, error } = this.state;
        const { children, fallback, onGoBack } = this.props;

        if (!hasError) return children;

        // Custom fallback provided by parent
        if (fallback && error) return fallback(error, this.reset);

        // Default error UI
        return (
            <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center px-8`}>
                <View style={tw`w-20 h-20 rounded-full bg-[${colors.surfaceElevated}] items-center justify-center mb-5`}>
                    <Ionicons name="alert-circle-outline" size={38} color={colors.error} />
                </View>

                <Text weight='bold' style={tw`text-[${colors.textPrimary}] text-xl mb-2 text-center`}>
                    Something went wrong
                </Text>
                <Text style={tw`text-[${colors.textSecondary}] text-sm text-center mb-8`}>
                    An unexpected error occurred. You can try again or go back.
                </Text>

                {/* Error message in dev */}
                {__DEV__ && error && (
                    <View style={tw`w-full mb-6 p-3 rounded-xl bg-[${colors.surfaceElevated}]`}>
                        <Text style={tw`text-[${colors.error}] text-xs font-mono`} numberOfLines={4}>
                            {error.message}
                        </Text>
                    </View>
                )}

                <View style={tw`w-full gap-3`}>
                    {/* Retry */}
                    <TouchableOpacity
                        onPress={this.reset}
                        style={tw`w-full py-4 rounded-xl bg-[${colors.primary}] items-center justify-center flex-row gap-2`}
                    >
                        <Ionicons name="refresh-outline" size={18} color="white" />
                        <Text weight='bold' style={tw`text-white`}>Try Again</Text>
                    </TouchableOpacity>

                    {/* Go back — only shown when onGoBack is provided */}
                    {onGoBack && (
                        <TouchableOpacity
                            onPress={onGoBack}
                            style={[
                                tw`w-full py-4 rounded-xl items-center justify-center flex-row gap-2`,
                                { borderWidth: 1, borderColor: colors.border },
                            ]}
                        >
                            <Ionicons name="arrow-back-outline" size={18} color={colors.textSecondary} />
                            <Text weight='semiBold' style={tw`text-[${colors.textSecondary}]`}>Go Back</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    }
}