import type { DisposableTempDir } from 'node:fs';

export type Namespace = string | string[];

export type FileSystemCacheOptions =
  | {
      basePath?: string;
      tmpDir?: never;
      ns?: Namespace;
      ttl?: number;
      extension?: string;
      compress?: boolean;
    }
  | {
      basePath?: never;
      tmpDir?: DisposableTempDir;
      ns?: Namespace;
      ttl?: number;
      extension?: string;
      compress?: boolean;
    };
