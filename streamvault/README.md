# StreamVault

Progressive video streaming from any direct video URL. Paste a link, hit Stream — playback starts while the file downloads in the background.

## Features
- 🎬 Progressive streaming (plays while downloading)
- ⚡ Chunk-based proxy via Next.js Edge API
- 🎛 Playback speed control (0.25× – 2×)
- 📊 Buffer + progress bar
- ⬇ Download with progress indicator
- 🌙 Dark mode UI
- 📱 Mobile responsive
- 🖥 Fullscreen support

## Deploy to Vercel (easiest)

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Vercel auto-detects Next.js — just click **Deploy**
4. Done! Your site is live.

## Local development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

## How it works

When you paste a URL and click Stream:
1. The video `src` is set to `/api/stream?url=YOUR_URL`
2. The Edge API route proxies the request, forwarding `Range` headers
3. The browser's native video element fetches chunks progressively via range requests
4. Playback starts as soon as the first chunk arrives

## Notes
- Only works with **direct video file URLs** (`.mp4`, `.webm`, `.ogg`, etc.)
- YouTube and other platform URLs are **not** supported
- The server must support HTTP Range requests for best progressive experience
