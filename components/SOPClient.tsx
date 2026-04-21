"use client";
import { CSSProperties, useEffect, useState, useCallback, useRef } from "react";
type Module = { id: string; num: number; title: string; color: string; desc: string; steps: { id: string; text: string }[]; };
type VideoLink = { label: string; url: string; };
type ActiveStep = { stepId: string; text: string; moduleId: string; moduleTitle: string; moduleNum: number; color: string; };
type StepData = { content: string; videoUrl: string; };
const MODULES: Module[] = [
  { id:"metier",  num:1, title:"En quoi consiste le metier",  color:"#6366f1", desc:"Comprendre le role de Createur IA.",
    steps:[{id:"m1",text:"Comprendre la valeur de la video IA vs video traditionnelle"},{id:"m2",text:"Identifier les types de clients et leurs besoins"},{id:"m3",text:"Maitriser le positionnement et l offre"},{id:"m4",text:"Connaitre les outils IA du marche (Runway, Kling, Sora, Pika...)"},{id:"m5",text:"Comprendre le workflow complet de A a Z"}]},
  { id:"prompt",  num:2, title:"Prompt Engineering",            color:"#f97316", desc:"L art de formuler les bons prompts.",
    steps:[{id:"p1",text:"Structure d un prompt efficace (sujet, style, ambiance, camera)"},{id:"p2",text:"Techniques pour la coherence de personnage"},{id:"p3",text:"Prompts negatifs et parametres avances"},{id:"p4",text:"Bibliotheque de prompts types par style"},{id:"p5",text:"Iterer et affiner : comprendre les echecs"}]},
  { id:"preprod", num:3, title:"Pre-production",                color:"#eab308", desc:"Preparer le projet avant de generer.",
    steps:[{id:"pp1",text:"Faire le brief complet avec le client"},{id:"pp2",text:"Creer le storyboard scene par scene"},{id:"pp3",text:"Definir la charte graphique et la palette"},{id:"pp4",text:"Selectionner les references visuelles"},{id:"pp5",text:"Planifier le budget de generation"}]},
  { id:"gen",     num:4, title:"Generations",                   color:"#22c55e", desc:"Generer les plans IA.",
    steps:[{id:"g1",text:"Choisir le bon modele selon le style"},{id:"g2",text:"Generer les plans dans l ordre du storyboard"},{id:"g3",text:"Conserver la coherence visuelle"},{id:"g4",text:"Quality check : flous, artefacts, visages"},{id:"g5",text:"Upscale des plans retenus"}]},
  { id:"montage", num:5, title:"Montage",                       color:"#8b5cf6", desc:"Assembler et livrer la video finale.",
    steps:[{id:"mo1",text:"Importer et organiser les plans"},{id:"mo2",text:"Couper et assembler dans l ordre"},{id:"mo3",text:"Ajouter la bande sonore et synchroniser"},{id:"mo4",text:"Effets, transitions et etalonnage couleur"},{id:"mo5",text:"Export final et livraison client"}]},
];
const LEVELS=[{min:0,label:"Debutant",color:"#94a3b8"},{min:3,label:"Actif",color:"#22c55e"},{min:8,label:"Productif",color:"#3b82f6"},{min:20,label:"Expert",color:"#8b5cf6"},{min:40,label:"Elite",color:"#f97316"},{min:70,label:"Legende",color:"#eab308"}];
function getLevel(n:number){let l=LEVELS[0];for(const x of LEVELS){if(n>=x.min)l=x;}return l;}
function getNextLevel(n:number){for(const x of LEVELS){if(n<x.min)return x;}return null;}
function DonutChart({done,total}:{done:number;total:number}){
  const r=44,circ=2*Math.PI*r,pct=total===0?0:done/total;
  return(<svg width="110" height="110" viewBox="0 0 110 110">
    <circle cx="55" cy="55" r={r} fill="none" stroke="var(--border)" strokeWidth="10"/>
    <circle cx="55" cy="55" r={r} fill="none" stroke="#22c55e" strokeWidth="10"
      strokeDasharray={String(pct*circ)+" "+String(circ)} strokeLinecap="round"
      transform="rotate(-90 55 55)" style={{transition:"stroke-dasharray 0.6s ease"}}/>
    <text x="55" y="51" textAnchor="middle" fill="var(--text)" fontSize="20" fontWeight="700">{done}</text>
    <text x="55" y="67" textAnchor="middle" fill="var(--text-muted)" fontSize="11">/ {total}</text>
  </svg>);
}
function StepDetail({step,onBack,onToggle,checked}:{step:ActiveStep;onBack:()=>void;onToggle:(id:string)=>void;checked:Record<string,boolean>}){
  const [data,setData]=useState<StepData>({content:"",videoUrl:""});
  const [saveStatus,setSaveStatus]=useState("");
  const [uploading,setUploading]=useState(false);
  const saveTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const fileRef=useRef<HTMLInputElement>(null);
  const isDone=!!checked[step.stepId];

  useEffect(()=>{
    fetch("/api/sop/step/"+step.stepId).then(r=>r.ok?r.json():{content:"",videoUrl:""}).then(d=>setData(d)).catch(()=>{});
  },[step.stepId]);

  function saveField(field:"content"|"videoUrl",value:string){
    setData(prev=>({...prev,[field]:value}));
    setSaveStatus("...");
    if(saveTimer.current)clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(async()=>{
      await fetch("/api/sop/step/"+step.stepId,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({moduleId:step.moduleId,[field]:value})});
      setSaveStatus("Sauvegarde");
      setTimeout(()=>setSaveStatus(""),2000);
    },800);
  }

  async function handleVideoUpload(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];
    if(!file)return;
    setUploading(true);
    const fd=new FormData();
    fd.append("file",file);
    const res=await fetch("/api/sop/step/"+step.stepId+"/upload",{method:"POST",body:fd});
    if(res.ok){
      const {url}=await res.json();
      setData(prev=>({...prev,videoUrl:url}));
      await fetch("/api/sop/step/"+step.stepId,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({moduleId:step.moduleId,videoUrl:url})});
    }
    setUploading(false);
  }

  return(
    <div style={{position:"fixed",left:"220px",top:0,right:0,bottom:0,background:"var(--bg)",zIndex:100,overflowY:"auto",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"1.25rem 2rem",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:"1rem",background:"var(--surface)",position:"sticky",top:0,zIndex:10}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:"0.375rem",background:"transparent",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"0.875rem",padding:"0.375rem 0.625rem",borderRadius:"6px"}}>
          &larr; Retour
        </button>
        <span style={{color:"var(--border)"}}>|</span>
        <span style={{fontSize:"0.78rem",color:step.color,fontWeight:700}}>Module {step.moduleNum} &rsaquo; {step.moduleTitle}</span>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"0.75rem"}}>
          {saveStatus&&<span style={{fontSize:"0.72rem",color:"var(--text-muted)"}}>{saveStatus}</span>}
          <button onClick={()=>onToggle(step.stepId)} style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.375rem 0.875rem",borderRadius:"6px",border:"1px solid "+(isDone?step.color:"var(--border)"),background:isDone?(step.color+"20"):"transparent",color:isDone?step.color:"var(--text-muted)",fontSize:"0.8rem",fontWeight:600,cursor:"pointer"}}>
            {isDone?"Completee":"Marquer comme fait"}
          </button>
        </div>
      </div>
      <div style={{padding:"2rem",maxWidth:"860px",width:"100%",margin:"0 auto",flex:1,display:"flex",flexDirection:"column",gap:"1.5rem"}}>
        <div>
          <h1 style={{fontSize:"1.375rem",fontWeight:700,margin:"0 0 0.25rem 0"}}>{step.text}</h1>
          <p style={{fontSize:"0.82rem",color:"var(--text-muted)",margin:0}}>Etape de formation &mdash; {step.moduleTitle}</p>
        </div>
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"12px",overflow:"hidden"}}>
          <div style={{padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <span style={{fontSize:"0.85rem",fontWeight:600}}>Video</span>
            {data.videoUrl&&<button onClick={()=>saveField("videoUrl","")} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"0.78rem"}}>Supprimer la video</button>}
          </div>
          {!data.videoUrl?(
            <div style={{padding:"3rem 2rem",display:"flex",flexDirection:"column",alignItems:"center",gap:"1rem",cursor:"pointer"}} onClick={()=>fileRef.current?.click()}>
              <div style={{width:"56px",height:"56px",borderRadius:"50%",background:step.color+"20",border:"2px dashed "+step.color,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={step.color} strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div style={{textAlign:"center"}}>
                <p style={{fontWeight:600,margin:"0 0 0.25rem 0",fontSize:"0.9rem"}}>{uploading?"Upload en cours...":"Cliquer pour uploader une video"}</p>
                <p style={{color:"var(--text-muted)",fontSize:"0.78rem",margin:0}}>MP4, MOV, WebM &mdash; max 500 Mo</p>
              </div>
              <input ref={fileRef} type="file" accept="video/*" style={{display:"none"}} onChange={handleVideoUpload}/>
            </div>
          ):(
            <div style={{padding:"1rem"}}>
              <video src={data.videoUrl} controls style={{width:"100%",borderRadius:"8px",maxHeight:"480px",background:"#000"}}/>
            </div>
          )}
        </div>
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"12px",overflow:"hidden",flex:1,display:"flex",flexDirection:"column"}}>
          <div style={{padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)"}}>
            <span style={{fontSize:"0.85rem",fontWeight:600}}>Notes de l etape</span>
          </div>
          <textarea
            style={{flex:1,minHeight:"320px",background:"transparent",border:"none",padding:"1.25rem",fontSize:"0.9rem",color:"var(--text)",lineHeight:1.7,resize:"vertical",fontFamily:"inherit",outline:"none"}}
            placeholder="Ecris tes notes, explications, exemples pour cette etape...
Sauvegarde automatique."
            value={data.content}
            onChange={e=>saveField("content",e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
export default function SOPClient(){
  const [activeId,setActiveId]=useState("metier");
  const [activeTab,setActiveTab]=useState<"etapes"|"contenu">("etapes");
  const [checked,setChecked]=useState<Record<string,boolean>>({});
  const [videoInputs,setVideoInputs]=useState<Record<string,string>>({});
  const [videos,setVideos]=useState<Record<string,VideoLink[]>>(Object.fromEntries(MODULES.map(m=>[m.id,[]])));
  const [contents,setContents]=useState<Record<string,string>>({});
  const [saveStatus,setSaveStatus]=useState<Record<string,string>>({});
  const [activeStep,setActiveStep]=useState<ActiveStep|null>(null);
  const saveTimer=useRef<Record<string,ReturnType<typeof setTimeout>>>({});

  useEffect(()=>{
    fetch("/api/sop").then(r=>r.ok?r.json():{}).then(d=>setContents(d||{})).catch(()=>{});
  },[]);

  function handleContentChange(modId:string,value:string){
    setContents(prev=>({...prev,[modId]:value}));
    setSaveStatus(prev=>({...prev,[modId]:"..."}));
    if(saveTimer.current[modId])clearTimeout(saveTimer.current[modId]);
    saveTimer.current[modId]=setTimeout(async()=>{
      await fetch("/api/sop/"+modId,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:value})});
      setSaveStatus(prev=>({...prev,[modId]:"Sauvegarde"}));
      setTimeout(()=>setSaveStatus(prev=>({...prev,[modId]:""})),2000);
    },800);
  }

  function toggle(stepId:string){setChecked(prev=>({...prev,[stepId]:!prev[stepId]}));}

  function openStep(m:Module,step:{id:string;text:string}){
    setActiveStep({stepId:step.id,text:step.text,moduleId:m.id,moduleTitle:m.title,moduleNum:m.num,color:m.color});
  }

  function addVideo(modId:string){
    const url=(videoInputs[modId]||"").trim();
    if(!url)return;
    let embedUrl=url;
    try{const u=new URL(url);if(u.hostname.includes("youtu.be"))embedUrl="https://www.youtube.com/embed/"+u.pathname.slice(1).split("?")[0];else if(u.searchParams.get("v"))embedUrl="https://www.youtube.com/embed/"+u.searchParams.get("v");}catch{}
    setVideos(prev=>({...prev,[modId]:[...(prev[modId]||[]),{label:"Video "+((prev[modId]||[]).length+1),url:embedUrl}]}));
    setVideoInputs(prev=>({...prev,[modId]:""}));
  }

  const mod=MODULES.find(m=>m.id===activeId)!;
  const modVideos=videos[activeId]||[];
  const modChecked=mod.steps.filter(s=>checked[s.id]).length;
  const modPct=Math.round((modChecked/mod.steps.length)*100);
  const totalSteps=MODULES.reduce((acc,m)=>acc+m.steps.length,0);
  const totalDone=Object.values(checked).filter(Boolean).length;
  const globalPct=Math.round((totalDone/totalSteps)*100);
  const level=getLevel(totalDone),nextLevel=getNextLevel(totalDone);
  const xpPct=nextLevel?Math.min(100,Math.round(((totalDone-level.min)/(nextLevel.min-level.min))*100)):100;
  const tabBtn=(active:boolean,color:string):CSSProperties=>({padding:"0.35rem 0.875rem",fontSize:"0.78rem",fontWeight:active?600:400,borderRadius:"6px",border:"none",cursor:"pointer",background:active?(color+"20"):"transparent",color:active?color:"var(--text-muted)",transition:"all 0.15s"});
  void xpPct;
  return(
    <div style={{padding:"1.5rem",maxWidth:"1000px"}}>
      {activeStep&&<StepDetail step={activeStep} onBack={()=>setActiveStep(null)} onToggle={toggle} checked={checked}/>}
      <div style={{marginBottom:"1.5rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:"0.75rem",marginBottom:"0.75rem"}}>
          <h1 style={{fontSize:"1.375rem",fontWeight:700,margin:0}}>SOP</h1>
          <span style={{background:"#6366f115",color:"#6366f1",border:"1px solid #6366f160",borderRadius:"999px",padding:"2px 10px",fontSize:"0.72rem",fontWeight:700}}>CREATEUR IA</span>
          <span style={{background:level.color+"20",color:level.color,border:"1px solid "+level.color+"60",borderRadius:"999px",padding:"2px 10px",fontSize:"0.72rem",fontWeight:700,marginLeft:"auto"}}>{level.label.toUpperCase()}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
          <div style={{flex:1,height:"6px",background:"var(--border)",borderRadius:"999px",overflow:"hidden"}}><div style={{height:"100%",width:globalPct+"%",background:"linear-gradient(90deg,#6366f1,#8b5cf6)",borderRadius:"999px",transition:"width 0.4s"}}/></div>
          <span style={{fontSize:"0.78rem",color:"var(--text-muted)",whiteSpace:"nowrap"}}>{totalDone}/{totalSteps} etapes · {globalPct}%</span>
        </div>
      </div>
      <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",marginBottom:"1.5rem"}}>
        {MODULES.map(m=>{const d=m.steps.filter(s=>checked[s.id]).length,p=Math.round((d/m.steps.length)*100),active=activeId===m.id;return(
          <button key={m.id} onClick={()=>{setActiveId(m.id);setActiveTab("etapes");}} style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.625rem 0.875rem",borderRadius:"8px",cursor:"pointer",border:"1px solid "+(active?m.color:"var(--border)"),background:active?(m.color+"15"):"transparent",color:active?m.color:"var(--text-muted)",fontWeight:active?600:400,fontSize:"0.82rem",transition:"all 0.15s",whiteSpace:"nowrap"}}>
            <span style={{width:"18px",height:"18px",borderRadius:"50%",background:active?m.color:"var(--border)",color:active?"#fff":"var(--text-muted)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"0.65rem",fontWeight:700}}>{m.num}</span>
            {m.title}{p>0&&<span style={{fontSize:"0.65rem",fontWeight:700,opacity:0.8}}>{p}%</span>}
          </button>
        );})}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.25rem"}}>
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"12px",overflow:"hidden",display:"flex",flexDirection:"column"}}>
          <div style={{padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)",background:mod.color+"10",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div><p style={{fontSize:"0.72rem",color:mod.color,fontWeight:700,textTransform:"uppercase",margin:0}}>Module {mod.num}</p><h2 style={{fontSize:"1rem",fontWeight:700,margin:"0.125rem 0 0 0"}}>{mod.title}</h2></div>
            <p style={{fontSize:"1.5rem",fontWeight:700,color:mod.color,margin:0}}>{modPct}%</p>
          </div>
          <div style={{padding:"0.5rem 1rem",borderBottom:"1px solid var(--border)",display:"flex",gap:"0.25rem"}}>
            <button onClick={()=>setActiveTab("etapes")} style={tabBtn(activeTab==="etapes",mod.color)}>Etapes</button>
            <button onClick={()=>setActiveTab("contenu")} style={tabBtn(activeTab==="contenu",mod.color)}>Notes du module</button>
          </div>
          {activeTab==="etapes"&&(
            <>
              <div style={{height:"4px",background:"var(--border)"}}><div style={{height:"100%",width:modPct+"%",background:mod.color,transition:"width 0.4s"}}/></div>
              {mod.steps.map((step,i)=>{const done=!!checked[step.id];return(
                <div key={step.id} style={{display:"flex",alignItems:"center",padding:"0 1.25rem",borderBottom:"1px solid var(--border)",background:done?(mod.color+"08"):"transparent",gap:"0.75rem"}}>
                  <div onClick={()=>toggle(step.id)} style={{width:"20px",height:"20px",borderRadius:"50%",border:"2px solid "+(done?mod.color:"var(--border)"),background:done?mod.color:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",margin:"0.875rem 0",transition:"all 0.2s"}}>
                    {done&&<svg width="10" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
                  </div>
                  <div style={{flex:1,padding:"0.875rem 0",cursor:"pointer",minWidth:0}} onClick={()=>openStep(mod,step)}>
                    <span style={{fontSize:"0.72rem",color:mod.color,fontWeight:600,marginRight:"0.5rem"}}>0{i+1}</span>
                    <span style={{fontSize:"0.875rem",textDecoration:done?"line-through":"none",color:done?"var(--text-muted)":"var(--text)"}}>{step.text}</span>
                  </div>
                  <span style={{color:"var(--text-muted)",cursor:"pointer",fontSize:"1.2rem",opacity:0.4,paddingRight:"0.25rem"}} onClick={()=>openStep(mod,step)}>&rsaquo;</span>
                </div>
              );})}
            </>
          )}
          {activeTab==="contenu"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",padding:"1rem 1.25rem",gap:"0.5rem"}}>
              {saveStatus[activeId]&&<span style={{fontSize:"0.72rem",color:"var(--text-muted)",textAlign:"right"}}>{saveStatus[activeId]}</span>}
              <textarea style={{flex:1,minHeight:"380px",background:"var(--bg)",border:"1px solid var(--border)",borderRadius:"8px",padding:"0.875rem",fontSize:"0.875rem",color:"var(--text)",lineHeight:1.7,resize:"vertical",fontFamily:"inherit",outline:"none"}} placeholder="Notes generales du module..." value={contents[activeId]||""} onChange={e=>handleContentChange(activeId,e.target.value)}/>
            </div>
          )}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"12px",overflow:"hidden"}}>
            <div style={{padding:"0.875rem 1.25rem",borderBottom:"1px solid var(--border)",display:"flex",gap:"0.5rem",alignItems:"center"}}><span style={{fontSize:"0.8rem",fontWeight:600}}>Videos du module</span><span style={{fontSize:"0.7rem",color:"var(--text-muted)"}}>({modVideos.length})</span></div>
            <div style={{padding:"1rem"}}>
              <div style={{display:"flex",gap:"0.5rem",marginBottom:"0.75rem"}}><input className="genia-input" style={{flex:1,fontSize:"0.82rem"}} placeholder="Lien YouTube..." value={videoInputs[activeId]||""} onChange={e=>setVideoInputs(prev=>({...prev,[activeId]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")addVideo(activeId);}}/><button className="genia-btn" style={{fontSize:"0.8rem",padding:"0 0.875rem"}} onClick={()=>addVideo(activeId)}>+</button></div>
              {modVideos.length===0&&<div style={{padding:"1rem",textAlign:"center",color:"var(--text-muted)",fontSize:"0.82rem",background:"var(--bg)",borderRadius:"8px",border:"1px dashed var(--border)"}}>Aucune video</div>}
              {modVideos.map((v,i)=>(<div key={i} style={{marginBottom:"0.75rem"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:"0.375rem"}}><span style={{fontSize:"0.78rem",fontWeight:600,color:"var(--text-muted)"}}>{v.label}</span><button onClick={()=>setVideos(prev=>({...prev,[activeId]:prev[activeId].filter((_,j)=>j!==i)}))} style={{background:"transparent",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"1rem"}}>&times;</button></div><iframe src={v.url} style={{width:"100%",height:"155px",borderRadius:"8px",border:"1px solid var(--border)"}} allowFullScreen/></div>))}
            </div>
          </div>
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"12px",padding:"1rem 1.25rem"}}>
            <p style={{fontSize:"0.8rem",fontWeight:600,marginBottom:"0.75rem"}}>Progression globale</p>
            {MODULES.map(m=>{const d=m.steps.filter(s=>checked[s.id]).length,p=Math.round((d/m.steps.length)*100);return(<div key={m.id} style={{marginBottom:"0.625rem"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:"0.72rem",color:"var(--text-muted)",marginBottom:"3px"}}><span>{m.title}</span><span style={{color:m.color,fontWeight:600}}>{p}%</span></div><div style={{height:"5px",background:"var(--border)",borderRadius:"999px",overflow:"hidden"}}><div style={{height:"100%",width:p+"%",background:m.color,borderRadius:"999px",transition:"width 0.4s"}}/></div></div>);})}
          </div>
        </div>
      </div>
    </div>
  );
}
