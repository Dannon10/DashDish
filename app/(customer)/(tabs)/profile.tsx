import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Text } from '../../../components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { supabase } from '../../../services/supabase';
import useAuthStore from '../../../store/useAuthStore';
import Avatar from '../../../components/ui/Avatar';
import colors from '../../../constants/colors';

function Divider() {
    return <View style={[tw`ml-16`, { height: 1, backgroundColor: colors.border }]} />;
}

function ProfileField({
    icon,
    label,
    value,
    onChange,
    placeholder,
    keyboardType = 'default',
    multiline = false,
}: {
    icon: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    keyboardType?: any;
    multiline?: boolean;
}) {
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

export default function CustomerProfileScreen() {
    const { profile, setProfile, clearAuth } = useAuthStore();
    const [fullName, setFullName] = useState(profile?.full_name ?? '');
    const [phone, setPhone] = useState(profile?.phone ?? '');
    const [address, setAddress] = useState((profile as any)?.address ?? '');
    const [saving, setSaving] = useState(false);
    const [edited, setEdited] = useState(false);

    // Stats
    const [totalOrders, setTotalOrders] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);

    useEffect(() => {
        const changed =
            fullName !== (profile?.full_name ?? '') ||
            phone !== (profile?.phone ?? '') ||
            address !== ((profile as any)?.address ?? '');
        setEdited(changed);
    }, [fullName, phone, address]);

    const fetchStats = useCallback(async () => {
        if (!profile?.id) return;
        const { data } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('customer_id', profile.id)
            .eq('status', 'delivered');

        if (data) {
            setTotalOrders(data.length);
            setTotalSpent(data.reduce((sum, o) => sum + o.total_amount, 0));
        }
    }, [profile?.id]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const handleSave = async () => {
        if (!profile?.id) return;
        setSaving(true);
        const { data, error } = await supabase
            .from('profiles')
            .update({ full_name: fullName, phone, address })
            .eq('id', profile.id)
            .select()
            .single();

        if (error) {
            Alert.alert('Error', 'Could not save changes. Please try again.');
        } else {
            setProfile(data);
            setEdited(false);
            Alert.alert('Saved', 'Your profile has been updated.');
        }
        setSaving(false);
    };

    const handleAvatarUpload = async (url: string) => {
        if (!profile?.id) return;
        const { data } = await supabase
            .from('profiles')
            .update({ avatar_url: url })
            .eq('id', profile.id)
            .select()
            .single();
        if (data) setProfile(data);
    };

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                    clearAuth();
                },
            },
        ]);
    };

    if (!profile) return null;

    return (
        <ScrollView
            style={tw`flex-1 bg-[${colors.background}]`}
            contentContainerStyle={tw`pb-32`}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {/* Header */}
            <View style={tw`px-5 pt-14 pb-6`}>
                <Text style={tw`text-[${colors.textPrimary}] text-2xl`}>Profile</Text>
                <Text style={tw`text-[${colors.textSecondary}] text-sm mt-0.5`}>
                    Manage your account
                </Text>
            </View>

            {/* Avatar + name */}
            <View style={tw`items-center mb-6`}>
                <Avatar
                    userId={profile.id}
                    fullName={profile.full_name}
                    avatarUrl={profile.avatar_url}
                    size={96}
                    editable
                    onUpload={handleAvatarUpload}
                />
                <Text weight='bold' style={tw`text-[${colors.textPrimary}] text-lg mt-3`}>
                    {profile.full_name}
                </Text>
                <View style={[
                    tw`flex-row items-center gap-1.5 px-3 py-1 rounded-full mt-1`,
                    { backgroundColor: `${colors.info}22` },
                ]}>
                    <Ionicons name="person" size={12} color={colors.info} />
                    <Text weight='semiBold' style={[tw`text-xs`, { color: colors.info }]}>Customer</Text>
                </View>
            </View>

            {/* Stats */}
            <View style={tw`flex-row mx-5 mb-4 gap-3`}>
                <View style={tw`flex-1 p-4 rounded-2xl bg-[${colors.surfaceElevated}] items-center`}>
                    <Text weight='bold' style={tw`text-[${colors.textPrimary}] text-2xl`}>
                        {totalOrders}
                    </Text>
                    <Text weight='medium' style={tw`text-[${colors.textMuted}] text-[10px] mt-1`}>Orders</Text>
                </View>
                <View style={tw`flex-1 p-4 rounded-2xl bg-[${colors.surfaceElevated}] items-center`}>
                    <Text weight='bold' style={[tw`text-2xl`, { color: colors.success }]}>
                        ₦{totalSpent >= 1000
                            ? `${(totalSpent / 1000).toFixed(1)}k`
                            : totalSpent.toLocaleString()}
                    </Text>
                    <Text weight='medium' style={tw`text-[${colors.textMuted}] text-[10px] mt-1`}>Total Spent</Text>
                </View>
            </View>

            {/* Personal info */}
            <View style={tw`mx-5 mb-4 rounded-2xl bg-[${colors.surfaceElevated}] overflow-hidden`}>
                <Text weight='semiBold' style={tw`text-[${colors.textSecondary}] text-xs uppercase tracking-widest px-4 pt-4 pb-2`}>
                    Personal Info
                </Text>
                <ProfileField
                    icon="person-outline"
                    label="Full Name"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Your full name"
                />
                <Divider />
                <ProfileField
                    icon="call-outline"
                    label="Phone"
                    value={phone}
                    onChange={setPhone}
                    placeholder="+234 000 000 0000"
                    keyboardType="phone-pad"
                />
            </View>

            {/* Default delivery address */}
            <View style={tw`mx-5 mb-4 rounded-2xl bg-[${colors.surfaceElevated}] overflow-hidden`}>
                <Text weight='semiBold' style={tw`text-[${colors.textSecondary}] text-xs uppercase tracking-widest px-4 pt-4 pb-2`}>
                    Default Address
                </Text>
                <ProfileField
                    icon="location-outline"
                    label="Delivery Address"
                    value={address}
                    onChange={setAddress}
                    placeholder="e.g. 14 Awolowo Road, Ikoyi, Lagos"
                    multiline
                />
            </View>

            {/* Appearance */}
            <View style={tw`mx-5 mb-4 rounded-2xl bg-[${colors.surfaceElevated}] overflow-hidden`}>
                <Text weight='semiBold' style={tw`text-[${colors.textSecondary}] text-xs uppercase tracking-widest px-4 pt-4 pb-2`}>
                    Appearance
                </Text>
                <View style={tw`flex-row items-center px-4 py-3.5`}>
                    <View style={tw`w-9 h-9 rounded-full bg-[${colors.border}] items-center justify-center mr-3`}>
                        <Ionicons name="moon-outline" size={18} color={colors.textMuted} />
                    </View>
                    <View style={tw`flex-1`}>
                        <Text weight='medium' style={tw`text-[${colors.textPrimary}] text-sm`}>Theme</Text>
                        <Text weight='medium' style={tw`text-[${colors.textMuted}] text-xs`}>Dark • Coming soon</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
            </View>

            {/* Save button */}
            {edited && (
                <View style={tw`mx-5 mb-4`}>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        style={[
                            tw`py-4 rounded-xl items-center justify-center flex-row gap-2`,
                            { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 },
                        ]}
                    >
                        {saving
                            ? <ActivityIndicator size="small" color="white" />
                            : <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                        }
                        <Text weight='bold' style={tw`text-white`}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Logout */}
            <View style={tw`mx-5`}>
                <TouchableOpacity
                    onPress={handleLogout}
                    style={[
                        tw`py-4 rounded-xl items-center justify-center flex-row gap-2`,
                        { borderWidth: 1, borderColor: colors.error },
                    ]}
                >
                    <Ionicons name="log-out-outline" size={18} color={colors.error} />
                    <Text weight='bold' style={[tw`text-[${colors.error}]`, { color: colors.error }]}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}