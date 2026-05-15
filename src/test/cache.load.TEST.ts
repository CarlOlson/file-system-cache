import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FileSystemCache } from '../FileSystemCache.ts';

describe('load', () => {
  it('loads no files', async () => {
    using cache = FileSystemCache.disposable();
    const result = await cache.load();
    assert.deepEqual(result.files, []);
  });

  it('loads several files (no namespace)', async () => {
    using cache1 = FileSystemCache.disposable();
    const cache2 = new FileSystemCache({ basePath: cache1.basePath, ns: 'my-ns' });
    cache1.setSync('foo', 1);
    cache1.setSync('bar', 'two');
    cache2.set('yo', 'ns-value');

    const files = (await cache1.load()).files;
    assert.equal(files.length, 2);
    assert.deepEqual(files.map((f) => f.value).sort(), [1, 'two']);
  });
});
