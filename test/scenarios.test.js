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

async function setup(sources = [], sourceDefaultsVersion = 1, options = {}) {
	const { exports, document } = await loadBundle();
	const locale = makeLocale("en");
	const scope = makeSettingsScope({ sources, sourceDefaultsVersion });
	const calls = [];
	const connection = {
		rpc: {
			async call(channel, endpoint, payload) {
				calls.push({ channel, endpoint, payload });
				if (endpoint === "plugin-sources/browse" && payload?.healthOnly === true) return { ok: true, value: { sources: scope.__section.sources.map((source) => ({ source, health: source.enabled === false ? { ok: false, disabled: true } : { ok: true, count: 1, latencyMs: 2 } })) } };
				if (endpoint === "plugin-sources/browse") return { ok: true, value: { plugins: [{ identity: { package: "dsh-demo", fallback: "npm:dsh-demo" }, name: "dsh-demo", description: "Demo plugin with enough text to make the expandable details control visible for compatibility metadata.", version: "1.0.0", tags: ["ui", "schedule"], evidence: { releaseChannel: "stable", stars: 42, downloads30d: 1234, rating: 4.8, ratingCount: 12, releasedAt: "2026-09-20T10:00:00.000Z" }, install: { type: "npm", spec: "dsh-demo@1.0.0" }, sources: [{ id: "npm", name: "npm", type: "npm" }] }], total: 41, page: payload.page ?? 1, pageSize: payload.pageSize ?? 20, pageCount: 3, sources: [] } };
				if (endpoint === "plugin-sources/details") return { ok: true, value: { dshCompatibility: ">=0.1.7-rc.1 <0.2.0" } };
				return { ok: false, error: { message: "unknown" } };
			},
		},
	};
	const slots = makeSlots();
	const installs = [];
	const inspections = [];
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
			async inspect(spec, options) { inspections.push({ spec, options }); return { ok: true, value: { status: "accepted", kind: "registry", name: spec.split("@")[0] || spec, bundle: true, registry: null } }; },
			async installBundle(spec, installOptions) {
				installs.push({ spec, options: installOptions });
				if (installOptions?.requestId) {
					emitRemote("plugin-manager/install-state", { requestId: installOptions.requestId, phase: "installing", attempt: { registry: installOptions.registry ?? null, index: 1, total: 1 } });
					emitRemote("plugin-manager/install-log", { requestId: installOptions.requestId, jobId: "job-1", argv: ["pnpm", "add", spec], cwd: "/profile", stream: "stdout", text: "Resolving package…" });
				}
				if (options.installDelayMs) await settle(options.installDelayMs);
				if (installOptions?.requestId) emitRemote("plugin-manager/install-state", { requestId: installOptions.requestId, phase: "applying" });
				return { ok: true, value: { changed: true, application: "applied", bundle: spec } };
			},
		},
	};
	const { ctx, recorded } = makeCtx(locale, { configForms: makeConfigFormsService(scope), slots, connection, remote });
	exports.apply(ctx);
	const section = recorded.find((row) => row.options.name === "plugins.bundle.config");
	const activation = recorded.find((row) => row.options.name === "plugins.bundle.activation");
	const mini = new MiniReact({ document });
	const restore = mini.installGlobals();
	const render = () => mini.render({ type: section.component, props: { t: locale.bind("registry-aggregator"), close: () => {} }, children: [] });
	return { exports, locale, scope, calls, installs, inspections, emitRemote, section, activation, render, restore };
}

test("registers Registry Aggregator inside the native DSH plugin manager", async () => {
	const fixture = await setup();
	try {
		assert.equal(fixture.section.options.key, "@stolyarovmn/dsh-ui-registry-aggregator");
		assert.equal(fixture.activation.options.key, "@stolyarovmn/dsh-ui-registry-aggregator");
		assert.deepEqual(fixture.exports.inject, ["slots", "locale", "configForms", "connection", "remote", "remote.pluginManager"]);
		assert.equal(fixture.locale.bind("registry-aggregator")("tab.browse"), "Browse");
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

test("Sources health uses the Browse transport to avoid a stale dedicated health route", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
	try {
		fixture.render();
		await settle();
		assert.ok(fixture.calls.some((call) => call.endpoint === "plugin-sources/browse" && call.payload?.healthOnly === true));
		assert.equal(fixture.calls.some((call) => call.endpoint === "plugin-sources/health"), false);
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
		assert.ok(byTag(tree, "button").some((button) => button.props["aria-label"] === "Installed"));
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
		assert.ok(byTag(tree, "button").some((button) => button.props["aria-label"] === "Installed"));
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
		assert.equal(fixture.scope.__section.sourceDefaultsVersion, 1);
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
