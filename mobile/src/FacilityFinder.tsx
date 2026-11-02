import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { rankFacilities, type Point } from './facility-data';
import { locateOnce } from './location-request';
import { Button, C, Card, Copy, FONT, Heading, Icon, Label, Pill, Row, SectionTitle } from './ui';

function useSearchState() {
  const [point,setPoint]=useState<Point|null>(null);
  const [accuracy,setAccuracy]=useState<number|null>(null);
  const [query,setQuery]=useState('');
  const [isLocating,setLocating]=useState(false);
  const [error,setError]=useState('');
  const [showSettings,setShowSettings]=useState(false);
  const [showAll,setShowAll]=useState(false);
  const [linkError,setLinkError]=useState('');
  const requestId=useRef(0);
  const busy=useRef(false);
  const controller=useRef<AbortController|null>(null);
  useEffect(()=>()=>{requestId.current++;controller.current?.abort();},[]);
  const locate=useCallback(async()=>{
    if(busy.current)return;
    busy.current=true;
    controller.current=new AbortController();
    const id=++requestId.current;
    setLocating(true);setError('');setShowSettings(false);setPoint(null);setAccuracy(null);
    const result=await locateOnce({
      servicesEnabled:()=>Platform.OS==='web'?Promise.resolve(true):Location.hasServicesEnabledAsync(),
      requestPermission:()=>Location.requestForegroundPermissionsAsync(),
      // A bounded one-shot GPS fix also works where network location is unavailable.
      // The OS still honors the user's approximate-location permission choice.
      currentPosition:()=>Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High,mayShowUserSettingsDialog:false}),
    },20000,controller.current.signal);
    if(id!==requestId.current)return;
    busy.current=false;setLocating(false);
    if(result.status==='ready') {setPoint(result.point);setAccuracy(result.accuracy);setQuery('');}
    else if(result.status==='cancelled')return;
    else if(result.status==='denied') {setError('Izin lokasi ditolak. Cari cabang secara manual.');setShowSettings(!result.canAskAgain&&Platform.OS!=='web');}
    else if(result.status==='disabled')setError('Layanan lokasi perangkat tidak aktif. Aktifkan melalui pengaturan perangkat atau cari manual.');
    else if(result.status==='timeout')setError('Lokasi belum tersedia. Cari cabang secara manual.');
    else setError('Lokasi tidak tersedia atau belum cukup baru. Coba lagi atau gunakan pencarian manual.');
  },[]);
  const clearLocation=useCallback(()=>{
    requestId.current++;controller.current?.abort();busy.current=false;setLocating(false);setPoint(null);setAccuracy(null);setError('');setShowSettings(false);
  },[]);
  const openLink=useCallback(async(url:string)=>{
    try {setLinkError('');await Linking.openURL(url);}catch{setLinkError('Tautan belum bisa dibuka. Coba lagi setelah koneksi tersedia.');}
  },[]);
  const facilities=useMemo(()=>rankFacilities(query,point),[query,point]);
  return {point,hasLocation:!!point,accuracy,query,setQuery,isLocating,error,showSettings,locate,clearLocation,
    facilities,showAll,setShowAll,linkError,openLink};
}
type SearchState=ReturnType<typeof useSearchState>;
const SearchContext=createContext<SearchState|null>(null);
export function FacilitySearchProvider({children}:{children:ReactNode}) {
  const value=useSearchState();
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}
export function useFacilitySearch():SearchState {
  const state=useContext(SearchContext);
  if(!state)throw Error('FacilitySearchProvider is required');
  return state;
}

export function LocationSearch({state}:{state:SearchState}) {
 return <View style={styles.searchSection}>
  <Heading>{state.hasLocation?'Cabang sekitar Anda':'Pilih cabang'}</Heading>
  <View style={styles.searchBox}><Icon name="map-pin" size={18} color={C.muted}/><TextInput value={state.query} onChangeText={value=>{state.setQuery(value);state.setShowAll(false);}} placeholder="Cari kota atau cabang Morula" placeholderTextColor={C.muted} accessibilityLabel="Cari kota atau cabang Morula" autoCorrect={false} returnKeyType="search" maxLength={100} style={styles.input}/>{state.query?<Pressable accessibilityRole="button" accessibilityLabel="Hapus pencarian cabang" onPress={()=>state.setQuery('')} style={styles.clear}><Icon name="x" size={16}/></Pressable>:null}</View>
  <View style={{flexDirection:'row',alignItems:'center',gap:8,flexWrap:'wrap'}}><Pressable accessibilityRole="button" accessibilityLabel="Gunakan lokasi saya" accessibilityState={{disabled:state.isLocating}} disabled={state.isLocating} onPress={()=>void state.locate()} style={styles.locate}>{state.isLocating?<ActivityIndicator size="small" color={C.orange}/>:<Icon name="map-pin" size={16} color={C.orange}/>}<Text style={styles.link}>Gunakan lokasi saya</Text></Pressable>{state.hasLocation||state.isLocating?<Pressable accessibilityRole="button" accessibilityLabel={state.isLocating?'Batalkan deteksi lokasi':'Hapus lokasi saya'} onPress={state.clearLocation} style={styles.clearLocation}><Copy small muted>{state.isLocating?'Batalkan':'Hapus lokasi'}</Copy></Pressable>:null}</View>
  <Copy small muted>Lokasi digunakan sekali, tidak disimpan.</Copy>
  {state.error?<View accessibilityRole="alert" style={styles.notice}><Icon name="info" color={C.orange} size={17}/><Copy small style={{flex:1}}>{state.error}</Copy></View>:null}
  {state.showSettings?<Button compact secondary onPress={()=>void Linking.openSettings().catch(()=>{})}>Buka pengaturan izin</Button>:null}
 </View>;
}
export function NearbyFacilities({state}:{state:SearchState}){
 const shown=state.showAll?state.facilities:state.facilities.slice(0,3);
 return <View><SectionTitle title="Pilihan cabang" action={state.showAll?'Ringkas':'Semua cabang'} onPress={()=>state.setShowAll(!state.showAll)}/>
 {state.query?<Copy small muted style={{marginBottom:12}}>{state.facilities.length} hasil pencarian</Copy>:null}
 {shown.length?<View style={{gap:12}}>{shown.map(item=><Card key={item.id} style={{gap:12,padding:16}}><Row style={{alignItems:'flex-start'}}><View style={styles.facilityMark}><Icon name="map-pin" size={22} color={C.orange}/></View><View style={{flex:1,gap:5}}><Text style={styles.facilityTitle}>{item.name}</Text><Copy small muted>{item.address}</Copy></View></Row><Row style={{gap:9}}><View style={{flex:1}}><Button compact secondary icon="map-pin" label={`Petunjuk arah ${item.name}`} onPress={()=>void state.openLink(`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`)}>Petunjuk arah</Button></View><Pressable accessibilityRole="link" accessibilityLabel={`Informasi resmi ${item.name}`} onPress={()=>void state.openLink(item.sourceUrl)} style={{minWidth:48,minHeight:48,alignItems:'center',justifyContent:'center'}}><Icon name="arrow-up-right" size={20} color={C.orange}/></Pressable></Row></Card>)}</View>:<Card style={{gap:10}}><Heading>Cabang belum ditemukan</Heading><Button compact secondary onPress={()=>state.setQuery('')}>Tampilkan semua cabang</Button></Card>}
 {state.linkError?<Copy small style={{color:C.red,marginTop:12}}>{state.linkError}</Copy>:null}
 </View>;
}
const styles=StyleSheet.create({
  searchSection:{gap:8,paddingTop:6,paddingBottom:12},locationMark:{height:40,width:35,justifyContent:'center'},locationTitle:{fontFamily:FONT,fontSize:15,lineHeight:21,fontWeight:'700',color:C.ink},
  searchBox:{flexDirection:'row',alignItems:'center',gap:9,minHeight:50,paddingLeft:14,paddingRight:4,borderRadius:16,backgroundColor:'#EEF0F2'},input:{flex:1,minWidth:0,minHeight:50,fontFamily:FONT,fontSize:13,color:C.ink,paddingVertical:10},clear:{width:44,height:44,alignItems:'center',justifyContent:'center'},
  locate:{minHeight:48,flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:12,borderRadius:22,backgroundColor:C.orangeSoft},link:{fontFamily:FONT,fontSize:12,lineHeight:18,fontWeight:'600',color:C.orange},clearLocation:{minHeight:44,justifyContent:'center',paddingHorizontal:8},notice:{padding:12,gap:8,borderRadius:14,backgroundColor:C.orangeSoft,flexDirection:'row',alignItems:'flex-start'},
  facility:{padding:16,gap:10,minHeight:265},facilityTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:7},facilityMark:{width:42,height:42,borderRadius:14,backgroundColor:C.orangeSoft,alignItems:'center',justifyContent:'center'},facilityTitle:{fontFamily:FONT,fontSize:16,lineHeight:22,fontWeight:'700',color:C.ink},sourceLink:{minHeight:48,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:5},
});
