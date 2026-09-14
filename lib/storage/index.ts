/**
 * Active storage provider, selected by STORAGE_PROVIDER env var.
 *
 * Values:
 *   "local"        → dev filesystem (never use in production)
 *   "vercel-blob"  → Vercel Blob (default for Vercel deployments)
 *
 * To add a new provider:
 *   1. Create lib/storage/<name>.ts implementing StorageProvider
 *   2. Add a case below
 *   3. Set STORAGE_PROVIDER=<name> in env
 */

import type { StorageProvider } from "./types";

function getProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  switch (provider) {
    case "vercel-blob": {
      // Dynamic require keeps Vercel Blob out of the dev bundle
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { vercelBlobProvider } = require("./vercel-blob");
      return vercelBlobProvider as StorageProvider;
    }
    case "local":
    default: {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { localProvider } = require("./local");
      return localProvider as StorageProvider;
    }
  }
}

export const storage: StorageProvider = getProvider();
export type { StorageProvider };
