import fs from "node:fs";
import path from "node:path";
const real = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai/dsh-web-app/0.1.5-rc.3/69b864cef00da936a3555c4c97d1dbbb49307b18e7df4de5f3b77e8719183d5c/node_modules/@deepseek-ai/dsh-web-app";
const lib = path.join(real, "lib");
const files = [];
(function scan(d) {
	for (const f of fs.readdirSync(d)) {
		const fp = path.join(d, f);
		const st = fs.lstatSync(fp);
		if (st.isDirectory()) scan(fp);
		else files.push(path.relative(lib, fp));
	}
})(lib);
console.log("dsh-web-app lib files:");
files.forEach(f => console.log("  ", f));
// Now find files mentioning bundle.patch / composition / loader
console.log("\n--- files mentioning bundle.patch / profile / composition / loader / createRequire ---");
for (const f of files) {
	const fp = path.join(lib, f);
	const txt = fs.readFileSync(fp, "utf8");
	const marks = [];
	if (txt.includes("bundle.patch")) marks.push("bundle.patch");
	if (txt.includes("createRequire")) marks.push("createRequire");
	if (txt.includes("pathToFileURL")) marks.push("pathToFileURL");
	if (/loadComposition|composeProfile|loadProfile|buildProfile/.test(txt)) marks.push("profile-loader");
	if (/\binsert\b/.test(txt) && /patch/i.test(txt)) marks.push("patch-insert");
	if (marks.length) console.log(`  ${f}: ${marks.join(", ")}`);
}
