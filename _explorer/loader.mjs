import fs from "node:fs";
import path from "node:path";
const cordisDir = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai/cordis/4.0.2/1dceaa8b4a6858370892d553dccfbca05b5de5813f6d5c2f5367551705da7fde/node_modules/@deepseek-ai/cordis";
const lib = path.join(cordisDir, "lib");
const files = [];
(function scan(d) {
	let names; try { names = fs.readdirSync(d); } catch { return; }
	for (const f of names) {
		const fp = path.join(d, f);
		let st; try { st = fs.lstatSync(fp); } catch { continue; }
		if (st.isDirectory()) { if (f === "node_modules") continue; scan(fp); }
		else if (f.endsWith(".js")) files.push(fp);
	}
})(lib);
console.log("cordis lib files:");
files.forEach(f => console.log("  ", path.relative(lib, f)));
