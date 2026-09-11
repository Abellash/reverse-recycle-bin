# Reverse Recycle Bin (RRB)

A polished fake desktop made for TinkerHub's Useless Projects event. Everything is simulated in the browser: no real files are read, moved, or deleted.

## Run locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Demo flow

1. Double-click a desktop file to open it.
2. Open the menu and create a text document, then save it to the desktop.
3. Drag any file onto the Recycle Bin. The original moves into the bin window.
4. Click **Recycle this file**. The original disappears while much larger garbage files spawn on the desktop.
5. Repeat five times to reveal the Reverse Recycle Bin and its sustainability report.
6. Reset from the menu or press `Ctrl + Alt + R`.

Virtual files, positions, generated garbage, and progression are stored in `localStorage`.

## Build

```bash
npm run build
```

The deployable static site is written to `dist/`.

## Deploy on Vercel

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Install command: `npm install`
- Node.js version: **22.x**

`vercel.json` sends browser routes back to `index.html` for SPA compatibility.
