/**
 * ClimbTrack · el plan de la semana de Talaia (lógica pura, sin React)
 * archivo nuevo: src/plan.js (18-11-2026)
 *
 * De dónde sale: cada domingo Talaia deja `talaia-plan.json` en la carpeta de
 * Drive «Talaia · ClimbTrack»; el Apps Script del puente lo copia cada hora a
 * Firestore, `usuarios/{uid}/plan/actual` ({ json, semana, origen, ts }). La
 * app SOLO lo lee (nube.js → leerPlan), igual que la bandeja, y guarda una
 * copia en este navegador para verlo sin red. El plan no es un dato suyo: no
 * entra en ct5_* ni en la copia de la nube.
 *
 * Reglas (encargo del 18-11-2026):
 *  - Kilos = % del plan × su último test TIRANDO HACIA ARRIBA de esa mano y a
 *    esos mm, redondeado a 0,5 kg. Cada mano con su test, nunca un total
 *    repartido (la derecha trabaja con tres dedos). Los tests de la app mandan;
 *    los que trae el plan son solo respaldo. Si no hay ninguno, se dice.
 *  - Los tests de la app están en NEWTONS (decisión de Juan del 18-11-2026) y
 *    se pasan a kilos con kgDeN.
 *  - «Hecho» solo RELLENA el formulario de entreno de siempre. Guarda él, con
 *    el mismo save que un registro escrito a mano.
 *  - Sin predicciones ni puntuaciones: solo lo planificado y lo hecho.
 */
import { modoDe, kgDeN } from './tindeq.js';

export const TIPOS_DIA = ['Rocòdrom', 'Suspensions/Dominades', 'Gimnàs'];
export const TIPOS_BLOQUE = ['General', 'Específica'];
const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const str = v => (v === null || v === undefined ? '' : String(v));
const num = v => (Number.isFinite(Number(v)) && v !== '' && v !== null ? Number(v) : '');

/* ------------------------------------------------------------------
   Leer el plan sin que nada pueda tumbar la pantalla
   ------------------------------------------------------------------ */
function dosisDe(d) {
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const pct = Number(d.pct), mm = Number(d.mm);
    if (pct > 0 && pct <= 150 && mm > 0 && mm <= 60) return { pct, mm };
    return '';
  }
  return str(d);
}

function itemDe(it) {
  // [texto que se enseña, dosis, nombre para ClimbTrack (opcional)]
  if (Array.isArray(it)) return { txt: str(it[0]), dosis: dosisDe(it[1]), nombre: str(it[2]).trim() };
  if (it && typeof it === 'object') return { txt: str(it.txt ?? it.t), dosis: dosisDe(it.dosis), nombre: str(it.nombre).trim() };
  return { txt: str(it), dosis: '', nombre: '' };
}

function bloqueDe(b) {
  return {
    t: str(b?.t),
    tipoCT: TIPOS_BLOQUE.includes(b?.tipoCT) ? b.tipoCT : 'Específica',
    minutos: num(b?.minutos),
    series: num(b?.series),
    items: Array.isArray(b?.items) ? b.items.map(itemDe).filter(i => i.txt || i.nombre) : [],
  };
}

function diaDe(d) {
  const bloques = Array.isArray(d.bloques) ? d.bloques.filter(b => b && typeof b === 'object').map(bloqueDe) : [];
  return {
    dia: str(d.dia), fecha: d.fecha, nota: str(d.nota), hora: str(d.hora), ses: str(d.ses),
    tipoCT: TIPOS_DIA.includes(d.tipoCT) ? d.tipoCT : '',
    descanso: !!d.descanso || !bloques.length,
    bloques,
  };
}

/** Lee el plan (texto JSON u objeto). Devuelve { plan } o { error }. Nunca lanza. */
export function leerPlanTexto(texto) {
  let p;
  try { p = typeof texto === 'string' ? JSON.parse(texto) : texto; } catch { return { error: 'El plan no se puede leer: no es un JSON válido.' }; }
  if (!p || typeof p !== 'object' || Array.isArray(p)) return { error: 'El plan está vacío.' };
  if (typeof p.id !== 'string' || !ES_FECHA.test(p.id)) return { error: 'El plan no dice de qué semana es (falta el id AAAA-MM-DD).' };
  if (!Array.isArray(p.dias) || !p.dias.length) return { error: 'El plan no trae ningún día.' };
  // Un día roto (sin fecha) no tumba los demás: se salta.
  const dias = p.dias.filter(d => d && typeof d === 'object' && ES_FECHA.test(str(d.fecha))).map(diaDe)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (!dias.length) return { error: 'Ningún día del plan tiene fecha.' };
  return {
    plan: {
      id: p.id, titulo: str(p.titulo), fase: str(p.fase), nota: str(p.nota),
      tests: p.tests && typeof p.tests === 'object' && !Array.isArray(p.tests) ? p.tests : {},
      dias,
    },
  };
}

/* ------------------------------------------------------------------
   Kilos por mano
   ------------------------------------------------------------------ */
export const medioKg = x => Math.round(x * 2) / 2;

/** Último test TIRANDO HACIA ARRIBA de una mano a esos mm. Los «post» (dedos ya
 *  cansados) no sirven de referencia para cargar. */
export function testArriba(treg, t25, mm, mano) {
  const campo = mano === 'izq' ? 'esq' : 'dre';
  const r = [...(treg || []), ...(t25 || [])]
    .filter(x => x && x.fecha && Number(x.mm) === Number(mm) && modoDe(x) === 'arriba' && x.momento !== 'post' && Number(x[campo]) > 0)
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))[0];
  return r ? { n: Number(r[campo]), kg: kgDeN(r[campo]), fecha: r.fecha } : null;
}

/** Test de respaldo que trae el plan (t15i, t25d…), en kilos. Si un número
 *  pasa de 200 es que viene en newtons: nadie tira 200 kg con una mano. */
function testDelPlan(tests, mm, mano) {
  const v = Number(tests?.[`t${mm}${mano === 'izq' ? 'i' : 'd'}`]);
  if (!(v > 0)) return null;
  return { kg: v > 200 ? kgDeN(v) : v, enNewtons: v > 200, fecha: tests?.fecha || null };
}

/** Kilos de una dosis {pct, mm} para una mano. */
export function kilosMano(dosis, mano, treg, t25, testsPlan) {
  const t = testArriba(treg, t25, dosis.mm, mano);
  if (t) return { kg: medioKg((dosis.pct / 100) * t.kg), de: 'app', test: t };
  const p = testDelPlan(testsPlan, dosis.mm, mano);
  if (p) return { kg: medioKg((dosis.pct / 100) * p.kg), de: 'plan', test: p };
  return { kg: null, de: null, falta: `falta el test tirando hacia arriba a ${dosis.mm} mm` };
}

/* ------------------------------------------------------------------
   «Hecho»: el formulario de entreno, rellenado
   ------------------------------------------------------------------ */
/** «8:00-9:15» → «08:00». Lo que no sea una hora se queda vacío. */
export function horaInicio(h) {
  const m = /^\s*(\d{1,2})[:.h](\d{2})/.exec(str(h));
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return '';
  return `${m[1].padStart(2, '0')}:${m[2]}`;
}

export const marcaPlan = id => 'plan:' + id;

/** Macro y meso del último registro escrito por él (sin `origen`: ni de la
 *  bandeja ni del plan). Primero entrenos; si no hay, la rutina diaria. */
export function cicloPropio(ent, cal) {
  for (const lista of [ent, cal]) {
    const r = [...(lista || [])].filter(x => x && !x.origen && (x.macro || x.meso))
      .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))[0];
    if (r) return { macro: r.macro ?? '', meso: r.meso ?? '' };
  }
  return { macro: '', meso: '' };
}

/** Lo que «Hecho» mete en el formulario. RPE y fatiga final, vacíos: los pone él. */
export function rellenarEntreno(dia, plan, ent, cal, nuevoId) {
  const c = cicloPropio(ent, cal);
  return {
    fecha: dia.fecha, hora: horaInicio(dia.hora), tipo: dia.tipoCT || '',
    macro: c.macro, meso: c.meso,
    bloques: dia.bloques.map(b => {
      const ejercicios = b.items.map(i => i.nombre).filter(Boolean);
      return { id: nuevoId(), tipo: b.tipoCT, ejercicios: ejercicios.length ? ejercicios : [''],
               series: b.series, minutos: b.minutos, rpe: '', agarres: [] };
    }),
    fatiga_ini: 1, fatiga_fin: '',
    origen: marcaPlan(plan.id),
  };
}

/** ¿Ya hay algo apuntado ese día? (un entreno o la rutina diaria) */
export function apuntado(fecha, ent, cal) {
  return (ent || []).some(r => r && r.fecha === fecha) || (cal || []).some(r => r && r.fecha === fecha);
}

/* ------------------------------------------------------------------
   Copia local, para verlo sin red. En este navegador, no en sus datos.
   ------------------------------------------------------------------ */
const CLAVE_LOCAL = 'climbtrack-plan';
export function planGuardado() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const x = JSON.parse(localStorage.getItem(CLAVE_LOCAL) || 'null');
    return x && typeof x.texto === 'string' ? x : null;
  } catch { return null; }
}
export function guardarPlan(doc) {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(CLAVE_LOCAL, JSON.stringify(doc)); } catch { /* sin almacenamiento: dura la sesión */ }
}
