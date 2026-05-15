import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as Util from '../util.ts';
import { FileSystemCache } from '../index.ts';

describe('remove', () => {
  it('removes the file from the file-system', async () => {
    using cache = FileSystemCache.disposable();
    await cache.set('foo', 'my-text');
    assert.equal(Util.isFileSync(cache.path('foo')), true);

    await cache.remove('foo');
    assert.equal(Util.isFileSync(cache.path('foo')), false);
  });

  it('does nothing if the key does not exist', async () => {
    using cache = FileSystemCache.disposable();
    await cache.set('foo', 'my-text');

    await cache.remove('foobar');
    assert.equal(Util.isFileSync(cache.path('foo')), true);
  });
});
