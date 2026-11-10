import { router } from 'expo-router';
import { Alert, Platform } from 'react-native';

/** Cross-platform confirm dialog (Alert on native, window.confirm on web). */
export function confirm(title: string, message: string, confirmLabel = 'Delete'): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/** Go back if there is history (e.g. after a web refresh there may be none). */
export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
