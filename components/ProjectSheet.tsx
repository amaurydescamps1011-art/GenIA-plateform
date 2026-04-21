"use client";

import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";

type CheckItem = { id: string; label: string; done: boolean };

type Project = {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  status: string;
  script: string;
  notes: string;
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

function parseChecklist(raw: string): CheckItem[] {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_OPTIONS.find((o) => o.key === status) || STATUS_OPTIONS[0];
  return (
    <span
      style={{
        fontSize: "0.72rem",
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: "999px",
        background: s.color + "22",
        color: s.color,
        letterSpacing: "0.03em",
      }}
    >
      {s.label}
    </span>
  );
}

function ChecklistEditor({
  items,
  onChange,
}: {
  items: CheckItem[];
  onChange: (items: CheckItem[]) => void;
}) {
  const [newLabel, setNewLabel] = useState("");

  function toggle(id: string) {
    onChange(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function remove(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  function add() {
    if (!newLabel.trim()) return;
    onChange([...items, { id: uid(), label: newLabel.trim(), done: false }]);
    setNewLabel("");
  }

  const done = items.filter((i) => i.done).length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "0.75rem",
        }}
      >
        <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Checklist production
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {done}/{items.length}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "4px",
          background: "var(--border)",
          borderRadius: "999px",
          marginBottom: "1rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: items.length > 0 ? (done / items.length) * 100 + "%" : "0%",
            background: "#22c55e",
            borderRadius: "999px",
            transition: "width 0.3s",
          }}
        />
      </div>

      {/* Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              padding: "0.5rem 0.625rem",
              borderRadius: "6px",
              background: item.done ? "rgba(34,197,94,0.07)" : "var(--bg)",
              border: "1px solid " + (item.done ? "rgba(34,197,94,0.2)" : "var(--border)"),
              cursor: "pointer",
            }}
            onClick={() => toggle(item.id)}
          >
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "4px",
                border: "2px solid " + (item.done ? "#22c55e" : "var(--border)"),
                background: item.done ? "#22c55e" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {item.done && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span
              style={{
                fontSize: "0.85rem",
                flex: 1,
                color: item.done ? "var(--text-muted)" : "var(--text)",
                textDecoration: item.done ? "line-through" : "none",
              }}
            >
              {item.label}
            </span>
            <button
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
                fontSize: "0.9rem",
                padding: "0 2px",
                lineHeight: 1,
                opacity: 0.5,
              }}
              onClick={(e) => {
                e.stopPropagation();
                remove(item.id);
              }}
              title="Supprimer"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Add item */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          className="genia-input"
          style={{ flex: 1, fontSize: "0.82rem" }}
          placeholder="Ajouter une étape..."
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        <button
          className="genia-btn"
          style={{ fontSize: "0.82rem", padding: "0.4rem 0.75rem", whiteSpace: "nowrap" }}
          onClick={add}
        >
          + Étape
        </button>
      </div>
    </div>
  );
}

export default function ProjectSheet({
  clientId,
  clientName,
  onClose,
}: {
  clientId: string;
  clientName: string;
  onClose: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local editable state for selected project
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("en_cours");
  const [dueDate, setDueDate] = useState("");
  const [checklist, setChecklist] = useState<CheckItem[]>([]);
  const [script, setScript] = useState("");
  const [notes, setNotes] = useState("");
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/projects?clientId=" + clientId);
    if (res.ok) {
      const data = await res.json();
      setProjects(data);
      if (!selected && data.length > 0) {
        loadProject(data[0]);
      }
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  function loadProject(p: Project) {
    setSelected(p);
    setTitle(p.title);
    setStatus(p.status);
    setDueDate(p.dueDate || "");
    setChecklist(parseChecklist(p.checklist));
    setScript(p.script || "");
    setNotes(p.notes || "");
  }

  async function saveProject(patch: Record<string, unknown>) {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/projects/" + selected.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);
    setProjects((prev) =>
      prev.map((p) => (p.id === selected.id ? { ...p, ...patch } : p))
    );
  }

  function debounceSave(patch: Record<string, unknown>) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProject(patch), 800);
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
    if (!selected) return;
    if (!confirm("Supprimer ce projet ?")) return;
    await fetch("/api/projects/" + selected.id, { method: "DELETE" });
    const next = projects.filter((p) => p.id !== selected.id);
    setProjects(next);
    if (next.length > 0) {
      loadProject(next[0]);
    } else {
      setSelected(null);
    }
  }

  const overlayStyle: CSSProperties = {
    position: "fixed",
    left: "220px",
    top: 0,
    right: 0,
    bottom: 0,
    background: "var(--bg)",
    display: "flex",
    flexDirection: "column",
    zIndex: 150,
  };

  const sidebarStyle: CSSProperties = {
    width: "260px",
    minWidth: "260px",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    background: "var(--surface)",
  };

  const mainStyle: CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
  };

  return (
    <div style={overlayStyle}>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          padding: "0.875rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <button
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: "1.25rem",
            color: "var(--text-muted)",
            lineHeight: 1,
            padding: "0 0.25rem",
          }}
          onClick={onClose}
          title="Fermer"
        >
          ←
        </button>
        <div>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Projets de
          </span>
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{clientName}</h2>
        </div>
        {saving && (
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto" }}>
            Sauvegarde...
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left sidebar — project list */}
        <div style={sidebarStyle}>
          <div style={{ padding: "0.875rem", borderBottom: "1px solid var(--border)" }}>
            <button className="genia-btn" style={{ width: "100%", fontSize: "0.82rem" }} onClick={createProject}>
              + Nouveau projet
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
            {loading ? (
              <p style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>Chargement...</p>
            ) : projects.length === 0 ? (
              <p style={{ padding: "1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Aucun projet. Crée le premier !
              </p>
            ) : (
              projects.map((p) => {
                const isActive = selected?.id === p.id;
                const items = parseChecklist(p.checklist);
                const done = items.filter((i) => i.done).length;
                const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => loadProject(p)}
                    style={{
                      padding: "0.625rem 0.75rem",
                      borderRadius: "7px",
                      cursor: "pointer",
                      marginBottom: "0.25rem",
                      background: isActive ? "var(--accent-dim)" : "transparent",
                      border: "1px solid " + (isActive ? "var(--accent)" : "transparent"),
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: isActive ? 600 : 400,
                        fontSize: "0.85rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "var(--text)",
                      }}
                    >
                      {p.title}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.35rem" }}>
                      <StatusBadge status={p.status} />
                      {items.length > 0 && (
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{pct}%</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={mainStyle}>
          {!selected ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                gap: "1rem",
              }}
            >
              <p style={{ fontSize: "1rem" }}>Sélectionne ou crée un projet</p>
              <button className="genia-btn" onClick={createProject}>
                + Nouveau projet
              </button>
            </div>
          ) : (
            <div style={{ padding: "2rem", maxWidth: "860px", width: "100%" }}>
              {/* Project header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ flex: 1 }}>
                  <input
                    style={{
                      width: "100%",
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "var(--text)",
                      padding: 0,
                      marginBottom: "0.75rem",
                    }}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      debounceSave({ title: e.target.value });
                    }}
                    placeholder="Titre du projet"
                  />
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                    <select
                      className="genia-input"
                      style={{
                        background: "var(--surface)",
                        color: "var(--text)",
                        fontSize: "0.82rem",
                        padding: "0.3rem 0.6rem",
                        width: "auto",
                      }}
                      value={status}
                      onChange={(e) => {
                        setStatus(e.target.value);
                        saveProject({ status: e.target.value });
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Échéance :</span>
                      <input
                        type="date"
                        className="genia-input"
                        style={{
                          fontSize: "0.82rem",
                          padding: "0.3rem 0.6rem",
                          background: "var(--surface)",
                          color: "var(--text)",
                          width: "auto",
                        }}
                        value={dueDate}
                        onChange={(e) => {
                          setDueDate(e.target.value);
                          debounceSave({ dueDate: e.target.value });
                        }}
                      />
                    </div>
                    <button
                      style={{
                        marginLeft: "auto",
                        fontSize: "0.78rem",
                        padding: "0.3rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #ef4444",
                        background: "transparent",
                        color: "#ef4444",
                        cursor: "pointer",
                      }}
                      onClick={deleteProject}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  marginBottom: "1.5rem",
                }}
              >
                <ChecklistEditor
                  items={checklist}
                  onChange={(items) => {
                    setChecklist(items);
                    debounceSave({ checklist: JSON.stringify(items) });
                  }}
                />
              </div>

              {/* Script */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  marginBottom: "1.5rem",
                }}
              >
                <p
                  style={{
                    margin: "0 0 0.75rem 0",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Script / Voix off
                </p>
                <textarea
                  style={{
                    width: "100%",
                    minHeight: "220px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "7px",
                    padding: "0.875rem",
                    fontSize: "0.9rem",
                    lineHeight: 1.65,
                    color: "var(--text)",
                    resize: "vertical",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  placeholder="Écris le script ici... hook, voix off, CTA, etc."
                  value={script}
                  onChange={(e) => {
                    setScript(e.target.value);
                    debounceSave({ script: e.target.value });
                  }}
                />
              </div>

              {/* Notes */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  marginBottom: "2rem",
                }}
              >
                <p
                  style={{
                    margin: "0 0 0.75rem 0",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Notes & briefing
                </p>
                <textarea
                  style={{
                    width: "100%",
                    minHeight: "120px",
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "7px",
                    padding: "0.875rem",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    color: "var(--text)",
                    resize: "vertical",
                    fontFamily: "inherit",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  placeholder="Notes, références, lien Drive, détails du brief..."
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    debounceSave({ notes: e.target.value });
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
