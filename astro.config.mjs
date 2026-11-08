import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

// Vite denies `**/.git/**` by default. This repo lives under `C:\.git\`, so that
// rule blocks every file in dev. Deny only this project's own .git folder.
const root = fileURLToPath(new URL('.', import.meta.url)).replace(/\\/g, '/');

// https://astro.build/config
export default defineConfig({
  site: 'https://kyarick.github.io',
  base: '/kfolio',
  trailingSlash: 'always',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'uk'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false
    }
  },
  vite: {
    server: {
      fs: {
        deny: ['.env', '.env.*', '*.{crt,pem}', `${root}.git/**`]
      }
    }
  }
});
