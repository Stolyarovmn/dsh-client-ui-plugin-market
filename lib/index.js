import z from "@deepseek-ai/schemastery";
import { browseSources, healthSources, npmPluginDetails, SOURCE_TYPES } from "./core.js";

export const NAMESPACE = "plugin-market";
export const name = "plugin-market";
export const RPC_CHANNEL = "/api";
export const RPC_PREFIX = "plugin-sources";

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

export const DEFAULT_SOURCES = [
	{ id: "npm", name: "npm", type: "npm", enabled: true },
	{ id: "github", name: "GitHub", type: "github", enabled: true },
];

export const PluginSourcesSchema = z.object({
	sources: z.array(PluginSourceSchema).default(DEFAULT_SOURCES).volatile(),
});

export const Config = z.object({
	sources: z.array(PluginSourceSchema).default(DEFAULT_SOURCES).volatile(),
	sourceDefaultsVersion: z.natural().default(0).volatile(),
	timeoutMs: z.natural().min(250).max(60_000).default(10_000),
	maxResponseBytes: z.natural().min(1_024).max(10 * 1024 * 1024).default(2 * 1024 * 1024),
	maxPlugins: z.natural().min(1).max(5_000).default(2_000),
	maxSources: z.natural().min(1).max(100).default(20),
	maxTotalPlugins: z.natural().min(1).max(10_000).default(5_000),
	maxRpcBytes: z.natural().min(16_384).max(20 * 1024 * 1024).default(4 * 1024 * 1024),
	concurrency: z.natural().min(1).max(16).default(4),
	privateSourceIds: z.array(z.string()).default([]).comment("Host-controlled source ids allowed to reach private networks."),
	auth: z.array(SourceAuthSchema).default([]).comment("Host-controlled source-to-token-environment allowlist."),
});

function failure(code, error, details = {}) {
	return { ok: false, error: { code, message: String(error?.message ?? error), details } };
}

function sourcesFromConfig(config) {
	const value = config?.sources;
	const sources = typeof value?.get === "function" ? value.get() : value;
	return Array.isArray(sources) ? sources : [];
}

function browseRequestFrom(payload) {
	if (payload === undefined || payload === null) return { query: "", page: 1, pageSize: 20, sort: "relevance", stableOnly: false };
	if (typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("payload must be an object");
	const query = payload.query === undefined ? "" : payload.query;
	if (typeof query !== "string") throw new TypeError("query must be a string");
	if (query.length > 200) throw new RangeError("query is too long");
	const page = payload.page === undefined ? 1 : payload.page;
	if (!Number.isInteger(page) || page < 1 || page > 10_000) throw new RangeError("page must be a positive integer");
	const pageSize = payload.pageSize === undefined ? 20 : payload.pageSize;
	if (![20, 50, 100].includes(pageSize)) throw new RangeError("pageSize must be 20, 50, or 100");
	const sort = payload.sort === undefined ? "relevance" : payload.sort;
	if (!["relevance", "stars", "downloads", "freshness", "stars-downloads", "downloads-freshness", "name"].includes(sort)) throw new RangeError("invalid sort");
	const stableOnly = payload.stableOnly === undefined ? false : payload.stableOnly;
	if (typeof stableOnly !== "boolean") throw new TypeError("stableOnly must be a boolean");
	return { query: query.trim(), page, pageSize, sort, stableOnly };
}

function detailsRequestFrom(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("payload must be an object");
	if (typeof payload.package !== "string" || !payload.package.trim()) throw new TypeError("package must be a string");
	if (typeof payload.version !== "string" || !payload.version.trim()) throw new TypeError("version must be a string");
	if (payload.package.length > 214 || payload.version.length > 100) throw new RangeError("package details request is too long");
	return { packageName: payload.package.trim(), version: payload.version.trim() };
}

function limitRpcValue(value, maxBytes) {
	const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
	if (bytes > maxBytes) throw new Error(`catalog RPC response exceeds ${maxBytes} bytes`);
	return value;
}

export function apply(ctx, config = {}) {
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.effect(() => settingsCtx.settings.configure({ auto: false }, ctx.fiber), "plugin-market: hide generic settings page");
	});

	ctx.inject(["connection"], (rpcCtx) => {
		const auth = new Map((config.auth ?? []).map((row) => [row.sourceId, row.tokenEnv]));
		const privateSourceIds = new Set(config.privateSourceIds ?? []);
		const maxRpcBytes = config.maxRpcBytes ?? 4 * 1024 * 1024;
		const options = {
			timeoutMs: config.timeoutMs ?? 10_000,
			maxResponseBytes: config.maxResponseBytes ?? 2 * 1024 * 1024,
			maxPlugins: config.maxPlugins ?? 2_000,
			maxSources: config.maxSources ?? 20,
			maxTotalPlugins: config.maxTotalPlugins ?? 5_000,
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

		async function dispatch(endpoint, payload, signal) {
			try {
				const sources = sourcesFromConfig(config);
				const requestOptions = { ...options, signal };
				if (endpoint === "browse") {
					const request = browseRequestFrom(payload);
					const value = await browseSources(sources, request.query, { ...requestOptions, ...request });
					return { ok: true, value: limitRpcValue(value, maxRpcBytes) };
				}
				if (endpoint === "health") {
					const value = { sources: await healthSources(sources, requestOptions), generatedAt: new Date().toISOString() };
					return { ok: true, value: limitRpcValue(value, maxRpcBytes) };
				}
				if (endpoint === "details") {
					const request = detailsRequestFrom(payload);
					const value = await npmPluginDetails(request.packageName, request.version, requestOptions);
					return { ok: true, value: limitRpcValue(value, maxRpcBytes) };
				}
				return failure("plugin-sources/not-found", `unknown endpoint ${endpoint}`, { endpoint });
			} catch (error) {
				return failure("plugin-sources/invalid-request", error);
			}
		}

		function route(endpoint) {
			return {
				path: `${RPC_CHANNEL}/${RPC_PREFIX}/${endpoint}`,
				methods: ["POST"],
				requestBody: "buffered",
				async fetch(request) {
					let envelope;
					try { envelope = await request.json(); }
					catch { return new Response("body is not JSON", { status: 400 }); }
					if (!envelope || typeof envelope !== "object" || envelope.type !== "client-request"
						|| typeof envelope.rpcId !== "string" || envelope.method !== `${RPC_PREFIX}/${endpoint}`) {
						return new Response("invalid client-request message", { status: 400 });
					}
					const result = await dispatch(endpoint, envelope.payload, request.signal);
					return Response.json({ type: "server-response", rpcId: envelope.rpcId, result });
				},
			};
		}
		rpcCtx.connection.fetch.register(route("health"));
		rpcCtx.connection.fetch.register(route("browse"));
		rpcCtx.connection.fetch.register(route("details"));
	});
}

