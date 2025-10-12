# Kunal Aneja — Portfolio (Vite + React + Tailwind)

Live, interactive portfolio with a reinforcement-learning canvas background: ripples, flocking, and a soft 3D tilt.

## Quickstart
```bash
npm i
npm run dev
```

Build & preview:
```bash
npm run build
npm run preview
```

## Customize your info
Edit **`src/data/profile.ts`**:
- `name`, `tagline`, `email`, `location`
- `socials` (GitHub, Scholar, LinkedIn, Twitter)
- `publications` and `projects`
- `skills`

## Deploy on GitHub Pages
1. Create a new repo and push this project (make sure default branch is `main`).
2. In GitHub, go to **Settings → Pages**, choose **Source: GitHub Actions**.
3. The included workflow `.github/workflows/pages.yml` builds and deploys automatically on pushes to `main`.
4. For a custom domain:
   - Add a DNS `A` record (or ALIAS/ANAME) for `@` pointing to GitHub Pages IPs, and a `CNAME` for `www` to `yourusername.github.io` (or directly to the apex if supported).
   - In **Settings → Pages**, set **Custom domain** to `kunalaneja.com`.
   - The `public/CNAME` file ensures the domain sticks on deploy. Change it if needed.

> If you're deploying to `username.github.io/<repo>`, set `base` in `vite.config.ts` to `'/<repo>/'`.

## Background controls
- **Click / tap:** big ripple
- **R:** toggle random-walk overlay
- **F:** toggle flocking bias
- **G:** toggle goal marker
- Pointer motion adds a subtle 3D tilt on the canvas

## Notes
- Tailwind keeps styling light. Fonts are Inter and JetBrains Mono via Google Fonts.
- The RL canvas is plain 2D Canvas API (no WebGL), tuned for perf and legibility.
- The contact form defaults to `mailto:`; swap to Formspree/EmailJS for production delivery.
