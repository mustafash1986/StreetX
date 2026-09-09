import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, Check, ChevronDown, Download, ExternalLink, FilePlus2, FileText, FolderOpen, Image as ImageIcon, Info, Layers, Link2, MonitorDown, Printer, Save, Smartphone, Zap, X } from "lucide-react";
import { GUIDANCE_DISCLAIMER, SOURCES, WIDTH_RULES, formatMetres } from "../data/standards";
import { DEFINITIONS, PALETTE } from "../data/street";
import type { ExportFormat } from "../export/types";

interface TopBarProps {
  onNew: (main?: boolean) => void;
  onSave: () => void;
  onImport: () => void;
  onCopyLink: () => void;
  onGuidance: () => void;
  onAbout: () => void;
  onExport: (format: ExportFormat) => void;
}

export function TopBar({ onNew, onSave, onImport, onCopyLink, onGuidance, onAbout, onExport }: TopBarProps) {
  const [menu, setMenu] = useState<"new" | "share" | "export" | null>(null);
  const toggle = (value: "new" | "share" | "export") => setMenu((open) => open === value ? null : value);
  const action = (callback: () => void) => { setMenu(null); callback(); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenu(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <header className="app-header">
      <div className="header-left">
        <button className="streetx-brand" onClick={onAbout} aria-label="About Streetx"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="5" fill="#b5dce9" /><path d="M0 19h32v9H0z" fill="#333a3b" /><path d="M3 24h26" stroke="white" strokeWidth="1.5" strokeDasharray="4 3" /><path d="M21 11v11" stroke="#88765c" strokeWidth="2" /><path d="M21 4l7 12H14z" fill="#689e4c" /></svg><span>Streetx</span></button>
        <button className="header-button about-button" onClick={onAbout}>About</button>
        <button className="guidance-button" onClick={onGuidance} aria-label="Width guidance"><BookOpen size={14} /><span>Width guidance</span></button>
      </div>
      <nav className="header-right" aria-label="Street actions">
        {menu && <button className="menu-dismiss" aria-label="Dismiss menu" tabIndex={-1} onClick={() => setMenu(null)} />}
        <div className="header-menu"><button className="header-button" onClick={() => toggle("new")} aria-expanded={menu === "new"}>New<span className="header-word"> street</span> <ChevronDown size={12} /></button>
          {menu === "new" && <div className="header-dropdown" role="menu"><button role="menuitem" onClick={() => action(() => onNew())}><FilePlus2 size={15} />Neighborhood street</button><button role="menuitem" onClick={() => action(() => onNew(true))}><FilePlus2 size={15} />Main street</button><button role="menuitem" onClick={() => action(onImport)}><FolderOpen size={15} />Import street file</button></div>}
        </div>
        <div className="header-menu"><button className="header-button" onClick={() => toggle("share")} aria-expanded={menu === "share"}>Share <ChevronDown size={12} /></button>
          {menu === "share" && <div className="header-dropdown" role="menu"><button role="menuitem" onClick={() => action(onCopyLink)}><Link2 size={15} />Copy street link</button><button role="menuitem" onClick={() => action(onSave)}><Download size={15} />Download street file</button><button role="menuitem" onClick={() => action(() => window.print())}><Printer size={15} />Print cross-section</button></div>}
        </div>
        <div className="header-menu"><button className="header-button export-menu-trigger" onClick={() => toggle("export")} aria-expanded={menu === "export"}>Export <ChevronDown size={12} /></button>
          {menu === "export" && <div className="header-dropdown" role="menu"><button role="menuitem" onClick={() => action(() => onExport("pdf"))}><FileText size={15} />PDF document</button><button role="menuitem" onClick={() => action(() => onExport("png"))}><ImageIcon size={15} />PNG image</button><button role="menuitem" onClick={() => action(() => onExport("ai"))}><Zap size={15} />Adobe Illustrator vector (.ai / .svg)</button><button role="menuitem" onClick={() => action(() => onExport("dwg"))}><Layers size={15} />AutoCAD drawing (.dwg)</button></div>}
        </div>
        <InstallAppButton />
        <button className="save-button" onClick={onSave} aria-label="Save street"><Save size={14} /><span>Save street</span></button>
      </nav>
    </header>
  );
}

export function WelcomeDialog({ onClose }: { onClose: () => void }) {
  return <aside className="welcome-message inspector-enter" aria-label="Welcome to Streetx">
    <button className="welcome-close" onClick={onClose} aria-label="Close welcome"><X size={16} /></button>
    <h1>Welcome to Streetx.</h1><p>Design, remix, and share your neighborhood street. Add trees or bike paths, widen sidewalks or traffic lanes, and see how your decisions change the street.</p>
    <p>Start by moving some segments around.</p><button className="welcome-start" onClick={onClose}>Start designing</button>
    <small>Every element is available. Vehicles keep their real-world scale.</small>
  </aside>;
}

export function Modal({ title, children, onClose, wide = false, closeDisabled = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; closeDisabled?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => { element?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={`streetx-modal ${wide ? "wide" : ""}`} aria-label={title} onCancel={(event) => { event.preventDefault(); if (!closeDisabled) onClose(); }} onClick={(event) => { if (!closeDisabled && event.target === event.currentTarget) onClose(); }}>
    <div className="modal-inner"><header><h2>{title}</h2><button onClick={onClose} disabled={closeDisabled} aria-label="Close dialog"><X size={20} /></button></header>{children}</div>
  </dialog>;
}

export function GuidanceDialog({ onClose }: { onClose: () => void }) {
  return <Modal title="Minimum widths, with sources" onClose={onClose} wide>
    <div className="guidance-intro"><span><BookOpen size={15} /> Urban US guidance profile</span><p>{GUIDANCE_DISCLAIMER}</p><p>Widths are measured across the street. Imperial dimensions are rounded up to the next centimetre. The street's minimum is the sum of the minimums for its selected segments.</p></div>
    <div className="guidance-table-scroll"><table className="guidance-table"><thead><tr><th>Element category</th><th>Minimum</th><th>Basis</th></tr></thead><tbody>
      {Object.entries(WIDTH_RULES).map(([key, rule]) => <tr key={key}><td><strong>{rule.label}</strong><details><summary>Notes and sources</summary><p>{rule.note}</p>{rule.sources.map((source) => <a key={source} href={SOURCES[source].url} target="_blank" rel="noreferrer">{SOURCES[source].title} <ExternalLink size={11} /></a>)}</details></td><td>{formatMetres(rule.minM)} m</td><td><span className={`basis-tag ${rule.basis === "Planning allowance" ? "allowance" : ""}`}>{rule.basis}</span></td></tr>)}
    </tbody></table></div>
    <p className="guidance-footer">Protected lanes reserve buffers on traffic-facing sides and a larger door buffer next to parking or loading. Taxi widths include an access aisle. A cross-section cannot validate longitudinal dimensions, grades, swept paths or full accessibility.</p>
  </Modal>;
}

export function AboutDialog({ onClose }: { onClose: () => void }) {
  return <Modal title="Streetx" onClose={onClose}><div className="about-content"><p>A neighborhood street editor with fixed-scale vector artwork and source-linked minimum widths.</p><p><strong>{DEFINITIONS.length} categories and {PALETTE.length} selectable illustrations / layouts.</strong> All are available without an account. Your street is saved in this browser; use Save street for a portable file.</p><h3>Levels &amp; frontages</h3><p>Each segment has a <strong>level</strong> (a curb height above the roadway) and a <strong>cross-slope</strong>, so the profile steps up to sidewalks and tilts for drainage instead of being one flat line. Each side of the street can be a building, green area, garden, waterfront, fenced lot or parking.</p><h3>Keyboard and mouse</h3><p>Click to add or edit. Drag to reorder. Use Ctrl/Cmd+Z to undo, Shift+Ctrl/Cmd+Z to redo, and / to search the library. Only the zoom controls change artwork size.</p><h3>Illustration credits</h3><p>Official <a href="https://github.com/streetmix/illustrations" target="_blank" rel="noreferrer">Streetmix illustrations</a>, art direction by Katie Lewis, with Marcin Wichary, Lou Huang and contributors. Licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>. Streetx crops transparent padding and offers recolored / layer-hidden planter variants.</p><p className="about-disclaimer"><Info size={16} />A design tool, not a civil-engineering or accessibility certification.</p></div></Modal>;
}

export function Toast({ message }: { message: string }) {
  return message ? <div className="streetx-toast" role="status"><Check size={15} /><span>{message}</span></div> : null;
}

/* ---------- Install as an app (PWA) ---------- */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function useInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [standalone, setStandalone] = useState(false);
  useEffect(() => {
    const isStandalone = () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setStandalone(isStandalone());
    const onPrompt = (event: Event) => { event.preventDefault(); setDeferred(event as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    const mq = window.matchMedia("(display-mode: standalone)");
    const onMq = () => setStandalone(isStandalone());
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    mq.addEventListener?.("change", onMq);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener?.("change", onMq);
    };
  }, []);
  return { deferred, installed, standalone };
}

export function InstallAppButton() {
  const { deferred, installed, standalone } = useInstall();
  const [open, setOpen] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);
  if (installed || standalone) return null;
  const install = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") setJustInstalled(true);
        else setJustInstalled(false);
      } catch {
        setOpen(true);
      }
      return;
    }
    setOpen(true);
  };
  return (
    <>
      <button className={`install-app-button ${justInstalled ? "is-installed" : ""}`} onClick={install} aria-label="Install Streetx as an app" title="Install as an app and create a desktop shortcut">
        {justInstalled ? <Check size={14} /> : <Download size={14} />}
        <span>{justInstalled ? "Installing…" : "Install app"}</span>
      </button>
      {open && <InstallGuideDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function InstallGuideDialog({ onClose }: { onClose: () => void }) {
  return <Modal title="Install Streetx as an app" onClose={onClose}>
    <div className="install-guide">
      <p>Install Streetx like a native app: it opens in its own window, appears on your Start menu and desktop, and works offline.</p>
      {!window.matchMedia("(display-mode: standalone)").matches && <div className="install-tip">
        <Check size={15} /> If a browser prompt appeared, accept it — that installs instantly.
      </div>}
      <div className="install-platforms">
        <section><h4><MonitorDown size={16} /> Desktop (Windows / Mac / Linux)</h4>
          <ul>
            <li><strong>Chrome / Edge:</strong> click the “Install” icon in the address bar (or ⋮ menu → <b>Install Streetx…</b>). This creates a desktop and Start-menu shortcut.</li>
            <li><strong>Safari (Mac):</strong> File → <b>Add to Dock</b>.</li>
            <li><strong>Other browsers:</strong> look for <b>Install app</b>, <b>Create shortcut</b>, or <b>Add to Desktop</b> in the menu.</li>
          </ul>
        </section>
        <section><h4><Smartphone size={16} /> Mobile (Android / iOS)</h4>
          <ul>
            <li><strong>Android (Chrome):</strong> ⋮ menu → <b>Add to Home screen</b> / <b>Install app</b>.</li>
            <li><strong>iPhone / iPad (Safari):</strong> Share button → <b>Add to Home Screen</b>.</li>
          </ul>
        </section>
      </div>
      <p className="install-note">Your designs are saved in this browser and work offline once installed. Use <b>Save street</b> to keep a portable copy.</p>
      <div className="install-actions"><button onClick={onClose}>Close</button></div>
    </div>
  </Modal>;
}