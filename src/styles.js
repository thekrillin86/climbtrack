/**
 * ClimbTrack · hoja de estilos
 *
 * Los colores salen de tema.js como variables CSS, en dos juegos: claro y
 * oscuro. Por defecto se sigue al móvil; el botón de la cabecera lo fija a
 * mano (data-theme en <html>). Aquí no hay ni un color escrito a pelo.
 *
 * Los nombres de clase son los de siempre: las pantallas que no se han
 * rehecho cogen el aspecto nuevo sin tocar su código.
 *
 * Tipografía local (@fontsource, se importa en main.jsx): Barlow para leer y
 * Barlow Condensed para títulos y números. Nada se pide a Google al abrir la
 * app, y funciona sin cobertura.
 */
import { CLARO, OSCURO, varsCSS } from './tema.js';

const BASE = "--f-body:'Barlow',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;"
  + "--f-display:'Barlow Condensed','Arial Narrow',system-ui,sans-serif;"
  + '--r-card:20px;--ease:cubic-bezier(.2,.8,.2,1)';

// Flecha de los desplegables: gris medio, se lee en los dos temas.
const FLECHA = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z' fill='%237a8494'/%3E%3C/svg%3E\")";

export const CSS = `
:root{${varsCSS(CLARO)};${BASE};color-scheme:light}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${varsCSS(OSCURO)};color-scheme:dark}}
:root[data-theme="dark"]{${varsCSS(OSCURO)};color-scheme:dark}

*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{background:var(--bg);-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{background:var(--bg);color:var(--ink)}
button,input,select,textarea{font:inherit;color:inherit}
button{touch-action:manipulation}
:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.num{font-variant-numeric:tabular-nums}

/* ---------- la pared: fondo con la rejilla de tuercas ---------- */
.app{font-family:var(--f-body);font-size:15px;line-height:1.45;color:var(--ink);min-height:100dvh;display:flex;flex-direction:column;
  background-color:var(--bg);background-image:radial-gradient(circle at 11px 11px,var(--dot) 1.4px,transparent 1.7px);background-size:22px 22px}

/* ---------- cabecera ---------- */
.header{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:10px;
  background:color-mix(in srgb,var(--bg) 84%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  padding:max(10px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) 10px max(16px,env(safe-area-inset-left))}
.h-brand{display:flex;align-items:center;gap:8px;margin-right:auto;min-width:0}
.h-brand b{font-family:var(--f-display);font-weight:700;font-size:24px;letter-spacing:.2px;line-height:1}
.h-ver{font-size:12px;color:var(--ink2);background:var(--track);padding:3px 8px;border-radius:999px;font-weight:600}
.bkp-warn{display:inline-flex;align-items:center;gap:6px;min-height:36px;padding:0 12px;border-radius:999px;border:0;cursor:pointer;
  background:color-mix(in srgb,var(--badMark) 16%,var(--card));color:var(--bad);font-size:13px;font-weight:700}
.icon-btn{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex:none;border:0;cursor:pointer;
  background:var(--card);color:var(--ink);box-shadow:var(--shadow)}
.bandeja-aviso{display:flex;align-items:center;gap:10px;width:calc(100% - 32px);max-width:728px;margin:4px auto 0;padding:12px 14px;border-radius:16px;
  border:0;cursor:pointer;text-align:left;font-size:14px;font-weight:600;color:var(--ink);
  background:color-mix(in srgb,var(--brand) 14%,var(--card));box-shadow:var(--shadow)}
.bandeja-aviso svg{color:var(--brandInk);flex:none}

/* ---------- barra inferior ---------- */
.bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:50;display:grid;grid-template-columns:repeat(5,minmax(0,112px));justify-content:center;
  background:color-mix(in srgb,var(--bgElev) 90%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-top:1px solid var(--line);
  padding:6px max(8px,env(safe-area-inset-right)) calc(8px + env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left))}
.nav-tab{display:flex;flex-direction:column;align-items:center;gap:3px;background:none;border:0;color:var(--ink2);padding:4px 0;min-height:56px;cursor:pointer}
.nav-icon{width:60px;height:32px;border-radius:999px;display:grid;place-items:center;transition:background-color .25s var(--ease),color .25s var(--ease)}
.nav-label{font-size:12px;font-weight:600;letter-spacing:.2px}
.nav-tab.active{color:var(--ink)}
.nav-tab.active .nav-icon{background:color-mix(in srgb,var(--brand) 22%,var(--bgElev));color:var(--brandInk)}

/* ---------- página ---------- */
.content{flex:1;width:100%;max-width:760px;margin:0 auto;
  padding:6px max(16px,env(safe-area-inset-right)) calc(100px + env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}
.p-title{font-family:var(--f-display);font-weight:700;font-size:36px;line-height:1;letter-spacing:.2px;margin:8px 0 14px;text-wrap:balance}
.p-sub{color:var(--ink2);font-size:15px;margin:-8px 0 16px}
.p-tr{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
.p-tr .p-title{margin:8px 0 0}

/* ---------- tarjetas ---------- */
.card{position:relative;background:var(--card);border:1px solid var(--cardEdge);border-radius:var(--r-card);box-shadow:var(--shadow);padding:16px;margin-bottom:14px;min-width:0}
.c-sm{padding:12px}
.lc{padding:2px 14px}
.card-t{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--ink2);margin-bottom:10px}
.card-h{display:flex;align-items:center;gap:10px;margin-bottom:12px;min-width:0}
.card-h h3{font-family:var(--f-display);font-weight:700;font-size:22px;line-height:1.1;margin-right:auto;min-width:0;text-wrap:balance}
.badge{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:none;
  color:color-mix(in srgb,var(--c) 78%,var(--ink));background:color-mix(in srgb,var(--c) 15%,var(--card))}
.chip{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;line-height:1;padding:7px 11px;border-radius:999px;
  background:var(--track);color:var(--ink);white-space:nowrap;flex:none}
.dot{width:9px;height:9px;border-radius:50%;background:var(--c);flex:none}
.note{font-size:14px;color:var(--ink2);line-height:1.5}
.note b{color:var(--ink)}
.note+.note{margin-top:8px}
.foot{font-size:13px;color:var(--ink2);line-height:1.55;padding:2px 4px 0}
.vacio{font-size:14px;color:var(--ink2);line-height:1.5;padding:4px 0}
.grid2{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;margin-bottom:14px}
.grid2>.card{margin:0}
@media(min-width:640px){.grid2{grid-template-columns:repeat(2,minmax(0,1fr))}.span2{grid-column:span 2}}

/* avisos teñidos (ventana tendinosa, re-test pendiente) */
.tendon-banner{display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border-radius:18px;margin-bottom:14px;font-size:14px;line-height:1.45;color:var(--ink);
  background:color-mix(in srgb,var(--c,var(--warnMark)) 15%,var(--card));border:1px solid color-mix(in srgb,var(--c,var(--warnMark)) 30%,transparent)}
.tendon-banner.red{--c:var(--badMark)}.tendon-banner.amber{--c:var(--warnMark)}.tendon-banner.green{--c:var(--goodMark)}
.tendon-banner>svg{flex:none;margin-top:1px;color:color-mix(in srgb,var(--c) 70%,var(--ink))}

/* cifras */
.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:14px}
.stat-card{background:var(--card);border-radius:18px;box-shadow:var(--shadow);padding:14px 12px;text-align:center}
.stat-n{font-family:var(--f-display);font-size:32px;font-weight:700;color:var(--ink);line-height:1.05}
.stat-n.b,.stat-n.g,.stat-n.p{color:var(--ink)}
.stat-u{font-size:13px;color:var(--ink2);margin-left:2px}
.stat-l{font-size:12px;color:var(--ink2);text-transform:uppercase;letter-spacing:.6px;margin-top:4px;font-weight:600}
.tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.tile{background:var(--track);border-radius:16px;padding:12px 8px;text-align:center;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px}
.tile b{font-family:var(--f-display);font-size:30px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.tile span{font-size:13px;color:var(--ink);font-weight:600}
.tile small{font-size:12px;color:var(--ink2)}
.tile .badge{width:34px;height:34px;border-radius:10px}
.hero{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.hero b{font-family:var(--f-display);font-size:46px;font-weight:700;line-height:.95;font-variant-numeric:tabular-nums}
.hero span{font-size:15px;color:var(--ink2);font-weight:500}
.profile-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.pf{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:14px;background:var(--track);min-width:0}
.pf-l{font-size:12px;color:var(--ink2);text-transform:uppercase;letter-spacing:.5px;font-weight:700}
.pf-v{font-family:var(--f-display);font-size:22px;font-weight:700;line-height:1.1;color:var(--ink);overflow-wrap:anywhere}
.pf-v.a{color:var(--brandInk)}.pf-v.r{color:var(--ink)}
.pf-v.falta{color:var(--ink2);font-weight:600}
.row-2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}
.row-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.tq-l,.tq-r{display:inline-flex;align-items:center;gap:6px;color:var(--ink);font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}
.tq-l::before,.tq-r::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--izq)}
.tq-r::before{background:var(--dch)}

/* ---------- listas ---------- */
.list-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 2px;border-bottom:1px solid var(--lineSoft);cursor:pointer;min-height:58px;border-radius:4px}
.list-row:last-child,.ent-row:last-child,.lib-row:last-child{border-bottom:0}
.list-row:active,.ent-row:active,.lib-row:active{background:var(--wash2)}
.lr-l{display:flex;align-items:center;gap:12px;flex:1;min-width:0}
.lr-r{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0}
.lr-e{--c:var(--ink2);width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:none;font-size:20px;
  background:color-mix(in srgb,var(--c) 14%,var(--card));color:color-mix(in srgb,var(--c) 78%,var(--ink))}
.lr-m{font-size:15px;font-weight:600;overflow-wrap:anywhere}
.lr-s{font-size:13px;color:var(--ink2);display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.lr-d{font-size:13px;color:var(--ink2);font-variant-numeric:tabular-nums}
.lr-f{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
.ent-row{padding:12px 2px;border-bottom:1px solid var(--lineSoft);cursor:pointer;border-radius:4px}
.ent-h{display:flex;justify-content:space-between;align-items:center;gap:8px}
.ent-h>div:first-child{min-width:0}
.ent-h .lr-d{white-space:nowrap}
.ent-t{color:var(--brandInk);font-weight:700;margin-left:8px;font-size:15px}
.ent-st{display:flex;gap:8px;align-items:center}
.ent-mn{color:var(--ink);font-size:14px;font-weight:700;font-variant-numeric:tabular-nums}
.ent-cg{color:var(--carga);font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
.dup-btn{display:grid;place-items:center;width:40px;height:40px;margin:-6px -4px -6px 2px;border-radius:12px;border:0;background:none;color:var(--ink2);cursor:pointer}
.dup-btn:active{background:var(--wash2)}
.block-tag-sm{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;font-size:11px;font-weight:700;flex-shrink:0}
.block-tag-sm.gen{background:color-mix(in srgb,var(--info) 14%,var(--card));color:var(--info)}
.block-tag-sm.esp{background:color-mix(in srgb,var(--brand) 16%,var(--card));color:var(--brandInk)}
.lib-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 2px;border-bottom:1px solid var(--lineSoft);cursor:pointer;min-height:58px;border-radius:4px}
.lib-l{display:flex;align-items:center;gap:12px;min-width:0}
.lib-n{color:var(--brandInk);font-family:var(--f-display);font-weight:700;font-size:19px;min-width:40px}
.lib-v{font-size:15px;font-weight:600}
.gt{display:inline-block;background:color-mix(in srgb,var(--brand) 16%,var(--card));color:var(--brandInk);font-size:12px;font-weight:700;padding:2px 7px;border-radius:6px;margin-left:6px;vertical-align:1px}
.ed{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;flex-shrink:0}
.ed.y{background:color-mix(in srgb,var(--goodMark) 18%,var(--card));color:var(--good)}
.ed.n{background:var(--track);color:var(--ink2)}
.enc-st{display:flex;justify-content:center;gap:24px;padding:12px 0}
.enc-b{text-align:center}
.enc-n{font-family:var(--f-display);font-size:34px;font-weight:700;line-height:1.05}
.enc-n.g,.enc-n.r,.enc-n.a{color:var(--ink)}
.enc-lb{font-size:13px;color:var(--ink2);margin-top:4px}

/* ---------- pestañas y filtros ---------- */
.tabs{display:flex;gap:4px;margin-bottom:14px;overflow-x:auto;padding:4px;background:var(--track);border-radius:999px;width:max-content;max-width:100%;scrollbar-width:none}
.tb{background:none;border:0;color:var(--ink2);padding:0 16px;min-height:40px;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;transition:background-color .2s,color .2s}
.tb.ac{background:var(--card);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.14)}
.tabs.sm{margin-bottom:10px}
.tabs.sm .tb{min-height:34px;font-size:13px;padding:0 12px}
.pills{display:flex;gap:8px;margin-bottom:14px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:none}
.pill{background:var(--card);border:1px solid var(--line);color:var(--ink);padding:0 14px;min-height:38px;border-radius:999px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;flex:none}
.pill.active{background:var(--brand);color:var(--onBrand);border-color:var(--brand)}
.sh{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--ink2);
  margin:18px 0 10px;padding-top:14px;border-top:1px solid var(--line)}
.sh.a{color:var(--brandInk)}
.card>.sh:first-child{margin-top:0;padding-top:0;border-top:0}
.chip-sel{min-height:36px;padding:0 13px;border-radius:999px;font-size:14px;font-weight:600;cursor:pointer;border:1px solid var(--line);background:var(--card);color:var(--ink)}
.chip-sel.on{background:var(--brand);border-color:var(--brand);color:var(--onBrand)}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}

/* ---------- hojas que suben desde abajo ---------- */
.m-overlay{position:fixed;inset:0;background:var(--scrim);display:flex;align-items:flex-end;justify-content:center;z-index:1000}
.m-box{display:flex;flex-direction:column;background:var(--bgElev);border-radius:26px 26px 0 0;width:100%;max-width:640px;max-height:92dvh;
  padding:8px max(18px,env(safe-area-inset-right)) max(18px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));box-shadow:0 -12px 40px rgba(0,0,0,.25)}
.m-box::before{content:"";display:block;width:40px;height:4px;border-radius:2px;background:var(--lineStrong);margin:4px auto 10px;flex:none}
.m-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex:none}
.m-title{font-family:var(--f-display);font-size:25px;font-weight:700;line-height:1.1}
.m-close{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex:none;background:var(--track);border:0;color:var(--ink);cursor:pointer}
.m-body{overflow-y:auto;min-height:0;flex:1;overscroll-behavior:contain;margin:0 -4px;padding:0 4px 4px}
.more-menu{background:var(--bgElev);border-radius:26px 26px 0 0;width:100%;max-width:520px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;
  padding:10px max(16px,env(safe-area-inset-right)) calc(18px + env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left));box-shadow:0 -12px 40px rgba(0,0,0,.25)}
.more-handle{grid-column:1/-1;width:40px;height:4px;background:var(--lineStrong);border-radius:2px;margin:2px auto 8px}
.more-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:96px;padding:12px 6px;border-radius:18px;cursor:pointer;
  background:var(--card);border:1px solid var(--line);color:var(--ink);font-size:14px;font-weight:600}
.more-item .badge{width:46px;height:46px;border-radius:14px}
.more-item.on{border-color:var(--brand);box-shadow:inset 0 0 0 1px var(--brand)}
.more-item:active{background:var(--wash2)}
.fab{position:fixed;z-index:40;bottom:calc(84px + env(safe-area-inset-bottom));right:max(18px,env(safe-area-inset-right));width:60px;height:60px;border-radius:20px;border:0;cursor:pointer;
  display:grid;place-items:center;background:var(--brand);color:var(--onBrand);box-shadow:0 8px 22px color-mix(in srgb,var(--brand) 42%,transparent),0 2px 6px rgba(0,0,0,.16)}

/* ---------- formularios ---------- */
.f-wrap{margin-bottom:12px;min-width:0}
.f-label{display:block;font-size:12px;color:var(--ink2);text-transform:uppercase;letter-spacing:.5px;margin-bottom:5px;font-weight:700}
.f-input,.inp{width:100%;min-height:48px;background:var(--bg);border:1.5px solid var(--line);color:var(--ink);padding:10px 14px;border-radius:12px;font-size:16px;outline:none;
  -webkit-appearance:none;appearance:none;transition:border-color .15s,box-shadow .15s}
.f-input:focus,.inp:focus{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 22%,transparent)}
input[type=date].f-input,input[type=time].f-input{padding-left:10px;padding-right:8px}
select.f-input{background-image:${FLECHA};background-repeat:no-repeat;background-position:right 12px center;background-size:18px;padding-right:38px}
.cb-wrap{position:relative;margin-bottom:8px;flex:1;min-width:0}
.cb-drop{position:absolute;top:100%;left:0;right:0;z-index:100;margin-top:6px;max-height:232px;overflow-y:auto;background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow)}
.cb-item{padding:12px 14px;min-height:46px;color:var(--ink);font-size:15px;border-bottom:1px solid var(--lineSoft);cursor:pointer}
.cb-item:last-child{border-bottom:0}
.cb-item:active{background:var(--wash2)}
.btn-primary,.btn-secondary,.btn-del{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 22px;border-radius:14px;font-weight:700;font-size:16px;cursor:pointer;
  transition:transform .12s var(--ease),box-shadow .15s}
.btn-primary{background:var(--brand);color:var(--onBrand);border:0;box-shadow:0 4px 14px color-mix(in srgb,var(--brand) 32%,transparent)}
.btn-primary:active,.btn-secondary:active,.btn-del:active{transform:scale(.97)}
.btn-primary:disabled{opacity:.45;box-shadow:none}
.btn-secondary{background:var(--track);color:var(--ink);border:1px solid var(--line)}
.btn-full{width:100%;margin-top:10px}
.btn-lg{min-height:56px;font-size:17px}
.btn-sm{display:inline-flex;align-items:center;gap:6px;min-height:40px;padding:0 14px;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;
  background:var(--card);border:1px solid var(--line);color:var(--ink);box-shadow:var(--shadow)}
.btn-del{background:none;border:1.5px solid color-mix(in srgb,var(--bad) 45%,transparent);color:var(--bad);font-size:15px;margin-top:12px}
.del-inline{background:none;border:0;color:var(--bad);font-size:16px;cursor:pointer;padding:4px 6px;border-radius:6px;flex-shrink:0}
.muted{color:var(--ink2);font-size:14px}
.block-section{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:12px;margin:14px 0}
.block-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.block-tag{padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
.block-tag.gen{background:color-mix(in srgb,var(--info) 14%,var(--card));color:var(--info)}
.block-tag.esp{background:color-mix(in srgb,var(--brand) 16%,var(--card));color:var(--brandInk)}
.block-rm,.ej-rm{display:grid;place-items:center;flex:none;width:44px;height:44px;border-radius:12px;background:none;border:0;cursor:pointer}
.block-rm{color:var(--bad)}
.ej-rm{color:var(--ink2);height:48px}
.ej-row{display:flex;gap:4px;align-items:flex-start}
.ej-add,.add-block-btn{min-height:44px;background:none;border:1.5px dashed var(--lineStrong);color:var(--ink2);border-radius:12px;cursor:pointer;font-size:14px;font-weight:600}
.ej-add{width:100%;margin-top:4px}
.add-block-row{display:flex;gap:8px;margin-top:12px}
.add-block-btn{flex:1}
.fit-row{display:flex;align-items:center;gap:16px;margin-bottom:12px}
.fit-ring{width:72px;height:72px;border-radius:50%;border:4px solid;display:flex;align-items:center;justify-content:center}
.ban-metrics{display:flex;gap:8px;justify-content:space-around;padding:8px 0;border-top:1px solid var(--line)}
.ban-m{display:flex;flex-direction:column;align-items:center;gap:2px}
.ban-ml{font-size:12px;color:var(--ink2);text-transform:uppercase;letter-spacing:.5px;font-weight:600;display:flex;align-items:center;gap:3px}
.ban-mv{font-size:18px;font-weight:700}
.rpe-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.rpe-num{color:var(--brandInk);font-weight:700;font-size:14px;min-width:28px}
.rpe-dots{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:4px;flex:1}
.rpe-dot{aspect-ratio:1;min-height:28px;border-radius:50%;border:1px solid var(--lineStrong);background:var(--bg);color:var(--ink2);font-size:13px;font-weight:700;cursor:pointer;display:grid;place-items:center;padding:0;transition:transform .15s var(--ease)}
.rpe-dot.active{background:var(--brand);color:var(--onBrand);border-color:var(--brand);transform:scale(1.1)}
.rpe-badge{color:var(--ink2);font-weight:600;margin-left:4px}
.force-loss-badge{text-align:center;font-size:15px;font-weight:700;padding:10px;border-radius:12px;background:var(--track);margin-top:8px}
.info-btn{background:none;border:0;color:var(--ink2);cursor:pointer;padding:2px;display:inline-grid;place-items:center;vertical-align:middle}
.info-modal{background:var(--bgElev);border-radius:20px;padding:22px;margin:auto;max-width:360px;width:90%;box-shadow:var(--shadow)}
.info-t{font-family:var(--f-display);font-size:23px;font-weight:700;color:var(--ink);margin-bottom:10px}
.info-d{font-size:15px;color:var(--ink);line-height:1.55;margin-bottom:16px}
.init-page{display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:24px}
.loading{display:flex;align-items:center;justify-content:center;min-height:100dvh;flex-direction:column;gap:14px;color:var(--ink2)}
.mvc-box{background:var(--track);border-radius:14px;padding:12px;margin-bottom:12px}
.mvc-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.mvc-row span:first-child{font-size:13px;color:var(--ink2);min-width:60px}
.mvc-input{flex:1;padding:8px 12px!important}
.mvc-unit{font-size:13px;color:var(--ink2)}
.mvc-age{font-size:12px;padding:2px 8px;border-radius:6px;background:var(--track);color:var(--good)}
.mvc-age.stale{color:var(--bad)}
.mvc-warn{display:flex;gap:8px;align-items:flex-start;font-size:14px;color:var(--ink2);line-height:1.45;margin-top:6px}
.mvc-warn svg{flex:none;color:var(--warn);margin-top:2px}
.sync-toggle{display:flex;align-items:center;gap:10px;font-size:14px;color:var(--ink2);margin-top:12px;cursor:pointer;min-height:44px}
.sync-toggle input{width:20px;height:20px;accent-color:var(--brand);flex:none}

/* ---------- gráficas ---------- */
.chart{position:relative;margin:2px -6px 0}
.chart .recharts-surface{overflow:visible}
.chart .recharts-text{font-family:var(--f-body)}
.leyenda{display:flex;gap:6px 16px;flex-wrap:wrap;font-size:13px;color:var(--ink2);margin-top:8px}
.leyenda span{display:inline-flex;align-items:center;gap:6px}
.sw{display:inline-block;width:10px;height:10px;border-radius:3px;background:var(--c);flex:none}
.sw.linea{width:16px;height:3px;border-radius:2px}
.sw.hueco{background:none;border:2px solid var(--c);border-radius:50%;width:11px;height:11px}
.tip{background:var(--bgElev);border:1px solid var(--line);border-radius:12px;padding:8px 11px;box-shadow:var(--shadow);font-size:13px;color:var(--ink);min-width:130px;pointer-events:none}
.tip-h{font-weight:700;margin-bottom:4px}
.tip-r{display:flex;align-items:center;gap:8px}
.tip-r span{flex:1;color:var(--ink2)}
.tip-r b{font-variant-numeric:tabular-nums}
.link-btn{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 12px;margin:4px 0 -6px -10px;border-radius:12px;border:0;background:none;cursor:pointer;font-weight:700;font-size:14px;color:var(--ink)}
.link-btn svg{color:var(--brandInk)}
.link-btn:active{background:var(--wash2)}
.tabla-wrap{overflow:auto;max-height:360px;margin:0 -4px}
.tabla{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}
.tabla th,.tabla td{padding:8px 6px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap}
.tabla th:first-child,.tabla td:first-child{text-align:left}
.tabla thead th{position:sticky;top:0;background:var(--card);font-size:12px;color:var(--ink2);font-weight:700;letter-spacing:.4px;text-transform:uppercase}
.tabla tbody th{font-weight:600}
.mini{margin-top:10px}
.mini+.mini{margin-top:16px;padding-top:12px;border-top:1px solid var(--line)}
.mini-h{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;margin-bottom:2px}
.mini-h small{font-weight:500;color:var(--ink2);font-size:13px}

/* barras clasificadas (hechas en HTML: se leen enteras en el móvil) */
.rk{list-style:none;display:flex;flex-direction:column;gap:12px}
.rk-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;column-gap:10px;row-gap:6px}
.rk-row.sin-ic{grid-template-columns:minmax(0,1fr) auto}
.rk-row .lr-e{grid-row:span 2;width:36px;height:36px;border-radius:11px}
.rk-name{font-size:14px;font-weight:600;min-width:0;overflow-wrap:anywhere}
.rk-val{font-family:var(--f-display);font-weight:700;font-size:19px;line-height:1;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.rk-val small{font-family:var(--f-body);font-size:12px;font-weight:600;color:var(--ink2);margin-left:3px}
.rk-track{grid-column:2/4;height:10px;background:var(--track);border-radius:4px;overflow:hidden}
.rk-row.sin-ic .rk-track{grid-column:1/3}
.rk-fill{display:block;height:100%;width:var(--v);background:var(--c);border-radius:0 4px 4px 0;transform-origin:left center}

/* ---------- panel de hoy ---------- */
.verdict{--c:var(--warnMark);background:color-mix(in srgb,var(--c) 17%,var(--card));overflow:hidden;display:flex;flex-direction:column;gap:10px}
.verdict .wm{position:absolute;right:-14px;top:-12px;color:var(--c);opacity:.3;pointer-events:none}
.verdict h3{font-family:var(--f-display);font-weight:700;font-size:31px;line-height:1.05;max-width:16ch;text-wrap:balance}
.verdict ul{padding-left:20px;color:var(--inkSoft);font-size:15px;display:flex;flex-direction:column;gap:3px}
.verdict .chip{background:var(--card);align-self:flex-start}
.estado-top{display:flex;align-items:center;gap:16px;margin-bottom:8px}
.ring{position:relative;width:128px;height:128px;flex:none}
.ring svg{width:100%;height:100%;display:block}
.ring .trk{stroke:color-mix(in srgb,var(--c) 20%,var(--card))}
.ring .arc{stroke:var(--c)}
.ring-num{position:absolute;inset:0;display:grid;place-items:center;align-content:center;text-align:center}
.ring-num b{font-family:var(--f-display);font-weight:700;font-size:52px;line-height:.9;font-variant-numeric:tabular-nums}
.ring-num>span{font-size:12px;color:var(--ink2);font-weight:700;letter-spacing:.6px;text-transform:uppercase}
.estado-side{display:flex;flex-direction:column;gap:8px;min-width:0}
.estado-side .chip{align-self:flex-start;background:color-mix(in srgb,var(--c) 18%,var(--card))}
.comp{list-style:none;display:flex;flex-direction:column;gap:2px;margin:4px 0 6px}
.bar-row{width:100%;display:grid;grid-template-columns:30px minmax(0,1fr) auto 22px;align-items:center;column-gap:10px;row-gap:7px;
  padding:9px 6px;border-radius:14px;border:0;background:none;cursor:pointer;text-align:left;color:var(--ink);transition:background-color .2s var(--ease)}
.bar-row:active{background:var(--track)}
.bar-row>svg:first-child{color:color-mix(in srgb,var(--c) 78%,var(--ink))}
.bar-name{font-weight:700;font-size:16px}
.bar-name small{font-weight:500;font-size:14px;color:var(--ink2);margin-left:6px}
.bar-val{font-family:var(--f-display);font-weight:700;font-size:24px;line-height:1;font-variant-numeric:tabular-nums}
.caret{color:var(--ink2);transition:transform .3s var(--ease)}
.bar-row[aria-expanded="true"] .caret{transform:rotate(180deg)}
.bar-track{grid-column:2/4;height:12px;background:var(--track);border-radius:4px;overflow:hidden}
.bar-fill{display:block;height:100%;width:calc(var(--v) * 1%);background:var(--c);border-radius:0 4px 4px 0;transform-origin:left center}
.exp-wrap{display:grid;grid-template-rows:0fr;transition:grid-template-rows .32s var(--ease)}
.exp-wrap.open{grid-template-rows:1fr}
.exp{overflow:hidden;min-height:0}
.exp p{padding:2px 8px 12px 46px;font-size:14px;color:var(--ink2);line-height:1.5}
.v-msg{font-size:18px;font-weight:700;line-height:1.35;margin-bottom:12px}
.strip{position:relative;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
.strip::before{content:"";position:absolute;left:0;right:0;top:96px;height:1px;background:var(--line)}
.d-day{display:grid;grid-template-rows:96px auto;justify-items:center;border-radius:12px;padding:0 0 6px;border:0;background:none;cursor:pointer;color:var(--ink);transition:background-color .2s var(--ease)}
.d-col{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:96px;gap:4px;width:100%}
.d-bar{width:22px;max-width:70%;height:var(--h);background:var(--k,var(--dedos));border-radius:4px 4px 0 0;transform-origin:bottom center}
.d-day[data-kind="nocuenta"] .d-bar{--k:var(--nocount)}
.d-day[data-kind="cero"] .d-bar{display:none}
.vlab{font-family:var(--f-display);font-weight:700;font-size:16px;line-height:1;font-variant-numeric:tabular-nums}
.dlab{display:flex;flex-direction:column;align-items:center;line-height:1.15;padding-top:7px;font-size:12px;color:var(--ink2);font-variant-numeric:tabular-nums}
.dlab b{font-size:15px;color:var(--ink);font-weight:700}
.dlab em{font-style:normal;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:var(--brandInk)}
.d-day[aria-pressed="true"]{background:var(--track)}
.d-day[aria-pressed="true"] .d-bar{box-shadow:0 0 0 2px var(--card),0 0 0 4px var(--ink)}
.callout{min-height:48px;display:flex;align-items:center;padding:10px 14px;border-radius:14px;font-size:15px;font-weight:500;background:var(--track);color:var(--ink);margin:12px 0 10px}
.meter{position:relative;height:28px;margin-top:10px}
.mt-track{position:absolute;left:0;right:0;top:11px;height:6px;border-radius:999px;background:var(--track)}
.mt-mid{position:absolute;left:50%;top:3px;width:2px;height:22px;margin-left:-1px;background:var(--ink2);border-radius:2px}
.mt-seg{position:absolute;top:11px;height:6px;background:color-mix(in srgb,var(--fuerza) 45%,var(--card))}
.mt-dot{position:absolute;top:4px;width:20px;height:20px;margin-left:-10px;border-radius:50%;background:var(--fuerza);box-shadow:0 0 0 3px var(--card)}
.mt-scale{display:flex;justify-content:space-between;font-size:13px;color:var(--ink2);font-variant-numeric:tabular-nums;margin:-2px 0 10px}

/* ---------- movimiento: solo si el móvil no pide reducirlo ---------- */
@media (prefers-reduced-motion:no-preference){
  .page{animation:fi .3s ease backwards}
  .page .card,.page .tendon-banner{animation:rise .5s var(--ease) backwards;animation-delay:calc(var(--i,0) * 60ms)}
  .rk-fill,.bar-fill{animation:grow .8s var(--ease) backwards;animation-delay:calc(var(--n,0) * 70ms + 220ms)}
  .d-bar{animation:up .7s var(--ease) backwards;animation-delay:calc(var(--n,0) * 50ms + 320ms)}
  .ring .arc{animation:draw 1.1s var(--ease) .2s backwards}
  .verdict .wm{animation:flota 2.8s ease-in-out .4s 1}
  .mt-dot{animation:slide .9s var(--ease) .5s backwards}
}
@keyframes draw{from{stroke-dashoffset:339.29}}
@keyframes slide{from{left:50%}}
@keyframes fi{from{opacity:0}}
@keyframes rise{from{opacity:0;transform:translateY(12px)}}
@keyframes grow{from{transform:scaleX(0)}}
@keyframes up{from{transform:scaleY(0)}}
@keyframes flota{50%{transform:translateY(-7px) rotate(-7deg)}}

@media(min-width:600px){.stat-grid{grid-template-columns:repeat(4,1fr)}.m-overlay{align-items:center}.m-box{border-radius:26px;max-height:86vh}.m-box::before{display:none}
  .more-menu{border-radius:26px;max-width:420px;margin-bottom:100px}}
`;
