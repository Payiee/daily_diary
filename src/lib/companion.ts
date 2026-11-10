import AsyncStorage from '@react-native-async-storage/async-storage';

import { addDays, toKey, todayKey } from '@/lib/dates';
import { entryMood, type CustomMood, type DiaryEntry } from '@/lib/diary-store';

export type CompanionResult = { quote: string; author: string; advice: string };
export type ReflectionResult = { reflection: string; themes: string[]; suggestion: string };

export type CompanionError = 'not_configured' | 'no_server' | 'offline' | 'busy' | 'refusal' | 'unavailable';

type AiEntry = { date: string; title: string; mood: string; text: string };

/* ----------------------------------------------------------------- context */

/** Diary entries in [from, to], oldest first, in the shape the AI route expects. */
export function entriesForAi(entries: DiaryEntry[], customMoods: CustomMood[], from: string, to: string): AiEntry[] {
  return entries
    .filter((e) => e.date >= from && e.date <= to)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt))
    .map((e) => ({
      date: e.date,
      title: e.title,
      mood: entryMood(e, customMoods)?.label ?? '',
      text: e.body,
    }));
}

/** The last 7 days of entries (what the daily advice and Ask are based on). */
export function recentEntries(entries: DiaryEntry[], customMoods: CustomMood[]) {
  return entriesForAi(entries, customMoods, toKey(addDays(new Date(), -6)), todayKey());
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || undefined;

/** Changes whenever the recent diary changes, so cached advice can be refreshed. */
export function diarySignature(entries: DiaryEntry[]) {
  const since = toKey(addDays(new Date(), -6));
  const recent = entries.filter((e) => e.date >= since);
  return `${recent.length}:${Math.max(0, ...recent.map((e) => e.updatedAt))}`;
}

/* ------------------------------------------------------------------ calls */

export class CompanionFailure extends Error {
  constructor(public reason: CompanionError) {
    super(reason);
  }
}

async function post<T>(payload: Record<string, unknown>, isValid: (d: Record<string, unknown>) => boolean): Promise<T> {
  let res: Response;
  try {
    res = await fetch('/api/companion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new CompanionFailure('offline');
  }
  // If the AI route isn't running (dev server started before server output was enabled, or a static
  // web build), the request falls through to the app's HTML page instead of JSON.
  if (!(res.headers.get('content-type') ?? '').includes('json')) throw new CompanionFailure('no_server');
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok || !isValid(data)) {
    const known: CompanionError[] = ['not_configured', 'offline', 'busy', 'refusal'];
    const err = data.error as CompanionError;
    throw new CompanionFailure(known.includes(err) ? err : 'unavailable');
  }
  return data as T;
}

export function askCompanion(payload: { mode: 'daily' | 'ask'; question?: string; name?: string; entries: AiEntry[] }) {
  return post<CompanionResult>(payload, (d) => !!d.quote && !!d.advice);
}

export function reflect(payload: { period: string; name?: string; entries: AiEntry[] }) {
  return post<ReflectionResult>({ mode: 'reflection', ...payload }, (d) => typeof d.reflection === 'string' && !!d.reflection);
}

/* ------------------------------------------------------------- daily cache */

const CACHE_KEY = 'daily-diary/companion-v2';

/** Daily advice is reused for the day until the recent diary changes. */
export async function readDailyCache(signature: string): Promise<CompanionResult | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { date: string; sig: string; result: CompanionResult };
    return v.date === todayKey() && v.sig === signature ? v.result : null;
  } catch {
    return null;
  }
}

export async function writeDailyCache(signature: string, result: CompanionResult) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ date: todayKey(), sig: signature, result }));
  } catch {}
}

/* ---------------------------------------------------------- offline backup */

const QUOTES: { quote: string; author: string }[] = [
  { quote: 'The best way out is always through.', author: 'Robert Frost' },
  { quote: 'Adopt the pace of nature: her secret is patience.', author: 'Ralph Waldo Emerson' },
  { quote: 'Write it on your heart that every day is the best day in the year.', author: 'Ralph Waldo Emerson' },
  {
    quote: 'Very little is needed to make a happy life; it is all within yourself, in your way of thinking.',
    author: 'Marcus Aurelius',
  },
  { quote: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  { quote: 'This too shall pass.', author: 'Persian proverb' },
];

const ADVICE_BY_LEVEL: Record<number, string> = {
  1: 'Today sounds heavy. Be gentle with yourself: drink some water, step outside for a few minutes, and let one small thing count as enough.',
  2: 'Low days are allowed. Try writing down one thing that went okay, however small, and reach out to someone who makes you feel at ease.',
  3: 'An ordinary day is a good place to build from. Pick one small thing you have been putting off and give it ten unhurried minutes.',
  4: 'Something is working. Notice what it is and write it down, so you can return to it on harder days.',
  5: 'Enjoy this one fully. Share the good feeling with someone, and note what made today bright.',
};
const ADVICE_DEFAULT =
  'Take a slow breath and check in with yourself. A few honest lines in your diary can make the rest of the day feel lighter.';

/** A gentle quote + advice that works without internet or an API key. */
export function offlineCompanion(latestMoodLevel?: number | null): CompanionResult {
  const day = Math.floor(Date.now() / 86_400_000);
  const q = QUOTES[day % QUOTES.length];
  return { ...q, advice: (latestMoodLevel && ADVICE_BY_LEVEL[latestMoodLevel]) || ADVICE_DEFAULT };
}

export const ERROR_TEXT: Record<CompanionError, string> = {
  not_configured: 'AI isn’t set up yet (no API key), so here’s a saved quote.',
  no_server: 'The AI server isn’t running. Restart “npm run dev” to turn it on.',
  offline: 'You seem to be offline, so here’s a saved quote.',
  busy: 'The AI is busy right now. Try again in a moment.',
  refusal: 'The AI couldn’t answer that one. Try asking another way.',
  unavailable: 'The AI isn’t available right now, so here’s a saved quote.',
};

export const REFLECTION_ERROR_TEXT: Record<CompanionError, string> = {
  not_configured: 'AI isn’t set up yet (no API key), so reflections aren’t available.',
  no_server: 'The AI server isn’t running. Restart “npm run dev” to turn it on.',
  offline: 'You seem to be offline. Try again when you’re connected.',
  busy: 'The AI is busy right now. Try again in a moment.',
  refusal: 'The AI couldn’t write a reflection for this period.',
  unavailable: 'The AI isn’t available right now. Try again later.',
};

export const PRIVACY_NOTE =
  'Answers by AI, based on your recent diary entries and moods, which are sent securely to generate them. Not a substitute for professional help.';
