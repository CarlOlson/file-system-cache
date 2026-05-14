import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { describe, it } from 'node:test';
import * as Util from '../common/util.ts';
import { FileSystemCache } from '../index.ts';
import type * as t from '../types.ts';

describe('common/util', () => {
  it('compact', () => {
    const input = ['one', undefined, ['two', undefined], [undefined, 'three']];
    const res = Util.compact(input);
    assert.deepEqual(res, ['one', 'two', 'three']);
  });

  describe('util.hash', () => {
    it("does not hash 'nothing' (undefined)", () => {
      const test = (algorithm: t.HashAlgorithm) => {
        assert.equal(Util.hash(algorithm), undefined);
        assert.equal(Util.hash(algorithm, null), undefined);
        assert.equal(Util.hash(algorithm, null, undefined), undefined);
        assert.equal(Util.hash(algorithm, null, [undefined, null]), undefined);
      };
      FileSystemCache.hashAlgorithms.forEach(test);
    });

    it('returns a hash of multiple values', () => {
      const test = (algorithm: t.HashAlgorithm, expected: string) => {
        const result = Util.hash(algorithm, 'one', undefined, [3, 4], 2);
        assert.equal(result, expected);
      };
      test('sha1', '0f161cb21daaa15962c1085855fe19dcb9df67e9');
      test('sha256', 'c637bf7b330a578cd63a36d1d68c2345959591784dc08d35f249eb596de29c42');
    });

    it('returns a hash of a single value', () => {
      const test = (algorithm: t.HashAlgorithm, expected: string) => {
        const result = Util.hash(algorithm, 'one');
        assert.equal(result, expected);
      };
      test('sha1', '443b7f970b6c6af26c392534c0a28ed4ad00a30e');
      test('sha256', '49e9fcfb5617aad332d56d58ffd0c7020d29ec1d0d0a03b7d7c47f268820acf3');
    });

    it('returns a hash from an array', () => {
      const test = (algorithm: t.HashAlgorithm, expected: string) => {
        const result1 = Util.hash(algorithm, 'one', 'two');
        const result2 = Util.hash(algorithm, ['one', 'two']);
        assert.equal(result1, expected);
        assert.equal(result1, result2);
      };
      test('sha1', '7fc87660c49692a9b11b02cb23cc478771ca3e3f');
      test('sha256', 'c7d71a7239fceefe30f084ed730d02f609fe63024dc5cf57c674052efedd96ff');
    });
  });

  describe('util.hash (generator)', () => {
    it('hashes constant matches node', () => {
      const hashes = crypto.getHashes();
      FileSystemCache.hashAlgorithms.forEach((name) => assert.ok(hashes.includes(name)));
    });
  });
});
