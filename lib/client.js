window.__ModuleLoader__.load({
	id: "@stolyarovmn/dsh-client-ui-plugin-market",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");
		const jsxRuntime = require("react/jsx-runtime");
		const h = jsxRuntime.jsx;
		const hs = jsxRuntime.jsxs;

		const NS = "plugin-market";
		const CHANNEL = "/plugin-sources";
		const SOURCE_TYPES = ["dsh-plugin-shop", "dshplugin-app", "npm", "github", "custom-json", "corporate"];
		let configForm;
		let connection;
		const connectionResetListeners = new Set();

		const css = `
.pm-root{height:100%;overflow:auto;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-page,transparent);font-size:13px;--pm-line:var(--dsw-alias-border-l4);--pm-panel:var(--dsw-alias-bg-layer-1);--pm-muted:var(--dsw-alias-label-tertiary);--pm-accent:var(--dsw-alias-state-business-primary)}
.pm-shell{width:min(900px,100%);margin:0 auto;padding:22px 28px 48px;box-sizing:border-box}.pm-kicker{margin:0 0 3px;color:var(--pm-accent);font:600 10px/14px ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.13em;text-transform:uppercase}.pm-title{margin:0;font-size:18px;line-height:26px;font-weight:650;letter-spacing:-.015em}.pm-lead{max-width:680px;margin:5px 0 18px;color:var(--dsw-alias-label-secondary);line-height:19px}
.pm-tabs{display:flex;gap:3px;width:max-content;padding:3px;border:1px solid var(--pm-line);border-radius:9px;background:var(--dsw-alias-bg-layer-2);margin-bottom:16px}.pm-tab{height:29px;padding:0 13px;border:0;border-radius:6px;background:transparent;color:var(--pm-muted);font:600 12px/1 inherit;cursor:pointer}.pm-tab[data-active=true]{background:var(--pm-panel);color:var(--dsw-alias-label-primary);box-shadow:0 1px 3px color-mix(in srgb,#000 12%,transparent)}
.pm-toolbar{display:flex;gap:8px;align-items:center;margin-bottom:12px}.pm-search{flex:1;position:relative}.pm-search input,.pm-input,.pm-select{box-sizing:border-box;height:35px;width:100%;border:1px solid var(--pm-line);border-radius:7px;background:var(--pm-panel);color:var(--dsw-alias-label-primary);font:inherit;outline:none;padding:0 10px}.pm-search input{padding-left:32px}.pm-search svg{position:absolute;left:10px;top:10px;color:var(--pm-muted)}.pm-search input:focus,.pm-input:focus,.pm-select:focus{border-color:var(--pm-accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--pm-accent) 14%,transparent)}
.pm-btn{height:33px;padding:0 11px;border:1px solid var(--pm-line);border-radius:7px;background:var(--pm-panel);color:var(--dsw-alias-label-secondary);font:600 12px/1 inherit;cursor:pointer;white-space:nowrap}.pm-btn:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}.pm-btn-primary{color:#fff;background:var(--pm-accent);border-color:var(--pm-accent)}.pm-btn-danger{color:var(--dsw-alias-state-error, #d44)}.pm-btn:disabled{opacity:.45;cursor:not-allowed}
.pm-panel{border:1px solid var(--pm-line);border-radius:10px;background:var(--pm-panel);overflow:hidden}.pm-panel-head{display:flex;align-items:center;justify-content:space-between;padding:11px 13px;border-bottom:1px solid var(--pm-line)}.pm-panel-title{font-weight:650}.pm-count{font:500 11px/1 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--pm-muted)}
.pm-form{display:grid;grid-template-columns:1.1fr 1fr 2fr auto;gap:8px;align-items:end;padding:13px;border-bottom:1px solid var(--pm-line)}.pm-field label{display:block;margin:0 0 5px;color:var(--pm-muted);font-size:11px}.pm-options{display:flex;gap:14px;grid-column:1/-1;color:var(--dsw-alias-label-secondary);font-size:11px}.pm-check{display:flex;align-items:center;gap:6px}.pm-notice{margin:0;padding:10px 13px;border-bottom:1px solid var(--pm-line);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2)}.pm-notice-error{color:var(--dsw-alias-state-error,#d44)}
.pm-source{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:12px 13px;border-bottom:1px solid var(--pm-line)}.pm-source:last-child{border-bottom:0}.pm-source-main{min-width:0}.pm-source-line{display:flex;align-items:center;gap:8px}.pm-source-name{font-weight:620}.pm-type,.pm-badge{display:inline-flex;align-items:center;height:18px;padding:0 6px;border:1px solid var(--pm-line);border-radius:99px;color:var(--pm-muted);font:500 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace}.pm-source-meta{margin-top:4px;color:var(--pm-muted);font:11px/16px ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pm-source-actions{display:flex;align-items:center;gap:7px}.pm-toggle{accent-color:var(--pm-accent)}
.pm-status{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-label-quaternary,#888);box-shadow:0 0 0 3px color-mix(in srgb,currentColor 10%,transparent)}.pm-status-ok{background:#30a46c}.pm-status-bad{background:var(--dsw-alias-state-error,#d44)}.pm-status-wait{background:#e5a000}.pm-health{color:var(--pm-muted);font-size:11px}
.pm-results{display:grid;gap:9px}.pm-card{position:relative;padding:13px 14px;border:1px solid var(--pm-line);border-radius:9px;background:var(--pm-panel)}.pm-card:hover{border-color:var(--dsw-alias-border-l3)}.pm-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.pm-plugin-name{font-size:14px;font-weight:650;line-height:20px}.pm-version{margin-left:7px;color:var(--pm-muted);font:10px ui-monospace,SFMono-Regular,Consolas,monospace}.pm-desc{margin:5px 0 8px;color:var(--dsw-alias-label-secondary);line-height:18px}.pm-meta{display:flex;flex-wrap:wrap;gap:6px}.pm-install{display:flex;gap:7px;align-items:center;margin-top:10px}.pm-command{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:7px 9px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:11px ui-monospace,SFMono-Regular,Consolas,monospace}
.pm-empty{padding:44px 20px;text-align:center;border:1px dashed var(--pm-line);border-radius:10px;color:var(--pm-muted)}.pm-empty strong{display:block;margin-bottom:5px;color:var(--dsw-alias-label-secondary)}.pm-spin{animation:pm-spin .8s linear infinite}@keyframes pm-spin{to{transform:rotate(360deg)}}@media(max-width:720px){.pm-shell{padding:18px 14px 36px}.pm-form{grid-template-columns:1fr}.pm-options{grid-column:auto}.pm-source{grid-template-columns:1fr}.pm-source-actions{justify-content:flex-start}.pm-card-head{display:block}.pm-card-head>.pm-btn{margin-top:8px}}
`;

		function injectStyle() {
			const key = "plugin-sources";
			const document = window.document;
			if (document.querySelector(`style[data-plugin-css="${key}"]`)) return () => {};
			const style = document.createElement("style");
			style.dataset.pluginCss = key;
			style.textContent = css;
			document.head.appendChild(style);
			return () => style.remove?.();
		}

		const en = {
			nav: "Plugin Sources", kicker: "Federated registry", title: "Plugin Sources", lead: "Connect trusted catalogs and search them as one normalized plugin index.",
			"tab.sources": "Sources", "tab.browse": "Browse", "sources.title": "Connected sources", "sources.add": "Add source", "sources.empty": "No plugin sources connected", "sources.emptyHint": "Add a catalog, npm registry, or GitHub source to begin.",
			"field.name": "Name", "field.type": "Type", "field.url": "Catalog / API URL", "field.urlHint": "Optional for npm and GitHub", "source.remove": "Remove", "source.enabled": "Enabled", "source.disabled": "Disabled", "source.checking": "Checking", "source.ok": "Healthy", "source.error": "Unavailable", "source.duplicate": "A source with this id already exists.", "source.required": "Name is required.", "source.urlRequired": "This source type requires a catalog URL.",
			"browse.search": "Search plugins, packages, repositories…", "browse.refresh": "Refresh", "browse.empty": "No plugins found", "browse.emptyHint": "Enable a healthy source or try another search.", "browse.loading": "Loading catalogs…", "browse.error": "Catalog request failed", "browse.results": "{count} results", "copy": "Copy command", "copied": "Copied", "copy.failed": "Could not copy", "install.warning": "Review the package and source before running this third-party install command.", "readonly": "Settings are read-only.", "unavailable": "Plugin source settings are unavailable.",
		};
		const zh = {
			nav: "插件源", kicker: "联合注册表", title: "插件源", lead: "连接可信目录，并将它们作为统一的规范化插件索引进行搜索。",
			"tab.sources": "来源", "tab.browse": "浏览", "sources.title": "已连接来源", "sources.add": "添加来源", "sources.empty": "尚未连接插件源", "sources.emptyHint": "添加目录、npm 注册表或 GitHub 来源以开始。",
			"field.name": "名称", "field.type": "类型", "field.url": "目录 / API URL", "field.urlHint": "npm 和 GitHub 可选", "source.remove": "移除", "source.enabled": "已启用", "source.disabled": "已禁用", "source.checking": "检查中", "source.ok": "正常", "source.error": "不可用", "source.duplicate": "具有此 ID 的来源已存在。", "source.required": "名称为必填项。", "source.urlRequired": "此来源类型需要目录 URL。",
			"browse.search": "搜索插件、包、仓库…", "browse.refresh": "刷新", "browse.empty": "未找到插件", "browse.emptyHint": "启用健康的来源或尝试其他搜索。", "browse.loading": "正在加载目录…", "browse.error": "目录请求失败", "browse.results": "{count} 个结果", "copy": "复制命令", "copied": "已复制", "copy.failed": "复制失败", "install.warning": "运行此第三方安装命令前，请检查包和来源。", "readonly": "设置为只读。", "unavailable": "插件源设置不可用。", 
		};

		function slug(value) {
			const input = value.trim();
			const ascii = input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
			if (ascii) return ascii;
			let hash = 2166136261;
			for (const char of input) { hash ^= char.codePointAt(0); hash = Math.imul(hash, 16777619); }
			return input ? `source-${(hash >>> 0).toString(36)}` : "";
		}

		function rpc(endpoint, payload, signal) {
			if (!connection?.rpc?.call) return Promise.reject(new Error("Host connection is unavailable"));
			return connection.rpc.call(CHANNEL, endpoint, payload, signal).then((result) => {
				if (!result?.ok) throw new Error(result?.error?.message || "Host request failed");
				return result.value;
			});
		}

		function SearchIcon() {
			return h("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true, children: [h("circle", { cx: 11, cy: 11, r: 7 }), h("path", { d: "m20 20-3.6-3.6" })] });
		}

		function Empty({ title, hint }) {
			return hs("div", { className: "pm-empty", children: [h("strong", { children: title }), h("span", { children: hint })] });
		}

		function AddSourceForm({ t, sources, onSave, busy, readOnly }) {
			const [name, setName] = react.useState("");
			const [type, setType] = react.useState("custom-json");
			const [url, setUrl] = react.useState("");
			const [error, setError] = react.useState("");
			const submit = async (event) => {
				event.preventDefault();
				const id = slug(name);
				const needsUrl = !["npm", "github"].includes(type);
				if (!id) return setError(t("source.required"));
				if (needsUrl && !url.trim()) return setError(t("source.urlRequired"));
				if (sources.some((source) => source.id === id)) return setError(t("source.duplicate"));
				setError("");
				try {
					const saved = await onSave([...sources, { id, name: name.trim(), type, ...(url.trim() ? { url: url.trim() } : {}), enabled: true }]);
					if (saved === false) return;
					setName(""); setUrl("");
				} catch (failure) {
					setError(String(failure?.message ?? failure));
				}
			};
			return hs("form", { className: "pm-form", onSubmit: submit, children: [
				hs("div", { className: "pm-field", children: [h("label", { htmlFor: "pm-name", children: t("field.name") }), h("input", { id: "pm-name", className: "pm-input", value: name, onChange: (event) => setName(event.target.value), disabled: readOnly || busy })] }),
				hs("div", { className: "pm-field", children: [h("label", { htmlFor: "pm-type", children: t("field.type") }), h("select", { id: "pm-type", className: "pm-select", value: type, onChange: (event) => setType(event.target.value), disabled: readOnly || busy, children: SOURCE_TYPES.map((item) => h("option", { value: item, children: item }, item)) })] }),
				hs("div", { className: "pm-field", children: [h("label", { htmlFor: "pm-url", children: t("field.url") }), h("input", { id: "pm-url", className: "pm-input", type: "url", value: url, placeholder: t("field.urlHint"), onChange: (event) => setUrl(event.target.value), disabled: readOnly || busy })] }),
				h("button", { className: "pm-btn pm-btn-primary", type: "submit", disabled: readOnly || busy, children: t("sources.add") }),
				error ? h("p", { className: "pm-notice pm-notice-error", role: "alert", children: error }) : null,
			] });
		}

		function SourceRow({ source, health, t, busy, readOnly, onToggle, onRemove }) {
			const status = source.enabled === false ? "off" : health?.ok === true ? "ok" : health?.ok === false ? "bad" : "wait";
			const statusText = status === "off" ? t("source.disabled") : status === "ok" ? `${t("source.ok")} · ${health.count ?? 0}` : status === "bad" ? `${t("source.error")} · ${health.error ?? ""}` : t("source.checking");
			return hs("div", { className: "pm-source", children: [
				hs("div", { className: "pm-source-main", children: [
					hs("div", { className: "pm-source-line", children: [h("span", { className: `pm-status pm-status-${status}`, "aria-hidden": true }), h("span", { className: "pm-source-name", children: source.name }), h("span", { className: "pm-type", children: source.type })] }),
					h("div", { className: "pm-source-meta", title: health?.error || source.url || "", children: source.url || statusText }),
					h("div", { className: "pm-health", children: statusText }),
				] }),
				hs("div", { className: "pm-source-actions", children: [
					hs("label", { className: "pm-check", children: [h("input", { className: "pm-toggle", type: "checkbox", checked: source.enabled !== false, disabled: readOnly || busy, onChange: () => onToggle(source.id) }), h("span", { children: t("source.enabled") })] }),
					h("button", { type: "button", className: "pm-btn pm-btn-danger", disabled: readOnly || busy, onClick: () => onRemove(source.id), children: t("source.remove") }),
				] }),
			] });
		}

		function SourcesView({ t, sources, writable, saveSources, busy, healthState, refreshHealth }) {
			const [mutationError, setMutationError] = react.useState("");
			const mutate = async (next) => {
				setMutationError("");
				try { await saveSources(next); return true; }
				catch (failure) { setMutationError(String(failure?.message ?? failure)); return false; }
			};
			const healthMap = Object.fromEntries((healthState.data?.sources ?? []).map((row) => [row.source.id, row.health]));
			return h("section", { className: "pm-panel", children: [
				hs("div", { className: "pm-panel-head", children: [h("span", { className: "pm-panel-title", children: t("sources.title") }), h("button", { type: "button", className: "pm-btn", onClick: refreshHealth, disabled: healthState.loading, children: t("browse.refresh") })] }),
				h(AddSourceForm, { t, sources, onSave: mutate, busy, readOnly: !writable }),
				!writable ? h("p", { className: "pm-notice", children: t("readonly") }) : null,
				mutationError ? h("p", { className: "pm-notice pm-notice-error", role: "alert", children: mutationError }) : null,
				healthState.error ? h("p", { className: "pm-notice pm-notice-error", role: "alert", children: healthState.error }) : null,
				sources.length === 0 ? h(Empty, { title: t("sources.empty"), hint: t("sources.emptyHint") }) : sources.map((source) => h(SourceRow, { source, health: healthMap[source.id], t, busy, readOnly: !writable, onToggle: (id) => { void mutate(sources.map((row) => row.id === id ? { ...row, enabled: row.enabled === false } : row)); }, onRemove: (id) => { void mutate(sources.filter((row) => row.id !== id)); } }, source.id)),
			] });
		}

		function installCommand(plugin) {
			return plugin.install?.spec ? `dsh plugin add ${plugin.install.spec}` : "";
		}

		function PluginCard({ plugin, t }) {
			const [copyState, setCopyState] = react.useState("");
			const command = installCommand(plugin);
			react.useEffect(() => {
				if (!copyState) return undefined;
				const timer = setTimeout(() => setCopyState(""), 1400);
				return () => clearTimeout(timer);
			}, [copyState]);
			const copy = async () => {
				try {
					if (!command || !globalThis.navigator?.clipboard?.writeText) throw new Error(t("copy.failed"));
					await globalThis.navigator.clipboard.writeText(command);
					setCopyState("ok");
				} catch { setCopyState("error"); }
			};
			return hs("article", { className: "pm-card", children: [
				hs("div", { className: "pm-card-head", children: [hs("div", { children: [h("span", { className: "pm-plugin-name", children: plugin.name }), plugin.version ? h("span", { className: "pm-version", children: plugin.version }) : null] }), command ? h("button", { type: "button", className: "pm-btn", onClick: copy, children: copyState === "ok" ? t("copied") : copyState === "error" ? t("copy.failed") : t("copy") }) : null] }),
				plugin.description ? h("p", { className: "pm-desc", children: plugin.description }) : null,
				hs("div", { className: "pm-meta", children: [plugin.identity?.package ? h("span", { className: "pm-badge", children: plugin.identity.package }) : null, ...(plugin.sources ?? []).map((source) => h("span", { className: "pm-badge", children: source.name }, source.id))] }),
				plugin.identity?.repository ? h("div", { className: "pm-source-meta", title: plugin.identity.repository, children: plugin.identity.repository }) : null,
				command ? hs("div", { children: [h("div", { className: "pm-install", children: h("code", { className: "pm-command", children: command }) }), h("p", { className: "pm-health", children: t("install.warning") }), h("span", { role: "status", "aria-live": "polite", style: { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }, children: copyState === "ok" ? t("copied") : copyState === "error" ? t("copy.failed") : "" })] }) : null,
			] });
		}

		function BrowseView({ t, state, query, setQuery, refresh }) {
			const plugins = state.data?.plugins ?? [];
			return hs("section", { children: [
				hs("form", { className: "pm-toolbar", onSubmit: (event) => { event.preventDefault(); refresh(); }, children: [
					hs("div", { className: "pm-search", children: [h(SearchIcon, {}), h("input", { id: "pm-search", type: "search", value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("browse.search"), "aria-label": t("browse.search") })] }),
					h("button", { type: "submit", className: "pm-btn", disabled: state.loading, children: t("browse.refresh") }),
				] }),
				state.loading ? h("p", { className: "pm-notice", children: t("browse.loading") }) : null,
				state.error ? h("p", { className: "pm-notice pm-notice-error", role: "alert", children: `${t("browse.error")}: ${state.error}` }) : null,
				!state.loading && !state.error && plugins.length === 0 ? h(Empty, { title: t("browse.empty"), hint: t("browse.emptyHint") }) : null,
				plugins.length ? hs("div", { children: [h("p", { className: "pm-count", children: t("browse.results", { count: plugins.length }) }), h("div", { className: "pm-results", children: plugins.map((plugin) => h(PluginCard, { plugin, t }, plugin.identity?.package || plugin.identity?.repository || plugin.identity?.fallback)) })] }) : null,
			] });
		}

		function PluginSourcesSection({ t }) {
			const bound = configForm;
			const [snapshot, setSnapshot] = react.useState(() => bound?.getSnapshot?.());
			const [tab, setTab] = react.useState("sources");
			const [query, setQuery] = react.useState("");
			const [busy, setBusy] = react.useState(false);
			const [healthState, setHealthState] = react.useState({ loading: false });
			const [browseState, setBrowseState] = react.useState({ loading: false });
			const [browseRevision, setBrowseRevision] = react.useState(0);
			const [healthRevision, setHealthRevision] = react.useState(0);
			const [connectionRevision, setConnectionRevision] = react.useState(0);
			react.useEffect(() => bound?.subscribe?.(() => setSnapshot(bound.getSnapshot())), [bound]);
			react.useEffect(() => {
				const listener = () => setConnectionRevision((value) => value + 1);
				connectionResetListeners.add(listener);
				return () => connectionResetListeners.delete(listener);
			}, []);
			const sources = Array.isArray(snapshot?.value?.sources) ? snapshot.value.sources : [];
			const signature = JSON.stringify(sources);
			const writable = snapshot?.writable === true;
			const saveSources = async (next) => { if (!bound || !writable) return; setBusy(true); try { await bound.set("sources", next); } finally { setBusy(false); } };

			react.useEffect(() => {
				if (tab !== "sources" || !connection) return undefined;
				const controller = new AbortController();
				setHealthState({ loading: true });
				rpc("health", {}, controller.signal).then((data) => setHealthState({ loading: false, data }), (error) => { if (error?.name !== "AbortError") setHealthState({ loading: false, error: String(error?.message ?? error) }); });
				return () => controller.abort();
			}, [tab, signature, healthRevision, connectionRevision]);

			react.useEffect(() => {
				if (tab !== "browse" || !connection) return undefined;
				const controller = new AbortController();
				const timer = setTimeout(() => {
					setBrowseState({ loading: true });
					rpc("browse", { query }, controller.signal).then((data) => setBrowseState({ loading: false, data }), (error) => { if (error?.name !== "AbortError") setBrowseState({ loading: false, error: String(error?.message ?? error) }); });
				}, 220);
				return () => { clearTimeout(timer); controller.abort(); };
			}, [tab, query, signature, browseRevision, connectionRevision]);

			if (!snapshot || snapshot.status === "unavailable") return h("div", { className: "pm-root", children: h("div", { className: "pm-shell", children: h(Empty, { title: t("unavailable"), hint: "plugin-market" }) }) });
			const selectTab = (next) => { setTab(next); queueMicrotask(() => window.document.getElementById?.(`pm-tab-${next}`)?.focus?.()); };
			const tabKey = (event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); selectTab(tab === "sources" ? "browse" : "sources"); } };
			return h("div", { className: "pm-root", children: hs("section", { className: "pm-shell", "aria-labelledby": "pm-title", children: [
				h("p", { className: "pm-kicker", children: t("kicker") }), h("h2", { id: "pm-title", className: "pm-title", children: t("title") }), h("p", { className: "pm-lead", children: t("lead") }),
				hs("div", { className: "pm-tabs", role: "tablist", "aria-label": t("title"), children: [h("button", { id: "pm-tab-sources", type: "button", className: "pm-tab", role: "tab", tabIndex: tab === "sources" ? 0 : -1, "aria-controls": "pm-panel-sources", "aria-selected": tab === "sources", "data-active": tab === "sources", onKeyDown: tabKey, onClick: () => selectTab("sources"), children: t("tab.sources") }), h("button", { id: "pm-tab-browse", type: "button", className: "pm-tab", role: "tab", tabIndex: tab === "browse" ? 0 : -1, "aria-controls": "pm-panel-browse", "aria-selected": tab === "browse", "data-active": tab === "browse", onKeyDown: tabKey, onClick: () => selectTab("browse"), children: t("tab.browse") })] }),
				h("div", { id: `pm-panel-${tab}`, role: "tabpanel", "aria-labelledby": `pm-tab-${tab}`, children: tab === "sources" ? h(SourcesView, { t, sources, writable, saveSources, busy, healthState, refreshHealth: () => setHealthRevision((value) => value + 1) }) : h(BrowseView, { t, state: browseState, query, setQuery, refresh: () => setBrowseRevision((value) => value + 1) }) }),
			] }) });
		}

		const inject = ["slots", "locale", "configForms", "connection"];
		function apply(ctx) {
			configForm = ctx.configForms?.get?.(NS);
			connection = ctx.connection;
			ctx.on?.("connection/reset", () => {
				for (const listener of [...connectionResetListeners]) listener();
			});
			ctx.effect(injectStyle, "plugin-sources: styles");
			ctx.effect(() => ctx.locale.register(NS, { en, zh }), "plugin-sources: locale");
			ctx.slots.inject("settings.plugins.tab", () => ctx.slots.register({ name: "settings.plugins.tab", id: "sources", order: 20, locale: NS, label: () => { try { return ctx.locale.bind(NS)("nav"); } catch { return "Plugin Sources"; } } }, PluginSourcesSection));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
