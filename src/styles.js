import { OSCURO, varsCSS } from './tema.js';

export const CSS=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
:root{${varsCSS(OSCURO)}}
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.app{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--ink);min-height:100dvh;display:flex;flex-direction:column}
.header{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bgElev) 93.3%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
.h-brand{display:flex;align-items:center;gap:10px}.h-ver{font-size:10px;color:var(--brand);background:color-mix(in srgb,var(--brand) 13.3%,transparent);padding:2px 6px;border-radius:4px;font-weight:600;margin-left:4px}
.bkp-warn{background:color-mix(in srgb,var(--bad) 13.3%,transparent);border:1px solid color-mix(in srgb,var(--bad) 33.3%,transparent);color:var(--bad);padding:6px 10px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:50;background:color-mix(in srgb,var(--bgElev) 93.3%,transparent);backdrop-filter:blur(12px);border-top:1px solid var(--line);display:flex;padding:6px 0 max(6px,env(safe-area-inset-bottom))}
.nav-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;color:var(--ink3);padding:8px 4px;cursor:pointer;font-family:inherit}.nav-tab.active{color:var(--brand)}.nav-icon{font-size:20px;line-height:1}.nav-label{font-size:10px;font-weight:500}
.content{flex:1;padding:16px 16px 80px;max-width:768px;margin:0 auto;width:100%}
.page{animation:fi .2s ease}@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.p-title{font-size:20px;font-weight:700;margin-bottom:16px}.p-tr{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}.c-sm{padding:12px}.card-t{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--ink2);margin-bottom:10px}.lc{padding:4px 12px}
.tendon-banner{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:12px;margin-bottom:12px;font-size:13px}
.tendon-banner.red{background:color-mix(in srgb,var(--crit) 13.3%,transparent);border:1px solid color-mix(in srgb,var(--bad) 40%,transparent);color:var(--badSoft)}
.tendon-banner.amber{background:color-mix(in srgb,var(--warn) 9.4%,transparent);border:1px solid color-mix(in srgb,var(--warn) 33.3%,transparent);color:var(--warnSoft)}
.tendon-banner.green{background:color-mix(in srgb,var(--good) 9.4%,transparent);border:1px solid color-mix(in srgb,var(--good) 26.7%,transparent);color:var(--goodSoft)}
.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}.stat-card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:14px 12px;text-align:center}.stat-n{font-size:28px;font-weight:700;color:var(--brand);line-height:1.1}.stat-n.b{color:var(--info)}.stat-n.g{color:var(--good)}.stat-n.p{color:var(--peso)}.stat-u{font-size:12px;color:var(--ink2)}.stat-l{font-size:10px;color:var(--ink2);text-transform:uppercase;letter-spacing:.8px;margin-top:4px}
.profile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pf{display:flex;flex-direction:column;gap:2px}.pf-l{font-size:10px;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px}.pf-v{font-size:14px;font-weight:600}.pf-v.a{color:var(--brand)}.pf-v.r{color:var(--bad)}
.row-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.tq-l{color:var(--izq);font-size:13px}.tq-r{color:var(--dch);font-size:13px}
.list-row{display:flex;justify-content:space-between;align-items:center;padding:12px 4px;border-bottom:1px solid var(--lineSoft);cursor:pointer;min-height:48px}.list-row:active{background:color-mix(in srgb,var(--line) 53.3%,transparent)}
.lr-l{display:flex;align-items:center;gap:10px;flex:1;min-width:0}.lr-r{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0}.lr-e{font-size:18px;flex-shrink:0}.lr-m{font-size:14px;font-weight:500}.lr-s{font-size:11px;color:var(--ink3)}.lr-d{font-size:11px;color:var(--ink3)}.lr-f{font-size:12px;font-weight:600}
.ent-row{padding:12px 4px;border-bottom:1px solid var(--lineSoft);cursor:pointer}.ent-row:active{background:color-mix(in srgb,var(--line) 53.3%,transparent)}.ent-h{display:flex;justify-content:space-between;align-items:center}.ent-t{color:var(--brand);font-weight:600;margin-left:10px;font-size:14px}.ent-st{display:flex;gap:8px;align-items:center}.ent-mn{color:var(--info);font-size:13px;font-weight:500}.ent-cg{color:var(--bad);font-size:13px;font-weight:500}
.block-tag-sm{width:18px;height:18px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0}.block-tag-sm.gen{background:color-mix(in srgb,var(--info) 13.3%,transparent);color:var(--info)}.block-tag-sm.esp{background:color-mix(in srgb,var(--brand) 13.3%,transparent);color:var(--brand)}
.lib-row{display:flex;justify-content:space-between;align-items:center;padding:10px 4px;border-bottom:1px solid var(--lineSoft);cursor:pointer}.lib-l{display:flex;align-items:center;gap:10px}.lib-n{color:var(--brand);font-weight:700;font-size:13px;min-width:32px}.lib-v{font-size:14px;font-weight:500}
.gt{display:inline-block;background:color-mix(in srgb,var(--brand) 13.3%,transparent);color:var(--brand);font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px;margin-left:4px}
.ed{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}.ed.y{background:color-mix(in srgb,var(--good) 20%,transparent);color:var(--good)}.ed.n{background:color-mix(in srgb,var(--bad) 20%,transparent);color:var(--bad)}
.enc-st{display:flex;justify-content:center;gap:24px;padding:16px 0}.enc-b{text-align:center}.enc-n{font-size:32px;font-weight:700;line-height:1.1}.enc-n.g{color:var(--good)}.enc-n.r{color:var(--bad)}.enc-n.a{color:var(--brand)}.enc-lb{font-size:11px;color:var(--ink2);margin-top:4px}
.tabs{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px}.tb{background:var(--card);border:1px solid var(--line);color:var(--ink2);padding:8px 16px;border-radius:20px;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit}.tb.ac{background:var(--brand);color:var(--onBrand);border-color:var(--brand)}
.pills{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px}.pill{background:var(--card);border:1px solid var(--line);color:var(--ink2);padding:6px 12px;border-radius:16px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit}.pill.active{background:var(--brand);color:var(--onBrand);border-color:var(--brand)}
.sh{font-size:13px;font-weight:600;margin:16px 0 8px;padding-top:12px;border-top:1px solid var(--line)}.sh.a{color:var(--brand)}
.m-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;justify-content:center;z-index:1000}
.m-box{background:var(--bgElev);border:1px solid var(--line);border-radius:20px 20px 0 0;padding:20px 20px max(20px,env(safe-area-inset-bottom));width:100%;max-width:600px;max-height:92dvh;animation:su .25s ease}
.m-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.m-title{font-size:17px;font-weight:700}.m-close{background:none;border:none;color:var(--ink3);font-size:22px;cursor:pointer;padding:4px 8px}
.m-body{max-height:calc(92dvh - 80px);overflow-y:auto}
.more-menu{background:var(--card);border:1px solid var(--line);border-radius:20px 20px 0 0;padding:12px 16px max(20px,env(safe-area-inset-bottom));width:100%;max-width:500px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;animation:su .2s ease}
.more-handle{grid-column:1/-1;width:36px;height:4px;background:var(--lineStrong);border-radius:2px;margin:0 auto 8px}
@keyframes su{from{transform:translateY(100%)}to{transform:none}}
.more-item{display:flex;flex-direction:column;align-items:center;gap:6px;background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:16px 8px;cursor:pointer;color:var(--ink);font-size:12px;font-weight:500;font-family:inherit}.more-item:active{background:var(--line)}
.fab{position:fixed;bottom:76px;right:20px;width:56px;height:56px;border-radius:50%;background:var(--brand);color:var(--onBrand);border:none;font-size:24px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px color-mix(in srgb,var(--brand) 33.3%,transparent);z-index:40;display:flex;align-items:center;justify-content:center}.fab:active{transform:scale(.9)}
.f-wrap{margin-bottom:12px}.f-label{display:block;font-size:11px;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;font-weight:500}
.f-input{width:100%;background:var(--bg);border:1px solid var(--line);color:var(--ink);padding:12px 14px;border-radius:10px;font-size:15px;outline:none;font-family:inherit;-webkit-appearance:none;appearance:none}.f-input:focus{border-color:color-mix(in srgb,var(--brand) 53.3%,transparent)}
.cb-wrap{position:relative;margin-bottom:6px}.cb-drop{position:absolute;top:100%;left:0;right:0;background:var(--card);border:1px solid var(--line);border-radius:10px;max-height:180px;overflow-y:auto;z-index:100;margin-top:4px}.cb-item{padding:12px 14px;color:var(--ink);font-size:14px;border-bottom:1px solid var(--lineSoft);cursor:pointer}.cb-item:active{background:var(--line)}
.btn-primary{background:var(--brand);color:var(--onBrand);border:none;padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;font-family:inherit}.btn-primary:active{transform:scale(.97)}.btn-primary:disabled{opacity:.4}
.btn-secondary{background:var(--line);color:var(--ink);border:1px solid var(--lineStrong);padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;font-family:inherit}
.btn-full{width:100%;margin-top:8px}.btn-lg{padding:16px 28px;font-size:16px}
.btn-sm{background:var(--line);border:1px solid var(--lineStrong);color:var(--ink);padding:8px 14px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit}
.btn-del{background:none;border:1px solid color-mix(in srgb,var(--bad) 33.3%,transparent);color:var(--bad);padding:12px 24px;border-radius:12px;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;margin-top:12px}.btn-del:active{background:color-mix(in srgb,var(--bad) 13.3%,transparent)}
.del-inline{background:none;border:none;color:color-mix(in srgb,var(--bad) 53.3%,transparent);font-size:16px;cursor:pointer;padding:4px 6px;border-radius:6px;flex-shrink:0}.del-inline:active{color:var(--bad);background:color-mix(in srgb,var(--bad) 13.3%,transparent)}
.muted{color:var(--ink3);font-size:13px}
.block-section{background:color-mix(in srgb,var(--bg) 60%,transparent);border:1px solid var(--line);border-radius:12px;padding:12px;margin:12px 0}
.block-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.block-tag{padding:4px 12px;border-radius:8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}.block-tag.gen{background:color-mix(in srgb,var(--info) 13.3%,transparent);color:var(--info);border:1px solid color-mix(in srgb,var(--info) 26.7%,transparent)}.block-tag.esp{background:color-mix(in srgb,var(--brand) 13.3%,transparent);color:var(--brand);border:1px solid color-mix(in srgb,var(--brand) 26.7%,transparent)}
.block-rm{background:none;border:none;color:var(--bad);font-size:16px;cursor:pointer;padding:4px 8px}
.ej-row{display:flex;gap:8px;align-items:flex-start}.ej-rm{background:none;border:none;color:var(--ink3);font-size:14px;cursor:pointer;padding:8px 4px}
.ej-add{background:none;border:1px dashed var(--lineStrong);color:var(--ink2);padding:8px;border-radius:8px;width:100%;cursor:pointer;font-size:12px;font-family:inherit;margin-top:4px}
.add-block-row{display:flex;gap:8px;margin-top:12px}.add-block-btn{flex:1;background:none;border:1px dashed var(--lineStrong);color:var(--ink2);padding:10px;border-radius:10px;cursor:pointer;font-size:12px;font-family:inherit}
.fit-row{display:flex;align-items:center;gap:16px;margin-bottom:12px}
.fit-ring{width:72px;height:72px;border-radius:50%;border:4px solid;display:flex;align-items:center;justify-content:center}
.ban-metrics{display:flex;gap:8px;justify-content:space-around;padding:8px 0;border-top:1px solid var(--line)}
.ban-m{display:flex;flex-direction:column;align-items:center;gap:2px}.ban-ml{font-size:9px;color:var(--ink3);text-transform:uppercase;letter-spacing:.5px;font-weight:600;display:flex;align-items:center;gap:3px}.ban-mv{font-size:18px;font-weight:700}
.rpe-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}.rpe-num{color:var(--brand);font-weight:700;font-size:13px;min-width:24px}
.rpe-dots{display:flex;gap:3px;flex:1;flex-wrap:wrap}
.rpe-dot{width:26px;height:26px;border-radius:50%;border:1px solid var(--lineStrong);background:var(--bg);color:var(--ink2);font-size:10px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;padding:0}
.rpe-dot.active{background:var(--brand);color:var(--onBrand);border-color:var(--brand)}
.rpe-badge{color:var(--bad);font-weight:600;margin-left:4px}
.force-loss-badge{text-align:center;font-size:13px;font-weight:700;padding:8px;border-radius:8px;background:var(--card);margin-top:8px}
.info-btn{background:none;border:none;color:var(--ink3);font-size:12px;cursor:pointer;padding:0 2px;font-family:inherit}
.info-modal{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;margin:auto;max-width:340px;width:90%}
.info-t{font-size:16px;font-weight:700;color:var(--brand);margin-bottom:12px}.info-d{font-size:13px;color:var(--ink);line-height:1.6;margin-bottom:16px}
.init-page{display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:24px}
.loading{display:flex;align-items:center;justify-content:center;min-height:100dvh;flex-direction:column;gap:16px}
.mvc-box{background:color-mix(in srgb,var(--bg) 60%,transparent);border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:12px}
.mvc-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}.mvc-row span:first-child{font-size:12px;color:var(--ink2);min-width:60px}
.mvc-input{flex:1;padding:8px 12px!important}.mvc-unit{font-size:12px;color:var(--ink3)}
.mvc-age{font-size:11px;padding:2px 8px;border-radius:6px;background:color-mix(in srgb,var(--good) 13.3%,transparent);color:var(--good)}.mvc-age.stale{background:color-mix(in srgb,var(--bad) 13.3%,transparent);color:var(--bad)}
.mvc-warn{font-size:12px;color:var(--bad);margin-top:6px}
.target-box{display:flex;gap:10px;margin-bottom:12px}
.target-item{flex:1;background:color-mix(in srgb,var(--brand) 7.1%,transparent);border:1px solid color-mix(in srgb,var(--brand) 26.7%,transparent);border-radius:10px;padding:10px;text-align:center}
.target-l{display:block;font-size:10px;color:var(--ink2);text-transform:uppercase}.target-v{font-size:18px;font-weight:700;color:var(--brand)}
.series-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.series-cell{background:var(--bg);border:1px solid var(--lineStrong);border-radius:10px;padding:12px 4px;text-align:center;cursor:pointer;font-size:16px;color:var(--ink3);position:relative}
.series-cell.done{background:color-mix(in srgb,var(--good) 13.3%,transparent);border-color:var(--good);color:var(--good)}
.series-num{display:block;font-size:9px;color:var(--ink2);margin-bottom:2px}
.peaks-row{display:flex;gap:6px;flex-wrap:wrap}
.peak-input{width:60px;background:var(--bg);border:1px solid var(--line);color:var(--ink);padding:8px;border-radius:8px;font-size:13px;font-family:inherit;text-align:center}
.cfw-grid{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.cfw-cell{display:flex;align-items:center;gap:2px;background:color-mix(in srgb,var(--bg) 60%,transparent);border-radius:8px;padding:2px}
.cfw-n{font-size:10px;color:var(--ink3);min-width:18px;text-align:center}
.cfw-result{display:flex;gap:10px;margin:12px 0;background:color-mix(in srgb,var(--brand) 7.1%,transparent);border:1px solid color-mix(in srgb,var(--brand) 26.7%,transparent);border-radius:10px;padding:12px}
.cfw-result>div{flex:1;text-align:center}.cfw-rl{display:block;font-size:10px;color:var(--ink2);text-transform:uppercase}.cfw-rv{font-size:16px;font-weight:700;color:var(--brand)}
.sync-toggle{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--ink2);margin-top:10px;cursor:pointer}.sync-toggle input{width:18px;height:18px;accent-color:var(--brand)}
@media(min-width:600px){.stat-grid{grid-template-columns:repeat(4,1fr)}.content{padding:20px 24px 80px}.m-overlay{align-items:center}.m-box{border-radius:20px;max-height:85vh}.more-menu{border-radius:20px;max-width:400px;margin-bottom:100px}.info-modal{margin:auto}}
`;