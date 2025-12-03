# Sofron Vasile Stelian - Portfolio Website

A modern, responsive portfolio website built with Astro and TailwindCSS.

## Features

- Clean, modern design with smooth animations
- Fully responsive (mobile-friendly)
- Fast loading with Astro's island architecture
- SEO optimized with meta tags
- Accessible HTML structure

## Tech Stack

- **Astro** - Static site generator
- **TailwindCSS** - Utility-first CSS framework
- **TypeScript** - Type-safe development

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:4321](http://localhost:4321) in your browser

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── About.astro
│   │   ├── Skills.astro
│   │   ├── Projects.astro
│   │   ├── Contact.astro
│   │   └── Footer.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## Customization

### Update Contact Information

Edit `src/components/Contact.astro` to update email, GitHub, and LinkedIn links.

### Add Your CV

Place your CV PDF file in the `public/` directory as `cv.pdf`, or update the link in `src/components/Contact.astro`.

### Modify Projects

Edit the `projects` array in `src/components/Projects.astro` to add, remove, or modify projects.

### Change Colors

Update the color scheme in `tailwind.config.mjs`:

```js
colors: {
  primary: '#3B82F6',
  'primary-dark': '#2563EB',
}
```

## Deployment

This site can be deployed to:

- **Vercel** (recommended)
- **Netlify**
- **GitHub Pages**
- Any static hosting service

## License

© 2025 Sofron Vasile Stelian
