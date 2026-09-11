"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { FilePlus2, FileSpreadsheet, FileText, Folder, Grid2X2, HardDrive, Minus, Recycle, RotateCcw, Save, Square, Trash2, X } from "lucide-react";
import { generateGarbage, seedFiles, type VirtualFile } from "../lib/virtual-files";

type SavedState = { files: VirtualFile[]; binItems?: VirtualFile[]; attempts: number; generated: number };
type AppWindow = { id: string; fileId?: string; mode: "editor" | "viewer" | "recyclebin"; minimized: boolean; maximized: boolean; x: number; y: number };
type Recycling = { file: VirtualFile; progress: number; message: string } | null;
const STORAGE_KEY = "rrb-desktop-v1";
const counts = [3, 8, 14, 23, 24];
const recycleMessages = ["Recycling responsibly…", "Optimizing your digital waste…", "Please wait while we save absolutely no space.", "Protecting your files from deletion.", "Creating backups you didn't ask for…"];
const resultMessages = ["Recycling complete!", "You seem to be running low on files. I've helped.", "One file entered. Several files left.", "STOP DELETING MY CHILDREN.", "Thank you for making the planet considerably worse."];

declare global {
  interface Window { __RRB_RESET__?: () => void }
  interface Document { modelContext?: { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; execute: (input: any) => unknown; annotations?: object }) => void; unregisterTool?: (name: string) => void } }
}

function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const timer = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(timer); }, []);
  if (!now) return <div className="clock"><strong>--:--</strong><small>--/--/----</small></div>;
  return <div className="clock"><strong>{now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong><small>{now.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" })}</small></div>;
}

function Glyph({ file }: { file: VirtualFile }) {
  const Icon = file.kind === "folder" ? Folder : file.kind === "sheet" ? FileSpreadsheet : FileText;
  return <span className={`file-glyph ${file.kind} ${file.generated ? "generated" : ""}`}><Icon /></span>;
}

function WindowFrame({ title, icon, children, windowState, onClose, onMinimize, onMaximize, onMove }: { title: string; icon?: ReactNode; children: ReactNode; windowState: AppWindow; onClose: () => void; onMinimize: () => void; onMaximize: () => void; onMove: (x: number, y: number) => void }) {
  const drag = useRef<{ ox: number; oy: number } | null>(null);
  if (windowState.minimized) return null;
  return <section className={`app-window ${windowState.maximized ? "maximized" : ""}`} style={windowState.maximized ? undefined : { left: windowState.x, top: windowState.y }}>
    <header className="titlebar" onPointerDown={(e) => { if ((e.target as HTMLElement).closest("button") || windowState.maximized) return; drag.current = { ox: e.clientX - windowState.x, oy: e.clientY - windowState.y }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={(e) => { if (drag.current) onMove(Math.max(0, e.clientX - drag.current.ox), Math.max(0, e.clientY - drag.current.oy)); }} onPointerUp={() => { drag.current = null; }}>
      <span className="window-title">{icon}{title}</span>
      <div className="window-controls"><button onClick={onMinimize} aria-label="Minimize"><Minus /></button><button onClick={onMaximize} aria-label="Maximize"><Square /></button><button className="close" onClick={onClose} aria-label="Close"><X /></button></div>
    </header>
    {children}
  </section>;
}

export default function Home() {
  const [files, setFiles] = useState<VirtualFile[]>(seedFiles);
  const [binItems, setBinItems] = useState<VirtualFile[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [generated, setGenerated] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [windows, setWindows] = useState<AppWindow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { name: string; content: string }>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [saveAs, setSaveAs] = useState<string | null>(null);
  const [recycling, setRecycling] = useState<Recycling>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [storageNotice, setStorageNotice] = useState<{ freed: number; added: number; file: string } | null>(null);
  const [showReport, setShowReport] = useState(false);
  const draggedId = useRef<string | null>(null);
  const recycledDrag = useRef(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) { const saved = JSON.parse(raw) as SavedState; setFiles(saved.files); setBinItems(saved.binItems ?? []); setAttempts(saved.attempts); setGenerated(saved.generated); } } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify({ files, binItems, attempts, generated })); }, [files, binItems, attempts, generated, hydrated]);

  const reset = useCallback(() => { localStorage.removeItem(STORAGE_KEY); setFiles(seedFiles); setBinItems([]); setAttempts(0); setGenerated(0); setWindows([]); setDrafts({}); setRecycling(null); setStorageNotice(null); setShowReport(false); setToast("Desktop restored. Nothing suspicious happened."); setStartOpen(false); }, []);
  useEffect(() => { window.__RRB_RESET__ = reset; const key = (e: KeyboardEvent) => { if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "r") { e.preventDefault(); reset(); } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [reset]);

  const openFile = useCallback((file: VirtualFile) => {
    const mode = file.kind === "document" || file.kind === "text" ? "editor" : "viewer";
    setDrafts(d => ({ ...d, [file.id]: { name: file.name, content: file.content } }));
    setWindows(ws => ws.some(w => w.fileId === file.id) ? ws.map(w => w.fileId === file.id ? { ...w, minimized: false } : w) : [...ws, { id: `window-${file.id}`, fileId: file.id, mode, minimized: false, maximized: false, x: 280 + (ws.length % 3) * 35, y: 62 + (ws.length % 3) * 28 }]);
  }, []);

  const openRecycleBin = useCallback(() => {
    setWindows(ws => ws.some(w => w.mode === "recyclebin")
      ? ws.map(w => w.mode === "recyclebin" ? { ...w, minimized: false } : w)
      : [...ws, { id: "window-recycle-bin", mode: "recyclebin", minimized: false, maximized: false, x: 310, y: 76 }]);
  }, []);

  const moveToBin = useCallback((file: VirtualFile) => {
    recycledDrag.current = true;
    setFiles(current => current.filter(f => f.id !== file.id));
    setBinItems(current => [...current.filter(f => f.id !== file.id), file]);
    setWindows(current => current.filter(w => w.fileId !== file.id));
    setToast(`${file.name} moved to Recycle Bin`);
    openRecycleBin();
  }, [openRecycleBin]);

  const newDocument = useCallback(() => {
    const id = `new-${Date.now()}`;
    setDrafts(d => ({ ...d, [id]: { name: "Untitled.txt", content: "" } }));
    setWindows(ws => [...ws, { id: `window-${id}`, fileId: id, mode: "editor", minimized: false, maximized: false, x: 300 + (ws.length % 3) * 28, y: 70 + (ws.length % 3) * 24 }]);
    setStartOpen(false); setContextMenu(null);
  }, []);

  const saveDocument = useCallback((id: string, forceAs = false) => {
    const draft = drafts[id]; if (!draft) return;
    if (forceAs || id.startsWith("new-")) { setSaveAs(id); return; }
    setFiles(current => current.map(f => f.id === id ? { ...f, content: draft.content, name: draft.name, size: draft.content.length * 2 } : f));
    setToast(`Saved ${draft.name}`);
  }, [drafts]);

  const completeSaveAs = (id: string) => {
    const draft = drafts[id]; if (!draft || !draft.name.trim()) return;
    const nextId = id.startsWith("new-") ? `file-${Date.now()}` : `file-${Date.now()}`;
    const name = draft.name.includes(".") ? draft.name.trim() : `${draft.name.trim()}.txt`;
    const next: VirtualFile = { id: nextId, name, kind: name.endsWith(".txt") ? "text" : "document", content: draft.content, size: Math.max(128, draft.content.length * 2), createdAt: new Date().toISOString(), position: { x: 28 + (files.length % 3) * 104, y: 370 + (Math.floor(files.length / 3) % 2) * 106 } };
    setFiles(current => [...current, next]);
    setDrafts(d => { const copy = { ...d }; delete copy[id]; copy[nextId] = { ...draft, name }; return copy; });
    setWindows(ws => ws.map(w => w.fileId === id ? { ...w, id: `window-${nextId}`, fileId: nextId } : w));
    setSaveAs(null); setToast(`Saved ${name} to Desktop`);
  };

  const recycleFile = useCallback((file: VirtualFile) => {
    if (recycling) return;
    recycledDrag.current = true;
    const nextAttempt = attempts + 1;
    setRecycling({ file, progress: 0, message: recycleMessages[Math.min(nextAttempt - 1, recycleMessages.length - 1)] });
    let progress = 0;
    const timer = window.setInterval(() => {
      progress += 4 + Math.floor(Math.random() * 9);
      setRecycling(current => current ? { ...current, progress: Math.min(progress, 100) } : null);
      if (progress >= 100) {
        window.clearInterval(timer);
        window.setTimeout(() => {
          const count = counts[Math.min(nextAttempt - 1, counts.length - 1)] ?? 16;
          const actual = Math.min(count, Math.max(0, 120 - files.length));
          const additions = generateGarbage(file, actual, nextAttempt, generated);
          const freedMb = Math.max(3, Math.ceil(file.size / 1_000_000));
          const addedMb = Math.max(freedMb * 10, Math.round(additions.reduce((total, item) => total + item.size, 0) / 1_000_000));
          setFiles(current => [...current, ...additions]); setBinItems(current => current.filter(item => item.id !== file.id)); setAttempts(nextAttempt); setGenerated(g => g + additions.length);
          setRecycling(null); setStorageNotice({ freed: freedMb, added: addedMb, file: file.name }); setToast(resultMessages[Math.min(nextAttempt - 1, resultMessages.length - 1)]);
          if (nextAttempt >= 5) window.setTimeout(() => setShowReport(true), 700);
        }, 600);
      }
    }, 120);
  }, [attempts, files.length, generated, recycling]);

  useEffect(() => {
    const model = document.modelContext; if (!model) return;
    model.registerTool({ name: "create_virtual_document", title: "Create desktop document", description: "Creates a new editable virtual text document on the simulated desktop.", inputSchema: { type: "object", properties: {} }, execute: () => { newDocument(); return { ok: true }; } });
    model.registerTool({ name: "reset_reverse_recycle_bin", title: "Reset demo desktop", description: "Restores the simulated desktop and Reverse Recycle Bin progression to its initial state.", inputSchema: { type: "object", properties: {} }, execute: () => { reset(); return { ok: true }; } });
    return () => { model.unregisterTool?.("create_virtual_document"); model.unregisterTool?.("reset_reverse_recycle_bin"); };
  }, [newDocument, reset]);

  const activeFiles = useMemo(() => files.slice(0, 120), [files]);
  const generatedMb = useMemo(() => Math.round(files.filter(file => file.generated).reduce((total, file) => total + file.size, 0) / 1_000_000), [files]);
  return <main className={`desktop-shell chaos-${Math.min(attempts, 5)}`} onClick={() => { setContextMenu(null); }}>
    <div className="wallpaper-glow" />
    <section className="desktop" aria-label="Desktop" onContextMenu={(e) => { if ((e.target as HTMLElement).closest(".desktop-icon")) return; e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); setStartOpen(false); }} onDragOver={e => e.preventDefault()}>
      {activeFiles.map(file => <button key={file.id} className={`desktop-icon ${selected === file.id ? "selected" : ""} ${file.generated ? "spawned" : ""}`} style={{ left: Math.min(file.position.x, Math.max(4, (typeof window !== "undefined" ? window.innerWidth : 1200) - 104)), top: file.position.y }} draggable onClick={(e) => { e.stopPropagation(); setSelected(file.id); }} onDoubleClick={() => openFile(file)} onDragStart={(e) => { draggedId.current = file.id; recycledDrag.current = false; e.dataTransfer.setData("text/plain", file.id); e.dataTransfer.effectAllowed = "move"; }} onDragEnd={(e) => { if (!recycledDrag.current && e.clientX > 0 && e.clientY > 0) setFiles(current => current.map(f => f.id === file.id ? { ...f, position: { x: Math.max(2, e.clientX - 46), y: Math.max(2, Math.min(e.clientY - 42, window.innerHeight - 168)) } } : f)); draggedId.current = null; }}>
        <Glyph file={file}/><span>{file.name}</span>
      </button>)}

      <button className={`desktop-icon recycle-icon ${attempts >= 3 ? "angry" : ""} ${recycling ? "receiving" : ""} ${binItems.length ? "bin-full" : ""}`} onDoubleClick={openRecycleBin} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; e.currentTarget.classList.add("drag-hover"); }} onDragLeave={e => e.currentTarget.classList.remove("drag-hover")} onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("drag-hover"); const id = e.dataTransfer.getData("text/plain") || draggedId.current; const file = files.find(f => f.id === id); if (file) moveToBin(file); }}>
        <span className="file-glyph bin"><Recycle /></span><span>{attempts >= 5 ? "Reverse Recycle Bin™" : "Recycle Bin"}</span>
      </button>
    </section>

    {windows.map(w => {
      const closeWindow = () => setWindows(ws => ws.filter(item => item.id !== w.id));
      const minimizeWindow = () => setWindows(ws => ws.map(item => item.id === w.id ? { ...item, minimized: true } : item));
      const maximizeWindow = () => setWindows(ws => ws.map(item => item.id === w.id ? { ...item, maximized: !item.maximized } : item));
      const moveWindow = (x: number, y: number) => setWindows(ws => ws.map(item => item.id === w.id ? { ...item, x, y } : item));
      if (w.mode === "recyclebin") return <WindowFrame key={w.id} title={attempts >= 5 ? "Reverse Recycle Bin™" : "Recycle Bin"} icon={<Recycle />} windowState={w} onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={maximizeWindow} onMove={moveWindow}>
        <div className="bin-app">
          <div className="bin-toolbar">
            <button className="recycle-action" disabled={!binItems.length || Boolean(recycling)} onClick={() => binItems.length && recycleFile(binItems[binItems.length - 1])}><Recycle/> Recycle {binItems.length === 1 ? "this file" : "latest file"}</button>
            <span><HardDrive/> {binItems.length ? `${binItems.length} item${binItems.length === 1 ? "" : "s"} waiting` : "Recycle Bin is empty"}</span>
          </div>
          {binItems.length ? <div className="bin-list">
            <div className="bin-list-head"><span>Name</span><span>Original size</span><span>Date deleted</span></div>
            {binItems.map(item => <button key={item.id} className="bin-row" onDoubleClick={() => setToast(`${item.name} is being protected from recovery.`)}><Glyph file={item}/><span><strong>{item.name}</strong><small>Original location: Desktop</small></span><span>{Math.max(3, Math.ceil(item.size / 1_000_000))} MB</span><span>{new Date().toLocaleDateString()}</span></button>)}
          </div> : <div className="bin-empty"><Trash2/><h2>This folder is empty</h2><p>Drag a desktop file here. It will be completely, responsibly, and permanently handled.</p></div>}
          <div className="bin-status"><span>{binItems.length} item{binItems.length === 1 ? "" : "s"}</span><span>Files remain safely inside this simulation</span></div>
        </div>
      </WindowFrame>;
      const file = files.find(f => f.id === w.fileId); const draft = w.fileId ? drafts[w.fileId] : undefined; if (!draft || !w.fileId) return null;
      return <WindowFrame key={w.id} title={draft.name} icon={<FileText />} windowState={w} onClose={closeWindow} onMinimize={minimizeWindow} onMaximize={maximizeWindow} onMove={moveWindow}>
        {w.mode === "editor" ? <div className="editor">
          <div className="menubar"><button onClick={newDocument}><FilePlus2/> New</button><button onClick={() => saveDocument(w.fileId!)}><Save/> Save</button><button onClick={() => saveDocument(w.fileId!, true)}>Save As</button><span className="saved-hint">Stored on this virtual desktop only</span></div>
          <textarea aria-label="Document contents" value={draft.content} placeholder="Start typing…" onChange={e => setDrafts(d => ({ ...d, [w.fileId!]: { ...d[w.fileId!], content: e.target.value } }))}/>
          <div className="statusbar"><span>{draft.content.trim() ? draft.content.trim().split(/\s+/).length : 0} words</span><span>{draft.content.length} characters</span></div>
        </div> : <div className={`viewer ${file?.kind ?? "document"}`}><div className="viewer-toolbar"><span>{file?.kind === "sheet" ? "Spreadsheet preview" : file?.kind === "folder" ? "Folder contents" : "Document preview"}</span><span>{Math.max(1, Math.round((file?.size ?? 0) / 1024))} KB</span></div><pre>{draft.content}</pre></div>}
      </WindowFrame>;
    })}

    {recycling && <div className="modal-backdrop recycling-backdrop"><section className="recycle-dialog"><div className="dialog-bin"><Recycle /></div><div><h2>Recycling {recycling.file.name}</h2><p>{recycling.message}</p><div className="progress"><span style={{ width: `${recycling.progress}%` }}/></div><small>{recycling.progress}% complete</small></div></section></div>}

    {saveAs && drafts[saveAs] && <div className="modal-backdrop"><section className="save-dialog"><h2>Save As</h2><label>File name<input autoFocus value={drafts[saveAs].name} onChange={e => setDrafts(d => ({ ...d, [saveAs]: { ...d[saveAs], name: e.target.value } }))} onKeyDown={e => { if (e.key === "Enter") completeSaveAs(saveAs); }}/></label><div><button className="secondary" onClick={() => setSaveAs(null)}>Cancel</button><button className="primary" onClick={() => completeSaveAs(saveAs)}>Save to Desktop</button></div></section></div>}

    {showReport && <div className="modal-backdrop reveal-backdrop"><section className="reveal-card"><button className="reveal-close" aria-label="Close report" onClick={() => setShowReport(false)}><X/></button><div className="hazard">RRB</div><p className="eyebrow">YOU HAVE DISCOVERED THE</p><h1>REVERSE<br/>RECYCLE BIN<span>™</span></h1><div className="report"><h2>Recycling report</h2><dl><div><dt>Files submitted</dt><dd>{attempts}</dd></div><div><dt>Original files removed</dt><dd>{attempts}</dd></div><div><dt>New files generated</dt><dd>{generated}</dd></div><div><dt>Storage now occupied</dt><dd>+{generatedMb} MB</dd></div><div><dt>Environmental efficiency</dt><dd>−14,194%</dd></div><div><dt>Digital waste created</dt><dd className="excellent">Excellent</dd></div></dl></div><p className="thank-you">Thank you for making the planet considerably worse.</p></section></div>}

    {contextMenu && <div className="context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={e => e.stopPropagation()}><button onClick={newDocument}><FilePlus2/> New text document</button><span/><button onClick={() => setToast("Desktop refreshed. The clutter remains emotionally refreshed.")}><RotateCcw/> Refresh</button></div>}
    {startOpen && <section className="start-menu"><div className="start-head"><span className="avatar">A</span><div><strong>Welcome back</strong><small>Local account</small></div></div><button onClick={newDocument}><span><FilePlus2/></span><div><strong>Text Editor</strong><small>Create a new document</small></div></button><button onClick={reset}><span><RotateCcw/></span><div><strong>Reset desktop</strong><small>Restore the clean demo</small></div></button><p>Tip: Ctrl + Alt + R resets the demo</p></section>}
    {storageNotice && <button className="storage-toast" onClick={() => setStorageNotice(null)}><span className="storage-toast-head"><HardDrive/><span><strong>Storage optimization complete</strong><small>{storageNotice.file} was recycled</small></span><X/></span><span className="storage-numbers"><span><small>SPACE FREED</small><strong>+{storageNotice.freed} MB</strong></span><b>→</b><span className="bad"><small>NEW SPACE USED</small><strong>+{storageNotice.added} MB</strong></span></span></button>}
    {toast && <button className="toast" onClick={() => setToast(null)}><span className="toast-icon">{attempts >= 4 ? "!" : "✓"}</span><span><strong>{attempts >= 5 ? "RRB System" : "Desktop"}</strong><small>{toast}</small></span><X/></button>}

    <footer className="taskbar">
      <button className={`start-button ${startOpen ? "active" : ""}`} aria-label="Open menu" onClick={(e) => { e.stopPropagation(); setStartOpen(v => !v); setContextMenu(null); }}><Grid2X2 /></button>
      <div className="taskbar-divider" />
      {windows.map(w => <button key={w.id} className={`taskbar-app ${!w.minimized ? "running" : ""}`} onClick={() => setWindows(ws => ws.map(item => item.id === w.id ? { ...item, minimized: !item.minimized } : item))}>{w.mode === "recyclebin" ? <Recycle/> : <FileText/>}<span>{w.mode === "recyclebin" ? "Recycle Bin" : drafts[w.fileId ?? ""]?.name ?? "Text Editor"}</span></button>)}
      <div className="system-tray"><span className="tray-icons">◔ )))</span><span>ENG</span><Clock/></div>
    </footer>
  </main>;
}
