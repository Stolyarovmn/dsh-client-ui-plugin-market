import test from "node:test";
import assert from "node:assert/strict";
import { apply, NAMESPACE, RPC_CHANNEL, RPC_PREFIX } from "../lib/index.js";

function hostFixture(sources = []) {
	const routes = new Map();
	let registeredNamespace;
	let schema;
	const scope = { get: () => ({ sources }) };
	const ctx = {
		settings: {
			register(namespace, nextSchema, options) {
				registeredNamespace = namespace;
				schema = nextSchema;
				assert.deepEqual(options.base, { sources: [] });
				return scope;
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
		inject(dependencies, callback) {
			assert.ok(
				JSON.stringify(dependencies) === JSON.stringify(["settings"])
				|| JSON.stringify(dependencies) === JSON.stringify(["connection"]),
				`unexpected dependency set ${JSON.stringify(dependencies)}`,
			);
			callback(this);
		},
	};
	apply(ctx, { timeoutMs: 500, maxResponseBytes: 4096, maxPlugins: 10, maxSources: 5, maxTotalPlugins: 20, maxRpcBytes: 65536, concurrency: 2, privateSourceIds: [], auth: [] });

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
	return { call, routes, registeredNamespace, schema };
}

test("registers durable source config and exact authenticated API routes", () => {
	const fixture = hostFixture();
	assert.equal(fixture.registeredNamespace, NAMESPACE);
	assert.equal(typeof fixture.schema.toJSON, "function");
	assert.ok(fixture.routes.has("/api/plugin-sources/health"));
	assert.ok(fixture.routes.has("/api/plugin-sources/browse"));
});

test("validates browse query payload", async () => {
	const { call } = hostFixture();
	const invalid = await call("browse", { query: 42 });
	assert.equal(invalid.ok, false);
	assert.equal(invalid.error.code, "plugin-sources/invalid-request");
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
