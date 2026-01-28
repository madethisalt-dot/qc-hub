// netlify/functions/_store.ts
import { getStore } from "@netlify/blobs";

export type StoreName = "qc-hub";

export function hubStore() {
  // Strong consistency so admin updates appear immediately :contentReference[oaicite:6]{index=6}
  return getStore({ name: "qc-hub", consistency: "strong" });
}
