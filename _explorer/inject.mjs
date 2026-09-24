import fs from "node:fs";
import path from "node:path";
const cordis = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai/cordis/4.0.2/1dceaa8b4a6858370892d553dccfbca05b5de5813f6d5c2f5367551705da7fde/node_modules/@deepseek-ai/cordis";
const lib = path.join(cordis, "lib");
const files = [];
(function scan(d) { for (const f of fs.readdirSync(d)) { const fp = path.join(d, f); const st = fs.lstatSync(fp); if (st.isDirectory()) scan(fp); else files.push(fp); } })(lib);
// Print the RegistryService region: find the file defining it and show inject + provide.
for (const fp of files) {
	const txt = fs.readFileSync(fp, "utf8");
	if (/RegistryService/.test(txt) && /inject\(/.test(txt)) {
		console.log(`\n\n===== ${path.relative(lib, fp)} =====`);
		// show the class + inject method region
		const idx = txt.indexOf("RegistryService");
		console.log(txt.slice(Math.max(0, idx - 200), idx + 2600));
		break;
	}
}
