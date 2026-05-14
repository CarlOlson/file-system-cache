import type { DisposableTempDir } from 'node:fs';
import type { HashAlgorithm } from './types.hashes';

export type { HashAlgorithm };

export type Namespace = string | string[];

export type FileSystemCacheOptions =
  | {
      basePath?: string;
      tmpDir?: never;
      ns?: Namespace;
      ttl?: number;
      hash?: HashAlgorithm;
      extension?: string;
    }
  | {
      basePath?: never;
      tmpDir?: DisposableTempDir;
      ns?: Namespace;
      ttl?: number;
      hash?: HashAlgorithm;
      extension?: string;
    };
