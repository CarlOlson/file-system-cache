import * as fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FileSystemCache } from '..';

describe('save', () => {
  it('throws if items not valid', async () => {
    using cache = FileSystemCache.disposable();

    await expect(cache.save([{}] as any)).rejects.toThrow();
    await expect(cache.save([{ key: 1 }] as any)).rejects.toThrow();
    await expect(cache.save([{ value: 'foo' }] as any)).rejects.toThrow();
  });

  it('resolves immediately if an empty array was passed', async () => {
    using cache = FileSystemCache.disposable();
    const res = await cache.save([]);
    expect(res.paths.length).to.eql(0);
  });

  it('saves several files', async () => {
    using cache = FileSystemCache.disposable();

    const payload = [
      { key: 'one', value: 'value-1' },
      null, // Should not break with null values.
      undefined,
      { key: 'two', value: { foo: 'value-2' } },
    ];

    const res = await cache.save(payload);
    const paths = res.paths;

    expect(paths.length).to.equal(2);
    expect(fs.existsSync(paths[0])).to.equal(true);
    expect(fs.existsSync(paths[1])).to.equal(true);
    expect(cache.getSync('one')).to.equal('value-1');
    expect(cache.getSync('two').foo).to.equal('value-2');
  });
});
