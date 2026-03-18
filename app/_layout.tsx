// import React from 'react';
// import { useEffect } from 'react';
// import { Stack } from 'expo-router';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import { router } from 'expo-router';
// import useAuthStore from '../store/useAuthStore';
// import { supabase } from '../services/supabase';
// import { getProfile } from '../services/auth.service';
// import colors from '../constants/colors';

// const queryClient = new QueryClient({
//     defaultOptions: {
//         queries: {
//             retry: 2,
//             staleTime: 1000 * 60 * 5,
//         },
//     },
// });

// export default function RootLayout() {
//     const {
//         setSession,
//         setProfile,
//         setInitialized,
//         setLoading,
//         clearAuth,
//     } = useAuthStore();

//     useEffect(() => {
//         supabase.auth.getSession().then(async ({ data: { session } }) => {
//             if (session) {
//                 setSession(session);
//                 const { profile } = await getProfile(session.user.id);
//                 setProfile(profile);
//             }
//             setInitialized(true);
//         });

//         const { data: { subscription } } = supabase.auth.onAuthStateChange(
//             async (event, session) => {
//                 if (event === 'SIGNED_IN' && session) {
//                     setSession(session);
//                     setLoading(true);
//                     const { profile } = await getProfile(session.user.id);
//                     setProfile(profile);
//                     setLoading(false);

//                     if (profile?.role === 'driver') {
//                         router.replace('/(driver)');
//                     } else {
//                         router.replace('/(customer)');
//                     }
//                 }

//                 if (event === 'SIGNED_OUT') {
//                     clearAuth();
//                     router.replace('/(auth)/login');
//                 }
//             }
//         );

//         return () => subscription.unsubscribe();
//     }, []);

//     return (
//         <QueryClientProvider client={queryClient}>
//             <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
//                 <Stack screenOptions={{ headerShown: false }}>
//                     <Stack.Screen name="(auth)" />
//                     <Stack.Screen name="(customer)" />
//                     <Stack.Screen name="(driver)" />
//                     <Stack.Screen name="index" />
//                 </Stack>
//             </GestureHandlerRootView>
//         </QueryClientProvider>
//     );
// }





import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import useAuthStore from '../store/useAuthStore';
import { supabase } from '../services/supabase';
import { getProfile } from '../services/auth.service';
import colors from '../constants/colors';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            staleTime: 1000 * 60 * 5,
        },
    },
});

export default function RootLayout() {
    const {
        setSession,
        setProfile,
        setInitialized,
        setLoading,
        clearAuth,
    } = useAuthStore();

    const [fontsLoaded] = useFonts({
        'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
        'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
        'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
        'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    });

    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (session) {
                setSession(session);
                const { profile } = await getProfile(session.user.id);
                setProfile(profile);
            }
            setInitialized(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    setSession(session);
                    setLoading(true);
                    const { profile } = await getProfile(session.user.id);
                    setProfile(profile);
                    setLoading(false);

                    if (profile?.role === 'driver') {
                        router.replace('/(driver)');
                    } else {
                        router.replace('/(customer)');
                    }
                }

                if (event === 'SIGNED_OUT') {
                    clearAuth();
                    router.replace('/(auth)/login');
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    if (!fontsLoaded) return null;

    return (
        <QueryClientProvider client={queryClient}>
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(customer)" />
                    <Stack.Screen name="(driver)" />
                    <Stack.Screen name="index" />
                </Stack>
            </GestureHandlerRootView>
        </QueryClientProvider>
    );
}