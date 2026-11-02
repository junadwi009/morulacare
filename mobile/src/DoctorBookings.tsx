import React,{useRef,useState} from 'react';

import {ActivityIndicator,Image,Pressable,StyleSheet,Text,View} from 'react-native';

import {useDoctorBooking} from './DoctorBookingProvider';

import {doctorPortrait} from './doctor-assets';

import {dateLabel,timeLabel} from './format';

import {Button,C,Card,Copy,FONT,Icon,Pill,Row,SectionTitle} from './ui';

export function DoctorBookings({history,onFindDoctor}:{history:boolean;onFindDoctor:()=>void}){

 const service=useDoctorBooking();const [historyOpen,setHistoryOpen]=useState(false);const [expanded,setExpanded]=useState<string|null>(null);const [confirm,setConfirm]=useState<string|null>(null);const [busy,setBusy]=useState<string|null>(null);const [error,setError]=useState('');const lock=useRef(false);

 const bookings=service.bookings.filter(b=>history?b.status==='cancelled_demo':b.status==='confirmed_demo').sort((a,b)=>history?Date.parse(b.startsAt)-Date.parse(a.startsAt):Date.parse(a.startsAt)-Date.parse(b.startsAt));

 const cancel=async(id:string)=>{if(lock.current)return;lock.current=true;setBusy(id);setError('');try{await service.cancel(id);setConfirm(null);}catch(e){setError(e instanceof Error?e.message:'Booking belum dibatalkan. Coba lagi.');}finally{lock.current=false;setBusy(null);}};

 return <>

  <SectionTitle title={history?'Booking dibatalkan':'Booking dokter'} action={!history?'Cari dokter':undefined} onPress={onFindDoctor}/>

  {service.loading?<Row style={{paddingVertical:12}}><ActivityIndicator size="small" color={C.orange}/><Copy small muted>Memuat booking...</Copy></Row>:null}

  {history?<Pressable accessibilityRole="button" accessibilityLabel={historyOpen?'Tutup booking dibatalkan':'Lihat booking dibatalkan'} accessibilityState={{expanded:historyOpen}} aria-expanded={historyOpen} onPress={()=>setHistoryOpen(value=>!value)} style={({pressed})=>[s.historyToggle,pressed&&{opacity:.7}]}><Copy small muted>{service.loading?'Memuat...':`${bookings.length} booking`}</Copy><Row style={{gap:6}}><Text style={s.historyAction}>{historyOpen?'Tutup':'Lihat'}</Text><View style={historyOpen?{transform:[{rotate:'90deg'}]}:undefined}><Icon name="chevron-right" size={16} color={C.orange}/></View></Row></Pressable>:null}
  {service.error?<View style={{gap:12,marginBottom:14}}><Copy small muted>Booking belum dapat diperbarui.</Copy><Button compact secondary onPress={()=>void service.refresh()}>Coba lagi booking</Button></View>:null}

  {(history&&!historyOpen?[]:bookings).map(item=>{const doctor=service.doctors.find(d=>d.id===item.doctorId);return <Card key={item.id} style={{marginBottom:14,gap:12}}><Pressable accessibilityRole="button" accessibilityLabel={`Detail booking ${item.doctorName}`} accessibilityState={{expanded:expanded===item.id}} aria-expanded={expanded===item.id} onPress={()=>{setExpanded(expanded===item.id?null:item.id);setConfirm(null);setError('');}} style={({pressed})=>[s.header,pressed&&{opacity:.7}]}><Image source={doctorPortrait(doctor?.imageKey??'maya')} style={s.photo} accessibilityLabel={`Ilustrasi ${item.doctorName}`}/><View style={{flex:1,gap:5}}><Text style={s.name}>{item.doctorName}</Text><Copy small muted>{item.specialty}</Copy><Pill tone={history?'neutral':'green'}>{history?'Dibatalkan':'Terkonfirmasi · Demo'}</Pill></View><Icon name="chevron-right" size={17} color={C.muted}/></Pressable><Copy small>{dateLabel(item.startsAt,item.timeZone)} · {timeLabel(item.startsAt,item.timeZone)}</Copy><Copy small muted>{item.branchName}</Copy>{expanded===item.id?<View style={s.details}><Copy small muted>Keperluan konsultasi</Copy><Copy small>{item.reason}</Copy>{!history?<>{confirm===item.id?<View style={{gap:10}}><Copy>Batalkan booking ini?</Copy><Button secondary compact disabled={busy!==null} onPress={()=>setConfirm(null)}>Tetap booking</Button><Button compact loading={busy===item.id} onPress={()=>void cancel(item.id)} label={`Konfirmasi batal ${item.doctorName}`}>Ya, batalkan</Button></View>:<Button secondary compact icon="x" onPress={()=>setConfirm(item.id)}>Batalkan booking</Button>}{error?<Copy small style={{color:C.red}}>{error}</Copy>:null}</>:null}</View>:null}</Card>;})}

  {(!history||historyOpen)&&!bookings.length&&!service.loading&&!service.error?<View style={s.empty}><View style={s.emptyIcon}><Icon name="calendar" size={20} color={C.orange}/></View><Copy small muted style={{flex:1}}>{history?'Belum ada booking dibatalkan.':'Belum ada booking dokter.'}</Copy></View>:null}

 </>;

}

const s=StyleSheet.create({historyToggle:{minHeight:56,padding:16,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:14},historyAction:{fontFamily:FONT,fontSize:13,lineHeight:20,fontWeight:'600',color:C.orange},empty:{flexDirection:'row',alignItems:'center',gap:12,padding:16,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:20},emptyIcon:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:13,backgroundColor:C.orangeSoft},header:{flexDirection:'row',gap:12,alignItems:'center',minHeight:72},photo:{width:62,height:76,borderRadius:15,backgroundColor:C.cream},name:{fontFamily:FONT,fontSize:16,lineHeight:23,fontWeight:'700',color:C.ink},details:{borderTopWidth:1,borderTopColor:C.line,paddingTop:14,gap:12}});

