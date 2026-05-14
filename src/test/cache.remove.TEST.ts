import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { FileSystemCache } from '..';
import * as Util from '../common/util';
import { BasePath, deleteTmpDir } from './common';

describe('remove', () => {
  const basePath = BasePath.random();
  beforeEach(() => deleteTmpDir(basePath));
  afterAll(() => deleteTmpDir(basePath));

  const setup = async () => {
    const cache = new FileSystemCache({ basePath });
    await cache.set('foo', 'my-text');
    return cache;
  };

  it('removes the file from the file-system', async () => {
    const cache = await setup();
    expect(Util.isFileSync(cache.path('foo'))).to.equal(true);

    await cache.remove('foo');
    expect(Util.isFileSync(cache.path('foo'))).to.equal(false);
  });

  it('does nothing if the key does not exist', async () => {
    const cache = await setup();

    await cache.remove('foobar');
    expect(Util.isFileSync(cache.path('foo'))).to.equal(true);
  });
});
