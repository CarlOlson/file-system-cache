import { describe, expect, it } from 'vitest';
import CacheFs, { FileSystemCache } from '..';

describe('Module entry API', () => {
  it('creates an instance of [FileSystemCache]', () => {
    const cache = CacheFs();
    expect(cache).to.be.an.instanceof(FileSystemCache);
  });
});
