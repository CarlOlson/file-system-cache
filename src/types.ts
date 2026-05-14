import type { HashAlgorithm } from './types.hashes';
import type { DisposableTempDir } from 'node:fs';
export type { HashAlgorithm };

export type FileSystemCacheOptions =
  | {
      basePath?: string;
      tmpDir?: never;
      ns?: any;
      ttl?: number;
      hash?: HashAlgorithm;
      extension?: string;
    }
  | {
      basePath?: never;
      tmpDir?: DisposableTempDir;
      ns?: any;
      ttl?: number;
      hash?: HashAlgorithm;
      extension?: string;
    };
