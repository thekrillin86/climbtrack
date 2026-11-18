/**
 * ClimbTrack · comprobaciones del plan de Talaia y del modo de los tests
 * archivo nuevo: src/plan.test.mjs (18-11-2026)
 *
 * Node a secas, sin dependencias. Se ejecuta con `npm test`, después de las
 * del modelo de carga.
 *
 * El plan de ejemplo (`plan.ejemplo.json`) es el real de la semana del 23-11
 * que dejó Talaia en Drive, con las notas personales quitadas: el repositorio
 * es público. La estructura, los nombres para ClimbTrack y las dosis son los
 * mismos.
 *
 * Como en carga.test.mjs: si una comprobación falla y lo nuevo es lo correcto,
 * se cambia aquí el valor esperado y se explica en el commit.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { leerPlanTexto, kilosMano, medioKg, rellenarEntreno, horaInicio, cicloPropio, apuntado } from './plan.js';
import { compararTest, modoDe, kgDeN, porModo } from './tindeq.js';
import { validarPropuesta } from './bandeja.js';
import { clasificar } from './catalogo.js';

const resultados = [];
function prueba(nombre, fn) {
  try { fn(); resultados.push({ nombre, ok: true }); }
  catch (e) { resultados.push({ nombre, ok: false, msg: e.message }); }
}

const TEXTO = fs.readFileSync(new URL('./plan.ejemplo.json', import.meta.url), 'utf8');
const { plan: PLAN } = leerPlanTexto(TEXTO);
const dia = f => PLAN.dias.find(d => d.fecha === f);
const N = kg => kg * 9.80665;                        // un test escrito en newtons
const arriba = (fecha, mm, esq, dre, extra = {}) => ({ fecha, mm, esq, dre, modo: 'arriba', momento: 'pre', ...extra });
let n = 0; const id = () => 'id' + (++n);

/* ------------------------------------------------------------------ */
prueba('1 · el plan real se lee: un día con sesión y uno de descanso', () => {
  assert.ok(PLAN, 'el plan de ejemplo no se ha podido leer');
  assert.equal(PLAN.id, '2026-11-23');
  assert.equal(PLAN.dias.length, 7, `trae ${PLAN.dias.length} días, no 7`);
  const lunes = dia('2026-11-23');
  assert.equal(lunes.descanso, true, 'el lunes 23 es descanso');
  assert.ok(lunes.nota.length > 0, 'el descanso trae su nota');
  const jueves = dia('2026-11-26');
  assert.equal(jueves.descanso, false);
  assert.equal(jueves.tipoCT, 'Suspensions/Dominades');
  assert.equal(jueves.bloques.length, 4, `el jueves trae ${jueves.bloques.length} bloques, no 4`);
  const dedos = jueves.bloques[1].items[0];
  assert.deepEqual(dedos.dosis, { pct: 85, mm: 15 }, 'la dosis {pct, mm} se conserva como número');
  assert.equal(dedos.nombre, 'Susp. 15mm 85% semiarqueo');
});

prueba('2 · un plan roto no tumba la pantalla: dice qué le pasa', () => {
  assert.ok(leerPlanTexto('esto no es json').error, 'un texto que no es JSON tiene que dar un error legible');
  assert.ok(leerPlanTexto('{"id":"2026-11-23"}').error, 'un plan sin días tiene que dar un error');
  assert.ok(leerPlanTexto('{"dias":[{"fecha":"2026-11-23"}]}').error, 'un plan sin semana (id) tiene que dar un error');
  const { plan } = leerPlanTexto('{"id":"2026-11-23","dias":[{"fecha":"mal"},{"fecha":"2026-11-24","descanso":true}]}');
  assert.equal(plan.dias.length, 1, 'un día sin fecha se salta y el resto se enseña');
});

prueba('3 · kilos: 85 % de 52,0 → 44,0 y 85 % de 47,3 → 40,0 (a 0,5 kg)', () => {
  assert.equal(medioKg(0.85 * 52.0), 44.0);
  assert.equal(medioKg(0.85 * 47.3), 40.0);
  // Los tests de la app están en newtons: 52,0 kg y 47,3 kg escritos en N.
  const treg = [arriba('2026-11-24', 15, N(52.0), N(47.3))];
  const d = { pct: 85, mm: 15 };
  const iz = kilosMano(d, 'izq', treg, [], {});
  const de = kilosMano(d, 'dch', treg, [], {});
  assert.equal(iz.kg, 44.0, `izquierda da ${iz.kg}`);
  assert.equal(de.kg, 40.0, `derecha da ${de.kg}: cada mano con SU test, no la media`);
  assert.equal(iz.de, 'app');
  // Con números redondos de newtons, como los escribe él: 510 N y 464 N.
  assert.equal(kilosMano(d, 'izq', [arriba('2026-11-24', 15, 510, 464)], [], {}).kg, 44.0);
  assert.equal(kilosMano(d, 'dch', [arriba('2026-11-24', 15, 510, 464)], [], {}).kg, 40.0);
});

prueba('4 · sin test tirando hacia arriba: se dice que falta (y el plan solo de respaldo)', () => {
  const d = { pct: 85, mm: 15 };
  const nada = kilosMano(d, 'izq', [], [], PLAN.tests);
  assert.equal(nada.kg, null, 'sin ningún test no puede salir un número');
  assert.equal(nada.falta, 'falta el test tirando hacia arriba a 15 mm');
  // un test colgado o sin modo, a esos mismos mm, NO vale como «arriba»
  const viejos = [{ fecha: '2026-11-05', mm: 15, esq: 700, dre: 690, momento: 'pre' },
                  { fecha: '2026-11-06', mm: 15, esq: 700, dre: 690, modo: 'colgado' }];
  assert.equal(kilosMano(d, 'izq', viejos, [], {}).kg, null, 'un test sin modo o colgado se ha usado como «arriba»');
  // ni un «post», con los dedos ya cansados
  assert.equal(kilosMano(d, 'izq', [arriba('2026-11-24', 15, 510, 464, { momento: 'post' })], [], {}).kg, null);
  // el plan trae su test: se usa, y se dice de dónde sale
  const delPlan = kilosMano(d, 'izq', [], [], { fecha: '2026-11-24', t15i: 52.0 });
  assert.equal(delPlan.kg, 44.0); assert.equal(delPlan.de, 'plan');
  // si la app tiene el suyo, manda el de la app
  const ambos = kilosMano(d, 'izq', [arriba('2026-11-25', 15, N(60), N(55))], [], { t15i: 52.0 });
  assert.equal(ambos.de, 'app'); assert.equal(ambos.kg, 51.0);
});

prueba('5 · «Hecho» rellena tipo, bloques, ejercicios, series y minutos; RPE y fatiga final vacíos', () => {
  const ent = [
    { fecha: '2026-11-05', macro: 3, meso: 1, tipo: 'Rocòdrom' },
    { fecha: '2026-11-10', macro: 9, meso: 9, tipo: 'Rocòdrom', origen: 'talaia:x' },   // no es suyo
  ];
  const f = rellenarEntreno(dia('2026-11-26'), PLAN, ent, [], id);
  assert.equal(f.fecha, '2026-11-26');
  assert.equal(f.hora, '08:00', `la hora «8:00-9:15» da «${f.hora}»`);
  assert.equal(f.tipo, 'Suspensions/Dominades');
  assert.deepEqual([f.macro, f.meso], [3, 1], 'macro y meso tienen que salir del último registro escrito por él');
  assert.equal(f.bloques.length, 4);
  assert.deepEqual(f.bloques.map(b => b.tipo), ['General', 'Específica', 'General', 'General']);
  assert.deepEqual(f.bloques[1].ejercicios, ['Susp. 15mm 85% semiarqueo', 'Dominadas lastradas']);
  assert.deepEqual([f.bloques[1].series, f.bloques[1].minutos], [3, 12]);
  assert.ok(f.bloques.every(b => b.rpe === ''), 'el RPE lo pone él: tiene que llegar vacío');
  assert.equal(f.fatiga_fin, '', 'la fatiga final la pone él');
  assert.equal(f.fatiga_ini, 1);
  assert.equal(f.origen, 'plan:2026-11-23');
  // un ítem sin nombre para ClimbTrack no entra como ejercicio
  const martes = rellenarEntreno(dia('2026-11-24'), PLAN, ent, [], id);
  assert.deepEqual(martes.bloques[2].ejercicios, ['Susp. 25mm fuerza critica test'],
    'en el bloque de fuerza crítica solo entra el ítem que trae nombre');
  assert.equal(horaInicio('17:15'), '17:15'); assert.equal(horaInicio('por la tarde'), '');
  assert.deepEqual(cicloPropio([], []), { macro: '', meso: '' });
});

prueba('6 · un día queda marcado si hay algo apuntado en Entreno o en Rutina', () => {
  assert.equal(apuntado('2026-11-26', [{ fecha: '2026-11-26' }], []), true);
  assert.equal(apuntado('2026-11-26', [], [{ fecha: '2026-11-26', activitat: 'Descans' }]), true);
  assert.equal(apuntado('2026-11-26', [{ fecha: '2026-11-25' }], []), false);
});

prueba('7 · un test sin modo no se compara con uno «arriba»', () => {
  const sinModo = ['2026-10-20', '2026-10-25', '2026-10-30', '2026-11-02'].map(f => ({ fecha: f, mm: 15, esq: 700, dre: 700, momento: 'pre' }));
  // el último es «arriba»: con tres «sin modo» detrás no hay base comparable
  const solo = compararTest([...sinModo, arriba('2026-11-10', 15, 510, 464)], []);
  assert.equal(solo.modo, 'arriba');
  assert.equal(solo.sinBase, true, 'se ha comparado un test «arriba» con tests sin modo');
  assert.equal(solo.n, 0);
  // con tres «arriba» detrás sí, y la media sale solo de esos
  const base = ['2026-11-03', '2026-11-05', '2026-11-07'].map(f => arriba(f, 15, 500, 450));
  const c = compararTest([...sinModo, ...base, arriba('2026-11-10', 15, 520, 468)], []);
  assert.equal(c.sinBase, false); assert.equal(c.n, 3);
  assert.equal(c.media, 950, `la media tiene que ser la de los «arriba» (950), no ${c.media}`);
  // y al revés: el histórico sin modo sigue comparándose entre sí
  const h = compararTest(sinModo, []);
  assert.equal(h.modo, ''); assert.equal(h.sinBase, false); assert.equal(h.n, 3);
  assert.equal(modoDe({ modo: 'tirando' }), '', 'un modo que no existe cuenta como «sin indicar»');
  assert.deepEqual(porModo([...sinModo, ...base]).map(([m]) => m), ['arriba', ''], 'el modo más reciente va primero');
  assert.equal(Math.round(kgDeN(510) * 10) / 10, 52.0);
});

prueba('8 · la bandeja acepta el modo bueno y rechaza uno mal escrito', () => {
  const p = modo => ({ id: 'x', registros: [{ clave: 'ct5_treg', registro: { fecha: '2026-11-24', mm: 15, esq: 510, dre: 464, ...(modo !== undefined ? { modo } : {}) } }] });
  assert.equal(validarPropuesta(p('arriba')), null);
  assert.equal(validarPropuesta(p(undefined)), null, 'sin modo también vale: es opcional');
  assert.match(validarPropuesta(p('tirando')) || '', /modo del test/, 'un modo mal escrito tiene que rechazarse');
});

prueba('9 · nombres del plan que el clasificador no reconoce (para Talaia)', () => {
  const nombres = [...new Set(PLAN.dias.flatMap(d => d.bloques.flatMap(b => b.items.map(i => i.nombre).filter(Boolean))))];
  assert.ok(nombres.length > 0, 'el plan de ejemplo no trae ningún nombre para ClimbTrack');
  const sin = nombres.filter(x => !clasificar(x));
  const comoTest = nombres.filter(x => clasificar(x) === 'SUSP_TEST');
  // No falla por esto: es una lista para que Talaia cambie los nombres en el
  // plan. El catálogo no se toca para hacerlos encajar sin decírselo a Juan.
  console.log(`\n  [9] ${nombres.length} nombres del plan · SIN_CLASIFICAR: ${sin.length ? sin.join(' · ') : 'ninguno'}`);
  console.log(`  [9] cuentan como test de dedos (SUSP_TEST): ${comoTest.length ? comoTest.join(' · ') : 'ninguno'}`);
});

/* ------------------------------------------------------------------ */
const fallos = resultados.filter(r => !r.ok);
console.log('\nClimbTrack · comprobaciones del plan y del modo de los tests\n');
for (const r of resultados) console.log(`  ${r.ok ? 'ok   ' : 'FALLA'}  ${r.nombre}`);
for (const r of fallos) console.log(`\n  FALLA · ${r.nombre}\n    ${r.msg.replace(/\n/g, '\n    ')}`);
console.log(`\n  ${resultados.length - fallos.length} de ${resultados.length} pasan` +
  (fallos.length ? ` · ${fallos.length} fallo${fallos.length === 1 ? '' : 's'}` : '') + '\n');
process.exit(fallos.length ? 1 : 0);
