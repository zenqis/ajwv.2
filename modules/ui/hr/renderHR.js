function _renderHR(sub){
  sub=sub||window._hrSub||'dash'; window._hrSub=sub;
  if(sub!=='sop') window._hrSopWideMode=false;
  var v=document.getElementById('V-hr'); if(!v) return;
  _hrEnsureStandardCss();
  /* Always restore mounted views first to avoid accidental node loss when switching HR subtabs */
  _restoreEmbeddedViews();
  if(!document.getElementById('HR-SHELL')){
    v.innerHTML='<div id="HR-SHELL"></div><div id="HR-CONTENT"></div>';
  }
  var shell=document.getElementById('HR-SHELL');
  var content=document.getElementById('HR-CONTENT');
  if(!shell||!content) return;
  shell.className='hr-standard-shell';
  content.className='hr-standard-content hr-sub-'+sub;
  shell.style.width='100%';
  content.style.width='100%';
  content.style.maxWidth='100%';
  content.style.margin='0 auto';
  var period=_hrPeriodState();
  var h='';
  h+='<div class="hr-tab-card"><div class="hr-tabbar">';
  [['dash','Desk HR'],['eval','Penilaian'],['payroll','Payroll'],['karyawan','Karyawan'],['statistik','Statistik'],['control','KPI & Control'],['sop','SOP & Guides'],['riw','Riwayat']].forEach(function(s){
    h+='<button class="'+(sub===s[0]?'is-active':'')+'" onclick="_renderHR(\''+s[0]+'\')">'+s[1]+'</button>';
  });
  h+='</div></div>';
  h+='<div class="hr-page-head"><div><div class="hr-title">HR</div><div class="hr-desc">Pusat kerja HR untuk penilaian, payroll, karyawan, statistik, KPI control, SOP, dan riwayat.</div></div></div>';
  if(['dash','statistik','riw'].indexOf(sub)>=0) h+=_hrPeriodToolbarHtml();
  shell.innerHTML=h;
  if(sub==='dash'){
    _renderHRDashOnly();
  } else if(sub==='eval'){
    _renderHREvalOnly(); return;
  } else if(sub==='payroll'){
    _renderHRPayrollOnly(); return;
  } else if(sub==='karyawan'){
    _renderHREmpOnly(); return;
  } else if(sub==='statistik'){
    _mountViewIn('stats','HR-CONTENT',renderStats); return;
  } else if(sub==='control'){
    _hrRenderControlOnly(); return;
  } else if(sub==='sop'){
    _renderHRSopOnly(); return;
  } else if(sub==='riw'){
    _renderHRHistOnly(); return;
  }
}

function _hrEnsureStandardCss(){
  if(document.getElementById('HR-STANDARD-CSS')) return;
  var st=document.createElement('style');
  st.id='HR-STANDARD-CSS';
  st.textContent='.hr-standard-shell,.hr-standard-content{display:flex;flex-direction:column;gap:10px}.hr-page-head{background:#fff;border:1px solid var(--bd);border-radius:10px;padding:14px 16px;display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:0}.hr-title{font-size:21px;line-height:1.15;margin:0;color:var(--tx);font-weight:850}.hr-desc{margin-top:5px;color:var(--tx2);font-size:12px;max-width:860px}.hr-head-pills{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.hr-tab-card,.hr-period-wrap{background:#fff;border:1px solid var(--bd);border-radius:10px;padding:10px 12px;margin-bottom:0}.hr-tabbar{display:flex;gap:8px;flex-wrap:wrap}.hr-tabbar button,.hr-period-wrap button{height:34px;border:1px solid var(--bd);border-radius:8px;background:#F8FAFC;color:var(--tx);font-size:12px;font-weight:800;padding:0 12px;cursor:pointer}.hr-tabbar button.is-active,.hr-tabbar button:hover,.hr-period-wrap button.is-active,.hr-period-wrap button:hover{background:#EAF2FF;border-color:#93C5FD;color:#1D4ED8}.hr-period-wrap{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.hr-period-wrap input{height:34px;border:1px solid var(--bd);border-radius:8px;background:#fff;color:var(--tx);font-size:12px;font-weight:700;padding:0 10px}.hr-standard-content .card{background:#fff!important;border:1px solid var(--bd)!important;border-radius:10px!important;box-shadow:0 1px 2px rgba(15,23,42,.04)!important;padding:12px!important;margin-bottom:10px!important}.hr-standard-content .fi{background:#fff!important;border:1px solid #CBD5E1!important;border-radius:8px!important;color:var(--tx)!important;font-size:12px!important;min-height:34px!important}.hr-standard-content .lbl{font-size:10px!important;font-weight:800!important;color:var(--tx2)!important;text-transform:uppercase!important;letter-spacing:.04em!important}.hr-standard-content .tbl{border-collapse:separate!important;border-spacing:0!important;width:100%;background:#fff;border:1px solid var(--bd);border-radius:9px;overflow:hidden}.hr-standard-content .tbl th{background:#F8FAFC!important;color:var(--tx2)!important;border-bottom:1px solid var(--bd)!important;font-size:11px!important;font-weight:850!important;padding:9px 10px!important}.hr-standard-content .tbl td{background:#fff!important;color:var(--tx)!important;border-bottom:1px solid var(--bd)!important;font-size:12px!important;padding:8px 10px!important}.hr-standard-content .tbl tr:last-child td{border-bottom:0!important}.hr-standard-content .chip{border:1px solid var(--bd);background:#F8FAFC;color:var(--tx);font-weight:800}.hr-standard-content .btnp,.hr-standard-content .btns,.hr-standard-content .btna,.hr-standard-content .btnsm{border-radius:8px!important;font-weight:800!important}.hr-standard-content .split.form-split{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(280px,360px)!important;gap:10px!important;align-items:start!important}.hr-standard-content .preview-panel{background:#fff!important;border:1px solid var(--bd)!important;border-radius:10px!important}.hr-standard-content .swrap{border:1px solid var(--bd)!important;border-radius:10px!important;overflow:hidden;margin-bottom:10px;background:#fff}.hr-standard-content .shdr{border-radius:0!important}.hr-standard-content .irow{border-bottom:1px solid var(--bd)!important}.hr-standard-content .pbar{background:#EEF2F7!important;border:1px solid var(--bd)!important;border-radius:999px!important;overflow:hidden}.hr-standard-content .form-stage{max-width:100%!important}@media(max-width:1180px){.hr-standard-content .split.form-split{grid-template-columns:1fr!important}.hr-standard-content .preview-panel{position:relative!important;top:auto!important;max-height:none!important}}@media(max-width:720px){.hr-page-head{flex-direction:column}.hr-period-wrap input{width:calc(50% - 4px)}.hr-tabbar button,.hr-period-wrap button{flex:1 1 auto}.hr-standard-content .g2,.hr-standard-content .g4{grid-template-columns:1fr!important}}';
  document.head.appendChild(st);
  var fin=document.createElement('style');
  fin.id='HR-FINLIKE-CSS';
  fin.textContent='.hr-standard-shell{gap:10px}.hr-tab-card{box-sizing:border-box!important;background:#fff!important;border:1px solid var(--bd)!important;border-radius:8px!important;padding:4px 8px!important;margin:-10px 0 0!important;min-height:40px!important;height:auto!important;box-shadow:none!important;display:flex!important;align-items:center!important;overflow:hidden!important}.hr-page-head{margin-top:0!important;padding:12px 16px!important}.hr-page-head .hr-title{font-size:20px!important}.hr-page-head .hr-desc{font-size:12px!important;margin-top:4px!important}.hr-tabbar{gap:4px!important;align-items:center!important;display:flex!important;flex-wrap:wrap!important}.hr-tabbar button{height:30px!important;min-height:30px!important;line-height:28px!important;border:1px solid transparent!important;background:#fff!important;color:#334155!important;border-radius:7px!important;padding:0 11px!important;box-shadow:none!important;font-size:13px!important;font-weight:700!important}.hr-tabbar button.is-active{background:#FFF7ED!important;border-color:#FED7AA!important;color:#C77818!important}.hr-tabbar button:hover{background:#F8FAFC!important;border-color:#E2E8F0!important;color:#111827!important}.hr-period-wrap{position:relative!important;background:transparent!important;border:0!important;border-radius:0!important;padding:0!important;margin:0 0 2px!important;display:flex!important}.hrfin-period-btn,.hrfin-period-action{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #cfd6df;border-radius:4px;min-height:36px;padding:7px 12px;color:#1f2937;font-size:13px;box-shadow:0 1px 2px rgba(15,23,42,.08);cursor:pointer}.hrfin-period-btn span{font-weight:700;color:#111827}.hrfin-period-btn b{font-weight:850;color:#111827}.hrfin-period-btn em{font-style:normal;color:#334155}.hrfin-period-btn .cal{font-size:12px;color:#111827}.hrfin-period-pop{position:absolute;top:42px;left:0;width:min(440px,calc(100vw - 36px));display:grid;grid-template-columns:170px 270px;background:#fff;border:1px solid #e5e7eb;box-shadow:0 10px 32px rgba(15,23,42,.16);border-radius:4px;overflow:hidden;color:#374151;z-index:80}.hrfin-period-left{border-right:1px solid #e5e7eb;padding:8px 0}.hrfin-period-left button{width:100%;border:0!important;background:#fff!important;text-align:left;padding:8px 16px!important;font-size:13px!important;color:#3f3f46!important;cursor:pointer;display:flex;justify-content:space-between;height:auto!important;border-radius:0!important;box-shadow:none!important}.hrfin-period-left button.act,.hrfin-period-left button:hover{color:#c77818!important;background:#f7f7f7!important}.hrfin-period-right{padding:12px;display:grid;grid-template-columns:1fr;gap:8px;align-items:start;align-self:start}.hrfin-period-right label{display:block;font-size:10px;font-weight:800;color:var(--tx2);text-transform:uppercase;margin-bottom:4px}.hrfin-period-right input{height:34px;border:1px solid #cfd6df;border-radius:4px;background:#fff;color:#1f2937;font-size:12px;font-weight:700;padding:0 10px;width:100%}.hrfin-period-action{font-weight:850!important;background:#c77818!important;border-color:#c77818!important;color:#fff!important;justify-content:center;width:100%}@media(max-width:720px){.hr-tab-card{margin:-10px 0 0!important;min-height:auto!important}.hrfin-period-pop{grid-template-columns:1fr;width:min(320px,calc(100vw - 28px))}.hrfin-period-left{border-right:0;border-bottom:1px solid #e5e7eb}.hrfin-period-right{grid-template-columns:1fr}.hrfin-period-btn{width:100%;justify-content:flex-start}}';
  document.head.appendChild(fin);
}

function _hrYmd(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function _hrAddDays(d,n){
  var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  x.setDate(x.getDate()+n);
  return x;
}

function _hrPeriodState(){
  var st=window._hrPeriod||{};
  if(!st.from||!st.to){
    var today=new Date(), from=_hrAddDays(today,-29);
    st={mode:'last30',label:'30 hari sebelumnya.',from:_hrYmd(from),to:_hrYmd(today)};
    window._hrPeriod=st;
  }
  return st;
}

function _hrPeriodToolbarHtml(){
  var st=_hrPeriodState();
  _hrEnsureFinPeriodCss();
  var h='<div class="fin-period-wrap"><button class="fin-period-btn" onclick="_hrTogglePeriodMenu()"><span>Periode Data</span><b>'+esc(st.label||'30 hari sebelumnya.')+'</b><em>'+esc((st.from&&st.to)?(st.from+' s/d '+st.to):'')+'</em><span class="cal">▦</span></button>';
  if(window._hrPeriodOpen) h+=_hrPeriodMenu();
  return h+'</div>';
}

function _hrTogglePeriodMenu(){
  window._hrPeriodOpen=!window._hrPeriodOpen;
  window._hrPeriodPanel=window._hrPeriodPanel||'month';
  _renderHR(window._hrSub||'dash');
}

function _hrPeriodMenu(){
  var st=window._hrPeriod||{}, base=_hrParseYmd(st.to)||new Date(), y=base.getFullYear(), m=base.getMonth()+1, panel=window._hrPeriodPanel||'month';
  var h='<div class="fin-period-pop"><div class="fin-period-left">';
  [['realtime','Real-time'],['yesterday','Kemarin'],['last7','7 hari sebelumnya.'],['last30','30 hari sebelumnya.']].forEach(function(x){ h+='<button class="'+(st.mode===x[0]?'act':'')+'" onclick="_hrApplyPeriodPreset(\''+x[0]+'\')">'+x[1]+'</button>'; });
  h+='<div class="fin-period-sep"></div>';
  [['day','Per Hari'],['week','Per Minggu'],['month','Per Bulan'],['year','Berdasarkan Tahun']].forEach(function(x){ h+='<button class="'+(panel===x[0]?'act':'')+'" onclick="_hrSetPeriodPanel(\''+x[0]+'\')">'+x[1]+' <span>›</span></button>'; });
  h+='</div><div class="fin-period-right"><div class="fin-period-head"><button onclick="_hrApplyPeriodYear('+(y-1)+')">«</button><strong>'+y+'</strong><button onclick="_hrApplyPeriodYear('+(y+1)+')">»</button></div>';
  if(panel==='year'){ h+='<div class="fin-period-years">'; for(var yy=y-5;yy<=y+6;yy++) h+='<button class="'+(yy===y?'act':'')+'" onclick="_hrApplyPeriodYear('+yy+')">'+yy+'</button>'; h+='</div>'; }
  else if(panel==='month'){ var names=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']; h+='<div class="fin-period-months">'+names.map(function(n,i){ return '<button class="'+((i+1)===m?'act':'')+'" onclick="_hrApplyPeriodMonth('+y+','+(i+1)+')">'+n+'</button>'; }).join('')+'</div>'; }
  else { var first=new Date(y,m-1,1), start=_hrAddDays(first,-((first.getDay()+6)%7)); h+='<div class="fin-period-days"><b>S</b><b>S</b><b>R</b><b>K</b><b>J</b><b>S</b><b>M</b>'; for(var i=0;i<42;i++){ var d=_hrAddDays(start,i), inMo=d.getMonth()===(m-1), cls=(_hrYmd(d)===_hrYmd(base)?'act ':'')+(inMo?'':'muted'); h+='<button class="'+cls+'" onclick="'+(panel==='week'?'_hrApplyPeriodWeek':'_hrApplyPeriodDay')+'(\''+_hrYmd(d)+'\')">'+d.getDate()+'</button>'; } h+='</div>'; }
  h+='</div></div>'; return h;
}

function _hrSetPeriodPanel(panel){ window._hrPeriodOpen=true; window._hrPeriodPanel=panel||'month'; _renderHR(window._hrSub||'dash'); }
function _hrParseYmd(v){ var m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/); if(!m) return null; var d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3])); return isNaN(d.getTime())?null:d; }
function _hrMonthEnd(y,m){ return new Date(y,m,0); }
function _hrApplyRange(label,from,to,mode){ window._hrPeriod={mode:mode||'custom',label:label,from:from,to:to}; window._hrPeriodOpen=false; _renderHR(window._hrSub||'dash'); }
function _hrApplyPeriodPreset(preset){ var base=_hrParseYmd((window._hrPeriod||{}).to)||new Date(), from=base, to=base, label='Real-time'; if(preset==='yesterday'){ from=to=_hrAddDays(base,-1); label='Kemarin'; } else if(preset==='last7'){ from=_hrAddDays(base,-6); label='7 hari sebelumnya.'; } else if(preset==='last30'){ from=_hrAddDays(base,-29); label='30 hari sebelumnya.'; } _hrApplyRange(label,_hrYmd(from),_hrYmd(to),preset); }
function _hrApplyPeriodDay(date){ var d=_hrParseYmd(date)||new Date(); _hrApplyRange('Per Hari '+_hrYmd(d),_hrYmd(d),_hrYmd(d),'day'); }
function _hrApplyPeriodWeek(date){ var d=_hrParseYmd(date)||new Date(), day=(d.getDay()+6)%7, from=_hrAddDays(d,-day), to=_hrAddDays(from,6); _hrApplyRange('Per Minggu '+_hrYmd(from)+' s/d '+_hrYmd(to),_hrYmd(from),_hrYmd(to),'week'); }
function _hrApplyPeriodMonth(y,m){ var from=new Date(Number(y),Number(m)-1,1), to=_hrMonthEnd(Number(y),Number(m)), names=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']; _hrApplyRange('Per Bulan '+names[Number(m)-1]+' '+y,_hrYmd(from),_hrYmd(to),'month'); }
function _hrApplyPeriodYear(y){ _hrApplyRange('Berdasarkan Tahun '+y,y+'-01-01',y+'-12-31','year'); }

function _hrEnsureFinPeriodCss(){
  if(document.getElementById('FIN-PERIOD-FILTER-CSS')) return;
  var st=document.createElement('style'); st.id='FIN-PERIOD-FILTER-CSS';
  st.textContent='.fin-period-wrap{position:relative;margin:0 0 10px;z-index:50;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.fin-period-btn,.fin-period-select,.fin-period-action{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #cfd6df;border-radius:4px;min-height:34px;padding:6px 10px;color:#1f2937;font-size:12px;box-shadow:0 1px 2px rgba(15,23,42,.08);cursor:pointer}.fin-period-select{min-width:150px;display:block}.fin-period-select.session{min-width:190px}.fin-period-action{font-weight:800}.fin-period-action.primary{background:#c77818;border-color:#c77818;color:#fff}.fin-period-action.danger{color:#b91c1c}.fin-period-btn b{font-weight:800;color:#111827}.fin-period-btn em{font-style:normal;color:#374151}.fin-period-btn .cal{margin-left:auto;color:#111}.fin-period-pop{position:absolute;top:40px;left:0;width:min(620px,calc(100vw - 36px));display:grid;grid-template-columns:178px 1fr;background:#fff;border:1px solid #e5e7eb;box-shadow:0 10px 32px rgba(15,23,42,.16);border-radius:4px;overflow:hidden;color:#374151;z-index:60}.fin-period-left{border-right:1px solid #e5e7eb;padding:10px 0}.fin-period-left button{width:100%;border:0;background:#fff;text-align:left;padding:8px 16px;font-size:13px;color:#3f3f46;cursor:pointer;display:flex;justify-content:space-between}.fin-period-left button.act,.fin-period-left button:hover{color:#ff3b30;background:#f7f7f7}.fin-period-sep{height:1px;background:#e5e7eb;margin:10px 16px}.fin-period-right{padding:0 0 16px}.fin-period-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #edf0f3;padding:10px 18px}.fin-period-head button{border:0;background:#fff;font-size:20px;color:#9ca3af;cursor:pointer}.fin-period-head strong{font-size:16px;color:#333}.fin-period-months,.fin-period-years{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 28px;padding:28px 36px}.fin-period-months button,.fin-period-years button,.fin-period-days button{border:0;background:#fff;color:#444;padding:7px;border-radius:4px;cursor:pointer}.fin-period-months button.act,.fin-period-years button.act,.fin-period-days button.act{color:#ff3b30;background:#f1f3f5}.fin-period-days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding:18px 18px 6px;text-align:center}.fin-period-days b{font-size:12px;color:#6b7280;font-weight:500;padding:4px}.fin-period-days button.muted{color:#c5c9cf}@media(max-width:720px){.fin-period-pop{grid-template-columns:1fr;width:calc(100vw - 28px)}.fin-period-left{border-right:0;border-bottom:1px solid #e5e7eb}.fin-period-months,.fin-period-years{gap:10px;padding:18px}.fin-period-select,.fin-period-action,.fin-period-btn{width:100%;justify-content:space-between}}';
  document.head.appendChild(st);
}

function _hrSetPeriod(mode){
  var today=new Date(), from=new Date(today.getFullYear(),today.getMonth(),today.getDate()), label='30 hari sebelumnya.';
  if(mode==='last7'){ from.setDate(from.getDate()-6); label='7 hari terakhir'; }
  else if(mode==='last30'){ from.setDate(from.getDate()-29); label='30 hari sebelumnya.'; }
  else if(mode==='month'){ from=new Date(today.getFullYear(),today.getMonth(),1); label='Bulan ini'; }
  else if(mode==='year'){ from=new Date(today.getFullYear(),0,1); label='Tahun ini'; }
  else { mode='last30'; from.setDate(from.getDate()-29); }
  window._hrPeriod={mode:mode,label:label,from:_hrYmd(from),to:_hrYmd(today)};
  window._hrPeriodOpen=false;
  _renderHR(window._hrSub||'dash');
}

function _hrApplyCustomPeriod(){
  var from=((document.getElementById('HR-PER-FROM')||{}).value||'').trim();
  var to=((document.getElementById('HR-PER-TO')||{}).value||'').trim();
  if(!from||!to){ if(typeof toast==='function') toast('Isi periode HR dulu','warn'); return; }
  if(from>to){ var tmp=from; from=to; to=tmp; }
  window._hrPeriod={mode:'custom',label:'Custom',from:from,to:to};
  window._hrPeriodOpen=false;
  _renderHR(window._hrSub||'dash');
}

function _hrPickDate(row){
  if(!row) return '';
  var info=row.info||{};
  return String(row.submittedAt||row.ts||row.createdAt||row.updatedAt||info.tglAkhir||info.tglMulai||info.tanggal||'').slice(0,10);
}

function _hrInPeriod(row,range){
  range=range||_hrPeriodState();
  var d=_hrPickDate(row);
  if(!d) return false;
  if(range.from&&d<range.from) return false;
  if(range.to&&d>range.to) return false;
  return true;
}
