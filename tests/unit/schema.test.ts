import { describe, it, expect } from 'vitest';
import { projectSchema } from '../../src/schemas/project';

const baseLinks = [{ label: 'Live', href: 'https://example.com', kind: 'live' as const }];

const deep = {
  tier: 'deep' as const,
  order: 1,
  title: 'Apollo Booking',
  tagline: 'Appointment platform',
  status: 'in production' as const,
  stack: ['PHP 8.3', 'Laravel'],
  summary: 'A complete booking product built from scratch.',
  links: baseLinks,
  decision: { claim: 'Enforced in the database.', reasoning: 'An application check races.' },
  tradeoff: 'The error surfaces as a constraint violation.',
};

const brief = {
  tier: 'brief' as const,
  order: 4,
  title: 'diadrive.ro',
  tagline: 'Website, SEO and paid acquisition',
  status: 'shipped' as const,
  stack: ['Astro', 'Tailwind'],
  summary: 'Built the site, then took responsibility for whether anyone found it.',
  links: baseLinks,
};

describe('projectSchema', () => {
  it('accepts a complete deep project', () => {
    expect(projectSchema.safeParse(deep).success).toBe(true);
  });

  it('accepts a brief project with no decision or tradeoff', () => {
    expect(projectSchema.safeParse(brief).success).toBe(true);
  });

  it('rejects any project with no links', () => {
    const result = projectSchema.safeParse({ ...deep, links: [] });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('links');
  });

  it('rejects a deep project missing tradeoff', () => {
    const { tradeoff, ...withoutTradeoff } = deep;
    const result = projectSchema.safeParse(withoutTradeoff);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('tradeoff');
  });

  it('rejects a deep project whose decision has empty reasoning', () => {
    const result = projectSchema.safeParse({
      ...deep,
      decision: { claim: 'Enforced in the database.', reasoning: '' },
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('reasoning');
  });

  it('rejects a live link with a relative href', () => {
    const result = projectSchema.safeParse({
      ...deep,
      links: [{ label: 'Live', href: '/somewhere', kind: 'live' }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects a case-study link with an absolute href', () => {
    const result = projectSchema.safeParse({
      ...deep,
      links: [{ label: 'Case study', href: 'https://example.com/work/x', kind: 'case-study' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts a case-study link with a root-relative href', () => {
    const result = projectSchema.safeParse({
      ...deep,
      links: [{ label: 'Case study', href: '/work/apollo-booking', kind: 'case-study' }],
    });
    expect(result.success).toBe(true);
  });
});
