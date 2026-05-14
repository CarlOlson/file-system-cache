import * as fs from 'node:fs';
import * as fsPath from 'node:path';

export const BasePath = {
  root: './.tmp',
  random(prefix: string = 'cache') {
    const random = Math.floor(Math.random() * 9999) + 1;
    const text = `${prefix}.${random}`;
    return fsPath.resolve(BasePath.root, text);
  },
} as const;

export const deleteTmpDir = async (basePath?: string) => {
  const path = fsPath.resolve(basePath || BasePath.root);
  fs.rmSync(path, { recursive: true, force: true });
};

export const Sleep = {
  msecs: (delay: number) => new Promise<void>((resolve) => setTimeout(resolve, delay)),
  secs: (delay: number) => Sleep.msecs(delay * 1000),
} as const;
