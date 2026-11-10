import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button, Card, Txt } from '@/components/ui';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  CompanionFailure,
  PRIVACY_NOTE,
  REFLECTION_ERROR_TEXT,
  entriesForAi,
  firstName,
  reflect,
  type CompanionError,
  type ReflectionResult,
} from '@/lib/companion';
import { useDiary } from '@/lib/diary-store';

// Reflections survive switching periods/tabs during this session (keyed by period + diary state).
const cache = new Map<string, ReflectionResult>();

/** AI reflection on the diary for the period shown in History. */
export function AiReflection({ from, to, label, noun }: { from: string; to: string; label: string; noun: string }) {
  const c = useTheme();
  const { entries, customMoods, profile } = useDiary();
  const inRange = entries.filter((e) => e.date >= from && e.date <= to);
  const key = `${from}|${to}|${inRange.length}|${Math.max(0, ...inRange.map((e) => e.updatedAt))}`;

  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ key: string; reason: CompanionError } | null>(null);
  const [, bump] = useState(0);

  const result = cache.get(key);
  const loading = loadingKey === key;
  const error = failure?.key === key ? failure.reason : null;

  const run = async () => {
    setLoadingKey(key);
    setFailure(null);
    try {
      const r = await reflect({
        period: label,
        name: firstName(profile.name),
        entries: entriesForAi(entries, customMoods, from, to),
      });
      cache.set(key, r);
      bump((n) => n + 1);
    } catch (e) {
      setFailure({ key, reason: e instanceof CompanionFailure ? e.reason : 'unavailable' });
    } finally {
      setLoadingKey((k) => (k === key ? null : k));
    }
  };

  return (
    <Card>
      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
          <Feather name="moon" size={15} color={c.accentInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="heading">Reflection</Txt>
          <Txt variant="caption" tone="muted">{label}</Txt>
        </View>
      </View>

      {inRange.length === 0 ? (
        <Txt variant="small" tone="muted">No entries this {noun} yet. Write a few and come back for a reflection.</Txt>
      ) : loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={c.accent} />
          <Txt variant="small" tone="muted">Reading your {inRange.length} {inRange.length === 1 ? 'entry' : 'entries'}…</Txt>
        </View>
      ) : result ? (
        <View style={{ gap: 14 }}>
          <Txt style={styles.reflection}>{result.reflection}</Txt>
          {result.themes.length > 0 && (
            <View style={styles.themes}>
              {result.themes.map((t) => (
                <View key={t} style={[styles.theme, { backgroundColor: c.surface2 }]}>
                  <Txt variant="caption" tone="secondary">{t}</Txt>
                </View>
              ))}
            </View>
          )}
          {!!result.suggestion && (
            <View style={[styles.suggestion, { backgroundColor: c.accentSoft }]}>
              <Feather name="sun" size={15} color={c.accentInk} />
              <Txt variant="small" style={{ flex: 1 }}>{result.suggestion}</Txt>
            </View>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon="refresh-cw"
            label="Reflect again"
            onPress={run}
            style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
          />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Txt variant="small" tone="secondary">
            Let AI read your {inRange.length} {inRange.length === 1 ? 'entry' : 'entries'} from this {noun} and reflect on how it went.
          </Txt>
          <Button icon="moon" label={`Reflect on this ${noun}`} onPress={run} style={{ alignSelf: 'flex-start' }} />
        </View>
      )}

      {error && (
        <View style={[styles.note, { backgroundColor: c.surface2 }]}>
          <Feather name="info" size={14} color={c.textSecondary} />
          <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>{REFLECTION_ERROR_TEXT[error]}</Txt>
        </View>
      )}

      {inRange.length > 0 && (
        <Txt variant="caption" tone="muted" style={styles.privacy}>{PRIVACY_NOTE}</Txt>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  badge: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  reflection: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 27 },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  theme: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  suggestion: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: Radius.sm },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: Radius.sm, marginTop: 14 },
  privacy: { marginTop: 12, lineHeight: 16 },
});
