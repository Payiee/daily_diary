import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AiReflection } from '@/components/ai-reflection';
import { Card, IconButton, Screen, Section, Segmented, Txt } from '@/components/ui';
import { Fonts, Moods, Radius, WideBreakpoint, moodOf } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  MONTHS,
  MONTHS_SHORT,
  WEEKDAYS_MIN,
  WEEKDAYS_SHORT,
  addDays,
  daysInMonth,
  fromKey,
  startOfWeek,
  toKey,
  todayKey,
} from '@/lib/dates';
import { useDiary, type DiaryEntry } from '@/lib/diary-store';

type Range = 'week' | 'month' | 'year';

/** History — "Mood for the week", sortable weekly / monthly / yearly. */
export default function History() {
  const { entries } = useDiary();
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<Range>('week');
  const [anchor, setAnchor] = useState(() => new Date());

  // Average mood per day (several entries in one day are averaged)
  const dayMood = useMemo(() => {
    const acc: Record<string, { sum: number; n: number }> = {};
    for (const e of entries) {
      if (!e.mood) continue;
      (acc[e.date] ??= { sum: 0, n: 0 }).sum += e.mood;
      acc[e.date].n += 1;
    }
    const out: Record<string, number> = {};
    for (const k in acc) out[k] = acc[k].sum / acc[k].n;
    return out;
  }, [entries]);

  const { from, to, label } = periodOf(range, anchor);
  const inRange = entries.filter((e) => e.date >= from && e.date <= to);

  const shift = (n: number) => {
    const d = new Date(anchor);
    if (range === 'week') d.setDate(d.getDate() + 7 * n);
    if (range === 'month') d.setMonth(d.getMonth() + n, 1);
    if (range === 'year') d.setFullYear(d.getFullYear() + n, 0, 1);
    setAnchor(d);
  };
  const isCurrent = todayKey() >= from && todayKey() <= to;

  return (
    <Screen tabInset={width < WideBreakpoint}>
      <Txt variant="title" style={{ marginBottom: 16 }}>History</Txt>

      <Segmented
        value={range}
        onChange={(r) => {
          setRange(r);
          setAnchor(new Date());
        }}
        options={[
          { value: 'week', label: 'Weekly' },
          { value: 'month', label: 'Monthly' },
          { value: 'year', label: 'Yearly' },
        ]}
      />

      <Section title={`Mood for the ${range}`}>
        <Card>
          <View style={styles.period}>
            <IconButton icon="chevron-left" label="Previous period" onPress={() => shift(-1)} />
            <Txt variant="heading" style={{ textAlign: 'center' }}>{label}</Txt>
            <IconButton icon="chevron-right" label="Next period" onPress={() => shift(1)} disabled={isCurrent} />
          </View>

          {range === 'week' && <WeekChart start={fromKey(from)} dayMood={dayMood} />}
          {range === 'month' && <MonthHeat anchor={anchor} dayMood={dayMood} />}
          {range === 'year' && <YearChart year={anchor.getFullYear()} entries={entries} />}

          <View style={styles.legend}>
            {Moods.map((m) => (
              <View key={m.value} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: m.color }]} />
                <Txt variant="caption" tone="muted">{m.label}</Txt>
              </View>
            ))}
          </View>
        </Card>

        <Stats entries={inRange} />
      </Section>

      <View style={{ marginTop: 28 }}>
        <AiReflection
          from={from}
          to={to}
          label={range === 'week' ? `Week of ${label}` : label}
          noun={range}
        />
      </View>

      <Section title="How you felt">
        <Distribution entries={inRange} />
      </Section>
    </Screen>
  );
}

function periodOf(range: Range, anchor: Date) {
  if (range === 'week') {
    const s = startOfWeek(anchor);
    const e = addDays(s, 6);
    const sameMonth = s.getMonth() === e.getMonth();
    return {
      from: toKey(s),
      to: toKey(e),
      label: `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()} – ${sameMonth ? '' : MONTHS_SHORT[e.getMonth()] + ' '}${e.getDate()}`,
    };
  }
  if (range === 'month') {
    const y = anchor.getFullYear(), m = anchor.getMonth();
    return { from: toKey(new Date(y, m, 1)), to: toKey(new Date(y, m, daysInMonth(y, m))), label: `${MONTHS[m]} ${y}` };
  }
  const y = anchor.getFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31`, label: String(y) };
}

/* ----------------------------------------------------------------- Week */

function WeekChart({ start, dayMood }: { start: Date; dayMood: Record<string, number> }) {
  const c = useTheme();
  const today = todayKey();
  return (
    <View style={styles.bars}>
      {Array.from({ length: 7 }, (_, i) => {
        const d = addDays(start, i);
        const key = toKey(d);
        const v = dayMood[key];
        const mood = moodOf(v);
        return (
          <View key={key} style={styles.barCol} accessibilityLabel={`${WEEKDAYS_SHORT[d.getDay()]}: ${mood?.label ?? 'no entry'}`}>
            <Text style={styles.barFace}>{mood?.face ?? ''}</Text>
            <View style={[styles.track, { backgroundColor: c.surface2 }]}>
              {v != null && <View style={[styles.fill, { height: `${(v / 5) * 100}%`, backgroundColor: mood!.color }]} />}
            </View>
            <Txt variant="caption" tone={key === today ? 'accent' : 'muted'} style={key === today && { fontWeight: '700' }}>
              {WEEKDAYS_SHORT[d.getDay()]}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

/* ---------------------------------------------------------------- Month */

function MonthHeat({ anchor, dayMood }: { anchor: Date; dayMood: Record<string, number> }) {
  const c = useTheme();
  const y = anchor.getFullYear(), m = anchor.getMonth();
  const lead = new Date(y, m, 1).getDay();
  const n = daysInMonth(y, m);
  const today = todayKey();
  return (
    <View style={styles.heat}>
      {WEEKDAYS_MIN.map((d, i) => (
        <View key={`h${i}`} style={styles.heatCell}>
          <Txt variant="caption" tone="muted" style={{ fontWeight: '600' }}>{d}</Txt>
        </View>
      ))}
      {Array.from({ length: lead }, (_, i) => <View key={`b${i}`} style={styles.heatCell} />)}
      {Array.from({ length: n }, (_, i) => {
        const key = toKey(new Date(y, m, i + 1));
        const mood = moodOf(dayMood[key]);
        return (
          <View key={key} style={styles.heatCell}>
            <View
              style={[
                styles.heatBox,
                { backgroundColor: mood ? mood.color : c.surface2 },
                key === today && { borderWidth: 1.5, borderColor: c.accentInk },
              ]}>
              <Text style={[styles.heatNum, { color: mood ? '#2F2B27' : c.muted }]}>{i + 1}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/* ----------------------------------------------------------------- Year */

function YearChart({ year, entries }: { year: number; entries: DiaryEntry[] }) {
  const c = useTheme();
  const months = Array.from({ length: 12 }, () => ({ sum: 0, n: 0 }));
  for (const e of entries) {
    const d = fromKey(e.date);
    if (d.getFullYear() !== year || !e.mood) continue;
    months[d.getMonth()].sum += e.mood;
    months[d.getMonth()].n += 1;
  }
  return (
    <View style={styles.bars}>
      {months.map((mo, i) => {
        const avg = mo.n ? mo.sum / mo.n : null;
        const mood = moodOf(avg);
        return (
          <View key={i} style={styles.barCol} accessibilityLabel={`${MONTHS[i]}: ${mood?.label ?? 'no entries'}`}>
            <View style={[styles.track, styles.trackThin, { backgroundColor: c.surface2 }]}>
              {avg != null && <View style={[styles.fill, { height: `${(avg / 5) * 100}%`, backgroundColor: mood!.color }]} />}
            </View>
            <Txt variant="caption" tone="muted" style={{ fontSize: 10 }}>{MONTHS_SHORT[i][0]}</Txt>
          </View>
        );
      })}
    </View>
  );
}

/* ---------------------------------------------------------- Stats, dist */

function Stats({ entries }: { entries: DiaryEntry[] }) {
  const c = useTheme();
  const rated = entries.filter((e) => e.mood);
  const avg = rated.length ? rated.reduce((s, e) => s + (e.mood ?? 0), 0) / rated.length : null;
  const words = entries.reduce((s, e) => s + (e.body.trim() ? e.body.trim().split(/\s+/).length : 0), 0);
  const items = [
    { k: 'Entries', v: String(entries.length) },
    { k: 'Average mood', v: moodOf(avg) ? `${moodOf(avg)!.face} ${moodOf(avg)!.label}` : '—' },
    { k: 'Words written', v: words.toLocaleString() },
  ];
  return (
    <View style={styles.stats}>
      {items.map((s) => (
        <View key={s.k} style={[styles.stat, { backgroundColor: c.surface, borderColor: c.line }]}>
          <Text style={[styles.statV, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit>{s.v}</Text>
          <Txt variant="caption" tone="muted">{s.k}</Txt>
        </View>
      ))}
    </View>
  );
}

function Distribution({ entries }: { entries: DiaryEntry[] }) {
  const c = useTheme();
  const counts = Moods.map((m) => entries.filter((e) => e.mood === m.value).length);
  const max = Math.max(1, ...counts);
  return (
    <Card style={{ gap: 12 }}>
      {[...Moods].reverse().map((m) => {
        const n = counts[m.value - 1];
        return (
          <View key={m.value} style={styles.distRow}>
            <Txt variant="small" style={styles.distLabel}>{m.face}  {m.label}</Txt>
            <View style={[styles.distTrack, { backgroundColor: c.surface2 }]}>
              <View style={[styles.distFill, { width: `${(n / max) * 100}%`, backgroundColor: m.color }]} />
            </View>
            <Txt variant="small" tone="muted" style={styles.distN}>{n}</Txt>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  period: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  bars: { flexDirection: 'row', height: 200, gap: 6, alignItems: 'stretch' },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barFace: { fontSize: 17, height: 22, lineHeight: 22 },
  track: { flex: 1, width: '100%', maxWidth: 36, borderRadius: Radius.sm, overflow: 'hidden', justifyContent: 'flex-end' },
  trackThin: { maxWidth: 24, borderRadius: 8 },
  fill: { width: '100%', borderRadius: Radius.sm },
  heat: { flexDirection: 'row', flexWrap: 'wrap' },
  heatCell: { width: `${100 / 7}%`, padding: 3, alignItems: 'center' },
  heatBox: { width: '100%', maxWidth: 44, aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  heatNum: { fontFamily: Fonts.sans, fontSize: 12, fontWeight: '500' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stat: { flex: 1, borderWidth: 1, borderRadius: Radius.md, padding: 14, gap: 2 },
  statV: { fontFamily: Fonts.serif, fontSize: 19, fontWeight: '500' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  distLabel: { width: 84 },
  distTrack: { flex: 1, height: 10, borderRadius: 99, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 99 },
  distN: { width: 24, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
