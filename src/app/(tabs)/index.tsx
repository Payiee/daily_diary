import { Link, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Calendar, type DayMarks } from '@/components/calendar';
import { Companion } from '@/components/companion';
import { EntryRow, EventRow } from '@/components/rows';
import { Avatar, Button, Card, Empty, Section, Screen, Txt } from '@/components/ui';
import { WideBreakpoint, moodOf } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatLong, greeting, relativeDay, todayKey } from '@/lib/dates';
import { byDate, useDiary } from '@/lib/diary-store';

export default function Home() {
  const c = useTheme();
  const { entries, events, profile } = useDiary();
  const { width } = useWindowDimensions();
  const wide = width >= WideBreakpoint;
  const today = todayKey();
  const [selected, setSelected] = useState(today);

  const marks = useMemo(() => {
    const m: DayMarks = {};
    // oldest-first, so the most recent entry of a day decides its dot colour
    for (const e of [...entries].sort(byDate('oldest'))) {
      const mood = moodOf(e.mood);
      m[e.date] = { ...m[e.date], mood: mood?.color ?? c.muted };
    }
    for (const ev of events) m[ev.date] = { ...m[ev.date], event: true };
    return m;
  }, [entries, events, c.muted]);

  const dayEntries = entries.filter((e) => e.date === selected).sort(byDate('newest'));
  const dayEvents = events.filter((e) => e.date === selected).sort(byDate('oldest'));
  const todayEntry = entries.find((e) => e.date === today);

  const name = profile.name.trim();

  const upcoming = events.filter((e) => e.date >= today).sort(byDate('oldest')).slice(0, 5);

  const forYou = (
    <>
      <Section title="For you">
        <Companion />
      </Section>
      <Section title="Reminders">
        {upcoming.length === 0 ? (
          <Empty icon="bell" text="No upcoming events. Plan something to look forward to.">
            <Button
              size="sm"
              variant="soft"
              label="Make an event plan"
              onPress={() => router.push({ pathname: '/event/[id]', params: { id: 'new' } })}
            />
          </Empty>
        ) : (
          <View style={styles.list}>
            {upcoming.map((e) => (
              <EventRow key={e.id} event={e} relative />
            ))}
          </View>
        )}
      </Section>
    </>
  );

  const calendarBlock = (
    <Card>
      <Calendar selected={selected} onSelect={setSelected} marks={marks} />
      <View style={[styles.dayPanel, { borderTopColor: c.line }]}>
        <View style={styles.dayHead}>
          <Txt variant="small" tone="secondary" style={{ fontWeight: '600' }}>
            {selected === today ? 'Today' : relativeDay(selected)} · {formatLong(selected).split(', ')[1]}
          </Txt>
        </View>
        {dayEntries.length + dayEvents.length === 0 ? (
          <Txt variant="small" tone="muted">Nothing here yet.</Txt>
        ) : (
          <View style={styles.list}>
            {dayEvents.map((e) => <EventRow key={e.id} event={e} />)}
            {dayEntries.map((e) => <EntryRow key={e.id} entry={e} />)}
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <Screen tabInset={!wide} wide>
      {/* Header */}
      <View style={styles.header}>
        <Txt variant="eyebrow" tone="muted">{formatLong(today)}</Txt>
        <Link href="/profile" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Your profile">
            <Avatar name={name} />
          </Pressable>
        </Link>
      </View>

      <Txt variant="display">
        {greeting()}
        {name ? `, ${name}` : ''}.
      </Txt>
      <Txt tone="secondary" style={{ marginTop: 4 }}>
        {todayEntry ? 'You already wrote today. Lovely.' : 'How are you feeling today?'}
      </Txt>


      {wide ? (
        <View style={styles.columns}>
          <View style={styles.col}>
            <Section title="Calendar">{calendarBlock}</Section>
          </View>
          <View style={styles.col}>{forYou}</View>
        </View>
      ) : (
        <>
          <Section title="Calendar">{calendarBlock}</Section>
          {forYou}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  columns: { flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
  col: { flex: 1, minWidth: 0 },
  dayPanel: { borderTopWidth: 1, marginTop: 14, paddingTop: 14, gap: 12 },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  list: { gap: 10 },
});
