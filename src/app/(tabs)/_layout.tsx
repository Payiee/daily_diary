import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type IconName } from '@/components/ui';
import { Fonts, Radius, WideBreakpoint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Navigation from the sketch: Home · Event plan · (+) New diary · History · Your diary.
 * Phone: bottom bar with a raised + button. Wide web/tablet: left sidebar.
 */
export default function TabsLayout() {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= WideBreakpoint;
  const insets = useSafeAreaInsets();

  const newEntry = () => router.push({ pathname: '/entry/[id]', params: { id: 'new' } });
  const newEvent = () => router.push({ pathname: '/event/[id]', params: { id: 'new' } });

  const bar = (
    <TabList asChild>
      <View
        // expo-router's TabList (asChild) requires a flat style object, not an array.
        style={StyleSheet.flatten(
          wide
            ? [styles.side, { borderRightColor: c.line }]
            : [
                styles.bar,
                {
                  backgroundColor: c.surface,
                  borderTopColor: c.line,
                  paddingBottom: Math.max(insets.bottom, 8),
                },
              ],
        )}>
        {wide && (
          <>
            <View style={styles.brand}>
              <View style={[styles.brandMark, { backgroundColor: c.accent }]}>
                <Feather name="feather" size={15} color={c.onAccent} />
              </View>
              <Text style={[styles.brandText, { color: c.text }]}>Daily Diary</Text>
            </View>
            <Pressable
              onPress={newEntry}
              accessibilityRole="button"
              style={({ pressed }) => [styles.sideAdd, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}>
              <Feather name="plus" size={18} color={c.onAccent} />
              <Text style={[styles.sideAddText, { color: c.onAccent }]}>New entry</Text>
            </Pressable>
          </>
        )}

        <TabTrigger name="index" href="/" asChild>
          <NavItem icon="home" label="Home" wide={wide} />
        </TabTrigger>

        <NavAction icon="calendar" label="Event plan" wide={wide} onPress={newEvent} />

        {!wide && (
          <Pressable
            onPress={newEntry}
            accessibilityRole="button"
            accessibilityLabel="New diary entry"
            style={({ pressed }) => [
              styles.fab,
              { backgroundColor: c.accent, boxShadow: `0 6px 16px ${c.accent}66` },
              pressed && { transform: [{ scale: 0.94 }] },
            ]}>
            <Feather name="plus" size={26} color={c.onAccent} />
          </Pressable>
        )}

        <TabTrigger name="history" href="/history" asChild>
          <NavItem icon="bar-chart-2" label="History" wide={wide} />
        </TabTrigger>

        <TabTrigger name="diary" href="/diary" asChild>
          <NavItem icon="book-open" label="Your diary" wide={wide} />
        </TabTrigger>
      </View>
    </TabList>
  );

  return (
    <Tabs style={StyleSheet.flatten([styles.flex, { flexDirection: wide ? 'row' : 'column', backgroundColor: c.background }])}>
      {wide && bar}
      <TabSlot style={styles.flex} />
      {!wide && bar}
    </Tabs>
  );
}

type NavProps = { icon: IconName; label: string; wide: boolean };

function NavItem({ icon, label, wide, isFocused, ...props }: TabTriggerSlotProps & NavProps) {
  return <NavButton {...props} icon={icon} label={label} wide={wide} active={!!isFocused} />;
}

function NavAction({ onPress, ...p }: NavProps & { onPress: () => void }) {
  return <NavButton {...p} active={false} onPress={onPress} />;
}

function NavButton({
  icon,
  label,
  wide,
  active,
  ...props
}: Omit<TabTriggerSlotProps, 'isFocused' | 'ref'> & NavProps & { active: boolean }) {
  const c = useTheme();
  const color = active ? c.accentInk : c.muted;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      aria-selected={active}
      {...props}
      style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
        wide ? styles.sideItem : styles.item,
        wide && active && { backgroundColor: c.accentSoft },
        wide && !active && hovered && { backgroundColor: c.surface2 },
        pressed && { opacity: 0.7 },
      ]}>
      <Feather name={icon} size={wide ? 19 : 21} color={color} />
      <Text style={[wide ? styles.sideLabel : styles.label, { color: wide ? (active ? c.text : c.textSecondary) : color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  item: { alignItems: 'center', justifyContent: 'center', gap: 3, width: 64, height: 48, borderRadius: 14 },
  label: { fontFamily: Fonts.sans, fontSize: 11, fontWeight: '600' },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
  },
  // TabList defaults to a horizontal row; the sidebar must override direction and alignment.
  side: {
    width: 236,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingVertical: 28,
    paddingHorizontal: 16,
    gap: 4,
    borderRightWidth: 1,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingBottom: 24 },
  brandMark: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontFamily: Fonts.serif, fontSize: 20, fontWeight: '500' },
  sideAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 14,
    marginBottom: 16,
  },
  sideAddText: { fontFamily: Fonts.sans, fontSize: 15, fontWeight: '600' },
  sideItem: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 44, paddingHorizontal: 12, borderRadius: Radius.sm },
  sideLabel: { fontFamily: Fonts.sans, fontSize: 15, fontWeight: '500' },
});
