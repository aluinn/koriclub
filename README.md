# Kori Club – Mac OS X Leopard desktop

A static website: a Leopard-style Mac desktop with a menu bar, Dock, Finder, Photos, Videos (QuickTime), Music (iTunes) and Safari.
Plain HTML, CSS and JavaScript. No build step. Entry file: `index.html`.

## Run locally

```sh
npx serve .
```

Then open the address it prints (usually http://localhost:3000). Opening `index.html` directly won't work, because the apps load `content/manifest.json`.

## Add media

Everything in the apps comes from **`content/manifest.json`**.

- **Photos:** drop originals into `content/photos/` (GIFs into `content/Gifs/`) and run
  `python3 tools/build_photos.py` (needs `pip install pillow`). It skips duplicates, makes web-sized copies in
  `content/photos-web/` and updates the manifest. Set `"desktop": true` on a photo to show it on the desktop.
- **Videos:** use `.mp4` (H.264/AAC), put it in `content/videos/` and add `{ "title": "...", "src": "content/videos/name.mp4" }` to `videos`.
  Keep each file under 100 MB (GitHub / Vercel limits).
- **Music:** put `.mp3` / `.wav` / `.m4a` files in `content/music/` and add `{ "title": "...", "artist": "...", "src": "content/music/file.mp3" }` to `music`.
- **Safari tabs:** edit the `SITES` list at the top of `js/apps/safari.js`. (koriclub.com blocks being embedded in a frame, so each tab has an "Open" button that opens a real browser tab.)

## Deploy to Vercel

1. Push this repo to GitHub.
2. On vercel.com choose **Add New → Project**, import the repo.
3. Framework preset: **Other**. Leave build command and output directory empty (the root is the site). Click **Deploy**.

Or from the terminal: `npx vercel --prod`.

The original photos and `.mov` files are git-ignored / Vercel-ignored (`.gitignore`, `.vercelignore`); only the web copies and `.mp4` files are deployed.
