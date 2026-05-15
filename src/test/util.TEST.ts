import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as Util from '../util.ts';

describe('util', () => {
  describe('util.hash', () => {
    it('returns undefined for an empty array', () => {
      assert.equal(Util.hash([]), undefined);
    });

    it('returns a hash of a single value', () => {
      assert.equal(Util.hash('one'), '1ugx6fmal8p');
    });

    it('returns a hash from an array', () => {
      assert.equal(Util.hash(['one', 'two']), 'dyegaowfnv');
    });
  });
});
