# AGENT MANIFEST & OPERATIONAL GUIDELINES (ASTRO & MARKDOWN ARCHITECTURE)

## 1. PROJECT VISION & TECHNICAL ECOSYSTEM
* **Framework:** **Astro 7+** (Static Site Generation / Content Layer).
* **Language:** TypeScript (Strict Nullable Types, Zero-Warning Policy).
* **Content Source:** Markdown/MDX inside `src/content/` validated via Zod schemas in `src/content.config.ts`.
* **Styling:** Modern Vanilla CSS with CSS Custom Properties (Theming) and CSS Grid (Bento layouts). No CSS-in-JS, no SCSS.
* **Localization (i18n):** Native Astro i18n routing (`en`, `uk`).
* **Package Manager:** `pnpm`.
* **Deployment:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`).

---

## 2. REPOSITORY HIERARCHY & REPOSITORIES
| Path | Purpose |
| :--- | :--- |
| `src/content/cv/` | Bilingual CV collections (`en.md`, `uk.md`). |
| `src/content/blog/` | Engineering dispatches and markdown blog posts. |
| `src/content.config.ts` | Zod schemas for CV and blog collections. |
| `src/i18n/ui.ts` | UI strings dictionary (`en` is the source of truth, `uk` must define every key). |
| `src/lib/cv.ts` | `getCv(lang)` loader for CV data. |
| `src/scripts/` | Client scripts bundled by Astro (`avatar-fx.ts`: theme-aware avatar effect). |
| `src/assets/` | Images processed by `astro:assets` (avatar). |
| `src/lib/site.ts` | Languages (`LANGS`, `Lang`), base-aware URLs (`url`, `pageUrl`, `postUrl`), post helpers. |
| `src/components/` | Astro UI components for terminal layout and bento cards. |
| `src/layouts/` | Terminal shell and master layouts. |
| `src/styles/` | `theme.css` (custom properties) and `terminal.css` (terminal styles). |
| `.github/assets/` | README banner (not deployed). |
| `justfile` | Task runner for local work and CI (`just ci`). |

---

## 3. GUIDELINES FOR AI AGENTS
1. **Preserve Humor & Tone:** Maintain author personality, technical precision, and lighthearted humor across both languages.
2. **Strict Schema Compliance:** Any change to CV data or blog posts must strictly satisfy `src/content.config.ts`.
3. **No Heavy JS Frameworks:** Keep page output lightweight and static. Use vanilla scripts or small islands only when needed.
4. **Base-Aware Links:** Never hardcode `/kfolio/`. Use `url()`, `pageUrl()` or `postUrl()` from `src/lib/site.ts`.
5. **No Inline Translations:** Add UI text to `src/i18n/ui.ts` and use `t('key')`. Client scripts read labels from `data-*` attributes rendered with `t()`.
6. **Verification Gate:** Run `just ci` (type check with zero warnings + build) after making modifications.
