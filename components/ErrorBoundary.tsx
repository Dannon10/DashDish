import { View, Pressable } from 'react-native'
import { Text } from '../components/ui/AppText'
import tw from 'twrnc'
import React from 'react'

interface Props {
    error: Error
    retry: () => void
}

export default function ErrorBoundary({ error, retry }: Props) {

    return (
        <View style={tw`flex-1 justify-center items-center p-6 bg-black`}>
            <Text weight='semiBold' style={tw`text-xl mb-3 text-white`}>
                Something went wrong 🚨
            </Text>
            <Text weight='semiBold' style={tw`text-center mb-5 opacity-70 text-white`}>
                {error?.message}
            </Text>
            <Pressable
                onPress={retry}
                style={tw`px-5 py-3 bg-blue-600 rounded-lg`}
            >
                <Text weight='semiBold' style={tw`text-white`}>Try Again</Text>
            </Pressable>
        </View>
    )
}