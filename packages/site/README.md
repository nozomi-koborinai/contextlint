# @contextlint/site

Landing page for [contextlint.dev](https://contextlint.dev).

Built with Astro 6 + Tailwind CSS v4. Hosted on Cloudflare Pages with
auto-deploy from `main`. Private package — not published to npm.

## Development

```sh
bun --filter '@contextlint/site' dev
```

Opens at `http://localhost:4321/`.

## Build

```sh
bun --filter '@contextlint/site' build
```

Output goes to `packages/site/dist/`.

## Type-check

```sh
bun --filter '@contextlint/site' typecheck
```

## Tech stack

- [Astro](https://astro.build/) 6 (static SSG)
- [Tailwind CSS](https://tailwindcss.com/) v4 (via `@tailwindcss/vite`)
- Funnel Display + Funnel Sans + JetBrains Mono (Google Fonts)
- TypeScript strict
