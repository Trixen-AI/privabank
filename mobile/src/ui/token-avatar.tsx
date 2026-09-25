import { memo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { colors, fonts } from "@/theme/tokens";
import { Text } from "./text";

const TINTS = [
  { bg: "rgba(63, 224, 174, 0.16)", fg: colors.jade100 },
  { bg: "rgba(207, 217, 213, 0.14)", fg: colors.fog },
  { bg: "rgba(239, 235, 225, 0.14)", fg: colors.bone },
  { bg: "rgba(15, 174, 128, 0.22)", fg: colors.jade200 },
  { bg: colors.bg3, fg: colors.fg2 },
];

/** Token icon from the explorer when there is one, else initials on a tint picked from the address. */
export const TokenAvatar = memo(function TokenAvatar({
  symbol,
  address,
  icon,
  size = 36,
}: {
  symbol: string;
  address: string;
  icon?: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (icon && !broken) {
    return (
      <Image
        source={{ uri: icon }}
        style={box}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={address}
        transition={120}
        onError={() => setBroken(true)}
      />
    );
  }
  const tint = TINTS[parseInt(address.slice(2, 8) || "0", 16) % TINTS.length];
  return (
    <View style={[styles.initials, box, { backgroundColor: tint.bg }]}>
      <Text style={[styles.initialsText, { color: tint.fg, fontSize: size * 0.3 }]}>
        {symbol.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "?"}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  initials: { alignItems: "center", justifyContent: "center" },
  initialsText: { fontFamily: fonts.monoMedium, lineHeight: undefined },
});
