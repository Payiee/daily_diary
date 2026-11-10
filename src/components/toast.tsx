import { Feather } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/components/ui';
import { Fonts, Radius, WideBreakpoint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ToastInput = {
  title: string;
  message?: string;
  icon?: IconName;
  tone?: 'default' | 'event' | 'success';
  /** ms on screen; default 3s (5.5s when there is a message) */
  duration?: number;
  onPress?: () => void;
};

type Toast = ToastInput & { id: number };

const ToastContext = createContext<{ show: (t: ToastInput) => void } | null>(null);

/**
 * In-app toast notifications (used instead of push notifications).
 * Toasts queue and appear one at a time near the bottom (above the tab bar), so they never cover
 * header buttons like Back. Tap to open; × to dismiss.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [queue, setQueue] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const show = useCallback((t: ToastInput) => {
    setQueue((q) => [...q, { ...t, id: nextId.current++ }]);
  }, []);

  const dismiss = useCallback((id: number) => setQueue((q) => q.filter((t) => t.id !== id)), []);

  const value = useMemo(() => ({ show }), [show]);
  const current = queue[0];

  return (
    <ToastContext.Provider value={value}>
      {children}
      {current && <ToastView key={current.id} toast={current} onDone={() => dismiss(current.id)} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx.show;
}

function ToastView({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const wide = useWindowDimensions().width >= WideBreakpoint;
  const [anim] = useState(() => new Animated.Value(0));
  const duration = toast.duration ?? (toast.message ? 5500 : 3000);

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => onDone());
  }, [anim, onDone]);

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 4 }).start();
    const t = setTimeout(hide, duration);
    return () => clearTimeout(t);
  }, [anim, duration, hide]);

  const accent = toast.tone === 'event' ? c.event : c.accent;
  const iconBg = toast.tone === 'event' ? c.eventSoft : c.accentSoft;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.host,
        // Phone: above the tab bar. Wide screens: bottom-right corner, clear of the content.
        wide ? { bottom: 24, right: 24, width: 420 } : { bottom: insets.bottom + 96, left: 16, right: 16 },
      ]}>
      <Animated.View
        style={{
          width: '100%',
          maxWidth: 440,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        }}>
        <Pressable
          role="alert"
          accessibilityLabel={toast.message ? `${toast.title}. ${toast.message}` : toast.title}
          onPress={() => {
            toast.onPress?.();
            hide();
          }}
          style={[styles.toast, { backgroundColor: c.surface, borderColor: c.line, borderLeftColor: accent }]}>
          <View style={[styles.icon, { backgroundColor: iconBg }]}>
            <Feather name={toast.icon ?? (toast.tone === 'event' ? 'bell' : 'check')} size={16} color={accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>{toast.title}</Text>
            {!!toast.message && (
              <Text style={[styles.message, { color: c.textSecondary }]} numberOfLines={3}>{toast.message}</Text>
            )}
          </View>
          {/* Separate target: dismiss without opening anything */}
          <Pressable
            onPress={hide}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            hitSlop={10}
            style={styles.close}>
            <Feather name="x" size={16} color={c.muted} />
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', alignItems: 'center', zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderLeftWidth: 4,
    boxShadow: '0 10px 30px rgba(59, 54, 49, 0.16)',
  },
  close: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.sans, fontSize: 15, fontWeight: '600' },
  message: { fontFamily: Fonts.sans, fontSize: 13.5, lineHeight: 19, marginTop: 1 },
});
