import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const target = process.argv[2];
const skip = new Set(['node_modules']);

const walk = (d, pre, depth) => {
  if (depth > 4) { console.log(pre + '<deep>'); return; }
  let es;
  try { es = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { console.log(pre + `<unreadable: ${e.code}>`); return; }
  for (const e of es) {
    if (skip.has(e.name)) continue;
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f, pre + e.name + '/', depth + 1);
    else console.log(pre + e.name);
  }
};
walk(target, '', 0);
