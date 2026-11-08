import { getEntry } from 'astro:content';
import type { Lang } from '@/lib/site';

/** CV data for one language. Fails the build if the entry is missing. */
export async function getCv(lang: Lang) {
  const entry = await getEntry('cv', lang);
  if (!entry) throw new Error(`CV entry for language '${lang}' not found.`);
  return entry.data;
}
