import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FileSystemCache } from '../index.ts';

describe('get', () => {
  it('file not exist on the file-system', async () => {
    using cache = FileSystemCache.disposable();
    const res = await cache.get('foo');
    assert.equal(res, undefined);
  });

  it('gets a default value', async () => {
    using cache = FileSystemCache.disposable();
    return cache.get('foo', { myDefault: 123 }).then((result) => {
      assert.deepEqual(result, { myDefault: 123 });
    });
  });

  it('reads a stored values (various types)', async () => {
    using cache1 = FileSystemCache.disposable();
    const cache2 = new FileSystemCache({ basePath: cache1.basePath });
    await cache1.set('text', 'my value');
    await cache1.set('number', 123);
    await cache1.set('object', { foo: 456 });

    assert.equal(await cache2.get('text'), 'my value');
    assert.equal(await cache2.get('number'), 123);
    assert.deepEqual(await cache2.get('object'), { foo: 456 });
  });

  it('reads a stored date', async () => {
    using cache1 = FileSystemCache.disposable();
    const cache2 = new FileSystemCache({ basePath: cache1.basePath });
    const now = new Date();
    await cache1.set('date', now);
    assert.deepEqual(await cache2.get('date'), now);
  });

  describe('getSync', () => {
    it('reads a value synchonously', async () => {
      using cache = FileSystemCache.disposable();
      const now = new Date();

      await cache.set('date', now);
      assert.deepEqual(cache.getSync('date'), now);
    });

    it('returns a default value synchonously', () => {
      using cache = FileSystemCache.disposable();
      const result = cache.getSync('my-sync-value', { myDefault: 123 });
      assert.deepEqual(result, { myDefault: 123 });
    });
  });
});
