// The date each page's content last changed, read by the sitemap so Google re-crawls a
// page when it changes and not otherwise. Bump a page's date in the same commit that
// changes what it shows (text, facts, title, description), to the day that commit reaches
// production, in Romanian time. Layout, style and refactor commits date nothing.
export const LASTMOD: Record<string, string> = {
  '/': '2026-11-05',
  '/work/school-logistics/': '2026-11-05',
  '/work/avariiacum/': '2026-11-05',
  '/work/scolidesofer/': '2026-11-05',
  '/work/apollo-booking/': '2026-11-05',
  '/work/finforge/': '2026-11-05',
  '/work/sigurantapenet/': '2026-11-05',
};

export function withLastmod<T extends { url: string; lastmod?: string }>(item: T): T {
  const path = new URL(item.url).pathname;
  const date = LASTMOD[path];
  if (!date) throw new Error(`No lastmod for ${path}. Add it to src/config/lastmod.ts.`);
  return { ...item, lastmod: date };
}
