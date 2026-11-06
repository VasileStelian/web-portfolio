// The date each page's content last changed, read by the sitemap so Google re-crawls a
// page when it changes and not otherwise. Bump a page's date in the same commit that
// changes what it shows (text, facts, title, description), to the day that commit reaches
// production, in Romanian time. Layout, style and refactor commits date nothing.
export const LASTMOD: Record<string, string> = {
  '/': '2026-11-06',
  '/work/school-logistics/': '2026-11-06',
  '/work/avariiacum/': '2026-11-06',
  '/work/scolidesofer/': '2026-11-06',
  '/work/apollo-booking/': '2026-11-06',
  '/work/finforge/': '2026-11-06',
  '/work/sigurantapenet/': '2026-11-06',
};

export function withLastmod<T extends { url: string; lastmod?: string }>(item: T): T {
  const path = new URL(item.url).pathname;
  const date = LASTMOD[path];
  if (!date) throw new Error(`No lastmod for ${path}. Add it to src/config/lastmod.ts.`);
  return { ...item, lastmod: date };
}
