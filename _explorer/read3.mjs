import fs from "node:fs";
import path from "node:path";
const nm = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai/dsh-web-app/0.1.5-rc.3/69b864cef00da936a3555c4c97d1dbbb49307b18e7df4de5f3b77e8719183d5c/node_modules/@deepseek-ai";
const want = {
	"dsh-agent-presets": "index.js",
	"dsh-app-boot": "index.js",
	"dsh-tool-subagent": "model-selection-settings.js",
};
for (const [pkg, file] of Object.entries(want)) {
	const real = fs.realpathSync(path.join(nm, pkg));
	const fp = path.join(real, "lib", file);
	if (!fs.existsSync(fp)) { console.log(`\n\n===== ${pkg}/${file}: MISSING =====`); continue; }
	console.log(`\n\n===== ${pkg}/${file} (${fs.statSync(fp).size} bytes) =====`);
	console.log(fs.readFileSync(fp, "utf8"));
}
