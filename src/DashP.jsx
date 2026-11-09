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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import {
  HandIcon, PersonSimpleIcon, HeartbeatIcon, GaugeIcon, HourglassMediumIcon, CaretDownIcon,
  FeatherIcon, FireIcon, BedIcon,
} from '@phosphor-icons/react';
import { seriesCarga, fatigaAcumulada, PARAMS } from './carga.js';
import { td } from './lib.js';
import { ConTabla, Tabla, Tarjeta, DIAS, aT } from './graficas.jsx';

/* Aspecto (noviembre 2026): el radar pasa a cuatro barras que se abren y
   cuentan de dónde sale cada número, el anillo se dibuja en SVG y la ventana
   tendinosa enseña los 7 días que mira. Los cálculos de abajo no cambian. */

// Colores por papel (tema.js): canales y estado. El estado va siempre con texto.
const COL = { dedos: 'var(--dedos)', cuerpo: 'var(--cuerpo)', sistemico: 'var(--sist)', mal: 'var(--badMark)', bien: 'var(--goodMark)', medio: 'var(--warnMark)' };

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
  let acum = 0, dias7 = 0, ultima = null, hayDatos = false, sinMinutos = 0;
  for (const [f, c] of Object.entries(series)) {
    const d = (ref - new Date(f)) / 86400000;
    if (!Number.isFinite(d) || d < 0 || d >= 7) continue;   // 7 días, no 8
    hayDatos = true;
    // `cargaDedos` lo pone carga.js mirando el TIPO de ejercicio, no el número.
    // Antes bastaba con `c.dedos > 0` y un día de gimnasio —0,2 de dedos, todo
    // coeficientes de 0,05— ponía la ventana en rojo al día siguiente.
    if (c.cargaDedos) {
      acum += c.dedos; dias7++;
      // Bloques de dedos sin duración anotada. Sin esto, el banner podía
      // decir "carga de dedos 7 d: 0" y a la vez "1 día con carga", que se
      // lee como un fallo cuando lo que pasa es que faltan los minutos.
      sinMinutos += c.sinMinutos || 0;
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
  return { nivel, msg, acum: Math.round(acum * 10) / 10, dias7, dias, ultima, sinMinutos };
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

const NIVEL = {
  red:   { t: 'Reciente',    c: 'var(--badMark)' },
  amber: { t: 'En ventana',  c: 'var(--warnMark)' },
  green: { t: 'Descansados', c: 'var(--goodMark)' },
};
const VEREDICTO = {
  fuerte:   { chip: 'Fuerte',   Icono: FireIcon },
  suave:    { chip: 'Suave',    Icono: FeatherIcon },
  descanso: { chip: 'Descanso', Icono: BedIcon },
};
const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const INI = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const r1 = x => Math.round((Number(x) || 0) * 10) / 10;
const signo = x => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x);
const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const CIRC = 2 * Math.PI * 54;

/** El número del anillo sube de 0 a su valor al abrir el panel (si el móvil
 *  no pide reducir el movimiento). Lo que se pinta primero ya es el valor. */
function Cuenta({ valor }) {
  const ref = useRef(null);
  const quieto = useReducedMotion();
  useEffect(() => {
    if (quieto || !ref.current) return undefined;
    const c = animate(0, valor, { duration: 1.1, ease: [0.2, 0.8, 0.2, 1],
      onUpdate: x => { if (ref.current) ref.current.textContent = String(Math.round(x)); } });
    return () => c.stop();
  }, [valor, quieto]);
  return <span ref={ref}>{valor}</span>;
}

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
  const total = Math.round((fr.dedos * 0.4 + ejeFuerza * 0.3 + fr.cuerpo * 0.15 + fr.sistemico * 0.15));
  const col = total >= 70 ? COL.bien : total >= 45 ? COL.medio : COL.mal;
  const zona = total >= 70 ? 'alta' : total >= 45 ? 'media' : 'baja';
  const v = TXT[rec.veredicto];
  const V = VEREDICTO[rec.veredicto];
  const conTest = test && !test.sinBase;

  // De qué está hecho el Estado. Mismo orden de colores que el resto de la app.
  const comp = [
    { k: 'dedos', nom: 'Dedos', Icono: HandIcon, c: COL.dedos, v: fr.dedos, peso: 40,
      txt: `Lo recuperado que está el canal de dedos frente a tu propio historial: 100 es sin fatiga acumulada; 0, una fatiga de vez y media tu pico habitual de los últimos 90 días. Es el canal más lento en recuperarse (τ ${PARAMS.tau.dedos} días).` },
    { k: 'cuerpo', nom: 'Cuerpo', Icono: PersonSimpleIcon, c: COL.cuerpo, v: fr.cuerpo, peso: 15,
      txt: `Igual que dedos, para el resto de la musculatura: tronco, brazos y piernas. Se recupera más rápido (τ ${PARAMS.tau.cuerpo} días).` },
    { k: 'sistemico', nom: 'Sistémico', Icono: HeartbeatIcon, c: COL.sistemico, v: fr.sistemico, peso: 15,
      txt: `La fatiga general, la que más sube con el cardio y las sesiones largas. Es la que antes se recupera (τ ${PARAMS.tau.sistemico} ${PARAMS.tau.sistemico === 1 ? 'día' : 'días'}).` },
    { k: 'fuerza', nom: 'Fuerza', Icono: GaugeIcon, c: 'var(--fuerza)', v: ejeFuerza, peso: 30,
      txt: conTest
        ? `Tu último test contra tu media de los 60 días anteriores, en la misma regleta. 50 es justo tu media y cada 1 % arriba o abajo mueve 4 puntos: ${signo(test.pct)} % da ${ejeFuerza}.`
        : 'Tu último test contra tu media de los 60 días anteriores, en la misma regleta. Ahora mismo no hay ningún test comparable, así que se queda en 50.' },
  ];
  const [abierto, setAbierto] = useState(null);

  // Los 7 días que mira la ventana tendinosa (hoy y los 6 anteriores),
  // leídos de la misma serie. Una barra gris es carga de dedos que no cuenta:
  // ese día no hubo ningún ejercicio de los que cargan los dedos.
  const semana = useMemo(() => {
    const out = [];
    const base = new Date(aT(hoy));
    for (let d = 6; d >= 0; d--) {
      const x = new Date(base); x.setUTCDate(x.getUTCDate() - d);
      const f = x.toISOString().slice(0, 10);
      const c = ser[f] || {};
      const val = r1(c.dedos);
      out.push({ f, v: val, kind: c.cargaDedos ? 'cuenta' : val > 0 ? 'nocuenta' : 'cero', dow: x.getUTCDay(), dia: x.getUTCDate() });
    }
    return out;
  }, [ser, hoy]);
  const maxS = Math.max(0.0001, ...semana.map(s => s.v));
  const [sel, setSel] = useState(null);
  const elegido = sel || (semana.find(s => s.f === vent.ultima) ? vent.ultima : hoy);
  const nombreDia = s => `${s.f === hoy ? 'hoy, ' : ''}${DIAS[s.dow]} ${s.dia}`;
  const tipDia = s => cap(nombreDia(s)) + (
    s.kind === 'cuenta' ? ` · ${s.v} de dedos · ${s.f === vent.ultima ? 'tu última carga de dedos' : 'cuenta para la ventana'}${s.v === 0 ? ' (sin minutos anotados)' : ''}`
    : s.kind === 'nocuenta' ? ` · ${s.v} de dedos · no cuenta: ese día no hubo ningún ejercicio que cargue los dedos`
    : ` · sin carga de dedos${s.f === hoy ? ' todavía' : ''}`);

  const hoyD = new Date(aT(hoy));
  const fechaHoy = cap(`${DIAS[hoyD.getUTCDay()]} ${hoyD.getUTCDate()} de ${MESES_L[hoyD.getUTCMonth()]}`);
  const pos = conTest ? 50 + Math.max(-10, Math.min(10, test.pct)) * 5 : 50;
  const N = NIVEL[vent.nivel] || NIVEL.green;

  return (
    <div className="page">
      <h2 className="p-title">Hoy</h2>
      <p className="p-sub">{fechaHoy}</p>

      <div className="grid2">
        {/* ---- la respuesta, arriba del todo ---- */}
        <section className="card verdict span2" style={{ '--c': v.c, '--i': 0 }} aria-label="Veredicto de hoy">
          <V.Icono className="wm" size={128} weight="duotone" aria-hidden="true" />
          <span className="chip"><span className="dot" style={{ '--c': v.c }} />{V.chip}</span>
          <h3>{v.t}</h3>
          <ul>
            {rec.razones.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </section>

        {/* ---- estado y de qué está hecho ---- */}
        <Tarjeta titulo="Estado" Icono={GaugeIcon} c="var(--brand)" i={1} className="span2">
          <div className="estado-top" style={{ '--c': col }}>
            <div className="ring">
              <svg viewBox="0 0 128 128" aria-hidden="true">
                <circle className="trk" cx="64" cy="64" r="54" fill="none" strokeWidth="12" />
                <circle className="arc" cx="64" cy="64" r="54" fill="none" strokeWidth="12" strokeLinecap="round"
                        transform="rotate(-90 64 64)" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - total / 100)} />
              </svg>
              <div className="ring-num"><b><Cuenta valor={total} /></b><span>de 100</span></div>
            </div>
            <div className="estado-side">
              <span className="chip"><span className="dot" style={{ '--c': col }} />Zona {zona}</span>
              <p className="note">70 o más, alta · de 45 a 69, media · menos de 45, baja.</p>
            </div>
          </div>
          <ConTabla tabla={
            <Tabla titulo="De qué está hecho el Estado" filas={comp}
                   cols={[{ k: 'nom', t: 'Componente' }, { k: 'v', t: 'Valor' }, { k: 'peso', t: 'Peso', f: x => x + ' %' }]} />
          }>
            <ul className="comp">
              {comp.map((x, n) => (
                <li key={x.k}>
                  <button type="button" className="bar-row" aria-expanded={abierto === x.k}
                          onClick={() => setAbierto(abierto === x.k ? null : x.k)} style={{ '--c': x.c, '--v': x.v, '--n': n }}>
                    <x.Icono size={26} weight="duotone" />
                    <span className="bar-name">{x.nom}<small>pesa {x.peso} %</small></span>
                    <span className="bar-val">{x.v}<span className="sr"> de 100</span></span>
                    <CaretDownIcon className="caret" size={20} weight="bold" />
                    <span className="bar-track" aria-hidden="true"><span className="bar-fill" /></span>
                  </button>
                  <div className={'exp-wrap' + (abierto === x.k ? ' open' : '')} aria-hidden={abierto !== x.k}>
                    <div className="exp"><p>{x.txt}</p></div>
                  </div>
                </li>
              ))}
            </ul>
          </ConTabla>
          <div className="note" style={{ marginTop: 10 }}>
            Cuanto más larga la barra, mejor. Dedos, cuerpo y sistémico son frescura;
            fuerza es tu último test contra tu media
            {conTest ? '.' : ' — y ahora mismo no hay test comparable, así que esa barra está al 50 por defecto.'}
            {' '}El Estado pesa dedos 40 %, fuerza 30 %, cuerpo 15 % y sistémico 15 %. Toca una barra para ver de dónde sale.
          </div>
        </Tarjeta>

        {/* ---- ventana tendinosa ---- */}
        <Tarjeta titulo="Ventana tendinosa" Icono={HourglassMediumIcon} c="var(--dedos)" i={2}
                 extra={<span className="chip"><span className="dot" style={{ '--c': N.c }} />{N.t}</span>}>
          <p className="v-msg">{vent.msg}</p>
          <div className="strip" role="group" aria-label="Carga de dedos de los últimos 7 días. Toca un día para ver su valor.">
            {semana.map((s, n) => (
              <button key={s.f} type="button" className="d-day" data-kind={s.kind} aria-pressed={elegido === s.f}
                      aria-label={tipDia(s)} onClick={() => setSel(s.f)}
                      style={{ '--h': `${s.kind === 'cero' ? 0 : Math.max(3, Math.round((s.v / maxS) * 70))}px`, '--n': n }}>
                <span className="d-col">
                  {s.f === vent.ultima && s.v > 0 && <span className="vlab">{s.v}</span>}
                  <span className="d-bar" />
                </span>
                <span className="dlab">{INI[s.dow]}<b>{s.dia}</b>{s.f === hoy && <em>hoy</em>}</span>
              </button>
            ))}
          </div>
          <p className="callout" aria-live="polite">{tipDia(semana.find(s => s.f === elegido) || semana[semana.length - 1])}</p>
          <div className="note">
            Carga de dedos 7 d: <b>{vent.acum}</b> · {vent.dias7} día{vent.dias7 === 1 ? '' : 's'} con carga
            {vent.ultima && <> · última carga: <b>{vent.ultima.slice(8)}/{vent.ultima.slice(5, 7)}</b></>}
            {vent.sinMinutos > 0 && (
              <div style={{ marginTop: 2 }}>
                {vent.sinMinutos} bloque{vent.sinMinutos === 1 ? '' : 's'} de dedos sin minutos anotados:
                {vent.sinMinutos === 1 ? ' cuenta' : ' cuentan'} para la ventana, pero no suma{vent.sinMinutos === 1 ? '' : 'n'} carga.
              </div>
            )}
          </div>
        </Tarjeta>

        {/* ---- el test ---- */}
        <Tarjeta titulo="Último test" Icono={GaugeIcon} c="var(--fuerza)" i={3}>
          {!test ? (
            <div className="vacio">
              Todavía no hay ningún test con las dos manos registrado.
            </div>
          ) : test.sinBase ? (
            <div className="note">
              {test.fecha.split('-').reverse().join('/')} · {test.mm ? <>regleta {test.mm} mm · </> : null}
              {test.valor} N (suma de las dos manos).<br />
              {test.mm === null
                ? 'Este test no tiene anotado el tamaño de regleta, así que no hay con qué compararlo.'
                : `${test.n === 0 ? 'No hay ningún test más' : `Solo hay ${test.n} test${test.n === 1 ? '' : 's'} más`} con esa regleta en los 60 días anteriores. Hacen falta 3 para poder comparar con algo.`}
            </div>
          ) : (
            <>
              <div className="hero"><b>{signo(test.pct)} %</b><span>respecto a tu media</span></div>
              <div className="meter" aria-hidden="true">
                <span className="mt-track" />
                <span className="mt-seg" style={{ left: `${Math.min(pos, 50)}%`, width: `${Math.abs(pos - 50)}%` }} />
                <span className="mt-mid" />
                <span className="mt-dot" style={{ left: `${pos}%` }} />
              </div>
              <div className="mt-scale" aria-hidden="true"><span>−10 %</span><span>tu media</span><span>+10 %</span></div>
              <div className="note">
                {test.fecha.split('-').reverse().join('/')} · {test.valor} N contra una media de {test.media} N,
                sumando las dos manos.<br />
                Comparado solo con tests <b>pre</b> de <b>regleta {test.mm} mm</b>, {test.n} de los 60 días
                anteriores a ese test.
              </div>
            </>
          )}
        </Tarjeta>
      </div>

      <p className="foot">
        Sin predicciones: todo lo de esta pantalla describe lo que ya ha pasado.
        Los días se cuentan enteros porque las sesiones se apuntan por fecha, sin hora.
        Umbral de oclusión {Math.round(PARAMS.umbralOclusion * 100)} % · τ dedos {PARAMS.tau.dedos} d ·
        el % de bloque, travesía y vía va sin umbral.
      </p>
    </div>
  );
}
