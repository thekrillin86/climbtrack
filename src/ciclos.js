/**
 * ClimbTrack · macrociclos y mesociclos
 * archivo nuevo: src/ciclos.js
 *
 * Dos cosas:
 *   1. La migración 5, que corrige cinco registros mal etiquetados.
 *   2. El análisis por ciclo, SIEMPRE normalizado por semana.
 *
 * Por qué por semana y no en total: sus mesociclos duran entre 13 y 67
 * días. Comparar totales entre uno de 67 y otro de 13 no compara nada,
 * solo dice cuál duró más.
 */

import { seriesCarga } from './carga.js';

/* ------------------------------------------------------------------
   MIGRACIÓN 5 · corrige cinco registros concretos
   Cada corrección solo se aplica si el valor actual es el que esperamos.
   Si ya está arreglado, no toca nada. Se puede ejecutar mil veces.
   ------------------------------------------------------------------ */
const CORRECCIONES = [
  { id: 'cal_372',        campo: 'fecha', de: '2024-05-25', a: '2025-05-25',
    porque: 'ano mal escrito: el resto del meso 1/4 va de abril a junio de 2025' },
  { id: 'mqmj1p4ure2hd',  campo: 'meso',  de: '7', a: '4',
    porque: 'meso 2/7 no existe; los dias vecinos son 2/4' },
  { id: 'mqxpubz2u1mis',  campo: 'meso',  de: '7', a: '4',
    porque: 'meso 2/7 no existe; los dias vecinos son 2/4' },
  { id: 'mreuohyl61soc',  campo: 'meso',  de: '8', a: '5',
    porque: 'meso 2/8 no existe; los dias vecinos son 2/5' },
  { id: 'msjf73n7aj57v',  campo: 'meso',  de: '5', a: '6',
    porque: 'el 6 y el 8 de agosto son meso 6; este se quedo en el 5' },
];

export function migrarCiclos(datos) {
  const hechas = [];
  const cal = (datos.ct5_cal || []).map(r => {
    const c = CORRECCIONES.find(x => x.id === r.id);
    if (!c) return r;
    if (String(r[c.campo] ?? '').trim() !== c.de) return r;   // ya corregido o distinto
    hechas.push(`${c.id}: ${c.campo} ${c.de} -> ${c.a}`);
    return { ...r, [c.campo]: c.a, correccionCiclo: c.porque };
  });
  if (hechas.length) console.log('[ciclos] correcciones aplicadas:', hechas);
  return { ...datos, ct5_cal: cal };
}

/* ------------------------------------------------------------------
   ANÁLISIS
   ------------------------------------------------------------------ */

const DIA = 86400000;

/** Agrupa el calendario por macro/meso y calcula todo por semana. */
export function analizarCiclos(cal = [], ent = []) {
  const series = seriesCarga(cal, ent);
  const grupos = new Map();

  for (const r of cal) {
    const ma = String(r.macro ?? '').trim();
    const me = String(r.meso ?? '').trim();
    if (!ma || !me || !r.fecha) continue;
    const k = `${ma}/${me}`;
    if (!grupos.has(k)) grupos.set(k, { macro: +ma, meso: +me, clave: k, registros: [] });
    grupos.get(k).registros.push(r);
  }

  const out = [];
  for (const g of grupos.values()) {
    const fechas = g.registros.map(r => r.fecha).sort();
    const ini = fechas[0], fin = fechas[fechas.length - 1];
    const dias = Math.round((new Date(fin) - new Date(ini)) / DIA) + 1;
    const semanas = Math.max(dias / 7, 0.5);

    const porTipo = {};
    let descansos = 0;
    for (const r of g.registros) {
      const a = (r.activitat || '?').trim();
      porTipo[a] = (porTipo[a] || 0) + 1;
      if (/descans/i.test(a)) descansos++;
    }

    let dedos = 0, cuerpo = 0, sistemico = 0;
    for (const f of new Set(fechas)) {
      const c = series[f];
      if (!c) continue;
      dedos += c.dedos || 0; cuerpo += c.cuerpo || 0; sistemico += c.sistemico || 0;
    }

    const porSemana = {};
    for (const [a, n] of Object.entries(porTipo)) porSemana[a] = Math.round((n / semanas) * 10) / 10;

    out.push({
      ...g, ini, fin, dias, semanas: Math.round(semanas * 10) / 10,
      registros: g.registros.length,
      sesiones: g.registros.length - descansos,
      descansos,
      pctDescanso: Math.round((descansos / g.registros.length) * 100),
      porTipo, porSemana,
      sesionesSemana: Math.round(((g.registros.length - descansos) / semanas) * 10) / 10,
      dedosSemana:     Math.round((dedos / semanas) * 10) / 10,
      cuerpoSemana:    Math.round((cuerpo / semanas) * 10) / 10,
      sistemicoSemana: Math.round((sistemico / semanas) * 10) / 10,
    });
  }

  out.sort((a, b) => a.macro - b.macro || a.meso - b.meso);
  return out;
}

/** El ciclo en curso, con los días que llevas dentro. */
export function cicloActual(ciclos, hoyISO) {
  if (!ciclos.length) return null;
  const hoy = hoyISO || new Date().toISOString().slice(0, 10);
  let mejor = null;
  for (const c of ciclos) {
    if (c.ini <= hoy && !mejor) mejor = c;
    else if (c.ini <= hoy && (c.macro > mejor.macro || (c.macro === mejor.macro && c.meso > mejor.meso))) mejor = c;
  }
  if (!mejor) return null;
  return { ...mejor, diaActual: Math.round((new Date(hoy) - new Date(mejor.ini)) / DIA) + 1 };
}

/** Avisos de higiene de datos: mesos raros, huecos, solapes. */
export function revisarCiclos(ciclos) {
  const avisos = [];
  for (const c of ciclos) {
    if (c.dias < 14) avisos.push(`${c.clave} dura solo ${c.dias} dias — revisa si es un mesociclo real`);
    if (c.dias > 90) avisos.push(`${c.clave} dura ${c.dias} dias — puede haber una fecha mal escrita`);
  }
  const orden = [...ciclos].sort((a, b) => (a.ini > b.ini ? 1 : -1));
  for (let i = 1; i < orden.length; i++) {
    if (orden[i].ini <= orden[i - 1].fin) {
      avisos.push(`${orden[i - 1].clave} y ${orden[i].clave} se solapan en el tiempo`);
    }
  }
  return avisos;
}
