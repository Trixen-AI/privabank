/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REOWN_PROJECT_ID?: string;
  readonly VITE_RELAYER_URL?: string;
  readonly VITE_PRIVA_TOKEN_ADDRESS?: string;
  readonly VITE_PRIVA_TOKEN_CHAIN_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
