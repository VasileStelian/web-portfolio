import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

// The site has to say what the CV says. In November 2026 the CV moved to developer roles
// while the site still described an IT Systems & Security Engineer, and the portfolio link
// came off the CV until the two agreed again. These checks hold the claims that drifted.

const entries = (dir: string) =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(`${dir}/${file}`, 'utf8');
      const field = (key: string) => raw.match(new RegExp(`^${key}: (.+)$`, 'm'))?.[1] ?? '';
      return { file, raw, order: Number(field('order')), title: field('title'), period: field('period') };
    })
    .sort((a, b) => a.order - b.order);

describe('experience matches the CV', () => {
  const roles = entries('src/content/experience');

  it('leads with the OptimumDesk developer role, still current', () => {
    expect(roles[0].title).toBe('Software Developer, OptimumDesk platform');
    expect(roles[0].period).toBe('October 2026 — present');
  });

  it('describes the XDR module both ways, with the 307-case parity result', () => {
    expect(roles[0].raw).toMatch(/XDR/);
    expect(roles[0].raw).toMatch(/Wazuh/);
    expect(roles[0].raw).toMatch(/307 test cases/);
  });

  it('frames the earlier Startech role as development, ending September 2026', () => {
    expect(roles[1].title).toBe('IT Engineer, automation and internal tools');
    expect(roles[1].period).toBe('June 2024 — September 2026');
    expect(roles[1].raw).not.toMatch(/root cause|50 to 60|estates/i);
  });
});
