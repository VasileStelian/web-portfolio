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
};

export const projectSchema = z.discriminatedUnion('tier', [
  z.object({
    tier: z.literal('deep'),
    ...shared,
    decision: z.object({
      claim: z.string().min(1),
      reasoning: z.string().min(1),
    }),
    tradeoff: z.string().min(1),
  }),
  z.object({
    tier: z.literal('brief'),
    ...shared,
  }),
]);

export type Project = z.infer<typeof projectSchema>;
export type ProjectLink = z.infer<typeof linkSchema>;
