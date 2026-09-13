/**
 * ClimbTrack · comprobaciones del modelo de carga
 * archivo nuevo: src/carga.test.mjs
 *
 * Node a secas, sin dependencias. Se ejecuta con `npm test`.
 *
 * POR QUÉ EXISTE. En un mes se colaron tres regresiones del mismo tipo —un
 * guardián nuevo que protege un caso que el formulario no permite escribir y
 * que rompe el caso por defecto de ese mismo formulario— y las tres se
 * encontraron a mano, cada una con su despliegue:
 *
 *   18-08  «Fondos cajón» pasaba a tren inferior por la palabra «cajón»
 *   19-08  «Rfd 10mm» dejaba de clasificar y el ejercicio no sumaba nada
 *   19-08  el RPE en blanco se tomaba por un 0 anotado y anulaba el bloque
 *          entero. Estuvo vivo en producción hasta el 13-09.
 *
 * ESTO NO MANDA SOBRE EL MODELO. Si una comprobación falla y el
 * comportamiento nuevo es el correcto, se cambia el valor esperado aquí y se
 * explica por qué en el commit. Sirve para que ningún cambio pase
 * inadvertido, no para congelar el modelo.
 */

import assert from 'node:assert/strict';
import { cargaPorDetalle, cargaPorActividad, perfilEnFecha } from './carga.js';
import { clasificar } from './catalogo.js';

/* ------------------------------------------------------------------
   Andamiaje mínimo
   ------------------------------------------------------------------ */
const resultados = [];

function prueba(nombre, fn) {
  try { fn(); resultados.push({ nombre, ok: true }); }
  catch (e) { resultados.push({ nombre, ok: false, msg: e.message }); }
}

const CANALES = ['dedos', 'cuerpo', 'sistemico'];
const canales = c => ({ dedos: c.dedos, cuerpo: c.cuerpo, sistemico: c.sistemico });

/* Perfil de fuerza fijo, con los números reales de Juan. Se construye con
   perfilEnFecha() a propósito: así el respaldo POR CAMPO —el OT de enero
   mientras la fuerza sale del test de julio— también queda comprobado. */
const TESTS = [
  { fecha: '2026-01-15', peso: 83, MED40: 16, MAW5: 20, OT: 65, fmaxRegleta: 103, cargaRegleta: 16 },
  { fecha: '2026-07-28', peso: 80, MED40: 15, MAW5: 27, fmaxRegleta: 107, cargaRegleta: 15 },
];
const PERFIL = perfilEnFecha(TESTS, '2026-08-17');

const bloque = (o = {}) => ({
  tipo: 'Específica', minutos: 60, rpe: 6, agarres: [], ejercicios: ['Bloque 25 mov'], ...o,
});
const sesion = (bloques, fecha = '2026-09-13') => ({ fecha, bloques });

/* ==================================================================
   1 · UN RPE EN BLANCO NO ANULA EL BLOQUE
   ================================================================== */
prueba('1 · un RPE en blanco no anula el bloque', () => {
  const c = cargaPorDetalle(sesion([bloque({ rpe: '' })]), PERFIL);
  for (const k of CANALES) {
    assert.ok(c[k] > 0,
      `con el RPE en blanco el canal ${k} sale ${c[k]} y tiene que ser > 0. ` +
      `Number('') es 0: si el RPE vacío se toma por un 0 anotado, costeEsfuerzo(0) = 0 y el ` +
      `bloque entero deja de sumar. El formulario crea cada bloque nuevo con el RPE vacío, ` +
      `así que ése es el estado por defecto. Regresión del 19-08-2026.`);
  }
});

/* ==================================================================
   2 · UN 0 ANOTADO SIGUE VALIENDO 0
   ================================================================== */
prueba('2 · un RPE de 0 anotado sigue valiendo 0', () => {
  const c = cargaPorDetalle(sesion([bloque({ rpe: 0 })]), PERFIL);
  for (const k of CANALES) {
    assert.equal(c[k], 0,
      `con rpe:0 (número) el canal ${k} sale ${c[k]} y tiene que ser 0. ` +
      `Vacío y cero anotado no son lo mismo: el vacío cae en rpePorDefecto y el 0 escrito ` +
      `a mano se respeta. Ésta es la otra mitad del arreglo del 13-09.`);
  }
});

/* ==================================================================
   3 · LOS MINUTOS NEGATIVOS NO RESTAN
   ================================================================== */
prueba('3 · unos minutos negativos no restan carga', () => {
  const c = cargaPorDetalle(sesion([bloque({ minutos: -30 })]), PERFIL);
  for (const k of CANALES) {
    assert.ok(c[k] >= 0,
      `con minutos:-30 el canal ${k} sale ${c[k]} y no puede ser negativo. Un minuto ` +
      `negativo no existe, y sin recortarlo a 0 esa resta se propaga a la serie diaria ` +
      `y a la fatiga acumulada.`);
  }
});

/* ==================================================================
   4 · UN EJERCICIO SIN CLASIFICAR NO SE LLEVA LOS MINUTOS
   ================================================================== */
prueba('4 · un ejercicio sin clasificar no se lleva los minutos', () => {
  const solo = cargaPorDetalle(sesion([bloque({ ejercicios: ['Bloque 25 mov'] })]), PERFIL);
  const conRuido = cargaPorDetalle(sesion([bloque({ ejercicios: ['Bloque 25 mov', 'qwertyuiop'] })]), PERFIL);
  assert.equal(conRuido.dedos, solo.dedos,
    `el bloque aporta ${solo.dedos} de dedos él solo y ${conRuido.dedos} con un ejercicio sin ` +
    `clasificar al lado. cargaPorDetalle reparte los minutos entre TODOS los ejercicios ` +
    `(cuota = min / ejs.length) y después salta los que no tienen tipo, así que el texto sin ` +
    `clasificar se lleva su parte y desaparece con ella. Es el fallo de «Rfd 10mm» y de ` +
    `«Fondos cajón» visto desde dentro: una errata al escribir no debería descontar carga ` +
    `real. Arreglo: repartir la cuota solo entre los ejercicios que sí clasifican.`);
});

/* ==================================================================
   5 · RELLENAR EL DETALLE NUNCA PUNTÚA MENOS QUE NO RELLENARLO
   ================================================================== */
prueba('5 · rellenar el detalle nunca puntúa menos que no rellenarlo', () => {
  // Banda ancha a propósito: los dos motores se puentean con una MEDIANA
  // (PARAMS.escalaActividad), así que un día suelto se desvía mucho y eso no es
  // un fallo — el rango real hoy va de 0,26 a 3,07. Lo que caza esta
  // comprobación es el desplome a cero, que es como se manifestaron las tres
  // regresiones del mes.
  const MIN = 0.1, MAX = 10;
  const dias = [
    ['Rocòdrom', ['Bloque 25 mov'], 90, 7, 3],
    ['Rocòdrom', ['Bloque 25 mov'], 60, 5, 2],
    ['Roca', ['Vías 6c'], 180, 7, 4],
    ['Suspensions/Dominades', ['Susp. 15mm', 'Dominadas +10kg'], 45, 6, 3],
    ['Gimnàs', ['Press banca', 'Sentadilla'], 60, 6, 2],
  ];
  for (const [act, ejercicios, minutos, rpe, ff] of dias) {
    const det = cargaPorDetalle(sesion([bloque({ ejercicios, minutos, rpe })], '2026-09-12'), PERFIL);
    const est = cargaPorActividad({ fecha: '2026-09-12', activitat: act, fatiga_fin: ff });
    for (const k of CANALES) {
      assert.ok(det[k] > 0,
        `${act}: con el detalle relleno el canal ${k} sale ${det[k]}, y solo con la actividad ` +
        `del calendario saldría ${est[k]}. Rellenar el formulario no puede dar cero: además ` +
        `seriesCarga descarta el respaldo del calendario cuando el día tiene detalle, así que ` +
        `el día entero desaparece.`);
      const ratio = det[k] / est[k];
      assert.ok(ratio >= MIN && ratio <= MAX,
        `${act}: el canal ${k} da ${det[k]} con detalle y ${est[k]} solo con la actividad ` +
        `(ratio ${ratio.toFixed(2)}), fuera de la banda ${MIN}–${MAX}. O se ha roto uno de los ` +
        `dos motores, o PARAMS.escalaActividad necesita volver a medirse.`);
    }
  }
});

/* ==================================================================
   6 · EL CLASIFICADOR NO SE ROBA TÉRMINOS ENTRE REGLAS
   ================================================================== */
prueba('6 · el clasificador no se roba términos entre reglas', () => {
  // clasificar() es una cadena de ifs y gana el primero que casa: una palabra
  // genérica colocada arriba le roba ejercicios a las reglas de abajo. Así se
  // rompió «Fondos cajón» el 18-08.
  const casos = [
    ['Fondos cajon', 'GYM_TREN_SUP'],
    ['Fondos cajón', 'GYM_TREN_SUP'],
    ['Remo cajón', 'GYM_TREN_SUP'],
    ['Subida al cajón', 'GYM_TREN_INF'],
    ['Step up cajon', 'GYM_TREN_INF'],
    ['Salto 1 pie cajon', 'GYM_TREN_INF'],
    ['Susp. 15mm', 'SUSP_REGLETA'],
    ['Rfd', 'SUSP_REGLETA'],
    ['Rfd 10mm', 'SUSP_REGLETA'],
    ['RFD 10 mm', 'SUSP_REGLETA'],
    ['Deltoides', 'HOMBRO'],
    ['Press banca', 'GYM_TREN_SUP'],
    ['Sentadilla', 'GYM_TREN_INF'],
    ['Bloque 75%', 'BLOQUE'],
    ['Travesía 25 mov', 'TRAVESIA'],
    ['Dominadas +10kg', 'DOMINADA'],
  ];
  for (const [texto, esperado] of casos) {
    const salio = clasificar(texto);
    assert.equal(salio, esperado,
      `«${texto}» clasifica como ${salio} y tiene que ser ${esperado}. Gana la primera regla ` +
      `que casa: si has añadido un término, mira a qué reglas de más abajo les quita ejercicios.`);
  }
});

/* ==================================================================
   7 · CONTROL DE REGRESIÓN SOBRE UNA SESIÓN CONOCIDA
   ================================================================== */
prueba('7 · la sesión conocida del 17-08 da los mismos números', () => {
  // Valores congelados en la ejecución del 13-09-2026. Si los cambias, di por
  // qué en el commit.
  const SESION = { fecha: '2026-08-17', bloques: [
    { tipo: 'General', minutos: 20, rpe: 3, agarres: [], ejercicios: ['Movilidad hombro', 'Dominadas +5kg'] },
    { tipo: 'Específica', minutos: 20, rpe: 3, agarres: ['canto', 'reg_media'], ejercicios: ['Susp. 15mm', 'Rfd 10mm'] },
    { tipo: 'Específica', minutos: 25, rpe: 4, agarres: ['reg_peque'], ejercicios: ['Bloque 4x25 mov 75%'] },
  ]};

  assert.deepEqual(
    { fmaxRef: PERFIL.fmaxRef, regletaRef: PERFIL.regletaRef, umbralOclusion: PERFIL.umbralOclusion, umbralDe: PERFIL.umbralDe },
    { fmaxRef: 107, regletaRef: 15, umbralOclusion: 0.65, umbralDe: '2026-01-15' },
    `el perfil vigente el 17-08 ha cambiado. El umbral tiene que seguir saliendo del test de ` +
    `enero —respaldo POR CAMPO— mientras la fuerza viene del de julio.`);

  const c = cargaPorDetalle(SESION, PERFIL);

  assert.deepEqual(canales(c), { dedos: 15.6, cuerpo: 8.5, sistemico: 4.8 },
    `los tres canales de la sesión del 17-08 salen ${JSON.stringify(canales(c))} y estaban ` +
    `congelados en {"dedos":15.6,"cuerpo":8.5,"sistemico":4.8}.`);

  assert.deepEqual(c.porAgarre, { canto: 1.7, reg_media: 1.7, reg_peque: 12 },
    `el reparto por agarre sale ${JSON.stringify(c.porAgarre)} y estaba congelado en ` +
    `{"canto":1.7,"reg_media":1.7,"reg_peque":12}. Los chips del bloque mandan sobre e.agarre.`);

  assert.deepEqual(c.procedencia, { anotado: 0, calculado: 2, estimado: 0 },
    `la procedencia sale ${JSON.stringify(c.procedencia)} y estaba congelada en ` +
    `{"anotado":0,"calculado":2,"estimado":0}. Se cuentan SOLO los tipos de MVC_DEDOS: si ` +
    `aparecen más, se está contando el RPE de una sentadilla como si fuera un %MVC.`);

  assert.equal(c.sinMinutos, 0,
    `sinMinutos sale ${c.sinMinutos} y tiene que ser 0: los tres bloques llevan minutos.`);
  assert.equal(c.cargaDedos, true,
    `cargaDedos sale ${c.cargaDedos} y tiene que ser true: la sesión lleva suspensiones y bloque.`);
});

/* ------------------------------------------------------------------
   Salida
   ------------------------------------------------------------------ */
const fallos = resultados.filter(r => !r.ok);

console.log('\nClimbTrack · comprobaciones del modelo de carga\n');
for (const r of resultados) console.log(`  ${r.ok ? 'ok   ' : 'FALLA'}  ${r.nombre}`);
for (const r of fallos) console.log(`\n  FALLA · ${r.nombre}\n    ${r.msg.replace(/\n/g, '\n    ')}`);
console.log(`\n  ${resultados.length - fallos.length} de ${resultados.length} pasan` +
  (fallos.length ? ` · ${fallos.length} fallo${fallos.length === 1 ? '' : 's'}` : '') + '\n');

process.exit(fallos.length ? 1 : 0);
