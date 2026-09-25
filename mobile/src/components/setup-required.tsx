import { StyleSheet } from "react-native";
import { Card, Em, PageHead, Screen, Text } from "@/ui";
import { colors, fonts, radius } from "@/theme/tokens";

/** Shown when the build has no Reown project ID: there is nothing to connect with yet. */
export function SetupRequired() {
  return (
    <Screen>
      <PageHead
        label="Setup required"
        title={
          <>
            Almost <Em>ready.</Em>
          </>
        }
        sub="Wallet sign-in runs through Reown AppKit, which needs a project ID."
      />
      <Card>
        <Text variant="muted">
          Create a free project at dashboard.reown.com, then add its ID to mobile/.env (or to your EAS environment variables for cloud builds):
        </Text>
        <Text style={styles.code}>EXPO_PUBLIC_REOWN_PROJECT_ID=your_project_id</Text>
        <Text variant="faint">Restart Expo after saving. The same project as the website works.</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  code: {
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.jade200,
    backgroundColor: colors.bg,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
    padding: 12,
  },
});
