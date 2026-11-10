import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton, Txt } from '@/components/ui';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MONTHS, WEEKDAYS_MIN, monthMatrix, toKey, todayKey, fromKey } from '@/lib/dates';

export type DayMarks = Record<string, { mood?: string; event?: boolean }>;

/** Month calendar. `marks` adds a mood dot (colour) and/or an event dot per day. */
export function Calendar({
  selected,
  onSelect,
  marks = {},
}: {
  selected: string;
  onSelect: (key: string) => void;
  marks?: DayMarks;
}) {
  const c = useTheme();
  const sel = fromKey(selected);
  const [view, setView] = useState({ y: sel.getFullYear(), m: sel.getMonth() });
  const today = todayKey();
  const days = monthMatrix(view.y, view.m);

  const shift = (n: number) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const goToday = () => {
    const d = new Date();
    setView({ y: d.getFullYear(), m: d.getMonth() });
    onSelect(today);
  };

  return (
    <View>
      <View style={styles.head}>
        <Pressable onPress={goToday} accessibilityRole="button" accessibilityLabel="Go to today">
          <Txt variant="heading">
            {MONTHS[view.m]} <Txt variant="heading" tone="muted">{view.y}</Txt>
          </Txt>
        </Pressable>
        <View style={styles.nav}>
          <IconButton icon="chevron-left" label="Previous month" onPress={() => shift(-1)} />
          <IconButton icon="chevron-right" label="Next month" onPress={() => shift(1)} />
        </View>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS_MIN.map((d, i) => (
          <View key={i} style={styles.cell}>
            <Txt variant="caption" tone="muted" style={styles.dow}>{d}</Txt>
          </View>
        ))}
        {days.map((d) => {
          const key = toKey(d);
          const out = d.getMonth() !== view.m;
          const isSel = key === selected;
          const isToday = key === today;
          const mark = marks[key];
          return (
            <View key={key} style={styles.cell}>
              <Pressable
                onPress={() => onSelect(key)}
                accessibilityRole="button"
                accessibilityLabel={key}
                aria-selected={isSel}
                style={({ pressed }) => [
                  styles.day,
                  isToday && !isSel && { borderWidth: 1.5, borderColor: c.accent },
                  isSel && { backgroundColor: c.accent },
                  pressed && !isSel && { backgroundColor: c.surface2 },
                ]}>
                <Text
                  style={[
                    styles.dayNum,
                    { color: isSel ? c.onAccent : isToday ? c.accentInk : c.text },
                    (isToday || isSel) && { fontWeight: '700' },
                    out && { opacity: 0.35 },
                  ]}>
                  {d.getDate()}
                </Text>
                {(mark?.mood || mark?.event) && (
                  <View style={styles.dots}>
                    {mark.mood && <View style={[styles.dot, { backgroundColor: mark.mood }, isSel && styles.dotRing]} />}
                    {mark.event && <View style={[styles.dot, { backgroundColor: c.event }, isSel && styles.dotRing]} />}
                  </View>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  nav: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, padding: 2, alignItems: 'center' },
  dow: { paddingBottom: 6, fontWeight: '600' },
  day: { width: '100%', maxWidth: 46, aspectRatio: 1, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontFamily: Fonts.sans, fontSize: 15 },
  dots: { position: 'absolute', bottom: 5, flexDirection: 'row', gap: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dotRing: { borderWidth: 1, borderColor: '#FFFFFF' },
});
