"use client";
import { CSSProperties, useEffect, useState, useCallback } from "react";
type Todo = { id: string; title: string; done: boolean; clientName: string; createdAt: string; };
const LEVELS = [
  { min: 0,  label: "Debutant",  color: "#94a3b8" },
  { min: 3,  label: "Actif",     color: "#22c55e" },
  { min: 8,  label: "Productif", color: "#3b82f6" },
  { min: 20, label: "Expert",    color: "#8b5cf6" },
  { min: 40, label: "Elite",     color: "#f97316" },
  { min: 70, label: "Legende",   color: "#eab308" },
];
const BADGES = [
  { label: "Premier pas", threshold: 1,  desc: "1 tache"  },
  { label: "En marche",   threshold: 5,  desc: "5 taches"  },
  { label: "En feu",      threshold: 10, desc: "10 taches" },
  { label: "Machine",     threshold: 25, desc: "25 taches" },
  { label: "Legende",     threshold: 50, desc: "50 taches" },
];
function getLevel(n:number){let l=LEVELS[0];for(const x of LEVELS){if(n>=x.min)l=x;}return l;}
function getNextLevel(n:number){for(const x of LEVELS){if(n<x.min)return x;}return null;}
function DonutChart({done,total}:{done:number;total:number}){
  const r=44,circ=2*Math.PI*r,pct=total===0?0:done/total;
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke="var(--border)" strokeWidth="10"/>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#22c55e" strokeWidth="10"
        strokeDasharray={String(pct*circ)+" "+String(circ)}
        strokeLinecap="round" transform="rotate(-90 55 55)"
        style={{transition:"stroke-dasharray 0.6s ease"}}/>
      <text x="55" y="51" textAnchor="middle" fill="var(--text)" fontSize="20" fontWeight="700">{done}</text>
      <text x="55" y="67" textAnchor="middle" fill="var(--text-muted)" fontSize="11">/ {total}</text>
    </svg>
  );
}
export default function TodoClient({user:_user}:{user:{id?:string;name?:string|null;email:string;role:string};}){
  const [todos,setTodos]=useState<Todo[]>([]);
  const [loading,setLoading]=useState(true);
  const [newTitle,setNewTitle]=useState("");
  const [adding,setAdding]=useState(false);
  const [flash,setFlash]=useState<string|null>(null);
  const fetchTodos=useCallback(async()=>{const res=await fetch("/api/todos");if(res.ok)setTodos(await res.json());setLoading(false);},[]);
  useEffect(()=>{fetchTodos();},[fetchTodos]);
  async function addTodo(){
    if(!newTitle.trim())return;
    const res=await fetch("/api/todos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:newTitle.trim()})});
    if(res.ok){setNewTitle("");setAdding(false);fetchTodos();}
  }
  async function toggleDone(todo:Todo){
    if(!todo.done){setFlash(todo.id);setTimeout(()=>setFlash(null),700);}
    await fetch("/api/todos/"+todo.id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({done:!todo.done})});
    fetchTodos();
  }
  async function deleteTodo(id:string){await fetch("/api/todos/"+id,{method:"DELETE"});fetchTodos();}
  const pending=todos.filter(t=>!t.done);
  const done=todos.filter(t=>t.done);
  const doneCount=done.length,total=todos.length;
  const level=getLevel(doneCount),nextLevel=getNextLevel(doneCount);
  const xpInLevel=doneCount-level.min,xpNeeded=nextLevel?nextLevel.min-level.min:1;
  const xpPct=Math.min(100,Math.round((xpInLevel/xpNeeded)*100));
  const pctDone=total===0?0:Math.round((doneCount/total)*100);
  const rowStyle:CSSProperties={display:"flex",alignItems:"flex-start",gap:"0.75rem",padding:"0.875rem 1rem",borderBottom:"1px solid var(--border)"};
  if(loading)return <div style={{padding:"2rem",color:"var(--text-muted)"}}>Chargement...</div>;
  return (
    <div style={{padding:"1.5rem",maxWidth:"760px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
        <div>
          <h1 style={{fontSize:"1.375rem",fontWeight:700,margin:0}}>Taches</h1>
          <p style={{fontSize:"0.85rem",color:"var(--text-muted)",margin:"0.25rem 0 0 0"}}>{pending.length} en attente</p>
        </div>
        <button className="genia-btn" onClick={()=>setAdding(true)}>+ Ajouter</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"1.25rem",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"12px",padding:"1.25rem",marginBottom:"1.25rem"}}>
        <DonutChart done={doneCount} total={total}/>
        <div style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:"0.625rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.625rem"}}>
            <span style={{background:level.color+"25",color:level.color,border:"1px solid "+level.color+"60",borderRadius:"999px",padding:"2px 10px",fontSize:"0.75rem",fontWeight:700,letterSpacing:"0.05em"}}>{level.label.toUpperCase()}</span>
            <span style={{fontSize:"0.8rem",color:"var(--text-muted)"}}>{doneCount} taches completees</span>
          </div>
          {nextLevel&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:"0.72rem",color:"var(--text-muted)",marginBottom:"4px"}}>
                <span>Vers {nextLevel.label}</span><span>{xpInLevel} / {xpNeeded}</span>
              </div>
              <div style={{height:"8px",background:"var(--border)",borderRadius:"999px",overflow:"hidden"}}>
                <div style={{height:"100%",width:xpPct+"%",background:"linear-gradient(90deg,"+level.color+","+(nextLevel?.color||level.color)+")",borderRadius:"999px",transition:"width 0.5s ease"}}/>
              </div>
            </div>
          )}
          {!nextLevel&&<p style={{fontSize:"0.8rem",color:"#eab308",fontWeight:600}}>Niveau maximum atteint !</p>}
          <div style={{display:"flex",gap:"0.5rem",fontSize:"0.78rem",color:"var(--text-muted)"}}>
            <span style={{color:"#22c55e",fontWeight:600}}>{doneCount} faites</span>
            <span>·</span><span>{pending.length} restantes</span>
            {total>0&&<><span>·</span><span style={{fontWeight:600}}>{pctDone}%</span></>}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:"0.625rem",flexWrap:"wrap",marginBottom:"1.5rem"}}>
        {BADGES.map((b)=>{
          const unlocked=doneCount>=b.threshold;
          return(
            <div key={b.label} title={b.desc} style={{display:"flex",alignItems:"center",gap:"0.375rem",padding:"0.375rem 0.75rem",borderRadius:"999px",border:"1px solid "+(unlocked?"#eab308":"var(--border)"),background:unlocked?"#eab30815":"transparent",opacity:unlocked?1:0.35,transition:"all 0.3s",cursor:"default"}}>
              <span style={{fontSize:"0.75rem",fontWeight:700,color:unlocked?"#eab308":"var(--text-muted)"}}>{b.label}</span>
              {!unlocked&&<span style={{fontSize:"0.65rem",color:"var(--text-muted)"}}>({b.threshold})</span>}
            </div>
          );
        })}
      </div>
      {adding&&(
        <div style={{marginBottom:"1.25rem",display:"flex",gap:"0.5rem"}}>
          <input className="genia-input" style={{flex:1}} placeholder="Nouvelle tache..." value={newTitle} onChange={e=>setNewTitle(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addTodo();if(e.key==="Escape")setAdding(false);}} autoFocus/>
          <button className="genia-btn" onClick={addTodo}>Ajouter</button>
          <button className="genia-btn-ghost" onClick={()=>setAdding(false)}>Annuler</button>
        </div>
      )}
      {pending.length>0?(
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"10px",overflow:"hidden",marginBottom:"1.5rem"}}>
          {pending.map(todo=>(
            <div key={todo.id} style={{...rowStyle,background:flash===todo.id?"#22c55e18":"transparent",transition:"background 0.3s"}}>
              <button onClick={()=>toggleDone(todo)} style={{width:"20px",height:"20px",borderRadius:"50%",border:"2px solid var(--border)",background:"transparent",cursor:"pointer",flexShrink:0,marginTop:"2px"}}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{margin:0,fontSize:"0.9rem",fontWeight:500}}>{todo.title}</p>
                {todo.clientName&&<p style={{margin:"0.2rem 0 0 0",fontSize:"0.75rem",color:"var(--text-muted)"}}>Client : {todo.clientName}</p>}
              </div>
              <button onClick={()=>deleteTodo(todo.id)} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"1.1rem",padding:"0 0.25rem"}}>&times;</button>
            </div>
          ))}
        </div>
      ):(
        <div style={{padding:"2rem",textAlign:"center",color:"var(--text-muted)",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"10px",marginBottom:"1.5rem"}}>
          Tout est a jour !
        </div>
      )}
      {done.length>0&&(
        <div>
          <p style={{fontSize:"0.8rem",fontWeight:600,color:"var(--text-muted)",marginBottom:"0.5rem",textTransform:"uppercase",letterSpacing:"0.05em"}}>Completees ({done.length})</p>
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"10px",overflow:"hidden",opacity:0.6}}>
            {done.map(todo=>(
              <div key={todo.id} style={rowStyle}>
                <button onClick={()=>toggleDone(todo)} style={{width:"20px",height:"20px",borderRadius:"50%",border:"2px solid #22c55e",background:"#22c55e",cursor:"pointer",flexShrink:0,marginTop:"2px"}}/>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{margin:0,fontSize:"0.9rem",fontWeight:500,textDecoration:"line-through",color:"var(--text-muted)"}}>{todo.title}</p>
                  {todo.clientName&&<p style={{margin:"0.2rem 0 0 0",fontSize:"0.75rem",color:"var(--text-muted)"}}>Client : {todo.clientName}</p>}
                </div>
                <button onClick={()=>deleteTodo(todo.id)} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"1.1rem",padding:"0 0.25rem"}}>&times;</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
