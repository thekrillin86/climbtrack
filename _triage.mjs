/* Contrasta cada hallazgo de la auditoría contra los datos REALES de Juan. */
import fs from 'node:fs';
import { parseRow, td } from './src/lib.js';
import { clasificar, ejerciciosDeBloque, TIPO_POR_ID } from './src/catalogo.js';
import { seriesCarga, cargaPorDetalle, cargaPorActividad, fatigaAcumulada, PARAMS } from './src/carga.js';

const raw = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
const sec = ('\n' + raw.trimStart()).split(/\n(=== \w+ ===)\n/);
const sd = { cal: [], ent: [], roca: [], lib: [], t25: [], treg: [], dp: [], tests: [] };
const km = { '=== Calendario ===': 'cal', '=== Entrenamientos ===': 'ent', '=== SortidesRoca ===': 'roca',
  '=== Libreta ===': 'lib', '=== Tindeq25mm ===': 't25', '=== TindeqRegleta ===': 'treg',
  '=== DatosPersonales ===': 'dp', '=== Tests ===': 'tests' };
for (let i = 0; i < sec.length; i++) {
  const k = km[sec[i]?.trim()]; if (!k) continue;
  const ls = (sec[i + 1] || '').trim().split('\n').filter(l => l.trim()); if (ls.length < 2) continue;
  const h = parseRow(ls[0]);
  for (let j = 1; j < ls.length; j++) {
    const v = parseRow(ls[j]); const o = {}; h.forEach((x, idx) => { o[x.trim()] = v[idx] || '' });
    for (const f of ['bloques', 'agarres']) {
      if (typeof o[f] !== 'string' || !o[f]) continue;
      const s = o[f].trim();
      if (s.startsWith('[') || s.startsWith('"[')) { try { o[f] = JSON.parse(s.replace(/^"+|"+$/g, '')) } catch {} }
      else if (f === 'agarres') o[f] = s.split(',').map(x => x.trim()).filter(Boolean);
    }
    sd[k].push(o);
  }
}
const HOY = td();
const L = s => console.log(s);
L(`CSV del 19-08 · ${Object.entries(sd).map(([k,v])=>`${k}=${v.length}`).join(' · ')} · total ${Object.values(sd).reduce((n,v)=>n+v.length,0)}\n`);

/* ---------- A1: ejercicios sin clasificar y minutos que se evaporan ---------- */
L('=== A1 · ejercicios SIN_CLASIFICAR en sus datos reales ===');
const sinCls = {}; let minPerdidos = 0, minTotales = 0, diasCero = [];
for (const e of sd.ent) {
  let bl = e.bloques; if (typeof bl === 'string') { try { bl = JSON.parse(bl) } catch { continue } }
  if (!Array.isArray(bl)) continue;
  let algunoClasifica = false;
  for (const b of bl) {
    const ejs = ejerciciosDeBloque(b); if (!ejs.length) { minTotales += Number(b.minutos)||0; minPerdidos += Number(b.minutos)||0; continue; }
    const min = Number(b.minutos) || 0; minTotales += min;
    const cuota = min / ejs.length;
    for (const ej of ejs) {
      if (TIPO_POR_ID[ej.tipo]) { algunoClasifica = true; continue }
      sinCls[ej.nombre] = (sinCls[ej.nombre] || 0) + 1;
      minPerdidos += cuota;
    }
  }
  const c = cargaPorDetalle(e);
  if (c && c.dedos === 0 && c.cuerpo === 0 && c.sistemico === 0) diasCero.push(e.fecha);
}
L(`  ejercicios distintos sin clasificar: ${Object.keys(sinCls).length}`);
for (const [n, c] of Object.entries(sinCls).sort((a,b)=>b[1]-a[1]).slice(0,12)) L(`     "${n}" x${c}`);
L(`  minutos perdidos: ${Math.round(minPerdidos)} de ${Math.round(minTotales)} (${(minPerdidos/minTotales*100).toFixed(1)} %)`);
L(`  sesiones con detalle que dan CERO en los tres canales: ${diasCero.length}${diasCero.length?' -> '+diasCero.join(', '):''}`);

/* ---------- A2: ediciones que no cuentan (ejerciciosCat desincronizado) ---------- */
L('\n=== A2 · bloques cuyo ejerciciosCat NO coincide con ejercicios ===');
let desinc = 0, revisados = 0;
for (const e of sd.ent) {
  let bl = e.bloques; if (typeof bl === 'string') { try { bl = JSON.parse(bl) } catch { continue } }
  for (const b of bl || []) {
    if (!Array.isArray(b.ejerciciosCat) || !Array.isArray(b.ejercicios)) continue;
    revisados++;
    const a = b.ejercicios.map(x => String(x).trim()).join('|');
    const c = b.ejerciciosCat.map(x => String(x.textoOriginal ?? x.nombre).trim()).join('|');
    if (a !== c) { desinc++; if (desinc <= 5) L(`     ${e.fecha}: ejercicios[${a}] vs cat[${c}]`); }
  }
}
L(`  ${desinc} desincronizados de ${revisados} bloques con las dos listas`);

/* ---------- B1: la ventana tendinosa se dispara con dias sin dedos de verdad ---------- */
L('\n=== B1 · que dispara la ventana tendinosa (c.dedos > 0) ===');
const ser = seriesCarga(sd.cal, sd.ent);
const ult7 = Object.entries(ser).filter(([f]) => { const d = (new Date(HOY)-new Date(f))/86400000; return d>=0 && d<=7 })
  .sort(([a],[b]) => a<b?-1:1);
for (const [f, c] of ult7) {
  const act = sd.cal.filter(d => d.fecha===f).map(d=>d.activitat).join(' + ') || '—';
  L(`  ${f}  dedos ${String(c.dedos).padStart(5)}  ${c.dedos>0?'<-- CUENTA como carga de dedos':''}  ${act}`);
}
const conDedos = ult7.filter(([,c])=>c.dedos>0);
const ultimaCarga = conDedos.length ? conDedos[conDedos.length-1][0] : null;
L(`  -> ultima "carga de dedos": ${ultimaCarga} · dedos=${ultimaCarga?ser[ultimaCarga].dedos:'-'} · dias desde hoy: ${ultimaCarga?Math.round((new Date(HOY)-new Date(ultimaCarga))/86400000):'-'}`);
L(`  -> sesiones (dias) contadas: ${conDedos.length}`);

/* ---------- B2/B3/B4: el test que compara la pantalla ---------- */
L('\n=== B2/B3/B4 · que registro coge compararTest ===');
const todos = [...sd.treg, ...sd.t25].filter(r => r.fecha && Number(r.esq) > 0)
  .sort((a,b)=> a.fecha<b.fecha?-1:a.fecha>b.fecha?1:0);
const ultimo = todos[todos.length-1];
L(`  ultimo: ${JSON.stringify(ultimo)}`);
const mm = String(ultimo.mm||'?');
const desde = new Date(ultimo.fecha); desde.setDate(desde.getDate()-60);
const base = todos.filter(r => String(r.mm)===mm && r!==ultimo && new Date(r.fecha)>=desde);
L(`  base: ${base.length} registros de ${mm} mm`);
L(`  momentos en la base: ${JSON.stringify(base.map(r=>r.momento||'(vacio)').reduce((a,m)=>{a[m]=(a[m]||0)+1;return a},{}))}`);
L(`  registros de treg con una sola mano: ${sd.treg.filter(r=>(Number(r.esq)>0)!==(Number(r.dre)>0)).length}`);
L(`  registros de treg con momento=post: ${sd.treg.filter(r=>r.momento==='post').length}`);
L(`  tamanos de regleta presentes: ${JSON.stringify([...new Set(sd.treg.map(r=>r.mm).filter(Boolean))])}`);

/* ---------- A8: porcentajes con decimales ---------- */
L('\n=== A8 · porcentajes con decimal en el texto de los ejercicios ===');
const conDec = new Set();
for (const e of sd.ent) { let bl=e.bloques; if(typeof bl==='string'){try{bl=JSON.parse(bl)}catch{continue}}
  for (const b of bl||[]) for (const x of (b.ejercicios||[])) if (/\d+[.,]\d+\s*%/.test(String(x))) conDec.add(String(x)); }
L(`  ${conDec.size} ${conDec.size?'-> '+[...conDec].join(' · '):'(ninguno)'}`);

/* ---------- A14: actividades del calendario sin coeficiente ---------- */
L('\n=== A14 · actividades del calendario que no casan con ningun coeficiente ===');
const huerfanas = {};
for (const d of sd.cal) {
  const a = (d.activitat||'').trim().toLowerCase(); if (!a) continue;
  if (!Object.keys(PARAMS.porActividad).some(k => a.includes(k))) huerfanas[d.activitat] = (huerfanas[d.activitat]||0)+1;
}
L(`  ${Object.keys(huerfanas).length ? JSON.stringify(huerfanas) : '(ninguna: todas casan)'}`);

/* ---------- A9: fechas no ISO ---------- */
L('\n=== A9 · fechas no parseables ===');
const malas = [];
for (const [k, arr] of Object.entries(sd)) for (const r of arr)
  if (r.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(r.fecha)) malas.push(`${k}:${r.fecha}`);
L(`  ${malas.length ? malas.slice(0,10).join(', ') : '(ninguna)'}`);
L(`  fatigaAcumulada hoy: ${JSON.stringify(fatigaAcumulada(ser, HOY))}`);
