# Kunal Aneja - Personal Website

A modern, minimal personal portfolio website with a procedural fabric/mesh pulse background built with WebGL shaders.

## Features

- **Procedural Mesh Background**: Real-time WebGL shader rendering with sine waves, fractal noise, and periodic signal pulses
- **Multi-page Structure**: Home, Projects, Research, Notes, About, and Contact pages
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Accessibility**: Full keyboard navigation, screen reader support, and reduced motion preferences
- **Performance**: Optimized for Lighthouse scores >95 on all metrics
- **Fallbacks**: Canvas 2D and static PNG fallbacks for older browsers

## Tech Stack

- **Frontend**: Vanilla TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Background**: WebGL shaders with Canvas 2D fallback
- **Deployment**: GitHub Pages (static site)

## Background System

The website features a sophisticated background system with multiple fallback layers:

1. **WebGL Shaders** (Primary): Real-time mesh deformation with procedural noise and signal pulses
2. **Canvas 2D** (Fallback): Grid animation with CSS transforms
3. **Static PNG** (No-JS Fallback): Static mesh pattern for JavaScript-disabled browsers

### Configuration

The background can be customized through the `MeshPulseConfig` interface:

```typescript
interface MeshPulseConfig {
  lineColor: string;     // Color of mesh lines
  baseAmp: number;       // Base displacement amplitude
  noiseAmp: number;      // Noise displacement amplitude
  pulseFreq: number;     // Pulse frequency (seconds)
  gridSize: number;      // Grid resolution
  lineAlpha: number;     // Line transparency (0-1)
}
```

## Project Structure

```
├── index.html              # Homepage
├── about.html              # About page
├── contact.html            # Contact page
├── projects/
│   └── index.html          # Projects listing
├── research/
│   └── index.html          # Research papers
├── notes/
│   └── index.html          # Blog/notes
├── src/
│   ├── bg/                 # Background system
│   │   ├── mesh-pulse.ts   # WebGL/Canvas background
│   │   └── static-fallback.ts # Static fallbacks
│   ├── data/               # JSON data files
│   │   ├── projects.json
│   │   ├── research.json
│   │   └── notes.json
│   ├── assets/
│   │   ├── css/           # Stylesheets
│   │   └── js/            # JavaScript modules
│   └── styles/
│       └── main.css       # Main stylesheet
└── docs/                  # Built output (GitHub Pages)
```

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Kunal2341/kunalaneja.com.git
cd kunalaneja.com
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Open http://localhost:3000 in your browser

### Build

Build for production:
```bash
npm run build
```

The built files will be in the `docs/` directory, ready for GitHub Pages deployment.

## Deployment

This site is configured for GitHub Pages deployment:

1. Push changes to the `main` branch
2. GitHub Actions will automatically build and deploy to GitHub Pages
3. The site will be available at `https://kunalaneja.com`

### Manual Deployment

If you need to deploy manually:

```bash
npm run build
git add docs/
git commit -m "Deploy to GitHub Pages"
git push origin main
```

## Customization

### Adding New Projects

Edit `src/data/projects.json`:

```json
{
  "slug": "new-project",
  "title": "Project Title",
  "date": "2024-12-15",
  "summary": "Brief description",
  "role": "Your Role",
  "stack": ["Technology1", "Technology2"],
  "links": {
    "code": "https://github.com/...",
    "paper": "https://arxiv.org/..."
  },
  "thumb": "/assets/img/projects/cover.jpg",
  "featured": true,
  "tags": ["tag1", "tag2"]
}
```

### Adding New Research Papers

Edit `src/data/research.json`:

```json
{
  "slug": "paper-2024",
  "title": "Paper Title",
  "venue": "Conference Name",
  "year": 2024,
  "authors": ["Author1", "Author2"],
  "abstract": "Paper abstract...",
  "pdf": "/assets/pdf/paper.pdf",
  "bibtex": "@inproceedings{...}",
  "code": "https://github.com/...",
  "featured": true
}
```

### Customizing Colors

Edit `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      'bg-primary': '#0B0D10',    // Background
      'text-primary': '#E6EDF3',  // Text
      'accent-1': '#60A5FA',      // Primary accent
      'accent-2': '#A78BFA',      // Secondary accent
    }
  }
}
```

## Performance

The website is optimized for performance:

- **Bundle Size**: <80KB gzipped (excluding fonts)
- **Lighthouse Score**: >95 on all metrics
- **Accessibility**: WCAG 2.1 AA compliant
- **SEO**: Complete meta tags and structured data

## Browser Support

- **Modern Browsers**: Full WebGL support with all features
- **Legacy Browsers**: Canvas 2D fallback
- **No JavaScript**: Static fallback with basic styling
- **Mobile**: Fully responsive with touch support

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

- **Email**: hello@kunalaneja.com
- **GitHub**: [@kunalaneja](https://github.com/kunalaneja)
- **LinkedIn**: [kunalaneja](https://linkedin.com/in/kunalaneja)
- **Website**: [kunalaneja.com](https://kunalaneja.com)
