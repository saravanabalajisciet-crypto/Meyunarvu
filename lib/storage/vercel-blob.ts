/**
 * Vercel Blob storage provider — production default.
 * Requires BLOB_READ_WRITE_TOKEN in environment.
 */

import { put, del } from "@vercel/blob";
import type { StorageProvider } from "./types";

export const vercelBlobProvider: StorageProvider = {
  async upload(buffer, filename, contentType) {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return { url: blob.url, storageKey: blob.url };
  },

  async delete(storageKey) {
    await del(storageKey);
  },
};
