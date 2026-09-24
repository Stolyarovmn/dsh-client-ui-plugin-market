import fs from "node:fs";
import path from "node:path";
const storeRoot = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links";
const targets = ["dsh-base", "dsh-settings-file", "dsh-cli", "dsh"];
// links/<scope>/<pkg>/<ver>/<hash>/node_modules/<inner>  (scope is @scope or a dir)
const found = new Map();
function visitScope(scopeDir) {
	let pkgs; try { pkgs = fs.readdirSync(scopeDir); } catch { return; }
	for (const pkg of pkgs) {
		const pkgDir = path.join(scopeDir, pkg);
		let vers; try { vers = fs.readdirSync(pkgDir); } catch { continue; }
		for (const ver of vers) {
			const base = path.join(pkgDir, ver);
			let subs; try { subs = fs.readdirSync(base); } catch { continue; }
			for (const hash of subs) {
				const nm = path.join(base, hash, "node_modules");
				if (!fs.existsSync(nm)) continue;
				for (const inner of fs.readdirSync(nm)) {
					let real; try { real = fs.realpathSync(path.join(nm, inner)); } catch { continue; }
					const pj = path.join(real, "package.json");
					if (!fs.existsSync(pj)) continue;
					let j; try { j = JSON.parse(fs.readFileSync(pj, "utf8")); } catch { continue; }
					for (const t of targets) {
						if (j.name === t || j.name.endsWith("/" + t)) {
							const key = j.name + "@" + j.version;
							if (!found.has(key)) found.set(key, { real, deps: Object.keys(j.dependencies || {}), dsh: j.dsh || null });
						}
					}
				}
			}
		}
	}
}
let scopes; try { scopes = fs.readdirSync(storeRoot); } catch { scopes = []; }
for (const s of scopes) {
	const sd = path.join(storeRoot, s);
	let st; try { st = fs.lstatSync(sd); } catch { continue; }
	if (st.isDirectory()) visitScope(sd);
}
for (const [k, v] of found) {
	console.log(`\n${k}\n  real=${v.real}\n  dsh=${JSON.stringify(v.dsh)}\n  deps=${v.deps.filter(d => /settings|base|cli|file/.test(d)).join(", ") || "(none relevant)"}`);
}
console.log("\nTOTAL matches:", found.size);
