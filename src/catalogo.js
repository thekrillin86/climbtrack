/**
 * ClimbTrack · FASE 2 — catálogo de ejercicios
 * archivo nuevo: src/catalogo.js
 *
 * Qué resuelve: hoy los ejercicios son texto libre dentro de `bloques`.
 * Eso genera 67 cadenas distintas para 11 ejercicios reales, porque los
 * parámetros van metidos en el nombre ("Susp. 15mm 7\"3\"").
 * Resultado: no se puede agregar nada — ni por agarre, ni por regleta,
 * ni por canal de carga.
 *
 * Aquí se separan las dos cosas: TIPO de ejercicio (lista cerrada) y
 * PARÁMETROS (campos). Con eso ya se puede sumar, filtrar y modelar.
 *
 * Los coeficientes de canal son un punto de partida, no un dogma.
 * Están pensados para ir en una pantalla de ajustes y que los toques tú.
 */

/* ------------------------------------------------------------------
   LOS 11 TIPOS
   canal_*  = cuánto carga ese ejercicio en cada canal (0 a 1)
   agarre   = perfil por defecto; 'mixto' significa que hay que preguntarlo
   params   = qué campos tiene sentido pedir para ese tipo
   ------------------------------------------------------------------ */
export const TIPOS = [
  { id:'SUSP_REGLETA', nombre:'Suspensión en regleta',   dedos:1.00, cuerpo:0.20, sist:0.10, agarre:'mixto',
    params:['regleta_mm','pct_mvc','lastre_kg','trabajo_s','descanso_s','series','reps'] },
  { id:'SUSP_TEST',    nombre:'Test con Tindeq',          dedos:0.95, cuerpo:0.15, sist:0.05, agarre:'mixto',
    params:['protocolo','regleta_mm','montaje_id'] },
  { id:'DOMINADA',     nombre:'Dominada',                 dedos:0.25, cuerpo:0.90, sist:0.30, agarre:'—',
    params:['lastre_kg','reps','series','variante'] },
  { id:'BLOQUE',       nombre:'Bloque en rocódromo',      dedos:0.85, cuerpo:0.50, sist:0.30, agarre:'mixto',
    params:['pct_max','movimientos','series'] },
  { id:'TRAVESIA',     nombre:'Travesía',                 dedos:0.60, cuerpo:0.40, sist:0.60, agarre:'mixto',
    params:['movimientos','pct_max','series','descanso_s'] },
  { id:'VIA_ROCO',     nombre:'Vía en rocódromo',         dedos:0.70, cuerpo:0.45, sist:0.55, agarre:'mixto',
    params:['grado','movimientos'] },
  { id:'GYM_TREN_SUP', nombre:'Fuerza tren superior',     dedos:0.05, cuerpo:0.85, sist:0.35, agarre:'—',
    params:['ejercicio','series','reps','rir','kg'] },
  { id:'GYM_TREN_INF', nombre:'Fuerza tren inferior',     dedos:0.00, cuerpo:0.75, sist:0.45, agarre:'—',
    params:['ejercicio','series','reps','rir','kg'] },
  { id:'CORE',         nombre:'Core y abdominales',       dedos:0.05, cuerpo:0.40, sist:0.20, agarre:'—',
    params:['ejercicio','series','tiempo_s','reps'] },
  { id:'HOMBRO',       nombre:'Hombro y preventivo',      dedos:0.05, cuerpo:0.30, sist:0.10, agarre:'—',
    params:['ejercicio','series','reps'] },
  { id:'MOVILIDAD',    nombre:'Movilidad y calentamiento',dedos:0.05, cuerpo:0.15, sist:0.10, agarre:'—',
    params:['minutos'] },
];

export const TIPO_POR_ID = Object.fromEntries(TIPOS.map(t => [t.id, t]));

export const AGARRES = ['canto', 'pinza', 'romo', 'bidedo', 'mixto', '—'];

/* ------------------------------------------------------------------
   CLASIFICADOR
   Convierte una cadena antigua en { tipo, params }.
   Se usa para migrar el histórico y para sugerir tipo al escribir.
   ------------------------------------------------------------------ */
export function clasificar(texto) {
  const x = String(texto || '').trim().toLowerCase();
  if (!x) return null;
  if (/\b(maw|med40|ftl|fuerza m[áa]xima tindeq|test )/.test(x)) return 'SUSP_TEST';
  if (/susp/.test(x) || x === 'rfd')                             return 'SUSP_REGLETA';
  if (/dominad/.test(x) || /^pap/.test(x))                       return 'DOMINADA';
  if (/traves[íi]a|travesia/.test(x))                            return 'TRAVESIA';
  if (/bloque|bloc\b/.test(x))                                   return 'BLOQUE';
  if (/v[íi]as?\b/.test(x))                                      return 'VIA_ROCO';
  if (/sentadilla|peso muerto|puente|isquios|gl[úu]teo|split|pingeon|rana|rockin/.test(x)) return 'GYM_TREN_INF';
  if (/hombro|rotaci[óo]n|rehabilit|apertura|tracci[óo]n/.test(x)) return 'HOMBRO';
  if (/core|abdominal|l-sit|plancha|placha|russian|escalador/.test(x)) return 'CORE';
  if (/press|remo|flexion|fondos|b[íi]ceps|tr[íi]ceps|trx|palof|militar|banca|nataci[óo]n/.test(x)) return 'GYM_TREN_SUP';
  if (/movilidad|estiramiento|calentamiento|yoga|90/.test(x))    return 'MOVILIDAD';
  return null;   // sin clasificar: se conserva el texto y lo revisas tú
}

/** Extrae los parámetros que estaban escondidos dentro del nombre. */
export function extraerParams(texto) {
  const t = String(texto || '');
  const p = {};
  let m;
  if ((m = t.match(/(\d+)\s*mm/i)))            p.regleta_mm = +m[1];
  if ((m = t.match(/(\d+)\s*%/)))              p.pct_mvc    = +m[1];
  if ((m = t.match(/\+\s*(\d+)\s*kg/i)))       p.lastre_kg  = +m[1];
  if ((m = t.match(/(\d+)\s*mov/i)))           p.movimientos= +m[1];
  if ((m = t.match(/(\d+)["”]\s*:?\s*(\d+)["”]?/))) { p.trabajo_s = +m[1]; p.descanso_s = +m[2]; }
  else if ((m = t.match(/(\d+)["”]/)))         p.trabajo_s  = +m[1];
  return p;
}

/** Cadena antigua → entrada estructurada. Nunca pierde el original. */
export function parseEjercicio(texto) {
  const tipo = clasificar(texto);
  return {
    tipo: tipo || 'SIN_CLASIFICAR',
    nombre: String(texto || '').trim(),
    params: extraerParams(texto),
    agarre: tipo ? (TIPO_POR_ID[tipo]?.agarre ?? '—') : '—',
    textoOriginal: String(texto || '').trim(),   // se conserva SIEMPRE
  };
}

/* ------------------------------------------------------------------
   MIGRACIÓN 2 · convierte el histórico de `ent` al catálogo
   Se añade a MIGRACIONES en migrations.js y se sube ESQUEMA_ACTUAL a 2.
   No borra nada: añade `ejerciciosCat` junto a `ejercicios`.
   ------------------------------------------------------------------ */
export function migrarBloquesACatalogo(datos) {
  const ent = (datos.ct5_ent || []).map(sesion => {
    let bloques = sesion.bloques;
    if (typeof bloques === 'string') {
      try { bloques = JSON.parse(bloques); } catch { return sesion; }
    }
    if (!Array.isArray(bloques)) return sesion;

    const nuevos = bloques.map(b => ({
      ...b,
      ejerciciosCat: (b.ejercicios || []).map(parseEjercicio),
    }));
    return { ...sesion, bloques: nuevos };
  });
  return { ...datos, ct5_ent: ent };
}

/**
 * Ejercicios estructurados de un bloque.
 * Si el bloque ya está migrado, los devuelve. Si es nuevo y todavía lleva
 * texto libre, lo clasifica al vuelo. Así una sesión apuntada hoy cuenta
 * igual que una migrada, sin tener que tocar el formulario.
 */
export function ejerciciosDeBloque(bloque) {
  if (!bloque) return [];
  if (Array.isArray(bloque.ejerciciosCat) && bloque.ejerciciosCat.length) return bloque.ejerciciosCat;
  const libres = bloque.ejercicios;
  if (!Array.isArray(libres) || !libres.length) return [];
  return libres.map(parseEjercicio);
}

/* ------------------------------------------------------------------
   Utilidades para la interfaz
   ------------------------------------------------------------------ */

/** Texto corto para mostrar en una lista: "Suspensión 15 mm · 7\"/3\"" */
export function etiqueta(e) {
  if (!e) return '';
  const t = TIPO_POR_ID[e.tipo];
  const p = e.params || {};
  const trozos = [t ? t.nombre : e.nombre];
  if (p.regleta_mm)  trozos.push(`${p.regleta_mm} mm`);
  if (p.pct_mvc)     trozos.push(`${p.pct_mvc} %`);
  if (p.lastre_kg)   trozos.push(`+${p.lastre_kg} kg`);
  if (p.trabajo_s)   trozos.push(p.descanso_s ? `${p.trabajo_s}"/${p.descanso_s}"` : `${p.trabajo_s}"`);
  if (p.movimientos) trozos.push(`${p.movimientos} mov`);
  return trozos.join(' · ');
}

/** Suma minutos por tipo, por regleta o por agarre en un rango de sesiones. */
export function agregar(sesiones, por = 'tipo') {
  const acc = {};
  for (const s of sesiones || []) {
    let bloques = s.bloques;
    if (typeof bloques === 'string') { try { bloques = JSON.parse(bloques); } catch { continue; } }
    for (const b of bloques || []) {
      const ejs = ejerciciosDeBloque(b);
      if (!ejs.length) continue;
      const cuota = (Number(b.minutos) || 0) / ejs.length;
      for (const e of ejs) {
        const clave =
          por === 'regleta' ? (e.params?.regleta_mm ?? 'sin regleta') :
          por === 'agarre'  ? (e.agarre || '—') :
                              e.tipo;
        acc[clave] = (acc[clave] || 0) + cuota;
      }
    }
  }
  return acc;
}
