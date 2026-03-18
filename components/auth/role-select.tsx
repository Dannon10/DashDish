import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { UserRole } from '../../types/auth.types';
import colors from '../../constants/colors';

type Props = {
    role: UserRole;
    setRole: (role: UserRole) => void;
};

export default function RoleSelect({ role, setRole }: Props) {
    return (
        <View style={tw`mb-6`}>
            <Text style={tw`text-[#A0A0A0] text-sm mb-3`}>
                I want to
            </Text>

            <View style={tw`flex-row gap-3`}>

                {/* Customer */}
                <TouchableOpacity
                    style={tw`flex-1 p-4 rounded-xl border-2 items-center ${role === 'customer'
                            ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                            : 'border-[#2A2A2A] bg-[#141414]'
                        }`}
                    onPress={() => setRole('customer')}
                >
                    <Ionicons
                        name="bag-handle-outline"
                        size={28}
                        color={role === 'customer' ? colors.primary : colors.textSecondary}
                    />

                    <Text
                        weight='semiBold'
                        style={tw`mt-2 ${role === 'customer'
                                ? 'text-[#7C3AED]'
                                : 'text-[#A0A0A0]'
                            }`}
                    >
                        Order Food
                    </Text>

                    <Text style={tw`text-xs text-[#555555] mt-1`}>
                        Customer
                    </Text>
                </TouchableOpacity>

                {/* Driver */}
                <TouchableOpacity
                    style={tw`flex-1 p-4 rounded-xl border-2 items-center ${role === 'driver'
                            ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                            : 'border-[#2A2A2A] bg-[#141414]'
                        }`}
                    onPress={() => setRole('driver')}
                >
                    <Ionicons
                        name="bicycle-outline"
                        size={28}
                        color={role === 'driver' ? colors.primary : colors.textSecondary}
                    />

                    <Text
                        weight='semiBold'
                        style={tw`mt-2 ${role === 'driver'
                                ? 'text-[#7C3AED]'
                                : 'text-[#A0A0A0]'
                            }`}
                    >
                        Deliver Food
                    </Text>

                    <Text style={tw`text-xs text-[#555555] mt-1`}>
                        Driver
                    </Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}