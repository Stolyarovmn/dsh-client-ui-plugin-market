import fs from "node:fs";
import path from "node:path";
const store = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai";
const target = process.argv[2] || "dsh-app-boot";
let resolved = [];
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
				if (j.name === target) resolved.push({ real, j });
			}
		}
	}
}
for (const { real, j } of resolved) {
	console.log(`\n=== ${j.name}@${j.version} ===\n  real=${real}`);
	const lib = path.join(real, "lib");
	if (!fs.existsSync(lib)) { console.log("  (no lib)"); continue; }
	const files = [];
	(function scan(d) { for (const f of fs.readdirSync(d)) { const fp = path.join(d, f); const st = fs.lstatSync(fp); if (st.isDirectory()) scan(fp); else files.push(path.relative(real, fp)); } })(lib);
	console.log("  files:", files.join(", "));
	// grep for loader + composition + import + require
	for (const f of files) {
		if (!f.endsWith(".js")) continue;
		const txt = fs.readFileSync(path.join(real, f), "utf8");
		const marks = [];
		if (/loader/i.test(txt)) marks.push("loader");
		if (/createRequire/.test(txt)) marks.push("createRequire");
		if (/pathToFileURL/.test(txt)) marks.push("pathToFileURL");
		if (/composition|compose|profile/i.test(txt)) marks.push("composition");
		if (/await import\(|import\(/.test(txt)) marks.push("dynamic-import");
		if (/bundle\.patch/.test(txt)) marks.push("bundle.patch");
		if (/\.register\(|installSection/.test(txt)) marks.push("register");
		if (marks.length) console.log(`  ${f}: ${marks.join(", ")}`);
	}
}
