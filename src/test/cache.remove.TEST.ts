import { describe, expect, it } from 'vitest';
import { FileSystemCache } from '..';
import * as Util from '../common/util';

describe('remove', () => {
  it('removes the file from the file-system', async () => {
    using cache = FileSystemCache.disposable();
    await cache.set('foo', 'my-text');
    expect(Util.isFileSync(cache.path('foo'))).to.equal(true);

    await cache.remove('foo');
    expect(Util.isFileSync(cache.path('foo'))).to.equal(false);
  });

  it('does nothing if the key does not exist', async () => {
    using cache = FileSystemCache.disposable();
    await cache.set('foo', 'my-text');

    await cache.remove('foobar');
    expect(Util.isFileSync(cache.path('foo'))).to.equal(true);
  });
});
