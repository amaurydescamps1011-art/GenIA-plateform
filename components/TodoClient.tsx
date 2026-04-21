"use client";

import { CSSProperties, useEffect, useState, useCallback } from "react";

type Todo = { id: string; title: string; done: boolean; clientName: string; createdAt: string; };

export default function TodoClient({ user: _user }: { user: { id?: string; name?: string | null; email: string; role: string }; }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchTodos = useCallback(async () => {
    const res = await fetch("/api/todos");
    if (res.ok) setTodos(await res.json());
    setLoading(false);
  }, []);
  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  async function addTodo() {
    if (!newTitle.trim()) return;
    const res = await fetch("/api/todos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle.trim() }) });
    if (res.ok) { setNewTitle(""); setAdding(false); fetchTodos(); }
  }
  async function toggleDone(todo: Todo) {
    await fetch("/api/todos/" + todo.id, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !todo.done }) });
    fetchTodos();
  }
  async function deleteTodo(id: string) {
    await fetch("/api/todos/" + id, { method: "DELETE" });
    fetchTodos();
  }

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);
  const rowStyle: CSSProperties = { display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.875rem 1rem", borderBottom: "1px solid var(--border)" };

  if (loading) return <div style={{ padding: "2rem", color: "var(--text-muted)" }}>Chargement...</div>;
  return (
    <div style={{ padding: "1.5rem", maxWidth: "720px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0 }}>Taches</h1>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>{pending.length} en attente</p>
        </div>
        <button className="genia-btn" onClick={() => setAdding(true)}>+ Ajouter</button>
      </div>
      {adding && (
        <div style={{ marginBottom: "1.25rem", display: "flex", gap: "0.5rem" }}>
          <input className="genia-input" style={{ flex: 1 }} placeholder="Nouvelle tache..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTodo(); if (e.key === "Escape") setAdding(false); }} autoFocus />
          <button className="genia-btn" onClick={addTodo}>Ajouter</button>
          <button className="genia-btn-ghost" onClick={() => setAdding(false)}>Annuler</button>
        </div>
      )}
      {pending.length > 0 && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", marginBottom: "1.5rem" }}>
          {pending.map((todo) => (
            <div key={todo.id} style={rowStyle}>
              <button onClick={() => toggleDone(todo)} style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid var(--border)", background: "transparent", cursor: "pointer", flexShrink: 0, marginTop: "2px" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500 }}>{todo.title}</p>
                {todo.clientName && <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>Client : {todo.clientName}</p>}
              </div>
              <button onClick={() => deleteTodo(todo.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem", padding: "0 0.25rem" }}>&times;</button>
            </div>
          ))}
        </div>
      )}
      {pending.length === 0 && (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", marginBottom: "1.5rem" }}>
          Tout est a jour !
        </div>
      )}
      {done.length > 0 && (
        <div>
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Terminees ({done.length})</p>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden", opacity: 0.65 }}>
            {done.map((todo) => (
              <div key={todo.id} style={rowStyle}>
                <button onClick={() => toggleDone(todo)} style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #22c55e", background: "#22c55e", cursor: "pointer", flexShrink: 0, marginTop: "2px" }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 500, textDecoration: "line-through", color: "var(--text-muted)" }}>{todo.title}</p>
                  {todo.clientName && <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>Client : {todo.clientName}</p>}
                </div>
                <button onClick={() => deleteTodo(todo.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "1.1rem", padding: "0 0.25rem" }}>&times;</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
