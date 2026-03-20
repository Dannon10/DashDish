import React from 'react';
import { View, Image, TouchableOpacity, Linking } from 'react-native';
import { Text } from '../../components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import colors from '../../constants/colors';
import type { DriverProfile } from '../../hooks/useDriverProfile';

interface DriverCardProps {
    profile: DriverProfile;
}

export default function DriverCard({ profile }: DriverCardProps) {
    return (
        <View style={tw`mx-5 mb-4 rounded-2xl bg-[${colors.surfaceElevated}] overflow-hidden`}>
            {/* Avatar + name row */}
            <View style={tw`flex-row items-center p-4`}>
                {profile.avatar_url ? (
                    <Image
                        source={{ uri: profile.avatar_url }}
                        style={tw`w-14 h-14 rounded-full`}
                    />
                ) : (
                    <View style={tw`w-14 h-14 rounded-full bg-[${colors.primaryDark}] items-center justify-center`}>
                        <Ionicons name="person" size={26} color={colors.white} />
                    </View>
                )}

                <View style={tw`flex-1 ml-3`}>
                    <Text weight="semiBold" style={tw`text-[${colors.textPrimary}] text-base`}>
                        {profile.full_name}
                    </Text>
                    <Text style={tw`text-[${colors.textSecondary}] text-xs mt-0.5`}>
                        Your delivery driver
                    </Text>
                </View>

                {profile.phone && (
                    <TouchableOpacity
                        style={tw`w-10 h-10 rounded-full bg-[${colors.primary}] items-center justify-center`}
                        onPress={() => Linking.openURL(`tel:${profile.phone}`)}
                    >
                        <Ionicons name="call" size={18} color={colors.white} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Divider */}
            <View style={[tw`mx-4`, { height: 1, backgroundColor: colors.border }]} />

            {/* Vehicle info + stars + delivery count */}
            <View style={tw`flex-row items-center px-4 py-3 gap-4`}>
                {profile.vehicle_info ? (
                    <View style={tw`flex-row items-center gap-1.5 flex-1`}>
                        <Ionicons name="bicycle-outline" size={14} color={colors.textMuted} />
                        <Text style={tw`text-[${colors.textSecondary}] text-xs`} numberOfLines={1}>
                            {profile.vehicle_info}
                        </Text>
                    </View>
                ) : <View style={tw`flex-1`} />}

                <View style={tw`flex-row items-center gap-3`}>
                    {/* Star rating — only shown if driver has ratings */}
                    {profile.avgRating !== null && (
                        <View style={tw`flex-row items-center gap-0.5`}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name={star <= Math.round(profile.avgRating!) ? 'star' : 'star-outline'}
                                    size={13}
                                    color={colors.warning}
                                />
                            ))}
                        </View>
                    )}

                    {/* Delivery count */}
                    <View style={tw`flex-row items-center gap-1`}>
                        <Ionicons name="checkmark-circle-outline" size={14} color={colors.success} />
                        <Text style={tw`text-xs`}>
                            <Text weight="semiBold" style={{ color: colors.success }}>
                                {profile.deliveryCount}
                            </Text>
                            <Text style={tw`text-[${colors.textMuted}]`}> deliveries</Text>
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}