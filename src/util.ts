import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as fsPath from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import * as v8 from 'node:v8';
import * as zlib from 'node:zlib';

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

export async function* filePaths(basePath: string, ns?: string): AsyncIterable<string> {
  const dir = ns ? fsPath.join(basePath, ns) : basePath;
  let handle: fs.Dir;
  try {
    handle = await fsp.opendir(dir);
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') return;
    throw error;
  }
  for await (const entry of handle) {
    if (entry.isFile()) yield fsPath.join(dir, entry.name);
  }
}

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
  compress?: boolean
): Promise<T | undefined> {
  try {
    const buf = compress ? await readDecompressed(path) : await fsp.readFile(path);
    if (buf === undefined) return undefined;
    return deserialize(buf, expectedKey) as T;
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

/**
 * Stream a zstd-compressed file from disk through a decompressor, concatenating
 * the decoded chunks. The compressed payload is never held fully in memory.
 * Returns `undefined` if the file is not a valid zstd stream (treated as a
 * corrupt-cache miss by callers).
 */
async function readDecompressed(path: string): Promise<Buffer | undefined> {
  const chunks: Buffer[] = [];
  try {
    await pipeline(fs.createReadStream(path), zlib.createZstdDecompress(), async (source) => {
      for await (const chunk of source) chunks.push(chunk as Buffer);
    });
  } catch (error) {
    if (isErrnoException(error) && error.code === 'ENOENT') throw error;
    return undefined;
  }
  return Buffer.concat(chunks);
}

/**
 * Stream a buffer through a zstd compressor to disk. Avoids holding the full
 * compressed payload in memory — chunks flow to the file as they are produced.
 */
export async function writeCompressed(path: string, buf: Buffer): Promise<void> {
  await pipeline(Readable.from(buf), zlib.createZstdCompress(), fs.createWriteStream(path));
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

export const compressSync = (buf: Buffer): Buffer => zlib.zstdCompressSync(buf) as Buffer;
export const decompressSync = (buf: Buffer): Buffer => zlib.zstdDecompressSync(buf) as Buffer;

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
