import test from "node:test";
import assert from "node:assert/strict";
import {
	browseSources,
	createAdapter,
	dedupePlugins,
	fetchJson,
	normalizePlugin,
	searchPlugins,
} from "../lib/core.js";

const publicDns = async () => ["93.184.216.34"];
const jsonResponse = (value, init = {}) => new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" }, ...init });
const source = (overrides = {}) => ({ id: "community", name: "Community", type: "custom-json", url: "https://catalog.example/plugins.json", enabled: true, ...overrides });

test("normalizes and merges duplicate npm identities with all source attributions", () => {
	const first = normalizePlugin({ name: "PDF tools", package: "@acme/pdf", version: "1.0.0", repository: "https://github.com/acme/pdf.git" }, source());
	const second = normalizePlugin({ name: "pdf", packageName: "@acme/pdf", version: "1.1.0", description: "Longer description" }, source({ id: "npm", name: "npm", type: "npm", url: undefined }));
	const plugins = dedupePlugins([first, second]);
	assert.equal(plugins.length, 1);
	assert.deepEqual(plugins[0].sources.map((row) => row.id), ["community", "npm"]);
	assert.deepEqual(plugins[0].versions, ["1.0.0", "1.1.0"]);
	assert.equal(plugins[0].description, "Longer description");
	assert.equal(plugins[0].install.type, "npm");
});

test("uses canonical repository then source-specific fallback identities", () => {
	const a = normalizePlugin({ id: "one", name: "Repo plugin", repository: "git+https://github.com/acme/tool.git" }, source());
	const b = normalizePlugin({ id: "two", name: "Renamed", repository: "https://github.com/acme/tool/" }, source({ id: "other", name: "Other" }));
	const localA = normalizePlugin({ id: "same", name: "Local" }, source());
	const localB = normalizePlugin({ id: "same", name: "Local" }, source({ id: "other", name: "Other" }));
	assert.equal(dedupePlugins([a, b]).length, 1);
	assert.equal(dedupePlugins([localA, localB]).length, 2);
});

test("searches normalized metadata and source badges", () => {
	const plugin = normalizePlugin({ name: "PDF Tools", description: "Split documents", package: "@acme/pdf" }, source());
	assert.equal(searchPlugins([plugin], "split").length, 1);
	assert.equal(searchPlugins([plugin], "community").length, 1);
	assert.equal(searchPlugins([plugin], "missing").length, 0);
});

test("normalizes display tags from explicit catalog, npm, and GitHub metadata", () => {
	const plugin = normalizePlugin({
		name: "Schedule UI",
		package: "@acme/schedule",
		keywords: ["client-plugin", "schedule", "deepseek-harness", "dsh-plugin-theme"],
		topics: ["dsh-plugin-provider", "unrelated"],
		category: "workflow",
	}, source());
	assert.deepEqual(plugin.tags, ["ui", "schedule", "theme", "provider", "workflow"]);
	const merged = dedupePlugins([
		plugin,
		normalizePlugin({ name: "Schedule UI", package: "@acme/schedule", tags: ["integration", "tool"] }, source({ id: "other", name: "Other" })),
	]);
	assert.deepEqual(merged[0].tags, ["ui", "schedule", "theme", "provider", "workflow", "integration", "tool"]);
});

test("rejects command-like install specs instead of exposing unsafe copy commands", () => {
	const plugin = normalizePlugin({ name: "Bad", id: "bad", install: { type: "npm", spec: "safe; remove-everything" } }, source());
	assert.equal(plugin.install, undefined);
});

test("custom JSON adapter accepts plugins envelope and applies result cap", async () => {
	const adapter = createAdapter(source(), {
		fetchImpl: async () => jsonResponse({ plugins: [{ name: "one", package: "one" }, { name: "two", package: "two" }] }),
		resolveHost: publicDns,
		maxPlugins: 1,
	});
	const plugins = await adapter.list();
	assert.equal(plugins.length, 1);
	assert.equal(plugins[0].identity.package, "one");
});

test("npm adapter searches canonical and compatibility discovery keywords then deduplicates", async () => {
	const queries = [];
	const adapter = createAdapter({ id: "npm", name: "npm", type: "npm", enabled: true }, {
		fetchImpl: async (url) => {
			queries.push(decodeURIComponent(String(url)));
			return jsonResponse({ objects: [{ package: { name: "@stolyarovmn/dsh-client-ui-schedule-tab", version: "0.4.1", description: "Schedule", links: { repository: "https://github.com/Stolyarovmn/dsh-schedule-tab" } } }] });
		},
		resolveHost: publicDns,
	});
	const plugins = await adapter.search("schedule");
	assert.equal(plugins.length, 1);
	assert.equal(plugins[0].identity.package, "@stolyarovmn/dsh-client-ui-schedule-tab");
	assert.deepEqual(plugins[0].install, { type: "npm", spec: "@stolyarovmn/dsh-client-ui-schedule-tab@0.4.1" });
	for (const keyword of ["dsh-plugin", "deepseek-harness", "deepseek-harness-plugin", "dsh-plugins"]) {
		assert.ok(queries.some((query) => query.includes(`keywords:${keyword}`)), `missing npm discovery keyword ${keyword}`);
	}
});

test("GitHub adapter searches plugin topics and deduplicates the same repository", async () => {
	const queries = [];
	const adapter = createAdapter({ id: "github", name: "GitHub", type: "github", enabled: true }, {
		fetchImpl: async (url) => {
			queries.push(decodeURIComponent(String(url)));
			return jsonResponse({ items: [{ id: 1, name: "dsh-schedule-tab", description: "Schedule", html_url: "https://github.com/Stolyarovmn/dsh-schedule-tab", stargazers_count: 1 }] });
		},
		resolveHost: publicDns,
	});
	const plugins = await adapter.search("schedule");
	assert.equal(plugins.length, 1);
	assert.equal(plugins[0].identity.repository, "https://github.com/stolyarovmn/dsh-schedule-tab");
	for (const topic of ["dsh-plugin", "deepseek-harness-plugin", "dsh-plugins"]) {
		assert.ok(queries.some((query) => query.includes(`topic:${topic}`)), `missing GitHub discovery topic ${topic}`);
	}
});

test("blocks private destinations and redirects before the next request", async () => {
	let calls = 0;
	await assert.rejects(() => fetchJson("http://127.0.0.1/catalog", source(), { fetchImpl: async () => { calls++; return jsonResponse([]); } }), /private network/);
	assert.equal(calls, 0);
	await assert.rejects(() => fetchJson("https://public.example/catalog", source(), {
		resolveHost: async (host) => host === "public.example" ? ["93.184.216.34"] : ["10.0.0.8"],
		fetchImpl: async () => { calls++; return new Response(null, { status: 302, headers: { location: "http://internal.example/catalog" } }); },
	}), /private network/);
	assert.equal(calls, 1);
});

test("contains malformed, oversized, and unavailable sources without fake results", async () => {
	const malformed = await browseSources([source()], "", { fetchImpl: async () => new Response("not-json"), resolveHost: publicDns });
	assert.deepEqual(malformed.plugins, []);
	assert.equal(malformed.sources[0].health.ok, false);
	assert.match(malformed.sources[0].health.error, /malformed JSON/);

	await assert.rejects(() => fetchJson("https://catalog.example/x", source(), {
		fetchImpl: async () => new Response("123456", { headers: { "content-length": "6" } }), resolveHost: publicDns, maxResponseBytes: 5,
	}), /exceeds 5 bytes/);

	const unavailable = await browseSources([source()], "", { fetchImpl: async () => { throw new Error("offline"); }, resolveHost: publicDns });
	assert.deepEqual(unavailable.plugins, []);
	assert.match(unavailable.sources[0].health.error, /offline/);
});

test("uses only a Host-supplied bearer token and never returns it in source output", async () => {
	let authorization;
	const adapter = createAdapter(source(), {
		authToken: "secret-value",
		resolveHost: publicDns,
		fetchImpl: async (_url, init) => { authorization = init.headers.authorization; return jsonResponse([]); },
	});
	await adapter.list();
	assert.equal(authorization, "Bearer secret-value");
	assert.equal(JSON.stringify(adapter.source).includes("secret-value"), false);
	assert.equal("tokenEnv" in adapter.source, false);
});

test("merges repository-only records into package-plus-repository records", () => {
	const packageRecord = normalizePlugin({ name: "Tool", package: "@acme/tool", repository: "https://github.com/acme/tool" }, source());
	const repositoryRecord = normalizePlugin({ name: "Tool mirror", repository: "https://github.com/acme/tool.git" }, source({ id: "github", name: "GitHub", type: "github", url: undefined }));
	const merged = dedupePlugins([packageRecord, repositoryRecord]);
	assert.equal(merged.length, 1);
	assert.equal(merged[0].identity.package, "@acme/tool");
	assert.equal(merged[0].sources.length, 2);
});

test("blocks IPv4-mapped IPv6 and pins the validated public address", async () => {
	await assert.rejects(() => fetchJson("https://catalog.example/x", source(), {
		resolveHost: async () => ["::ffff:127.0.0.1"], fetchImpl: async () => jsonResponse([]),
	}), /private network/);
	let pinned;
	await fetchJson("https://catalog.example/x", source(), {
		resolveHost: async () => [{ address: "93.184.216.34", family: 4 }],
		dispatcherFactory: (address) => { pinned = address; return { close: async () => {} }; },
		fetchImpl: async (_url, init) => { assert.ok(init.dispatcher); return jsonResponse([]); },
	});
	assert.deepEqual(pinned, { address: "93.184.216.34", family: 4 });
});

test("rejects cross-origin redirects when Host auth is attached", async () => {
	await assert.rejects(() => fetchJson("https://catalog.example/x", source(), {
		authToken: "secret",
		resolveHost: publicDns,
		fetchImpl: async () => new Response(null, { status: 302, headers: { location: "https://attacker.example/x" } }),
	}), /cannot redirect to another origin/);
});

test("caps source count and aggregate plugin results", async () => {
	await assert.rejects(() => browseSources([source(), source({ id: "two" })], "", { maxSources: 1 }), /at most 1/);
	const result = await browseSources([source()], "", {
		maxTotalPlugins: 1,
		resolveHost: publicDns,
		fetchImpl: async () => jsonResponse([{ name: "one", package: "one" }, { name: "two", package: "two" }]),
	});
	assert.equal(result.plugins.length, 1);
});
