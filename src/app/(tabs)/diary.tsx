import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Input } from '@/components/form';
import { EntryRow, EventRow } from '@/components/rows';
import { Button, Empty, Segmented, Txt } from '@/components/ui';
import { Fonts, MaxContentWidth, WideBreakpoint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MONTHS, fromKey } from '@/lib/dates';
import { byDate, useDiary, type DiaryEntry, type EventPlan } from '@/lib/diary-store';

type Kind = 'diary' | 'event';
type Order = 'newest' | 'oldest';
type Row =
  | { type: 'header'; key: string; label: string }
  | { type: 'entry'; key: string; entry: DiaryEntry }
  | { type: 'event'; key: string; event: EventPlan };

/** Your Diary — Event | Diary toggle, sort by date, grouped by month. */
export default function YourDiary() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { entries, events } = useDiary();
  const [kind, setKind] = useState<Kind>('diary');
  const [order, setOrder] = useState<Order>('newest');
  const [query, setQuery] = useState('');

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    const items =
      kind === 'diary'
        ? entries
            .filter((e) => !q || `${e.title} ${e.body}`.toLowerCase().includes(q))
            .sort(byDate<DiaryEntry>(order))
        : events
            .filter((e) => !q || `${e.title} ${e.description}`.toLowerCase().includes(q))
            .sort(byDate<EventPlan>(order));

    const out: Row[] = [];
    let last = '';
    for (const it of items) {
      const d = fromKey(it.date);
      const group = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      if (group !== last) {
        out.push({ type: 'header', key: `h-${group}`, label: group });
        last = group;
      }
      out.push(
        kind === 'diary'
          ? { type: 'entry', key: it.id, entry: it as DiaryEntry }
          : { type: 'event', key: it.id, event: it as EventPlan },
      );
    }
    return out;
  }, [kind, order, query, entries, events]);

  const total = kind === 'diary' ? entries.length : events.length;

  const header = (
    <View>
      <Txt variant="title" style={{ marginBottom: 16 }}>Your Diary</Txt>
      <View style={styles.toolbar}>
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'event', label: 'Event' },
            { value: 'diary', label: 'Diary' },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sorted ${order} first. Tap to change.`}
          onPress={() => setOrder((o) => (o === 'newest' ? 'oldest' : 'newest'))}
          style={({ pressed }) => [
            styles.sort,
            { borderColor: c.line, backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 },
          ]}>
          <Feather name={order === 'newest' ? 'arrow-down' : 'arrow-up'} size={15} color={c.textSecondary} />
          <Text style={[styles.sortText, { color: c.textSecondary }]}>
            {order === 'newest' ? 'Newest' : 'Oldest'}
          </Text>
        </Pressable>
      </View>
      {total > 0 && (
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder={kind === 'diary' ? 'Search your entries' : 'Search your events'}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={{ marginBottom: 6 }}
        />
      )}
    </View>
  );

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.key}
      style={{ flex: 1, backgroundColor: c.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 24,
          paddingBottom: (width < WideBreakpoint ? 120 : 32) + insets.bottom,
        },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      ListHeaderComponent={header}
      ListEmptyComponent={
        total === 0 ? (
          kind === 'diary' ? (
            <Empty icon="book-open" text="Your diary is empty. Your first page is waiting.">
              <Button size="sm" variant="soft" label="Write an entry"
                onPress={() => router.push({ pathname: '/entry/[id]', params: { id: 'new' } })} />
            </Empty>
          ) : (
            <Empty icon="calendar" text="No events planned yet.">
              <Button size="sm" variant="soft" label="Make an event plan"
                onPress={() => router.push({ pathname: '/event/[id]', params: { id: 'new' } })} />
            </Empty>
          )
        ) : (
          <Empty icon="search" text={`Nothing matches “${query.trim()}”.`} />
        )
      }
      renderItem={({ item }) =>
        item.type === 'header' ? (
          <Txt variant="small" tone="muted" style={styles.group}>{item.label}</Txt>
        ) : item.type === 'entry' ? (
          <View style={styles.item}><EntryRow entry={item.entry} /></View>
        ) : (
          <View style={styles.item}><EventRow event={item.event} /></View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: 20 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 },
  sort: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1 },
  sortText: { fontFamily: Fonts.sans, fontSize: 14, fontWeight: '500' },
  group: { fontWeight: '600', marginTop: 16, marginBottom: 8, marginLeft: 4 },
  item: { marginBottom: 10 },
});
