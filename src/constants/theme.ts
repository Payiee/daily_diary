/**
 * Daily Diary design tokens.
 * Warm paper background, soft charcoal ink (never pure black/white), sage accent,
 * dusty terracotta for events. Text-on-background contrast stays ≈ 11:1 without glare.
 */
import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F6F1E9',
    surface: '#FFFCF7',
    surface2: '#EFE8DD',
    line: '#E6DDD0',
    text: '#3B3631',
    textSecondary: '#6E665D',
    muted: '#9A9086',
    accent: '#6F8F7A',
    accentInk: '#4F6B59',
    accentSoft: '#E2EAE1',
    onAccent: '#FFFFFF',
    event: '#C4917F',
    eventSoft: '#F3E4DD',
    danger: '#B5675A',
  },
  dark: {
    background: '#1E1C1A',
    surface: '#272421',
    surface2: '#312D29',
    line: '#3A3531',
    text: '#ECE5DA',
    textSecondary: '#BDB3A7',
    muted: '#8C8379',
    accent: '#9DB8A3',
    accentInk: '#B7CDBB',
    accentSoft: '#2E3830',
    onAccent: '#1E1C1A',
    event: '#D2A393',
    eventSoft: '#3A2E29',
    danger: '#D98B7E',
  },
} as const;

export type Palette = { [K in keyof typeof Colors.light]: string };

export type MoodValue = 1 | 2 | 3 | 4 | 5;

export const Moods: { value: MoodValue; label: string; face: string; color: string }[] = [
  { value: 1, label: 'Rough', face: '😣', color: '#A7A3C7' },
  { value: 2, label: 'Low', face: '😔', color: '#9DB6CB' },
  { value: 3, label: 'Okay', face: '😐', color: '#E2C98E' },
  { value: 4, label: 'Good', face: '🙂', color: '#B9CC92' },
  { value: 5, label: 'Great', face: '😄', color: '#8DB89A' },
];

export function moodOf(value: number | null | undefined) {
  if (!value) return undefined;
  return Moods[Math.min(5, Math.max(1, Math.round(value))) - 1];
}

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded' },
  web: { sans: 'var(--font-sans)', serif: 'var(--font-serif)', rounded: 'var(--font-sans)' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal' },
});

export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
export const Radius = { sm: 12, md: 16, lg: 20, pill: 999 } as const;

export const MaxContentWidth = 760;
export const WideBreakpoint = 900;
