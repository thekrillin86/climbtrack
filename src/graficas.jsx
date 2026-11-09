/**
 * ClimbTrack · piezas comunes de las gráficas
 *
 * Un solo sitio para que todas las gráficas hablen igual:
 *   - una escala por gráfica, nunca dos ejes;
 *   - rejilla de líneas finas, ejes discretos, texto en gris de lectura;
 *   - el número siempre en tinta de texto, el color solo en la marca;
 *   - al tocar un punto o una barra sale su valor;
 *   - cada gráfica se puede ver también como tabla.
 *
 * Aquí no se calcula nada del modelo: se pinta lo que llega.
 */
import { useId, useMemo, useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useReducedMotion } from 'motion/react';
import { TableIcon, ChartLineIcon } from '@phosphor-icons/react';
import { usePaleta } from './tema.js';
import { IconoActividad } from './iconos.jsx';

/* ---------------- fechas ---------------- */
export const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** «2026-11-09» → «9/11». Un test con solo mes («2026-01») → «01/2026». */
export function fechaCorta(iso) {
  const [y, m, d] = String(iso || '').split('-');
  if (d) return `${+d}/${+m}`;
  if (m) return `${m}/${y}`;
  return String(iso || '');
}
/** «2026-11-09» → «9/11/2026». */
export function fechaLarga(iso) {
  const [y, m, d] = String(iso || '').split('-');
  if (d) return `${+d}/${+m}/${y}`;
  if (m) return `${m}/${y}`;
  return String(iso || '');
}
/** Fecha → número para un eje de tiempo (mediodía UTC: sin saltos de horario). */
export const aT = iso => Date.parse(String(iso).slice(0, 10) + 'T12:00:00Z');

/** Dominio y marcas de un eje de tiempo: cuatro fechas repartidas. */
export function ejeTiempo(ts) {
  const a = Math.min(...ts), b = Math.max(...ts);
  const span = Math.max(b - a, 864e5);
  const pad = Math.max(864e5 * 0.6, span * 0.04);
  const largo = span > 120 * 864e5;
  const fmt = t => {
    const d = new Date(t);
    return largo ? `${MESES[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}` : `${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
  };
  const ticks = a === b ? [a] : [0, 1, 2, 3].map(i => Math.round(a + ((b - a) * i) / 3));
  return { domain: [a - pad, b + pad], ticks, tickFormatter: fmt };
}

/* ---------------- periodo ---------------- */
export const RANGOS = [
  { k: '3m', t: '3 meses', d: 92 },
  { k: '6m', t: '6 meses', d: 183 },
  { k: '1a', t: '1 año', d: 366 },
  { k: 'todo', t: 'Todo', d: null },
];
/** Primer día que entra en el periodo, o '' si es «Todo». */
export function desdeRango(k, hoyISO) {
  const r = RANGOS.find(x => x.k === k);
  if (!r || !r.d) return '';
  const d = new Date(aT(hoyISO));
  d.setUTCDate(d.getUTCDate() - r.d);
  return d.toISOString().slice(0, 10);
}
export function Rango({ valor, onCambio }) {
  return (
    <div className="tabs sm" role="group" aria-label="Periodo de la gráfica">
      {RANGOS.map(r => (
        <button key={r.k} type="button" className={'tb' + (valor === r.k ? ' ac' : '')} aria-pressed={valor === r.k}
                onClick={() => onCambio(r.k)}>{r.t}</button>
      ))}
    </div>
  );
}

/* ---------------- envoltorio y ejes ---------------- */
/** Contenedor de recharts con un tamaño de partida, para que se dibuje aunque
 *  aún no se haya medido la pantalla. */
export function Grafica({ alto = 200, etiqueta, children }) {
  return (
    <div className="chart" role="img" aria-label={etiqueta}>
      <ResponsiveContainer width="100%" height={alto} initialDimension={{ width: 340, height: alto }}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

/** Props comunes de rejilla, ejes y cursor, con los colores del tema vigente. */
export function useEjes() {
  const p = usePaleta();
  const anim = !useReducedMotion();
  return {
    p, anim,
    grid: { stroke: p.hair, vertical: false },
    x: { tick: { fill: p.ink2, fontSize: 12 }, tickLine: false, axisLine: { stroke: p.lineStrong }, tickMargin: 6 },
    y: { tick: { fill: p.ink2, fontSize: 12 }, tickLine: false, axisLine: false, width: 42 },
    cursorLinea: { stroke: p.ink2, strokeWidth: 1 },
    cursorBanda: { fill: p.wash2 },
  };
}

/** Recuadro que sale al tocar: cabecera y filas «color · nombre · valor». */
export function Tip({ active, payload, cab, filas }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const fs = filas(d).filter(Boolean);
  return (
    <div className="tip">
      <div className="tip-h">{cab(d)}</div>
      {fs.map((f, i) => (
        <div key={i} className="tip-r">
          {f.c && <i className={'sw' + (f.hueco ? ' hueco' : '')} style={{ '--c': f.c }} />}
          <span>{f.t}</span><b>{f.v}</b>
        </div>
      ))}
    </div>
  );
}

/** Leyenda en HTML: se lee mejor que la de recharts y no roba alto a la gráfica. */
export function Leyenda({ items }) {
  return (
    <div className="leyenda">
      {items.filter(Boolean).map(x => (
        <span key={x.t}><i className={'sw' + (x.tipo ? ' ' + x.tipo : '')} style={{ '--c': x.c }} />{x.t}</span>
      ))}
    </div>
  );
}

/* ---------------- la misma información, como tabla ---------------- */
export function Tabla({ cols, filas, titulo }) {
  const val = (c, f) => (c.f ? c.f(f[c.k], f) : (f[c.k] ?? '—'));
  return (
    <table className="tabla">
      {titulo && <caption className="sr">{titulo}</caption>}
      <thead><tr>{cols.map(c => <th key={c.k} scope="col">{c.t}</th>)}</tr></thead>
      <tbody>
        {filas.map((f, i) => (
          <tr key={i}>
            {cols.map((c, j) => (j === 0
              ? <th key={c.k} scope="row">{val(c, f)}</th>
              : <td key={c.k}>{val(c, f)}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ConTabla({ tabla, children }) {
  const [t, setT] = useState(false);
  return (
    <>
      {t ? <div className="tabla-wrap">{tabla}</div> : children}
      <button type="button" className="link-btn" aria-pressed={t} onClick={() => setT(v => !v)}>
        {t ? <ChartLineIcon size={20} weight="bold" /> : <TableIcon size={20} weight="bold" />}
        <span>{t ? 'Ver como gráfica' : 'Ver como tabla'}</span>
      </button>
    </>
  );
}

/* ---------------- tarjeta con cabecera ---------------- */
export function Tarjeta({ titulo, Icono, c = 'var(--brand)', extra, i, className = '', style, children }) {
  return (
    <section className={'card ' + className} style={{ ...(i != null ? { '--i': i } : null), ...style }} aria-label={titulo}>
      <div className="card-h">
        {Icono && <span className="badge" style={{ '--c': c }}><Icono size={22} weight="duotone" /></span>}
        <h3>{titulo}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}

/* ---------------- barras clasificadas ---------------- */
/** items: [{ k, nombre, v, txt?, unidad?, a? (actividad, para el icono), c? }]
 *  Ordenadas de mayor a menor por quien llama. Una sola serie: un solo color. */
export function Ranking({ items, c = 'var(--brand)', etiqueta }) {
  const max = Math.max(1e-9, ...items.map(x => x.v));
  return (
    <ul className="rk" aria-label={etiqueta}>
      {items.map((x, n) => (
        <li key={x.k} className={'rk-row' + (x.a ? '' : ' sin-ic')}>
          {x.a && <IconoActividad a={x.a} size={20} />}
          <span className="rk-name">{x.nombre}</span>
          <span className="rk-val">{x.txt ?? x.v}{x.unidad && <small>{x.unidad}</small>}</span>
          <span className="rk-track" aria-hidden="true">
            <span className="rk-fill" style={{ '--v': `${(x.v / max) * 100}%`, '--c': x.c || c, '--n': n }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Tindeq: izquierda y derecha en el tiempo ----------------
   Los tests «post» (después de entrenar) son dedos ya cansados: se pintan
   como puntos huecos y no se unen a la línea, que va de test «pre» en test
   «pre». Así no se mezclan dos cosas distintas en el mismo trazo. */
export function GraficaTindeq({ filas, alto = 210, etiqueta = 'Fuerza en el Tindeq, mano izquierda y derecha' }) {
  const ej = useEjes(); const { p } = ej;
  const datos = useMemo(() => {
    const vistos = {};
    return [...filas].filter(r => r.fecha && (Number(r.esq) > 0 || Number(r.dre) > 0))
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
      .map(r => {
        const post = r.momento === 'post';
        const clave = r.fecha + (post ? 'p' : '');
        const n = (vistos[clave] = (vistos[clave] || 0) + 1);
        const i = Number(r.esq) > 0 ? Number(r.esq) : null;
        const d = Number(r.dre) > 0 ? Number(r.dre) : null;
        return {
          // mismo día: el post un poco a la derecha del pre, y los repetidos al lado
          t: aT(r.fecha) + (post ? 6 : 0) * 36e5 + (n - 1) * 2 * 36e5,
          fecha: r.fecha, momento: r.momento || '', post,
          iPre: post ? null : i, dPre: post ? null : d, iPost: post ? i : null, dPost: post ? d : null,
        };
      });
  }, [filas]);
  if (datos.length === 0) return <div className="vacio">No hay tests en este periodo.</div>;
  const eje = ejeTiempo(datos.map(d => d.t));
  const hayPost = datos.some(d => d.post);
  const puntos = datos.length <= 60;
  const dot = c => (puntos ? { r: 4, fill: c, stroke: p.card, strokeWidth: 1.5 } : false);
  const hueco = c => ({ r: 4, fill: p.card, stroke: c, strokeWidth: 2 });
  const N = v => (v == null ? '—' : `${v} N`);
  return (
    <>
      <Grafica alto={alto} etiqueta={etiqueta}>
        <ComposedChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid {...ej.grid} />
          <XAxis dataKey="t" type="number" scale="time" {...eje} {...ej.x} />
          <YAxis domain={['auto', 'auto']} allowDecimals={false} {...ej.y} />
          <Tooltip cursor={ej.cursorLinea} isAnimationActive={false}
                   content={<Tip cab={d => `${fechaLarga(d.fecha)}${d.momento ? ' · ' + d.momento : ''}`}
                                 filas={d => [
                                   { c: p.izq, t: 'Izquierda', v: N(d.post ? d.iPost : d.iPre), hueco: d.post },
                                   { c: p.dch, t: 'Derecha', v: N(d.post ? d.dPost : d.dPre), hueco: d.post },
                                 ]} />} />
          <Line dataKey="iPre" name="Izquierda" stroke={p.izq} strokeWidth={2.5} dot={dot(p.izq)}
                activeDot={{ r: 6, stroke: p.card, strokeWidth: 2 }} connectNulls isAnimationActive={ej.anim} />
          <Line dataKey="dPre" name="Derecha" stroke={p.dch} strokeWidth={2.5} dot={dot(p.dch)}
                activeDot={{ r: 6, stroke: p.card, strokeWidth: 2 }} connectNulls isAnimationActive={ej.anim} />
          {hayPost && <Line dataKey="iPost" stroke={p.izq} strokeWidth={0} dot={hueco(p.izq)} activeDot={hueco(p.izq)} isAnimationActive={false} legendType="none" />}
          {hayPost && <Line dataKey="dPost" stroke={p.dch} strokeWidth={0} dot={hueco(p.dch)} activeDot={hueco(p.dch)} isAnimationActive={false} legendType="none" />}
        </ComposedChart>
      </Grafica>
      <Leyenda items={[
        { c: 'var(--izq)', t: 'Izquierda' },
        { c: 'var(--dch)', t: 'Derecha' },
        hayPost && { c: 'var(--ink2)', t: 'hueco: post, después de entrenar', tipo: 'hueco' },
      ]} />
    </>
  );
}

export const tablaTindeq = filas => (
  <Tabla titulo="Tests del Tindeq"
         cols={[
           { k: 'fecha', t: 'Fecha', f: v => fechaLarga(v) },
           { k: 'mm', t: 'mm', f: v => v || '—' },
           { k: 'momento', t: 'Momento', f: v => v || '—' },
           { k: 'esq', t: 'Izq (N)', f: v => (Number(v) > 0 ? v : '—') },
           { k: 'dre', t: 'Dch (N)', f: v => (Number(v) > 0 ? v : '—') },
         ]}
         filas={[...filas].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))} />
);

/* ---------------- peso ---------------- */
export function GraficaPeso({ filas, alto = 190 }) {
  const ej = useEjes(); const { p } = ej;
  const gid = 'peso' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const datos = useMemo(() => [...filas]
    .map(r => ({ t: r.fecha ? aT(r.fecha) : NaN, fecha: r.fecha, p: Number(r.peso) || null }))
    .filter(d => Number.isFinite(d.t) && d.p)
    .sort((a, b) => a.t - b.t), [filas]);
  if (datos.length === 0) return <div className="vacio">No hay pesos en este periodo.</div>;
  const eje = ejeTiempo(datos.map(d => d.t));
  return (
    <Grafica alto={alto} etiqueta="Evolución del peso">
      <ComposedChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.peso} stopOpacity={0.28} />
            <stop offset="100%" stopColor={p.peso} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...ej.grid} />
        <XAxis dataKey="t" type="number" scale="time" {...eje} {...ej.x} />
        <YAxis domain={['dataMin - 1', 'dataMax + 1']} allowDecimals={false} tickFormatter={v => Math.round(v)} {...ej.y} />
        <Tooltip cursor={ej.cursorLinea} isAnimationActive={false}
                 content={<Tip cab={d => fechaLarga(d.fecha)} filas={d => [{ c: p.peso, t: 'Peso', v: `${d.p} kg` }]} />} />
        <Area dataKey="p" stroke="none" fill={`url(#${gid})`} isAnimationActive={ej.anim} />
        <Line dataKey="p" name="Peso" stroke={p.peso} strokeWidth={2.5}
              dot={datos.length <= 60 ? { r: 4, fill: p.peso, stroke: p.card, strokeWidth: 1.5 } : false}
              activeDot={{ r: 6, stroke: p.card, strokeWidth: 2 }} isAnimationActive={ej.anim} />
      </ComposedChart>
    </Grafica>
  );
}

/* ---------------- curva individual: segundos hasta el fallo ---------------- */
export function GraficaCurva({ puntos, alto = 210 }) {
  const ej = useEjes(); const { p } = ej;
  return (
    <Grafica alto={alto} etiqueta="Curva individual: segundos hasta el fallo según la intensidad">
      <LineChart data={puntos} margin={{ top: 10, right: 14, bottom: 0, left: 0 }}>
        <CartesianGrid {...ej.grid} />
        <XAxis dataKey="i" type="number" domain={[30, 100]} reversed ticks={[100, 85, 75, 65, 55, 45, 35]}
               tickFormatter={v => `${v}%`} {...ej.x} />
        <YAxis allowDecimals={false} tickFormatter={v => `${v} s`} {...ej.y} />
        <Tooltip cursor={ej.cursorLinea} isAnimationActive={false}
                 content={<Tip cab={d => `Al ${d.i} % de tu máximo`} filas={d => [{ c: p.fuerza, t: 'Hasta el fallo', v: `${d.t} s` }]} />} />
        <Line type="monotone" dataKey="t" stroke={p.fuerza} strokeWidth={2.5}
              dot={{ r: 4.5, fill: p.fuerza, stroke: p.card, strokeWidth: 1.5 }}
              activeDot={{ r: 6.5, stroke: p.card, strokeWidth: 2 }} isAnimationActive={ej.anim} />
      </LineChart>
    </Grafica>
  );
}
