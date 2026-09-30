import test from "node:test";
import assert from "node:assert/strict";
import {
	MiniReact,
	byClass,
	byId,
	byTag,
	loadBundle,
	makeCtx,
	makeLocale,
	makeSettingsScope,
	makeSettingsScopeService,
	makeConfigFormsService,
	makeSlots,
	textOf,
} from "./harness.js";

const settle = async (milliseconds = 0) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function setup(sources = [], sourceDefaultsVersion = 2, options = {}) {
	const { exports, document, reactDomRoots, notifyMutation } = await loadBundle({ domBridge: options.domBridge === true });
	const locale = makeLocale("en");
	const scope = makeSettingsScope({ sources, sourceDefaultsVersion });
	const calls = [];
	const connection = {
		rpc: {
			async call(channel, endpoint, payload) {
				calls.push({ channel, endpoint, payload });
				if (endpoint === "plugin-sources/browse" && payload?.healthOnly === true) {
					if (typeof options.healthValue === "function") return { ok: true, value: await options.healthValue(payload, scope, calls) };
					return { ok: true, value: { sources: scope.__section.sources.map((source) => ({ source, health: source.enabled === false ? { ok: false, disabled: true } : { ok: true, latencyMs: 2 } })) } };
				}
				if (endpoint === "plugin-sources/counts") {
					const source = scope.__section.sources.find((row) => row.id === payload?.sourceId);
					if (!source) return { ok: false, error: { message: "unknown source" } };
					if (typeof options.countsValue === "function") return { ok: true, value: await options.countsValue(payload, source) };
					return { ok: true, value: { sources: [source.enabled === false ? { source, disabled: true } : { source, count: 1 }] } };
				}
				if (endpoint === "plugin-sources/browse") {
					if (typeof options.browseValue === "function") return { ok: true, value: options.browseValue(payload, scope) };
					if (options.browseValue) return { ok: true, value: options.browseValue };
					return { ok: true, value: { plugins: [{ identity: { package: "dsh-demo", fallback: "npm:dsh-demo" }, name: "dsh-demo", description: "Demo plugin with enough text to make the expandable details control visible for compatibility metadata.", version: "1.0.0", tags: ["ui", "schedule"], evidence: { releaseChannel: "stable", stars: 42, downloads30d: 1234, rating: 4.8, ratingCount: 12, releasedAt: "2026-09-20T10:00:00.000Z", installability: "bundle" }, install: { type: "npm", spec: "dsh-demo@1.0.0" }, sources: [{ id: "npm", name: "npm", type: "npm" }] }], total: 41, page: payload.page ?? 1, pageSize: payload.pageSize ?? 20, pageCount: 3, sources: [] } };
				}
				if (endpoint === "plugin-sources/installed") {
					if (typeof options.installedValue === "function") return { ok: true, value: await options.installedValue(payload, scope, calls) };
					if (options.installedValue && typeof options.installedValue === "object" && !Array.isArray(options.installedValue)) return { ok: true, value: options.installedValue };
					if (Array.isArray(options.installedValue)) return { ok: true, value: { plugins: options.installedValue, errors: [] } };
					const plugins = [];
					for (const packageName of payload?.packages ?? []) {
						let data;
						if (typeof options.browseValue === "function") data = options.browseValue({ query: packageName, page: 1, pageSize: 20, sorts: [], stableOnly: false, freshnessDays: 0, tag: "", dshMetadata: "any" }, scope);
						else if (options.browseValue) data = options.browseValue;
						else data = { plugins: [{ identity: { package: "dsh-demo", fallback: "npm:dsh-demo" }, name: "dsh-demo", description: "Demo plugin with enough text to make the expandable details control visible for compatibility metadata.", version: "1.0.0", tags: ["ui", "schedule"], evidence: { releaseChannel: "stable", stars: 42, downloads30d: 1234, rating: 4.8, ratingCount: 12, releasedAt: "2026-09-20T10:00:00.000Z", installability: "bundle" }, install: { type: "npm", spec: "dsh-demo@1.0.0" }, sources: [{ id: "npm", name: "npm", type: "npm" }] }] };
						const exact = (data?.plugins ?? []).find((plugin) => plugin.identity?.package === packageName);
						if (exact) plugins.push(exact);
					}
					return { ok: true, value: { plugins, errors: [] } };
				}
				if (endpoint === "plugin-sources/details") return { ok: true, value: { dshCompatibility: ">=0.1.7-rc.1 <0.2.0" } };
				if (endpoint === "plugin-sources/stars") {
					const value = typeof options.starsValue === "function" ? options.starsValue(payload) : options.starsValue;
					return { ok: true, value: Array.isArray(value) ? value : [] };
				}
				return { ok: false, error: { message: "unknown" } };
			},
		},
	};
	const slots = makeSlots();
	const installs = [];
	const inspections = [];
	const cancellations = [];
	const cancelledRequests = new Set();
	const bundleLists = [];
	const remoteListeners = new Map();
	const emitRemote = (event, payload) => {
		for (const handler of remoteListeners.get(event) ?? []) handler(payload);
	};
	const remote = {
		$on(event, handler) {
			const listeners = remoteListeners.get(event) ?? new Set();
			listeners.add(handler);
			remoteListeners.set(event, listeners);
			return () => listeners.delete(handler);
		},
		pluginManager: {
			async listBundles() {
				bundleLists.push(true);
				const value = typeof options.bundlesValue === "function" ? options.bundlesValue() : options.bundlesValue;
				return { ok: true, value: Array.isArray(value) ? value : [] };
			},
			async inspect(spec, options) { inspections.push({ spec, options }); return { ok: true, value: { status: "accepted", kind: "registry", name: spec.split("@")[0] || spec, bundle: true, registry: null } }; },
			async cancelInstall(requestId) {
				cancellations.push(requestId);
				const status = typeof options.cancelStatus === "function" ? options.cancelStatus(requestId) : options.cancelStatus ?? "cancelled";
				if (status === "cancelled") {
					cancelledRequests.add(requestId);
					emitRemote("plugin-manager/install-state", { requestId, phase: "cancelling" });
				}
				return { ok: true, value: { status } };
			},
			async installBundle(spec, installOptions) {
				installs.push({ spec, options: installOptions });
				if (installOptions?.requestId) {
					emitRemote("plugin-manager/install-state", { requestId: installOptions.requestId, phase: "installing", attempt: { registry: installOptions.registry ?? null, index: 1, total: 1 } });
					emitRemote("plugin-manager/install-log", { requestId: installOptions.requestId, jobId: "job-1", argv: ["pnpm", "add", spec], cwd: "/profile", stream: "stdout", text: "Resolving package…" });
				}
				if (options.installDelayMs) await settle(options.installDelayMs);
				if (installOptions?.requestId && cancelledRequests.has(installOptions.requestId)) {
					return { ok: true, value: { changed: false, application: "cancelled", bundle: null } };
				}
				if (installOptions?.requestId) emitRemote("plugin-manager/install-state", { requestId: installOptions.requestId, phase: "applying" });
				return { ok: true, value: { changed: true, application: "applied", bundle: spec } };
			},
		},
	};
	const { ctx, recorded } = makeCtx(locale, { configForms: makeConfigFormsService(scope), slots, connection, remote });
	const domCards = [];
	if (options.domBridge === true) {
		const page = document.createElement("section");
		const installed = document.createElement("section");
		installed.setAttribute("data-plugin-scope", "global");
		installed.setAttribute("data-plugin-group", "bundles");
		const list = document.createElement("ul");
		for (const packageName of options.domInstalledPackages ?? []) {
			const card = document.createElement("li");
			card.setAttribute("data-plugin-package", packageName);
			list.appendChild(card);
			domCards.push(card);
		}
		installed.appendChild(list);
		page.appendChild(installed);
		document.body.appendChild(page);
	}
	exports.apply(ctx);
	const section = recorded.find((row) => row.options.name === "plugins.bundle.config");
	const activation = recorded.find((row) => row.options.name === "plugins.bundle.activation");
	const listSection = recorded.find((row) => row.options.name === "plugins.list.section");
	const mini = new MiniReact({ document });
	const restore = mini.installGlobals();
	const render = () => mini.render({ type: section.component, props: { t: locale.bind("registry-aggregator"), close: () => {} }, children: [] });
	return { exports, locale, scope, calls, installs, inspections, cancellations, bundleLists, emitRemote, section, activation, listSection, mini, render, restore, document, reactDomRoots, notifyMutation, domCards };
}

test("self-embeds Plugin Registry after native Installed on stock DSH DOM", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, { domBridge: true });
	try {
		await settle();
		const installed = fixture.document.querySelector('[data-plugin-scope="global"][data-plugin-group="bundles"]');
		assert.ok(installed);
		assert.equal(fixture.reactDomRoots.length, 1);
		const root = fixture.reactDomRoots[0];
		assert.equal(root.container.previousElementSibling, installed);
		assert.equal(root.container.attributes["data-registry-aggregator-plugin-section"], "");
		assert.equal(root.unmounted, false);
		assert.equal(typeof root.element?.type, "function");

		installed.remove();
		fixture.notifyMutation();
		await settle();
		assert.equal(root.unmounted, true);
	} finally { fixture.restore(); }
});

test("Installed metadata loads even when native BundleInfo.version is absent", async () => {
	const packageName = "@stolyarovmn/dsh-client-ui-schedule-tab";
	const plugin = {
		identity: { package: packageName, fallback: `npm:${packageName}` },
		name: packageName,
		description: "Schedule tab registry metadata",
		version: "0.6.1",
		tags: ["schedule"],
		evidence: { releaseChannel: "stable", installability: "bundle" },
		install: { type: "npm", spec: `${packageName}@0.6.1` },
		sources: [{ id: "npm", name: "npm", type: "npm" }],
	};
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		domBridge: true,
		domInstalledPackages: [packageName],
		bundlesValue: [
			{ name: packageName, installed: true, enabled: true, rows: [], overrides: [] },
		],
		installedValue: { plugins: [plugin], errors: [] },
	});
	try {
		await settle();
		const cardRoot = fixture.reactDomRoots.find((root) => root.container.attributes["data-registry-aggregator-installed-tools"] === "");
		assert.ok(cardRoot);
		const mini = new MiniReact({ document: fixture.document });
		let tree = mini.render(cardRoot.element);
		assert.equal(byClass(tree, "pm-installed-loading").length, 1);
		await settle();
		tree = mini.render(cardRoot.element);

		const installedCall = fixture.calls.find((call) => call.endpoint === "plugin-sources/installed");
		assert.deepEqual(installedCall?.payload?.packages, [packageName]);

		byClass(tree, "pm-installed-expand")[0].props.onClick({ preventDefault() {}, stopPropagation() {} });
		tree = mini.render(cardRoot.element);
		assert.match(textOf(tree), /Registry 0\.6\.1/);
		assert.match(textOf(tree), /schedule/);
		assert.equal(textOf(tree).includes("Schedule tab registry metadata"), false);
		assert.equal(textOf(tree).includes("No registry metadata found"), false);
	} finally { fixture.restore(); }
});

test("shows an update badge on the matching native Installed card", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		domBridge: true,
		domInstalledPackages: ["dsh-demo", "dsh-current"],
		bundlesValue: [
			{ name: "dsh-demo", version: "1.0.0", installed: true, enabled: true, rows: [], overrides: [] },
			{ name: "dsh-current", version: "2.0.0", installed: true, enabled: true, rows: [], overrides: [] },
		],
		installedValue: (payload) => ({
			plugins: (payload?.packages ?? []).map((name) => {
				const version = name === "dsh-demo" ? "1.2.0" : "2.0.0";
				return {
					identity: { package: name, fallback: `npm:${name}` },
					name,
					description: "Installed plugin",
					version,
					tags: ["ui"],
					evidence: { releaseChannel: "stable", installability: "bundle" },
					install: { type: "npm", spec: `${name}@${version}` },
					sources: [{ id: "npm", name: "npm", type: "npm" }],
				};
			}),
			errors: [],
		}),
	});
	try {
		await settle();
		await settle();
		assert.equal(fixture.reactDomRoots.length, 3);
		const cardRoots = fixture.reactDomRoots.filter((root) => root.container.attributes["data-registry-aggregator-installed-tools"] === "");
		assert.equal(cardRoots.length, 2);

		const demoRoot = cardRoots.find((root) => root.container.parentElement?.getAttribute("data-plugin-package") === "dsh-demo");
		const currentRoot = cardRoots.find((root) => root.container.parentElement?.getAttribute("data-plugin-package") === "dsh-current");
		assert.ok(demoRoot);
		assert.ok(currentRoot);

		const demoMini = new MiniReact({ document: fixture.document });
		let demoTree = demoMini.render(demoRoot.element);
		const currentMini = new MiniReact({ document: fixture.document });
		let currentTree = currentMini.render(currentRoot.element);
		assert.equal(byClass(demoTree, "pm-installed-loading").length, 1);
		assert.equal(byClass(currentTree, "pm-installed-loading").length, 1);
		await settle();
		demoTree = demoMini.render(demoRoot.element);
		currentTree = currentMini.render(currentRoot.element);
		assert.match(textOf(demoTree), /Update 1\.2\.0/);
		assert.equal(textOf(currentTree).includes("Update"), false);

		const expand = byClass(demoTree, "pm-installed-expand")[0];
		assert.ok(expand);
		assert.equal(expand.props["aria-expanded"], false);
		let pointerStopped = false;
		expand.props.onPointerDown({ stopPropagation() { pointerStopped = true; } });
		assert.equal(pointerStopped, true);
		let clickPrevented = false;
		let clickStopped = false;
		expand.props.onClick({
			preventDefault() { clickPrevented = true; },
			stopPropagation() { clickStopped = true; },
		});
		assert.equal(clickPrevented, true);
		assert.equal(clickStopped, true);
		demoTree = demoMini.render(demoRoot.element);
		assert.equal(byClass(demoTree, "pm-installed-expand")[0].props["aria-expanded"], true);
		assert.match(textOf(demoTree), /Registry 1\.2\.0/);
		assert.match(textOf(demoTree), /npm/);
		assert.equal(textOf(demoTree).includes("Installed plugin"), false);
	} finally { fixture.restore(); }
});

test("Installed update button starts the native update flow and can cancel it", async () => {
	const plugin = {
		identity: { package: "dsh-demo", fallback: "npm:dsh-demo" },
		name: "dsh-demo",
		description: "Installed plugin",
		version: "1.2.0",
		tags: ["ui"],
		evidence: { releaseChannel: "stable", installability: "bundle" },
		install: { type: "npm", spec: "dsh-demo@1.2.0" },
		sources: [{ id: "npm", name: "npm", type: "npm" }],
	};
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		domBridge: true,
		domInstalledPackages: ["dsh-demo"],
		bundlesValue: [{ name: "dsh-demo", version: "1.0.0", installed: true, enabled: true, rows: [], overrides: [] }],
		installedValue: { plugins: [plugin], errors: [] },
		installDelayMs: 45,
	});
	try {
		await settle();
		await settle();
		const root = fixture.reactDomRoots.find((row) => row.container.attributes["data-registry-aggregator-installed-tools"] === "");
		assert.ok(root);
		const mini = new MiniReact({ document: fixture.document });
		let tree = mini.render(root.element);
		await settle();
		tree = mini.render(root.element);

		const update = byClass(tree, "pm-installed-update-badge")[0];
		assert.ok(update);
		assert.equal(update.props["aria-label"], "Update 1.2.0");
		update.props.onClick({ preventDefault() {}, stopPropagation() {} });
		await settle();

		assert.equal(fixture.inspections.length, 0);
		assert.equal(fixture.installs.length, 1);
		assert.equal(fixture.installs[0].spec, "dsh-demo@1.2.0");
		assert.equal(fixture.installs[0].options.enabled, true);
		assert.equal(fixture.installs[0].options.registry, null);
		assert.equal(typeof fixture.installs[0].options.requestId, "string");

		tree = mini.render(root.element);
		const cancel = byClass(tree, "pm-installed-update-cancel")[0];
		assert.ok(cancel);
		assert.equal(cancel.props["aria-label"], "Cancel update");
		cancel.props.onClick({ preventDefault() {}, stopPropagation() {} });
		await settle();
		assert.deepEqual(fixture.cancellations, [fixture.installs[0].options.requestId]);

		await settle(55);
		tree = mini.render(root.element);
		assert.equal(byClass(tree, "pm-installed-update-badge")[0].props["aria-label"], "Update 1.2.0");
		assert.equal(textOf(tree).includes("Update failed"), false);
	} finally { fixture.restore(); }
});

test("expanded Installed card surfaces exact registry lookup errors", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		domBridge: true,
		domInstalledPackages: ["dsh-missing"],
		bundlesValue: [{ name: "dsh-missing", version: "1.0.0", installed: true, enabled: true, rows: [], overrides: [] }],
		installedValue: {
			plugins: [],
			errors: [{ package: "dsh-missing", error: "npm: source returned HTTP 404" }],
		},
	});
	try {
		await settle();
		await settle();
		const cardRoot = fixture.reactDomRoots.find((root) => root.container.attributes["data-registry-aggregator-installed-tools"] === "");
		assert.ok(cardRoot);
		const mini = new MiniReact({ document: fixture.document });
		let tree = mini.render(cardRoot.element);
		assert.equal(byClass(tree, "pm-installed-loading").length, 1);
		await settle(2400);
		tree = mini.render(cardRoot.element);
		const expand = byClass(tree, "pm-installed-expand")[0];
		expand.props.onClick({ preventDefault() {}, stopPropagation() {} });
		tree = mini.render(cardRoot.element);
		const rendered = textOf(tree);
		assert.match(rendered, /Registry lookup failed: npm: source returned HTTP 404/);
		assert.match(rendered, /Registry lookup diagnostics/);
		assert.match(rendered, /package: dsh-missing/);
		assert.match(rendered, /rpc: installed/);
		assert.match(rendered, /plugins: 0/);
		assert.match(rendered, /npm/);
	} finally { fixture.restore(); }
});

test("Installed card re-queries itself when source configuration becomes ready", async () => {
	let available = false;
	const packageName = "@stolyarovmn/dsh-client-ui-schedule-tab";
	const plugin = {
		identity: { package: packageName, fallback: `npm:${packageName}` },
		name: packageName,
		description: "Metadata arrived after sources became ready",
		version: "0.6.1",
		tags: ["schedule"],
		evidence: { releaseChannel: "stable", installability: "bundle" },
		install: { type: "npm", spec: `${packageName}@0.6.1` },
		sources: [{ id: "npm", name: "npm", type: "npm" }],
	};
	const fixture = await setup([], 2, {
		domBridge: true,
		domInstalledPackages: [packageName],
		bundlesValue: [{ name: packageName, installed: true, enabled: true, rows: [], overrides: [] }],
		installedValue: () => available
			? { plugins: [plugin], errors: [] }
			: { plugins: [], errors: [] },
	});
	try {
		await settle();
		const cardRoot = fixture.reactDomRoots.find((root) => root.container.attributes["data-registry-aggregator-installed-tools"] === "");
		assert.ok(cardRoot);
		const mini = new MiniReact({ document: fixture.document });
		let tree = mini.render(cardRoot.element);
		assert.equal(byClass(tree, "pm-installed-loading").length, 1);
		await settle();
		tree = mini.render(cardRoot.element);
		assert.equal(textOf(tree).includes("Registry 0.6.1"), false);

		available = true;
		await fixture.scope.set("sources", [{ id: "npm", name: "npm", type: "npm", enabled: true }]);
		tree = mini.render(cardRoot.element);
		await settle();
		tree = mini.render(cardRoot.element);

		const calls = fixture.calls.filter((call) => call.endpoint === "plugin-sources/installed"
			&& call.payload?.packages?.includes(packageName));
		assert.ok(calls.length >= 2);
		byClass(tree, "pm-installed-expand")[0].props.onClick({ preventDefault() {}, stopPropagation() {} });
		tree = mini.render(cardRoot.element);
		assert.match(textOf(tree), /Registry 0\.6\.1/);
		assert.match(textOf(tree), /schedule/);
		assert.equal(textOf(tree).includes("Metadata arrived after sources became ready"), false);
	} finally { fixture.restore(); }
});

test("registers one native Plugin Manager list section plus the legacy detail fallback", async () => {
	const fixture = await setup();
	try {
		assert.equal(fixture.section.options.key, "@stolyarovmn/dsh-ui-registry-aggregator");
		assert.equal(fixture.activation.options.key, "@stolyarovmn/dsh-ui-registry-aggregator");
		assert.equal(fixture.listSection.options.id, "registry-aggregator");
		assert.equal(fixture.listSection.options.order, 20);
		assert.deepEqual(fixture.exports.inject, ["slots", "locale", "configForms", "connection", "remote", "remote.pluginManager"]);
	} finally { fixture.restore(); }
});

test("native Plugin Registry section renders below Installed with internal Sources/Browse/Updates tabs", async () => {
	const previousStorage = globalThis.localStorage;
	const values = new Map();
	globalThis.localStorage = {
		getItem(key) { return values.has(key) ? values.get(key) : null; },
		setItem(key, value) { values.set(key, String(value)); },
		removeItem(key) { values.delete(key); },
	};
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		bundlesValue: [
			{ name: "dsh-demo", version: "1.0.0", installed: true, enabled: true, rows: [], overrides: [] },
			{ name: "dsh-current", version: "2.0.0", installed: true, enabled: true, rows: [], overrides: [] },
		],
		browseValue: (payload) => {
			if (payload.query === "dsh-demo" || payload.query === "dsh-current") {
				const name = payload.query;
				const version = name === "dsh-demo" ? "1.2.0" : "2.0.0";
				return {
					plugins: [{
						identity: { package: name, fallback: `npm:${name}` },
						name,
						description: "Update candidate",
						version,
						tags: ["ui"],
						evidence: { releaseChannel: "stable", installability: "bundle" },
						install: { type: "npm", spec: `${name}@${version}` },
						sources: [{ id: "npm", name: "npm", type: "npm" }],
					}],
					total: 1, page: 1, pageSize: 20, pageCount: 1, sources: [],
				};
			}
			return {
				plugins: [],
				total: 0, page: 1, pageSize: 20, pageCount: 1, sources: [],
			};
		},
	});
	try {
		let tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });
		await settle(260);
		await settle();
		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });

		assert.match(textOf(tree), /Plugin Registry/);
		assert.ok(byId(tree, "pm-search"));
		assert.equal(textOf(tree).includes("Registry Aggregator"), false);

		const buttons = byClass(tree, "pm-native-section-tab");
		assert.deepEqual(buttons.map((button) => textOf(button).replace(/\s+/g, " ").trim()), ["Sources", "Browse", "Updates"]);

		buttons[0].props.onClick();
		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });
		await settle();
		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });
		assert.match(textOf(tree), /Connected sources/);
		assert.equal(values.get("dsh.registry-aggregator.plugin-section.v1"), "sources");

		byClass(tree, "pm-native-section-tab")[2].props.onClick();
		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });
		await settle();
		await settle();
		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });

		assert.match(textOf(tree), /1 updates/);
		assert.match(textOf(tree), /dsh-demo/);
		assert.equal(textOf(tree).includes("dsh-current"), false);
		assert.match(textOf(tree), /Update available 1\.0\.0 → 1\.2\.0/);
		const updateAction = byClass(tree, "pm-card-install")[0];
		assert.ok(updateAction);
		assert.equal(updateAction.props["aria-label"], "Update to 1.2.0");
		assert.equal(updateAction.props.disabled, false);
		assert.ok(byClass(tree, "pm-update-all")[0]);
		assert.equal(values.get("dsh.registry-aggregator.plugin-section.v1"), "updates");
	} finally {
		fixture.restore();
		if (previousStorage === undefined) delete globalThis.localStorage;
		else globalThis.localStorage = previousStorage;
	}
});

test("Updates card performs a native package update without inspect", async () => {
	const plugin = {
		identity: { package: "dsh-demo", fallback: "npm:dsh-demo" },
		name: "dsh-demo",
		description: "Update candidate",
		version: "1.2.0",
		tags: ["ui"],
		evidence: { releaseChannel: "stable", installability: "bundle" },
		install: { type: "npm", spec: "dsh-demo@1.2.0" },
		sources: [{ id: "npm", name: "npm", type: "npm" }],
	};
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		bundlesValue: [{ name: "dsh-demo", version: "1.0.0", installed: true, enabled: true, rows: [], overrides: [] }],
		installedValue: { plugins: [plugin], errors: [] },
	});
	try {
		let tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });
		await settle();
		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });
		byClass(tree, "pm-native-section-tab")[2].props.onClick();
		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });
		await settle();
		await settle();
		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });

		const update = byClass(tree, "pm-card-install")[0];
		assert.equal(update.props["aria-label"], "Update to 1.2.0");
		await update.props.onClick();
		await settle();

		assert.equal(fixture.inspections.length, 0);
		assert.equal(fixture.installs.length, 1);
		assert.equal(fixture.installs[0].spec, "dsh-demo@1.2.0");
		assert.equal(fixture.installs[0].options.enabled, true);
		assert.equal(fixture.installs[0].options.registry, null);
	} finally { fixture.restore(); }
});

test("Update all runs sequentially and cancellation stops the remaining queue", async () => {
	const plugins = ["dsh-alpha", "dsh-beta"].map((name, index) => ({
		identity: { package: name, fallback: `npm:${name}` },
		name,
		description: "Update candidate",
		version: `1.${index + 1}.0`,
		tags: ["ui"],
		evidence: { releaseChannel: "stable", installability: "bundle" },
		install: { type: "npm", spec: `${name}@1.${index + 1}.0` },
		sources: [{ id: "npm", name: "npm", type: "npm" }],
	}));
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		bundlesValue: [
			{ name: "dsh-alpha", version: "1.0.0", installed: true, enabled: true, rows: [], overrides: [] },
			{ name: "dsh-beta", version: "1.0.0", installed: true, enabled: false, rows: [], overrides: [] },
		],
		installedValue: { plugins, errors: [] },
		installDelayMs: 55,
	});
	try {
		let tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });
		await settle();
		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });
		byClass(tree, "pm-native-section-tab")[2].props.onClick();
		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });
		await settle();
		await settle();
		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });

		const updateAll = byClass(tree, "pm-update-all")[0];
		assert.ok(updateAll);
		updateAll.props.onClick();
		await settle();
		assert.equal(fixture.installs.length, 1);

		tree = fixture.mini.render({ type: fixture.listSection.component, props: { t: fixture.locale.bind("registry-aggregator") }, children: [] });
		const cancel = byClass(tree, "pm-update-all-cancel")[0];
		assert.ok(cancel);
		cancel.props.onClick();
		await settle();
		assert.deepEqual(fixture.cancellations, [fixture.installs[0].options.requestId]);

		await settle(70);
		assert.equal(fixture.installs.length, 1);
		assert.equal(fixture.inspections.length, 0);
	} finally { fixture.restore(); }
});

test("adds a typed source through the durable settings scope", async () => {
	const fixture = await setup();
	try {
		fixture.render();
		let tree = fixture.render();
		byId(tree, "pm-name").props.onChange({ target: { value: "Community Catalog" } });
		tree = fixture.render();
		byId(tree, "pm-url").props.onChange({ target: { value: "https://catalog.example/plugins.json" } });
		tree = fixture.render();
		byClass(tree, "pm-form")[0].props.onSubmit({ preventDefault() {} });
		await settle();
		tree = fixture.render();
		assert.equal(fixture.scope.__section.sources.length, 1);
		assert.deepEqual(fixture.scope.__section.sources[0], {
			id: "community-catalog",
			name: "Community Catalog",
			type: "dshplugin-app",
			url: "https://catalog.example/plugins.json",
			enabled: true,
		});
		assert.equal(byClass(tree, "pm-source").length, 1);
		assert.equal(byClass(tree, "pm-source-list").length, 1);
		assert.equal(byClass(tree, "pm-source-switch").length, 1);
		assert.equal(byId(tree, "pm-type").props.value, "dshplugin-app");
	} finally { fixture.restore(); }
});

test("source cards omit redundant Enabled text and label GitHub counts as repositories", async () => {
	const fixture = await setup([
		{ id: "github", name: "GitHub", type: "github", enabled: true },
	]);
	try {
		fixture.render();
		await settle();
		fixture.render();
		await settle();
		const tree = fixture.render();
		assert.equal(textOf(tree).includes("Enabled"), false);
		assert.match(textOf(tree), /1 repositories/);
		assert.equal(byClass(tree, "pm-status").length >= 1, true);
	} finally { fixture.restore(); }
});

test("source cards expose independent disclosure state without stretching closed cards", async () => {
	const fixture = await setup([
		{ id: "npm", name: "npm", type: "npm", enabled: true },
		{ id: "github", name: "GitHub", type: "github", enabled: true },
	]);
	try {
		fixture.render();
		await settle();
		let tree = fixture.render();
		const cards = byClass(tree, "pm-source");
		assert.equal(cards.length, 2);
		assert.equal(cards[0].props["data-open"], true);
		assert.equal(cards[1].props["data-open"], true);

		const disclosures = byClass(tree, "pm-source-disclosure");
		disclosures[1].props.onClick();
		tree = fixture.render();
		const nextCards = byClass(tree, "pm-source");
		assert.equal(nextCards[0].props["data-open"], true);
		assert.equal(nextCards[1].props["data-open"], false);
	} finally { fixture.restore(); }
});

test("source cards keep copy URL and move the only destructive action into the header", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
	try {
		fixture.render();
		await settle();
		const tree = fixture.render();
		assert.equal(byClass(tree, "pm-source-delete").length, 1);
		assert.equal(byClass(tree, "pm-source-action").length, 0);
		assert.equal(byClass(tree, "pm-copy-url").length, 1);
		assert.equal(byTag(tree, "button").some((button) => button.props["aria-label"] === "Share"), false);
	} finally { fixture.restore(); }
});

test("Sources loads lightweight health separately from verified source counts", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
	try {
		fixture.render();
		await settle();
		fixture.render();
		await settle();
		assert.ok(fixture.calls.some((call) => call.endpoint === "plugin-sources/browse" && call.payload?.healthOnly === true));
		assert.ok(fixture.calls.some((call) => call.endpoint === "plugin-sources/counts" && call.payload?.sourceId === "npm"));
		assert.equal(fixture.calls.some((call) => call.endpoint === "plugin-sources/health"), false);
	} finally { fixture.restore(); }
});

test("Sources refresh stays available while counts are loading and rechecks health", async () => {
	let releaseCount;
	const countWait = new Promise((resolve) => { releaseCount = resolve; });
	let healthReads = 0;
	const fixture = await setup([
		{ id: "npm", name: "npm", type: "npm", enabled: true },
		{ id: "github", name: "GitHub", type: "github", enabled: true },
	], 2, {
		healthValue: async (_payload, scope) => {
			healthReads += 1;
			return {
				sources: scope.__section.sources.map((source) => ({
					source,
					health: source.id === "github" && healthReads === 1
						? { ok: false, error: "source returned HTTP 403" }
						: { ok: true, latencyMs: 2 },
				})),
			};
		},
		countsValue: async (_payload, source) => {
			if (source.id === "npm") await countWait;
			return { sources: [{ source, count: source.id === "npm" ? 322 : 141 }] };
		},
	});
	try {
		fixture.render();
		await settle();
		fixture.render();
		await settle();
		let tree = fixture.render();
		assert.match(textOf(tree), /Unavailable/);
		const refresh = byClass(tree, "pm-refresh-icon")[0];
		assert.equal(refresh.props.disabled, false);

		refresh.props.onClick();
		fixture.render();
		await settle();
		fixture.render();
		await settle();
		tree = fixture.render();

		assert.equal(healthReads >= 2, true);
		assert.equal(textOf(tree).includes("Unavailable"), false);
		assert.match(textOf(tree), /Status: online/);
	} finally {
		releaseCount();
		await settle();
		fixture.restore();
	}
});

test("Sources shows native DSH ongoing state while a verified source count is loading", async () => {
	let releaseCount;
	const countWait = new Promise((resolve) => { releaseCount = resolve; });
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		countsValue: async (_payload, source) => {
			await countWait;
			return { sources: [{ source, count: 322 }] };
		},
	});
	try {
		fixture.render();
		await settle();
		fixture.render();
		await settle();
		let tree = fixture.render();
		assert.equal(byClass(tree, "mock-state-dot").filter((node) => node.props["data-state"] === "ongoing").length, 1);
		assert.equal(textOf(tree).includes("322 packages"), false);

		releaseCount();
		await settle();
		await settle();
		tree = fixture.render();
		assert.match(textOf(tree), /322 packages/);
		assert.equal(byClass(tree, "mock-state-dot").filter((node) => node.props["data-state"] === "ongoing").length, 0);
	} finally { fixture.restore(); }
});

test("Sources renders a fast source count without waiting for a slower source", async () => {
	let releaseGithub;
	const githubWait = new Promise((resolve) => { releaseGithub = resolve; });
	const fixture = await setup([
		{ id: "npm", name: "npm", type: "npm", enabled: true },
		{ id: "github", name: "GitHub", type: "github", enabled: true },
	], 2, {
		countsValue: async (payload, source) => {
			if (payload.sourceId === "github") await githubWait;
			return { sources: [{ source, count: payload.sourceId === "npm" ? 322 : 17 }] };
		},
	});
	try {
		fixture.render();
		await settle();
		fixture.render();
		await settle();
		await settle();
		let tree = fixture.render();
		assert.match(textOf(tree), /322 packages/);
		assert.equal(textOf(tree).includes("17 repositories"), false);

		releaseGithub();
		await settle();
		await settle();
		tree = fixture.render();
		assert.match(textOf(tree), /17 repositories/);
	} finally { fixture.restore(); }
});

test("Browse calls Host RPC and renders normalized install metadata", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
	try {
		let tree = fixture.render();
		await settle();
		tree = fixture.render();
		const browse = byTag(tree, "button").find((button) => textOf(button) === "Browse");
		browse.props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();
		assert.ok(fixture.calls.some((call) => call.channel === "/api" && call.endpoint === "plugin-sources/browse"));
		assert.equal(byClass(tree, "pm-card").length, 1);
		assert.match(textOf(tree), /dsh-demo/);
		assert.match(textOf(tree), /dsh plugin add dsh-demo@1\.0\.0/);
		assert.equal(byClass(tree, "pm-tag").length, 2);
		assert.ok(byClass(tree, "pm-icon-btn").length >= 1);
		assert.equal(byClass(tree, "pm-notice").filter((node) => textOf(node).includes("Review the package")).length, 0);
		const links = byTag(tree, "a");
		assert.ok(links.some((link) => link.props.href === "https://www.npmjs.com/package/dsh-demo" && link.props.target === "_blank" && link.props.rel === "noopener noreferrer"));
		assert.match(textOf(tree), /ui/);
		assert.match(textOf(tree), /schedule/);
		assert.match(textOf(tree), /stable/);
		assert.match(textOf(tree), /42/);
		assert.ok(byClass(tree, "pm-star-icon").length >= 1);
		assert.match(textOf(tree), /1\.2K \/ 30d/);
		assert.match(textOf(tree), /4\.8/);
		assert.match(textOf(tree), /released/);
		assert.match(textOf(tree), /Check DSH compatibility/);
		assert.match(textOf(byId(tree, "pm-page-size")), /20/);
		assert.equal(byId(tree, "pm-page-size").props["aria-haspopup"], "menu");
		assert.match(textOf(tree), /41 results/);
		assert.ok(byClass(tree, "pm-page-button").some((button) => textOf(button) === "1" && button.props["data-current"] === true));
		assert.equal(byClass(tree, "pm-sort-criterion").length, 4);
	} finally { fixture.restore(); }
});


test("Browse shows automatic runtime compatibility without a details request", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		browseValue: {
			plugins: [{
				identity: { package: "dsh-demo", fallback: "npm:dsh-demo" },
				name: "dsh-demo",
				description: "Demo plugin",
				version: "1.0.0",
				tags: ["ui"],
				evidence: {
					releaseChannel: "stable",
					installability: "bundle",
					dshRuntimeVersion: "0.1.7-rc.2",
					dshCompatibilityStatus: "compatible",
					dshMetadataResolved: true,
					dshPeers: [{ dependency: "@deepseek-ai/dsh-client-ui-primitives", range: ">=0.1.7-rc.1 <0.2.0", compatible: true }],
				},
				install: { type: "npm", spec: "dsh-demo@1.0.0" },
				sources: [{ id: "npm", name: "npm", type: "npm" }],
			}],
			total: 1, page: 1, pageSize: 20, pageCount: 1, sources: [],
		},
	});
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();

		assert.match(textOf(tree), /DSH compatible/);
		const compat = byClass(tree, "pm-compat-button")[0];
		assert.equal(compat.props["data-status"], "compatible");
		assert.match(compat.props.title, /@deepseek-ai\/dsh-client-ui-primitives >=0\.1\.7-rc\.1 <0\.2\.0/);
		assert.match(compat.props.title, /0\.1\.7-rc\.2/);
		assert.equal(fixture.calls.some((call) => call.endpoint === "plugin-sources/details"), false);
	} finally { fixture.restore(); }
});

test("Browse asynchronously enriches npm results with exact GitHub evidence and source attribution", async () => {
	const repository = "https://github.com/acme/star-hydration";
	const fixture = await setup([
		{ id: "npm", name: "npm", type: "npm", enabled: true },
		{ id: "github", name: "GitHub", type: "github", enabled: true },
	], 2, {
		browseValue: {
			plugins: [{
				identity: { package: "@acme/star-hydration", repository, fallback: "npm:@acme/star-hydration" },
				name: "star-hydration",
				description: "DSH plugin",
				version: "1.0.0",
				tags: ["ui"],
				evidence: { releaseChannel: "stable", installability: "bundle" },
				install: { type: "npm", spec: "@acme/star-hydration@1.0.0" },
				sources: [{ id: "npm", name: "npm", type: "npm" }],
			}],
			total: 1,
			page: 1,
			pageSize: 20,
			pageCount: 1,
			sources: [
				{ id: "npm", name: "npm", type: "npm", health: { ok: true, count: 1 } },
				{ id: "github", name: "GitHub", type: "github", health: { ok: true, count: 1 } },
			],
		},
		starsValue: [{ repository, stars: 73, repositoryUpdatedAt: "2026-09-27T10:00:00Z", discoveryEligible: true }],
	});
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		await settle();
		fixture.render();
		await settle();
		tree = fixture.render();

		const starsCall = fixture.calls.find((call) => call.endpoint === "plugin-sources/stars");
		assert.ok(starsCall);
		assert.deepEqual(starsCall.payload.repositories, [repository]);
		assert.equal(byClass(tree, "pm-card").length, 1);
		assert.ok(byClass(tree, "pm-star-icon").length >= 1);
		assert.deepEqual(byClass(tree, "pm-badge").map((badge) => textOf(badge)), ["npm", "GitHub"]);
	} finally { fixture.restore(); }
});

test("Browse relevance reorders only visible cards and preserves async GitHub stars", async () => {
	const exactRepository = "https://github.com/acme/schedule";
	const docsRepository = "https://github.com/acme/docs";
	const fixture = await setup([
		{ id: "npm", name: "npm", type: "npm", enabled: true },
		{ id: "github", name: "GitHub", type: "github", enabled: true },
	], 2, {
		browseValue: {
			plugins: [
				{
					identity: { package: "docs-helper", repository: docsRepository, fallback: "npm:docs-helper" },
					name: "docs-helper",
					description: "Documentation for schedule workflows",
					version: "1.0.0",
					tags: ["ui"],
					evidence: { releaseChannel: "stable", installability: "bundle" },
					install: { type: "npm", spec: "docs-helper@1.0.0" },
					sources: [{ id: "npm", name: "npm", type: "npm" }],
				},
				{
					identity: { package: "schedule", repository: exactRepository, fallback: "npm:schedule" },
					name: "schedule",
					description: "Exact package",
					version: "1.0.0",
					tags: ["schedule"],
					evidence: { releaseChannel: "stable", installability: "bundle" },
					install: { type: "npm", spec: "schedule@1.0.0" },
					sources: [{ id: "npm", name: "npm", type: "npm" }],
				},
			],
			total: 2,
			page: 1,
			pageSize: 20,
			pageCount: 1,
			sources: [
				{ id: "npm", name: "npm", type: "npm", health: { ok: true, count: 2 } },
				{ id: "github", name: "GitHub", type: "github", health: { ok: true, count: 2 } },
			],
		},
		starsValue: [
			{ repository: docsRepository, stars: 11, repositoryUpdatedAt: "2026-09-27T10:00:00Z", discoveryEligible: true },
			{ repository: exactRepository, stars: 73, repositoryUpdatedAt: "2026-09-27T10:00:00Z", discoveryEligible: true },
		],
	});
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();

		const search = byId(tree, "pm-search");
		search.props.onChange({ target: { value: "schedule" } });
		fixture.render();
		await settle(260);
		await settle();
		fixture.render();
		await settle();
		tree = fixture.render();

		const cards = byClass(tree, "pm-card");
		assert.equal(cards.length, 2);
		assert.match(textOf(cards[0]), /schedule/);
		assert.match(textOf(cards[0]), /73/);
		assert.match(textOf(cards[1]), /docs-helper/);
		assert.match(textOf(cards[1]), /11/);

		const starsCalls = fixture.calls.filter((call) => call.endpoint === "plugin-sources/stars");
		assert.ok(starsCalls.length >= 1);
		const requested = new Set(starsCalls.flatMap((call) => call.payload.repositories));
		assert.equal(requested.has(exactRepository), true);
		assert.equal(requested.has(docsRepository), true);
	} finally { fixture.restore(); }
});

test("Browse filter dropdowns use the native DSH Menu and combine selections in Host requests", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();

		for (const id of ["pm-freshness", "pm-category", "pm-dsh-metadata"]) {
			assert.equal(byId(tree, id).props["aria-haspopup"], "menu");
		}

		byId(tree, "pm-freshness").props.onClick();
		tree = fixture.render();
		byTag(tree, "button").find((button) => button.props["data-menu-id"] === "90").props.onClick();
		tree = fixture.render();

		byId(tree, "pm-category").props.onClick();
		tree = fixture.render();
		byTag(tree, "button").find((button) => button.props["data-menu-id"] === "ui").props.onClick();
		tree = fixture.render();

		byId(tree, "pm-dsh-metadata").props.onClick();
		tree = fixture.render();
		byTag(tree, "button").find((button) => button.props["data-menu-id"] === "declared").props.onClick();
		fixture.render();
		await settle(260);
		await settle();

		const browseCalls = fixture.calls.filter((call) => call.endpoint === "plugin-sources/browse");
		assert.ok(browseCalls.some((call) => call.payload.freshnessDays === 90 && call.payload.tag === "ui" && call.payload.dshMetadata === "declared"));
	} finally { fixture.restore(); }
});

test("Browse combines independent ordered sort criteria and resolves DSH compatibility on demand", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();

		const sortButtons = () => byClass(tree, "pm-sort-criterion");
		const stars = sortButtons().find((button) => String(button.props["aria-label"]).startsWith("Stars"));
		const downloads = sortButtons().find((button) => String(button.props["aria-label"]).startsWith("Downloads"));
		assert.ok(stars);
		assert.ok(downloads);

		stars.props.onClick(); // Stars desc, priority 1.
		tree = fixture.render();
		byClass(tree, "pm-sort-criterion").find((button) => String(button.props["aria-label"]).startsWith("Downloads")).props.onClick(); // Downloads desc, priority 2.
		tree = fixture.render();
		byClass(tree, "pm-sort-criterion").find((button) => String(button.props["aria-label"]).startsWith("Stars")).props.onClick(); // Stars asc.
		fixture.render();
		await settle(260);
		await settle();

		const browseCalls = fixture.calls.filter((call) => call.endpoint === "plugin-sources/browse");
		assert.ok(browseCalls.some((call) => JSON.stringify(call.payload.sorts) === JSON.stringify([
			{ key: "stars", direction: "asc" },
			{ key: "downloads", direction: "desc" },
		])));

		tree = fixture.render();
		const compat = byTag(tree, "button").find((button) => textOf(button) === "Check DSH compatibility");
		assert.ok(compat);
		await compat.props.onClick();
		await settle();
		tree = fixture.render();
		assert.match(textOf(tree), /DSH >=0\.1\.7-rc\.1 <0\.2\.0/);
		assert.ok(fixture.calls.some((call) => call.endpoint === "plugin-sources/details"));
	} finally { fixture.restore(); }
});

test("Browse refreshes installed bundle state on plugin-manager/changed", async () => {
	let bundles = [];
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		bundlesValue: () => bundles,
	});
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		await settle();
		tree = fixture.render();

		assert.equal(fixture.bundleLists.length, 1);
		assert.equal(textOf(tree).includes("Installed 1.0.0"), false);

		bundles = [{ name: "dsh-demo", version: "1.0.0", installed: true, enabled: true, rows: [], overrides: [] }];
		fixture.emitRemote("plugin-manager/changed", { name: "dsh-demo" });
		fixture.render();
		await settle();
		await settle();
		tree = fixture.render();

		assert.equal(fixture.bundleLists.length, 2);
		assert.match(textOf(tree), /Installed 1\.0\.0/);
		assert.equal(byClass(tree, "pm-card-install")[0].props.disabled, true);
	} finally { fixture.restore(); }
});

test("Browse marks an already installed bundle and disables duplicate installation", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		bundlesValue: [{ name: "dsh-demo", version: "1.0.0", installed: true, enabled: true, rows: [], overrides: [] }],
	});
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		await settle();
		tree = fixture.render();

		assert.equal(fixture.bundleLists.length, 1);
		assert.match(textOf(tree), /Installed 1\.0\.0/);
		const installed = byClass(tree, "pm-card-install")[0];
		assert.equal(installed.props["data-state"], "installed");
		assert.equal(installed.props.disabled, true);
		assert.equal(installed.props["aria-label"], "Installed 1.0.0");
		await installed.props.onClick();
		assert.equal(fixture.inspections.length, 0);
		assert.equal(fixture.installs.length, 0);
	} finally { fixture.restore(); }
});

test("Browse shows update available when discovered version is newer than the installed bundle", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		bundlesValue: [{ name: "dsh-demo", version: "1.0.0", installed: true, enabled: true, rows: [], overrides: [] }],
		browseValue: {
			plugins: [{
				identity: { package: "dsh-demo", fallback: "npm:dsh-demo" },
				name: "dsh-demo",
				description: "Demo plugin",
				version: "1.2.0",
				tags: ["ui"],
				evidence: { releaseChannel: "stable", installability: "bundle" },
				install: { type: "npm", spec: "dsh-demo@1.2.0" },
				sources: [{ id: "npm", name: "npm", type: "npm" }],
			}],
			total: 1,
			page: 1,
			pageSize: 20,
			pageCount: 1,
			sources: [],
		},
	});
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		await settle();
		tree = fixture.render();

		assert.match(textOf(tree), /Update available 1\.0\.0 → 1\.2\.0/);
		const installed = byClass(tree, "pm-card-install")[0];
		assert.equal(installed.props.disabled, false);
		assert.equal(installed.props["data-state"], "update");
		assert.equal(installed.props["aria-label"], "Update to 1.2.0");
	} finally { fixture.restore(); }
});

test("update comparison handles prerelease versions without false positives", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		bundlesValue: [{ name: "dsh-demo", version: "1.0.0-rc.2", installed: true, enabled: true, rows: [], overrides: [] }],
		browseValue: {
			plugins: [{
				identity: { package: "dsh-demo", fallback: "npm:dsh-demo" },
				name: "dsh-demo",
				description: "Demo plugin",
				version: "1.0.0-rc.3",
				tags: [],
				evidence: { releaseChannel: "stable", installability: "bundle" },
				install: { type: "npm", spec: "dsh-demo@1.0.0-rc.3" },
				sources: [{ id: "npm", name: "npm", type: "npm" }],
			}],
			total: 1, page: 1, pageSize: 20, pageCount: 1, sources: [],
		},
	});
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		await settle();
		tree = fixture.render();
		assert.match(textOf(tree), /Update available 1\.0\.0-rc\.2 → 1\.0\.0-rc\.3/);
	} finally { fixture.restore(); }
});

test("Install button uses the native DSH ongoing spinner and follows plugin-manager progress events", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 1, { installDelayMs: 35 });
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();

		const install = byTag(tree, "button").find((button) => button.props["aria-label"] === "Install");
		assert.ok(install);
		const pending = install.props.onClick();
		await settle();
		tree = fixture.render();

		const running = byClass(tree, "pm-card-install")[0];
		assert.equal(running.props["data-state"], "installing");
		assert.match(String(running.props["aria-label"]), /Installing 1\/1/);
		assert.equal(byClass(tree, "mock-state-dot").length, 1);
		assert.equal(byClass(tree, "mock-state-dot")[0].props["data-state"], "ongoing");

		await pending;
		tree = fixture.render();
		assert.ok(byTag(tree, "button").some((button) => button.props["aria-label"] === "Installed 1.0.0"));
	} finally { fixture.restore(); }
});

test("Install can be cancelled through the native DSH plugin-manager request id", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 1, { installDelayMs: 45 });
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();

		const install = byTag(tree, "button").find((button) => button.props["aria-label"] === "Install");
		assert.ok(install);
		const pending = install.props.onClick();
		await settle();
		tree = fixture.render();

		const running = byClass(tree, "pm-card-install")[0];
		assert.match(String(running.props["aria-label"]), /Installing 1\/1/);
		assert.equal(running.props.disabled, true);
		const cancel = byClass(tree, "pm-card-cancel")[0];
		assert.equal(cancel.props["aria-label"], "Cancel install");
		cancel.props.onClick();
		await settle();

		assert.equal(fixture.cancellations.length, 1);
		assert.equal(fixture.cancellations[0], fixture.installs[0].options.requestId);

		tree = fixture.render();
		const cancelling = byClass(tree, "pm-card-install")[0];
		assert.equal(cancelling.props["aria-label"], "Cancelling…");
		assert.equal(cancelling.props.disabled, true);
		assert.equal(byClass(tree, "pm-card-cancel").length, 0);

		await pending;
		tree = fixture.render();
		const retryable = byClass(tree, "pm-card-install")[0];
		assert.equal(retryable.props["aria-label"], "Install");
		assert.equal(retryable.props.disabled, false);
		assert.equal(textOf(tree).includes("Install failed"), false);
	} finally { fixture.restore(); }
});

test("Install starts immediately through the native DSH plugin-manager remote and keeps the command fallback", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();

		const install = byTag(tree, "button").find((button) => button.props["aria-label"] === "Install");
		assert.ok(install);
		await install.props.onClick();
		await settle();

		assert.deepEqual(fixture.inspections, [{ spec: "dsh-demo@1.0.0", options: { registry: null } }]);
		assert.equal(fixture.installs.length, 1);
		assert.equal(fixture.installs[0].spec, "dsh-demo@1.0.0");
		assert.equal(fixture.installs[0].options.enabled, true);
		assert.equal(fixture.installs[0].options.registry, null);
		assert.equal(typeof fixture.installs[0].options.requestId, "string");
		tree = fixture.render();
		assert.ok(byTag(tree, "button").some((button) => button.props["aria-label"] === "Installed 1.0.0"));
		assert.match(textOf(tree), /dsh plugin add dsh-demo@1\.0\.0/);
	} finally { fixture.restore(); }
});


test("migrates an existing npm-only source config to include GitHub exactly once", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 0);
	try {
		fixture.render();
		await settle();
		fixture.render();
		await settle();
		assert.ok(fixture.scope.__section.sources.some((source) => source.type === "github"));
		assert.equal(fixture.scope.__section.sources.filter((source) => source.type === "github").length, 1);
		assert.equal(fixture.scope.__section.sourceDefaultsVersion, 2);
	} finally { fixture.restore(); }
});

test("Browse keeps filters visible when there are zero results and explains missing sources", async () => {
	const fixture = await setup([], 2, {
		browseValue: { plugins: [], total: 0, page: 1, pageSize: 20, pageCount: 1, sources: [] },
	});
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();

		assert.equal(byId(tree, "pm-freshness") !== undefined, true);
		assert.equal(byId(tree, "pm-category") !== undefined, true);
		assert.equal(byId(tree, "pm-dsh-metadata") !== undefined, true);
		assert.equal(byClass(tree, "pm-sort-criterion").length, 4);
		assert.match(textOf(tree), /0 results/);
		assert.match(textOf(tree), /No enabled registry sources/);
	} finally { fixture.restore(); }
});

test("Browse surfaces per-source failures instead of presenting them as ordinary zero matches", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }], 2, {
		browseValue: {
			plugins: [],
			total: 0,
			page: 1,
			pageSize: 20,
			pageCount: 1,
			sources: [{ source: { id: "npm", name: "npm", type: "npm" }, health: { ok: false, error: "HTTP 429 rate limited" } }],
		},
	});
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();
		assert.match(textOf(tree), /All enabled registry sources are unavailable/);
		assert.match(textOf(tree), /npm: HTTP 429 rate limited/);
		assert.equal(byClass(tree, "pm-sort-criterion").length, 4);
	} finally { fixture.restore(); }
});

test("v2 default-source migration restores npm and GitHub when an older config has lost both", async () => {
	const fixture = await setup([], 1);
	try {
		fixture.render();
		await settle();
		fixture.render();
		await settle();
		assert.equal(fixture.scope.__section.sources.filter((source) => source.type === "npm").length, 1);
		assert.equal(fixture.scope.__section.sources.filter((source) => source.type === "github").length, 1);
		assert.equal(fixture.scope.__section.sourceDefaultsVersion, 2);
	} finally { fixture.restore(); }
});

test("Browse sends page size and page changes to Host RPC", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }, { id: "github", name: "GitHub", type: "github", enabled: true }]);
	try {
		let tree = fixture.render();
		const browse = byTag(tree, "button").find((button) => textOf(button) === "Browse");
		browse.props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();
		byId(tree, "pm-page-size").props.onClick();
		tree = fixture.render();
		const fifty = byTag(tree, "button").find((button) => button.props["data-menu-id"] === "50");
		assert.ok(fifty);
		fifty.props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();

		// The picker remains a real choice, not a 20→50→100 cycle: reopen and pick 20 directly.
		byId(tree, "pm-page-size").props.onClick();
		tree = fixture.render();
		const twenty = byTag(tree, "button").find((button) => button.props["data-menu-id"] === "20");
		assert.ok(twenty);
		twenty.props.onClick();
		fixture.render();
		await settle(260);
		await settle();

		const browseCalls = fixture.calls.filter((call) => call.endpoint === "plugin-sources/browse");
		assert.ok(browseCalls.some((call) => call.payload.pageSize === 50));
		assert.ok(browseCalls.some((call) => call.payload.pageSize === 20));
	} finally { fixture.restore(); }
});

test("Browse preferences persist across component openings", async () => {
	const previousStorage = globalThis.localStorage;
	const values = new Map();
	globalThis.localStorage = {
		getItem(key) { return values.has(key) ? values.get(key) : null; },
		setItem(key, value) { values.set(key, String(value)); },
		removeItem(key) { values.delete(key); },
	};
	try {
		const first = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
		try {
			let tree = first.render();
			byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
			tree = first.render();
			byId(tree, "pm-search").props.onChange({ target: { value: "schedule" } });
			first.render();
			await settle();
			const saved = JSON.parse(values.get("dsh.registry-aggregator.browse.v1"));
			assert.equal(saved.tab, "browse");
			assert.equal(saved.query, "schedule");
			assert.equal(saved.pageSize, 20);
		} finally { first.restore(); }

		const second = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
		try {
			const tree = second.render();
			assert.equal(byId(tree, "pm-tab-browse").props["aria-selected"], true);
			assert.equal(byId(tree, "pm-search").props.value, "schedule");
		} finally { second.restore(); }
	} finally {
		if (previousStorage === undefined) delete globalThis.localStorage;
		else globalThis.localStorage = previousStorage;
	}
});

test("activation guidance opens the native Registry Aggregator detail page", async () => {
	const fixture = await setup();
	try {
		let opened = 0;
		let dismissed = 0;
		const mini = new MiniReact();
		const restore = mini.installGlobals();
		try {
			const tree = mini.render({
				type: fixture.activation.component,
				props: {
					t: fixture.locale.bind("registry-aggregator"),
					onOpenDetails: () => { opened += 1; },
					onDismiss: () => { dismissed += 1; },
				},
				children: [],
			});
			assert.equal(tree.props.title, "Registry Aggregator ready");
			const buttons = byTag(tree, "button");
			const open = buttons.find((button) => textOf(button) === "Open Registry Aggregator");
			const later = buttons.find((button) => textOf(button) === "Later");
			assert.ok(open);
			assert.ok(later);
			open.props.onClick();
			later.props.onClick();
			assert.equal(opened, 1);
			assert.equal(dismissed, 1);
		} finally { restore(); }
	} finally { fixture.restore(); }
});
