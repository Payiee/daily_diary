import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Txt } from '@/components/ui';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { makeId, type EventReminder } from '@/lib/diary-store';

/** Plain reminder notes for an event: type, add, remove. */
export function ReminderEditor({
  value,
  onChange,
}: {
  value: EventReminder[];
  onChange: (next: EventReminder[]) => void;
}) {
  const c = useTheme();
  const [draft, setDraft] = useState('');
  const text = draft.trim();

  const add = () => {
    if (!text) return;
    onChange([...value, { id: makeId(), text }]);
    setDraft('');
  };

  return (
    <View style={{ gap: 10 }}>
      {value.map((r) => (
        <View key={r.id} style={[styles.item, { backgroundColor: c.eventSoft }]}>
          <Feather name="bell" size={16} color={c.event} />
          <Txt variant="small" style={{ flex: 1 }}>{r.text}</Txt>
          <Pressable
            onPress={() => onChange(value.filter((v) => v.id !== r.id))}
            accessibilityRole="button"
            accessibilityLabel={`Remove reminder ${r.text}`}
            hitSlop={8}
            style={styles.remove}>
            <Feather name="x" size={16} color={c.textSecondary} />
          </Pressable>
        </View>
      ))}

      <View style={[styles.addRow, { borderColor: c.line, backgroundColor: c.surface }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a reminder, e.g. Buy a gift"
          placeholderTextColor={c.muted}
          selectionColor={c.accent}
          maxLength={80}
          returnKeyType="done"
          submitBehavior="submit"
          onSubmitEditing={add}
          style={[styles.input, { color: c.text }]}
        />
        <Pressable
          onPress={add}
          disabled={!text}
          accessibilityRole="button"
          accessibilityLabel="Add reminder"
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: text ? c.accent : c.surface2, opacity: pressed ? 0.8 : 1 },
          ]}>
          <Feather name="plus" size={18} color={text ? c.onAccent : c.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 14, borderRadius: Radius.sm },
  remove: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: Radius.sm, paddingLeft: 14, paddingRight: 6, paddingVertical: 6, gap: 8 },
  input: { flex: 1, fontFamily: Fonts.sans, fontSize: 16, paddingVertical: 6 },
  addBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
