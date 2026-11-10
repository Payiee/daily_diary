import { Feather } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = ComponentProps<typeof Feather>['name'];

/* ------------------------------------------------------------------ Text */

type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'caption' | 'eyebrow';
type TextTone = 'default' | 'secondary' | 'muted' | 'accent' | 'danger' | 'onAccent';

export function Txt({
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: TextProps & { variant?: TextVariant; tone?: TextTone }) {
  const c = useTheme();
  const color = {
    default: c.text,
    secondary: c.textSecondary,
    muted: c.muted,
    accent: c.accentInk,
    danger: c.danger,
    onAccent: c.onAccent,
  }[tone];
  return <Text {...rest} style={[textStyles[variant], { color }, style]} />;
}

const textStyles = StyleSheet.create({
  display: { fontFamily: Fonts.serif, fontSize: 30, lineHeight: 36, fontWeight: '500', letterSpacing: -0.3 },
  title: { fontFamily: Fonts.serif, fontSize: 26, lineHeight: 32, fontWeight: '500', letterSpacing: -0.2 },
  heading: { fontFamily: Fonts.serif, fontSize: 19, lineHeight: 25, fontWeight: '500' },
  body: { fontFamily: Fonts.sans, fontSize: 16, lineHeight: 23 },
  small: { fontFamily: Fonts.sans, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 16 },
  eyebrow: { fontFamily: Fonts.sans, fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
});

/* ---------------------------------------------------------------- Screen */

export function Screen({
  children,
  scroll = true,
  tabInset = false,
  wide = false,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  /** Leave room for the mobile bottom tab bar. */
  tabInset?: boolean;
  wide?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const inner = [
    styles.screenInner,
    { maxWidth: wide ? 1040 : MaxContentWidth, paddingTop: insets.top + Spacing.four },
    { paddingBottom: (tabInset ? 120 : Spacing.five) + insets.bottom },
    contentStyle,
  ];
  if (!scroll) {
    return <View style={[styles.flex, { backgroundColor: c.background }]}><View style={[inner, styles.flex]}>{children}</View></View>;
  }
  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: c.background }]}
      contentContainerStyle={inner}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag">
      {children}
    </ScrollView>
  );
}

/* ------------------------------------------------------------------ Card */

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }, style]}>
      {children}
    </View>
  );
}

/* --------------------------------------------------------------- Buttons */

export function Button({
  label,
  icon,
  variant = 'primary',
  size = 'md',
  style,
  ...rest
}: PressableProps & {
  label: string;
  icon?: IconName;
  variant?: 'primary' | 'ghost' | 'soft' | 'danger';
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  const bg = { primary: c.accent, ghost: 'transparent', soft: c.accentSoft, danger: 'transparent' }[variant];
  const fg = { primary: c.onAccent, ghost: c.textSecondary, soft: c.accentInk, danger: c.danger }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => [
        styles.btn,
        size === 'sm' && styles.btnSm,
        { backgroundColor: bg, opacity: rest.disabled ? 0.45 : pressed ? 0.8 : 1 },
        style,
      ]}>
      {icon && <Feather name={icon} size={size === 'sm' ? 15 : 17} color={fg} />}
      <Text style={[styles.btnLabel, size === 'sm' && styles.btnLabelSm, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  tone = 'secondary',
  size = 20,
  ...rest
}: PressableProps & { icon: IconName; label: string; tone?: 'secondary' | 'danger' | 'accent'; size?: number }) {
  const c = useTheme();
  const color = tone === 'danger' ? c.danger : tone === 'accent' ? c.accentInk : c.textSecondary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      {...rest}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.iconBtn,
        (pressed || hovered) && { backgroundColor: c.surface2 },
      ]}>
      <Feather name={icon} size={size} color={color} />
    </Pressable>
  );
}

/* ------------------------------------------------------------- Segmented */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.seg, { backgroundColor: c.surface2, borderColor: c.line }, style]}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            aria-selected={on}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, on && [styles.segOn, { backgroundColor: c.surface }]]}>
            <Text style={[styles.segLabel, { color: on ? c.text : c.textSecondary }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------------------------------------------------------------- Avatar */

export function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  const c = useTheme();
  const initial = (name.trim()[0] ?? '✿').toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.accentSoft,
        borderWidth: 1,
        borderColor: c.line,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontFamily: Fonts.serif, fontSize: size * 0.42, color: c.accentInk, fontWeight: '500' }}>
        {initial}
      </Text>
    </View>
  );
}

/* --------------------------------------------------------- Section, misc */

export function Section({
  title,
  action,
  children,
  style,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.sectionHead}>
        <Txt variant="heading">{title}</Txt>
        {action}
      </View>
      {children}
    </View>
  );
}

export function Empty({ icon, text, children }: { icon: IconName; text: string; children?: ReactNode }) {
  const c = useTheme();
  return (
    <View style={[styles.empty, { borderColor: c.line }]}>
      <Feather name={icon} size={22} color={c.muted} />
      <Txt variant="small" tone="muted" style={{ textAlign: 'center' }}>{text}</Txt>
      {children}
    </View>
  );
}

export function Label({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Txt variant="small" tone="secondary" style={[{ fontWeight: '600' }, style]}>{children}</Txt>;
}

export function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'event' }) {
  const c = useTheme();
  return (
    <View style={[styles.chip, { backgroundColor: tone === 'event' ? c.eventSoft : c.surface2 }]}>
      <Txt variant="caption" tone="secondary" numberOfLines={1}>{children}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenInner: { width: '100%', alignSelf: 'center', paddingHorizontal: Spacing.three + 4 },
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.lg,
    padding: Spacing.three + 4,
    boxShadow: '0 6px 20px rgba(59, 54, 49, 0.05)',
  },
  btn: {
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  btnSm: { height: 38, paddingHorizontal: 14, borderRadius: Radius.sm },
  btnLabel: { fontFamily: Fonts.sans, fontSize: 16, fontWeight: '600' },
  btnLabelSm: { fontSize: 14 },
  iconBtn: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  seg: { flexDirection: 'row', padding: 4, gap: 2, borderRadius: Radius.pill, borderWidth: 1, alignSelf: 'flex-start' },
  segItem: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: Radius.pill },
  segOn: { boxShadow: '0 1px 4px rgba(59, 54, 49, 0.10)' },
  segLabel: { fontFamily: Fonts.sans, fontSize: 14, fontWeight: '600' },
  section: { marginTop: Spacing.five - 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.three - 4 },
  empty: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four + 4,
    paddingHorizontal: Spacing.three,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
  },
  chip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill, alignSelf: 'flex-start', maxWidth: '100%' },
});
