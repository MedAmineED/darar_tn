import { Global, Module } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { STORAGE_PROVIDER } from './storage.types';

/**
 * Binds the StorageProvider token to a concrete implementation. Switch to a
 * cloud provider by changing only the `useClass` here.
 */
@Global()
@Module({
  providers: [{ provide: STORAGE_PROVIDER, useClass: LocalStorageProvider }],
  exports: [STORAGE_PROVIDER],
})
export class StorageModule {}
