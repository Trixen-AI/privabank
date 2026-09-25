import { useFonts } from "expo-font";

/** Web preview only: config-plugin fonts don't apply to web, so load them at runtime. */
export function useBrandFonts() {
  const [loaded, error] = useFonts({
    "GeneralSans-Regular": require("../../assets/fonts/GeneralSans-Regular.otf"),
    "GeneralSans-Medium": require("../../assets/fonts/GeneralSans-Medium.otf"),
    "GeneralSans-Semibold": require("../../assets/fonts/GeneralSans-Semibold.otf"),
    "Newsreader-Italic": require("../../assets/fonts/Newsreader-Italic.ttf"),
    "DMMono-Regular": require("../../assets/fonts/DMMono-Regular.ttf"),
    "DMMono-Medium": require("../../assets/fonts/DMMono-Medium.ttf"),
  });
  return loaded || !!error;
}
