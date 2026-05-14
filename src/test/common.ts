import { expect } from 'chai';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as fsPath from 'node:path';
import { FileSystemCache } from '..';
import * as Util from '../common/util.ts';
import type * as t from '../types.ts';

export { afterAll, afterEach, beforeAll, beforeEach, describe, it } from 'vitest';
export { FileSystemCache, Util, crypto, expect, fsPath };
export type { t };

export const BasePath = {
  root: './.tmp',
  random(prefix: string = 'cache') {
    const random = Math.floor(Math.random() * 9999) + 1;
    const text = `${prefix}.${random}`;
    return fsPath.resolve(BasePath.root, text);
  },
} as const;

export const deleteTmpDir = async (basePath?: string) => {
  const path = fsPath.resolve(basePath || BasePath.root);
  fs.rmSync(path, { recursive: true, force: true });
};

export const Sleep = {
  msecs: (delay: number) => new Promise<void>((resolve) => setTimeout(resolve, delay)),
  secs: (delay: number) => Sleep.msecs(delay * 1000),
} as const;

/**
 * Checks for an error within an async function.
 * Example:
 *    Return the result of this function to the test-runner (mocha).
 *
 *        it('should throw', () =>
 *            expectError(async () => {
 *
 *                 <...code that throws here...>
 *
 *          }, 'my error message'));
 *
 */
export async function expectError(fn: () => Promise<any>, message?: string) {
  try {
    await fn();
  } catch (error: any) {
    if (message) {
      return expect(error.message || '').to.contain(message);
    } else {
      return error;
    }
  }
  const msg = message ? `Promise should fail with error message '${message || ''}'` : 'Promise should fail with error';
  return expect(undefined).to.be.a('Error', msg);
}
