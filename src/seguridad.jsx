/**
 * ClimbTrack · red de seguridad
 * archivo nuevo: src/seguridad.jsx
 *
 * Todo lo que hay aquí existe por una razón: los datos de Juan viven en un
 * solo navegador, en un solo móvil, y no hay servidor que los devuelva.
 *
 * Tres cosas:
 *   1. Contar lo que hay guardado, para no sobrescribirlo sin avisar.
 *   2. Una descarga de emergencia en JSON crudo, que funciona aunque la app
 *      esté rota.
 *   3. Una pantalla de fallo que NO ofrece el botón de borrar.
 */

import React, { useState } from 'react';
import { ld } from './lib.js';
import { CLAVES } from './migrations.js';

/** Cuántos registros hay guardados ahora mismo, sumando las 8 colecciones. */
export async function contarGuardados() {
  let n = 0;
  for (const k of CLAVES) {
    const v = await ld(k, []);
    if (Array.isArray(v)) n += v.length;
  }
  return n;
}

/** Cuántos registros trae un conjunto que está a punto de escribirse. */
export function contarEntrantes(sd) {
  const campos = ['cal', 'ent', 'roca', 'lib', 't25', 'treg', 'dp', 'tests'];
  return campos.reduce((n, c) => n + (Array.isArray(sd?.[c]) ? sd[c].length : 0), 0);
}

/**
 * Portero de toda escritura destructiva.
 * Si lo que va a entrar tiene MENOS registros que lo que ya hay, pregunta.
 * Devuelve true si se puede seguir.
 */
export async function confirmarSobrescritura(sd) {
  const previos = await contarGuardados();
  const entrantes = contarEntrantes(sd);
  if (previos === 0 || entrantes >= previos) return true;

  const perdidos = previos - entrantes;
  return window.confirm(
    'ATENCIÓN — SE VAN A PERDER DATOS\n\n' +
    `En este dispositivo hay ${previos} registros guardados.\n` +
    `Esta operación los dejaría en ${entrantes}.\n\n` +
    `Se perderían ${perdidos} registros y NO se pueden recuperar.\n\n` +
    'Si querías restaurar una copia, cancela y comprueba que el fichero es el correcto.\n\n' +
    '¿Seguro que quieres continuar?'
  );
}

/**
 * Descarga de emergencia: vuelca las claves tal cual, sin pasar por el
 * generador de CSV. Sirve aunque las migraciones fallen o el CSV esté roto.
 */
export async function descargarBruto() {
  const todo = { exportadoEl: new Date().toISOString(), formato: 'crudo-v1' };
  for (const k of CLAVES) todo[k] = await ld(k, []);
  const texto = JSON.stringify(todo, null, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
  a.download = `climbtrack_RESCATE_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);           // hace falta en algunos navegadores móviles
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
  return texto.length;
}

/**
 * Pantalla de fallo. Deliberadamente NO tiene ningún botón que borre nada.
 * Antes, un fallo de migración caía en la pantalla de bienvenida, que sí lo
 * tiene. Ese era el camino más corto entre un error y perderlo todo.
 */
export function PantallaFallo({ msg, onReintentar }) {
  const [estado, setEstado] = useState(null);

  const rescatar = async () => {
    setEstado('trabajando');
    try {
      const n = await descargarBruto();
      setEstado(`ok:${n}`);
    } catch (e) {
      setEstado('error:' + (e?.message || e));
    }
  };

  return (
    <div className="app">
      <div style={{ padding: 24, maxWidth: 460, margin: '0 auto', paddingTop: 60 }}>
        <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>&#9888;</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, textAlign: 'center' }}>
          La app no ha podido arrancar
        </h1>

        <div style={{ background: 'rgba(107,159,74,0.10)', border: '1px solid #6B9F4A',
                      borderRadius: 10, padding: 14, marginBottom: 18 }}>
          <div style={{ color: '#6B9F4A', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
            Tus datos siguen ahí.
          </div>
          <div style={{ color: '#8B7D6B', fontSize: 13, lineHeight: 1.5 }}>
            No se ha modificado nada. El fallo ha ocurrido al arrancar, antes de
            escribir. Descarga la copia de rescate antes de tocar nada más.
          </div>
        </div>

        <button className="btn-primary btn-lg" style={{ width: '100%', marginBottom: 10 }}
                onClick={rescatar} disabled={estado === 'trabajando'}>
          {estado === 'trabajando' ? 'Preparando...' : 'Descargar copia de rescate'}
        </button>

        {typeof estado === 'string' && estado.startsWith('ok:') && (
          <div style={{ color: '#6B9F4A', fontSize: 13, marginBottom: 10, textAlign: 'center' }}>
            Copia generada ({Math.round(+estado.slice(3) / 1024)} KB). Compruébala en Descargas
            y guárdala fuera del móvil antes de seguir.
          </div>
        )}
        {typeof estado === 'string' && estado.startsWith('error:') && (
          <div style={{ color: '#D4563A', fontSize: 13, marginBottom: 10 }}>
            No se ha podido generar la copia: {estado.slice(6)}
          </div>
        )}

        <button className="btn-secondary btn-lg" style={{ width: '100%', marginBottom: 20 }}
                onClick={onReintentar || (() => window.location.reload())}>
          Reintentar
        </button>

        <details style={{ color: '#6B5F52', fontSize: 12 }}>
          <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Detalle técnico</summary>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                        background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 6 }}>
            {String(msg)}
          </pre>
        </details>
      </div>
    </div>
  );
}
