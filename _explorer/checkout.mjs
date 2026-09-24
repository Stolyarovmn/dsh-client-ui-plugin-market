import fs from "node:fs";
import path from "node:path";
const root = "C:/Users/maxim/AppData/Local/pnpm/store/v11/links/@deepseek-ai/dsh-web-app/0.1.5-rc.3/69b864cef00da936a3555c4c97d1dbbb49307b18e7df4de5f3b77e8719183d5c";
console.log("checkout root:", root);
console.log("top entries:", fs.readdirSync(root).join(", "));
const pk = path.join(root, "packages");
if (fs.existsSync(pk)) {
	console.log("\npackages/:");
	for (const d of fs.readdirSync(pk)) console.log("  ", d);
}
