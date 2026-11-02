import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { C, FONT, Card, Copy, Heading, Icon, Pill, Row, SectionTitle } from './ui';
import type { Overview, Preferences } from './types';

export function ProfileScreen({data,onPreferences,busy,onRefresh,onHelp,feedback=''}:{data:Overview;onPreferences:(value:Preferences)=>void;busy:boolean;onRefresh:()=>void;onHelp:()=>void;feedback?:string}) {
  const [previewOpen,setPreviewOpen]=useState(false);
  const [partnerOpen,setPartnerOpen]=useState(false);
  return <>
    <View style={styles.intro}><Text accessibilityRole="header" style={styles.pageTitle}>Profil</Text></View>
    <Card style={styles.identity}>
      <Row style={{alignItems:'flex-start'}}>
        <View style={styles.avatar}><Text style={styles.initial}>{data.patient.displayName.charAt(0)}</Text></View>
        <View style={styles.identityText}><Heading>{data.patient.displayName}</Heading><Copy small muted>{data.patient.recordNumber}</Copy><Pill tone="orange">Akun demo</Pill></View>
      </Row>
      <View style={styles.clinic}><Icon name="map-pin" size={17} color={C.orange}/><Copy small muted style={{flex:1}}>{data.patient.branchName}</Copy></View>
    </Card>

    <SectionTitle title="Pemberitahuan & privasi"/>
    <Card style={styles.group}>
      <View style={styles.setting}>
        <View style={styles.settingIcon}><Icon name="bell" size={19} color={C.orange}/></View>
        <View style={styles.rowCopy}><Text style={styles.rowTitle}>Informasi layanan</Text><Copy small muted>Pengingat janji & perawatan</Copy></View>
        <Switch style={styles.toggle} accessibilityLabel="Informasi layanan" value={data.preferences.serviceNotifications} disabled={busy} onValueChange={value=>onPreferences({...data.preferences,serviceNotifications:value})} trackColor={{false:C.disabled,true:C.greenSoft}} thumbColor={data.preferences.serviceNotifications?C.green:C.white}/>
      </View>
      <View style={styles.separator}/>
      <View style={styles.setting}>
        <View style={[styles.settingIcon,styles.privateIcon]}><Icon name="shield" size={19} color={C.purple}/></View>
        <View style={styles.rowCopy}><Text style={styles.rowTitle}>Notifikasi privat</Text><Copy small muted>Detail tersembunyi di layar terkunci</Copy></View>
        <Switch style={styles.toggle} accessibilityLabel="Notifikasi privat" value={data.preferences.discreetNotifications} disabled={busy} onValueChange={value=>onPreferences({...data.preferences,discreetNotifications:value})} trackColor={{false:C.disabled,true:C.greenSoft}} thumbColor={data.preferences.discreetNotifications?C.green:C.white}/>
      </View>
      <View style={styles.separator}/>
      <Pressable accessibilityRole="button" accessibilityLabel="Pratinjau pemberitahuan" accessibilityState={{expanded:previewOpen}} aria-expanded={previewOpen} onPress={()=>setPreviewOpen(value=>!value)} style={({pressed})=>[styles.disclosure,pressed&&styles.pressed]}>
        <Text style={styles.disclosureText}>Pratinjau pemberitahuan</Text><View style={previewOpen?styles.chevronOpen:undefined}><Icon name="chevron-right" size={16} color={C.muted}/></View>
      </Pressable>
      {previewOpen?<View style={styles.preview}><Text style={styles.previewTitle}>Morula Care</Text><Copy small>{!data.preferences.serviceNotifications?'Informasi layanan dinonaktifkan dalam preferensi demo.':data.preferences.discreetNotifications?'Ada pembaruan untuk Anda. Buka aplikasi untuk melihatnya.':'Contoh demo: laporan perawatan Anda tersedia.'}</Copy><Copy small muted>Pratinjau demo; belum mengirim notifikasi.</Copy></View>:null}
    </Card>
    {busy||feedback?<View style={styles.feedback} accessibilityLiveRegion="polite">{busy?<ActivityIndicator size="small" color={C.orange}/>:<Icon name="info" size={15} color={C.muted}/>}<Copy small muted style={{flex:1}}>{busy?'Menyimpan pilihan…':feedback}</Copy></View>:null}

    <View style={styles.partnerGroup}>
      <Card style={styles.group}>
        <Pressable accessibilityRole="button" accessibilityLabel="Akses pasangan" accessibilityState={{expanded:partnerOpen}} aria-expanded={partnerOpen} onPress={()=>setPartnerOpen(value=>!value)} style={({pressed})=>[styles.setting,pressed&&styles.pressed]}>
          <View style={[styles.settingIcon,styles.privateIcon]}><Icon name="lock" size={19} color={C.purple}/></View>
          <View style={styles.rowCopy}><Text style={styles.rowTitle}>Akses pasangan</Text><Copy small muted>Belum tersedia</Copy></View>
          <View style={partnerOpen?styles.chevronOpen:undefined}><Icon name="chevron-right" size={17} color={C.muted}/></View>
        </Pressable>
        {partnerOpen?<View style={styles.partnerDetail}><Text style={styles.rowTitle}>Privat secara default</Text><Copy small muted>Akses pasangan belum tersedia. Informasi Anda belum dibagikan.</Copy></View>:null}
      </Card>
    </View>

    <SectionTitle title="Bantuan & aplikasi"/>
    <Card style={styles.group}>
      <Pressable accessibilityRole="button" accessibilityLabel="Muat ulang data" onPress={onRefresh} style={({pressed})=>[styles.action,pressed&&styles.pressed]}><View style={styles.settingIcon}><Icon name="refresh-cw" size={19} color={C.orange}/></View><Text style={[styles.rowTitle,{flex:1}]}>Muat ulang data</Text><Icon name="chevron-right" size={17} color={C.muted}/></Pressable>
      <View style={styles.separator}/>
      <Pressable accessibilityRole="button" accessibilityLabel="Tentang konsep & bantuan" onPress={onHelp} style={({pressed})=>[styles.action,pressed&&styles.pressed]}><View style={[styles.settingIcon,styles.privateIcon]}><Icon name="help-circle" size={19} color={C.purple}/></View><Text style={[styles.rowTitle,{flex:1}]}>Tentang & bantuan</Text><Icon name="chevron-right" size={17} color={C.muted}/></Pressable>
    </Card>
    <View style={styles.footer}><Copy small muted>Morula Care · 0.1.0</Copy><Copy small muted>Gunakan data fiktif saat mencoba.</Copy></View>
  </>;
}
const styles=StyleSheet.create({
  intro:{marginTop:2,marginBottom:20},pageTitle:{fontFamily:FONT,fontSize:23,lineHeight:30,fontWeight:'700',letterSpacing:-.5,color:C.ink},identity:{padding:18,gap:16},identityText:{flex:1,minWidth:0,gap:5},avatar:{height:58,width:58,borderRadius:20,backgroundColor:C.orangeSoft,alignItems:'center',justifyContent:'center'},initial:{fontFamily:FONT,fontSize:25,lineHeight:32,color:C.orange,fontWeight:'700'},clinic:{flexDirection:'row',alignItems:'flex-start',gap:9,borderTopWidth:1,borderTopColor:C.line,paddingTop:14},
  group:{paddingVertical:0,paddingHorizontal:16},setting:{flexDirection:'row',gap:11,alignItems:'center',minHeight:78,paddingVertical:15},settingIcon:{height:36,width:36,borderRadius:12,backgroundColor:C.orangeSoft,alignItems:'center',justifyContent:'center'},privateIcon:{backgroundColor:C.rose},rowCopy:{flex:1,minWidth:0,gap:3},rowTitle:{fontFamily:FONT,fontSize:14,lineHeight:21,fontWeight:'600',color:C.ink},toggle:{minHeight:48,minWidth:48},separator:{height:1,backgroundColor:C.line,marginLeft:47},
  disclosure:{flexDirection:'row',alignItems:'center',gap:12,minHeight:54,paddingVertical:14,paddingLeft:47},disclosureText:{flex:1,fontFamily:FONT,fontSize:12,lineHeight:19,color:C.muted,fontWeight:'600'},chevronOpen:{transform:[{rotate:'90deg'}]},preview:{gap:8,padding:14,backgroundColor:C.rose,borderRadius:14,marginBottom:16},previewTitle:{fontFamily:FONT,fontSize:13,lineHeight:20,fontWeight:'700',color:C.ink},
  feedback:{flexDirection:'row',alignItems:'center',gap:8,paddingTop:12,paddingHorizontal:3},partnerGroup:{marginTop:16},partnerDetail:{gap:7,borderTopWidth:1,borderTopColor:C.line,paddingVertical:16},action:{flexDirection:'row',alignItems:'center',gap:11,minHeight:68,paddingVertical:14},footer:{gap:4,alignItems:'center',paddingTop:24,paddingBottom:4},pressed:{opacity:.7},
});
