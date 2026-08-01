import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { projectSchema, roleSchema } from '../../src/schemas/project';

const baseLinks = [{ label: 'Live', href: 'https://example.com', kind: 'live' as const }];

const highlights = [
  { label: 'Concurrency', text: 'Made double-booking structurally impossible via a unique index.' },
  { label: 'One code path', text: 'Business logic in Action classes, testable without HTTP.' },
  { label: 'Deploys itself', text: 'Content changes rebuild the marketing site with no manual step.' },
];

const deep = {
  tier: 'deep' as const,
  order: 1,
  title: 'Apollo Booking',
  tagline: 'Appointment platform',
  status: 'in production' as const,
  stack: ['PHP 8.3', 'Laravel'],
  summary: 'A complete booking product built from scratch.',
  links: baseLinks,
  highlights,
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

  it('accepts a brief project carrying no highlights', () => {
    expect(projectSchema.safeParse(brief).success).toBe(true);
  });

  it('rejects any project with no links', () => {
    const result = projectSchema.safeParse({ ...deep, links: [] });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('links');
  });

  it('rejects a deep project with no highlights at all', () => {
    const { highlights: _dropped, ...withoutHighlights } = deep;
    const result = projectSchema.safeParse(withoutHighlights);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('highlights');
  });

  // A deep project earns its place by having something to say. Two bullets is a
  // stub; the floor exists so a half-written entry cannot ship as a finished one.
  it('rejects a deep project with fewer than three highlights', () => {
    const result = projectSchema.safeParse({ ...deep, highlights: highlights.slice(0, 2) });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('highlights');
  });

  it('rejects a highlight with empty text', () => {
    const result = projectSchema.safeParse({
      ...deep,
      highlights: [...highlights.slice(1), { label: 'Concurrency', text: '' }],
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('text');
  });

  it('rejects a highlight with an empty label', () => {
    const result = projectSchema.safeParse({
      ...deep,
      highlights: [...highlights.slice(1), { label: '', text: 'Something real happened.' }],
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('label');
  });

  // The label is a mono tag sitting in a fixed-width column. A sentence there wraps
  // into a ribbon and wrecks the row, so the cap is a layout guarantee, not taste.
  it('rejects a highlight label longer than 24 characters', () => {
    const result = projectSchema.safeParse({
      ...deep,
      highlights: [
        ...highlights.slice(1),
        { label: 'This label is far too long to sit in the column', text: 'Body.' },
      ],
    });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('label');
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

  it('rejects a case-study link with a protocol-relative href', () => {
    const result = projectSchema.safeParse({
      ...deep,
      links: [{ label: 'Case study', href: '//evil.com', kind: 'case-study' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('roleSchema', () => {
  const role = {
    order: 1,
    title: 'IT Systems & Security Engineer',
    employer: 'Class IT Outsourcing',
    period: 'June 2024 — present',
    mode: 'Fully remote',
    highlights: [{ label: 'Five steps to two', text: 'Cut a five-step routine down to two.' }],
  };

  it('accepts a complete role', () => {
    expect(roleSchema.safeParse(role).success).toBe(true);
  });

  it('accepts a role with no mode', () => {
    const { mode: _dropped, ...withoutMode } = role;
    expect(roleSchema.safeParse(withoutMode).success).toBe(true);
  });

  it('rejects a role with no highlights', () => {
    const result = roleSchema.safeParse({ ...role, highlights: [] });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('highlights');
  });

  it('rejects a role missing its period', () => {
    const { period: _dropped, ...withoutPeriod } = role;
    const result = roleSchema.safeParse(withoutPeriod);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('period');
  });
});

describe('content files', () => {
  const countMd = (dir: string) => readdirSync(dir).filter((f) => f.endsWith('.md'));

  const uniqueOrders = (dir: string) => {
    const orders = countMd(dir).map((f) =>
      Number(readFileSync(`${dir}/${f}`, 'utf8').match(/^order:\s*(\d+)$/m)![1]),
    );
    return new Set(orders).size === orders.length;
  };

  it('has exactly five project files', () => {
    expect(countMd('src/content/projects')).toHaveLength(5);
  });

  it('has three experience files', () => {
    expect(countMd('src/content/experience')).toHaveLength(3);
  });

  it('gives every project a unique order', () => {
    expect(uniqueOrders('src/content/projects')).toBe(true);
  });

  it('gives every role a unique order', () => {
    expect(uniqueOrders('src/content/experience')).toBe(true);
  });
});
