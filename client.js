window.__ModuleLoader__.load({
  id: '@stolyarovmn/dsh-ui-registry-aggregator',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'registryAggregator'
    const PACKAGE = '@stolyarovmn/dsh-ui-registry-aggregator'
    const CHANNEL = '/api'
    const RPC_PREFIX = 'plugin-sources'
    const SOURCE_TYPES = ['npm', 'github', 'custom-json', 'corporate']
    let connection

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
      browseTitle: 'Browse plugins',
      browseLead: 'Search and ranking are migrated after the source layer is verified.',
      browsePlaceholder: 'Search plugins',
      browseEmptyTitle: 'Discovery is the next migration step',
      browseEmptyBody: 'Search, filters, stars, downloads, freshness, and compatibility evidence will be connected to these sources.',
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
      browseTitle: '浏览插件',
      browseLead: '来源层验证后再迁移搜索与排序。',
      browsePlaceholder: '搜索插件',
      browseEmptyTitle: '下一步迁移插件发现',
      browseEmptyBody: '搜索、筛选、Stars、下载量、新鲜度和兼容性信息将连接到这些来源。',
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
      '.ra-button{box-sizing:border-box;min-height:32px;padding:0 11px;border:.5px solid var(--dsw-alias-border-l3);border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer}',
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
      '.ra-icon-button{display:grid;place-items:center;width:30px;height:30px;padding:0;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;cursor:pointer}',
      '.ra-icon-button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}',
      '.ra-icon-button[data-danger=true]:hover:not(:disabled){color:var(--dsw-alias-state-error-primary)}',
      '.ra-switch{position:relative;width:34px;height:20px;padding:0;border:0;border-radius:999px;background:var(--dsw-alias-bg-layer-3);cursor:pointer}',
      '.ra-switch::after{content:"";position:absolute;top:3px;left:3px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground);transition:transform .12s ease}',
      '.ra-switch[aria-checked=true]{background:var(--dsw-alias-state-business-primary)}',
      '.ra-switch[aria-checked=true]::after{transform:translateX(14px)}',
      '.ra-switch:disabled{opacity:.45;cursor:not-allowed}',
      '.ra-source-url{margin-top:10px;padding-top:9px;border-top:.5px solid var(--dsw-alias-border-l4);color:var(--dsw-alias-label-tertiary);font:11px/17px ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ra-source-error{margin-top:7px;color:var(--dsw-alias-state-error-primary);font-size:11px;line-height:16px}',
      '.ra-empty{padding:18px;border:.5px solid var(--dsw-alias-border-l4);border-radius:12px;color:var(--dsw-alias-label-tertiary)}',
      '.ra-empty strong{display:block;margin-bottom:3px;color:var(--dsw-alias-label-primary)}',
      '.ra-search{box-sizing:border-box;width:100%;height:36px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit}',
      '.ra-search:disabled{opacity:.62;cursor:not-allowed}',
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
      })
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
          h('button', {
            type: 'button',
            className: 'ra-button',
            disabled: !writable || busy,
            'aria-expanded': open,
            onClick: () => setOpen(value => !value),
          }, open ? t('sourceCancel') : t('sourceAdd')),
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
            h('button', { type: 'button', className: 'ra-button', disabled: busy, onClick: reset }, t('sourceCancel')),
            h('button', { type: 'submit', className: 'ra-button ra-button-primary', disabled: busy }, t('sourceSave')),
          ),
          error ? h('p', { className: 'ra-error', role: 'alert' }, error) : null,
        ) : null,
      )
    }

    function SourceCard({ source, health, countState, t, busy, writable, onToggle, onRemove }) {
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
      const countText = count === undefined
        ? countState?.loading ? t('sourceCounting') : ''
        : format(t,
          source.type === 'github' ? 'sourceRepositories' : source.type === 'npm' ? 'sourcePackages' : 'sourceItems',
          { count: String(count) + (countState?.truncated ? '+' : '') })
      const latency = Number.isFinite(health?.latencyMs)
        ? format(t, 'sourceLatency', { value: health.latencyMs })
        : ''
      const endpoint = endpointFor(source)
      const error = health?.error || countState?.error

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
                h('span', null, source.type),
                latency ? h('span', null, latency) : null,
                countText ? h('span', null, countText) : null,
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
            h('button', {
              type: 'button',
              className: 'ra-icon-button',
              'data-danger': true,
              title: t('sourceRemove'),
              'aria-label': t('sourceRemove'),
              disabled: !writable || busy,
              onClick: () => onRemove(source.id),
            }, '×'),
          ),
        ),
        h('div', { className: 'ra-source-url', title: endpoint }, endpoint),
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
            h('button', {
              type: 'button',
              className: 'ra-button',
              disabled: healthState.loading || countState.loading,
              onClick: () => setRevision(value => value + 1),
            }, t('sourceRefresh')),
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
      return h('section', { className: 'ra-section', 'aria-labelledby': 'ra-browse-title' },
        h('div', null,
          h('h3', { id: 'ra-browse-title', className: 'ra-heading' }, t('browseTitle')),
          h('p', { className: 'ra-lead' }, t('browseLead')),
        ),
        h('input', {
          className: 'ra-search',
          type: 'search',
          disabled: true,
          placeholder: t('browsePlaceholder'),
          'aria-label': t('browsePlaceholder'),
        }),
        h(Empty, { title: t('browseEmptyTitle'), body: t('browseEmptyBody') }),
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

    function RegistryAggregator({ t, view, form }) {
      const [tab, setTab] = React.useState('sources')
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
      inject: ['slots', 'locale', 'connection'],
      apply(ctx) {
        connection = ctx.connection
        ctx.effect(() => ctx.locale.register(NS, { en, zh }), 'registry-aggregator: locale')
        ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
          name: 'plugins.bundle.config',
          key: PACKAGE,
          locale: NS,
        }, RegistryAggregator))
      },
    }
  },
})
