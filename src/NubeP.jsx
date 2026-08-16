/**
 * ClimbTrack · pestaña NUBE
 * archivo nuevo: src/NubeP.jsx
 *
 * Entrar es opcional. Sin sesión, la app funciona igual que siempre;
 * simplemente no hay copia. Nada de esta pantalla bloquea nada.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { iniciarNube, entrar, salir, subirTodo, leerResumenNube, descargarTodo, estadoNube } from './nube.js';
import { CLAVES } from './migrations.js';
import { ld } from './lib.js';

const NOMBRES = {
  ct5_cal: 'Calendario', ct5_ent: 'Entrenamientos', ct5_roca: 'Salidas de roca',
  ct5_lib: 'Libreta', ct5_t25: 'Tindeq 25 mm', ct5_treg: 'Tindeq regleta',
  ct5_dp: 'Datos personales', ct5_tests: 'Tests',
};

const Caja = ({ children, borde }) => (
  <div className="card" style={{ padding: 16, border: borde ? `1px solid ${borde}` : undefined }}>
    {children}
  </div>
);

export default function NubeP({ onRestaurar }) {
  const [est, setEst] = useState(estadoNube());
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState(null);
  const [ocupado, setOcupado] = useState(false);
  const [local, setLocal] = useState(null);
  const [nube, setNube] = useState(null);

  useEffect(() => { iniciarNube(setEst); }, []);

  const contarLocal = useCallback(async () => {
    const por = {};
    for (const k of CLAVES) { const v = await ld(k, []); por[k] = Array.isArray(v) ? v.length : 0; }
    setLocal(por);
  }, []);

  useEffect(() => { contarLocal(); }, [contarLocal]);

  const refrescarNube = useCallback(async () => {
    if (!est.usuario) return;
    const r = await leerResumenNube();
    setNube(r.ok ? r : null);
    if (!r.ok) setMsg({ t: 'err', x: r.error });
  }, [est.usuario]);

  useEffect(() => { refrescarNube(); }, [refrescarNube, est.ultimaSubida]);

  const totalLocal = local ? Object.values(local).reduce((a, b) => a + b, 0) : null;

  /* ---------- acciones ---------- */
  const hacerEntrar = async e => {
    e.preventDefault();
    setOcupado(true); setMsg(null);
    const r = await entrar(email, pass);
    setOcupado(false);
    if (r.ok) { setPass(''); setMsg({ t: 'ok', x: 'Sesión iniciada.' }); }
    else setMsg({ t: 'err', x: r.error });
  };

  const hacerSubir = async () => {
    setOcupado(true); setMsg(null);
    const r = await subirTodo(ld);
    setOcupado(false);
    setMsg(r.ok ? { t: 'ok', x: `Subidos ${r.total} registros.` } : { t: 'err', x: r.error });
    refrescarNube();
  };

  const hacerRestaurar = async () => {
    setOcupado(true); setMsg(null);
    const r = await descargarTodo();
    setOcupado(false);
    if (!r.ok) { setMsg({ t: 'err', x: r.error }); return; }
    const ok = await onRestaurar(r.datos);      // pasa por el portero de confirmación
    setMsg(ok ? { t: 'ok', x: 'Datos restaurados desde la nube.' }
              : { t: 'err', x: 'Restauración cancelada. No se ha tocado nada.' });
    contarLocal();
  };

  /* ---------- render ---------- */
  return (
    <div className="page">
      <h2 className="p-title">Nube</h2>

      {!est.disponible && (
        <Caja borde="#C4724E">
          <div style={{ fontSize: 13, color: '#E8D5B5', lineHeight: 1.5 }}>
            Firebase no ha cargado{est.ultimoError ? `: ${est.ultimoError}` : '.'}
            <div style={{ color: '#8B7D6B', marginTop: 8 }}>
              No pasa nada. La app funciona igual y tus datos siguen en el móvil.
              La copia se reintenta la próxima vez que abras esto con cobertura.
            </div>
          </div>
        </Caja>
      )}

      {est.disponible && !est.usuario && (
        <Caja>
          <div className="sh a" style={{ marginBottom: 6 }}>Entrar</div>
          <div style={{ fontSize: 12, color: '#8B7D6B', marginBottom: 14, lineHeight: 1.5 }}>
            Solo hace falta una vez. La sesión se queda guardada en el móvil hasta
            que cierres sesión a mano.
          </div>
          <form onSubmit={hacerEntrar}>
            <input className="inp" type="email" placeholder="Correo" autoComplete="username"
                   value={email} onChange={e => setEmail(e.target.value)}
                   style={{ width: '100%', marginBottom: 10 }} />
            <input className="inp" type="password" placeholder="Contraseña" autoComplete="current-password"
                   value={pass} onChange={e => setPass(e.target.value)}
                   style={{ width: '100%', marginBottom: 14 }} />
            <button className="btn-primary btn-lg" type="submit" disabled={ocupado || !email || !pass}
                    style={{ width: '100%' }}>
              {ocupado ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </Caja>
      )}

      {est.usuario && (
        <>
          <Caja>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="sh a">Sesión</div>
                <div style={{ fontSize: 13, color: '#E8D5B5', marginTop: 4 }}>{est.usuario}</div>
              </div>
              <button className="btn-secondary" onClick={salir} disabled={ocupado}>Salir</button>
            </div>
            <div style={{ fontSize: 11, color: '#8B7D6B', marginTop: 12, lineHeight: 1.5 }}>
              {est.pendientes > 0
                ? `${est.pendientes} cambio(s) esperando a subir.`
                : est.ultimaSubida
                  ? `Última subida: ${new Date(est.ultimaSubida).toLocaleString('es-ES')}`
                  : 'Sin subidas todavía en esta sesión.'}
            </div>
            {est.ultimoError && (
              <div style={{ fontSize: 11, color: '#C4724E', marginTop: 6 }}>{est.ultimoError}</div>
            )}
          </Caja>

          <Caja>
            <div className="sh a" style={{ marginBottom: 10 }}>Móvil contra nube</div>
            {CLAVES.map(k => {
              const l = local?.[k] ?? '·', n = nube?.por?.[k] ?? '·';
              const diff = typeof l === 'number' && typeof n === 'number' && l !== n;
              return (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                                      fontSize: 12, padding: '3px 0',
                                      color: diff ? '#E8A838' : '#8B7D6B' }}>
                  <span>{NOMBRES[k] || k}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{l} · {n}</span>
                </div>
              );
            })}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13,
                          fontWeight: 700, color: '#E8D5B5', paddingTop: 8, marginTop: 6,
                          borderTop: '1px solid #33291F' }}>
              <span>Total</span>
              <span>{totalLocal ?? '·'} · {nube?.total ?? '·'}</span>
            </div>
            <div style={{ fontSize: 11, color: '#5E5445', marginTop: 8 }}>
              Primer número: lo que hay en este móvil. Segundo: lo que hay en la nube.
            </div>
          </Caja>

          <Caja>
            <button className="btn-primary btn-lg" onClick={hacerSubir} disabled={ocupado}
                    style={{ width: '100%', marginBottom: 10 }}>
              Subir todo ahora
            </button>
            <button className="btn-secondary btn-lg" onClick={hacerRestaurar} disabled={ocupado}
                    style={{ width: '100%' }}>
              Restaurar desde la nube
            </button>
            <div style={{ fontSize: 11, color: '#8B7D6B', marginTop: 12, lineHeight: 1.5 }}>
              La subida es automática: cada vez que guardas algo se sube solo.
              Estos botones son para forzarlo o para recuperar en un móvil nuevo.
              Restaurar pide confirmación si fuera a dejar menos registros de los que hay.
            </div>
          </Caja>
        </>
      )}

      {msg && (
        <Caja borde={msg.t === 'ok' ? '#6B9F4A' : '#D4563A'}>
          <div style={{ fontSize: 13, color: msg.t === 'ok' ? '#6B9F4A' : '#D4563A', lineHeight: 1.5 }}>
            {msg.x}
          </div>
        </Caja>
      )}
    </div>
  );
}
