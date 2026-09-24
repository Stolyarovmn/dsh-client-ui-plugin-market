import z from "@deepseek-ai/schemastery";
import { browseSources, healthSources, SOURCE_TYPES } from "./core.js";

export const NAMESPACE = "plugin-market";
export const RPC_CHANNEL = "/plugin-sources";

const SourceTypeSchema = z.union(SOURCE_TYPES.map((type) => z.const(type)));
const SourceAuthSchema = z.object({
	sourceId: z.string().required().comment("Source id allowed to use this credential."),
	tokenEnv: z.string().required().comment("Host environment variable containing its bearer token."),
});

export const PluginSourceSchema = z.object({
	id: z.string().required().comment("Stable source id."),
	name: z.string().default("").comment("Display name."),
	type: SourceTypeSchema.required().comment("Adapter type."),
	url: z.string().comment("Optional catalog or API URL."),
	enabled: z.boolean().default(true),
});

export const PluginSourcesSchema = z.object({
	sources: z.array(PluginSourceSchema).default([]),
});

export const Config = z.object({
	timeoutMs: z.natural().min(250).max(60_000).default(10_000),
	maxResponseBytes: z.natural().min(1_024).max(10 * 1024 * 1024).default(2 * 1024 * 1024),
	maxPlugins: z.natural().min(1).max(2_000).default(500),
	maxSources: z.natural().min(1).max(100).default(20),
	maxTotalPlugins: z.natural().min(1).max(5_000).default(1_000),
	maxRpcBytes: z.natural().min(16_384).max(20 * 1024 * 1024).default(4 * 1024 * 1024),
	concurrency: z.natural().min(1).max(16).default(4),
	privateSourceIds: z.array(z.string()).default([]).comment("Host-controlled source ids allowed to reach private networks."),
	auth: z.array(SourceAuthSchema).default([]).comment("Host-controlled source-to-token-environment allowlist."),
});

function failure(code, error, details = {}) {
	return { ok: false, error: { code, message: String(error?.message ?? error), details } };
}

function sourcesFrom(scope) {
	const sources = scope?.get()?.sources;
	return Array.isArray(sources) ? sources : [];
}

function queryFrom(payload) {
	if (payload === undefined || payload === null) return "";
	if (typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("payload must be an object");
	if (payload.query === undefined) return "";
	if (typeof payload.query !== "string") throw new TypeError("query must be a string");
	if (payload.query.length > 200) throw new RangeError("query is too long");
	return payload.query.trim();
}

function limitRpcValue(value, maxBytes) {
	const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
	if (bytes > maxBytes) throw new Error(`catalog RPC response exceeds ${maxBytes} bytes`);
	return value;
}

export function apply(ctx, config = {}) {
	let scope;
	ctx.inject(["settings"], (settingsCtx) => {
		scope = settingsCtx.settings.register(NAMESPACE, PluginSourcesSchema, { base: { sources: [] } });
	});

	ctx.inject(["connection", "webServer"], (rpcCtx) => {
		const auth = new Map((config.auth ?? []).map((row) => [row.sourceId, row.tokenEnv]));
		const privateSourceIds = new Set(config.privateSourceIds ?? []);
		const maxRpcBytes = config.maxRpcBytes ?? 4 * 1024 * 1024;
		const options = {
			timeoutMs: config.timeoutMs ?? 10_000,
			maxResponseBytes: config.maxResponseBytes ?? 2 * 1024 * 1024,
			maxPlugins: config.maxPlugins ?? 500,
			maxSources: config.maxSources ?? 20,
			maxTotalPlugins: config.maxTotalPlugins ?? 1_000,
			concurrency: config.concurrency ?? 4,
			resolveAllowPrivateNetwork: (source) => privateSourceIds.has(source.id),
			resolveAuthToken(source) {
				const tokenEnv = auth.get(source.id);
				if (!tokenEnv) return undefined;
				if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tokenEnv)) throw new Error(`invalid token environment variable configured for source ${source.id}`);
				const token = process.env[tokenEnv];
				if (!token) throw new Error(`configured credential for source ${source.id} is unavailable`);
				return token;
			},
		};
		rpcCtx.connection.rpc.handle(RPC_CHANNEL, async (endpoint, payload, signal) => {
			try {
				if (!scope) return failure("plugin-sources/unavailable", "plugin source settings are unavailable");
				const sources = sourcesFrom(scope);
				const requestOptions = { ...options, signal };
				if (endpoint === "browse") {
					const value = await browseSources(sources, queryFrom(payload), requestOptions);
					return { ok: true, value: limitRpcValue(value, maxRpcBytes) };
				}
				if (endpoint === "health") {
					const value = { sources: await healthSources(sources, requestOptions), generatedAt: new Date().toISOString() };
					return { ok: true, value: limitRpcValue(value, maxRpcBytes) };
				}
				return failure("plugin-sources/not-found", `unknown endpoint ${endpoint}`, { endpoint });
			} catch (error) {
				return failure("plugin-sources/invalid-request", error);
			}
		});
	});
}

export default apply;
