import type { DisposableTempDir } from 'node:fs';

export type HashAlgorithm = string;

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
