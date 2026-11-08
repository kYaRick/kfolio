import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { LANGS } from './lib/site';

const cv = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/cv' }),
  schema: ({ image }) => z.object({
    lang: z.enum(LANGS),
    name: z.string(),
    title: z.string(),
    badge: z.string().optional(),
    avatar: image(),
    sessionHost: z.string().default('kyarick@hypervisor'),
    status: z.string().default('200 OK - Autonomous'),
    motto: z.string(),
    contacts: z.object({
      email: z.string(),
      telegram: z.string(),
      linkedin: z.string(),
      github: z.string(),
      twitter: z.string().optional(),
      bluesky: z.string().optional(),
      instagram: z.string().optional(),
      location: z.string(),
      experienceYears: z.number().default(6),
    }),
    toolsets: z.record(z.string(), z.array(z.string())),
    experience: z.array(
      z.object({
        company: z.string(),
        role: z.string(),
        period: z.string(),
        isCurrent: z.boolean().default(false),
        summary: z.string().optional(),
        duties: z.array(z.string()),
        techStack: z.array(z.string()),
      })
    ),
    education: z.array(
      z.object({
        year: z.string(),
        degree: z.string(),
        institution: z.string(),
      })
    ),
    languages: z.array(
      z.object({
        name: z.string(),
        level: z.string(),
        flag: z.string().optional(),
        note: z.string().optional(),
      })
    ),
    interests: z.array(z.string()),
    aspirations: z.object({
      intro: z.string(),
      focus: z.array(z.object({ area: z.string(), desc: z.string() })),
      militaryProjects: z.string().optional(),
      personal: z.string().optional(),
    }),
    humor: z.object({
      lightbulb: z.object({ q: z.string(), a: z.string() }),
      deadLanguages: z.array(z.string()),
      bio: z.string(),
      realityDisclaimer: z.string(),
    }),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    lang: z.enum(LANGS),
    tags: z.array(z.string()).default([]),
    author: z.string().default('Yaroslav Kyliushyk'),
  }),
});

export const collections = { cv, blog };
