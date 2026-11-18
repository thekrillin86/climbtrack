/**
 * ClimbTrack · tests del Tindeq: modo y comparación (lógica pura, sin React)
 * archivo nuevo: src/tindeq.js (18-11-2026)
 *
 * Desde noviembre de 2026 Juan hace los tests tirando hacia arriba; antes,
 * casi siempre colgado y alguno tirando hacia abajo. Son medidas distintas: un
 * test solo se compara con otros del MISMO modo (y de la misma regleta).
 *
 * El modo es un campo opcional de ct5_treg y ct5_t25. El histórico no lo tiene
 * y se queda así: ni se migra ni se adivina. Todo lo que no lo tiene forma su
 * propia serie, «sin indicar».
 *
 * Los valores se guardan en NEWTONS, como siempre (decisión de Juan del
 * 18-11-2026). Para pasar a kilos: `kgDeN`.
 */

export const MODOS = [
  { id: 'arriba', nombre: 'Tirando hacia arriba', corto: 'Arriba' },
  { id: 'colgado', nombre: 'Colgado', corto: 'Colgado' },
  { id: 'abajo', nombre: 'Tirando hacia abajo', corto: 'Abajo' },
];
export const MODO_POR_DEFECTO = 'arriba';
export const SIN_MODO = '';

/** El modo de un registro, o '' si no lo tiene (o trae uno que no existe). */
export const modoDe = r => (MODOS.some(m => m.id === r?.modo) ? r.modo : SIN_MODO);
export const nombreModo = id => MODOS.find(m => m.id === id)?.nombre || 'Sin indicar';
export const cortoModo = id => MODOS.find(m => m.id === id)?.corto || 'Sin indicar';

/** Newtons a kilos (kilogramo-fuerza). */
export const G = 9.80665;
export const kgDeN = n => Number(n) / G;

/* --------- test de hoy contra su media, MISMO MONTAJE --------- */
export function compararTest(treg, t25) {
  // Dos filtros que no estaban:
  //  - LAS DOS MANOS. `valor` suma esq+dre, así que un registro con una sola
  //    mano rellena se compara contra medias de dos y sale un −50 % inventado
  //    que además dispara "Hoy toca descansar".
  //  - SOLO 'pre'. Un 'post' son los dedos ya fatigados; mezclarlo con los
  //    'pre' es comparar cosas distintas, igual que mezclar tamaños de regleta.
  const todos = [...(treg || []), ...(t25 || [])]
    .filter(r => r.fecha && Number(r.esq) > 0 && Number(r.dre) > 0 && r.momento !== 'post')
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  if (!todos.length) return null;

  const ultimo = todos[todos.length - 1];
  // Tercer filtro (18-11-2026): el MODO. Colgado, tirando hacia arriba y
  // tirando hacia abajo son medidas distintas y no se comparan. Lo que no tiene
  // modo (todo el histórico anterior) es su propia serie, «sin indicar»: no se
  // adivina qué era.
  const modo = modoDe(ultimo);
  const valor = r => (Number(r.esq) || 0) + (Number(r.dre) || 0);
  const v = valor(ultimo);
  // Numérico, no textual: en su histórico conviven "16" y "16.0", que como
  // texto nunca casan y partirían la serie en dos sin decirlo.
  const mmNum = Number(ultimo.mm) > 0 ? Number(ultimo.mm) : null;
  if (mmNum === null) {
    return { fecha: ultimo.fecha, mm: null, modo, valor: v, n: 0, sinBase: true };
  }

  // solo tests del MISMO tamaño de regleta y de los 60 días anteriores a él
  const desde = new Date(ultimo.fecha); desde.setDate(desde.getDate() - 60);
  const base = todos.filter(r =>
    Number(r.mm) === mmNum && modoDe(r) === modo && r !== ultimo && new Date(r.fecha) >= desde
  );

  const mm = String(mmNum);
  if (base.length < 3) {
    return { fecha: ultimo.fecha, mm, modo, valor: v, n: base.length, sinBase: true };
  }
  const media = base.reduce((s, r) => s + valor(r), 0) / base.length;
  return {
    fecha: ultimo.fecha, mm, modo, valor: v, media: Math.round(media),
    pct: Math.round(((v - media) / media) * 1000) / 10,
    n: base.length, sinBase: false,
  };
}


/** Agrupa tests por modo; primero el modo con el test más reciente. */
export function porModo(filas) {
  const g = new Map();
  for (const r of filas || []) { const m = modoDe(r); if (!g.has(m)) g.set(m, []); g.get(m).push(r); }
  const ultimo = rs => rs.reduce((x, r) => (String(r.fecha || '') > x ? String(r.fecha || '') : x), '');
  return [...g.entries()].sort((a, b) => ultimo(b[1]).localeCompare(ultimo(a[1])));
}
