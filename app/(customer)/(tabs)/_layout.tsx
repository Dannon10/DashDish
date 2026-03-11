import React from 'react';
import { 
    View,
    Text,
    Platform,
    StyleSheet,
    TouchableOpacity
} from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import tw from 'twrnc';
import useCartStore from '../../../store/useCartStore';
import colors from '../../../constants/colors';

// Cart badge icon 
function CartTabIcon({ color, focused }: { color: string; focused: boolean }) {
    const totalItems = useCartStore((s) => s.getTotalItems());

    return (
        <View style={tw`items-center justify-center`}>
            <Ionicons 
            name={focused ? 'bag' : 'bag-outline'} 
            size={24} 
            color={color} 
            />
            {totalItems > 0 && (
                <View
                    style={[
                        tw`absolute -top-1 -right-2 min-w-[16px] h-4 rounded-full items-center justify-center px-1`,
                        { backgroundColor: colors.primary },
                    ]}
                >
                    <Text style={tw`text-white text-[10px] font-bold`}>
                        {totalItems > 99 ? '99+' : totalItems}
                    </Text>
                </View>
            )}
        </View>
    );
}

// Generic tab icon 
function TabIcon({ name, focusedName, color, focused }: {
    name: any;
    focusedName: any;
    color: string;
    focused: boolean;
}) {
    return <Ionicons 
    name={focused ? focusedName : name} 
    size={24} 
    color={color} 
    />;
}

// Custom glass tab bar
function GlassTabBar({ state, descriptors, navigation }: any) {
    return (
        <View style={styles.outerContainer} pointerEvents="box-none">
            <View style={styles.glassWrapper}>
                <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.frostedOverlay} />
                <View style={styles.borderOverlay} />

                <View style={styles.tabRow}>
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
                                style={styles.tabItem}
                            >
                                {isFocused && <View style={styles.activePill} />}
                                <View 
                                style={[styles.tabInner, isFocused && styles.tabInnerFocused]}>
                                    {options.tabBarIcon?.({ color, focused: isFocused, size: 24 })}
                                    <Text 
                                    style={[styles.tabLabel, 
                                    { color }]}>
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

// Styles
const TAB_HEIGHT = 68;
const BOTTOM_MARGIN = Platform.OS === 'ios' ? 34 : 16;
const SIDE_MARGIN = 20;
const BORDER_RADIUS = 30;

const styles = StyleSheet.create({
    outerContainer: {
        position: 'absolute',
        bottom: BOTTOM_MARGIN,
        left: SIDE_MARGIN,
        right: SIDE_MARGIN,
        height: TAB_HEIGHT,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 16,
    },
    glassWrapper: {
        flex: 1,
        borderRadius: BORDER_RADIUS,
        overflow: 'hidden',
    },
    frostedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(18, 18, 18, 0.60)',
    },
    borderOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: BORDER_RADIUS,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.09)',
    },
    tabRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        paddingTop: 6,
    },
    activePill: {
        position: 'absolute',
        top: 0,
        width: 28,
        height: 2.5,
        borderRadius: 2,
        backgroundColor: colors.primary,
    },
    tabInner: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 18,
        gap: 3,
    },
    tabInnerFocused: {
        backgroundColor: `${colors.primary}18`,
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
});

// Layout 
export default function TabsLayout() {
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
                        <TabIcon 
                        name="home-outline" 
                        focusedName="home" 
                        color={color} 
                        focused={focused} 
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Orders',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon 
                        name="receipt-outline" 
                        focusedName="receipt" 
                        color={color} 
                        focused={focused} 
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: 'Cart',
                    tabBarIcon: ({ color, focused }) => (
                        <CartTabIcon 
                        color={color} 
                        focused={focused} 
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon 
                        name="person-outline" 
                        focusedName="person" 
                        color={color} 
                        focused={focused} 
                        />
                    ),
                }}
            />
        </Tabs>
    );
}