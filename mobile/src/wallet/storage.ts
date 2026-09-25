import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Storage } from "@reown/appkit-react-native";

/**
 * AppKit's session storage on top of AsyncStorage. Values are JSON so objects
 * survive a restart; anything that fails to parse is returned as the raw string.
 */
const parse = <T>(raw: string | null): T | undefined => {
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
};

export const appKitStorage: Storage = {
  async getKeys() {
    return [...(await AsyncStorage.getAllKeys())];
  },
  async getEntries<T = unknown>() {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    return pairs.map(([k, v]) => [k, parse<T>(v) as T] as [string, T]);
  },
  async getItem<T = unknown>(key: string) {
    return parse<T>(await AsyncStorage.getItem(key));
  },
  async setItem<T = unknown>(key: string, value: T) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  },
};
