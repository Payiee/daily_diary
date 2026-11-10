import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { Calendar } from '@/components/calendar';
import { useToast } from '@/components/toast';
import { Input, TimePicker } from '@/components/form';
import { ReminderEditor } from '@/components/reminders';
import { Button, Card, IconButton, Label, Screen, Segmented, Txt } from '@/components/ui';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { MONTHS_SHORT, formatLong, formatTime, fromKey, relativeDay, todayKey } from '@/lib/dates';
import { confirm, goBack } from '@/lib/confirm';
import { useDiary, type EventPlan, type EventReminder } from '@/lib/diary-store';

/**
 * An event plan. Existing events open as a read-only card with Edit / Delete;
 * `id = "new"` opens the editor (Title, Date, Time, Description, Reminders) straight away.
 */
export default function EventScreen() {
  const { id, date: dateParam } = useLocalSearchParams<{ id: string; date?: string }>();
  const { events, saveEvent, deleteEvent } = useDiary();
  const toast = useToast();
  const existing = id !== 'new' ? events.find((e) => e.id === id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState(existing?.date ?? dateParam ?? todayKey());
  const [allDay, setAllDay] = useState(existing ? existing.time === null : false);
  const [time, setTime] = useState(existing?.time ?? '09:00');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [reminders, setReminders] = useState<EventReminder[]>(existing?.reminders ?? []);
  const [editing, setEditing] = useState(id === 'new');

  const canSave = title.trim().length > 0;

  const save = () => {
    saveEvent({
      id: existing?.id,
      title: title.trim(),
      date,
      time: allDay ? null : time,
      description,
      reminders,
    });
    toast({
      tone: 'event',
      icon: 'calendar',
      title: existing ? 'Event updated' : 'Event planned',
      message: `${title.trim()} · ${formatLong(date)}`,
      duration: 3500,
    });
    if (existing) setEditing(false); // back to the read-only card
    else goBack();
  };

  const cancel = () => {
    if (!existing) return goBack();
    setTitle(existing.title);
    setDate(existing.date);
    setAllDay(existing.time === null);
    setTime(existing.time ?? '09:00');
    setDescription(existing.description);
    setReminders(existing.reminders);
    setEditing(false);
  };

  const remove = async () => {
    if (!existing) return;
    if (await confirm('Delete this event?', 'This can’t be undone.')) {
      deleteEvent(existing.id);
      toast({ title: 'Event deleted', icon: 'trash-2' });
      goBack();
    }
  };

  if (id !== 'new' && !existing) {
    return (
      <Screen>
        <Txt variant="title">Event not found</Txt>
        <Button label="Back" variant="soft" style={{ marginTop: 16, alignSelf: 'flex-start' }} onPress={goBack} />
      </Screen>
    );
  }

  if (existing && !editing) {
    return <EventCard event={existing} onEdit={() => setEditing(true)} onDelete={remove} />;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={styles.top}>
          <IconButton icon="x" label={existing ? 'Cancel editing' : 'Close'} onPress={cancel} />
          <Txt variant="heading">{existing ? 'Edit event' : 'Event plan'}</Txt>
          <Button size="sm" label="Save" disabled={!canSave} onPress={save} />
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Label>Title of the event</Label>
            <Input value={title} onChangeText={setTitle} placeholder="e.g. Coffee with Ana" maxLength={120} />
          </View>

          <View style={styles.field}>
            <Label>Date</Label>
            <Card style={styles.calCard}>
              <Calendar selected={date} onSelect={setDate} />
            </Card>
            <Txt variant="small" tone="muted">{formatLong(date)}</Txt>
          </View>

          <View style={styles.field}>
            <View style={styles.timeHead}>
              <Label>Time</Label>
              <Segmented
                value={allDay ? 'all' : 'time'}
                onChange={(v) => setAllDay(v === 'all')}
                options={[
                  { value: 'time', label: 'Set time' },
                  { value: 'all', label: 'All day' },
                ]}
              />
            </View>
            {!allDay && <TimePicker value={time} onChange={setTime} />}
          </View>

          <View style={styles.field}>
            <Label>Description</Label>
            <Input
              value={description}
              onChangeText={setDescription}
              placeholder="Where, who, what to bring…"
              multiline
            />
          </View>

          <View style={styles.field}>
            <Label>Reminders</Label>
            <ReminderEditor value={reminders} onChange={setReminders} />
          </View>

          <Button label={existing ? 'Save changes' : 'Save event'} disabled={!canSave} onPress={save} />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** Read-only card showing the whole event, with Edit and Delete. */
function EventCard({ event, onEdit, onDelete }: { event: EventPlan; onEdit: () => void; onDelete: () => void }) {
  const c = useTheme();
  const d = fromKey(event.date);
  const rel = relativeDay(event.date);

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton icon="arrow-left" label="Back" onPress={goBack} />
        <Txt variant="heading">Your event</Txt>
        <View style={{ width: 40 }} />
      </View>

      <Card style={styles.viewCard}>
        <View style={styles.viewHead}>
          <View style={[styles.dateBadge, { backgroundColor: c.eventSoft }]}>
            <Txt style={styles.badgeDay}>{d.getDate()}</Txt>
            <Txt variant="caption" tone="secondary" style={styles.badgeMon}>{MONTHS_SHORT[d.getMonth()]}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="title" selectable>{event.title.trim() || 'Untitled event'}</Txt>
          </View>
        </View>

        <View style={styles.metaList}>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={15} color={c.muted} />
            <Txt variant="small" tone="secondary">
              {formatLong(event.date)}, {d.getFullYear()}
              {rel === 'Today' || rel === 'Tomorrow' || rel === 'Yesterday' ? `  ·  ${rel}` : ''}
            </Txt>
          </View>
          <View style={styles.metaRow}>
            <Feather name="clock" size={15} color={c.muted} />
            <Txt variant="small" tone="secondary">{formatTime(event.time)}</Txt>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: c.line }]} />

        <Label>Description</Label>
        {event.description.trim() ? (
          <Txt style={styles.viewDesc} selectable>{event.description}</Txt>
        ) : (
          <Txt tone="muted" style={styles.viewDesc}>No description.</Txt>
        )}

        <Label style={{ marginTop: 18 }}>Reminders</Label>
        {event.reminders.length ? (
          <View style={{ gap: 8, marginTop: 8 }}>
            {event.reminders.map((r) => (
              <View key={r.id} style={[styles.reminder, { backgroundColor: c.eventSoft }]}>
                <Feather name="bell" size={15} color={c.event} />
                <Txt variant="small" style={{ flex: 1 }} selectable>{r.text}</Txt>
              </View>
            ))}
          </View>
        ) : (
          <Txt tone="muted" style={styles.viewDesc}>No reminders.</Txt>
        )}
      </Card>

      <View style={styles.viewActions}>
        <Button label="Edit" icon="edit-3" onPress={onEdit} style={{ flex: 1 }} />
        <Button
          label="Delete"
          icon="trash-2"
          variant="danger"
          onPress={onDelete}
          style={{ flex: 1, borderWidth: 1, borderColor: c.line }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  viewCard: { paddingTop: 18 },
  viewHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dateBadge: { width: 56, height: 56, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  badgeDay: { fontFamily: Fonts.serif, fontSize: 22, lineHeight: 24, fontWeight: '500' },
  badgeMon: { textTransform: 'uppercase', letterSpacing: 0.6 },
  metaList: { gap: 8, marginTop: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  divider: { height: 1, marginVertical: 16 },
  viewDesc: { fontFamily: Fonts.serif, fontSize: 16.5, lineHeight: 26, marginTop: 6 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: Radius.sm },
  viewActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  form: { gap: 22 },
  field: { gap: 8 },
  calCard: { padding: 12 },
  timeHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
