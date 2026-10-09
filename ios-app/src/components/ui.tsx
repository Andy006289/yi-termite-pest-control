/* ui.tsx — shared building blocks. Each one is the native version of a component
   from the Assessment 2 style sheet (.btn, .card, .choice, .pill, .badge, .notice,
   .field, .timeline …), using the same tokens from theme.ts.
   Every tappable element is at least 44 pt high and has an accessibility role/label. */

import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import {
  ActivityIndicator, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle,
} from 'react-native';

import { colors, fonts, radius, shadow, space, TAP, toneColors } from '@/lib/theme';
import { Icon, type IconName } from './Icon';

export const tapFeedback = (kind: 'light' | 'select' | 'success' | 'warn' = 'light') => {
  if (Platform.OS === 'web') return;
  if (kind === 'select') Haptics.selectionAsync();
  else if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else if (kind === 'warn') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/* ---------------- layout ---------------- */

export function Screen({ children, onRefresh, refreshing = false, contentStyle }: {
  children: ReactNode; onRefresh?: () => void; refreshing?: boolean; contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[{ padding: space[4], paddingBottom: space[7], gap: space[4] }, contentStyle]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.green700} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export const Row = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space[3] }, style]}>{children}</View>
);

export const Divider = () => <View style={{ height: 1, backgroundColor: colors.line, marginVertical: space[3] }} />;

/* ---------------- text ---------------- */

type TP = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };
export const H1 = ({ children, style }: TP) => <Text accessibilityRole="header" style={[s.h1, style]}>{children}</Text>;
export const H2 = ({ children, style }: TP) => <Text accessibilityRole="header" style={[s.h2, style]}>{children}</Text>;
export const H3 = ({ children, style, numberOfLines }: TP) => <Text accessibilityRole="header" numberOfLines={numberOfLines} style={[s.h3, style]}>{children}</Text>;
export const Body = ({ children, style, numberOfLines }: TP) => <Text numberOfLines={numberOfLines} style={[s.body, style]}>{children}</Text>;
export const Small = ({ children, style, numberOfLines }: TP) => <Text numberOfLines={numberOfLines} style={[s.small, style]}>{children}</Text>;
export const Muted = ({ children, style, numberOfLines }: TP) => <Text numberOfLines={numberOfLines} style={[s.small, { color: colors.ink2 }, style]}>{children}</Text>;
export const Eyebrow = ({ children, style }: TP) => <Text style={[s.eyebrow, style]}>{children}</Text>;
export const B = ({ children }: { children: ReactNode }) => <Text style={{ fontFamily: fonts.bodySemi }}>{children}</Text>;

/* ---------------- buttons ---------------- */

type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'danger';
export function Button({ label, onPress, variant = 'primary', icon, iconRight, small, disabled, block = true, accessibilityHint, style }: {
  label: string; onPress: () => void; variant?: Variant; icon?: IconName; iconRight?: IconName; small?: boolean;
  disabled?: boolean; block?: boolean; accessibilityHint?: string; style?: StyleProp<ViewStyle>;
}) {
  const v = VARIANTS[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => { tapFeedback(); onPress(); }}
      style={({ pressed }) => [
        s.btn, { backgroundColor: v.bg, borderColor: v.border, minHeight: small ? TAP : 50, alignSelf: block ? 'stretch' : 'flex-start' },
        variant === 'primary' || variant === 'accent' ? shadow.sm : null,
        (pressed || disabled) && { opacity: disabled ? 0.5 : 0.85, transform: [{ scale: pressed ? 0.98 : 1 }] }, style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={v.fg} /> : null}
      <Text style={[s.btnText, { color: v.fg, fontSize: small ? 14 : 15.5 }]}>{label}</Text>
      {iconRight ? <Icon name={iconRight} size={18} color={v.fg} /> : null}
    </Pressable>
  );
}
const VARIANTS: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.green700, fg: '#fff', border: colors.green700 },
  accent: { bg: colors.amber500, fg: colors.green900, border: colors.amber500 },
  outline: { bg: colors.surface, fg: colors.green700, border: colors.green700 },
  ghost: { bg: 'transparent', fg: colors.green700, border: 'transparent' },
  danger: { bg: colors.surface, fg: colors.danger, border: colors.danger },
};

/* ---------------- selectable items ---------------- */

/** Option tile with an icon (the web .choice). */
export function Choice({ label, hint, icon, selected, onPress, disabled }: {
  label: string; hint?: string; icon?: IconName; selected: boolean; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !!disabled }}
      accessibilityLabel={hint ? `${label}, ${hint}` : label}
      disabled={disabled}
      onPress={() => { tapFeedback('select'); onPress(); }}
      style={({ pressed }) => [s.choice, selected && s.choiceOn, pressed && { opacity: 0.85 }]}
    >
      {icon ? (
        <View style={[s.choiceIcon, selected && { backgroundColor: colors.green700 }]}>
          <Icon name={icon} size={icon.startsWith('p-') ? 28 : 22} color={selected ? '#fff' : colors.green700} />
        </View>
      ) : null}
      <Text style={[s.choiceLabel, selected && { color: colors.green900 }]} numberOfLines={2}>{label}</Text>
      {hint ? <Text style={s.choiceHint} numberOfLines={1}>{hint}</Text> : null}
      {selected ? <View style={s.choiceTick}><Icon name="i-check" size={12} color="#fff" /></View> : null}
    </Pressable>
  );
}

/** Wraps Choice tiles in a 2- or 3-column grid. */
export function ChoiceGrid({ children, columns = 2 }: { children: ReactNode[]; columns?: 2 | 3 }) {
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space[3] }}>
      {children.map((c, i) => (
        <View key={i} style={{ width: columns === 3 ? '31%' : '47.5%', flexGrow: 1 }}>{c}</View>
      ))}
    </View>
  );
}

export function Pill({ label, selected, onPress, disabled }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !!disabled }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => { tapFeedback('select'); onPress(); }}
      style={[s.pill, selected && s.pillOn]}
    >
      <Text style={[s.pillText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Checkbox({ checked, onChange, label, error }: { checked: boolean; onChange: (v: boolean) => void; label: string; error?: string }) {
  return (
    <View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={label}
        onPress={() => { tapFeedback('select'); onChange(!checked); }}
        style={{ flexDirection: 'row', gap: space[3], alignItems: 'flex-start', minHeight: TAP, paddingVertical: space[2] }}
      >
        <View style={[s.box, checked && { backgroundColor: colors.green700, borderColor: colors.green700 }, !!error && !checked && { borderColor: colors.danger }]}>
          {checked ? <Icon name="i-check" size={14} color="#fff" /> : null}
        </View>
        <Text style={[s.small, { flex: 1 }]}>{label}</Text>
      </Pressable>
      {error ? <FieldError message={error} /> : null}
    </View>
  );
}

/* ---------------- status ---------------- */

type BadgeTone = 'green' | 'amber' | 'grey' | 'red' | 'info';
export function Badge({ label, tone = 'green', dot }: { label: string; tone?: BadgeTone; dot?: boolean }) {
  const c = {
    green: [colors.green100, colors.green900], amber: [colors.amber100, colors.amber700], grey: ['#ECEFED', colors.ink2],
    red: [colors.danger100, colors.danger], info: [colors.info100, colors.info],
  }[tone];
  return (
    <View style={[s.badge, { backgroundColor: c[0] }]}>
      {dot ? <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: c[1] }} /> : null}
      <Text style={[s.badgeText, { color: c[1] }]}>{label}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, BadgeTone]> = {
    requested: ['Request received', 'green'], confirmed: ['Technician confirmed', 'info'], completed: ['Report ready', 'green'], cancelled: ['Cancelled', 'grey'],
  };
  const [label, tone] = map[status] ?? [status, 'grey'];
  return <Badge label={label} tone={tone} dot />;
}

export function Notice({ tone = 'amber', icon = 'i-info', children }: { tone?: keyof typeof toneColors; icon?: IconName; children: ReactNode }) {
  const t = toneColors[tone];
  return (
    <View accessibilityRole={tone === 'red' ? 'alert' : undefined} style={[s.notice, { backgroundColor: t.bg }]}>
      <Icon name={icon} size={18} color={t.icon} />
      <Text style={[s.small, { color: t.fg, flex: 1 }]}>{children}</Text>
    </View>
  );
}

/** Big pest glyph on a soft green tile (the web .pest-visual). */
export function PestVisual({ id, size = 64, tone = 'green' }: { id: string; size?: number; tone?: 'green' | 'amber' | 'red' }) {
  const t = toneColors[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size > 60 ? radius.lg : radius.md, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={`p-${id}`} size={size * 0.62} color={t.icon} strokeWidth={3} />
    </View>
  );
}

/** Label/value pairs (the web .kv and <dl>). */
export function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <View style={{ gap: space[2] }}>
      {items.map(([k, v]) => (
        <View key={k} style={{ flexDirection: 'row', gap: space[3] }}>
          <Text style={[s.small, { color: colors.ink3, width: 96 }]}>{k}</Text>
          <Text style={[s.small, { flex: 1, fontFamily: fonts.bodyMedium, color: colors.ink }]}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

export function Timeline({ steps }: { steps: { title: string; sub?: string; state: 'done' | 'now' | 'todo' }[] }) {
  return (
    <View>
      {steps.map((st, i) => (
        <View key={st.title} style={{ flexDirection: 'row', gap: space[3] }}>
          <View style={{ alignItems: 'center' }}>
            <View style={[s.tdot, st.state === 'done' && { backgroundColor: colors.green700, borderColor: colors.green700 }, st.state === 'now' && { borderColor: colors.amber500, borderWidth: 3 }]}>
              {st.state === 'done' ? <Icon name="i-check" size={12} color="#fff" /> : null}
            </View>
            {i < steps.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 14, backgroundColor: colors.line }} /> : null}
          </View>
          <View style={{ paddingBottom: space[3], flex: 1 }}>
            <Text style={[s.small, { fontFamily: fonts.bodySemi }]}>{st.title}</Text>
            {st.sub ? <Muted>{st.sub}</Muted> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

export function IconBubble({ name, tone = 'green', size = 40 }: { name: IconName; tone?: keyof typeof toneColors; size?: number }) {
  const t = toneColors[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 3.3, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={name} size={size * 0.5} color={t.icon} />
    </View>
  );
}

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: ReactNode }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: space[6], gap: space[3] }}>
      <IconBubble name={icon} size={52} />
      <H3 style={{ textAlign: 'center', marginBottom: 0 }}>{title}</H3>
      {text ? <Muted style={{ textAlign: 'center' }}>{text}</Muted> : null}
      {action}
    </Card>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space[6], gap: space[3], backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.green700} size="large" />
      <Muted>{label}</Muted>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: space[5], gap: space[4], backgroundColor: colors.bg }}>
      <Notice tone="red" icon="i-warn">Sorry, the app could not load its data over HTTPS and there is no offline copy yet. Check your connection and try again.</Notice>
      <Muted>{message}</Muted>
      <Button label="Try again" icon="i-refresh" onPress={onRetry} />
    </View>
  );
}

/* ---------------- form fields ---------------- */

export function FieldError({ message }: { message: string }) {
  return (
    <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', marginTop: 6 }}>
      <View style={{ marginTop: 3 }}><Icon name="i-warn" size={14} color={colors.danger} /></View>
      <Text style={[s.small, { color: colors.danger, flex: 1 }]}>{message}</Text>
    </View>
  );
}

export function Field({ label, error, hint, optional, style, ...input }: TextInputProps & { label: string; error?: string; hint?: string; optional?: boolean }) {
  return (
    <View style={style as StyleProp<ViewStyle>}>
      <Text style={s.label}>{label}{optional ? <Text style={{ color: colors.ink3, fontFamily: fonts.body }}>  optional</Text> : null}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.ink3}
        style={[s.input, !!error && { borderColor: colors.danger, backgroundColor: '#FFF8F8' }, input.multiline && { minHeight: 88, textAlignVertical: 'top', paddingTop: 12 }]}
        {...input}
      />
      {error ? <FieldError message={error} /> : hint ? <Muted style={{ marginTop: 6 }}>{hint}</Muted> : null}
    </View>
  );
}

/* ---------------- styles ---------------- */

export const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space[4], gap: space[3], ...shadow.sm },
  h1: { fontFamily: fonts.headBold, fontSize: 30, lineHeight: 36, color: colors.green900, letterSpacing: -0.3 },
  h2: { fontFamily: fonts.head, fontSize: 22, lineHeight: 28, color: colors.green900 },
  h3: { fontFamily: fonts.head, fontSize: 17, lineHeight: 22, color: colors.green900 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.ink },
  small: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.ink },
  eyebrow: { fontFamily: fonts.head, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.green500 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.pill, borderWidth: 1.5, paddingHorizontal: 22 },
  btnText: { fontFamily: fonts.head },
  choice: { minHeight: 104, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, padding: space[3], alignItems: 'center', justifyContent: 'center', gap: 6 },
  choiceOn: { borderColor: colors.green700, backgroundColor: colors.green50 },
  choiceIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.green50, alignItems: 'center', justifyContent: 'center' },
  choiceLabel: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, textAlign: 'center' },
  choiceHint: { fontFamily: fonts.body, fontSize: 12, color: colors.ink3, textAlign: 'center' },
  choiceTick: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.green700, alignItems: 'center', justifyContent: 'center' },
  pill: { minHeight: TAP, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.green700, borderColor: colors.green700 },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: fonts.bodySemi, fontSize: 12 },
  notice: { flexDirection: 'row', gap: space[3], alignItems: 'flex-start', borderRadius: radius.md, padding: space[3] },
  tdot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.ink3, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.ink, marginBottom: 6 },
  input: { minHeight: 48, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 16, color: colors.ink },
});
