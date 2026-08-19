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

/* La taxonomía de agarres vive SOLO en `agarres.js`. Aquí había una lista
   suelta de la fase 2 —canto, pinza, romo, bidedo, mixto, —— que no importaba
   nadie y que contradecía la de Juan: le faltaban regleta mediana, regleta
   pequeña, monodedo y tridedo. Un `import { AGARRES } from './catalogo.js'`
   por descuido pintaba seis chips en blanco. Borrada el 19-08-2026. */

/* ------------------------------------------------------------------
   Tipos cuyo porcentaje NO es porcentaje de fuerza máxima.
   Un bloque al 65 % es el 65 % de tu nivel DE BLOQUE; una vía al 80 %,
   el 80 % de tu nivel de vía. Ese número va a `pct_max` y se lee con la
   curva de esfuerzo, sin umbral de oclusión. `carga.js` importa este
   mismo conjunto: la escala la decide el TIPO, y se define una sola vez.
   ------------------------------------------------------------------ */
export const ESCALA_ESFUERZO = new Set(['BLOQUE', 'TRAVESIA', 'VIA_ROCO']);

/* ------------------------------------------------------------------
   Tipos cuya intensidad es %MVC **DE DEDOS**.

   Distinto de "no estar en ESCALA_ESFUERZO": una dominada al 80 % es el 80 %
   de su máximo DE DOMINADA, que es intensidad de tronco. Solo en estos dos el
   número mide fuerza de dedos, y solo en estos dos tiene sentido que los
   canales de cuerpo y sistémico salgan del RPE del bloque en vez de del
   propio porcentaje. Confundir las dos cosas es el error de categoría del
   §4b de CLAUDE.md, que ya se ha cometido tres veces.
   ------------------------------------------------------------------ */
export const MVC_DEDOS = new Set(['SUSP_REGLETA', 'SUSP_TEST']);

/* ------------------------------------------------------------------
   CLASIFICADOR
   Convierte una cadena antigua en { tipo, params }.
   Se usa para migrar el histórico y para sugerir tipo al escribir.
   ------------------------------------------------------------------ */
export function clasificar(texto) {
  const x = String(texto || '').trim().toLowerCase();
  if (!x) return null;
  if (/\b(maw|med40|ftl|fuerza m[áa]xima tindeq|test )/.test(x)) return 'SUSP_TEST';
  // `rfd` en cualquier posición, no como palabra suelta. Con `x === 'rfd'`,
  // escribir "Rfd 10mm" —justo lo que se le pidió a Juan para que la regleta
  // entrara en el cálculo— dejaba el ejercicio SIN_CLASIFICAR, y un ejercicio
  // sin tipo no suma nada: `cargaPorDetalle` lo salta y además se lleva su
  // parte de los minutos del bloque. El consejo daba 0,0 de dedos donde "Rfd"
  // a secas daba 2,4. Comprobado el 19-08-2026.
  if (/susp/.test(x) || /\brfd\b/.test(x))                       return 'SUSP_REGLETA';
  if (/dominad/.test(x) || /^pap/.test(x))                       return 'DOMINADA';
  if (/traves[íi]a|travesia/.test(x))                            return 'TRAVESIA';
  if (/bloque|bloc\b/.test(x))                                   return 'BLOQUE';
  if (/v[íi]as?\b/.test(x))                                      return 'VIA_ROCO';
  if (/sentadilla|peso muerto|puente|isquios|gl[úu]teo|split|pingeon|rana|rockin|salto|caj[óo]n|cajon/.test(x)) return 'GYM_TREN_INF';
  if (/hombro|rotaci[óo]n|rehabilit|apertura|tracci[óo]n|deltoide/.test(x)) return 'HOMBRO';
  if (/core|abdominal|l-sit|plancha|placha|russian|escalador/.test(x)) return 'CORE';
  if (/press|remo|flexion|fondos|b[íi]ceps|tr[íi]ceps|trx|palof|militar|banca|nataci[óo]n/.test(x)) return 'GYM_TREN_SUP';
  if (/movilidad|estiramiento|calentamiento|yoga|90/.test(x))    return 'MOVILIDAD';
  return null;   // sin clasificar: se conserva el texto y lo revisas tú
}

/**
 * Extrae los parámetros que estaban escondidos dentro del nombre.
 * El tipo es opcional y solo decide dónde va el porcentaje: en los tipos de
 * ESCALA_ESFUERZO a `pct_max`, en el resto a `pct_mvc`. Sin tipo, se
 * comporta como siempre.
 */
export function extraerParams(texto, tipo) {
  const t = String(texto || '');
  const p = {};
  let m;
  const num = s => Number(String(s).replace(',', '.').replace('−', '-').replace(/\s+/g, ''));
  if ((m = t.match(/(\d+(?:[.,]\d+)?)\s*mm/i)))  p.regleta_mm = num(m[1]);
  if ((m = t.match(/(\d+(?:[.,]\d+)?)\s*%/)))    p[ESCALA_ESFUERZO.has(tipo) ? 'pct_max' : 'pct_mvc'] = num(m[1]);
  // El lastre puede ser NEGATIVO: su entrenador prescribe polea o goma para
  // todo lo que baje del 80 % (al 75 % en 15 mm le tocan −7,25 kg). Antes la
  // regex exigía el `+`, así que una suspensión asistida se leía como si fuera
  // a peso corporal y salía un 5,6× de sobreestimación. Y los decimales se
  // partían: "+7.5kg" daba 5 kg.
  if ((m = t.match(/([+\-−]\s*\d+(?:[.,]\d+)?)\s*kg/i))) p.lastre_kg = num(m[1]);
  else if ((m = t.match(/(\d+(?:[.,]\d+)?)\s*kg/i))) {
    // Sin signo delante. Solo se toma como lastre AÑADIDO si nada en el texto
    // sugiere asistencia; si habla de goma o polea, el signo es justo el dato
    // que falta y no se adivina: se deja vacío y el modelo lo marca estimado.
    if (!/goma|polea|asistid|banda|el[áa]stic/i.test(t)) p.lastre_kg = num(m[1]);
  }
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
    params: extraerParams(texto, tipo),
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
  // Los dos, no solo pct_mvc: desde que el % de bloque, travesía y vía va a
  // pct_max, esta línea dejó de enseñarlo y el dato desaparecía de pantalla
  // aunque estuviera guardado.
  const pct = p.pct_mvc ?? p.pct_max;
  if (pct)           trozos.push(`${pct} %`);
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
