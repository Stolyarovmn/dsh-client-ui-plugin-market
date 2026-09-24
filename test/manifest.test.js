import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("package declares both DSH faces and required client services", async () => {
	const pkg = JSON.parse(await read("package.json"));
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
	assert.equal(pkg.peerDependencies["@deepseek-ai/dsh"], ">=0.1.7-rc.1 <0.2.0");
	assert.equal(pkg.icon, "./icon.svg");
});

test("host entry keeps namespace metadata through the real Cordis Loader export rule", async () => {
	const host = await import(new URL("../lib/index.js", import.meta.url));
	assert.equal("default" in host, false, "default export makes Loader.unwrapExports discard Config/inject metadata");
	assert.equal(typeof host.apply, "function");
	assert.equal(host.name, "plugin-market");
	assert.equal(typeof host.Config?.["~standard"]?.validate, "function");

	// Mirror DSH 0.1.7 Loader.unwrapExports: it prefers .default when present.
	const unwrapped = host.default ?? host;
	assert.equal(unwrapped, host);
	assert.equal(unwrapped.Config, host.Config);
});

test("bundle patch activates this package exactly once", async () => {
	const patch = await read("cordis.patch.yml");
	assert.match(patch, /- id: plugin-market/);
	assert.equal((patch.match(/@stolyarovmn\/dsh-client-ui-plugin-market/g) ?? []).length, 1);
});

test("production client uses Connection RPC and contains no arbitrary remote fetch or sample fallback", async () => {
	const client = await read("lib/client.js");
	const host = await read("lib/index.js");
	assert.match(client, /connection\.rpc\.call\(CHANNEL/);
	assert.match(client, /ctx\.configForms\?\.get\?\.\(NS\)/);
	assert.match(client, /plugins\.bundle\.config/);
	assert.match(client, /plugins\.bundle\.activation/);
	assert.match(client, /Marketplace ready/);
	assert.match(client, /remote\.pluginManager\.inspect\(spec\)/);
	assert.match(client, /remote\.pluginManager\.installBundle\(spec, \{ activate: false \}\)/);
	assert.doesNotMatch(client, /settingsScope|settings\.plugins\.tab|settings\.section/);
	assert.match(host, /connection\.fetch\.register\(route\("health"\)\)/);
	assert.match(host, /connection\.fetch\.register\(route\("browse"\)\)/);
	assert.doesNotMatch(host, /export default apply/);
	assert.doesNotMatch(client, /\bfetch\s*\(/);
	assert.doesNotMatch(client, /sampleCatalog|__PM_RESOLVER__/);
	assert.doesNotMatch(client, /tokenEnv|allowPrivateNetwork/);
});

test("all published documentation files exist", async () => {
	await Promise.all(["README.md", "LICENSE", "icon.svg", "lib/index.js", "lib/client.js", "lib/core.js", "cordis.patch.yml"].map((path) => access(new URL(path, root))));
});
