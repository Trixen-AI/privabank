import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { router } from "expo-router";
import { formatUnits } from "viem";
import { Badge, BankCard, Button, Card, CardHead, Em, Label, Meter, Notice, Text, TokenAvatar } from "@/ui";
import { ActivityRow } from "@/components/activity-row";
import { TopBar } from "@/components/top-bar";
import { flattenActivity, useActivity, usePortfolio, useWallet } from "@/hooks/data";
import { deriveCard } from "@/lib/card";
import { chainMeta } from "@/lib/chains";
import type { ActivityItem, Holding, Portfolio } from "@/lib/data";
import { fmtAmount, fmtUsd } from "@/lib/format";
import { spentToday } from "@/lib/protocol";
import { useWalletData, type WalletData } from "@/lib/store";
import { useTopInset } from "@/hooks/use-top-inset";
import { colors, gutter, radius } from "@/theme/tokens";

/**
 * Home: balance, card, today's limits and recent activity. The whole screen
 * is one virtualised list; everything above the activity rows is its header.
 */
export default function Home() {
  const w = useWallet();
  const top = useTopInset();
  const { data } = useWalletData(w.address);
  const portfolio = usePortfolio(w.chainId, w.address);
  const activity = useActivity(w.chainId, w.address);
  const recent = useMemo(() => flattenActivity(activity.data?.pages).slice(0, 8), [activity.data]);

  const renderItem: ListRenderItem<ActivityItem> = useCallback(({ item }) => <ActivityRow item={item} />, []);
  const refresh = useCallback(() => {
    void portfolio.refetch();
    void activity.refetch();
  }, [portfolio, activity]);

  return (
    <FlashList
      data={recent}
      renderItem={renderItem}
      keyExtractor={keyOf}
      contentInsetAdjustmentBehavior="automatic"
      style={styles.list}
      contentContainerStyle={{ ...styles.content, paddingTop: top }}
      ItemSeparatorComponent={Separator}
      refreshing={portfolio.isRefetching}
      onRefresh={refresh}
      ListHeaderComponent={
        <HomeHeader
          chainId={w.chainId}
          unsupported={w.unsupported}
          portfolio={portfolio.data}
          loading={portfolio.isLoading}
          error={portfolio.error}
          data={data}
          activityLoading={activity.isLoading}
          activityEmpty={!activity.isLoading && recent.length === 0}
        />
      }
    />
  );
}

const keyOf = (i: ActivityItem) => i.id;

function Separator() {
  return <View style={styles.sep} />;
}

function HomeHeader({
  chainId,
  unsupported,
  portfolio,
  loading,
  error,
  data,
  activityLoading,
  activityEmpty,
}: {
  chainId: number;
  unsupported: boolean;
  portfolio: Portfolio | undefined;
  loading: boolean;
  error: unknown;
  data: WalletData;
  activityLoading: boolean;
  activityEmpty: boolean;
}) {
  const chain = chainMeta(chainId);
  const held = portfolio?.holdings.filter((h) => h.raw > 0n) ?? [];
  const c = data.credential;

  return (
    <View style={styles.header}>
      <TopBar />
      <View style={styles.head}>
        <Label>Overview</Label>
        <Text variant="display">
          Your <Em>account.</Em>
        </Text>
      </View>

      {unsupported ? <Notice tone="warn">Your wallet is on a network CassaFi doesn&apos;t run on. Showing Robinhood Chain until you switch.</Notice> : null}

      {/* Balance: the page's big figure, set like the website's "< 2s". */}
      <Card style={styles.balance}>
        <View style={styles.balanceHead}>
          <Label>Wallet balance</Label>
          <Badge>{`Public on ${chain.short}`}</Badge>
        </View>
        {loading ? (
          <View style={styles.skel} />
        ) : error ? (
          <Text tone="danger">{(error as Error).message}</Text>
        ) : (
          <>
            <Text variant="figure" adjustsFontSizeToFit numberOfLines={1}>
              {portfolio && portfolio.totalUsd > 0
                ? fmtUsd(portfolio.totalUsd)
                : held.length
                  ? `${fmtAmount(held[0].raw, held[0].decimals)} ${held[0].symbol}`
                  : "$0.00"}
            </Text>
            <Text variant="faint">
              {held.length} asset{held.length === 1 ? "" : "s"}
              {portfolio && portfolio.unpriced > 0 ? ` · ${portfolio.unpriced} without a reliable price` : ""}
            </Text>
            {held.length ? (
              <View style={styles.assets}>
                {held.slice(0, 4).map((h) => (
                  <AssetChip key={h.token} h={h} />
                ))}
                {held.length > 4 ? (
                  <View style={styles.asset}>
                    <Text variant="faint">+{held.length - 4} more</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </>
        )}
        <View style={styles.row2}>
          <View style={styles.flex}>
            <Button label="Pay" onPress={() => router.navigate("/pay")} />
          </View>
          <View style={styles.flex}>
            <Button label="Activity" variant="line" onPress={() => router.navigate("/activity")} />
          </View>
        </View>
      </Card>

      {c?.holderName ? (
        <View style={styles.cardBlock}>
          <BankCard card={deriveCard(c.id, c.issuedAt)} holder={c.holderName} showControls={false} />
        </View>
      ) : (
        <Card>
          <CardHead label="Your card" title="Not issued yet" />
          <Text variant="muted">Add your name and sign once to get your CassaFi card. Signing doesn&apos;t move funds.</Text>
          <Button label="Get your card" size="sm" onPress={() => router.navigate("/card")} />
        </Card>
      )}

      <Limits data={data} chainId={chainId} holdings={portfolio?.holdings ?? []} />

      <View style={styles.recentHead}>
        <Label>Recent activity</Label>
        {activityLoading ? <Text variant="faint">Loading…</Text> : null}
      </View>
      {activityEmpty ? <Text variant="faint">Transfers to and from this address on {chain.short} will appear here.</Text> : null}
    </View>
  );
}

function AssetChip({ h }: { h: Holding }) {
  return (
    <View style={styles.asset}>
      <TokenAvatar symbol={h.symbol} address={h.token} icon={h.icon} size={24} />
      <Text style={styles.assetText} numberOfLines={1}>
        {fmtAmount(h.raw, h.decimals)} {h.symbol}
      </Text>
    </View>
  );
}

function Limits({ data, chainId, holdings }: { data: WalletData; chainId: number; holdings: Holding[] }) {
  const rows = Object.entries(data.policy.dailyLimits)
    .filter(([k]) => k.startsWith(`${chainId}:`))
    .flatMap(([k, cap]) => {
      const h = holdings.find((x) => x.token.toLowerCase() === k.split(":")[1]);
      if (!h) return [];
      return [{ h, cap, used: spentToday(data, chainId, h.token) }];
    });

  return (
    <Card>
      <CardHead label="Spending" title="Today's limits" />
      {rows.length ? (
        rows.map(({ h, cap, used }) => (
          <View key={h.token} style={styles.limit}>
            <View style={styles.limitRow}>
              <Text>{h.symbol}</Text>
              <Text variant="mono">
                {fmtAmount(used, h.decimals)} / {cap}
              </Text>
            </View>
            <Meter value={Number(formatUnits(used, h.decimals))} max={Number(cap)} />
          </View>
        ))
      ) : (
        <Text variant="muted">No daily limits on this network yet. Set one in Settings so a single authorization can never drain the account.</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.bg },
  content: { paddingHorizontal: gutter, paddingBottom: 40 },
  header: { gap: 16, paddingBottom: 4 },
  head: { gap: 14, paddingTop: 16 },
  balance: {
    borderRadius: radius.xl,
    experimental_backgroundImage: "radial-gradient(circle at 0% 0%, rgba(63, 224, 174, 0.14), transparent 60%)",
  },
  balanceHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  skel: { height: 52, width: "60%", borderRadius: radius.sm, backgroundColor: colors.bg3 },
  assets: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  asset: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 12,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    maxWidth: "100%",
  },
  assetText: { fontSize: 14, flexShrink: 1 },
  row2: { flexDirection: "row", gap: 10, paddingTop: 4 },
  flex: { flex: 1 },
  cardBlock: { paddingVertical: 4 },
  limit: { gap: 8 },
  limitRow: { flexDirection: "row", justifyContent: "space-between" },
  recentHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
});
