import { bench, run, summary, do_not_optimize } from 'mitata';
import { FileSystemCache } from './FileSystemCache.ts';

summary(() => {
  bench('async set', function* (state) {
    const concurrency = state.get('concurrency');
    const size = state.get('size');
    const keys = Array.from({ length: size }).map((_, i) => `async-${i}`);
    let index = 0;

    using cache = FileSystemCache.disposable();
    for (const key of keys) cache.setSync(key, { value: 'hello world' });

    yield {
      concurrency,

      async bench() {
        const key = keys[index++];
        if (index >= size) index = 0;
        return do_not_optimize(await cache.set(key, { value: 'hello world' }));
      },
    };
  })
    .args('size', [100])
    .args('concurrency', [1]);

  bench('sync set', function* (state) {
    const size = state.get('size');
    const keys = Array.from({ length: size }).map((_, i) => `sync-${i}`);
    let index = 0;

    using cache = FileSystemCache.disposable();
    for (const key of keys) cache.setSync(key, { value: 'hello world' });

    yield () => {
      const key = keys[index++];
      if (index >= size) index = 0;
      return do_not_optimize(cache.setSync(key, { value: 'hello world' }));
    };
  }).args('size', [100]);
});

summary(() => {
  bench('async get', function* (state) {
    const concurrency = state.get('concurrency');

    const size = state.get('size');
    const keys = Array.from({ length: size }).map((_, i) => `async-${i}`);
    let index = 0;

    using cache = FileSystemCache.disposable();
    for (const key of keys) cache.setSync(key, { value: 'hello world' });

    yield {
      concurrency,

      async bench() {
        const key = keys[index++];
        if (index >= size) index = 0;
        return do_not_optimize(await cache.get(key));
      },
    };
  })
    .args('size', [100])
    .args('concurrency', [1]);

  bench('sync get', function* (state) {
    const size = state.get('size');
    const keys = Array.from({ length: size }).map((_, i) => `sync-${i}`);
    let index = 0;

    using cache = FileSystemCache.disposable();
    for (const key of keys) cache.setSync(key, { value: 'hello world' });

    yield () => {
      const key = keys[index++];
      if (index >= size) index = 0;
      return do_not_optimize(cache.getSync(key));
    };
  }).args('size', [100]);
});

await run();
