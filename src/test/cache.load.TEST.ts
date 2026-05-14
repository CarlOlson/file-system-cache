import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemCache } from '..';

describe('load', () => {
  it('loads no files', async () => {
    using cache = FileSystemCache.disposable();
    const result = await cache.load();
    expect(result.files).to.eql([]);
  });

  it('loads several files (no namespace)', async () => {
    using cache1 = FileSystemCache.disposable();
    const cache2 = new FileSystemCache({ basePath: cache1.basePath, ns: 'my-ns' });
    cache1.setSync('foo', 1);
    cache1.setSync('bar', 'two');
    cache2.set('yo', 'ns-value');

    const files = (await cache1.load()).files;
    expect(files.length).to.equal(2);
    expect(files[0].value).to.equal('two');
    expect(files[1].value).to.equal(1);
  });
});
