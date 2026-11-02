import { validPoint, type Point } from './facility-data.ts';

type Position = {coords:Point & {accuracy?:number|null};timestamp:number};
export type LocationAdapter = {
  servicesEnabled:()=>Promise<boolean>;
  requestPermission:()=>Promise<{granted:boolean;canAskAgain:boolean}>;
  currentPosition:()=>Promise<Position>;
};
export type LocationResult = {status:'ready';point:Point;accuracy:number|null;timestamp:number}
  | {status:'denied';canAskAgain:boolean} | {status:'disabled'|'timeout'|'unavailable'|'cancelled'};

// One explicit foreground lookup. No watch, background access, storage or network geocoding.
export async function locateOnce(adapter:LocationAdapter,timeoutMs=20000,signal?:AbortSignal,permissionTimeoutMs=60000):Promise<LocationResult> {
  if(signal?.aborted)return {status:'cancelled'};
  let active=true;
  let timer:ReturnType<typeof setTimeout>|undefined;
  let expire:(value:LocationResult)=>void=()=>{};
  const deadline=new Promise<LocationResult>(resolve=>{expire=resolve;});
  const startTimer=(ms:number)=>{
    if(timer)clearTimeout(timer);
    timer=setTimeout(()=>{active=false;expire({status:'timeout'});},ms);
  };
  let onAbort:(()=>void)|undefined;
  const cancelled=new Promise<LocationResult>(resolve=>{
    onAbort=()=>{active=false;resolve({status:'cancelled'});};
    signal?.addEventListener('abort',onAbort,{once:true});
  });
  const work=async():Promise<LocationResult>=>{
    try {
      if(!await adapter.servicesEnabled())return {status:'disabled'};
      if(!active)return {status:signal?.aborted?'cancelled':'timeout'};
      const permission=await adapter.requestPermission();
      if(!active)return {status:signal?.aborted?'cancelled':'timeout'};
      if(!permission.granted)return {status:'denied',canAskAgain:permission.canAskAgain};
      // Reading the OS consent dialog must not consume the GPS acquisition budget.
      startTimer(timeoutMs);
      const location=await adapter.currentPosition();
      if(!validPoint(location.coords)||!Number.isFinite(location.timestamp)||Math.abs(Date.now()-location.timestamp)>120000)return {status:'unavailable'};
      return {status:'ready',point:{latitude:location.coords.latitude,longitude:location.coords.longitude},
        accuracy:typeof location.coords.accuracy==='number'&&Number.isFinite(location.coords.accuracy)&&location.coords.accuracy>=0?location.coords.accuracy:null,timestamp:location.timestamp};
    }catch{return {status:'unavailable'};}
  };
  startTimer(permissionTimeoutMs);
  try {
    return await Promise.race([cancelled,deadline,work()]);
  }finally {active=false;if(timer)clearTimeout(timer);if(onAbort)signal?.removeEventListener('abort',onAbort);}
}
