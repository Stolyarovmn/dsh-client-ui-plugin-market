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

async function setup(sources = [], sourceDefaultsVersion = 1) {
	const { exports, document } = await loadBundle();
	const locale = makeLocale("en");
	const scope = makeSettingsScope({ sources, sourceDefaultsVersion });
	const calls = [];
	const connection = {
		rpc: {
			async call(channel, endpoint, payload) {
				calls.push({ channel, endpoint, payload });
				if (endpoint === "plugin-sources/health") return { ok: true, value: { sources: scope.__section.sources.map((source) => ({ source, health: source.enabled === false ? { ok: false, disabled: true } : { ok: true, count: 1, latencyMs: 2 } })) } };
				if (endpoint === "plugin-sources/browse") return { ok: true, value: { plugins: [{ identity: { package: "dsh-demo", fallback: "npm:dsh-demo" }, name: "dsh-demo", description: "Demo plugin with enough text to make the expandable details control visible for compatibility metadata.", version: "1.0.0", tags: ["ui", "schedule"], evidence: { releaseChannel: "stable", stars: 42, downloads30d: 1234, rating: 4.8, ratingCount: 12, releasedAt: "2026-09-20T10:00:00.000Z" }, install: { type: "npm", spec: "dsh-demo@1.0.0" }, sources: [{ id: "npm", name: "npm", type: "npm" }] }], total: 41, page: payload.page ?? 1, pageSize: payload.pageSize ?? 20, pageCount: 3, sources: [] } };
				if (endpoint === "plugin-sources/details") return { ok: true, value: { dshCompatibility: ">=0.1.7-rc.1 <0.2.0" } };
				return { ok: false, error: { message: "unknown" } };
			},
		},
	};
	const slots = makeSlots();
	const installs = [];
	const remote = {
		pluginManager: {
			async inspect(spec) { return { status: "accepted", kind: "registry", name: spec.split("@")[0] || spec, bundle: true, registry: null }; },
			async installBundle(spec, options) { installs.push({ spec, options }); return { changed: true }; },
		},
	};
	const { ctx, recorded } = makeCtx(locale, { configForms: makeConfigFormsService(scope), slots, connection, remote });
	exports.apply(ctx);
	const section = recorded.find((row) => row.options.name === "plugins.bundle.config");
	const activation = recorded.find((row) => row.options.name === "plugins.bundle.activation");
	const mini = new MiniReact({ document });
	const restore = mini.installGlobals();
	const render = () => mini.render({ type: section.component, props: { t: locale.bind("plugin-market"), close: () => {} }, children: [] });
	return { exports, locale, scope, calls, installs, section, activation, render, restore };
}

test("registers marketplace inside the native DSH plugin manager", async () => {
	const fixture = await setup();
	try {
		assert.equal(fixture.section.options.key, "@stolyarovmn/dsh-client-ui-plugin-market");
		assert.equal(fixture.activation.options.key, "@stolyarovmn/dsh-client-ui-plugin-market");
		assert.deepEqual(fixture.exports.inject, ["slots", "locale", "configForms", "connection", "remote", "remote.pluginManager"]);
		assert.equal(fixture.locale.bind("plugin-market")("tab.browse"), "Browse");
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
			type: "custom-json",
			url: "https://catalog.example/plugins.json",
			enabled: true,
		});
		assert.equal(byClass(tree, "pm-source").length, 1);
		assert.equal(byClass(tree, "pm-source-list").length, 1);
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
		assert.equal(byClass(tree, "pm-notice").filter((node) => textOf(node).includes("Review the package")).length, 1);
		const links = byTag(tree, "a");
		assert.ok(links.some((link) => link.props.href === "https://www.npmjs.com/package/dsh-demo" && link.props.target === "_blank" && link.props.rel === "noopener noreferrer"));
		assert.match(textOf(tree), /ui/);
		assert.match(textOf(tree), /schedule/);
		assert.match(textOf(tree), /stable/);
		assert.match(textOf(tree), /42/);
		assert.match(textOf(tree), /1\.2K \/ 30d total/);
		assert.match(textOf(tree), /4\.8/);
		assert.match(textOf(tree), /released/);
		assert.match(textOf(tree), /DSH \?/);
		assert.ok(byTag(tree, "select").some((select) => select.props.value === "relevance"));
		assert.equal(byId(tree, "pm-page-size").props.value, 20);
		assert.match(textOf(tree), /41 results/);
		assert.match(textOf(tree), /Page 1 of 3/);
	} finally { fixture.restore(); }
});


test("Browse combines freshness, category, and DSH metadata filters in Host requests", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();
		assert.equal(byId(tree, "pm-freshness").props.value, 0);
		assert.equal(byId(tree, "pm-category").props.value, "");
		assert.equal(byId(tree, "pm-dsh-metadata").props.value, "any");

		byId(tree, "pm-freshness").props.onChange({ target: { value: "90" } });
		tree = fixture.render();
		byId(tree, "pm-category").props.onChange({ target: { value: "ui" } });
		tree = fixture.render();
		byId(tree, "pm-dsh-metadata").props.onChange({ target: { value: "declared" } });
		fixture.render();
		await settle(260);
		await settle();

		const browseCalls = fixture.calls.filter((call) => call.endpoint === "plugin-sources/browse");
		assert.ok(browseCalls.some((call) => call.payload.freshnessDays === 90 && call.payload.tag === "ui" && call.payload.dshMetadata === "declared"));
	} finally { fixture.restore(); }
});

test("Browse exposes composite sorts and resolves DSH compatibility on demand", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
	try {
		let tree = fixture.render();
		byTag(tree, "button").find((button) => textOf(button) === "Browse").props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();
		const options = byTag(tree, "option").map(textOf);
		assert.ok(options.includes("Freshest release"));
		assert.ok(options.includes("Stars + downloads"));
		assert.ok(options.includes("Downloads + freshness"));
		const compat = byTag(tree, "button").find((button) => textOf(button) === "DSH ?");
		assert.ok(compat);
		await compat.props.onClick();
		await settle();
		tree = fixture.render();
		assert.match(textOf(tree), /DSH >=0\.1\.7-rc\.1 <0\.2\.0/);
		assert.ok(fixture.calls.some((call) => call.endpoint === "plugin-sources/details"));
	} finally { fixture.restore(); }
});

test("Install uses the native DSH plugin-manager remote and keeps the command fallback", async () => {
	const fixture = await setup([{ id: "npm", name: "npm", type: "npm", enabled: true }]);
	try {
		let tree = fixture.render();
		const browse = byTag(tree, "button").find((button) => textOf(button) === "Browse");
		browse.props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();
		const install = byTag(tree, "button").find((button) => textOf(button) === "Install");
		assert.ok(install);
		install.props.onClick();
		tree = fixture.render();
		const confirm = byTag(tree, "button").find((button) => textOf(button) === "Install?");
		assert.ok(confirm);
		await confirm.props.onClick();
		await settle();
		assert.deepEqual(fixture.installs, [{ spec: "dsh-demo@1.0.0", options: { activate: false } }]);
		assert.match(textOf(fixture.render()), /dsh plugin add dsh-demo@1\.0\.0/);
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
		byId(tree, "pm-page-size").props.onChange({ target: { value: "50" } });
		fixture.render();
		await settle(260);
		await settle();
		tree = fixture.render();
		const next = byTag(tree, "button").find((button) => textOf(button) === "Next");
		next.props.onClick();
		fixture.render();
		await settle(260);
		await settle();
		const browseCalls = fixture.calls.filter((call) => call.endpoint === "plugin-sources/browse");
		assert.ok(browseCalls.some((call) => call.payload.pageSize === 50));
		assert.ok(browseCalls.some((call) => call.payload.page === 2 && call.payload.pageSize === 50));
	} finally { fixture.restore(); }
});

test("activation guidance opens the native marketplace detail page", async () => {
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
					t: fixture.locale.bind("plugin-market"),
					onOpenDetails: () => { opened += 1; },
					onDismiss: () => { dismissed += 1; },
				},
				children: [],
			});
			assert.equal(tree.props.title, "Marketplace ready");
			const buttons = byTag(tree, "button");
			const open = buttons.find((button) => textOf(button) === "Open marketplace");
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
