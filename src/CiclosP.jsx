/**
 * ClimbTrack · pestaña CICLOS
 * archivo nuevo: src/CiclosP.jsx
 * Todo normalizado por semana: los mesos duran entre 13 y 67 dias y
 * comparar totales solo diria cual duro mas.
 */
import React, { useMemo } from 'react';
import { analizarCiclos, cicloActual, revisarCiclos } from './ciclos.js';
import { td } from './lib.js';

const C = { dedos:'#E8A838', ok:'#6B9F4A', med:'#E8A838', mal:'#D4563A', txt:'#B8A88F', sec:'#8B7D6B', ter:'#5E5445' };

export default function CiclosP({ cal = [], ent = [], tests = [] }) {
  const ciclos = useMemo(() => analizarCiclos(cal, ent, tests), [cal, ent, tests]);
  const act    = useMemo(() => cicloActual(ciclos, td()), [ciclos]);
  const avisos = useMemo(() => revisarCiclos(ciclos), [ciclos]);
  const maxD   = useMemo(() => Math.max(1, ...ciclos.map(c => c.dedosSemana)), [ciclos]);

  return (
    <div className="page">
      <h2 className="p-title">Ciclos</h2>

      {act && (
        <div className="card" style={{ padding:16, borderLeft:`3px solid ${C.dedos}` }}>
          <div style={{ fontSize:19, fontWeight:700, marginBottom:2 }}>
            Macro {act.macro} · Meso {act.meso}
          </div>
          <div style={{ fontSize:13, color:C.txt, marginBottom:12 }}>
            Dia {act.diaActual} · empezo el {act.ini}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            {[['Sesiones/sem', act.sesionesSemana], ['Descanso', act.pctDescanso + '%'], ['Dedos/sem', act.dedosSemana]].map(([l,v]) => (
              <div key={l} style={{ flex:1, textAlign:'center', padding:'10px 4px', background:'rgba(255,255,255,0.03)', borderRadius:10 }}>
                <div style={{ fontSize:22, fontWeight:800, color:C.dedos }}>{v}</div>
                <div style={{ fontSize:10, color:C.sec, marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:12 }}>
            {Object.entries(act.porSemana).sort((a,b)=>b[1]-a[1]).map(([a,n]) => (
              <div key={a} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:C.txt, padding:'2px 0' }}>
                <span>{a}</span><span style={{ color:C.sec }}>{n} / sem</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ padding:16 }}>
        <div className="sh a" style={{ marginBottom:10 }}>Todos los mesociclos</div>
        <div style={{ fontSize:10, color:C.ter, display:'flex', marginBottom:6 }}>
          <span style={{ width:52 }}>ciclo</span>
          <span style={{ width:40, textAlign:'right' }}>dias</span>
          <span style={{ width:52, textAlign:'right' }}>ses/sem</span>
          <span style={{ width:48, textAlign:'right' }}>desc.</span>
          <span style={{ flex:1, textAlign:'right' }}>dedos/sem</span>
        </div>
        {ciclos.map(c => {
          const actual = act && c.clave === act.clave;
          return (
            <div key={c.clave} style={{ marginBottom:7, opacity: actual ? 1 : 0.85 }}>
              <div style={{ display:'flex', fontSize:12, color: actual ? '#E8D5B5' : C.txt, alignItems:'center' }}>
                <span style={{ width:52, fontWeight: actual ? 700 : 400 }}>{c.clave}{actual && ' ←'}</span>
                <span style={{ width:40, textAlign:'right', color:C.sec }}>{c.dias}</span>
                <span style={{ width:52, textAlign:'right' }}>{c.sesionesSemana}</span>
                <span style={{ width:48, textAlign:'right', color: c.pctDescanso>=30?C.ok:c.pctDescanso>=15?C.med:C.mal }}>{c.pctDescanso}%</span>
                <span style={{ flex:1, textAlign:'right', fontWeight:700 }}>{c.dedosSemana}</span>
              </div>
              <div style={{ height:4, background:'rgba(255,255,255,0.04)', borderRadius:2, marginTop:3 }}>
                <div style={{ width:`${(c.dedosSemana/maxD)*100}%`, height:'100%', background:C.dedos, borderRadius:2 }} />
              </div>
            </div>
          );
        })}
        <div style={{ fontSize:10, color:C.ter, marginTop:10, lineHeight:1.45 }}>
          La barra es carga de dedos por semana. El color del descanso: verde 30% o mas,
          ambar 15-29%, rojo por debajo.
        </div>
      </div>

      {avisos.length > 0 && (
        <div className="card" style={{ padding:16 }}>
          <div className="sh a" style={{ marginBottom:8 }}>Revisar</div>
          {avisos.map((a,i) => (
            <div key={i} style={{ fontSize:12, color:C.med, padding:'3px 0' }}>· {a}</div>
          ))}
          <div style={{ fontSize:10, color:C.ter, marginTop:8 }}>
            Son dudas del propio analisis, no errores seguros. Si un meso dura mucho o poco,
            o dos se solapan, casi siempre es una etiqueta mal puesta.
          </div>
        </div>
      )}
    </div>
  );
}
