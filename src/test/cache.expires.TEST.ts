import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FileSystemCache } from '../FileSystemCache.ts';
import { Sleep } from './common.ts';

describe('expires', () => {
  it('cache does NOT expire (various types)', async () => {
    using cache1 = FileSystemCache.disposable({ ttl: 10 });
    const cache2 = new FileSystemCache({ basePath: cache1.basePath, ttl: 10 });

    await cache1.set('foo-1', 'bar-1');
    await cache1.set('foo-2', 'bar-2', 0);
    await cache1.set('foo-3', 'bar-3', 10);

    assert.equal(await cache2.get('foo-1'), 'bar-1');
    await Sleep.secs(1);

    assert.equal(await cache2.get('foo-2'), 'bar-2');
    assert.equal(await cache2.get('foo-3'), 'bar-3');
  });

  it('cache DOES expires (various types)', async () => {
    using cache1 = FileSystemCache.disposable({ ttl: 0.3 });
    const cache2 = new FileSystemCache({ basePath: cache1.basePath, ttl: 0.3 });

    await cache1.set('number', 123);
    await cache1.set('object', { foo: 456 }, 1);

    await Sleep.secs(1);
    assert.equal(await cache2.get('number'), undefined);
    assert.equal(await cache2.get('object'), undefined);
  });

  it('after expiring empty value is returned', async () => {
    using cache = FileSystemCache.disposable({ ttl: 0.3 });
    await cache.set('my-number', 123);

    const res1 = await cache.getSync('my-number');
    await Sleep.secs(0.4);

    const res2 = await cache.getSync('my-number');
    assert.equal(res1, 123);
    assert.equal(res2, undefined);
  });
});
