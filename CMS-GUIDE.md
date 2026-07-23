# Editing the site without touching code

The site now has a small admin panel at **`/admin`** (e.g. `https://beardbros.in/admin` once live) that lets you edit portfolio projects, case studies, journal posts, testimonials and the Notes app's content directly — no code, no pull requests, no asking a developer.

It's built on **Decap CMS** (free, open source, made for exactly this kind of static site). Every edit you make there is committed straight to the site's GitHub repo and triggers a new deploy on Netlify automatically — the same as if a developer had pushed a change.

## One-time setup (only needs doing once, by whoever owns the GitHub repo)

`/admin` logs in with **GitHub OAuth** directly — you sign in with a GitHub account, not a separate email/password. Whoever should be able to edit the site needs to be a collaborator on the `mally2889/beardbroswebsite` GitHub repo (Settings → Collaborators, on GitHub). No Netlify Identity, no Git Gateway, no invite email involved.

## Day to day: how to actually edit things

Go to `/admin`, log in, and you'll see seven sections in the sidebar:

- **Portfolio Projects** — all 61 projects shown in Safari's Suggestions grid. Every project lives here regardless of whether it also appears in Instagram (see below).
- **Websites (Safari)** — the live client sites embedded in Safari's "Websites" section (opens each one inline via iframe). Add/remove/rename entries here; each just needs a **Name** and a **URL**.
- **Case Studies (Reading List)** — the 9 long-read case studies in Safari's Reading List.
- **Journal (Blog)** — the posts in the Journal app.
- **Testimonials** — the client quotes shown in Safari.
- **Notes App Content** — the five notes in the Notes app (About Us, How We Work, etc.).
- **App Icons** — swap the built-in icon for Safari, Notes, Instagram, Files, Journal, Mail, Calendar, Radio, Clock, Weather, or Settings on the phone Home Screen/Dock and desktop Dock. Upload an image per app; leave a slot blank to keep the built-in icon.

### Safari vs. Instagram

Every project lives in Safari's Suggestions grid — that's the full portfolio. Instagram, by design, only shows a curated set of 16 projects (kept short on purpose, so the feed reads as a focused brand account rather than a mirror of the whole portfolio). That allowlist is a short array of slugs (`INSTAGRAM_SLUGS`) near the top of the Instagram app's code in `src/os/apps.js` — changing which projects appear in Instagram means editing that list, which isn't CMS-editable; ask the developer.

Each section opens onto **one single entry** containing a list — click it, then scroll to find the specific project/post/quote you want inside that list.

### Editing an existing project

Portfolio Projects → the one entry → find the project in the list (they're labelled by client name) → expand it → edit any field → **Save**. That's it — Save commits the change and Netlify redeploys within a minute or two.

### Adding a brand new project

Same screen, scroll to the bottom of the projects list, click **Add Projects**, fill in:
- **Slug** — a short, URL-safe id, e.g. `my-new-client` (lowercase, hyphens, no spaces).
- **Client**, **Title**, **Discipline**, **One-line Summary** — the basics shown in the Suggestions grid.
- **Thumbnail / Icon Image** — click to upload an image; it gets stored in the site's `public/portfolio` folder automatically.
- **Source URL** — the beardbros.in link, if there is one.
- **Write-up** — click **Add Paragraph** for each paragraph of the project's story (2–3 is typical). This is optional — a project without a write-up still shows up, just without a longer read when someone opens it.

### Editing the case studies, journal, testimonials, or notes

Same pattern throughout: one entry, one list inside it, expand the item you want, edit, Save. The **Journal** and **Case Studies** items support multiple paragraphs/sections the same way — just keep clicking "Add" for another paragraph, metric, or section.

For **Notes**, a body line that starts with `— ` (dash, space) renders as a bullet point instead of a plain paragraph — that's how "What We Do" and "FAQ's" get their bullet lists. Leave that prefix off for a normal paragraph.

### Editing app icons

Go to **App Icons** in `/admin` and upload an image for whichever app you want to change — square images work best (e.g. 512×512px, PNG with transparency for rounded corners). Clear the field and Save to go back to the built-in icon.

There's also a code-free manual option that doesn't need `/admin` at all: drop a same-named PNG into `public/icons/` (see `public/icons/README.md` for exact filenames). That's a fallback for anyone pushing files directly to the repo — the `/admin` upload above is checked first, so it always wins if both are set.

### What this CMS *can't* do yet — ask the developer

Most projects now have a real photo/video slider (via `portfolio-media.js`) rather than one static thumbnail — that file isn't wired into the CMS, so adding or changing a project's *gallery* (as opposed to its thumbnail, write-up, etc., which are all CMS-editable) requires a developer to upload the files in the right naming order. Same goes for which 16 projects appear in Instagram (see "Safari vs. Instagram" above).

## If something looks wrong

Every edit is a normal git commit, so nothing is ever truly lost — a developer can always look at the repo's commit history and revert a bad edit if needed. If `/admin` won't let you log in at all, the most likely cause is that your GitHub account hasn't been added as a collaborator on the repo yet (see setup above).
