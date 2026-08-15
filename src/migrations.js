/**
 * ClimbTrack · FASE 1 — sistema de migraciones
 * archivo nuevo: src/migrations.js
 *
 * Qué resuelve: hoy, cuando cambia el esquema de datos, no hay nada que
 * garantice que los registros antiguos sobrevivan. Este módulo hace que
 * cada cambio de esquema sea una función versionada que se ejecuta UNA vez,
 * se verifica antes de escribir, y deja rastro de lo que hizo.
 *
 * Propiedad de seguridad: si una migración falla, NO SE ESCRIBE NADA.
 * Los datos se quedan exactamente como estaban.
 *
 * No cambia ninguna pantalla. Solo se ejecuta al arrancar.
 */

import { ld, sv } from './lib.js';
import { migrarBloquesACatalogo } from './catalogo.js';
import { migrarSuunto } from './suunto.js';

/* ---------------------------------------------------------------
   Claves reales de tu app, verificadas en App.jsx el 15-08-2026.
   La bandera 'ct5_init' NO va aquí: no es una colección.
   --------------------------------------------------------------- */
export const CLAVES = [
  'ct5_cal', 'ct5_ent', 'ct5_roca', 'ct5_lib',
  'ct5_t25', 'ct5_treg', 'ct5_dp', 'ct5_tests',
];

const K_VERSION = 'ct5_schemaVersion';
const K_LOG     = 'ct5_migrationLog';
const K_BACKUP  = 'ct5_preMigrationBackup';

/** Sube este número cada vez que añadas una migración. */
export const ESQUEMA_ACTUAL = 3;

/**
 * Cada entrada transforma TODO el conjunto de datos y devuelve uno nuevo.
 * Reciben y devuelven un objeto { cal:[], roca:[], ent:[], ... }.
 * Deben ser puras: no tocar el argumento, devolver copia.
 */
export const MIGRACIONES = {
  // 1 → esquema original. No hace nada; solo marca el punto de partida.
  1: datos => datos,

  // 2 → catálogo de ejercicios. El texto libre de cada bloque pasa a ser
  //     { tipo, params, agarre }, conservando el original en cada uno.
  2: migrarBloquesACatalogo,

  // 3 → datos del reloj. "Suunto 236min HR79/129 893kcal" deja de ser una
  //     frase y pasa a sesion.suunto = { min, hr_med, hr_max, kcal }.
  //     No toca el campo obs.
  3: migrarSuunto,
};

/* --------------------------- utilidades --------------------------- */

async function cargarTodo() {
  const datos = {};
  for (const k of CLAVES) datos[k] = await ld(k, []);
  return datos;
}

async function guardarTodo(datos) {
  for (const k of CLAVES) await sv(k, datos[k] ?? []);
}

function contar(datos) {
  return Object.fromEntries(CLAVES.map(k => [k, (datos[k] || []).length]));
}

/**
 * Comprueba que una migración no ha destruido nada.
 * Regla: ninguna colección puede perder registros salvo que la migración
 * lo declare expresamente en `permitirPerdida`.
 */
function verificar(antes, despues, permitirPerdida = []) {
  const a = contar(antes), d = contar(despues);
  const problemas = [];
  for (const k of CLAVES) {
    if (permitirPerdida.includes(k)) continue;
    if (d[k] < a[k]) problemas.push(`${k}: ${a[k]} → ${d[k]} (faltan ${a[k] - d[k]})`);
  }
  return problemas;
}

/* --------------------------- ejecución --------------------------- */

/**
 * Llamar UNA vez al arrancar la app, antes de pintar nada.
 * Devuelve { ok, versionAnterior, versionActual, aplicadas, error }.
 */
export async function ejecutarMigraciones({ verbose = true } = {}) {
  const desde = Number(await ld(K_VERSION, 0)) || 0;

  if (desde >= ESQUEMA_ACTUAL) {
    if (verbose) console.log(`[migraciones] al día (v${desde})`);
    return { ok: true, versionAnterior: desde, versionActual: desde, aplicadas: [] };
  }

  let datos = await cargarTodo();
  const conteoInicial = contar(datos);

  // red de seguridad: copia del estado previo antes de tocar nada
  await sv(K_BACKUP, { version: desde, fecha: new Date().toISOString(), datos });

  const aplicadas = [];
  try {
    for (let v = desde + 1; v <= ESQUEMA_ACTUAL; v++) {
      const fn = MIGRACIONES[v];
      if (!fn) throw new Error(`falta la migración ${v}`);

      const antes = datos;
      const despues = await fn(structuredClone(antes));

      const problemas = verificar(antes, despues, fn.permitirPerdida || []);
      if (problemas.length) {
        throw new Error(`la migración ${v} pierde registros → ${problemas.join(' · ')}`);
      }

      datos = despues;
      aplicadas.push(v);
      if (verbose) console.log(`[migraciones] v${v} aplicada`, contar(datos));
    }

    // solo aquí se escribe, y solo si TODAS han pasado
    await guardarTodo(datos);
    await sv(K_VERSION, ESQUEMA_ACTUAL);

    const log = await ld(K_LOG, []);
    log.push({
      fecha: new Date().toISOString(),
      desde, hasta: ESQUEMA_ACTUAL, aplicadas,
      conteoInicial, conteoFinal: contar(datos),
    });
    await sv(K_LOG, log);

    return { ok: true, versionAnterior: desde, versionActual: ESQUEMA_ACTUAL, aplicadas };

  } catch (err) {
    // no se ha escrito nada: los datos siguen intactos
    console.error('[migraciones] ABORTADO, no se ha modificado nada:', err);
    return { ok: false, versionAnterior: desde, versionActual: desde, aplicadas: [], error: String(err) };
  }
}

/** Restaura el estado guardado justo antes de la última migración. */
export async function deshacerUltimaMigracion() {
  const b = await ld(K_BACKUP, null);
  if (!b || !b.datos) return { ok: false, error: 'no hay copia previa' };
  await guardarTodo(b.datos);
  await sv(K_VERSION, b.version);
  return { ok: true, restauradoA: b.version, fecha: b.fecha };
}

/** Para enseñar el estado en una pantalla de ajustes. */
export async function estadoMigraciones() {
  return {
    version: Number(await ld(K_VERSION, 0)) || 0,
    esperada: ESQUEMA_ACTUAL,
    historial: await ld(K_LOG, []),
    copiaPrevia: (await ld(K_BACKUP, null))?.fecha || null,
  };
}
