import { fetch as tauriFetch } from "@tauri-apps/plugin-http";

export const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  // @ts-ignore - types mismatch slightly but compatible at runtime
  return tauriFetch(input, init);
};
