// ───────────────────────── ClimbTrack core library
export const DT={id:'t0',fecha:"2026-01",nombre:"JOAN LOPEZ",peso:83,gradoRP:"7B",gradoIRCRA_RP:19,gradoObj:"7C+",gradoIRCRA_Obj:22,MHT14:31,MED40:16,MAW5:20,OT:65,CF:48,curva:[{i:1,t:5},{i:.85,t:32},{i:.75,t:43},{i:.65,t:53},{i:.55,t:80},{i:.45,t:90},{i:.35,t:110}],cargaRegleta:16,fmaxRegleta:103,intensidades:[]};
export const xi=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
export const td=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().split('T')[0]};
export const CL=['#E8A838','#D4563A','#3A8FB7','#6B9F4A','#9B6BB7','#C4724E','#4A9F9F','#B75F8E'];
export const GO=['5a','5a+','5b','5b+','5c','5c+','6a','6a+','6b','6b+','6c','6c+','7a','7a+','7b','7b+','7c','7c+','8a','8a+','8b'];
export const MS={Enero:1,Febrero:2,Marzo:3,Abril:4,Mayo:5,Junio:6,Julio:7,Agosto:8,Septiembre:9,Octubre:10,Noviembre:11,Diciembre:12};
export const ACTS=['Rocòdrom','Roca','Suspensions/Dominades','Fisio','Descans','Gimnàs','Yoga','Cardio','Mobilitat/Estiraments'];
export const AI={'Rocòdrom':'🧱','Roca':'🏔️','Suspensions/Dominades':'💪','Fisio':'🩹','Descans':'😴','Gimnàs':'🏋️','Yoga':'🧘','Cardio':'🏃','Mobilitat/Estiraments':'🤸'};
export const GR=['5c','5c+','6a','6a+','6b','6b+','6c','6c+','7a','7a+','7b','7b+','7c','7c+','8a','8a+'];
export const TTS={background:'#1E1A15',border:'1px solid #33291F',borderRadius:8,color:'#E8D5B5',fontSize:11};

export async function ld(k,f=[]){try{const r=await window.storage.get(k);return r?JSON.parse(r.value):f}catch{return f}}
let _alGuardar=null;
/** Registra un observador de guardados. Lo usa nube.js. Nunca al reves. */
export function alGuardarEnNube(fn){_alGuardar=fn}
export async function sv(k,d){
  try{await window.storage.set(k,JSON.stringify(d))}catch(e){console.error(e)}
  // La nube va DESPUES y aparte: un fallo de red jamas rompe un guardado local.
  if(_alGuardar){try{_alGuardar(k,d)}catch(e){console.warn('[nube]',e)}}
}
export function pRpe(s){if(!s||s==='')return[];if(Array.isArray(s))return s;return String(s).split('|').map(Number).filter(n=>!isNaN(n)&&n>0)}
export function rpeStr(a){return(a||[]).join('|')}
export function rpeAvg(a){const x=pRpe(a);return x.length?Math.round(x.reduce((s,v)=>s+v,0)/x.length*10)/10:null}
export function rpeMax(a){const x=pRpe(a);return x.length?Math.max(...x):null}
export function calcFL(tri,trd,tp,dp){const pre=(Number(tri)||0)+(Number(trd)||0),post=(Number(tp)||0)+(Number(dp)||0);return pre&&post?Math.round((1-post/pre)*1000)/10:null}

// ───────────────────────── BANISTER (climbing-calibrated) + EWMA ACWR
// Load = RPE×min (bloques) overrides fatiga_fin×actW (calendar history)
// τ₁=42 fitness, τ₂=7 fatigue. ACWR via EWMA per 2024-25 literature.
export const TAU1=42, TAU2=7, DC=Math.exp(-1/TAU1), DA=Math.exp(-1/TAU2);
export function actW(a){
  if(!a)return 20;const l=a.trim().toLowerCase();
  if(l.includes('roca')&&!l.includes('rocò'))return 100;
  if(l.includes('rocò'))return 90;
  if(l.includes('susp'))return 80;
  if(l.includes('gimn'))return 25;
  if(l.includes('cardio'))return 20;
  if(l.includes('yoga'))return 10;
  if(l.includes('mobil'))return 8;
  return 20;
}
export function calcBanister(cal,ent){
  const lbd={};
  cal.forEach(r=>{if(!r.fecha)return;const ff=Number(r.fatiga_fin);if(!ff||!isFinite(ff)||ff<=0||ff>10)return;
    const al=(r.activitat||'').trim().toLowerCase();if(al==='descans'||al==='fisio')return;
    lbd[r.fecha]=(lbd[r.fecha]||0)+ff*actW(r.activitat)});
  ent.forEach(r=>{if(!r.fecha)return;if(r.bloques&&Array.isArray(r.bloques)){
    const load=r.bloques.reduce((s,b)=>s+(Number(b.carga)||0),0);if(load>0)lbd[r.fecha]=load}});
  const dates=Object.keys(lbd).sort();
  if(!dates.length)return{series:[],today:{ctl:0,atl:0,tsb:0},predictions:[],peakDay:null,acwr:1,monotony:0,strain:0};
  const start=new Date(dates[0]),end=new Date(td()),series=[];let ctl=0,atl=0,ewmaA=0,ewmaC=0;
  const aA=2/(7+1), aC=2/(28+1); // EWMA smoothing factors
  for(let d=new Date(start);d<=end;d.setDate(d.getDate()+1)){const k=d.toISOString().split('T')[0],load=lbd[k]||0;
    ctl=ctl*DC+load*(1-DC);atl=atl*DA+load*(1-DA);
    ewmaA=load*aA+ewmaA*(1-aA);ewmaC=load*aC+ewmaC*(1-aC);
    series.push({fecha:k,f:k.slice(5),ctl:Math.round(ctl),atl:Math.round(atl),tsb:Math.round(ctl-atl),load,ewmaA,ewmaC})}
  const today=series.length?series[series.length-1]:{ctl:0,atl:0,tsb:0,ewmaA:0,ewmaC:0};
  const preds=[];let pc=today.ctl,pa=today.atl;
  for(let i=1;i<=14;i++){pc*=DC;pa*=DA;const fd=new Date(end);fd.setDate(fd.getDate()+i);
    preds.push({fecha:fd.toISOString().split('T')[0],f:'+'+i+'d',ctl:Math.round(pc),atl:Math.round(pa),tsb:Math.round(pc-pa),tsbP:Math.round(pc-pa)})}
  const peakDay=preds.length?preds.reduce((b,p)=>p.tsb>b.tsb?p:b,preds[0]):null;
  // ACWR via EWMA (per Williams/Menaspà 2024-25 — gives more weight to recent load)
  const acwr=today.ewmaC>0?Math.round(today.ewmaA/today.ewmaC*100)/100:1;
  const l7=series.slice(-7).map(s=>s.load),m7=l7.reduce((a,b)=>a+b,0)/7,std7=Math.sqrt(l7.reduce((a,b)=>a+(b-m7)**2,0)/7);
  const monotony=m7>0?Math.round(m7/(std7||1)*100)/100:0,strain=Math.round(m7*7*monotony);
  return{series:series.slice(-90),predictions:preds,today,peakDay,acwr,monotony,strain};
}

// ───────────────────────── TENDON RECOVERY WINDOW (72-96h)
// Per Breda 2024 (collagen synthesis), Docking&Cook, Baar.
// All finger-loading activities stress the FDP/FDS tendons & pulleys:
// suspensions, bouldering (rocòdrom) and rock. Intensity scales the window.
// fingerLoad: relative tendon stress per activity (suspensions highest per minute,
// but hard bouldering/rock with repeated crimping is comparable).
export function fingerLoad(act,ff){
  if(!act)return 0;const l=act.trim().toLowerCase();
  const fat=Number(ff)||1; // fatiga_fin as intensity proxy (1-10)
  if(l.includes('susp'))return 1.0*fat;      // suspensions: max tendon-specific load
  if(l.includes('rocò')||l.includes('rocod'))return 0.85*fat; // bouldering: high crimp load
  if(l.includes('roca'))return 0.80*fat;     // rock: sustained + crux crimps
  return 0; // gym/cardio/yoga don't load fingers
}
// Serie diaria de carga de dedos (calendario + entrenamientos)
function fingerSeries(cal,ent){
  const byDay={};
  cal.forEach(r=>{if(!r.fecha)return;const l=fingerLoad(r.activitat,r.fatiga_fin);if(l>0)byDay[r.fecha]=Math.max(byDay[r.fecha]||0,l)});
  ent.forEach(r=>{if(!r.fecha)return;const l=fingerLoad(r.tipo,r.fatiga_fin);if(l>0)byDay[r.fecha]=Math.max(byDay[r.fecha]||0,l)});
  return byDay;
}

// VENTANA TENDINOSA v2 — ahora considera CARGA ACUMULADA, no solo la última sesión.
// Base: J Exp Biol 2023 (carga cíclica alta consecutiva acumula microdaño más rápido
// de lo que el tejido repara; el efecto persistía incluso tras 48h de descanso) +
// Sports Medicine 2024 "From Tissue to System" (ventanas según tipo de estrés) +
// revisiones de poleas 2025-26 (la gestión de carga acumulada es la prevención clave).
export function tendonAlert(cal,ent){
  const today=new Date(td());
  const byDay=fingerSeries(cal,ent);
  const days=Object.keys(byDay).sort();
  if(!days.length)return null;

  // 1. Tiempo desde la última carga de dedos
  const lastDay=days[days.length-1];
  const hrs=(today-new Date(lastDay))/36e5;
  if(hrs<0)return null;
  const lastLoad=byDay[lastDay];
  const lastAct=[...cal,...ent].filter(r=>r.fecha===lastDay).map(r=>r.activitat||r.tipo).filter(Boolean)[0]||'carga de dedos';

  // 2. Carga acumulada: aguda (7d) vs crónica (media semanal de 28d)
  const dAgo=n=>new Date(today.getTime()-n*864e5).toISOString().split('T')[0];
  const sumRange=n=>days.filter(d=>d>dAgo(n)).reduce((s,d)=>s+byDay[d],0);
  const acute7=sumRange(7);
  const chronic28=sumRange(28)/4;
  const ratio=chronic28>0?Math.round(acute7/chronic28*100)/100:1;
  const sesiones7=days.filter(d=>d>dAgo(7)).length;

  // 3. Ventana base según intensidad de la última sesión
  let win = lastLoad>=3.5?96 : lastLoad>=2?72 : 48;
  let acum='';
  if(ratio>1.5){win+=24;acum=` Carga de dedos 7d muy elevada (${ratio}× tu media): el tejido repara más lento tras picos.`}
  else if(ratio>1.3){win+=12;acum=` Carga de dedos 7d algo elevada (${ratio}× tu media).`}
  const mid=Math.max(24,win-24);

  const base={hrs:Math.round(hrs),act:lastAct,ratio,acute7:Math.round(acute7),sesiones7,win};
  if(hrs<mid)return{...base,level:'red',
    msg:`Solo ${Math.round(hrs)}h desde "${lastAct}". Tendones (FDP/FDS) y poleas en recuperación incompleta.${acum} Evita cargar dedos hoy.`};
  if(hrs<win)return{...base,level:'amber',
    msg:`${Math.round(hrs)}h desde "${lastAct}". Recuperación aceptable pero no óptima.${acum} Para máximo rendimiento espera a ${win}h.`};
  return{...base,level:'green',
    msg:`${Math.round(hrs)}h desde "${lastAct}". Tendones recuperados (ventana ${win}h cumplida). Condiciones óptimas para cargar dedos.`};
}

export function calcReadiness(ban,cal,t25){
  const sc={};sc.forma=Math.min(100,Math.max(0,50+ban.today.tsb/3));
  const last3=[...cal].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')).slice(0,3);
  const ss=last3.map(r=>{const h=Number(r.sueno_horas)||0,q=Number(r.sueno_calidad)||0,b=Number(r.bienestar)||0;if(!h&&!q&&!b)return null;return Math.min(h/8,1)*30+(q/5)*35+(b/5)*35}).filter(x=>x!==null);
  sc.recuperacion=ss.length?Math.round(ss.reduce((a,b)=>a+b,0)/ss.length):50;
  const t25s=[...t25].sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  if(t25s.length>=4){const r4=t25s.slice(0,4).map(r=>(Number(r.esq)||0)+(Number(r.dre)||0));const p4=t25s.slice(4,8).map(r=>(Number(r.esq)||0)+(Number(r.dre)||0));const a=r4.reduce((a,b)=>a+b,0)/4;const b=p4.length?p4.reduce((a,b)=>a+b,0)/p4.length:a;sc.fuerza=Math.min(100,Math.max(0,70+((a-b)/(b||1))*300))}else sc.fuerza=50;
  const dA=n=>new Date(Date.now()-n*864e5).toISOString().split('T')[0];
  const rc=cal.filter(r=>r.fecha>=dA(7)&&r.fatiga_fin);sc.fatiga=rc.length?Math.max(0,Math.min(100,130-(rc.reduce((s,r)=>s+(Number(r.fatiga_fin)||0),0)/rc.length)*15)):70;
  const total=Math.round(sc.forma*.4+sc.recuperacion*.25+sc.fuerza*.2+sc.fatiga*.15);
  const label=total>=80?'Óptimo':total>=65?'Bueno':total>=50?'Normal':total>=35?'Cansado':'Recuperar';
  const color=total>=80?'#6B9F4A':total>=65?'#E8A838':total>=50?'#C4724E':total>=35?'#D4563A':'#9B3A3A';
  return{total,label,color,scores:sc};
}

// ───────────────────────── CSV import/export
export function parseRow(line){const r=[];let cur='',inQ=false;for(let c=0;c<line.length;c++){const ch=line[c];if(inQ){if(ch==='"'&&line[c+1]==='"'){cur+='"';c++}else if(ch==='"'){inQ=false}else{cur+=ch}}else{if(ch==='"'){inQ=true}else if(ch===','){r.push(cur);cur=''}else{cur+=ch}}}r.push(cur);return r}

// ───────────────────────── CAMPOS QUE VIAJAN COMO JSON EN EL CSV
// UNA sola lista, usada por el export y por el import. Tenerla escrita dos
// veces ya ha costado dos bugs de perdida de datos: 'agarres' (16-08-2026) y
// 'suunto' (19-08-2026). El de suunto ademas tenia un segundo fallo: el
// guardia del export era Array.isArray y suunto es un OBJETO, asi que salia
// como el texto "[object Object]" y 30 dias de datos del reloj se perdian al
// restaurar. Si anades un campo que no sea texto plano, va aqui y solo aqui.
export const CAMPOS_JSON = ['bloques','curva','intensidades','series_data','contractions','agarres','suunto'];

// ───────────────────────── REGLETA / EDGE
// Devuelve el último tamaño de regleta usado (mm), para no fijar ningún valor por defecto.
// Si no hay historial, cae a 20mm (estándar de referencia en la literatura).
export function lastEdge(treg,fallback=20){
  const s=[...(treg||[])].filter(r=>r&&r.mm&&Number(r.mm)>0).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  return s.length?Number(s[0].mm):fallback;
}
// Lista de tamaños de regleta presentes en el historial, ordenados desc.
export function edgeSizes(treg){
  return [...new Set((treg||[]).map(r=>Number(r.mm)).filter(n=>n>0))].sort((a,b)=>b-a);
}

// ───────────────────────── SUSPENSIONS BERGUA MODULE
// Auto-MVC: pulls most recent Tindeq value, calculates target load at intensity%.
// Warns if MVC is stale (>7d). Tracks completed vs programmed sets + inter-set loss.
export function lastMVC(t25, side){ // side: 'esq'|'dre'
  const sorted=[...t25].filter(r=>r[side]&&Number(r[side])>0).sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||''));
  if(!sorted.length)return null;
  const top=sorted[0];
  const daysOld=Math.round((new Date(td())-new Date(top.fecha))/864e5);
  return{value:Math.round(Number(top[side])),fecha:top.fecha,daysOld};
}
export function targetLoad(mvcN, intensityPct){
  if(!mvcN||!intensityPct)return null;
  return Math.round(mvcN*intensityPct/100);
}
// Inter-set force loss: array of peak N per set → % drop from first to last completed
export function interSetLoss(peaks){
  const valid=peaks.map(Number).filter(n=>!isNaN(n)&&n>0);
  if(valid.length<2)return null;
  return Math.round((1-valid[valid.length-1]/valid[0])*1000)/10;
}

// ───────────────────────── AUTO-BACKUP
// Tracks last backup date. Returns days since, and whether overdue (>7d).
export async function backupStatus(){
  const last=await ld('ct5_lastBackup', null);
  if(!last)return{days:null,overdue:true,never:true};
  const days=Math.round((new Date(td())-new Date(last))/864e5);
  return{days,overdue:days>=7,never:false,last};
}
export async function markBackup(){await sv('ct5_lastBackup', td())}

// ───────────────────────── CRITICAL FORCE / W' TEST
// Protocol per Giles 2021 + Baláš 2024: 7s max : 3s rest, ~4-5 min.
// CF = mean of last 6 contractions. W' = impulse above CF.
export function calcCFW(contractions){ // array of peak N per 7s rep
  const v=contractions.map(Number).filter(n=>!isNaN(n)&&n>0);
  if(v.length<12)return null; // need enough reps for plateau
  const last6=v.slice(-6);
  const cf=Math.round(last6.reduce((a,b)=>a+b,0)/6);
  // W' = sum of (force - CF) × 7s for contractions above CF, in N·s
  let wPrime=0;
  v.forEach(f=>{if(f>cf)wPrime+=(f-cf)*7});
  return{cf,wPrime:Math.round(wPrime),reps:v.length,peak:Math.max(...v)};
}
