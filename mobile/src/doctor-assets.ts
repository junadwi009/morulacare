import type { ImageSourcePropType } from 'react-native';
const portraits:Record<string,ImageSourcePropType>={
  maya:require('../assets/demo-images/doctor-maya.png'),
  arif:require('../assets/demo-images/doctor-arif.png'),
  nadia:require('../assets/demo-images/doctor-nadia.png'),
  bima:require('../assets/demo-images/doctor-bima.png'),
};
export const consultationHero:ImageSourcePropType=require('../assets/demo-images/consultation-hero.png');
export const doctorPortrait=(key:string):ImageSourcePropType=>portraits[key]??portraits.maya!;
