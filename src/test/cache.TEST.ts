import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { describe, expect, it } from 'vitest';
import { FileSystemCache } from '..';
import * as Util from '../common/util';
import type * as t from '../types';

describe('FileSystemCache', () => {
  describe('constructor', () => {
    it('defaults', () => {
      using cache = FileSystemCache.disposable();
      expect(cache.hash).to.eql('sha1');
      expect(cache.ttl).to.eql(0);
      expect(cache.ns).to.eql(undefined);
      expect(cache.extension).to.eql(undefined);
    });

    it('throw: hash not supported', async () => {
      const hash = '404-no-exist' as any;
      const fn = () => new FileSystemCache({ hash });
      expect(fn).to.throw(/Hash does not exist/);
    });
  });

  describe('basePath', () => {
    it("has a default path of '/.cache'", () => {
      const cache = new FileSystemCache();
      expect(cache.basePath).to.equal(path.resolve('./.cache'));
    });

    it("resolves the path if the path starts with ('.')", () => {
      const basePath = './test/foo';
      const cache = new FileSystemCache({ basePath });
      expect(cache.basePath).to.equal(path.resolve(basePath));
    });

    it('uses the given absolute path', () => {
      const path = '/foo';
      const cache = new FileSystemCache({ basePath: path });
      expect(cache.basePath).to.equal(path);
    });

    it('throws if the basePath is a file', () => {
      let fn = () => {
        new FileSystemCache({ basePath: './README.md' });
      };
      expect(fn).to.throw();
    });
  });

  describe('ns (namespace)', () => {
    it('has no namespace by default', () => {
      expect(new FileSystemCache().ns).to.equal(undefined);
      expect(new FileSystemCache([] as any).ns).to.equal(undefined);
      expect(new FileSystemCache([null, undefined] as any).ns).to.equal(undefined);
    });

    it('creates a namespace hash with a single value', () => {
      const cache1 = new FileSystemCache({ ns: 'foo' });
      const cache2 = new FileSystemCache({ ns: 'foo', hash: 'sha256' });
      const cache3 = new FileSystemCache({ ns: 'foo', hash: 'sha512' });
      expect(cache1.ns).to.equal(Util.hash('sha1', 'foo'));
      expect(cache2.ns).to.equal(Util.hash('sha256', 'foo'));
      expect(cache3.ns).to.equal(Util.hash('sha512', 'foo'));
    });

    it('creates a namespace hash with several values', () => {
      const cache1 = new FileSystemCache({ ns: ['foo', 123] });
      const cache2 = new FileSystemCache({ ns: ['foo', 123], hash: 'sha256' });
      const cache3 = new FileSystemCache({ ns: ['foo', 123], hash: 'sha512' });
      expect(cache1.ns).to.equal(Util.hash('sha1', 'foo', 123));
      expect(cache2.ns).to.equal(Util.hash('sha256', 'foo', 123));
      expect(cache3.ns).to.equal(Util.hash('sha512', 'foo', 123));
    });
  });

  describe('path', () => {
    it('throws if no key is provided', () => {
      const cache = new FileSystemCache();
      expect(() => (cache as any).path()).to.throw();
    });

    it('returns a path with no namespace', () => {
      const test = (hash: t.HashAlgorithm) => {
        const key = 'foo';
        const file = Util.hash(hash, key);

        using cache = FileSystemCache.disposable({ hash });
        expect(cache.path(key)).to.equal(path.join(cache.basePath, file));
      };

      test('sha1');
      test('sha256');
      test('sha512');
    });

    it('returns a path with a namespace', () => {
      const test = (hash: t.HashAlgorithm) => {
        const key = 'foo';
        const ns = [1, 2];
        const file = `${Util.hash(hash, ns)}-${Util.hash(hash, key)}`;

        using cache = FileSystemCache.disposable({ ns, hash });
        expect(cache.path(key)).to.equal(path.join(cache.basePath, file));
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
          expect(cache.path(key)).to.equal(path.join(cache.basePath, file));
        }

        {
          using cache = FileSystemCache.disposable({ hash, extension: '.styl' });
          expect(cache.path(key)).to.equal(path.join(cache.basePath, file));
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
      expect(fs.existsSync(cache.basePath)).to.equal(false);
      expect(cache.basePathExists).not.to.equal(true);

      await cache.ensureBasePath();
      expect(cache.basePathExists).to.equal(true);
      expect(fs.existsSync(cache.basePath)).to.equal(true);
    });
  });
});
