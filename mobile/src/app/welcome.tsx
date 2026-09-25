import { StyleSheet, View } from "react-native";
import { useAppKit } from "@reown/appkit-react-native";
import { Button, Em, Label, Logomark, Screen, Text, Wordmark } from "@/ui";
import { colors, fonts } from "@/theme/tokens";

const STEPS = [
  { title: "Sign in", body: "Use Google, email or any wallet. Social login means there's no seed phrase to look after." },
  { title: "Get your card", body: "Add your name and sign once. That signature creates your spending credential and never moves funds." },
  { title: "Pay by permission", body: "Authorize payments inside the limits you set, on Robinhood Chain or Ethereum." },
];

/** Signed-out screen: the website hero, composed for a phone. */
export default function Welcome() {
  const { open } = useAppKit();
  return (
    <Screen>
      <View style={styles.brand}>
        <Logomark size={30} />
        <Wordmark height={18} />
      </View>

      <View style={styles.hero}>
        <Label>CassaFi app</Label>
        <Text variant="display" style={styles.h1}>
          Open your account,{"\n"}
          <Em>off the record.</Em>
        </Text>
        <Text variant="muted">Connect to get your card, set your spending rules and authorize payments without putting your balance on show.</Text>
        <View style={styles.cta}>
          <Button label="Sign in or connect wallet" onPress={() => open()} />
          <Text variant="label" style={styles.nets}>
            Robinhood Chain · Ethereum
          </Text>
        </View>
      </View>

      <View style={styles.steps}>
        {STEPS.map((s, i) => (
          <View key={s.title} style={styles.step}>
            <Text style={styles.stepN}>{String(i + 1).padStart(2, "0")}</Text>
            <Text variant="title">{s.title}</Text>
            <Text variant="muted">{s.body}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6 },
  hero: { gap: 18, paddingTop: 36, paddingBottom: 28 },
  h1: { fontSize: 44, lineHeight: 50 },
  cta: { gap: 14, paddingTop: 8 },
  nets: { color: colors.fg3, textAlign: "center" },
  steps: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  step: { gap: 8, paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  stepN: { fontFamily: fonts.mono, fontSize: 12, letterSpacing: 1.8, color: colors.accent },
});
