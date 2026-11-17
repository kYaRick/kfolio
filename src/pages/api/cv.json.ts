import type { APIRoute } from 'astro';
import { getAgentBundle, jsonResponse } from '@/lib/agent-api';

export const GET: APIRoute = async ({ site }) => {
  const bundle = await getAgentBundle(site);
  return jsonResponse({
    endpoint_type: 'agent-cv-slice',
    generated_at: bundle.meta.generated_at,
    profile: bundle.cv,
  });
};
