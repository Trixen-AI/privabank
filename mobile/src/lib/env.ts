/**
 * Runtime configuration. Expo inlines EXPO_PUBLIC_* variables at build time;
 * set them in mobile/.env locally and in EAS (environment variables) for
 * cloud builds. Only the Reown project ID is required.
 */
export const REOWN_PROJECT_ID: string = (process.env.EXPO_PUBLIC_REOWN_PROJECT_ID ?? "").trim();

/** Relayer base URL. Without it, authorizations settle from the user's wallet. */
export const RELAYER_URL: string = (process.env.EXPO_PUBLIC_RELAYER_URL ?? "").trim().replace(/\/+$/, "");
