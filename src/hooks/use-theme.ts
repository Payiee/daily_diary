import { Colors, type Palette } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDiary } from '@/lib/diary-store';

/** Resolved color scheme, honouring the user's preference from Profile. */
export function useScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const { profile } = useDiary();
  if (profile.theme !== 'system') return profile.theme;
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme(): Palette {
  return Colors[useScheme()];
}
