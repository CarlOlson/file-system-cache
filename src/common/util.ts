import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as fsPath from 'node:path';
import type * as t from '../types.ts';

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
 * Turns a set of values into a HEX hash code.
 * @param values: The set of values to hash.
 */
export const hash = (algorithm: t.HashAlgorithm, values: string | string[]) => {
  const parts = Array.isArray(values) ? values : [values];
  if (parts.length === 0) return undefined;
  const resultHash = crypto.createHash(algorithm);
  for (const value of parts) resultHash.update(value);
  return resultHash.digest('hex');
};

export const hashExists = (algorithm: t.HashAlgorithm) => {
  return crypto.getHashes().includes(algorithm);
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
