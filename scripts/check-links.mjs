// Verifies every external link in the content collection still resolves.
//
// Run it before publishing, or on a schedule — deliberately not on every build. A
// rate-limited third party should not be able to turn a commit red, and a dead link
// is urgent in days, not in minutes.
//
//   npm run check:links
import { readdirSync, readFileSync } from 'node:fs';

const DIR = 'src/content/projects';

// LinkedIn answers non-browser clients with 999. Treating that as a failure would fire a
// false alarm on every run, which trains you to ignore the alarm — worse than no check.
const ACCEPTED = new Set([200, 201, 202, 203, 204, 301, 302, 303, 307, 308, 999]);

const urls = new Set();
for (const file of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const content = readFileSync(`${DIR}/${file}`, 'utf8');
  for (const match of content.matchAll(/href:\s*(https:\/\/\S+)/g)) {
    urls.add(match[1]);
  }
}

// The hero and contact links live in site config, not in the collection.
urls.add('https://github.com/VasileStelian');
urls.add('https://www.linkedin.com/in/vasilestelian/');

let failed = 0;

for (const url of [...urls].sort()) {
  let status = 0;
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (portfolio link check)' },
      signal: AbortSignal.timeout(20_000),
    });
    status = response.status;
  } catch (error) {
    console.log(`FAIL  ${url}  ${error.message}`);
    failed += 1;
    continue;
  }

  if (ACCEPTED.has(status)) {
    console.log(`OK    ${url}  ${status}`);
  } else {
    console.log(`FAIL  ${url}  ${status}`);
    failed += 1;
  }
}

console.log(`\n${urls.size} checked, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
