/*
 * Test harness for the Registry Aggregator client bundle.
 *
 * Executes the REAL lib/client.js bundle (the exact file the browser runs)
 * against a minimal React-compatible runtime plus a mock window/document, so
 * usage scenarios can be exercised deterministically in Node:
 *
 *  - jsx/jsxs element creation and positional child reconciliation
 *  - useState / useEffect / useMemo with per-component hook state that persists
 *    across re-renders, dependency comparison, and cleanup tracking
 *  - a locale face whose active language the tests can switch
 *  - a slot ctx mock recording every registration apply() makes
 *  - a settingsScope mock bound to one mutable namespace form (sources),
 *    mirroring the DSH 0.1.5-rc.3 `ctx.settingsScope.bind` contract
 *
 * The bundle's catalog resolver is overridable via `window.__PM_RESOLVER__`.
 */

// ── Minimal DOM ───────────────────────────────────────────────────────────────
function makeElement(tagName) {
	return {
		tagName: tagName.toUpperCase(),
		dataset: {},
		textContent: "",
		children: [],
		style: {},
		appendChild(child) { this.children.push(child); },
		remove() {},
	};
}
export function makeDocument() {
	const document = {
		documentElement: { lang: "en" },
		head: makeElement("head"),
		body: makeElement("body"),
		createElement: (tag) => makeElement(tag),
		querySelector(selector) {
			const match = /^style\[data-plugin-css="(.*)"\]$/.exec(selector);
			if (!match) return null;
			const scan = (nodes) => {
				for (const node of nodes) {
					if (node.tagName === "STYLE" && node.dataset.pluginCss === match[1]) return node;
					const found = scan(node.children ?? []);
					if (found) return found;
				}
				return null;
			};
			return scan([document.head]);
		},
	};
	return document;
}

// ── Mini React ────────────────────────────────────────────────────────────────
const depsEqual = (a, b) =>
	a === b || (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((v, i) => Object.is(v, b[i])));

// The currently-rendering component's hook context. The `react` mock's hook
// functions delegate here, so they always operate on the component on the top
// of the render stack.
const active = { hooks: null };

function bindHooks(hookArr, effectFn) {
	let idx = 0;
	return {
		useState(initial) {
			const i = idx++;
			if (!(i in hookArr)) hookArr[i] = { v: typeof initial === "function" ? initial() : initial };
			return [hookArr[i].v, (nv) => { hookArr[i].v = typeof nv === "function" ? nv(hookArr[i].v) : nv; }];
		},
		useEffect(fn, deps) {
			const i = idx++;
			effectFn(fn, deps, i);
		},
		useRef(initial) {
			const i = idx++;
			if (!(i in hookArr)) hookArr[i] = { current: initial };
			return hookArr[i];
		},
		useMemo(fn, deps) {
			const i = idx++;
			if (!(i in hookArr) || !depsEqual(hookArr[i].deps, deps)) hookArr[i] = { memo: true, v: fn(), deps };
			return hookArr[i].v;
		},
	};
}

export class MiniReact {
	#hookStore = new Map();   // pathKey -> hook array (persists across renders)
	#effectStore = new Map(); // pathKey -> last deps (persists across renders)
	#cleanups = new Map();    // pathKey -> cleanup fn (persists across renders)
	#pendingEffects = [];

	constructor(options = {}) {
		this.document = options.document ?? makeDocument();
		this.window = {
			document: this.document,
			setInterval: () => 0,
			clearInterval: () => {},
			__PM_RESOLVER__: undefined,
		};
	}
	installGlobals() {
		const prevDoc = globalThis.document;
		const prevWin = globalThis.window;
		globalThis.document = this.document;
		globalThis.window = this.window;
		return () => { globalThis.document = prevDoc; globalThis.window = prevWin; };
	}
	render(element) {
		this.#pendingEffects = [];
		const tree = this.#renderNode(element, []);
		this.#flushEffects();
		return tree;
	}
	#renderNode(node, path) {
		if (node === null || node === undefined || typeof node === "boolean") return { tag: "text", text: "" };
		if (typeof node === "number" || typeof node === "string") return { tag: "text", text: String(node) };
		if (Array.isArray(node)) return { tag: "group", children: node.map((c, i) => this.#renderNode(c, path.concat(["#", i]))) };
		if (node.type === "fragment") return { tag: "group", children: (node.children ?? []).map((c, i) => this.#renderNode(c, path.concat(["#", i]))) };
		if (typeof node.type === "function") {
			const compPath = path.concat([node.type.__name ?? node.type.name ?? "fn"]);
			const key = compPath.join("\u0000");
			if (!this.#hookStore.has(key)) this.#hookStore.set(key, []);
			const hookArr = this.#hookStore.get(key);
			const prevActive = active.hooks;
			active.hooks = bindHooks(hookArr, (fn, deps, hookIndex) => this.#pendingEffects.push({ path: compPath.concat(["effect", hookIndex]), fn, deps }));
			let out;
			try { out = node.type(node.props ?? {}); } finally { active.hooks = prevActive; }
			return this.#renderNode(out, compPath);
		}
		return { tag: typeof node.type === "string" ? node.type.toLowerCase() : "el", props: node.props ?? {}, children: (node.children ?? []).map((c, i) => this.#renderNode(c, path.concat(["#", i]))) };
	}
	#flushEffects() {
		for (const { path, fn, deps } of this.#pendingEffects) {
			const key = path.join("\u0000");
			const prev = this.#effectStore.get(key);
			this.#effectStore.set(key, deps);
			if (prev === undefined || !depsEqual(prev, deps)) {
				const prevCleanup = this.#cleanups.get(key);
				if (prevCleanup) { try { prevCleanup(); } catch { /* contain */ } }
				try {
					const cleanup = fn();
					this.#cleanups.set(key, typeof cleanup === "function" ? cleanup : undefined);
				} catch { /* contain */ }
			}
		}
	}
}

// jsx-runtime mock matching the real react/jsx-runtime positional contract.
const childrenOf = (config) => {
	const children = config?.children;
	if (children === undefined || children === null) return [];
	return Array.isArray(children) ? children : [children];
};
export const makeJsxRuntime = () => ({
	jsx: (type, config, key) => ({ type, props: config ?? {}, children: childrenOf(config), key }),
	jsxs: (type, config, key) => ({ type, props: config ?? {}, children: childrenOf(config), key }),
	Fragment: "fragment",
});

// The `react` module the bundle requires: delegates to the active component.
export const makeReact = () => ({
	useState: (initial) => active.hooks.useState(initial),
	useEffect: (fn, deps) => active.hooks.useEffect(fn, deps),
	useRef: (initial) => active.hooks.useRef(initial),
	useMemo: (fn, deps) => active.hooks.useMemo(fn, deps),
});

// ── Locale mock ───────────────────────────────────────────────────────────────
export function makeLocale(initial = "en") {
	const dicts = {};
	let lang = initial;
	const lookup = (ns) => (key, vars) => {
		const table = dicts[ns];
		const template = table ? (table[lang] ? table[lang][key] : table[lang === "zh" ? "en" : lang]?.[key]) ?? table[key] : undefined;
		if (template === undefined) return key;
		let out = String(template);
		for (const [k, v] of Object.entries(vars ?? {})) out = out.replace("{" + k + "}", String(v));
		return out;
	};
	return {
		register(ns, table) { dicts[ns] = table; },
		bind: lookup,
		setLanguage(l) { lang = l; },
		get language() { return lang; },
	};
}

// ── Slots mock ────────────────────────────────────────────────────────────────
export function makeSlots() {
	const recorded = [];
	const slots = {
		recorded,
		inject(_name, cb) { cb(); },
		register(options, component) { recorded.push({ options, component }); },
	};
	return slots;
}

// ── settingsScope mock (mirrors ctx.settingsScope.bind) ───────────────────────
export function makeSettingsScope({ sources = [], sourceDefaultsVersion = 1, writable = true, status = "ready" } = {}) {
	const section = { sources: sources.map((s) => ({ ...s })), sourceDefaultsVersion };
	const listeners = new Set();
	let revision = 1;
	const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
	let snapshot = { status, value: clone(section), base: undefined, user: clone(section), revision, writable, mode: "host" };
	function publish() {
		snapshot = { status, value: clone(section), base: undefined, user: clone(section), revision, writable, mode: "host" };
		for (const l of listeners) l();
	}
	return {
		getSnapshot: () => snapshot,
		subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
		async set(field, value) { section[field] = value; revision++; publish(); },
		async unset(field) { delete section[field]; revision++; publish(); },
		async mutate(ops) { for (const op of ops) { if (op.op === "set") section[op.path[0]] = op.value; else delete section[op.path[0]]; } revision++; publish(); },
		__section: section,
		__revision: () => revision,
	};
}

export function makeSettingsScopeService(scope) {
	return { bind: (_spec) => scope, describe: () => scope.getSnapshot() };
}

export function makeConfigFormsService(scope) {
	return { get: (_namespace) => scope, describe: () => scope.getSnapshot() };
}

// ── ctx factory ───────────────────────────────────────────────────────────────
export function makeCtx(locale, { settingsScope, configForms, slots, connection, remote } = {}) {
	const slotMock = slots ?? makeSlots();
	const ctx = {
		effect(fn, _label) { fn(); return () => {}; },
		locale,
		slots: slotMock,
		...(settingsScope !== undefined ? { settingsScope } : {}),
		...(configForms !== undefined ? { configForms } : {}),
		...(connection !== undefined ? { connection } : {}),
		...(remote !== undefined ? { remote } : {}),
	};
	return { ctx, recorded: slotMock.recorded, slots: slotMock };
}

// ── Bundle loader ─────────────────────────────────────────────────────────────
export async function loadBundle({ resolver } = {}) {
	const registrations = [];
	const document = makeDocument();
	const window = {
		__ModuleLoader__: { load(record) { registrations.push(record); } },
		document,
		__PM_RESOLVER__: resolver,
	};
	const Icon = (props) => ({ type: "svg", props, children: [] });
	const primitives = {
		Button: (props) => ({ type: "button", props, children: childrenOf(props) }),
		Modal: (props) => ({ type: "div", props: { ...props, role: "dialog" }, children: childrenOf(props) }),
		Switch: (props) => ({ type: "button", props: { ...props, role: "switch", "aria-checked": props.checked }, children: [] }),
		IconPlusOutlineRegular: Icon,
		IconRefreshOutlineRegular: Icon,
		IconChevronDownOutlineRegular: Icon,
		IconCopyOutlineRegular: Icon,
		IconShareOutlineRegular: Icon,
		IconTrashOutlineRegular: Icon,
		IconDatabaseOutlineRegular: Icon,
		IconCordisPluginOutlineRegular: Icon,
		IconLinkOutlineRegular: Icon,
		IconWarningOutlineRegular: Icon,
		IconSearchOutlineRegular: Icon,
		IconClockOutlineRegular: Icon,
		IconDownloadOutlineRegular: Icon,
		IconCheckOutlineRegular: Icon,
		IconChevronUpOutlineRegular: Icon,
		IconChevronLeftOutlineRegular: Icon,
		IconChevronRightOutlineRegular: Icon,
		IconChevronsUpDownOutlineRegular: Icon,
		IconFlatListOutlineRegular: Icon,
	};
	const modules = {
		react: makeReact(),
		"react/jsx-runtime": makeJsxRuntime(),
		"@deepseek-ai/dsh-client-ui-primitives": primitives,
	};
	const require = (spec) => {
		if (!(spec in modules)) throw new Error(`harness: unmocked module request '${spec}'`);
		return modules[spec];
	};
	const bundlePath = new URL("../lib/client.js", import.meta.url);
	const { readFileSync } = await import("node:fs");
	const source = readFileSync(bundlePath, "utf8");
	const run = new Function("window", source + "\n;return undefined;");
	run(window);
	if (registrations.length !== 1) throw new Error(`expected exactly one bundle registration, got ${registrations.length}`);
	return { registration: registrations[0], exports: registrations[0].factory(require), window, document };
}

// ── Render helper ─────────────────────────────────────────────────────────────
export function renderComponent(mini, component, props) {
	return mini.render({ type: component, props, children: [] });
}

// ── Tree query helpers ────────────────────────────────────────────────────────
export function walk(tree, visit) { visit(tree); for (const c of tree.children ?? []) walk(c, visit); }
export function byClassExact(tree, className) {
	let found = null;
	walk(tree, (n) => { if (found) return; const cls = n.props?.className; if (typeof cls === "string" && cls.split(/\s+/).includes(className)) found = n; });
	return found;
}
export function byClass(tree, className) {
	const out = [];
	walk(tree, (n) => { const cls = n.props?.className; if (typeof cls === "string" && cls.split(/\s+/).includes(className)) out.push(n); });
	return out;
}
export function byId(tree, id) {
	let found = null;
	walk(tree, (n) => { if (found) return; if (n.props?.id === id) found = n; });
	return found;
}
export function byTag(tree, tag) { const out = []; walk(tree, (n) => { if (n.tag === tag) out.push(n); }); return out; }
export function childTexts(node) {
	const out = [];
	const rec = (n) => { if (n.tag === "text") out.push(n.text); else for (const c of n.children ?? []) rec(c); };
	rec(node);
	return out;
}
export function textOf(node) { return childTexts(node).join(""); }
