import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as fsPath from 'node:path';
import * as v8 from 'node:v8';

export const isString = (value: unknown): value is string => typeof value === 'string';

export const toAbsolutePath = (path: string) => {
  return path.startsWith('.') ? fsPath.resolve(path) : path;
};

export const ensureString = (defaultValue: string, text?: string): string => {
  return typeof text === 'string' ? text : defaultValue;
};

export const isFileSync = (path: string) => {
  return fs.existsSync(path) ? fs.lstatSync(path).isFile() : false;
};

export const filePathsP = async (basePath: string, ns?: string): Promise<string[]> => {
  const dir = ns ? fsPath.join(basePath, ns) : basePath;
  try {
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => fsPath.join(dir, entry.name));
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') return [];
    throw error;
  }
};

/**
 * cyrb53 (c) 2018 bryc (github.com/bryc)
 * License: Public domain (or MIT if needed). Attribution appreciated.
 * A fast and simple 53-bit string hash function with decent collision resistance.
 * Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
 */
function cyrb53(str: string, seed: number = 0): number {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/**
 * Returns a filename safe cyrb53 hash of input string, padded to a fixed
 * 11-char width (max length of a 53-bit integer in base36).
 */
function cyrb53String(str: string, seed: number = 0): string {
  return cyrb53(str, seed).toString(36).padStart(11, '0');
}

/**
 * Hash a string or array of strings into a filename-safe identifier.
 * An empty array returns `undefined`; all other inputs return an 11-char hash.
 */
export function hash(values: string): string;
export function hash(values: string[]): string | undefined;
export function hash(values: string | string[]): string | undefined {
  if (Array.isArray(values) && values.length === 0) return undefined;
  return cyrb53String(Array.isArray(values) ? values.join() : values);
}

/**
 * Retrieve a value from the given path. When `expectedKey` is provided, the
 * stored entry's key must match it — otherwise the file is treated as a miss
 * (covers hash collisions where two distinct keys map to the same filename).
 */
export async function getValueP<T>(
  path: string,
  defaultValue?: T,
  expectedKey?: string,
): Promise<T | undefined> {
  try {
    return deserialize(await fsp.readFile(path), expectedKey) as T;
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return defaultValue;
    } else if (error instanceof Error) {
      throw new Error(`Failed to read cache value at: ${path}. ${error.message}`);
    } else {
      throw error;
    }
  }
}

type CacheEntry = {
  key: string;
  value: unknown;
  created: Date;
  ttl: number;
};

/**
 * Decode a cache entry buffer and unwrap the stored value. Returns `undefined`
 * on key mismatch (hash collision), expiry, or any decoding failure (corrupt
 * file, partial write, future v8 format from a Node downgrade).
 */
export const deserialize = (buf: Buffer, expectedKey?: string): unknown => {
  try {
    const data = v8.deserialize(buf) as CacheEntry;
    if (expectedKey !== undefined && data.key !== expectedKey) return undefined;
    if (isExpired(data)) return undefined;
    return data.value;
  } catch {
    return undefined;
  }
};

/**
 * Encode a value into a cache entry buffer. The original key is stored so
 * reads can detect hash collisions.
 */
export function serialize<T>(key: string, value: T, ttl: number): Buffer {
  const entry: CacheEntry = { key, value, created: new Date(), ttl };
  return v8.serialize(entry);
}

const isExpired = (data: CacheEntry): boolean => {
  const timeElapsed = (Date.now() - data.created.getTime()) / 1000;
  return timeElapsed > data.ttl && data.ttl > 0;
};

const isErrnoException = (error: unknown): error is NodeJS.ErrnoException => {
  return error instanceof Error && 'code' in error;
};

export function formatPath(path?: string): string {
  path = ensureString('./.cache', path);
  path = toAbsolutePath(path);
  return path;
}
