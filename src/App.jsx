import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ReferenceLine } from "recharts";
import { DT, xi, td, CL, GO, MS, ACTS, AI, GR, TTS, ld, sv, pRpe, rpeStr, rpeAvg, rpeMax, calcFL, calcBanister, tendonAlert, calcReadiness, parseRow, lastMVC, targetLoad, interSetLoss, backupStatus, markBackup, calcCFW } from "./lib.js";
import { CSS } from "./styles.js";

const MINFO={
  CTL:{t:'CTL — Fitness crónico',d:'Carga media ponderada de 42 días. Tu base de forma. Sube entrenando, baja al parar. En escalada: 100-300 típico.'},
  ATL:{t:'ATL — Fatiga aguda',d:'Carga media ponderada de 7 días. La fatiga que sientes ahora. Sube rápido, baja en 2-3 días de descanso.'},
  TSB:{t:'TSB — Forma',d:'CTL − ATL. Positivo = fresco. Para roca: 0 a +30. Entreno productivo: −15 a 0. Muy negativo = sobreentrenamiento.'},
  ACWR:{t:'ACWR — Ratio (EWMA)',d:'Ratio carga aguda/crónica con media exponencial (Williams 2024, más preciso que media simple). Zona 0.8-1.3. >1.5 riesgo.'},
  Readiness:{t:'Readiness',d:'0-100: Forma/TSB (40%), Sueño+Bienestar (25%), Tendencia Tindeq (20%), Fatiga (15%).'},
  Tendon:{t:'Ventana tendinosa',d:'Tras suspensiones, el colágeno necesita 72-96h para recuperarse (Breda 2024). Cargar el tendón antes reduce rendimiento y aumenta riesgo.'},
  CFW:{t:'CF y W prima',d:'CF = fuerza sostenible (test 7s:3s, 4min, Giles/Balas). W prima = reservorio anaerobico por encima de CF. Tu crux agota ese reservorio.'},
  ForceLoss:{t:'Pérdida de fuerza',d:'Caída % entre series o pre/post sesión. <15% ligera, 15-25% moderada, 25-35% alta, >35% excesiva.'}
};
function InfoBtn({id}){const[o,sO]=useState(false);const m=MINFO[id];if(!m)return null;
  return(<><button className="info-btn" onClick={e=>{e.stopPropagation();sO(true)}}>ⓘ</button>
    {o&&<div className="m-overlay" onClick={()=>sO(false)}><div className="info-modal" onClick={e=>e.stopPropagation()}>
      <div className="info-t">{m.t}</div><div className="info-d">{m.d}</div>
      <button className="btn-primary btn-full" style={{marginTop:0}} onClick={()=>sO(false)}>OK</button>
    </div></div>}</>);
}
function Combo({label,value,onChange,options}){
  const[open,setOpen]=useState(false);const[flt,setFlt]=useState('');const ref=useRef(null);
  const list=options.filter(o=>o&&o.toLowerCase().includes(flt.toLowerCase()));
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[]);
  return(<div ref={ref} className="cb-wrap">{label&&<label className="f-label">{label}</label>}
    <input className="f-input" value={value||''} placeholder="Escribe o selecciona..." onChange={e=>{onChange(e.target.value);setFlt(e.target.value);setOpen(true)}} onFocus={()=>{setOpen(true);setFlt('')}}/>
    {open&&list.length>0&&<div className="cb-drop">{list.slice(0,8).map((o,i)=><div key={i} className="cb-item" onMouseDown={()=>{onChange(o);setOpen(false)}}>{o}</div>)}</div>}
  </div>);
}
function F({label,value,onChange,type='text',step,min,max,options}){
  if(options)return(<div className="f-wrap"><label className="f-label">{label}</label><select className="f-input" value={value||''} onChange={e=>onChange(e.target.value)}><option value="">—</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></div>);
  return(<div className="f-wrap"><label className="f-label">{label}</label><input className="f-input" type={type} value={value??''} step={step} min={min} max={max} onChange={e=>onChange(type==='number'?(e.target.value===''?'':Number(e.target.value)):e.target.value)}/></div>);
}
function Modal({open,onClose,title,children}){if(!open)return null;return(<div className="m-overlay" onClick={onClose}><div className="m-box" onClick={e=>e.stopPropagation()}><div className="m-head"><h3 className="m-title">{title}</h3><button onClick={onClose} className="m-close">✕</button></div><div className="m-body">{children}</div></div></div>)}
function Fab({onClick}){return<button className="fab" onClick={onClick}>＋</button>}
function DelBtn({onDel,label='este registro'}){return<button className="btn-del btn-full" onClick={()=>{if(window.confirm(`¿Eliminar ${label}?`))onDel()}}>🗑 Eliminar</button>}

/* ───────── MAIN APP ───────── */
export default function App(){
  const[page,setPage]=useState('dash');const[loading,setLoading]=useState(true);
  const[cal,setCal]=useState([]);const[ent,setEnt]=useState([]);const[roca,setRoca]=useState([]);
  const[lib,setLib]=useState([]);const[t25,setT25]=useState([]);const[treg,setTreg]=useState([]);
  const[dp,setDp]=useState([]);const[tests,setTests]=useState([DT]);const[susp,setSusp]=useState([]);const[cfw,setCfw]=useState([]);
  const[init,setInit]=useState(false);const[menuOpen,setMenuOpen]=useState(false);const[bkp,setBkp]=useState({days:null,overdue:false});

  useEffect(()=>{(async()=>{try{const i=await ld('ct5_init',false);if(i){const[a,b,c,d,e,f,g,h,s,w]=await Promise.all([ld('ct5_cal'),ld('ct5_ent'),ld('ct5_roca'),ld('ct5_lib'),ld('ct5_t25'),ld('ct5_treg'),ld('ct5_dp'),ld('ct5_tests',[DT]),ld('ct5_susp'),ld('ct5_cfw')]);setCal(a);setEnt(b);setRoca(c);setLib(d);setT25(e);setTreg(f);setDp(g);setTests(h);setSusp(s);setCfw(w);setInit(true);setBkp(await backupStatus())}}catch(e){console.error(e)}setLoading(false)})()},[]);
  const s=useCallback(async(k,d,fn)=>{fn(d);await sv(k,d)},[]);
  const initData=useCallback(async sd=>{for(const[k,v]of[['ct5_cal',sd.cal],['ct5_ent',sd.ent],['ct5_roca',sd.roca],['ct5_lib',sd.lib],['ct5_t25',sd.t25],['ct5_treg',sd.treg],['ct5_dp',sd.dp],['ct5_tests',sd.tests||[DT]],['ct5_susp',sd.susp||[]],['ct5_cfw',sd.cfw||[]],['ct5_init',true]])await sv(k,v);setCal(sd.cal);setEnt(sd.ent);setRoca(sd.roca);setLib(sd.lib);setT25(sd.t25);setTreg(sd.treg);setDp(sd.dp);setTests(sd.tests||[DT]);setSusp(sd.susp||[]);setCfw(sd.cfw||[]);setInit(true)},[]);
  const sects=useMemo(()=>[...new Set([...lib.map(r=>r.sector),...roca.map(r=>r.lloc)].filter(Boolean))].sort(),[lib,roca]);
  const vias=useMemo(()=>[...new Set([...lib.map(r=>r.via),...roca.map(r=>r.via)].filter(Boolean))].sort(),[lib,roca]);
  const llocs=useMemo(()=>[...new Set([...cal.map(r=>r.lloc),...roca.map(r=>r.lloc)].filter(Boolean))].sort(),[cal,roca]);
  const tp=useMemo(()=>tests.length?tests[tests.length-1]:DT,[tests]);
  const STOP=/^(bon |molt |bona |varis|faig |dia |anam |havia |notava |sortint|provant|inicia|per fal|m.he |no vull|no he |sessió|entrena|complet|killter|kilter|moonboard|inrock|autoase)/i;
  const allExercises=useMemo(()=>{const seen=new Map();
    const add=t0=>{if(!t0||typeof t0!=='string')return;const t=t0.trim().replace(/^"+|"+$/g,'').trim();
      if(t.length<3||t.length>60||/^\d[\d\.\s\(\)/*x+-]*$/.test(t)||/^\d{4}-/.test(t)||STOP.test(t)||t.split(' ').length>9)return;
      const k=t.toLowerCase();if(!seen.has(k))seen.set(k,t)};
    ent.forEach(r=>{if(r.bloques&&Array.isArray(r.bloques))r.bloques.forEach(b=>{(b.ejercicios||[]).forEach(add)});
      ['ej_esp','parte_gen'].forEach(f=>{const v=r[f];if(v&&typeof v==='string')v.split(' , ').forEach(add)});
      ['min_esp','rpe_esp','carga_esp','min_gen','rpe_gen','carga_gen'].forEach(f=>{const v=r[f];if(v&&typeof v==='string'&&!/^\d/.test(v.trim())&&v.length<60)v.split(' , ').forEach(add)})});
    return[...seen.values()].sort()},[ent]);

  const doExport=useCallback(async()=>{
    const sheets={Calendario:cal,Entrenamientos:ent,SortidesRoca:roca,Libreta:lib,Tindeq25mm:t25,TindeqRegleta:treg,DatosPersonales:dp,Tests:tests,Suspensiones:susp,CFW:cfw};
    let csv='\n';
    for(const[n,d]of Object.entries(sheets)){if(!d.length)continue;csv+=`\n=== ${n} ===\n`;
      const ks=[...new Set(d.flatMap(r=>Object.keys(r)))];csv+=ks.join(',')+'\n';
      d.forEach(r=>{csv+=ks.map(k=>{let v=r[k];if(v==null)return'';if(k==='intentos_rpe'&&Array.isArray(v))v=rpeStr(v);
        if(['bloques','curva','intensidades','series_data','contractions'].includes(k)&&Array.isArray(v))v=JSON.stringify(v);
        const x=String(v);return x.includes(',')||x.includes('"')||x.includes('\n')?`"${x.replace(/"/g,'""')}"`:x}).join(',')+'\n'})}
    const b=new Blob([csv],{type:'text/csv'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`climbtrack_v6_${td()}.csv`;a.click();URL.revokeObjectURL(u);
    await markBackup();setBkp(await backupStatus());
  },[cal,ent,roca,lib,t25,treg,dp,tests,susp,cfw]);

  const tabs=[{id:'dash',icon:'📊',label:'Home'},{id:'cal',icon:'📅',label:'Rutina'},{id:'ent',icon:'💪',label:'Entreno'},{id:'roca',icon:'🏔️',label:'Roca'},{id:'more',icon:'☰',label:'Más'}];
  const moreP=[{id:'susp',icon:'🪢',label:'Suspensiones'},{id:'cfw',icon:'🔬',label:'CF / W\''},{id:'lib',icon:'📕',label:'Libreta'},{id:'tindeq',icon:'📏',label:'Tindeq'},{id:'peso',icon:'⚖️',label:'Peso'},{id:'test',icon:'🧪',label:'Tests'},{id:'stats',icon:'📈',label:'Stats'},{id:'export',icon:'📥',label:'Backup'}];

  if(loading)return(<div className="app"><style>{CSS}</style><div className="loading"><div style={{fontSize:48}}>🧗</div><div style={{color:'#8B7D6B'}}>ClimbTrack v6</div></div></div>);
  if(!init)return<InitP onInit={initData}/>;

  return(<div className="app"><style>{CSS}</style>
    <header className="header"><div className="h-brand"><span style={{fontSize:22}}>🧗</span><b style={{fontSize:17}}>ClimbTrack</b><span className="h-ver">v6</span></div>
      {bkp.overdue&&<button className="bkp-warn" onClick={doExport}>⚠ Backup {bkp.never?'nunca':bkp.days+'d'}</button>}
    </header>
    <main className="content">
      {page==='dash'&&<Dash cal={cal} ent={ent} roca={roca} lib={lib} dp={dp} t25={t25} treg={treg} tp={tp} susp={susp}/>}
      {page==='cal'&&<CalP data={cal} save={d=>s('ct5_cal',d,setCal)} llocs={llocs}/>}
      {page==='ent'&&<EntP data={ent} save={d=>s('ct5_ent',d,setEnt)} allEx={allExercises}/>}
      {page==='roca'&&<RocP data={roca} save={d=>s('ct5_roca',d,setRoca)} sects={sects} vias={vias} lib={lib} saveLib={d=>s('ct5_lib',d,setLib)}/>}
      {page==='susp'&&<SuspP data={susp} save={d=>s('ct5_susp',d,setSusp)} t25={t25} st25={d=>s('ct5_t25',d,setT25)} cal={cal} ent={ent} allEx={allExercises}/>}
      {page==='cfw'&&<CFWP data={cfw} save={d=>s('ct5_cfw',d,setCfw)} tp={tp}/>}
      {page==='lib'&&<LibP data={lib} save={d=>s('ct5_lib',d,setLib)} sects={sects}/>}
      {page==='tindeq'&&<TqP t25={t25} treg={treg} st25={d=>s('ct5_t25',d,setT25)} streg={d=>s('ct5_treg',d,setTreg)}/>}
      {page==='peso'&&<PesoP data={dp} save={d=>s('ct5_dp',d,setDp)}/>}
      {page==='test'&&<TestP tests={tests} save={d=>s('ct5_tests',d,setTests)}/>}
      {page==='stats'&&<StP cal={cal} ent={ent} roca={roca} lib={lib} dp={dp} t25={t25} treg={treg} susp={susp}/>}
    </main>
    {menuOpen&&<div className="m-overlay" onClick={()=>setMenuOpen(false)}><div className="more-menu" onClick={e=>e.stopPropagation()}><div className="more-handle"/>{moreP.map(p=><button key={p.id} className="more-item" onClick={()=>{if(p.id==='export'){doExport();setMenuOpen(false)}else{setPage(p.id);setMenuOpen(false)}}}><span style={{fontSize:24}}>{p.icon}</span><span>{p.label}</span></button>)}</div></div>}
    <nav className="bottom-nav">{tabs.map(t=><button key={t.id} className={`nav-tab${page===t.id||(t.id==='more'&&['susp','cfw','lib','tindeq','peso','test','stats'].includes(page))?' active':''}`} onClick={()=>{if(t.id==='more')setMenuOpen(!menuOpen);else{setPage(t.id);setMenuOpen(false)}}}><span className="nav-icon">{t.icon}</span><span className="nav-label">{t.label}</span></button>)}</nav>
  </div>);
}

/* ───────── INIT ───────── */
function InitP({onInit}){const[st,setSt]=useState('ready');const ref=useRef(null);
  const imp=async e=>{const f=e.target.files[0];if(!f)return;setSt('loading');
    try{const raw=await f.text();const t='\n'+raw.trimStart();const sec=t.split(/\n(=== \w+ ===)\n/);
      const sd={cal:[],roca:[],ent:[],lib:[],t25:[],treg:[],dp:[],tests:[DT],susp:[],cfw:[]};
      const km={'=== Calendario ===':'cal','=== Entrenamientos ===':'ent','=== SortidesRoca ===':'roca','=== Libreta ===':'lib','=== Tindeq25mm ===':'t25','=== TindeqRegleta ===':'treg','=== DatosPersonales ===':'dp','=== Tests ===':'tests','=== Suspensiones ===':'susp','=== CFW ===':'cfw'};
      for(let i=0;i<sec.length;i++){const k=km[sec[i]?.trim()];if(!k)continue;const csv=sec[i+1]?.trim();if(!csv)continue;
        const ls=csv.split('\n').filter(l=>l.trim());if(ls.length<2)continue;const h=parseRow(ls[0]);
        for(let j=1;j<ls.length;j++){const v=parseRow(ls[j]);const o={};h.forEach((x,idx)=>{o[x.trim()]=v[idx]||''});
          ['bloques','curva','intensidades','series_data','contractions'].forEach(f=>{if(o[f]&&typeof o[f]==='string'&&(o[f].startsWith('[')||o[f].startsWith('"['))){try{o[f]=JSON.parse(o[f].replace(/^"+|"+$/g,''))}catch{}}});
          if(o.intentos_rpe)o.intentos_rpe=pRpe(o.intentos_rpe);sd[k].push(o)}}
      await onInit(sd);setSt('done')}catch(err){console.error(err);setSt('error')}};
  return(<div className="app"><style>{CSS}</style><div className="init-page"><div style={{textAlign:'center',maxWidth:400,width:'100%'}}>
    <div style={{fontSize:64,marginBottom:20}}>🧗</div><h1 style={{fontSize:32,fontWeight:700,marginBottom:8}}>ClimbTrack <span style={{fontSize:16,color:'#E8A838'}}>v6</span></h1>
    <p style={{color:'#6B5F52',lineHeight:1.6,marginBottom:32}}>Escalada · Fatiga · Suspensiones · CF/W'</p>
    {st==='loading'?<div style={{color:'#E8A838',padding:20}}>Importando...</div>:st==='error'?<div style={{color:'#D4563A',padding:20}}>Error al importar.</div>:
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      <button className="btn-primary btn-lg" onClick={()=>{setSt('loading');onInit({cal:[],roca:[],ent:[],lib:[],t25:[],treg:[],dp:[],tests:[DT],susp:[],cfw:[]})}}>Empezar de cero</button>
      <div style={{color:'#6B5F52',fontSize:13}}>— o —</div>
      <button className="btn-secondary btn-lg" onClick={()=>ref.current?.click()}>📂 Importar CSV</button>
      <input ref={ref} type="file" accept=".csv,.txt,text/*,*/*" style={{display:'none'}} onChange={imp}/>
    </div>}
  </div></div></div>);
}

/* ───────── DASHBOARD ───────── */
function Dash({cal,ent,roca,lib,dp,t25,treg,tp,susp}){
  const ban=useMemo(()=>calcBanister(cal,ent),[cal,ent]);
  const rdns=useMemo(()=>calcReadiness(ban,cal,t25),[ban,cal,t25]);
  const tendon=useMemo(()=>tendonAlert(cal,ent),[cal,ent]);
  const lp=dp.length?dp[dp.length-1]:null;
  const wa=new Date(Date.now()-7*864e5).toISOString().split('T')[0];
  const recent=cal.filter(c=>c.fecha>=wa).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  const rd=[{axis:'Forma',val:rdns.scores.forma||0},{axis:'Recup.',val:rdns.scores.recuperacion||0},{axis:'Fuerza',val:rdns.scores.fuerza||0},{axis:'Fatiga',val:rdns.scores.fatiga||0}];
  const chartData=useMemo(()=>[...ban.series.slice(-60),...ban.predictions],[ban]);
  const tsb=ban.today.tsb;
  const tsbLabel=tsb>=15?'Fresco — ideal para roca':tsb>=-5?'En forma':tsb>=-20?'Cargado — entreno productivo':tsb>=-40?'Muy cargado':'Sobreentrenamiento';
  const tsbColor=tsb>=15?'#6B9F4A':tsb>=-5?'#E8A838':tsb>=-20?'#C4724E':tsb>=-40?'#D4563A':'#9B3A3A';

  return(<div className="page"><h2 className="p-title">Dashboard</h2>
    {tendon&&<div className={`tendon-banner ${tendon.level}`}><span style={{fontSize:18}}>{tendon.level==='red'?'🔴':tendon.level==='amber'?'🟠':'🟢'}</span><div><b>Ventana tendinosa <InfoBtn id="Tendon"/></b><div style={{fontSize:12,marginTop:2}}>{tendon.msg}</div></div></div>}
    <div className="card"><div className="fit-row">
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flexShrink:0}}>
        <div className="fit-ring" style={{borderColor:rdns.color}}><span style={{fontSize:28,fontWeight:700,color:rdns.color}}>{rdns.total}</span></div>
        <div style={{fontSize:13,fontWeight:600,color:rdns.color}}>{rdns.label}</div>
        <div style={{fontSize:10,color:'#6B5F52'}}>Readiness <InfoBtn id="Readiness"/></div>
      </div>
      <div style={{flex:1,minWidth:0}}><ResponsiveContainer width="100%" height={130}><RadarChart data={rd} cx="50%" cy="50%" outerRadius={48}><PolarGrid stroke="#33291F"/><PolarAngleAxis dataKey="axis" tick={{fill:'#8B7D6B',fontSize:10}}/><PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/><Radar dataKey="val" stroke={rdns.color} fill={rdns.color} fillOpacity={.2} strokeWidth={2}/></RadarChart></ResponsiveContainer></div>
    </div>
    <div className="ban-metrics">
      <div className="ban-m"><span className="ban-ml">CTL <InfoBtn id="CTL"/></span><span className="ban-mv" style={{color:'#3A8FB7'}}>{ban.today.ctl}</span></div>
      <div className="ban-m"><span className="ban-ml">ATL <InfoBtn id="ATL"/></span><span className="ban-mv" style={{color:'#D4563A'}}>{ban.today.atl}</span></div>
      <div className="ban-m"><span className="ban-ml">TSB <InfoBtn id="TSB"/></span><span className="ban-mv" style={{color:tsbColor}}>{tsb>0?'+':''}{tsb}</span></div>
      <div className="ban-m"><span className="ban-ml">ACWR <InfoBtn id="ACWR"/></span><span className="ban-mv" style={{color:ban.acwr>=.8&&ban.acwr<=1.3?'#6B9F4A':ban.acwr>1.5?'#D4563A':'#E8A838'}}>{ban.acwr}</span></div>
    </div>
    <div style={{textAlign:'center',fontSize:12,color:tsbColor,fontWeight:600,marginTop:6,paddingTop:8,borderTop:'1px solid #2A2420'}}>{tsbLabel}</div>
    </div>
    {chartData.length>5&&<div className="card"><div className="card-t">Fitness vs Fatiga (60d + predicción)</div>
      <ResponsiveContainer width="100%" height={200}><ComposedChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#33291F"/><XAxis dataKey="f" stroke="#8B7D6B" fontSize={8} interval={6}/><YAxis stroke="#8B7D6B" fontSize={10}/><Tooltip contentStyle={TTS}/><Legend wrapperStyle={{fontSize:10}}/>
        <Area type="monotone" dataKey="tsb" stroke="none" fill="#6B9F4A22" name="TSB"/>
        <Line type="monotone" dataKey="ctl" stroke="#3A8FB7" strokeWidth={2} dot={false} name="Fitness"/>
        <Line type="monotone" dataKey="atl" stroke="#D4563A" strokeWidth={2} dot={false} name="Fatiga"/>
        <Line type="monotone" dataKey="tsbP" stroke="#6B9F4A" strokeWidth={1.5} dot={false} strokeDasharray="5 3" name="Forma pred."/>
        <ReferenceLine y={0} stroke="#6B5F52" strokeDasharray="3 3"/>
      </ComposedChart></ResponsiveContainer>
      {ban.peakDay&&<div style={{fontSize:11,color:'#6B9F4A',textAlign:'center',marginTop:4}}>📈 Pico en reposo: <b>{ban.peakDay.fecha}</b> (TSB +{ban.peakDay.tsb})</div>}
    </div>}
    <div className="stat-grid">
      <div className="stat-card"><div className="stat-n">{lib.length}</div><div className="stat-l">Encadenadas</div></div>
      <div className="stat-card"><div className="stat-n b">{ent.length}</div><div className="stat-l">Entrenos</div></div>
      <div className="stat-card"><div className="stat-n g">{roca.length}</div><div className="stat-l">Salidas</div></div>
      <div className="stat-card"><div className="stat-n p">{lp?lp.peso:'—'}<span className="stat-u">kg</span></div><div className="stat-l">Peso</div></div>
    </div>
    <div className="card"><div className="card-t">Última semana</div>
      {recent.length===0?<div className="muted">Sin actividad</div>:recent.slice(0,7).map((r,i)=>
      <div key={i} className="list-row"><div className="lr-l"><span className="lr-e">{AI[r.activitat]||'📌'}</span><div><div className="lr-m">{r.activitat}</div>{r.sueno_horas&&<div className="lr-s">💤{r.sueno_horas}h q{r.sueno_calidad} 🧠{r.bienestar}</div>}</div></div><div className="lr-r"><span className="lr-f" style={{color:(r.fatiga_fin||1)>3?'#D4563A':'#6B9F4A'}}>{r.fatiga_ini}→{r.fatiga_fin}</span><span className="lr-d">{r.fecha?.slice(5)}</span></div></div>)}
    </div>
  </div>);
}

/* ───────── SUSPENSIONES BERGUA ───────── */
function SuspP({data,save,t25,st25,cal,ent,allEx}){
  const[show,setShow]=useState(false);const[eid,setEid]=useState(null);
  const mvcL=useMemo(()=>lastMVC(t25,'esq'),[t25]);
  const mvcR=useMemo(()=>lastMVC(t25,'dre'),[t25]);
  const blank=()=>({fecha:td(),edge:25,intensidad:75,series_prog:8,reps:4,work:8,pause:2,
    mvc_l:mvcL?mvcL.value:'',mvc_r:mvcR?mvcR.value:'',
    series_data:[],hr_avg:'',calorias:'',fatiga_ini:1,fatiga_fin:3,obs:'',syncTindeq:true});
  const[form,setForm]=useState(blank());
  const sorted=useMemo(()=>[...data].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')),[data]);
  const tgtL=targetLoad(Number(form.mvc_l),Number(form.intensidad));
  const tgtR=targetLoad(Number(form.mvc_r),Number(form.intensidad));
  const peaks=(form.series_data||[]).filter(s=>s.done&&s.peak).map(s=>s.peak);
  const loss=interSetLoss(peaks);
  const completed=(form.series_data||[]).filter(s=>s.done).length;
  const tendon=useMemo(()=>tendonAlert(cal,ent),[cal,ent]);

  const initSeries=n=>{const arr=[];for(let i=0;i<n;i++)arr.push({set:i+1,done:false,peak:''});return arr};
  const ensureSeries=()=>{if(!form.series_data||form.series_data.length!==Number(form.series_prog)){setForm(f=>({...f,series_data:initSeries(Number(f.series_prog))}))}};
  useEffect(()=>{ensureSeries()},[form.series_prog]);
  const toggleSet=i=>{const sd=[...form.series_data];sd[i]={...sd[i],done:!sd[i].done};setForm({...form,series_data:sd})};
  const setPeak=(i,v)=>{const sd=[...form.series_data];sd[i]={...sd[i],peak:v};setForm({...form,series_data:sd})};
  const sub=()=>{const e={...form,completed,loss};if(eid)save(data.map(r=>r.id===eid?{...e,id:eid}:r));else save([...data,{...e,id:xi()}]);
    if(form.syncTindeq&&form.mvc_l&&form.mvc_r&&st25){const exists=t25.some(r=>r.fecha===form.fecha);if(!exists){st25([...t25,{fecha:form.fecha,mm:25,esq:Number(form.mvc_l),dre:Number(form.mvc_r),id:xi(),src:'susp'}])}}
    setShow(false);setEid(null);setForm(blank())};
  const open=()=>{setEid(null);setForm(blank());setShow(true)};
  const edit=r=>{setForm({...blank(),...r,series_data:r.series_data||[]});setEid(r.id);setShow(true)};

  return(<div className="page"><h2 className="p-title">🪢 Suspensiones</h2>
    <Modal open={show} onClose={()=>setShow(false)} title={eid?'Editar sesión':'Nueva sesión'}>
      {tendon&&tendon.level!=='green'&&<div className={`tendon-banner ${tendon.level}`} style={{marginBottom:12}}><span>{tendon.level==='red'?'🔴':'🟠'}</span><div style={{fontSize:12}}>{tendon.msg}</div></div>}
      <F label="Fecha" value={form.fecha} onChange={v=>setForm({...form,fecha:v})} type="date"/>

      <div className="sh a">Calibración MVC (auto desde Tindeq)</div>
      <div className="mvc-box">
        <div className="mvc-row"><span>MVC Izq</span>
          <input className="f-input mvc-input" type="number" value={form.mvc_l} onChange={e=>setForm({...form,mvc_l:Number(e.target.value)})}/>
          <span className="mvc-unit">N</span>
          {mvcL&&<span className={`mvc-age ${mvcL.daysOld>7?'stale':''}`}>{mvcL.daysOld}d</span>}
        </div>
        <div className="mvc-row"><span>MVC Dch</span>
          <input className="f-input mvc-input" type="number" value={form.mvc_r} onChange={e=>setForm({...form,mvc_r:Number(e.target.value)})}/>
          <span className="mvc-unit">N</span>
          {mvcR&&<span className={`mvc-age ${mvcR.daysOld>7?'stale':''}`}>{mvcR.daysOld}d</span>}
        </div>
        {((mvcL&&mvcL.daysOld>7)||(mvcR&&mvcR.daysOld>7))&&<div className="mvc-warn">⚠ MVC con más de 7 días. Mide en el Tindeq antes de empezar.</div>}
        <label className="sync-toggle"><input type="checkbox" checked={!!form.syncTindeq} onChange={e=>setForm({...form,syncTindeq:e.target.checked})}/> Guardar este MVC también como test 25mm en Tindeq</label>
      </div>

      <div className="row-2"><F label="Edge (mm)" value={form.edge} onChange={v=>setForm({...form,edge:v})} type="number"/><F label="Intensidad %" value={form.intensidad} onChange={v=>setForm({...form,intensidad:v})} type="number"/></div>

      <div className="target-box">
        <div className="target-item"><span className="target-l">Objetivo Izq</span><span className="target-v">{tgtL||'—'} N</span></div>
        <div className="target-item"><span className="target-l">Objetivo Dch</span><span className="target-v">{tgtR||'—'} N</span></div>
      </div>

      <div className="sh a">Protocolo</div>
      <div className="row-3"><F label="Series" value={form.series_prog} onChange={v=>setForm({...form,series_prog:v})} type="number" min={1} max={12}/><F label="Reps" value={form.reps} onChange={v=>setForm({...form,reps:v})} type="number"/><F label="Work (s)" value={form.work} onChange={v=>setForm({...form,work:v})} type="number"/></div>

      <div className="sh a">Registro por serie ({completed}/{form.series_prog})</div>
      <div className="series-grid">
        {(form.series_data||[]).map((sd,i)=><div key={i} className={`series-cell ${sd.done?'done':''}`} onClick={()=>toggleSet(i)}>
          <span className="series-num">S{sd.set}</span>{sd.done?'✓':'○'}
        </div>)}
      </div>
      <div style={{fontSize:11,color:'#6B5F52',margin:'8px 0'}}>Pico N por serie (opcional, para pérdida inter-series):</div>
      <div className="peaks-row">
        {(form.series_data||[]).map((sd,i)=>sd.done&&<input key={i} className="peak-input" type="number" placeholder={`S${sd.set}`} value={sd.peak} onChange={e=>setPeak(i,Number(e.target.value))}/>)}
      </div>
      {loss!==null&&<div className="force-loss-badge" style={{color:loss>15?'#D4563A':loss>8?'#E8A838':'#6B9F4A'}}>Pérdida inter-series: {loss}% {loss<8?'(protocolo cómodo, sube carga)':loss>15?'(muy exigente)':'(óptimo)'}</div>}

      <div className="sh a">⌚ Suunto</div>
      <div className="row-2"><F label="FC media" value={form.hr_avg} onChange={v=>setForm({...form,hr_avg:v})} type="number"/><F label="Calorías" value={form.calorias} onChange={v=>setForm({...form,calorias:v})} type="number"/></div>
      <div className="row-2"><F label="Fatiga Ini" value={form.fatiga_ini} onChange={v=>setForm({...form,fatiga_ini:v})} type="number" min={0} max={10}/><F label="Fatiga Fin" value={form.fatiga_fin} onChange={v=>setForm({...form,fatiga_fin:v})} type="number" min={0} max={10}/></div>
      <F label="Obs" value={form.obs} onChange={v=>setForm({...form,obs:v})}/>
      <button className="btn-primary btn-full" onClick={sub}>{eid?'Guardar':'Registrar'}</button>
      {eid&&<DelBtn onDel={()=>{save(data.filter(r=>r.id!==eid));setShow(false);setEid(null)}} label="esta sesión"/>}
    </Modal>
    <div className="card lc">{sorted.map((r,i)=><div key={r.id||i} className="ent-row" onClick={()=>edit(r)}>
      <div className="ent-h"><div><span className="lr-d">{(r.fecha||'').slice(5)}</span><span className="ent-t">{r.edge}mm @ {r.intensidad}%</span></div>
        <div className="ent-st"><span className="ent-mn">{r.completed||0}/{r.series_prog}</span>{r.loss!=null&&<span style={{color:r.loss>15?'#D4563A':'#6B9F4A',fontSize:11,fontWeight:600}}>↓{r.loss}%</span>}</div></div>
      <div style={{fontSize:11,marginTop:4,color:'#8B7D6B'}}>MVC {r.mvc_l}/{r.mvc_r}N · Objetivo {targetLoad(Number(r.mvc_l),Number(r.intensidad))}/{targetLoad(Number(r.mvc_r),Number(r.intensidad))}N{r.hr_avg&&<span style={{color:'#9B6BB7',marginLeft:6}}>♥{r.hr_avg}</span>}</div>
    </div>)}</div>
    <Fab onClick={open}/>
  </div>);
}

/* ───────── CF / W' TEST ───────── */
function CFWP({data,save,tp}){
  const[show,setShow]=useState(false);
  const blank=()=>({fecha:td(),edge:20,peso:tp.peso||83,contractions:[],obs:''});
  const[form,setForm]=useState(blank());
  const sorted=useMemo(()=>[...data].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')),[data]);
  const result=useMemo(()=>calcCFW(form.contractions||[]),[form.contractions]);
  const addRep=()=>setForm(f=>({...f,contractions:[...(f.contractions||[]),'']}));
  const setRep=(i,v)=>{const c=[...form.contractions];c[i]=Number(v)||'';setForm({...form,contractions:c})};
  const rmRep=i=>setForm(f=>({...f,contractions:f.contractions.filter((_,j)=>j!==i)}));
  const sub=()=>{const e={...form,...(result||{})};save([...data,{...e,id:xi()}]);setShow(false);setForm(blank())};
  const chart=useMemo(()=>sorted.slice().reverse().map(r=>({f:(r.fecha||'').slice(5),cf:Number(r.cf)||0,wp:Math.round((Number(r.wPrime)||0)/100)})),[sorted]);

  return(<div className="page"><h2 className="p-title">🔬 Fuerza Crítica / W'</h2>
    <div className="card" style={{fontSize:12,color:'#8B7D6B',lineHeight:1.6}}>
      <b style={{color:'#E8A838'}}>Protocolo (Giles 2021 / Baláš 2024)</b><br/>
      Regleta 20mm, una mano. Contracciones rítmicas <b>7s al máximo : 3s descanso</b>, durante 4-5 min hasta que la fuerza se estabilice. Introduce el pico (N) de cada contracción. CF = media de las últimas 6. W' = impulso por encima de CF.
    </div>
    {chart.length>1&&<div className="card"><div className="card-t">Evolución CF y W'</div>
      <ResponsiveContainer width="100%" height={180}><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="#33291F"/><XAxis dataKey="f" stroke="#8B7D6B" fontSize={9}/><YAxis yAxisId="l" stroke="#E8A838"/><YAxis yAxisId="r" orientation="right" stroke="#3A8FB7"/><Tooltip contentStyle={TTS}/><Legend wrapperStyle={{fontSize:10}}/><Line yAxisId="l" dataKey="cf" stroke="#E8A838" name="CF (N)" strokeWidth={2}/><Line yAxisId="r" dataKey="wp" stroke="#3A8FB7" name="W' (×100 N·s)" strokeWidth={2}/></LineChart></ResponsiveContainer>
    </div>}
    <Modal open={show} onClose={()=>setShow(false)} title="Test CF / W'">
      <F label="Fecha" value={form.fecha} onChange={v=>setForm({...form,fecha:v})} type="date"/>
      <div className="row-2"><F label="Edge (mm)" value={form.edge} onChange={v=>setForm({...form,edge:v})} type="number"/><F label="Peso (kg)" value={form.peso} onChange={v=>setForm({...form,peso:v})} type="number"/></div>
      <div className="sh a">Picos por contracción (N)</div>
      <div className="cfw-grid">{(form.contractions||[]).map((c,i)=><div key={i} className="cfw-cell"><span className="cfw-n">{i+1}</span><input className="peak-input" type="number" value={c} onChange={e=>setRep(i,e.target.value)}/><button className="ej-rm" onClick={()=>rmRep(i)}>✕</button></div>)}</div>
      <button className="ej-add" onClick={addRep}>+ Contracción</button>
      {result&&<div className="cfw-result"><div><span className="cfw-rl">CF</span><span className="cfw-rv">{result.cf} N</span></div><div><span className="cfw-rl">W'</span><span className="cfw-rv">{result.wPrime} N·s</span></div><div><span className="cfw-rl">Reps</span><span className="cfw-rv">{result.reps}</span></div></div>}
      {result&&result.reps<12&&<div className="mvc-warn">Necesitas al menos 12 contracciones para un cálculo fiable.</div>}
      <F label="Obs" value={form.obs} onChange={v=>setForm({...form,obs:v})}/>
      <button className="btn-primary btn-full" onClick={sub} disabled={!result}>Guardar test</button>
    </Modal>
    <div className="card lc">{sorted.map((r,i)=><div key={r.id||i} className="list-row"><div className="lr-l"><span className="lr-e">🔬</span><div><div className="lr-m">CF {r.cf}N · W' {r.wPrime}N·s</div><div className="lr-s">{r.edge}mm · {r.reps} reps</div></div></div><div className="lr-r"><span className="lr-d">{(r.fecha||'').slice(5)}</span>{r.id&&<button className="del-inline" onClick={e=>{e.stopPropagation();if(window.confirm('¿Eliminar?'))save(data.filter(x=>x.id!==r.id))}}>🗑</button>}</div></div>)}</div>
    <Fab onClick={()=>{setForm(blank());setShow(true)}}/>
  </div>);
}

/* ───────── CALENDARIO ───────── */
function CalP({data,save,llocs}){const[show,setShow]=useState(false);const[eid,setEid]=useState(null);
  const blank={fecha:td(),macro:'',meso:'',activitat:'',lloc:'',fatiga_ini:1,fatiga_fin:1,sueno_horas:'',sueno_calidad:'',bienestar:'',obs:''};
  const[form,setForm]=useState(blank);const[flt,setFlt]=useState('');
  const sorted=useMemo(()=>[...data].filter(r=>!flt||r.activitat===flt).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')),[data,flt]);
  const sub=()=>{if(!form.activitat)return;if(eid)save(data.map(r=>r.id===eid?{...form,id:eid}:r));else save([...data,{...form,id:xi()}]);setShow(false);setEid(null)};
  return(<div className="page"><h2 className="p-title">Rutina Diaria</h2>
    <div style={{marginBottom:12}}><select className="f-input" style={{maxWidth:200}} value={flt} onChange={e=>setFlt(e.target.value)}><option value="">Todas</option>{ACTS.map(a=><option key={a} value={a}>{a}</option>)}</select></div>
    <Modal open={show} onClose={()=>setShow(false)} title={eid?'Editar':'Nueva Actividad'}>
      <F label="Fecha" value={form.fecha} onChange={v=>setForm({...form,fecha:v})} type="date"/>
      <F label="Actividad" value={form.activitat} onChange={v=>setForm({...form,activitat:v})} options={ACTS}/>
      <Combo label="Lugar" value={form.lloc||''} onChange={v=>setForm({...form,lloc:v})} options={llocs}/>
      <div className="row-2"><F label="Macro" value={form.macro} onChange={v=>setForm({...form,macro:v})} type="number" min={1}/><F label="Meso" value={form.meso} onChange={v=>setForm({...form,meso:v})} type="number" min={1}/></div>
      <div className="row-2"><F label="Fatiga Ini" value={form.fatiga_ini} onChange={v=>setForm({...form,fatiga_ini:v})} type="number" min={0} max={10}/><F label="Fatiga Fin" value={form.fatiga_fin} onChange={v=>setForm({...form,fatiga_fin:v})} type="number" min={0} max={10}/></div>
      <div className="sh a">💤 Sueño y Bienestar</div>
      <div className="row-3"><F label="Horas" value={form.sueno_horas} onChange={v=>setForm({...form,sueno_horas:v})} type="number" step="0.5"/><F label="Calidad 1-5" value={form.sueno_calidad} onChange={v=>setForm({...form,sueno_calidad:v})} type="number" min={1} max={5}/><F label="Bienestar 1-5" value={form.bienestar} onChange={v=>setForm({...form,bienestar:v})} type="number" min={1} max={5}/></div>
      <F label="Obs" value={form.obs} onChange={v=>setForm({...form,obs:v})}/>
      <button className="btn-primary btn-full" onClick={sub}>{eid?'Guardar':'Registrar'}</button>
      {eid&&<DelBtn onDel={()=>{save(data.filter(r=>r.id!==eid));setShow(false);setEid(null)}} label="esta actividad"/>}
    </Modal>
    <div className="card lc">{sorted.slice(0,60).map((r,i)=><div key={r.id||i} className="list-row" onClick={()=>{setForm({...r});setEid(r.id);setShow(true)}}>
      <div className="lr-l"><span className="lr-e">{AI[r.activitat]||'📌'}</span><div><div className="lr-m">{r.activitat}</div>{r.lloc&&<div className="lr-s">@ {r.lloc}</div>}{r.sueno_horas&&<div className="lr-s">💤{r.sueno_horas}h q{r.sueno_calidad} 🧠{r.bienestar}</div>}</div></div>
      <div className="lr-r"><span className="lr-f" style={{color:(r.fatiga_fin||1)>3?'#D4563A':'#6B9F4A'}}>{r.fatiga_ini}→{r.fatiga_fin}</span><span className="lr-d">{r.fecha?.slice(5)}</span></div>
    </div>)}</div>
    <Fab onClick={()=>{setEid(null);setForm(blank);setShow(true)}}/>
  </div>);
}

/* ───────── ENTRENAMIENTOS ───────── */
function EntP({data,save,allEx}){const[show,setShow]=useState(false);const[eid,setEid]=useState(null);
  const TIPOS=['Rocòdrom','Suspensions/Dominades','Gimnàs'];
  const eb=t=>({id:xi(),tipo:t,ejercicios:[''],series:'',minutos:'',rpe:''});
  const blank={fecha:td(),macro:'',meso:'',tipo:'',hr_avg:'',hr_max:'',calorias:'',bloques:[eb('General'),eb('Específica')],fatiga_ini:1,fatiga_fin:1,obs:''};
  const[form,setForm]=useState(blank);
  const sorted=useMemo(()=>[...data].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')),[data]);
  const sB=(i,f,v)=>{const b=[...form.bloques];b[i]={...b[i],[f]:v};setForm({...form,bloques:b})};
  const sE=(bi,ei,v)=>{const b=[...form.bloques];const e=[...b[bi].ejercicios];e[ei]=v;b[bi]={...b[bi],ejercicios:e};setForm({...form,bloques:b})};
  const aE=bi=>{const b=[...form.bloques];b[bi]={...b[bi],ejercicios:[...b[bi].ejercicios,'']};setForm({...form,bloques:b})};
  const rE=(bi,ei)=>{const b=[...form.bloques];const e=b[bi].ejercicios.filter((_,i)=>i!==ei);b[bi]={...b[bi],ejercicios:e.length?e:['']};setForm({...form,bloques:b})};
  const aB=t=>setForm({...form,bloques:[...form.bloques,eb(t)]});
  const rB=i=>{if(form.bloques.length<=1)return;setForm({...form,bloques:form.bloques.filter((_,j)=>j!==i)})};
  const sub=()=>{let ct=0,mt=0;const bl=form.bloques.map(b=>{const m=Number(b.minutos)||0,r=Number(b.rpe)||0,c=m*r;ct+=c;mt+=m;return{...b,carga:c,ejercicios:b.ejercicios.filter(e=>e.trim())}});const e={...form,bloques:bl,min_total:mt,carga_total:ct};if(eid)save(data.map(r=>r.id===eid?{...e,id:eid}:r));else save([...data,{...e,id:xi()}]);setShow(false);setEid(null);setForm(blank)};
  const gB=r=>{if(r.bloques&&Array.isArray(r.bloques)&&r.bloques.length)return r.bloques;const b=[];if(r.parte_gen)b.push({tipo:'General',ejercicios:(r.parte_gen||'').split(' , '),minutos:r.min_gen,rpe:r.rpe_gen,carga:r.carga_gen});if(r.ej_esp)b.push({tipo:'Específica',ejercicios:(r.ej_esp||'').split(' , '),minutos:r.min_esp,rpe:r.rpe_esp,carga:r.carga_esp});return b};
  const ed=r=>{const bl=gB(r);setForm({...r,bloques:bl.length?bl:[eb('General'),eb('Específica')]});setEid(r.id);setShow(true)};
  return(<div className="page"><h2 className="p-title">Entrenamientos</h2>
    <Modal open={show} onClose={()=>setShow(false)} title={eid?'Editar':'Nuevo Entrenamiento'}>
      <div className="row-2"><F label="Fecha" value={form.fecha} onChange={v=>setForm({...form,fecha:v})} type="date"/><F label="Tipo" value={form.tipo} onChange={v=>setForm({...form,tipo:v})} options={TIPOS}/></div>
      <div className="row-2"><F label="Macro" value={form.macro} onChange={v=>setForm({...form,macro:v})} type="number"/><F label="Meso" value={form.meso} onChange={v=>setForm({...form,meso:v})} type="number"/></div>
      <div className="sh a">⌚ Suunto</div>
      <div className="row-3"><F label="FC media" value={form.hr_avg} onChange={v=>setForm({...form,hr_avg:v})} type="number"/><F label="FC máx" value={form.hr_max} onChange={v=>setForm({...form,hr_max:v})} type="number"/><F label="Calorías" value={form.calorias} onChange={v=>setForm({...form,calorias:v})} type="number"/></div>
      {form.bloques.map((b,bi)=><div key={b.id||bi} className="block-section"><div className="block-head"><span className={`block-tag ${b.tipo==='General'?'gen':'esp'}`}>{b.tipo}</span>{form.bloques.length>1&&<button className="block-rm" onClick={()=>rB(bi)}>✕</button>}</div>
        {b.ejercicios.map((ej,ei)=><div key={ei} className="ej-row"><Combo label="" value={ej} onChange={v=>sE(bi,ei,v)} options={allEx}/>{b.ejercicios.length>1&&<button className="ej-rm" onClick={()=>rE(bi,ei)}>✕</button>}</div>)}
        <button className="ej-add" onClick={()=>aE(bi)}>+ Ejercicio</button>
        <div className="row-3" style={{marginTop:8}}><F label="Series" value={b.series} onChange={v=>sB(bi,'series',v)} type="number" min={1}/><F label="Minutos" value={b.minutos} onChange={v=>sB(bi,'minutos',v)} type="number"/><F label="RPE 1-10" value={b.rpe} onChange={v=>sB(bi,'rpe',v)} type="number" min={1} max={10}/></div>
        {b.minutos&&b.rpe&&<div style={{fontSize:11,color:'#C4724E',textAlign:'right',marginTop:2}}>Carga: {Number(b.minutos)*Number(b.rpe)}</div>}
      </div>)}
      <div className="add-block-row"><button className="add-block-btn" onClick={()=>aB('General')}>+ General</button><button className="add-block-btn" onClick={()=>aB('Específica')}>+ Específica</button></div>
      <div className="row-2" style={{marginTop:12}}><F label="Fatiga Ini" value={form.fatiga_ini} onChange={v=>setForm({...form,fatiga_ini:v})} type="number" min={0} max={10}/><F label="Fatiga Fin" value={form.fatiga_fin} onChange={v=>setForm({...form,fatiga_fin:v})} type="number" min={0} max={10}/></div>
      <F label="Obs" value={form.obs} onChange={v=>setForm({...form,obs:v})}/>
      <button className="btn-primary btn-full" onClick={sub}>{eid?'Guardar':'Registrar'}</button>
      {eid&&<DelBtn onDel={()=>{save(data.filter(r=>r.id!==eid));setShow(false);setEid(null)}} label="este entrenamiento"/>}
    </Modal>
    <div className="card lc">{sorted.slice(0,40).map((r,i)=>{const bl=gB(r);const hasB=r.bloques&&Array.isArray(r.bloques)&&r.bloques.length>0;
      return(<div key={r.id||i} className="ent-row" onClick={()=>ed(r)}>
      <div className="ent-h"><div><span className="lr-d">{(r.fecha||'').slice(5)}</span><span className="ent-t">{r.tipo}</span></div><div className="ent-st">{hasB&&<span style={{color:'#6B9F4A',fontSize:10}}>★</span>}<span className="ent-mn">{r.min_total||'—'}′</span><span className="ent-cg">C:{r.carga_total||'—'}</span></div></div>
      {bl.map((b,bi)=><div key={bi} style={{display:'flex',alignItems:'center',gap:6,marginTop:4,fontSize:11,color:'#8B7D6B'}}><span className={`block-tag-sm ${b.tipo==='General'?'gen':'esp'}`}>{b.tipo?.charAt(0)}</span>{b.series&&<span style={{color:'#9B6BB7'}}>{b.series}×</span>}<span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(b.ejercicios||[]).filter(e=>e).join(' · ')}</span></div>)}
      <div style={{fontSize:11,marginTop:4}}><span style={{color:(r.fatiga_fin||1)>3?'#D4563A':'#6B9F4A'}}>Fatiga {r.fatiga_ini}→{r.fatiga_fin}</span>{r.hr_avg&&<span style={{color:'#9B6BB7',marginLeft:8}}>♥{r.hr_avg}/{r.hr_max}</span>}</div>
    </div>)})}</div>
    <Fab onClick={()=>{setEid(null);setForm(blank);setShow(true)}}/>
  </div>);
}

/* ───────── ROCA ───────── */
function RocP({data,save,sects,vias,lib,saveLib}){const[show,setShow]=useState(false);const[eid,setEid]=useState(null);
  const blank={fecha:td(),lloc:'',via:'',grau:'',intentos_rpe:[5],fatiga_ini:1,fatiga_fin:1,encadene:'NO',obs:''};
  const[form,setForm]=useState(blank);
  const sorted=useMemo(()=>[...data].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')),[data]);
  const fV=useMemo(()=>{if(!form.lloc)return vias;const s=[...new Set([...data.filter(r=>r.lloc===form.lloc).map(r=>r.via),...lib.filter(r=>r.sector===form.lloc).map(r=>r.via)].filter(Boolean))].sort();return s.length?s:vias},[form.lloc,data,lib,vias]);
  const sR=(idx,val)=>{const a=[...form.intentos_rpe];a[idx]=val;setForm({...form,intentos_rpe:a})};
  const sub=()=>{const ra=form.intentos_rpe.map(v=>Number(v)||0);const e={...form,intentos_rpe:ra,intents:ra.length};if(eid)save(data.map(r=>r.id===eid?{...e,id:eid}:r));else{save([...data,{...e,id:xi()}]);if(e.encadene==='SÍ'||e.encadene==='SI'){const d=new Date(e.fecha);const ms=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];saveLib([{id:xi(),num:lib.length+1,dia:d.getDate(),mes:ms[d.getMonth()],anyo:d.getFullYear(),sector:e.lloc,via:e.via,grado:e.grau,intentos:e.intents,obs:e.obs},...lib])}}setShow(false);setEid(null);setForm(blank)};
  const enc=r=>r.encadene==='SÍ'||r.encadene==='SI'||r.encadene===true;
  return(<div className="page"><h2 className="p-title">Salidas a Roca</h2>
    <Modal open={show} onClose={()=>setShow(false)} title={eid?'Editar':'Registrar Vía'}>
      <F label="Fecha" value={form.fecha} onChange={v=>setForm({...form,fecha:v})} type="date"/>
      <Combo label="Sector" value={form.lloc||''} onChange={v=>setForm({...form,lloc:v})} options={sects}/>
      <Combo label="Vía" value={form.via||''} onChange={v=>setForm({...form,via:v})} options={fV}/>
      <F label="Grado" value={form.grau} onChange={v=>setForm({...form,grau:v})} options={GR}/>
      <div className="sh a">Intentos — RPE</div>
      {form.intentos_rpe.map((rpe,idx)=><div key={idx} className="rpe-row"><span className="rpe-num">#{idx+1}</span><div className="rpe-dots">{[1,2,3,4,5,6,7,8,9,10].map(v=><button key={v} className={`rpe-dot${rpe===v?' active':''}`} onClick={()=>sR(idx,v)}>{v}</button>)}</div>{form.intentos_rpe.length>1&&<button className="ej-rm" onClick={()=>setForm({...form,intentos_rpe:form.intentos_rpe.filter((_,i)=>i!==idx)})}>✕</button>}</div>)}
      <button className="ej-add" onClick={()=>setForm({...form,intentos_rpe:[...form.intentos_rpe,5]})}>+ Intento</button>
      <F label="¿Encadenada?" value={form.encadene} onChange={v=>setForm({...form,encadene:v})} options={['SÍ','NO']}/>
      <div className="row-2"><F label="Fatiga Ini" value={form.fatiga_ini} onChange={v=>setForm({...form,fatiga_ini:v})} type="number" min={0} max={10}/><F label="Fatiga Fin" value={form.fatiga_fin} onChange={v=>setForm({...form,fatiga_fin:v})} type="number" min={0} max={10}/></div>
      <F label="Obs" value={form.obs} onChange={v=>setForm({...form,obs:v})}/>
      <button className="btn-primary btn-full" onClick={sub}>{eid?'Guardar':'Registrar'}</button>
      {eid&&<DelBtn onDel={()=>{save(data.filter(r=>r.id!==eid));setShow(false);setEid(null)}} label="esta vía"/>}
    </Modal>
    <div className="card lc">{sorted.slice(0,50).map((r,i)=>{const avg=rpeAvg(r.intentos_rpe);const mx=rpeMax(r.intentos_rpe);
      return(<div key={r.id||i} className="list-row" onClick={()=>{const ir=pRpe(r.intentos_rpe);setForm({...r,intentos_rpe:ir.length?ir:[5]});setEid(r.id);setShow(true)}}>
        <div className="lr-l"><span className={`ed ${enc(r)?'y':'n'}`}>{enc(r)?'✓':'✗'}</span><div><div className="lr-m">{r.via||'—'} <span className="gt">{r.grau}</span></div><div className="lr-s">@ {r.lloc} · {r.intents||pRpe(r.intentos_rpe).length} int.{avg!==null&&<span className="rpe-badge"> ø{avg} ↑{mx}</span>}</div></div></div>
        <div className="lr-r"><span className="lr-f" style={{color:(r.fatiga_fin||1)>3?'#D4563A':'#6B9F4A'}}>{r.fatiga_ini}→{r.fatiga_fin}</span><span className="lr-d">{(r.fecha||'').slice(5)}</span></div>
      </div>)})}</div>
    <Fab onClick={()=>{setEid(null);setForm(blank);setShow(true)}}/>
  </div>);
}

/* ───────── LIBRETA ───────── */
function LibP({data,save,sects}){const[show,setShow]=useState(false);const[eid,setEid]=useState(null);const[flt,setFlt]=useState('');
  const[form,setForm]=useState({dia:'',mes:'',anyo:2026,sector:'',via:'',grado:'',intentos:1,obs:''});
  const gc={};data.forEach(r=>{gc[r.grado]=(gc[r.grado]||0)+1});
  const sorted=useMemo(()=>{let d=[...data];if(flt)d=d.filter(r=>r.grado===flt);return d.sort((a,b)=>(b.anyo||0)-(a.anyo||0)||(MS[b.mes]||0)-(MS[a.mes]||0)||(b.dia||0)-(a.dia||0))},[data,flt]);
  const sub=()=>{if(eid)save(data.map(r=>r.id===eid?{...form,id:eid}:r));else save([{...form,num:data.length+1,id:xi()},...data]);setShow(false);setEid(null)};
  return(<div className="page"><h2 className="p-title">Libreta — {data.length}</h2>
    <div className="pills">{['',...Object.keys(gc)].map(g=><button key={g} className={`pill${flt===g?' active':''}`} onClick={()=>setFlt(g)}>{g||'Todos'}{g?` (${gc[g]||0})`:` (${data.length})`}</button>)}</div>
    <Modal open={show} onClose={()=>setShow(false)} title={eid?'Editar':'Añadir'}>
      <div className="row-3"><F label="Día" value={form.dia} onChange={v=>setForm({...form,dia:v})} type="number"/><F label="Mes" value={form.mes} onChange={v=>setForm({...form,mes:v})} options={Object.keys(MS)}/><F label="Año" value={form.anyo} onChange={v=>setForm({...form,anyo:v})} type="number"/></div>
      <Combo label="Sector" value={form.sector||''} onChange={v=>setForm({...form,sector:v})} options={sects}/><F label="Vía" value={form.via} onChange={v=>setForm({...form,via:v})}/>
      <div className="row-2"><F label="Grado" value={form.grado} onChange={v=>setForm({...form,grado:v})} options={['7a','7a+','7b','7b+','7c','7c+','8a']}/><F label="Intentos" value={form.intentos} onChange={v=>setForm({...form,intentos:v})} type="number" min={1}/></div>
      <F label="Obs" value={form.obs} onChange={v=>setForm({...form,obs:v})}/>
      <button className="btn-primary btn-full" onClick={sub}>{eid?'Guardar':'Registrar'}</button>
      {eid&&<DelBtn onDel={()=>{save(data.filter(r=>r.id!==eid));setShow(false);setEid(null)}} label="esta vía"/>}
    </Modal>
    <div className="card lc">{sorted.map((r,i)=><div key={r.id||i} className="lib-row" onClick={()=>{setForm({...r});setEid(r.id);setShow(true)}}><div className="lib-l"><span className="lib-n">#{r.num}</span><div><div className="lib-v">{r.via} <span className="gt">{r.grado}</span></div><div className="lr-s">{r.sector} · {r.intentos} int.</div></div></div><div className="lr-d">{r.dia} {(r.mes||'').slice(0,3)} {r.anyo}</div></div>)}</div>
    <Fab onClick={()=>{setEid(null);setForm({dia:'',mes:'',anyo:2026,sector:'',via:'',grado:'',intentos:1,obs:''});setShow(true)}}/>
  </div>);
}

/* ───────── TINDEQ ───────── */
function TqP({t25,treg,st25,streg}){const[tab,setTab]=useState('25');const[show,setShow]=useState(false);
  const[f25,sF]=useState({fecha:td(),esq:'',dre:''});const[fR,sR]=useState({fecha:td(),mm:16,esq:'',dre:''});
  const data=tab==='25'?t25:treg;
  const chart=useMemo(()=>[...data].sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).map(r=>({f:(r.fecha||'').slice(5),i:Number(r.esq)||0,d:Number(r.dre)||0})),[data]);
  const sorted=useMemo(()=>[...data].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')),[data]);
  const del=(id,isT25)=>{if(isT25)st25(t25.filter(r=>r.id!==id));else streg(treg.filter(r=>r.id!==id))};
  return(<div className="page"><h2 className="p-title">Tindeq</h2>
    <div className="tabs"><button className={`tb${tab==='25'?' ac':''}`} onClick={()=>setTab('25')}>25mm ({t25.length})</button><button className={`tb${tab==='reg'?' ac':''}`} onClick={()=>setTab('reg')}>Regleta ({treg.length})</button></div>
    {chart.length>2&&<div className="card"><div className="card-t">Evolución</div><ResponsiveContainer width="100%" height={200}><LineChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="#33291F"/><XAxis dataKey="f" stroke="#8B7D6B" fontSize={9}/><YAxis stroke="#8B7D6B"/><Tooltip contentStyle={TTS}/><Legend/><Line type="monotone" dataKey="i" stroke="#E8A838" name="Izq" dot={false} strokeWidth={2}/><Line type="monotone" dataKey="d" stroke="#3A8FB7" name="Dch" dot={false} strokeWidth={2}/></LineChart></ResponsiveContainer></div>}
    <div className="card lc">{sorted.slice(0,40).map((r,i)=><div key={r.id||i} className="list-row"><div className="lr-l"><span className="lr-d">{(r.fecha||'').slice(5)}</span>{r.mm&&<span className="lr-s" style={{marginLeft:8}}>{r.mm}mm</span>}</div><div style={{display:'flex',alignItems:'center',gap:12}}><span className="tq-l">I:{r.esq}N</span><span className="tq-r">D:{r.dre}N</span>{r.id&&<button className="del-inline" onClick={e=>{e.stopPropagation();if(window.confirm('¿Eliminar?'))del(r.id,tab==='25')}}>🗑</button>}</div></div>)}</div>
    <Modal open={show} onClose={()=>setShow(false)} title={`Test ${tab==='25'?'25mm':'Regleta'}`}><F label="Fecha" value={tab==='25'?f25.fecha:fR.fecha} onChange={v=>tab==='25'?sF({...f25,fecha:v}):sR({...fR,fecha:v})} type="date"/>{tab==='reg'&&<F label="mm" value={fR.mm} onChange={v=>sR({...fR,mm:v})} type="number"/>}<div className="row-2"><F label="Izq (N)" value={tab==='25'?f25.esq:fR.esq} onChange={v=>tab==='25'?sF({...f25,esq:v}):sR({...fR,esq:v})} type="number"/><F label="Dch (N)" value={tab==='25'?f25.dre:fR.dre} onChange={v=>tab==='25'?sF({...f25,dre:v}):sR({...fR,dre:v})} type="number"/></div><button className="btn-primary btn-full" onClick={()=>{if(tab==='25')st25([...t25,{...f25,id:xi(),mm:25}]);else streg([...treg,{...fR,id:xi()}]);setShow(false)}}>Registrar</button></Modal>
    <Fab onClick={()=>setShow(true)}/>
  </div>);
}

/* ───────── PESO ───────── */
function PesoP({data,save}){const[show,setShow]=useState(false);const[form,setForm]=useState({fecha:td(),peso:'',altura:177,grasa:'',obs:''});
  const sorted=useMemo(()=>[...data].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')),[data]);
  const chart=useMemo(()=>[...data].sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).map(r=>({f:(r.fecha||'').slice(5),p:Number(r.peso)||0})),[data]);
  return(<div className="page"><h2 className="p-title">Peso</h2>
    {chart.length>2&&<div className="card"><div className="card-t">Evolución</div><ResponsiveContainer width="100%" height={180}><AreaChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="#33291F"/><XAxis dataKey="f" stroke="#8B7D6B" fontSize={10}/><YAxis domain={['auto','auto']} stroke="#8B7D6B"/><Tooltip contentStyle={TTS}/><Area type="monotone" dataKey="p" stroke="#9B6BB7" fill="#9B6BB733" name="kg"/></AreaChart></ResponsiveContainer></div>}
    <div className="card lc">{sorted.map((r,i)=><div key={r.id||i} className="list-row"><div className="lr-l"><span style={{fontSize:16,fontWeight:700,color:'#9B6BB7'}}>{r.peso} kg</span></div><div style={{display:'flex',alignItems:'center',gap:12}}><span className="lr-d">{(r.fecha||'').slice(5)}</span>{r.id&&<button className="del-inline" onClick={e=>{e.stopPropagation();if(window.confirm('¿Eliminar?'))save(data.filter(x=>x.id!==r.id))}}>🗑</button>}</div></div>)}</div>
    <Modal open={show} onClose={()=>setShow(false)} title="Peso"><F label="Fecha" value={form.fecha} onChange={v=>setForm({...form,fecha:v})} type="date"/><div className="row-2"><F label="Peso (kg)" value={form.peso} onChange={v=>setForm({...form,peso:v})} type="number" step="0.1"/><F label="Altura" value={form.altura} onChange={v=>setForm({...form,altura:v})} type="number"/></div><F label="% Grasa" value={form.grasa} onChange={v=>setForm({...form,grasa:v})} type="number" step="0.01"/><button className="btn-primary btn-full" onClick={()=>{save([...data,{...form,id:xi()}]);setShow(false)}}>Registrar</button></Modal>
    <Fab onClick={()=>setShow(true)}/>
  </div>);
}

/* ───────── TESTS ───────── */
function TestP({tests,save}){const[showNew,setShowNew]=useState(false);const[detail,setDetail]=useState(null);
  const bl={id:'',fecha:'',nombre:'JOAN LOPEZ',peso:'',gradoRP:'',gradoObj:'',MHT14:'',MED40:'',MAW5:'',OT:'',CF:'',RFD:'',curva:[{i:1,t:''},{i:.85,t:''},{i:.75,t:''},{i:.65,t:''},{i:.55,t:''},{i:.45,t:''},{i:.35,t:''}]};
  const[form,setForm]=useState(bl);const sorted=useMemo(()=>[...tests].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')),[tests]);const latest=sorted[0]||DT;
  const sC=(i,v)=>{const c=[...form.curva];c[i]={...c[i],t:v};setForm({...form,curva:c})};
  const sub=()=>{const p=Number(form.peso)||83,m=Number(form.MAW5)||0,fx=p+m;save([...tests,{...form,id:xi(),fmaxRegleta:fx,cargaRegleta:Number(form.MED40)||16}]);setShowNew(false);setForm(bl)};
  // RFD retest reminder
  const rfdTests=sorted.filter(t=>t.RFD&&Number(t.RFD)>0);
  const lastRFD=rfdTests[0];
  const rfdDays=lastRFD?Math.round((new Date(td())-new Date(lastRFD.fecha+'-01'))/864e5):999;
  return(<div className="page"><div className="p-tr"><h2 className="p-title">Tests ({tests.length})</h2><button className="btn-sm" onClick={()=>{setForm(bl);setShowNew(true)}}>+ Nuevo</button></div>
    {rfdDays>120&&<div className="tendon-banner amber"><span>🔬</span><div style={{fontSize:12}}><b>Re-test RFD pendiente</b><div>Hace {lastRFD?Math.round(rfdDays/30)+' meses':'mucho'} sin medir RFD. Es tu punto ciego — re-testa al cerrar el mesociclo.</div></div></div>}
    <div className="card"><div className="card-t">Actual — {latest.fecha}</div><div className="profile-grid">{[['RP',latest.gradoRP,'a'],['Obj',latest.gradoObj,'r'],['Peso',latest.peso+'kg'],['MHT14',latest.MHT14+'s'],['MED40',latest.MED40+'mm'],['MAW5',latest.MAW5+'kg'],['OT',latest.OT+'%','a'],['CF',latest.CF+'%'],['Fmáx',latest.fmaxRegleta+'kg']].map(([l,v,c])=><div key={l} className="pf"><span className="pf-l">{l}</span><span className={`pf-v${c?' '+c:''}`}>{v}</span></div>)}</div></div>
    {latest.curva?.length>0&&<div className="card"><div className="card-t">Curva Individual</div><ResponsiveContainer width="100%" height={170}><LineChart data={latest.curva.map(c=>({i:c.i,t:c.t||c.tiempo}))}><CartesianGrid strokeDasharray="3 3" stroke="#33291F"/><XAxis dataKey="i" stroke="#8B7D6B" reversed/><YAxis stroke="#8B7D6B"/><Tooltip contentStyle={TTS}/><Line dataKey="t" stroke="#E8A838" strokeWidth={2} name="s"/></LineChart></ResponsiveContainer></div>}
    <div className="card"><div className="card-t">Historial</div>{sorted.map((t,i)=><div key={t.id||i} className="list-row" onClick={()=>setDetail(t)}><div className="lr-l"><span className="lr-e">🧪</span><div><div className="lr-m">{t.fecha} — {t.gradoRP}</div><div className="lr-s">MHT14:{t.MHT14}s · MAW5:{t.MAW5}kg · OT:{t.OT}%</div></div></div><div style={{display:'flex',alignItems:'center',gap:8}}><span className="lr-d">{t.peso}kg</span>{t.id&&i>0&&<button className="del-inline" onClick={e=>{e.stopPropagation();if(window.confirm('¿Eliminar?'))save(tests.filter(x=>x.id!==t.id))}}>🗑</button>}</div></div>)}</div>
    <Modal open={!!detail} onClose={()=>setDetail(null)} title={`Test ${detail?.fecha}`}>{detail&&<div className="profile-grid" style={{gap:12}}>{[['Peso',detail.peso+'kg'],['RP',detail.gradoRP],['Obj',detail.gradoObj],['MHT14',detail.MHT14+'s'],['MED40',detail.MED40+'mm'],['MAW5',detail.MAW5+'kg'],['OT',detail.OT+'%'],['CF',detail.CF+'%'],['RFD',(detail.RFD||'—')],['Fmáx',(detail.fmaxRegleta||'—')+'kg']].map(([l,v])=><div key={l} className="pf"><span className="pf-l">{l}</span><span className="pf-v">{v}</span></div>)}</div>}</Modal>
    <Modal open={showNew} onClose={()=>setShowNew(false)} title="Nuevo Test"><F label="Fecha" value={form.fecha} onChange={v=>setForm({...form,fecha:v})}/><div className="row-2"><F label="Peso" value={form.peso} onChange={v=>setForm({...form,peso:v})} type="number"/><F label="RP" value={form.gradoRP} onChange={v=>setForm({...form,gradoRP:v})}/></div><F label="Obj" value={form.gradoObj} onChange={v=>setForm({...form,gradoObj:v})}/><div className="sh a">Tests Bergua</div><div className="row-2"><F label="MHT14(s)" value={form.MHT14} onChange={v=>setForm({...form,MHT14:v})} type="number"/><F label="MED40(mm)" value={form.MED40} onChange={v=>setForm({...form,MED40:v})} type="number"/></div><div className="row-2"><F label="MAW5(kg)" value={form.MAW5} onChange={v=>setForm({...form,MAW5:v})} type="number"/><F label="OT%" value={form.OT} onChange={v=>setForm({...form,OT:v})} type="number"/></div><div className="row-2"><F label="CF%" value={form.CF} onChange={v=>setForm({...form,CF:v})} type="number"/><F label="RFD (N/s)" value={form.RFD} onChange={v=>setForm({...form,RFD:v})} type="number"/></div><div className="sh a">Curva (s al fallo)</div>{[[0,'100%'],[1,'85%'],[2,'75%'],[3,'65%'],[4,'55%'],[5,'45%'],[6,'35%']].map(([i,l])=><div key={i} className="row-2"><div className="f-wrap"><label className="f-label">{l}</label></div><div className="f-wrap"><input className="f-input" type="number" value={form.curva[i]?.t??''} onChange={e=>sC(i,Number(e.target.value)||'')}/></div></div>)}<button className="btn-primary btn-full" onClick={sub} style={{marginTop:16}}>Guardar</button></Modal>
  </div>);
}

/* ───────── STATS ───────── */
function StP({cal,ent,roca,lib,dp,t25,treg,susp}){const[tab,setTab]=useState('gen');
  const vpa=useMemo(()=>{const c={};lib.forEach(r=>{c[r.anyo]=(c[r.anyo]||0)+1});return Object.entries(c).sort((a,b)=>a[0]-b[0]).map(([a,t])=>({anyo:a,total:t}))},[lib]);
  const apt=useMemo(()=>{const c={};cal.forEach(r=>{if(r.activitat)c[r.activitat]=(c[r.activitat]||0)+1});return Object.entries(c).map(([n,v])=>({name:n,value:v})).sort((a,b)=>b.value-a.value)},[cal]);
  const ts=useMemo(()=>{const c={};roca.forEach(r=>{if(r.lloc)c[r.lloc]=(c[r.lloc]||0)+1});return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([s,v])=>({sector:s,visitas:v}))},[roca]);
  const encN=roca.filter(r=>r.encadene==='SÍ'||r.encadene==='SI'||r.encadene===true).length;
  const suspChart=useMemo(()=>[...susp].sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).map(r=>({f:(r.fecha||'').slice(5),comp:Number(r.completed)||0,loss:Number(r.loss)||0})),[susp]);
  return(<div className="page"><h2 className="p-title">Estadísticas</h2>
    <div className="tabs"><button className={`tb${tab==='gen'?' ac':''}`} onClick={()=>setTab('gen')}>General</button><button className={`tb${tab==='fza'?' ac':''}`} onClick={()=>setTab('fza')}>Fuerza</button><button className={`tb${tab==='susp'?' ac':''}`} onClick={()=>setTab('susp')}>Suspensiones</button><button className={`tb${tab==='esc'?' ac':''}`} onClick={()=>setTab('esc')}>Escalada</button></div>
    {tab==='gen'&&<>{vpa.length>0&&<div className="card"><div className="card-t">Vías/Año</div><ResponsiveContainer width="100%" height={180}><BarChart data={vpa}><CartesianGrid strokeDasharray="3 3" stroke="#33291F"/><XAxis dataKey="anyo" stroke="#8B7D6B"/><YAxis stroke="#8B7D6B"/><Tooltip contentStyle={TTS}/><Bar dataKey="total" fill="#E8A838"/></BarChart></ResponsiveContainer></div>}{apt.length>0&&<div className="card"><div className="card-t">Actividad</div><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={apt} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({name,value})=>`${name.slice(0,6)}(${value})`} labelLine={false} style={{fontSize:9}}>{apt.map((_,i)=><Cell key={i} fill={CL[i%CL.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div>}</>}
    {tab==='fza'&&<>{t25.length>2&&<div className="card"><div className="card-t">25mm</div><ResponsiveContainer width="100%" height={200}><LineChart data={[...t25].sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).map(r=>({f:(r.fecha||'').slice(5),i:Number(r.esq)||0,d:Number(r.dre)||0}))}><CartesianGrid strokeDasharray="3 3" stroke="#33291F"/><XAxis dataKey="f" stroke="#8B7D6B" fontSize={9}/><YAxis stroke="#8B7D6B"/><Tooltip contentStyle={TTS}/><Legend/><Line dataKey="i" stroke="#E8A838" name="Izq" dot={false}/><Line dataKey="d" stroke="#3A8FB7" name="Dch" dot={false}/></LineChart></ResponsiveContainer></div>}{dp.length>2&&<div className="card"><div className="card-t">Peso</div><ResponsiveContainer width="100%" height={160}><AreaChart data={[...dp].sort((a,b)=>(a.fecha||'').localeCompare(b.fecha||'')).map(r=>({f:(r.fecha||'').slice(5),p:Number(r.peso)||0}))}><CartesianGrid strokeDasharray="3 3" stroke="#33291F"/><XAxis dataKey="f" stroke="#8B7D6B"/><YAxis domain={['auto','auto']} stroke="#8B7D6B"/><Tooltip contentStyle={TTS}/><Area dataKey="p" stroke="#9B6BB7" fill="#9B6BB733" name="kg"/></AreaChart></ResponsiveContainer></div>}</>}
    {tab==='susp'&&<>{suspChart.length>1?<><div className="card"><div className="card-t">Series completadas</div><ResponsiveContainer width="100%" height={180}><BarChart data={suspChart}><CartesianGrid strokeDasharray="3 3" stroke="#33291F"/><XAxis dataKey="f" stroke="#8B7D6B" fontSize={9}/><YAxis stroke="#8B7D6B"/><Tooltip contentStyle={TTS}/><Bar dataKey="comp" fill="#E8A838" name="Series"/></BarChart></ResponsiveContainer></div><div className="card"><div className="card-t">Pérdida inter-series %</div><ResponsiveContainer width="100%" height={160}><LineChart data={suspChart}><CartesianGrid strokeDasharray="3 3" stroke="#33291F"/><XAxis dataKey="f" stroke="#8B7D6B" fontSize={9}/><YAxis stroke="#8B7D6B"/><Tooltip contentStyle={TTS}/><Line dataKey="loss" stroke="#D4563A" strokeWidth={2} name="% pérdida"/></LineChart></ResponsiveContainer></div></>:<div className="muted" style={{padding:16}}>Registra sesiones de suspensiones para ver tendencias.</div>}</>}
    {tab==='esc'&&<>{ts.length>0&&<div className="card"><div className="card-t">Top Sectores</div><ResponsiveContainer width="100%" height={220}><BarChart data={ts} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#33291F"/><XAxis type="number" stroke="#8B7D6B"/><YAxis type="category" dataKey="sector" stroke="#8B7D6B" width={80} fontSize={10}/><Tooltip contentStyle={TTS}/><Bar dataKey="visitas" fill="#6B9F4A"/></BarChart></ResponsiveContainer></div>}<div className="card"><div className="card-t">Ratio encadene</div><div className="enc-st"><div className="enc-b"><div className="enc-n g">{encN}</div><div className="enc-lb">Enc.</div></div><div className="enc-b"><div className="enc-n r">{roca.length-encN}</div><div className="enc-lb">Proy.</div></div><div className="enc-b"><div className="enc-n a">{roca.length?Math.round(encN/roca.length*100):0}%</div><div className="enc-lb">Ratio</div></div></div></div></>}
  </div>);
}
