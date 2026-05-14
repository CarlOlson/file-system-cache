import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, it } from 'node:test';
import * as Util from '../common/util.ts';
import { FileSystemCache } from '../index.ts';
import type * as t from '../types.ts';

describe('FileSystemCache', () => {
  describe('constructor', () => {
    it('defaults', () => {
      using cache = FileSystemCache.disposable();
      assert.equal(cache.hash, 'sha1');
      assert.equal(cache.ttl, 0);
      assert.equal(cache.ns, undefined);
      assert.equal(cache.extension, undefined);
    });

    it('throw: hash not supported', () => {
      const hash = '404-no-exist' as t.HashAlgorithm;
      assert.throws(() => new FileSystemCache({ hash }), /Hash does not exist/);
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
      const cache1 = new FileSystemCache({ ns: 'foo' });
      const cache2 = new FileSystemCache({ ns: 'foo', hash: 'sha256' });
      const cache3 = new FileSystemCache({ ns: 'foo', hash: 'sha512' });
      assert.equal(cache1.ns, Util.hash('sha1', 'foo'));
      assert.equal(cache2.ns, Util.hash('sha256', 'foo'));
      assert.equal(cache3.ns, Util.hash('sha512', 'foo'));
    });

    it('creates a namespace hash with several values', () => {
      const ns = ['foo', 'bar'];
      const cache1 = new FileSystemCache({ ns });
      const cache2 = new FileSystemCache({ ns, hash: 'sha256' });
      const cache3 = new FileSystemCache({ ns, hash: 'sha512' });
      assert.equal(cache1.ns, Util.hash('sha1', ns));
      assert.equal(cache2.ns, Util.hash('sha256', ns));
      assert.equal(cache3.ns, Util.hash('sha512', ns));
    });
  });

  describe('path', () => {
    it('throws if no key is provided', () => {
      const cache = new FileSystemCache();
      assert.throws(() => cache.path(undefined as unknown as string));
    });

    it('returns a path with no namespace', () => {
      const test = (hash: t.HashAlgorithm) => {
        const key = 'foo';
        const file = Util.hash(hash, key);

        using cache = FileSystemCache.disposable({ hash });
        assert.equal(cache.path(key), path.join(cache.basePath, file));
      };

      test('sha1');
      test('sha256');
      test('sha512');
    });

    it('returns a path with a namespace', () => {
      const test = (hash: t.HashAlgorithm) => {
        const key = 'foo';
        const ns = ['one', 'two'];
        const file = `${Util.hash(hash, ns)}-${Util.hash(hash, key)}`;

        using cache = FileSystemCache.disposable({ ns, hash });
        assert.equal(cache.path(key), path.join(cache.basePath, file));
      };

      test('sha1');
      test('sha256');
      test('sha512');
    });

    it('returns a path with a file extension', () => {
      const test = (hash: t.HashAlgorithm) => {
        const key = 'foo';
        const file = `${Util.hash(hash, key)}.styl`;

        {
          using cache = FileSystemCache.disposable({ hash, extension: 'styl' });
          assert.equal(cache.path(key), path.join(cache.basePath, file));
        }

        {
          using cache = FileSystemCache.disposable({ hash, extension: '.styl' });
          assert.equal(cache.path(key), path.join(cache.basePath, file));
        }
      };

      test('sha1');
      test('sha256');
      test('sha512');
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
