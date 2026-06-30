"use client";

import { useEffect } from "react";

// Registers the service worker (production only — a SW in dev caches stale assets
// and fights HMR). Failure is non-fatal: the app just won't be offline-capable.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }
    if (!("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // ignore: offline support is an enhancement, not a requirement
    });
  }, []);
  return null;
}
