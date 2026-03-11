import React from 'react';
import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { signIn, signUp } from '../../services/auth.service';
import { UserRole } from '../../types/auth.types';
import colors from '../../constants/colors';

export default function LoginScreen() {
    const [isRegistering, setIsRegistering] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<UserRole>('customer');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const switchMode = () => {
        setIsRegistering(!isRegistering);
        setError(null);
        setFullName('');
        setEmail('');
        setPassword('');
    };

    const handleSubmit = async () => {
        setError(null);

        // Basic validation
        if (!email || !password) {
            setError('Please fill in all fields');
            return;
        }
        if (isRegistering && !fullName) {
            setError('Please enter your full name');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        if (isRegistering) {
            const { error: signUpError } = await signUp(
                email,
                password,
                fullName,
                '',
                role
            );
            if (signUpError) {
                setError(signUpError);
                setLoading(false);
                return;
            }
        } else {
            const { error: signInError } = await signIn(email, password);
            if (signInError) {
                setError(signInError);
                setLoading(false);
                return;
            }
        }

        setLoading(false);
        // Navigation is handled automatically by the auth listener in _layout.tsx
    };

    return (
        <KeyboardAvoidingView
            style={tw`flex-1 bg-[#0A0A0A]`}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={tw`flex-grow justify-center px-6 py-12`}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={tw`mb-10`}>
                    <Text style={tw`text-[#7C3AED] text-base font-semibold mb-1`}>
                        DashDish
                    </Text>
                    <Text style={tw`text-white text-3xl font-bold`}>
                        {isRegistering ? 'Create account' : 'Welcome back'}
                    </Text>
                    <Text style={tw`text-[#A0A0A0] text-base mt-2`}>
                        {isRegistering
                            ? 'Sign up to start ordering'
                            : 'Sign in to continue'}
                    </Text>
                </View>

                {/* Role Selection — signup only */}
                {isRegistering && (
                    <View style={tw`mb-6`}>
                        <Text style={tw`text-[#A0A0A0] text-sm mb-3`}>I want to</Text>
                        <View style={tw`flex-row gap-3`}>

                            {/* Customer Card */}
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
                                <Text style={tw`mt-2 font-semibold ${role === 'customer' ? 'text-[#7C3AED]' : 'text-[#A0A0A0]'
                                    }`}>
                                    Order Food
                                </Text>
                                <Text style={tw`text-xs text-[#555555] mt-1 text-center`}>
                                    Customer
                                </Text>
                            </TouchableOpacity>

                            {/* Driver Card */}
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
                                <Text style={tw`mt-2 font-semibold ${role === 'driver' ? 'text-[#7C3AED]' : 'text-[#A0A0A0]'
                                    }`}>
                                    Deliver Food
                                </Text>
                                <Text style={tw`text-xs text-[#555555] mt-1 text-center`}>
                                    Driver
                                </Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                )}

                {/* Full Name — signup only */}
                {isRegistering && (
                    <View style={tw`mb-4`}>
                        <Text style={tw`text-[#A0A0A0] text-sm mb-2`}>Full Name</Text>
                        <TextInput
                            style={tw`bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-4 text-white text-base`}
                            placeholder="Enter your full name"
                            placeholderTextColor={colors.textMuted}
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                        />
                    </View>
                )}

                {/* Email */}
                <View style={tw`mb-4`}>
                    <Text style={tw`text-[#A0A0A0] text-sm mb-2`}>Email</Text>
                    <TextInput
                        style={tw`bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-4 text-white text-base`}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                {/* Password */}
                <View style={tw`mb-6`}>
                    <Text style={tw`text-[#A0A0A0] text-sm mb-2`}>Password</Text>
                    <View style={tw`relative`}>
                        <TextInput
                            style={tw`bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-4 text-white text-base pr-12`}
                            placeholder="Enter your password"
                            placeholderTextColor={colors.textMuted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={tw`absolute right-4 top-0 bottom-0 justify-center`}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                size={22}
                                color={colors.textMuted}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Error Message */}
                {error && (
                    <View style={tw`mb-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20`}>
                        <Text style={tw`text-red-400 text-sm text-center`}>{error}</Text>
                    </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                    style={tw`bg-[#7C3AED] py-4 rounded-xl items-center ${loading ? 'opacity-60' : ''}`}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={tw`text-white font-bold text-base`}>
                            {isRegistering ? 'Create Account' : 'Sign In'}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Switch Mode */}
                <TouchableOpacity
                    style={tw`mt-6 items-center`}
                    onPress={switchMode}
                >
                    <Text style={tw`text-[#A0A0A0] text-base`}>
                        {isRegistering
                            ? 'Already have an account? '
                            : "Don't have an account? "}
                        <Text style={tw`text-[#7C3AED] font-semibold`}>
                            {isRegistering ? 'Sign In' : 'Sign Up'}
                        </Text>
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}