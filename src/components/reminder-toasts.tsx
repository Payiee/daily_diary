import { router } from 'expo-router';
import { useEffect } from 'react';

import { useToast } from '@/components/toast';
import { addDays, formatTime, toKey, todayKey } from '@/lib/dates';
import { byDate, useDiary } from '@/lib/diary-store';

// Once per app launch (module scope survives screen changes, resets on reload/restart).
let shownThisLaunch = false;

/**
 * Shows today's events (and tomorrow's events that have reminders) as toasts when the app opens.
 * This replaces push notifications.
 */
export function ReminderToasts() {
  const { events, ready } = useDiary();
  const toast = useToast();

  useEffect(() => {
    if (!ready || shownThisLaunch) return;
    shownThisLaunch = true;

    const today = todayKey();
    const tomorrow = toKey(addDays(new Date(), 1));
    const due = events
      .filter((e) => e.date === today || (e.date === tomorrow && e.reminders.length > 0))
      .sort(byDate('oldest'))
      .slice(0, 3);

    for (const e of due) {
      const when = `${e.date === today ? 'Today' : 'Tomorrow'} · ${formatTime(e.time)}`;
      toast({
        tone: 'event',
        icon: 'bell',
        title: `${e.title} — ${when}`,
        message: e.reminders.length ? e.reminders.map((r) => r.text).join(' · ') : undefined,
        duration: 6000,
        onPress: () => router.push({ pathname: '/event/[id]', params: { id: e.id } }),
      });
    }
  }, [ready, events, toast]);

  return null;
}
