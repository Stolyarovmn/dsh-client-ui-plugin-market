import fs from "node:fs";
import path from "node:path";
const store = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai";
for (const pkg of ["dsh-base"]) {
	const dir = path.join(store, pkg);
	let vers; try { vers = fs.readdirSync(dir); } catch { console.log(pkg, "absent from store"); continue; }
	for (const ver of vers) {
		const base = path.join(dir, ver);
		let subs; try { subs = fs.readdirSync(base); } catch { continue; }
		for (const hash of subs) {
			const nm = path.join(base, hash, "node_modules");
			if (!fs.existsSync(nm)) continue;
			for (const inner of fs.readdirSync(nm)) {
				let real; try { real = fs.realpathSync(path.join(nm, inner)); } catch { continue; }
				const pj = path.join(real, "package.json");
				if (!fs.existsSync(pj)) continue;
				let j; try { j = JSON.parse(fs.readFileSync(pj, "utf8")); } catch { continue; }
				if (j.name !== pkg) continue;
				const patchRel = j.dsh?.bundle?.patch;
				console.log(`\n=== ${j.name}@${j.version}  bundle.patch=${patchRel} ===`);
				console.log("deps with settings/file:", Object.keys(j.dependencies || {}).filter(d => /settings|file/.test(d)).join(", ") || "(none)");
				if (patchRel) {
					const patchPath = path.join(real, patchRel);
					if (fs.existsSync(patchPath)) console.log("PATCH FILE:\n" + fs.readFileSync(patchPath, "utf8"));
					else console.log("PATCH FILE MISSING:", patchPath);
				}
			}
		}
	}
}
