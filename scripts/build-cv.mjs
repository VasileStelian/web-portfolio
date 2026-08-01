// Prints /cv to a real PDF using headless Chrome.
//
// Why this exists: the previous CV was exported as a flattened image, so it carried no
// font and no text layer. Every applicant tracking system that parses a CV saw a blank
// page. Chrome's print-to-PDF keeps the text and embeds the fonts, so the same document
// is readable by a person and parseable by a machine.
//
//   npm run build:cv
import { spawn } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';

// Any Chromium build prints identically; Brave is listed because it is what is
// installed here, not because it is preferred.
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
];

const OUT = 'public/Sofron_Vasile_Stelian_CV.pdf';
const URL = process.env.CV_URL ?? 'http://localhost:4321/cv';

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chrome or Chromium found. Looked in:\n  ' + CHROME_CANDIDATES.join('\n  '));
  process.exit(1);
}

const response = await fetch(URL).catch(() => null);
if (!response?.ok) {
  console.error(`${URL} is not responding. Start the dev server first: npm run dev`);
  process.exit(1);
}

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(stderr || `exit ${code}`))));
  });

await run(chrome, [
  '--headless',
  '--disable-gpu',
  '--no-sandbox',
  '--no-pdf-header-footer',
  '--virtual-time-budget=6000',
  `--print-to-pdf=${OUT}`,
  URL,
]);

if (!existsSync(OUT)) {
  console.error('Chrome exited cleanly but produced no file.');
  process.exit(1);
}

const bytes = statSync(OUT).size;
console.log(`${OUT} — ${bytes.toLocaleString()} bytes`);

if (bytes < 10_000) {
  console.error('That is suspiciously small; the page probably rendered empty.');
  process.exit(1);
}
