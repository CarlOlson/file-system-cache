import { FileSystemCache } from './FileSystemCache.ts';
import type * as t from './types.ts';

/**
 * Default entry function.
 */
export default (options?: t.FileSystemCacheOptions) => new FileSystemCache(options);
export { FileSystemCache, FileSystemCache as Cache };
