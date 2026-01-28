// netlify/functions/_store.ts
import { getStore } from "@netlify/blobs";

export type StoreName = "qc-hub";

export function hubStore() {
  // Strong consistency so admin updates appear immediately
  return getStore({ name: "qc-hub", consistency: "strong" });
}

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  const store = hubStore();
  const val = await store.get(key, { type: "json", consistency: "strong" });
  return (val ?? fallback) as T;
}

export async function setJSON(key: string, value: unknown) {
  const store = hubStore();
  await store.setJSON(key, value);
}
