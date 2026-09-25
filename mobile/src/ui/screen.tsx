import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { colors, gutter } from "@/theme/tokens";
import { useTopInset } from "@/hooks/use-top-inset";
import { Label } from "./primitives";
import { Text } from "./text";

/**
 * A scrolling screen. Safe areas are left to the platform
 * (contentInsetAdjustmentBehavior), not wrapped in SafeAreaView.
 */
export function Screen({
  children,
  refreshing,
  onRefresh,
}: {
  children: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const top = useTopInset();
  return (
    <ScrollView
      style={styles.scroll}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingTop: 12 + top }]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} /> : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

/** Page head: mono label, then a sans headline whose last phrase is italic serif jade. */
export function PageHead({ label, title, sub }: { label: string; title: React.ReactNode; sub?: string }) {
  return (
    <View style={styles.head}>
      <Label>{label}</Label>
      <Text variant="display">{title}</Text>
      {sub ? <Text variant="muted">{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: gutter, paddingTop: 12, paddingBottom: 48, gap: 16 },
  head: { gap: 14, paddingTop: 8, paddingBottom: 6 },
});
