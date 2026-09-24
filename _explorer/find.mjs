import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// find.mjs <npmRoot> <pkgName>  -> resolves a @scope/pkg across the store and prints realpath
const npmRoot = process.argv[2];
const pkg = process.argv[3];
const link = path.join(npmRoot, pkg);
try {
  const real = fs.realpathSync(link);
  console.log(real);
} catch (e) {
  console.log(`NOT FOUND: ${pkg} (${e.code})`);
}
