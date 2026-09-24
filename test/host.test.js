import test from "node:test";
import assert from "node:assert/strict";
import { apply, DEFAULT_SOURCES, NAMESPACE, RPC_CHANNEL, RPC_PREFIX } from "../lib/index.js";

function hostFixture(sources = []) {
	const routes = new Map();
	let settingsConfigured = false;
	const config = {
		sources: { get: () => sources },
		timeoutMs: 500,
		maxResponseBytes: 4096,
		maxPlugins: 10,
		maxSources: 5,
		maxTotalPlugins: 20,
		maxRpcBytes: 65536,
		concurrency: 2,
		privateSourceIds: [],
		auth: [],
	};
	const ctx = {
		fiber: { id: "registry-aggregator" },
		settings: {
			configure(options, owner) {
				assert.deepEqual(options, { auto: false });
				assert.equal(owner, ctx.fiber);
				settingsConfigured = true;
				return () => {};
			},
		},
		connection: {
			fetch: {
				register(route) {
					routes.set(route.path, route);
					return async () => routes.delete(route.path);
				},
			},
		},
		effect(effect) { return effect(); },
		inject(dependencies, callback) {
			assert.ok(
				JSON.stringify(dependencies) === JSON.stringify(["settings"])
					|| JSON.stringify(dependencies) === JSON.stringify(["connection"]),
				`unexpected dependency set ${JSON.stringify(dependencies)}`,
			);
			callback(this);
		},
	};
	apply(ctx, config);

	async function call(endpoint, payload = {}) {
		const method = `${RPC_PREFIX}/${endpoint}`;
		const route = routes.get(`${RPC_CHANNEL}/${method}`);
		assert.ok(route, `missing route for ${method}`);
		const response = await route.fetch(new Request(`http://dsh.local${route.path}`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ type: "client-request", rpcId: "test-id", method, payload }),
		}));
		assert.equal(response.status, 200);
		return (await response.json()).result;
	}
	return { call, routes, settingsConfigured };
}

test("defaults to npm plus GitHub so Browse can merge download and star evidence", () => {
	assert.deepEqual(DEFAULT_SOURCES.map(({ id, type, enabled }) => ({ id, type, enabled })), [
		{ id: "npm", type: "npm", enabled: true },
		{ id: "github", type: "github", enabled: true },
	]);
});

test("exposes source config through the plugin entry and exact authenticated API routes", () => {
	const fixture = hostFixture();
	assert.equal(NAMESPACE, "registry-aggregator");
	assert.equal(fixture.settingsConfigured, true);
	assert.ok(fixture.routes.has("/api/plugin-sources/health"));
	assert.ok(fixture.routes.has("/api/plugin-sources/browse"));
	assert.ok(fixture.routes.has("/api/plugin-sources/details"));
});

test("validates paged browse payload", async () => {
	const { call } = hostFixture();
	for (const payload of [
		{ query: 42 },
		{ page: 0 },
		{ pageSize: 25 },
		{ healthOnly: "yes" },
		{ refreshRevision: -1 },
		{ sort: "unknown" },
		{ sorts: "stars" },
		{ sorts: [{ key: "unknown", direction: "desc" }] },
		{ sorts: [{ key: "stars", direction: "sideways" }] },
		{ sorts: [{ key: "stars", direction: "desc" }, { key: "stars", direction: "asc" }] },
		{ stableOnly: "yes" },
		{ freshnessDays: 31 },
		{ tag: "made-up" },
		{ dshMetadata: "guessed" },
	]) {
		const invalid = await call("browse", payload);
		assert.equal(invalid.ok, false);
		assert.equal(invalid.error.code, "plugin-sources/invalid-request");
	}
});

test("serves source health through the Browse route", async () => {
	const { call } = hostFixture([{ id: "npm", name: "npm", type: "npm", enabled: false }]);
	const result = await call("browse", { healthOnly: true });
	assert.equal(result.ok, true);
	assert.deepEqual(result.value.sources[0].health, { ok: false, disabled: true });
});

test("validates plugin detail requests before npm metadata lookup", async () => {
	const { call } = hostFixture();
	for (const payload of [{}, { package: 42, version: "1.0.0" }, { package: "demo", version: 1 }]) {
		const invalid = await call("details", payload);
		assert.equal(invalid.ok, false);
		assert.equal(invalid.error.code, "plugin-sources/invalid-request");
	}
});

test("disabled sources never trigger network and remain visible in health", async () => {
	const { call } = hostFixture([{ id: "private", name: "Private", type: "corporate", url: "http://10.0.0.1/catalog", enabled: false }]);
	const result = await call("health");
	assert.equal(result.ok, true);
	assert.deepEqual(result.value.sources[0].health, { ok: false, disabled: true });
});

test("rejects malformed Connection envelopes before dispatch", async () => {
	const fixture = hostFixture();
	const route = fixture.routes.get("/api/plugin-sources/health");
	const response = await route.fetch(new Request("http://dsh.local/api/plugin-sources/health", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ nope: true }),
	}));
	assert.equal(response.status, 400);
});
