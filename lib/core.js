import { lookup as dnsLookup } from "node:dns/promises";
import { isIP } from "node:net";
import ipaddr from "ipaddr.js";
import { Agent } from "undici";

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAX_PLUGINS = 500;
const DEFAULT_MAX_REDIRECTS = 3;
const EVIDENCE_CACHE_TTL_MS = 10 * 60 * 1000;
const npmDownloadCache = new Map();

function cachedEvidence(cache, key) {
	const entry = cache.get(key);
	if (!entry) return undefined;
	if (entry.expiresAt <= Date.now()) {
		cache.delete(key);
		return undefined;
	}
	return entry.value;
}

function cacheEvidence(cache, key, value, ttlMs = EVIDENCE_CACHE_TTL_MS) {
	if (typeof value !== "number" || !Number.isFinite(value)) return;
	cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export const SOURCE_TYPES = Object.freeze([
	"dsh-plugin-shop",
	"dshplugin-app",
	"npm",
	"github",
	"custom-json",
	"corporate",
]);

export const NPM_DISCOVERY_KEYWORDS = Object.freeze([
	"dsh-plugin",
	"deepseek-harness",
	"deepseek-harness-plugin",
	"dsh-plugins",
]);

export const GITHUB_DISCOVERY_TOPICS = Object.freeze([
	"dsh-plugin",
	"deepseek-harness-plugin",
	"dsh-plugins",
]);

function text(value) {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function finiteNumber(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function releaseChannel(version) {
	const value = text(version);
	if (!value) return undefined;
	const prerelease = value.match(/^[0-9]+\.[0-9]+\.[0-9]+-([^+]+)/u)?.[1]?.toLowerCase();
	if (!prerelease) return /^[0-9]+\.[0-9]+\.[0-9]+(?:\+.+)?$/u.test(value) ? "stable" : undefined;
	if (/(?:^|[.-])alpha(?:[.-]|$)|(?:^|[.-])a(?:[.-]|$)/u.test(prerelease)) return "alpha";
	if (/(?:^|[.-])beta(?:[.-]|$)|(?:^|[.-])b(?:[.-]|$)/u.test(prerelease)) return "beta";
	if (/(?:^|[.-])rc(?:[.-]|$)/u.test(prerelease)) return "rc";
	return "prerelease";
}

const TAG_ALIASES = new Map([
	["web-gui", "ui"],
	["client-plugin", "ui"],
	["dsh-plugin-ui", "ui"],
	["dsh-ui", "ui"],
	["dsh-plugin-theme", "theme"],
	["dsh-plugin-provider", "provider"],
	["dsh-plugin-workflow", "workflow"],
	["dsh-plugin-integration", "integration"],
	["dsh-plugin-tool", "tool"],
	["dsh-plugin-automation", "automation"],
	["dsh-plugin-schedule", "schedule"],
	["dsh-plugin-scheduler", "scheduler"],
	["dsh-skill", "skill"],
	["dsh-plugin-bundle", "bundle"],
	["dsh-plugin-desktop", "desktop"],
]);

const DISPLAY_TAGS = new Set([
	"ui", "theme", "provider", "workflow", "integration", "tool",
	"automation", "schedule", "scheduler", "skill", "bundle", "desktop",
]);

function tagValues(value) {
	if (Array.isArray(value)) return value.flatMap(tagValues);
	if (typeof value !== "string") return [];
	return value.split(/[\s,]+/u).map((item) => item.trim().toLowerCase()).filter(Boolean);
}

function normalizeTags(record) {
	const raw = [
		...tagValues(record.tags),
		...tagValues(record.keywords),
		...tagValues(record.topics),
		...tagValues(record.category),
		...tagValues(record.dsh?.catalog?.category),
	];
	const tags = [];
	for (const token of raw) {
		const mapped = TAG_ALIASES.get(token) ?? token;
		if (DISPLAY_TAGS.has(mapped) && !tags.includes(mapped)) tags.push(mapped);
	}
	return tags.slice(0, 8);
}

export function normalizeSource(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	const id = text(value.id);
	const type = text(value.type);
	const url = text(value.url);
	if (!id || id.length > 64 || !/^[a-z0-9][a-z0-9._~-]*$/i.test(id) || !type || !SOURCE_TYPES.includes(type)) return undefined;
	if (url && url.length > 2_048) return undefined;
	return {
		id,
		name: (text(value.name) ?? id).slice(0, 120),
		type,
		...(url ? { url } : {}),
		enabled: value.enabled !== false,
	};
}

export function canonicalRepository(value) {
	const raw = text(value);
	if (!raw) return undefined;
	let normalized = raw.replace(/^git\+/, "").replace(/^git@github\.com:/i, "https://github.com/");
	try {
		const url = new URL(normalized);
		url.hash = "";
		url.search = "";
		normalized = url.toString();
	} catch {
		return raw.replace(/\.git$/i, "").replace(/\/$/, "").toLowerCase();
	}
	return normalized.replace(/\.git$/i, "").replace(/\/$/, "").toLowerCase();
}

function safeInstallSpec(type, value) {
	const spec = text(value);
	if (!spec || spec.length > 500 || /[\s;&|`$<>"'%!^()]/u.test(spec)) return undefined;
	if (type === "npm") {
		return /^(?:@[a-z0-9][a-z0-9._~-]*\/[a-z0-9][a-z0-9._~-]*|[a-z0-9][a-z0-9._~-]*)(?:@[a-z0-9][a-z0-9._+~-]*)?$/i.test(spec) ? spec : undefined;
	}
	try {
		const url = new URL(spec.replace(/^git\+/, ""));
		return url.protocol === "https:" && !url.username && !url.password ? spec : undefined;
	} catch {
		return undefined;
	}
}

function normalizeInstall(record, packageName, repository, version) {
	const raw = record.install;
	if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		const type = raw.type === "npm" || raw.type === "git" ? raw.type : undefined;
		const spec = type ? safeInstallSpec(type, raw.spec) : undefined;
		if (type && spec) return { type, spec };
	}
	const explicit = text(raw);
	if (explicit) {
		const type = /^(?:git\+|https?:\/\/|ssh:|git:)/i.test(explicit) ? "git" : "npm";
		const spec = safeInstallSpec(type, explicit);
		if (spec) return { type, spec };
	}
	if (packageName) {
		const spec = safeInstallSpec("npm", version ? `${packageName}@${version}` : packageName);
		if (spec) return { type: "npm", spec };
	}
	if (repository) {
		const spec = safeInstallSpec("git", repository);
		if (spec) return { type: "git", spec };
	}
	return undefined;
}

function sourceAttribution(source) {
	return {
		id: source.id,
		name: source.name,
		type: source.type,
		...(source.url ? { url: source.url } : {}),
	};
}

export function normalizePlugin(record, source) {
	if (!record || typeof record !== "object" || Array.isArray(record)) return undefined;
	const identityInput = record.identity && typeof record.identity === "object" ? record.identity : {};
	const packageName = (text(identityInput.package) ?? text(record.package) ?? text(record.packageName) ?? text(record.npm))?.slice(0, 214);
	const repository = canonicalRepository(text(identityInput.repository ?? record.repository ?? record.repo)?.slice(0, 2_048));
	const sourceSpecificId = (text(record.id) ?? text(record.slug) ?? text(record.name))?.slice(0, 200);
	const name = (text(record.name) ?? packageName ?? repository?.split("/").pop() ?? sourceSpecificId)?.slice(0, 200);
	if (!name || (!packageName && !repository && !sourceSpecificId)) return undefined;
	const version = (text(record.version) ?? text(record.latestVersion))?.slice(0, 100);
	const description = (text(record.description) ?? text(record.summary))?.slice(0, 4_000);
	const install = normalizeInstall(record, packageName, repository, version);
	const verified = typeof record.evidence?.verified === "boolean" ? record.evidence.verified
		: typeof record.verified === "boolean" ? record.verified : undefined;
	const stars = finiteNumber(record.evidence?.stars) ?? finiteNumber(record.stars) ?? finiteNumber(record.stargazers_count);
	const downloads30d = finiteNumber(record.evidence?.downloads30d) ?? finiteNumber(record.downloads30d) ?? finiteNumber(record.downloads);
	const rating = finiteNumber(record.evidence?.rating) ?? finiteNumber(record.rating);
	const ratingCount = finiteNumber(record.evidence?.ratingCount) ?? finiteNumber(record.ratingCount) ?? finiteNumber(record.reviews);
	const compatibility = text(record.evidence?.compatibility) ?? text(record.compatibility);
	const channel = text(record.evidence?.releaseChannel) ?? releaseChannel(version);
	const tags = normalizeTags(record);
	return {
		identity: {
			...(packageName ? { package: packageName } : {}),
			...(repository ? { repository } : {}),
			fallback: `${source.id}:${sourceSpecificId ?? name}`,
		},
		name,
		...(description ? { description } : {}),
		...(version ? { version } : {}),
		versions: version ? [version] : [],
		tags,
		...(install ? { install } : {}),
		sources: [sourceAttribution(source)],
		...((verified !== undefined || stars !== undefined || downloads30d !== undefined || rating !== undefined || ratingCount !== undefined || compatibility || channel) ? {
			evidence: {
				...(verified !== undefined ? { verified } : {}),
				...(stars !== undefined ? { stars } : {}),
				...(downloads30d !== undefined ? { downloads30d } : {}),
				...(rating !== undefined ? { rating } : {}),
				...(ratingCount !== undefined ? { ratingCount } : {}),
				...(compatibility ? { compatibility } : {}),
				...(channel ? { releaseChannel: channel } : {}),
			},
		} : {}),
	};
}

export function pluginIdentity(plugin) {
	if (plugin.identity?.package) return `npm:${plugin.identity.package.toLowerCase()}`;
	if (plugin.identity?.repository) return `git:${canonicalRepository(plugin.identity.repository)}`;
	return `source:${plugin.identity?.fallback ?? plugin.name.toLowerCase()}`;
}

function preferInstall(current, incoming) {
	if (!current) return incoming;
	if (!incoming) return current;
	if (current.type !== "npm" && incoming.type === "npm") return incoming;
	return current;
}

function mergeEvidence(left, right) {
	if (!left && !right) return undefined;
	const stars = Math.max(left?.stars ?? -Infinity, right?.stars ?? -Infinity);
	const downloads30d = Math.max(left?.downloads30d ?? -Infinity, right?.downloads30d ?? -Infinity);
	const ratingSource = (right?.ratingCount ?? -1) > (left?.ratingCount ?? -1) ? right : left;
	return {
		...((left?.verified === true || right?.verified === true) ? { verified: true } : {}),
		...(Number.isFinite(stars) ? { stars } : {}),
		...(Number.isFinite(downloads30d) ? { downloads30d } : {}),
		...(ratingSource?.rating !== undefined ? { rating: ratingSource.rating } : {}),
		...(ratingSource?.ratingCount !== undefined ? { ratingCount: ratingSource.ratingCount } : {}),
		...(left?.compatibility || right?.compatibility ? { compatibility: left?.compatibility ?? right?.compatibility } : {}),
		...(left?.releaseChannel || right?.releaseChannel ? { releaseChannel: left?.releaseChannel ?? right?.releaseChannel } : {}),
	};
}

function identityAliases(plugin) {
	const aliases = [];
	if (plugin.identity?.package) aliases.push(`npm:${plugin.identity.package.toLowerCase()}`);
	if (plugin.identity?.repository) aliases.push(`git:${canonicalRepository(plugin.identity.repository)}`);
	if (aliases.length === 0) aliases.push(`source:${plugin.identity?.fallback ?? plugin.name.toLowerCase()}`);
	return aliases;
}

function clonePlugin(plugin) {
	return { ...plugin, sources: [...plugin.sources], versions: [...(plugin.versions ?? [])], tags: [...(plugin.tags ?? [])] };
}

function mergePluginRecords(current, plugin) {
	const sources = new Map(current.sources.map((source) => [source.id, source]));
	for (const source of plugin.sources) sources.set(source.id, source);
	return {
		...current,
		identity: {
			...(current.identity ?? {}),
			...(plugin.identity?.package && !current.identity?.package ? { package: plugin.identity.package } : {}),
			...(plugin.identity?.repository && !current.identity?.repository ? { repository: plugin.identity.repository } : {}),
		},
		name: current.name || plugin.name,
		description: (plugin.description?.length ?? 0) > (current.description?.length ?? 0) ? plugin.description : current.description,
		version: current.version ?? plugin.version,
		versions: [...new Set([...(current.versions ?? []), ...(plugin.versions ?? [])])],
		tags: [...new Set([...(current.tags ?? []), ...(plugin.tags ?? [])])].slice(0, 8),
		install: preferInstall(current.install, plugin.install),
		sources: [...sources.values()],
		evidence: mergeEvidence(current.evidence, plugin.evidence),
	};
}

export function dedupePlugins(plugins) {
	const aliases = new Map();
	const records = new Set();
	for (const plugin of plugins) {
		const keys = identityAliases(plugin);
		const matches = [...new Set(keys.map((key) => aliases.get(key)).filter(Boolean))];
		let target;
		if (matches.length === 0) {
			target = { plugin: clonePlugin(plugin), aliases: new Set(keys) };
			records.add(target);
		} else {
			target = matches[0];
			target.plugin = mergePluginRecords(target.plugin, plugin);
			for (const other of matches.slice(1)) {
				target.plugin = mergePluginRecords(target.plugin, other.plugin);
				for (const key of other.aliases) target.aliases.add(key);
				records.delete(other);
			}
			for (const key of keys) target.aliases.add(key);
		}
		for (const key of identityAliases(target.plugin)) target.aliases.add(key);
		for (const key of target.aliases) aliases.set(key, target);
	}
	return [...records].map((record) => record.plugin).sort((a, b) => a.name.localeCompare(b.name));
}

export function searchPlugins(plugins, query) {
	const needle = text(query)?.toLowerCase();
	if (!needle) return plugins;
	return plugins.filter((plugin) => [
		plugin.name,
		plugin.description,
		plugin.identity?.package,
		plugin.identity?.repository,
		...(plugin.tags ?? []),
		plugin.evidence?.releaseChannel,
		...(plugin.sources ?? []).flatMap((source) => [source.name, source.type]),
	].some((value) => typeof value === "string" && value.toLowerCase().includes(needle)));
}

export function isPrivateAddress(address) {
	try {
		const parsed = ipaddr.process(address);
		return parsed.range() !== "unicast";
	} catch {
		return true;
	}
}

function abortable(promise, signal) {
	if (signal.aborted) return Promise.reject(signal.reason ?? new Error("source request aborted"));
	return new Promise((resolve, reject) => {
		const abort = () => reject(signal.reason ?? new Error("source request aborted"));
		signal.addEventListener("abort", abort, { once: true });
		promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
	});
}

async function assertSafeUrl(url, resolveHost, signal, authenticated, allowPrivateNetwork) {
	if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("only http(s) catalog URLs are supported");
	if (url.username || url.password) throw new Error("credentials in source URLs are not allowed");
	if (authenticated && url.protocol !== "https:") throw new Error("authenticated sources require HTTPS");
	const hostname = url.hostname.replace(/^\[|\]$/g, "");
	if (hostname === "localhost" || hostname.endsWith(".localhost")) throw new Error("private network destinations are blocked");
	const resolved = await abortable(Promise.resolve(resolveHost(hostname)), signal);
	const addresses = resolved.map((row) => typeof row === "string" ? { address: row, family: isIP(row) } : row)
		.filter((row) => typeof row?.address === "string" && (row.family === 4 || row.family === 6));
	if (!addresses.length) throw new Error("source hostname resolved to no usable address");
	if (!allowPrivateNetwork && addresses.some((row) => isPrivateAddress(row.address))) throw new Error("private network destinations are blocked");
	return addresses[0];
}

async function defaultResolveHost(hostname) {
	if (isIP(hostname)) return [{ address: hostname, family: isIP(hostname) }];
	return dnsLookup(hostname, { all: true, verbatim: true });
}

function pinnedDispatcher(address, factory) {
	if (factory) return factory(address);
	return new Agent({ connect: { lookup(_hostname, options, callback) {
		if (options?.all) callback(null, [address]);
		else callback(null, address.address, address.family);
	} } });
}

async function readResponseBytes(response, maxBytes) {
	const declared = Number(response.headers.get("content-length"));
	if (Number.isFinite(declared) && declared > maxBytes) throw new Error(`catalog response exceeds ${maxBytes} bytes`);
	if (!response.body?.getReader) {
		const bytes = new Uint8Array(await response.arrayBuffer());
		if (bytes.byteLength > maxBytes) throw new Error(`catalog response exceeds ${maxBytes} bytes`);
		return bytes;
	}
	const reader = response.body.getReader();
	const chunks = [];
	let total = 0;
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > maxBytes) {
			await reader.cancel();
			throw new Error(`catalog response exceeds ${maxBytes} bytes`);
		}
		chunks.push(value);
	}
	const joined = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
	return joined;
}

export async function fetchJson(urlInput, source, options = {}) {
	const fetchImpl = options.fetchImpl ?? globalThis.fetch;
	if (typeof fetchImpl !== "function") throw new Error("Host fetch is unavailable");
	const resolveHost = options.resolveHost ?? defaultResolveHost;
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const maxBytes = options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES;
	const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
	const authToken = text(options.authToken);
	let url = new URL(urlInput);
	const headers = { accept: "application/json", "user-agent": "dsh-plugin-sources/0.2", ...(authToken ? { authorization: `Bearer ${authToken}` } : {}) };
	const controller = new AbortController();
	let timedOut = false;
	const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
	const forwardAbort = () => controller.abort(options.signal?.reason);
	options.signal?.addEventListener("abort", forwardAbort, { once: true });
	try {
		for (let redirects = 0; redirects <= maxRedirects; redirects++) {
			let dispatcher;
			try {
				const address = await assertSafeUrl(url, resolveHost, controller.signal, Boolean(authToken), options.allowPrivateNetwork === true);
				dispatcher = options.fetchImpl && !options.dispatcherFactory ? undefined : pinnedDispatcher(address, options.dispatcherFactory);
				let response;
				try {
					response = await fetchImpl(url, { method: "GET", headers, redirect: "manual", signal: controller.signal, dispatcher });
				} catch (error) {
					if (timedOut) throw new Error("source request timed out");
					if (options.signal?.aborted) throw new Error("source request aborted");
					throw new Error(`source request failed: ${String(error?.message ?? error)}`);
				}
				if ([301, 302, 303, 307, 308].includes(response.status)) {
					const location = response.headers.get("location");
					await response.body?.cancel?.();
					if (!location) throw new Error(`source redirect ${response.status} has no Location header`);
					if (redirects === maxRedirects) throw new Error("source redirected too many times");
					const next = new URL(location, url);
					if (authToken && next.origin !== url.origin) throw new Error("authenticated source cannot redirect to another origin");
					url = next;
					continue;
				}
				if (!response.ok) {
					await response.body?.cancel?.();
					throw new Error(`source returned HTTP ${response.status}`);
				}
				let bytes;
				try {
					bytes = await readResponseBytes(response, maxBytes);
				} catch (error) {
					if (timedOut) throw new Error("source request timed out");
					if (options.signal?.aborted) throw new Error("source request aborted");
					throw error;
				}
				try {
					return JSON.parse(new TextDecoder().decode(bytes));
				} catch {
					throw new Error("source returned malformed JSON");
				}
			} finally {
				await dispatcher?.close?.();
			}
		}
		throw new Error("source redirected too many times");
	} catch (error) {
		if (timedOut) throw new Error("source request timed out");
		if (options.signal?.aborted) throw new Error("source request aborted");
		throw error;
	} finally {
		clearTimeout(timer);
		options.signal?.removeEventListener("abort", forwardAbort);
	}
}

function catalogRows(manifest) {
	if (Array.isArray(manifest)) return manifest;
	if (manifest && typeof manifest === "object") {
		for (const key of ["plugins", "items", "results"]) if (Array.isArray(manifest[key])) return manifest[key];
	}
	throw new Error("catalog JSON must be an array or contain plugins/items/results");
}

function normalizeCatalog(manifest, source, maxPlugins) {
	return catalogRows(manifest).slice(0, maxPlugins).map((row) => normalizePlugin(row, source)).filter(Boolean);
}

function npmKeywords(entry) {
	const value = entry?.package?.keywords;
	if (Array.isArray(value)) return value.map((keyword) => String(keyword).toLowerCase());
	if (typeof value === "string") return value.split(/[\s,]+/u).map((keyword) => keyword.toLowerCase()).filter(Boolean);
	return [];
}

function npmEntryIsDshPlugin(entry) {
	const keywords = new Set(npmKeywords(entry));
	return NPM_DISCOVERY_KEYWORDS.some((keyword) => keywords.has(keyword));
}

function npmRows(manifest, { requireDiscoveryKeyword = false } = {}) {
	if (!manifest || !Array.isArray(manifest.objects)) throw new Error("npm search returned an invalid response");
	return manifest.objects.filter((entry) => !requireDiscoveryKeyword || npmEntryIsDshPlugin(entry)).map((entry) => {
		const pkg = entry?.package ?? {};
		const links = pkg.links ?? {};
		return {
			id: pkg.name,
			name: pkg.name,
			description: pkg.description,
			version: pkg.version,
			package: pkg.name,
			repository: links.repository,
			keywords: pkg.keywords,
			install: { type: "npm", spec: pkg.version ? `${pkg.name}@${pkg.version}` : pkg.name },
			evidence: { verified: entry?.flags?.unstable === false },
		};
	});
}

function githubRows(manifest) {
	if (!manifest || !Array.isArray(manifest.items)) throw new Error("GitHub search returned an invalid response");
	return manifest.items.map((repo) => ({
		id: String(repo.id ?? repo.full_name ?? repo.name),
		name: repo.name ?? repo.full_name,
		description: repo.description,
		repository: repo.html_url ?? repo.clone_url,
		topics: repo.topics,
		install: (repo.clone_url ?? repo.html_url) ? { type: "git", spec: repo.clone_url ?? repo.html_url } : undefined,
		evidence: { stars: repo.stargazers_count },
	}));
}

export function createAdapter(sourceInput, options = {}) {
	const source = normalizeSource(sourceInput);
	if (!source) throw new Error("invalid plugin source configuration");
	const maxPlugins = options.maxPlugins ?? DEFAULT_MAX_PLUGINS;
	const authToken = options.authToken ?? options.resolveAuthToken?.(source);
	const allowPrivateNetwork = options.allowPrivateNetwork === true || options.resolveAllowPrivateNetwork?.(source) === true;
	const requestOptions = { ...options, ...(authToken ? { authToken } : {}), allowPrivateNetwork };
	const request = (url) => fetchJson(url, source, requestOptions);
	const customList = async () => {
		if (!source.url) throw new Error(`${source.type} source requires a catalog URL`);
		return normalizeCatalog(await request(source.url), source, maxPlugins);
	};
	let list;
	let search;
	if (["custom-json", "corporate", "dsh-plugin-shop", "dshplugin-app"].includes(source.type)) {
		list = customList;
		search = async (query) => searchPlugins(await customList(), query);
	} else if (source.type === "npm") {
		search = async (query = "") => {
			const base = source.url ?? "https://registry.npmjs.org/-/v1/search";
			const size = String(Math.min(maxPlugins, 250));
			const needle = text(query);
			const keywordBatches = NPM_DISCOVERY_KEYWORDS.map(async (keyword) => {
				const url = new URL(base);
				url.searchParams.set("text", [`keywords:${keyword}`, needle].filter(Boolean).join(" "));
				url.searchParams.set("size", size);
				return normalizeCatalog(npmRows(await request(url)), source, maxPlugins);
			});
			const rawQueryBatch = needle ? [async () => {
				const url = new URL(base);
				url.searchParams.set("text", needle);
				url.searchParams.set("size", size);
				return normalizeCatalog(npmRows(await request(url), { requireDiscoveryKeyword: true }), source, maxPlugins);
			}] : [];
			const batches = await Promise.all([...keywordBatches, ...rawQueryBatch.map((load) => load())]);
			return searchPlugins(dedupePlugins(batches.flat()), query).slice(0, maxPlugins);
		};
		list = () => search("");
	} else if (source.type === "github") {
		search = async (query = "") => {
			const base = source.url ?? "https://api.github.com/search/repositories";
			const perPage = String(Math.min(maxPlugins, 100));
			const batches = await Promise.all(GITHUB_DISCOVERY_TOPICS.map(async (topic) => {
				const url = new URL(base);
				url.searchParams.set("q", [`topic:${topic}`, text(query)].filter(Boolean).join(" "));
				url.searchParams.set("per_page", perPage);
				return normalizeCatalog(githubRows(await request(url)), source, maxPlugins);
			}));
			return searchPlugins(dedupePlugins(batches.flat()), query).slice(0, maxPlugins);
		};
		list = () => search("");
	}
	return {
		source,
		async health() {
			const started = Date.now();
			try {
				const plugins = await list();
				return { ok: true, latencyMs: Date.now() - started, count: plugins.length };
			} catch (error) {
				return { ok: false, latencyMs: Date.now() - started, error: String(error?.message ?? error) };
			}
		},
		list,
		search,
		async get(id) { return (await list()).find((plugin) => pluginIdentity(plugin) === id || plugin.name === id); },
	};
}

function validatedSources(sourceInputs, options) {
	const maxSources = options.maxSources ?? 20;
	if (!Array.isArray(sourceInputs) || sourceInputs.length > maxSources) throw new Error(`at most ${maxSources} plugin sources are allowed`);
	const sources = sourceInputs.map(normalizeSource);
	if (sources.some((source) => !source)) throw new Error("invalid plugin source configuration");
	if (new Set(sources.map((source) => source.id)).size !== sources.length) throw new Error("plugin source ids must be unique");
	return sources;
}

async function mapConcurrent(items, concurrency, worker) {
	const output = new Array(items.length);
	let cursor = 0;
	async function run() {
		while (true) {
			const index = cursor++;
			if (index >= items.length) return;
			output[index] = await worker(items[index], index);
		}
	}
	await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, run));
	return output;
}

export async function healthSources(sourceInputs, options = {}) {
	const sources = validatedSources(sourceInputs, options);
	return mapConcurrent(sources, options.concurrency ?? 4, async (source) => ({
		source: sourceAttribution(source),
		health: source.enabled ? await createAdapter(source, options).health() : { ok: false, disabled: true },
	}));
}

async function enrichNpmDownloads(plugins, options = {}) {
	const packages = [...new Set(plugins.map((plugin) => plugin.identity?.package).filter(Boolean))].slice(0, options.maxEvidencePackages ?? 100);
	if (!packages.length || options.enrichDownloads === false) return plugins;
	const source = { id: "npm-downloads", name: "npm downloads", type: "npm", enabled: true };
	const requestOptions = { ...options, authToken: undefined, allowPrivateNetwork: false };
	const counts = new Map();
	const pending = [];
	for (const name of packages) {
		const cached = cachedEvidence(npmDownloadCache, name);
		if (cached === undefined) pending.push(name);
		else counts.set(name, cached);
	}

	// npm's downloads API supports bulk point queries for unscoped packages,
	// but scoped packages are not supported in bulk queries. Query each scoped
	// package separately instead of letting one invalid bulk request zero the
	// whole result set.
	const unscoped = pending.filter((name) => !name.startsWith("@"));
	const scoped = pending.filter((name) => name.startsWith("@"));
	const tasks = [];
	for (let index = 0; index < unscoped.length; index += 64) tasks.push(unscoped.slice(index, index + 64));
	for (const name of scoped) tasks.push([name]);

	await mapConcurrent(tasks, Math.min(options.concurrency ?? 4, 6), async (chunk) => {
		try {
			const encoded = chunk.map((name) => encodeURIComponent(name)).join(",");
			const value = await fetchJson(`https://api.npmjs.org/downloads/point/last-month/${encoded}`, source, requestOptions);
			if (chunk.length === 1 && typeof value?.downloads === "number") {
				counts.set(chunk[0], value.downloads);
				cacheEvidence(npmDownloadCache, chunk[0], value.downloads);
				return;
			}
			for (const name of chunk) {
				const downloads = value?.[name]?.downloads;
				if (typeof downloads !== "number") continue;
				counts.set(name, downloads);
				cacheEvidence(npmDownloadCache, name, downloads);
			}
		} catch {
			// Popularity metadata is best-effort and must never hide catalog results.
		}
	});
	return plugins.map((plugin) => {
		const downloads30d = counts.get(plugin.identity?.package);
		if (downloads30d === undefined) return plugin;
		return { ...plugin, evidence: mergeEvidence(plugin.evidence, { downloads30d }) };
	});
}

export async function browseSources(sourceInputs, query = "", options = {}) {
	const enabled = validatedSources(sourceInputs, options).filter((source) => source.enabled);
	const rows = await mapConcurrent(enabled, options.concurrency ?? 4, async (source) => {
		const started = Date.now();
		try {
			const plugins = await createAdapter(source, options).search(query);
			return { source: sourceAttribution(source), health: { ok: true, latencyMs: Date.now() - started, count: plugins.length }, plugins };
		} catch (error) {
			return { source: sourceAttribution(source), health: { ok: false, latencyMs: Date.now() - started, error: String(error?.message ?? error) }, plugins: [] };
		}
	});
	const matched = searchPlugins(dedupePlugins(rows.flatMap((row) => row.plugins)), query).slice(0, options.maxTotalPlugins ?? 1_000);
	const plugins = await enrichNpmDownloads(matched, options);
	return { plugins, sources: rows.map(({ source, health }) => ({ ...source, health })), generatedAt: new Date().toISOString() };
}
