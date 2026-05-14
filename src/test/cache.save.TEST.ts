import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { describe, it } from 'node:test';
import { FileSystemCache } from '../index.ts';

describe('save', () => {
  it('throws if items not valid', async () => {
    using cache = FileSystemCache.disposable();

    await assert.rejects(cache.save([{}] as any));
    await assert.rejects(cache.save([{ key: 1 }] as any));
    await assert.rejects(cache.save([{ value: 'foo' }] as any));
  });

  it('resolves immediately if an empty array was passed', async () => {
    using cache = FileSystemCache.disposable();
    const res = await cache.save([]);
    assert.equal(res.paths.length, 0);
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

    assert.equal(paths.length, 2);
    assert.equal(fs.existsSync(paths[0]), true);
    assert.equal(fs.existsSync(paths[1]), true);
    assert.equal(cache.getSync('one'), 'value-1');
    assert.equal(cache.getSync('two').foo, 'value-2');
  });
});
