import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as Util from './util.ts';
import type * as t from './types.ts';

/**
 * A cache that read/writes to a specific part of the file-system.
 */
class FileSystemCache {
  /**
   * Instance.
   */
  readonly tmpDir?: fs.DisposableTempDir;
  readonly basePath: string;
  readonly ns?: string;
  readonly extension?: string;
  readonly ttl: number;
  basePathExists?: boolean;

  /**
   * Constructor.
   * @param options
   *            - basePath:   The folder path to read/write to.
   *                          Default: './build'
   *            - ns:         A single value, or array, that represents a
   *                          a unique namespace within which values for this
   *                          store are cached.
   *            - extension:  An optional file-extension for paths.
   *            - ttl:        The default time-to-live for cached values in seconds.
   *                          Default: 0 (never expires)
   */
  constructor(options: t.FileSystemCacheOptions = {}) {
    this.tmpDir = options.tmpDir;
    this.basePath = Util.formatPath(options.basePath ?? options.tmpDir?.path);
    this.ns = options.ns != null ? Util.hash(options.ns) : undefined;
    this.ttl = options.ttl ?? 0;
    if (Util.isString(options.extension)) this.extension = options.extension;

    if (Util.isFileSync(this.basePath)) {
      throw new Error(`The basePath '${this.basePath}' is a file. It should be a folder.`);
    }
  }

  /**
   * Generates the path to the cached files.
   * @param {string} key: The key of the cache item.
   */
  public path(key: string): string {
    if (!Util.isString(key)) throw new Error(`Path requires a cache key.`);
    let name = Util.hash(key);
    if (this.ns) name = `${this.ns}-${name}`;
    if (this.extension) name = `${name}.${this.extension.replace(/^\./, '')}`;
    return `${this.basePath}/${name}`;
  }

  /**
   * Ensure that the base path exists.
   */
  public async ensureBasePath() {
    if (!this.tmpDir && !this.basePathExists) {
      await fs.promises.mkdir(this.basePath, { recursive: true });
      this.basePathExists = true;
    }
  }

  /**
   * Gets the contents of the file with the given key.
   * @param {string} key: The key of the cache item.
   * @param defaultValue: Optional. A default value to return if the value does not exist in cache.
   * @return File contents, or
   *         undefined if the file does not exist.
   */
  public get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    return Util.getValueP(this.path(key), defaultValue);
  }

  /**
   * Gets the contents of the file with the given key.
   * @param {string} key: The key of the cache item.
   * @param defaultValue: Optional. A default value to return if the value does not exist in cache.
   * @return the cached value, or undefined.
   */
  public getSync<T>(key: string, defaultValue?: T): T | undefined {
    const path = this.path(key);
    return fs.existsSync(path) ? (Util.toGetValue(fs.readFileSync(path, 'utf8')) as T) : defaultValue;
  }

  /**
   * Writes the given value to the file-system.
   * @param {string} key: The key of the cache item.
   * @param value: The value to write (Primitive or Object).
   */
  public async set<T>(key: string, value: T, ttl?: number) {
    const path = this.path(key);
    ttl = typeof ttl === 'number' ? ttl : this.ttl;
    await this.ensureBasePath();
    await fs.promises.writeFile(path, Util.toJson(value, ttl));
    return { path };
  }

  /**
   * Writes the given value to the file-system and memory cache.
   * @param {string} key: The key of the cache item.
   * @param value: The value to write (Primitive or Object).
   * @return the cache.
   */
  public setSync<T>(key: string, value: T, ttl?: number) {
    ttl = typeof ttl === 'number' ? ttl : this.ttl;
    fs.mkdirSync(this.basePath, { recursive: true });
    fs.writeFileSync(this.path(key), Util.toJson(value, ttl));
    return this;
  }

  /**
   * Removes the item from the file-system.
   * @param {string} key: The key of the cache item.
   */
  public remove(key: string) {
    return fs.promises.rm(this.path(key), { force: true });
  }

  /**
   * Removes all items from the cache.
   */
  public async clear() {
    const paths = await Util.filePathsP(this.basePath, this.ns);
    await Promise.all(paths.map((path) => fs.promises.rm(path, { force: true })));
    console.groupEnd();
  }

  /**
   * Loads all files within the cache's namespace.
   */
  public async load(): Promise<{ files: { path: string; value: unknown }[] }> {
    const paths = await Util.filePathsP(this.basePath, this.ns);
    if (paths.length === 0) return { files: [] };
    const files = await Promise.all(paths.map(async (path) => ({ path, value: await Util.getValueP(path) })));
    return { files };
  }

  /**
   * Creates a temporary folder that is automatically deleted when using a `using` declaration.
   */
  static disposable(options: Omit<t.FileSystemCacheOptions, 'basePath'> = {}) {
    const tmpDir = fs.mkdtempDisposableSync(path.join(os.tmpdir(), 'node-file-system-cache-'));
    return new FileSystemCache({ ...options, tmpDir });
  }

  public [Symbol.dispose]() {
    if (this.tmpDir) {
      this.tmpDir[Symbol.dispose]();
    } else {
      throw new Error(`Do not use with 'using' declaration except via FileSystemCache.disposable()`);
    }
  }
}

export default (options?: t.FileSystemCacheOptions) => new FileSystemCache(options);
export { FileSystemCache, FileSystemCache as Cache };
