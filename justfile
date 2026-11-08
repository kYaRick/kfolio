# kfolio task runner. Run `just` to list recipes.

set windows-shell := ["pwsh.exe", "-NoLogo", "-NoProfile", "-Command"]

default:
    @just --list

# Install dependencies (frozen lockfile, same as CI)
setup:
    pnpm install --frozen-lockfile

# Dev server with hot reload: http://localhost:4321/kfolio/
dev:
    pnpm run dev

# Type check .astro and .ts files (zero warnings)
check:
    pnpm run check --minimumFailingSeverity warning

# Static build into dist/
build:
    pnpm run build

# Serve the built dist/ locally
preview: build
    pnpm run preview

# Remove build output and Astro caches
clean:
    node -e "for (const d of ['dist', '.astro', 'node_modules/.astro']) require('fs').rmSync(d, { recursive: true, force: true })"

# Everything CI runs
ci: check build
