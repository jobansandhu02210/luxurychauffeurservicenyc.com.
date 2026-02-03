# Publish luxurychauffeurservicenyc.com

Your site is static HTML/CSS/JS. No build step required. Use any of these ways to publish.

---

## Option 1: Netlify (recommended, free)

1. Go to [app.netlify.com](https://app.netlify.com) and sign in (or create an account).
2. **Drag and drop:** On the Netlify dashboard, drag the entire **website 1** folder onto the “Deploy” area. Netlify will publish it and give you a URL like `random-name.netlify.app`.
3. **Custom domain:** In Site settings → Domain management → Add custom domain, add `luxurychauffeurservicenyc.com`. Follow the steps to point your domain’s DNS to Netlify (they’ll show the records).
4. **HTTPS:** Netlify will issue a free SSL certificate once the domain is connected.

**CLI:** After `npm i -g netlify-cli` and `netlify login`, run from this folder: `netlify deploy --dir=. --prod`

---

## Option 2: Vercel

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New** → **Project**.
3. Import your folder (or connect GitHub if the site is in a repo). Set **Root Directory** to this folder if needed.
4. Deploy. Add `luxurychauffeurservicenyc.com` in Project Settings → Domains.

---

## Option 3: GitHub Pages

1. Create a new GitHub repo and push this folder (all files, including `index.html`, `css/`, `js/`, `images/`, etc.).
2. Repo → **Settings** → **Pages** → Source: **Deploy from a branch**.
3. Branch: `main`, folder: **/ (root)**. Save.
4. Your site will be at `https://yourusername.github.io/repo-name`.
5. For a custom domain, add a `CNAME` file with `luxurychauffeurservicenyc.com` and set DNS as GitHub instructs.

---

## Option 4: Your own web host (cPanel, FTP)

1. Buy hosting and a domain (or use your existing one).
2. In your host’s file manager or via FTP, upload **everything** in this folder:
   - All `.html` files (root)
   - `css/` folder
   - `js/` folder
   - `images/` folder (and `images/fleet/` if you add photos)
   - `robots.txt`, `sitemap.xml`
3. Point the domain to the folder that contains `index.html` (often `public_html` or `www`).
4. Ensure the host has HTTPS (Let’s Encrypt or similar).

---

## After publishing

1. **Domain:** Point `luxurychauffeurservicenyc.com` to your host (A record or CNAME as they specify).
2. **Google Search Console:** Add the property and submit `sitemap.xml` (e.g. `https://luxurychauffeurservicenyc.com/sitemap.xml`).
3. **Replace placeholders:** Update phone `(212) 555-0199` and address in all pages and in `js/booking.js` if you use different details.
4. **Fleet images:** Add your own photos to `images/fleet/` (mercedes-e-class.jpg, chevrolet-suburban.jpg, cadillac-escalade.jpg, mercedes-s-class.jpg) for best look.

Your site is ready to publish; no build step is required.
