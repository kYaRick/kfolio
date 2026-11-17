import type { APIRoute } from 'astro';
import { getAgentBundle, jsonResponse } from '@/lib/agent-api';

export const GET: APIRoute = async ({ site }) => {
  const bundle = await getAgentBundle(site);
  return jsonResponse({
    ...bundle.meta,
    profile: bundle.cv,
    blog: bundle.blog,
  });
};
