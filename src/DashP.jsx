/**
 * ClimbTrack · DASHBOARD v2
 * archivo nuevo: src/DashP.jsx
 *
 * No borra el Dash antiguo: se pone al lado. En App.jsx se cambia una
 * sola línea, así que volver atrás es cambiarla otra vez.
 *
 * Qué cambia respecto al anterior:
 *   FUERA  la gráfica de predicción (no la lee y no tiene fundamento)
 *   FUERA  CTL / ATL / TSB (modelo que él mismo rechaza, sobre fatiga a ojo)
 *   IGUAL  ventana tendinosa y anillo, pero alimentados de otra cosa
 *   NUEVO  el test del día contra su media DEL MISMO MONTAJE, con la n
 *   NUEVO  una recomendación con el porqué escrito al lado
 */

import React, { useMemo } from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { seriesCarga, fatigaAcumulada, PARAMS } from './carga.js';
import { td } from './lib.js';

const COL = { dedos: '#E8A838', cuerpo: '#3A8FB7', sistemico: '#6B9F4A', mal: '#D4563A', bien: '#6B9F4A', medio: '#E8A838' };

/* --------- frescura: se calibra contra su propio historial --------- */
function referencias(series) {
  const vals = { dedos: [], cuerpo: [], sistemico: [] };
  const desde = new Date(td()); desde.setDate(desde.getDate() - 90);
  for (const [f, c] of Object.entries(series)) {
    if (new Date(f) < desde) continue;
    for (const k of Object.keys(vals)) if (c[k] > 0) vals[k].push(c[k]);
  }
  const ref = {};
  for (const k of Object.keys(vals)) {
    const v = vals[k].sort((a, b) => a - b);
    ref[k] = v.length ? (v[Math.floor(v.length * 0.9)] || v[v.length - 1]) : 1;
  }
  return ref;
}

function frescura(fatiga, ref) {
  const out = {};
  for (const k of ['dedos', 'cuerpo', 'sistemico']) {
    const r = ref[k] || 1;
    out[k] = Math.max(0, Math.min(100, Math.round(100 * (1 - fatiga[k] / (r * 1.5)))));
  }
  return out;
}

/* --------- test de hoy contra su media, MISMO MONTAJE --------- */
function compararTest(treg, t25) {
  const todos = [...(treg || []), ...(t25 || [])]
    .filter(r => r.fecha && Number(r.esq) > 0)
    .sort((a, b) => (a.fecha > b.fecha ? 1 : -1));
  if (!todos.length) return null;

  const ultimo = todos[todos.length - 1];
  const mm = String(ultimo.mm || '?');

  // solo tests del MISMO tamaño de regleta y de los últimos 60 días
  const desde = new Date(ultimo.fecha); desde.setDate(desde.getDate() - 60);
  const base = todos.filter(r =>
    String(r.mm) === mm && r !== ultimo && new Date(r.fecha) >= desde
  );

  const valor = r => (Number(r.esq) || 0) + (Number(r.dre) || 0);
  const v = valor(ultimo);
  if (base.length < 3) {
    return { fecha: ultimo.fecha, mm, valor: v, n: base.length, sinBase: true };
  }
  const media = base.reduce((s, r) => s + valor(r), 0) / base.length;
  return {
    fecha: ultimo.fecha, mm, valor: v, media: Math.round(media),
    pct: Math.round(((v - media) / media) * 1000) / 10,
    n: base.length, sinBase: false,
  };
}

/* --------- ventana tendinosa, ahora sobre el canal de dedos --------- */
function ventanaTendinosa(series) {
  const hoy = new Date(td());
  let acum = 0, sesiones = 0, ultima = null;
  for (const [f, c] of Object.entries(series)) {
    const d = (hoy - new Date(f)) / 86400000;
    if (d < 0 || d > 7) continue;
    if (c.dedos > 0) {
      acum += c.dedos; sesiones++;
      if (!ultima || f > ultima) ultima = f;
    }
  }
  const horas = ultima ? Math.round((hoy - new Date(ultima)) / 3600000) : null;
  let nivel = 'green', msg = 'Los dedos han descansado lo suficiente.';
  if (horas !== null && horas < 48) { nivel = 'red'; msg = 'Menos de 48 h desde la última carga de dedos.'; }
  else if (horas !== null && horas < 72) { nivel = 'amber'; msg = 'Entre 48 y 72 h. El tejido sigue en ventana.'; }
  return { nivel, msg, acum: Math.round(acum * 10) / 10, sesiones, horas };
}

/* --------- la recomendación, con su porqué --------- */
function recomendar(fr, test, vent) {
  const razones = [];
  let veredicto = 'fuerte';

  if (fr.dedos < 40) { veredicto = 'descanso'; razones.push(`frescura de dedos ${fr.dedos} de 100`); }
  else if (fr.dedos < 65) { veredicto = 'suave'; razones.push(`frescura de dedos ${fr.dedos} de 100`); }

  if (vent.nivel === 'red') { veredicto = veredicto === 'descanso' ? 'descanso' : 'suave'; razones.push(`solo ${vent.horas} h desde la última carga de dedos`); }

  if (test && !test.sinBase) {
    if (test.pct <= -8) { veredicto = 'descanso'; razones.push(`test ${test.pct} % por debajo de tu media`); }
    else if (test.pct <= -4) { if (veredicto === 'fuerte') veredicto = 'suave'; razones.push(`test ${test.pct} % por debajo de tu media`); }
    else if (test.pct >= 3) { razones.push(`test ${test.pct > 0 ? '+' : ''}${test.pct} % sobre tu media`); }
  }

  if (fr.sistemico < 40) { if (veredicto === 'fuerte') veredicto = 'suave'; razones.push(`sistémico bajo (${fr.sistemico}) — probablemente por cardio reciente`); }

  if (!razones.length) razones.push('los tres canales por encima del 65 % y el test en su sitio');
  return { veredicto, razones };
}

const TXT = {
  fuerte:   { t: 'Puedes entrenar fuerte',  c: COL.bien },
  suave:    { t: 'Mejor algo suave hoy',    c: COL.medio },
  descanso: { t: 'Hoy toca descansar',      c: COL.mal },
};

export default function DashP({ cal = [], ent = [], t25 = [], treg = [] }) {
  const ser  = useMemo(() => seriesCarga(cal, ent), [cal, ent]);
  const fat  = useMemo(() => fatigaAcumulada(ser, td()), [ser]);
  const ref  = useMemo(() => referencias(ser), [ser]);
  const fr   = useMemo(() => frescura(fat, ref), [fat, ref]);
  const test = useMemo(() => compararTest(treg, t25), [treg, t25]);
  const vent = useMemo(() => ventanaTendinosa(ser), [ser]);
  const rec  = useMemo(() => recomendar(fr, test, vent), [fr, test, vent]);

  const ejeFuerza = test && !test.sinBase
    ? Math.max(0, Math.min(100, Math.round(50 + test.pct * 4)))
    : 50;
  const radar = [
    { axis: 'Dedos', val: fr.dedos },
    { axis: 'Fuerza', val: ejeFuerza },
    { axis: 'Cuerpo', val: fr.cuerpo },
    { axis: 'Sistémico', val: fr.sistemico },
  ];
  const total = Math.round((fr.dedos * 0.4 + ejeFuerza * 0.3 + fr.cuerpo * 0.15 + fr.sistemico * 0.15));
  const col = total >= 70 ? COL.bien : total >= 45 ? COL.medio : COL.mal;
  const v = TXT[rec.veredicto];

  return (
    <div className="page">
      <h2 className="p-title">Hoy</h2>

      {/* ---- la respuesta, arriba del todo ---- */}
      <div className="card" style={{ padding: 16, borderLeft: `3px solid ${v.c}` }}>
        <div style={{ fontSize: 19, fontWeight: 700, color: v.c, marginBottom: 6 }}>{v.t}</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {rec.razones.map((r, i) => (
            <li key={i} style={{ fontSize: 13, color: '#B8A88F', marginBottom: 3 }}>{r}</li>
          ))}
        </ul>
      </div>

      {/* ---- anillo + radar ---- */}
      <div className="card">
        <div className="fit-row">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div className="fit-ring" style={{ borderColor: col }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: col }}>{total}</span>
            </div>
            <div style={{ fontSize: 10, color: '#6B5F52' }}>Estado</div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <ResponsiveContainer width="100%" height={130}>
              <RadarChart data={radar} cx="50%" cy="50%" outerRadius={48}>
                <PolarGrid stroke="#33291F" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: '#8B7D6B', fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="val" stroke={col} fill={col} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#5E5445', marginTop: 6, lineHeight: 1.4 }}>
          Cuanto más lejos del centro, mejor. Dedos, cuerpo y sistémico son frescura;
          fuerza es tu último test contra tu media.
        </div>
      </div>

      {/* ---- el test ---- */}
      <div className="card" style={{ padding: 16 }}>
        <div className="sh a" style={{ marginBottom: 8 }}>Último test</div>
        {!test ? (
          <div style={{ fontSize: 12, color: '#8B7D6B' }}>Todavía no hay tests registrados.</div>
        ) : test.sinBase ? (
          <div style={{ fontSize: 12, color: '#8B7D6B', lineHeight: 1.5 }}>
            {test.fecha} · regleta {test.mm} mm · {test.valor} N.<br />
            Solo hay {test.n} test{test.n === 1 ? '' : 's'} más con esa regleta en 60 días.
            Hacen falta 3 para poder comparar con algo.
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: test.pct >= 0 ? COL.bien : test.pct > -5 ? COL.medio : COL.mal }}>
                {test.pct > 0 ? '+' : ''}{test.pct} %
              </span>
              <span style={{ fontSize: 13, color: '#8B7D6B' }}>sobre tu media</span>
            </div>
            <div style={{ fontSize: 11, color: '#6B5F52', marginTop: 6, lineHeight: 1.5 }}>
              {test.fecha} · {test.valor} N contra una media de {test.media} N<br />
              Comparado solo con tests de <b>regleta {test.mm} mm</b>, {test.n} de los últimos 60 días.
            </div>
          </>
        )}
      </div>

      {/* ---- ventana tendinosa ---- */}
      <div className={`tendon-banner ${vent.nivel}`}>
        <span style={{ fontSize: 18 }}>{vent.nivel === 'red' ? '🔴' : vent.nivel === 'amber' ? '🟠' : '🟢'}</span>
        <div style={{ flex: 1 }}>
          <b>Ventana tendinosa</b>
          <div style={{ fontSize: 12, marginTop: 2 }}>{vent.msg}</div>
          <div style={{ fontSize: 11, marginTop: 6, opacity: 0.75 }}>
            Carga de dedos 7 d: <b>{vent.acum}</b> · {vent.sesiones} sesion{vent.sesiones === 1 ? '' : 'es'}
            {vent.horas !== null && <> · última hace <b>{vent.horas} h</b></>}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: '#5E5445', padding: '4px 4px 0', lineHeight: 1.45 }}>
        Sin predicciones: todo lo de esta pantalla describe lo que ya ha pasado.
        Umbral de oclusión {Math.round(PARAMS.umbralOclusion * 100)} % · τ dedos {PARAMS.tau.dedos} d.
      </div>
    </div>
  );
}
