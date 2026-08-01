// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { projectSchema, roleSchema } from './schemas/project';

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: projectSchema,
});

const experience = defineCollection({
  loader: glob({ base: './src/content/experience', pattern: '**/*.md' }),
  schema: roleSchema,
});

export const collections = { projects, experience };
