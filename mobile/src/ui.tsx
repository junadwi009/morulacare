import React, { type ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { flaticonPaths, type FlaticonName } from './flaticon-paths';

export const C = { ink: '#32253C', muted: '#6D6875', orange: '#BC4416', orangeSoft: '#FFF0E5', cream: '#FAF8F6', white: '#FFFFFF', line: '#EAE5E1', green: '#267A63', greenSoft: '#E8F6F0', purple: '#775D83', rose: '#F2EDF7', red: '#A9393E', disabled: '#D0CED3' };
export const FONT = Platform.OS === 'web' ? 'Arial' : Platform.OS === 'ios' ? 'System' : 'sans-serif';
export type IconName = FlaticonName;
export function Icon({ name, size = 20, color = C.ink }: { name: IconName; size?: number; color?: string }) { return <Svg width={size} height={size} viewBox="-1 -1 302 302" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden><G transform="translate(0 300) scale(1 -1)"><Path d={flaticonPaths[name]} fill={color}/></G></Svg>; }
export function Label({ children, color = C.muted }: { children: ReactNode; color?: string }) { return <Text style={[s.label, { color }]}>{children}</Text>; }
export function Heading({ children, large = false }: { children: ReactNode; large?: boolean }) { return <Text accessibilityRole="header" style={large ? s.h1 : s.h2}>{children}</Text>; }
export function Copy({ children, muted = false, small = false, style }: { children: ReactNode; muted?: boolean; small?: boolean; style?: object }) { return <Text style={[s.body, muted && { color: C.muted }, small && s.small, style]}>{children}</Text>; }
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { return <View style={[s.card, style]}>{children}</View>; }
export function Pill({ children, tone = 'neutral', icon }: { children: ReactNode; tone?: 'neutral' | 'green' | 'orange'; icon?: IconName }) {
  const tint = tone === 'green' ? C.green : tone === 'orange' ? C.orange : C.muted;
  return <View style={[s.pill, { backgroundColor: tone === 'green' ? C.greenSoft : tone === 'orange' ? C.orangeSoft : C.cream }]}>{icon ? <Icon name={icon} size={12} color={tint} /> : null}<Text style={[s.pillText, { color: tint }]}>{children}</Text></View>;
}
export function Button({ children, onPress, secondary = false, compact = false, icon, loading = false, disabled = false, label }: { children: ReactNode; onPress: () => void; secondary?: boolean; compact?: boolean; icon?: IconName; loading?: boolean; disabled?: boolean; label?: string }) {
  return <Pressable onPress={onPress} disabled={disabled || loading} accessibilityRole="button" accessibilityLabel={label || (typeof children === 'string' ? children : undefined)} accessibilityState={{ disabled: disabled || loading }} aria-disabled={disabled || loading} style={({ pressed }) => [s.button, secondary && s.secondaryButton, compact && s.compactButton, (disabled || loading) && { opacity: 0.6 }, pressed && { opacity: 0.8 }]}>{loading ? <ActivityIndicator size="small" color={secondary ? C.orange : C.white} /> : icon ? <Icon name={icon} size={17} color={secondary ? C.orange : C.white} /> : null}<Text style={[s.buttonText, secondary && { color: C.orange }]}>{children}</Text></Pressable>;
}
export function IconButton({ name, onPress, label, badge = false }: { name: IconName; onPress: () => void; label: string; badge?: boolean }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [s.iconButton, pressed && { backgroundColor: C.orangeSoft }]}><Icon name={name} size={22} />{badge ? <View style={s.badge} /> : null}</Pressable>;
}
export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={s.sectionTitle}><View style={{flex:1,minWidth:0}}><Heading>{title}</Heading></View>{action && onPress ? <Pressable onPress={onPress} accessibilityRole="button" style={({pressed})=>[s.textAction,pressed&&{opacity:.65}]}><Text style={s.link}>{action}</Text><Icon name="arrow-up-right" size={15} color={C.orange} /></Pressable> : null}</View>;
}
export function Empty({ icon = 'inbox', title, body }: { icon?: IconName; title: string; body: string }) { return <Card style={s.empty}><Icon name={icon} color={C.muted} size={28} /><Heading>{title}</Heading><Copy muted>{body}</Copy></Card>; }
export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { return <View style={[s.row, style]}>{children}</View>; }
export function Divider() { return <View style={s.divider} />; }
export function ScreenIntro({ title, body }: { eyebrow: string; title: string; body: string }) { return <View style={s.intro}><Heading large>{title}</Heading><Copy muted>{body}</Copy></View>; }
export function Segments<T extends string>({ items, value, onChange }: { items: { key: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  return <View style={s.segments} accessibilityRole="tablist">{items.map(item => <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: value === item.key }} aria-selected={value === item.key} onPress={() => onChange(item.key)} style={[s.segment, item.key === value && s.segmentActive]}><Text style={[s.segmentText, item.key === value && s.segmentTextActive]}>{item.label}</Text></Pressable>)}</View>;
}
export function EmbryoArt({ small = false }: { small?: boolean }) { return <View accessible accessibilityLabel="Ilustrasi embrio, bukan gambar klinis" style={[s.embryoArt, small && { width: 46, height: 46 }]}>{[0,1,2,3,4,5].map((item) => <View key={item} style={[s.cell, small && { width: 11, height: 11 }, { transform: [{ rotate: `${item * 60}deg` }, { translateY: small ? -9 : -16 }] }]} />)}<View style={[s.cellCore, small && { width: 13, height: 13 }]} /></View>; }

export const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontFamily:FONT,fontSize: 10, fontWeight: '600', letterSpacing: .8, textTransform: 'uppercase', lineHeight: 17 },
  h1: { fontFamily:FONT,fontSize: 27, lineHeight: 35, fontWeight: '700', color: C.ink, letterSpacing: -.65 },
  h2: { fontFamily:FONT,fontSize: 17, lineHeight: 24, fontWeight: '700', color: C.ink, letterSpacing: -.3 },
  body: { fontFamily:FONT,fontSize: 15, lineHeight: 23, color: C.ink },
  small: { fontFamily:FONT,fontSize: 13, lineHeight: 20 },
  card: { backgroundColor: C.white, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.line },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 50 },
  pillText: { fontFamily:FONT,fontSize: 11, lineHeight: 16, fontWeight: '600' },
  button: { backgroundColor: C.orange, borderRadius: 15, paddingHorizontal: 18, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryButton: { backgroundColor: C.orangeSoft, borderWidth: 1, borderColor: '#F7DDCC' },
  compactButton: { minHeight: 48, paddingHorizontal: 13 },
  buttonText: { color: C.white, fontFamily:FONT,fontSize: 14, lineHeight: 21, fontWeight: '700',flexShrink:1,textAlign:'center',paddingVertical:12 },
  iconButton: { height: 48, width: 48, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  badge: { height: 7, width: 7, borderRadius: 4, position: 'absolute', right: 10, top: 9, backgroundColor: C.orange, borderWidth: 1, borderColor: C.white },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28, marginBottom: 14, gap: 12 },
  textAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 44, minHeight: 44 },
  link: { color: C.orange, fontFamily:FONT,fontSize: 13, lineHeight: 20, fontWeight: '600',flexShrink:1 },
  empty: { gap: 12, paddingVertical: 30 },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 16 },
  intro: { marginTop: 8, marginBottom: 20, gap: 7 },
  segments: { flexDirection: 'row', padding: 4, gap: 4, backgroundColor: '#EEF0F3', borderRadius: 15, marginBottom: 20 },
  segment: { flex: 1, paddingVertical: 12, paddingHorizontal: 5, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  segmentActive: { backgroundColor: C.orange },
  segmentText: { color: C.muted, fontFamily:FONT,fontSize: 12, lineHeight: 16, fontWeight: '500' },
  segmentTextActive: { color: C.white, fontWeight: '700' },
  embryoArt: { width: 80, height: 80, borderRadius: 44, backgroundColor: '#FAEBE2', borderWidth: 1.4, borderColor: '#DBAF96', alignItems: 'center', justifyContent: 'center' },
  cell: { position: 'absolute', height: 23, width: 23, borderRadius: 20, backgroundColor: '#DCA989', borderWidth: 1, borderColor: '#C58F72', opacity: 0.8 },
  cellCore: { height: 24, width: 24, borderRadius: 16, backgroundColor: '#EAC3A6', borderWidth: 1, borderColor: '#C88F70' },
});
