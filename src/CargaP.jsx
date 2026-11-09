/**
 * ClimbTrack · pestaña CARGA
 * archivo nuevo: src/CargaP.jsx
 *
 * Enseña los tres canales por separado, nunca sumados en un total,
 * y dice de dónde sale cada número. Sin cajas negras.
 *
 * Los últimos 21 días van en tres paneles, uno por canal y cada uno con su
 * escala: antes eran barras apiladas, y una pila se lee como un total
 * (CLAUDE.md §4a). Aquí solo se pinta: los cálculos son los de carga.js.
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  HandIcon, PersonSimpleIcon, HeartbeatIcon, LightningIcon, CalendarBlankIcon, HandGrabbingIcon,
  MountainsIcon, QuestionIcon,
} from '@phosphor-icons/react';
import { seriesCarga, fatigaAcumulada, perfilEnFecha, cargaPorDetalle, PARAMS } from './carga.js';
import { AGARRE_POR_ID, repartoAgarres, viasPorAgarre } from './agarres.js';
import { TIPOS } from './catalogo.js';
import { td } from './lib.js';
import { Tarjeta, Grafica, useEjes, Tip, ConTabla, Tabla, Ranking, fechaLarga, DIAS, aT } from './graficas.jsx';

// k: el nombre del color en la paleta, para las barras (SVG)
const CANAL = {
  dedos: { nom: 'Dedos', Icono: HandIcon, c: 'var(--dedos)', k: 'dedos' },
  cuerpo: { nom: 'Cuerpo', Icono: PersonSimpleIcon, c: 'var(--cuerpo)', k: 'cuerpo' },
  sistemico: { nom: 'Sistémico', Icono: HeartbeatIcon, c: 'var(--sist)', k: 'sist' },
};
const KS = ['dedos', 'cuerpo', 'sistemico'];
const r1 = v => Math.round((Number(v) || 0) * 10) / 10;
const diaLargo = (f, hoy) => {
  const d = new Date(aT(f));
  return `${f === hoy ? 'Hoy, ' : ''}${DIAS[d.getUTCDay()]} ${fechaLarga(f)}`;
};

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

/** Un canal, 21 días: barras finas, su propia escala, el valor al tocar. */
function Panel21({ canal, filas, hoy, conFechas }) {
  const ej = useEjes(); const { p } = ej; const C = CANAL[canal];
  const max = Math.max(0, ...filas.map(f => f[canal]));
  const marcas = [0, 7, 14, filas.length - 1].map(i => filas[i]?.f).filter(Boolean);
  return (
    <div className="mini">
      <div className="mini-h"><i className="sw" style={{ '--c': C.c }} />{C.nom}<small>· el día más alto, {r1(max)}</small></div>
      <Grafica alto={conFechas ? 104 : 80} etiqueta={`Carga de ${C.nom.toLowerCase()} en los últimos 21 días`}>
        <BarChart data={filas} margin={{ top: 6, right: 4, bottom: 0, left: 0 }} barCategoryGap="22%">
          <CartesianGrid {...ej.grid} />
          <XAxis dataKey="f" hide={!conFechas} ticks={marcas} interval={0}
                 tickFormatter={f => (f === hoy ? 'hoy' : `${+f.slice(8)}/${+f.slice(5, 7)}`)} {...ej.x} />
          <YAxis domain={[0, max > 0 ? 'auto' : 1]} tickCount={3} allowDecimals={false} {...ej.y} width={34} />
          <Tooltip cursor={ej.cursorBanda} isAnimationActive={false}
                   content={<Tip cab={d => diaLargo(d.f, hoy)} filas={d => [{ c: p[C.k], t: C.nom, v: r1(d[canal]) }]} />} />
          <Bar dataKey={canal} fill={p[C.k]} radius={[3, 3, 0, 0]} maxBarSize={12} isAnimationActive={ej.anim} />
        </BarChart>
      </Grafica>
    </div>
  );
}

export default function CargaP({ cal = [], ent = [], roca = [], tests = [] }) {
  const ser = useMemo(() => seriesCarga(cal, ent, tests), [cal, ent, tests]);
  const hoy = td();
  const fat = useMemo(() => fatigaAcumulada(ser, hoy), [ser, hoy]);
  const dias = useMemo(() => diasAtras(21), []);
  const filas21 = useMemo(() => dias.map(f => {
    const c = ser[f] || {};
    return { f, dedos: r1(c.dedos), cuerpo: r1(c.cuerpo), sistemico: r1(c.sistemico) };
  }), [ser, dias]);

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

  // Perfil de fuerza vigente hoy y de dónde sale la intensidad de cada
  // ejercicio. Las dos cosas son para la tarjeta "De dónde sale cada número":
  // un %MVC calculado desde un perfil no es lo mismo que uno anotado a mano,
  // y la pantalla tiene que poder decirlo.
  const perfil = useMemo(() => perfilEnFecha(tests, hoy), [tests, hoy]);
  const susp = useMemo(() => {
    const acc = { anotado: 0, calculado: 0, estimado: 0, subUmbral: 0, superaFmax: 0, sinClasificar: 0, minSinClasificar: 0 };
    for (const s of ent) {
      const c = cargaPorDetalle(s, perfilEnFecha(tests, s.fecha));
      if (!c?.procedencia) continue;
      for (const k of ['anotado', 'calculado', 'estimado']) acc[k] += c.procedencia[k] || 0;
      acc.subUmbral += c.minSubUmbral || 0;
      acc.sinClasificar += c.sinClasificar || 0;
      acc.minSinClasificar += c.minSinClasificar || 0;
      if (c.superaFmax) acc.superaFmax++;
    }
    acc.total = acc.anotado + acc.calculado + acc.estimado;
    return acc;
  }, [ent, tests]);
  const fech = f => String(f || '').split('-').reverse().join('/');

  return (
    <div className="page">
      <h2 className="p-title">Carga</h2>

      {/* ---- fatiga acumulada hoy ---- */}
      <Tarjeta titulo="Fatiga acumulada hoy" Icono={LightningIcon} c="var(--dedos)" i={0}>
        <div className="tiles">
          {KS.map(k => {
            const C = CANAL[k];
            return (
              <div key={k} className="tile">
                <span className="badge" style={{ '--c': C.c }}><C.Icono size={20} weight="duotone" /></span>
                <b>{fat[k]}</b>
                <span>{C.nom}</span>
                <small>τ {PARAMS.tau[k]} d</small>
              </div>
            );
          })}
        </div>
        <div className="note" style={{ marginTop: 12 }}>
          Cada canal se recupera a su ritmo. Los dedos son los que más tardan, por eso
          su número baja más despacio que los otros dos.
        </div>
      </Tarjeta>

      {/* ---- últimos 21 días: un panel por canal ---- */}
      <Tarjeta titulo="Últimos 21 días" Icono={CalendarBlankIcon} c="var(--cuerpo)" i={1}>
        <ConTabla tabla={
          <Tabla titulo="Carga de los últimos 21 días" filas={[...filas21].reverse()}
                 cols={[{ k: 'f', t: 'Día', f: v => (v === hoy ? 'hoy' : fechaLarga(v)) },
                        { k: 'dedos', t: 'Dedos' }, { k: 'cuerpo', t: 'Cuerpo' }, { k: 'sistemico', t: 'Sistémico' }]} />
        }>
          {KS.map((k, n) => <Panel21 key={k} canal={k} filas={filas21} hoy={hoy} conFechas={n === KS.length - 1} />)}
        </ConTabla>
        <div className="note" style={{ marginTop: 8 }}>
          Un panel por canal, cada uno con su propia escala: no se suman ni se comparan
          entre sí, porque no hay forma aceptada de sumar cargas de tipos distintos.
          Toca una barra para ver el día.
        </div>
      </Tarjeta>

      {/* ---- por agarre ---- */}
      <Tarjeta titulo="Minutos por agarre · 30 días" Icono={HandGrabbingIcon} c="var(--dedos)" i={2}>
        {Object.keys(agarres).length === 0 ? (
          <div className="vacio">
            Todavía no hay nada. Las suspensiones se etiquetan solas por el tamaño de
            regleta; roca y rocódromo, con los chips al registrar la vía.
          </div>
        ) : (
          <Ranking etiqueta="Minutos por agarre en los últimos 30 días" c="var(--dedos)"
                   items={Object.entries(agarres).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                     { k, nombre: AGARRE_POR_ID[k]?.nombre || k, v, txt: Math.round(v), unidad: '′' }))} />
        )}
      </Tarjeta>

      {/* ---- vías de roca por agarre ---- */}
      <Tarjeta titulo="Vías por agarre · 30 días" Icono={MountainsIcon} c="var(--carga)" i={3}>
        {Object.keys(vias).length === 0 ? (
          <div className="vacio">
            Todavía no hay ninguna vía de roca con agarres marcados en los últimos
            30 días. Se marcan con los chips al registrar la vía en Roca.
          </div>
        ) : (
          <>
            <Ranking etiqueta="Vías por agarre en los últimos 30 días" c="var(--carga)"
                     items={Object.entries(vias).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                       { k, nombre: AGARRE_POR_ID[k]?.nombre || k, v, unidad: v === 1 ? ' vía' : ' vías' }))} />
            <div className="note" style={{ marginTop: 12 }}>
              Cuenta vías, no minutos, y no se suma con el panel de arriba. Una vía
              con varios agarres marcados cuenta entera en cada uno.
            </div>
          </>
        )}
      </Tarjeta>

      {/* ---- de dónde salen los números ---- */}
      <Tarjeta titulo="De dónde sale cada número" Icono={QuestionIcon} c="var(--info)" i={4}>
        {Object.entries(origenes).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10,
                                fontSize: 14, color: 'var(--ink)', padding: '6px 0',
                                borderBottom: '1px solid var(--lineSoft)' }}>
            <span>{k === 'detalle' ? 'Detalle del entrenamiento'
                 : k === 'actividad+reloj' ? 'Actividad + datos del reloj'
                 : 'Solo actividad y fatiga'}</span>
            <b className="num">{v} días</b>
          </div>
        ))}
        <div className="note" style={{ marginTop: 12 }}>
          {perfil ? (
            <>
              Tu perfil de fuerza sale de la pestaña Tests. Peso <b>{perfil.peso} kg</b> y
              máximo <b>{perfil.fmaxRef} kg</b> en regleta de <b>{perfil.regletaRef} mm</b>,
              del test de {fech(perfil.fuerzaDe)}. Umbral de oclusión{' '}
              {perfil.umbralOclusion ? (
                <>
                  <b>{Math.round(perfil.umbralOclusion * 100)} %</b>
                  {perfil.umbralDe !== perfil.fuerzaDe && <>, del test de {fech(perfil.umbralDe)}</>}
                </>
              ) : (
                <>
                  <b>{Math.round(PARAMS.umbralOclusion * 100)} %</b> — que no es tuyo: es la media
                  de un estudio, porque no tienes el OT rellenado en ningún test
                  {perfil.otFueraDeRango && <> (el que hay está fuera del rango {PARAMS.rangoOT[0]}–{PARAMS.rangoOT[1]} % y se ignora)</>}
                </>
              )}.
            </>
          ) : (
            <>No hay ningún test anterior a hoy en la pestaña Tests, así que la intensidad de
              todas las suspensiones se estima y el umbral es el de un estudio, no el tuyo.</>
          )}
        </div>
        <div className="note">
          La intensidad de una <b>suspensión</b> sale, por este orden: del porcentaje que
          hayas escrito; si no, calculada con el tamaño de regleta, el lastre y tu perfil;
          y si tampoco hay regleta, estimada al {PARAMS.pctSuspPorDefecto} %.
          {susp.total > 0 && <> De tus {susp.total} suspensiones y tests registrados,
            {' '}<b>{susp.anotado}</b> con el % escrito, <b>{susp.calculado}</b> calculadas
            y <b>{susp.estimado}</b> estimadas.</>}
          {susp.superaFmax > 0 && <> En {susp.superaFmax} el cálculo pasa del 100 %: señal de que
            el perfil se ha quedado viejo o el lastre está mal escrito.</>}
        </div>
        <div className="note">
          Por debajo de tu umbral no acumula nada: es trabajo sub-oclusivo y el modelo le
          da cero.
          {susp.subUmbral > 0 && <> En tu histórico son <b>{Math.round(susp.subUmbral)} minutos</b> de
            dedos que no suman — casi todo suspensiones prescritas justo en el umbral.</>}
          {' '}Exponente {PARAMS.exponente} · τ dedos {PARAMS.tau.dedos} d.
          Todo eso se cambia en carga.js.
        </div>

        {susp.sinClasificar > 0 && (
          <div className="note">
            <b>{susp.sinClasificar} ejercicio{susp.sinClasificar === 1 ? '' : 's'} sin clasificar</b>:
            {' '}<b>{Math.round(susp.minSinClasificar)} min</b> que no cuentan. El texto no casa con
            ninguno de los {TIPOS.length} tipos, así que no suma en ningún canal y además se lleva
            su parte de los minutos del bloque. Se arregla escribiéndolo de otra forma, o añadiendo
            la palabra al clasificador de catalogo.js.
          </div>
        )}
      </Tarjeta>
    </div>
  );
}
