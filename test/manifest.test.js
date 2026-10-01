import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("package declares both DSH faces and required client services", async () => {
	const pkg = JSON.parse(await read("package.json"));
	assert.equal(pkg.name, "@stolyarovmn/dsh-ui-registry-aggregator");
	assert.equal(pkg.version, "0.4.17-rc.2");
	assert.equal(pkg.type, "module");
	assert.equal(pkg.main, "lib/index.js");
	assert.equal(pkg.exports["./client"], "./lib/client.js");
	assert.equal(pkg.exports["./core"], "./lib/core.js");
	assert.equal(pkg.dsh.bundle.patch, "./cordis.patch.yml");
	assert.equal(pkg.dsh.client.platform, "web");
	for (const dependency of ["@deepseek-ai/dsh-client-connection", "@deepseek-ai/dsh-api-remotes", "@deepseek-ai/dsh-client-locale", "@deepseek-ai/dsh-client-ui-settings", "@deepseek-ai/dsh-client-ui-plugin-manager", "@deepseek-ai/dsh-client-ui-primitives"]) {
		assert.ok(pkg.dsh.client.inject.includes(dependency), `missing client inject ${dependency}`);
	}
	assert.ok(pkg.keywords.includes("dsh-plugin"));
	assert.equal(pkg.dsh.catalog.category, "ui");
	assert.equal(typeof pkg.dsh.catalog.summary.en, "string");
	assert.equal(typeof pkg.dsh.catalog.summary.zh, "string");
	assert.deepEqual(pkg.dsh.catalog.capabilities, ["slots", "settings", "network", "plugin-manager"]);
	assert.equal(pkg.peerDependencies["@deepseek-ai/dsh"], ">=0.1.7-rc.2 <0.2.0");
	assert.equal(pkg.dependencies["@deepseek-ai/dsh-client-connection"], "0.1.7-rc.2");
	assert.equal(pkg.dependencies["@deepseek-ai/dsh-client-ui-primitives"], "0.1.7-rc.2");
	assert.equal(pkg.icon, "./icon.svg");
});

test("host entry keeps namespace metadata through the real Cordis Loader export rule", async () => {
	const host = await import(new URL("../lib/index.js", import.meta.url));
	assert.equal("default" in host, false, "default export makes Loader.unwrapExports discard Config/inject metadata");
	assert.equal(typeof host.apply, "function");
	assert.equal(host.name, "registry-aggregator");
	assert.equal(typeof host.Config?.["~standard"]?.validate, "function");
	assert.equal(host.Config?.dict?.sources?.meta?.volatile, true, "sources must be projected by DSH configForms");

	// Mirror DSH 0.1.7 Loader.unwrapExports: it prefers .default when present.
	const unwrapped = host.default ?? host;
	assert.equal(unwrapped, host);
	assert.equal(unwrapped.Config, host.Config);
});

test("bundle patch activates this package exactly once", async () => {
	const patch = await read("cordis.patch.yml");
	assert.match(patch, /- id: registry-aggregator/);
	assert.equal((patch.match(/@stolyarovmn\/dsh-ui-registry-aggregator/g) ?? []).length, 1);
});

test("production client uses Connection RPC and contains no arbitrary remote fetch or sample fallback", async () => {
	const client = await read("lib/client.js");
	const host = await read("lib/index.js");
	assert.match(client, /connection\.rpc\.call\(CHANNEL/);
	assert.match(client, /ctx\.configForms\?\.get\?\.\(NS\)/);
	assert.match(client, /plugins\.bundle\.config/);
	assert.match(client, /plugins\.bundle\.activation/);
	assert.match(client, /Registry Aggregator ready/);
	assert.match(client, /remote\.pluginManager\.listBundles\(\)/);
	assert.match(client, /remote\.pluginManager\.inspect\(spec, \{ registry: null \}\)/);
	assert.match(client, /remote\.pluginManager\.installBundle\(spec, \{ enabled, registry, requestId \}\)/);
	assert.match(client, /remote\.pluginManager\.cancelInstall\(requestId\)/);
	assert.match(client, /enabled: true/);
	assert.match(client, /requestId/);
	assert.match(client, /plugin-manager\/install-state/);
	assert.match(client, /plugin-manager\/install-log/);
	assert.match(client, /StateDot/);
	assert.match(client, /h\(Menu,/);
	for (const primitive of ["Input", "Tag", "Pill", "SegmentedTabs", "Tooltip", "LinkIconRegular", "writeClipboard"]) {
		assert.match(client, new RegExp(`\\b${primitive}\\b`), `missing native primitive/helper ${primitive}`);
	}
	assert.match(client, /function UpdateIcon/);
	assert.match(client, /h\(UpdateIcon,/);
	assert.doesNotMatch(client, /#[0-9a-fA-F]{3,8}\b/);
	assert.equal(client.includes("linear-gradient("), false);
	assert.equal(client.includes("radial-gradient("), false);
	assert.match(client, /var\(--dsw-radius-xl\)/);
	assert.match(client, /border:\.5px solid var\(--dsw-alias-border-l4\)/);
	assert.doesNotMatch(client, /settingsScope|settings\.plugins\.tab|settings\.section/);
	assert.match(host, /connection\.fetch\.register\(route\("health"\)\)/);
	assert.match(host, /connection\.fetch\.register\(route\("browse"\)\)/);
	assert.match(host, /connection\.fetch\.register\(route\("counts"\)\)/);
	assert.match(host, /connection\.fetch\.register\(route\("installed"\)\)/);
	assert.match(host, /lookupInstalledPackages/);
	assert.match(host, /githubPluginDetails/);
	assert.doesNotMatch(host, /export default apply/);
	assert.doesNotMatch(client, /\bfetch\s*\(/);
	assert.doesNotMatch(client, /sampleCatalog|__PM_RESOLVER__/);
	assert.doesNotMatch(client, /tokenEnv|allowPrivateNetwork/);
	assert.match(client, /children: "\.\.\." \}\) : null/);
	assert.match(client, /\.pm-desc-more\{[^}]*background:transparent[^}]*font:900/s);
	assert.match(client, /source\.type === "github" \? t\("source\.repositories"/);
	assert.doesNotMatch(client, /children: source\.enabled !== false \? t\("source\.enabled"\)/);
	assert.match(client, /\.pm-source-list\{align-items:start\}/);
	assert.match(client, /"data-open": open/);
	assert.match(client, /\.pm-installed-registry-host\{[^}]*position:relative[^}]*z-index:2[^}]*pointer-events:auto/s);
	assert.match(client, /\.pm-installed-expand\{[^}]*position:relative[^}]*z-index:3[^}]*pointer-events:auto/s);
});


test("all published documentation files exist", async () => {
	await Promise.all(["README.md", "LICENSE", "icon.svg", "lib/index.js", "lib/client.js", "lib/core.js", "cordis.patch.yml"].map((path) => access(new URL(path, root))));
});
