import { getEntry } from 'astro:content';
import type { Lang } from '@/lib/site';
import { fullYearsSince } from '@/lib/dates';

/**
 * CV data for one language. Fails the build if the entry is missing.
 * Adds derived fields: `experience` sorted newest first and `experienceYears`
 * counted from the earliest job start (recomputed on every build).
 */
export async function getCv(lang: Lang) {
  const entry = await getEntry('cv', lang);
  if (!entry) throw new Error(`CV entry for language '${lang}' not found.`);
  const data = entry.data;
  const experience = [...data.experience].sort((a, b) => b.start.localeCompare(a.start));
  const careerStart = experience.reduce((min, job) => (job.start < min ? job.start : min), experience[0]?.start ?? '');
  return {
    ...data,
    experience,
    experienceYears: careerStart ? fullYearsSince(careerStart) : 0,
  };
}
