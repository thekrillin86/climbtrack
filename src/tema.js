/**
 * ClimbTrack · tema visual
 * archivo: src/tema.js
 *
 * Una sola fuente para todos los colores de la app. Cada color tiene un PAPEL
 * (texto, marca, canal de dedos, estado «bien»…) y no un valor suelto: así un
 * cambio de paleta recolorea por papel sin arrastrar a otros.
 *
 * Solo aspecto: aquí no hay ni un dato ni un cálculo.
 *
 * Dirección: «la pared del rocódromo». Fondo neutro con la rejilla de tuercas,
 * y el color reservado para las presas: los datos, los iconos y los acentos.
 *
 * Reglas que no se rompen (ver CLAUDE.md §12):
 * - Un color fijo por cosa en toda la app: dedos naranja, cuerpo azul,
 *   sistémico aguamarina, fuerza violeta. Validados con el comprobador de la
 *   skill de visualización (daltonismo, separación, contraste) en los DOS
 *   modos y en este orden. Si cambias uno, vuelve a validarlo.
 * - Los colores de estado (bien / ojo / mal) van SIEMPRE con texto o icono.
 * - Un color de serie o de estado que es TEXTO usa su variante `…Ink`, más
 *   oscura en claro: el naranja o el ámbar de una barra no se leen como letra
 *   pequeña sobre blanco.
 *
 * Los estilos usan las variables CSS (`var(--ink2)`). Las gráficas de recharts
 * pintan en SVG y reciben el color ya resuelto con `usePaleta()`.
 */
import { useEffect, useState } from 'react';

export const CLARO = {
  // superficies
  bg: '#eef1f4',          // la pared: gris tiza
  bgElev: '#ffffff',      // cabecera, barra inferior, hojas
  card: '#ffffff',
  line: '#e1e6ec',
  lineSoft: '#edf0f4',
  lineStrong: '#c9d0da',
  hair: '#e6e9ee',        // rejilla de gráficas: un paso sobre la tarjeta
  dot: 'rgba(18,23,34,0.085)', // agujeros de la rejilla de tuercas
  track: '#edf0f4',       // pista de barras y medidores
  nocount: '#c3cad4',     // barra que se enseña pero no cuenta
  cardEdge: 'rgba(18,23,34,0.05)', // canto de las tarjetas
  // texto
  ink: '#121722',
  inkSoft: '#2a3140',
  ink2: '#4a5363',
  ink3: '#4f5868',
  ink4: '#566070',
  // marca
  brand: '#eb6834',
  brandInk: '#b2440f',    // la marca cuando es texto
  dedosInk: '#b2440f',    // el naranja de dedos cuando es texto
  onBrand: '#121722',
  // canales e identidades
  dedos: '#eb6834',
  cuerpo: '#2a78d6',
  sist: '#1baf7a',
  fuerza: '#6250d6',
  izq: '#6250d6',
  dch: '#e87ba4',
  info: '#1f63b9',        // azul de «información»: un paso más oscuro, se usa como texto
  peso: '#eb6834',
  acento: '#6250d6',
  carga: '#4a5363',
  onChip: '#121722',
  // estado como TEXTO (pasa 4,5:1 sobre tarjeta y fondo)
  good: '#11780f',
  warn: '#8d5f00',
  bad: '#c22f2f',
  crit: '#c22f2f',
  serious: '#ad4a17',
  // estado como MARCA (puntos, anillos, bordes, tintes): paleta fija
  goodMark: '#0ca30c',
  warnMark: '#fab219',
  badMark: '#d03b3b',
  seriousMark: '#ec835a',
  goodSoft: '#121722',    // texto sobre un aviso teñido
  warnSoft: '#121722',
  badSoft: '#121722',
  wash: 'rgba(18,23,34,0.035)',
  wash2: 'rgba(18,23,34,0.06)',
  goodWash: 'rgba(12,163,12,0.10)',
  shadow: '0 1px 2px rgba(18,23,34,0.06), 0 8px 24px rgba(18,23,34,0.07)',
  scrim: 'rgba(14,17,22,0.45)',
};

export const OSCURO = {
  bg: '#0e1116',
  bgElev: '#181c23',
  card: '#181c23',
  line: '#29303a',
  lineSoft: '#20252d',
  lineStrong: '#39414d',
  hair: '#262c35',
  dot: 'rgba(238,241,245,0.07)',
  track: '#232933',
  nocount: '#46505e',
  cardEdge: 'rgba(255,255,255,0.06)',
  ink: '#eef1f5',
  inkSoft: '#d6dbe3',
  ink2: '#aeb6c3',
  ink3: '#a6aebb',
  ink4: '#9ea7b4',
  brand: '#d95926',
  brandInk: '#f2875a',
  dedosInk: '#f2875a',
  onBrand: '#121722',
  dedos: '#d95926',
  cuerpo: '#3987e5',
  sist: '#199e70',
  fuerza: '#9085e9',
  izq: '#9085e9',
  dch: '#d55181',
  info: '#3987e5',
  peso: '#d95926',
  acento: '#9085e9',
  carga: '#aeb6c3',
  onChip: '#121722',
  good: '#3fbf3f',
  warn: '#fab219',
  bad: '#f26b6b',
  crit: '#f26b6b',
  serious: '#ec835a',
  goodMark: '#0ca30c',
  warnMark: '#fab219',
  badMark: '#d03b3b',
  seriousMark: '#ec835a',
  goodSoft: '#eef1f5',
  warnSoft: '#eef1f5',
  badSoft: '#eef1f5',
  wash: 'rgba(255,255,255,0.04)',
  wash2: 'rgba(255,255,255,0.07)',
  goodWash: 'rgba(12,163,12,0.16)',
  shadow: '0 1px 2px rgba(0,0,0,0.45), 0 10px 28px rgba(0,0,0,0.35)',
  scrim: 'rgba(0,0,0,0.6)',
};

/* Variables CSS de una paleta: `--ink2:#4a5363;…` */
export function varsCSS(p) {
  return Object.entries(p).map(([k, v]) => `--${k}:${v}`).join(';');
}

/* ---- tema elegido ----
   Por defecto sigue al móvil. Si lo cambias a mano se recuerda en
   localStorage, no en tus datos: es una preferencia de pantalla y no viaja a
   la copia de la nube. */
const CLAVE = 'climbtrack-tema';
const EVENTO = 'climbtrack-tema';

const oscuroSistema = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function temaGuardado() {
  try { const t = localStorage.getItem(CLAVE); return t === 'claro' || t === 'oscuro' ? t : null; } catch { return null; }
}

export function temaEfectivo() {
  return temaGuardado() || (oscuroSistema() ? 'oscuro' : 'claro');
}

/* Pone el tema en la página. Se llama al arrancar, antes de pintar, para que
   no haya un parpadeo del tema contrario. */
export function aplicarTema() {
  if (typeof document === 'undefined') return;
  const t = temaGuardado();
  const root = document.documentElement;
  if (t) root.dataset.theme = t === 'oscuro' ? 'dark' : 'light';
  else delete root.dataset.theme;
  const p = temaEfectivo() === 'oscuro' ? OSCURO : CLARO;
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => m.setAttribute('content', p.bg));
}

export function cambiarTema() {
  const siguiente = temaEfectivo() === 'oscuro' ? 'claro' : 'oscuro';
  try { localStorage.setItem(CLAVE, siguiente); } catch { /* sin almacenamiento: dura lo que la sesión */ }
  aplicarTema();
  window.dispatchEvent(new Event(EVENTO));
}

/* Tema vigente y paleta resuelta, para quien pinta en SVG. Se actualiza solo
   al cambiar el tema o el ajuste del móvil. */
export function useTema() {
  const [t, setT] = useState(() => (typeof window === 'undefined' ? 'claro' : temaEfectivo()));
  useEffect(() => {
    const leer = () => setT(temaEfectivo());
    window.addEventListener(EVENTO, leer);
    const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    mq?.addEventListener?.('change', leer);
    return () => { window.removeEventListener(EVENTO, leer); mq?.removeEventListener?.('change', leer); };
  }, []);
  return t;
}

export function usePaleta() {
  return useTema() === 'oscuro' ? OSCURO : CLARO;
}
