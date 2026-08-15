/**
 * ClimbTrack · FASE 4a — tipos de agarre
 * archivo nuevo: src/agarres.js
 *
 * Taxonomía de Juan, siete tipos. Dos formas de rellenarlo:
 *
 *   - SUSPENSIONES: se deduce solo del tamaño de regleta. Cero pulsaciones.
 *   - ROCA Y ROCÓDROMO: hay que marcarlo (fase 4b, los chips), pero se
 *     recuerda por vía: una vez etiquetada Amapolla, los intentos futuros
 *     lo heredan.
 */

export const AGARRES = [
  { id: 'canto',      nombre: 'Canto',            orden: 1 },
  { id: 'reg_media',  nombre: 'Regleta mediana',  orden: 2 },
  { id: 'reg_peque',  nombre: 'Regleta pequeña',  orden: 3 },
  { id: 'pinza',      nombre: 'Pinza',            orden: 4 },
  { id: 'romo',       nombre: 'Romo',             orden: 5 },
  { id: 'bidedo',     nombre: 'Bidedo',           orden: 6 },
  { id: 'monodedo',   nombre: 'Monodedo',         orden: 7 },
];

export const AGARRE_POR_ID = Object.fromEntries(AGARRES.map(a => [a.id, a]));

/* ------------------------------------------------------------------
   UMBRALES DE REGLETA — REVÍSALOS, SON MI PROPUESTA, NO TU CRITERIO
   Con tus regletas reales (25, 16, 15 y 10 mm) esto da:
       25 mm -> regleta mediana
       16 mm -> regleta pequeña
       15 mm -> regleta pequeña
       10 mm -> regleta pequeña
   Si para ti 25 mm ya es canto, o 10 mm merece categoría propia,
   cambia los números aquí y vuelve a migrar.
   ------------------------------------------------------------------ */
export const UMBRALES_MM = {
  canto_desde: 30,      // 30 mm o más -> canto
  media_desde: 20,      // de 20 a 29  -> regleta mediana
                        // menos de 20 -> regleta pequeña
};

/** Tamaño de regleta -> tipo de agarre. */
export function agarrePorRegleta(mm) {
  const n = Number(mm);
  if (!(n > 0)) return null;
  if (n >= UMBRALES_MM.canto_desde) return 'canto';
  if (n >= UMBRALES_MM.media_desde) return 'reg_media';
  return 'reg_peque';
}

/* ------------------------------------------------------------------
   MEMORIA POR VÍA
   Una vía tiene los agarres que tiene. Se etiqueta una vez y los
   intentos siguientes lo heredan solos.
   ------------------------------------------------------------------ */

/** Construye el índice "vía -> agarres" a partir de lo ya etiquetado. */
export function indiceAgarresPorVia(roca) {
  const idx = {};
  for (const r of roca || []) {
    const via = (r.via || '').trim().toLowerCase();
    if (!via || !Array.isArray(r.agarres) || !r.agarres.length) continue;
    const sector = (r.sector || r.lloc || '').trim().toLowerCase();
    idx[`${sector}|${via}`] = r.agarres;
    idx[via] = r.agarres;              // por si cambia el sector escrito
  }
  return idx;
}

/** Sugiere los agarres de una vía a partir de intentos anteriores. */
export function sugerirAgarres(roca, via, sector) {
  const idx = indiceAgarresPorVia(roca);
  const v = (via || '').trim().toLowerCase();
  const s = (sector || '').trim().toLowerCase();
  return idx[`${s}|${v}`] || idx[v] || [];
}

/* ------------------------------------------------------------------
   MIGRACIÓN 4 · pone el agarre a las suspensiones a partir de los mm
   Solo toca ejercicios que ya tienen `params.regleta_mm`.
   No inventa nada para roca ni rocódromo: eso lo marcas tú.
   ------------------------------------------------------------------ */
export function migrarAgarres(datos) {
  const ent = (datos.ct5_ent || []).map(sesion => {
    let bloques = sesion.bloques;
    if (typeof bloques === 'string') { try { bloques = JSON.parse(bloques); } catch { return sesion; } }
    if (!Array.isArray(bloques)) return sesion;

    const nuevos = bloques.map(b => {
      if (!Array.isArray(b.ejerciciosCat)) return b;
      return {
        ...b,
        ejerciciosCat: b.ejerciciosCat.map(e => {
          const mm = e?.params?.regleta_mm;
          const a = agarrePorRegleta(mm);
          return a ? { ...e, agarre: a, agarreOrigen: 'regleta_mm' } : e;
        }),
      };
    });
    return { ...sesion, bloques: nuevos };
  });
  return { ...datos, ct5_ent: ent };
}

/* ------------------------------------------------------------------
   Agregación: minutos por tipo de agarre
   ------------------------------------------------------------------ */
export function minutosPorAgarre(ent) {
  const acc = {};
  for (const s of ent || []) {
    let bloques = s.bloques;
    if (typeof bloques === 'string') { try { bloques = JSON.parse(bloques); } catch { continue; } }
    for (const b of bloques || []) {
      const ejs = b.ejerciciosCat || [];
      if (!ejs.length) continue;
      const cuota = (Number(b.minutos) || 0) / ejs.length;
      for (const e of ejs) {
        const k = e.agarre && AGARRE_POR_ID[e.agarre] ? e.agarre : 'sin_marcar';
        acc[k] = Math.round(((acc[k] || 0) + cuota) * 10) / 10;
      }
    }
  }
  return acc;
}
