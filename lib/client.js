window.__ModuleLoader__.load({
	id: "@stolyarovmn/dsh-ui-registry-aggregator",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const react = require("react");
		const jsxRuntime = require("react/jsx-runtime");
		const {
			Button, Modal, Switch,
			IconPlusOutlineRegular, IconRefreshOutlineRegular, IconChevronDownOutlineRegular,
			IconCopyOutlineRegular, IconShareOutlineRegular, IconTrashOutlineRegular,
			IconDatabaseOutlineRegular, IconCordisPluginOutlineRegular, IconLinkOutlineRegular,
			IconWarningOutlineRegular, IconSearchOutlineRegular, IconClockOutlineRegular,
			IconDownloadOutlineRegular, IconCheckOutlineRegular, IconChevronUpOutlineRegular,
			IconChevronLeftOutlineRegular, IconChevronRightOutlineRegular, IconChevronsUpDownOutlineRegular,
			IconFlatListOutlineRegular,
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
.pm-results{display:grid;gap:9px}.pm-card{position:relative;padding:13px 14px;border:1px solid var(--pm-line);border-radius:9px;background:var(--pm-panel)}.pm-card:hover{border-color:var(--dsw-alias-border-l3)}.pm-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.pm-plugin-name{font-size:14px;font-weight:650;line-height:20px}.pm-link{color:inherit;text-decoration:none}.pm-link:hover{text-decoration:underline}.pm-version{margin-left:7px;color:var(--pm-muted);font:10px ui-monospace,SFMono-Regular,Consolas,monospace}.pm-signal{display:inline-flex;align-items:center;gap:3px;margin-left:7px;color:var(--pm-muted);font:500 10px/1 ui-monospace,SFMono-Regular,Consolas,monospace}.pm-channel{display:inline-flex;align-items:center;height:18px;margin-left:7px;padding:0 6px;border:1px solid var(--pm-line);border-radius:99px;color:var(--dsw-alias-label-secondary);font:600 9px/1 ui-monospace,SFMono-Regular,Consolas,monospace;text-transform:uppercase}.pm-channel-stable{color:#30a46c}.pm-channel-alpha,.pm-channel-beta,.pm-channel-rc,.pm-channel-prerelease{color:#e5a000}.pm-compat{border:1px solid var(--pm-line);border-radius:99px;padding:3px 6px;color:var(--dsw-alias-label-secondary);font:500 9px/1 ui-monospace,SFMono-Regular,Consolas,monospace;background:transparent}.pm-compat-button{cursor:pointer}.pm-compat-button:hover{border-color:var(--dsw-alias-border-l3);color:var(--dsw-alias-label-primary)}.pm-deprecated{color:var(--dsw-alias-state-error,#d44)}.pm-desc{margin:5px 0 3px;color:var(--dsw-alias-label-secondary);line-height:18px}.pm-desc[data-clamped=true]{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.pm-more{border:0;background:transparent;padding:0;color:var(--pm-accent);font:500 11px/16px inherit;cursor:pointer}.pm-card-actions{display:flex;align-items:center;gap:7px;margin-top:10px}.pm-install-button{min-width:76px}.pm-install-status{font-size:11px;color:var(--pm-muted)}.pm-meta{display:flex;flex-wrap:wrap;gap:6px}.pm-tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:7px}.pm-install{display:flex;gap:7px;align-items:center;margin-top:10px}.pm-command{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:7px 9px;border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font:11px ui-monospace,SFMono-Regular,Consolas,monospace}.pm-icon-btn{width:32px;min-width:32px;height:32px;padding:0;display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--pm-line);border-radius:7px;background:var(--pm-panel);color:var(--dsw-alias-label-secondary);cursor:pointer}.pm-icon-btn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}.pm-icon-btn svg{display:block}
.pm-browse-options{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 0 10px;flex-wrap:wrap}.pm-filter-row{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.pm-filter-select{width:auto;min-width:116px;height:30px}.pm-sort{width:auto;min-width:130px;height:30px}.pm-page-size{width:auto;min-width:76px;height:30px}.pm-pagination{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px}.pm-page-controls{display:flex;align-items:center;gap:7px}.pm-page-label{color:var(--pm-muted);font-size:11px}.pm-empty{padding:44px 20px;text-align:center;border:1px dashed var(--pm-line);border-radius:10px;color:var(--pm-muted)}.pm-empty strong{display:block;margin-bottom:5px;color:var(--dsw-alias-label-secondary)}.pm-spin{animation:pm-spin .8s linear infinite}@keyframes pm-spin{to{transform:rotate(360deg)}}@media(max-width:720px){.pm-shell{padding:8px 0 28px}.pm-source-list{grid-template-columns:1fr}.pm-form{grid-template-columns:1fr}.pm-field-url,.pm-add,.pm-options{grid-column:1}.pm-add{justify-self:stretch;width:100%}.pm-source{grid-template-columns:1fr}.pm-source-actions{justify-content:flex-start}.pm-card-head{display:block}.pm-card-head>.pm-btn{margin-top:8px}}

/* Registry Aggregator source layout */
.pm-root{--pm-blue:#5792ff;--pm-green:#2dcc74;--pm-danger:#ff5f66;background:radial-gradient(900px 420px at 50% -180px,color-mix(in srgb,var(--pm-blue) 10%,transparent),transparent 72%),var(--dsw-specific-page,transparent)}
.pm-shell{max-width:1200px;padding:18px 0 34px}
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
			"tab.sources": "Sources", "tab.browse": "Browse", "sources.title": "Connected sources", "sources.add": "Add source", "sources.addTitle": "Add a new source", "sources.addLead": "Connect a package registry to discover and install plugins.", "sources.manage": "Manage your connected registries and discover available plugins.", "sources.empty": "No plugin sources connected", "sources.emptyHint": "Add a catalog, npm registry, or GitHub source to begin.",
			"field.name": "Name", "field.type": "Type", "field.url": "Catalog / API URL", "field.urlHint": "Optional for npm and GitHub", "source.remove": "Remove", "source.share": "Share", "source.shared": "Copied", "source.enabled": "Enabled", "source.disabled": "Disabled", "source.checking": "Checking", "source.online": "Status: online", "source.packages": "{count} packages", "source.ok": "Healthy", "source.error": "Unavailable", "source.duplicate": "A source with this id already exists.", "source.required": "Name is required.", "source.urlRequired": "This source type requires a catalog URL.",
			"activation.title": "Registry Aggregator ready", "activation.body": "npm and GitHub sources are connected by default. Open Registry Aggregator to search them together or add more sources.", "activation.open": "Open Registry Aggregator", "activation.later": "Later",
			"browse.search": "Search plugins, packages, repositories…", "browse.refresh": "Refresh", "browse.pageSize": "Per page", "browse.page": "Page {page} of {pages}", "browse.prev": "Previous", "browse.next": "Next", "browse.freshness": "Freshness", "browse.freshness.any": "Any age", "browse.freshness.30": "≤ 30 days", "browse.freshness.90": "≤ 90 days", "browse.freshness.365": "≤ 1 year", "browse.category": "Category", "browse.category.any": "All categories", "browse.dshMetadata": "DSH metadata", "browse.dshMetadata.any": "Any DSH metadata", "browse.dshMetadata.declared": "DSH declared", "browse.dshMetadata.unknown": "DSH unknown", "install": "Install", "install.confirm": "Install?", "installing": "Installing…", "installed": "Installed", "install.failed": "Install failed", "install.cancel": "Cancel", "description.more": "…", "description.less": "Less", "browse.empty": "No plugins found", "browse.sort": "Sort", "browse.sort.relevance": "Relevance", "browse.sort.stars": "Stars", "browse.sort.downloads": "Downloads", "browse.sort.freshness": "Freshest release", "browse.sort.starsDownloads": "Stars + downloads", "browse.sort.downloadsFreshness": "Downloads + freshness", "browse.sort.name": "Name", "browse.sort.priority": "Sort priority {priority}", "browse.sort.off": "Not active", "browse.sort.asc": "Ascending", "browse.sort.desc": "Descending", "browse.stableOnly": "Stable only", "browse.emptyHint": "Enable a healthy source or try another search.", "browse.loading": "Loading catalogs…", "browse.error": "Catalog request failed", "browse.results": "{count} results", "compat.check": "Check DSH compatibility", "compat.none": "DSH not declared", "compat.loading": "DSH …", "compat.apiPeers": "DSH API peers", "released": "released {age}", "repoUpdated": "repo {age}", "deprecated": "deprecated", "copy": "Copy command", "copied": "Copied", "copy.failed": "Could not copy", "install.warning": "Review the package and source before running this third-party install command.", "readonly": "Settings are read-only.", "unavailable": "Plugin source settings are unavailable.",
		};
		const zh = {
			nav: "插件市场", kicker: "联合注册表", title: "插件市场", lead: "默认即可浏览 npm，也可连接更多可信来源，并通过 DSH 原生插件管理器安装插件。",
			"tab.sources": "来源", "tab.browse": "浏览", "sources.title": "已连接来源", "sources.add": "添加来源", "sources.addTitle": "添加新来源", "sources.addLead": "连接软件包注册表以发现和安装插件。", "sources.manage": "管理已连接的注册表并发现可用插件。", "sources.empty": "尚未连接插件源", "sources.emptyHint": "添加目录、npm 注册表或 GitHub 来源以开始。",
			"field.name": "名称", "field.type": "类型", "field.url": "目录 / API URL", "field.urlHint": "npm 和 GitHub 可选", "source.remove": "移除", "source.share": "分享", "source.shared": "已复制", "source.enabled": "已启用", "source.disabled": "已禁用", "source.checking": "检查中", "source.online": "状态：在线", "source.packages": "{count} 个软件包", "source.ok": "正常", "source.error": "不可用", "source.duplicate": "具有此 ID 的来源已存在。", "source.required": "名称为必填项。", "source.urlRequired": "此来源类型需要目录 URL。",
			"activation.title": "插件市场已就绪", "activation.body": "默认已连接 npm 和 GitHub。打开插件市场即可浏览插件或添加更多来源。", "activation.open": "打开插件市场", "activation.later": "稍后",
			"browse.search": "搜索插件、包、仓库…", "browse.refresh": "刷新", "browse.pageSize": "每页", "browse.page": "第 {page} / {pages} 页", "browse.prev": "上一页", "browse.next": "下一页", "browse.freshness": "新鲜度", "browse.freshness.any": "不限时间", "browse.freshness.30": "≤ 30 天", "browse.freshness.90": "≤ 90 天", "browse.freshness.365": "≤ 1 年", "browse.category": "类别", "browse.category.any": "全部类别", "browse.dshMetadata": "DSH 元数据", "browse.dshMetadata.any": "任意 DSH 元数据", "browse.dshMetadata.declared": "已声明 DSH", "browse.dshMetadata.unknown": "DSH 未知", "install": "安装", "install.confirm": "确认安装？", "installing": "安装中…", "installed": "已安装", "install.failed": "安装失败", "install.cancel": "取消", "description.more": "…", "description.less": "收起", "browse.empty": "未找到插件", "browse.sort": "排序", "browse.sort.relevance": "相关性", "browse.sort.stars": "星标", "browse.sort.downloads": "下载量", "browse.sort.freshness": "最新发布", "browse.sort.starsDownloads": "星标 + 下载量", "browse.sort.downloadsFreshness": "下载量 + 新鲜度", "browse.sort.name": "名称", "browse.sort.priority": "排序优先级 {priority}", "browse.sort.off": "未启用", "browse.sort.asc": "升序", "browse.sort.desc": "降序", "browse.stableOnly": "仅稳定版", "browse.emptyHint": "启用健康的来源或尝试其他搜索。", "browse.loading": "正在加载目录…", "browse.error": "目录请求失败", "browse.results": "{count} 个结果", "compat.check": "检查 DSH 兼容性", "compat.none": "未声明 DSH", "compat.loading": "DSH …", "compat.apiPeers": "DSH API 依赖", "released": "发布 {age}", "repoUpdated": "仓库 {age}", "deprecated": "已弃用", "copy": "复制命令", "copied": "已复制", "copy.failed": "复制失败", "install.warning": "运行此第三方安装命令前，请检查包和来源。", "readonly": "设置为只读。", "unavailable": "插件源设置不可用。", 
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

		function CopyIcon({ done = false }) {
			return done
				? h("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true, children: h("path", { d: "m5 12 4 4L19 6" }) })
				: hs("svg", { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true, children: [h("rect", { x: 9, y: 9, width: 10, height: 10, rx: 2 }), h("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })] });
		}


		function RefreshIcon() { return h(IconRefreshOutlineRegular, { size: 16 }); }
		function PlusIcon() { return h(IconPlusOutlineRegular, { size: 16 }); }
		function NetworkIcon() { return h(IconDatabaseOutlineRegular, { size: 18 }); }
		function ShareIcon() { return h(IconShareOutlineRegular, { size: 16 }); }
		function TrashIcon() { return h(IconTrashOutlineRegular, { size: 16 }); }
		function PackageIcon() {
			return h("svg", { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, children: [
				h("path", { d: "m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" }),
				h("path", { d: "m4 7.5 8 4.5 8-4.5" }),
				h("path", { d: "M12 12v9" })
			] });
		}
		function DatabaseIcon() { return h(IconDatabaseOutlineRegular, { size: 16 }); }
		function GridIcon() { return h(IconCordisPluginOutlineRegular, { size: 16 }); }
		function LinkIcon() { return h(IconLinkOutlineRegular, { size: 16 }); }
		function AlertIcon() { return h(IconWarningOutlineRegular, { size: 16 }); }

		function GitHubMark() {
			return h("svg", { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, children: h("path", { d: "M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1 1.6 1 .9 1.5 2.3 1.1 2.9.8.1-.6.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-4.9 0-1.1.4-2 1-2.6-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 4.9 0c1.9-1.3 2.7-1 2.7-1 .5 1.3.2 2.3.1 2.6.6.7 1 1.5 1 2.6 0 3.8-2.3 4.6-4.6 4.9.4.3.7 1 .7 1.8V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z" }) });
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
					h("button", { type: "button", className: "pm-disclosure", onClick: () => setExpanded((value) => !value), "aria-expanded": expanded, "aria-label": expanded ? "Collapse" : "Expand", children: h(ChevronIcon, { open: expanded }) }),
				] }),
				expanded ? hs("form", { className: "pm-form pm-form-redesign", onSubmit: submit, children: [
					hs("div", { className: "pm-field", children: [
						hs("label", { htmlFor: "pm-name", children: [t("field.name"), h("span", { className: "pm-required", children: "*" })] }),
						h("input", { id: "pm-name", className: "pm-input", value: name, placeholder: "e.g. My Registry", onChange: (event) => { setName(event.target.value); if (error) setError(""); }, disabled: readOnly || busy }),
					] }),
					hs("div", { className: "pm-field", children: [
						h("label", { htmlFor: "pm-type", children: t("field.type") }),
						h("select", { id: "pm-type", className: "pm-select", value: type, onChange: (event) => { setType(event.target.value); if (error) setError(""); }, disabled: readOnly || busy, children: SOURCE_TYPES.map((item) => h("option", { value: item, children: item }, item)) }),
					] }),
					hs("div", { className: "pm-field pm-field-url", children: [
						h("label", { htmlFor: "pm-url", children: t("field.url") }),
						hs("div", { className: "pm-input-wrap", children: [h("span", { className: "pm-input-leading", children: h(LinkIcon, {}) }), h("input", { id: "pm-url", className: "pm-input", type: "url", value: url, placeholder: t("field.urlHint"), onChange: (event) => { setUrl(event.target.value); if (error) setError(""); }, disabled: readOnly || busy })] }),
					] }),
					hs("div", { className: "pm-form-actions", children: [
						h(Button, { variant: "outline", size: "md", type: "button", disabled: readOnly || busy, onClick: reset, children: t("install.cancel") }),
						h(Button, { variant: "primary", size: "md", type: "submit", disabled: readOnly || busy, children: t("sources.add") }),
					] }),
					error ? hs("p", { className: "pm-form-error", role: "alert", children: [h(AlertIcon, {}), h("span", { children: error })] }) : null,
				] }) : null,
			] });
		}

		function ChevronIcon() {
			return h(IconChevronDownOutlineRegular, { size: 14, className: "pm-chevron" });
		}

		function sourceEndpoint(source) {
			if (source.url) return source.url;
			if (source.type === "npm") return "https://registry.npmjs.org";
			if (source.type === "github") return "https://api.github.com";
			return source.id;
		}

		function NpmMark() {
			return h("svg", { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true, children:
				h("path", { d: "M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z" })
			});
		}

		function SourceLogo({ source }) {
			if (source.type === "npm") return h("div", { className: "pm-source-logo pm-source-logo-npm", "aria-hidden": true, children: h(NpmMark, {}) });
			if (source.type === "github") return h("div", { className: "pm-source-logo pm-source-logo-github", "aria-hidden": true, children: h(GitHubMark, {}) });
			return h("div", { className: "pm-source-logo pm-source-logo-generic", "aria-hidden": true, children: h(PackageIcon, {}) });
		}

		function SourceRow({ source, health, t, busy, readOnly, onToggle, onRemove }) {
			const [open, setOpen] = react.useState(true);
			const [shared, setShared] = react.useState(false);
			const [copied, setCopied] = react.useState(false);
			const status = source.enabled === false ? "off" : health?.ok === true ? "ok" : health?.ok === false ? "bad" : "wait";
			const endpoint = sourceEndpoint(source);
			const count = Number.isFinite(health?.count) ? health.count : 0;
			const statusText = status === "off" ? t("source.disabled") : status === "ok" ? t("source.online") : status === "bad" ? t("source.error") : t("source.checking");
			const share = async () => {
				const payload = JSON.stringify({ id: source.id, name: source.name, type: source.type, ...(source.url ? { url: source.url } : {}), enabled: source.enabled !== false }, null, 2);
				try { await globalThis.navigator?.clipboard?.writeText?.(payload); setShared(true); setTimeout(() => setShared(false), 1400); } catch {}
			};
			const copyEndpoint = async () => {
				try { await globalThis.navigator?.clipboard?.writeText?.(endpoint); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch {}
			};
			return hs("article", { className: "pm-source", children: [
				hs("div", { className: "pm-source-head", children: [
					hs("div", { className: "pm-source-main", children: [
						h(SourceLogo, { source }),
						h("div", { className: "pm-source-summary", children: [
							h("div", { className: "pm-source-line", children: h("span", { className: "pm-source-name", children: source.name }) }),
							hs("div", { className: "pm-source-evidence", children: [
								hs("span", { className: "pm-source-evidence-item", children: [h("span", { className: `pm-status pm-status-${status}`, "aria-hidden": true }), h("span", { children: statusText })] }),
								status === "ok" ? h("span", { className: "pm-evidence-separator", "aria-hidden": true }) : null,
								status === "ok" ? hs("span", { className: "pm-source-evidence-item", children: [h(PackageIcon, {}), h("span", { children: t("source.packages", { count }) })] }) : null,
							] }),
						] }),
					] }),
					hs("div", { className: "pm-source-buttons", children: [
						hs("span", { className: "pm-source-switch", children: [
							h(Switch, { checked: source.enabled !== false, disabled: readOnly || busy, label: source.enabled !== false ? t("source.enabled") : t("source.disabled"), onChange: () => onToggle(source.id) }),
							h("span", { children: source.enabled !== false ? t("source.enabled") : t("source.disabled") }),
						] }),
						h("button", { type: "button", className: "pm-source-disclosure", onClick: () => setOpen((value) => !value), "aria-expanded": open, "aria-label": open ? "Collapse source" : "Expand source", children: h(ChevronIcon, { open }) }),
					] }),
				] }),
				open ? hs("div", { className: "pm-source-details", children: [
					h("div", { className: "pm-source-url-label", children: t("field.url") }),
					hs("div", { className: "pm-source-url-wrap", children: [
						h("input", { className: "pm-source-url", value: endpoint, readOnly: true, title: endpoint }),
						h("button", { type: "button", className: "pm-copy-url", onClick: copyEndpoint, title: copied ? t("copied") : t("copy"), "aria-label": copied ? t("copied") : t("copy"), children: copied ? h(IconCopyOutlineRegular, { size: 16 }) : h(IconCopyOutlineRegular, { size: 16 }) }),
					] }),
					health?.error ? h("div", { className: "pm-source-error", title: health.error, children: health.error }) : null,
					hs("div", { className: "pm-source-actions", children: [
						h("button", { type: "button", className: "pm-source-action", onClick: share, title: shared ? t("source.shared") : t("source.share"), "aria-label": shared ? t("source.shared") : t("source.share"), children: shared ? h(IconCopyOutlineRegular, { size: 16 }) : h(ShareIcon, {}) }),
						h("button", { type: "button", className: "pm-source-action pm-source-action-danger", disabled: readOnly || busy, onClick: () => onRemove(source.id), title: t("source.remove"), "aria-label": t("source.remove"), children: h(TrashIcon, {}) }),
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
			return hs("section", { className: "pm-sources-view", children: [
				h(AddSourceForm, { t, sources, onSave: mutate, busy, readOnly: !writable }),
				hs("section", { className: "pm-connected-panel", children: [
					hs("div", { className: "pm-section-head pm-connected-head", children: [
						hs("div", { className: "pm-section-head-main", children: [
							h("div", { children: [h("div", { className: "pm-section-title", children: t("sources.title") }), h("div", { className: "pm-section-lead", children: t("sources.manage") })] }),
						] }),
						h("button", { type: "button", className: "pm-refresh-icon", onClick: refreshHealth, disabled: healthState.loading, title: t("browse.refresh"), "aria-label": t("browse.refresh"), children: h(RefreshIcon, {}) }),
					] }),
					!writable ? h("p", { className: "pm-notice pm-connected-notice", children: t("readonly") }) : null,
					mutationError ? h("p", { className: "pm-notice pm-notice-error pm-connected-notice", role: "alert", children: mutationError }) : null,
					healthState.error ? h("p", { className: "pm-notice pm-notice-error pm-connected-notice", role: "alert", children: healthState.error }) : null,
					sources.length === 0 ? h(Empty, { title: t("sources.empty"), hint: t("sources.emptyHint") }) : h("div", { className: "pm-source-list", children: sources.map((source) => h(SourceRow, { source, health: healthMap[source.id], t, busy, readOnly: !writable, onToggle: (id) => { void mutate(sources.map((row) => row.id === id ? { ...row, enabled: row.enabled === false } : row)); }, onRemove: (id) => { void mutate(sources.filter((row) => row.id !== id)); } }, source.id)) }),
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

		function PluginCard({ plugin, t }) {
			const [copyState, setCopyState] = react.useState("");
			const [expanded, setExpanded] = react.useState(false);
			const [confirmInstall, setConfirmInstall] = react.useState(false);
			const [installState, setInstallState] = react.useState("idle");
			const [installError, setInstallError] = react.useState("");
			const [detailsState, setDetailsState] = react.useState({ status: "idle" });
			const command = installCommand(plugin);
			const spec = plugin.install?.spec || "";
			const declaredCompatibility = plugin.evidence?.dshCompatibility;
			const loadDetails = async () => {
				if (detailsState.status === "loading" || detailsState.status === "ready") return;
				if (!plugin.identity?.package || !plugin.version) return setDetailsState({ status: "ready", data: {} });
				setDetailsState({ status: "loading" });
				try {
					const data = await rpc("details", { package: plugin.identity.package, version: plugin.version });
					setDetailsState({ status: "ready", data: data ?? {} });
				} catch (error) {
					setDetailsState({ status: "error", error: String(error?.message ?? error) });
				}
			};
			const resolvedCompatibility = declaredCompatibility ?? detailsState.data?.dshCompatibility;
			const dshPeers = detailsState.data?.dshPeers ?? [];
			const peerTitle = dshPeers.map((peer) => `${peer.dependency} ${peer.range}`).join("\n");
			const compatibilityLabel = resolvedCompatibility ? `DSH ${resolvedCompatibility}`
				: dshPeers.length ? t("compat.apiPeers")
					: detailsState.status === "loading" ? t("compat.loading")
						: detailsState.status === "ready" ? t("compat.none") : t("compat.check");
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
				hs("div", { className: "pm-card-top", children: [
					hs("div", { className: "pm-card-main", children: [
						hs("div", { className: "pm-card-titleline", children: [
							plugin.identity?.package
								? h(ExternalLink, { href: npmPackageUrl(plugin.identity.package), className: "pm-plugin-name pm-link", title: plugin.identity.package, children: plugin.name })
								: plugin.identity?.repository
									? h(ExternalLink, { href: plugin.identity.repository, className: "pm-plugin-name pm-link", title: plugin.identity.repository, children: plugin.name })
									: h("span", { className: "pm-plugin-name", children: plugin.name }),
							plugin.version ? h("span", { className: "pm-version", children: plugin.version }) : null,
							plugin.evidence?.releaseChannel ? h("span", { className: `pm-channel pm-channel-${plugin.evidence.releaseChannel}`, children: releaseChannelLabel(plugin.evidence.releaseChannel) }) : null,
						] }),
						hs("div", { className: "pm-card-stats", children: [
							h("span", { className: "pm-signal", title: "GitHub stars", children: `★ ${compactNumber(plugin.evidence?.stars ?? 0)}` }),
							h("span", { className: "pm-signal", title: "npm downloads in the last 30 days", children: `↓ ${compactNumber(plugin.evidence?.downloads30d ?? 0)} / 30d` }),
							freshnessLabel ? hs("span", { className: "pm-signal", title: freshnessDate, children: [h(IconClockOutlineRegular, { size: 13 }), h("span", { children: freshnessLabel })] }) : null,
							plugin.evidence?.rating !== undefined ? h("span", { className: "pm-signal", title: plugin.evidence.ratingCount !== undefined ? `${plugin.evidence.ratingCount} ratings` : "Source rating", children: `★ ${plugin.evidence.rating.toFixed(1)}${plugin.evidence.ratingCount !== undefined ? ` (${compactNumber(plugin.evidence.ratingCount)})` : ""}` }) : null,
						] }),
					] }),
				] }),
				plugin.description ? hs("div", { className: "pm-card-description", children: [
					h("p", { className: "pm-desc", "data-clamped": !expanded, children: plugin.description }),
					descriptionLong ? h("button", { type: "button", className: "pm-more", onClick: () => { const next = !expanded; setExpanded(next); if (next) void loadDetails(); }, children: expanded ? t("description.less") : t("description.more") }) : null,
				] }) : null,
				hs("div", { className: "pm-card-meta", children: [
					primarySource ? h("span", { className: "pm-badge", children: primarySource.name }, primarySource.id) : null,
					...(plugin.tags ?? []).map((tag) => h("span", { className: "pm-tag", children: tag }, tag)),
					h("button", { type: "button", className: "pm-compat pm-compat-button", title: resolvedCompatibility ? `DSH ${resolvedCompatibility}` : peerTitle || t("compat.check"), onClick: () => { void loadDetails(); }, children: compatibilityLabel }),
					detailsState.data?.deprecated ? h("span", { className: "pm-compat pm-deprecated", title: detailsState.data.deprecated, children: t("deprecated") }) : null,
				] }),
				plugin.identity?.repository ? h(ExternalLink, { href: plugin.identity.repository, className: "pm-repo-link pm-link", title: plugin.identity.repository, children: plugin.identity.repository }) : null,
				expanded && dshPeers.length && !resolvedCompatibility ? h("div", { className: "pm-source-meta", children: `DSH API: ${dshPeers.map((peer) => `${peer.dependency} ${peer.range}`).join("; ")}` }) : null,
				command ? hs("div", { className: "pm-install-row", children: [
					h("code", { className: "pm-command", children: command }),
					h("button", { type: "button", className: "pm-icon-btn", onClick: copy, title: copyState === "ok" ? t("copied") : t("copy"), "aria-label": copyState === "ok" ? t("copied") : t("copy"), children: h(IconCopyOutlineRegular, { size: 16 }) }),
					h(Button, { variant: "primary", size: "md", disabled: installState === "installing" || installState === "installed", onClick: install, children: installState === "installing" ? t("installing") : installState === "installed" ? t("installed") : confirmInstall ? t("install.confirm") : t("install") }),
					confirmInstall ? h(Button, { variant: "outline", size: "md", onClick: () => setConfirmInstall(false), children: t("install.cancel") }) : null,
				] }) : null,
				installState === "failed" ? h("div", { className: "pm-install-status", title: installError, children: `${t("install.failed")}: ${installError}` }) : null,
				h("span", { role: "status", "aria-live": "polite", style: { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }, children: copyState === "ok" ? t("copied") : copyState === "error" ? t("copy.failed") : "" }),
			] });
		}

		function BrowseView({ t, state, query, setQuery, refresh, sort, setSort, stableOnly, setStableOnly, freshnessDays, setFreshnessDays, tag, setTag, dshMetadata, setDshMetadata, page, setPage, pageSize, setPageSize }) {
			const plugins = state.data?.plugins ?? [];
			const total = state.data?.total ?? 0;
			const pageCount = state.data?.pageCount ?? 1;
			const currentPage = state.data?.page ?? page;
			const changeQuery = (value) => { setPage(1); setQuery(value); };
			const changeSort = (value) => { setPage(1); setSort(value); };
			const changeStableOnly = (value) => { setPage(1); setStableOnly(value); };
			const changeFreshnessDays = (value) => { setPage(1); setFreshnessDays(Number(value)); };
			const changeTag = (value) => { setPage(1); setTag(value); };
			const changeDshMetadata = (value) => { setPage(1); setDshMetadata(value); };
			const changePageSize = (value) => { setPage(1); setPageSize(Number(value)); };
			return hs("section", { className: "pm-browse-view", children: [
				hs("form", { className: "pm-toolbar pm-browse-toolbar", onSubmit: (event) => { event.preventDefault(); refresh(); }, children: [
					hs("div", { className: "pm-search", children: [h(SearchIcon, {}), h("input", { id: "pm-search", type: "search", value: query, onChange: (event) => changeQuery(event.target.value), placeholder: t("browse.search"), "aria-label": t("browse.search") })] }),
					h("button", { type: "submit", className: "pm-refresh-icon pm-browse-refresh", disabled: state.loading, title: t("browse.refresh"), "aria-label": t("browse.refresh"), children: h(RefreshIcon, {}) }),
				] }),
				state.loading ? h("p", { className: "pm-notice pm-browse-state", children: t("browse.loading") }) : null,
				state.error ? h("p", { className: "pm-notice pm-notice-error pm-browse-state", role: "alert", children: `${t("browse.error")}: ${state.error}` }) : null,
				!state.loading && !state.error && plugins.length === 0 ? h(Empty, { title: t("browse.empty"), hint: t("browse.emptyHint") }) : null,
				(state.data?.plugins?.length ?? 0) ? hs("div", { className: "pm-browse-content", children: [
					hs("div", { className: "pm-browse-options", children: [
						h("p", { className: "pm-count", children: t("browse.results", { count: total }) }),
						hs("div", { className: "pm-filter-row", children: [
							hs("span", { className: "pm-stable-filter", children: [
								h(Switch, { checked: stableOnly, label: t("browse.stableOnly"), onChange: (value) => changeStableOnly(Boolean(value)) }),
								h("span", { children: t("browse.stableOnly") }),
							] }),
							h("select", { id: "pm-freshness", className: "pm-select pm-filter-select", "aria-label": t("browse.freshness"), value: freshnessDays, onChange: (event) => changeFreshnessDays(event.target.value), children: [
								h("option", { value: 0, children: t("browse.freshness.any") }),
								h("option", { value: 30, children: t("browse.freshness.30") }),
								h("option", { value: 90, children: t("browse.freshness.90") }),
								h("option", { value: 365, children: t("browse.freshness.365") }),
							] }),
							h("select", { id: "pm-category", className: "pm-select pm-filter-select", "aria-label": t("browse.category"), value: tag, onChange: (event) => changeTag(event.target.value), children: [
								h("option", { value: "", children: t("browse.category.any") }),
								...["ui","theme","provider","workflow","integration","tool","automation","schedule","scheduler","skill","bundle","desktop"].map((value) => h("option", { value, children: value }, value)),
							] }),
							h("select", { id: "pm-dsh-metadata", className: "pm-select pm-filter-select", "aria-label": t("browse.dshMetadata"), value: dshMetadata, onChange: (event) => changeDshMetadata(event.target.value), children: [
								h("option", { value: "any", children: t("browse.dshMetadata.any") }),
								h("option", { value: "declared", children: t("browse.dshMetadata.declared") }),
								h("option", { value: "unknown", children: t("browse.dshMetadata.unknown") }),
							] }),
							h("select", { id: "pm-page-size", className: "pm-select pm-page-size", "aria-label": t("browse.pageSize"), value: pageSize, onChange: (event) => changePageSize(event.target.value), children: [20, 50, 100].map((size) => h("option", { value: size, children: String(size) }, size)) }),
							h("select", { id: "pm-sort", className: "pm-select pm-sort", "aria-label": t("browse.sort"), value: sort, onChange: (event) => changeSort(event.target.value), children: [
								h("option", { value: "relevance", children: t("browse.sort.relevance") }),
								h("option", { value: "stars", children: t("browse.sort.stars") }),
								h("option", { value: "downloads", children: t("browse.sort.downloads") }),
								h("option", { value: "freshness", children: t("browse.sort.freshness") }),
								h("option", { value: "stars-downloads", children: t("browse.sort.starsDownloads") }),
								h("option", { value: "downloads-freshness", children: t("browse.sort.downloadsFreshness") }),
								h("option", { value: "name", children: t("browse.sort.name") }),
							] }),
						] }),
					] }),
					h("div", { className: "pm-results", children: plugins.map((plugin) => h(PluginCard, { plugin, t }, plugin.identity?.package || plugin.identity?.repository || plugin.identity?.fallback)) }),
					hs("div", { className: "pm-pagination", children: [
						h("span", { className: "pm-page-label", children: t("browse.page", { page: currentPage, pages: pageCount }) }),
						hs("div", { className: "pm-page-controls", children: [
							h(Button, { variant: "outline", size: "sm", disabled: state.loading || currentPage <= 1, onClick: () => setPage(Math.max(1, currentPage - 1)), children: t("browse.prev") }),
							h(Button, { variant: "outline", size: "sm", disabled: state.loading || currentPage >= pageCount, onClick: () => setPage(Math.min(pageCount, currentPage + 1)), children: t("browse.next") }),
						] }),
					] }),
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
			const [sort, setSort] = react.useState("relevance");
			const [stableOnly, setStableOnly] = react.useState(false);
			const [freshnessDays, setFreshnessDays] = react.useState(0);
			const [tag, setTag] = react.useState("");
			const [dshMetadata, setDshMetadata] = react.useState("any");
			const [page, setPage] = react.useState(1);
			const [pageSize, setPageSize] = react.useState(20);
			const [defaultsMigrating, setDefaultsMigrating] = react.useState(false);
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
			const sourceDefaultsVersion = Number(snapshot?.value?.sourceDefaultsVersion ?? 0);
			const saveSources = async (next) => { if (!bound || !writable) return; setBusy(true); try { await bound.set("sources", next); } finally { setBusy(false); } };

			react.useEffect(() => {
				if (!bound || !writable || defaultsMigrating || sourceDefaultsVersion >= 1) return undefined;
				setDefaultsMigrating(true);
				const next = [...sources];
				if (!next.some((source) => source.type === "npm")) next.push({ id: "npm", name: "npm", type: "npm", enabled: true });
				if (!next.some((source) => source.type === "github")) next.push({ id: "github", name: "GitHub", type: "github", enabled: true });
				Promise.resolve(next.length === sources.length ? undefined : bound.set("sources", next))
					.then(() => bound.set("sourceDefaultsVersion", 1))
					.finally(() => setDefaultsMigrating(false));
				return undefined;
			}, [bound, writable, defaultsMigrating, sourceDefaultsVersion, signature]);

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
					rpc("browse", { query, page, pageSize, sort, stableOnly, freshnessDays, tag, dshMetadata }, controller.signal).then((data) => {
						if (data?.page && data.page !== page) setPage(data.page);
						setBrowseState({ loading: false, data });
					}, (error) => { if (error?.name !== "AbortError") setBrowseState({ loading: false, error: String(error?.message ?? error) }); });
				}, 220);
				return () => { clearTimeout(timer); controller.abort(); };
			}, [tab, query, page, pageSize, sort, stableOnly, freshnessDays, tag, dshMetadata, signature, browseRevision, connectionRevision]);

			if (!snapshot || snapshot.status === "unavailable") return h("div", { className: "pm-root", children: h("div", { className: "pm-shell", children: h(Empty, { title: t("unavailable"), hint: "registry-aggregator" }) }) });
			const selectTab = (next) => { setTab(next); queueMicrotask(() => window.document.getElementById?.(`pm-tab-${next}`)?.focus?.()); };
			const tabKey = (event) => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); selectTab(tab === "sources" ? "browse" : "sources"); } };
			return h("div", { className: "pm-root", children: hs("section", { className: "pm-shell", "aria-labelledby": "pm-title", children: [
				h("p", { className: "pm-kicker", children: t("kicker") }), h("h2", { id: "pm-title", className: "pm-title", children: t("title") }), h("p", { className: "pm-lead", children: t("lead") }),
				hs("div", { className: "pm-tabs", role: "tablist", "aria-label": t("title"), children: [h("button", { id: "pm-tab-sources", type: "button", className: "pm-tab", role: "tab", tabIndex: tab === "sources" ? 0 : -1, "aria-controls": "pm-panel-sources", "aria-selected": tab === "sources", "data-active": tab === "sources", onKeyDown: tabKey, onClick: () => selectTab("sources"), children: hs("span", { className: "pm-tab-content", children: [h(DatabaseIcon, {}), h("span", { children: t("tab.sources") })] }) }), h("button", { id: "pm-tab-browse", type: "button", className: "pm-tab", role: "tab", tabIndex: tab === "browse" ? 0 : -1, "aria-controls": "pm-panel-browse", "aria-selected": tab === "browse", "data-active": tab === "browse", onKeyDown: tabKey, onClick: () => selectTab("browse"), children: hs("span", { className: "pm-tab-content", children: [h(GridIcon, {}), h("span", { children: t("tab.browse") })] }) })] }),
				h("div", { id: `pm-panel-${tab}`, role: "tabpanel", "aria-labelledby": `pm-tab-${tab}`, children: tab === "sources" ? h(SourcesView, { t, sources, writable, saveSources, busy, healthState, refreshHealth: () => setHealthRevision((value) => value + 1) }) : h(BrowseView, { t, state: browseState, query, setQuery, refresh: () => setBrowseRevision((value) => value + 1), sort, setSort, stableOnly, setStableOnly, freshnessDays, setFreshnessDays, tag, setTag, dshMetadata, setDshMetadata, page, setPage, pageSize, setPageSize }) }),
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
			ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({ name: "plugins.bundle.config", key: "@stolyarovmn/dsh-ui-registry-aggregator", locale: NS }, PluginSourcesSection));
			ctx.slots.inject("plugins.bundle.activation", () => ctx.slots.register({ name: "plugins.bundle.activation", key: "@stolyarovmn/dsh-ui-registry-aggregator", locale: NS }, RegistryAggregatorActivation));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
