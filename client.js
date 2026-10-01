window.__ModuleLoader__.load({
  id: '@stolyarovmn/dsh-ui-registry-aggregator',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'registryAggregator'
    const PACKAGE = '@stolyarovmn/dsh-ui-registry-aggregator'

    const en = {
      sources: 'Sources',
      browse: 'Browse',
      updates: 'Updates',
      sourcesTitle: 'Plugin sources',
      sourcesLead: 'Federated npm, GitHub, and catalog adapters will live here.',
      sourcesEmptyTitle: 'Clean DSH 0.2 skeleton',
      sourcesEmptyBody: 'No legacy 0.1.x source runtime has been carried forward. Source adapters are the next migration step.',
      browseTitle: 'Browse plugins',
      browseLead: 'Search and ranking will be connected after the source layer is migrated.',
      browsePlaceholder: 'Search plugins',
      browseEmptyTitle: 'Discovery is not connected yet',
      browseEmptyBody: 'The final view will keep search, filters, stars, downloads, freshness, and compatibility evidence.',
      updatesTitle: 'Plugin updates',
      updatesLead: 'Update discovery will complement the native DSH Plugin Manager instead of replacing it.',
      updatesEmptyTitle: 'No update data yet',
      updatesEmptyBody: 'Installed bundle management remains native to DSH. This tab will only discover and orchestrate available upgrades.',
      target: 'Target',
      nativeLifecycle: 'Native lifecycle',
      nativeLifecycleValue: 'DSH Plugin Manager',
    }

    const zh = {
      sources: '来源',
      browse: '浏览',
      updates: '更新',
      sourcesTitle: '插件来源',
      sourcesLead: 'npm、GitHub 与目录适配器将在这里统一管理。',
      sourcesEmptyTitle: '全新的 DSH 0.2 骨架',
      sourcesEmptyBody: '没有继承旧的 0.1.x 来源运行时。下一步将迁移来源适配器。',
      browseTitle: '浏览插件',
      browseLead: '来源层迁移后再接入搜索和排序。',
      browsePlaceholder: '搜索插件',
      browseEmptyTitle: '发现功能尚未连接',
      browseEmptyBody: '最终界面会保留搜索、筛选、Stars、下载量、新鲜度和兼容性信息。',
      updatesTitle: '插件更新',
      updatesLead: '更新发现用于补充原生 DSH Plugin Manager，而不是替代它。',
      updatesEmptyTitle: '暂无更新数据',
      updatesEmptyBody: '已安装 bundle 的生命周期管理继续由 DSH 原生负责。本页只负责发现和编排可用升级。',
      target: '目标版本',
      nativeLifecycle: '原生生命周期',
      nativeLifecycleValue: 'DSH Plugin Manager',
    }

    const css = `
.ra-root{color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;padding:2px 0 8px}
.ra-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:min(100%,440px);padding:4px;margin:12px 0 20px;border-radius:12px;background:var(--dsw-alias-bg-module-platform,var(--dsw-alias-bg-layer-2))}
.ra-tab{height:34px;padding:0 14px;border:.5px solid transparent;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-weight:400;cursor:pointer}
.ra-tab:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.ra-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.ra-tab[aria-selected=true]{border-color:var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-bg-layer-1));color:var(--dsw-alias-label-primary);font-weight:600}
.ra-section{display:grid;gap:12px}
.ra-heading{margin:0;font-size:14px;line-height:20px;font-weight:600;color:var(--dsw-alias-label-primary)}
.ra-lead{margin:2px 0 0;color:var(--dsw-alias-label-tertiary)}
.ra-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:2px}
.ra-pill{display:inline-flex;align-items:center;min-height:22px;padding:0 8px;border:.5px solid var(--dsw-alias-border-l3);border-radius:999px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1)}
.ra-card{padding:14px;border:.5px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.ra-empty-title{margin:0 0 4px;font-weight:600;color:var(--dsw-alias-label-primary)}
.ra-empty-body{margin:0;color:var(--dsw-alias-label-tertiary)}
.ra-search{box-sizing:border-box;width:100%;height:36px;margin:2px 0 0;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit}
.ra-search::placeholder{color:var(--dsw-alias-label-caption,var(--dsw-alias-label-tertiary))}
.ra-search:disabled{opacity:.62;cursor:not-allowed}
@media(max-width:640px){.ra-tabs{width:100%}.ra-tab{padding:0 8px}}
`

    function EmptyCard({ title, body }) {
      return h('div', { className: 'ra-card' },
        h('p', { className: 'ra-empty-title' }, title),
        h('p', { className: 'ra-empty-body' }, body),
      )
    }

    function SourcesView({ t }) {
      return h('section', { className: 'ra-section', 'aria-labelledby': 'ra-sources-title' },
        h('div', null,
          h('h3', { id: 'ra-sources-title', className: 'ra-heading' }, t('sourcesTitle')),
          h('p', { className: 'ra-lead' }, t('sourcesLead')),
        ),
        h('div', { className: 'ra-meta' },
          h('span', { className: 'ra-pill' }, `${t('target')}: DSH 0.2.0-rc.2`),
          h('span', { className: 'ra-pill' }, `${t('nativeLifecycle')}: ${t('nativeLifecycleValue')}`),
        ),
        h(EmptyCard, { title: t('sourcesEmptyTitle'), body: t('sourcesEmptyBody') }),
      )
    }

    function BrowseView({ t }) {
      return h('section', { className: 'ra-section', 'aria-labelledby': 'ra-browse-title' },
        h('div', null,
          h('h3', { id: 'ra-browse-title', className: 'ra-heading' }, t('browseTitle')),
          h('p', { className: 'ra-lead' }, t('browseLead')),
        ),
        h('input', { className: 'ra-search', type: 'search', disabled: true, placeholder: t('browsePlaceholder'), 'aria-label': t('browsePlaceholder') }),
        h(EmptyCard, { title: t('browseEmptyTitle'), body: t('browseEmptyBody') }),
      )
    }

    function UpdatesView({ t }) {
      return h('section', { className: 'ra-section', 'aria-labelledby': 'ra-updates-title' },
        h('div', null,
          h('h3', { id: 'ra-updates-title', className: 'ra-heading' }, t('updatesTitle')),
          h('p', { className: 'ra-lead' }, t('updatesLead')),
        ),
        h(EmptyCard, { title: t('updatesEmptyTitle'), body: t('updatesEmptyBody') }),
      )
    }

    function RegistryAggregator({ t, view }) {
      const [tab, setTab] = React.useState('sources')
      if (view !== 'page') return null
      const tabs = [
        ['sources', t('sources')],
        ['browse', t('browse')],
        ['updates', t('updates')],
      ]
      const body = tab === 'browse'
        ? h(BrowseView, { t })
        : tab === 'updates'
          ? h(UpdatesView, { t })
          : h(SourcesView, { t })
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
          }, label)),
        ),
        body,
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
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
