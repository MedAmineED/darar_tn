export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

export interface StoredFile {
  /** Public URL/path used by clients (e.g. "/uploads/products/abc.jpg"). */
  url: string;
  /** Opaque key used to delete the file later (e.g. "products/abc.jpg"). */
  key: string;
}

export interface SaveFileOptions {
  folder: string;
  originalName: string;
  mimeType: string;
}

/**
 * Storage abstraction. Swapping local disk for S3/Cloudinary means providing a
 * different implementation of this interface — product logic stays untouched.
 */
export interface StorageProvider {
  save(buffer: Buffer, options: SaveFileOptions): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}
