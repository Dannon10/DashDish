import { Text as RNText, TextProps } from 'react-native';
import React from 'react';
import tw from '../../utils/tw';

type Weight = 'regular' | 'medium' | 'semiBold' | 'bold';
type Variant = 'heading' | 'subheading' | 'body' | 'caption' | 'label';

interface Props extends TextProps {
    variant?: Variant;
    weight?: Weight;
    tw?: string;
}

const variantStyles: Record<Variant, string> = {
    heading: 'text-2xl font-montserrat-bold',
    subheading: 'text-lg font-montserrat-semibold',
    body: 'text-base font-montserrat',
    caption: 'text-sm font-montserrat',
    label: 'text-sm font-montserrat-medium',
};

const weightStyles: Record<Weight, string> = {
    regular: 'font-montserrat',
    medium: 'font-montserrat-medium',
    semiBold: 'font-montserrat-semibold',
    bold: 'font-montserrat-bold',
};

export function Text({ variant = 'body', weight, tw: twClass = '', style, ...props }: Props) {
    const variantClass = variantStyles[variant];
    const weightClass = weight ? weightStyles[weight] : '';

    return (
        <RNText
            style={[tw`${variantClass} ${weightClass} ${twClass}`, style]}
            {...props}
        />
    );
}