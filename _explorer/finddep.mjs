import fs from "node:fs";
import path from "node:path";
const store = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai";
const target = process.argv[2] || "dsh-settings-file";
const found = new Set();
for (const pkg of fs.readdirSync(store)) {
	const dir = path.join(store, pkg);
	let vers; try { vers = fs.readdirSync(dir); } catch { continue; }
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
				const deps = Object.keys(j.dependencies || {});
				if (deps.includes(target)) found.add(`${j.name}@${j.version}  depends on ${target}`);
				if (j.name === target) {
					const dsh = j.dsh || {};
					const kind = dsh.bundle ? "bundle" : (deps.length ? "lib" : "lib");
					console.log(`SELF ${j.name}@${j.version}  kind=${kind}  bundle.patch=${dsh.bundle?.patch || "-"}  client=${JSON.stringify(dsh.client || null)}`);
				}
			}
		}
	}
}
console.log("---dependents of " + target + "---");
console.log([...found].join("\n") || "NONE");
