import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Keyboard, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { BrandLogo } from './src/BrandLogo';
import { BrandSymbol } from './src/BrandSymbol';
import { FacilitySearchProvider } from './src/FacilityFinder';
import { getOverview, updatePreferences, updateReminder } from './src/api';
import { HomeScreen } from './src/HomeScreen';
import { JourneyScreen } from './src/JourneyScreen';
import { AppointmentsScreen } from './src/AppointmentsScreen';
import { AssistantScreen } from './src/AssistantScreen';
import { ProfileScreen } from './src/ProfileScreen';
import { DetailModal } from './src/DetailModal';
import { useReducedMotion } from './src/motion';
import {DoctorBookingProvider,useDoctorBooking} from './src/DoctorBookingProvider';
import {DoctorsScreen} from './src/DoctorsScreen';
import { Button, C, FONT, Copy, Heading, Icon, IconButton, type IconName } from './src/ui';
import type { Activity, Detail, Overview, Preferences, Tab } from './src/types';

const tabs:{key:Tab;label:string;icon:IconName}[]=[{key:'home',label:'Beranda',icon:'home'},{key:'journey',label:'Perjalanan',icon:'layers'},{key:'appointments',label:'Janji',icon:'calendar'},{key:'doctors',label:'Dokter',icon:'user'},{key:'profile',label:'Profil',icon:'shield'}];

function Application() {
  const insets=useSafeAreaInsets();
  const [headerHeight,setHeaderHeight]=useState(0);
  const [data,setData]=useState<Overview|null>(null);
  const [tab,setTab]=useState<Tab>('home');
  const [detail,setDetail]=useState<Detail|null>(null);
  const [readNotificationIds,setReadNotificationIds]=useState<string[]>([]);
  const notificationItems=(data?.notifications??[]).map(item=>readNotificationIds.includes(item.id)?{...item,read:true}:item);
  const readNotifications=(ids:string[])=>setReadNotificationIds(previous=>[...new Set([...previous,...ids])]);
  const [journeyView,setJourneyView]=useState<'program'|'embryos'|'history'>('program');
  const [appointmentView,setAppointmentView]=useState<'upcoming'|'history'>('upcoming');
  const [historyFilter,setHistoryFilter]=useState<'all'|Activity['type']>('all');
  const [assistantVisited,setAssistantVisited]=useState(false);
  const [doctorsVisited,setDoctorsVisited]=useState(false);
  const [doctorFocus,setDoctorFocus]=useState<{id:string;nonce:number}>();
  const bookingService=useDoctorBooking();
  const [preferencesFeedback,setPreferencesFeedback]=useState('');
  const reducedMotion=useReducedMotion();
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [syncError,setSyncError]=useState('');
  const [actionError,setActionError]=useState('');
  const [busyReminder,setBusyReminder]=useState<string|null>(null);
  const [busyPreferences,setBusyPreferences]=useState(false);
  const scroller=useRef<React.ElementRef<typeof ScrollView>>(null);
  const refreshingRef=useRef(false);

  const refresh=useCallback(async()=>{
    if(refreshingRef.current)return;
    refreshingRef.current=true;setRefreshing(true);
    try{setData(await getOverview());setSyncError('');}
    catch(err){setSyncError(err instanceof Error?err.message:'Data belum dapat dimuat. Periksa koneksi dan coba lagi.');}
    finally{setLoading(false);setRefreshing(false);refreshingRef.current=false;}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  const go=(next:Tab)=>{Keyboard.dismiss();if(next==='assistant')setAssistantVisited(true);if(next==='doctors')setDoctorsVisited(true);setTab(next);scroller.current?.scrollTo({y:0,animated:false});};
  const showDoctor=(id:string)=>{setDoctorFocus(previous=>({id,nonce:(previous?.nonce??0)+1}));go('doctors');};
  useEffect(()=>{
    const subscription=BackHandler.addEventListener('hardwareBackPress',()=>{
      if(tab==='home'||tab==='doctors')return false;
      Keyboard.dismiss();setTab('home');scroller.current?.scrollTo({y:0,animated:false});return true;
    });
    return ()=>subscription.remove();
  },[tab]);
  const onReminder=async(id:string,done:boolean)=>{
    if(busyReminder)return;
    setBusyReminder(id);setActionError('');
    try{const updated=await updateReminder(id,done);setData(current=>current?{...current,reminders:current.reminders.map(item=>item.id===id?updated:item)}:current);}
    catch(err){setActionError(err instanceof Error?err.message:'Pengingat belum berhasil diperbarui.');}
    finally{setBusyReminder(null);}
  };
  const onPreferences=async(value:Preferences)=>{
    if(busyPreferences)return;
    setBusyPreferences(true);setActionError('');setPreferencesFeedback('');
    try{const updated=await updatePreferences(value);setData(current=>current?{...current,preferences:updated}:current);setPreferencesFeedback('Preferensi tersimpan.');}
    catch(err){setActionError(err instanceof Error?err.message:'Preferensi belum berhasil diperbarui.');}
    finally{setBusyPreferences(false);}
  };
  return <View style={styles.outer}><SafeAreaView style={styles.app} edges={['top','bottom']}><StatusBar style="dark"/>
    <View style={styles.header} onLayout={event=>setHeaderHeight(event.nativeEvent.layout.height)}><Pressable onPress={()=>go('home')} accessibilityRole="button" accessibilityLabel="Morula Care Beranda" style={styles.wordmark}><BrandLogo/><Text style={styles.concept}>DEMO</Text></Pressable><View style={{flexDirection:'row',gap:8}}><IconButton name="bell" label="Pemberitahuan" onPress={()=>data&&setDetail({type:'notifications'})} badge={notificationItems.some(item=>!item.read)}/><IconButton name="message-circle" label="Buka asisten" onPress={()=>go('assistant')}/></View></View>
    {syncError?<View accessibilityRole="alert" style={styles.error}><Icon name="alert-circle" size={18} color={C.red}/><View style={{flex:1,gap:3}}><Text style={styles.errorTitle}>{data?'Pembaruan gagal; data sebelumnya tetap ditampilkan':'Data belum tersedia'}</Text><Copy small style={{color:C.red}}>Periksa koneksi dan coba lagi.</Copy></View><Pressable onPress={()=>void refresh()} accessibilityRole="button" accessibilityLabel="Coba lagi" style={{padding:7,minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><Icon name="refresh-cw" size={19} color={C.red}/></Pressable></View>:null}
    {actionError?<View accessibilityRole="alert" style={styles.error}><Icon name="alert-circle" size={18} color={C.red}/><Copy small style={{color:C.red,flex:1}}>{actionError}</Copy><Pressable accessibilityRole="button" accessibilityLabel="Tutup pemberitahuan tindakan" onPress={()=>setActionError('')} style={{padding:7,minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><Icon name="x" size={18} color={C.red}/></Pressable></View>:null}
    {loading?<View style={styles.center}><BrandSymbol size={54}/><ActivityIndicator color={C.orange}/><Copy muted>Menyiapkan ruang perawatan Anda…</Copy></View>:!data?<View style={styles.center}><Icon name="wifi-off" color={C.muted} size={36}/><Heading>Koneksi belum tersedia</Heading><Copy muted style={{textAlign:'center'}}>Periksa koneksi Anda, lalu coba lagi.</Copy><Button onPress={()=>void refresh()} loading={refreshing} icon="refresh-cw">Coba muat ulang</Button></View>:<>
      {data.sync.status!=='current'?<View style={styles.syncWarning}><Icon name="clock" size={15} color={C.orange}/><Copy small style={{flex:1}}>Pembaruan data tertunda.</Copy></View>:null}
      {assistantVisited?<View style={{flex:1,display:tab==='assistant'?'flex':'none'}} accessibilityElementsHidden={tab!=='assistant'} importantForAccessibility={tab==='assistant'?'auto':'no-hide-descendants'}><AssistantScreen data={data} keyboardOffset={headerHeight+insets.top} reducedMotion={reducedMotion} onHelp={()=>setDetail({type:'request'})}/></View>:null}
      {doctorsVisited?<View style={{flex:1,display:tab==='doctors'?'flex':'none'}} accessibilityElementsHidden={tab!=='doctors'} importantForAccessibility={tab==='doctors'?'auto':'no-hide-descendants'}><DoctorsScreen active={tab==='doctors'} doctorFocus={doctorFocus} onExit={()=>go('home')} onBooked={()=>{setAppointmentView('upcoming');go('appointments');}}/></View>:null}
      {tab!=='assistant'&&tab!=='doctors'?<ScrollView ref={scroller} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" style={{flex:1}} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{void refresh();void bookingService.refresh();}} tintColor={C.orange}/>}>
        {tab==='home'?<HomeScreen data={data} go={go} onDoctor={showDoctor} openJourney={view=>{setJourneyView(view);go('journey');}} open={setDetail} onReminder={(id,done)=>void onReminder(id,done)} busyReminder={busyReminder}/>:null}
        {tab==='journey'?<JourneyScreen data={data} open={setDetail} view={journeyView} onViewChange={setJourneyView} filter={historyFilter} onFilterChange={setHistoryFilter}/>:null}
        {tab==='appointments'?<AppointmentsScreen data={data} open={setDetail} view={appointmentView} onViewChange={setAppointmentView} onFindDoctor={()=>go('doctors')}/>:null}
        {tab==='profile'?<ProfileScreen data={data} feedback={preferencesFeedback} onPreferences={value=>void onPreferences(value)} busy={busyPreferences} onRefresh={()=>{void refresh();void bookingService.refresh();}} onHelp={()=>setDetail({type:'help'})}/>:null}
      </ScrollView>:null}
      <DetailModal detail={detail} data={{...data,notifications:notificationItems}} onNotificationsRead={readNotifications} onNotificationSettings={()=>{setDetail(null);go('profile');}} reducedMotion={reducedMotion} onClose={()=>setDetail(null)} onChange={setDetail}/>
    </>}
    <View style={styles.nav} accessibilityRole="tablist">{tabs.map(item=><Pressable key={item.key} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{selected:tab===item.key}} aria-selected={tab===item.key} onPress={()=>go(item.key)} style={[styles.navItem,tab===item.key&&styles.navItemActive]}><View style={[styles.navIcon,tab===item.key&&styles.navIconActive]}><Icon name={item.icon} size={20} color={tab===item.key?C.orange:C.muted}/></View><Text style={[styles.navLabel,tab===item.key&&styles.navLabelActive]}>{item.label}</Text></Pressable>)}</View>
  </SafeAreaView></View>;
}
export default function App(){return <SafeAreaProvider><FacilitySearchProvider><DoctorBookingProvider><Application/></DoctorBookingProvider></FacilitySearchProvider></SafeAreaProvider>;}
const styles=StyleSheet.create({outer:{flex:1,backgroundColor:'#E9F0F4',alignItems:'center'},app:{flex:1,width:'100%',maxWidth:480,backgroundColor:C.cream,...(Platform.OS==='web'?{boxShadow:'0 0 60px rgba(50,37,47,0.08)'}:{})},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,paddingHorizontal:20,paddingTop:9,paddingBottom:9,backgroundColor:C.white},wordmark:{flexDirection:'row',alignItems:'center',gap:3,minHeight:44},concept:{fontFamily:FONT,fontSize:7,lineHeight:10,color:C.muted,letterSpacing:1,marginLeft:4,alignSelf:'center',transform:[{translateY:3}]},demoStrip:{paddingHorizontal:20,paddingVertical:6,flexDirection:'row',gap:6,alignItems:'center',backgroundColor:C.white,borderBottomWidth:1,borderBottomColor:C.line},demoDot:{width:5,height:5,borderRadius:3,backgroundColor:C.orange},demoText:{fontFamily:FONT,fontSize:10,lineHeight:16,color:C.muted,flex:1,flexShrink:1},mode:{fontFamily:FONT,fontSize:9,lineHeight:14,letterSpacing:1,color:C.orange,marginLeft:'auto',fontWeight:'600'},page:{paddingHorizontal:20,paddingTop:18,paddingBottom:24},nav:{flexDirection:'row',backgroundColor:C.white,borderTopWidth:1,borderTopColor:C.line,paddingHorizontal:10,paddingTop:7,paddingBottom:5},navItem:{flex:1,alignItems:'center',gap:3,minHeight:58,justifyContent:'center',borderRadius:22},navItemActive:{backgroundColor:C.orangeSoft},navIcon:{width:43,height:30,alignItems:'center',justifyContent:'center',borderRadius:12},navIconActive:{},navLabel:{fontFamily:FONT,fontSize:11,lineHeight:17,color:C.muted,fontWeight:'600',textAlign:'center'},navLabelActive:{color:C.orange,fontWeight:'700'},center:{flex:1,padding:27,alignItems:'center',justifyContent:'center',gap:17},footer:{fontFamily:FONT,fontSize:9,lineHeight:15,color:C.muted,textAlign:'center',marginTop:28,marginBottom:6},error:{flexDirection:'row',gap:9,paddingHorizontal:18,paddingVertical:13,backgroundColor:'#FCEDF0',alignItems:'flex-start'},errorTitle:{fontFamily:FONT,fontSize:12,lineHeight:18,fontWeight:'600',color:C.red},syncWarning:{padding:13,flexDirection:'row',gap:8,backgroundColor:C.orangeSoft}});
