// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import starlight from '@astrojs/starlight';
import starlightLlmsTxt from 'starlight-llms-txt';

// https://astro.build/config
export default defineConfig({
  site: 'https://contextlint.dev',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    starlight({
      title: 'contextlint',
      description:
        'Documentation for contextlint — a semantic linter for structured Markdown.',
      defaultLocale: 'root',
      locales: {
        root: { label: 'English', lang: 'en' },
        ja: { label: '日本語', lang: 'ja' },
        ko: { label: '한국어', lang: 'ko' },
        zh: { label: '中文', lang: 'zh' },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/nozomi-koborinai/contextlint',
        },
      ],
      sidebar: [
        { label: 'Get Started', autogenerate: { directory: 'docs/get-started' } },
        { label: 'Concepts', autogenerate: { directory: 'docs/concepts' } },
        { label: 'Configuration', autogenerate: { directory: 'docs/configuration' } },
        {
          label: 'Rules',
          items: [
            'docs/rules',
            {
              label: 'TBL — Table',
              items: [
                'docs/rules/tbl-001',
                'docs/rules/tbl-002',
                'docs/rules/tbl-003',
                'docs/rules/tbl-004',
                'docs/rules/tbl-005',
                'docs/rules/tbl-006',
              ],
            },
            {
              label: 'SEC — Section',
              items: [
                'docs/rules/sec-001',
                'docs/rules/sec-002',
              ],
            },
            {
              label: 'STR — Structure',
              items: ['docs/rules/str-001'],
            },
            {
              label: 'REF — Reference',
              items: [
                'docs/rules/ref-001',
                'docs/rules/ref-002',
                'docs/rules/ref-003',
                'docs/rules/ref-004',
                'docs/rules/ref-005',
                'docs/rules/ref-006',
              ],
            },
            {
              label: 'CHK — Checklist',
              items: ['docs/rules/chk-001'],
            },
            {
              label: 'CTX — Context',
              items: [
                'docs/rules/ctx-001',
                'docs/rules/ctx-002',
              ],
            },
            {
              label: 'GRP — Graph',
              items: [
                'docs/rules/grp-001',
                'docs/rules/grp-002',
                'docs/rules/grp-003',
              ],
            },
          ],
        },
        { label: 'Integrations', autogenerate: { directory: 'docs/integrations' } },
        { label: 'Graph API', autogenerate: { directory: 'docs/graph-api' } },
        { label: 'Recipes', autogenerate: { directory: 'docs/recipes' } },
        { label: 'Contributing', autogenerate: { directory: 'docs/contributing' } },
      ],
      plugins: [starlightLlmsTxt()],
      components: {
        SiteTitle: './src/components/StarlightSiteTitle.astro',
      },
      customCss: ['./src/styles/starlight-overrides.css'],
      head: [
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        },
        {
          tag: 'link',
          attrs: { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: true },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'stylesheet',
            href: 'https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&family=Funnel+Sans:wght@300..800&family=JetBrains+Mono:wght@400;500;700&display=swap',
          },
        },
      ],
    }),
  ],
});
