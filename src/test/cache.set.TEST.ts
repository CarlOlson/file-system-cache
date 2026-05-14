import * as fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FileSystemCache } from '..';

describe('set', () => {
  it('saves a string to the file-system', async () => {
    using cache = FileSystemCache.disposable();
    const path = cache.path('foo');
    const value = 'my value';
    expect(fs.existsSync(path)).to.equal(false);

    const res = await cache.set('foo', value);
    expect(res.path).to.equal(path);
    expect(fs.readFileSync(path).toString()).to.include('my value');
  });

  it('saves an object to the file-system', async () => {
    using cache = FileSystemCache.disposable();
    const value = { text: 'hello', number: 123 };

    const res = await cache.set('foo', value);

    const fileText = fs.readFileSync(res.path).toString();
    expect(fileText).to.include('hello');
    expect(fileText).to.include('123');
  });

  it('setSync: saves a value synchonously', () => {
    using cache = FileSystemCache.disposable();
    const result = cache.setSync('foo', { text: 'sync' });
    expect(result).to.equal(cache);
    expect(cache.getSync('foo')).to.eql({ text: 'sync' });
  });
});
