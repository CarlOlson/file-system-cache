import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { describe, it } from 'node:test';
import { FileSystemCache } from '../FileSystemCache.ts';

describe('set', () => {
  it('saves a string to the file-system', async () => {
    using cache = FileSystemCache.disposable();
    const path = cache.path('foo');
    const value = 'my value';
    assert.equal(fs.existsSync(path), false);

    const res = await cache.set('foo', value);
    assert.equal(res.path, path);
    assert.ok(fs.existsSync(path));
    assert.equal(await cache.get('foo'), value);
  });

  it('saves an object to the file-system', async () => {
    using cache = FileSystemCache.disposable();
    const value = { text: 'hello', number: 123 };

    const res = await cache.set('foo', value);
    assert.ok(fs.existsSync(res.path));
    assert.deepEqual(await cache.get('foo'), value);
  });

  it('setSync: saves a value synchonously', () => {
    using cache = FileSystemCache.disposable();
    const result = cache.setSync('foo', { text: 'sync' });
    assert.equal(result, cache);
    assert.deepEqual(cache.getSync('foo'), { text: 'sync' });
  });
});
