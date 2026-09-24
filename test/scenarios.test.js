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

async function setup(sources = []) {
	const { exports, document } = await loadBundle();
	const locale = makeLocale("en");
	const scope = makeSettingsScope({ sources });
	const calls = [];
	const connection = {
		rpc: {
			async call(channel, endpoint, payload) {
				calls.push({ channel, endpoint, payload });
				if (endpoint === "plugin-sources/health") return { ok: true, value: { sources: scope.__section.sources.map((source) => ({ source, health: source.enabled === false ? { ok: false, disabled: true } : { ok: true, count: 1, latencyMs: 2 } })) } };
				if (endpoint === "plugin-sources/browse") return { ok: true, value: { plugins: [{ identity: { package: "dsh-demo", fallback: "npm:dsh-demo" }, name: "dsh-demo", description: "Demo plugin", version: "1.0.0", tags: ["ui", "schedule"], evidence: { releaseChannel: "stable", stars: 42, downloads30d: 1234, rating: 4.8, ratingCount: 12 }, install: { type: "npm", spec: "dsh-demo@1.0.0" }, sources: [{ id: "npm", name: "npm", type: "npm" }] }], sources: [] } };
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
	const mini = new MiniReact({ document });
	const restore = mini.installGlobals();
	const render = () => mini.render({ type: section.component, props: { t: locale.bind("plugin-market"), close: () => {} }, children: [] });
	return { exports, locale, scope, calls, installs, section, render, restore };
}

test("registers marketplace inside the native DSH plugin manager", async () => {
	const fixture = await setup();
	try {
		assert.equal(fixture.section.options.key, "@stolyarovmn/dsh-client-ui-plugin-market");
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
		assert.ok(byTag(tree, "select").some((select) => select.props.value === "relevance"));
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
