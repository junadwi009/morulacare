import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { makeId } from './api';
import { doctorPortrait } from './doctor-assets';
import { useDoctorBooking } from './DoctorBookingProvider';
import type { Doctor, DoctorBooking, DoctorSlot } from './doctor-types';
import { dateLabel, dayParts, timeLabel } from './format';
import { Button, C, Card, Copy, FONT, Heading, Icon, Pill, Row } from './ui';

type Step = 'directory' | 'profile' | 'schedule' | 'review' | 'receipt';
type Filter = 'all' | 'favorites' | 'female' | 'male';
const filters: {key:Filter;label:string}[] = [{key:'all',label:'Semua'},{key:'favorites',label:'Favorit'},{key:'female',label:'Perempuan'},{key:'male',label:'Laki-laki'}];
const defaultReason = 'Konsultasi program fertilitas';
const localDate = (slot:DoctorSlot) => new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:slot.timeZone}).format(new Date(slot.startsAt));
const normalize = (value:string) => value.toLocaleLowerCase('id-ID');
const period = (slot:DoctorSlot) => { const hour=Number(new Intl.DateTimeFormat('en-GB',{hour:'numeric',hourCycle:'h23',timeZone:slot.timeZone}).format(new Date(slot.startsAt)));return hour<12?'Pagi':hour<17?'Siang':'Sore'; };
const fullDate = (slot:DoctorSlot) => new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'short',year:'numeric',timeZone:slot.timeZone}).format(new Date(slot.startsAt));
const isFemale = (doctor:Doctor) => /female|perempuan|wanita/i.test(doctor.gender);

export function DoctorsScreen({onBooked,active=true,onExit,doctorFocus}:{onBooked:()=>void;active?:boolean;onExit?:()=>void;doctorFocus?:{id:string;nonce:number}}) {
  const service=useDoctorBooking();
  const [step,setStep]=useState<Step>('directory');
  const [query,setQuery]=useState('');
  const [filter,setFilter]=useState<Filter>('all');
  const [doctorId,setDoctorId]=useState<string|null>(null);
  const [slots,setSlots]=useState<DoctorSlot[]>([]);
  const [date,setDate]=useState('');
  const [slotId,setSlotId]=useState<string|null>(null);
  const [aboutOpen,setAboutOpen]=useState(false);
  const [reason,setReason]=useState(defaultReason);
  const [slotsLoading,setSlotsLoading]=useState(false);
  const [slotsError,setSlotsError]=useState('');
  const [error,setError]=useState('');
  const [catalogError,setCatalogError]=useState('');
  const [busy,setBusy]=useState(false);
  const [receipt,setReceipt]=useState<DoctorBooking|null>(null);
  const request=useRef(0);
  const mounted=useRef(true);
  const submitting=useRef(false);
  const processedFocus=useRef('');
  const idempotency=useRef<{payload:string;key:string}|null>(null);
  const scroll=useRef<React.ElementRef<typeof ScrollView>>(null);
  const doctor=service.doctors.find(item=>item.id===doctorId)??null;
  const selectedSlot=slots.find(item=>item.id===slotId)??null;
  const currentReceipt=receipt?(service.bookings.find(item=>item.id===receipt.id)??receipt):null;
  const dates=[...new Set(slots.map(localDate))];
  const shownSlots=slots.filter(item=>localDate(item)===date);
  const dateSample=shownSlots[0]??slots[0];
  const monthTitle=dateSample?new Intl.DateTimeFormat('id-ID',{month:'long',year:'numeric',timeZone:dateSample.timeZone}).format(new Date(dateSample.startsAt)):'';
  const zoneLabel=dateSample?.timeZone==='Asia/Jakarta'?'WIB':dateSample?.timeZone==='Asia/Makassar'?'WITA':dateSample?.timeZone==='Asia/Jayapura'?'WIT':dateSample?.timeZone;
  const doctors=service.doctors.filter(item=>{
    if(filter==='favorites'&&!service.favoriteIds.includes(item.id))return false;
    if(filter==='female'&&!isFemale(item))return false;
    if(filter==='male'&&isFemale(item))return false;
    return normalize([item.name,item.specialty,item.branchName,...item.languages].join(' ')).includes(normalize(query.trim()));
  });

  useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;request.current++;};},[]);
  const toTop=()=>scroll.current?.scrollTo({y:0,animated:false});
  const back=()=>{
    if(submitting.current)return true;
    Keyboard.dismiss();setError('');
    if(step==='review'){setStep('schedule');toTop();return true;}
    if(step==='schedule'){setStep('profile');toTop();return true;}
    if(step!=='directory'){
      request.current++;setStep('directory');setDoctorId(null);setSlotsLoading(false);setReceipt(null);toTop();return true;
    }
    if(onExit){onExit();return true;}
    return false;
  };
  useEffect(()=>{
    if(!active)return;
    const subscription=BackHandler.addEventListener('hardwareBackPress',back);
    return ()=>subscription.remove();
  },[active,step,onExit]);

  const loadSlots=async(id:string,preserve=false)=>{
    const sequence=++request.current;
    setSlotsLoading(true);setSlotsError('');
    try {
      const fresh=await service.getSlots(id);
      if(!mounted.current||sequence!==request.current)return;
      const ordered=[...fresh].sort((a,b)=>Date.parse(a.startsAt)-Date.parse(b.startsAt));
      setSlots(ordered);
      setDate(current=>preserve&&ordered.some(item=>localDate(item)===current)?current:(ordered.find(item=>item.available)?localDate(ordered.find(item=>item.available)!):ordered[0]?localDate(ordered[0]):''));
      if(!preserve)setSlotId(null);
    } catch(failure) {
      if(mounted.current&&sequence===request.current)setSlotsError(failure instanceof Error?failure.message:'Jadwal belum dapat dimuat.');
    } finally {if(mounted.current&&sequence===request.current)setSlotsLoading(false);}
  };
  const chooseDoctor=(item:Doctor)=>{
    request.current++;setDoctorId(item.id);setStep('profile');setSlots([]);setDate('');setSlotId(null);setReason(defaultReason);setAboutOpen(false);setError('');setReceipt(null);idempotency.current=null;toTop();void loadSlots(item.id);
  };
  useEffect(()=>{
    if(!active||!doctorFocus||busy)return;
    const key=`${doctorFocus.id}:${doctorFocus.nonce}`;
    if(processedFocus.current===key)return;
    const target=service.doctors.find(item=>item.id===doctorFocus.id);
    if(!target)return;
    processedFocus.current=key;
    chooseDoctor(target);
  },[active,doctorFocus?.id,doctorFocus?.nonce,service.doctors,busy]);
  const refreshCatalog=()=>{
    setCatalogError('');
    void service.refresh().catch((failure:unknown)=>setCatalogError(failure instanceof Error?failure.message:'Dokter belum dapat dimuat.'));
  };
  const review=()=>{
    if(!doctor||!selectedSlot?.available||slotsLoading||!reason.trim())return;
    Keyboard.dismiss();setError('');setStep('review');toTop();
  };
  const confirm=async()=>{
    if(!doctor||!selectedSlot||submitting.current)return;
    const payload=JSON.stringify({doctorId:doctor.id,slotId:selectedSlot.id,reason:reason.trim()});
    const entry=idempotency.current?.payload===payload?idempotency.current:{payload,key:makeId()};
    idempotency.current=entry;
    submitting.current=true;setBusy(true);setError('');Keyboard.dismiss();
    try {
      const booked=await service.book(doctor.id,selectedSlot.id,reason.trim(),entry.key);
      if(!mounted.current)return;
      setReceipt(booked);setStep('receipt');toTop();
    } catch(failure) {
      if(!mounted.current)return;
      const status=(failure as {status?:number}|null)?.status;
      if(status===409){
        setError('Waktu ini sudah terisi. Pilih waktu lain.');setSlotId(null);setStep('schedule');void loadSlots(doctor.id,true);toTop();
      } else setError(status&&failure instanceof Error?failure.message:'Booking belum dapat dipastikan. Coba lagi untuk memeriksa permintaan yang sama.');
    } finally {submitting.current=false;if(mounted.current)setBusy(false);}
  };
  const favorite=(item:Doctor)=><Pressable accessibilityRole="button" accessibilityLabel={`${service.favoriteIds.includes(item.id)?'Hapus favorit':'Favoritkan'} ${item.name}`} accessibilityState={{selected:service.favoriteIds.includes(item.id)}} aria-pressed={service.favoriteIds.includes(item.id)} onPress={()=>service.toggleFavorite(item.id)} style={({pressed})=>[styles.favorite,service.favoriteIds.includes(item.id)&&styles.favoriteActive,pressed&&styles.pressed]}><Icon name="heart" size={21} color={service.favoriteIds.includes(item.id)?C.orange:C.muted}/></Pressable>;

  const openSchedule=()=>{Keyboard.dismiss();setStep('schedule');toTop();};
  const doctorSummary=doctor?<Row style={{alignItems:'flex-start'}}><Image source={doctorPortrait(doctor.imageKey)} style={styles.summaryPortrait} resizeMode="cover" accessible={false}/><View style={{flex:1,minWidth:0,gap:4}}><Text style={styles.doctorName}>{doctor.name}</Text><Copy small muted>{doctor.specialty}</Copy><Copy small muted>{doctor.branchName}</Copy></View></Row>:null;

  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS==='ios'?'padding':undefined}>
    <ScrollView ref={scroll} style={{flex:1,minHeight:0}} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false}>
      <Row style={styles.header}>
        {step!=='directory'?<Pressable accessibilityRole="button" accessibilityLabel={step==='review'?'Kembali ke jadwal':step==='schedule'?'Kembali ke profil dokter':'Kembali ke pilihan dokter'} disabled={busy} onPress={back} style={({pressed})=>[styles.back,pressed&&styles.pressed]}><View style={{transform:[{rotate:'180deg'}]}}><Icon name="arrow-right" size={20}/></View><Text style={styles.backText}>{step==='review'?'Jadwal':step==='schedule'?'Profil dokter':'Dokter'}</Text></Pressable>:<Text accessibilityRole="header" style={styles.pageTitle}>Cari dokter</Text>}
        <Pill>Demo</Pill>
      </Row>
      {step==='directory'?<>
        <View style={styles.search}><Icon name="user" color={C.muted} size={20}/><TextInput accessibilityLabel="Cari dokter, cabang, atau bahasa" placeholder="Cari dokter, cabang, atau bahasa" placeholderTextColor={C.muted} value={query} onChangeText={setQuery} autoCorrect={false} maxLength={100} returnKeyType="search" style={styles.input}/>{query?<Pressable accessibilityRole="button" accessibilityLabel="Hapus pencarian dokter" onPress={()=>setQuery('')} style={styles.clear}><Icon name="x" size={18}/></Pressable>:null}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} keyboardShouldPersistTaps="handled">{filters.map(item=><Pressable key={item.key} accessibilityRole="button" accessibilityLabel={`Filter dokter ${item.label}`} accessibilityState={{selected:filter===item.key}} aria-pressed={filter===item.key} onPress={()=>setFilter(item.key)} style={({pressed})=>[styles.chip,filter===item.key&&styles.chipActive,pressed&&styles.pressed]}><Text style={[styles.chipText,filter===item.key&&styles.chipTextActive]}>{item.label}</Text></Pressable>)}</ScrollView>
        {service.loading?<Row style={{paddingVertical:14}}><ActivityIndicator color={C.orange}/><Copy small muted>Memuat dokter…</Copy></Row>:null}
        {service.error||catalogError?<View accessibilityRole="alert" style={styles.error}><Copy small style={{color:C.red}}>{catalogError||service.error}</Copy><Button secondary compact icon="refresh-cw" onPress={refreshCatalog}>Coba lagi</Button></View>:null}
        {doctors.map(item=><View key={item.id} style={styles.doctorCard}><Pressable accessibilityRole="button" accessibilityLabel={`Profil ${item.name}`} accessibilityHint={`${item.specialty}, ${item.branchName}`} onPress={()=>chooseDoctor(item)} style={({pressed})=>[styles.doctorMain,pressed&&styles.pressed]}><Image source={doctorPortrait(item.imageKey)} style={styles.thumbnail} resizeMode="cover" accessible={false}/><View style={{flex:1,minWidth:0,gap:5}}><Text style={styles.doctorName}>{item.name}</Text><Copy small muted>{item.specialty}</Copy><Copy small muted>{item.branchName}</Copy><View style={styles.profileLink}><Text style={styles.link}>Lihat profil</Text><Icon name="chevron-right" size={14} color={C.orange}/></View></View></Pressable><View style={styles.cardFavorite}>{favorite(item)}</View></View>)}
        {!service.loading&&!service.error&&!catalogError&&!doctors.length?<Card style={{gap:12,marginTop:8}}><Heading>Dokter belum ditemukan</Heading><Copy small muted>{filter==='favorites'?'Simpan dokter pilihan dengan tombol hati.':'Coba nama, cabang, atau bahasa lain.'}</Copy><Button secondary onPress={()=>{setQuery('');setFilter('all');}}>Lihat semua dokter</Button></Card>:null}
      </>:null}
      {step==='profile'&&doctor?<>
        <View style={styles.portraitWrap}><Image source={doctorPortrait(doctor.imageKey)} style={styles.portrait} resizeMode="cover" accessibilityLabel={`Foto dokter fiktif ${doctor.name}`}/><View style={styles.portraitFavorite}>{favorite(doctor)}</View></View>
        <View style={styles.profileIntro}><Text accessibilityRole="header" style={styles.pageTitle}>{doctor.name}</Text><Copy muted>{doctor.specialty}</Copy><Row style={{gap:7,alignItems:'flex-start'}}><Icon name="map-pin" size={16} color={C.orange}/><Copy small muted style={{flex:1}}>{doctor.branchName}</Copy></Row><Row style={{gap:8,flexWrap:'wrap'}}><Pill icon="user">{doctor.experienceYears} tahun pengalaman</Pill><Pill>{doctor.languages.join(' · ')}</Pill></Row></View>
        <View style={styles.about}><Pressable accessibilityRole="button" accessibilityLabel="Tentang dokter" accessibilityState={{expanded:aboutOpen}} aria-expanded={aboutOpen} onPress={()=>setAboutOpen(value=>!value)} style={({pressed})=>[styles.aboutAction,pressed&&styles.pressed]}><Text style={styles.aboutTitle}>Tentang dokter</Text><View style={aboutOpen?{transform:[{rotate:'90deg'}]}:undefined}><Icon name="chevron-right" size={17} color={C.muted}/></View></Pressable>{aboutOpen?<Copy small muted style={{paddingBottom:16}}>{doctor.bio}</Copy>:null}</View>
        <Button icon="calendar" onPress={openSchedule}>Pilih jadwal</Button>
      </>:null}
      {step==='schedule'&&doctor?<>
        <Text accessibilityRole="header" style={styles.pageTitle}>Pilih jadwal</Text>
        <Card style={styles.scheduleDoctor}>{doctorSummary}</Card>
        <View style={styles.section}><Heading>Pilih tanggal</Heading>{monthTitle?<Copy small muted>{monthTitle}</Copy>:null}</View>
        {slotsLoading?<Row style={{paddingVertical:20}}><ActivityIndicator color={C.orange}/><Copy small muted>Memuat jadwal…</Copy></Row>:slotsError?<View accessibilityRole="alert" style={styles.error}><Copy small style={{color:C.red}}>{slotsError}</Copy><Button compact secondary icon="refresh-cw" onPress={()=>void loadSlots(doctor.id,true)}>Coba lagi jadwal</Button></View>:!dates.length?<Card><Copy muted>Belum ada jadwal tersedia.</Copy></Card>:<>
          <View style={styles.dates}>{dates.map(key=>{const sample=slots.find(item=>localDate(item)===key)!;const parts=dayParts(sample.startsAt,sample.timeZone);const selected=key===date;const available=slots.some(item=>localDate(item)===key&&item.available);return <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Pilih tanggal ${dateLabel(sample.startsAt,sample.timeZone)}`} accessibilityState={{selected,disabled:!available}} aria-pressed={selected} aria-disabled={!available} disabled={!available} onPress={()=>{if(key!==date){setDate(key);setSlotId(null);setError('');}}} style={({pressed})=>[styles.date,selected&&available&&styles.dateActive,!available&&styles.dateUnavailable,pressed&&styles.pressed]}><Text style={[styles.weekday,selected&&available&&styles.dateTextActive]}>{parts.weekday.slice(0,3)}</Text><Text style={[styles.day,selected&&available&&styles.dateTextActive]}>{parts.day}</Text><Text style={[styles.weekday,selected&&available&&styles.dateTextActive]}>{parts.month}</Text>{!available?<Text style={styles.unavailable}>Penuh</Text>:null}</Pressable>;})}</View>
          <View style={styles.section}><Heading>Pilih waktu</Heading><Copy small muted>{zoneLabel}</Copy></View>
          {dateSample?<Copy small muted style={{marginBottom:15}}>{fullDate(dateSample)}</Copy>:null}
          {(['Pagi','Siang','Sore'] as const).map(group=>{const items=shownSlots.filter(item=>period(item)===group);return items.length?<View key={group} style={styles.timeGroup}><Text style={styles.groupTitle}>{group}</Text><View style={styles.times}>{items.map(item=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Pilih waktu ${timeLabel(item.startsAt,item.timeZone)}`} accessibilityState={{selected:slotId===item.id,disabled:!item.available}} aria-pressed={slotId===item.id} aria-disabled={!item.available} disabled={!item.available} onPress={()=>{setSlotId(item.id);setError('');}} style={({pressed})=>[styles.time,slotId===item.id&&styles.timeActive,!item.available&&styles.timeUnavailable,pressed&&styles.pressed]}><Text style={[styles.timeText,slotId===item.id&&styles.dateTextActive,!item.available&&{color:C.muted}]}>{timeLabel(item.startsAt,item.timeZone).replace(/ WIB$| WITA$| WIT$/,'')}</Text>{!item.available?<Text style={styles.unavailable}>Terisi</Text>:null}</Pressable>)}</View></View>:null;})}
          {!shownSlots.some(item=>item.available)?<Copy small muted>Pilih tanggal lain untuk jam tersedia.</Copy>:null}
        </>}
        <View style={styles.section}><Heading>Keperluan konsultasi</Heading></View><TextInput accessibilityLabel="Keperluan konsultasi" value={reason} onChangeText={setReason} placeholder="Keperluan konsultasi" placeholderTextColor={C.muted} maxLength={500} multiline style={styles.reason} editable={!busy}/>
        {error?<View accessibilityRole="alert" style={styles.error}><Copy small style={{color:C.red}}>{error}</Copy></View>:null}
        <View accessibilityLiveRegion="polite" style={[styles.selection,selectedSlot?.available&&styles.selectionActive]}><Icon name="calendar" size={18} color={selectedSlot?.available?C.green:C.muted}/><View style={{flex:1,minWidth:0,gap:3}}><Copy small>{selectedSlot?fullDate(selectedSlot):'Pilih tanggal dan jam'}</Copy><Copy small muted>{selectedSlot?timeLabel(selectedSlot.startsAt,selectedSlot.timeZone):'Belum ada jam dipilih'}</Copy></View></View>
        <Button icon="arrow-right" disabled={!selectedSlot?.available||!reason.trim()||slotsLoading||!!slotsError} onPress={review}>Lanjut booking</Button>
      </>:null}
      {step==='review'&&doctor&&selectedSlot?<>
        <Text accessibilityRole="header" style={styles.pageTitle}>Tinjau booking</Text><Card style={styles.reviewCard}>{doctorSummary}<View style={styles.rule}/><Row style={{alignItems:'flex-start',gap:10}}><Icon name="calendar" color={C.orange}/><View style={{flex:1,gap:5}}><Copy>{fullDate(selectedSlot)}</Copy><Copy small muted>{timeLabel(selectedSlot.startsAt,selectedSlot.timeZone)}</Copy></View></Row><View style={styles.rule}/><Copy small muted>Keperluan konsultasi</Copy><Copy small>{reason.trim()}</Copy><Button compact secondary icon="calendar" disabled={busy} onPress={openSchedule}>Ubah jadwal</Button></Card>
        <View style={styles.demoNote}><Icon name="info" size={17} color={C.muted}/><Copy small muted style={{flex:1}}>Demo, bukan reservasi klinik.</Copy></View>
        {error?<View accessibilityRole="alert" style={styles.error}><Copy small style={{color:C.red}}>{error}</Copy></View>:null}
        <Button icon="calendar" loading={busy} onPress={()=>void confirm()}>Booking demo</Button>
      </>:null}
      {step==='receipt'&&currentReceipt?<View style={styles.receipt}><View style={styles.receiptIcon}><Icon name={currentReceipt.status==='cancelled_demo'?'x':'check'} size={34} color={C.green}/></View><Pill tone={currentReceipt.status==='cancelled_demo'?'neutral':'green'}>{currentReceipt.status==='cancelled_demo'?'Dibatalkan · Demo':'Terkonfirmasi · Demo'}</Pill><Text accessibilityRole="header" style={styles.pageTitle}>{currentReceipt.status==='cancelled_demo'?'Booking demo dibatalkan':'Booking demo tersimpan'}</Text><Card style={{width:'100%',gap:12}}><Heading>{currentReceipt.doctorName}</Heading><Copy small muted>{currentReceipt.specialty}</Copy><Row style={{gap:9,alignItems:'flex-start'}}><Icon name="calendar" color={C.orange} size={17}/><Copy small style={{flex:1}}>{dateLabel(currentReceipt.startsAt,currentReceipt.timeZone)} · {timeLabel(currentReceipt.startsAt,currentReceipt.timeZone)}</Copy></Row><Row style={{gap:9,alignItems:'flex-start'}}><Icon name="map-pin" color={C.orange} size={17}/><Copy small muted style={{flex:1}}>{currentReceipt.branchName}</Copy></Row></Card><Copy small muted style={{textAlign:'center'}}>Bukan reservasi klinik atau bukti pembayaran.</Copy><View style={{width:'100%'}}><Button icon="calendar" onPress={()=>{setStep('directory');setDoctorId(null);setReceipt(null);onBooked();}}>Lihat janji saya</Button></View></View>:null}
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles=StyleSheet.create({
  root:{flex:1,minHeight:0},page:{paddingHorizontal:20,paddingTop:18,paddingBottom:30},header:{justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:18},pageTitle:{fontFamily:FONT,fontSize:23,lineHeight:30,fontWeight:'700',letterSpacing:-.5,color:C.ink},back:{minHeight:48,flexDirection:'row',alignItems:'center',gap:9,paddingRight:10},backText:{fontFamily:FONT,fontSize:14,lineHeight:21,fontWeight:'600',color:C.ink},pressed:{opacity:.72},
  search:{minHeight:52,flexDirection:'row',alignItems:'center',gap:10,paddingLeft:15,paddingRight:4,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:16},input:{flex:1,minWidth:0,minHeight:50,fontFamily:FONT,fontSize:13,lineHeight:20,color:C.ink,paddingVertical:12},clear:{width:48,height:48,alignItems:'center',justifyContent:'center'},filters:{gap:8,paddingVertical:16},chip:{minHeight:48,paddingHorizontal:15,alignItems:'center',justifyContent:'center',borderRadius:15,borderWidth:1,borderColor:C.line,backgroundColor:C.white},chipActive:{backgroundColor:C.orange,borderColor:C.orange},chipText:{fontFamily:FONT,fontSize:12,lineHeight:19,color:C.muted,fontWeight:'600'},chipTextActive:{color:C.white},
  doctorCard:{flexDirection:'row',alignItems:'flex-start',backgroundColor:C.white,borderRadius:20,borderWidth:1,borderColor:C.line,marginBottom:13},doctorMain:{flex:1,flexDirection:'row',alignItems:'center',gap:12,padding:14,minHeight:126},thumbnail:{width:68,height:88,borderRadius:14,backgroundColor:C.orangeSoft},doctorName:{fontFamily:FONT,fontSize:16,lineHeight:23,fontWeight:'700',color:C.ink},profileLink:{flexDirection:'row',alignItems:'center',gap:4,marginTop:2},link:{fontFamily:FONT,fontSize:12,lineHeight:19,fontWeight:'600',color:C.orange},cardFavorite:{marginTop:5,marginRight:4},favorite:{width:48,height:48,borderRadius:24,backgroundColor:C.white,alignItems:'center',justifyContent:'center'},favoriteActive:{backgroundColor:C.orangeSoft},
  portraitWrap:{position:'relative',width:'100%',aspectRatio:1.15,borderRadius:20,overflow:'hidden',backgroundColor:C.orangeSoft},portrait:{width:'100%',height:'100%'},portraitFavorite:{position:'absolute',top:10,right:10},profileIntro:{gap:9,paddingTop:18,paddingBottom:16},about:{borderTopWidth:1,borderTopColor:C.line,marginBottom:18},aboutAction:{minHeight:56,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},aboutTitle:{fontFamily:FONT,fontSize:14,lineHeight:21,fontWeight:'600',color:C.ink},scheduleDoctor:{marginTop:18,padding:14},summaryPortrait:{width:48,height:60,borderRadius:12,backgroundColor:C.orangeSoft},
  section:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:24,marginBottom:13},dates:{flexDirection:'row',flexWrap:'wrap',gap:10},date:{minWidth:86,flexBasis:86,flexGrow:1,minHeight:104,borderWidth:1,borderColor:C.line,borderRadius:16,backgroundColor:C.white,paddingHorizontal:12,paddingVertical:12,alignItems:'center',justifyContent:'center',gap:4},dateActive:{backgroundColor:C.orange,borderColor:C.orange},dateUnavailable:{backgroundColor:C.cream,borderColor:C.line,borderStyle:'dashed'},weekday:{fontFamily:FONT,fontSize:11,lineHeight:17,color:C.muted},day:{fontFamily:FONT,fontSize:23,lineHeight:29,fontWeight:'700',color:C.ink},dateTextActive:{color:C.white},timeGroup:{gap:9,marginBottom:17},groupTitle:{fontFamily:FONT,fontSize:13,lineHeight:20,fontWeight:'600',color:C.ink},times:{flexDirection:'row',flexWrap:'wrap',gap:9},time:{minWidth:92,minHeight:50,borderWidth:1,borderColor:C.line,borderRadius:13,backgroundColor:C.white,paddingHorizontal:16,paddingVertical:12,alignItems:'center',justifyContent:'center',gap:3},timeActive:{backgroundColor:C.orange,borderColor:C.orange},timeUnavailable:{backgroundColor:C.cream,borderStyle:'dashed'},timeText:{fontFamily:FONT,fontSize:13,lineHeight:20,fontWeight:'600',color:C.ink},unavailable:{fontFamily:FONT,fontSize:10,lineHeight:15,color:C.muted},reason:{minHeight:88,textAlignVertical:'top',backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:15,padding:15,fontFamily:FONT,fontSize:14,lineHeight:22,color:C.ink,marginBottom:16},selection:{flexDirection:'row',alignItems:'center',gap:10,padding:14,borderRadius:15,backgroundColor:C.cream,borderWidth:1,borderColor:C.line,marginBottom:14},selectionActive:{backgroundColor:C.greenSoft,borderColor:C.greenSoft},
  error:{gap:10,padding:14,borderRadius:14,backgroundColor:'#FCEDF0',marginVertical:12},reviewCard:{gap:13,marginVertical:18},rule:{height:1,backgroundColor:C.line},demoNote:{flexDirection:'row',gap:8,alignItems:'flex-start',paddingBottom:18},receipt:{alignItems:'center',gap:18,paddingTop:20},receiptIcon:{width:68,height:68,borderRadius:34,backgroundColor:C.greenSoft,alignItems:'center',justifyContent:'center'},
});
