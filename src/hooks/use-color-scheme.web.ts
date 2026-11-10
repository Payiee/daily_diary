import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const subscribe = () => () => {};

/**
 * Web is server-rendered (`web.output: "server"`), and the server can't know the
 * visitor's system theme. Report 'light' during SSR and hydration so the first
 * client render matches the server HTML; React then re-renders with the real scheme.
 */
export function useColorScheme() {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true, // client
    () => false, // server + hydration
  );
  const colorScheme = useRNColorScheme();
  return hydrated ? colorScheme : 'light';
}
