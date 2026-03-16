import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import tw from 'twrnc';
import { supabase } from '../../services/supabase';
import colors from '../../constants/colors';

interface Props {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    size?: number;
    editable?: boolean;
    onUpload?: (url: string) => void;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('');
}

function getAvatarColor(name: string): string {
    const palette = [
        '#7C3AED', '#2563EB', '#059669', '#D97706',
        '#DC2626', '#0891B2', '#65A30D', '#9333EA',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
}

export default function Avatar({
    userId,
    fullName,
    avatarUrl,
    size = 80,
    editable = false,
    onUpload,
}: Props) {
    const [uploading, setUploading] = useState(false);
    const [localUri, setLocalUri] = useState<string | null>(null);

    const displayUrl = localUri ?? avatarUrl;
    const initials = getInitials(fullName || 'U');
    const bgColor = getAvatarColor(fullName || 'U');
    const fontSize = Math.round(size * 0.35);
    const editIconSize = Math.round(size * 0.28);
    const editBadgeSize = Math.round(size * 0.35);

    const handlePickImage = async () => {
        if (!editable || Platform.OS === 'web') return;
        try {
            setUploading(true);
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') { setUploading(false); return; }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.[0]) { setUploading(false); return; }

            const asset = result.assets[0];
            setLocalUri(asset.uri);

            const ext = asset.uri.split('.').pop() ?? 'jpg';
            const path = `${userId}.${ext}`;

            const response = await fetch(asset.uri);
            const blob = await response.blob();
            const arrayBuffer = await blob.arrayBuffer();

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(path, arrayBuffer, { contentType: `image/${ext}`, upsert: true });

            if (!uploadError) {
                const { data } = supabase.storage.from('avatars').getPublicUrl(path);
                onUpload?.(`${data.publicUrl}?t=${Date.now()}`);
            }
        } catch (err) {
            console.error('[Avatar] upload error:', err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <TouchableOpacity
            onPress={handlePickImage}
            disabled={!editable || uploading}
            activeOpacity={editable ? 0.8 : 1}
            style={{ width: size, height: size }}
        >
            <View
                style={[
                    tw`rounded-full items-center justify-center overflow-hidden`,
                    {
                        width: size,
                        height: size,
                        backgroundColor: displayUrl ? colors.surfaceElevated : bgColor,
                    },
                ]}
            >
                {uploading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                ) : displayUrl ? (
                    <Image
                        source={{ uri: displayUrl }}
                        style={{ width: size, height: size, borderRadius: size / 2 }}
                    />
                ) : (
                    <Text style={[tw`font-bold text-white`, { fontSize }]}>
                        {initials}
                    </Text>
                )}
            </View>

            {editable && !uploading && (
                <View
                    style={[
                        tw`absolute bottom-0 right-0 rounded-full items-center justify-center`,
                        {
                            width: editBadgeSize,
                            height: editBadgeSize,
                            backgroundColor: colors.primary,
                            borderWidth: 2,
                            borderColor: colors.background,
                        },
                    ]}
                >
                    <Ionicons name="camera" size={editIconSize} color="white" />
                </View>
            )}
        </TouchableOpacity>
    );
}