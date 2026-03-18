import React from 'react';
import { View } from 'react-native';
import tw from 'twrnc';
import colors from '../../../constants/colors';

export function Divider() {
    return <View style={[tw`ml-16`, { height: 1, backgroundColor: colors.border }]} />;
}