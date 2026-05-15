import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { describe, it } from 'node:test';
import { FileSystemCache } from '../FileSystemCache.ts';

describe('clear', () => {
  it('clears all items (no namespace)', async () => {
    using cache = FileSystemCache.disposable();
    const readdir = () => fs.readdirSync(cache.basePath);

    await cache.set('foo', 'my-text');
    await cache.set('bar', { foo: 123 });
    assert.equal(readdir().length, 2);

    await cache.clear();
    assert.equal(fs.readdirSync(cache.basePath).length, 0);
  });

  it('clears entries when extension contains a dash', async () => {
    using cache = FileSystemCache.disposable({ extension: 'my-ext' });
    await cache.set('foo', 'a');
    await cache.set('bar', 'b');
    assert.equal(fs.readdirSync(cache.basePath).length, 2);

    await cache.clear();
    assert.equal(fs.readdirSync(cache.basePath).length, 0);
  });

  describe('with namespace', () => {
    it('clears all items without namespace - protects non-namespace items', async () => {
      using cache1 = FileSystemCache.disposable();
      const cache2 = new FileSystemCache({ basePath: cache1.basePath, ns: 'My Namespace' });

      await cache1.set('foo', 'my-text');
      await cache2.set('foo', 'my-text'); // Different value because of NS.
      assert.equal(fs.readdirSync(cache1.basePath).length, 2);

      await cache1.clear();
      assert.equal(fs.readdirSync(cache1.basePath).length, 1);
    });

    it('clears all items with namespace - protects namespace items', async () => {
      using cache1 = FileSystemCache.disposable();
      const cache2 = new FileSystemCache({ basePath: cache1.basePath, ns: 'My Namespace' });

      await cache1.set('foo', 'my-text');
      await cache2.set('foo', 'my-text'); // Different value because of NS.
      assert.equal(fs.readdirSync(cache1.basePath).length, 2);

      await cache2.clear();
      assert.equal(fs.readdirSync(cache1.basePath).length, 1);
    });
  });
});
