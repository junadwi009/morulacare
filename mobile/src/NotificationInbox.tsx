import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {Button, C, Copy, Empty, FONT, Icon, Segments} from './ui';
import {dateLabel, timeLabel} from './format';
import type {NotificationItem} from './types';

/** Read markers are supplied by App and last for the current demo session. */
export function NotificationInbox({items,onRead,onSettings,onViewChange}:{onViewChange:()=>void;items:NotificationItem[];onRead:(ids:string[])=>void;onSettings:()=>void}) {
  const [filter,setFilter]=useState<'all'|'unread'>('all');
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const selected=items.find(item=>item.id===selectedId);
  const unread=items.filter(item=>!item.read);
  const visible=[...items].filter(item=>filter==='all'||!item.read).sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  if(selected)return <View style={s.detail}>
    <Pressable accessibilityRole="button" accessibilityLabel="Kembali ke pemberitahuan" onPress={()=>{setSelectedId(null);onViewChange();}} style={({pressed})=>[s.back,pressed&&s.pressed]}><View style={{transform:[{rotate:'180deg'}]}}><Icon name="arrow-right" size={18} color={C.orange}/></View><Text style={s.actionText}>Daftar pesan</Text></Pressable>
    <View style={s.detailIcon}><Icon name="bell" size={24} color={C.orange}/></View>
    <Text accessibilityRole="header" style={s.detailTitle}>{selected.title}</Text>
    <Copy small muted>{dateLabel(selected.createdAt)} · {timeLabel(selected.createdAt)}</Copy>
    <Copy>{selected.body}</Copy>
    <View style={s.settings}><Button secondary icon="bell" onPress={onSettings}>Pengaturan notifikasi</Button></View>
    <Copy small muted>Contoh pemberitahuan demo.</Copy>
  </View>;
  return <View>
    <Segments items={[{key:'all',label:'Semua'},{key:'unread',label:'Belum dibaca'}]} value={filter} onChange={setFilter}/>
    <View style={s.summary}><Copy small muted>{unread.length?`${unread.length} belum dibaca`:'Semua sudah dibaca'}</Copy>{unread.length?<Pressable accessibilityRole="button" accessibilityLabel="Tandai semua dibaca" onPress={()=>onRead(unread.map(item=>item.id))} style={({pressed})=>[s.mark,pressed&&s.pressed]}><Text style={s.actionText}>Tandai dibaca</Text></Pressable>:null}</View>
    {visible.length?<View style={s.list}>{visible.map((item,index)=><Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Buka pemberitahuan ${item.title}`} accessibilityHint={item.read?'Sudah dibaca':'Belum dibaca'} onPress={()=>{setSelectedId(item.id);onRead([item.id]);onViewChange();}} style={({pressed})=>[s.item,index>0&&s.separator,pressed&&s.pressed]}>
      <View style={[s.icon,item.read&&s.readIcon]}><Icon name="bell" size={18} color={item.read?C.muted:C.orange}/></View>
      <View style={s.itemCopy}><Text style={[s.title,!item.read&&s.unreadTitle]}>{item.title}</Text><Copy small muted>{dateLabel(item.createdAt)} · {timeLabel(item.createdAt)}</Copy></View>
      {!item.read?<View accessible accessibilityLabel="Belum dibaca" style={s.dot}/>:<Icon name="chevron-right" size={15} color={C.muted}/>}
    </Pressable>)}</View>:<View style={{gap:12}}><Empty icon="bell" title={filter==='unread'?'Tidak ada pesan baru':'Belum ada pemberitahuan'} body={filter==='unread'?'Semua pemberitahuan sudah dibaca.':'Pembaruan Anda akan muncul di sini.'}/>{filter==='unread'?<Button secondary onPress={()=>setFilter('all')}>Lihat semua pemberitahuan</Button>:null}</View>}
    <View style={s.footer}><Pressable accessibilityRole="button" accessibilityLabel="Pengaturan notifikasi" onPress={onSettings} style={({pressed})=>[s.settingsRow,pressed&&s.pressed]}><Icon name="bell" size={17} color={C.orange}/><Text style={[s.actionText,{flex:1}]}>Pengaturan notifikasi</Text><Icon name="chevron-right" size={16} color={C.orange}/></Pressable><Copy small muted>Contoh pemberitahuan demo.</Copy></View>
  </View>;
}
const s=StyleSheet.create({
  summary:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:12},mark:{minHeight:44,justifyContent:'center',paddingHorizontal:4},actionText:{fontFamily:FONT,fontSize:13,lineHeight:20,color:C.orange,fontWeight:'600'},
  list:{borderWidth:1,borderColor:C.line,borderRadius:20,backgroundColor:C.white,paddingHorizontal:14},item:{flexDirection:'row',alignItems:'flex-start',gap:11,minHeight:88,paddingVertical:18},separator:{borderTopWidth:1,borderTopColor:C.line},icon:{width:36,height:36,borderRadius:12,backgroundColor:C.orangeSoft,alignItems:'center',justifyContent:'center'},readIcon:{backgroundColor:C.cream},itemCopy:{flex:1,minWidth:0,gap:7},title:{fontFamily:FONT,fontSize:14,lineHeight:21,color:C.ink,fontWeight:'500'},unreadTitle:{fontWeight:'700'},dot:{width:7,height:7,borderRadius:4,backgroundColor:C.orange,marginTop:8},pressed:{opacity:.7},
  footer:{gap:12,marginTop:18},settingsRow:{minHeight:48,flexDirection:'row',alignItems:'center',gap:10},detail:{gap:15},back:{minHeight:44,flexDirection:'row',alignItems:'center',gap:8,alignSelf:'flex-start'},detailIcon:{width:48,height:48,borderRadius:16,backgroundColor:C.orangeSoft,alignItems:'center',justifyContent:'center'},detailTitle:{fontFamily:FONT,fontSize:21,lineHeight:29,fontWeight:'700',color:C.ink},settings:{marginTop:10},
});
