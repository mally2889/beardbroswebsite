# Custom app icons

Drop a PNG here to replace an app's built-in icon everywhere it appears —
the desktop Dock and the phone Home Screen/Dock both pick it up automatically,
with no code change and no redeploy step beyond the normal Netlify deploy.

## How it works

Each app already has a hand-drawn icon built into the code, which is what
you see by default. When the site loads, it quietly checks this folder for
a file named after the app. If it finds one, it swaps it in. If not, the
built-in icon keeps showing exactly as before. So it's always safe to leave
this folder empty or partial — only the apps you actually override change.

## Filenames (must match exactly)

| File               | App                          |
|--------------------|-------------------------------|
| `safari.png`        | Safari (the Work browser)     |
| `notes.png`          | Notes                         |
| `mail.png`           | Mail                          |
| `calendar.png`       | Calendar                      |
| `radio.png`          | Radio                         |
| `feed.png`           | Instagram                     |
| `settings.png`       | Settings                      |
| `clock.png`          | Clock                         |
| `weather.png`        | Weather                       |
| `files.png`          | Files (desktop icon)          |
| `journal.png`        | Journal (desktop icon)        |
| `finder.png`         | Finder (desktop Dock only)    |
| `terminal.png`       | Terminal (desktop Dock only)  |
| `phone.png`          | Phone (the green call icon)   |

## Image guidelines

- **Square** — e.g. 512×512px. Every icon slot (Dock tile, Home Screen tile,
  desktop icon) is sized to fit whatever you provide as if it's square, so a
  non-square image will look stretched or squashed.
- **PNG with transparency** if you want rounded corners/glass — the OS
  already clips every icon tile to its own rounded-square shape, so a plain
  square photo works fine too; it'll just get cropped to that shape.
- Keep file size reasonable (under ~500KB) since these load on every visit.

## To revert

Delete the file. The built-in icon comes straight back.
