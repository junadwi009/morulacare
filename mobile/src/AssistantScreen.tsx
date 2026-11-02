import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { makeId, sendChat } from './api';
import { Button, C, FONT, Copy, Icon, Pill, Row } from './ui';
import type { ChatMessage, Overview } from './types';

const suggestions = [
  {title:'Jadwal berikutnya',label:'Jadwal saya berikutnya',icon:'calendar' as const},
  {title:'Laporan embrio',label:'Status embrio saya',icon:'layers' as const},
  {title:'Riwayat perawatan',label:'Perawatan terakhir',icon:'file-text' as const},
];
export function AssistantScreen({data,onHelp,reducedMotion=true,keyboardOffset=0}:{data:Overview;onHelp:()=>void;reducedMotion?:boolean;keyboardOffset?:number}) {
  const [messages,setMessages]=useState<ChatMessage[]>([{id:'welcome',role:'assistant',text:'Informasi apa yang Anda perlukan?',intent:'WELCOME',sourceLabel:'Asisten demo berbasis aturan',requiresStaff:false,createdAt:data.sync.lastSyncedAt}]);
  const [input,setInput]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [failed,setFailed]=useState<{id:string;text:string}|null>(null);
  const [aboutOpen,setAboutOpen]=useState(false);
  const [openSources,setOpenSources]=useState<string[]>([]);
  const sending=useRef(false);
  const followLatest=useRef(false);
  const scroll=useRef<React.ElementRef<typeof ScrollView>>(null);
  const replyIds=messages.filter(message=>message.role==='assistant'&&message.id!=='welcome').map(message=>message.id);
  const send=async(rawText:string,preserveDraft=false)=>{
    const text=rawText.trim();
    if(sending.current||!text)return;
    const retainedDraft=preserveDraft&&input.trim().length>0&&input.trim()!==text?input:null;
    sending.current=true;followLatest.current=true;
    const retry=failed?.text===text?failed:null;
    const user:ChatMessage={id:retry?.id??makeId(),role:'user',text,intent:'USER',sourceLabel:'',requiresStaff:false,createdAt:new Date().toISOString()};
    // An edited failed draft replaces its unsent bubble; retry reuses the same one.
    setMessages(previous=>retry?previous:[...previous.filter(message=>message.id!==failed?.id),user]);
    setBusy(true);setError('');setFailed(null);setInput(retainedDraft??'');
    try {
      const reply=await sendChat(user.text,data);
      followLatest.current=true;
      setMessages(previous=>[...previous,{...reply,role:'assistant'}]);
    } catch {
      followLatest.current=true;
      setFailed({id:user.id,text:user.text});setError('Pesan belum dapat diproses.');setInput(retainedDraft??text);
    } finally {sending.current=false;setBusy(false);}
  };
  const toggleSource=(id:string)=>setOpenSources(previous=>previous.includes(id)?previous.filter(item=>item!==id):[...previous,id]);
  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS==='ios'?'padding':Platform.OS==='android'?'height':undefined} keyboardVerticalOffset={Platform.OS==='android'?keyboardOffset:0}>
    <ScrollView ref={scroll} style={styles.scroll} contentContainerStyle={styles.messages} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" onContentSizeChange={()=>{if(followLatest.current){followLatest.current=false;scroll.current?.scrollToEnd({animated:!reducedMotion});}}}>
      <View style={styles.titleRow}><View style={{flex:1,gap:4}}><Text accessibilityRole="header" style={styles.title}>Asisten Morula</Text><Copy small muted>Jadwal, laporan & riwayat</Copy></View><Pill>Demo</Pill></View>
      <View>
        <Pressable accessibilityRole="button" accessibilityLabel="Tentang asisten" accessibilityState={{expanded:aboutOpen}} aria-expanded={aboutOpen} onPress={()=>setAboutOpen(value=>!value)} style={({pressed})=>[styles.aboutAction,pressed&&styles.pressed]}><Icon name="info" size={17} color={C.muted}/><Text style={styles.aboutLabel}>Tentang asisten</Text><View style={aboutOpen?styles.chevronOpen:undefined}><Icon name="chevron-right" size={16} color={C.muted}/></View></Pressable>
        {aboutOpen?<View style={styles.boundary}><Copy small muted>Asisten demo berbasis aturan, bukan petugas atau AI medis. Pertanyaan klinis dibahas bersama tim perawatan.</Copy></View>:null}
      </View>
      {messages.map(message=>{
        const sourceOpen=openSources.includes(message.id);
        return <View key={message.id} style={[styles.messageWrap,message.role==='user'&&styles.userWrap]}>
          <View style={[styles.bubble,message.role==='user'&&styles.userBubble]}>
            <Copy style={message.role==='user'?{color:C.white}:undefined}>{message.text}</Copy>
            {message.role==='assistant'&&message.id!=='welcome'&&message.sourceLabel?<>
              <Pressable accessibilityRole="button" accessibilityLabel={`Sumber jawaban ${replyIds.indexOf(message.id)+1}`} accessibilityState={{expanded:sourceOpen}} aria-expanded={sourceOpen} onPress={()=>toggleSource(message.id)} style={({pressed})=>[styles.sourceAction,pressed&&styles.pressed]}><Icon name="file-text" size={14} color={C.muted}/><Text style={styles.sourceLabel}>Sumber jawaban</Text><View style={sourceOpen?styles.chevronOpen:undefined}><Icon name="chevron-right" size={14} color={C.muted}/></View></Pressable>
              {sourceOpen?<Copy small muted style={styles.sourceText}>{message.sourceLabel}</Copy>:null}
            </>:null}
          </View>
          {failed?.id===message.id?<Text style={styles.failedLabel}>Belum terkirim</Text>:null}
          {message.requiresStaff?<Button compact secondary icon="user" onPress={onHelp}>Bantuan tim klinik</Button>:null}
        </View>;
      })}
      {messages.length===1?<View style={styles.suggestions}>{suggestions.map(suggestion=><Pressable accessibilityRole="button" accessibilityLabel={suggestion.label} accessibilityState={{disabled:busy}} aria-disabled={busy} disabled={busy} key={suggestion.label} onPress={()=>void send(suggestion.label)} style={({pressed})=>[styles.suggestion,pressed&&styles.pressed]}><View style={styles.suggestionIcon}><Icon name={suggestion.icon} size={19} color={C.orange}/></View><Text style={styles.suggestionText}>{suggestion.title}</Text><Icon name="chevron-right" size={16} color={C.muted}/></Pressable>)}</View>:null}
      {busy?<View accessibilityLiveRegion="polite"><Row style={{paddingTop:4}}><ActivityIndicator size="small" color={C.orange}/><Copy small muted style={{flex:1}}>Mencari informasi dalam data demo…</Copy></Row></View>:null}
      {error?<View accessibilityRole="alert" style={styles.error}><Row style={{alignItems:'flex-start',gap:8}}><Icon name="alert-circle" color={C.red} size={17}/><Copy small style={{color:C.red,flex:1}}>{error}</Copy></Row><Button secondary compact icon="refresh-cw" label="Coba lagi pesan" onPress={()=>{if(failed)void send(failed.text,true);}}>Coba lagi</Button></View>:null}
    </ScrollView>
    <View style={styles.composerWrap}><Row style={styles.composer}><TextInput value={input} onChangeText={setInput} placeholder="Tulis pertanyaan…" placeholderTextColor={C.muted} accessibilityLabel="Pesan untuk asisten" maxLength={2000} multiline style={styles.input} editable={!busy}/><Pressable onPress={()=>void send(input)} disabled={busy||!input.trim()} accessibilityRole="button" accessibilityLabel="Kirim pesan" accessibilityState={{disabled:busy||!input.trim()}} aria-disabled={busy||!input.trim()} style={({pressed})=>[styles.send,(busy||!input.trim())&&styles.disabled,pressed&&styles.pressed]}><Icon name="arrow-up" color={C.white} size={20}/></Pressable></Row><Text style={styles.composerNote}>Darurat: hubungi IGD, jangan menunggu asisten.</Text></View>
  </KeyboardAvoidingView>;
}
const styles=StyleSheet.create({
  root:{flex:1,minHeight:0},scroll:{flex:1,minHeight:0},messages:{paddingHorizontal:20,paddingTop:20,paddingBottom:24,gap:16},
  titleRow:{flexDirection:'row',alignItems:'center',gap:12},title:{fontFamily:FONT,fontSize:23,lineHeight:30,fontWeight:'700',color:C.ink,letterSpacing:-.5},
  aboutAction:{minHeight:48,flexDirection:'row',alignItems:'center',gap:8},aboutLabel:{flex:1,fontFamily:FONT,fontSize:12,lineHeight:19,fontWeight:'600',color:C.muted},boundary:{padding:14,borderRadius:15,backgroundColor:C.white,borderWidth:1,borderColor:C.line},chevronOpen:{transform:[{rotate:'90deg'}]},
  messageWrap:{alignSelf:'flex-start',maxWidth:'95%',gap:8},userWrap:{alignSelf:'flex-end',maxWidth:'90%'},bubble:{backgroundColor:C.white,borderRadius:20,borderTopLeftRadius:6,padding:16,borderWidth:1,borderColor:C.line},userBubble:{backgroundColor:C.orange,borderColor:C.orange,borderTopLeftRadius:20,borderBottomRightRadius:6},
  sourceAction:{minHeight:44,flexDirection:'row',alignItems:'center',gap:6,borderTopWidth:1,borderTopColor:C.line,marginTop:12,paddingTop:6},sourceLabel:{flex:1,fontFamily:FONT,fontSize:11,lineHeight:18,color:C.muted,fontWeight:'600'},sourceText:{paddingTop:3},failedLabel:{fontFamily:FONT,fontSize:11,lineHeight:18,color:C.red,alignSelf:'flex-end'},
  suggestions:{gap:10},suggestion:{minHeight:58,borderWidth:1,borderColor:C.line,borderRadius:16,flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:14,paddingVertical:10,backgroundColor:C.white},suggestionIcon:{width:34,height:34,borderRadius:11,backgroundColor:C.orangeSoft,alignItems:'center',justifyContent:'center'},suggestionText:{flex:1,fontFamily:FONT,fontSize:14,lineHeight:21,fontWeight:'600',color:C.ink},
  error:{gap:10,padding:14,backgroundColor:C.white,borderWidth:1,borderColor:C.line,borderRadius:16},
  composerWrap:{flexShrink:0,paddingHorizontal:20,paddingTop:12,paddingBottom:10,borderTopWidth:1,borderTopColor:C.line,backgroundColor:C.white},composer:{borderWidth:1,borderColor:C.line,backgroundColor:C.cream,borderRadius:18,paddingLeft:12,paddingRight:7,paddingVertical:7,gap:8,alignItems:'flex-end'},input:{flex:1,fontFamily:FONT,fontSize:14,lineHeight:21,color:C.ink,minHeight:38,maxHeight:120,paddingTop:8,paddingHorizontal:3},send:{width:48,height:48,borderRadius:14,backgroundColor:C.orange,alignItems:'center',justifyContent:'center'},composerNote:{fontFamily:FONT,fontSize:10,lineHeight:16,color:C.muted,textAlign:'center',marginTop:8},pressed:{opacity:.75},disabled:{opacity:.45},
});
