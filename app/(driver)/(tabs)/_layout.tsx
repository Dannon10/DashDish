import React from 'react';
import { View, Platform, TouchableOpacity} from 'react-native';
import { Text } from '../../../components/ui/AppText';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import tw from 'twrnc';
import colors from '../../../constants/colors';

function TabIcon({ name, focusedName, color, focused }: {
    name: any;
    focusedName: any;
    color: string;
    focused: boolean;
}) {
    return <Ionicons name={focused ? focusedName : name} size={24} color={color} />;
}

function GlassTabBar({ state, descriptors, navigation }: any) {
    const bottomMargin = Platform.OS === 'ios' ? 34 : 16;

    return (
        <View
            style={[
                tw`absolute left-5 right-5 h-[68px] z-50`,
                {
                    bottom: bottomMargin,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.4,
                    shadowRadius: 24,
                    elevation: 16,
                },
            ]}
            pointerEvents="box-none"
        >
            <View style={tw`flex-1 rounded-[30px] overflow-hidden`}>
                <BlurView intensity={60} tint="dark" style={tw`absolute inset-0`} />
                <View style={[tw`absolute inset-0`, { backgroundColor: 'rgba(18, 18, 18, 0.60)' }]} />
                <View style={[tw`absolute inset-0 rounded-[30px]`, { borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.09)' }]} />

                <View style={tw`flex-1 flex-row items-center px-1.5`}>
                    {state.routes.map((route: any, index: number) => {
                        const { options } = descriptors[route.key];
                        if (options.href === null) return null;

                        const isFocused = state.index === index;
                        const label = options.title ?? route.name;
                        const color = isFocused ? colors.primary : 'rgba(255, 255, 255, 0.85)';

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={route.key}
                                onPress={onPress}
                                activeOpacity={0.7}
                                style={tw`flex-1 items-center justify-center pt-1.5`}
                            >
                                {isFocused && (
                                    <View style={[tw`absolute top-0 w-7 rounded-sm`, { height: 2.5, backgroundColor: colors.primary }]} />
                                )}
                                <View style={[
                                    tw`items-center justify-center py-1.5 px-3.5 rounded-[18px] gap-0.5`,
                                    isFocused && { backgroundColor: `${colors.primary}18` },
                                ]}>
                                    {options.tabBarIcon?.({ color, focused: isFocused, size: 24 })}
                                    <Text weight='semiBold' style={[tw`text-[10px] tracking-wide`, { color }]}>
                                        {label}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

export default function DriverTabsLayout() {
    return (
        <Tabs
            tabBar={(props) => <GlassTabBar {...props} />}
            screenOptions={{ headerShown: false }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="bicycle-outline" focusedName="bicycle" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="earnings"
                options={{
                    title: 'Earnings',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="wallet-outline" focusedName="wallet" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="person-outline" focusedName="person" color={color} focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}