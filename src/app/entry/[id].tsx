import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Calendar } from '@/components/calendar';
import { useToast } from '@/components/toast';
import { MoodPicker } from '@/components/mood';
import { Button, Card, IconButton, Label, Screen, Txt } from '@/components/ui';
import { Fonts, type MoodValue } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatLong, todayKey } from '@/lib/dates';
import { confirm, goBack } from '@/lib/confirm';
import { entryMood, useDiary, type DiaryEntry } from '@/lib/diary-store';

/**
 * A diary entry. Existing entries open as a read-only card with Edit / Delete;
 * `id = "new"` opens the editor (Title, Diary, Mood) straight away.
 */
export default function EntryScreen() {
  const c = useTheme();
  const { id, date: dateParam } = useLocalSearchParams<{ id: string; date?: string }>();
  const { entries, saveEntry, deleteEntry } = useDiary();
  const toast = useToast();
  const existing = id !== 'new' ? entries.find((e) => e.id === id) : undefined;

  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [mood, setMood] = useState<MoodValue | null>(existing?.mood ?? null);
  const [customMoodId, setCustomMoodId] = useState<string | null>(existing?.customMoodId ?? null);
  const [date, setDate] = useState(existing?.date ?? dateParam ?? todayKey());
  const [pickDate, setPickDate] = useState(false);
  const [editing, setEditing] = useState(id === 'new');

  const dirty =
    title !== (existing?.title ?? '') ||
    body !== (existing?.body ?? '') ||
    mood !== (existing?.mood ?? null) ||
    customMoodId !== (existing?.customMoodId ?? null) ||
    (existing ? date !== existing.date : false);
  const canSave = (title.trim() || body.trim() || mood) && (dirty || !existing);
  const words = body.trim() ? body.trim().split(/\s+/).length : 0;

  const save = () => {
    saveEntry({ id: existing?.id, title: title.trim(), body, mood, customMoodId, date });
    toast({ title: existing ? 'Changes saved' : 'Entry saved', icon: 'check' });
    if (existing) setEditing(false); // back to the read-only card
    else goBack();
  };

  const resetTo = (e: DiaryEntry) => {
    setTitle(e.title);
    setBody(e.body);
    setMood(e.mood);
    setCustomMoodId(e.customMoodId ?? null);
    setDate(e.date);
    setPickDate(false);
  };

  const close = async () => {
    if (dirty && !(await confirm('Discard changes?', 'Your unsaved writing will be lost.', 'Discard'))) return;
    if (existing) {
      resetTo(existing);
      setEditing(false);
    } else goBack();
  };

  const remove = async () => {
    if (!existing) return;
    if (await confirm('Delete this entry?', 'This can’t be undone.')) {
      deleteEntry(existing.id);
      toast({ title: 'Entry deleted', icon: 'trash-2' });
      goBack();
    }
  };

  if (id !== 'new' && !existing) {
    return (
      <Screen>
        <Txt variant="title">Entry not found</Txt>
        <Button label="Back" variant="soft" style={{ marginTop: 16, alignSelf: 'flex-start' }} onPress={goBack} />
      </Screen>
    );
  }

  if (existing && !editing) {
    return <EntryCard entry={existing} onEdit={() => setEditing(true)} onDelete={remove} />;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={styles.top}>
          <IconButton icon="x" label={existing ? 'Cancel editing' : 'Close'} onPress={close} />
          <Txt variant="heading">{existing ? 'Edit entry' : 'New entry'}</Txt>
          <Button size="sm" label="Save" disabled={!canSave} onPress={save} />
        </View>

        <Card style={styles.paper}>
          <Pressable
            onPress={() => setPickDate((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Change date"
            style={styles.dateRow}>
            <Feather name="calendar" size={14} color={c.muted} />
            <Txt variant="small" tone="muted">{formatLong(date)}</Txt>
            <Feather name={pickDate ? 'chevron-up' : 'chevron-down'} size={14} color={c.muted} />
          </Pressable>
          {pickDate && (
            <View style={[styles.calWrap, { borderColor: c.line }]}>
              <Calendar
                selected={date}
                onSelect={(k) => {
                  setDate(k);
                  setPickDate(false);
                }}
              />
            </View>
          )}

          <Label style={styles.fieldLabel}>Title</Label>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Give today a name…"
            placeholderTextColor={c.muted}
            selectionColor={c.accent}
            style={[styles.title, { color: c.text }]}
            returnKeyType="next"
            maxLength={120}
          />
          <View style={[styles.divider, { backgroundColor: c.line }]} />

          <Label style={styles.fieldLabel}>Diary</Label>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Dear diary, today…"
            placeholderTextColor={c.muted}
            selectionColor={c.accent}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
            style={[styles.body, { color: c.text }]}
          />
          <Txt variant="caption" tone="muted" style={styles.count}>
            {words} {words === 1 ? 'word' : 'words'}
          </Txt>
        </Card>

        <View style={styles.moodBlock}>
          <Label>Mood</Label>
          <MoodPicker
            level={mood}
            customId={customMoodId}
            onChange={(level, id) => {
              setMood(level);
              setCustomMoodId(id);
            }}
          />
        </View>

        <Button label={existing ? 'Save changes' : 'Save entry'} disabled={!canSave} onPress={save} style={styles.saveBottom} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** Read-only card showing everything written, with Edit and Delete. */
function EntryCard({ entry, onEdit, onDelete }: { entry: DiaryEntry; onEdit: () => void; onDelete: () => void }) {
  const c = useTheme();
  const { customMoods } = useDiary();
  const mood = entryMood(entry, customMoods);
  const words = entry.body.trim() ? entry.body.trim().split(/\s+/).length : 0;
  const year = entry.date.slice(0, 4);

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton icon="arrow-left" label="Back" onPress={goBack} />
        <Txt variant="heading">Your entry</Txt>
        <View style={{ width: 40 }} />
      </View>

      <Card style={styles.viewCard}>
        <View style={styles.viewMeta}>
          <View style={styles.dateRow}>
            <Feather name="calendar" size={14} color={c.muted} />
            <Txt variant="small" tone="muted">{formatLong(entry.date)}, {year}</Txt>
          </View>
          {mood && (
            <View style={[styles.moodChip, { backgroundColor: `${mood.color}40`, borderColor: mood.color }]}>
              <Text style={styles.moodFace}>{mood.face}</Text>
              <Txt variant="small" style={{ fontWeight: '600' }}>{mood.label}</Txt>
            </View>
          )}
        </View>

        <Txt variant="title" style={styles.viewTitle} selectable>
          {entry.title.trim() || 'Untitled'}
        </Txt>
        <View style={[styles.divider, { backgroundColor: c.line }]} />

        {entry.body.trim() ? (
          <Txt style={[styles.viewBody, { color: c.text }]} selectable>{entry.body}</Txt>
        ) : (
          <Txt tone="muted" style={styles.viewBody}>No diary text.</Txt>
        )}

        <Txt variant="caption" tone="muted" style={styles.count}>
          {words} {words === 1 ? 'word' : 'words'}
        </Txt>
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
  viewCard: { paddingTop: 18, paddingBottom: 16 },
  viewMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  moodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 99, borderWidth: 1 },
  moodFace: { fontSize: 18, lineHeight: 22 },
  viewTitle: { marginTop: 14 },
  viewBody: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 29 },
  viewActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  paper: { paddingTop: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  calWrap: { borderWidth: 1, borderRadius: 14, padding: 10, marginTop: 8 },
  fieldLabel: { marginTop: 14 },
  title: { fontFamily: Fonts.serif, fontSize: 24, fontWeight: '500', paddingVertical: 6 },
  divider: { height: 1, marginVertical: 10 },
  body: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 29, minHeight: 260, paddingTop: 6 },
  count: { textAlign: 'right', marginTop: 6 },
  moodBlock: { marginTop: 24, gap: 10 },
  saveBottom: { marginTop: 28 },
});
