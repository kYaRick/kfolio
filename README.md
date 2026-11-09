<div align="center">
  <img src=".github/assets/banner.svg" alt="kfolio: bilingual CV and engineering dispatches" width="100%">

[![Deploy to GitHub Pages](https://github.com/kYaRick/kfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/kYaRick/kfolio/actions/workflows/deploy.yml)
[![Astro](https://img.shields.io/badge/Astro-7.x-BC52EE.svg?style=flat-square&logo=astro&logoColor=white)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Task Runner: just](https://img.shields.io/badge/Task_Runner-just-000000.svg?style=flat-square&logo=just&logoColor=white)](https://github.com/casey/just)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-F69220.svg?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-FCD34D.svg?style=flat-square)](LICENSE)

</div>

> Interactive bilingual CV and engineering dispatches styled after the **Hermes Agent** console (`kYa.Camilla.Agent`).

---

## Highlights and Features

- 🛰️ **Hermes Terminal Aesthetic:** Bento dashboard layout, pixel vector trident emblem, telemetry widgets, and terminal window controls inspired by `kYa.Camilla.Agent`.
- 🎨 **Multi-Theme Engine:**
  - `hermes-dark` (Default: gold, amber, obsidian CLI console)
  - `fluent-dark` (Microsoft Fluent 2 Acrylic / Mica with vibrant colored technology tags)
  - `hermes-light` (Clean high-contrast paper slate mode for recruiters)
  - `seasonal-winter` (Frost and ice core with dynamic snowfall)
- 🌐 **Bilingual (i18n):** Native Astro static routing for English (`/en/`) and Ukrainian (`/uk/`) with persistent UI dictionaries.
- 📝 **Markdown Content Layer:** Type-safe CV collections and blog dispatches validated via Zod schemas.
- 🖨️ **Print and PDF Engine:** One-click print export with automatic accordion expansion, customizable section toggles, and A4-optimized pagination.
- ⚡ **SSG Performance:** High-speed static generation with Astro ClientRouter, telemetry loading bars, and zero heavy client frameworks.

---

## Tech Stack

- **Framework:** [Astro 7](https://astro.build/)
- **Language:** TypeScript (Strict Nullable Types, Zero-Warning Policy)
- **Task Runner:** [just](https://github.com/casey/just)
- **Content:** Astro Content Layer (Markdown + Zod schemas)
- **Styling:** Modern Vanilla CSS (Custom Properties, Bento Grid, Terminal Theming)
- **Package Manager:** `pnpm`
- **CI/CD:** GitHub Actions -> GitHub Pages

---

## Local Development (with `just`)

All routine operations run via `just`:

```bash
# List all available recipes
just

# Install dependencies (frozen lockfile, same as CI)
just setup

# Start local dev server with hot reload (http://localhost:4321/kfolio/)
just dev

# Type-check .astro and .ts files (zero-warning policy)
just check

# Build static production bundle into dist/
just build

# Preview built dist/ locally
just preview

# Remove build artifacts and Astro caches
just clean

# Full verification gate (check + build)
just ci
```

---

<div align="center">
  <sub>✨ Made with love to 💛Ukraine💙</sub>
</div>
