import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Extra top padding a scrolling screen needs.
 * - iOS: 0. The ScrollView's contentInsetAdjustmentBehavior="automatic" handles it natively.
 * - Android: the status bar height; apps are edge-to-edge and ScrollView doesn't inset itself.
 * - Web preview: room for the tab bar, which the web build draws across the top.
 */
export function useTopInset() {
  const insets = useSafeAreaInsets();
  return Platform.select({ ios: 0, android: insets.top, web: 72, default: 0 });
}
