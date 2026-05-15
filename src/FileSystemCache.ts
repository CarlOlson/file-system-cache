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
    this.ns = options.ns ? Util.hash(options.ns as string[]) : undefined;
    this.ttl = options.ttl ?? 0;
    if (Util.isString(options.extension)) this.extension = options.extension.replace(/^\./, '');

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
    if (this.extension) name = `${name}.${this.extension}`;
    return this.ns ? path.join(this.basePath, this.ns, name) : path.join(this.basePath, name);
  }

  private writeDir(): string {
    return this.ns ? path.join(this.basePath, this.ns) : this.basePath;
  }

  /**
   * Ensure that the directory where entries are written exists.
   */
  public ensureBasePathSync() {
    if (this.basePathExists) return;
    fs.mkdirSync(this.writeDir(), { recursive: true });
    this.basePathExists = true;
  }

  /**
   * Ensure that the directory where entries are written exists.
   */
  public async ensureBasePath() {
    if (this.basePathExists) return;
    await fs.promises.mkdir(this.writeDir(), { recursive: true });
    this.basePathExists = true;
  }

  /**
   * Gets the contents of the file with the given key.
   * @param {string} key: The key of the cache item.
   * @param defaultValue: Optional. A default value to return if the value does not exist in cache.
   * @return File contents, or
   *         undefined if the file does not exist.
   */
  public get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    return Util.getValueP(this.path(key), defaultValue, key);
  }

  /**
   * Gets the contents of the file with the given key.
   * @param {string} key: The key of the cache item.
   * @param defaultValue: Optional. A default value to return if the value does not exist in cache.
   * @return the cached value, or undefined.
   */
  public getSync<T>(key: string, defaultValue?: T): T | undefined {
    const path = this.path(key);
    return fs.existsSync(path) ? (Util.deserialize(fs.readFileSync(path), key) as T) : defaultValue;
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
    await fs.promises.writeFile(path, Util.serialize(key, value, ttl));
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
    this.ensureBasePathSync();
    fs.writeFileSync(this.path(key), Util.serialize(key, value, ttl));
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
   * Removes all items from the cache. For a namespaced cache this removes the
   * namespace directory entirely; for a non-namespaced cache it removes the
   * flat entries (leaving any sibling namespace subdirectories intact).
   */
  public async clear() {
    if (this.ns) {
      await fs.promises.rm(path.join(this.basePath, this.ns), { recursive: true, force: true });
      this.basePathExists = false;
    } else {
      for await (const p of Util.filePaths(this.basePath)) {
        await fs.promises.rm(p, { force: true });
      }
    }
  }

  /**
   * Loads all files within the cache's namespace.
   */
  public async *load(): AsyncIterable<{ path: string; value: unknown }> {
    for await (const p of Util.filePaths(this.basePath, this.ns)) {
      yield { path: p, value: await Util.getValueP(p) };
    }
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
