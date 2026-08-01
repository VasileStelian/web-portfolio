// Content that belongs to the CV but not to the site's project or experience
// collections. Everything else on /cv is rendered from those collections, so a
// highlight edited once shows up in both places.

export const CV_HEADLINE = 'Full-Stack Developer · Backend Focus';

export const CV_LOCATION = 'Bacău, Romania · open to Iași or remote';

export const CV_SUMMARY = `Full-stack developer, mostly backend. I work in PHP and Laravel with PostgreSQL and
MySQL, and I have taken a product from design to production on my own: data model,
business logic, REST API, security and deployment. I also handle the frontend when a
feature needs it. I work spec-first and test-driven, and I am used to having my code
reviewed, including on security. My background is in IT engineering, so databases, Linux
and infrastructure are familiar territory, and moving from operations into building
products is a good measure of how quickly I pick things up. I would rather ask a question
early than commit something I do not fully understand.`;

export const CV_SKILLS = [
  {
    label: 'Backend',
    text: 'PHP 8.3, Laravel, Filament, REST API design, queue workers, schedulers, service and Action-class architecture, business logic separated from controllers',
  },
  {
    label: 'Databases',
    text: 'PostgreSQL, MySQL, schema and migration design, indexing and constraint design (unique and partial-unique indexes), transactional integrity, query performance',
  },
  {
    label: 'Testing & process',
    text: 'Pest, test-driven development, unit and integration testing against real databases, code review including security review, spec-then-build workflow',
  },
  {
    label: 'Web security',
    text: 'OTP and email verification, MFA (TOTP), CSRF protection, rate limiting, CORS, brute-force lockout, secure setup flows, OWASP-style fixes',
  },
  {
    label: 'DevOps',
    text: 'Docker (FrankenPHP), Coolify, VPS deployment (Hetzner), Cloudflare (R2, Pages, Workers), GitHub Actions CI/CD, Git, Linux administration',
  },
  {
    label: 'Also',
    text: 'TypeScript, React, Next.js, Astro, Node.js, Python; DNS and email infrastructure; monitoring and incident response',
  },
] as const;

export const CV_EDUCATION = [
  {
    label: 'Education',
    text: "Bachelor's Degree in Information Technology Engineering, Vasile Alecsandri University of Bacău, 2019 to 2023",
  },
  {
    label: 'Thesis project',
    text: 'A ticketing and administration system for student accommodation, built in Laravel 9 with MySQL and Blade, covering authentication, a booking flow and data-table driven management screens',
  },
  {
    label: 'Certifications',
    text: 'JavaScript Development, Software Development Academy, 2023',
  },
  {
    label: 'Languages',
    text: 'Romanian (native) · English (professional)',
  },
] as const;
