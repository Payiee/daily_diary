import { Feather } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card, IconButton, Txt } from '@/components/ui';
import { Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  CompanionFailure,
  ERROR_TEXT,
  PRIVACY_NOTE,
  askCompanion,
  diarySignature,
  firstName,
  offlineCompanion,
  recentEntries,
  readDailyCache,
  writeDailyCache,
  type CompanionError,
  type CompanionResult,
} from '@/lib/companion';
import { byDate, useDiary } from '@/lib/diary-store';

/** Home page AI card: a daily quote + advice, and a box to ask for advice. */
export function Companion() {
  const c = useTheme();
  const { entries, customMoods, profile } = useDiary();
  const [result, setResult] = useState<CompanionResult | null>(null);
  const [asked, setAsked] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<CompanionError | null>(null);
  const [question, setQuestion] = useState('');
  const signature = diarySignature(entries);

  // Latest values for the async calls, without re-triggering the initial load
  const latest = useRef({ entries, customMoods, name: profile.name, signature });
  useEffect(() => {
    latest.current = { entries, customMoods, name: profile.name, signature };
  }, [entries, customMoods, profile.name, signature]);

  const fallback = useCallback(() => {
    const last = [...latest.current.entries].filter((e) => e.mood).sort(byDate('newest'))[0];
    return offlineCompanion(last?.mood);
  }, []);

  const run = useCallback(
    async (mode: 'daily' | 'ask', q?: string) => {
      setLoading(true);
      setError(null);
      try {
        const { entries: all, customMoods: moods, name, signature: sig } = latest.current;
        const r = await askCompanion({
          mode,
          question: q,
          name: firstName(name),
          entries: recentEntries(all, moods),
        });
        setResult(r);
        setAsked(mode === 'ask' ? (q ?? null) : null);
        if (mode === 'daily') writeDailyCache(sig, r);
        return true;
      } catch (e) {
        const reason = e instanceof CompanionFailure ? e.reason : 'unavailable';
        setError(reason);
        // Keep what's on screen for transient errors; otherwise show the offline companion.
        setResult((cur) => cur ?? fallback());
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fallback],
  );

  // Today's advice: reuse the cached one unless the recent diary changed (then ask again, once).
  useEffect(() => {
    let alive = true;
    readDailyCache(signature).then((cached) => {
      if (!alive) return;
      if (cached) setResult(cached);
      else run('daily');
    });
    return () => {
      alive = false;
    };
  }, [run, signature]);

  const send = async () => {
    const q = question.trim();
    if (!q || loading) return;
    if (await run('ask', q)) setQuestion('');
  };

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
            <Feather name="feather" size={15} color={c.accentInk} />
          </View>
          <Txt variant="heading">Daily companion</Txt>
        </View>
        <IconButton
          icon="refresh-cw"
          label="New quote and advice"
          size={17}
          disabled={loading}
          onPress={() => run('daily')}
        />
      </View>

      {loading && !result ? (
        <View style={styles.loading}>
          <ActivityIndicator color={c.accent} />
          <Txt variant="small" tone="muted">Finding words for today…</Txt>
        </View>
      ) : result ? (
        <View style={{ opacity: loading ? 0.45 : 1 }}>
          <Txt style={[styles.quote, { color: c.text }]}>“{result.quote}”</Txt>
          {!!result.author && <Txt variant="small" tone="muted" style={styles.author}>— {result.author}</Txt>}

          <View style={[styles.divider, { backgroundColor: c.line }]} />

          {asked ? (
            <Txt variant="caption" tone="muted" style={styles.adviceLabel} numberOfLines={2}>
              YOU ASKED · {asked}
            </Txt>
          ) : (
            <Txt variant="eyebrow" tone="muted" style={styles.adviceLabel}>For today</Txt>
          )}
          <Txt style={styles.advice}>{result.advice}</Txt>
        </View>
      ) : null}

      {error && (
        <View style={[styles.note, { backgroundColor: c.surface2 }]}>
          <Feather name="info" size={14} color={c.textSecondary} />
          <Txt variant="caption" tone="secondary" style={{ flex: 1 }}>{ERROR_TEXT[error]}</Txt>
        </View>
      )}

      <View style={[styles.ask, { borderColor: c.line, backgroundColor: c.background }]}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask for advice…"
          placeholderTextColor={c.muted}
          selectionColor={c.accent}
          maxLength={500}
          returnKeyType="send"
          submitBehavior="submit"
          onSubmitEditing={send}
          editable={!loading}
          style={[styles.askInput, { color: c.text }]}
        />
        <Pressable
          onPress={send}
          disabled={!question.trim() || loading}
          accessibilityRole="button"
          accessibilityLabel="Ask"
          style={({ pressed }) => [
            styles.send,
            { backgroundColor: question.trim() && !loading ? c.accent : c.surface2, opacity: pressed ? 0.8 : 1 },
          ]}>
          {loading && result ? (
            <ActivityIndicator size="small" color={c.onAccent} />
          ) : (
            <Feather name="arrow-up" size={18} color={question.trim() ? c.onAccent : c.muted} />
          )}
        </Pressable>
      </View>

      <Txt variant="caption" tone="muted" style={styles.privacy}>
        {PRIVACY_NOTE}
      </Txt>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 24 },
  quote: { fontFamily: Fonts.serif, fontSize: 19, lineHeight: 28, fontStyle: 'italic' },
  author: { marginTop: 6 },
  divider: { height: 1, marginVertical: 16 },
  adviceLabel: { marginBottom: 6 },
  advice: { lineHeight: 24 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: Radius.sm, marginTop: 14 },
  ask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    marginTop: 16,
  },
  askInput: { flex: 1, fontFamily: Fonts.sans, fontSize: 16, paddingVertical: 6 },
  send: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  privacy: { marginTop: 10, lineHeight: 16 },
});
