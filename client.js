window.__ModuleLoader__.load({
  id: '@stolyarovmn/dsh-ui-registry-aggregator',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'registryAggregator'
    const PACKAGE = '@stolyarovmn/dsh-ui-registry-aggregator'
    const CHANNEL = '/api'
    const RPC_PREFIX = 'plugin-sources'
    const HOST_ENTRY = 'registry-aggregator'
    const SOURCE_TYPES = ['npm', 'github', 'custom-json', 'corporate']
    let connection
    let sourceConfigForm

    const en = {
      sources: 'Sources',
      browse: 'Browse',
      updates: 'Updates',
      sourcesTitle: 'Connected sources',
      sourcesLead: 'Manage the registries and catalogs used for plugin discovery.',
      sourceAdd: 'Add source',
      sourceAddTitle: 'Add a new source',
      sourceName: 'Name',
      sourceType: 'Type',
      sourceUrl: 'Catalog / API URL',
      sourceUrlHint: 'Optional for npm and GitHub',
      sourceSave: 'Add',
      sourceCancel: 'Cancel',
      sourceRemove: 'Remove',
      sourceRefresh: 'Refresh',
      sourceEnabled: 'Enabled',
      sourceDisabled: 'Disabled',
      sourceChecking: 'Checking',
      sourceOnline: 'Online',
      sourceOffline: 'Unavailable',
      sourcePackages: '{count} packages',
      sourceRepositories: '{count} repositories',
      sourceItems: '{count} items',
      sourceCounting: 'Counting…',
      sourceLatency: '{value} ms',
      sourceEmpty: 'No plugin sources connected.',
      sourceRequired: 'Name is required.',
      sourceUrlRequired: 'This source type requires a catalog URL.',
      sourceDuplicate: 'A source with this id already exists.',
      sourceReadOnly: 'Plugin source configuration is read-only.',
      sourceUnavailable: 'Plugin source configuration is unavailable.',
      sourceSaveFailed: 'Could not save source configuration.',
      sourceCopy: 'Copy source address',
      copied: 'Copied',
      browseTitle: 'Browse plugins',
      browseLead: 'Search enabled registries and catalogs.',
      browsePlaceholder: 'Search plugins',
      browseRefresh: 'Refresh results',
      browseLoading: 'Searching plugins…',
      browsePopular: 'Popular plugins',
      browseResults: '{count} results',
      browseNoResults: 'No plugins found',
      browseNoResultsBody: 'Try another query or enable another source.',
      browseSourceFailures: 'Some sources could not be searched.',
      updatesTitle: 'Plugin updates',
      updatesLead: 'Update discovery complements the native DSH Plugin Manager instead of replacing it.',
      updatesEmptyTitle: 'Update discovery is not connected yet',
      updatesEmptyBody: 'Installed bundle lifecycle remains native to DSH.',
    }

    const zh = {
      sources: '来源',
      browse: '浏览',
      updates: '更新',
      sourcesTitle: '已连接来源',
      sourcesLead: '管理用于发现插件的注册表与目录。',
      sourceAdd: '添加来源',
      sourceAddTitle: '添加新来源',
      sourceName: '名称',
      sourceType: '类型',
      sourceUrl: '目录 / API URL',
      sourceUrlHint: 'npm 和 GitHub 可留空',
      sourceSave: '添加',
      sourceCancel: '取消',
      sourceRemove: '删除',
      sourceRefresh: '刷新',
      sourceEnabled: '已启用',
      sourceDisabled: '已停用',
      sourceChecking: '检查中',
      sourceOnline: '在线',
      sourceOffline: '不可用',
      sourcePackages: '{count} 个包',
      sourceRepositories: '{count} 个仓库',
      sourceItems: '{count} 项',
      sourceCounting: '统计中…',
      sourceLatency: '{value} 毫秒',
      sourceEmpty: '没有已连接的插件来源。',
      sourceRequired: '名称不能为空。',
      sourceUrlRequired: '此来源类型需要目录 URL。',
      sourceDuplicate: '已存在相同 id 的来源。',
      sourceReadOnly: '插件来源配置为只读。',
      sourceUnavailable: '插件来源配置不可用。',
      sourceSaveFailed: '无法保存来源配置。',
      sourceCopy: '复制来源地址',
      copied: '已复制',
      browseTitle: '浏览插件',
      browseLead: '搜索已启用的注册表和目录。',
      browsePlaceholder: '搜索插件',
      browseRefresh: '刷新结果',
      browseLoading: '正在搜索插件…',
      browsePopular: '热门插件',
      browseResults: '{count} 个结果',
      browseNoResults: '未找到插件',
      browseNoResultsBody: '尝试其他关键词或启用其他来源。',
      browseSourceFailures: '部分来源无法搜索。',
      updatesTitle: '插件更新',
      updatesLead: '更新发现用于补充原生 DSH Plugin Manager，而不是替代它。',
      updatesEmptyTitle: '更新发现尚未连接',
      updatesEmptyBody: '已安装 bundle 的生命周期继续由 DSH 原生管理。',
    }

    const css = [
      '.ra-root{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;padding:2px 0 8px}',
      '.ra-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:min(100%,440px);padding:4px;margin:12px 0 24px;border-radius:12px;background:var(--dsw-alias-bg-module-platform,var(--dsw-alias-bg-layer-2))}',
      '.ra-tab{height:34px;padding:0 14px;border:.5px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer}',
      '.ra-tab:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.ra-tab:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}',
      '.ra-tab[aria-selected=true]{border-color:var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);font-weight:600}',
      '.ra-section{display:grid;gap:14px}',
      '.ra-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}',
      '.ra-heading{margin:0;font-size:14px;line-height:20px;font-weight:600;color:var(--dsw-alias-label-primary)}',
      '.ra-lead{margin:2px 0 0;color:var(--dsw-alias-label-tertiary)}',
      '.ra-actions{display:flex;align-items:center;gap:8px;flex:none}',
      '.ra-button{box-sizing:border-box;min-height:32px;padding:0 11px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer}',
      '.ra-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.ra-button:focus-visible,.ra-input:focus-visible,.ra-select:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:1px}',
      '.ra-button:disabled{opacity:.5;cursor:not-allowed}',
      '.ra-button-primary{background:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-foreground)}',
      '.ra-panel{border:.5px solid var(--dsw-alias-border-l4);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}',
      '.ra-add-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px}',
      '.ra-add-form{display:grid;grid-template-columns:minmax(160px,1fr) minmax(130px,180px) minmax(220px,1.2fr) auto;gap:10px;padding:12px 13px;border-top:.5px solid var(--dsw-alias-border-l4);align-items:end}',
      '.ra-field{display:grid;gap:4px;min-width:0}',
      '.ra-field label{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}',
      '.ra-input,.ra-select{box-sizing:border-box;width:100%;height:34px;padding:0 9px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit}',
      '.ra-form-actions{display:flex;align-items:center;gap:6px}',
      '.ra-error{grid-column:1/-1;margin:0;color:var(--dsw-alias-state-error-primary);font-size:12px}',
      '.ra-notice{margin:0;padding:9px 12px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1)}',
      '.ra-source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
      '.ra-source-card{min-width:0;padding:12px;border:.5px solid var(--dsw-alias-border-l4);border-radius:12px;background:transparent}',
      '.ra-source-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}',
      '.ra-source-main{display:flex;align-items:flex-start;gap:10px;min-width:0}',
      '.ra-source-logo{display:grid;place-items:center;flex:0 0 34px;width:34px;height:34px;border:.5px solid var(--dsw-alias-border-l4);border-radius:10px;color:var(--dsw-alias-label-secondary);font-weight:700}',
      '.ra-source-copy{min-width:0}',
      '.ra-source-name{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ra-source-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:2px;color:var(--dsw-alias-label-tertiary);font-size:11px}',
      '.ra-status{display:inline-flex;align-items:center;gap:5px}',
      '.ra-dot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-label-tertiary)}',
      '.ra-dot[data-state=ok]{background:var(--dsw-alias-state-success-primary)}',
      '.ra-dot[data-state=bad]{background:var(--dsw-alias-state-error-primary)}',
      '.ra-dot[data-state=wait]{background:var(--dsw-alias-state-warn-primary)}',
      '.ra-source-controls{display:flex;align-items:center;gap:6px;flex:none}',
      '.ra-icon-button{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;border:0;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-caption);font:inherit;cursor:pointer}',
      '.ra-icon-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary)}',
      '.ra-icon-button:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:1px}',
      '.ra-icon-button:disabled{opacity:.5;cursor:default}',
      '.ra-icon-button[data-danger=true]{color:var(--dsw-alias-state-error-primary)}',
      '.ra-icon-button[data-danger=true]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger,var(--dsw-alias-interactive-bg-hover))}',
      '.ra-switch{box-sizing:border-box;position:relative;flex:0 0 auto;width:36px;height:20px;padding:2px;border:0;border-radius:999px;corner-shape:round;background:var(--dsw-alias-border-l3);cursor:pointer}',
      '.ra-switch[aria-checked=true]{background:var(--dsw-alias-brand-primary)}',
      '.ra-switch:disabled{cursor:default;opacity:.5}',
      '.ra-switch:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}',
      '.ra-switch-thumb{display:block;width:16px;height:16px;border-radius:50%;corner-shape:round;background:var(--dsw-alias-switch-thumb);transition:transform 120ms ease}',
      '.ra-switch[aria-checked=true] .ra-switch-thumb{transform:translateX(16px);background:var(--dsw-alias-label-primary-foreground)}',
      '.ra-source-url{display:flex;align-items:center;gap:4px;margin-top:10px;padding-top:9px;border-top:.5px solid var(--dsw-alias-border-l4)}',
      '.ra-source-url code{min-width:0;flex:1;color:var(--dsw-alias-label-tertiary);font:11px/17px ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ra-meta-icon{display:inline-flex;align-items:center;gap:4px}',
      '.ra-spin{animation:ra-spin .8s linear infinite}',
      '@keyframes ra-spin{to{transform:rotate(360deg)}}',
      '.ra-source-error{margin-top:7px;color:var(--dsw-alias-state-error-primary);font-size:11px;line-height:16px}',
      '.ra-empty{padding:18px;border:.5px solid var(--dsw-alias-border-l4);border-radius:12px;color:var(--dsw-alias-label-tertiary)}',
      '.ra-empty strong{display:block;margin-bottom:3px;color:var(--dsw-alias-label-primary)}',
      '.ra-search{box-sizing:border-box;width:100%;height:36px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit}',
      '.ra-search::placeholder{color:var(--dsw-alias-label-caption)}',
      '.ra-browse-list{display:flex;flex-direction:column;gap:2px;margin:0;padding:0;list-style:none}',
      '.ra-plugin-card{display:flex;align-items:center;gap:14px;min-width:0;margin:0 -8px;padding:8px;border-radius:var(--dsw-radius-xl)}',
      '.ra-plugin-card:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.ra-plugin-icon{display:inline-flex;align-items:center;justify-content:center;flex:none;width:40px;height:40px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md);color:var(--dsw-alias-label-secondary)}',
      '.ra-plugin-main{display:flex;flex:1;flex-direction:column;gap:2px;min-width:0}',
      '.ra-plugin-title-row{display:flex;align-items:center;gap:8px;min-width:0}',
      '.ra-plugin-title{font-size:13.5px;line-height:20px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.ra-plugin-version{flex:none;font-size:11px;line-height:18px;color:var(--dsw-alias-label-caption)}',
      '.ra-plugin-desc{font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ra-plugin-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:11px;line-height:16px;color:var(--dsw-alias-label-caption)}',
      '.ra-plugin-link{flex:none;color:var(--dsw-alias-label-tertiary);text-decoration:none}',
      '.ra-plugin-link:hover{color:var(--dsw-alias-link);text-decoration:underline;text-underline-offset:3px}',
      '@media(max-width:900px){.ra-source-grid{grid-template-columns:1fr}.ra-add-form{grid-template-columns:1fr 160px}.ra-add-form .ra-url-field{grid-column:1/-1}.ra-form-actions{grid-column:1/-1;justify-content:flex-end}}',
      '@media(max-width:560px){.ra-tabs{width:100%}.ra-tab{padding:0 8px}.ra-section-head{align-items:stretch;flex-direction:column}.ra-actions{justify-content:flex-end}.ra-add-form{grid-template-columns:1fr}.ra-add-form .ra-url-field,.ra-form-actions{grid-column:1}}',
    ].join('\n')

    function rpc(endpoint, payload, signal) {
      if (!connection?.rpc?.call) return Promise.reject(new Error('Host connection is unavailable'))
      return connection.rpc.call(CHANNEL, RPC_PREFIX + '/' + endpoint, payload, signal).then(result => {
        if (!result?.ok) throw new Error(result?.error?.message || 'Host request failed')
        return result.value
      })
    }

    function slug(value) {
      const input = String(value ?? '').trim()
      const ascii = input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
      if (ascii) return ascii
      let hash = 2166136261
      for (const char of input) {
        hash ^= char.codePointAt(0)
        hash = Math.imul(hash, 16777619)
      }
      return input ? 'source-' + (hash >>> 0).toString(36) : ''
    }

    function endpointFor(source) {
      if (source.url) return source.url
      if (source.type === 'npm') return 'https://registry.npmjs.org'
      if (source.type === 'github') return 'https://api.github.com'
      return source.id
    }

    function sourceInitial(source) {
      if (source.type === 'npm') return 'N'
      if (source.type === 'github') return 'G'
      if (source.type === 'corporate') return 'C'
      return '{}'
    }

    function format(t, key, values = {}) {
      let value = t(key)
      for (const [name, replacement] of Object.entries(values)) {
        value = value.replace('{' + name + '}', String(replacement))
      }
      return value
    }

    function SvgIcon({ size = 16, children, className, strokeWidth = 1 }) {
      return h('svg', {
        width: size,
        height: size,
        className,
        viewBox: '0 0 16 16',
        fill: 'none',
        xmlns: 'http://www.w3.org/2000/svg',
        'aria-hidden': true,
        strokeWidth,
      }, ...children)
    }

    function IconRefresh({ size = 16, className }) {
      return h(SvgIcon, { size, className, children: [
        h('path', { d: 'M14.5001 8C14.5 9.28552 14.1188 10.5422 13.4045 11.611C12.6903 12.6799 11.6752 13.5129 10.4875 14.0049C9.29982 14.4968 7.99295 14.6255 6.73212 14.3747C5.4713 14.124 4.31314 13.505 3.4041 12.596C2.49514 11.687 1.87614 10.5288 1.62537 9.26798C1.37459 8.00716 1.50331 6.70028 1.99525 5.51261C2.48719 4.32494 3.32025 3.30981 4.3891 2.59557C5.45795 1.88134 6.71458 1.50008 8.0001 1.5C9.9001 1.5 11.7001 2.3 13.0001 3.6L14.5001 5.1', stroke: 'currentColor' }),
        h('path', { d: 'M14.4999 1.5V5.1H10.8999', stroke: 'currentColor' }),
      ] })
    }

    function IconPlus({ size = 16 }) {
      return h(SvgIcon, { size, children: [
        h('path', { d: 'M8 2V14', stroke: 'currentColor' }),
        h('path', { d: 'M2 8H14', stroke: 'currentColor' }),
      ] })
    }

    function IconClose({ size = 16 }) {
      return h(SvgIcon, { size, children: [
        h('path', { d: 'M2.5 2.5L13.5 13.5', stroke: 'currentColor' }),
        h('path', { d: 'M13.5 2.5L2.5 13.5', stroke: 'currentColor' }),
      ] })
    }

    function IconTrash({ size = 16 }) {
      return h(SvgIcon, { size, children: [
        h('path', { d: 'M1.28149 3.88831H14.7187', stroke: 'currentColor' }),
        h('path', { d: 'M5.41602 3.88833V2.47962C5.41602 2.29282 5.52492 2.11366 5.71876 1.98157C5.9126 1.84948 6.17551 1.77527 6.44964 1.77527H9.55053C9.82466 1.77527 10.0876 1.84948 10.2814 1.98157C10.4753 2.11366 10.5842 2.29282 10.5842 2.47962V3.88833', stroke: 'currentColor' }),
        h('path', { d: 'M2.57349 3.88831L3.19366 13.2943C3.21937 13.5502 3.33952 13.7872 3.53065 13.9593C3.72178 14.1313 3.97016 14.2259 4.22729 14.2246H11.7728C12.0299 14.2259 12.2783 14.1313 12.4694 13.9593C12.6605 13.7872 12.7807 13.5502 12.8064 13.2943L13.4266 3.88831', stroke: 'currentColor' }),
        h('path', { d: 'M6.44946 6.98926V11.1238', stroke: 'currentColor' }),
        h('path', { d: 'M9.55054 6.98926V11.1238', stroke: 'currentColor' }),
      ] })
    }

    function IconCopy({ size = 16 }) {
      return h(SvgIcon, { size, children: [
        h('rect', { x: '1.52075', y: '4.07373', width: '10.3932', height: '10.3932', rx: '2', stroke: 'currentColor' }),
        h('path', { d: 'M11.9792 1.53296C13.36 1.53296 14.4792 2.65225 14.4792 4.03296V9.42847C14.4792 10.3756 13.9521 11.1987 13.1755 11.6228V10.3298C13.3652 10.0787 13.4792 9.7674 13.4792 9.42847V4.03296C13.4792 3.20453 12.8077 2.53296 11.9792 2.53296H6.58374C6.27966 2.53301 5.99684 2.6235 5.7605 2.77905H4.42358C4.85652 2.03463 5.66056 1.53304 6.58374 1.53296H11.9792Z', fill: 'currentColor' }),
      ] })
    }

    function IconCheck({ size = 16 }) {
      return h(SvgIcon, { size, children: [
        h('path', { d: 'M2.25 8.5L5.49732 11.7473C5.90519 12.1552 6.57263 12.1344 6.95426 11.7018L13.75 4', stroke: 'currentColor' }),
      ] })
    }

    function IconArchive({ size = 14 }) {
      return h(SvgIcon, { size, children: [
        h('path', { d: 'M13.5 2.5H2.5C1.94772 2.5 1.5 2.94772 1.5 3.5V4.5C1.5 5.05228 1.94772 5.5 2.5 5.5H13.5C14.0523 5.5 14.5 5.05228 14.5 4.5V3.5C14.5 2.94772 14.0523 2.5 13.5 2.5Z', stroke: 'currentColor' }),
        h('path', { d: 'M2.5 5.5V13.5C2.5 13.7652 2.60536 14.0196 2.79289 14.2071C2.98043 14.3946 3.23478 14.5 3.5 14.5H12.5C12.7652 14.5 13.0196 14.3946 13.2071 14.2071C13.3946 14.0196 13.5 13.7652 13.5 13.5V5.5', stroke: 'currentColor' }),
        h('path', { d: 'M6.5 9.5H9.5', stroke: 'currentColor' }),
      ] })
    }

    function IconPlugin({ size = 16 }) {
      return h(SvgIcon, { size, children: [
        h('path', { d: 'M3.16143 6.59068L1.75205 8.00006L3.10619 9.35419L2.39908 10.0613L0.832948 8.49517C0.559581 8.2218 0.559582 7.77831 0.832948 7.50494L2.45432 5.88357L3.16143 6.59068ZM8.49511 15.1671C8.22176 15.4405 7.77826 15.4404 7.50489 15.1671L5.93461 13.5968L6.64172 12.8897L8 14.248L9.40938 12.8386L10.1165 13.5457L8.49511 15.1671ZM15.1671 7.50494C15.4403 7.7782 15.4401 8.22179 15.1671 8.49517L13.652 10.0102L12.9449 9.30309L14.248 8.00006L12.8897 6.64178L13.5968 5.93467L15.1671 7.50494ZM9.35414 3.10624L8 1.7521L6.69696 3.05514L5.98986 2.34803L7.50489 0.833003C7.77828 0.559981 8.22186 0.559752 8.49511 0.833003L10.0612 2.39913L9.35414 3.10624Z', fill: 'currentColor' }),
        h('circle', { cx: '8', cy: '8', r: '1.76221', stroke: 'currentColor' }),
      ] })
    }

    function IconButton({ label, icon, disabled = false, danger = false, onClick }) {
      return h('button', {
        type: 'button',
        className: 'ra-icon-button',
        title: label,
        'aria-label': label,
        'data-danger': danger || undefined,
        disabled,
        onClick,
      }, icon)
    }

    async function copyText(value) {
      if (!navigator.clipboard?.writeText) return false
      try {
        await navigator.clipboard.writeText(value)
        return true
      } catch {
        return false
      }
    }

    function Empty({ title, body }) {
      return h('div', { className: 'ra-empty' },
        h('strong', null, title),
        body ? h('span', null, body) : null,
      )
    }

    function Toggle({ checked, disabled, label, onChange }) {
      return h('button', {
        type: 'button',
        role: 'switch',
        className: 'ra-switch',
        'aria-checked': checked,
        'aria-label': label,
        title: label,
        disabled,
        onClick: onChange,
      }, h('span', { className: 'ra-switch-thumb' }))
    }

    function AddSource({ t, sources, busy, writable, onSave }) {
      const [open, setOpen] = React.useState(false)
      const [name, setName] = React.useState('')
      const [type, setType] = React.useState('custom-json')
      const [url, setUrl] = React.useState('')
      const [error, setError] = React.useState('')

      const reset = () => {
        setName('')
        setType('custom-json')
        setUrl('')
        setError('')
        setOpen(false)
      }

      const submit = async event => {
        event.preventDefault()
        const id = slug(name)
        const needsUrl = type === 'custom-json' || type === 'corporate'
        if (!id) return setError(t('sourceRequired'))
        if (needsUrl && !url.trim()) return setError(t('sourceUrlRequired'))
        if (sources.some(source => source.id === id)) return setError(t('sourceDuplicate'))
        setError('')
        try {
          await onSave([
            ...sources,
            { id, name: name.trim(), type, ...(url.trim() ? { url: url.trim() } : {}), enabled: true },
          ])
          reset()
        } catch (failure) {
          setError(String(failure?.message ?? failure))
        }
      }

      return h('section', { className: 'ra-panel' },
        h('div', { className: 'ra-add-head' },
          h('div', null, h('div', { className: 'ra-heading' }, t('sourceAddTitle'))),
          h(IconButton, {
            label: open ? t('sourceCancel') : t('sourceAdd'),
            disabled: !writable || busy,
            onClick: () => setOpen(value => !value),
            icon: open ? h(IconClose, { size: 14 }) : h(IconPlus, { size: 14 }),
          }),
        ),
        open ? h('form', { className: 'ra-add-form', onSubmit: submit },
          h('div', { className: 'ra-field' },
            h('label', { htmlFor: 'ra-source-name' }, t('sourceName')),
            h('input', {
              id: 'ra-source-name',
              className: 'ra-input',
              value: name,
              disabled: busy,
              onChange: event => {
                setName(event.target.value)
                setError('')
              },
            }),
          ),
          h('div', { className: 'ra-field' },
            h('label', { htmlFor: 'ra-source-type' }, t('sourceType')),
            h('select', {
              id: 'ra-source-type',
              className: 'ra-select',
              value: type,
              disabled: busy,
              onChange: event => {
                setType(event.target.value)
                setError('')
              },
            }, ...SOURCE_TYPES.map(item => h('option', { key: item, value: item }, item))),
          ),
          h('div', { className: 'ra-field ra-url-field' },
            h('label', { htmlFor: 'ra-source-url' }, t('sourceUrl')),
            h('input', {
              id: 'ra-source-url',
              className: 'ra-input',
              type: 'url',
              value: url,
              placeholder: t('sourceUrlHint'),
              disabled: busy,
              onChange: event => {
                setUrl(event.target.value)
                setError('')
              },
            }),
          ),
          h('div', { className: 'ra-form-actions' },
            h('button', {
              type: 'submit',
              className: 'ra-icon-button',
              title: t('sourceSave'),
              'aria-label': t('sourceSave'),
              disabled: busy,
            }, h(IconPlus, { size: 15 })),
          ),
          error ? h('p', { className: 'ra-error', role: 'alert' }, error) : null,
        ) : null,
      )
    }

    function SourceCard({ source, health, countState, t, busy, writable, onToggle, onRemove }) {
      const [copied, setCopied] = React.useState(false)
      const disabled = source.enabled === false
      const state = disabled ? 'off' : health?.ok === true ? 'ok' : health?.ok === false ? 'bad' : 'wait'
      const statusText = disabled
        ? t('sourceDisabled')
        : state === 'ok'
          ? t('sourceOnline')
          : state === 'bad'
            ? t('sourceOffline')
            : t('sourceChecking')
      const count = Number.isFinite(countState?.count) ? countState.count : undefined
      const endpoint = endpointFor(source)
      const error = health?.error || countState?.error

      const copy = async () => {
        const ok = await copyText(endpoint)
        if (!ok) return
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }

      return h('article', { className: 'ra-source-card' },
        h('div', { className: 'ra-source-top' },
          h('div', { className: 'ra-source-main' },
            h('div', { className: 'ra-source-logo', 'aria-hidden': true }, sourceInitial(source)),
            h('div', { className: 'ra-source-copy' },
              h('div', { className: 'ra-source-name', title: source.name }, source.name),
              h('div', { className: 'ra-source-meta' },
                h('span', { className: 'ra-status' },
                  h('span', { className: 'ra-dot', 'data-state': state }),
                  h('span', null, statusText),
                ),
                countState?.loading
                  ? h('span', { className: 'ra-meta-icon', title: t('sourceCounting') },
                    h(IconRefresh, { size: 12, className: 'ra-spin' }))
                  : count === undefined
                    ? null
                    : h('span', { className: 'ra-meta-icon' },
                      h(IconArchive, { size: 12 }),
                      h('span', null, String(count) + (countState?.truncated ? '+' : '')),
                    ),
              ),
            ),
          ),
          h('div', { className: 'ra-source-controls' },
            h(Toggle, {
              checked: !disabled,
              disabled: !writable || busy,
              label: !disabled ? t('sourceEnabled') : t('sourceDisabled'),
              onChange: () => onToggle(source.id),
            }),
            h(IconButton, {
              label: t('sourceRemove'),
              danger: true,
              disabled: !writable || busy,
              onClick: () => onRemove(source.id),
              icon: h(IconTrash, { size: 15 }),
            }),
          ),
        ),
        h('div', { className: 'ra-source-url' },
          h('code', { title: endpoint }, endpoint),
          h(IconButton, {
            label: copied ? t('copied') : t('sourceCopy'),
            onClick: copy,
            icon: copied ? h(IconCheck, { size: 14 }) : h(IconCopy, { size: 14 }),
          }),
        ),
        error ? h('div', { className: 'ra-source-error', title: error }, error) : null,
      )
    }

    function SourcesView({ t, form }) {
      const hostSources = Array.isArray(form?.state?.value?.sources) ? form.state.value.sources : []
      const hostKey = JSON.stringify(hostSources)
      const [sources, setSources] = React.useState(hostSources)
      const [busy, setBusy] = React.useState(false)
      const [mutationError, setMutationError] = React.useState('')
      const [revision, setRevision] = React.useState(0)
      const [healthState, setHealthState] = React.useState({ loading: true, rows: [], error: '' })
      const [countState, setCountState] = React.useState({ loading: true, rows: [], error: '' })

      React.useEffect(() => {
        setSources(hostSources)
      }, [hostKey])

      const sourceKey = JSON.stringify(sources)
      React.useEffect(() => {
        const controller = new AbortController()
        setHealthState({ loading: true, rows: [], error: '' })
        setCountState({ loading: true, rows: [], error: '' })

        rpc('health', {}, controller.signal).then(value => {
          setHealthState({ loading: false, rows: value?.sources ?? [], error: '' })
        }, error => {
          if (!controller.signal.aborted) setHealthState({ loading: false, rows: [], error: String(error?.message ?? error) })
        })

        rpc('counts', {}, controller.signal).then(value => {
          setCountState({ loading: false, rows: value?.sources ?? [], error: '' })
        }, error => {
          if (!controller.signal.aborted) setCountState({ loading: false, rows: [], error: String(error?.message ?? error) })
        })

        return () => controller.abort()
      }, [sourceKey, revision])

      if (!form || form.state.status === 'loading') {
        return h(Empty, { title: t('sourceChecking') })
      }
      if (form.state.status !== 'ready') {
        return h(Empty, { title: t('sourceUnavailable') })
      }

      const writable = form.state.writable === true
      const healthMap = new Map(healthState.rows.map(row => [row?.source?.id, row?.health]))
      const countMap = new Map(countState.rows.map(row => [row?.source?.id, row]))
      const saveSources = async next => {
        setBusy(true)
        setMutationError('')
        try {
          const accepted = await form.mutate(
            [{ op: 'set', path: ['sources'], value: next }],
            form.state.revision,
          )
          if (!accepted) throw new Error(t('sourceSaveFailed'))
          setSources(next)
          setRevision(value => value + 1)
        } finally {
          setBusy(false)
        }
      }

      const mutate = async next => {
        try {
          await saveSources(next)
        } catch (error) {
          setMutationError(String(error?.message ?? error))
          throw error
        }
      }

      return h('section', { className: 'ra-section', 'aria-labelledby': 'ra-sources-title' },
        h('div', { className: 'ra-section-head' },
          h('div', null,
            h('h3', { id: 'ra-sources-title', className: 'ra-heading' }, t('sourcesTitle')),
            h('p', { className: 'ra-lead' }, t('sourcesLead')),
          ),
          h('div', { className: 'ra-actions' },
            h(IconButton, {
              label: t('sourceRefresh'),
              disabled: healthState.loading || countState.loading,
              onClick: () => setRevision(value => value + 1),
              icon: h(IconRefresh, { size: 16, className: healthState.loading || countState.loading ? 'ra-spin' : undefined }),
            }),
          ),
        ),
        h(AddSource, { t, sources, busy, writable, onSave: mutate }),
        !writable ? h('p', { className: 'ra-notice' }, t('sourceReadOnly')) : null,
        mutationError ? h('p', { className: 'ra-notice', role: 'alert' }, mutationError) : null,
        healthState.error ? h('p', { className: 'ra-notice', role: 'alert' }, healthState.error) : null,
        countState.error ? h('p', { className: 'ra-notice', role: 'alert' }, countState.error) : null,
        sources.length === 0
          ? h(Empty, { title: t('sourceEmpty') })
          : h('div', { className: 'ra-source-grid' },
            ...sources.map(source => h(SourceCard, {
              key: source.id,
              source,
              health: healthMap.get(source.id),
              countState: countMap.get(source.id) ?? { loading: countState.loading },
              t,
              busy,
              writable,
              onToggle: id => {
                void mutate(sources.map(row => row.id === id ? { ...row, enabled: row.enabled === false } : row))
              },
              onRemove: id => {
                void mutate(sources.filter(row => row.id !== id))
              },
            })),
          ),
      )
    }

    function BrowseView({ t }) {
      const [query, setQuery] = React.useState('')
      const [revision, setRevision] = React.useState(0)
      const [state, setState] = React.useState({ loading: true, data: null, error: '' })

      React.useEffect(() => {
        const controller = new AbortController()
        const timer = setTimeout(() => {
          setState(current => ({ ...current, loading: true, error: '' }))
          rpc('browse', { query, limit: 60 }, controller.signal).then(data => {
            setState({ loading: false, data, error: '' })
          }, error => {
            if (!controller.signal.aborted) {
              setState({ loading: false, data: null, error: String(error?.message ?? error) })
            }
          })
        }, 220)
        return () => {
          clearTimeout(timer)
          controller.abort()
        }
      }, [query, revision])

      const plugins = state.data?.plugins ?? []
      const sourceRows = state.data?.sources ?? []
      const failedSources = sourceRows.filter(row => row?.ok === false)
      const resultLabel = state.loading
        ? t('browseLoading')
        : query.trim()
          ? format(t, 'browseResults', { count: state.data?.total ?? plugins.length })
          : t('browsePopular')

      return h('section', { className: 'ra-section', 'aria-labelledby': 'ra-browse-title' },
        h('div', { className: 'ra-section-head' },
          h('div', null,
            h('h3', { id: 'ra-browse-title', className: 'ra-heading' }, t('browseTitle')),
            h('p', { className: 'ra-lead' }, t('browseLead')),
          ),
          h('div', { className: 'ra-actions' },
            h(IconButton, {
              label: t('browseRefresh'),
              disabled: state.loading,
              onClick: () => setRevision(value => value + 1),
              icon: h(IconRefresh, { size: 16, className: state.loading ? 'ra-spin' : undefined }),
            }),
          ),
        ),
        h('input', {
          className: 'ra-search',
          type: 'search',
          value: query,
          placeholder: t('browsePlaceholder'),
          'aria-label': t('browsePlaceholder'),
          onChange: event => setQuery(event.target.value),
        }),
        h('div', { className: 'ra-plugin-meta', role: 'status', 'aria-live': 'polite' }, resultLabel),
        state.error ? h('p', { className: 'ra-notice', role: 'alert' }, state.error) : null,
        failedSources.length ? h('p', { className: 'ra-notice' },
          t('browseSourceFailures') + ' ' + failedSources.map(row => row?.source?.name ?? row?.source?.id).filter(Boolean).join(', '),
        ) : null,
        !state.loading && !state.error && plugins.length === 0
          ? h(Empty, { title: t('browseNoResults'), body: t('browseNoResultsBody') })
          : h('ul', { className: 'ra-browse-list' },
            ...plugins.map(plugin => h('li', { key: plugin.key ?? plugin.installSpec ?? plugin.name, className: 'ra-plugin-card' },
              h('span', { className: 'ra-plugin-icon', 'aria-hidden': true }, h(IconPlugin, { size: 16 })),
              h('div', { className: 'ra-plugin-main' },
                h('div', { className: 'ra-plugin-title-row' },
                  h('span', { className: 'ra-plugin-title', title: plugin.name }, plugin.name),
                  plugin.version ? h('span', { className: 'ra-plugin-version' }, plugin.version) : null,
                ),
                plugin.description ? h('div', { className: 'ra-plugin-desc', title: plugin.description }, plugin.description) : null,
                h('div', { className: 'ra-plugin-meta' },
                  ...(plugin.sources ?? []).map(source => h('span', { key: source.id }, source.name)),
                  Number.isFinite(plugin.stars) ? h('span', null, '★ ' + plugin.stars) : null,
                  plugin.installSpec ? h('code', null, plugin.installSpec) : null,
                ),
              ),
              plugin.repository ? h('a', {
                className: 'ra-plugin-link',
                href: plugin.repository,
                target: '_blank',
                rel: 'noreferrer',
                title: plugin.repository,
              }, '↗') : null,
            )),
          ),
      )
    }

    function UpdatesView({ t }) {
      return h('section', { className: 'ra-section', 'aria-labelledby': 'ra-updates-title' },
        h('div', null,
          h('h3', { id: 'ra-updates-title', className: 'ra-heading' }, t('updatesTitle')),
          h('p', { className: 'ra-lead' }, t('updatesLead')),
        ),
        h(Empty, { title: t('updatesEmptyTitle'), body: t('updatesEmptyBody') }),
      )
    }

    function RegistryAggregator({ t, view }) {
      const [tab, setTab] = React.useState('sources')
      const formState = React.useSyncExternalStore(
        listener => sourceConfigForm.subscribe(listener),
        () => sourceConfigForm.getSnapshot(),
        () => sourceConfigForm.getSnapshot(),
      )
      const form = React.useMemo(() => ({
        state: formState,
        mutate: (operations, expectedRevision) => sourceConfigForm.mutate(operations, expectedRevision),
      }), [formState])
      if (view !== 'page') return null
      const tabs = [
        ['sources', t('sources')],
        ['browse', t('browse')],
        ['updates', t('updates')],
      ]
      const selectRelative = delta => {
        const index = tabs.findIndex(item => item[0] === tab)
        const next = tabs[(index + delta + tabs.length) % tabs.length][0]
        setTab(next)
      }
      const body = tab === 'browse'
        ? h(BrowseView, { t })
        : tab === 'updates'
          ? h(UpdatesView, { t })
          : h(SourcesView, { t, form })

      return h('div', { className: 'ra-root' },
        h('style', null, css),
        h('div', { className: 'ra-tabs', role: 'tablist', 'aria-label': 'Registry Aggregator' },
          ...tabs.map(([id, label]) => h('button', {
            key: id,
            type: 'button',
            role: 'tab',
            className: 'ra-tab',
            'aria-selected': tab === id,
            tabIndex: tab === id ? 0 : -1,
            onClick: () => setTab(id),
            onKeyDown: event => {
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                selectRelative(1)
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                selectRelative(-1)
              }
            },
          }, label)),
        ),
        body,
      )
    }

    return {
      inject: ['slots', 'locale', 'connection', 'configForms'],
      apply(ctx) {
        connection = ctx.connection
        sourceConfigForm = ctx.configForms.get(HOST_ENTRY)
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'registry-aggregator: locale')
        ctx.effect(() => ctx.configForms.whileServed([HOST_ENTRY], () =>
          ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
            name: 'plugins.bundle.config',
            key: PACKAGE,
            locale: NS,
          }, RegistryAggregator))), 'registry-aggregator: bundle page')
      },
    }
  },
})
