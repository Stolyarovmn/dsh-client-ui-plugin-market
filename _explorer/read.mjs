import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// read.mjs <npmRoot> <pkg> <fileRelToPkgRoot>
const npmRoot = process.argv[2];
const pkg = process.argv[3];
const fileRel = process.argv[4];
const link = path.join(npmRoot, pkg);
let real;
try { real = fs.realpathSync(link); } catch (e) { console.log(`(missing ${pkg}: ${e.code})`); process.exit(1); }
const file = path.join(real, fileRel);
try {
  const body = fs.readFileSync(file, 'utf8');
  const lines = body.split('\n');
  const out = lines.map((l, i) => `${i + 1}\t${l}`).join('\n');
  fs.writeFileSync(path.join(process.cwd(), `_explorer`, `${pkg.replace(/[@/]/g, '_')}_${fileRel.replace(/[\\/]/g, '_')}.txt`), out);
  console.log(`wrote ${pkg}/${fileRel} (${lines.length} lines)`);
} catch (e) { console.log(`(read fail ${file}: ${e.code})`); }
