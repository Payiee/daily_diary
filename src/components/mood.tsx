import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Input } from '@/components/form';
import { useToast } from '@/components/toast';
import { Button, Label, Txt } from '@/components/ui';
import { Fonts, Moods, Radius, type MoodValue } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { confirm } from '@/lib/confirm';
import { useDiary } from '@/lib/diary-store';

/* ------------------------------------------------------------- MoodPicker */

/**
 * Five default moods, the user's own emoji moods, and a "+" tile to add more.
 * Custom moods map to a 1–5 level so History charts keep working.
 */
export function MoodPicker({
  level,
  customId,
  onChange,
}: {
  level: MoodValue | null;
  customId: string | null;
  onChange: (level: MoodValue | null, customId: string | null) => void;
}) {
  const c = useTheme();
  const { customMoods, addCustomMood, deleteCustomMood } = useDiary();
  const [adding, setAdding] = useState(false);
  const toast = useToast();
  const hasValue = level !== null;

  const removeCustom = async (id: string, label: string) => {
    const ok = await confirm(
      `Remove “${label}”?`,
      'Entries that used it keep their mood, shown with the default emoji.',
      'Remove',
    );
    if (!ok) return;
    deleteCustomMood(id);
    if (customId === id) onChange(level, null);
    toast({ title: `Removed “${label}”`, icon: 'trash-2' });
  };

  const tiles = [
    ...Moods.map((m) => ({ key: `d${m.value}`, face: m.face, label: m.label, color: m.color, level: m.value, customId: null as string | null })),
    ...customMoods.map((m) => ({
      key: m.id,
      face: m.face,
      label: m.label,
      color: Moods[m.level - 1].color,
      level: m.level,
      customId: m.id as string | null,
    })),
  ];

  return (
    <View>
      <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Mood">
        {tiles.map((t) => {
          const on = t.customId ? customId === t.customId : level === t.level && !customId;
          return (
            <View key={t.key} style={styles.cell}>
              <Pressable
                accessibilityRole="radio"
                accessibilityLabel={t.label}
                accessibilityHint={t.customId ? 'Long-press to remove this mood' : undefined}
                aria-checked={on}
                onPress={() => (on ? onChange(null, null) : onChange(t.level, t.customId))}
                onLongPress={t.customId ? () => removeCustom(t.customId!, t.label) : undefined}
                delayLongPress={450}
                style={({ pressed }) => [
                  styles.tile,
                  { backgroundColor: on ? `${t.color}45` : c.surface, borderColor: on ? t.color : c.line },
                  pressed && { transform: [{ scale: 0.96 }] },
                ]}>
                <Text style={[styles.face, !on && hasValue && styles.faceDim]}>{t.face}</Text>
                <Text numberOfLines={1} style={[styles.label, { color: on ? c.text : c.textSecondary }]}>
                  {t.label}
                </Text>
              </Pressable>
            </View>
          );
        })}

        <View style={styles.cell}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add your own mood"
            onPress={() => setAdding(true)}
            style={({ pressed }) => [
              styles.tile,
              styles.addTile,
              { borderColor: c.line },
              pressed && { transform: [{ scale: 0.96 }] },
            ]}>
            <View style={[styles.plus, { backgroundColor: c.accentSoft }]}>
              <Feather name="plus" size={18} color={c.accentInk} />
            </View>
            <Text style={[styles.label, { color: c.textSecondary }]}>Add</Text>
          </Pressable>
        </View>
      </View>

      {customMoods.length > 0 && (
        <Txt variant="caption" tone="muted" style={{ marginTop: 8 }}>
          Long-press one of your own moods to remove it.
        </Txt>
      )}

      <AddMoodSheet
        visible={adding}
        onClose={() => setAdding(false)}
        onAdd={(m) => {
          const id = addCustomMood(m);
          onChange(m.level, id); // select the new mood right away
          setAdding(false);
          toast({ title: `${m.face}  ${m.label} added to your moods`, icon: 'smile' });
        }}
      />
    </View>
  );
}

/* ----------------------------------------------------------- AddMoodSheet */

const SUGGESTED = ['🥰', '😌', '😴', '🥱', '🤒', '😤', '😭', '🥳', '🤩', '😎', '🤔', '😬', '🫠', '🤯', '😇', '🙏', '💪', '☕', '🌧️', '🌈', '🌸', '❤️', '💔', '✨'];

function AddMoodSheet({
  visible,
  onClose,
  onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (m: { face: string; label: string; level: MoodValue }) => void;
}) {
  const c = useTheme();
  const [face, setFace] = useState('');
  const [label, setLabel] = useState('');
  const [level, setLevel] = useState<MoodValue>(3);

  const cleanFace = face.trim();
  const canAdd = cleanFace.length > 0 && label.trim().length > 0;

  const reset = () => {
    setFace('');
    setLabel('');
    setLevel(3);
  };
  const close = () => {
    reset();
    onClose();
  };
  const add = () => {
    if (!canAdd) return;
    onAdd({ face: cleanFace, label: label.trim(), level });
    reset();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdropWrap}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.line }]}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
            <View style={styles.sheetHead}>
              <Txt variant="heading">Add your own mood</Txt>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
                <Feather name="x" size={20} color={c.textSecondary} />
              </Pressable>
            </View>

            {/* Emoji */}
            <View style={styles.emojiRow}>
              <View style={[styles.preview, { backgroundColor: c.surface2, borderColor: c.line }]}>
                <Text style={styles.previewFace}>{cleanFace || '🙂'}</Text>
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Label>Emoji</Label>
                <Input
                  value={face}
                  onChangeText={(t) => setFace(t.trim().slice(0, 8))}
                  placeholder="Type or pick an emoji"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={styles.suggest}>
              {SUGGESTED.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => setFace(e)}
                  accessibilityRole="button"
                  accessibilityLabel={`Use ${e}`}
                  style={({ pressed }) => [
                    styles.suggestItem,
                    cleanFace === e && { backgroundColor: c.accentSoft },
                    pressed && { opacity: 0.6 },
                  ]}>
                  <Text style={styles.suggestFace}>{e}</Text>
                </Pressable>
              ))}
            </View>

            {/* Name */}
            <View style={{ gap: 6 }}>
              <Label>Name</Label>
              <Input
                value={label}
                onChangeText={setLabel}
                placeholder="e.g. Sleepy, Grateful, Stressed"
                maxLength={16}
                returnKeyType="done"
                onSubmitEditing={add}
              />
            </View>

            {/* Level */}
            <View style={{ gap: 8 }}>
              <Label>Feels closest to</Label>
              <View style={styles.levels}>
                {Moods.map((m) => {
                  const on = m.value === level;
                  return (
                    <Pressable
                      key={m.value}
                      accessibilityRole="radio"
                      accessibilityLabel={`Closest to ${m.label}`}
                      aria-checked={on}
                      onPress={() => setLevel(m.value)}
                      style={[
                        styles.level,
                        { borderColor: on ? m.color : c.line, backgroundColor: on ? `${m.color}45` : c.surface },
                      ]}>
                      <View style={[styles.levelDot, { backgroundColor: m.color }]} />
                      <Text style={[styles.label, { color: on ? c.text : c.textSecondary }]}>{m.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Txt variant="caption" tone="muted">Used for the colours and charts in History.</Txt>
            </View>

            <View style={styles.sheetActions}>
              <Button label="Cancel" variant="ghost" onPress={close} />
              <Button label="Add mood" icon="plus" disabled={!canAdd} onPress={add} />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  cell: { width: '20%', padding: 4 },
  tile: { alignItems: 'center', gap: 4, paddingVertical: 10, paddingHorizontal: 2, borderRadius: 14, borderWidth: 1 },
  addTile: { borderStyle: 'dashed', borderWidth: 1.5, justifyContent: 'center' },
  plus: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  face: { fontSize: 26, lineHeight: 32 },
  faceDim: { opacity: 0.45 },
  label: { fontFamily: Fonts.sans, fontSize: 12, fontWeight: '500' },

  backdropWrap: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(30, 28, 26, 0.35)' },
  sheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: Platform.OS === 'web' ? 24 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 24 : 0,
    marginBottom: Platform.OS === 'web' ? 24 : 0,
  },
  sheetBody: { padding: 20, paddingBottom: 28, gap: 18 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emojiRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  preview: { width: 72, height: 72, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  previewFace: { fontSize: 40, lineHeight: 48 },
  suggest: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: -6 },
  suggestItem: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  suggestFace: { fontSize: 22, lineHeight: 28 },
  levels: { flexDirection: 'row', gap: 6 },
  level: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: Radius.sm, borderWidth: 1 },
  levelDot: { width: 12, height: 12, borderRadius: 6 },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 4 },
});
