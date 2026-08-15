/**
 * ClimbTrack · FASE 5 — carga por canales
 * archivo nuevo: src/carga.js
 *
 * No sustituye a fingerLoad ni a calcBanister: se pone al lado.
 * Las funciones viejas siguen sirviendo para los días sin detalle.
 *
 * Qué cambia respecto a fingerLoad(act, ff):
 *
 *   ANTES  carga de dedos = coeficiente por NOMBRE DE ACTIVIDAD × fatiga_fin
 *          Un rocódromo suave con los niños y una sesión de bloque máximo
 *          dan lo mismo si pones la misma fatiga.
 *
 *   AHORA  cuando la sesión tiene detalle, la carga sale del ejercicio:
 *          su tipo, su intensidad y su agarre. Y da TRES números, no uno,
 *          porque correr y colgarse no cargan lo mismo ni se recuperan igual.
 *
 * Todos los coeficientes están aquí arriba, a la vista, para que los toques.
 */

import { TIPO_POR_ID, ejerciciosDeBloque } from './catalogo.js';

/* ------------------------------------------------------------------
   PARÁMETROS — todos editables, ninguno es sagrado
   ------------------------------------------------------------------ */
export const PARAMS = {
  // Umbral de oclusión de los flexores, en fracción de la fuerza máxima.
  // 65,6 % es la media medida por Bergua et al. (2021) en 34 escaladores.
  // El rango individual va del 45 % al 75 %: si algún día lo mides con tu
  // Tindeq (calcCFW ya lo calcula), pon aquí TU número.
  umbralOclusion: 0.656,

  // Exponente de intensidad. Con 2, doblar la intensidad multiplica por 4
  // la carga. Es lo que hace que una sesión suave y larga no puntúe como
  // una corta y máxima.
  exponente: 2,

  // Cuando no hay % de intensidad anotado, se estima desde el RPE.
  rpePorDefecto: 5,

  // %MVC por defecto de una suspensión sin porcentaje anotado. Tus repeaters
  // documentados van al 75 %. Cámbialo si tu protocolo habitual es otro.
  pctSuspPorDefecto: 75,

  // Constantes de decaimiento por canal, en días.
  tau: { dedos: 2.5, cuerpo: 1.5, sistemico: 1.0 },

  // Respaldo por actividad, para los días sin detalle (los de antes de hoy).
  porActividad: {
    'roca':        { dedos: 0.80, cuerpo: 0.50, sistemico: 0.45 },
    'rocòdrom':    { dedos: 0.85, cuerpo: 0.50, sistemico: 0.35 },
    'rocodrom':    { dedos: 0.85, cuerpo: 0.50, sistemico: 0.35 },
    'suspensions': { dedos: 1.00, cuerpo: 0.25, sistemico: 0.10 },
    'gimnàs':      { dedos: 0.05, cuerpo: 0.80, sistemico: 0.35 },
    'gimnas':      { dedos: 0.05, cuerpo: 0.80, sistemico: 0.35 },
    'cardio':      { dedos: 0.00, cuerpo: 0.25, sistemico: 1.00 },
    'yoga':        { dedos: 0.05, cuerpo: 0.20, sistemico: 0.15 },
    'mobilitat':   { dedos: 0.05, cuerpo: 0.15, sistemico: 0.10 },
    'fisio':       { dedos: 0.00, cuerpo: 0.10, sistemico: 0.05 },
    'descans':     { dedos: 0.00, cuerpo: 0.00, sistemico: 0.00 },
  },
};

/* ------------------------------------------------------------------
   Intensidad → coste, con el umbral de oclusión
   Por debajo del umbral el flujo sanguíneo está restaurado: no acumula.
   ------------------------------------------------------------------ */
export function costeIntensidad(fraccion) {
  const i = Number(fraccion);
  if (!(i > 0)) return 0;
  const u = PARAMS.umbralOclusion;
  if (i <= u) return 0;
  return Math.pow((i - u) / (1 - u), PARAMS.exponente);
}

/**
 * Coste cuando NO sabemos el % de fuerza máxima y solo tenemos RPE o fatiga.
 * Aquí NO se aplica el umbral de oclusión: ese umbral está definido sobre
 * el porcentaje de tu fuerza máxima, no sobre el esfuerzo que percibes.
 * Aplicarlo a un RPE sería mezclar dos escalas distintas.
 */
export function costeEsfuerzo(fraccion) {
  const i = Number(fraccion);
  if (!(i > 0)) return 0;
  return Math.pow(Math.min(i, 1), PARAMS.exponente);
}

/**
 * Intensidad de un bloque. Devuelve además de qué escala viene, porque
 * el coste se calcula distinto según sea %MVC medido o esfuerzo percibido.
 */
function intensidadBloque(bloque, ejercicio) {
  const pct = ejercicio?.params?.pct_mvc ?? ejercicio?.params?.pct_max;
  if (pct > 0) return { i: Math.min(pct / 100, 1), escala: 'mvc' };

  // suspensiones sin porcentaje: se asume el protocolo habitual
  const t = ejercicio?.tipo;
  if (t === 'SUSP_REGLETA' || t === 'SUSP_TEST') {
    return { i: PARAMS.pctSuspPorDefecto / 100, escala: 'mvc_estimado' };
  }
  const rpe = Number(bloque?.rpe) || PARAMS.rpePorDefecto;
  return { i: Math.min(rpe / 10, 1), escala: 'rpe' };
}

/** Aplica la curva que toque según de dónde venga la intensidad. */
function costeSegunEscala(x) {
  return x.escala === 'rpe' ? costeEsfuerzo(x.i) : costeIntensidad(x.i);
}

/* ------------------------------------------------------------------
   Carga de una sesión de entrenamiento con detalle
   ------------------------------------------------------------------ */
export function cargaPorDetalle(sesionEnt) {
  let bloques = sesionEnt?.bloques;
  if (typeof bloques === 'string') { try { bloques = JSON.parse(bloques); } catch { return null; } }
  if (!Array.isArray(bloques) || !bloques.length) return null;

  let hayDetalle = false;
  const r = { dedos: 0, cuerpo: 0, sistemico: 0, pico: 0, porAgarre: {} };

  for (const b of bloques) {
    const ejs = ejerciciosDeBloque(b);
    if (!ejs.length) continue;
    hayDetalle = true;
    const min = Number(b.minutos) || 0;
    const cuota = min / ejs.length;

    for (const e of ejs) {
      const t = TIPO_POR_ID[e.tipo];
      if (!t) continue;
      const x = intensidadBloque(b, e);
      const coste = costeSegunEscala(x);
      const esf = costeEsfuerzo(x.i);

      r.dedos     += cuota * coste * (t.dedos  ?? 0);
      r.cuerpo    += cuota * esf   * (t.cuerpo ?? 0);
      r.sistemico += cuota * esf   * (t.sist   ?? 0);
      if (x.i > r.pico) r.pico = x.i;
      if (x.escala !== 'mvc') r.estimado = true;

      if (e.agarre && t.dedos > 0.3) {
        r.porAgarre[e.agarre] = (r.porAgarre[e.agarre] || 0) + cuota * coste * t.dedos;
      }
    }
  }
  if (!hayDetalle) return null;
  r.origen = 'detalle';
  return redondear(r);
}

/* ------------------------------------------------------------------
   Respaldo para los días que solo tienen actividad y fatiga
   ------------------------------------------------------------------ */
export function cargaPorActividad(dia) {
  const a = (dia?.activitat || '').trim().toLowerCase();
  let coef = null;
  for (const k of Object.keys(PARAMS.porActividad)) {
    if (a.includes(k)) { coef = PARAMS.porActividad[k]; break; }
  }
  if (!coef) return null;
  const ff = Number(dia?.fatiga_fin) || 1;
  const i = Math.min(ff / 5, 1);                   // fatiga 1-5 → 0,2 a 1
  const coste = costeEsfuerzo(i);                  // fatiga NO es %MVC: sin umbral
  const min = Number(dia?.suunto?.min) || 60;      // usa el reloj si lo hay
  return redondear({
    dedos:     (min / 60) * coste * coef.dedos * 30,
    cuerpo:    (min / 60) * costeEsfuerzo(i) * coef.cuerpo * 30,
    sistemico: cargaSistemica(dia, coef, i, min),
    pico: i, porAgarre: {}, estimado: true, origen: dia?.suunto ? 'actividad+reloj' : 'actividad',
  });
}

/** Si hay datos del Suunto se usan; si no, se estima. */
function cargaSistemica(dia, coef, i, min) {
  const s = dia?.suunto;
  if (s && s.kcal > 0) return (s.kcal / 100) * (s.hr_med ? Math.min(s.hr_med / 100, 2) : 1);
  return (min / 60) * (i ** PARAMS.exponente) * coef.sistemico * 30;
}

function redondear(r) {
  for (const k of ['dedos', 'cuerpo', 'sistemico']) r[k] = Math.round(r[k] * 10) / 10;
  for (const k of Object.keys(r.porAgarre || {})) r.porAgarre[k] = Math.round(r.porAgarre[k] * 10) / 10;
  return r;
}

/* ------------------------------------------------------------------
   Serie diaria de los tres canales.
   A diferencia de fingerSeries, aquí se SUMA lo del mismo día.
   ------------------------------------------------------------------ */
export function seriesCarga(cal, ent) {
  const porDia = {};
  const add = (fecha, c) => {
    if (!fecha || !c) return;
    const d = porDia[fecha] || (porDia[fecha] = { dedos: 0, cuerpo: 0, sistemico: 0, pico: 0, origen: [] });
    d.dedos += c.dedos; d.cuerpo += c.cuerpo; d.sistemico += c.sistemico;
    if (c.pico > d.pico) d.pico = c.pico;
    if (c.origen && !d.origen.includes(c.origen)) d.origen.push(c.origen);
  };

  const conDetalle = new Set();
  for (const s of ent || []) {
    const c = cargaPorDetalle(s);
    if (c) { add(s.fecha, c); conDetalle.add(s.fecha); }
  }
  for (const d of cal || []) {
    if (conDetalle.has(d.fecha)) continue;      // no contar el día dos veces
    add(d.fecha, cargaPorActividad(d));
  }
  for (const f of Object.keys(porDia)) redondear(porDia[f]);
  return porDia;
}

/* ------------------------------------------------------------------
   Fatiga acumulada por canal, con decaimiento propio de cada uno
   ------------------------------------------------------------------ */
export function fatigaAcumulada(series, fechaISO) {
  const hoy = new Date(fechaISO || new Date().toISOString().slice(0, 10));
  const out = { dedos: 0, cuerpo: 0, sistemico: 0 };
  for (const [f, c] of Object.entries(series)) {
    const dias = (hoy - new Date(f)) / 86400000;
    if (dias < 0 || dias > 30) continue;
    for (const k of ['dedos', 'cuerpo', 'sistemico']) {
      out[k] += (c[k] || 0) * Math.exp(-dias / PARAMS.tau[k]);
    }
  }
  for (const k of Object.keys(out)) out[k] = Math.round(out[k] * 10) / 10;
  return out;
}
