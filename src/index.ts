import { type t } from './common/index.ts';
import { FileSystemCache } from './FileSystemCache.ts';

/**
 * Default entry function.
 */
export default (options?: t.FileSystemCacheOptions) => new FileSystemCache(options);
export { FileSystemCache, FileSystemCache as Cache };
