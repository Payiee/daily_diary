import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { moodOf, type MoodValue } from '@/constants/theme';

export type DiaryEntry = {
  id: string;
  title: string;
  body: string;
  /** Mood level 1–5 (drives colours and History charts). */
  mood: MoodValue | null;
  /** Set when the user picked one of their own emoji moods. */
  customMoodId?: string | null;
  date: string; // YYYY-MM-DD
  createdAt: number;
  updatedAt: number;
};

/** A user-made mood: their own emoji + name, mapped to the closest 1–5 level. */
export type CustomMood = { id: string; face: string; label: string; level: MoodValue };

/** A plain reminder note attached to an event, e.g. "Buy a gift". */
export type EventReminder = { id: string; text: string };

export type EventPlan = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM, null = all day
  description: string;
  reminders: EventReminder[];
  createdAt: number;
  updatedAt: number;
};

export type ThemePreference = 'system' | 'light' | 'dark';

export type Profile = { name: string; theme: ThemePreference };

type State = { entries: DiaryEntry[]; events: EventPlan[]; customMoods: CustomMood[]; profile: Profile };

const STORAGE_KEY = 'daily-diary/v1';
const EMPTY: State = { entries: [], events: [], customMoods: [], profile: { name: '', theme: 'system' } };

type DiaryContextValue = State & {
  ready: boolean;
  /** Creates or updates an entry; returns its id. */
  saveEntry: (e: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => string;
  deleteEntry: (id: string) => void;
  /** Creates or updates an event; returns its id. */
  saveEvent: (e: Omit<EventPlan, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => string;
  deleteEvent: (id: string) => void;
  /** Adds a custom mood; returns its id. */
  addCustomMood: (m: Omit<CustomMood, 'id'>) => string;
  /** Removes a custom mood. Entries keep their mood level but fall back to the default emoji. */
  deleteCustomMood: (id: string) => void;
  updateProfile: (p: Partial<Profile>) => void;
  clearAll: () => void;
};

const DiaryContext = createContext<DiaryContextValue | null>(null);

export const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function DiaryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(EMPTY);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  // Load once
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<State>;
          setState({
            entries: parsed.entries ?? [],
            events: (parsed.events ?? []).map(migrateEvent),
            customMoods: parsed.customMoods ?? [],
            profile: { ...EMPTY.profile, ...parsed.profile },
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        hydrated.current = true;
        setReady(true);
      });
  }, []);

  // Persist on change (after hydration so we never overwrite saved data with the empty state)
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const saveEntry = useCallback<DiaryContextValue['saveEntry']>((input) => {
    const now = Date.now();
    const id = input.id ?? makeId();
    setState((s) => {
      const existing = s.entries.find((e) => e.id === id);
      const saved: DiaryEntry = existing
        ? { ...existing, ...input, id, updatedAt: now }
        : { ...input, id, createdAt: now, updatedAt: now };
      const entries = existing
        ? s.entries.map((e) => (e.id === id ? saved : e))
        : [saved, ...s.entries];
      return { ...s, entries };
    });
    return id;
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setState((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }));
  }, []);

  const saveEvent = useCallback<DiaryContextValue['saveEvent']>((input) => {
    const now = Date.now();
    const id = input.id ?? makeId();
    setState((s) => {
      const existing = s.events.find((e) => e.id === id);
      const saved: EventPlan = existing
        ? { ...existing, ...input, id, updatedAt: now }
        : { ...input, id, createdAt: now, updatedAt: now };
      const events = existing
        ? s.events.map((e) => (e.id === id ? saved : e))
        : [saved, ...s.events];
      return { ...s, events };
    });
    return id;
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
  }, []);

  const addCustomMood = useCallback((m: Omit<CustomMood, 'id'>) => {
    const id = makeId();
    setState((s) => ({ ...s, customMoods: [...s.customMoods, { ...m, id }] }));
    return id;
  }, []);

  const deleteCustomMood = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      customMoods: s.customMoods.filter((m) => m.id !== id),
      entries: s.entries.map((e) => (e.customMoodId === id ? { ...e, customMoodId: null } : e)),
    }));
  }, []);

  const updateProfile = useCallback((p: Partial<Profile>) => {
    setState((s) => ({ ...s, profile: { ...s.profile, ...p } }));
  }, []);

  const clearAll = useCallback(() => {
    // Keeps the profile and the user's custom moods; removes writing and plans.
    setState((s) => ({ ...EMPTY, profile: s.profile, customMoods: s.customMoods }));
  }, []);

  const value = useMemo<DiaryContextValue>(
    () => ({
      ...state,
      ready,
      saveEntry,
      deleteEntry,
      saveEvent,
      deleteEvent,
      addCustomMood,
      deleteCustomMood,
      updateProfile,
      clearAll,
    }),
    [state, ready, saveEntry, deleteEntry, saveEvent, deleteEvent, addCustomMood, deleteCustomMood, updateProfile, clearAll],
  );

  return <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>;
}

export function useDiary() {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error('useDiary must be used inside <DiaryProvider>');
  return ctx;
}

/** Sort helper: by date, then by time/creation. */
export function byDate<T extends { date: string; createdAt: number; time?: string | null }>(
  order: 'newest' | 'oldest',
) {
  const dir = order === 'newest' ? -1 : 1;
  return (a: T, b: T) => {
    if (a.date !== b.date) return a.date < b.date ? -dir : dir;
    const at = a.time ?? '', bt = b.time ?? '';
    if (at !== bt) return at < bt ? -dir : dir;
    return (a.createdAt - b.createdAt) * dir;
  };
}

/* ------------------------------------------------------------ reminders */

type LegacyTimed = { amount: number; unit: 'minutes' | 'hours' | 'days' | 'weeks'; note?: string };

function legacyTimedText(r: LegacyTimed) {
  if (r.note?.trim()) return r.note.trim();
  if (r.amount === 0) return 'At time of event';
  return `${r.amount} ${r.amount === 1 ? r.unit.slice(0, -1) : r.unit} before`;
}

/**
 * Upgrade events saved by earlier versions:
 *  - v1: a single `reminder` option ("1h", "1d", …)
 *  - v2: timed reminders `{ amount, unit, note }`
 * Both become plain text reminders.
 */
function migrateEvent(raw: EventPlan & { reminder?: string; reminders?: unknown[] }): EventPlan {
  const { reminder, reminders, ...rest } = raw;
  if (Array.isArray(reminders)) {
    return {
      ...rest,
      reminders: reminders.map((r) => {
        const x = r as Partial<EventReminder> & Partial<LegacyTimed>;
        if (typeof x.text === 'string') return { id: x.id ?? makeId(), text: x.text };
        return { id: x.id ?? makeId(), text: legacyTimedText(x as LegacyTimed) };
      }),
    };
  }
  const legacy: Record<string, string> = {
    atTime: 'At time of event',
    '15m': '15 minutes before',
    '1h': '1 hour before',
    '1d': '1 day before',
  };
  const text = reminder ? legacy[reminder] : undefined;
  return { ...rest, reminders: text ? [{ id: makeId(), text }] : [] };
}

/* ---------------------------------------------------------------- moods */

/** Face, label and colour for an entry, preferring the user's custom emoji when set. */
export function entryMood(
  e: Pick<DiaryEntry, 'mood' | 'customMoodId'>,
  customMoods: CustomMood[],
): { face: string; label: string; color: string } | undefined {
  const base = moodOf(e.mood);
  if (!base) return undefined;
  const custom = e.customMoodId ? customMoods.find((m) => m.id === e.customMoodId) : undefined;
  return custom ? { face: custom.face, label: custom.label, color: base.color } : base;
}
