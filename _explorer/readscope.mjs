import fs from "node:fs";
import path from "node:path";
const nm = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai/dsh-web-app/0.1.5-rc.3/69b864cef00da936a3555c4c97d1dbbb49307b18e7df4de5f3b77e8719183d5c/node_modules/@deepseek-ai";
const real = fs.realpathSync(path.join(nm, "dsh-client-ui-settings"));
const lib = path.join(real, "lib");
const files = [];
(function scan(d) { for (const f of fs.readdirSync(d)) { const fp = path.join(d, f); const st = fs.lstatSync(fp); if (st.isDirectory()) scan(fp); else files.push(path.relative(lib, fp)); } })(lib);
console.log("dsh-client-ui-settings lib files:", files.join(", "));
// Find the settings-scope file(s)
const scopeFiles = files.filter(f => /scope/i.test(f) || /settings/i.test(f));
console.log("\nscope-ish files:", scopeFiles.join(", ") || "(none — searching all)");
for (const f of files) {
	const fp = path.join(lib, f);
	const txt = fs.readFileSync(fp, "utf8");
	if (/bind\s*\(|settingsScope|getSnapshot|namespace/i.test(txt)) {
		console.log(`\n\n========== ${f} (${txt.length} bytes) ==========`);
		console.log(txt.length > 6000 ? txt.slice(0, 6000) + "\n…[truncated]" : txt);
	}
}
