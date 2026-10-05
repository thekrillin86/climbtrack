/**
 * ClimbTrack · bandeja de propuestas de Talaia (lógica pura, sin React)
 *
 * Una propuesta llega así:
 *   { id, resumen, registros: [ { clave: 'ct5_ent', registro: {...} }, ... ] }
 *
 * Reglas:
 *  - Solo se aceptan las ocho claves de siempre.
 *  - Cada registro nuevo lleva `origen: 'talaia:<id de la propuesta>'`. Así,
 *    si la propuesta se añadió pero no se pudo borrar de la nube (sin
 *    cobertura), la app la reconoce como ya añadida y no la duplica.
 *  - Un entrenamiento se completa igual que al pulsar Registrar en su
 *    formulario: ids de bloque, carga por bloque (minutos × RPE), minutos y
 *    carga totales.
 */
import { ACTS } from './lib.js';

export const ETIQUETAS = {
  ct5_cal: 'Rutina diaria', ct5_ent: 'Entrenamiento', ct5_roca: 'Salida a roca', ct5_lib: 'Libreta',
  ct5_t25: 'Tindeq 25 mm', ct5_treg: 'Tindeq regleta', ct5_dp: 'Peso', ct5_tests: 'Test',
};
const TIPOS_ENT = ['Rocòdrom', 'Suspensions/Dominades', 'Gimnàs'];

export function marcaOrigen(idPropuesta) { return 'talaia:' + idPropuesta; }

/** Devuelve un texto con el problema, o null si la propuesta se puede añadir. */
export function validarPropuesta(p) {
  if (!p || typeof p !== 'object') return 'La propuesta no se puede leer.';
  if (!Array.isArray(p.registros) || !p.registros.length) return 'La propuesta no trae registros.';
  for (const [i, r] of p.registros.entries()) {
    const n = i + 1;
    if (!r || !ETIQUETAS[r.clave]) return `Registro ${n}: tipo de registro desconocido.`;
    const x = r.registro;
    if (!x || typeof x !== 'object' || Array.isArray(x)) return `Registro ${n}: viene vacío.`;
    if (x.fecha !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(String(x.fecha))) return `Registro ${n}: fecha no válida.`;
    if (r.clave === 'ct5_cal' && !ACTS.includes(x.activitat)) return `Registro ${n}: actividad «${x.activitat || ''}» no existe en Rutina diaria.`;
    if (r.clave === 'ct5_ent') {
      if (!TIPOS_ENT.includes(x.tipo)) return `Registro ${n}: tipo de entrenamiento «${x.tipo || ''}» no válido.`;
      if (!Array.isArray(x.bloques) || !x.bloques.length) return `Registro ${n}: el entrenamiento no trae bloques.`;
    }
  }
  return null;
}

/** Prepara un registro para guardarlo: id nuevo, marca de origen y, si es un entrenamiento, sus cargas. */
export function prepararRegistro(clave, registro, idPropuesta, nuevoId) {
  const r = { ...registro, id: nuevoId(), origen: marcaOrigen(idPropuesta) };
  if (clave === 'ct5_ent') {
    let ct = 0, mt = 0;
    r.bloques = (registro.bloques || []).map(b => {
      const m = Number(b.minutos) || 0, rpe = Number(b.rpe) || 0, c = m * rpe;
      ct += c; mt += m;
      return {
        id: nuevoId(), tipo: b.tipo === 'General' ? 'General' : 'Específica',
        ejercicios: (b.ejercicios || []).map(e => String(e).trim()).filter(Boolean),
        series: b.series ?? '', minutos: b.minutos ?? '', rpe: b.rpe ?? '',
        agarres: Array.isArray(b.agarres) ? b.agarres : [], carga: c,
      };
    });
    r.min_total = mt;
    r.carga_total = ct;
    if (r.fatiga_ini === undefined) r.fatiga_ini = '';
    if (r.fatiga_fin === undefined) r.fatiga_fin = '';
  }
  return r;
}

/** ¿Ya se añadió esta propuesta? (algún registro con su marca de origen) */
export function yaAnadida(idPropuesta, colecciones) {
  const marca = marcaOrigen(idPropuesta);
  return Object.values(colecciones).some(lista => Array.isArray(lista) && lista.some(r => r && r.origen === marca));
}

/** Una línea por registro, para enseñarla antes de añadir. */
export function describir(r) {
  const x = r.registro || {};
  const partes = [ETIQUETAS[r.clave] || r.clave, x.fecha];
  if (r.clave === 'ct5_cal') partes.push(x.activitat, x.fatiga_fin !== undefined && x.fatiga_fin !== '' ? `fatiga fin ${x.fatiga_fin}` : '');
  if (r.clave === 'ct5_ent') {
    partes.push(x.tipo);
    (x.bloques || []).forEach(b => partes.push(`${b.tipo}: ${(b.ejercicios || []).map(e => String(e).trim()).filter(Boolean).join(', ')}${b.series ? ` · ${b.series} series` : ''}${b.minutos ? ` · ${b.minutos}′` : ''}${b.rpe ? ` · RPE ${b.rpe}` : ''}`));
    if (x.fatiga_fin !== undefined && x.fatiga_fin !== '') partes.push(`fatiga fin ${x.fatiga_fin}`);
  }
  if (r.clave === 'ct5_roca') partes.push(x.lloc, x.via);
  if (x.obs) partes.push(`obs: ${x.obs}`);
  return partes.filter(v => v !== undefined && v !== null && v !== '').join(' · ');
}
