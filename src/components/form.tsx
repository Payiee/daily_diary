import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Txt } from '@/components/ui';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/* ------------------------------------------------------------------ Input */

export function Input({ style, multiline, ...rest }: TextInputProps) {
  const c = useTheme();
  return (
    <TextInput
      placeholderTextColor={c.muted}
      selectionColor={c.accent}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
      {...rest}
      style={[
        styles.input,
        multiline && styles.multiline,
        { backgroundColor: c.surface, borderColor: c.line, color: c.text },
        style,
      ]}
    />
  );
}

/* ------------------------------------------------------------- Pill group */

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = useTheme();
  return (
    <View style={styles.pills} accessibilityRole="radiogroup">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            aria-checked={on}
            onPress={() => onChange(o.value)}
            style={[
              styles.pill,
              { backgroundColor: on ? c.eventSoft : c.surface, borderColor: on ? c.event : c.line },
            ]}>
            <Text style={[styles.pillLabel, { color: on ? c.text : c.textSecondary }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------------------------------------- TimePicker */

const pad = (n: number) => String(n).padStart(2, '0');

/** Cross-platform time stepper. Value is "HH:MM" (24h). */
export function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const c = useTheme();
  const [h, m] = value.split(':').map(Number);
  const pm = h >= 12;
  const h12 = ((h + 11) % 12) + 1;

  const set = (hh: number, mm: number) => onChange(`${pad((hh + 24) % 24)}:${pad((mm + 60) % 60)}`);

  return (
    <View style={styles.time}>
      <Stepper
        label="Hour"
        display={String(h12)}
        onDown={() => set(h - 1, m)}
        onUp={() => set(h + 1, m)}
      />
      <Txt variant="title" tone="muted">:</Txt>
      <Stepper
        label="Minute"
        display={pad(m)}
        // Snap to 5-minute steps; `set` wraps 60 → 0 and -5 → 55.
        onDown={() => set(h, m % 5 ? m - (m % 5) : m - 5)}
        onUp={() => set(h, m - (m % 5) + 5)}
      />
      <View style={[styles.ampm, { backgroundColor: c.surface2, borderColor: c.line }]}>
        {(['AM', 'PM'] as const).map((p) => {
          const on = (p === 'PM') === pm;
          return (
            <Pressable
              key={p}
              accessibilityRole="radio"
              aria-checked={on}
              onPress={() => !on && set(pm ? h - 12 : h + 12, m)}
              style={[styles.ampmItem, on && { backgroundColor: c.surface }]}>
              <Text style={[styles.pillLabel, { color: on ? c.text : c.muted, fontWeight: '600' }]}>{p}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Stepper({ label, display, onUp, onDown }: { label: string; display: string; onUp: () => void; onDown: () => void }) {
  const c = useTheme();
  return (
    <View style={[styles.stepper, { backgroundColor: c.surface, borderColor: c.line }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label} up`} onPress={onUp} style={styles.stepBtn} hitSlop={4}>
        <Feather name="chevron-up" size={18} color={c.textSecondary} />
      </Pressable>
      <Text style={[styles.stepVal, { color: c.text }]} accessibilityLabel={`${label} ${display}`}>{display}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label} down`} onPress={onDown} style={styles.stepBtn} hitSlop={4}>
        <Feather name="chevron-down" size={18} color={c.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multiline: { minHeight: 110, lineHeight: 23 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: Radius.pill, borderWidth: 1 },
  pillLabel: { fontFamily: Fonts.sans, fontSize: 14 },
  time: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepper: { alignItems: 'center', borderWidth: 1, borderRadius: Radius.sm, width: 64 },
  stepBtn: { paddingVertical: 4, width: '100%', alignItems: 'center' },
  stepVal: { fontFamily: Fonts.serif, fontSize: 24, fontWeight: '500', fontVariant: ['tabular-nums'] },
  ampm: { marginLeft: 6, borderWidth: 1, borderRadius: Radius.sm, padding: 3, gap: 3 },
  ampmItem: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9, alignItems: 'center' },
});
