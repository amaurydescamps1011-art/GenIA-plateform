"use client";

import { CSSProperties, useEffect, useState, useCallback } from "react";

type Client = {
  id: string;
  name: string;
  status: string;
  budget: number | null;
  email: string;
  phone: string;
  address: string;
  siret: string;
  notes: string;
  tags: string;
  contact: string;
  driveUrl: string;
  createdAt: string;
  updatedAt: string;
};

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: "prospect", label: "Prospect", color: "#eab308" },
  { key: "verbal", label: "Confirmation verbale", color: "#f97316" },
  { key: "acompte", label: "Acompte payé", color: "#22c55e" },
  { key: "en_cours", label: "En cours", color: "#6366f1" },
  { key: "termine", label: "Terminé", color: "#16a34a" },
  { key: "followup", label: "Follow-up", color: "#8b5cf6" },
  { key: "perdu", label: "Perdu", color: "#ef4444" },
];

type Toast = { id: number; message: string };

export default function CRMClient({
  user: _user,
}: {
  user: { id?: string; name?: string | null; email: string; role: string };
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selected, setSelected] = useState<Client | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [editForm, setEditForm] = useState<Partial<Client>>({});

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const fetchClients = useCallback(async () => {
    const res = await fetch("/api/crm");
    if (res.ok) {
      const data = await res.json();
      setClients(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  async function createClient(status: string, name: string) {
    if (!name.trim()) return;
    const res = await fetch("/api/crm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), status }),
    });
    if (res.ok) {
      await fetchClients();
      showToast("Client créé !");
    }
    setAddingTo(null);
    setNewName("");
  }

  async function updateClient(id: string, data: Partial<Client>) {
    const res = await fetch(`/api/crm/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchClients();
      showToast("Mis à jour !");
    }
  }

  async function deleteClient(id: string) {
    const res = await fetch(`/api/crm/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchClients();
      setModalOpen(false);
      setSelected(null);
      showToast("Client supprimé");
    }
  }

  function moveClient(client: Client, direction: "prev" | "next") {
    const idx = COLUMNS.findIndex((c) => c.key === client.status);
    const newIdx = direction === "next" ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= COLUMNS.length) return;
    updateClient(client.id, { status: COLUMNS[newIdx].key });
  }

  function openEdit(client: Client) {
    setSelected(client);
    setEditForm({ ...client });
    setModalOpen(true);
  }

  async function saveEdit() {
    if (!selected) return;
    await updateClient(selected.id, editForm);
    setModalOpen(false);
    setSelected(null);
  }

  const boardStyle: CSSProperties = {
    display: "flex",
    gap: "1rem",
    overflowX: "auto",
    padding: "1rem 0 1.5rem 0",
    minHeight: "calc(100vh - 180px)",
  };

  const colStyle: CSSProperties = {
    minWidth: "280px",
    maxWidth: "280px",
    display: "flex",
    flexDirection: "column",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    overflow: "hidden",
  };

  const cardStyle: CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "0.875rem",
    marginBottom: "0.5rem",
    cursor: "pointer",
    position: "relative",
    transition: "box-shadow 0.15s",
  };

  const overlayStyle: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  };

  const modalStyle: CSSProperties = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "1.5rem",
    width: "100%",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    gap: "0.875rem",
    maxHeight: "90vh",
    overflowY: "auto",
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", color: "var(--text-muted)" }}>
        Chargement...
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.25rem",
        }}
      >
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0 }}>CRM</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
            {clients.length} client{clients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          className="genia-btn"
          onClick={() => {
            setAddingTo("prospect");
            setNewName("");
          }}
        >
          + Nouveau client
        </button>
      </div>

      {/* Kanban Board */}
      <div style={boardStyle}>
        {COLUMNS.map((col, colIdx) => {
          const colClients = clients.filter((c) => c.status === col.key);
          return (
            <div key={col.key} style={colStyle}>
              {/* Column Header */}
              <div
                style={{
                  padding: "0.75rem 1rem",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: col.color + "18",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: col.color,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>
                    {col.label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      background: col.color + "30",
                      color: col.color,
                      borderRadius: "999px",
                      padding: "1px 7px",
                      fontWeight: 600,
                    }}
                  >
                    {colClients.length}
                  </span>
                </div>
                <button
                  className="genia-btn-ghost"
                  style={{
                    fontSize: "1.1rem",
                    padding: "0 0.25rem",
                    lineHeight: 1,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                  }}
                  title="Ajouter"
                  onClick={() => {
                    setAddingTo(col.key);
                    setNewName("");
                  }}
                >
                  +
                </button>
              </div>

              {/* Cards area */}
              <div style={{ padding: "0.75rem", flex: 1, overflowY: "auto", minHeight: "400px" }}>
                {addingTo === col.key && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <input
                      className="genia-input"
                      style={{ width: "100%", marginBottom: "0.5rem", fontSize: "0.85rem" }}
                      placeholder="Nom du client..."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") createClient(col.key, newName);
                        if (e.key === "Escape") setAddingTo(null);
                      }}
                      autoFocus
                    />
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="genia-btn"
                        style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}
                        onClick={() => createClient(col.key, newName)}
                      >
                        Ajouter
                      </button>
                      <button
                        className="genia-btn-ghost"
                        style={{ fontSize: "0.78rem", padding: "0.3rem 0.75rem" }}
                        onClick={() => setAddingTo(null)}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {colClients.map((client) => (
                  <div
                    key={client.id}
                    style={cardStyle}
                    onClick={() => openEdit(client)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {client.name}
                      </p>
                      {client.budget != null && (
                        <p
                          style={{
                            margin: "0.25rem 0 0 0",
                            fontSize: "0.75rem",
                            color: "#22c55e",
                            fontWeight: 600,
                          }}
                        >
                          {client.budget.toLocaleString("fr-FR")} €
                        </p>
                      )}
                      {client.email && (
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {client.email}
                        </p>
                      )}
                      {client.notes && (
                        <p
                          style={{
                            margin: "0.35rem 0 0 0",
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            lineHeight: 1.4,
                          }}
                        >
                          {client.notes.slice(0, 50)}
                          {client.notes.length > 50 ? "..." : ""}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.25rem",
                        marginTop: "0.5rem",
                        justifyContent: "flex-end",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {colIdx > 0 && (
                        <button
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid var(--border)",
                            background: "transparent",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                          }}
                          title="Reculer"
                          onClick={() => moveClient(client, "prev")}
                        >
                          ←
                        </button>
                      )}
                      {colIdx < COLUMNS.length - 1 && (
                        <button
                          style={{
                            fontSize: "0.7rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            border: "1px solid var(--border)",
                            background: "transparent",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                          }}
                          title="Avancer"
                          onClick={() => moveClient(client, "next")}
                        >
                          →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {modalOpen && selected && (
        <div style={overlayStyle} onClick={() => setModalOpen(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>
                Modifier le client
              </h2>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.25rem",
                  color: "var(--text-muted)",
                  lineHeight: 1,
                }}
                onClick={() => setModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>Nom</label>
              <input
                className="genia-input"
                value={editForm.name || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nom du client"
              />
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>Statut</label>
              <select
                className="genia-input"
                value={editForm.status || "prospect"}
                onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                style={{ background: "var(--surface)", color: "var(--text)" }}
              >
                {COLUMNS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>Budget (€)</label>
              <input
                className="genia-input"
                type="number"
                value={editForm.budget ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    budget: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                placeholder="ex: 5000"
              />
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>Contact</label>
              <input
                className="genia-input"
                value={editForm.contact || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, contact: e.target.value }))}
                placeholder="Nom du contact"
              />
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>Email de facturation</label>
              <input
                className="genia-input"
                type="email"
                value={editForm.email || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@client.com"
              />
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>Téléphone</label>
              <input
                className="genia-input"
                value={editForm.phone || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+33 6 00 00 00 00"
              />
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>Adresse de facturation</label>
              <textarea
                className="genia-input"
                value={editForm.address || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                placeholder={"12 rue de la Paix\n75001 Paris"}
                rows={3}
                style={{ resize: "vertical" }}
              />
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>SIRET</label>
              <input
                className="genia-input"
                value={editForm.siret || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, siret: e.target.value }))}
                placeholder="123 456 789 00012"
              />
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>Google Drive</label>
              <input
                className="genia-input"
                value={editForm.driveUrl || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, driveUrl: e.target.value }))}
                placeholder="https://drive.google.com/..."
              />
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)" }}>Notes</label>
              <textarea
                className="genia-input"
                value={editForm.notes || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Notes libres..."
                rows={4}
                style={{ resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button className="genia-btn" style={{ flex: 1 }} onClick={saveEdit}>
                Sauvegarder
              </button>
              <button
                className="genia-btn-ghost"
                style={{ flex: 1, color: "#ef4444", borderColor: "#ef4444" }}
                onClick={() => {
                  if (confirm("Supprimer ce client ?")) deleteClient(selected.id);
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 300,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "0.625rem 1rem",
              fontSize: "0.85rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              color: "var(--text)",
              fontWeight: 500,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
