import { NativeTabs } from "expo-router/unstable-native-tabs";
import { colors, fonts } from "@/theme/tokens";

/** Native tab bar (UITabBarController / Material bottom navigation), four destinations. */
export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.bg}
      tintColor={colors.accent}
      iconColor={{ default: colors.fg3, selected: colors.accent }}
      indicatorColor={colors.accentSoft}
      labelStyle={{ default: { color: colors.fg3, fontFamily: fonts.sansMedium }, selected: { color: colors.fg, fontFamily: fonts.sansMedium } }}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="pay">
        <NativeTabs.Trigger.Label>Pay</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "paperplane", selected: "paperplane.fill" }} md="send" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="activity">
        <NativeTabs.Trigger.Label>Activity</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet.rectangle" md="receipt_long" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="card">
        <NativeTabs.Trigger.Label>Card</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} md="credit_card" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
