import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

// Keep motion off until the OS/browser preference is known. No animation library
// is needed for native modal feedback or direct peer-tab changes.
export function useReducedMotion() {
  const [reduced,setReduced]=useState(true);
  useEffect(()=>{
    if(Platform.OS==='web') {
      const media=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
      setReduced(media?.matches??true);
      const changed=()=>setReduced(media?.matches??true);
      media?.addEventListener('change',changed);
      return ()=>media?.removeEventListener('change',changed);
    }
    let active=true;
    const subscription=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduced);
    void AccessibilityInfo.isReduceMotionEnabled().then(value=>{if(active)setReduced(value);}).catch(()=>{});
    return ()=>{active=false;subscription.remove();};
  },[]);
  return reduced;
}
