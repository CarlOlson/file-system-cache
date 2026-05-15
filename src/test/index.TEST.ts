import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import CacheFs, { FileSystemCache } from '../FileSystemCache.ts';

describe('Module entry API', () => {
  it('creates an instance of [FileSystemCache]', () => {
    const cache = CacheFs();
    assert.ok(cache instanceof FileSystemCache);
  });
});
