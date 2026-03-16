import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { supabase } from '../../../services/supabase';
import useAuthStore from '../../../store/useAuthStore';
import useDriverStore from '../../../store/useDriverStore';
import Avatar from '../../../components/ui/Avatar';
import colors from '../../../constants/colors';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={tw`mx-5 mb-4`}>
            <Text style={tw`text-[${colors.textMuted}] text-xs font-semibold uppercase tracking-widest mb-2 px-1`}>
                {title}
            </Text>
            <View style={[tw`rounded-2xl overflow-hidden`, { backgroundColor: colors.surfaceElevated }]}>
                {children}
            </View>
        </View>
    );
}

function FieldRow({
    icon,
    label,
    value,
    onChangeText,
    placeholder,
    isLast = false,
    keyboardType = 'default',
}: {
    icon: string;
    label: string;
    value: string;
    onChangeText?: (t: string) => void;
    placeholder?: string;
    isLast?: boolean;
    keyboardType?: any;
}) {
    return (
        <View style={[
            tw`flex-row items-center px-4 py-3.5`,
            !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
        ]}>
            <View style={tw`w-8 h-8 rounded-full bg-[${colors.primary}22] items-center justify-center mr-3`}>
                <Ionicons name={icon as any} size={16} color={colors.primary} />
            </View>
            <View style={tw`flex-1`}>
                <Text style={tw`text-[${colors.textMuted}] text-[10px] uppercase tracking-widest mb-0.5`}>
                    {label}
                </Text>
                {onChangeText ? (
                    <TextInput
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
                        placeholderTextColor={colors.textMuted}
                        keyboardType={keyboardType}
                        style={[tw`text-[${colors.textPrimary}] text-sm p-0`]}
                    />
                ) : (
                    <Text style={tw`text-[${colors.textSecondary}] text-sm`}>{value || placeholder}</Text>
                )}
            </View>
        </View>
    );
}

export default function DriverProfileScreen() {
    const { profile, setProfile } = useAuthStore();
    const { isOnline, setOnline } = useDriverStore();

    const [fullName, setFullName] = useState(profile?.full_name ?? '');
    const [phone, setPhone] = useState(profile?.phone ?? '');
    const [vehicleInfo, setVehicleInfo] = useState((profile as any)?.vehicle_info ?? '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null);
    const [saving, setSaving] = useState(false);

    const isDirty =
        fullName !== (profile?.full_name ?? '') ||
        phone !== (profile?.phone ?? '') ||
        vehicleInfo !== ((profile as any)?.vehicle_info ?? '');

    const handleSave = async () => {
        if (!profile?.id) return;
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName.trim(),
                phone: phone.trim(),
                vehicle_info: vehicleInfo.trim(),
            })
            .eq('id', profile.id);

        if (error) {
            Alert.alert('Error', 'Could not save changes.');
        } else {
            setProfile({ ...profile, full_name: fullName.trim(), phone: phone.trim() });
            Alert.alert('Saved', 'Profile updated successfully.');
        }
        setSaving(false);
    };

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => supabase.auth.signOut() },
        ]);
    };

    if (!profile) return null;

    return (
        <ScrollView
            style={tw`flex-1 bg-[${colors.background}]`}
            contentContainerStyle={tw`pb-32`}
            showsVerticalScrollIndicator={false}
        >
            <View style={tw`px-5 pt-14 pb-6`}>
                <Text style={tw`text-[${colors.textPrimary}] text-2xl font-bold`}>Profile</Text>
            </View>

            {/* Avatar */}
            <View style={tw`items-center mb-6`}>
                <Avatar
                    userId={profile.id}
                    fullName={fullName}
                    avatarUrl={avatarUrl}
                    size={96}
                    editable
                    onUpload={(url) => {
                        setAvatarUrl(url);
                        setProfile({ ...profile, avatar_url: url });
                    }}
                />
                <Text style={tw`text-[${colors.textPrimary}] text-lg font-bold mt-3`}>
                    {fullName || 'Driver'}
                </Text>
                <View style={[tw`px-3 py-1 rounded-full mt-1`, { backgroundColor: `${colors.primary}22` }]}>
                    <Text style={[tw`text-xs font-semibold`, { color: colors.primary }]}>Driver</Text>
                </View>
            </View>

            {/* Personal info */}
            <Section title="Personal Info">
                <FieldRow icon="person-outline" label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
                <FieldRow icon="call-outline" label="Phone" value={phone} onChangeText={setPhone} placeholder="+234 000 000 0000" keyboardType="phone-pad" isLast />
            </Section>

            {/* Vehicle */}
            <Section title="Vehicle">
                <FieldRow icon="bicycle-outline" label="Vehicle Info" value={vehicleInfo} onChangeText={setVehicleInfo} placeholder="e.g. Honda CB125, Red" isLast />
            </Section>

            {/* Status */}
            <Section title="Status">
                <View style={tw`flex-row items-center px-4 py-3.5`}>
                    <View style={tw`w-8 h-8 rounded-full bg-[${colors.primary}22] items-center justify-center mr-3`}>
                        <Ionicons name="radio-outline" size={16} color={colors.primary} />
                    </View>
                    <Text style={tw`text-[${colors.textPrimary}] text-sm flex-1`}>
                        {isOnline ? 'Online — accepting orders' : 'Offline'}
                    </Text>
                    <Switch
                        value={isOnline}
                        onValueChange={setOnline}
                        trackColor={{ false: colors.border, true: `${colors.primary}88` }}
                        thumbColor={isOnline ? colors.primary : colors.textMuted}
                    />
                </View>
            </Section>

            {/* Preferences */}
            <Section title="Preferences">
                <View style={tw`flex-row items-center px-4 py-3.5`}>
                    <View style={tw`w-8 h-8 rounded-full bg-[${colors.primary}22] items-center justify-center mr-3`}>
                        <Ionicons name="color-palette-outline" size={16} color={colors.primary} />
                    </View>
                    <View style={tw`flex-1`}>
                        <Text style={tw`text-[${colors.textPrimary}] text-sm`}>Theme</Text>
                        <Text style={tw`text-[${colors.textMuted}] text-xs mt-0.5`}>Dark (coming soon)</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
            </Section>

            {/* Save */}
            {isDirty && (
                <View style={tw`mx-5 mb-4`}>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={saving}
                        style={[tw`py-4 rounded-xl items-center justify-center flex-row gap-2`, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
                    >
                        {saving
                            ? <ActivityIndicator size="small" color="white" />
                            : <>
                                <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                                <Text style={tw`text-white font-bold text-base`}>Save Changes</Text>
                            </>
                        }
                    </TouchableOpacity>
                </View>
            )}

            {/* Logout */}
            <View style={tw`mx-5`}>
                <TouchableOpacity
                    onPress={handleLogout}
                    style={[tw`py-4 rounded-xl items-center justify-center flex-row gap-2`, { borderWidth: 1, borderColor: colors.error }]}
                >
                    <Ionicons name="log-out-outline" size={18} color={colors.error} />
                    <Text style={[tw`font-bold text-base`, { color: colors.error }]}>Log Out</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}