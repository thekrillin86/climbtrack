export const CSS=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.app{font-family:'DM Sans',sans-serif;background:#141210;color:#E8D5B5;min-height:100dvh;display:flex;flex-direction:column}
.header{position:sticky;top:0;z-index:50;background:#1A1612ee;backdrop-filter:blur(12px);border-bottom:1px solid #2A2420;padding:12px 16px;display:flex;align-items:center;justify-content:space-between}
.h-brand{display:flex;align-items:center;gap:10px}.h-ver{font-size:10px;color:#E8A838;background:#E8A83822;padding:2px 6px;border-radius:4px;font-weight:600;margin-left:4px}
.bkp-warn{background:#D4563A22;border:1px solid #D4563A55;color:#D4563A;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:50;background:#1A1612ee;backdrop-filter:blur(12px);border-top:1px solid #2A2420;display:flex;padding:6px 0 max(6px,env(safe-area-inset-bottom))}
.nav-tab{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;background:none;border:none;color:#6B5F52;padding:8px 4px;cursor:pointer;font-family:inherit}.nav-tab.active{color:#E8A838}.nav-icon{font-size:20px;line-height:1}.nav-label{font-size:10px;font-weight:500}
.content{flex:1;padding:16px 16px 80px;max-width:768px;margin:0 auto;width:100%}
.page{animation:fi .2s ease}@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.p-title{font-size:20px;font-weight:700;margin-bottom:16px}.p-tr{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.card{background:#1E1A15;border:1px solid #2A2420;border-radius:14px;padding:16px;margin-bottom:12px}.c-sm{padding:12px}.card-t{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:#8B7D6B;margin-bottom:10px}.lc{padding:4px 12px}
.tendon-banner{display:flex;gap:10px;align-items:flex-start;padding:12px 14px;border-radius:12px;margin-bottom:12px;font-size:13px}
.tendon-banner.red{background:#9B3A3A22;border:1px solid #D4563A66;color:#E8A89A}
.tendon-banner.amber{background:#E8A83818;border:1px solid #E8A83855;color:#E8C89A}
.tendon-banner.green{background:#6B9F4A18;border:1px solid #6B9F4A44;color:#A8C89A}
.stat-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px}.stat-card{background:#1E1A15;border:1px solid #2A2420;border-radius:14px;padding:14px 12px;text-align:center}.stat-n{font-size:28px;font-weight:700;color:#E8A838;line-height:1.1}.stat-n.b{color:#3A8FB7}.stat-n.g{color:#6B9F4A}.stat-n.p{color:#9B6BB7}.stat-u{font-size:12px;color:#8B7D6B}.stat-l{font-size:10px;color:#8B7D6B;text-transform:uppercase;letter-spacing:.8px;margin-top:4px}
.profile-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.pf{display:flex;flex-direction:column;gap:2px}.pf-l{font-size:10px;color:#6B5F52;text-transform:uppercase;letter-spacing:.5px}.pf-v{font-size:14px;font-weight:600}.pf-v.a{color:#E8A838}.pf-v.r{color:#D4563A}
.row-2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
.tq-l{color:#E8A838;font-size:13px}.tq-r{color:#3A8FB7;font-size:13px}
.list-row{display:flex;justify-content:space-between;align-items:center;padding:12px 4px;border-bottom:1px solid #221E19;cursor:pointer;min-height:48px}.list-row:active{background:#2A242088}
.lr-l{display:flex;align-items:center;gap:10px;flex:1;min-width:0}.lr-r{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0}.lr-e{font-size:18px;flex-shrink:0}.lr-m{font-size:14px;font-weight:500}.lr-s{font-size:11px;color:#6B5F52}.lr-d{font-size:11px;color:#6B5F52}.lr-f{font-size:12px;font-weight:600}
.ent-row{padding:12px 4px;border-bottom:1px solid #221E19;cursor:pointer}.ent-row:active{background:#2A242088}.ent-h{display:flex;justify-content:space-between;align-items:center}.ent-t{color:#E8A838;font-weight:600;margin-left:10px;font-size:14px}.ent-st{display:flex;gap:8px;align-items:center}.ent-mn{color:#3A8FB7;font-size:13px;font-weight:500}.ent-cg{color:#D4563A;font-size:13px;font-weight:500}
.block-tag-sm{width:18px;height:18px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;flex-shrink:0}.block-tag-sm.gen{background:#3A8FB722;color:#3A8FB7}.block-tag-sm.esp{background:#E8A83822;color:#E8A838}
.lib-row{display:flex;justify-content:space-between;align-items:center;padding:10px 4px;border-bottom:1px solid #221E19;cursor:pointer}.lib-l{display:flex;align-items:center;gap:10px}.lib-n{color:#E8A838;font-weight:700;font-size:13px;min-width:32px}.lib-v{font-size:14px;font-weight:500}
.gt{display:inline-block;background:#E8A83822;color:#E8A838;font-size:11px;font-weight:700;padding:1px 6px;border-radius:4px;margin-left:4px}
.ed{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}.ed.y{background:#6B9F4A33;color:#6B9F4A}.ed.n{background:#D4563A33;color:#D4563A}
.enc-st{display:flex;justify-content:center;gap:24px;padding:16px 0}.enc-b{text-align:center}.enc-n{font-size:32px;font-weight:700;line-height:1.1}.enc-n.g{color:#6B9F4A}.enc-n.r{color:#D4563A}.enc-n.a{color:#E8A838}.enc-lb{font-size:11px;color:#8B7D6B;margin-top:4px}
.tabs{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px}.tb{background:#1E1A15;border:1px solid #2A2420;color:#8B7D6B;padding:8px 16px;border-radius:20px;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit}.tb.ac{background:#E8A838;color:#141210;border-color:#E8A838}
.pills{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:4px}.pill{background:#1E1A15;border:1px solid #2A2420;color:#8B7D6B;padding:6px 12px;border-radius:16px;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;font-family:inherit}.pill.active{background:#E8A838;color:#141210;border-color:#E8A838}
.sh{font-size:13px;font-weight:600;margin:16px 0 8px;padding-top:12px;border-top:1px solid #2A2420}.sh.a{color:#E8A838}
.m-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;justify-content:center;z-index:1000}
.m-box{background:#1A1612;border:1px solid #2A2420;border-radius:20px 20px 0 0;padding:20px 20px max(20px,env(safe-area-inset-bottom));width:100%;max-width:600px;max-height:92dvh;animation:su .25s ease}
.m-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}.m-title{font-size:17px;font-weight:700}.m-close{background:none;border:none;color:#6B5F52;font-size:22px;cursor:pointer;padding:4px 8px}
.m-body{max-height:calc(92dvh - 80px);overflow-y:auto}
.more-menu{background:#1E1A15;border:1px solid #2A2420;border-radius:20px 20px 0 0;padding:12px 16px max(20px,env(safe-area-inset-bottom));width:100%;max-width:500px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;animation:su .2s ease}
.more-handle{grid-column:1/-1;width:36px;height:4px;background:#3A3228;border-radius:2px;margin:0 auto 8px}
@keyframes su{from{transform:translateY(100%)}to{transform:none}}
.more-item{display:flex;flex-direction:column;align-items:center;gap:6px;background:#141210;border:1px solid #2A2420;border-radius:14px;padding:16px 8px;cursor:pointer;color:#E8D5B5;font-size:12px;font-weight:500;font-family:inherit}.more-item:active{background:#2A2420}
.fab{position:fixed;bottom:76px;right:20px;width:56px;height:56px;border-radius:50%;background:#E8A838;color:#141210;border:none;font-size:24px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px #E8A83855;z-index:40;display:flex;align-items:center;justify-content:center}.fab:active{transform:scale(.9)}
.f-wrap{margin-bottom:12px}.f-label{display:block;font-size:11px;color:#6B5F52;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;font-weight:500}
.f-input{width:100%;background:#141210;border:1px solid #2A2420;color:#E8D5B5;padding:12px 14px;border-radius:10px;font-size:15px;outline:none;font-family:inherit;-webkit-appearance:none;appearance:none}.f-input:focus{border-color:#E8A83888}
.cb-wrap{position:relative;margin-bottom:6px}.cb-drop{position:absolute;top:100%;left:0;right:0;background:#1E1A15;border:1px solid #2A2420;border-radius:10px;max-height:180px;overflow-y:auto;z-index:100;margin-top:4px}.cb-item{padding:12px 14px;color:#E8D5B5;font-size:14px;border-bottom:1px solid #221E19;cursor:pointer}.cb-item:active{background:#2A2420}
.btn-primary{background:#E8A838;color:#141210;border:none;padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;font-family:inherit}.btn-primary:active{transform:scale(.97)}.btn-primary:disabled{opacity:.4}
.btn-secondary{background:#2A2420;color:#E8D5B5;border:1px solid #3A3228;padding:14px 24px;border-radius:12px;font-weight:600;font-size:15px;cursor:pointer;font-family:inherit}
.btn-full{width:100%;margin-top:8px}.btn-lg{padding:16px 28px;font-size:16px}
.btn-sm{background:#2A2420;border:1px solid #3A3228;color:#E8D5B5;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;font-family:inherit}
.btn-del{background:none;border:1px solid #D4563A55;color:#D4563A;padding:12px 24px;border-radius:12px;font-weight:600;font-size:14px;cursor:pointer;font-family:inherit;margin-top:12px}.btn-del:active{background:#D4563A22}
.del-inline{background:none;border:none;color:#D4563A88;font-size:16px;cursor:pointer;padding:4px 6px;border-radius:6px;flex-shrink:0}.del-inline:active{color:#D4563A;background:#D4563A22}
.muted{color:#6B5F52;font-size:13px}
.block-section{background:#14121099;border:1px solid #2A2420;border-radius:12px;padding:12px;margin:12px 0}
.block-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.block-tag{padding:4px 12px;border-radius:8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}.block-tag.gen{background:#3A8FB722;color:#3A8FB7;border:1px solid #3A8FB744}.block-tag.esp{background:#E8A83822;color:#E8A838;border:1px solid #E8A83844}
.block-rm{background:none;border:none;color:#D4563A;font-size:16px;cursor:pointer;padding:4px 8px}
.ej-row{display:flex;gap:8px;align-items:flex-start}.ej-rm{background:none;border:none;color:#6B5F52;font-size:14px;cursor:pointer;padding:8px 4px}
.ej-add{background:none;border:1px dashed #3A3228;color:#8B7D6B;padding:8px;border-radius:8px;width:100%;cursor:pointer;font-size:12px;font-family:inherit;margin-top:4px}
.add-block-row{display:flex;gap:8px;margin-top:12px}.add-block-btn{flex:1;background:none;border:1px dashed #3A3228;color:#8B7D6B;padding:10px;border-radius:10px;cursor:pointer;font-size:12px;font-family:inherit}
.fit-row{display:flex;align-items:center;gap:16px;margin-bottom:12px}
.fit-ring{width:72px;height:72px;border-radius:50%;border:4px solid;display:flex;align-items:center;justify-content:center}
.ban-metrics{display:flex;gap:8px;justify-content:space-around;padding:8px 0;border-top:1px solid #2A2420}
.ban-m{display:flex;flex-direction:column;align-items:center;gap:2px}.ban-ml{font-size:9px;color:#6B5F52;text-transform:uppercase;letter-spacing:.5px;font-weight:600;display:flex;align-items:center;gap:3px}.ban-mv{font-size:18px;font-weight:700}
.rpe-row{display:flex;align-items:center;gap:8px;margin-bottom:8px}.rpe-num{color:#E8A838;font-weight:700;font-size:13px;min-width:24px}
.rpe-dots{display:flex;gap:3px;flex:1;flex-wrap:wrap}
.rpe-dot{width:26px;height:26px;border-radius:50%;border:1px solid #3A3228;background:#141210;color:#8B7D6B;font-size:10px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;font-family:inherit;padding:0}
.rpe-dot.active{background:#E8A838;color:#141210;border-color:#E8A838}
.rpe-badge{color:#D4563A;font-weight:600;margin-left:4px}
.force-loss-badge{text-align:center;font-size:13px;font-weight:700;padding:8px;border-radius:8px;background:#1E1A15;margin-top:8px}
.info-btn{background:none;border:none;color:#6B5F52;font-size:12px;cursor:pointer;padding:0 2px;font-family:inherit}
.info-modal{background:#1E1A15;border:1px solid #2A2420;border-radius:16px;padding:24px;margin:auto;max-width:340px;width:90%}
.info-t{font-size:16px;font-weight:700;color:#E8A838;margin-bottom:12px}.info-d{font-size:13px;color:#E8D5B5;line-height:1.6;margin-bottom:16px}
.init-page{display:flex;align-items:center;justify-content:center;min-height:100dvh;padding:24px}
.loading{display:flex;align-items:center;justify-content:center;min-height:100dvh;flex-direction:column;gap:16px}
.mvc-box{background:#14121099;border:1px solid #2A2420;border-radius:12px;padding:12px;margin-bottom:12px}
.mvc-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}.mvc-row span:first-child{font-size:12px;color:#8B7D6B;min-width:60px}
.mvc-input{flex:1;padding:8px 12px!important}.mvc-unit{font-size:12px;color:#6B5F52}
.mvc-age{font-size:11px;padding:2px 8px;border-radius:6px;background:#6B9F4A22;color:#6B9F4A}.mvc-age.stale{background:#D4563A22;color:#D4563A}
.mvc-warn{font-size:12px;color:#D4563A;margin-top:6px}
.target-box{display:flex;gap:10px;margin-bottom:12px}
.target-item{flex:1;background:#E8A83812;border:1px solid #E8A83844;border-radius:10px;padding:10px;text-align:center}
.target-l{display:block;font-size:10px;color:#8B7D6B;text-transform:uppercase}.target-v{font-size:18px;font-weight:700;color:#E8A838}
.series-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.series-cell{background:#141210;border:1px solid #3A3228;border-radius:10px;padding:12px 4px;text-align:center;cursor:pointer;font-size:16px;color:#6B5F52;position:relative}
.series-cell.done{background:#6B9F4A22;border-color:#6B9F4A;color:#6B9F4A}
.series-num{display:block;font-size:9px;color:#8B7D6B;margin-bottom:2px}
.peaks-row{display:flex;gap:6px;flex-wrap:wrap}
.peak-input{width:60px;background:#141210;border:1px solid #2A2420;color:#E8D5B5;padding:8px;border-radius:8px;font-size:13px;font-family:inherit;text-align:center}
.cfw-grid{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
.cfw-cell{display:flex;align-items:center;gap:2px;background:#14121099;border-radius:8px;padding:2px}
.cfw-n{font-size:10px;color:#6B5F52;min-width:18px;text-align:center}
.cfw-result{display:flex;gap:10px;margin:12px 0;background:#E8A83812;border:1px solid #E8A83844;border-radius:10px;padding:12px}
.cfw-result>div{flex:1;text-align:center}.cfw-rl{display:block;font-size:10px;color:#8B7D6B;text-transform:uppercase}.cfw-rv{font-size:16px;font-weight:700;color:#E8A838}
@media(min-width:600px){.stat-grid{grid-template-columns:repeat(4,1fr)}.content{padding:20px 24px 80px}.m-overlay{align-items:center}.m-box{border-radius:20px;max-height:85vh}.more-menu{border-radius:20px;max-width:400px;margin-bottom:100px}.info-modal{margin:auto}}
`;
