# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal site/blog at https://rogerluo.dev/, based on the AstroPaper theme. Astro 4 + React + Tailwind, with KaTeX math, RSS, sitemap, and OG image generation via satori/resvg.

## Common commands

Package manager: `pnpm` (pnpm-lock.yaml is the source of truth; package-lock.json is also present but pnpm is preferred).

- `pnpm dev` — start dev server (`astro dev`).
- `pnpm build` — `astro build` then `jampack ./dist` to optimize the output.
- `pnpm preview` — serve the built site.
- `pnpm sync` — regenerate Astro content collection types after editing `src/content/config.ts` or frontmatter schema.
- `pnpm lint` — ESLint over the repo (config: `.eslintrc.js`, includes `eslint-plugin-astro`).
- `pnpm format` / `pnpm format:check` — Prettier with `prettier-plugin-astro` and `prettier-plugin-tailwindcss`.
- `pnpm cz` — Commitizen prompt for a conventional-commit message.

There is no test suite.

## Commits

**Always use Conventional Commits** (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, etc.). The repo is configured with Commitizen (`cz-conventional-changelog`) and `prek` runs Prettier on staged files via `prek.toml` (installs to `.git/hooks/pre-commit` with `prek install`). Prefer `pnpm cz` or write the message in Conventional Commits form manually. Recent history (e.g. `chore: add skills`, `fix naive broutine`) follows this convention — match it.

## Architecture

This is a stock AstroPaper layout; the parts that matter when editing:

- **Content lives in `src/content/blog/*.md`.** Each post's frontmatter is validated by the Zod schema in `src/content/config.ts` (required: `title`, `description`, `pubDatetime`; optional: `tags`, `featured`, `draft`, `ogImage`, `modDatetime`, `canonicalURL`). `ogImage` must be ≥1200×630 if it's a local image. After schema changes, run `pnpm sync`.
- **Site-wide settings are in `src/config.ts`** (`SITE`, `LOCALE`, `LOGO_IMAGE`, `SOCIALS`). `SITE.website` is consumed by `astro.config.ts` and the OG/RSS routes.
- **Markdown pipeline (`astro.config.ts`)**: remark plugins are `remarkToc`, `remarkMath`, `remarkReadingTime` (custom, in `src/utils/`), and `remarkCollapse` (collapses a section titled "Table of contents"). Rehype: `rehypeKatex`. Shiki uses `github-light`/`github-dark` with line wrapping. KaTeX CSS must be loaded by the layout for math to render.
- **Routing**: `src/pages/` contains the Astro routes — `index.astro`, `posts/`, `tags/`, `search.astro` (Fuse.js client-side), `rss.xml.ts`, `og.png.ts` (per-site OG via satori + resvg), `robots.txt.ts`, `404.astro`. Layouts under `src/layouts/` (`Layout.astro` is the base; `PostDetails.astro`, `Posts.astro`, `TagPosts.astro`, `AboutLayout.astro`, `Main.astro`).
- **`@config` import alias** resolves to `src/config.ts` (see `tsconfig.json`); `@/*` is also aliased to `src/*`.
- **Build optimization**: `@divriots/jampack` post-processes `dist/` (image/CSS/HTML optimizations). If something looks off only in production builds, jampack is the likely culprit.

## Tooling

- `Ion.toml` declares Claude Code skills (ion-cli, frontend-design, astro) installed into `.claude/skills`. Use the `ion-cli` skill (or `ion` CLI) to manage these — don't hand-edit `.claude/skills/`.
- `mise.toml` pins `prek` (pre-commit runner).
- Node/pnpm versions are not pinned via `.nvmrc`/`engines`; use a recent LTS Node.
