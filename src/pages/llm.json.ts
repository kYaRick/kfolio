import type { APIRoute } from 'astro';
import { getAgentBundle, jsonResponse } from '@/lib/agent-api';

export const GET: APIRoute = async ({ site }) => {
  const bundle = await getAgentBundle(site);
  return jsonResponse({
    ...bundle.meta,
    summary: {
      name: bundle.cv.en.name,
      title: bundle.cv.en.title,
      badge: bundle.cv.en.badge,
      experience_years: bundle.experience.en.years,
      location: bundle.contacts.en.location,
      languages: bundle.cv.en.languages,
      blog_count: bundle.blog.count,
    },
  });
};
