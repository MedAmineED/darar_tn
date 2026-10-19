import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { AppConfigService } from '../../config/app-config.service';
import { SaveFileOptions, StoredFile, StorageProvider } from './storage.types';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

/** Stores files on the local filesystem under the configured uploads dir. */
@Injectable()
export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;

  constructor(config: AppConfigService) {
    this.baseDir = config.uploads.dir;
  }

  async save(buffer: Buffer, options: SaveFileOptions): Promise<StoredFile> {
    const ext =
      extname(options.originalName).toLowerCase() ||
      MIME_EXTENSIONS[options.mimeType] ||
      '';
    const fileName = `${randomUUID()}${ext}`;
    const key = `${options.folder}/${fileName}`;
    const absolutePath = join(this.baseDir, key);

    await mkdir(join(this.baseDir, options.folder), { recursive: true });
    await writeFile(absolutePath, buffer);

    return { url: `/uploads/${key}`, key };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.baseDir, key));
    } catch (error) {
      // Missing file is not an error for our purposes.
      if (
        !(error instanceof Error) ||
        (error as NodeJS.ErrnoException).code !== 'ENOENT'
      ) {
        throw error;
      }
    }
  }
}
