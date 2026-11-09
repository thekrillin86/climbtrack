/**
 * ClimbTrack · iconos
 *
 * Todos los iconos de la app son de Phosphor (@phosphor-icons/react), en su
 * versión «duotono». Sustituyen a los emojis: un emoji se pinta distinto en
 * cada móvil y no se puede colorear.
 *
 * El color de cada actividad es el del canal que más carga, para que la app
 * hable un solo idioma: rocódromo, roca y suspensiones en el naranja de
 * dedos; gimnasio en el azul de cuerpo; cardio en el aguamarina de
 * sistémico; lo de recuperar, en gris.
 */
import {
  WallIcon, MountainsIcon, HandGrabbingIcon, BandaidsIcon, BedIcon, BarbellIcon,
  FlowerLotusIcon, PersonSimpleRunIcon, PersonSimpleTaiChiIcon, PushPinIcon,
} from '@phosphor-icons/react';

export const ACTIVIDAD = {
  'Rocòdrom': { Icono: WallIcon, c: 'var(--dedos)' },
  'Roca': { Icono: MountainsIcon, c: 'var(--dedos)' },
  'Suspensions/Dominades': { Icono: HandGrabbingIcon, c: 'var(--dedos)' },
  'Gimnàs': { Icono: BarbellIcon, c: 'var(--cuerpo)' },
  'Cardio': { Icono: PersonSimpleRunIcon, c: 'var(--sist)' },
  'Fisio': { Icono: BandaidsIcon, c: 'var(--ink2)' },
  'Descans': { Icono: BedIcon, c: 'var(--ink2)' },
  'Yoga': { Icono: FlowerLotusIcon, c: 'var(--ink2)' },
  'Mobilitat/Estiraments': { Icono: PersonSimpleTaiChiIcon, c: 'var(--ink2)' },
};
const OTRA = { Icono: PushPinIcon, c: 'var(--ink2)' };

/** Icono de una actividad dentro de su pastilla de color. */
export function IconoActividad({ a, size = 22 }) {
  const x = ACTIVIDAD[a] || OTRA;
  return (
    <span className="lr-e" style={{ '--c': x.c }} aria-hidden="true">
      <x.Icono size={size} weight="duotone" />
    </span>
  );
}

/** El logo: una presa de resina con su agujero del tornillo. */
export function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M6.5 22.5c-3.4-6.8.9-15.6 9.6-16.9 6.6-1 13.2 2.2 14.3 8.6 1.2 7.4-5.2 14.1-12.9 14.3-5.4.2-8.9-2.3-11-6z" fill="var(--brand)" />
      <circle cx="18.6" cy="17" r="3" fill="var(--bg)" />
    </svg>
  );
}
