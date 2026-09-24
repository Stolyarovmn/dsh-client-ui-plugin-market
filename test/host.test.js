import test from "node:test";
import assert from "node:assert/strict";
import { apply, NAMESPACE, RPC_CHANNEL } from "../lib/index.js";

function hostFixture(sources = []) {
	let handler;
	let registeredNamespace;
	let schema;
	const scope = { get: () => ({ sources }) };
	const ctx = {
		webServer: {},
		settings: {
			register(namespace, nextSchema, options) {
				registeredNamespace = namespace;
				schema = nextSchema;
				assert.deepEqual(options.base, { sources: [] });
				return scope;
			},
		},
		connection: {
			rpc: {
				handle(channel, nextHandler) {
					assert.equal(channel, RPC_CHANNEL);
					handler = nextHandler;
				},
			},
		},
		inject(dependencies, callback) {
			assert.ok(
				JSON.stringify(dependencies) === JSON.stringify(["settings"])
				|| JSON.stringify(dependencies) === JSON.stringify(["connection", "webServer"]),
				`unexpected dependency set ${JSON.stringify(dependencies)}`,
			);
			callback(this);
		},
	};
	apply(ctx, { timeoutMs: 500, maxResponseBytes: 4096, maxPlugins: 10, maxSources: 5, maxTotalPlugins: 20, maxRpcBytes: 65536, concurrency: 2, privateSourceIds: [], auth: [] });
	return { handler, registeredNamespace, schema };
}

test("registers durable source config and authenticated Connection RPC channel", () => {
	const fixture = hostFixture();
	assert.equal(fixture.registeredNamespace, NAMESPACE);
	assert.equal(typeof fixture.schema.toJSON, "function");
	assert.equal(typeof fixture.handler, "function");
});

test("validates RPC endpoint and query payload", async () => {
	const { handler } = hostFixture();
	const unknown = await handler("missing", {}, new AbortController().signal);
	assert.equal(unknown.ok, false);
	assert.equal(unknown.error.code, "plugin-sources/not-found");
	const invalid = await handler("browse", { query: 42 }, new AbortController().signal);
	assert.equal(invalid.ok, false);
	assert.equal(invalid.error.code, "plugin-sources/invalid-request");
});

test("disabled sources never trigger network and remain visible in health", async () => {
	const { handler } = hostFixture([{ id: "private", name: "Private", type: "corporate", url: "http://10.0.0.1/catalog", enabled: false, allowPrivateNetwork: true }]);
	const result = await handler("health", {}, new AbortController().signal);
	assert.equal(result.ok, true);
	assert.deepEqual(result.value.sources[0].health, { ok: false, disabled: true });
});
