"use client";

import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";

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
  createdAt: string;
};

const STATUS_OPTIONS = [
  { key: "en_cours", label: "En cours", color: "#6366f1" },
  { key: "pause", label: "En pause", color: "#eab308" },
  { key: "termine", label: "Terminé", color: "#22c55e" },
];

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
// Step detail view
// ──────────────────────────────────────────────
function StepDetail({
  step, projectId, onUpdate, onBack,
}: {
  step: Step; projectId: string; onUpdate: (updated: Step) => void; onBack: () => void;
}) {
  const [content, setContent] = useState(step.content);
  const [driveLinks, setDriveLinks] = useState<DriveLink[]>(step.driveLinks || []);
  const [images, setImages] = useState<string[]>(step.images || []);
  const [newUrl, setNewUrl] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [uploading, setUploading] = useState(false);
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

  async function uploadImage(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/projects/" + projectId + "/upload", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json();
      const next = [...images, data.url as string];
      setImages(next);
      triggerSave({ images: next });
    }
    setUploading(false);
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
                <img src={url} alt="" style={{ width: "100%", height: "90px", objectFit: "cover", display: "block" }} />
                <button
                  onClick={() => removeImage(url)}
                  style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "20px", height: "20px", cursor: "pointer", color: "white", fontSize: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                >×</button>
              </div>
            ))}
          </div>
        )}
        <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: uploading ? "wait" : "pointer", padding: "0.5rem 1rem", borderRadius: "7px", border: "1px dashed var(--border)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {uploading ? "Upload en cours..." : "+ Ajouter une image"}
          <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
        </label>
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
              style={{ background: "var(--surface)", border: "1px solid " + (filled ? "var(--accent)" : "var(--border)"), borderRadius: "12px", padding: "1.25rem", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.625rem", minHeight: "140px", transition: "box-shadow 0.15s, transform 0.1s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}
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
                  <p style={{ margin: 0, fontWeight: isActive ? 600 : 400, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</p>
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
                {activeStep && (
                  <button onClick={() => setActiveStep(null)}
                    style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", color: "var(--text-muted)" }}>
                    ⊞ Toutes les étapes
                  </button>
                )}
                <button onClick={deleteProject}
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.625rem", borderRadius: "6px", border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer" }}>
                  Supprimer
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto" }}>
                {activeStep ? (
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
