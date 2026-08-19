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

/* --------- frescura: se calibra contra su propio historial ---------
   La referencia tiene que estar en las MISMAS unidades que aquello con lo
   que se compara. Antes era el percentil 90 de la carga de UN día suelto y
   se comparaba con la fatiga acumulada de 30 días, que es una suma de
   muchos días y por construcción sale mayor: la frescura se clavaba en 0 en
   cuanto encadenaba dos o tres días de entreno, dijera lo que dijera la
   intensidad. Ahora la referencia es el percentil 90 de la propia fatiga
   acumulada, día a día, en los últimos 90 días. */
function referencias(series, hastaISO) {
  const vals = { dedos: [], cuerpo: [], sistemico: [] };
  const fin = new Date(hastaISO);
  for (let d = 90; d >= 0; d--) {
    const x = new Date(fin); x.setDate(x.getDate() - d);
    const fa = fatigaAcumulada(series, x.toISOString().slice(0, 10));
    for (const k of Object.keys(vals)) if (fa[k] > 0) vals[k].push(fa[k]);
  }
  const ref = {};
  for (const k of Object.keys(vals)) {
    const v = vals[k].sort((a, b) => a - b);
    ref[k] = v.length ? (v[Math.min(v.length - 1, Math.floor(v.length * 0.9))] || 1) : 1;
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
  const valor = r => (Number(r.esq) || 0) + (Number(r.dre) || 0);
  const v = valor(ultimo);
  // Numérico, no textual: en su histórico conviven "16" y "16.0", que como
  // texto nunca casan y partirían la serie en dos sin decirlo.
  const mmNum = Number(ultimo.mm) > 0 ? Number(ultimo.mm) : null;
  if (mmNum === null) {
    return { fecha: ultimo.fecha, mm: null, valor: v, n: 0, sinBase: true };
  }

  // solo tests del MISMO tamaño de regleta y de los 60 días anteriores a él
  const desde = new Date(ultimo.fecha); desde.setDate(desde.getDate() - 60);
  const base = todos.filter(r =>
    Number(r.mm) === mmNum && r !== ultimo && new Date(r.fecha) >= desde
  );

  const mm = String(mmNum);
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

/* --------- ventana tendinosa, ahora sobre el canal de dedos ---------
   Se cuenta en DÍAS ENTEROS, no en horas: `ct5_ent` guarda fecha, no hora,
   así que "horas desde la última carga" no es un dato que exista. El código
   original lo inventaba por abajo ("0 h" siempre, porque comparaba contra la
   medianoche de hoy) y un intento del 17-08 lo inventó por arriba ("1 día"
   siempre, porque proyectaba a mañana) — y llegó a decir "solo 1 día desde tu
   última carga" el mismo día en que Juan había entrenado por la mañana.
   El mismo día se dice "hoy" y ya está. Ver CLAUDE.md §6. */
function ventanaTendinosa(series, refISO) {
  const ref = new Date(refISO);
  let acum = 0, dias7 = 0, ultima = null, hayDatos = false;
  for (const [f, c] of Object.entries(series)) {
    const d = (ref - new Date(f)) / 86400000;
    if (!Number.isFinite(d) || d < 0 || d >= 7) continue;   // 7 días, no 8
    hayDatos = true;
    // `cargaDedos` lo pone carga.js mirando el TIPO de ejercicio, no el número.
    // Antes bastaba con `c.dedos > 0` y un día de gimnasio —0,2 de dedos, todo
    // coeficientes de 0,05— ponía la ventana en rojo al día siguiente.
    if (c.cargaDedos) {
      acum += c.dedos; dias7++;
      if (!ultima || f > ultima) ultima = f;
    }
  }
  const dias = ultima ? Math.round((ref - new Date(ultima)) / 86400000) : null;
  let nivel = 'green';
  let msg = hayDatos
    ? 'Sin carga de dedos en los últimos 7 días.'
    : 'No hay nada registrado en los últimos 7 días.';
  if (dias === 0)                     { nivel = 'red';   msg = 'Has cargado dedos hoy.'; }
  else if (dias === 1)                { nivel = 'red';   msg = '1 día desde tu última carga de dedos.'; }
  else if (dias === 2)                { nivel = 'amber'; msg = '2 días. El tejido sigue en ventana.'; }
  else if (dias !== null)             { nivel = 'green'; msg = `${dias} días. Los dedos han descansado lo suficiente.`; }
  return { nivel, msg, acum: Math.round(acum * 10) / 10, dias7, dias, ultima };
}

/* --------- ¿ha habido cardio de verdad? ---------
   El panel afirmaba "probablemente por cardio reciente" sin mirar el
   calendario. Si no hay cardio en los últimos días, no se afirma ninguna
   causa: se dice que el sistémico está bajo y ya. */
function cardioReciente(cal, refISO, dias = 7) {
  const ref = new Date(refISO);
  const fechas = (cal || [])
    .filter(d => d.fecha && /cardio/i.test(d.activitat || ''))
    .filter(d => { const t = (ref - new Date(d.fecha)) / 86400000; return t >= 0 && t <= dias; })
    .map(d => d.fecha)
    .sort();
  return fechas.length ? fechas[fechas.length - 1] : null;
}

/* --------- la recomendación, con su porqué --------- */
function recomendar(fr, test, vent, cardio) {
  const razones = [];
  let veredicto = 'fuerte';

  if (fr.dedos < 40) { veredicto = 'descanso'; razones.push(`frescura de dedos ${fr.dedos} de 100`); }
  else if (fr.dedos < 65) { veredicto = 'suave'; razones.push(`frescura de dedos ${fr.dedos} de 100`); }

  if (vent.nivel === 'red') { veredicto = veredicto === 'descanso' ? 'descanso' : 'suave'; razones.push(vent.dias === 0 ? 'has cargado dedos hoy' : `solo ${vent.dias} día${vent.dias === 1 ? '' : 's'} desde la última carga de dedos`); }

  if (test && !test.sinBase) {
    // Math.abs: con el signo puesto salía "test -10.7 % por debajo", que niega
    // dos veces y se lee como que está por encima.
    if (test.pct <= -8) { veredicto = 'descanso'; razones.push(`test ${Math.abs(test.pct)} % por debajo de tu media`); }
    else if (test.pct <= -4) { if (veredicto === 'fuerte') veredicto = 'suave'; razones.push(`test ${Math.abs(test.pct)} % por debajo de tu media`); }
    else if (test.pct >= 3) { razones.push(`test ${test.pct} % por encima de tu media`); }
  }

  if (fr.sistemico < 40) {
    if (veredicto === 'fuerte') veredicto = 'suave';
    razones.push(`sistémico bajo (${fr.sistemico})${cardio ? ` — cardio el ${cardio.split('-').reverse().join('/')}` : ''}`);
  }

  // La razón de reserva decía "los tres canales por encima del 65 % y el test
  // en su sitio". Era falsa por dos vías: `cuerpo` no se mira en ningún sitio
  // de esta función, y "el test en su sitio" se pintaba también cuando no
  // había ningún test comparable. Ahora enumera solo lo que sí se ha mirado.
  if (!razones.length) {
    razones.push(`dedos ${fr.dedos} y sistémico ${fr.sistemico} de 100, y los dedos han descansado`);
    razones.push(test && !test.sinBase
      ? `test ${test.pct >= 0 ? '+' : ''}${test.pct} % respecto a tu media`
      : 'sin test comparable');
  }
  return { veredicto, razones };
}

const TXT = {
  fuerte:   { t: 'Puedes entrenar fuerte',  c: COL.bien },
  suave:    { t: 'Mejor algo suave hoy',    c: COL.medio },
  descanso: { t: 'Hoy toca descansar',      c: COL.mal },
};

export default function DashP({ cal = [], ent = [], t25 = [], treg = [], tests = [] }) {
  const ser  = useMemo(() => seriesCarga(cal, ent, tests), [cal, ent, tests]);

  // El panel describe HOY. Se probó proyectarlo a mañana el 17-08 y se
  // revirtió el mismo día: decía "solo 1 día desde tu última carga de dedos"
  // el mismo día en que Juan había entrenado por la mañana. Ver CLAUDE.md §6.
  const hoy  = useMemo(() => td(), []);

  const fat  = useMemo(() => fatigaAcumulada(ser, hoy), [ser, hoy]);
  const ref  = useMemo(() => referencias(ser, hoy), [ser, hoy]);
  const fr   = useMemo(() => frescura(fat, ref), [fat, ref]);
  const test = useMemo(() => compararTest(treg, t25), [treg, t25]);
  const vent = useMemo(() => ventanaTendinosa(ser, hoy), [ser, hoy]);
  const cardio = useMemo(() => cardioReciente(cal, hoy), [cal, hoy]);
  const rec  = useMemo(() => recomendar(fr, test, vent, cardio), [fr, test, vent, cardio]);

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
          fuerza es tu último test contra tu media
          {test && !test.sinBase ? '.' : ' — y ahora mismo no hay test comparable, así que ese eje está al 50 por defecto.'}
          {' '}El Estado pesa dedos 40 %, fuerza 30 %, cuerpo 15 % y sistémico 15 %.
        </div>
      </div>

      {/* ---- el test ---- */}
      <div className="card" style={{ padding: 16 }}>
        <div className="sh a" style={{ marginBottom: 8 }}>Último test</div>
        {!test ? (
          <div style={{ fontSize: 12, color: '#8B7D6B' }}>
            Todavía no hay ningún test con las dos manos registrado.
          </div>
        ) : test.sinBase ? (
          <div style={{ fontSize: 12, color: '#8B7D6B', lineHeight: 1.5 }}>
            {test.fecha.split('-').reverse().join('/')} · {test.mm ? <>regleta {test.mm} mm · </> : null}
            {test.valor} N (suma de las dos manos).<br />
            {test.mm === null
              ? 'Este test no tiene anotado el tamaño de regleta, así que no hay con qué compararlo.'
              : `${test.n === 0 ? 'No hay ningún test más' : `Solo hay ${test.n} test${test.n === 1 ? '' : 's'} más`} con esa regleta en los 60 días anteriores. Hacen falta 3 para poder comparar con algo.`}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: test.pct >= 0 ? COL.bien : test.pct > -5 ? COL.medio : COL.mal }}>
                {test.pct > 0 ? '+' : ''}{test.pct} %
              </span>
              <span style={{ fontSize: 13, color: '#8B7D6B' }}>respecto a tu media</span>
            </div>
            <div style={{ fontSize: 11, color: '#6B5F52', marginTop: 6, lineHeight: 1.5 }}>
              {test.fecha.split('-').reverse().join('/')} · {test.valor} N contra una media de {test.media} N,
              sumando las dos manos.<br />
              Comparado solo con tests <b>pre</b> de <b>regleta {test.mm} mm</b>, {test.n} de los 60 días
              anteriores a ese test.
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
            Carga de dedos 7 d: <b>{vent.acum}</b> · {vent.dias7} día{vent.dias7 === 1 ? '' : 's'} con carga
            {vent.ultima && <> · última carga: <b>{vent.ultima.slice(8)}/{vent.ultima.slice(5, 7)}</b></>}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: '#5E5445', padding: '4px 4px 0', lineHeight: 1.45 }}>
        Sin predicciones: todo lo de esta pantalla describe lo que ya ha pasado.
        Los días se cuentan enteros porque las sesiones se apuntan por fecha, sin hora.
        Umbral de oclusión {Math.round(PARAMS.umbralOclusion * 100)} % · τ dedos {PARAMS.tau.dedos} d ·
        el % de bloque, travesía y vía va sin umbral.
      </div>
    </div>
  );
}
