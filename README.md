# Exile Organization — Public Frontend
Static, build-less site (HTML/CSS/ES modules). All content comes from the backend API, so text/release changes need no redeploy.
- **Config:** edit `config.js` (`API_URL`, `PUBLIC_SITE_URL`). No secrets. Also update the `Sitemap:` line in `robots.txt`.
- **Local:** `npx serve -s . -l 5173` (the `-s` flag gives SPA fallback), with the backend running.
- **Deploy (UniLink/any static host):** upload this folder. Routing needs "serve `/index.html` for unknown paths" — `_redirects` (Netlify-style) and `vercel.json` are included; configure the equivalent on UniLink.
- **Domain change:** set `PUBLIC_SITE_URL` here and in the backend env; QR codes, canonical and OG URLs follow.
- **Downloads:** buttons go to `API_URL/download/:product/:platform`; `/download/:product/:platform` on the site shows the "Preparing your download" page then hands off (this is the URL QR codes encode).
- **Limitations:** pages are client-rendered (meta tags set at runtime; crawlers that skip JS see generic tags — add prerendering later if SEO is critical); no JSON-LD yet; no search, video showcase, or light mode; Exile mark and logo are the supplied PNG.
