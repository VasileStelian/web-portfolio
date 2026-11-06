import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { LASTMOD, withLastmod } from '../../src/config/lastmod';

// The pages the site builds: the index plus one case study per deep project.
const DIR = 'src/content/projects';
const caseStudies = readdirSync(DIR)
  .filter((file) => file.endsWith('.md'))
  .filter((file) => /^tier: deep$/m.test(readFileSync(`${DIR}/${file}`, 'utf8')))
  .map((file) => `/work/${file.replace(/^\d+-/, '').replace(/\.md$/, '')}/`);

// Dates are written in Romanian time; after 22:00 UTC is still on the previous day.
const todayInRomania = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date());

describe('sitemap lastmod', () => {
  it('dates exactly the pages the site builds', () => {
    expect(Object.keys(LASTMOD).sort()).toEqual(['/', ...caseStudies].sort());
  });

  it('uses real calendar dates, none in the future', () => {
    for (const [path, date] of Object.entries(LASTMOD)) {
      expect(date, path).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10), path).toBe(date);
      expect(date <= todayInRomania, `${path} is dated ${date}`).toBe(true);
    }
  });

  it('stamps a sitemap entry with its page date', () => {
    expect(withLastmod({ url: 'https://example.com/' }).lastmod).toBe(LASTMOD['/']);
  });

  // A page added without a date has to fail the build, not ship undated.
  it('throws for a page that has no date', () => {
    expect(() => withLastmod({ url: 'https://example.com/work/missing/' })).toThrow(/lastmod/);
  });
});
