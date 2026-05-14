import * as fs from 'node:fs';

import * as crypto from 'node:crypto';
import * as fsPath from 'node:path';

const HashUnionType = {
  /**
   * Generate the union type.
   */
  generate() {
    const names = crypto.getHashes().map((hash) => `'${hash}'`);
    const type = `export type HashAlgorithm = \n  | ${names.join('\n  | ')};`;

    const nameArray = `[\n  ${names.join(',\n  ')}];`;
    const constants = `export const hashAlgorithms: t.HashAlgorithm[] = ${nameArray}`;
    return { type, constants };
  },

  /**
   * Generate and save the type definition file.
   */
  update() {
    const header = `
/**
 * Generated file - do not edit.
 * See:
 *    - generator:  script.ts/generate-hashtype.ts
 *    - command:    yarn run gen:hashtype
 */
`
      .substring(1)
      .slice(0, -1);

    const { type, constants } = HashUnionType.generate();
    const typeDef = `${header}\n${type}\n`;
    const importT = `import type * as t from '../types.ts';`;
    const constDef = `${header}\n${importT}\n\n${constants}\n`;

    fs.writeFileSync(fsPath.resolve('./src/types.hashes.ts'), typeDef);
    fs.writeFileSync(fsPath.resolve('./src/common/const.hashes.ts'), constDef);
  },
};

/**
 * Run
 */
HashUnionType.update();
