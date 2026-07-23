# Editing the site without touching code

The site now has a small admin panel at **`/admin`** (e.g. `https://beardbros.in/admin` once live) that lets you edit portfolio projects, case studies, journal posts, testimonials and the Notes app's content directly — no code, no pull requests, no asking a developer.

It's built on **Decap CMS** (free, open source, made for exactly this kind of static site). Every edit you make there is committed straight to the site's GitHub repo and triggers a new deploy on Netlify automatically — the same as if a developer had pushed a change.

## One-time setup (only needs doing once, by whoever owns the Netlify account)

These three steps have to happen before `/admin` will actually let anyone log in. Do them in this order:

1. **Connect the GitHub repo to Netlify.** In the Netlify dashboard → Site settings → Build & deploy → Link to a Git repository, and point it at this project's GitHub repo. (If the site is currently deployed via `netlify deploy` from the command line instead of a connected repo, this step switches it over to deploy automatically on every push — a good thing, not just a CMS requirement.)
2. **Enable Identity.** Site settings → Identity → Enable Identity. This is Netlify's built-in login system — it's what "Login with Netlify Identity" on `/admin` is talking to.
3. **Enable Git Gateway.** Still under Identity → Services → Git Gateway → Enable. This is the piece that lets a logged-in Identity user actually write commits to the repo, without needing their own GitHub account or personal access token.

Then, under Identity → Invite users, invite whichever email addresses should be able to edit the site. They'll get an email to set a password, and from then on they log in at `/admin` with that email and password.

## Day to day: how to actually edit things

Go to `/admin`, log in, and you'll see six sections in the sidebar:

- **Portfolio Projects** — all 61 projects shown in Safari's Suggestions grid. Every project lives here regardless of whether it also appears in Instagram (see below).
- **Websites (Safari)** — the live client sites embedded in Safari's "Websites" section (opens each one inline via iframe). Add/remove/rename entries here; each just needs a **Name** and a **URL**.
- **Case Studies (Reading List)** — the 9 long-read case studies in Safari's Reading List.
- **Journal (Blog)** — the posts in the Journal app.
- **Testimonials** — the client quotes shown in Safari.
- **Notes App Content** — the five notes in the Notes app (About Us, How We Work, etc.).

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

### Editing app icons yourself, without the CMS

Every app icon (Safari, Instagram, Notes, Mail, etc.) can be swapped by dropping a same-named PNG into `public/icons/` — see `public/icons/README.md` for the exact filenames and image guidelines. This isn't through `/admin`; it's a plain file in the repo, so it goes through whatever your normal way of pushing files is (a commit, or GitHub's own "upload file" screen if you don't have git set up locally). Delete the file to go back to the built-in icon.

### What this CMS *can't* do yet — ask the developer

Most projects now have a real photo/video slider (via `portfolio-media.js`) rather than one static thumbnail — that file isn't wired into the CMS, so adding or changing a project's *gallery* (as opposed to its thumbnail, write-up, etc., which are all CMS-editable) requires a developer to upload the files in the right naming order. Same goes for which 16 projects appear in Instagram (see "Safari vs. Instagram" above).

## If something looks wrong

Every edit is a normal git commit, so nothing is ever truly lost — a developer can always look at the repo's commit history and revert a bad edit if needed. If `/admin` won't let you log in at all, the most likely cause is that step 2 or 3 of the one-time setup above hasn't been done yet on the Netlify side.
