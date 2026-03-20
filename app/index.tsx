import { useEffect } from 'react';
import { View, ActivityIndicator, Image } from 'react-native';
import { Text } from '../components/ui/AppText';
import { router } from 'expo-router';
import React from 'react';
import tw from 'twrnc';
import useAuthStore from '../store/useAuthStore';
import colors from '../constants/colors';

export default function Index() {
  const { isInitialized, session, profile } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

  const timeout = setTimeout(() => {
    if (!session) {
      router.replace('/login');
      return;
    }

    if (profile?.role === 'driver') {
      router.replace('/(driver)');
    } else {
      router.replace('/(customer)');
    }
  }, 1500)
  return () => clearTimeout(timeout)
  }, [isInitialized, session, profile]);

  return (
    <View style={tw`flex-1 items-center justify-center bg-[#0A0A0A]`}>
      <Image source={require('../assets/icon.png')} style={tw`w-20 h-20 mb-4`} />
      <Text weight='bold' style={tw`text-white text-3xl mb-2`}>DashDish</Text>
      <Text style={tw`text-[#7C3AED] text-base mb-8`}>
        Food ordering & delivery, redefined
      </Text>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}