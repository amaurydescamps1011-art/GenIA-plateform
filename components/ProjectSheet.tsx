"use client";

import React, { CSSProperties, useCallback, useEffect, useRef, useState } from "react";

type DriveLink = { id: string; label: string; url: string };
type Step = { id: string; label: string; icon: string; content: string; images: string[]; driveLinks: DriveLink[] };

type Project = {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  status: string;
  checklist: string;
  dueDate: string;
  assignedTo: string;
  createdAt: string;
};

const STATUS_OPTIONS = [
  { key: "en_cours", label: "En cours", color: "#6366f1" },
  { key: "pause", label: "En pause", color: "#eab308" },
  { key: "termine", label: "Terminé", color: "#22c55e" },
];

const ASSIGNEES = [
  { name: "Amaury", initial: "A", color: "#6366f1" },
  { name: "Fabien", initial: "F", color: "#f59e0b" },
];
function assigneeInfo(name: string) {
  return ASSIGNEES.find(a => a.name === name) ?? null;
}

function driveId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) ?? url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}
function driveThumbnail(url: string): string {
  const id = driveId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w600` : url;
}
function driveOpen(url: string): string {
  const id = driveId(url);
  return id ? `https://drive.google.com/file/d/${id}/view` : url;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function parseSteps(raw: string): Step[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return [];
    if ("done" in arr[0] && !("content" in arr[0])) {
      return arr.map((s: { id: string; label: string }) => ({
        id: s.id, label: s.label, icon: "📄", content: "", images: [], driveLinks: [],
      }));
    }
    return arr;
  } catch {
    return [];
  }
}

// ──────────────────────────────────────────────
// Storyboard editor
// ──────────────────────────────────────────────
type Frame = { id: string; imageUrl: string; note: string };

function parseFrames(raw: string): Frame[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p) && p.length > 0 && "imageUrl" in p[0]) return p;
    return [];
  } catch { return []; }
}

function StoryboardEditor({
  step, projectId, onUpdate, onBack,
}: {
  step: Step; projectId: string; onUpdate: (updated: Step) => void; onBack: () => void;
}) {
  const [frames, setFrames] = useState<Frame[]>(() => {
    const p = parseFrames(step.content);
    return p.length > 0 ? p : [{ id: uid(), imageUrl: "", note: "" }, { id: uid(), imageUrl: "", note: "" }];
  });
  function save(next: Frame[]) {
    setFrames(next);
    onUpdate({ ...step, content: JSON.stringify(next) });
  }

  function addFrame() { save([...frames, { id: uid(), imageUrl: "", note: "" }]); }
  function removeFrame(id: string) { save(frames.filter(f => f.id !== id)); }
  function updateNote(id: string, note: string) { save(frames.map(f => f.id === id ? { ...f, note } : f)); }
  function setFrameUrl(id: string, url: string) { save(frames.map(f => f.id === id ? { ...f, imageUrl: url } : f)); }

  const frameBox: React.CSSProperties = {
    position: "relative",
    width: "100%",
    paddingTop: "177.78%", // 9:16 portrait
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    overflow: "hidden",
    cursor: "pointer",
  };

  const inset: React.CSSProperties = { position: "absolute", inset: 0 };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem 2rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <button onClick={onBack} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "var(--text-muted)", padding: 0, marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.375rem" }}>
          ← Étapes
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <span style={{ fontSize: "2rem" }}>🎨</span>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>Storyboard</h2>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>{frames.length} plan{frames.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1.25rem" }}>
        {frames.map((frame, idx) => (
          <div key={frame.id}>
            <div style={frameBox}>
              <div style={inset}>
                {frame.imageUrl ? (
                  <img src={driveThumbnail(frame.imageUrl)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.opacity = "0.4"; }} />
                ) : (
                  <div style={{ ...inset, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0.75rem", gap: "0.4rem" }}>
                    <span style={{ fontSize: "1.25rem", color: "var(--text-muted)" }}>🔗</span>
                    <input
                      onClick={e => e.stopPropagation()}
                      placeholder="Coller lien Drive..."
                      value={frame.imageUrl}
                      onChange={e => setFrameUrl(frame.id, e.target.value)}
                      style={{ width: "100%", fontSize: "0.62rem", background: "transparent", border: "1px solid var(--border)", borderRadius: "4px", padding: "0.25rem 0.4rem", color: "var(--text)", boxSizing: "border-box", textAlign: "center" }}
                    />
                  </div>
                )}
                <div style={{ position: "absolute", top: "6px", left: "8px", background: "rgba(0,0,0,0.65)", color: "white", borderRadius: "4px", padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700 }}>{idx + 1}</div>
                <button onClick={e => { e.stopPropagation(); removeFrame(frame.id); }}
                  style={{ position: "absolute", top: "6px", right: "8px", background: "rgba(0,0,0,0.65)", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", color: "white", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>×</button>
                {frame.imageUrl && (
                  <button onClick={e => { e.stopPropagation(); setFrameUrl(frame.id, ""); }}
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.55)", border: "none", color: "white", fontSize: "0.68rem", cursor: "pointer", padding: "0.3rem", opacity: 0, transition: "opacity 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0"}>
                    Changer l&apos;image
                  </button>
                )}
              </div>
            </div>
            <input className="genia-input" style={{ marginTop: "0.5rem", fontSize: "0.8rem", width: "100%", boxSizing: "border-box" }}
              placeholder={"Plan " + (idx + 1) + " — description..."} value={frame.note} onChange={e => updateNote(frame.id, e.target.value)} />
          </div>
        ))}

        {/* Add frame tile */}
        <div onClick={addFrame} style={{ cursor: "pointer" }}>
          <div style={{ ...frameBox, border: "1px dashed var(--border)", background: "transparent" }}>
            <div style={{ ...inset, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: "0.375rem" }}>
              <span style={{ fontSize: "1.75rem" }}>+</span>
              <span style={{ fontSize: "0.75rem" }}>Nouveau plan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Step detail view
// ──────────────────────────────────────────────
function StepDetailInner({
  step, projectId, onUpdate, onBack,
}: {
  step: Step; projectId: string; onUpdate: (updated: Step) => void; onBack: () => void;
}) {
  const [content, setContent] = useState(step.content);
  const [driveLinks, setDriveLinks] = useState<DriveLink[]>(step.driveLinks || []);
  const [images, setImages] = useState<string[]>(step.images || []);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setContent(step.content);
    setDriveLinks(step.driveLinks || []);
    setImages(step.images || []);
  }, [step.id]);

  function triggerSave(patch: Partial<Step>) {
    const next: Step = { ...step, content, driveLinks, images, ...patch };
    onUpdate(next);
  }

  function debounce(patch: Partial<Step>) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => triggerSave(patch), 700);
  }

  function addDriveLink() {
    if (!newUrl.trim()) return;
    const link: DriveLink = { id: uid(), label: newLabel.trim() || "Lien Drive", url: newUrl.trim() };
    const next = [...driveLinks, link];
    setDriveLinks(next);
    setNewUrl("");
    setNewLabel("");
    triggerSave({ driveLinks: next });
  }

  function removeDriveLink(id: string) {
    const next = driveLinks.filter((l) => l.id !== id);
    setDriveLinks(next);
    triggerSave({ driveLinks: next });
  }

  function addImageFromDrive() {
    if (!newImageUrl.trim()) return;
    const next = [...images, newImageUrl.trim()];
    setImages(next);
    setNewImageUrl("");
    triggerSave({ images: next });
  }

  function removeImage(url: string) {
    const next = images.filter((i) => i !== url);
    setImages(next);
    triggerSave({ images: next });
  }

  const sectionCard: CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "1.25rem",
    marginBottom: "1.25rem",
  };

  const sectionLabel: CSSProperties = {
    fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.75rem 0",
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem 2rem" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <button
          onClick={onBack}
          style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "var(--text-muted)", padding: 0, marginBottom: "0.875rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
        >
          ← Étapes
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <span style={{ fontSize: "2rem" }}>{step.icon}</span>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>{step.label}</h2>
        </div>
      </div>

      {/* Contenu */}
      <div style={sectionCard}>
        <p style={sectionLabel}>Contenu</p>
        <textarea
          style={{
            width: "100%", minHeight: "200px", background: "var(--bg)", border: "1px solid var(--border)",
            borderRadius: "7px", padding: "0.875rem", fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text)",
            resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box",
          }}
          placeholder="Notes, script, détails..."
          value={content}
          onChange={(e) => { setContent(e.target.value); debounce({ content: e.target.value }); }}
        />
      </div>

      {/* Images */}
      <div style={sectionCard}>
        <p style={sectionLabel}>Images & références</p>
        {images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.625rem", marginBottom: "1rem" }}>
            {images.map((url) => (
              <div key={url} style={{ position: "relative", borderRadius: "6px", overflow: "hidden" }}>
                <a href={driveOpen(url)} target="_blank" rel="noopener noreferrer">
                  <img src={driveThumbnail(url)} alt="" style={{ width: "100%", height: "90px", objectFit: "cover", display: "block" }} onError={e => { (e.target as HTMLImageElement).style.opacity = "0.4"; }} />
                </a>
                <button
                  onClick={() => removeImage(url)}
                  style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", color: "white", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                >×</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input className="genia-input" style={{ flex: 1, fontSize: "0.82rem" }}
            placeholder="Lien Drive (image, PDF...)"
            value={newImageUrl}
            onChange={e => setNewImageUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") addImageFromDrive(); }} />
          <button className="genia-btn" style={{ fontSize: "0.82rem", padding: "0.4rem 0.875rem", whiteSpace: "nowrap" }} onClick={addImageFromDrive}>
            + Ajouter
          </button>
        </div>
      </div>

      {/* Liens Drive */}
      <div style={sectionCard}>
        <p style={sectionLabel}>Liens Drive</p>
        {driveLinks.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {driveLinks.map((link) => (
              <div key={link.id} style={{ display: "flex", alignItems: "center" }}>
                <a href={link.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.875rem", borderRadius: "6px 0 0 6px", background: "#1e40af22", border: "1px solid #3b82f660", color: "#60a5fa", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}
                >
                  🔗 {link.label}
                </a>
                <button onClick={() => removeDriveLink(link.id)}
                  style={{ padding: "0.4rem 0.5rem", borderRadius: "0 6px 6px 0", border: "1px solid #3b82f660", borderLeft: "none", background: "#1e40af22", color: "#60a5fa", cursor: "pointer", fontSize: "0.75rem", lineHeight: 1 }}
                >×</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input className="genia-input" style={{ flex: 2, minWidth: "200px", fontSize: "0.82rem" }}
            placeholder="https://drive.google.com/..." value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addDriveLink(); }} />
          <input className="genia-input" style={{ flex: 1, minWidth: "120px", fontSize: "0.82rem" }}
            placeholder="Label (ex: Dossier rushes)" value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addDriveLink(); }} />
          <button className="genia-btn" style={{ fontSize: "0.82rem", padding: "0.4rem 0.875rem", whiteSpace: "nowrap" }} onClick={addDriveLink}>
            + Lien
          </button>
        </div>
      </div>
    </div>
  );
}

function isStoryboardStep(step: Step) {
  return step.id === "storyboard" || step.label.toLowerCase().includes("storyboard");
}

function StepDetail(props: { step: Step; projectId: string; onUpdate: (updated: Step) => void; onBack: () => void }) {
  if (isStoryboardStep(props.step)) {
    return <StoryboardEditor step={props.step} projectId={props.projectId} onUpdate={props.onUpdate} onBack={props.onBack} />;
  }
  return <StepDetailInner {...props} />;
}

// ──────────────────────────────────────────────
// Step grid
// ──────────────────────────────────────────────
function StepGrid({ steps, onSelect, onAddStep }: { steps: Step[]; onSelect: (s: Step) => void; onAddStep: () => void }) {
  return (
    <div style={{ padding: "1.75rem 2rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "1rem" }}>
        {steps.map((step) => {
          const hasContent = step.content.trim().length > 0;
          const imgCount = (step.images || []).length;
          const linkCount = (step.driveLinks || []).length;
          const filled = hasContent || imgCount > 0 || linkCount > 0;
          return (
            <div key={step.id} onClick={() => onSelect(step)}
              style={{ background: "var(--surface)", border: "2px solid " + (filled ? "rgba(255,255,255,0.55)" : "var(--border)"), borderRadius: "12px", padding: "1.25rem", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.625rem", minHeight: "140px", transition: "box-shadow 0.15s, transform 0.1s", boxShadow: filled ? "0 0 0 1px rgba(255,255,255,0.12), 0 0 18px rgba(255,255,255,0.07)" : "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = filled ? "0 0 0 1px rgba(255,255,255,0.2), 0 6px 24px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.15)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = filled ? "0 0 0 1px rgba(255,255,255,0.12), 0 0 18px rgba(255,255,255,0.07)" : "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
            >
              <span style={{ fontSize: "1.75rem" }}>{step.icon}</span>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--text)" }}>{step.label}</p>
              {hasContent && (
                <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {step.content.slice(0, 60)}{step.content.length > 60 ? "..." : ""}
                </p>
              )}
              {(imgCount > 0 || linkCount > 0) && (
                <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                  {imgCount > 0 && <span style={{ fontSize: "0.68rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1px 6px", color: "var(--text-muted)" }}>📸 {imgCount}</span>}
                  {linkCount > 0 && <span style={{ fontSize: "0.68rem", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1px 6px", color: "var(--text-muted)" }}>🔗 {linkCount}</span>}
                </div>
              )}
              {!filled && <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>Vide — cliquer pour remplir</p>}
            </div>
          );
        })}
        <div onClick={onAddStep}
          style={{ background: "transparent", border: "1px dashed var(--border)", borderRadius: "12px", padding: "1.25rem", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", minHeight: "140px", color: "var(--text-muted)" }}
        >
          <span style={{ fontSize: "1.5rem" }}>+</span>
          <span style={{ fontSize: "0.8rem" }}>Nouvelle étape</span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Project media panel
// ──────────────────────────────────────────────
const MEDIA_CATS = [
  { key: "logo", label: "Logo", icon: "🎨" },
  { key: "avatar", label: "Avatar / Photo", icon: "👤" },
  { key: "charte", label: "Charte graphique", icon: "🖌️" },
  { key: "produit", label: "Produit", icon: "📦" },
  { key: "autre", label: "Autre", icon: "📄" },
];

type MediaAsset = { id: string; name: string; category: string; url: string; fileType: string; projectId?: string };

function ProjectMedia({ projectId, clientId, onClose }: { projectId: string; clientId: string; onClose: () => void }) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [shared, setShared] = useState<MediaAsset[]>([]);
  const [tab, setTab] = useState<"drive" | "mediatheque">("drive");
  const [cat, setCat] = useState("logo");
  const [form, setForm] = useState({ name: "", url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/assets?projectId=" + projectId).then(r => r.ok ? r.json() : []).then(setAssets);
    fetch("/api/assets?shared=true").then(r => r.ok ? r.json() : []).then(setShared);
  }, [projectId]);

  async function addDriveAsset(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    const res = await fetch("/api/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), url: form.url.trim(), category: cat, projectId, clientId }),
    });
    if (res.ok) {
      const a = await res.json();
      setAssets(prev => [a, ...prev]);
      setShared(prev => [a, ...prev]);
      setForm({ name: "", url: "" });
    }
    setSaving(false);
  }

  async function addFromMediatheque(a: MediaAsset) {
    const res = await fetch("/api/assets/" + a.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, clientId }),
    });
    if (res.ok) setAssets(prev => [{ ...a, projectId }, ...prev]);
  }

  async function del(id: string) {
    await fetch("/api/assets/" + id, { method: "DELETE" });
    setAssets(prev => prev.filter(a => a.id !== id));
  }

  const alreadyLinked = new Set(assets.map(a => a.id));

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.82rem", color: "var(--text-muted)", padding: 0 }}>← Étapes</button>
        <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 700 }}>📁 Médias du projet</h2>
      </div>

      {/* Add panel */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.25rem", marginBottom: "1.5rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {([["drive", "🔗 Lien Drive"], ["mediatheque", "🗂 Depuis la Médiathèque"]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: "0.35rem 0.875rem", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer", border: "1px solid " + (tab === key ? "var(--accent)" : "var(--border)"), background: tab === key ? "var(--accent-dim)" : "transparent", color: tab === key ? "var(--accent)" : "var(--text-muted)", fontWeight: tab === key ? 600 : 400 }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "drive" && (
          <>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              {MEDIA_CATS.map(c => (
                <button key={c.key} onClick={() => setCat(c.key)}
                  style={{ padding: "0.25rem 0.625rem", borderRadius: "6px", fontSize: "0.78rem", cursor: "pointer", border: "1px solid " + (cat === c.key ? "var(--accent)" : "var(--border)"), background: cat === c.key ? "var(--accent-dim)" : "transparent", color: cat === c.key ? "var(--accent)" : "var(--text-muted)", fontWeight: cat === c.key ? 600 : 400 }}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
            <form onSubmit={addDriveAsset} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <input className="genia-input" placeholder="Nom du fichier" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ width: "160px" }} />
              <input className="genia-input" placeholder="https://drive.google.com/file/d/..." value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))} style={{ flex: 1, minWidth: "200px" }} />
              <button className="genia-btn" type="submit" disabled={saving} style={{ whiteSpace: "nowrap" }}>
                {saving ? "..." : "+ Ajouter"}
              </button>
            </form>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.68rem", color: "var(--text-muted)" }}>
              Drive → clic droit → Partager → "Toute personne ayant le lien" → Copier le lien
            </p>
          </>
        )}

        {tab === "mediatheque" && (
          shared.filter(a => !alreadyLinked.has(a.id)).length === 0 ? (
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>Aucun média disponible dans la Médiathèque.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.625rem" }}>
              {shared.filter(a => !alreadyLinked.has(a.id)).map(a => {
                const thumb = driveId(a.url) ? driveThumbnail(a.url) : null;
                const catInfo = MEDIA_CATS.find(c => c.key === a.category);
                return (
                  <div key={a.id} onClick={() => addFromMediatheque(a)}
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", cursor: "pointer", transition: "border-color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"}>
                    <div style={{ height: "70px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {thumb
                        ? <img src={thumb} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        : <span style={{ fontSize: "1.75rem" }}>{catInfo?.icon || "📄"}</span>}
                    </div>
                    <p style={{ margin: 0, padding: "0.3rem 0.5rem", fontSize: "0.65rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</p>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Project assets grid */}
      {assets.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "0.85rem" }}>Aucun média pour ce projet.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.875rem" }}>
          {assets.map(a => {
            const catInfo = MEDIA_CATS.find(c => c.key === a.category);
            const thumb = driveId(a.url) ? driveThumbnail(a.url) : null;
            return (
              <div key={a.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                <a href={driveOpen(a.url)} target="_blank" rel="noopener noreferrer" style={{ display: "block", height: "100px", background: "var(--bg)", overflow: "hidden" }}>
                  {thumb
                    ? <img src={thumb} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem" }}>{catInfo?.icon || "📄"}</div>}
                </a>
                <div style={{ padding: "0.5rem 0.625rem" }}>
                  <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{catInfo?.label || a.category}</span>
                    <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                      <a href={driveOpen(a.url)} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.65rem", color: "var(--accent)", textDecoration: "none" }}>Drive ↗</a>
                      <button onClick={() => del(a.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", fontSize: "0.75rem", padding: 0, lineHeight: 1 }}>×</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
export default function ProjectSheet({ clientId, clientName, onClose }: { clientId: string; clientName: string; onClose: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [activeStep, setActiveStep] = useState<Step | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("en_cours");
  const [dueDate, setDueDate] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const titleTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/projects?clientId=" + clientId);
    if (res.ok) {
      const data = await res.json();
      setProjects(data);
      if (data.length > 0) loadProject(data[0]);
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  function loadProject(p: Project) {
    setSelected(p);
    setTitle(p.title);
    setStatus(p.status);
    setDueDate(p.dueDate || "");
    setAssignedTo(p.assignedTo || "");
    setSteps(parseSteps(p.checklist));
    setActiveStep(null);
  }

  async function saveProject(patch: Record<string, string>) {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/projects/" + selected.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    setProjects((prev) => prev.map((p) => p.id === selected.id ? { ...p, ...patch } : p));
  }

  async function updateStep(updated: Step) {
    const newSteps = steps.map((s) => s.id === updated.id ? updated : s);
    setSteps(newSteps);
    setActiveStep(updated);
    await saveProject({ checklist: JSON.stringify(newSteps) });
  }

  async function addStep() {
    const label = prompt("Nom de l'étape :");
    if (!label) return;
    const newStep: Step = { id: uid(), label, icon: "📄", content: "", images: [], driveLinks: [] };
    const newSteps = [...steps, newStep];
    setSteps(newSteps);
    await saveProject({ checklist: JSON.stringify(newSteps) });
    setActiveStep(newStep);
  }

  async function createProject() {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientName, title: "Nouveau projet" }),
    });
    if (res.ok) {
      const p = await res.json();
      setProjects((prev) => [p, ...prev]);
      loadProject(p);
    }
  }

  async function deleteProject() {
    if (!selected || !confirm("Supprimer ce projet ?")) return;
    await fetch("/api/projects/" + selected.id, { method: "DELETE" });
    const next = projects.filter((p) => p.id !== selected.id);
    setProjects(next);
    if (next.length > 0) loadProject(next[0]);
    else { setSelected(null); setSteps([]); setActiveStep(null); }
  }

  return (
    <div style={{ position: "fixed", left: "220px", top: 0, right: 0, bottom: 0, background: "var(--bg)", display: "flex", flexDirection: "column", zIndex: 150 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--border)", background: "var(--surface)", flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-muted)", padding: "0 0.25rem" }}>←</button>
        <div>
          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Projets de</span>
          <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>{clientName}</h2>
        </div>
        {saving && <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: "auto" }}>Sauvegarde...</span>}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{ width: "240px", minWidth: "240px", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
          <div style={{ padding: "0.75rem", borderBottom: "1px solid var(--border)" }}>
            <button className="genia-btn" style={{ width: "100%", fontSize: "0.8rem" }} onClick={createProject}>+ Nouveau projet</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
            {loading ? (
              <p style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>Chargement...</p>
            ) : projects.length === 0 ? (
              <p style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.82rem" }}>Crée le premier projet</p>
            ) : projects.map((p) => {
              const isActive = selected?.id === p.id;
              const s = STATUS_OPTIONS.find((o) => o.key === p.status) || STATUS_OPTIONS[0];
              return (
                <div key={p.id} onClick={() => loadProject(p)}
                  style={{ padding: "0.625rem 0.75rem", borderRadius: "7px", cursor: "pointer", marginBottom: "0.25rem", background: isActive ? "var(--accent-dim)" : "transparent", border: "1px solid " + (isActive ? "var(--accent)" : "transparent") }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <p style={{ margin: 0, fontWeight: isActive ? 600 : 400, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{p.title}</p>
                    {(() => { const a = assigneeInfo(p.assignedTo); return a ? (
                      <span title={a.name} style={{ width: "20px", height: "20px", borderRadius: "50%", background: a.color, color: "#fff", fontSize: "0.6rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{a.initial}</span>
                    ) : null; })()}
                  </div>
                  <span style={{ fontSize: "0.68rem", color: s.color, fontWeight: 600 }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!selected ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem", color: "var(--text-muted)" }}>
              <p>Sélectionne ou crée un projet</p>
              <button className="genia-btn" onClick={createProject}>+ Nouveau projet</button>
            </div>
          ) : (
            <>
              <div style={{ padding: "0.875rem 1.75rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap", background: "var(--surface)", flexShrink: 0 }}>
                <input
                  style={{ fontSize: "1rem", fontWeight: 700, background: "transparent", border: "none", outline: "none", color: "var(--text)", padding: 0, minWidth: "160px", flex: 1 }}
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleTimer.current) clearTimeout(titleTimer.current);
                    titleTimer.current = setTimeout(() => saveProject({ title: e.target.value }), 800);
                  }}
                  placeholder="Titre du projet"
                />
                <select className="genia-input" style={{ background: "var(--surface)", color: "var(--text)", fontSize: "0.8rem", padding: "0.3rem 0.6rem", width: "auto" }}
                  value={status} onChange={(e) => { setStatus(e.target.value); saveProject({ status: e.target.value }); }}>
                  {STATUS_OPTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <input type="date" className="genia-input"
                  style={{ background: "var(--surface)", color: "var(--text)", fontSize: "0.8rem", padding: "0.3rem 0.6rem", width: "auto" }}
                  value={dueDate} onChange={(e) => { setDueDate(e.target.value); saveProject({ dueDate: e.target.value }); }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.5rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)" }}>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginRight: "0.15rem" }}>Resp.</span>
                  {ASSIGNEES.map(a => {
                    const active = assignedTo === a.name;
                    return (
                      <button key={a.name} title={a.name}
                        onClick={() => { const v = active ? "" : a.name; setAssignedTo(v); saveProject({ assignedTo: v }); }}
                        style={{ width: "26px", height: "26px", borderRadius: "50%", border: "2px solid " + (active ? a.color : "var(--border)"), background: active ? a.color : "transparent", color: active ? "#fff" : "var(--text-muted)", fontSize: "0.72rem", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                        {a.initial}
                      </button>
                    );
                  })}
                  {assignedTo && <span style={{ fontSize: "0.75rem", fontWeight: 600, color: assigneeInfo(assignedTo)?.color, marginLeft: "0.2rem" }}>{assignedTo}</span>}
                </div>
                {(activeStep || showMedia) && (
                  <button onClick={() => { setActiveStep(null); setShowMedia(false); }}
                    style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}>
                    ⊞ Toutes les étapes
                  </button>
                )}
                <button onClick={() => { setShowMedia(!showMedia); setActiveStep(null); }}
                  style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid " + (showMedia ? "var(--accent)" : "var(--border)"), background: showMedia ? "var(--accent-dim)" : "transparent", cursor: "pointer", color: showMedia ? "var(--accent)" : "var(--text-muted)" }}>
                  📁 Médias
                </button>
                <button onClick={deleteProject}
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.625rem", borderRadius: "6px", border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer" }}>
                  Supprimer
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {showMedia ? (
                  <ProjectMedia projectId={selected.id} clientId={clientId} onClose={() => setShowMedia(false)} />
                ) : activeStep ? (
                  <StepDetail step={activeStep} projectId={selected.id} onUpdate={updateStep} onBack={() => setActiveStep(null)} />
                ) : (
                  <StepGrid steps={steps} onSelect={(s) => setActiveStep(s)} onAddStep={addStep} />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
