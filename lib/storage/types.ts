/** Shared interface for all storage providers. */
export interface StorageProvider {
  /**
   * Upload a file and return its public URL and a provider-specific key
   * that can be passed to `delete()` later.
   */
  upload(
    buffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<{ url: string; storageKey: string }>;

  /** Delete a previously uploaded file by its storage key. */
  delete(storageKey: string): Promise<void>;
}
