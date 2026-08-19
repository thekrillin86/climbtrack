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

import { TIPO_POR_ID, ejerciciosDeBloque, ESCALA_ESFUERZO, MVC_DEDOS } from './catalogo.js';
import { AGARRE_POR_ID, agarreDe } from './agarres.js';

/* ------------------------------------------------------------------
   PARÁMETROS — todos editables, ninguno es sagrado
   ------------------------------------------------------------------ */
export const PARAMS = {
  // Umbral de oclusión de RESPALDO, en fracción de la fuerza máxima.
  // 65,6 % es la media medida por Bergua et al. (2021) en 34 escaladores, con
  // rango individual del 45 % al 75 %.
  //
  // ESTO ES SOLO EL RESPALDO. El umbral de Juan está medido y guardado en su
  // pestaña Tests (`ct5_tests`, campo `OT`), y vale 65 %. Se lee con
  // `perfilEnFecha()` y manda sobre este número. Este valor solo se usa si no
  // hay ningún test anterior a la fecha de la sesión.
  umbralOclusion: 0.656,

  // Escala del RPE. Estaba escrita como un /10 a mano en dos sitios distintos.
  escalaRpe: 10,

  // Corrección de fuerza máxima por milímetro de canto, en fracción.
  // Sale del modelo de su entrenador (hoja "06 Cálculo de carga en regleta de
  // entrenamiento", M2 2026): con la regleta de referencia a 16 mm, pasar a
  // 15 mm le resta un 1,9357 % de fuerza. Verificado contra su hoja al
  // decimal: 103,00 kg a 16 mm dan 101,01 kg a 15 mm.
  //
  // OJO: es una recta, y su hoja solo la tabula alrededor de la regleta de
  // referencia. Extrapolar 10 mm arriba o abajo es una suposición, no un dato,
  // y por eso `margenRegletaMm` marca esos casos como estimados.
  ajusteFuerzaPorMm: 0.019357,
  margenRegletaMm: 5,

  // Exponente de intensidad. Con 2, doblar la intensidad multiplica por 4
  // la carga. Es lo que hace que una sesión suave y larga no puntúe como
  // una corta y máxima.
  exponente: 2,

  // Cuando no hay % de intensidad anotado, se estima desde el RPE.
  rpePorDefecto: 5,

  // %MVC de una suspensión de la que no se puede calcular nada: ni porcentaje
  // escrito, ni tamaño de regleta, ni perfil de fuerza en esa fecha. Es el
  // último recurso y el ejercicio queda marcado como estimado.
  pctSuspPorDefecto: 75,

  // Escala de la fatiga percibida del calendario.
  // El formulario admite 0-10, pero en 581 dias registrados el maximo real
  // que usa Juan es 4. Por eso el divisor es 5 y no 10: con 10, su dia mas
  // duro puntuaria 0,16 en vez de 0,64. Si algun dia empieza a usar la
  // escala entera hasta 10, sube esto a 10 y se recalcula todo solo.
  escalaFatiga: 5,
  fatigaPorDefecto: 1,

  // Actividades que un entrenamiento con detalle YA representa. Solo estas
  // se descartan del calendario cuando ese dia hay detalle; asi un cardio
  // por la tarde no desaparece porque por la manana hubo gimnasio.
  actividadesConDetalle: /roc[oò]drom|suspensions|dominades|gimn[aà]s/i,

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

  // Puente entre los dos motores de carga. cargaPorDetalle (minutos x coste
  // x coeficiente de tipo) y cargaPorActividad (actividad + fatiga + reloj)
  // no daban la misma unidad: el mismo dia puntuaba el triple en cuerpo y
  // sistemico si rellenabas los bloques que si ponias solo la actividad.
  // Rellenar el formulario te castigaba.
  //
  // Mediana de detalle/actividad en los 31 días del histórico que tienen los
  // dos cálculos. Re-medida el 19-08-2026, ya con el `suunto` recuperado y con
  // las suspensiones calculadas desde su perfil de fuerza. Antes valía
  // {1,00 · 2,92 · 3,41}, medido cuando el motor de detalle aplastaba las
  // suspensiones y el CSV había perdido las duraciones del reloj.
  //
  // Si se tocan los coeficientes de canal de catalogo.js, o el modelo de
  // suspensiones, estos tres números hay que volver a medirlos.
  //
  // LO QUE ESTE NÚMERO NO RESUELVE: los días CON reloj y los días SIN reloj se
  // comportan distinto frente al puente —medido, 0,35 contra 1,60 en dedos—
  // porque cargaPorActividad escala con la duración y el puente se midió casi
  // todo sobre días que usan los 60 minutos por defecto. Con solo 3 días que
  // tengan detalle Y reloj a la vez no se puede calibrar la otra rama sin
  // inventarse el número. Hace falta más histórico.
  escalaActividad: { dedos: 1.33, cuerpo: 2.09, sistemico: 2.19 },

  // Escalador base de cargaPorActividad. Estaba escrito a mano como un 30 en
  // tres sitios distintos de la función: cambiarlo en uno solo descolocaba los
  // canales entre sí sin que nada avisara. CLAUDE.md §4 pide que no haya
  // constantes escondidas a mitad de función.
  escalaBase: 30,

  // Duración que se asume cuando el reloj no dice nada. Es una suposición, no
  // un dato: si el día trae minutos del Suunto se usan esos.
  minutosPorDefecto: 60,

  // Rango de cordura del OT que se lee de ct5_tests, en tanto por ciento.
  // El campo es texto libre: teclear 0,65 en vez de 65 pasaba el guardián de
  // costeIntensidad (0 < u < 1) y le cambiaba de escala todo el histórico de
  // suspensiones sin que nada avisara. Fuera de rango se ignora y se dice.
  rangoOT: [40, 90],

  // A partir de qué coeficiente de canal se considera que un ejercicio (o una
  // actividad) carga los dedos DE VERDAD. Decide dos cosas: qué días cuentan
  // para la ventana tendinosa y qué ejercicios entran en el reparto por
  // agarre. Se decide por TIPO, no por magnitud: un gimnasio entero suma 0,2
  // de dedos —coeficientes de 0,05— y la ventana lo daba por bueno, así que el
  // día después de ir al gimnasio la pantalla decía "1 día desde tu última
  // carga de dedos" y se ponía roja. Un rocódromo da 18. No es lo mismo.
  // Con 0,30: cuentan roca (0,80), rocódromo (0,85), suspensiones (1,00),
  // bloque (0,85), travesía (0,60), vía (0,70) y los tests (0,95). No cuentan
  // gimnasio, yoga, movilidad, core, hombro ni cardio.
  umbralCanalDedos: 0.30,
};

/* ------------------------------------------------------------------
   Intensidad → coste, con el umbral de oclusión
   Por debajo del umbral el flujo sanguíneo está restaurado: no acumula.
   ------------------------------------------------------------------ */
export function costeIntensidad(fraccion, umbral) {
  const i = Number(fraccion);
  if (!(i > 0)) return 0;
  // El umbral de Juan si lo tenemos; si no, la media poblacional de respaldo.
  const u = (Number.isFinite(umbral) && umbral > 0 && umbral < 1) ? umbral : PARAMS.umbralOclusion;
  if (i <= u) return 0;
  return Math.pow((i - u) / (1 - u), PARAMS.exponente);
}

/** Fracción de RPE de un bloque. Un 0 anotado es un 0, no un "no hay dato". */
export function rpeFraccion(bloque) {
  const r = Number(bloque?.rpe);
  const v = (Number.isFinite(r) && r >= 0) ? r : PARAMS.rpePorDefecto;
  return Math.min(v / PARAMS.escalaRpe, 1);
}

/* ------------------------------------------------------------------
   PERFIL DE FUERZA · sale de `ct5_tests`, la pestaña Tests de la app

   Juan ya mantiene ahí su perfil —peso, MED40, MAW5, OT, CF y su curva
   individual de tiempo al fallo— con un formulario para actualizarlo. Hasta
   hoy el modelo de carga NO lo leía: usaba un umbral de un paper y asumía un
   75 % fijo para cualquier suspensión. Su perfil era decorativo.

   Dos reglas:

   1. Se usa el test vigente EN LA FECHA de la sesión, no el último. Una
      sesión de mayo se puntúa con la forma que tenía en mayo, no con la de
      agosto. Sus números se mueven de verdad: entre enero y julio de 2026
      bajó de 83 a 80 kg, el MED40 de 16 a 15 mm y subió el MAW5 de 20 a
      27 kg.
   2. El respaldo es POR CAMPO, no por registro. Su test del 28-07 no tiene
      el OT rellenado porque no se re-testeó, así que ese campo sigue
      valiendo el 65 % de enero mientras el resto viene de julio.
   ------------------------------------------------------------------ */

const pos = v => { const n = Number(v); return (Number.isFinite(n) && n > 0) ? n : null; };

/**
 * Perfil de fuerza vigente en `fechaISO`. Devuelve `null` si no hay ningún
 * test anterior con lo mínimo (peso, fuerza máxima y regleta de referencia):
 * entonces el modelo estima y lo dice, en vez de rellenar el hueco.
 */
const ES_ISO = /^\d{4}-\d{2}(-\d{2})?$/;

export function perfilEnFecha(tests, fechaISO) {
  // Sin fecha válida no se elige perfil. Antes, una fecha vacía o rota dejaba
  // pasar el filtro y ganaba el test más nuevo, incluso uno del futuro.
  if (!fechaISO || !ES_ISO.test(String(fechaISO))) return null;
  const previos = (tests || [])
    .filter(t => t && ES_ISO.test(String(t.fecha || '')) && String(t.fecha) <= String(fechaISO))
    .sort((a, b) => (String(a.fecha) < String(b.fecha) ? 1 : -1));   // más reciente primero
  if (!previos.length) return null;

  // Respaldo por campo, devolviendo TAMBIÉN de qué test sale cada uno: la
  // pantalla presentaba los cuatro números como si fueran del mismo test
  // cuando el umbral venía de seis meses antes.
  const campo = (...nombres) => {
    for (const t of previos) for (const n of nombres) {
      const v = pos(t[n]);
      if (v !== null) return { v, de: t.fecha };
    }
    return null;
  };
  const peso = campo('peso');
  if (!peso) return null;

  // `fmaxRegleta` y `cargaRegleta` son un PAR: la fuerza máxima está medida EN
  // esa regleta. Se cogen del mismo test o no se cogen. Y se descarta el
  // fmaxRegleta que no supere el peso corporal: TestP lo calcula como
  // `peso + (MAW5 || 0)`, así que un test guardado sin MAW5 deja ahí el peso
  // pelado y eso daría %MVC = 100 % en todas las suspensiones.
  let par = null;
  for (const t of previos) {
    const f = pos(t.fmaxRegleta), r = pos(t.cargaRegleta) ?? pos(t.MED40);
    const m = pos(t.MAW5);
    const fEfectiva = (f !== null && f > pos(t.peso ?? peso.v)) ? f
                    : (m !== null && pos(t.peso) !== null) ? pos(t.peso) + m : null;
    if (fEfectiva !== null && r !== null) { par = { fmaxRef: fEfectiva, regletaRef: r, de: t.fecha }; break; }
  }
  if (!par) return null;

  // El OT en tanto por ciento. Fuera de un rango de cordura se ignora: teclear
  // 0,65 en vez de 65 pasaba el guardián y le cambiaba de escala todo el
  // histórico de suspensiones.
  const ot = campo('OT');
  const otOk = ot && ot.v >= PARAMS.rangoOT[0] && ot.v <= PARAMS.rangoOT[1];

  return {
    fecha: previos[0].fecha,
    peso: peso.v, pesoDe: peso.de,
    fmaxRef: par.fmaxRef, regletaRef: par.regletaRef, fuerzaDe: par.de,
    umbralOclusion: otOk ? ot.v / 100 : null,
    umbralDe: otOk ? ot.de : null,
    otFueraDeRango: !!(ot && !otOk),
  };
}

/**
 * %MVC real de una suspensión, con el modelo de su entrenador:
 *
 *   Fmáx(mm) = fmaxRef × (1 − ajusteFuerzaPorMm × (regletaRef − mm))
 *   %MVC     = (peso + lastre) / Fmáx(mm)
 *
 * Devuelve `{ pct, fuera }` o `null` si falta algún dato. `fuera` avisa de que
 * la regleta está lejos de la de referencia y la recta es extrapolación.
 * Un lastre negativo es válido: su entrenador prescribe polea o goma para
 * bajar del 80 %.
 */
export function pctMVCSuspension(perfil, regletaMm, lastreKg) {
  if (!perfil) return null;
  const mm = Number(regletaMm);
  if (!Number.isFinite(mm) || mm <= 0) return null;
  const l = (lastreKg === undefined || lastreKg === null || lastreKg === '') ? 0 : Number(lastreKg);
  if (!Number.isFinite(l)) return null;
  const factor = 1 - PARAMS.ajusteFuerzaPorMm * (perfil.regletaRef - mm);
  if (!(factor > 0)) return null;
  const fmax = perfil.fmaxRef * factor;
  if (!(fmax > 0)) return null;
  // Asistencia igual o mayor que su peso: no está colgando de nada. Es 0, no
  // "no se puede calcular" — devolver null caía en el 75 % por defecto, que es
  // inventarse un dato justo en la dirección peligrosa.
  const carga = perfil.peso + l;
  if (carga <= 0) return { pct: 0, fuera: false };
  return { pct: carga / fmax, fuera: Math.abs(mm - perfil.regletaRef) > PARAMS.margenRegletaMm };
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

/* ------------------------------------------------------------------
   La escala la decide el TIPO de ejercicio, no qué campo esté relleno.
   El conjunto ESCALA_ESFUERZO vive en catalogo.js, junto a los tipos.

   Un bloque "al 65 %" es el 65 % de su nivel DE BLOQUE, no el 65 % de la
   fuerza máxima de sus dedos. Pasarlo por el umbral de oclusión lo borraba:
   al 65 % costeIntensidad da 0 y al 75 % da 0,07. Es el mismo error de
   categoría del §4b de CLAUDE.md, en la otra dirección.
   ------------------------------------------------------------------ */

/**
 * Intensidad de un bloque. Devuelve además de qué escala viene, porque
 * el coste se calcula distinto según sea %MVC medido o esfuerzo percibido.
 */
function intensidadBloque(bloque, ejercicio, perfil) {
  const pct = ejercicio?.params?.pct_mvc ?? ejercicio?.params?.pct_max;
  if (pct > 0) {
    return {
      i: Math.min(pct / 100, 1),
      // La curva del umbral SOLO para los tipos cuyo % es fuerza de dedos.
      // Antes bastaba con no estar en ESCALA_ESFUERZO, y por ahí se colaban la
      // dominada, el gimnasio, el core y el hombro: un press de banca al 85 %
      // es el 85 % de su máximo de banca, no de la fuerza de sus dedos.
      escala: MVC_DEDOS.has(ejercicio?.tipo) ? 'mvc' : 'esfuerzo',
      procedencia: 'anotado',
    };
  }

  if (MVC_DEDOS.has(ejercicio?.tipo)) {
    // Sin porcentaje escrito se CALCULA con el tamaño de regleta, el lastre y
    // el perfil de fuerza vigente ese día. Antes se asumía un 75 % fijo.
    const c = pctMVCSuspension(perfil, ejercicio?.params?.regleta_mm, ejercicio?.params?.lastre_kg);
    if (c) {
      return {
        i: Math.min(c.pct, 1),
        escala: 'mvc',
        // Es un modelo, no una medición suya: se marca como calculado. Y si la
        // regleta queda lejos de la de referencia, o si sale por encima del
        // 100 % —señal de que el perfil se ha quedado viejo—, es estimación.
        procedencia: (c.fuera || c.pct > 1) ? 'estimado' : 'calculado',
        superaFmax: c.pct > 1,
      };
    }
    return { i: PARAMS.pctSuspPorDefecto / 100, escala: 'mvc', procedencia: 'estimado' };
  }

  // 'rpe', no 'anotado': el porcentaje no lo ha escrito él, sale del esfuerzo
  // percibido del bloque. Llamarlo anotado hinchaba el recuento de la pantalla.
  return { i: rpeFraccion(bloque), escala: 'rpe', procedencia: 'rpe' };
}

/** Aplica la curva que toque según de dónde venga la intensidad. */
function costeSegunEscala(x, perfil) {
  return x.escala === 'mvc'
    ? costeIntensidad(x.i, perfil?.umbralOclusion)
    : costeEsfuerzo(x.i);
}

/* ------------------------------------------------------------------
   Carga de una sesión de entrenamiento con detalle
   ------------------------------------------------------------------ */
export function cargaPorDetalle(sesionEnt, perfil = null) {
  let bloques = sesionEnt?.bloques;
  if (typeof bloques === 'string') { try { bloques = JSON.parse(bloques); } catch { return null; } }
  if (!Array.isArray(bloques) || !bloques.length) return null;

  let hayDetalle = false;
  const r = {
    dedos: 0, cuerpo: 0, sistemico: 0, pico: 0, porAgarre: {}, cargaDedos: false,
    // De dónde sale la intensidad, SOLO de las suspensiones y los tests: son
    // los únicos donde el número es %MVC de dedos y donde tiene sentido
    // distinguir anotado de calculado. Contar los 11 tipos mezclaba el RPE de
    // una sentadilla con el 90 % de una suspensión y la pantalla llegó a decir
    // "129 anotadas" cuando eran 10.
    procedencia: { anotado: 0, calculado: 0, estimado: 0 },
    // Minutos de trabajo de dedos que quedan POR DEBAJO de su umbral de
    // oclusión y por tanto no acumulan nada. No es un fallo: es lo que dice
    // el modelo de su entrenador. Pero si no se cuenta, un bloque entero
    // desaparece en silencio.
    minSubUmbral: 0,
  };

  for (const b of bloques) {
    const ejs = ejerciciosDeBloque(b);
    if (!ejs.length) continue;
    hayDetalle = true;
    const min = Number(b.minutos) || 0;
    const cuota = min / ejs.length;

    // Chips de agarre marcados a mano en el bloque. Cuando están, mandan
    // ellos: en el rocódromo no hay tamaño de regleta del que deducir nada,
    // y `e.agarre` vale 'mixto' en bloques, travesías y suspensiones. Es el
    // mismo criterio que repartoAgarres() de agarres.js.
    const chips = Array.isArray(b.agarres) ? b.agarres.filter(a => AGARRE_POR_ID[a]) : [];
    let dedosBloque = 0;

    for (const e of ejs) {
      const t = TIPO_POR_ID[e.tipo];
      if (!t) continue;
      const x = intensidadBloque(b, e, perfil);
      const coste = costeSegunEscala(x, perfil);

      // `cuerpo` y `sistemico` NO pueden salir del mismo número que `dedos`
      // cuando ese número es %MVC de DEDOS: el 75 % de tu fuerza máxima de
      // dedos no es un 75 % de esfuerzo para el tronco. Se decide por TIPO
      // (MVC_DEDOS), no por la escala: una dominada al 80 % sí es intensidad
      // de tronco y tiene que seguir usando su propio porcentaje.
      const esf = MVC_DEDOS.has(e.tipo) ? costeEsfuerzo(rpeFraccion(b)) : costeEsfuerzo(x.i);
      const dd = cuota * coste * (t.dedos ?? 0);

      r.dedos     += dd;
      r.cuerpo    += cuota * esf   * (t.cuerpo ?? 0);
      r.sistemico += cuota * esf   * (t.sist   ?? 0);
      if (x.i > r.pico) r.pico = x.i;
      if (MVC_DEDOS.has(e.tipo) && r.procedencia[x.procedencia] !== undefined) {
        r.procedencia[x.procedencia]++;
        if (x.superaFmax) r.superaFmax = true;
      }
      if (x.procedencia === 'estimado') r.estimado = true;
      // Trabajo de dedos que se queda por debajo del umbral y no acumula.
      if ((t.dedos ?? 0) >= PARAMS.umbralCanalDedos && x.escala === 'mvc' && coste === 0) {
        r.minSubUmbral += cuota;
      }
      // ¿Este día cuenta como "carga de dedos"? Se decide por el TIPO de
      // ejercicio, no por el número: un gimnasio entero da 0,2 de dedos y eso
      // no es colgarse de nada. Ver PARAMS.umbralCanalDedos.
      if ((t.dedos ?? 0) >= PARAMS.umbralCanalDedos) r.cargaDedos = true;

      if ((t.dedos ?? 0) >= PARAMS.umbralCanalDedos) {
        if (chips.length) dedosBloque += dd;
        else {
          const a = agarreDe(e);
          if (a) r.porAgarre[a] = (r.porAgarre[a] || 0) + dd;
        }
      }
    }

    // La carga de dedos del bloque se reparte entre los chips marcados.
    if (chips.length && dedosBloque > 0) {
      for (const a of chips) r.porAgarre[a] = (r.porAgarre[a] || 0) + dedosBloque / chips.length;
    }
  }
  if (!hayDetalle) return null;
  r.origen = 'detalle';
  r.minSubUmbral = Math.round(r.minSubUmbral);
  return redondear(r);
}

/* ------------------------------------------------------------------
   Respaldo para los días que solo tienen actividad y fatiga
   ------------------------------------------------------------------ */
/** Fatiga del dia. Vacio o ilegible -> valor por defecto. Un 0 anotado es un 0. */
function fatigaDe(dia) {
  const b = dia?.fatiga_fin;
  if (b === '' || b === null || b === undefined) return PARAMS.fatigaPorDefecto;
  const n = Number(b);
  return Number.isFinite(n) ? n : PARAMS.fatigaPorDefecto;
}

export function cargaPorActividad(dia) {
  const a = (dia?.activitat || '').trim().toLowerCase();
  let coef = null;
  for (const k of Object.keys(PARAMS.porActividad)) {
    if (a.includes(k)) { coef = PARAMS.porActividad[k]; break; }
  }
  if (!coef) return null;
  const ff = fatigaDe(dia);                        // respeta un 0 legitimo
  const i = Math.min(ff / PARAMS.escalaFatiga, 1);
  const coste = costeEsfuerzo(i);                  // fatiga NO es %MVC: sin umbral
  // El reloj solo cuenta si de verdad trae números. Una copia restaurada desde
  // un CSV antiguo dejaba aquí la cadena "[object Object]", que es truthy: el
  // día se etiquetaba 'actividad+reloj' mientras tiraba de la duración por
  // defecto. Decía que usaba el reloj sin usarlo.
  const s = (dia?.suunto && typeof dia.suunto === 'object') ? dia.suunto : null;
  const minReloj = Number(s?.min) > 0 ? Number(s.min) : null;
  const min = minReloj ?? PARAMS.minutosPorDefecto;
  const esc = PARAMS.escalaActividad;              // puente con cargaPorDetalle
  return redondear({
    dedos:     (min / 60) * coste * coef.dedos * PARAMS.escalaBase * esc.dedos,
    cuerpo:    (min / 60) * costeEsfuerzo(i) * coef.cuerpo * PARAMS.escalaBase * esc.cuerpo,
    sistemico: cargaSistemica(s, coef, i, min) * esc.sistemico,
    pico: i, porAgarre: {}, estimado: true,
    cargaDedos: coef.dedos >= PARAMS.umbralCanalDedos,
    origen: (minReloj || Number(s?.kcal) > 0) ? 'actividad+reloj' : 'actividad',
  });
}

/** Si hay datos del Suunto se usan; si no, se estima. */
function cargaSistemica(s, coef, i, min) {
  if (s && s.kcal > 0) return (s.kcal / 100) * (s.hr_med ? Math.min(s.hr_med / 100, 2) : 1);
  return (min / 60) * (i ** PARAMS.exponente) * coef.sistemico * PARAMS.escalaBase;
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
export function seriesCarga(cal, ent, tests) {
  const porDia = {};
  const add = (fecha, c) => {
    if (!fecha || !c) return;
    const d = porDia[fecha] || (porDia[fecha] = { dedos: 0, cuerpo: 0, sistemico: 0, pico: 0, origen: [], cargaDedos: false });
    d.dedos += c.dedos; d.cuerpo += c.cuerpo; d.sistemico += c.sistemico;
    if (c.pico > d.pico) d.pico = c.pico;
    if (c.cargaDedos) d.cargaDedos = true;
    if (c.origen && !d.origen.includes(c.origen)) d.origen.push(c.origen);
  };

  const conDetalle = new Set();
  for (const s of ent || []) {
    // El perfil de fuerza VIGENTE ESE DÍA, no el de hoy: una sesión de mayo se
    // puntúa con la forma que tenía en mayo.
    const c = cargaPorDetalle(s, perfilEnFecha(tests, s.fecha));
    if (c) { add(s.fecha, c); conDetalle.add(s.fecha); }
  }
  for (const d of cal || []) {
    if (conDetalle.has(d.fecha) && PARAMS.actividadesConDetalle.test(d.activitat || '')) continue;
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
