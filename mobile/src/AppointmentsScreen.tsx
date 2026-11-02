import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C, FONT, Card, Copy, Empty, Heading, Icon, Pill, Row, Segments } from './ui';
import { dateLabel, dayParts, statusLabel, timeLabel } from './format';
import type { Detail, Overview } from './types';
import {DoctorBookings} from './DoctorBookings';

type ViewKey = 'upcoming' | 'history';
export function AppointmentsScreen({data,open,view:controlledView,onViewChange,onFindDoctor}:{data:Overview;open:(detail:Detail)=>void;view?:ViewKey;onViewChange?:(view:ViewKey)=>void;onFindDoctor:()=>void}) {
  const [localView,setLocalView]=useState<ViewKey>('upcoming');
  const view=controlledView??localView;
  const setView=(next:ViewKey)=>{setLocalView(next);onViewChange?.(next);};
  const items=[...data.appointments]
    .filter(item=>view==='upcoming'?item.status==='confirmed':item.status!=='confirmed')
    .sort((a,b)=>view==='upcoming'?Date.parse(a.startsAt)-Date.parse(b.startsAt):Date.parse(b.startsAt)-Date.parse(a.startsAt));
  return <>
    <View style={styles.intro}><Text accessibilityRole="header" style={styles.pageTitle}>Janji Anda</Text></View>
    <Segments items={[{key:'upcoming',label:'Akan datang'},{key:'history',label:'Riwayat janji'}]} value={view} onChange={setView}/>
    {view==='upcoming'?<DoctorBookings key={view} history={false} onFindDoctor={onFindDoctor}/>:null}<View style={styles.listHeading}><Text style={styles.listLabel}>{view==='upcoming'?'Jadwal perawatan':'Riwayat perawatan'}</Text><Text style={styles.listCount}>{items.length} janji</Text></View>
    {items.length?items.map((item,index)=>{
      const parts=dayParts(item.startsAt,item.timeZone);
      const featured=view==='upcoming'&&index===0;
      return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Detail janji ${item.title}`} onPress={()=>open({type:'appointment',item})} style={({pressed})=>[styles.item,pressed&&styles.pressed]}>
        <Card style={featured?styles.featured:styles.compact}>
          {featured?<View style={styles.featuredLabel}><View style={styles.statusDot}/><Text style={styles.nextLabel}>Kunjungan berikutnya</Text></View>:null}
          <Row style={{alignItems:'flex-start'}}>
            <View style={[styles.date,!featured&&styles.dateCompact]}><Text style={styles.month}>{parts.month}</Text><Text style={[styles.day,!featured&&styles.dayCompact]}>{parts.day}</Text></View>
            <View style={{flex:1,gap:7}}><Pill tone={item.status==='confirmed'?'green':'neutral'}>{statusLabel[item.status]}</Pill><Text style={[styles.title,featured&&styles.titleFeatured]}>{item.title}</Text><Copy small muted>{item.clinician}</Copy></View>
          </Row>
          <View style={styles.meta}>
            <Row style={{gap:9,alignItems:'flex-start'}}><Icon name="clock" size={16} color={C.muted}/><Copy small style={{flex:1}}>{dateLabel(item.startsAt,item.timeZone)} · {timeLabel(item.startsAt,item.timeZone)}</Copy></Row>
            <Row style={{gap:9,alignItems:'flex-start'}}><Icon name="map-pin" size={16} color={C.muted}/><Copy small muted style={{flex:1}}>{item.branch}</Copy></Row>
          </View>
          {featured?<>
            <View style={styles.primaryAction}><Icon name="file-text" size={17} color={C.white}/><Text style={styles.primaryActionText}>Detail & persiapan</Text><Icon name="arrow-right" size={17} color={C.white}/></View>
          </>:<View style={styles.detailAction}><Text style={styles.detailActionText}>Lihat detail</Text><Icon name="chevron-right" size={15} color={C.orange}/></View>}
        </Card>
      </Pressable>;
    }):<Empty icon="calendar" title={view==='upcoming'?'Belum ada janji berikutnya':'Belum ada riwayat janji'} body="Jadwal akan muncul setelah dicatat dan dikonfirmasi oleh klinik."/>}
    {view==='history'?<DoctorBookings key={view} history onFindDoctor={onFindDoctor}/>:null}
    {view==='upcoming'?<View style={styles.note}><Icon name="info" size={18} color={C.muted}/><Copy small muted style={{flex:1}}>Usulkan perubahan jadwal melalui detail janji.</Copy></View>:null}
  </>;
}
const styles=StyleSheet.create({
  intro:{marginTop:2,marginBottom:20},pageTitle:{fontFamily:FONT,fontSize:23,lineHeight:30,fontWeight:'700',letterSpacing:-.5,color:C.ink},
  listHeading:{marginTop:24,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:14},
  listLabel:{fontFamily:FONT,fontSize:14,lineHeight:20,fontWeight:'700',color:C.ink,flex:1},
  listCount:{fontFamily:FONT,fontSize:12,lineHeight:18,color:C.muted},
  item:{marginBottom:16},pressed:{opacity:.78},
  featured:{borderColor:C.orangeSoft,padding:18,gap:0},compact:{padding:18},
  featuredLabel:{flexDirection:'row',alignItems:'center',gap:7,marginBottom:18},statusDot:{width:6,height:6,borderRadius:3,backgroundColor:C.orange},
  nextLabel:{fontFamily:FONT,fontSize:12,lineHeight:18,fontWeight:'600',color:C.orange},
  date:{width:60,backgroundColor:C.orangeSoft,borderRadius:16,paddingVertical:12,alignItems:'center',gap:3},
  dateCompact:{width:48,paddingVertical:9,borderRadius:13,backgroundColor:C.cream},
  month:{fontFamily:FONT,fontSize:10,lineHeight:15,letterSpacing:.8,color:C.orange,fontWeight:'700'},
  day:{fontFamily:FONT,fontSize:29,color:C.orange,fontWeight:'700',lineHeight:35},dayCompact:{fontSize:24,lineHeight:30},
  title:{fontFamily:FONT,fontSize:16,lineHeight:23,color:C.ink,fontWeight:'700'},titleFeatured:{fontSize:17,lineHeight:24,letterSpacing:-.3},
  meta:{borderTopWidth:1,borderTopColor:C.line,marginTop:14,paddingTop:14,gap:9},
  preparation:{padding:14,backgroundColor:C.cream,borderRadius:14,gap:5,marginTop:16},preparationTitle:{fontFamily:FONT,fontSize:12,lineHeight:18,fontWeight:'700',color:C.ink},
  primaryAction:{minHeight:48,marginTop:16,backgroundColor:C.orange,borderRadius:14,flexDirection:'row',gap:9,justifyContent:'center',alignItems:'center',padding:12},
  primaryActionText:{fontFamily:FONT,fontSize:13,lineHeight:20,color:C.white,fontWeight:'700',flexShrink:1},
  detailAction:{flexDirection:'row',justifyContent:'flex-end',alignItems:'center',gap:5,paddingTop:14},detailActionText:{fontFamily:FONT,fontSize:12,lineHeight:18,color:C.orange,fontWeight:'600'},
  note:{flexDirection:'row',gap:10,marginTop:4,padding:16,backgroundColor:C.cream,borderRadius:16},
});
