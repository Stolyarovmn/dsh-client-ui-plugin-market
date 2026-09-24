import z from "@deepseek-ai/schemastery";
import { browseSources, FILTER_TAGS, healthSources, npmPluginDetails, SOURCE_TYPES } from "./core.js";

export const NAMESPACE = "registry-aggregator";
export const name = "registry-aggregator";
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
	if (payload === undefined || payload === null) return { query: "", page: 1, pageSize: 20, sorts: [], stableOnly: false, freshnessDays: 0, tag: "", dshMetadata: "any" };
	if (typeof payload !== "object" || Array.isArray(payload)) throw new TypeError("payload must be an object");
	const query = payload.query === undefined ? "" : payload.query;
	if (typeof query !== "string") throw new TypeError("query must be a string");
	if (query.length > 200) throw new RangeError("query is too long");
	const page = payload.page === undefined ? 1 : payload.page;
	if (!Number.isInteger(page) || page < 1 || page > 10_000) throw new RangeError("page must be a positive integer");
	const pageSize = payload.pageSize === undefined ? 20 : payload.pageSize;
	if (![20, 50, 100].includes(pageSize)) throw new RangeError("pageSize must be 20, 50, or 100");
	const healthOnly = payload.healthOnly === undefined ? false : payload.healthOnly;
	if (typeof healthOnly !== "boolean") throw new TypeError("healthOnly must be a boolean");
	const refreshRevision = payload.refreshRevision === undefined ? 0 : payload.refreshRevision;
	if (!Number.isInteger(refreshRevision) || refreshRevision < 0 || refreshRevision > 1_000_000_000) throw new RangeError("refreshRevision must be a non-negative integer");

	const sorts = payload.sorts === undefined ? [] : payload.sorts;
	if (!Array.isArray(sorts) || sorts.length > 4) throw new RangeError("sorts must contain at most four criteria");
	const seenSorts = new Set();
	for (const criterion of sorts) {
		if (!criterion || typeof criterion !== "object" || Array.isArray(criterion)) throw new TypeError("each sort criterion must be an object");
		if (!["stars", "downloads", "freshness", "name"].includes(criterion.key)) throw new RangeError("invalid sort key");
		if (!["asc", "desc"].includes(criterion.direction)) throw new RangeError("invalid sort direction");
		if (seenSorts.has(criterion.key)) throw new RangeError("sort keys must be unique");
		seenSorts.add(criterion.key);
	}

	// The old single-sort field is accepted for 0.3.x clients during upgrade.
	const sort = payload.sort;
	if (sort !== undefined && !["relevance", "stars", "downloads", "freshness", "stars-downloads", "downloads-freshness", "name"].includes(sort)) throw new RangeError("invalid sort");
	const stableOnly = payload.stableOnly === undefined ? false : payload.stableOnly;
	if (typeof stableOnly !== "boolean") throw new TypeError("stableOnly must be a boolean");
	const freshnessDays = payload.freshnessDays === undefined ? 0 : payload.freshnessDays;
	if (![0, 30, 90, 365].includes(freshnessDays)) throw new RangeError("freshnessDays must be 0, 30, 90, or 365");
	const tag = payload.tag === undefined ? "" : payload.tag;
	if (typeof tag !== "string" || (tag && !FILTER_TAGS.includes(tag))) throw new RangeError("invalid tag");
	const dshMetadata = payload.dshMetadata === undefined ? "any" : payload.dshMetadata;
	if (!["any", "declared", "unknown"].includes(dshMetadata)) throw new RangeError("invalid dshMetadata");
	return { query: query.trim(), page, pageSize, healthOnly, refreshRevision, sorts, ...(sort === undefined ? {} : { sort }), stableOnly, freshnessDays, tag, dshMetadata };
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
		settingsCtx.effect(() => settingsCtx.settings.configure({ auto: false }, ctx.fiber), "registry-aggregator: hide generic settings page");
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
					if (request.healthOnly) {
						const value = { sources: await healthSources(sources, requestOptions), generatedAt: new Date().toISOString() };
						return { ok: true, value: limitRpcValue(value, maxRpcBytes) };
					}
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

