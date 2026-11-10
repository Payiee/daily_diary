import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip, Txt } from '@/components/ui';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MONTHS_SHORT, formatMedium, formatTime, fromKey, relativeDay } from '@/lib/dates';
import { entryMood, useDiary, type DiaryEntry, type EventPlan } from '@/lib/diary-store';

export function EntryRow({ entry }: { entry: DiaryEntry }) {
  const c = useTheme();
  const { customMoods } = useDiary();
  const mood = entryMood(entry, customMoods);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.row,
        { backgroundColor: c.surface, borderColor: hovered ? c.accent : c.line },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.badge, { backgroundColor: mood ? `${mood.color}40` : c.surface2 }]}>
        {mood ? <Text style={styles.face}>{mood.face}</Text> : <Feather name="feather" size={18} color={c.muted} />}
      </View>
      <View style={styles.body}>
        <Txt numberOfLines={1} style={styles.title}>{entry.title.trim() || 'Untitled'}</Txt>
        <Txt variant="caption" tone="muted">
          {formatMedium(entry.date)}{mood ? ` · ${mood.label}` : ''}
        </Txt>
        {!!entry.body.trim() && (
          <Txt variant="small" tone="secondary" numberOfLines={2} style={styles.snippet}>
            {entry.body.trim()}
          </Txt>
        )}
      </View>
    </Pressable>
  );
}

export function EventRow({ event, relative = false }: { event: EventPlan; relative?: boolean }) {
  const c = useTheme();
  const d = fromKey(event.date);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/event/[id]', params: { id: event.id } })}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        styles.row,
        { backgroundColor: c.surface, borderColor: hovered ? c.event : c.line },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.badge, { backgroundColor: c.eventSoft }]}>
        <Text style={[styles.badgeDay, { color: c.text }]}>{d.getDate()}</Text>
        <Text style={[styles.badgeMon, { color: c.textSecondary }]}>{MONTHS_SHORT[d.getMonth()]}</Text>
      </View>
      <View style={styles.body}>
        <Txt numberOfLines={1} style={styles.title}>{event.title.trim() || 'Untitled event'}</Txt>
        <View style={styles.meta}>
          <Txt variant="caption" tone="muted">
            {relative ? relativeDay(event.date) : formatMedium(event.date)} · {formatTime(event.time)}
          </Txt>
          {event.reminders.length > 0 && (
            <Chip tone="event">
              <Feather name="bell" size={10} /> {event.reminders[0].text}
              {event.reminders.length > 1 ? `  +${event.reminders.length - 1}` : ''}
            </Chip>
          )}
        </View>
        {!!event.description.trim() && (
          <Txt variant="small" tone="secondary" numberOfLines={1} style={styles.snippet}>
            {event.description.trim()}
          </Txt>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
  badge: { width: 44, height: 44, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  face: { fontSize: 22 },
  badgeDay: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 19, fontWeight: '500' },
  badgeMon: { fontFamily: Fonts.sans, fontSize: 10, lineHeight: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  body: { flex: 1, minWidth: 0, gap: 1 },
  title: { fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  snippet: { fontFamily: Fonts.serif, marginTop: 4 },
});
