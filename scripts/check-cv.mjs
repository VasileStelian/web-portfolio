// Checks whether the CV in public/ can actually be read by an applicant tracking system.
//
// This exists because the original CV could not be. It was exported as flattened images:
// no embedded fonts, no text layer. A human opening it saw a well-designed document; every
// automated parser saw a blank page, which is how a good candidate gets filtered out before
// anyone looks.
//
// Run it whenever you replace the file:
//   npm run check:cv
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const PDF = 'public/Sofron_Vasile_Stelian_CV.pdf';

if (!existsSync(PDF)) {
  console.error(`${PDF} is missing. Drop your CV there under exactly that name.`);
  process.exit(1);
}

const bytes = readFileSync(PDF);
const count = (pattern) => (bytes.toString('latin1').match(pattern) ?? []).length;

const fonts = count(/\/FontFile[23]?/g);
const images = count(/\/Subtype\s*\/Image/g);

let text = '';
try {
  execFileSync('gs', ['-q', '-sDEVICE=txtwrite', '-o', '/tmp/cv-text-probe.txt', PDF], {
    stdio: 'ignore',
  });
  text = readFileSync('/tmp/cv-text-probe.txt', 'utf8').replace(/\s+/g, ' ').trim();
} catch {
  console.log('note: ghostscript not available, skipping the text-extraction check');
  console.log('      (brew install ghostscript)');
}

const kb = Math.round(bytes.length / 1024);
console.log(`${PDF}`);
console.log(`  size              ${kb} KB`);
console.log(`  embedded fonts    ${fonts}`);
console.log(`  image objects     ${images}`);
if (text) console.log(`  extractable text  ${text.length.toLocaleString()} characters`);

const problems = [];
if (fonts === 0) {
  problems.push('No embedded fonts. The document is almost certainly flattened to images.');
}
if (text && text.length < 800) {
  problems.push(
    `Only ${text.length} characters of extractable text. A two-page CV should yield several thousand.`,
  );
}
if (kb > 700) {
  problems.push(`${kb} KB is large for a text PDF and usually means uncompressed images.`);
}

if (problems.length === 0) {
  console.log('\nReadable by an applicant tracking system.');
  process.exit(0);
}

console.log('\nProblems:');
for (const p of problems) console.log(`  - ${p}`);
console.log(
  '\nFix: export from your design tool with real text rather than outlines or a flattened\n' +
    'image. In most tools that is a "PDF (print)" or "selectable text" option. If the tool\n' +
    'cannot do it, print the document to PDF from a browser instead — that always keeps text.',
);
process.exit(1);
