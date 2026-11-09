/**
 * ClimbTrack · tema visual
 * archivo nuevo: src/tema.js
 *
 * Una sola fuente para todos los colores de la app. Cada color tiene un PAPEL
 * (texto, marca, canal de dedos, estado «bien»…) y no un valor suelto: así un
 * cambio de paleta recolorea por papel sin arrastrar a otros. El ámbar de antes
 * era a la vez la marca, el canal de dedos y el estado «medio», y el verde era
 * «bien» y también «sistémico»; con un papel por variable, cada uno puede
 * cambiar por su cuenta.
 *
 * Solo aspecto: aquí no hay ni un dato ni un cálculo.
 *
 * Los estilos usan las variables CSS (`var(--ink2)`). Las gráficas de recharts
 * pintan en SVG y reciben el color ya resuelto con `usePaleta()`.
 */
/* Paleta de hoy, papel por papel. Mismos valores que tenía la app escritos a
   mano: este paso no cambia nada de lo que se ve. */
export const OSCURO = {
  // superficies
  bg: '#141210',          // fondo de página, campos de texto
  bgElev: '#1A1612',      // cabecera, barra inferior, hojas
  card: '#1E1A15',        // tarjetas
  line: '#2A2420',        // bordes
  lineSoft: '#221E19',    // separadores de filas
  lineStrong: '#3A3228',  // bordes discontinuos y botones secundarios
  hair: '#33291F',        // rejilla de gráficas y bordes finos de chips
  // texto
  ink: '#E8D5B5',         // texto principal
  inkSoft: '#B8A88F',     // texto principal suave
  ink2: '#8B7D6B',        // texto secundario
  ink3: '#6B5F52',        // etiquetas y fechas
  ink4: '#5E5445',        // notas al pie
  // marca
  brand: '#E8A838',
  onBrand: '#141210',     // texto sobre la marca
  // canales e identidades: un color por cosa, en toda la app
  dedos: '#E8A838',
  cuerpo: '#3A8FB7',
  sist: '#6B9F4A',
  fuerza: '#E8A838',
  izq: '#E8A838',
  dch: '#3A8FB7',
  info: '#3A8FB7',        // bloque General, minutos
  peso: '#9B6BB7',
  // estado: significado reservado, siempre con texto o icono al lado
  good: '#6B9F4A',
  warn: '#E8A838',
  bad: '#D4563A',
  crit: '#9B3A3A',
  serious: '#C4724E',
  goodSoft: '#A8C89A',    // texto sobre aviso verde
  warnSoft: '#E8C89A',    // texto sobre aviso ámbar
  badSoft: '#E8A89A',     // texto sobre aviso rojo
};

/* Variables CSS de una paleta: `--ink2:#8B7D6B;…` */
export function varsCSS(p) {
  return Object.entries(p).map(([k, v]) => `--${k}:${v}`).join(';');
}

/* Paleta resuelta para pintar en SVG. Hoy hay una sola. */
export function usePaleta() {
  return OSCURO;
}
