import { StyleSheet, View } from 'react-native';

import { Input } from '@/components/form';
import { useToast } from '@/components/toast';
import { Avatar, Button, Card, IconButton, Label, Screen, Segmented, Txt } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { confirm, goBack } from '@/lib/confirm';
import { useDiary, type ThemePreference } from '@/lib/diary-store';

/** User profile — name (used in the greeting), appearance, data. */
export default function Profile() {
  const c = useTheme();
  const { profile, updateProfile, entries, events, clearAll } = useDiary();
  const toast = useToast();

  const clear = async () => {
    if (await confirm('Delete all entries and events?', 'Everything you wrote will be removed from this device.')) {
      clearAll();
      toast({ title: 'All entries and events deleted', icon: 'trash-2' });
    }
  };

  return (
    <Screen>
      <View style={styles.top}>
        <IconButton icon="arrow-left" label="Back" onPress={goBack} />
        <Txt variant="heading">Profile</Txt>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.hero}>
        <Avatar name={profile.name} size={72} />
        <View style={{ flex: 1 }}>
          <Txt variant="title" numberOfLines={1}>{profile.name.trim() || 'Your name'}</Txt>
          <Txt variant="small" tone="muted">
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} · {events.length}{' '}
            {events.length === 1 ? 'event' : 'events'}
          </Txt>
        </View>
      </View>

      <View style={styles.field}>
        <Label>What should we call you?</Label>
        <Input
          value={profile.name}
          onChangeText={(name) => updateProfile({ name })}
          placeholder="Your name"
          maxLength={40}
          autoCapitalize="words"
        />
      </View>

      <Card style={styles.settings}>
        <View style={[styles.setting, { borderBottomColor: c.line }]}>
          <View style={{ flex: 1 }}>
            <Txt style={{ fontWeight: '600' }}>Appearance</Txt>
            <Txt variant="caption" tone="muted">Soft paper by day, warm dusk by night</Txt>
          </View>
        </View>
        <Segmented<ThemePreference>
          value={profile.theme}
          onChange={(theme) => updateProfile({ theme })}
          options={[
            { value: 'system', label: 'Auto' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          style={{ marginTop: 12 }}
        />
      </Card>

      <Card style={[styles.settings, { marginTop: 14 }]}>
        <Txt style={{ fontWeight: '600' }}>Your data</Txt>
        <Txt variant="caption" tone="muted" style={{ marginBottom: 12 }}>
          Everything is saved privately on this device. Nothing is uploaded.
        </Txt>
        <Button
          label="Delete all entries & events"
          variant="danger"
          icon="trash-2"
          size="sm"
          onPress={clear}
          disabled={entries.length + events.length === 0}
          style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  field: { gap: 8, marginBottom: 20 },
  settings: { paddingVertical: 18 },
  setting: { flexDirection: 'row', alignItems: 'center' },
});
