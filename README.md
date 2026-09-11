# Reverse Recycle Bin (RRB)

A polished fake desktop made for TinkerHub's Useless Projects event. Everything is simulated in the browser: no real files are read, moved, or deleted.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Demo flow

1. Double-click a desktop file to open it.
2. Open the menu and create a text document, then save it to the desktop.
3. Drag any file onto the Recycle Bin. The original moves into the bin window.
4. Click **Recycle this file** inside the bin. The original disappears, a storage report appears, and much larger garbage files spawn on the desktop.
5. Repeat five times to reveal the Reverse Recycle Bin and its sustainability report.
6. Reset from the menu or press `Ctrl + Alt + R`.

Virtual files, their positions, generated garbage, and progression are saved in `localStorage`. The app never modifies real files.

## Production build

```bash
npm run build
```
