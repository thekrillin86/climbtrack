/**
 * ClimbTrack · pestaña PLAN
 * archivo nuevo: src/PlanP.jsx (18-11-2026)
 *
 * Enseña el plan de la semana de Talaia: hoy arriba, la semana entera debajo
 * con lo ya apuntado marcado, y los kilos de cada mano calculados de sus tests.
 * «Hecho» abre el formulario de Entreno de siempre ya rellenado; no guarda
 * nada. Toda la lógica está en plan.js, que tiene sus pruebas.
 */
import React, { useMemo, useState } from 'react';
import {
  ClipboardTextIcon, ChatTextIcon, CheckIcon, CheckCircleIcon, CaretDownIcon, BedIcon, QuestionIcon,
} from '@phosphor-icons/react';
import { leerPlanTexto, kilosMano, rellenarEntreno, apuntado } from './plan.js';
import { Tarjeta, DIAS, aT, fechaCorta, fechaLarga } from './graficas.jsx';
import { td, xi } from './lib.js';

const nombreDia = d => {
  if (d.dia) return d.dia;
  const x = new Date(aT(d.fecha));
  return `${DIAS[x.getUTCDay()].charAt(0).toUpperCase()}${DIAS[x.getUTCDay()].slice(1)} ${x.getUTCDate()}`;
};
const kgTxt = k => (k == null ? '—' : `${k.toFixed(1)} kg`);

/** De dónde sale el número de una mano, dicho en pantalla. */
function fuente(nombre, r) {
  if (r.de === 'app') return `${nombre}: ${r.test.n} N = ${r.test.kg.toFixed(1)} kg, tu test del ${fechaCorta(r.test.fecha)}`;
  if (r.de === 'plan') return `${nombre}: ${r.test.kg.toFixed(1)} kg, el test que trae el plan${r.test.fecha ? ` (${fechaLarga(r.test.fecha)})` : ''}`;
  return `${nombre}: ${r.falta}`;
}

function Dosis({ d, plan, t25, treg }) {
  if (!d) return null;
  if (typeof d === 'string') return <span className="pl-dosis">{d}</span>;
  const iz = kilosMano(d, 'izq', treg, t25, plan.tests);
  const de = kilosMano(d, 'dch', treg, t25, plan.tests);
  return (
    <div className="pl-kg">
      <div className="pl-manos">
        <span className="pl-pct">{d.pct} % · {d.mm} mm</span>
        <span className="pl-mano"><i className="sw" style={{ '--c': 'var(--izq)' }} />Izq <b>{kgTxt(iz.kg)}</b></span>
        <span className="pl-mano"><i className="sw" style={{ '--c': 'var(--dch)' }} />Dch <b>{kgTxt(de.kg)}</b></span>
      </div>
      <div className="pl-fuente">{fuente('Izq', iz)} · {fuente('Dch', de)}</div>
    </div>
  );
}

function Sesion({ dia, plan, t25, treg }) {
  if (dia.descanso) {
    return <p className="note" style={{ fontSize: 15 }}>{dia.nota || 'Descanso.'}</p>;
  }
  return (
    <>
      <div className="pl-meta">
        {dia.hora && <span className="chip">{dia.hora}</span>}
        {dia.tipoCT && <span className="chip">{dia.tipoCT}</span>}
      </div>
      {dia.nota && <p className="note" style={{ marginBottom: 10 }}>{dia.nota}</p>}
      {dia.bloques.map((b, i) => (
        <div key={i} className="pl-blq">
          <div className="pl-bh">
            <span className={`block-tag-sm ${b.tipoCT === 'General' ? 'gen' : 'esp'}`}>{b.tipoCT === 'General' ? 'G' : 'E'}</span>
            <b>{b.t || b.tipoCT}</b>
            <small>{[b.series ? `${b.series} ${b.series === 1 ? 'serie' : 'series'}` : '', b.minutos ? `${b.minutos}′` : ''].filter(Boolean).join(' · ')}</small>
          </div>
          <ul className="pl-items">
            {b.items.map((it, j) => (
              <li key={j} className="pl-item">
                <span className="pl-txt">{it.txt || it.nombre}</span>
                {it.dosis && <Dosis d={it.dosis} plan={plan} t25={t25} treg={treg} />}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

function BotonHecho({ dia, plan, ent, cal, onHecho }) {
  const ya = apuntado(dia.fecha, ent, cal);
  return (
    <>
      {ya && <p className="note" style={{ margin: '12px 0 0' }}>Ya hay algo apuntado este día. Si es otra sesión, puedes apuntarla también.</p>}
      <button type="button" className="btn-primary btn-full" style={{ marginTop: 12 }}
              onClick={() => onHecho(rellenarEntreno(dia, plan, ent, cal, xi))}>
        <CheckIcon size={20} weight="bold" />Hecho
      </button>
      <p className="note" style={{ marginTop: 6, fontSize: 13 }}>
        Abre el formulario de Entreno con lo planificado ya puesto. Tú pones RPE, minutos, fatiga
        final y quitas lo que no hiciste. No se guarda nada hasta que pulses Registrar.
      </p>
    </>
  );
}

/** Por qué no hay plan, dicho en pantalla (lo que ha devuelto leerPlan). */
function motivo(estado) {
  if (!estado) return 'Buscando el plan en la nube…';
  if (estado.estado === 'sin-sesion') return 'No hay sesión abierta en la pestaña Nube, y el plan llega a través de ella. Entra allí con tu cuenta y vuelve aquí.';
  if (estado.estado === 'sin-plan') return `En la nube no hay plan para tu usuario (${estado.uid}). Lo sube el puente de Talaia cada hora desde tu Drive.`;
  if (estado.estado === 'error') return `No se ha podido leer el plan de la nube: ${estado.mensaje}`;
  return '';
}

export default function PlanP({ doc, estado, ent = [], cal = [], t25 = [], treg = [], onHecho }) {
  const hoy = td();
  const { plan, error } = useMemo(() => (doc ? leerPlanTexto(doc.texto) : {}), [doc]);
  const [abierto, setAbierto] = useState(null);

  if (!doc || error) {
    return (
      <div className="page">
        <h2 className="p-title">Plan</h2>
        <Tarjeta titulo={error ? 'El plan no se puede leer' : 'Todavía no hay plan'} Icono={ClipboardTextIcon} i={0}>
          <p className="note">
            {error ? <>{error} Lo arregla Talaia en el archivo de Drive; aquí no se ha cambiado nada.</>
              : <>Talaia deja el plan cada domingo en tu Drive y el puente lo sube a la nube cada hora.
                  Aparece aquí cuando la app tiene abierta la sesión de la pestaña Nube.</>}
          </p>
          {!error && <p className="note" style={{ marginTop: 8 }}><b>Ahora mismo:</b> {motivo(estado)}</p>}
        </Tarjeta>
      </div>
    );
  }

  const deHoy = plan.dias.find(d => d.fecha === hoy);
  const primero = plan.dias[0].fecha, ultimo = plan.dias[plan.dias.length - 1].fecha;
  const recibido = doc.ts ? new Date(doc.ts) : null;

  return (
    <div className="page">
      <h2 className="p-title">Plan</h2>
      <p className="p-sub">{[plan.titulo, plan.fase].filter(Boolean).join(' · ')}</p>

      {/* ---- hoy ---- */}
      <Tarjeta i={0} Icono={deHoy?.descanso ? BedIcon : ClipboardTextIcon} c="var(--brand)"
               titulo={deHoy ? (deHoy.descanso ? 'Hoy · descanso' : `Hoy · ${deHoy.ses || deHoy.tipoCT || 'sesión'}`) : 'Hoy no está en el plan'}
               extra={deHoy && apuntado(deHoy.fecha, ent, cal) ? <span className="chip"><CheckCircleIcon size={16} weight="fill" style={{ color: 'var(--good)' }} />Apuntado</span> : null}>
        {deHoy ? (
          <>
            <Sesion dia={deHoy} plan={plan} t25={t25} treg={treg} />
            {!deHoy.descanso && <BotonHecho dia={deHoy} plan={plan} ent={ent} cal={cal} onHecho={onHecho} />}
          </>
        ) : (
          <p className="note">Este plan es de la semana del {fechaLarga(primero)} al {fechaLarga(ultimo)}.
            El de la semana nueva llega cuando Talaia lo deja en Drive.</p>
        )}
      </Tarjeta>

      {plan.nota && (
        <Tarjeta titulo="Nota de Talaia" Icono={ChatTextIcon} c="var(--fuerza)" i={1}>
          <p className="note" style={{ fontSize: 15, color: 'var(--ink)' }}>{plan.nota}</p>
        </Tarjeta>
      )}

      {/* ---- la semana ---- */}
      <Tarjeta titulo="La semana" Icono={ClipboardTextIcon} c="var(--cuerpo)" i={2}>
        <ul className="pl-sem">
          {plan.dias.map(d => {
            const ya = apuntado(d.fecha, ent, cal);
            const abre = abierto === d.fecha;
            return (
              <li key={d.fecha}>
                <button type="button" className={'pl-dia' + (d.fecha === hoy ? ' hoy' : '')} aria-expanded={abre}
                        onClick={() => setAbierto(abre ? null : d.fecha)}>
                  <span className="pl-dn"><b>{nombreDia(d)}</b>{d.fecha === hoy && <em>hoy</em>}</span>
                  <span className="pl-ds">{d.descanso ? 'Descanso' : (d.ses || d.tipoCT || 'Sesión')}{!d.descanso && d.hora && <small> · {d.hora}</small>}</span>
                  {ya ? <CheckCircleIcon size={22} weight="fill" style={{ color: 'var(--good)' }} aria-label="Apuntado" />
                      : <span className="pl-hueco" aria-hidden="true" />}
                  <CaretDownIcon className="caret" size={18} weight="bold" />
                </button>
                {abre && (
                  <div className="pl-det">
                    <Sesion dia={d} plan={plan} t25={t25} treg={treg} />
                    {!d.descanso && <BotonHecho dia={d} plan={plan} ent={ent} cal={cal} onHecho={onHecho} />}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="note" style={{ marginTop: 8 }}>
          El círculo verde es un día con algo apuntado en Entreno o en Rutina. Toca un día para ver su sesión.
        </p>
      </Tarjeta>

      <Tarjeta titulo="De dónde salen los kilos" Icono={QuestionIcon} c="var(--info)" i={3}>
        <p className="note">
          % del plan × tu último test <b>tirando hacia arriba</b> de esa mano y a esos milímetros (los
          «post», con los dedos cansados, no cuentan), pasado de newtons a kilos (÷ 9,81) y redondeado
          a 0,5 kg. Cada mano con su propio test. Si en la app no tienes ese test, se usa el que trae el
          plan; si tampoco, se dice que falta.
        </p>
        <p className="note">
          Plan de Talaia de la semana del {fechaLarga(plan.id)}{recibido && !Number.isNaN(recibido.getTime())
            ? <>, recibido el {recibido.toLocaleDateString('es-ES')} a las {recibido.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</> : null}.
          Lo que pone aquí lo decide ella; la app solo lo enseña.
        </p>
      </Tarjeta>
    </div>
  );
}
