/**
 * ClimbTrack · FASE 3 — sacar los datos del Suunto de las observaciones
 * archivo nuevo: src/suunto.js
 *
 * Qué resuelve: desde abril, el reloj deja escrito en el campo `obs` del
 * calendario algo como "Suunto 236min HR79/129 893kcal". Son 30 días de
 * duración, pulso medio, pulso máximo y calorías que la app ya recibe y
 * no usa para nada, porque están dentro de una frase.
 *
 * Esto los pasa a campos de verdad, en `sesion.suunto`, sin tocar `obs`.
 *
 * Formatos reales encontrados en los datos (15-08-2026):
 *   "Suunto 236min HR79/129 893kcal"   -> 25 días, completo
 *   "Suunto 43min 706kcal"             -> 5 días de cardio, sin pulso
 * Y hay que NO confundirse con "Caminata 1, 40min", que no es del reloj.
 */

/** Exige la palabra Suunto; el bloque de pulso es opcional. */
const PATRON = /Suunto\s+(\d+)\s*min(?:\s+HR\s*(\d+)\s*\/\s*(\d+))?\s+(\d+)\s*kcal/i;

/**
 * Extrae los datos del reloj de un texto libre.
 * Devuelve null si no hay nada del Suunto en él.
 */
export function parseSuunto(texto) {
  const m = PATRON.exec(String(texto || ''));
  if (!m) return null;
  const s = {
    min:  Number(m[1]),
    kcal: Number(m[4]),
    hr_med: m[2] ? Number(m[2]) : null,
    hr_max: m[3] ? Number(m[3]) : null,
  };
  // descarta valores absurdos en vez de guardarlos como buenos
  if (!(s.min > 0 && s.min < 1440)) return null;
  if (!(s.kcal > 0 && s.kcal < 20000)) return null;
  if (s.hr_med !== null && !(s.hr_med > 25 && s.hr_med < 230)) { s.hr_med = null; }
  if (s.hr_max !== null && !(s.hr_max > 25 && s.hr_max < 230)) { s.hr_max = null; }
  if (s.hr_med !== null && s.hr_max !== null && s.hr_max < s.hr_med) {
    // si vienen al revés, se ordenan en vez de descartarlos
    const t = s.hr_med; s.hr_med = s.hr_max; s.hr_max = t;
  }
  return s;
}

/**
 * MIGRACIÓN 3 · añade `suunto` a los días del calendario que lo tengan.
 * No modifica `obs`: el texto original se queda donde está.
 */
export function migrarSuunto(datos) {
  const cal = (datos.ct5_cal || []).map(dia => {
    if (dia.suunto) return dia;                 // ya migrado, no repetir
    const s = parseSuunto(dia.obs);
    return s ? { ...dia, suunto: s } : dia;
  });
  return { ...datos, ct5_cal: cal };
}

/* ------------------------------------------------------------------
   Utilidades para usar el dato una vez está en columnas
   ------------------------------------------------------------------ */

/** Todos los días con lectura del reloj, ordenados por fecha. */
export function diasConSuunto(cal) {
  return (cal || []).filter(d => d.suunto).sort((a, b) => (a.fecha > b.fecha ? 1 : -1));
}

/**
 * Resumen por actividad: cuántos días, minutos totales, pulso medio y kcal.
 * Sirve para ver de un vistazo que correr y escalar no se parecen en nada.
 */
export function resumenPorActividad(cal) {
  const acc = {};
  for (const d of diasConSuunto(cal)) {
    const k = (d.activitat || '?').trim();
    const a = acc[k] || (acc[k] = { dias: 0, min: 0, kcal: 0, hrSuma: 0, hrN: 0, hrMax: 0 });
    a.dias++;
    a.min  += d.suunto.min;
    a.kcal += d.suunto.kcal;
    if (d.suunto.hr_med != null) { a.hrSuma += d.suunto.hr_med; a.hrN++; }
    if (d.suunto.hr_max != null && d.suunto.hr_max > a.hrMax) a.hrMax = d.suunto.hr_max;
  }
  for (const k of Object.keys(acc)) {
    const a = acc[k];
    a.hr_medio = a.hrN ? Math.round(a.hrSuma / a.hrN) : null;
    a.kcal_por_min = Math.round((a.kcal / a.min) * 10) / 10;
    delete a.hrSuma; delete a.hrN;
  }
  return acc;
}
