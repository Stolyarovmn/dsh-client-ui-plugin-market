import fs from "node:fs";
import path from "node:path";
const nm = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai/dsh-web-app/0.1.5-rc.3/69b864cef00da936a3555c4c97d1dbbb49307b18e7df4de5f3b77e8719183d5c/node_modules/@deepseek-ai";
// List all dsh-* packages here, and search each lib for the loader / composition / import mechanism.
const hits = new Set();
const pkgs = fs.readdirSync(nm);
function scanDir(d, ctx) {
	let names; try { names = fs.readdirSync(d); } catch { return; }
	for (const f of names) {
		const fp = path.join(d, f);
		let st; try { st = fs.lstatSync(fp); } catch { continue; }
		if (st.isDirectory()) { if (f === "node_modules" || f === "types") continue; scanDir(fp, ctx); }
		else if (f.endsWith(".js")) {
			let txt; try { txt = fs.readFileSync(fp, "utf8"); } catch { continue; }
			const marks = [];
			if (/["']loader["']/.test(txt)) marks.push("loader-ref");
			if (/createRequire/.test(txt)) marks.push("createRequire");
			if (/pathToFileURL/.test(txt)) marks.push("pathToFileURL");
			if (/\.register\(/.test(txt) && /settings|namespace/i.test(txt)) marks.push("settings-register");
			if (/installSection/.test(txt)) marks.push("installSection");
			if (/\bcomposition\b|\bcompose\b/.test(txt)) marks.push("composition");
			if (marks.length) hits.add(`${ctx}/${f}: ${marks.join(", ")}`);
		}
	}
}
for (const pkg of pkgs) {
	if (!/^dsh-/.test(pkg)) continue;
	const real = fs.realpathSync(path.join(nm, pkg));
	const lib = path.join(real, "lib");
	if (fs.existsSync(lib)) scanDir(lib, pkg);
}
console.log([...hits].sort().join("\n") || "NONE");
