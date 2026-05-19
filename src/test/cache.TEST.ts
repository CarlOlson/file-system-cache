import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import { FileSystemCache } from '../FileSystemCache.ts';
import * as Util from '../util.ts';

describe('FileSystemCache', () => {
  describe('constructor', () => {
    it('defaults', () => {
      using cache = FileSystemCache.disposable();
      assert.equal(cache.ttl, 0);
      assert.equal(cache.ns, undefined);
      assert.equal(cache.extension, undefined);
      assert.equal(cache.compress, true);
    });
  });

  describe('basePath', () => {
    it("has a default path of '/.cache'", () => {
      const cache = new FileSystemCache();
      assert.equal(cache.basePath, path.resolve('./.cache'));
    });

    it("resolves the path if the path starts with ('.')", () => {
      const basePath = './test/foo';
      const cache = new FileSystemCache({ basePath });
      assert.equal(cache.basePath, path.resolve(basePath));
    });

    it('uses the given absolute path', () => {
      const basePath = '/foo';
      const cache = new FileSystemCache({ basePath });
      assert.equal(cache.basePath, basePath);
    });

    it('throws if the basePath is a file', () => {
      assert.throws(() => new FileSystemCache({ basePath: './README.md' }));
    });
  });

  describe('ns (namespace)', () => {
    it('has no namespace by default', () => {
      assert.equal(new FileSystemCache().ns, undefined);
      assert.equal(new FileSystemCache({}).ns, undefined);
    });

    it('creates a namespace hash with a single value', () => {
      const cache = new FileSystemCache({ ns: 'foo' });
      assert.equal(cache.ns, Util.hash('foo'));
    });

    it('creates a namespace hash with several values', () => {
      const ns = ['foo', 'bar'];
      const cache = new FileSystemCache({ ns });
      assert.equal(cache.ns, Util.hash(ns));
    });
  });

  describe('path', () => {
    it('throws if no key is provided', () => {
      const cache = new FileSystemCache();
      assert.throws(() => cache.path(undefined as unknown as string));
    });

    it('returns a path with no namespace', () => {
      const key = 'foo';
      const file = Util.hash(key);

      using cache = FileSystemCache.disposable({ compress: false });
      assert.equal(cache.path(key), path.join(cache.basePath, file as string));
    });

    it('returns a path with a namespace (namespaced subdirectory)', () => {
      const key = 'foo';
      const ns = ['one', 'two'];

      using cache = FileSystemCache.disposable({ ns, compress: false });
      assert.equal(cache.path(key), path.join(cache.basePath, Util.hash(ns) as string, Util.hash(key)));
    });

    it('returns a path with a file extension', () => {
      const key = 'foo';
      const file = `${Util.hash(key)}.styl`;

      {
        using cache = FileSystemCache.disposable({ extension: 'styl', compress: false });
        assert.equal(cache.path(key), path.join(cache.basePath, file));
      }

      {
        using cache = FileSystemCache.disposable({ extension: '.styl', compress: false });
        assert.equal(cache.path(key), path.join(cache.basePath, file));
      }
    });

    it('appends .zst when compression is enabled', () => {
      const key = 'foo';
      {
        using cache = FileSystemCache.disposable();
        assert.equal(cache.path(key), path.join(cache.basePath, `${Util.hash(key)}.zst`));
      }
      {
        using cache = FileSystemCache.disposable({ extension: 'styl' });
        assert.equal(cache.path(key), path.join(cache.basePath, `${Util.hash(key)}.styl.zst`));
      }
    });
  });

  describe('ensureBasePath()', () => {
    it('creates the base path', async () => {
      using tmpdir = fs.mkdtempDisposableSync(path.join(os.tmpdir(), 'node-file-system-cache-'));
      const cache = new FileSystemCache({ basePath: path.join(tmpdir.path, '.cache') });
      assert.equal(fs.existsSync(cache.basePath), false);
      assert.notEqual(cache.basePathExists, true);

      await cache.ensureBasePath();
      assert.equal(cache.basePathExists, true);
      assert.equal(fs.existsSync(cache.basePath), true);
    });
  });
});
