import type { CollectionEntry } from 'astro:content';

export const LANGS = ['en', 'uk'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'en';

export type Page = 'cv' | 'blog';

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');

/** Prefix a site-relative path with the configured `base` (e.g. `/kfolio/`). */
export function url(path = ''): string {
  return BASE + path.replace(/^\/+/, '');
}

/** Route to a page in the given language: `/kfolio/en/`, `/kfolio/uk/blog/`. */
export function pageUrl(lang: Lang, page: Page = 'cv'): string {
  return url(page === 'blog' ? `${lang}/blog/` : `${lang}/`);
}

export function langStaticPaths() {
  return LANGS.map((lang) => ({ params: { lang } }));
}

type Post = CollectionEntry<'blog'>;

/** Post id is `<lang>/<slug>` (glob loader, extension stripped). */
export function postSlug(post: Post): string {
  return post.id.split('/').slice(1).join('/');
}

export function postUrl(post: Post): string {
  return url(`${post.data.lang}/blog/${postSlug(post)}/`);
}

export function byNewest(a: Post, b: Post): number {
  return b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
