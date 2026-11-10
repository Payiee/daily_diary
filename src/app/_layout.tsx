import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { ReminderToasts } from '@/components/reminder-toasts';
import { ToastProvider } from '@/components/toast';
import { Colors } from '@/constants/theme';
import { useScheme } from '@/hooks/use-theme';
import { DiaryProvider, useDiary } from '@/lib/diary-store';

export default function RootLayout() {
  return (
    <DiaryProvider>
      <ToastProvider>
        <ThemedApp />
      </ToastProvider>
    </DiaryProvider>
  );
}

function ThemedApp() {
  const scheme = useScheme();
  const { ready } = useDiary();
  const c = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, background: c.background, card: c.surface, text: c.text, border: c.line, primary: c.accent },
  };

  // Hold a blank paper-coloured screen until saved data is loaded (avoids an empty-state flash).
  if (!ready) return <View style={{ flex: 1, backgroundColor: c.background }} />;

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <ReminderToasts />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="entry/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="event/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="profile" />
      </Stack>
    </ThemeProvider>
  );
}
