import fs from "node:fs";
import path from "node:path";
const store = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai";
const needle = /createRequire|pathToFileURL|import\(|loadModule|readModule|dsh\.bundle\.patch|lib\/client\.js|lib\/index\.js|resolvePlugin|clientModule|bundle\.patch/;
const hits = new Set();
function scanDir(d, ctx) {
	let names; try { names = fs.readdirSync(d); } catch { return; }
	for (const f of names) {
		const fp = path.join(d, f);
		let st; try { st = fs.lstatSync(fp); } catch { continue; }
		if (st.isDirectory()) { if (f === "node_modules" || f === "types") continue; scanDir(fp, ctx); }
		else if (f.endsWith(".js")) {
			let txt; try { txt = fs.readFileSync(fp, "utf8"); } catch { continue; }
			const m = txt.match(needle);
			if (m) hits.add(`${ctx}/${f}: ${m[0]}`);
		}
	}
}
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
				const lib = path.join(real, "lib");
				if (fs.existsSync(lib)) scanDir(lib, pkg + "@" + ver);
			}
		}
	}
}
console.log([...hits].slice(0, 60).join("\n") || "NONE");
