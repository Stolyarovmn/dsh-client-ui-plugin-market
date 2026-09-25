import test from "node:test";
import assert from "node:assert/strict";
import {
	browseSources,
	createAdapter,
	dedupePlugins,
	fetchJson,
	githubPluginDetails,
	normalizePlugin,
	npmPluginDetails,
	searchPlugins,
	releaseChannel,
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

test("classifies stable and prerelease versions", () => {
	assert.equal(releaseChannel("1.2.3"), "stable");
	assert.equal(releaseChannel("1.2.3+build.5"), "stable");
	assert.equal(releaseChannel("1.2.3-alpha.1"), "alpha");
	assert.equal(releaseChannel("1.2.3-beta.2"), "beta");
	assert.equal(releaseChannel("1.2.3-rc.4"), "rc");
	assert.equal(releaseChannel("1.2.3-next.1"), "prerelease");
	assert.equal(releaseChannel("dev"), undefined);
});

test("preserves source ratings and derives release channel", () => {
	const plugin = normalizePlugin({
		name: "Rated",
		package: "@acme/rated",
		version: "2.0.0-beta.1",
		evidence: { rating: 4.7, ratingCount: 23, stars: 42, downloads30d: 900 },
	}, source());
	assert.deepEqual(plugin.evidence, {
		stars: 42,
		downloads30d: 900,
		rating: 4.7,
		ratingCount: 23,
		releaseChannel: "beta",
	});
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

test("Browse partial search filters the canonical npm plugin set locally instead of trusting npm query ranking", async () => {
	const npm = { id: "npm", name: "npm", type: "npm", enabled: true };
	const packageName = "@stolyarovmn/dsh-client-ui-schedule-tab";
	const requests = [];
	const result = await browseSources([npm], "schedule", {
		resolveHost: publicDns,
		verifyInstallability: true,
		enrichDownloads: false,
		fetchImpl: async (url) => {
			const value = decodeURIComponent(String(url));
			requests.push(value);
			if (value.includes("/-/v1/search")) {
				const textParam = new URL(String(url)).searchParams.get("text") ?? "";
				// Simulate npm ranking/index behavior: query-specific search misses the
				// plugin, while normal DSH keyword discovery already knows about it.
				if (textParam.includes("schedule")) return jsonResponse({ objects: [] });
				return jsonResponse({ objects: [{
					package: {
						name: packageName,
						version: "0.4.5",
						description: "Global Schedule tab for DeepSeek Harness",
						keywords: ["dsh", "dsh-plugin", "deepseek-harness", "schedule"],
						links: { repository: "https://github.com/Stolyarovmn/dsh-schedule-tab" },
					},
				}] });
			}
			if (value.includes(packageName + "/0.4.5")) {
				return jsonResponse({ name: packageName, version: "0.4.5", dsh: { bundle: { patch: "./cordis.patch.yml" } } });
			}
			return new Response("not found", { status: 404 });
		},
	});
	assert.deepEqual(result.plugins.map((plugin) => plugin.identity.package), [packageName]);
	assert.equal(result.total, 1);
	assert.equal(requests.some((value) => value.includes("keywords:dsh-plugin") && !value.includes(" schedule")), true);
});

test("Browse matches a scoped npm package by its unscoped name fragment", async () => {
	const npm = { id: "npm", name: "npm", type: "npm", enabled: true };
	const packageName = "@stolyarovmn/dsh-client-ui-schedule-tab";
	const result = await browseSources([npm], "dsh-client-ui-schedule-tab", {
		resolveHost: publicDns,
		verifyInstallability: true,
		enrichDownloads: false,
		fetchImpl: async (url) => {
			const value = decodeURIComponent(String(url));
			if (value.includes("/-/v1/search")) {
				const textParam = new URL(String(url)).searchParams.get("text") ?? "";
				if (textParam.includes("dsh-client-ui-schedule-tab")) return jsonResponse({ objects: [] });
				return jsonResponse({ objects: [{
					package: {
						name: packageName,
						version: "0.4.5",
						description: "Global Schedule tab",
						keywords: ["dsh-plugin", "deepseek-harness"],
					},
				}] });
			}
			if (value.includes(packageName + "/0.4.5")) return jsonResponse({ dsh: { bundle: { patch: "./cordis.patch.yml" } } });
			return new Response("not found", { status: 404 });
		},
	});
	assert.deepEqual(result.plugins.map((plugin) => plugin.identity.package), [packageName]);
});

test("exact npm package search bypasses a stale npm search index via the latest manifest endpoint", async () => {
	const requests = [];
	const packageName = "@stolyarovmn/dsh-client-ui-schedule-tab";
	const adapter = createAdapter({ id: "npm", name: "npm", type: "npm", enabled: true }, {
		fetchImpl: async (url) => {
			const value = String(url);
			requests.push(value);
			if (value.includes("/-/v1/search")) return jsonResponse({ objects: [] });
			if (decodeURIComponent(value).includes(`${packageName}/latest`)) {
				return jsonResponse({
					name: packageName,
					version: "0.4.5",
					description: "Global Schedule tab",
					keywords: ["dsh", "dsh-plugin", "deepseek-harness"],
					repository: { type: "git", url: "git+https://github.com/Stolyarovmn/dsh-schedule-tab.git" },
					dsh: { bundle: { patch: "./cordis.patch.yml" } },
					peerDependencies: { "@deepseek-ai/dsh": ">=0.1.5-rc.3 <0.1.7-rc.2" },
				});
			}
			return jsonResponse({});
		},
		resolveHost: publicDns,
	});
	const plugins = await adapter.search(packageName);
	assert.equal(plugins.length, 1);
	assert.equal(plugins[0].identity.package, packageName);
	assert.equal(plugins[0].version, "0.4.5");
	assert.equal(plugins[0].evidence.installability, "bundle");
	assert.equal(plugins[0].evidence.dshCompatibility, ">=0.1.5-rc.3 <0.1.7-rc.2");
	assert.ok(requests.some((url) => decodeURIComponent(url).includes(`${packageName}/latest`)));
});

test("GitHub health reports the deduplicated discovery set instead of the raw polluted topic total", async () => {
	const queries = [];
	const adapter = createAdapter({ id: "github", name: "GitHub", type: "github", enabled: true }, {
		fetchImpl: async (url) => {
			queries.push(new URL(String(url)).searchParams.get("q"));
			return jsonResponse({
				total_count: 16083,
				items: [{ id: 1, name: "demo", html_url: "https://github.com/acme/demo", topics: ["deepseek-harness", "dsh-plugin"] }],
			});
		},
		resolveHost: publicDns,
	});
	const health = await adapter.health();
	assert.equal(health.ok, true);
	assert.equal(health.count, 1);
	assert.equal(queries.length, 3);
	assert.ok(queries.some((query) => query.includes("topic:deepseek-harness topic:dsh-plugin")));
	assert.ok(queries.some((query) => query.includes("topic:deepseek-harness-plugin")));
	assert.ok(queries.some((query) => query.includes("topic:deepseek-harness topic:dsh-plugins")));
});

test("registry source health counts only verified installable DSH bundles when verification is enabled", async () => {
	const adapter = createAdapter({ id: "npm", name: "npm", type: "npm", enabled: true }, {
		resolveHost: publicDns,
		verifyInstallability: true,
		fetchImpl: async (url) => {
			const value = decodeURIComponent(String(url));
			if (value.includes("/-/v1/search")) {
				return jsonResponse({ objects: [
					{ package: { name: "installable", version: "1.0.0", keywords: ["dsh-plugin"] } },
					{ package: { name: "docs-only", version: "1.0.0", keywords: ["dsh-plugin"] } },
				] });
			}
			if (value.includes("installable/1.0.0")) return jsonResponse({ dsh: { bundle: { patch: "./cordis.patch.yml" } } });
			return jsonResponse({});
		},
	});
	const health = await adapter.health();
	assert.equal(health.ok, true);
	assert.equal(health.count, 1);
});

test("GitHub adapter searches plugin topics and deduplicates the same repository", async () => {
	const queries = [];
	const adapter = createAdapter({ id: "github", name: "GitHub", type: "github", enabled: true }, {
		fetchImpl: async (url) => {
			queries.push(new URL(String(url)).searchParams.get("q"));
			return jsonResponse({ items: [{ id: 1, name: "dsh-schedule-tab", description: "Schedule", html_url: "https://github.com/Stolyarovmn/dsh-schedule-tab", stargazers_count: 1 }] });
		},
		resolveHost: publicDns,
	});
	const plugins = await adapter.search("schedule");
	assert.equal(plugins.length, 1);
	assert.equal(plugins[0].identity.repository, "https://github.com/stolyarovmn/dsh-schedule-tab");
	assert.ok(queries.some((query) => query.includes("topic:deepseek-harness topic:dsh-plugin")));
	assert.ok(queries.some((query) => query.includes("topic:deepseek-harness-plugin")));
	assert.ok(queries.some((query) => query.includes("topic:deepseek-harness topic:dsh-plugins")));
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

test("browse enriches npm packages with last-month download counts without failing the catalog", async () => {
	const npmSource = { id: "npm", name: "npm", type: "npm", enabled: true };
	const result = await browseSources([npmSource], "schedule", {
		resolveHost: publicDns,
		maxPlugins: 10,
		fetchImpl: async (url) => {
			const value = decodeURIComponent(String(url));
			if (value.includes("api.npmjs.org/downloads/point/last-month/")) {
				return jsonResponse({ downloads: 1234, package: "@acme/dsh-schedule", start: "2026-08-25", end: "2026-09-23" });
			}
			return jsonResponse({ objects: [{
				package: {
					name: "@acme/dsh-schedule",
					version: "1.0.0",
					description: "Schedule",
					keywords: ["dsh-plugin", "schedule"],
				},
			}] });
		},
	});
	assert.equal(result.plugins.length, 1);
	assert.equal(result.plugins[0].evidence.releaseChannel, "stable");
	assert.equal(result.plugins[0].evidence.downloads30d, 1234);
});

test("queries scoped npm download counts individually because npm bulk point queries do not support scopes", async () => {
	const npmSource = { id: "npm", name: "npm", type: "npm", enabled: true };
	const downloadUrls = [];
	const result = await browseSources([npmSource], "scoped-evidence", {
		resolveHost: publicDns,
		maxPlugins: 10,
		fetchImpl: async (url) => {
			const value = decodeURIComponent(String(url));
			if (value.includes("api.npmjs.org/downloads/point/last-month/")) {
				downloadUrls.push(value);
				if (value.endsWith("@acme/dsh-one")) return jsonResponse({ downloads: 11, package: "@acme/dsh-one" });
				if (value.endsWith("@acme/dsh-two")) return jsonResponse({ downloads: 22, package: "@acme/dsh-two" });
				throw new Error(`unexpected downloads URL ${value}`);
			}
			return jsonResponse({ objects: [
				{ package: { name: "@acme/dsh-one", version: "1.0.0", description: "scoped-evidence", keywords: ["dsh-plugin"] } },
				{ package: { name: "@acme/dsh-two", version: "1.0.0", description: "scoped-evidence", keywords: ["dsh-plugin"] } },
			] });
		},
	});
	assert.equal(downloadUrls.length, 2);
	assert.ok(downloadUrls.every((url) => !url.includes(",")), "scoped packages must not be combined into a bulk downloads request");
	const counts = new Map(result.plugins.map((plugin) => [plugin.identity.package, plugin.evidence?.downloads30d]));
	assert.equal(counts.get("@acme/dsh-one"), 11);
	assert.equal(counts.get("@acme/dsh-two"), 22);
});

test("paginates before optional npm evidence enrichment", async () => {
	const rows = Array.from({ length: 55 }, (_, index) => ({ name: `plugin-${String(index + 1).padStart(2, "0")}`, package: `plugin-${index + 1}`, version: "1.0.0" }));
	const result = await browseSources([source()], "", {
		resolveHost: publicDns,
		fetchImpl: async () => jsonResponse(rows),
		enrichDownloads: false,
		page: 2,
		pageSize: 20,
		sort: "name",
	});
	assert.equal(result.total, 55);
	assert.equal(result.page, 2);
	assert.equal(result.pageSize, 20);
	assert.equal(result.pageCount, 3);
	assert.equal(result.plugins.length, 20);
	assert.equal(result.plugins[0].name, "plugin-21");
});

test("sorts GitHub star evidence globally before slicing a page", async () => {
	const githubSource = { id: "github", name: "GitHub", type: "github", enabled: true };
	const result = await browseSources([githubSource], "", {
		resolveHost: publicDns,
		fetchImpl: async () => jsonResponse({ items: [
			{ id: 1, name: "one", html_url: "https://github.com/acme/one", stargazers_count: 5, topics: ["dsh-plugin"] },
			{ id: 2, name: "two", html_url: "https://github.com/acme/two", stargazers_count: 50, topics: ["dsh-plugin"] },
			{ id: 3, name: "three", html_url: "https://github.com/acme/three", stargazers_count: 20, topics: ["dsh-plugin"] },
		] }),
		enrichDownloads: false,
		page: 1,
		pageSize: 20,
		sort: "stars",
	});
	assert.deepEqual(result.plugins.map((plugin) => plugin.evidence?.stars), [50, 20, 5]);
});

test("captures npm freshness, monthly downloads, and maintenance evidence from search", async () => {
	const adapter = createAdapter({ id: "npm", name: "npm", type: "npm", enabled: true }, {
		resolveHost: publicDns,
		fetchImpl: async () => jsonResponse({ objects: [{
			downloads: { monthly: 321, weekly: 80 },
			updated: "2026-09-20T10:00:00.000Z",
			score: { detail: { maintenance: 0.92 } },
			package: {
				name: "@acme/fresh",
				version: "1.2.3",
				description: "Fresh plugin",
				keywords: ["dsh-plugin"],
				date: "2026-09-21T12:00:00.000Z",
			},
		}] }),
	});
	const [plugin] = await adapter.search("fresh");
	assert.equal(plugin.evidence.downloads30d, 321);
	assert.equal(plugin.evidence.maintenanceScore, 0.92);
	assert.equal(plugin.evidence.releasedAt, "2026-09-21T12:00:00.000Z");
});

test("reuses discovery rows across pagination and invalidates only on refresh revision", async () => {
	let calls = 0;
	const cachedSource = source({ id: "cache-performance", url: "https://catalog.example/cache-performance.json" });
	const fetchImpl = async () => {
		calls += 1;
		return jsonResponse({ plugins: Array.from({ length: 45 }, (_, index) => ({ name: `plugin-${index}`, package: `plugin-${index}`, version: "1.0.0" })) });
	};
	const options = { fetchImpl, resolveHost: publicDns, cacheDiscovery: true, enrichDownloads: false, pageSize: 20 };

	const first = await browseSources([cachedSource], "", { ...options, page: 1, refreshRevision: 0 });
	const second = await browseSources([cachedSource], "", { ...options, page: 2, refreshRevision: 0 });
	assert.equal(first.plugins.length, 20);
	assert.equal(second.plugins.length, 20);
	assert.equal(calls, 1);

	await browseSources([cachedSource], "", { ...options, page: 2, refreshRevision: 1 });
	assert.equal(calls, 2);
});

test("supports ordered multi-criteria ranking with independent directions", async () => {
	const rows = [
		{ name: "fresh-popular", package: "fresh-popular", version: "1.0.0", evidence: { downloads30d: 800, stars: 50, releasedAt: "2026-09-20T00:00:00Z" } },
		{ name: "fresh-more-downloads", package: "fresh-more-downloads", version: "1.0.0", evidence: { downloads30d: 1200, stars: 10, releasedAt: "2026-09-20T00:00:00Z" } },
		{ name: "newest-low", package: "newest-low", version: "1.0.0", evidence: { downloads30d: 20, stars: 1, releasedAt: "2026-09-23T00:00:00Z" } },
		{ name: "old-huge", package: "old-huge", version: "1.0.0", evidence: { downloads30d: 5000, stars: 500, releasedAt: "2025-01-01T00:00:00Z" } },
	];
	const opts = { resolveHost: publicDns, fetchImpl: async () => jsonResponse(rows), enrichDownloads: false, pageSize: 20 };

	const ranked = await browseSources([source()], "", {
		...opts,
		sorts: [
			{ key: "freshness", direction: "desc" },
			{ key: "downloads", direction: "desc" },
			{ key: "stars", direction: "desc" },
		],
	});
	assert.deepEqual(ranked.plugins.map((plugin) => plugin.name), [
		"newest-low",
		"fresh-more-downloads",
		"fresh-popular",
		"old-huge",
	]);

	const reverseStars = await browseSources([source()], "", {
		...opts,
		sorts: [{ key: "stars", direction: "asc" }],
	});
	assert.deepEqual(reverseStars.plugins.map((plugin) => plugin.evidence?.stars), [1, 10, 50, 500]);
});

test("npm package details classify only manifests with dsh.bundle.patch as installable bundles", async () => {
	const bundle = await npmPluginDetails("@acme/bundle", "1.0.0", {
		resolveHost: publicDns,
		fetchImpl: async () => jsonResponse({ dsh: { bundle: { patch: "./cordis.patch.yml" } } }),
	});
	assert.equal(bundle.installability, "bundle");
	assert.equal(bundle.bundlePatch, "./cordis.patch.yml");

	const related = await npmPluginDetails("@acme/catalog", "1.0.0", {
		resolveHost: publicDns,
		fetchImpl: async () => jsonResponse({ keywords: ["dsh-plugin"] }),
	});
	assert.equal(related.installability, "not-bundle");
});

test("GitHub package details verify the root manifest before treating a repository as an installable bundle", async () => {
	const urls = [];
	const bundle = await githubPluginDetails("https://github.com/acme/plugin", {
		resolveHost: publicDns,
		fetchImpl: async (url) => {
			urls.push(String(url));
			return jsonResponse({ name: "@acme/plugin", dsh: { bundle: { patch: "./cordis.patch.yml" } } });
		},
	});
	assert.equal(bundle.installability, "bundle");
	assert.equal(bundle.bundlePatch, "./cordis.patch.yml");
	assert.ok(urls.some((url) => url.includes("raw.githubusercontent.com/acme/plugin/HEAD/package.json")));

	const related = await githubPluginDetails("https://github.com/acme/docs-only", {
		resolveHost: publicDns,
		fetchImpl: async () => jsonResponse({ name: "docs-only", private: true }),
	});
	assert.equal(related.installability, "not-bundle");
});

test("Browse removes npm candidates that are not real DSH bundles before totals and pagination", async () => {
	const npm = { id: "npm", name: "npm", type: "npm", enabled: true };
	const result = await browseSources([npm], "", {
		resolveHost: publicDns,
		verifyInstallability: true,
		enrichDownloads: false,
		fetchImpl: async (url) => {
			const value = decodeURIComponent(String(url));
			if (value.includes("/-/v1/search")) {
				return jsonResponse({ objects: [
					{ package: { name: "real-bundle", version: "1.0.0", keywords: ["dsh-plugin"] } },
					{ package: { name: "related-catalog", version: "1.0.0", keywords: ["dsh-plugin"] } },
				] });
			}
			if (value.includes("real-bundle/1.0.0")) return jsonResponse({ dsh: { bundle: { patch: "./cordis.patch.yml" } } });
			if (value.includes("related-catalog/1.0.0")) return jsonResponse({ keywords: ["dsh-plugin"] });
			return jsonResponse({});
		},
	});
	assert.deepEqual(result.plugins.map((plugin) => plugin.name), ["real-bundle"]);
	assert.equal(result.plugins[0].evidence.installability, "bundle");
	assert.equal(result.total, 1);
	assert.equal(result.pageCount, 1);
});

test("reads explicit DSH compatibility and DSH API peers from npm version metadata", async () => {
	const explicit = await npmPluginDetails("@acme/explicit", "1.0.0", {
		resolveHost: publicDns,
		fetchImpl: async () => jsonResponse({
			peerDependencies: { "@deepseek-ai/dsh": ">=0.1.7-rc.1 <0.2.0", "@deepseek-ai/dsh-client-ui-slots": "^0.1.7" },
		}),
	});
	assert.equal(explicit.dshCompatibility, ">=0.1.7-rc.1 <0.2.0");
	assert.equal(explicit.dshPeers[0].dependency, "@deepseek-ai/dsh-client-ui-slots");

	const peersOnly = await npmPluginDetails("@acme/legacy", "2.0.0", {
		resolveHost: publicDns,
		fetchImpl: async () => jsonResponse({
			peerDependencies: { "@deepseek-ai/dsh-settings": "^0.1.2-alpha.2", "@deepseek-ai/cordis": "^4.0.1" },
		}),
	});
	assert.equal(peersOnly.dshCompatibility, undefined);
	assert.deepEqual(peersOnly.dshPeers, [{ dependency: "@deepseek-ai/dsh-settings", range: "^0.1.2-alpha.2" }]);
});

test("combines stable, freshness, category, and declared-DSH metadata filters", async () => {
	const rows = [
		{ name: "fresh-ui", package: "fresh-ui", version: "1.0.0", tags: ["ui"], evidence: { releasedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(), dshCompatibility: ">=0.1.7-rc.1 <0.2.0" } },
		{ name: "fresh-tool", package: "fresh-tool", version: "1.0.0", tags: ["tool"], evidence: { releasedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(), dshCompatibility: ">=0.1.7-rc.1 <0.2.0" } },
		{ name: "old-ui", package: "old-ui", version: "1.0.0", tags: ["ui"], evidence: { releasedAt: new Date(Date.now() - 500 * 86_400_000).toISOString(), dshCompatibility: ">=0.1.7-rc.1 <0.2.0" } },
		{ name: "fresh-ui-unknown", package: "fresh-ui-unknown", version: "1.0.0", tags: ["ui"], evidence: { releasedAt: new Date(Date.now() - 5 * 86_400_000).toISOString() } },
		{ name: "fresh-ui-beta", package: "fresh-ui-beta", version: "1.0.0-beta.1", tags: ["ui"], evidence: { releasedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(), dshCompatibility: ">=0.1.7-rc.1 <0.2.0" } },
	];
	const result = await browseSources([source()], "", {
		resolveHost: publicDns,
		fetchImpl: async () => jsonResponse(rows),
		enrichDownloads: false,
		pageSize: 20,
		stableOnly: true,
		freshnessDays: 30,
		tag: "ui",
		dshMetadata: "declared",
	});
	assert.deepEqual(result.plugins.map((plugin) => plugin.name), ["fresh-ui"]);
	assert.equal(result.total, 1);
});

test("can filter unknown DSH metadata without probing npm manifests", async () => {
	const rows = [
		{ name: "declared", package: "declared", version: "1.0.0", evidence: { dshCompatibility: ">=0.1.7-rc.1" } },
		{ name: "unknown", package: "unknown", version: "1.0.0" },
	];
	const result = await browseSources([source()], "", {
		resolveHost: publicDns,
		fetchImpl: async () => jsonResponse(rows),
		enrichDownloads: false,
		pageSize: 20,
		dshMetadata: "unknown",
	});
	assert.deepEqual(result.plugins.map((plugin) => plugin.name), ["unknown"]);
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
