/**
 * ClimbTrack · pestaña CARGA
 * archivo nuevo: src/CargaP.jsx
 *
 * Enseña los tres canales por separado, nunca sumados en un total,
 * y dice de dónde sale cada número. Sin cajas negras.
 */

import React, { useMemo } from 'react';
import { seriesCarga, fatigaAcumulada, PARAMS } from './carga.js';
import { AGARRE_POR_ID, repartoAgarres, viasPorAgarre } from './agarres.js';
import { td } from './lib.js';

const COL = { dedos: '#E8A838', cuerpo: '#3A8FB7', sistemico: '#6B9F4A' };
const NOM = { dedos: 'Dedos', cuerpo: 'Cuerpo', sistemico: 'Sistémico' };

function diasAtras(n) {
  const out = [];
  const hoy = new Date(td());
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function CargaP({ cal = [], ent = [], roca = [] }) {
  const ser = useMemo(() => seriesCarga(cal, ent), [cal, ent]);
  const hoy = td();
  const fat = useMemo(() => fatigaAcumulada(ser, hoy), [ser, hoy]);
  const dias = useMemo(() => diasAtras(21), []);

  const max = useMemo(() => {
    let m = 1;
    for (const f of dias) {
      const c = ser[f];
      if (!c) continue;
      m = Math.max(m, c.dedos || 0, c.cuerpo || 0, c.sistemico || 0);
    }
    return m;
  }, [ser, dias]);

  // desglose por agarre de los últimos 30 días
  const agarres = useMemo(() => {
    const acc = {};
    const desde = diasAtras(30)[0];
    for (const s of ent) {
      if (!s.fecha || s.fecha < desde) continue;
      let bl = s.bloques;
      if (typeof bl === 'string') { try { bl = JSON.parse(bl); } catch { continue; } }
      for (const b of bl || []) {
        for (const [k, m] of repartoAgarres(b)) {
          if (k === 'sin_marcar') continue;
          acc[k] = Math.round(((acc[k] || 0) + m) * 10) / 10;
        }
      }
    }
    return acc;
  }, [ent]);

  // vías de roca por agarre, últimos 30 días. Aparte de los minutos a
  // propósito: una vía no tiene minutos y estimarlos sería inventárselos.
  const vias = useMemo(() => viasPorAgarre(roca, diasAtras(30)[0]), [roca]);

  const origenes = useMemo(() => {
    const acc = {};
    for (const f of dias) {
      const o = (ser[f]?.origen || []).join('+') || null;
      if (o) acc[o] = (acc[o] || 0) + 1;
    }
    return acc;
  }, [ser, dias]);

  return (
    <div className="page">
      <h2 className="p-title">Carga</h2>

      {/* ---- fatiga acumulada hoy ---- */}
      <div className="card" style={{ padding: 16 }}>
        <div className="sh a" style={{ marginBottom: 10 }}>Fatiga acumulada hoy</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {['dedos', 'cuerpo', 'sistemico'].map(k => (
            <div key={k} style={{ flex: 1, textAlign: 'center', padding: '12px 6px',
                                  background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: COL[k], lineHeight: 1.1 }}>
                {fat[k]}
              </div>
              <div style={{ fontSize: 11, color: '#8B7D6B', marginTop: 3 }}>{NOM[k]}</div>
              <div style={{ fontSize: 10, color: '#5E5445', marginTop: 1 }}>
                τ {PARAMS.tau[k]} d
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#8B7D6B', marginTop: 10, lineHeight: 1.45 }}>
          Cada canal se recupera a su ritmo. Los dedos son los que más tardan, por eso
          su número baja más despacio que los otros dos.
        </div>
      </div>

      {/* ---- últimos 21 días ---- */}
      <div className="card" style={{ padding: 16 }}>
        <div className="sh a" style={{ marginBottom: 10 }}>Últimos 21 días</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 130 }}>
          {dias.map(f => {
            const c = ser[f] || { dedos: 0, cuerpo: 0, sistemico: 0 };
            return (
              <div key={f} title={`${f}\ndedos ${c.dedos} · cuerpo ${c.cuerpo} · sist ${c.sistemico}`}
                   style={{ flex: 1, display: 'flex', flexDirection: 'column',
                            justifyContent: 'flex-end', gap: 1, height: '100%' }}>
                {['sistemico', 'cuerpo', 'dedos'].map(k => (
                  <div key={k} style={{ height: `${((c[k] || 0) / max) * 100}%`,
                                        background: COL[k], borderRadius: 2, minHeight: c[k] > 0 ? 2 : 0 }} />
                ))}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
          {['dedos', 'cuerpo', 'sistemico'].map(k => (
            <span key={k} style={{ fontSize: 11, color: '#8B7D6B' }}>
              <span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2,
                             background: COL[k], marginRight: 5, verticalAlign: -1 }} />
              {NOM[k]}
            </span>
          ))}
        </div>
      </div>

      {/* ---- por agarre ---- */}
      <div className="card" style={{ padding: 16 }}>
        <div className="sh a" style={{ marginBottom: 10 }}>Minutos por agarre · 30 días</div>
        {Object.keys(agarres).length === 0 ? (
          <div style={{ fontSize: 12, color: '#8B7D6B', lineHeight: 1.5 }}>
            Todavía no hay nada. Las suspensiones se etiquetan solas por el tamaño de
            regleta; roca y rocódromo, con los chips al registrar la vía.
          </div>
        ) : (
          Object.entries(agarres).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
            const mx = Math.max(...Object.values(agarres));
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#E8D5B5', width: 118 }}>
                  {AGARRE_POR_ID[k]?.nombre || k}
                </span>
                <div style={{ flex: 1, height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }}>
                  <div style={{ width: `${(v / mx) * 100}%`, height: '100%',
                                background: COL.dedos, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, color: '#8B7D6B', width: 46, textAlign: 'right' }}>
                  {Math.round(v)}′
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* ---- vías de roca por agarre ---- */}
      <div className="card" style={{ padding: 16 }}>
        <div className="sh a" style={{ marginBottom: 10 }}>Vías por agarre · 30 días</div>
        {Object.keys(vias).length === 0 ? (
          <div style={{ fontSize: 12, color: '#8B7D6B', lineHeight: 1.5 }}>
            Todavía no hay ninguna vía de roca con agarres marcados en los últimos
            30 días. Se marcan con los chips al registrar la vía en Roca.
          </div>
        ) : (
          <>
            {Object.entries(vias).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
              const mx = Math.max(...Object.values(vias));
              return (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#E8D5B5', width: 118 }}>
                    {AGARRE_POR_ID[k]?.nombre || k}
                  </span>
                  <div style={{ flex: 1, height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }}>
                    <div style={{ width: `${(v / mx) * 100}%`, height: '100%',
                                  background: COL.cuerpo, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#8B7D6B', width: 46, textAlign: 'right' }}>
                    {v} {v === 1 ? 'vía' : 'vías'}
                  </span>
                </div>
              );
            })}
            <div style={{ fontSize: 11, color: '#5E5445', marginTop: 10, lineHeight: 1.45 }}>
              Cuenta vías, no minutos, y no se suma con el panel de arriba. Una vía
              con varios agarres marcados cuenta entera en cada uno.
            </div>
          </>
        )}
      </div>

      {/* ---- de dónde salen los números ---- */}
      <div className="card" style={{ padding: 16 }}>
        <div className="sh a" style={{ marginBottom: 8 }}>De dónde sale cada número</div>
        {Object.entries(origenes).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between',
                                fontSize: 12, color: '#8B7D6B', padding: '3px 0' }}>
            <span>{k === 'detalle' ? 'Detalle del entrenamiento'
                 : k === 'actividad+reloj' ? 'Actividad + datos del reloj'
                 : 'Solo actividad y fatiga'}</span>
            <span>{v} días</span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: '#5E5445', marginTop: 10, lineHeight: 1.45 }}>
          Umbral de oclusión {Math.round(PARAMS.umbralOclusion * 100)} % · exponente {PARAMS.exponente} ·
          suspensión sin porcentaje anotado se asume al {PARAMS.pctSuspPorDefecto} %.
          Todo eso se cambia en carga.js.
        </div>
      </div>
    </div>
  );
}
