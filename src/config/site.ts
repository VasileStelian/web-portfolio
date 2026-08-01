// src/config/site.ts
// The only place the origin is written. Canonical URLs, OG tags, the sitemap
// and llms.txt all derive from it. Update here after the first Vercel deploy.
export const SITE_URL = 'https://web-portfolio-inky-xi.vercel.app';

export const PERSON = {
  name: 'Sofron Vasile-Stelian',
  role: 'Full-stack developer, mostly backend',
  jobTitle: 'IT Systems & Security Engineer',
  location: 'Bacău, Romania',
  openToRelocation: true,
} as const;

export const CONTACT = {
  email: 'sofron_vasile123@yahoo.ro',
  phone: '+40722566100',
  phoneDisplay: '0722 566 100',
} as const;

export const SOCIAL = {
  github: 'https://github.com/VasileStelian',
  linkedin: 'https://www.linkedin.com/in/vasilestelian/',
} as const;

export const CV_PATH = '/Sofron_Vasile_Stelian_CV.pdf';
