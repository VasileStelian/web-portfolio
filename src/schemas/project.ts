import { z } from 'astro/zod';

const ABSOLUTE = /^https:\/\/\S+$/;
const ROOT_RELATIVE = /^\/(?!\/)\S*$/;

export const linkSchema = z
  .object({
    label: z.string().min(1),
    href: z.string().min(1),
    kind: z.enum(['live', 'api', 'repo', 'case-study']),
  })
  .refine(
    (link) => (link.kind === 'case-study' ? ROOT_RELATIVE.test(link.href) : ABSOLUTE.test(link.href)),
    {
      message:
        'case-study links must be root-relative (/work/slug); live, api and repo links must be absolute https URLs',
      path: ['href'],
    },
  );

// An achievement, not a task. `label` is the short mono tag; `text` leads with the
// outcome and then explains the mechanism. A highlight that only says what was built,
// with no consequence, is the failure mode this shape exists to discourage.
export const highlightSchema = z.object({
  label: z.string().min(1).max(24),
  text: z.string().min(1),
});

// A screenshot pair. Both viewports are required together: a desktop-only shot of a
// booking flow says nothing about whether it works on the phone people actually book
// from, and that is the question a reader is really asking.
export const shotSchema = z.object({
  label: z.string().min(1),
  desktop: z.string().regex(/^\/screens\/\S+\.webp$/),
  mobile: z.string().regex(/^\/screens\/\S+\.webp$/),
  alt: z.string().min(1),
});

const shared = {
  order: z.number().int().positive(),
  title: z.string().min(1),
  tagline: z.string().min(1),
  status: z.enum(['in production', 'in daily use', 'shipped', 'ongoing']),
  stack: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
  // Every project links to something a reader can open. Enforced here so that
  // adding a project without evidence fails the build rather than shipping.
  links: z.array(linkSchema).min(1),
  shots: z.array(shotSchema).optional(),
};

export const projectSchema = z.discriminatedUnion('tier', [
  z.object({
    tier: z.literal('deep'),
    ...shared,
    highlights: z.array(highlightSchema).min(3),
  }),
  z.object({
    tier: z.literal('brief'),
    ...shared,
  }),
]);

export const roleSchema = z.object({
  order: z.number().int().positive(),
  title: z.string().min(1),
  employer: z.string().min(1),
  period: z.string().min(1),
  mode: z.string().optional(),
  highlights: z.array(highlightSchema).min(1),
});

export type Project = z.infer<typeof projectSchema>;
export type ProjectLink = z.infer<typeof linkSchema>;
export type Highlight = z.infer<typeof highlightSchema>;
export type Shot = z.infer<typeof shotSchema>;
export type Role = z.infer<typeof roleSchema>;
