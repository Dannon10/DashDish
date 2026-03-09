import React from 'react';
import { View, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import tw from 'twrnc';

export default function SkeletonCard() {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[tw`mb-4`, { opacity }]}>
            <View style={tw`bg-[#141414] rounded-2xl overflow-hidden`}>

                {/* Image placeholder */}
                <View style={tw`h-44 bg-[#1E1E1E]`} />
                <View style={tw`p-4`}>

                    {/* Title placeholder */}
                    <View style={tw`h-5 bg-[#1E1E1E] rounded-lg w-3/4 mb-2`} />

                    {/* Subtitle placeholder */}
                    <View style={tw`h-4 bg-[#1E1E1E] rounded-lg w-1/2`} />

                    {/* Bottom row */}
                    <View style={tw`flex-row mt-3 gap-2`}>
                        <View style={tw`h-4 bg-[#1E1E1E] rounded-lg w-16`} />
                        <View style={tw`h-4 bg-[#1E1E1E] rounded-lg w-16`} />
                    </View>
                    
                </View>
            </View>
        </Animated.View>
    );
}