import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as fsPath from 'node:path';

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
  try {
    return (await fsp.readdir(basePath))
      .filter(Boolean)
      .filter((name) => (ns ? name.startsWith(ns) : true))
      .filter((name) => (!ns ? !name.includes('-') : true))
      .map((name) => `${basePath}/${name}`);
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') {
      return [];
    } else {
      throw error;
    }
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
 * Returns a filename safe cyrb53 hash of input string
 */
function cyrb53String(str: string, seed: number = 0): string {
  return Number(cyrb53(str, seed)).toString(36);
}

/**
 * Turns a set of values into a HEX hash code.
 * @param values: The set of values to hash.
 */
export const hash = (values: string | string[]) => {
  if (Array.isArray(values) && values.length === 0) {
    return undefined;
  } else {
    return cyrb53String(Array.isArray(values) ? values.join() : values);
  }
};

/**
 * Retrieve a value from the given path.
 */
export async function getValueP<T>(path: string, defaultValue?: T): Promise<T | undefined> {
  try {
    return toGetValue(await fsp.readFile(path, 'utf8')) as T;
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
  value: unknown;
  type: string;
  created: string;
  ttl: number;
};

/**
 * Parse a cache entry's file contents and unwrap the stored value.
 */
export const toGetValue = (text: string): unknown => {
  const data = JSON.parse(text) as CacheEntry;
  if (isExpired(data)) return undefined;
  if (data.type === 'Date') return new Date(data.value as string);
  return data.value;
};

/**
 * Stringify a value into JSON.
 */
export function toJson<T>(value: T, ttl: number): string {
  return JSON.stringify({
    value,
    type: Object.prototype.toString.call(value).slice(8, -1),
    created: new Date(),
    ttl,
  });
}

const isExpired = (data: CacheEntry): boolean => {
  const timeElapsed = (Date.now() - new Date(data.created).getTime()) / 1000;
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
