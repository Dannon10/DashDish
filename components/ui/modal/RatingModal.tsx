import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    Animated,
} from 'react-native';
import { Text } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import colors from '../../../constants/colors';

interface Props {
    visible: boolean;
    driverProfile: { full_name: string; avatar_url: string | null } | null;
    onSubmit: (rating: number) => Promise<void>;
    onSkip: () => void;
}

const STAR_LABELS = ['', 'Terrible', 'Bad', 'Okay', 'Good', 'Excellent!'];

export default function RatingModal({ visible, driverProfile, onSubmit, onSkip }: Props) {
    const [selected, setSelected] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setSelected(0);
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 8,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            scaleAnim.setValue(0.8);
            opacityAnim.setValue(0);
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (selected === 0 || submitting) return;
        setSubmitting(true);
        await onSubmit(selected);
        setSubmitting(false);
    };

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <Animated.View
                style={[
                    tw`flex-1 items-center justify-center px-6`,
                    { backgroundColor: 'rgba(0,0,0,0.7)', opacity: opacityAnim },
                ]}
            >
                <Animated.View
                    style={[
                        tw`w-full rounded-3xl bg-[${colors.surface}] overflow-hidden`,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    {/* Success header */}
                    <View style={tw`bg-[${colors.success}] py-6 items-center`}>
                        <View style={tw`w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-2`}>
                            <Ionicons name="checkmark-circle" size={40} color="white" />
                        </View>
                        <Text weight='bold' style={tw`text-white text-xl`}>Delivered!</Text>
                        <Text style={tw`text-white/80 text-sm mt-1`}>Your order has arrived</Text>
                    </View>

                    <View style={tw`p-6`}>
                        {/* Driver info */}
                        <View style={tw`items-center mb-5`}>
                            {driverProfile?.avatar_url ? (
                                <Image
                                    source={{ uri: driverProfile.avatar_url }}
                                    style={tw`w-16 h-16 rounded-full mb-2`}
                                />
                            ) : (
                                <View style={tw`w-16 h-16 rounded-full bg-[${colors.primaryDark}] items-center justify-center mb-2`}>
                                    <Ionicons name="person" size={28} color="white" />
                                </View>
                            )}
                            <Text weight='semiBold' style={tw`text-[${colors.textPrimary}] text-base`}>
                                {driverProfile?.full_name ?? 'Your Driver'}
                            </Text>
                            <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                                How was your delivery experience?
                            </Text>
                        </View>

                        {/* Stars */}
                        <View style={tw`flex-row justify-center gap-3 mb-2`}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity
                                    key={star}
                                    onPress={() => setSelected(star)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={star <= selected ? 'star' : 'star-outline'}
                                        size={38}
                                        color={star <= selected ? colors.warning : colors.border}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Star label */}
                        <Text
                            weight='semiBold'
                            style={[
                                tw`text-center text-sm mb-5`,
                                { color: selected > 0 ? colors.warning : colors.textMuted },
                            ]}
                        >
                            {selected > 0 ? STAR_LABELS[selected] : 'Tap a star to rate'}
                        </Text>

                        {/* Submit */}
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={selected === 0 || submitting}
                            style={[
                                tw`py-3.5 rounded-xl items-center justify-center mb-3`,
                                {
                                    backgroundColor: selected > 0 ? colors.primary : colors.border,
                                    opacity: submitting ? 0.7 : 1,
                                },
                            ]}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text weight='bold' style={tw`text-white`}>Submit Rating</Text>
                            )}
                        </TouchableOpacity>

                        {/* Skip */}
                        <TouchableOpacity onPress={onSkip} style={tw`items-center py-1`}>
                            <Text style={tw`text-[${colors.textMuted}] text-sm`}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}