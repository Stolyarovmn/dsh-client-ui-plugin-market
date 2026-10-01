window.__ModuleLoader__.load({
	id: "@stolyarovmn/dsh-ui-registry-aggregator",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");
		const { createRoot } = require("react-dom/client");
		const jsxRuntime = require("react/jsx-runtime");
		const {
			Button, Input, Tag, Pill, SegmentedTabs, Tooltip, Modal, Switch, Menu, StateDot, LinkIconRegular, writeClipboard,
			IconPlusOutlineRegular, IconRefreshOutlineRegular, IconChevronDownOutlineRegular,
			IconCopyOutlineRegular, IconShareOutlineRegular, IconTrashOutlineRegular,
			IconDatabaseOutlineRegular, IconCordisPluginOutlineRegular, IconLinkOutlineRegular,
			IconWarningOutlineRegular, IconSearchOutlineRegular, IconClockOutlineRegular,
			IconDownloadOutlineRegular, IconCheckOutlineRegular, IconCloseOutlineRegular, IconChevronUpOutlineRegular,
			IconChevronLeftOutlineRegular, IconChevronRightOutlineRegular, IconChevronsUpDownOutlineRegular,
			IconFlatListOutlineRegular, IconShieldOutlineRegular, IconChecklistOutlineRegular, IconCodeOutlineRegular,
		} = require("@deepseek-ai/dsh-client-ui-primitives");
		const h = jsxRuntime.jsx;
		const hs = jsxRuntime.jsxs;

		const NS = "registry-aggregator";
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
.pm-results{display:grid;gap:9px}.pm-card{position:relative;padding:13px 14px;border:1px solid var(--pm-line);border-radius:9px;background:var(--pm-panel)}.pm-card:hover{border-color:var(--dsw-alias-border-l3)}.pm-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.pm-plugin-name{font-size:14px;font-weight:650;line-height:20px}.pm-link{color:inherit;text-decoration:none}.pm-link:hover{text-decoration:underline}.pm-version{margin-left:7px;color:var(--pm-muted);font:10px ui-monospace,SFMono-Regular,Consolas,monospace}.pm-signal{display:inline-flex;align-items:center;gap:3px;margin-left:7px;color:var(--pm-muted);font:500 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace}.pm-channel{display:inline-flex;align-items:center;height:18px;margin-left:7px;padding:0 6px;border:1px solid var(--pm-line);border-radius:99px;color:var(--dsw-alias-label-secondary);font:600 9px/1 ui-monospace,SFMono-Regular,Consolas,monospace;text-transform:uppercase}.pm-channel-stable{color:#30a46c}.pm-channel-alpha,.pm-channel-beta,.pm-channel-rc,.pm-channel-prerelease{color:#e5a000}.pm-compat{border:1px solid var(--pm-line);border-radius:99px;padding:3px 6px;color:var(--dsw-alias-label-secondary);font:500 9px/1 ui-monospace,SFMono-Regular,Consolas,monospace;background:transparent}.pm-compat-button{cursor:pointer}.pm-compat-button[data-status=compatible]{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#30a46c) 45%,var(--pm-line));color:var(--dsw-alias-state-success-primary,#30a46c)}.pm-compat-button[data-status=incompatible],.pm-compat-button[data-status=invalid]{border-color:color-mix(in srgb,var(--dsw-alias-state-error,#d44) 45%,var(--pm-line));color:var(--dsw-alias-state-error,#d44)}.pm-compat-button[data-status=undeclared]{color:var(--dsw-alias-label-tertiary)}.pm-compat-button:hover{border-color:var(--dsw-alias-border-l3);color:var(--dsw-alias-label-primary)}.pm-deprecated{color:var(--dsw-alias-state-error,#d44)}.pm-desc{margin:5px 0 3px;color:var(--dsw-alias-label-secondary);line-height:18px}.pm-desc[data-clamped=true]{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pm-more{border:0;background:transparent;padding:0;color:var(--pm-accent);font:500 11px/16px inherit;cursor:pointer}.pm-card-actions{display:flex;align-items:center;gap:7px;margin-top:10px}.pm-install-button{min-width:76px}.pm-install-status{font-size:11px;color:var(--pm-muted)}.pm-meta{display:flex;flex-wrap:wrap;gap:6px}.pm-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.pm-install{display:flex;gap:7px;align-items:center;margin-top:10px}.pm-command{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:7px 9px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:11px ui-monospace,SFMono-Regular,Consolas,monospace}.pm-icon-btn{width:32px;min-width:32px;height:32px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--pm-line);border-radius:7px;background:var(--pm-panel);color:var(--dsw-alias-label-secondary);cursor:pointer}.pm-icon-btn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}.pm-icon-btn svg{display:block}
.pm-browse-options{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;flex-wrap:wrap}.pm-filter-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.pm-filter-select{width:auto;min-width:116px;height:30px}.pm-sort{width:auto;min-width:130px;height:30px}.pm-page-size{width:auto;min-width:76px;height:30px}.pm-pagination{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}.pm-page-controls{display:flex;align-items:center;gap:7px}.pm-page-label{color:var(--pm-muted);font-size:11px}.pm-empty{padding:44px 20px;text-align:center;border:1px dashed var(--pm-line);border-radius:10px;color:var(--pm-muted)}.pm-empty strong{display:block;margin-bottom:5px;color:var(--dsw-alias-label-secondary)}.pm-spin{animation:pm-spin .8s linear infinite}@keyframes pm-spin{to{transform:rotate(360deg)}}@media(max-width:720px){.pm-shell{padding:8px 0 28px}.pm-source-list{grid-template-columns:1fr}.pm-form{grid-template-columns:1fr}.pm-field-url,.pm-add,.pm-options{grid-column:1}.pm-add{justify-self:stretch;width:100%}.pm-source{grid-template-columns:1fr}.pm-source-actions{justify-content:flex-start}.pm-card-head{display:block}.pm-card-head>.pm-btn{margin-top:8px}}

/* Registry Aggregator source layout */
.pm-root{--pm-blue:#5792ff;--pm-green:#2dcc74;--pm-danger:#ff5f66;background:radial-gradient(900px 420px at 50% -180px,color-mix(in srgb,var(--pm-blue) 10%,transparent),transparent 72%),var(--dsw-specific-page,transparent)}
.pm-shell{max-width:1200px;padding:18px 0 34px}
.pm-root-embedded{height:auto;overflow:visible;background:transparent}.pm-root-embedded .pm-shell{max-width:none;padding:0}.pm-root-embedded .pm-title,.pm-root-embedded .pm-kicker,.pm-root-embedded .pm-lead,.pm-root-embedded .pm-tabs{display:none}.pm-updates-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.pm-updates-title{font-size:15px;font-weight:700}.pm-updates-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:0}.pm-updates-count{font:500 11px/1 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--pm-muted)}.pm-update-button-content{display:inline-flex;align-items:center;gap:6px}.pm-updates-progress{font:500 11px/1 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--pm-muted);white-space:nowrap}.pm-update-all{color:var(--dsw-alias-brand-primary)}.pm-update-all-error{margin:0 0 10px}.pm-native-section{margin-top:28px;padding-top:22px;border-top:1px solid var(--pm-line)}.pm-native-section-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:12px}.pm-native-section-title{font-size:15px;font-weight:700}.pm-native-section-tabs{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.pm-native-section-tab{height:32px;padding:0 11px;border:1px solid var(--pm-line);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer}.pm-native-section-tab:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}.pm-native-section-tab[data-active=true]{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3)}.pm-native-section-badge{margin-left:6px;color:var(--pm-green);font:600 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace}.pm-native-section-body{min-width:0}.pm-installed-registry-host{display:block;position:relative;z-index:2;pointer-events:auto}.pm-installed-registry-addon{display:block;position:relative;z-index:2;pointer-events:auto}.pm-installed-registry-tools{display:flex;align-items:center;justify-content:flex-end;gap:7px;margin:5px 0 0;padding-left:80px}.pm-installed-update-actions{display:inline-flex;align-items:center;gap:5px}.pm-installed-update-badge{display:inline-flex;align-items:center;height:24px;padding:0 8px;border:1px solid color-mix(in srgb,#e5a000 55%,var(--pm-line));border-radius:99px;color:#e5a000;background:color-mix(in srgb,#e5a000 8%,transparent);font:600 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace;cursor:pointer}.pm-installed-update-badge:hover:not(:disabled){background:color-mix(in srgb,#e5a000 14%,transparent);border-color:#e5a000}.pm-installed-update-badge:disabled{cursor:default;opacity:.75}.pm-installed-update-badge[data-state=failed]{color:var(--pm-danger);border-color:color-mix(in srgb,var(--pm-danger) 55%,var(--pm-line));background:color-mix(in srgb,var(--pm-danger) 8%,transparent)}.pm-installed-update-badge[data-state=done]{color:var(--pm-green);border-color:color-mix(in srgb,var(--pm-green) 55%,var(--pm-line));background:color-mix(in srgb,var(--pm-green) 8%,transparent)}.pm-installed-update-content{display:inline-flex;align-items:center;gap:5px}.pm-installed-update-cancel{display:inline-grid;place-items:center;width:24px;height:24px;padding:0;border:1px solid color-mix(in srgb,var(--pm-danger) 45%,var(--pm-line));border-radius:7px;background:transparent;color:var(--pm-danger);cursor:pointer}.pm-installed-update-cancel:hover{background:color-mix(in srgb,var(--pm-danger) 9%,transparent);border-color:var(--pm-danger)}.pm-installed-loading{display:inline-flex;align-items:center;gap:5px;color:var(--pm-muted);font:500 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace}.pm-installed-expand{position:relative;z-index:3;width:27px;height:27px;display:inline-grid;place-items:center;padding:0;border:1px solid var(--pm-line);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;pointer-events:auto}.pm-installed-expand:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}.pm-installed-expand svg{transition:transform .16s ease}.pm-installed-expand[data-open=true] svg{transform:rotate(180deg)}.pm-installed-expanded{margin:8px 0 3px 80px;padding:0;color:var(--dsw-alias-label-secondary)}.pm-installed-expanded>.pm-card{margin:0}.pm-installed-expanded-empty{padding:5px 0 10px;color:var(--pm-muted);font-size:11px}.pm-installed-debug{margin-top:9px;padding:8px 10px;border:1px dashed var(--pm-line);border-radius:7px;background:color-mix(in srgb,var(--dsw-alias-bg-secondary) 35%,transparent);font:10px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--pm-muted);white-space:pre-wrap;word-break:break-word}@media(max-width:720px){.pm-installed-registry-tools{padding-left:0}.pm-installed-expanded{margin-left:0}}

.pm-kicker{margin-bottom:5px;color:#6da6ff;font-size:10px;letter-spacing:.18em}
.pm-title{font-size:30px;line-height:38px;font-weight:720;letter-spacing:-.025em}
.pm-lead{max-width:900px;margin:5px 0 20px;font-size:14px;line-height:21px;color:var(--dsw-alias-label-secondary)}
.pm-tabs{gap:0;padding:3px;margin-bottom:18px;border-radius:11px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 86%,transparent)}
.pm-tab{height:38px;min-width:112px;padding:0 17px;border:1px solid transparent;border-radius:8px;font-size:13px}
.pm-tab[data-active=true]{border-color:color-mix(in srgb,var(--pm-blue) 75%,transparent);background:color-mix(in srgb,var(--pm-blue) 14%,var(--pm-panel));color:#87b3ff;box-shadow:none}
.pm-tab-content{display:inline-flex;align-items:center;justify-content:center;gap:9px}
.pm-tab-content svg{width:17px;height:17px}

.pm-sources-view{display:grid;gap:16px}
.pm-add-source-panel,.pm-connected-panel{overflow:hidden;border:1px solid color-mix(in srgb,var(--pm-line) 92%,#6f8ec8 8%);border-radius:13px;background:linear-gradient(180deg,color-mix(in srgb,var(--pm-panel) 96%,#14233c 4%),var(--pm-panel))}
.pm-section-head{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 20px}
.pm-section-head-main{display:flex;align-items:center;gap:14px;min-width:0}
.pm-section-icon{width:44px;height:44px;flex:0 0 44px;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--pm-blue) 55%,transparent);border-radius:50%;color:#72a8ff;background:color-mix(in srgb,var(--pm-blue) 13%,transparent)}
.pm-section-icon svg{width:22px;height:22px}
.pm-section-title{font-size:15px;line-height:20px;font-weight:700;color:var(--dsw-alias-label-primary)}
.pm-section-lead{margin-top:3px;color:var(--pm-muted);font-size:12px;line-height:17px}
.pm-disclosure,.pm-refresh-icon{width:34px;height:34px;display:inline-grid;place-items:center;flex:0 0 34px;border:1px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.pm-refresh-icon{border-color:var(--pm-line);background:color-mix(in srgb,var(--pm-panel) 92%,transparent)}
.pm-disclosure:hover,.pm-refresh-icon:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}
.pm-disclosure svg,.pm-refresh-icon svg{width:17px;height:17px}

.pm-form.pm-form-redesign{display:grid;grid-template-columns:minmax(190px,1.05fr) minmax(155px,.65fr) minmax(250px,1.15fr) auto;gap:12px 16px;align-items:end;padding:16px 20px 18px;border-top:1px solid var(--pm-line);border-bottom:0}
.pm-form-redesign .pm-field-url{grid-column:auto}
.pm-form-redesign .pm-field label{margin-bottom:6px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.pm-required{color:var(--pm-danger);margin-left:3px}
.pm-form-redesign .pm-input,.pm-form-redesign .pm-select{height:38px;border-radius:8px;background:color-mix(in srgb,var(--pm-panel) 92%,#000 8%)}
.pm-input-wrap{position:relative}
.pm-input-wrap .pm-input{padding-left:34px}
.pm-input-leading{position:absolute;left:10px;top:50%;transform:translateY(-50%);display:grid;place-items:center;color:var(--dsw-alias-label-secondary);pointer-events:none}
.pm-input-leading svg{width:15px;height:15px}
.pm-form-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px}
.pm-form-actions .pm-btn{height:38px;border-radius:8px}
.pm-form-error{grid-column:1 / span 2;justify-self:start;display:inline-flex;align-items:center;gap:8px;margin:0;padding:8px 11px;border:1px solid color-mix(in srgb,var(--pm-danger) 55%,transparent);border-radius:8px;background:color-mix(in srgb,var(--pm-danger) 9%,var(--pm-panel));color:var(--pm-danger);font-size:11px;font-weight:600;box-shadow:0 0 16px color-mix(in srgb,var(--pm-danger) 7%,transparent)}
.pm-form-error svg{width:14px;height:14px}
.pm-btn-secondary{background:transparent}

.pm-connected-head{border-bottom:1px solid var(--pm-line)}
.pm-source-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:14px 20px 18px}
.pm-source{gap:0;padding:0;overflow:hidden;border:1px solid color-mix(in srgb,var(--pm-line) 88%,#708bc2 12%);border-radius:12px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-2) 92%,#0b1627 8%)}
.pm-source-head{align-items:center;padding:14px 15px;gap:14px}
.pm-source-main{display:flex;align-items:center;gap:11px;min-width:0}
.pm-source-logo{width:42px;height:42px;flex:0 0 42px;display:grid;place-items:center;overflow:hidden;border-radius:9px;border:1px solid var(--pm-line);font-weight:800}
.pm-source-logo-npm{border-color:#d3414b;background:#cf3541;color:#fff;font:800 12px/1 ui-monospace,SFMono-Regular,Consolas,monospace}
.pm-source-logo-github{background:#11151c;color:#fff}
.pm-source-logo-generic{background:color-mix(in srgb,var(--pm-blue) 9%,var(--pm-panel));color:#9fbcf4}
.pm-source-logo svg{width:24px;height:24px}
.pm-source-summary{min-width:0;flex:1}
.pm-source-line{gap:8px}
.pm-source-name{font-size:14px;font-weight:700}
.pm-type{height:21px;padding:0 8px;font-size:10px}
.pm-source-evidence{display:flex;align-items:center;gap:10px;margin-top:6px;color:var(--pm-muted);font-size:11px;white-space:nowrap}
.pm-source-evidence-item{display:inline-flex;align-items:center;gap:6px;min-width:0}
.pm-source-evidence svg{width:14px;height:14px}
.pm-evidence-separator{width:1px;height:16px;background:var(--pm-line)}
.pm-status{width:8px;height:8px;box-shadow:0 0 0 3px color-mix(in srgb,currentColor 10%,transparent)}
.pm-source-buttons{gap:9px;flex:0 0 auto}
.pm-source-switch{display:inline-flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:11px;cursor:pointer}
.pm-source-switch input{position:absolute;opacity:0;pointer-events:none}
.pm-switch-track{position:relative;width:38px;height:21px;border-radius:99px;background:#5d6675;transition:background .16s ease}
.pm-switch-track::after{content:"";position:absolute;top:3px;left:3px;width:15px;height:15px;border-radius:50%;background:#f8fbff;transition:transform .16s ease}
.pm-source-switch input:checked + .pm-switch-track{background:var(--pm-green)}
.pm-source-switch input:checked + .pm-switch-track::after{transform:translateX(17px)}
.pm-source-switch input:disabled + .pm-switch-track{opacity:.55}
.pm-source-disclosure{width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.pm-source-disclosure:hover{color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--pm-panel) 80%,transparent)}
.pm-source-details{padding:0 15px 14px;border-top:1px solid var(--pm-line)}
.pm-source-url-label{margin:11px 0 6px;color:var(--dsw-alias-label-secondary);font-size:11px}
.pm-source-url-wrap{position:relative}
.pm-source-url{height:35px;width:100%;box-sizing:border-box;padding:0 37px 0 10px;border:1px solid var(--pm-line);border-radius:7px;outline:none;background:color-mix(in srgb,var(--pm-panel) 86%,#000 14%);color:var(--dsw-alias-label-secondary);font:11px ui-monospace,SFMono-Regular,Consolas,monospace}
.pm-copy-url{position:absolute;right:4px;top:50%;transform:translateY(-50%);width:28px;height:28px;display:grid;place-items:center;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.pm-copy-url:hover{color:var(--dsw-alias-label-primary);background:color-mix(in srgb,var(--pm-panel) 80%,transparent)}
.pm-source-actions{margin-top:10px;gap:8px}
.pm-source-action{width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--pm-line);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.pm-source-action:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}
.pm-source-action-danger{color:var(--pm-danger);border-color:color-mix(in srgb,var(--pm-danger) 30%,var(--pm-line))}
.pm-source-action svg,.pm-copy-url svg{width:15px;height:15px}
.pm-source-error{margin-top:8px;color:var(--pm-danger);font-size:10px;white-space:normal}
.pm-connected-notice{margin:0 20px 12px;border-radius:8px;border:1px solid var(--pm-line)}

@media(max-width:900px){.pm-form.pm-form-redesign{grid-template-columns:1fr 1fr}.pm-form-redesign .pm-field-url{grid-column:1/-1}.pm-form-actions{grid-column:1/-1}.pm-form-error{grid-column:1/-1}.pm-source-list{grid-template-columns:1fr}}
@media(max-width:620px){.pm-shell{padding-top:10px}.pm-title{font-size:24px;line-height:30px}.pm-form.pm-form-redesign{grid-template-columns:1fr;padding:14px}.pm-form-redesign .pm-field-url,.pm-form-actions,.pm-form-error{grid-column:1}.pm-form-actions{justify-content:stretch}.pm-form-actions .pm-btn{flex:1}.pm-section-head{padding:15px}.pm-source-list{padding:12px}.pm-source-head{align-items:flex-start}.pm-source-buttons{flex-direction:column;align-items:flex-end}}
/* Reference UI alignment */
.pm-shell{max-width:1430px;padding:22px 0 34px}
.pm-title{font-size:31px;line-height:39px}
.pm-lead{max-width:1080px;font-size:14px;line-height:21px;margin-bottom:22px}
.pm-tabs{margin-bottom:18px;border-radius:12px}
.pm-tab{height:46px;min-width:168px;padding:0 22px;border-radius:9px;font-size:13px}
.pm-tab-content{gap:11px}
.pm-tab-content svg{width:19px;height:19px}
.pm-add-source-panel,.pm-connected-panel{border-radius:13px}
.pm-section-head{padding:22px 24px}
.pm-section-head-main{gap:16px}
.pm-section-icon{width:46px;height:46px;flex-basis:46px}
.pm-section-icon svg{width:24px;height:24px}
.pm-section-title{font-size:16px;line-height:22px}
.pm-section-lead{font-size:12px;line-height:18px}
.pm-disclosure{width:38px;height:38px}
.pm-refresh-icon{width:40px;height:40px;flex-basis:40px;border-radius:9px}
.pm-disclosure svg,.pm-refresh-icon svg{width:19px;height:19px}
.pm-form.pm-form-redesign{grid-template-columns:minmax(260px,1.25fr) minmax(190px,.75fr) minmax(330px,1.35fr);gap:12px 22px;align-items:end;padding:18px 24px 20px}
.pm-form-redesign .pm-field-url{grid-column:3}
.pm-form-redesign .pm-input,.pm-form-redesign .pm-select{height:42px;border-radius:9px}
.pm-form-redesign .pm-field label{margin-bottom:7px;font-size:11px}
.pm-form-actions{grid-column:3;grid-row:2;justify-self:end;gap:12px}
.pm-form-actions .pm-btn{height:40px;border-radius:9px;padding:0 18px;font-size:12px}
.pm-form-actions .pm-btn-primary{padding-left:20px;padding-right:20px}
.pm-form-error{grid-column:1;grid-row:2;padding:9px 12px;border-radius:9px}
.pm-source-list{gap:18px;padding:16px 22px 20px}
.pm-source{border-radius:12px}
.pm-source-head{padding:16px 18px}
.pm-source-main{gap:13px}
.pm-source-logo{width:46px;height:46px;flex-basis:46px;border-radius:10px}
.pm-source-logo svg{width:27px;height:27px}
.pm-source-name{font-size:15px}
.pm-source-evidence{margin-top:7px;font-size:11px}
.pm-source-buttons{gap:11px}
.pm-source-disclosure{width:34px;height:34px}
.pm-source-disclosure svg{width:17px;height:17px}
.pm-source-details{padding:0 18px 16px}
.pm-source-url-label{margin:13px 0 7px}
.pm-source-url{height:39px;border-radius:8px;padding-right:43px}
.pm-copy-url{width:32px;height:32px;right:4px}
.pm-source-actions{margin-top:13px;gap:12px}
.pm-source-action{width:46px;height:40px;border-radius:9px}
.pm-source-action svg,.pm-copy-url svg{width:18px;height:18px}
.pm-source-logo-npm{background:#d83243;border-color:#df4453;color:#fff}
.pm-source-logo-github{background:#121821;border-color:#384355}
.pm-source-logo-generic{background:color-mix(in srgb,var(--pm-blue) 13%,var(--pm-panel));border-color:color-mix(in srgb,var(--pm-blue) 38%,var(--pm-line))}
@media(max-width:1100px){.pm-form.pm-form-redesign{grid-template-columns:1fr 220px}.pm-form-redesign .pm-field-url{grid-column:1/-1}.pm-form-actions{grid-column:1/-1;grid-row:auto}.pm-form-error{grid-column:1/-1;grid-row:auto}}
@media(max-width:720px){.pm-shell{padding:12px 0 28px}.pm-tab{min-width:138px}.pm-form.pm-form-redesign{grid-template-columns:1fr;padding:14px}.pm-form-redesign .pm-field-url,.pm-form-actions,.pm-form-error{grid-column:1}.pm-form-actions{justify-self:stretch}.pm-form-actions .pm-btn{flex:1}}

/* Native DSH 0.1.7 geometry */
.pm-shell{max-width:960px;padding:12px 0 28px}
.pm-root{font-size:13px;background:var(--dsw-specific-page,transparent)}
.pm-title{font-size:20px;line-height:28px;font-weight:500;letter-spacing:0}
.pm-lead{max-width:760px;margin:4px 0 20px;font-size:13px;line-height:20px}
.pm-kicker{font-size:10px;line-height:14px;margin-bottom:4px}

.pm-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:300px;padding:4px;gap:0;border:0;border-radius:12px;background:var(--dsw-alias-bg-module-platform);margin-bottom:24px}
.pm-tab{height:34px;min-width:0;padding:0 12px;border:0;border-radius:8px;font-size:14px;line-height:20px;font-weight:400;color:var(--dsw-alias-label-secondary)}
.pm-tab[data-active=true]{border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font-weight:600;box-shadow:none}
.pm-tab-content{gap:6px}
.pm-tab-content svg{width:16px;height:16px}

.pm-sources-view{gap:20px}
.pm-add-source-panel,.pm-connected-panel{border:.5px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.pm-section-head{padding:12px 14px;gap:12px}
.pm-section-head-main{gap:12px}
.pm-section-icon{width:40px;height:40px;flex:0 0 40px;border:.5px solid var(--dsw-alias-border-l3);border-radius:10px;background:transparent;color:var(--dsw-alias-label-secondary)}
.pm-section-icon svg{width:18px;height:18px}
.pm-section-title{font-size:14px;line-height:20px;font-weight:500}
.pm-section-lead{margin-top:2px;font-size:13px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.pm-disclosure,.pm-refresh-icon,.pm-source-disclosure,.pm-source-action,.pm-copy-url{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:28px;background:transparent;color:var(--dsw-alias-label-caption);cursor:pointer}
.pm-disclosure:hover:not(:disabled),.pm-refresh-icon:hover:not(:disabled),.pm-source-disclosure:hover:not(:disabled),.pm-source-action:hover:not(:disabled),.pm-copy-url:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.pm-refresh-icon{flex:0 0 28px}
.pm-disclosure svg,.pm-refresh-icon svg,.pm-source-disclosure svg,.pm-source-action svg,.pm-copy-url svg{width:16px;height:16px;display:block}
.pm-disclosure[aria-expanded=true] .pm-chevron,.pm-source-disclosure[aria-expanded=true] .pm-chevron{transform:rotate(180deg)}
.pm-chevron{transition:transform 160ms ease}

.pm-form.pm-form-redesign{grid-template-columns:minmax(0,1fr) 190px minmax(0,1.15fr);gap:12px 16px;padding:14px;border-top:.5px solid var(--dsw-alias-border-l2)}
.pm-form-redesign .pm-field-url{grid-column:3}
.pm-form-redesign .pm-field label{margin-bottom:6px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.pm-form-redesign .pm-input,.pm-form-redesign .pm-select{height:32px;padding:0 8px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-1);font-size:14px;line-height:22px}
.pm-form-redesign .pm-input:focus,.pm-form-redesign .pm-select:focus{border-color:var(--dsw-alias-brand-primary);box-shadow:none}
.pm-input-wrap .pm-input{padding-left:30px}
.pm-input-leading{left:8px;color:var(--dsw-alias-label-tertiary)}
.pm-input-leading svg{width:16px;height:16px}
.pm-form-actions{grid-column:3;grid-row:2;justify-self:end;gap:8px}
.pm-form-error{grid-column:1 / span 2;grid-row:2;margin:0;padding:6px 10px;border:0;border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);font-size:12px;line-height:18px;font-weight:400;color:var(--dsw-alias-state-error-primary);box-shadow:none}

.pm-connected-head{border-bottom:.5px solid var(--dsw-alias-border-l2)}
.pm-source-list{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:8px 14px 14px}
.pm-source{border:.5px solid var(--dsw-alias-border-l3);border-radius:12px;background:transparent}
.pm-source-head{padding:8px;gap:14px}
.pm-source-main{gap:14px}
.pm-source-logo{width:48px;height:48px;flex:0 0 48px;border:.5px solid var(--dsw-alias-border-l3);border-radius:10px;background:transparent}
.pm-source-logo-npm{background:transparent;border-color:var(--dsw-alias-border-l3);color:#cb3837}
.pm-source-logo-npm svg{width:30px;height:30px}
.pm-source-logo-github{background:transparent;color:var(--dsw-alias-label-primary)}
.pm-source-logo-github svg{width:28px;height:28px}
.pm-source-logo-generic{background:transparent;color:var(--dsw-alias-label-secondary)}
.pm-source-name{font-size:14px;line-height:20px;font-weight:500}
.pm-type{height:auto;padding:1px 8px;border:.5px solid var(--dsw-alias-border-l4);font-size:11px;line-height:17px;font-weight:500;color:var(--dsw-alias-label-tertiary)}
.pm-source-evidence{gap:8px;margin-top:4px;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.pm-source-evidence svg{width:14px;height:14px}
.pm-evidence-separator{height:16px;background:var(--dsw-alias-border-l2)}
.pm-source-buttons{gap:8px}
.pm-source-switch{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.pm-source-details{padding:10px 8px 12px;border-top:.5px solid var(--dsw-alias-border-l2)}
.pm-source-url-label{margin:0 0 6px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.pm-source-url{height:32px;padding:0 34px 0 8px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-1);font-size:12px;line-height:18px}
.pm-copy-url{right:2px}
.pm-source-actions{margin-top:8px;gap:4px}
.pm-source-action-danger{color:var(--dsw-alias-state-error-primary)}
.pm-source-error{margin-top:6px;font-size:12px;line-height:18px;color:var(--dsw-alias-state-error-primary)}

@media(max-width:900px){.pm-form.pm-form-redesign{grid-template-columns:1fr 180px}.pm-form-redesign .pm-field-url{grid-column:1/-1}.pm-form-actions{grid-column:1/-1;grid-row:auto}.pm-form-error{grid-column:1/-1;grid-row:auto}.pm-source-list{grid-template-columns:1fr}}
@media(max-width:620px){.pm-shell{padding-top:8px}.pm-tabs{width:100%}.pm-form.pm-form-redesign{grid-template-columns:1fr}.pm-form-redesign .pm-field-url,.pm-form-actions,.pm-form-error{grid-column:1}.pm-form-actions{justify-self:stretch}.pm-section-head{padding:10px 8px}.pm-source-list{padding:8px}}


.pm-section-head-main{gap:0}
.pm-section-icon{display:none}
.pm-source-line{gap:0}
.pm-source-evidence-item>svg{flex:0 0 14px;width:14px;height:14px}


/* Native Browse alignment */
.pm-browse-view{display:grid;gap:12px}
.pm-browse-toolbar{display:flex;align-items:center;gap:8px;margin:0}
.pm-browse-toolbar .pm-search{flex:1}
.pm-browse-toolbar .pm-search input{height:32px;padding:0 10px 0 32px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-1);font-size:14px;line-height:22px}
.pm-browse-toolbar .pm-search svg{left:10px;top:8px;width:16px;height:16px}
.pm-browse-refresh{flex:0 0 28px}
.pm-browse-state{border:.5px solid var(--dsw-alias-border-l3);border-radius:10px;padding:8px 10px;background:transparent;font-size:12px;line-height:18px}
.pm-browse-content{display:grid;gap:10px}
.pm-browse-options{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0;flex-wrap:wrap}
.pm-count{margin:0;color:var(--dsw-alias-label-tertiary);font:500 11px/18px ui-monospace,SFMono-Regular,Consolas,monospace}
.pm-filter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pm-stable-filter{display:inline-flex;align-items:center;gap:7px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.pm-filter-select,.pm-sort,.pm-page-size{height:32px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-1);font-size:13px;line-height:20px;padding:0 28px 0 8px}
.pm-filter-select{min-width:120px}
.pm-sort{min-width:155px}
.pm-page-size{min-width:72px}
.pm-results{display:grid;gap:8px}
.pm-card{position:relative;padding:12px 14px;border:.5px solid var(--dsw-alias-border-l3);border-radius:12px;background:transparent}
.pm-card:hover{border-color:var(--dsw-alias-border-l4)}
.pm-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
.pm-card-main{min-width:0}
.pm-card-titleline{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.pm-plugin-name{font-size:14px;line-height:20px;font-weight:500}
.pm-version{margin:0;color:var(--dsw-alias-label-tertiary);font:500 10px/18px ui-monospace,SFMono-Regular,Consolas,monospace}
.pm-channel{height:18px;margin:0;padding:0 7px;border:.5px solid var(--dsw-alias-border-l4);border-radius:99px;font:600 9px/18px ui-monospace,SFMono-Regular,Consolas,monospace}
.pm-card-stats{display:flex;align-items:center;gap:10px;margin-top:3px;flex-wrap:wrap}
.pm-signal{display:inline-flex;align-items:center;gap:4px;margin:0;color:var(--dsw-alias-label-tertiary);font:500 10px/16px ui-monospace,SFMono-Regular,Consolas,monospace}
.pm-signal svg{width:13px;height:13px}
.pm-card-description{margin-top:7px}
.pm-desc{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:18px}
.pm-more{margin-top:1px;font:500 11px/16px inherit;color:var(--dsw-alias-brand-primary)}
.pm-card-meta{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-top:7px}
.pm-badge,.pm-tag,.pm-compat{height:18px;padding:0 6px;border:.5px solid var(--dsw-alias-border-l4);border-radius:99px;font:500 10px/17px ui-monospace,SFMono-Regular,Consolas,monospace}
.pm-repo-link{display:block;max-width:100%;margin-top:6px;color:var(--dsw-alias-label-tertiary);font:11px/17px ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pm-install-row{display:grid;grid-template-columns:minmax(0,1fr) 28px auto auto;gap:8px;align-items:center;margin-top:9px}
.pm-command{height:32px;box-sizing:border-box;display:flex;align-items:center;padding:0 9px;border-radius:8px;background:var(--dsw-alias-bg-layer-2);font:11px/18px ui-monospace,SFMono-Regular,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pm-install-row .pm-icon-btn{width:28px;min-width:28px;height:28px;border:0;border-radius:28px;background:transparent}
.pm-install-row .pm-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover);border:0}
.pm-install-status{margin-top:6px;font-size:11px;line-height:17px;color:var(--dsw-alias-state-error-primary)}
.pm-pagination{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:2px}
.pm-page-label{font-size:11px;line-height:18px;color:var(--dsw-alias-label-tertiary)}
.pm-page-controls{display:flex;align-items:center;gap:8px}

@media(max-width:820px){
  .pm-browse-options{align-items:flex-start}
  .pm-filter-row{width:100%}
  .pm-filter-select,.pm-sort{flex:1 1 150px}
  .pm-page-size{flex:0 0 72px}
  .pm-install-row{grid-template-columns:minmax(0,1fr) 28px}
  .pm-install-row>button:not(.pm-icon-btn){grid-column:auto}
}


/* Registry Aggregator Browse v2 */
.pm-browse-topline,.pm-browse-bottomline{display:flex;align-items:center;justify-content:space-between;gap:12px}
.pm-browse-bottomline{justify-content:flex-end;margin-top:2px}
.pm-browse-options{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.pm-filter-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.pm-sort-row{display:inline-flex;align-items:center;gap:4px;padding:3px;border:.5px solid var(--dsw-alias-border-l3);border-radius:9px;background:var(--dsw-alias-bg-module-platform)}
.pm-sort-criterion{position:relative;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:42px;height:28px;padding:0 8px;border:.5px solid transparent;border-radius:7px;background:transparent;color:var(--dsw-alias-label-tertiary);font:600 12px/1 inherit;cursor:pointer}
.pm-sort-criterion:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.pm-sort-criterion[data-active=true]{border-color:var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary)}
.pm-sort-symbol{display:inline-flex;align-items:center;justify-content:center;min-width:14px;height:14px}
.pm-sort-symbol svg,.pm-sort-direction svg{display:block;width:13px;height:13px}
.pm-sort-direction{display:inline-flex;align-items:center;justify-content:center;color:var(--dsw-alias-label-caption)}
.pm-sort-criterion[data-active=true] .pm-sort-direction{color:var(--dsw-alias-brand-primary)}
.pm-sort-priority{position:absolute;top:-5px;right:-4px;display:flex;align-items:center;justify-content:center;width:13px;height:13px;border-radius:99px;background:var(--dsw-alias-brand-primary);color:#fff;font:700 8px/13px ui-monospace,SFMono-Regular,Consolas,monospace}

.pm-pagination{display:flex;align-items:center;gap:8px;margin:0}
.pm-page-controls{display:flex;align-items:center;gap:2px}
.pm-page-button{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;padding:0 6px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font:500 11px/1 ui-monospace,SFMono-Regular,Consolas,monospace;cursor:pointer}
.pm-page-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.pm-page-button[data-current=true]{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font-weight:700}
.pm-page-button:disabled{opacity:.35;cursor:default}
.pm-page-ellipsis{display:inline-flex;align-items:center;justify-content:center;width:20px;color:var(--dsw-alias-label-caption);font:500 11px/1 ui-monospace,SFMono-Regular,Consolas,monospace}
.pm-page-size-control{display:inline-flex;align-items:center;gap:3px;height:28px;padding:0 5px 0 7px;border:.5px solid var(--dsw-alias-border-l3);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-tertiary)}
.pm-page-size-control select{height:24px;min-width:42px;padding:0 16px 0 2px;border:0;outline:0;background:transparent;color:var(--dsw-alias-label-secondary);font:500 11px/1 ui-monospace,SFMono-Regular,Consolas,monospace}

.pm-card{padding:11px 12px}
.pm-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.pm-card-install-actions{display:flex;align-items:center;gap:6px;flex:0 0 auto}
.pm-card-install{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;flex:0 0 30px;width:30px;height:30px;padding:0;border:.5px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);cursor:pointer}
.pm-card-install:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-brand-primary)}
.pm-card-install[data-state=installed]{color:var(--dsw-alias-state-success-primary)}
.pm-card-install[data-state=update]{color:#e5a000;border-color:color-mix(in srgb,#e5a000 45%,var(--dsw-alias-border-l3))}
.pm-card-install[data-state=failed]{color:var(--dsw-alias-state-error-primary)}
.pm-card-install:disabled{opacity:.55;cursor:default}
.pm-card-install svg{display:block;width:16px;height:16px}
.pm-card-cancel{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;flex:0 0 30px;width:30px;height:30px;padding:0;border:.5px solid color-mix(in srgb,var(--pm-danger) 45%,var(--dsw-alias-border-l3));border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--pm-danger);cursor:pointer}
.pm-card-cancel:hover{background:color-mix(in srgb,var(--pm-danger) 9%,var(--dsw-alias-bg-layer-1));border-color:var(--pm-danger)}
.pm-card-cancel svg{display:block;width:14px;height:14px}

.pm-card-description{position:relative;margin-top:7px;min-width:0}
.pm-desc{margin:0;color:var(--dsw-alias-label-secondary);font-size:13px;line-height:18px}
.pm-desc[data-clamped=true]{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;padding-right:34px}
.pm-desc-more{position:absolute;right:0;bottom:0;height:18px;padding:0 1px;border:0;border-radius:0;background:transparent;color:var(--dsw-alias-brand-primary);font:900 15px/18px ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;cursor:pointer;box-shadow:none;appearance:none}
.pm-desc-more:hover,.pm-desc-more:focus-visible{background:transparent;color:var(--dsw-alias-brand-primary);filter:brightness(1.12);outline:none;text-decoration:none}
.pm-desc-less{display:inline-flex;margin-top:2px;padding:0;border:0;background:transparent;color:var(--dsw-alias-brand-primary);font:600 11px/16px inherit;cursor:pointer}
.pm-card-description[data-expanded=true] .pm-desc{padding-right:0}

.pm-command-row{display:grid;grid-template-columns:minmax(0,1fr) 28px;gap:6px;align-items:center;margin-top:8px}
.pm-command-row .pm-icon-btn{width:28px;min-width:28px;height:28px;border:0;border-radius:28px;background:transparent}
.pm-command-row .pm-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover);border:0}
.pm-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}

@media(max-width:960px){
  .pm-browse-options{align-items:flex-start}
  .pm-sort-row{order:2}
  .pm-pagination{max-width:100%;overflow-x:auto}
}
@media(max-width:640px){
  .pm-browse-topline{align-items:flex-start;flex-direction:column}
  .pm-browse-topline .pm-pagination{align-self:flex-end}
  .pm-sort-row{width:100%;justify-content:flex-end}
}


/* Compact one-line Browse controls */
.pm-controls-row{display:flex;align-items:center;gap:6px;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;padding:1px 0 3px;scrollbar-width:none}
.pm-controls-row::-webkit-scrollbar{display:none}
.pm-filter-toggle,.pm-compact-filter,.pm-sort-row{flex:0 0 auto}
.pm-filter-toggle{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;padding:0;border:.5px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-tertiary);cursor:pointer}
.pm-filter-toggle:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}
.pm-filter-toggle[data-active=true]{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-border-l4)}
.pm-compact-filter{box-sizing:border-box;display:inline-flex;align-items:center;gap:4px;height:30px;padding:0 4px 0 7px;border:.5px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-tertiary)}
.pm-compact-filter[data-active=true]{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-brand-primary)}
.pm-compact-filter-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 14px}
.pm-compact-filter-icon svg{display:block;width:14px;height:14px}
.pm-compact-filter select{height:27px;max-width:128px;padding:0 18px 0 2px;border:0;outline:0;background:transparent;color:var(--dsw-alias-label-secondary);font:500 11px/1 inherit}
.pm-sort-row{gap:3px;padding:2px;border:.5px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-bg-module-platform)}
.pm-sort-criterion{min-width:36px;height:26px;padding:0 6px;border:.5px solid transparent;border-radius:6px}
.pm-sort-criterion[data-active=true]{border-color:var(--dsw-alias-border-l4);background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,var(--dsw-alias-bg-layer-3));color:var(--dsw-alias-label-primary)}
.pm-sort-criterion[data-active=true] .pm-sort-direction{color:var(--dsw-alias-brand-primary)}
.pm-sort-priority{display:none!important}

.pm-page-size-control{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:4px;min-width:48px;height:28px;padding:0 7px;border:.5px solid var(--dsw-alias-border-l3);border-radius:7px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font:500 11px/1 ui-monospace,SFMono-Regular,Consolas,monospace;cursor:pointer}
.pm-page-size-control:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.pm-page-size-control:disabled{opacity:.5;cursor:default}
.pm-page-button[data-current=true]{border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}

@media(max-width:960px){
  .pm-controls-row{width:100%}
  .pm-sort-row{order:initial}
}


/* Responsive request feedback, native page-size menu trigger, and source actions */
.pm-loading-strip{position:relative;display:grid;grid-template-columns:16px auto 1fr;align-items:center;gap:6px;min-height:20px;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.pm-loading-spinner{display:inline-flex;align-items:center;justify-content:center}
.pm-loading-track{position:relative;height:2px;overflow:hidden;border-radius:99px;background:var(--dsw-alias-border-l2)}
.pm-loading-bar{position:absolute;top:0;bottom:0;width:28%;border-radius:99px;background:var(--dsw-alias-brand-primary);animation:pm-loading-slide 1s ease-in-out infinite}
@keyframes pm-loading-slide{0%{left:-28%}50%{left:52%}100%{left:100%}}
.pm-results[data-updating=true]{opacity:.68;transition:opacity .12s ease}
.pm-page-size-control svg:last-child{width:11px;height:11px;color:var(--dsw-alias-label-caption)}
.pm-source-delete{width:28px;height:28px;display:inline-grid;place-items:center;padding:0;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.pm-source-delete:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);color:var(--dsw-alias-state-error-primary)}
.pm-source-delete:disabled{opacity:.4;cursor:default}
.pm-source-delete svg{width:15px;height:15px}
.pm-source-actions{display:none!important}


/* Native themed filter menus and install progress */
.pm-compact-filter{box-sizing:border-box;display:inline-flex;align-items:center;gap:5px;height:30px;max-width:180px;padding:0 7px;border:.5px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);font:500 11px/1 inherit;cursor:pointer}
.pm-compact-filter:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.pm-compact-filter[data-active=true]{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-brand-primary)}
.pm-compact-filter-icon{display:inline-flex;align-items:center;justify-content:center;flex:0 0 14px}
.pm-compact-filter-icon svg{display:block;width:14px;height:14px}
.pm-compact-filter-label{min-width:0;max-width:132px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pm-compact-filter>svg:last-child{flex:0 0 12px;width:12px;height:12px;color:var(--dsw-alias-label-caption)}
.pm-compact-filter select{display:none!important}
.pm-star-icon{color:var(--dsw-alias-state-warning-primary,#e5a000);font-weight:800}
.pm-card-install[data-state=installing]{color:var(--dsw-alias-label-secondary);cursor:progress;opacity:1}
.pm-card-install[data-state=installing] svg[data-state=ongoing]{width:16px;height:16px}


/* Verified bundle discovery and compact source state */
.pm-status{flex:0 0 8px;min-width:8px;max-width:8px}
.pm-source-evidence-item{flex:0 0 auto}
.pm-source-summary{overflow:hidden}
.pm-source-switch{gap:0}
.pm-bundle-state{display:inline-flex;align-items:center;height:18px;padding:0 6px;border:1px solid var(--pm-line);border-radius:99px;color:var(--pm-muted);font:600 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace}
.pm-bundle-state-bundle{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary,#30a46c) 45%,var(--pm-line));color:var(--dsw-alias-state-success-primary,#30a46c)}
.pm-bundle-state-not-bundle{color:var(--dsw-alias-label-tertiary)}
.pm-bundle-state-unknown{color:var(--dsw-alias-state-warning-primary,#e5a000)}


/* Source-card disclosure geometry and status glow */
.pm-source-list{align-items:start}
.pm-source{align-self:start}
.pm-status{margin-left:2px;box-shadow:none!important;overflow:visible}
.pm-status-ok{color:#30a46c;background:#30a46c;box-shadow:0 0 7px 1px color-mix(in srgb,#30a46c 58%,transparent)!important}
.pm-status-bad,.pm-status-wait,.pm-status-off{box-shadow:none!important}
.pm-source[data-open=false] .pm-source-head{border-bottom:0}
.pm-chevron[data-open=true]{transform:rotate(180deg)}

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
			nav: "Registry Aggregator", kicker: "Federated plugin registry", title: "Registry Aggregator", lead: "Aggregate connected plugin registries and catalogs, search them as one index, and install through the native DSH Plugin Manager.",
			"section.registry": "Plugin Registry", "tab.sources": "Sources", "tab.browse": "Browse", "tab.updates": "Updates", "update.badge": "Update {version}", "update.action": "Update to {version}", "update.updated": "Updated to {version}", "update.retry": "Retry update", "update.retryVersion": "Retry {version}", "update.starting": "Starting update…", "update.running": "Updating package…", "update.runningAttempt": "Updating {index}/{total}…", "update.updatingVersion": "Updating {version}…", "update.applying": "Applying update…", "update.cancelling": "Cancelling update…", "update.cancelActive": "Cancel update", "update.failed": "Update failed", "update.unavailable": "Update package is unavailable", "update.all": "Update all", "update.allProgress": "Updating {index}/{total}…", "update.allApplying": "Applying {index}/{total}…", "update.cancelAll": "Cancel", "update.cancelAllStopping": "Stopping updates…", "installed.expand": "Show registry details", "installed.collapse": "Hide registry details", "installed.loading": "Loading registry metadata…", "installed.debugTitle": "Registry lookup diagnostics", "installed.registryUnavailable": "No registry metadata found for this installed plugin.", "installed.registryError": "Registry lookup failed: {error}", "installed.registryVersion": "Registry {version}", "updates.title": "Available updates", "updates.empty": "All installed plugins are up to date.", "updates.loading": "Checking installed plugins for updates…", "updates.error": "Could not check for updates", "updates.count": "{count} updates", "sources.title": "Connected sources", "sources.add": "Add source", "sources.addTitle": "Add a new source", "sources.addLead": "Connect a package registry to discover and install plugins.", "sources.manage": "Manage your connected registries and discover available plugins.", "sources.empty": "No plugin sources connected", "sources.emptyHint": "Add a catalog, npm registry, or GitHub source to begin.",
			"field.name": "Name", "field.type": "Type", "field.url": "Catalog / API URL", "field.urlHint": "Optional for npm and GitHub", "source.remove": "Remove", "source.share": "Share", "source.shared": "Copied", "source.enabled": "Enabled", "source.disabled": "Disabled", "source.checking": "Checking", "source.online": "Status: online", "source.packages": "{count} packages", "source.repositories": "{count} repositories", "source.countingPackages": "Counting packages…", "source.countingRepositories": "Counting repositories…", "source.ok": "Healthy", "source.error": "Unavailable", "source.duplicate": "A source with this id already exists.", "source.required": "Name is required.", "source.urlRequired": "This source type requires a catalog URL.",
			"activation.title": "Registry Aggregator ready", "activation.body": "npm and GitHub sources are connected by default. Open Registry Aggregator to search them together or add more sources.", "activation.open": "Open Registry Aggregator", "activation.later": "Later",
			"browse.search": "Search plugins, packages, repositories…", "browse.refresh": "Refresh", "browse.pageSize": "Per page", "browse.page": "Page {page} of {pages}", "browse.prev": "Previous", "browse.next": "Next", "browse.freshness": "Freshness", "browse.freshness.any": "Any age", "browse.freshness.30": "≤ 30 days", "browse.freshness.90": "≤ 90 days", "browse.freshness.365": "≤ 1 year", "browse.category": "Category", "browse.category.any": "All categories", "browse.dshMetadata": "DSH metadata", "browse.dshMetadata.any": "Any DSH metadata", "browse.dshMetadata.declared": "DSH declared", "browse.dshMetadata.unknown": "DSH unknown", "install": "Install", "install.confirm": "Install?", "installing": "Installing…", "install.checking": "Checking package…", "install.starting": "Starting install…", "install.running": "Installing package…", "install.runningAttempt": "Installing {index}/{total}…", "install.applying": "Applying plugin…", "install.cancelActive": "Cancel install", "install.cancelling": "Cancelling…", "install.cancelFailed": "Cancel failed", "installed": "Installed", "installed.version": "Installed {version}", "update.available": "Update available {installed} → {available}", "install.failed": "Install failed", "install.retry": "Retry install", "install.notBundle": "Not a DSH bundle", "install.approvalRequired": "Build-script approval required in the native Plugin Manager", "install.cancel": "Cancel", "description.more": "…", "description.expand": "Expand description", "description.less": "Less", "browse.empty": "No plugins found", "browse.sort": "Sort", "browse.sort.relevance": "Relevance", "browse.sort.stars": "Stars", "browse.sort.downloads": "Downloads", "browse.sort.freshness": "Freshest release", "browse.sort.starsDownloads": "Stars + downloads", "browse.sort.downloadsFreshness": "Downloads + freshness", "browse.sort.name": "Name", "browse.sort.priority": "Sort priority {priority}", "browse.sort.off": "Not active", "browse.sort.asc": "Ascending", "browse.sort.desc": "Descending", "browse.stableOnly": "Stable only", "browse.emptyHint": "No plugins match the current search or filters.", "browse.noSources": "No enabled registry sources. Open Sources and enable or add one.", "browse.sourcesUnavailable": "All enabled registry sources are unavailable.", "browse.loading": "Loading catalogs…", "browse.updating": "Updating results…", "browse.error": "Catalog request failed", "browse.results": "{count} results", "compat.check": "Check DSH compatibility", "compat.none": "DSH not declared", "compat.loading": "DSH …", "compat.apiPeers": "DSH API peers", "compat.compatible": "DSH compatible", "compat.incompatible": "DSH incompatible", "compat.invalid": "Invalid DSH range", "compat.runtime": "runtime", "released": "released {age}", "repoUpdated": "repo {age}", "deprecated": "deprecated", "copy": "Copy command", "copied": "Copied", "copy.failed": "Could not copy", "install.warning": "Review the package and source before running this third-party install command.", "readonly": "Settings are read-only.", "unavailable": "Plugin source settings are unavailable.",
		};
		const zh = {
			nav: "注册源聚合器", kicker: "联合插件注册表", title: "注册源聚合器", lead: "聚合已连接的插件注册表和目录，统一搜索，并通过原生 DSH Plugin Manager 安装。",
			"section.registry": "插件注册表", "tab.sources": "来源", "tab.browse": "浏览", "tab.updates": "更新", "update.badge": "更新 {version}", "update.action": "更新到 {version}", "update.updated": "已更新到 {version}", "update.retry": "重试更新", "update.retryVersion": "重试 {version}", "update.starting": "正在开始更新…", "update.running": "正在更新插件…", "update.runningAttempt": "正在更新 {index}/{total}…", "update.updatingVersion": "正在更新 {version}…", "update.applying": "正在应用更新…", "update.cancelling": "正在取消更新…", "update.cancelActive": "取消更新", "update.failed": "更新失败", "update.unavailable": "更新包不可用", "update.all": "全部更新", "update.allProgress": "正在更新 {index}/{total}…", "update.allApplying": "正在应用 {index}/{total}…", "update.cancelAll": "取消", "update.cancelAllStopping": "正在停止更新…", "installed.expand": "显示注册表详情", "installed.collapse": "隐藏注册表详情", "installed.loading": "正在加载注册表元数据…", "installed.debugTitle": "注册表查询诊断", "installed.registryUnavailable": "未找到此已安装插件的注册表元数据。", "installed.registryError": "注册表查询失败：{error}", "installed.registryVersion": "注册表 {version}", "updates.title": "可用更新", "updates.empty": "已安装插件均为最新版本。", "updates.loading": "正在检查已安装插件的更新…", "updates.error": "无法检查更新", "updates.count": "{count} 个更新", "sources.title": "已连接来源", "sources.add": "添加来源", "sources.addTitle": "添加新来源", "sources.addLead": "连接软件包注册表以发现和安装插件。", "sources.manage": "管理已连接的注册表并发现可用插件。", "sources.empty": "尚未连接插件源", "sources.emptyHint": "添加目录、npm 注册表或 GitHub 来源以开始。",
			"field.name": "名称", "field.type": "类型", "field.url": "目录 / API URL", "field.urlHint": "npm 和 GitHub 可选", "source.remove": "移除", "source.share": "分享", "source.shared": "已复制", "source.enabled": "已启用", "source.disabled": "已禁用", "source.checking": "检查中", "source.online": "状态：在线", "source.packages": "{count} 个软件包", "source.repositories": "{count} 个仓库", "source.countingPackages": "正在统计软件包…", "source.countingRepositories": "正在统计仓库…", "source.ok": "正常", "source.error": "不可用", "source.duplicate": "具有此 ID 的来源已存在。", "source.required": "名称为必填项。", "source.urlRequired": "此来源类型需要目录 URL。",
			"activation.title": "注册源聚合器已就绪", "activation.body": "npm 和 GitHub 来源默认已连接。打开注册源聚合器即可统一搜索或添加更多来源。", "activation.open": "打开注册源聚合器", "activation.later": "稍后",
			"browse.search": "搜索插件、包、仓库…", "browse.refresh": "刷新", "browse.pageSize": "每页", "browse.page": "第 {page} / {pages} 页", "browse.prev": "上一页", "browse.next": "下一页", "browse.freshness": "新鲜度", "browse.freshness.any": "不限时间", "browse.freshness.30": "≤ 30 天", "browse.freshness.90": "≤ 90 天", "browse.freshness.365": "≤ 1 年", "browse.category": "类别", "browse.category.any": "全部类别", "browse.dshMetadata": "DSH 元数据", "browse.dshMetadata.any": "任意 DSH 元数据", "browse.dshMetadata.declared": "已声明 DSH", "browse.dshMetadata.unknown": "DSH 未知", "install": "安装", "install.confirm": "确认安装？", "installing": "安装中…", "install.cancelActive": "取消安装", "install.cancelling": "正在取消…", "install.cancelFailed": "取消失败", "installed": "已安装", "installed.version": "已安装 {version}", "update.available": "可更新 {installed} → {available}", "install.failed": "安装失败", "install.retry": "重试安装", "install.cancel": "取消", "description.more": "…", "description.expand": "展开描述", "description.less": "收起", "browse.empty": "未找到插件", "browse.sort": "排序", "browse.sort.relevance": "相关性", "browse.sort.stars": "星标", "browse.sort.downloads": "下载量", "browse.sort.freshness": "最新发布", "browse.sort.starsDownloads": "星标 + 下载量", "browse.sort.downloadsFreshness": "下载量 + 新鲜度", "browse.sort.name": "名称", "browse.sort.priority": "排序优先级 {priority}", "browse.sort.off": "未启用", "browse.sort.asc": "升序", "browse.sort.desc": "降序", "browse.stableOnly": "仅稳定版", "browse.emptyHint": "当前搜索或筛选条件没有匹配的插件。", "browse.noSources": "没有启用的注册源。请打开“来源”并启用或添加一个来源。", "browse.sourcesUnavailable": "所有已启用的注册源当前都不可用。", "browse.loading": "正在加载目录…", "browse.updating": "正在更新结果…", "browse.error": "目录请求失败", "browse.results": "{count} 个结果", "compat.check": "检查 DSH 兼容性", "compat.none": "未声明 DSH", "compat.loading": "DSH …", "compat.apiPeers": "DSH API 依赖", "compat.compatible": "DSH 兼容", "compat.incompatible": "DSH 不兼容", "compat.invalid": "DSH 版本范围无效", "compat.runtime": "运行时", "released": "发布 {age}", "repoUpdated": "仓库 {age}", "deprecated": "已弃用", "copy": "复制命令", "copied": "已复制", "copy.failed": "复制失败", "install.warning": "运行此第三方安装命令前，请检查包和来源。", "readonly": "设置为只读。", "unavailable": "插件源设置不可用。", 
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

		function SearchIcon() { return h(IconSearchOutlineRegular, { size: 16 }); }

		function RefreshIcon() { return h(IconRefreshOutlineRegular, { size: 16 }); }
		function PlusIcon() { return h(IconPlusOutlineRegular, { size: 16 }); }
		function NetworkIcon() { return h(IconDatabaseOutlineRegular, { size: 18 }); }
		function ShareIcon() { return h(IconShareOutlineRegular, { size: 16 }); }
		function TrashIcon() { return h(IconTrashOutlineRegular, { size: 16 }); }
		function PackageIcon() { return h(IconCordisPluginOutlineRegular, { size: 14 }); }
		function UpdateIcon({ size = 16 }) {
			return hs("svg", {
				width: size, height: size, viewBox: "0 0 20 20", fill: "none",
				stroke: "currentColor", strokeWidth: 1, strokeLinecap: "round", strokeLinejoin: "round",
				"aria-hidden": true,
				children: [
					h("path", { d: "M4.3 7.2A6.1 6.1 0 0 1 14.9 5.4" }),
					h("path", { d: "M14.9 5.4H11.8M14.9 5.4V2.3" }),
					h("path", { d: "M15.7 12.8A6.1 6.1 0 0 1 5.1 14.6" }),
					h("path", { d: "M5.1 14.6H8.2M5.1 14.6V17.7" }),
				],
			});
		}
		function DatabaseIcon() { return h(IconDatabaseOutlineRegular, { size: 16 }); }
		function GridIcon() { return h(IconCordisPluginOutlineRegular, { size: 16 }); }
		function LinkIcon() { return h(IconLinkOutlineRegular, { size: 16 }); }
		function AlertIcon() { return h(IconWarningOutlineRegular, { size: 16 }); }
		function IconAction({ label, icon, className = "", variant = "ghost", size = "sm", ...props }) {
			return h(Tooltip, {
				label,
				portal: true,
				children: h(Button, {
					...props,
					variant,
					size,
					className: ["pm-icon-action", className].filter(Boolean).join(" "),
					icon,
					"aria-label": props["aria-label"] ?? label,
				}),
			});
		}

		function Empty({ title, hint }) {
			return hs("div", { className: "pm-empty", children: [h("strong", { children: title }), h("span", { children: hint })] });
		}

		function AddSourceForm({ t, sources, onSave, busy, readOnly }) {
			const [name, setName] = react.useState("");
			const [type, setType] = react.useState("dshplugin-app");
			const [url, setUrl] = react.useState("");
			const [error, setError] = react.useState("");
			const [expanded, setExpanded] = react.useState(true);
			const reset = () => { setName(""); setType("dshplugin-app"); setUrl(""); setError(""); };
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
					reset();
				} catch (failure) {
					setError(String(failure?.message ?? failure));
				}
			};
			return hs("section", { className: "pm-add-source-panel", children: [
				hs("div", { className: "pm-section-head", children: [
					hs("div", { className: "pm-section-head-main", children: [
						h("div", { children: [h("div", { className: "pm-section-title", children: t("sources.addTitle") }), h("div", { className: "pm-section-lead", children: t("sources.addLead") })] }),
					] }),
					h(IconAction, { className: "pm-disclosure", label: expanded ? "Collapse" : "Expand", "aria-expanded": expanded, onClick: () => setExpanded((value) => !value), icon: h(ChevronIcon, { open: expanded }) }),
				] }),
				expanded ? hs("form", { className: "pm-form pm-form-redesign", onSubmit: submit, children: [
					hs("div", { className: "pm-field", children: [
						hs("label", { htmlFor: "pm-name", children: [t("field.name"), h("span", { className: "pm-required", children: "*" })] }),
						h(Input, { id: "pm-name", className: "pm-input-native", value: name, placeholder: "e.g. My Registry", onChange: (event) => { setName(event.target.value); if (error) setError(""); }, disabled: readOnly || busy }),
					] }),
					hs("div", { className: "pm-field", children: [
						h("label", { htmlFor: "pm-type", children: t("field.type") }),
						h("select", { id: "pm-type", className: "pm-select", value: type, onChange: (event) => { setType(event.target.value); if (error) setError(""); }, disabled: readOnly || busy, children: SOURCE_TYPES.map((item) => h("option", { value: item, children: item }, item)) }),
					] }),
					hs("div", { className: "pm-field pm-field-url", children: [
						h("label", { htmlFor: "pm-url", children: t("field.url") }),
						h(Input, { id: "pm-url", className: "pm-input-native", icon: h(LinkIcon, {}), type: "url", value: url, placeholder: t("field.urlHint"), onChange: (event) => { setUrl(event.target.value); if (error) setError(""); }, disabled: readOnly || busy }),
					] }),
					hs("div", { className: "pm-form-actions", children: [
						h(Button, { variant: "outline", size: "md", type: "button", disabled: readOnly || busy, onClick: reset, children: t("install.cancel") }),
						h(Button, { variant: "primary", size: "md", type: "submit", disabled: readOnly || busy, children: t("sources.add") }),
					] }),
					error ? hs("p", { className: "pm-form-error", role: "alert", children: [h(AlertIcon, {}), h("span", { children: error })] }) : null,
				] }) : null,
			] });
		}

		function ChevronIcon({ open }) {
			return h(IconChevronDownOutlineRegular, { size: 14, className: "pm-chevron", "data-open": open });
		}

		function sourceEndpoint(source) {
			if (source.url) return source.url;
			if (source.type === "npm") return "https://registry.npmjs.org";
			if (source.type === "github") return "https://api.github.com";
			return source.id;
		}

		function SourceLogo({ source }) {
			if (source.type === "npm") return h("div", { className: "pm-source-logo pm-source-logo-npm", "aria-hidden": true, children: h(LinkIconRegular, { kind: "url", href: "https://www.npmjs.com", size: 18 }) });
			if (source.type === "github") return h("div", { className: "pm-source-logo pm-source-logo-github", "aria-hidden": true, children: h(LinkIconRegular, { kind: "url", href: "https://github.com", size: 18 }) });
			return h("div", { className: "pm-source-logo pm-source-logo-generic", "aria-hidden": true, children: h(IconCordisPluginOutlineRegular, { size: 18 }) });
		}
		function SourceRow({ source, health, sourceCount, t, busy, readOnly, onToggle, onRemove }) {
			const [open, setOpen] = react.useState(true);
			const [copied, setCopied] = react.useState(false);
			const status = source.enabled === false ? "off" : health?.ok === true ? "ok" : health?.ok === false ? "bad" : "wait";
			const endpoint = sourceEndpoint(source);
			const count = Number.isFinite(sourceCount?.count) ? sourceCount.count : Number.isFinite(health?.count) ? health.count : undefined;
			const countLoading = status === "ok" && sourceCount?.loading === true && count === undefined;
			const countLabel = count === undefined ? undefined : source.type === "github" ? t("source.repositories", { count }) : t("source.packages", { count });
			const countingLabel = source.type === "github" ? t("source.countingRepositories") : t("source.countingPackages");
			const statusText = status === "off" ? t("source.disabled") : status === "ok" ? t("source.online") : status === "bad" ? t("source.error") : t("source.checking");
			const statusState = status === "off" ? "idle" : status === "ok" ? "done" : status === "bad" ? "error" : "ongoing";
			const copyEndpoint = async () => {
				if (await writeClipboard(endpoint)) { setCopied(true); setTimeout(() => setCopied(false), 1400); }
			};
			return hs("article", { className: "pm-source", "data-open": open, children: [
				hs("div", { className: "pm-source-head", children: [
					hs("div", { className: "pm-source-main", children: [
						h(SourceLogo, { source }),
						h("div", { className: "pm-source-summary", children: [
							h("div", { className: "pm-source-line", children: h("span", { className: "pm-source-name", children: source.name }) }),
							hs("div", { className: "pm-source-evidence", children: [
								hs("span", { className: "pm-source-evidence-item", children: [h(StateDot, { state: statusState, size: 8, className: "pm-source-status-dot" }), h("span", { children: statusText })] }),
								status === "ok" && (count !== undefined || countLoading) ? h("span", { className: "pm-evidence-separator", "aria-hidden": true }) : null,
								countLoading ? hs("span", { className: "pm-source-evidence-item", title: countingLabel, role: "status", "aria-label": countingLabel, children: [h(StateDot, { state: "ongoing", size: 14 }), h("span", { className: "pm-sr-only", children: countingLabel })] }) : null,
								status === "ok" && count !== undefined ? hs("span", { className: "pm-source-evidence-item", children: [h(PackageIcon, {}), h("span", { children: countLabel })] }) : null,
							] }),
						] }),
					] }),
					hs("div", { className: "pm-source-buttons", children: [
						h("span", { className: "pm-source-switch", children:
							h(Switch, { checked: source.enabled !== false, disabled: readOnly || busy, label: source.enabled !== false ? t("source.enabled") : t("source.disabled"), onChange: () => onToggle(source.id) })
						}),
						h(IconAction, { className: "pm-source-disclosure", label: open ? "Collapse source" : "Expand source", "aria-expanded": open, onClick: () => setOpen((value) => !value), icon: h(ChevronIcon, { open }) }),
						h(IconAction, { className: "pm-source-delete", label: t("source.remove"), disabled: readOnly || busy, onClick: () => onRemove(source.id), icon: h(TrashIcon, {}) }),
					] }),
				] }),
				open ? hs("div", { className: "pm-source-details", children: [
					h("div", { className: "pm-source-url-label", children: t("field.url") }),
					hs("div", { className: "pm-source-url-wrap", children: [
						h(Input, { className: "pm-source-url", value: endpoint, readOnly: true, title: endpoint }),
						h(IconAction, { className: "pm-copy-url", label: copied ? t("copied") : t("copy"), onClick: copyEndpoint, icon: copied ? h(IconCheckOutlineRegular, { size: 16 }) : h(IconCopyOutlineRegular, { size: 16 }) }),
					] }),
					health?.error ? h("div", { className: "pm-source-error", title: health.error, children: health.error }) : sourceCount?.error ? h("div", { className: "pm-source-error", title: sourceCount.error, children: sourceCount.error }) : null,
				] }) : null,
			] });
		}

		function SourcesView({ t, sources, writable, saveSources, busy, healthState, countMap, countsLoading, refreshHealth }) {
			const [mutationError, setMutationError] = react.useState("");
			const mutate = async (next) => {
				setMutationError("");
				try { await saveSources(next); return true; }
				catch (failure) { setMutationError(String(failure?.message ?? failure)); return false; }
			};
			const healthMap = Object.fromEntries((healthState.data?.sources ?? []).map((row) => [row.source.id, row.health]));
			return hs("section", { className: "pm-sources-view", children: [
				h(AddSourceForm, { t, sources, onSave: mutate, busy, readOnly: !writable }),
				hs("section", { className: "pm-connected-panel", children: [
					hs("div", { className: "pm-section-head pm-connected-head", children: [
						hs("div", { className: "pm-section-head-main", children: [
							h("div", { children: [h("div", { className: "pm-section-title", children: t("sources.title") }), h("div", { className: "pm-section-lead", children: t("sources.manage") })] }),
						] }),
						h(IconAction, { className: "pm-refresh-icon", label: t("browse.refresh"), onClick: refreshHealth, disabled: healthState.loading, icon: h(IconRefreshOutlineRegular, { size: 16, className: healthState.loading ? "pm-spin" : undefined }) }),
					] }),
					!writable ? h("p", { className: "pm-notice pm-connected-notice", children: t("readonly") }) : null,
					mutationError ? h("p", { className: "pm-notice pm-notice-error pm-connected-notice", role: "alert", children: mutationError }) : null,
					healthState.error ? h("p", { className: "pm-notice pm-notice-error pm-connected-notice", role: "alert", children: healthState.error }) : null,
					sources.length === 0 ? h(Empty, { title: t("sources.empty"), hint: t("sources.emptyHint") }) : h("div", { className: "pm-source-list", children: sources.map((source) => h(SourceRow, { source, health: healthMap[source.id], sourceCount: countMap[source.id], t, busy, readOnly: !writable, onToggle: (id) => { void mutate(sources.map((row) => row.id === id ? { ...row, enabled: row.enabled === false } : row)); }, onRemove: (id) => { void mutate(sources.filter((row) => row.id !== id)); } }, source.id)) }),
				] }),
			] });
		}

		function installCommand(plugin) {
			return plugin.install?.spec ? `dsh plugin add ${plugin.install.spec}` : "";
		}

		function compactNumber(value) {
			if (typeof value !== "number" || !Number.isFinite(value)) return "";
			return new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(value);
		}

		function parseSemver(value) {
			const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/u.exec(String(value ?? "").trim());
			if (!match) return undefined;
			return {
				core: [Number(match[1]), Number(match[2]), Number(match[3])],
				prerelease: match[4] ? match[4].split(".") : [],
			};
		}

		function compareSemver(left, right) {
			const a = parseSemver(left);
			const b = parseSemver(right);
			if (!a || !b) return 0;
			for (let index = 0; index < 3; index++) {
				if (a.core[index] !== b.core[index]) return a.core[index] > b.core[index] ? 1 : -1;
			}
			if (!a.prerelease.length && !b.prerelease.length) return 0;
			if (!a.prerelease.length) return 1;
			if (!b.prerelease.length) return -1;
			const length = Math.max(a.prerelease.length, b.prerelease.length);
			for (let index = 0; index < length; index++) {
				const leftPart = a.prerelease[index];
				const rightPart = b.prerelease[index];
				if (leftPart === undefined) return -1;
				if (rightPart === undefined) return 1;
				if (leftPart === rightPart) continue;
				const leftNumeric = /^\d+$/u.test(leftPart);
				const rightNumeric = /^\d+$/u.test(rightPart);
				if (leftNumeric && rightNumeric) return Number(leftPart) > Number(rightPart) ? 1 : -1;
				if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
				return leftPart > rightPart ? 1 : -1;
			}
			return 0;
		}

		const INSTALLED_REGISTRY_TTL_MS = 30_000;
		let installedRegistryCache;
		let installedRegistryPending;

		function invalidateInstalledRegistrySnapshot() {
			installedRegistryCache = undefined;
		}

		async function loadInstalledRegistrySnapshot({ force = false } = {}) {
			const now = Date.now();
			if (!force && installedRegistryCache?.expiresAt > now) return installedRegistryCache.value;
			if (installedRegistryPending) return installedRegistryPending;
			installedRegistryPending = (async () => {
				if (!connection || typeof remote?.pluginManager?.listBundles !== "function") return { bundles: [], entries: [], updates: [] };
				const result = await remote.pluginManager.listBundles();
				if (!result?.ok) throw new Error(result?.error?.message || "Could not list installed plugins");
				const bundles = (Array.isArray(result.value) ? result.value : [])
					.filter((bundle) => bundle?.installed !== false && typeof bundle?.name === "string" && bundle.name.trim());
				let plugins = [];
				let lookupErrors = [];
				try {
					const resolved = await rpc("installed", { packages: bundles.map((bundle) => bundle.name) });
					if (Array.isArray(resolved)) plugins = resolved;
					else {
						plugins = Array.isArray(resolved?.plugins) ? resolved.plugins : [];
						lookupErrors = Array.isArray(resolved?.errors) ? resolved.errors : [];
					}
				} catch (error) {
					lookupErrors = bundles.map((bundle) => ({ package: bundle.name, error: String(error?.message ?? error) }));
				}
				const byPackage = new Map(plugins
					.filter((plugin) => plugin?.identity?.package)
					.map((plugin) => [plugin.identity.package, plugin]));
				const errorByPackage = new Map(lookupErrors
					.filter((row) => typeof row?.package === "string" && typeof row?.error === "string")
					.map((row) => [row.package, row.error]));
				const entries = bundles.map((bundle) => {
					const plugin = byPackage.get(bundle.name);
					return {
						bundle,
						plugin,
						...(errorByPackage.has(bundle.name) ? { lookupError: errorByPackage.get(bundle.name) } : {}),
						updateAvailable: Boolean(plugin?.version && typeof bundle.version === "string" && compareSemver(plugin.version, bundle.version) === 1),
					};
				});
				const value = {
					bundles,
					entries,
					updates: entries.filter((entry) => entry.updateAvailable && entry.plugin).map((entry) => entry.plugin),
				};
				installedRegistryCache = { expiresAt: Date.now() + INSTALLED_REGISTRY_TTL_MS, value };
				return value;
			})().finally(() => { installedRegistryPending = undefined; });
			return installedRegistryPending;
		}

		function localSearchVariants(value) {
			const needle = String(value ?? "").trim().toLowerCase();
			if (!needle) return [];
			const variants = [needle];
			const unscoped = needle.startsWith("@") && needle.includes("/") ? needle.slice(needle.indexOf("/") + 1) : needle;
			if (unscoped !== needle) variants.push(unscoped);
			let shortened = unscoped;
			for (const prefix of ["dsh-client-ui-", "dsh-ui-", "dsh-plugin-"]) {
				if (shortened.startsWith(prefix) && shortened.length > prefix.length) {
					shortened = shortened.slice(prefix.length);
					variants.push(shortened);
					break;
				}
			}
			if (shortened.startsWith("dsh-") && shortened.length > 4) variants.push(shortened.slice(4));
			const parts = shortened.split("-").filter(Boolean);
			if (parts.length >= 2) variants.push(parts.slice(-2).join("-"));
			return [...new Set(variants.filter((item) => item.length >= 3))].slice(0, 3);
		}

		function localRelevanceScore(plugin, query) {
			const variants = localSearchVariants(query);
			if (!variants.length) return 0;
			const name = String(plugin.name ?? "").toLowerCase();
			const packageName = String(plugin.identity?.package ?? "").toLowerCase();
			const repository = String(plugin.identity?.repository ?? "").toLowerCase();
			const description = String(plugin.description ?? "").toLowerCase();
			const tags = (plugin.tags ?? []).map((tag) => String(tag).toLowerCase());
			let best = 0;
			for (let index = 0; index < variants.length; index += 1) {
				const needle = variants[index];
				const penalty = index * 25;
				const score = Math.max(
					packageName === needle ? 1000 : 0,
					name === needle ? 950 : 0,
					packageName.startsWith(needle) ? 850 : 0,
					name.startsWith(needle) ? 800 : 0,
					packageName.includes(needle) ? 720 : 0,
					name.includes(needle) ? 680 : 0,
					tags.includes(needle) ? 600 : 0,
					tags.some((tag) => tag.includes(needle)) ? 500 : 0,
					repository.includes(needle) ? 300 : 0,
					description.includes(needle) ? 200 : 0,
				) - penalty;
				best = Math.max(best, score);
			}
			return Math.max(0, best);
		}

		function rankVisiblePlugins(plugins, query, sorts) {
			if (!Array.isArray(plugins) || plugins.length < 2 || (Array.isArray(sorts) && sorts.length) || !String(query ?? "").trim()) return plugins;
			return [...plugins].sort((left, right) => {
				const relevance = localRelevanceScore(right, query) - localRelevanceScore(left, query);
				if (relevance !== 0) return relevance;
				return String(left.name ?? "").localeCompare(String(right.name ?? ""));
			});
		}

		function repositoryEvidenceKey(value) {
			if (typeof value !== "string" || !value.trim()) return "";
			let raw = value.trim().replace(/^git\+/, "").replace(/^git@github\.com:/i, "https://github.com/");
			try {
				const url = new URL(raw);
				url.hash = "";
				url.search = "";
				return url.toString().replace(/\.git$/i, "").replace(/\/$/, "").toLowerCase();
			} catch {
				return raw.replace(/\.git$/i, "").replace(/\/$/, "").toLowerCase();
			}
		}

		function relativeAge(value) {
			const timestamp = Date.parse(value || "");
			if (!Number.isFinite(timestamp)) return "";
			const days = Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
			if (days < 1) return "<1d";
			if (days < 30) return `${days}d`;
			if (days < 365) return `${Math.floor(days / 30)}mo`;
			return `${Math.floor(days / 365)}y`;
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

		function ClampedDescription({ text, t, onExpand }) {
			const [expanded, setExpanded] = react.useState(false);
			const [overflow, setOverflow] = react.useState(false);
			const ref = react.useRef(null);
			react.useEffect(() => {
				if (expanded) return undefined;
				const node = ref.current;
				if (!node) return undefined;
				const measure = () => setOverflow(node.scrollHeight > node.clientHeight + 1);
				measure();
				if (typeof globalThis.ResizeObserver !== "function") return undefined;
				const observer = new globalThis.ResizeObserver(measure);
				observer.observe(node);
				return () => observer.disconnect();
			}, [text, expanded]);
			const toggle = () => {
				const next = !expanded;
				setExpanded(next);
				if (next) onExpand?.();
			};
			return hs("div", { className: "pm-card-description", "data-expanded": expanded, children: [
				h("p", { ref, className: "pm-desc", "data-clamped": !expanded, children: text }),
				!expanded && overflow ? h("button", { type: "button", className: "pm-desc-more", onClick: toggle, title: t("description.expand"), "aria-label": t("description.expand"), children: "..." }) : null,
				expanded ? h("button", { type: "button", className: "pm-desc-less", onClick: toggle, children: t("description.less") }) : null,
			] });
		}

		function sortDirectionIcon(direction) {
			if (direction === "asc") return h(IconChevronUpOutlineRegular, { size: 12 });
			if (direction === "desc") return h(IconChevronDownOutlineRegular, { size: 12 });
			return h(IconChevronsUpDownOutlineRegular, { size: 13 });
		}

		function SortCriterion({ criterion, icon, label, sorts, onCycle, t }) {
			const index = sorts.findIndex((item) => item.key === criterion);
			const active = index >= 0;
			const direction = active ? sorts[index].direction : "off";
			const title = active
				? `${label} · ${direction === "asc" ? t("browse.sort.asc") : t("browse.sort.desc")}`
				: `${label} · ${t("browse.sort.off")}`;
			return hs("button", {
				type: "button",
				className: "pm-sort-criterion",
				"data-active": active,
				"data-direction": direction,
				title,
				"aria-label": title,
				onClick: () => onCycle(criterion),
				children: [
					h("span", { className: "pm-sort-symbol", children: icon }),
					h("span", { className: "pm-sort-direction", children: sortDirectionIcon(direction) }),
				],
			});
		}

		function pageTokens(page, pageCount) {
			if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
			const keep = new Set([1, pageCount, page - 1, page, page + 1].filter((value) => value >= 1 && value <= pageCount));
			const sorted = [...keep].sort((a, b) => a - b);
			const result = [];
			for (let index = 0; index < sorted.length; index += 1) {
				const value = sorted[index];
				const previous = sorted[index - 1];
				if (index > 0 && value - previous > 1) result.push("ellipsis-" + previous);
				result.push(value);
			}
			return result;
		}

		function Pagination({ page, pageCount, pageSize, setPage, setPageSize, disabled, t, showPageSize = true }) {
			const [sizeOpen, setSizeOpen] = react.useState(false);
			const sizeItems = [20, 50, 100].map((size) => ({ id: String(size), label: String(size) }));
			const sizePicker = showPageSize ? h(Menu, {
				open: sizeOpen,
				compact: true,
				align: "end",
				portal: true,
				selectedId: String(pageSize),
				items: sizeItems,
				onClose: () => setSizeOpen(false),
				onSelect: (id) => { setSizeOpen(false); setPageSize(Number(id)); },
				anchor: hs("button", {
					id: "pm-page-size",
					type: "button",
					className: "pm-page-size-control",
					onClick: () => setSizeOpen((value) => !value),
					title: `${t("browse.pageSize")}: ${pageSize}`,
					"aria-label": `${t("browse.pageSize")}: ${pageSize}`,
					"aria-haspopup": "menu",
					"aria-expanded": sizeOpen,
					children: [
						h(IconFlatListOutlineRegular, { size: 14 }),
						h("span", { children: String(pageSize) }),
						h(IconChevronDownOutlineRegular, { size: 12 }),
					],
				}),
			}) : null;
			return hs("div", { className: "pm-pagination", children: [
				hs("div", { className: "pm-page-controls", children: [
					h("button", { type: "button", className: "pm-page-button", disabled: page <= 1, onClick: () => setPage(Math.max(1, page - 1)), title: t("browse.prev"), "aria-label": t("browse.prev"), children: h(IconChevronLeftOutlineRegular, { size: 14 }) }),
					...pageTokens(page, pageCount).map((token) => typeof token === "number"
						? h("button", { type: "button", className: "pm-page-button", "data-current": token === page, onClick: () => setPage(token), children: String(token) }, token)
						: h("span", { className: "pm-page-ellipsis", children: "…" }, token)),
					h("button", { type: "button", className: "pm-page-button", disabled: page >= pageCount, onClick: () => setPage(Math.min(pageCount, page + 1)), title: t("browse.next"), "aria-label": t("browse.next"), children: h(IconChevronRightOutlineRegular, { size: 14 }) }),
				] }),
				sizePicker,
			] });
		}

		async function runBundleMutation({ spec, mode = "install", enabled = true, t, onProgress }) {
			if (!spec || !remote?.pluginManager || typeof remote.pluginManager.installBundle !== "function") {
				throw new Error(t(mode === "update" ? "update.failed" : "install.failed"));
			}
			let registry = null;
			if (mode !== "update") {
				onProgress?.({ phase: "checking", activity: 0 });
				const inspection = await remote.pluginManager.inspect(spec, { registry: null });
				if (!inspection?.ok) throw new Error(inspection?.error?.message || t("install.failed"));
				if (inspection.value?.status !== "accepted") {
					const problem = inspection.value?.problem;
					const reason = inspection.value?.reason || "Plugin spec was rejected";
					if (problem === "not-a-bundle") return { status: "invalid", reason };
					throw new Error(reason);
				}
				registry = inspection.value.registry;
			}
			const requestId = globalThis.crypto?.randomUUID?.();
			if (!requestId) throw new Error("Browser cannot create an install request id");
			onProgress?.({ phase: "starting", requestId, activity: 0 });
			let disposeState;
			let disposeLog;
			try {
				if (typeof remote?.$on === "function") {
					disposeState = remote.$on("plugin-manager/install-state", (progress) => {
						if (progress?.requestId !== requestId) return;
						onProgress?.({ phase: progress.phase, requestId, attempt: progress.attempt, activityDelta: 1 });
					});
					disposeLog = remote.$on("plugin-manager/install-log", (chunk) => {
						if (chunk?.requestId !== requestId) return;
						onProgress?.({ phase: "installing", requestId, activityDelta: 1 });
					});
				}
				const result = await remote.pluginManager.installBundle(spec, { enabled, registry, requestId });
				if (!result?.ok) throw new Error(result?.error?.message || t(mode === "update" ? "update.failed" : "install.failed"));
				if (result.value?.application === "cancelled") {
					onProgress?.({ phase: "idle", requestId, activity: 0 });
					return { status: "cancelled", requestId, value: result.value };
				}
				if (result.value?.application === "failed") {
					const pending = result.value?.pendingBuilds;
					if (Array.isArray(pending) && pending.length) throw new Error(`${t("install.approvalRequired")}: ${pending.join(", ")}`);
					throw new Error(result.value?.error?.diagnostic || result.value?.packageResult?.output || t(mode === "update" ? "update.failed" : "install.failed"));
				}
				onProgress?.({ phase: "done", requestId });
				return { status: "applied", requestId, value: result.value };
			} finally {
				if (typeof disposeState === "function") disposeState();
				if (typeof disposeLog === "function") disposeLog();
			}
		}

		async function cancelBundleMutation(requestId, t) {
			if (!requestId || typeof remote?.pluginManager?.cancelInstall !== "function") return { status: "unavailable" };
			const result = await remote.pluginManager.cancelInstall(requestId);
			if (!result?.ok) throw new Error(result?.error?.message || t("install.cancelFailed"));
			return result.value ?? { status: "unknown" };
		}

		function PluginCard({ plugin, t, bundles, embeddedInstalled = false, operationsDisabled = false }) {
			const [copyState, setCopyState] = react.useState("");
			const [installState, setInstallState] = react.useState("idle");
			const [installError, setInstallError] = react.useState("");
			const [installProgress, setInstallProgress] = react.useState({ phase: "idle", activity: 0 });
			const [detailsState, setDetailsState] = react.useState({ status: "idle" });
			const command = installCommand(plugin);
			const spec = plugin.install?.spec || "";
			const packageName = plugin.identity?.package;
			const installedBundle = packageName ? (bundles ?? []).find((bundle) => bundle?.name === packageName) : undefined;
			const installedVersion = typeof installedBundle?.version === "string" ? installedBundle.version : undefined;
			const updateAvailable = Boolean(installedVersion && plugin.version && compareSemver(plugin.version, installedVersion) === 1);
			const effectiveInstallState = installState === "idle" ? (installedBundle ? "installed" : "idle") : installState;
			const installedLabel = updateAvailable
				? t("update.available", { installed: installedVersion, available: plugin.version })
				: installedVersion ? t("installed.version", { version: installedVersion })
					: installState === "installed" && plugin.version ? t("installed.version", { version: plugin.version })
						: t("installed");
			const declaredCompatibility = plugin.evidence?.dshCompatibility;
			const loadDetails = async () => {
				if (detailsState.status === "loading" || detailsState.status === "ready") return;
				const payload = plugin.identity?.package && plugin.version
					? { package: plugin.identity.package, version: plugin.version }
					: plugin.identity?.repository
						? { repository: plugin.identity.repository }
						: null;
				if (!payload) return setDetailsState({ status: "ready", data: {} });
				setDetailsState({ status: "loading" });
				try {
					const data = await rpc("details", payload);
					setDetailsState({ status: "ready", data: data ?? {} });
				} catch (error) {
					setDetailsState({ status: "error", error: String(error?.message ?? error) });
				}
			};
			const resolvedCompatibility = detailsState.data?.dshCompatibility ?? declaredCompatibility;
			const compatibilityStatus = detailsState.data?.dshCompatibilityStatus ?? plugin.evidence?.dshCompatibilityStatus;
			const runtimeVersion = detailsState.data?.dshRuntimeVersion ?? plugin.evidence?.dshRuntimeVersion;
			const dshPeers = detailsState.data?.dshPeers ?? plugin.evidence?.dshPeers ?? [];
			const metadataResolved = detailsState.status === "ready" || plugin.evidence?.dshMetadataResolved === true;
			const peerTitle = dshPeers.map((peer) => `${peer.dependency} ${peer.range}`).join("\n");
			const compatibilityLabel = compatibilityStatus === "compatible" ? t("compat.compatible")
				: compatibilityStatus === "incompatible" ? t("compat.incompatible")
					: compatibilityStatus === "invalid" ? t("compat.invalid")
						: compatibilityStatus === "undeclared" ? t("compat.none")
							: resolvedCompatibility ? `DSH ${resolvedCompatibility}`
								: dshPeers.length ? t("compat.apiPeers")
									: detailsState.status === "loading" ? t("compat.loading")
										: metadataResolved ? t("compat.none") : t("compat.check");
			const compatibilityTitle = [
				resolvedCompatibility ? `DSH ${resolvedCompatibility}` : "",
				runtimeVersion ? `${t("compat.runtime")}: ${runtimeVersion}` : "",
				peerTitle,
			].filter(Boolean).join("\n") || t("compat.check");
			const releaseDate = plugin.evidence?.releasedAt;
			const repoDate = plugin.evidence?.repositoryUpdatedAt;
			const freshnessDate = releaseDate ?? repoDate;
			const freshnessLabel = releaseDate ? t("released", { age: relativeAge(releaseDate) })
				: repoDate ? t("repoUpdated", { age: relativeAge(repoDate) }) : "";

			react.useEffect(() => {
				if (!copyState) return undefined;
				const timer = setTimeout(() => setCopyState(""), 1400);
				return () => clearTimeout(timer);
			}, [copyState]);

			const copy = async () => {
				if (!command) return setCopyState("error");
				setCopyState(await writeClipboard(command) ? "ok" : "error");
			};

			const install = async () => {
				const updating = Boolean(installedBundle && updateAvailable);
				if (!spec || !remote?.pluginManager || (installedBundle && !updating)
					|| installState === "installing" || installState === "installed" || installState === "invalid" || operationsDisabled) return;
				setInstallState("installing");
				setInstallError("");
				setInstallProgress({ phase: updating ? "starting" : "checking", activity: 0 });
				try {
					const outcome = await runBundleMutation({
						spec,
						mode: updating ? "update" : "install",
						enabled: installedBundle ? installedBundle.enabled !== false : true,
						t,
						onProgress: (progress) => setInstallProgress((current) => ({
							...current,
							...progress,
							activity: progress.activity ?? ((current.activity ?? 0) + (progress.activityDelta ?? 0)),
						})),
					});
					if (outcome.status === "invalid") {
						setInstallState("invalid");
						setInstallProgress({ phase: "idle", activity: 0 });
						setInstallError(outcome.reason);
						return;
					}
					if (outcome.status === "cancelled") {
						setInstallProgress({ phase: "idle", activity: 0 });
						setInstallState("idle");
						setInstallError("");
						return;
					}
					setInstallState("installed");
				} catch (error) {
					setInstallProgress((current) => ({ ...current, phase: "failed" }));
					setInstallState("failed");
					setInstallError(String(error?.message ?? error));
				}
			};

			const cancelInstall = async () => {
				const requestId = installProgress.requestId;
				if (!requestId || installState !== "installing" || installProgress.phase === "applying" || installProgress.phase === "cancelling"
					|| typeof remote?.pluginManager?.cancelInstall !== "function") return;
				setInstallError("");
				setInstallProgress((current) => ({ ...current, phase: "cancelling" }));
				try {
					const result = await cancelBundleMutation(requestId, t);
					if (result?.status === "too-late") setInstallProgress((current) => ({ ...current, phase: "applying" }));
				} catch (error) {
					setInstallProgress((current) => ({ ...current, phase: "installing" }));
					setInstallError(`${t("install.cancelFailed")}: ${String(error?.message ?? error)}`);
				}
			};

			const sources = plugin.sources ?? [];
			const requiresVerification = sources.some((source) => source.type === "npm" || source.type === "github");
			const installability = detailsState.data?.installability ?? plugin.evidence?.installability ?? (requiresVerification ? "unknown" : "bundle");
			const installAllowed = Boolean(spec) && (!requiresVerification || installability === "bundle");
			const bundleLabel = installability === "bundle" ? t("bundle.verified")
				: installability === "not-bundle" ? t("bundle.notBundle") : t("bundle.unknown");
			const updating = Boolean(installedBundle && updateAvailable);
			const progressTitle = installProgress.phase === "checking" ? t("install.checking")
				: installProgress.phase === "starting" ? t(updating ? "update.starting" : "install.starting")
					: installProgress.phase === "installing"
						? installProgress.attempt
							? t(updating ? "update.runningAttempt" : "install.runningAttempt", { index: installProgress.attempt.index, total: installProgress.attempt.total })
							: t(updating ? "update.running" : "install.running")
						: installProgress.phase === "cancelling" ? t(updating ? "update.cancelling" : "install.cancelling")
							: installProgress.phase === "applying" ? t(updating ? "update.applying" : "install.applying")
								: t(updating ? "update.running" : "installing");
			const canCancelInstall = effectiveInstallState === "installing"
				&& Boolean(installProgress.requestId)
				&& !["applying", "cancelling"].includes(installProgress.phase)
				&& typeof remote?.pluginManager?.cancelInstall === "function";
			const installTitle = effectiveInstallState === "installing" ? progressTitle
				: effectiveInstallState === "installed"
					? updating
						? installState === "installed" ? t("update.updated", { version: plugin.version }) : t("update.action", { version: plugin.version })
						: installedLabel
					: effectiveInstallState === "invalid" ? t("install.notBundle")
						: effectiveInstallState === "failed" ? t(updating ? "update.retry" : "install.retry")
							: t("install");
			const installIcon = effectiveInstallState === "installing" ? h(StateDot, { state: "ongoing", size: 16 })
				: effectiveInstallState === "failed" || effectiveInstallState === "invalid" ? h(IconWarningOutlineRegular, { size: 16 })
					: updating && installState !== "installed" ? h(IconRefreshOutlineRegular, { size: 16 })
						: effectiveInstallState === "installed" ? h(IconCheckOutlineRegular, { size: 16 })
							: h(IconDownloadOutlineRegular, { size: 16 });
			const actionDisabled = operationsDisabled || effectiveInstallState === "installing" || effectiveInstallState === "invalid"
				|| installState === "installed" || (Boolean(installedBundle) && !updateAvailable);

			return hs("article", { className: "pm-card", children: [
				hs("div", { className: "pm-card-top", children: [
					hs("div", { className: "pm-card-main", children: [
						hs("div", { className: "pm-card-titleline", children: [
							!embeddedInstalled ? (
								plugin.identity?.package
									? h(ExternalLink, { href: npmPackageUrl(plugin.identity.package), className: "pm-plugin-name pm-link", title: plugin.identity.package, children: plugin.name })
									: plugin.identity?.repository
										? h(ExternalLink, { href: plugin.identity.repository, className: "pm-plugin-name pm-link", title: plugin.identity.repository, children: plugin.name })
										: h("span", { className: "pm-plugin-name", children: plugin.name })
							) : null,
							plugin.version ? h("span", { className: "pm-version", children: embeddedInstalled ? t("installed.registryVersion", { version: plugin.version }) : plugin.version }) : null,
							plugin.evidence?.releaseChannel ? h(Tag, { className: "pm-channel", tone: plugin.evidence.releaseChannel === "stable" ? "success" : "warning", children: releaseChannelLabel(plugin.evidence.releaseChannel) }) : null,
						] }),
						hs("div", { className: "pm-card-stats", children: [
							hs("span", { className: "pm-signal", title: "GitHub stars", children: [h("span", { className: "pm-star-icon", children: "★" }), h("span", { children: plugin.evidence?.stars === undefined ? "—" : compactNumber(plugin.evidence.stars) })] }),
							hs("span", { className: "pm-signal", title: "npm downloads in the last 30 days", children: [h(IconDownloadOutlineRegular, { size: 13 }), h("span", { children: `${compactNumber(plugin.evidence?.downloads30d ?? 0)} / 30d` })] }),
							freshnessLabel ? hs("span", { className: "pm-signal", title: freshnessDate, children: [h(IconClockOutlineRegular, { size: 13 }), h("span", { children: freshnessLabel })] }) : null,
							plugin.evidence?.rating !== undefined ? hs("span", { className: "pm-signal", title: plugin.evidence.ratingCount !== undefined ? `${plugin.evidence.ratingCount} ratings` : "Source rating", children: [h("span", { className: "pm-star-icon", children: "★" }), h("span", { children: `${plugin.evidence.rating.toFixed(1)}${plugin.evidence.ratingCount !== undefined ? ` (${compactNumber(plugin.evidence.ratingCount)})` : ""}` })] }) : null,
						] }),
					] }),
					!embeddedInstalled && installAllowed ? hs("div", { className: "pm-card-install-actions", children: [
						h(IconAction, { className: "pm-card-install", variant: "outline", label: installTitle, "data-state": updating ? "update" : effectiveInstallState, disabled: actionDisabled, onClick: install, icon: installIcon }),
						canCancelInstall ? h(IconAction, { className: "pm-card-cancel", variant: "outline", label: t(updating ? "update.cancelActive" : "install.cancelActive"), onClick: () => { void cancelInstall(); }, icon: h(IconCloseOutlineRegular, { size: 14 }) }) : null,
					] }) : null,
				] }),
				!embeddedInstalled && plugin.description ? h(ClampedDescription, { text: plugin.description, t, onExpand: loadDetails }) : null,
				hs("div", { className: "pm-card-meta", children: [
					effectiveInstallState === "installed" && (!embeddedInstalled || (installedVersion && installedVersion !== plugin.version))
						? h(Tag, { className: "pm-bundle-state", tone: updateAvailable ? "warning" : "success", title: installedLabel, children: installedLabel })
						: null,
					...sources.map((source) => h(Tag, { className: "pm-badge", tone: "outline", children: source.name }, source.id)),
					...(plugin.tags ?? []).map((tag) => h(Tag, { className: "pm-tag", tone: "neutral", children: tag }, tag)),
					requiresVerification ? h(Tag, { className: "pm-bundle-state", tone: installability === "bundle" ? "success" : installability === "not-bundle" ? "danger" : "warning", title: bundleLabel, children: bundleLabel }) : null,
					h(Pill, { className: "pm-compat pm-compat-button", "data-status": compatibilityStatus ?? "unknown", title: compatibilityTitle, onClick: () => { void loadDetails(); }, children: compatibilityLabel }),
					detailsState.data?.deprecated ? h(Tag, { className: "pm-compat pm-deprecated", tone: "danger", title: detailsState.data.deprecated, children: t("deprecated") }) : null,
				] }),
				plugin.identity?.repository ? h(ExternalLink, { href: plugin.identity.repository, className: "pm-repo-link pm-link", title: plugin.identity.repository, children: plugin.identity.repository }) : null,
				dshPeers.length && detailsState.status === "ready" ? h("div", { className: "pm-source-meta", children: `DSH API: ${dshPeers.map((peer) => `${peer.dependency} ${peer.range}`).join("; ")}` }) : null,
				!embeddedInstalled && command && installAllowed ? hs("div", { className: "pm-command-row", children: [
					h("code", { className: "pm-command", children: command }),
					h(IconAction, { className: "pm-icon-btn", label: copyState === "ok" ? t("copied") : t("copy"), onClick: copy, icon: copyState === "ok" ? h(IconCheckOutlineRegular, { size: 16 }) : h(IconCopyOutlineRegular, { size: 16 }) }),
				] }) : null,
				installState === "failed" ? h("div", { className: "pm-install-status", title: installError, children: `${t(updating ? "update.failed" : "install.failed")}: ${installError}` }) : null,
				installState === "installing" && installError ? h("div", { className: "pm-install-status", title: installError, children: installError }) : null,
				installState === "invalid" ? h("div", { className: "pm-install-status", title: installError, children: `${t("install.notBundle")}: ${installError}` }) : null,
				h("span", { role: "status", "aria-live": "polite", className: "pm-sr-only", children: copyState === "ok" ? t("copied") : copyState === "error" ? t("copy.failed") : installTitle }),
			] });
		}

		function CompactFilter({ id, icon, label, value, onChange, items, active = false }) {
			const [open, setOpen] = react.useState(false);
			const selectedId = String(value);
			const selected = items.find((item) => String(item.id) === selectedId) ?? items[0];
			return h(Menu, {
				open,
				compact: true,
				align: "start",
				portal: true,
				selectedId,
				items,
				onClose: () => setOpen(false),
				onSelect: (next) => { setOpen(false); onChange(next); },
				anchor: hs("button", {
					id,
					type: "button",
					className: "pm-compact-filter",
					"data-active": active,
					title: label,
					"aria-label": label,
					"aria-haspopup": "menu",
					"aria-expanded": open,
					onClick: () => setOpen((current) => !current),
					children: [
						h("span", { className: "pm-compact-filter-icon", children: icon }),
						h("span", { className: "pm-compact-filter-label", children: selected?.label ?? selectedId }),
						h(IconChevronDownOutlineRegular, { size: 12 }),
					],
				}),
			});
		}

		function BrowseView({ t, state, query, setQuery, refresh, sorts, setSorts, stableOnly, setStableOnly, freshnessDays, setFreshnessDays, tag, setTag, dshMetadata, setDshMetadata, page, setPage, pageSize, setPageSize, bundles }) {
			const plugins = state.data?.plugins ?? [];
			const total = state.data?.total ?? 0;
			const pageCount = state.data?.pageCount ?? 1;
			const currentPage = state.data?.page ?? page;
			const sourceRows = Array.isArray(state.data?.sources) ? state.data.sources : [];
			const githubSourceRow = sourceRows.find((row) => (row?.type ?? row?.source?.type) === "github");
			const githubSourceValue = githubSourceRow?.source ?? githubSourceRow;
			const githubSource = githubSourceValue ? {
				id: githubSourceValue.id,
				name: githubSourceValue.name ?? "GitHub",
				type: "github",
				...(githubSourceValue.url ? { url: githubSourceValue.url } : {}),
			} : undefined;
			const [starEvidence, setStarEvidence] = react.useState({});
			const visiblePlugins = rankVisiblePlugins(plugins, query, sorts);
			const starSignature = plugins.map((plugin) => `${repositoryEvidenceKey(plugin.identity?.repository)}:${plugin.evidence?.stars ?? ""}:${(plugin.sources ?? []).some((source) => source.type === "github") ? "github" : ""}`).join("|");
			react.useEffect(() => {
				if (state.loading || !plugins.length || !connection) return undefined;
				const repositories = [...new Set(plugins
					.filter((plugin) => plugin.evidence?.stars === undefined || !(plugin.sources ?? []).some((source) => source.type === "github"))
					.map((plugin) => plugin.identity?.repository)
					.filter((repository) => repositoryEvidenceKey(repository).startsWith("https://github.com/"))
				)].slice(0, 20);
				if (!repositories.length) return undefined;
				const controller = new AbortController();
				rpc("stars", { repositories }, controller.signal).then((rows) => {
					if (!Array.isArray(rows)) return;
					setStarEvidence((current) => {
						const next = { ...current };
						for (const row of rows) {
							const key = repositoryEvidenceKey(row?.repository);
							if (!key) continue;
							next[key] = {
								...(typeof row?.stars === "number" ? { stars: row.stars } : {}),
								...(row?.repositoryUpdatedAt ? { repositoryUpdatedAt: row.repositoryUpdatedAt } : {}),
								discoveryEligible: row?.discoveryEligible === true,
							};
						}
						return next;
					});
				}, () => {});
				return () => controller.abort();
			}, [starSignature]);
			const pluginWithAsyncStars = (plugin) => {
				const asyncEvidence = starEvidence[repositoryEvidenceKey(plugin.identity?.repository)];
				if (!asyncEvidence) return plugin;
				const evidence = {
					...(plugin.evidence ?? {}),
					...(typeof asyncEvidence.stars === "number" ? { stars: asyncEvidence.stars } : {}),
					...(asyncEvidence.repositoryUpdatedAt ? { repositoryUpdatedAt: asyncEvidence.repositoryUpdatedAt } : {}),
				};
				const sources = [...(plugin.sources ?? [])];
				if (asyncEvidence.discoveryEligible && githubSource && !sources.some((source) => source.type === "github")) sources.push(githubSource);
				return { ...plugin, evidence, sources };
			};
			const failedSources = sourceRows.filter((row) => row?.health?.ok === false);
			const hasEnabledSources = sourceRows.length > 0;
			const allSourcesFailed = hasEnabledSources && failedSources.length === sourceRows.length;
			const changeQuery = (value) => { setPage(1); setQuery(value); };
			const changeFreshnessDays = (value) => { setPage(1); setFreshnessDays(Number(value)); };
			const changeTag = (value) => { setPage(1); setTag(value); };
			const changeDshMetadata = (value) => { setPage(1); setDshMetadata(value); };
			const changePageSize = (value) => { setPage(1); setPageSize(Number(value)); };
			const cycleSort = (key) => {
				setPage(1);
				setSorts((current) => {
					const index = current.findIndex((item) => item.key === key);
					if (index < 0) return [...current, { key, direction: "desc" }];
					if (current[index].direction === "desc") return current.map((item, at) => at === index ? { ...item, direction: "asc" } : item);
					return current.filter((_, at) => at !== index);
				});
			};
			const topPager = h(Pagination, { page: currentPage, pageCount, pageSize, setPage, setPageSize: changePageSize, disabled: state.loading, t });
			const bottomPager = h(Pagination, { page: currentPage, pageCount, pageSize, setPage, setPageSize: changePageSize, disabled: state.loading, t, showPageSize: false });
			const controls = hs("div", { className: "pm-controls-row", children: [
				h("button", { type: "button", className: "pm-filter-toggle", "data-active": stableOnly, title: t("browse.stableOnly"), "aria-label": t("browse.stableOnly"), disabled: state.loading, onClick: () => { setPage(1); setStableOnly(!stableOnly); }, children: h(IconShieldOutlineRegular, { size: 14 }) }),
				h(CompactFilter, { id: "pm-freshness", icon: h(IconClockOutlineRegular, { size: 14 }), label: t("browse.freshness"), value: freshnessDays, active: freshnessDays > 0, onChange: changeFreshnessDays, items: [
					{ id: "0", label: t("browse.freshness.any") },
					{ id: "30", label: "30d" },
					{ id: "90", label: "90d" },
					{ id: "365", label: "1y" },
				] }),
				h(CompactFilter, { id: "pm-category", icon: h(IconChecklistOutlineRegular, { size: 14 }), label: t("browse.category"), value: tag, active: Boolean(tag), onChange: changeTag, items: [
					{ id: "", label: t("browse.category.any") },
					...["ui","theme","provider","workflow","integration","tool","automation","schedule","scheduler","skill","bundle","desktop"].map((value) => ({ id: value, label: value })),
				] }),
				h(CompactFilter, { id: "pm-dsh-metadata", icon: h(IconCodeOutlineRegular, { size: 14 }), label: t("browse.dshMetadata"), value: dshMetadata, active: dshMetadata !== "any", onChange: changeDshMetadata, items: [
					{ id: "any", label: "DSH: any" },
					{ id: "declared", label: "DSH: declared" },
					{ id: "unknown", label: "DSH: unknown" },
				] }),
				hs("div", { className: "pm-sort-row", role: "group", "aria-label": t("browse.sort"), children: [
					h(SortCriterion, { criterion: "stars", icon: "★", label: t("browse.sort.stars"), sorts, onCycle: cycleSort, t }),
					h(SortCriterion, { criterion: "downloads", icon: h(IconDownloadOutlineRegular, { size: 14 }), label: t("browse.sort.downloads"), sorts, onCycle: cycleSort, t }),
					h(SortCriterion, { criterion: "freshness", icon: h(IconClockOutlineRegular, { size: 14 }), label: t("browse.sort.freshness"), sorts, onCycle: cycleSort, t }),
					h(SortCriterion, { criterion: "name", icon: "A", label: t("browse.sort.name"), sorts, onCycle: cycleSort, t }),
				] }),
			] });

			let emptyHint = t("browse.emptyHint");
			if (state.data && !hasEnabledSources) emptyHint = t("browse.noSources");
			else if (allSourcesFailed) emptyHint = t("browse.sourcesUnavailable");

			return hs("section", { className: "pm-browse-view", children: [
				hs("form", { className: "pm-toolbar pm-browse-toolbar", onSubmit: (event) => { event.preventDefault(); refresh(); }, children: [
					h(Input, { id: "pm-search", className: "pm-search-native", icon: h(SearchIcon, {}), type: "search", value: query, onChange: (event) => changeQuery(event.target.value), placeholder: t("browse.search"), "aria-label": t("browse.search") }),
					h(IconAction, { type: "submit", className: "pm-refresh-icon pm-browse-refresh", label: t("browse.refresh"), icon: h(IconRefreshOutlineRegular, { size: 16, className: state.loading ? "pm-spin" : undefined }) }),
				] }),
				state.loading ? hs("div", { className: "pm-loading-strip", role: "status", "aria-live": "polite", children: [
					h("span", { className: "pm-loading-spinner", children: h(IconRefreshOutlineRegular, { size: 13, className: "pm-spin" }) }),
					h("span", { children: state.data ? t("browse.updating") : t("browse.loading") }),
					h("span", { className: "pm-loading-track", "aria-hidden": true, children: h("span", { className: "pm-loading-bar" }) }),
				] }) : null,
				state.error ? h("p", { className: "pm-notice pm-notice-error pm-browse-state", role: "alert", children: `${t("browse.error")}: ${state.error}` }) : null,
				state.data ? hs("div", { className: "pm-browse-content", children: [
					hs("div", { className: "pm-browse-topline", children: [
						h("p", { className: "pm-count", children: t("browse.results", { count: total }) }),
						topPager,
					] }),
					controls,
					allSourcesFailed ? failedSources.map((row) => h("p", {
						className: "pm-notice pm-notice-error pm-browse-state",
						children: `${row.name ?? row.id ?? row.source?.name ?? row.source?.id ?? "source"}: ${row.health?.error ?? t("source.error")}`,
					}, row.source?.id ?? row.source?.name)) : null,
					!state.loading && !state.error && plugins.length === 0 ? h(Empty, { title: t("browse.empty"), hint: emptyHint }) : null,
					plugins.length ? h("div", { className: "pm-results", "data-updating": state.loading, children: visiblePlugins.map((plugin) => h(PluginCard, { plugin: pluginWithAsyncStars(plugin), t, bundles }, plugin.identity?.package || plugin.identity?.repository || plugin.identity?.fallback)) }) : null,
					plugins.length ? h("div", { className: "pm-browse-bottomline", children: bottomPager }) : null,
				] }) : null,
			] });
		}

		const BROWSE_PREFERENCES_KEY = "dsh.registry-aggregator.browse.v1";

		function readBrowsePreferences() {
			try {
				const raw = globalThis.localStorage?.getItem?.(BROWSE_PREFERENCES_KEY);
				const value = raw ? JSON.parse(raw) : {};
				if (!value || typeof value !== "object" || Array.isArray(value)) return {};
				const sorts = Array.isArray(value.sorts) ? value.sorts.filter((item, index, rows) =>
					item && ["stars", "downloads", "freshness", "name"].includes(item.key)
					&& ["asc", "desc"].includes(item.direction)
					&& rows.findIndex((row) => row?.key === item.key) === index
				).slice(0, 4) : [];
				return {
					tab: value.tab === "browse" ? "browse" : "sources",
					query: typeof value.query === "string" ? value.query.slice(0, 200) : "",
					sorts,
					stableOnly: value.stableOnly === true,
					freshnessDays: [0, 30, 90, 365].includes(value.freshnessDays) ? value.freshnessDays : 0,
					tag: ["", "ui", "theme", "provider", "workflow", "integration", "tool", "automation", "schedule", "scheduler", "skill", "bundle", "desktop"].includes(value.tag) ? value.tag : "",
					dshMetadata: ["any", "declared", "unknown"].includes(value.dshMetadata) ? value.dshMetadata : "any",
					pageSize: [20, 50, 100].includes(value.pageSize) ? value.pageSize : 20,
				};
			} catch {
				return {};
			}
		}

		function writeBrowsePreferences(value) {
			try {
				globalThis.localStorage?.setItem?.(BROWSE_PREFERENCES_KEY, JSON.stringify(value));
			} catch {}
		}

		const PLUGIN_SECTION_TAB_KEY = "dsh.registry-aggregator.plugin-section.v1";
		function readPluginSectionTab() {
			try {
				const value = globalThis.localStorage?.getItem?.(PLUGIN_SECTION_TAB_KEY);
				return ["sources", "browse", "updates"].includes(value) ? value : "browse";
			} catch {
				return "browse";
			}
		}
		function writePluginSectionTab(value) {
			try { globalThis.localStorage?.setItem?.(PLUGIN_SECTION_TAB_KEY, value); } catch {}
		}

		function RegistryUpdatesTab({ t, setBadge }) {
			const [state, setState] = react.useState({ loading: true, data: [], bundles: [], error: undefined });
			const [revision, setRevision] = react.useState(0);
			const [bulkControl] = react.useState(() => ({ running: false, cancelRequested: false, requestId: undefined }));
			const [bulk, setBulk] = react.useState({ state: "idle", index: 0, total: 0, current: "", phase: "idle", error: "" });
			const bulkBusy = bulk.state === "running" || bulk.state === "cancelling";
			react.useEffect(() => {
				setBadge?.(state.loading || state.error ? undefined : state.data.length || undefined);
			}, [state.loading, state.error, state.data.length, setBadge]);
			react.useEffect(() => {
				if (typeof remote?.$on !== "function") return undefined;
				const dispose = remote.$on("plugin-manager/changed", () => {
					invalidateInstalledRegistrySnapshot();
					if (!bulkControl.running) setRevision((value) => value + 1);
				});
				return typeof dispose === "function" ? dispose : undefined;
			}, []);
			react.useEffect(() => {
				if (!connection || typeof remote?.pluginManager?.listBundles !== "function") return undefined;
				let active = true;
				setState((current) => ({ ...current, loading: true, error: undefined }));
				loadInstalledRegistrySnapshot({ force: revision > 0 }).then((snapshot) => {
					if (!active) return;
					const updates = [...snapshot.updates].sort((left, right) => String(left.name ?? "").localeCompare(String(right.name ?? "")));
					setState({ loading: false, data: updates, bundles: snapshot.bundles, error: undefined });
				}, (error) => {
					if (!active) return;
					setState({ loading: false, data: [], bundles: [], error: String(error?.message ?? error) });
				});
				return () => { active = false; };
			}, [revision]);

			const updateAll = async () => {
				if (bulkControl.running || state.data.length === 0) return;
				const queue = [...state.data];
				bulkControl.running = true;
				bulkControl.cancelRequested = false;
				bulkControl.requestId = undefined;
				const failures = [];
				setBulk({ state: "running", index: 0, total: queue.length, current: "", phase: "starting", error: "" });
				try {
					for (let index = 0; index < queue.length; index += 1) {
						if (bulkControl.cancelRequested) break;
						const plugin = queue[index];
						const packageName = plugin.identity?.package;
						const bundle = packageName ? state.bundles.find((candidate) => candidate?.name === packageName) : undefined;
						const spec = plugin.install?.spec || "";
						if (!spec || !bundle) {
							failures.push(`${packageName || plugin.name || "plugin"}: ${t("update.unavailable")}`);
							continue;
						}
						setBulk({ state: "running", index: index + 1, total: queue.length, current: packageName || plugin.name || spec, phase: "starting", error: "" });
						try {
							const outcome = await runBundleMutation({
								spec,
								mode: "update",
								enabled: bundle.enabled !== false,
								t,
								onProgress: (progress) => {
									if (progress.requestId) bulkControl.requestId = progress.requestId;
									setBulk((current) => ({ ...current, phase: progress.phase ?? current.phase }));
								},
							});
							if (outcome.status === "cancelled") {
								bulkControl.cancelRequested = true;
								break;
							}
						} catch (error) {
							failures.push(`${packageName || plugin.name || spec}: ${String(error?.message ?? error)}`);
						} finally {
							bulkControl.requestId = undefined;
						}
					}
				} finally {
					const cancelled = bulkControl.cancelRequested;
					bulkControl.running = false;
					bulkControl.requestId = undefined;
					invalidateInstalledRegistrySnapshot();
					setRevision((value) => value + 1);
					setBulk({
						state: cancelled ? "cancelled" : failures.length ? "failed" : "done",
						index: 0,
						total: queue.length,
						current: "",
						phase: "idle",
						error: failures.join("\n"),
					});
				}
			};

			const cancelAll = async () => {
				if (!bulkControl.running) return;
				bulkControl.cancelRequested = true;
				setBulk((current) => ({ ...current, state: "cancelling" }));
				const requestId = bulkControl.requestId;
				if (!requestId) return;
				try {
					const result = await cancelBundleMutation(requestId, t);
					if (result?.status === "too-late") setBulk((current) => ({ ...current, phase: "applying" }));
				} catch (error) {
					setBulk((current) => ({ ...current, error: String(error?.message ?? error) }));
				}
			};

			if (state.loading && !bulkBusy) return h("div", { className: "pm-root pm-root-embedded", children: h("section", { className: "pm-shell", children: h(Empty, { title: t("updates.loading") }) }) });
			if (state.error && !bulkBusy) return h("div", { className: "pm-root pm-root-embedded", children: h("section", { className: "pm-shell", children: h(Empty, { title: t("updates.error"), hint: state.error }) }) });
			const bulkStatus = bulk.state === "cancelling" ? t("update.cancelAllStopping")
				: bulk.state === "running"
					? bulk.phase === "applying"
						? t("update.allApplying", { index: bulk.index, total: bulk.total })
						: t("update.allProgress", { index: bulk.index, total: bulk.total })
					: "";
			return h("div", { className: "pm-root pm-root-embedded", children: hs("section", { className: "pm-shell", children: [
				hs("div", { className: "pm-updates-head", children: [
					h("div", { className: "pm-updates-title", children: t("updates.title") }),
					hs("div", { className: "pm-updates-actions", children: [
						h("div", { className: "pm-updates-count", children: t("updates.count", { count: state.data.length }) }),
						state.data.length && !bulkBusy ? h("button", {
							type: "button",
							className: "pm-btn pm-update-all",
							onClick: () => { void updateAll(); },
							children: hs("span", { className: "pm-update-button-content", children: [h(IconRefreshOutlineRegular, { size: 14 }), h("span", { children: t("update.all") })] }),
						}) : null,
						bulkBusy ? h("span", { className: "pm-updates-progress", role: "status", children: bulkStatus }) : null,
						bulkBusy ? h("button", {
							type: "button",
							className: "pm-btn pm-btn-danger pm-update-all-cancel",
							onClick: () => { void cancelAll(); },
							children: hs("span", { className: "pm-update-button-content", children: [h(IconCloseOutlineRegular, { size: 13 }), h("span", { children: t("update.cancelAll") })] }),
						}) : null,
					] }),
				] }),
				bulk.error ? h("div", { className: "pm-install-status pm-update-all-error", title: bulk.error, children: `${t("update.failed")}: ${bulk.error}` }) : null,
				state.data.length
					? h("div", { className: "pm-results", children: state.data.map((plugin) => h(PluginCard, { plugin, t, bundles: state.bundles, operationsDisabled: bulkBusy }, plugin.identity?.package || plugin.identity?.repository || plugin.identity?.fallback)) })
					: h(Empty, { title: t("updates.empty") }),
			] }) });
		}

		function RegistryPluginListSection({ t }) {
			const [tab, setTab] = react.useState(() => readPluginSectionTab());
			const [updatesBadge, setUpdatesBadge] = react.useState(undefined);
			const select = (next) => {
				setTab(next);
				writePluginSectionTab(next);
			};
			const tabButton = (id, label, badge) => h("button", {
				type: "button",
				className: "pm-native-section-tab",
				"data-active": tab === id,
				"aria-pressed": tab === id,
				onClick: () => select(id),
				children: hs("span", { children: [
					h("span", { children: label }),
					badge ? h("span", { className: "pm-native-section-badge", children: badge }) : null,
				] }),
			}, id);
			const body = tab === "sources"
				? h(PluginSourcesSection, { t, forcedTab: "sources" })
				: tab === "updates"
					? h(RegistryUpdatesTab, { t, setBadge: setUpdatesBadge })
					: h(PluginSourcesSection, { t, forcedTab: "browse" });
			return hs("section", { className: "pm-native-section", "data-registry-aggregator-list-section": true, children: [
				hs("div", { className: "pm-native-section-head", children: [
					h("div", { className: "pm-native-section-title", children: t("section.registry") }),
					hs("div", { className: "pm-native-section-tabs", role: "tablist", children: [
						tabButton("sources", t("tab.sources")),
						tabButton("browse", t("tab.browse")),
						tabButton("updates", t("tab.updates"), updatesBadge),
					] }),
				] }),
				h("div", { className: "pm-native-section-body", children: body }),
			] });
		}

		function PluginSourcesSection({ t, forcedTab }) {
			const bound = configForm;
			const [snapshot, setSnapshot] = react.useState(() => bound?.getSnapshot?.());
			const [initialPreferences] = react.useState(() => readBrowsePreferences());
			const [tab, setTab] = react.useState(initialPreferences.tab ?? "sources");
			const activeTab = forcedTab ?? tab;
			const [query, setQuery] = react.useState(initialPreferences.query ?? "");
			const [busy, setBusy] = react.useState(false);
			const [healthState, setHealthState] = react.useState({ loading: false });
			const [countMap, setCountMap] = react.useState({});
			const [countsLoading, setCountsLoading] = react.useState(false);
			const [browseState, setBrowseState] = react.useState({ loading: false });
			const [bundleState, setBundleState] = react.useState({ loading: false, data: [] });
			const [bundleRevision, setBundleRevision] = react.useState(0);
			const [browseRevision, setBrowseRevision] = react.useState(0);
			const [sorts, setSorts] = react.useState(initialPreferences.sorts ?? []);
			const [stableOnly, setStableOnly] = react.useState(initialPreferences.stableOnly ?? false);
			const [freshnessDays, setFreshnessDays] = react.useState(initialPreferences.freshnessDays ?? 0);
			const [tag, setTag] = react.useState(initialPreferences.tag ?? "");
			const [dshMetadata, setDshMetadata] = react.useState(initialPreferences.dshMetadata ?? "any");
			const [page, setPage] = react.useState(1);
			const [pageSize, setPageSize] = react.useState(initialPreferences.pageSize ?? 20);
			const [defaultsMigrating, setDefaultsMigrating] = react.useState(false);
			const [healthRevision, setHealthRevision] = react.useState(0);
			const [connectionRevision, setConnectionRevision] = react.useState(0);
			react.useEffect(() => bound?.subscribe?.(() => setSnapshot(bound.getSnapshot())), [bound]);
			react.useEffect(() => {
				writeBrowsePreferences({ tab: forcedTab ?? tab, query, sorts, stableOnly, freshnessDays, tag, dshMetadata, pageSize });
			}, [forcedTab, tab, query, JSON.stringify(sorts), stableOnly, freshnessDays, tag, dshMetadata, pageSize]);
			react.useEffect(() => {
				const listener = () => setConnectionRevision((value) => value + 1);
				connectionResetListeners.add(listener);
				return () => connectionResetListeners.delete(listener);
			}, []);
			react.useEffect(() => {
				if (typeof remote?.$on !== "function") return undefined;
				const dispose = remote.$on("plugin-manager/changed", () => setBundleRevision((value) => value + 1));
				return typeof dispose === "function" ? dispose : undefined;
			}, []);
			const sources = Array.isArray(snapshot?.value?.sources) ? snapshot.value.sources : [];
			const signature = JSON.stringify(sources);
			const writable = snapshot?.writable === true;
			const sourceDefaultsVersion = Number(snapshot?.value?.sourceDefaultsVersion ?? 0);
			const saveSources = async (next) => { if (!bound || !writable) return; setBusy(true); try { await bound.set("sources", next); } finally { setBusy(false); } };

			react.useEffect(() => {
				if (!bound || !writable || defaultsMigrating || sourceDefaultsVersion >= 2) return undefined;
				setDefaultsMigrating(true);
				const next = [...sources];
				if (!next.some((source) => source.type === "npm")) next.push({ id: "npm", name: "npm", type: "npm", enabled: true });
				if (!next.some((source) => source.type === "github")) next.push({ id: "github", name: "GitHub", type: "github", enabled: true });
				Promise.resolve(next.length === sources.length ? undefined : bound.set("sources", next))
					.then(() => bound.set("sourceDefaultsVersion", 2))
					.finally(() => setDefaultsMigrating(false));
				return undefined;
			}, [bound, writable, defaultsMigrating, sourceDefaultsVersion, signature]);

			react.useEffect(() => {
				if (activeTab !== "sources" || !connection) return undefined;
				const controller = new AbortController();
				setHealthState({ loading: true });
				rpc("browse", { healthOnly: true }, controller.signal).then((data) => setHealthState({ loading: false, data }), (error) => { if (error?.name !== "AbortError") setHealthState({ loading: false, error: String(error?.message ?? error) }); });
				return () => controller.abort();
			}, [activeTab, signature, healthRevision, connectionRevision]);

			react.useEffect(() => {
				if (activeTab !== "browse" || typeof remote?.pluginManager?.listBundles !== "function") return undefined;
				let disposed = false;
				setBundleState((current) => ({ ...current, loading: true, error: undefined }));
				Promise.resolve(remote.pluginManager.listBundles()).then(
					(result) => {
						if (disposed) return;
						if (!result?.ok) {
							setBundleState({ loading: false, data: [], error: String(result?.error?.message ?? t("browse.error")) });
							return;
						}
						setBundleState({ loading: false, data: Array.isArray(result.value) ? result.value : [] });
					},
					(error) => { if (!disposed) setBundleState({ loading: false, data: [], error: String(error?.message ?? error) }); },
				);
				return () => { disposed = true; };
			}, [activeTab, connectionRevision, bundleRevision]);

			react.useEffect(() => {
				if (activeTab !== "sources" || !connection || healthState.loading || !healthState.data) return undefined;
				const healthRows = healthState.data.sources ?? [];
				const healthyIds = new Set(healthRows.filter((row) => row?.health?.ok === true).map((row) => row.source?.id).filter(Boolean));
				const targets = sources.filter((source) => source.enabled !== false && healthyIds.has(source.id));
				if (!targets.length) { setCountsLoading(false); return undefined; }
				const controller = new AbortController();
				let active = true;
				setCountsLoading(true);
				setCountMap((current) => {
					const next = { ...current };
					for (const source of targets) next[source.id] = { ...(next[source.id] ?? {}), loading: true, error: undefined };
					return next;
				});
				let pending = targets.length;
				for (const source of targets) {
					rpc("counts", { sourceId: source.id }, controller.signal).then((data) => {
						if (!active) return;
						const row = data?.sources?.[0];
						setCountMap((current) => ({ ...current, [source.id]: row ? { ...row, loading: false } : { source, loading: false, error: "source count unavailable" } }));
					}, (error) => {
						if (!active || error?.name === "AbortError") return;
						setCountMap((current) => ({ ...current, [source.id]: { source, loading: false, error: String(error?.message ?? error) } }));
					}).finally(() => {
						if (!active) return;
						pending -= 1;
						if (pending === 0) setCountsLoading(false);
					});
				}
				return () => { active = false; controller.abort(); setCountsLoading(false); };
			}, [activeTab, signature, healthRevision, connectionRevision, healthState.loading, healthState.data]);

			react.useEffect(() => {
				if (activeTab !== "browse" || !connection) return undefined;
				const controller = new AbortController();
				const timer = setTimeout(() => {
					setBrowseState((current) => ({ ...current, loading: true, error: undefined }));
					rpc("browse", { query, page, pageSize, sorts, stableOnly, freshnessDays, tag, dshMetadata, refreshRevision: browseRevision }, controller.signal).then((data) => {
						if (data?.page && data.page !== page) setPage(data.page);
						setBrowseState({ loading: false, data });
					}, (error) => { if (error?.name !== "AbortError") setBrowseState({ loading: false, error: String(error?.message ?? error) }); });
				}, 220);
				return () => { clearTimeout(timer); controller.abort(); };
			}, [activeTab, query, page, pageSize, JSON.stringify(sorts), stableOnly, freshnessDays, tag, dshMetadata, signature, browseRevision, connectionRevision]);

			if (!snapshot || snapshot.status === "unavailable") return h("div", { className: `pm-root ${forcedTab ? "pm-root-embedded" : ""}`, children: h("div", { className: "pm-shell", children: h(Empty, { title: t("unavailable"), hint: "registry-aggregator" }) }) });
			const content = activeTab === "sources"
				? h(SourcesView, { t, sources, writable, saveSources, busy, healthState, countMap, countsLoading, refreshHealth: () => setHealthRevision((value) => value + 1) })
				: h(BrowseView, { t, state: browseState, query, setQuery, refresh: () => setBrowseRevision((value) => value + 1), sorts, setSorts, stableOnly, setStableOnly, freshnessDays, setFreshnessDays, tag, setTag, dshMetadata, setDshMetadata, page, setPage, pageSize, setPageSize, bundles: bundleState.data ?? [] });
			if (forcedTab) return h("div", { className: "pm-root pm-root-embedded", children: h("section", { className: "pm-shell", children: content }) });
			const selectTab = (next) => { setTab(next); queueMicrotask(() => window.document.getElementById?.(`pm-tab-${next}`)?.focus?.()); };
			const tabKey = (event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); selectTab(tab === "sources" ? "browse" : "sources"); } };
			return h("div", { className: "pm-root", children: hs("section", { className: "pm-shell", "aria-labelledby": "pm-title", children: [
				h("p", { className: "pm-kicker", children: t("kicker") }), h("h2", { id: "pm-title", className: "pm-title", children: t("title") }), h("p", { className: "pm-lead", children: t("lead") }),
				hs("div", { className: "pm-tabs", role: "tablist", "aria-label": t("title"), children: [h("button", { id: "pm-tab-sources", type: "button", className: "pm-tab", role: "tab", tabIndex: tab === "sources" ? 0 : -1, "aria-controls": "pm-panel-sources", "aria-selected": tab === "sources", "data-active": tab === "sources", onKeyDown: tabKey, onClick: () => selectTab("sources"), children: hs("span", { className: "pm-tab-content", children: [h(DatabaseIcon, {}), h("span", { children: t("tab.sources") })] }) }), h("button", { id: "pm-tab-browse", type: "button", className: "pm-tab", role: "tab", tabIndex: tab === "browse" ? 0 : -1, "aria-controls": "pm-panel-browse", "aria-selected": tab === "browse", "data-active": tab === "browse", onKeyDown: tabKey, onClick: () => selectTab("browse"), children: hs("span", { className: "pm-tab-content", children: [h(GridIcon, {}), h("span", { children: t("tab.browse") })] }) })] }),
				h("div", { id: `pm-panel-${tab}`, role: "tabpanel", "aria-labelledby": `pm-tab-${tab}`, children: content }),
			] }) });
		}

		function RegistryAggregatorActivation({ onDismiss, onOpenDetails, t }) {
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

		function InstalledUpdateAction({ plugin, bundle, t }) {
			const [state, setState] = react.useState("idle");
			const [error, setError] = react.useState("");
			const [progress, setProgress] = react.useState({ phase: "idle", activity: 0 });
			const spec = plugin?.install?.spec || "";
			const run = async (event) => {
				event?.preventDefault?.();
				event?.stopPropagation?.();
				if (!spec || state === "running" || state === "done") return;
				setState("running");
				setError("");
				setProgress({ phase: "starting", activity: 0 });
				try {
					const outcome = await runBundleMutation({
						spec,
						mode: "update",
						enabled: bundle?.enabled !== false,
						t,
						onProgress: (next) => setProgress((current) => ({
							...current,
							...next,
							activity: next.activity ?? ((current.activity ?? 0) + (next.activityDelta ?? 0)),
						})),
					});
					if (outcome.status === "cancelled") {
						setState("idle");
						setProgress({ phase: "idle", activity: 0 });
						return;
					}
					setState("done");
				} catch (reason) {
					setState("failed");
					setProgress((current) => ({ ...current, phase: "failed" }));
					setError(String(reason?.message ?? reason));
				}
			};
			const cancel = async (event) => {
				event?.preventDefault?.();
				event?.stopPropagation?.();
				if (!progress.requestId || state !== "running" || ["applying", "cancelling"].includes(progress.phase)) return;
				setProgress((current) => ({ ...current, phase: "cancelling" }));
				try {
					const result = await cancelBundleMutation(progress.requestId, t);
					if (result?.status === "too-late") setProgress((current) => ({ ...current, phase: "applying" }));
				} catch (reason) {
					setProgress((current) => ({ ...current, phase: "installing" }));
					setError(`${t("install.cancelFailed")}: ${String(reason?.message ?? reason)}`);
				}
			};
			const running = state === "running";
			const canCancel = running && Boolean(progress.requestId) && !["applying", "cancelling"].includes(progress.phase)
				&& typeof remote?.pluginManager?.cancelInstall === "function";
			const label = state === "done" ? t("update.updated", { version: plugin.version })
				: state === "failed" ? t("update.retryVersion", { version: plugin.version })
					: running
						? progress.phase === "cancelling" ? t("update.cancelling")
							: progress.phase === "applying" ? t("update.applying")
								: t("update.updatingVersion", { version: plugin.version })
						: t("update.badge", { version: plugin.version });
			const title = error || (state === "done" ? t("update.updated", { version: plugin.version })
				: t("update.available", { installed: bundle?.version ?? "?", available: plugin.version }));
			return hs("div", { className: "pm-installed-update-actions", children: [
				h("button", {
					type: "button",
					className: "pm-installed-update-badge",
					"data-state": state,
					disabled: running || state === "done",
					title,
					"aria-label": label,
					onPointerDown: (event) => event?.stopPropagation?.(),
					onMouseDown: (event) => event?.stopPropagation?.(),
					onClick: (event) => { void run(event); },
					children: hs("span", { className: "pm-installed-update-content", children: [
						running ? h(StateDot, { state: "ongoing", size: 12 }) : state === "failed" ? h(IconWarningOutlineRegular, { size: 12 }) : state === "done" ? h(IconCheckOutlineRegular, { size: 12 }) : h(IconRefreshOutlineRegular, { size: 12 }),
						h("span", { children: label }),
					] }),
				}),
				canCancel ? h("button", {
					type: "button",
					className: "pm-installed-update-cancel",
					title: t("update.cancelActive"),
					"aria-label": t("update.cancelActive"),
					onPointerDown: (event) => event?.stopPropagation?.(),
					onMouseDown: (event) => event?.stopPropagation?.(),
					onClick: (event) => { void cancel(event); },
					children: h(IconCloseOutlineRegular, { size: 12 }),
				}) : null,
			] });
		}

		function InstalledRegistryAddon({ packageName, t }) {
			const [open, setOpen] = react.useState(false);
			const [revision, setRevision] = react.useState(0);
			const [lookup, setLookup] = react.useState({
				status: "loading",
				bundle: { name: packageName },
				plugin: undefined,
				lookupError: undefined,
				debug: { rpc: "installed", attempt: 0, query: packageName, pluginCount: 0, errors: [] },
			});

			react.useEffect(() => {
				const bump = () => setRevision((value) => value + 1);
				connectionResetListeners.add(bump);
				const disposeConfig = configForm?.subscribe?.(bump);
				const disposePlugin = typeof remote?.$on === "function" ? remote.$on("plugin-manager/changed", bump) : undefined;
				return () => {
					connectionResetListeners.delete(bump);
					if (typeof disposeConfig === "function") disposeConfig();
					if (typeof disposePlugin === "function") disposePlugin();
				};
			}, [packageName]);

			react.useEffect(() => {
				let active = true;
				let timer;
				const load = async (attempt = 0) => {
					if (!active) return;
					setLookup((current) => ({
						...current,
						status: "loading",
						lookupError: undefined,
						debug: { ...(current.debug ?? {}), rpc: "installed", attempt, query: packageName },
					}));

					let bundle = { name: packageName };
					try {
						const result = await remote?.pluginManager?.listBundles?.();
						const match = result?.ok && Array.isArray(result.value)
							? result.value.find((candidate) => candidate?.name === packageName)
							: undefined;
						if (match) bundle = match;
					} catch {}

					let plugin;
					let lookupError;
					let debug = { rpc: "installed", attempt, query: packageName, pluginCount: 0, errors: [] };
					try {
						const resolved = await rpc("installed", { packages: [packageName] });
						const plugins = Array.isArray(resolved?.plugins) ? resolved.plugins : [];
						const errors = Array.isArray(resolved?.errors) ? resolved.errors : [];
						plugin = plugins.find((candidate) => candidate?.identity?.package === packageName);
						const ownError = errors.find((row) => row?.package === packageName)?.error;
						if (!plugin && ownError) lookupError = String(ownError);
						debug = {
							rpc: "installed",
							attempt,
							query: packageName,
							pluginCount: plugins.length,
							pluginPackages: plugins.map((candidate) => candidate?.identity?.package ?? candidate?.name).filter(Boolean).slice(0, 8),
							errors,
						};
					} catch (error) {
						lookupError = String(error?.message ?? error);
						debug = { rpc: "installed", attempt, query: packageName, pluginCount: 0, rpcError: lookupError, errors: [] };
					}

					if (!active) return;
					if (!plugin && attempt < 2) {
						timer = setTimeout(() => { void load(attempt + 1); }, attempt === 0 ? 700 : 1600);
						return;
					}
					setLookup({ status: "ready", bundle, plugin, lookupError, debug });
				};
				void load();
				return () => {
					active = false;
					if (timer) clearTimeout(timer);
				};
			}, [packageName, revision]);

			const plugin = lookup.plugin;
			const loading = lookup.status === "loading";
			const updateAvailable = Boolean(plugin?.version && typeof lookup.bundle?.version === "string"
				&& compareSemver(plugin.version, lookup.bundle.version) === 1);
			const stopNativeOpen = (event) => {
				event?.stopPropagation?.();
			};
			const toggle = (event) => {
				event?.preventDefault?.();
				event?.stopPropagation?.();
				const next = !open;
				setOpen(next);
				if (next && !loading && !plugin) setRevision((value) => value + 1);
			};

			return hs("div", { className: "pm-installed-registry-addon", children: [
				hs("div", { className: "pm-installed-registry-tools", children: [
					loading ? hs("span", { className: "pm-installed-loading", role: "status", title: t("installed.loading"), children: [
						h(StateDot, { state: "ongoing", size: 14 }),
						h("span", { className: "pm-sr-only", children: t("installed.loading") }),
					] }) : null,
					updateAvailable ? h(InstalledUpdateAction, { plugin, bundle: lookup.bundle, t }) : null,
					h("button", {
						type: "button",
						className: "pm-installed-expand",
						"data-open": open,
						"aria-expanded": open,
						title: t(open ? "installed.collapse" : "installed.expand"),
						"aria-label": t(open ? "installed.collapse" : "installed.expand"),
						onPointerDown: stopNativeOpen,
						onPointerUp: stopNativeOpen,
						onMouseDown: stopNativeOpen,
						onClick: toggle,
						children: h(IconChevronDownOutlineRegular, { size: 14 }),
					}),
				] }),
				open ? h("div", { className: "pm-installed-expanded", children: loading
					? hs("div", { className: "pm-installed-expanded-empty", children: [
						h(StateDot, { state: "ongoing", size: 14 }),
						h("span", { children: ` ${t("installed.loading")}` }),
					] })
					: plugin
						? h(PluginCard, { plugin, t, bundles: [lookup.bundle], embeddedInstalled: true })
						: hs("div", { className: "pm-installed-expanded-empty", children: [
							h("div", { children: lookup.lookupError
								? t("installed.registryError", { error: lookup.lookupError })
								: t("installed.registryUnavailable") }),
							h("div", {
								className: "pm-installed-debug",
								children: `${t("installed.debugTitle")}\npackage: ${packageName}\nstate: ${lookup.status}\nrpc: ${lookup.debug?.rpc ?? "installed"}\nattempt: ${lookup.debug?.attempt ?? 0}\nplugins: ${lookup.debug?.pluginCount ?? 0}\nreturned: ${(lookup.debug?.pluginPackages ?? []).join(", ") || "-"}\nerrors: ${JSON.stringify(lookup.debug?.errors ?? [])}${lookup.debug?.rpcError ? `\nrpcError: ${lookup.debug.rpcError}` : ""}`,
							}),
						] }) }) : null,
			] });
		}

		function installPluginManagerDomBridge(ctx) {
			const doc = window.document;
			const Observer = window.MutationObserver;
			if (!doc?.querySelector || typeof Observer !== "function" || typeof createRoot !== "function") return () => {};
			const HOST_ATTR = "data-registry-aggregator-plugin-section";
			const CARD_HOST_ATTR = "data-registry-aggregator-installed-tools";
			let host;
			let root;
			let disposed = false;
			let scheduled = false;
			let generation = 0;
			const cardRoots = new Map();

			const nativeSlotAvailable = () => {
				try { return ctx.slots?.spec?.("plugins.list.section") !== undefined; } catch { return false; }
			};
			const clearCards = () => {
				for (const record of cardRoots.values()) {
					try { record.root?.unmount?.(); } catch {}
					if (record.host?.isConnected) record.host.remove();
				}
				cardRoots.clear();
			};
			const unmount = () => {
				clearCards();
				try { root?.unmount?.(); } catch {}
				root = undefined;
				if (host?.isConnected) host.remove();
				host = undefined;
			};
			const decorateCards = (installed) => {
				const cards = typeof installed.querySelectorAll === "function"
					? [...installed.querySelectorAll("[data-plugin-package]")]
					: [];
				const live = new Set(cards);
				for (const [card, record] of [...cardRoots.entries()]) {
					if (live.has(card) && card.isConnected !== false) continue;
					try { record.root?.unmount?.(); } catch {}
					if (record.host?.isConnected) record.host.remove();
					cardRoots.delete(card);
				}
				for (const card of cards) {
					const packageName = card.getAttribute?.("data-plugin-package");
					if (!packageName) continue;
					let record = cardRoots.get(card);
					if (!record) {
						const cardHost = doc.createElement("div");
						cardHost.className = "pm-installed-registry-host";
						cardHost.setAttribute(CARD_HOST_ATTR, "");
						card.appendChild(cardHost);
						record = { host: cardHost, root: createRoot(cardHost), packageName };
						cardRoots.set(card, record);
						record.root.render(h(InstalledRegistryAddon, { packageName, t: ctx.locale.bind(NS) }));
					} else if (record.packageName !== packageName) {
						record.packageName = packageName;
						record.root.render(h(InstalledRegistryAddon, { packageName, t: ctx.locale.bind(NS) }));
					}
				}
			};
			const reconcile = () => {
				scheduled = false;
				if (disposed) return;
				generation += 1;
				if (nativeSlotAvailable()) {
					unmount();
					return;
				}
				const installed = doc.querySelector('[data-plugin-scope="global"][data-plugin-group="bundles"]');
				if (!installed?.parentElement) {
					unmount();
					return;
				}
				if (!(host?.isConnected && host.previousElementSibling === installed)) {
					try { root?.unmount?.(); } catch {}
					if (host?.isConnected) host.remove();
					host = doc.createElement("div");
					host.setAttribute(HOST_ATTR, "");
					installed.insertAdjacentElement("afterend", host);
					root = createRoot(host);
					root.render(h(RegistryPluginListSection, { t: ctx.locale.bind(NS) }));
				}
				decorateCards(installed);
			};
			const schedule = () => {
				if (disposed || scheduled) return;
				scheduled = true;
				queueMicrotask(reconcile);
			};

			const observer = new Observer(schedule);
			observer.observe(doc.documentElement ?? doc.body, { childList: true, subtree: true });
			schedule();
			const slotChanged = typeof ctx.on === "function" ? ctx.on("slots/changed", schedule) : undefined;
			const pluginChanged = typeof remote?.$on === "function"
				? remote.$on("plugin-manager/changed", () => { invalidateInstalledRegistrySnapshot(); schedule(); })
				: undefined;
			return () => {
				disposed = true;
				generation += 1;
				observer.disconnect();
				if (typeof slotChanged === "function") slotChanged();
				if (typeof pluginChanged === "function") pluginChanged();
				unmount();
			};
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
			ctx.effect(() => installPluginManagerDomBridge(ctx), "plugin-sources: Plugin Manager self-embed");
			// Native Plugin Manager integration is forward-compatible: this additive
			// section activates only on DSH builds that declare plugins.list.section.
			ctx.slots.inject("plugins.list.section", () => ctx.slots.register({ name: "plugins.list.section", id: "registry-aggregator", order: 20, locale: NS }, RegistryPluginListSection));
			// Fallback for current DSH releases that do not yet expose plugins.list.section.
			ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({ name: "plugins.bundle.config", key: "@stolyarovmn/dsh-ui-registry-aggregator", locale: NS }, PluginSourcesSection));
			ctx.slots.inject("plugins.bundle.activation", () => ctx.slots.register({ name: "plugins.bundle.activation", key: "@stolyarovmn/dsh-ui-registry-aggregator", locale: NS }, RegistryAggregatorActivation));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
