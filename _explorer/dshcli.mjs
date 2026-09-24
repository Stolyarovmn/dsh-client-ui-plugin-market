import fs from "node:fs";
import path from "node:path";
const store = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai";
// Resolve the `dsh` CLI package realpath and list its lib files.
const dir = path.join(store, "dsh");
for (const ver of fs.readdirSync(dir)) {
	const base = path.join(dir, ver);
	for (const hash of fs.readdirSync(base)) {
		const nm = path.join(base, hash, "node_modules");
		if (!fs.existsSync(nm)) continue;
		for (const inner of fs.readdirSync(nm)) {
			const real = fs.realpathSync(path.join(nm, inner));
			const pj = path.join(real, "package.json");
			if (!fs.existsSync(pj)) continue;
			const j = JSON.parse(fs.readFileSync(pj, "utf8"));
			if (j.name !== "dsh" && j.name !== "@deepseek-ai/dsh") continue;
			console.log(`\n=== ${j.name}@${j.version} ===\n  real=${real}\n  bin=${JSON.stringify(j.bin)}\n  deps=${Object.keys(j.dependencies || {}).join(", ")}`);
			const lib = path.join(real, "lib");
			if (fs.existsSync(lib)) {
				console.log("  lib files:");
				(function scan(d) {
					for (const f of fs.readdirSync(d)) {
						const fp = path.join(d, f);
						const st = fs.lstatSync(fp);
						if (st.isDirectory()) scan(fp);
						else console.log("   ", path.relative(lib, fp));
					}
				})(lib);
			}
		}
	}
}
