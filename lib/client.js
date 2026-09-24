window.__ModuleLoader__.load({
	id: "@stolyarovmn/dsh-client-ui-plugin-market",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");
		const jsxRuntime = require("react/jsx-runtime");
		const { Button, Modal } = require("@deepseek-ai/dsh-client-ui-primitives");
		const h = jsxRuntime.jsx;
		const hs = jsxRuntime.jsxs;

		const NS = "plugin-market";
		const CHANNEL = "/api";
		const RPC_PREFIX = "plugin-sources";
		const SOURCE_TYPES = ["dsh-plugin-shop", "dshplugin-app", "npm", "github", "custom-json", "corporate"];
		let configForm;
		let connection;
		let remote;
		const connectionResetListeners = new Set();

		const css = `
.pm-root{height:100%;overflow:auto;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-page,transparent);font-size:13px;--pm-line:var(--dsw-alias-border-l4);--pm-panel:var(--dsw-alias-bg-layer-1);--pm-muted:var(--dsw-alias-label-tertiary);--pm-accent:var(--dsw-alias-state-business-primary)}
.pm-shell{width:100%;max-width:1120px;margin:0 auto;padding:10px 0 28px;box-sizing:border-box}.pm-kicker{margin:0 0 3px;color:var(--pm-accent);font:600 10px/14px ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.13em;text-transform:uppercase}.pm-title{margin:0;font-size:18px;line-height:26px;font-weight:650;letter-spacing:-.015em}.pm-lead{max-width:680px;margin:5px 0 18px;color:var(--dsw-alias-label-secondary);line-height:19px}
.pm-tabs{display:flex;gap:3px;width:max-content;padding:3px;border:1px solid var(--pm-line);border-radius:9px;background:var(--dsw-alias-bg-layer-2);margin-bottom:16px}.pm-tab{height:29px;padding:0 13px;border:0;border-radius:6px;background:transparent;color:var(--pm-muted);font:600 12px/1 inherit;cursor:pointer}.pm-tab[data-active=true]{background:var(--pm-panel);color:var(--dsw-alias-label-primary);box-shadow:0 1px 3px color-mix(in srgb,#000 12%,transparent)}
.pm-toolbar{display:flex;gap:8px;align-items:center;margin-bottom:12px}.pm-search{flex:1;position:relative}.pm-search input,.pm-input,.pm-select{box-sizing:border-box;height:35px;width:100%;border:1px solid var(--pm-line);border-radius:7px;background:var(--pm-panel);color:var(--dsw-alias-label-primary);font:inherit;outline:none;padding:0 10px}.pm-search input{padding-left:32px}.pm-search svg{position:absolute;left:10px;top:10px;color:var(--pm-muted)}.pm-search input:focus,.pm-input:focus,.pm-select:focus{border-color:var(--pm-accent);box-shadow:0 0 0 2px color-mix(in srgb,var(--pm-accent) 14%,transparent)}
.pm-btn{height:33px;padding:0 11px;border:1px solid var(--pm-line);border-radius:7px;background:var(--pm-panel);color:var(--dsw-alias-label-secondary);font:600 12px/1 inherit;cursor:pointer;white-space:nowrap}.pm-btn:hover:not(:disabled){color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}.pm-btn-primary{color:#fff;background:var(--pm-accent);border-color:var(--pm-accent)}.pm-btn-danger{color:var(--dsw-alias-state-error, #d44)}.pm-btn:disabled{opacity:.45;cursor:not-allowed}
.pm-panel{border:1px solid var(--pm-line);border-radius:10px;background:var(--pm-panel);overflow:hidden}.pm-panel-head{display:flex;align-items:center;justify-content:space-between;padding:11px 13px;border-bottom:1px solid var(--pm-line)}.pm-panel-title{font-weight:650}.pm-count{font:500 11px/1 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--pm-muted)}
.pm-form{display:grid;grid-template-columns:minmax(0,1fr) minmax(170px,.55fr);gap:10px 12px;align-items:end;padding:13px;border-bottom:1px solid var(--pm-line)}.pm-field{min-width:0}.pm-field label{display:block;margin:0 0 5px;color:var(--pm-muted);font-size:11px}.pm-field-url{grid-column:1/-1}.pm-add{grid-column:2;justify-self:end}.pm-options{display:flex;gap:14px;grid-column:1/-1;color:var(--dsw-alias-label-secondary);font-size:11px}.pm-check{display:flex;align-items:center;gap:6px}.pm-notice{margin:0;padding:10px 13px;border-bottom:1px solid var(--pm-line);color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2)}.pm-notice-error{color:var(--dsw-alias-state-error,#d44)}
.pm-source-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:12px 13px}.pm-source{display:flex;flex-direction:column;gap:10px;padding:13px;border:1px solid var(--pm-line);border-radius:10px;background:var(--dsw-alias-bg-layer-2)}.pm-source-main{min-width:0}.pm-source-line{display:flex;align-items:center;gap:8px}.pm-source-name{font-weight:620}.pm-type,.pm-badge,.pm-tag{display:inline-flex;align-items:center;height:18px;padding:0 6px;border:1px solid var(--pm-line);border-radius:99px;color:var(--pm-muted);font:500 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace}.pm-tag{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2)}.pm-source-meta{margin-top:4px;color:var(--pm-muted);font:11px/16px ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pm-source-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.pm-toggle{accent-color:var(--pm-accent)}.pm-source-details{padding-top:9px;border-top:1px solid var(--pm-line)}.pm-source-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.pm-source-buttons{display:flex;align-items:center;gap:6px}.pm-share{color:var(--pm-accent)}.pm-chevron{transition:transform .15s ease}.pm-chevron[data-open=true]{transform:rotate(180deg)}
.pm-status{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-label-quaternary,#888);box-shadow:0 0 0 3px color-mix(in srgb,currentColor 10%,transparent)}.pm-status-ok{background:#30a46c}.pm-status-bad{background:var(--dsw-alias-state-error,#d44)}.pm-status-wait{background:#e5a000}.pm-health{color:var(--pm-muted);font-size:11px}
.pm-results{display:grid;gap:9px}.pm-card{position:relative;padding:13px 14px;border:1px solid var(--pm-line);border-radius:9px;background:var(--pm-panel)}.pm-card:hover{border-color:var(--dsw-alias-border-l3)}.pm-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.pm-plugin-name{font-size:14px;font-weight:650;line-height:20px}.pm-link{color:inherit;text-decoration:none}.pm-link:hover{text-decoration:underline}.pm-version{margin-left:7px;color:var(--pm-muted);font:10px ui-monospace,SFMono-Regular,Consolas,monospace}.pm-signal{display:inline-flex;align-items:center;gap:3px;margin-left:7px;color:var(--pm-muted);font:500 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace}.pm-channel{display:inline-flex;align-items:center;height:18px;margin-left:7px;padding:0 6px;border:1px solid var(--pm-line);border-radius:99px;color:var(--dsw-alias-label-secondary);font:600 9px/1 ui-monospace,SFMono-Regular,Consolas,monospace;text-transform:uppercase}.pm-channel-stable{color:#30a46c}.pm-channel-alpha,.pm-channel-beta,.pm-channel-rc,.pm-channel-prerelease{color:#e5a000}.pm-desc{margin:5px 0 3px;color:var(--dsw-alias-label-secondary);line-height:18px}.pm-desc[data-clamped=true]{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pm-more{border:0;background:transparent;padding:0;color:var(--pm-accent);font:500 11px/16px inherit;cursor:pointer}.pm-card-actions{display:flex;align-items:center;gap:7px;margin-top:10px}.pm-install-button{min-width:76px}.pm-install-status{font-size:11px;color:var(--pm-muted)}.pm-meta{display:flex;flex-wrap:wrap;gap:6px}.pm-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.pm-install{display:flex;gap:7px;align-items:center;margin-top:10px}.pm-command{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:7px 9px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:11px ui-monospace,SFMono-Regular,Consolas,monospace}.pm-icon-btn{width:32px;min-width:32px;height:32px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--pm-line);border-radius:7px;background:var(--pm-panel);color:var(--dsw-alias-label-secondary);cursor:pointer}.pm-icon-btn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}.pm-icon-btn svg{display:block}
.pm-browse-options{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px}.pm-sort{width:auto;min-width:130px;height:30px}.pm-empty{padding:44px 20px;text-align:center;border:1px dashed var(--pm-line);border-radius:10px;color:var(--pm-muted)}.pm-empty strong{display:block;margin-bottom:5px;color:var(--dsw-alias-label-secondary)}.pm-spin{animation:pm-spin .8s linear infinite}@keyframes pm-spin{to{transform:rotate(360deg)}}@media(max-width:720px){.pm-shell{padding:8px 0 28px}.pm-source-list{grid-template-columns:1fr}.pm-form{grid-template-columns:1fr}.pm-field-url,.pm-add,.pm-options{grid-column:1}.pm-add{justify-self:stretch;width:100%}.pm-source{grid-template-columns:1fr}.pm-source-actions{justify-content:flex-start}.pm-card-head{display:block}.pm-card-head>.pm-btn{margin-top:8px}}
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
			nav: "Marketplace", kicker: "Federated registry", title: "Marketplace", lead: "Browse npm immediately, connect more trusted sources, and install plugins through the native DSH Plugin Manager.",
			"tab.sources": "Sources", "tab.browse": "Browse", "sources.title": "Connected sources", "sources.add": "Add source", "sources.empty": "No plugin sources connected", "sources.emptyHint": "Add a catalog, npm registry, or GitHub source to begin.",
			"field.name": "Name", "field.type": "Type", "field.url": "Catalog / API URL", "field.urlHint": "Optional for npm and GitHub", "source.remove": "Remove", "source.share": "Share", "source.shared": "Copied", "source.enabled": "Enabled", "source.disabled": "Disabled", "source.checking": "Checking", "source.ok": "Healthy", "source.error": "Unavailable", "source.duplicate": "A source with this id already exists.", "source.required": "Name is required.", "source.urlRequired": "This source type requires a catalog URL.",
			"activation.title": "Marketplace ready", "activation.body": "npm discovery is connected by default. Open the marketplace to browse plugins or add more sources.", "activation.open": "Open marketplace", "activation.later": "Later",
			"browse.search": "Search plugins, packages, repositories…", "browse.refresh": "Refresh", "install": "Install", "install.confirm": "Install?", "installing": "Installing…", "installed": "Installed", "install.failed": "Install failed", "install.cancel": "Cancel", "description.more": "…", "description.less": "Less", "browse.empty": "No plugins found", "browse.sort": "Sort", "browse.sort.relevance": "Relevance", "browse.sort.stars": "Stars", "browse.sort.downloads": "Downloads", "browse.sort.name": "Name", "browse.stableOnly": "Stable only", "browse.emptyHint": "Enable a healthy source or try another search.", "browse.loading": "Loading catalogs…", "browse.error": "Catalog request failed", "browse.results": "{count} results", "copy": "Copy command", "copied": "Copied", "copy.failed": "Could not copy", "install.warning": "Review the package and source before running this third-party install command.", "readonly": "Settings are read-only.", "unavailable": "Plugin source settings are unavailable.",
		};
		const zh = {
			nav: "插件市场", kicker: "联合注册表", title: "插件市场", lead: "默认即可浏览 npm，也可连接更多可信来源，并通过 DSH 原生插件管理器安装插件。",
			"tab.sources": "来源", "tab.browse": "浏览", "sources.title": "已连接来源", "sources.add": "添加来源", "sources.empty": "尚未连接插件源", "sources.emptyHint": "添加目录、npm 注册表或 GitHub 来源以开始。",
			"field.name": "名称", "field.type": "类型", "field.url": "目录 / API URL", "field.urlHint": "npm 和 GitHub 可选", "source.remove": "移除", "source.share": "分享", "source.shared": "已复制", "source.enabled": "已启用", "source.disabled": "已禁用", "source.checking": "检查中", "source.ok": "正常", "source.error": "不可用", "source.duplicate": "具有此 ID 的来源已存在。", "source.required": "名称为必填项。", "source.urlRequired": "此来源类型需要目录 URL。",
			"activation.title": "插件市场已就绪", "activation.body": "默认已连接 npm。打开插件市场即可浏览插件或添加更多来源。", "activation.open": "打开插件市场", "activation.later": "稍后",
			"browse.search": "搜索插件、包、仓库…", "browse.refresh": "刷新", "install": "安装", "install.confirm": "确认安装？", "installing": "安装中…", "installed": "已安装", "install.failed": "安装失败", "install.cancel": "取消", "description.more": "…", "description.less": "收起", "browse.empty": "未找到插件", "browse.sort": "排序", "browse.sort.relevance": "相关性", "browse.sort.stars": "星标", "browse.sort.downloads": "下载量", "browse.sort.name": "名称", "browse.stableOnly": "仅稳定版", "browse.emptyHint": "启用健康的来源或尝试其他搜索。", "browse.loading": "正在加载目录…", "browse.error": "目录请求失败", "browse.results": "{count} 个结果", "copy": "复制命令", "copied": "已复制", "copy.failed": "复制失败", "install.warning": "运行此第三方安装命令前，请检查包和来源。", "readonly": "设置为只读。", "unavailable": "插件源设置不可用。", 
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
			return connection.rpc.call(CHANNEL, `${RPC_PREFIX}/${endpoint}`, payload, signal).then((result) => {
				if (!result?.ok) throw new Error(result?.error?.message || "Host request failed");
				return result.value;
			});
		}

		function SearchIcon() {
			return h("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true, children: [h("circle", { cx: 11, cy: 11, r: 7 }), h("path", { d: "m20 20-3.6-3.6" })] });
		}

		function CopyIcon({ done = false }) {
			return done
				? h("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true, children: h("path", { d: "m5 12 4 4L19 6" }) })
				: hs("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true, children: [h("rect", { x: 9, y: 9, width: 10, height: 10, rx: 2 }), h("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })] });
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
				hs("div", { className: "pm-field pm-field-url", children: [h("label", { htmlFor: "pm-url", children: t("field.url") }), h("input", { id: "pm-url", className: "pm-input", type: "url", value: url, placeholder: t("field.urlHint"), onChange: (event) => setUrl(event.target.value), disabled: readOnly || busy })] }),
				h("button", { className: "pm-btn pm-btn-primary pm-add", type: "submit", disabled: readOnly || busy, children: t("sources.add") }),
				error ? h("p", { className: "pm-notice pm-notice-error", role: "alert", children: error }) : null,
			] });
		}

		function ChevronIcon({ open = false }) {
			return h("svg", { className: "pm-chevron", "data-open": open, width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true, children: h("path", { d: "m6 9 6 6 6-6" }) });
		}

		function SourceRow({ source, health, t, busy, readOnly, onToggle, onRemove }) {
			const [open, setOpen] = react.useState(false);
			const [shared, setShared] = react.useState(false);
			const status = source.enabled === false ? "off" : health?.ok === true ? "ok" : health?.ok === false ? "bad" : "wait";
			const statusText = status === "off" ? t("source.disabled") : status === "ok" ? `${t("source.ok")} · ${health.count ?? 0}` : status === "bad" ? `${t("source.error")} · ${health.error ?? ""}` : t("source.checking");
			const share = async () => {
				const payload = JSON.stringify({ id: source.id, name: source.name, type: source.type, ...(source.url ? { url: source.url } : {}), enabled: source.enabled !== false }, null, 2);
				try { await globalThis.navigator?.clipboard?.writeText?.(payload); setShared(true); setTimeout(() => setShared(false), 1400); } catch {}
			};
			return hs("article", { className: "pm-source", children: [
				hs("div", { className: "pm-source-head", children: [
					hs("div", { className: "pm-source-main", children: [
						hs("div", { className: "pm-source-line", children: [h("span", { className: `pm-status pm-status-${status}`, "aria-hidden": true }), h("span", { className: "pm-source-name", children: source.name }), h("span", { className: "pm-type", children: source.type })] }),
						h("div", { className: "pm-health", children: statusText }),
					] }),
					hs("div", { className: "pm-source-buttons", children: [
						hs("label", { className: "pm-check", children: [h("input", { className: "pm-toggle", type: "checkbox", checked: source.enabled !== false, disabled: readOnly || busy, onChange: () => onToggle(source.id) }), h("span", { children: source.enabled !== false ? t("source.enabled") : t("source.disabled") })] }),
						h("button", { type: "button", className: "pm-icon-btn", onClick: () => setOpen((value) => !value), "aria-expanded": open, children: h(ChevronIcon, { open }) }),
					] }),
				] }),
				open ? hs("div", { className: "pm-source-details", children: [
					h("div", { className: "pm-source-meta", title: health?.error || source.url || "", children: source.url || source.id }),
					hs("div", { className: "pm-source-actions", children: [
						h("button", { type: "button", className: "pm-btn pm-share", onClick: share, children: shared ? t("source.shared") : t("source.share") }),
						h("button", { type: "button", className: "pm-btn pm-btn-danger", disabled: readOnly || busy, onClick: () => onRemove(source.id), children: t("source.remove") }),
					] }),
				] }) : null,
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
				sources.length === 0 ? h(Empty, { title: t("sources.empty"), hint: t("sources.emptyHint") }) : h("div", { className: "pm-source-list", children: sources.map((source) => h(SourceRow, { source, health: healthMap[source.id], t, busy, readOnly: !writable, onToggle: (id) => { void mutate(sources.map((row) => row.id === id ? { ...row, enabled: row.enabled === false } : row)); }, onRemove: (id) => { void mutate(sources.filter((row) => row.id !== id)); } }, source.id)) }),
			] });
		}

		function installCommand(plugin) {
			return plugin.install?.spec ? `dsh plugin add ${plugin.install.spec}` : "";
		}

		function compactNumber(value) {
			if (typeof value !== "number" || !Number.isFinite(value)) return "";
			return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
		}

		function releaseChannelLabel(channel) {
			return channel === "stable" ? "stable" : channel || "";
		}

		function npmPackageUrl(packageName) {
			return packageName ? `https://www.npmjs.com/package/${encodeURIComponent(packageName).replace(/%2F/gi, "/")}` : "";
		}

		function ExternalLink({ href, className, children, title }) {
			return h("a", { href, className, title, target: "_blank", rel: "noopener noreferrer", children });
		}

		function PluginCard({ plugin, t }) {
			const [copyState, setCopyState] = react.useState("");
			const [expanded, setExpanded] = react.useState(false);
			const [confirmInstall, setConfirmInstall] = react.useState(false);
			const [installState, setInstallState] = react.useState("idle");
			const [installError, setInstallError] = react.useState("");
			const command = installCommand(plugin);
			const spec = plugin.install?.spec || "";
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
			const install = async () => {
				if (!spec || !remote?.pluginManager) return;
				if (!confirmInstall) { setConfirmInstall(true); return; }
				setInstallState("installing"); setInstallError("");
				try {
					const inspection = await remote.pluginManager.inspect(spec);
					if (!inspection || inspection.status !== "accepted") throw new Error(inspection?.reason || "Plugin spec was rejected");
					const result = await remote.pluginManager.installBundle(spec, { activate: false });
					if (result?.error) throw new Error(result.error.reason || result.error.code || t("install.failed"));
					setInstallState("installed"); setConfirmInstall(false);
				} catch (error) {
					setInstallState("failed"); setInstallError(String(error?.message ?? error)); setConfirmInstall(false);
				}
			};
			const sources = plugin.sources ?? [];
			const primarySource = sources[0];
			const descriptionLong = (plugin.description?.length ?? 0) > 100;
			return hs("article", { className: "pm-card", children: [
				hs("div", { className: "pm-card-head", children: [hs("div", { children: [
					plugin.identity?.package
						? h(ExternalLink, { href: npmPackageUrl(plugin.identity.package), className: "pm-plugin-name pm-link", title: plugin.identity.package, children: plugin.name })
						: plugin.identity?.repository
							? h(ExternalLink, { href: plugin.identity.repository, className: "pm-plugin-name pm-link", title: plugin.identity.repository, children: plugin.name })
							: h("span", { className: "pm-plugin-name", children: plugin.name }),
					plugin.version ? h("span", { className: "pm-version", children: plugin.version }) : null,
					plugin.evidence?.releaseChannel ? h("span", { className: `pm-channel pm-channel-${plugin.evidence.releaseChannel}`, children: releaseChannelLabel(plugin.evidence.releaseChannel) }) : null,
					h("span", { className: "pm-signal", title: "GitHub stars", children: `★ ${compactNumber(plugin.evidence?.stars ?? 0)}` }),
					h("span", { className: "pm-signal", title: "npm downloads in the last 30 days", children: `↓ ${compactNumber(plugin.evidence?.downloads30d ?? 0)} / 30d total` }),
					plugin.evidence?.rating !== undefined ? h("span", { className: "pm-signal", title: plugin.evidence.ratingCount !== undefined ? `${plugin.evidence.ratingCount} ratings` : "Source rating", children: `★ ${plugin.evidence.rating.toFixed(1)}${plugin.evidence.ratingCount !== undefined ? ` (${compactNumber(plugin.evidence.ratingCount)})` : ""}` }) : null
				] })] }),
				plugin.description ? hs("div", { children: [h("p", { className: "pm-desc", "data-clamped": !expanded, children: plugin.description }), descriptionLong ? h("button", { type: "button", className: "pm-more", onClick: () => setExpanded((value) => !value), children: expanded ? t("description.less") : t("description.more") }) : null] }) : null,
				hs("div", { className: "pm-meta", children: [
					primarySource ? h("span", { className: "pm-badge", children: primarySource.name }, primarySource.id) : null,
					...(plugin.tags ?? []).map((tag) => h("span", { className: "pm-tag", children: tag }, tag)),
				] }),
				plugin.identity?.repository ? h(ExternalLink, { href: plugin.identity.repository, className: "pm-source-meta pm-link", title: plugin.identity.repository, children: plugin.identity.repository }) : null,
				command ? hs("div", { children: [
					hs("div", { className: "pm-install", children: [h("code", { className: "pm-command", children: command }), h("button", { type: "button", className: "pm-icon-btn", onClick: copy, title: copyState === "ok" ? t("copied") : t("copy"), "aria-label": copyState === "ok" ? t("copied") : t("copy"), children: h(CopyIcon, { done: copyState === "ok" }) })] }),
					hs("div", { className: "pm-card-actions", children: [
						h("button", { type: "button", className: "pm-btn pm-btn-primary pm-install-button", disabled: installState === "installing" || installState === "installed", onClick: install, children: installState === "installing" ? t("installing") : installState === "installed" ? t("installed") : confirmInstall ? t("install.confirm") : t("install") }),
						confirmInstall ? h("button", { type: "button", className: "pm-btn", onClick: () => setConfirmInstall(false), children: t("install.cancel") }) : null,
						installState === "failed" ? h("span", { className: "pm-install-status", title: installError, children: `${t("install.failed")}: ${installError}` }) : null,
					] }),
					h("span", { role: "status", "aria-live": "polite", style: { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }, children: copyState === "ok" ? t("copied") : copyState === "error" ? t("copy.failed") : "" })
				] }) : null,
			] });
		}

		function BrowseView({ t, state, query, setQuery, refresh }) {
			const [sort, setSort] = react.useState("relevance");
			const [stableOnly, setStableOnly] = react.useState(false);
			const plugins = [...(state.data?.plugins ?? [])]
				.filter((plugin) => !stableOnly || plugin.evidence?.releaseChannel === "stable")
				.sort((a, b) => {
					if (sort === "stars") return (b.evidence?.stars ?? -1) - (a.evidence?.stars ?? -1) || a.name.localeCompare(b.name);
					if (sort === "downloads") return (b.evidence?.downloads30d ?? -1) - (a.evidence?.downloads30d ?? -1) || a.name.localeCompare(b.name);
					if (sort === "name") return a.name.localeCompare(b.name);
					return 0;
				});
			return hs("section", { children: [
				hs("form", { className: "pm-toolbar", onSubmit: (event) => { event.preventDefault(); refresh(); }, children: [
					hs("div", { className: "pm-search", children: [h(SearchIcon, {}), h("input", { id: "pm-search", type: "search", value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("browse.search"), "aria-label": t("browse.search") })] }),
					h("button", { type: "submit", className: "pm-btn", disabled: state.loading, children: t("browse.refresh") }),
				] }),
				state.loading ? h("p", { className: "pm-notice", children: t("browse.loading") }) : null,
				state.error ? h("p", { className: "pm-notice pm-notice-error", role: "alert", children: `${t("browse.error")}: ${state.error}` }) : null,
				!state.loading && !state.error && plugins.length === 0 ? h(Empty, { title: t("browse.empty"), hint: t("browse.emptyHint") }) : null,
				(state.data?.plugins?.length ?? 0) ? hs("div", { children: [
					hs("div", { className: "pm-browse-options", children: [
						h("p", { className: "pm-count", children: t("browse.results", { count: plugins.length }) }),
						hs("div", { className: "pm-source-actions", children: [
							hs("label", { className: "pm-check", children: [h("input", { className: "pm-toggle", type: "checkbox", checked: stableOnly, onChange: (event) => setStableOnly(event.target.checked) }), h("span", { children: t("browse.stableOnly") })] }),
							h("select", { className: "pm-select pm-sort", "aria-label": t("browse.sort"), value: sort, onChange: (event) => setSort(event.target.value), children: [
								h("option", { value: "relevance", children: t("browse.sort.relevance") }),
								h("option", { value: "stars", children: t("browse.sort.stars") }),
								h("option", { value: "downloads", children: t("browse.sort.downloads") }),
								h("option", { value: "name", children: t("browse.sort.name") }),
							] })
						] })
					] }),
					h("p", { className: "pm-notice", children: t("install.warning") }),
					h("div", { className: "pm-results", children: plugins.map((plugin) => h(PluginCard, { plugin, t }, plugin.identity?.package || plugin.identity?.repository || plugin.identity?.fallback)) })
				] }) : null,
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

		function MarketplaceActivation({ onDismiss, onOpenDetails, t }) {
			return h(Modal, {
				open: true,
				title: t("activation.title"),
				closeLabel: t("activation.later"),
				onClose: onDismiss,
				children: hs("div", { style: { display: "grid", gap: 14 }, children: [
					h("p", { style: { margin: 0, color: "var(--dsw-alias-label-secondary)", lineHeight: 1.55 }, children: t("activation.body") }),
					hs("div", { style: { display: "flex", justifyContent: "flex-end", gap: 8 }, children: [
						h(Button, { onClick: onDismiss, children: t("activation.later") }),
						h(Button, { onClick: onOpenDetails, children: t("activation.open") }),
					] }),
				] }),
			});
		}

		const inject = ["slots", "locale", "configForms", "connection", "remote", "remote.pluginManager"];
		function apply(ctx) {
			configForm = ctx.configForms?.get?.(NS);
			connection = ctx.connection;
			remote = ctx.remote;
			ctx.on?.("connection/reset", () => {
				for (const listener of [...connectionResetListeners]) listener();
			});
			ctx.effect(injectStyle, "plugin-sources: styles");
			ctx.effect(() => ctx.locale.register(NS, { en, zh }), "plugin-sources: locale");
			ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({ name: "plugins.bundle.config", key: "@stolyarovmn/dsh-client-ui-plugin-market", locale: NS }, PluginSourcesSection));
			ctx.slots.inject("plugins.bundle.activation", () => ctx.slots.register({ name: "plugins.bundle.activation", key: "@stolyarovmn/dsh-client-ui-plugin-market", locale: NS }, MarketplaceActivation));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
