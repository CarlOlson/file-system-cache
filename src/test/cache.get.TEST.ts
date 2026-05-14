import { describe, expect, it } from 'vitest';
import { FileSystemCache } from '..';

describe('get', () => {
  it('file not exist on the file-system', async () => {
    using cache = FileSystemCache.disposable();
    const res = await cache.get('foo');
    expect(res).to.eql(undefined);
  });

  it('gets a default value', async () => {
    using cache = FileSystemCache.disposable();
    return cache.get('foo', { myDefault: 123 }).then((result) => {
      expect(result).to.eql({ myDefault: 123 });
    });
  });

  it('reads a stored values (various types)', async () => {
    using cache1 = FileSystemCache.disposable();
    const cache2 = new FileSystemCache({ basePath: cache1.basePath });
    await cache1.set('text', 'my value');
    await cache1.set('number', 123);
    await cache1.set('object', { foo: 456 });

    expect(await cache2.get('text')).to.eql('my value');
    expect(await cache2.get('number')).to.eql(123);
    expect(await cache2.get('object')).to.eql({ foo: 456 });
  });

  it('reads a stored date', async () => {
    using cache1 = FileSystemCache.disposable();
    const cache2 = new FileSystemCache({ basePath: cache1.basePath });
    const now = new Date();
    await cache1.set('date', now);
    expect(await cache2.get('date')).to.eql(now);
  });

  describe('getSync', () => {
    it('reads a value synchonously', async () => {
      using cache = FileSystemCache.disposable();
      const now = new Date();

      await cache.set('date', now);
      expect(cache.getSync('date')).to.eql(now);
    });

    it('returns a default value synchonously', () => {
      using cache = FileSystemCache.disposable();
      const result = cache.getSync('my-sync-value', { myDefault: 123 });
      expect(result).to.eql({ myDefault: 123 });
    });
  });
});
