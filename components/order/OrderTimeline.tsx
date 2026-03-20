import React from 'react';
import { View } from 'react-native';
import { Text } from '../../components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import colors from '../../constants/colors';
import { STATUS_STEPS, stepIndex } from '../../constants/orderTracking';
import type { OrderStatus } from '../../types/database.types';

interface OrderTimelineProps {
    currentStatus: OrderStatus;
    accentColor: string;
}

export default function OrderTimeline({ currentStatus, accentColor }: OrderTimelineProps) {
    const currentStepIdx = stepIndex(currentStatus);

    return (
        <View style={tw`mx-5 mb-4`}>
            <Text weight="semiBold" style={tw`text-[${colors.textPrimary}] text-base mb-4`}>
                Order Progress
            </Text>

            {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isActive = idx === currentStepIdx;
                const isUpcoming = idx > currentStepIdx;
                const dotColor = isCompleted || isActive ? accentColor : colors.border;
                const isLast = idx === STATUS_STEPS.length - 1;

                return (
                    <View key={step.key} style={tw`flex-row`}>
                        {/* Icon column */}
                        <View style={tw`items-center mr-4`}>
                            <View
                                style={[
                                    tw`w-8 h-8 rounded-full items-center justify-center`,
                                    {
                                        backgroundColor: isUpcoming
                                            ? colors.surfaceElevated
                                            : `${dotColor}22`,
                                        borderWidth: isActive ? 2 : 0,
                                        borderColor: dotColor,
                                    },
                                ]}
                            >
                                <Ionicons
                                    name={step.icon as any}
                                    size={16}
                                    color={isUpcoming ? colors.textMuted : dotColor}
                                />
                            </View>

                            {!isLast && (
                                <View
                                    style={[
                                        tw`w-0.5 flex-1 my-1`,
                                        {
                                            backgroundColor: isCompleted
                                                ? accentColor
                                                : colors.border,
                                            minHeight: 20,
                                        },
                                    ]}
                                />
                            )}
                        </View>

                        {/* Label column */}
                        <View style={tw`flex-1 pb-5 justify-center`}>
                            <Text
                                weight="medium"
                                style={[
                                    {
                                        color: isUpcoming
                                            ? colors.textMuted
                                            : isActive
                                            ? colors.textPrimary
                                            : colors.textSecondary,
                                        fontSize: isActive ? 15 : 14,
                                    },
                                ]}
                            >
                                {step.label}
                            </Text>

                            {isActive && (
                                <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                                    In progress...
                                </Text>
                            )}
                            {isCompleted && (
                                <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                                    Done ✓
                                </Text>
                            )}
                        </View>
                    </View>
                );
            })}
        </View>
    );
}