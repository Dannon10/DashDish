// utils/tw.ts (or wherever you initialise twrnc)
import { create } from 'twrnc';

const tw = create({
  theme: {
    extend: {
      fontFamily: {
        'montserrat': 'Montserrat-Regular',
        'montserrat-medium': 'Montserrat-Medium',
        'montserrat-semibold': 'Montserrat-SemiBold',
        'montserrat-bold': 'Montserrat-Bold',
      },
    },
  },
});

export default tw;