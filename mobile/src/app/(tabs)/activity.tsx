import { useCallback, useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { Em, Label, Notice, Text } from "@/ui";
import { ActivityRow } from "@/components/activity-row";
import { flattenActivity, useActivity, useWallet } from "@/hooks/data";
import { chainMeta } from "@/lib/chains";
import type { ActivityItem } from "@/lib/data";
import { useTopInset } from "@/hooks/use-top-inset";
import { colors, gutter } from "@/theme/tokens";

/** Full on-chain history for the address on the current network, paged as you scroll. */
export default function Activity() {
  const w = useWallet();
  const top = useTopInset();
  const activity = useActivity(w.chainId, w.address);
  const items = useMemo(() => flattenActivity(activity.data?.pages), [activity.data]);
  const source = activity.data?.pages[0]?.source;
  const chain = chainMeta(w.chainId);

  const renderItem: ListRenderItem<ActivityItem> = useCallback(({ item }) => <ActivityRow item={item} />, []);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = activity;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <FlashList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyOf}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.list}
      contentContainerStyle={{ ...styles.content, paddingTop: top }}
      ItemSeparatorComponent={Separator}
      onEndReached={loadMore}
      onEndReachedThreshold={0.6}
      refreshing={activity.isRefetching && !isFetchingNextPage}
      onRefresh={() => void activity.refetch()}
      ListHeaderComponent={
        <View style={styles.head}>
          <Label>Banking</Label>
          <Text variant="display">
            Account <Em>activity.</Em>
          </Text>
          <Text variant="muted">Everything this address did on {chain.name}. Tap a row to open it in the explorer.</Text>
          {source === "rpc" ? (
            <Notice>Read straight from chain logs because the explorer is unreachable. Token transfers only.</Notice>
          ) : null}
          {activity.error ? <Notice tone="bad">{(activity.error as Error).message}</Notice> : null}
        </View>
      }
      ListEmptyComponent={
        activity.isLoading ? (
          <ActivityIndicator color={colors.accent} style={styles.loading} />
        ) : (
          <Text variant="faint">No activity on {chain.short} yet.</Text>
        )
      }
      ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={styles.loading} /> : null}
    />
  );
}

const keyOf = (i: ActivityItem) => i.id;

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.bg },
  content: { paddingHorizontal: gutter, paddingBottom: 40 },
  head: { gap: 14, paddingTop: 16, paddingBottom: 12 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  loading: { paddingVertical: 24 },
});
