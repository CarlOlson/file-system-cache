import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as Util from '../util.ts';
import { FileSystemCache } from '../FileSystemCache.ts';
import type * as t from '../types.ts';

describe('util', () => {
  describe('util.hash', () => {
    it('returns undefined for an empty array', () => {
      const test = (algorithm: t.HashAlgorithm) => {
        assert.equal(Util.hash(algorithm, []), undefined);
      };
      FileSystemCache.hashAlgorithms.forEach(test);
    });

    it('returns a hash of a single value', () => {
      const test = (algorithm: t.HashAlgorithm, expected: string) => {
        const result = Util.hash(algorithm, 'one');
        assert.equal(result, expected);
      };
      test('sha1', 'fe05bcdcdc4928012781a5f1a2a77cbb5398e106');
      test('sha256', '7692c3ad3540bb803c020b3aee66cd8887123234ea0c6e7143c0add73ff431ed');
    });

    it('returns a hash from an array', () => {
      const test = (algorithm: t.HashAlgorithm, expected: string) => {
        const result = Util.hash(algorithm, ['one', 'two']);
        assert.equal(result, expected);
      };
      test('sha1', '30ae97492ce1da88d0e7117ace0a60a6f9e1e0bc');
      test('sha256', '25b6746d5172ed6352966a013d93ac846e1110d5a25e8f183b5931f4688842a1');
    });
  });
});
