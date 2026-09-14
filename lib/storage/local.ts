/**
 * Local filesystem storage provider — development only.
 * Files are written to the OS temp directory so they are never committed
 * and never served via /public.
 * Served via /api/uploads/[key] route handler in dev.
 */

import fs from "fs/promises";
import path from "path";
import os from "os";
import type { StorageProvider } from "./types";

const UPLOAD_DIR = path.join(os.tmpdir(), "meyunarvu-uploads");

async function ensureDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export const localProvider: StorageProvider = {
  async upload(buffer, filename, _contentType) {
    await ensureDir();
    // Prefix with timestamp to avoid collisions
    const key = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    await fs.writeFile(path.join(UPLOAD_DIR, key), buffer);
    // URL served by the dev API route
    const url = `/api/uploads/${key}`;
    return { url, storageKey: key };
  },

  async delete(storageKey) {
    try {
      await fs.unlink(path.join(UPLOAD_DIR, storageKey));
    } catch {
      // File may already be gone — not an error
    }
  },
};
