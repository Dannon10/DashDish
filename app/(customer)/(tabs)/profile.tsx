import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import colors from '../../../constants/colors';
import { supabase } from '../../../services/supabase';

export default function ProfileScreen() {
  return (
    <View style={tw`flex-1 bg-[${colors.background}] items-center justify-center`}>
      <Text style={tw`text-[${colors.textPrimary}]`}>Profile coming</Text>
      <TouchableOpacity onPress={() => supabase.auth.signOut()}>
        <Text style={tw`text-[${colors.textPrimary}]`}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}