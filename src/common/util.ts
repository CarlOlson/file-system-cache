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

export const readFileSync = (path: string) => {
  return fs.existsSync(path) ? fs.readFileSync(path).toString() : undefined;
};

export const filePathsP = async (basePath: string, ns: string): Promise<string[]> => {
  try {
    return (await fsp.readdir(basePath))
      .filter(Boolean)
      .filter((name) => (ns ? name.startsWith(ns) : true))
      .filter((name) => (!ns ? !name.includes('-') : true))
      .map((name) => `${basePath}/${name}`);
  } catch (error: any) {
    if (error.code === 'ENOENT') return [];
    throw error;
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
export async function getValueP(path: string, defaultValue?: any) {
  try {
    return toGetValue(JSON.parse(await fsp.readFile(path, 'utf8')));
  } catch (error: any) {
    if (error.code === 'ENOENT') return defaultValue;
    if (error.message === 'Cache item has expired.') {
      fs.rmSync(path, { force: true });
      return defaultValue;
    }
    throw new Error(`Failed to read cache value at: ${path}. ${error.message}`);
  }
}

/**
 * Format value structure.
 */
export const toGetValue = (data: any) => {
  if (isExpired(data)) return undefined;
  if (data.type === 'Date') return new Date(data.value);
  return data.value;
};

/**
 * Stringify a value into JSON.
 */
export const toJson = (value: any, ttl: number) =>
  JSON.stringify({
    value,
    type: Object.prototype.toString.call(value).slice(8, -1),
    created: new Date(),
    ttl,
  });

/**
 * Check's a cache item to see if it has expired.
 */
export const isExpired = (data: any) => {
  const timeElapsed = (Date.now() - new Date(data.created).getTime()) / 1000;
  return timeElapsed > data.ttl && data.ttl > 0;
};
