function renderDash(){
  var cfg=getCfg();
  var root=document.getElementById('V-dash');
  if(!root) return;
  _dashEnsureCss();
  var finReady=typeof _finIncome!=='undefined'&&typeof _finExpense!=='undefined'&&typeof _finAssets!=='undefined';
  if(typeof loadKPI==='function') loadKPI();
  if(finReady&&typeof _syncPayrollExpenses==='function') _syncPayrollExpenses();

  function n(v){ return _num(v); }
  function pct(a,b){ return b>0?(a/b*100):0; }
  function ymd(v){ return String(v||'').slice(0,10); }
  function monthKey(v){ return String(v||'').slice(0,7); }
  function activeMonth(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
  function parseDate(v){ var s=String(v||''); var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/); if(!m) return null; var d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3])); return isNaN(d.getTime())?null:d; }
  function fmtYmd(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function addDays(d,n){ var x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate()+n); return x; }
  function pickDate(row){ return ymd(row&&((row.periodeSampai||row.tanggal||row.date||row.createdAt||row.updatedAt||row.completedAt||row.submittedAt||row.ts)||(row.created_at||row.updated_at))); }
  function inRangeDate(v,range){ var d=ymd(v); if(!d) return false; if(range.from&&d<range.from) return false; if(range.to&&d>range.to) return false; return true; }
  function inRangeRow(row,range){ return inRangeDate(pickDate(row),range); }
  function periodState(){ var st=window._dashPeriod||{}; if(!st.from||!st.to){ var base=new Date(), from=addDays(base,-29); st={mode:'last30',label:'30 hari sebelumnya.',from:fmtYmd(from),to:fmtYmd(base)}; window._dashPeriod=st; } return st; }
  function supplierName(row){ return String(row&&row.namaSupplier||'').trim()||'Tanpa nama supplier'; }
  function withinMonth(v,key){ return monthKey(v)===key; }
  function rowTouchesDate(row,date){
    var from=ymd(row&&row.periodeDari||row&&row.tanggal||row&&row.ts), to=ymd(row&&row.periodeSampai||row&&row.tanggal||row&&row.ts);
    if(!from&&!to) return false;
    if(!from) from=to;
    if(!to) to=from;
    return from<=date&&to>=date;
  }
  function latestRows(rows){
    var map={};
    (rows||[]).forEach(function(r){
      var key=[r.type||'',r.nama||'',r.kategori||''].join('|').toLowerCase();
      if(!map[key]||String(map[key].tanggal||'')<String(r.tanggal||'')) map[key]=r;
    });
    return Object.keys(map).map(function(k){ return map[k]; });
  }
  function health(){
    var audit=(typeof _sbSchemaAudit!=='undefined'&&_sbSchemaAudit)?_sbSchemaAudit:null;
    if(audit&&audit.checkedAt){
      if(audit.missingTables&&audit.missingTables.length) return {label:'Perlu Update Schema',detail:audit.missingTables.length+' tabel perlu update',tone:'#B45309'};
      return {label:'Supabase Siap',detail:'Dicek '+new Date(audit.checkedAt).toLocaleString('id-ID'),tone:'#15803D'};
    }
    var bridge=(typeof _toolsAgentBridgeStatus==='function')?_toolsAgentBridgeStatus():null;
    if(bridge&&bridge.ready) return {label:'Bridge Siap',detail:bridge.message||'Endpoint aktif',tone:'#15803D'};
    return {label:'Belum Dicek',detail:'Belum ada health check',tone:'#64748B'};
  }
  function pill(label,tone){ return '<span class="dashx-pill" style="color:'+tone+';border-color:'+tone+'33;background:'+tone+'10">'+label+'</span>'; }
  function metric(label,value,meta,tone){
    return '<div class="dashx-metric" style="border-top-color:'+tone+'"><div class="dashx-metric-k">'+label+'</div><div class="dashx-metric-v">'+value+'</div><div class="dashx-metric-m">'+meta+'</div></div>';
  }
  function block(title,meta,action,body){
    return '<section class="dashx-block"><div class="dashx-block-head"><div><h3>'+title+'</h3>'+(meta?'<p>'+meta+'</p>':'')+'</div>'+(action||'')+'</div>'+body+'</section>';
  }
  function barRow(label,value,pctVal,tone,meta){
    return '<div class="dashx-bar-row"><div class="dashx-bar-top"><b>'+label+'</b><span>'+value+'</span></div><div class="dashx-bar-track"><i style="width:'+Math.max(0,Math.min(100,pctVal))+'%;background:'+tone+'"></i></div>'+(meta?'<small>'+meta+'</small>':'')+'</div>';
  }
  function empty(text){ return '<div class="dashx-empty">'+text+'</div>'; }

  var dashRange=periodState();
  var thisMonth=activeMonth();
  var today=(typeof _todayYMD==='function'?_todayYMD():new Date().toISOString().slice(0,10));
  var monthlyRows=(finReady&&typeof _finBuildMonthlySummary==='function'?_finBuildMonthlySummary():[]);
  var currentMonth=monthlyRows.filter(function(r){ return r.key===thisMonth; })[0]||monthlyRows[monthlyRows.length-1]||{name:'-',penjualan:0,pengeluaran:0,laba:0,saldo:0,saldoTahunan:0,cash:0,totalAsset:0,hutangSupplier:0,rowCount:0,progressPenjualan:0};
  var currentSaldo=n(currentMonth.saldo||currentMonth.saldoTahunan||0);
  var totalEval=(typeof evalHistory!=='undefined'?evalHistory.length:0);
  var empRows=(typeof employees!=='undefined'?employees:[]);
  var activeEmp=empRows.filter(function(e){ return e.statusAktif!==false; }).length;
  var payRows=(typeof payHistory!=='undefined'?payHistory:[]);
  var payrollRows=payRows.filter(function(r){ return inRangeRow(r,dashRange); });
  var payrollThisMonth=payrollRows.reduce(function(t,r){ return t+n(r.bersih); },0);
  var avgScore=totalEval?evalHistory.reduce(function(t,r){ return t+(parseFloat(r.fs)||0); },0)/totalEval:0;
  var hrSops=(typeof _hrSops!=='undefined'&&Array.isArray(_hrSops)?_hrSops:[]);
  var hrDiscipline=(typeof _hrControlData!=='undefined'&&_hrControlData&&Array.isArray(_hrControlData.disciplineLog)?_hrControlData.disciplineLog:[]);
  var warningCount=hrDiscipline.filter(function(r){ return ['Evaluasi','SP1','SP2','PHK Review','PHK'].indexOf(String(r.stage||''))>=0; }).length;

  var incomeRows=finReady?(_finIncome||[]).map(function(r,idx){ var m=_finIncomeMetrics(r); m._idx=idx; return m; }):[];
  var expenseRows=finReady?(_finExpense||[]):[];
  var latestAsset=finReady?latestRows(_finAssets||[]):[];
  var salesToday=incomeRows.reduce(function(t,r){ return rowTouchesDate(r,today)?t+n(r.pemasukanToko):t; },0);
  var salesTodayCount=incomeRows.filter(function(r){ return rowTouchesDate(r,today); }).length;
  var monthIncome=incomeRows.filter(function(r){ return inRangeRow(r,dashRange); });
  var monthExpense=expenseRows.filter(function(r){ return inRangeRow(r,dashRange); });
  var monthIncomeTotal=monthIncome.reduce(function(t,r){ return t+n(r.pemasukanToko); },0);
  var monthProfit=monthIncome.reduce(function(t,r){ return t+n(r.keuntunganKerugian); },0);
  var monthExpenseTotal=monthExpense.reduce(function(t,r){ return t+n(r.nominal); },0);
  var assetRowsInRange=(finReady?(_finAssets||[]).filter(function(r){ return inRangeRow(r,dashRange); }):[]);
  var latestAssetInRange=latestRows(assetRowsInRange.length?assetRowsInRange:(_finAssets||[]));
  var assetTotal=latestAssetInRange.reduce(function(t,r){ return t+n(r.nominal); },0);
  var assetBank=latestAssetInRange.filter(function(r){ return (r.type||'')==='Bank'; }).reduce(function(t,r){ return t+n(r.nominal); },0);
  var marginPct=pct(monthProfit,monthIncomeTotal);

  var marketplaceMap={};
  monthIncome.forEach(function(r){
    var key=r.marketplace||'Tanpa Marketplace';
    marketplaceMap[key]=marketplaceMap[key]||{nama:key,total:0,laba:0,count:0};
    marketplaceMap[key].total+=n(r.pemasukanToko);
    marketplaceMap[key].laba+=n(r.keuntunganKerugian);
    marketplaceMap[key].count++;
  });
  var marketplaceRows=Object.keys(marketplaceMap).map(function(k){ var r=marketplaceMap[k]; r.pct=pct(r.total,monthIncomeTotal); r.margin=pct(r.laba,r.total); return r; }).sort(function(a,b){ return b.total-a.total; }).slice(0,5);

  var expenseCatMap={};
  monthExpense.forEach(function(r){ var c=r.kategori||'Lainnya'; expenseCatMap[c]=(expenseCatMap[c]||0)+n(r.nominal); });
  var expenseCatRows=Object.keys(expenseCatMap).map(function(k){ return {nama:k,total:expenseCatMap[k],pct:pct(expenseCatMap[k],monthExpenseTotal)}; }).sort(function(a,b){ return b.total-a.total; }).slice(0,5);

  var supplierRows=(typeof supplierHutang!=='undefined'?supplierHutang:[]);
  var supplierSummary={}, totalHutang=0;
  supplierRows.filter(function(d){
    if(d.tahun&&d.bulanNum){
      var key=String(d.tahun)+'-'+String(d.bulanNum).padStart(2,'0')+'-15';
      return inRangeDate(key,dashRange);
    }
    return inRangeRow(d,dashRange)||!pickDate(d);
  }).forEach(function(d){
    var nm=supplierName(d), nota=(d.nota||[]).reduce(function(t,x){ return t+n(x.nilaiNetto); },0), bayar=(d.bayar||[]).reduce(function(t,x){ return t+n(x.jumlah); },0);
    supplierSummary[nm]=supplierSummary[nm]||{nama:nm,nota:0,bayar:0,hutang:0,count:0};
    supplierSummary[nm].nota+=nota;
    supplierSummary[nm].bayar+=bayar;
    supplierSummary[nm].hutang+=nota-bayar;
    supplierSummary[nm].count++;
    totalHutang+=nota-bayar;
  });
  var supplierTop=Object.keys(supplierSummary).map(function(k){ return supplierSummary[k]; }).filter(function(r){ return r.hutang>0||r.nota>0; }).sort(function(a,b){ return b.hutang-a.hutang; }).slice(0,4);

  var analytics=(typeof window._analyticsData==='object'&&window._analyticsData)?window._analyticsData:{};
  var analyticsSales=Array.isArray(analytics.sales)?analytics.sales.length:0;
  var analyticsService=Array.isArray(analytics.service)?analytics.service.length:0;
  var analyticsPromo=Array.isArray(analytics.promo)?analytics.promo.length:0;
  var analyticsCustomers=Array.isArray(analytics.customers)?analytics.customers.length:0;

  var refundRows=(typeof _toolRefunds!=='undefined'?_toolRefunds.filter(function(r){ return inRangeRow(r,dashRange); }):[]);
  var complaintRows=(typeof _toolComplaints!=='undefined'?_toolComplaints.filter(function(r){ return inRangeRow(r,dashRange); }):[]);
  var requestRows=(typeof _toolRequests!=='undefined'?_toolRequests.filter(function(r){ return inRangeRow(r,dashRange); }):[]);
  var materialOrderRows=(typeof _toolMaterialOrders!=='undefined'?_toolMaterialOrders.filter(function(r){ return inRangeRow(r,dashRange); }):[]);
  var materialHistoryRows=(typeof _toolMaterialOrderHistory!=='undefined'?_toolMaterialOrderHistory.filter(function(r){ return inRangeRow(r,dashRange); }):[]);
  var imageHistoryRows=_dashGenerateImageHistory().filter(function(r){ return inRangeRow(r,dashRange); });
  var toolsRefund7=refundRows.length;
  var toolsComplaint7=complaintRows.length;
  var toolsRequestOpen=requestRows.filter(function(r){ return String(r.status||'').toLowerCase()!=='done'; }).length;
  var materialOrderNominal=materialOrderRows.concat(materialHistoryRows).reduce(function(t,r){ return t+(n(r.subtotal)||(n(r.qty)*n(r.hargaSatuan))); },0);
  var imageDone=imageHistoryRows.filter(function(r){ return String(r.status||'').toLowerCase()==='completed'||String(r.status||'').toLowerCase()==='done'||(r.images&&r.images.length); }).length;
  var materialStock=(typeof _toolMaterialStock!=='undefined'?_toolMaterialStock.length:0);
  var autoJobs=(typeof _toolAutomationJobs!=='undefined'?_toolAutomationJobs.length:0);
  var reminders=(finReady&&typeof _finSubscriptionReminders==='function'?_finSubscriptionReminders():[]).filter(function(r){ return r.level==='overdue'||r.level==='today'||r.level==='soon'; });
  var hasWA=!!cfg.adminWA, hasTg=!!(cfg.tgToken&&cfg.tgChat), hasDrv=!!cfg.driveToken, hasSB=!!(cfg.supabaseUrl&&cfg.supabaseKey);
  var sys=health();

  var recent=[];
  (typeof evalHistory!=='undefined'?evalHistory:[]).slice(-5).forEach(function(r){ recent.push({ts:r.submittedAt||r.ts||'',type:'HR',title:(r.info&&r.info.nama)||'-',meta:'Nilai '+(parseFloat(r.fs||0).toFixed(2))}); });
  payRows.slice(-5).forEach(function(r){ recent.push({ts:r.submittedAt||r.ts||'',type:'Payroll',title:(r.info&&r.info.nama)||'-',meta:'Rp '+fmt(r.bersih||0)}); });
  incomeRows.slice(-6).forEach(function(r){ recent.push({ts:r.ts||r.tanggal||'',type:'Pendapatan',title:r.toko||r.marketplace||'-',meta:'Laba Rp '+fmt(r.keuntunganKerugian||0)}); });
  expenseRows.slice(-6).forEach(function(r){ recent.push({ts:r.ts||r.tanggal||'',type:'Pengeluaran',title:(typeof _finExpenseLabel==='function'?_finExpenseLabel(r):(r.nama||r.kategori||'-')),meta:'Rp '+fmt(r.nominal||0)}); });
  (typeof _toolRequests!=='undefined'?_toolRequests:[]).slice(-4).forEach(function(r){ recent.push({ts:r.ts||r.createdAt||'',type:'Tools',title:r.judul||r.nama||r.type||'Request',meta:r.status||'Aktif'}); });
  supplierRows.slice(-4).forEach(function(r){ recent.push({ts:r.ts||r.createdAt||'',type:'Supplier',title:supplierName(r),meta:(r.bulan||'')+' '+(r.tahun||'')}); });
  recent.sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); });

  var h='<div class="dashx">';
  h+='<header class="dashx-hero"><div><h1>Dashboard AJW</h1><p>Pusat kontrol operasional dari HR, Finance, Analytics, Tools, Supplier, dan Admin pada periode aktif.</p></div></header>';
  h+=_dashPeriodToolbarHtml(dashRange);

  h+='<div class="dashx-metrics">';
  h+=metric('Penjualan Periode',monthIncomeTotal?'Rp '+fmt(monthIncomeTotal):'Belum ada data',monthIncome.length+' data pendapatan','#1D4ED8');
  h+=metric('Laba / Margin',monthIncomeTotal?'Rp '+fmt(monthProfit):'Belum ada data',marginPct.toFixed(1)+'% margin','#15803D');
  h+=metric('Pengeluaran Periode',monthExpenseTotal?'Rp '+fmt(monthExpenseTotal):'Belum ada data',monthExpense.length+' transaksi','#C77818');
  h+=metric('Saldo Bersih','Rp '+fmt(currentSaldo),'Income - expense periode aktif',currentSaldo>=0?'#15803D':'#B91C1C');
  h+=metric('Aset Aktif','Rp '+fmt(assetTotal),'Bank Rp '+fmt(assetBank),'#0F766E');
  h+=metric('Hutang Supplier','Rp '+fmt(totalHutang),Object.keys(supplierSummary).length+' supplier','#B91C1C');
  h+='</div>';

  h+='<div class="dashx-grid">';
  h+='<div class="dashx-left">';
  h+=block('Finance Overview','Pendapatan, pengeluaran, aset, dan hutang dari menu Finance','<button class="btns" onclick="_navTo(\'finance\')">Buka Finance</button>',
    '<div class="dashx-split">'+
      '<div><h4>Ringkasan Marketplace</h4>'+(marketplaceRows.length?marketplaceRows.map(function(r){ return barRow(esc(r.nama),'Rp '+fmt(r.total),r.pct,'#1D4ED8','Laba Rp '+fmt(r.laba)+' | Margin '+r.margin.toFixed(1)+'%'); }).join(''):empty('Belum ada pendapatan bulan ini.'))+'</div>'+
      '<div><h4>Dominasi Pengeluaran</h4>'+(expenseCatRows.length?expenseCatRows.map(function(r){ return barRow(esc(r.nama),'Rp '+fmt(r.total),r.pct,'#C77818',r.pct.toFixed(1)+'% dari pengeluaran'); }).join(''):empty('Belum ada pengeluaran bulan ini.'))+'</div>'+
    '</div>');

  h+=block('HR Performance','Karyawan, payroll, evaluasi, SOP, dan warning dari menu HR','<button class="btns" onclick="_navTo(\'hr\')">Buka HR</button>',
    '<div class="dashx-tile-grid">'+
      '<div><span>Karyawan Aktif</span><b>'+activeEmp+'</b><small>'+empRows.length+' total karyawan</small></div>'+
      '<div><span>Payroll Bulan Ini</span><b>Rp '+fmt(payrollThisMonth)+'</b><small>'+payrollRows.length+' slip</small></div>'+
      '<div><span>Rata-rata Evaluasi</span><b>'+(avgScore?avgScore.toFixed(2):'-')+'</b><small>'+totalEval+' penilaian</small></div>'+
      '<div><span>Warning / SOP</span><b>'+warningCount+' / '+hrSops.length+'</b><small>Kontrol HR aktif</small></div>'+
    '</div>');

  h+=block('Aktivitas Terbaru','Aktivitas lintas HR, Finance, Tools, dan Supplier','',
    '<div class="dashx-table-wrap"><table class="tbl"><thead><tr><th>Waktu</th><th>Modul</th><th>Item</th><th>Keterangan</th></tr></thead><tbody>'+
    (recent.length?recent.slice(0,10).map(function(r){ return '<tr><td>'+esc(r.ts?new Date(r.ts).toLocaleString('id-ID'):'-')+'</td><td><span class="chip">'+esc(r.type)+'</span></td><td style="font-weight:800">'+esc(r.title||'-')+'</td><td>'+esc(r.meta||'-')+'</td></tr>'; }).join(''):'<tr><td colspan="4" style="text-align:center;color:var(--tx3);padding:18px">Belum ada aktivitas terbaru.</td></tr>')+
    '</tbody></table></div>');
  h+='</div>';

  h+='<aside class="dashx-right">';
  h+=block('Tools & Integrasi','Pengembalian dana, komplain, request, belanja material, dan generate image','<button class="btns" onclick="_navTo(\'tools\')">Tools</button>',
    '<div class="dashx-tile-grid compact">'+
      '<div><span>Pengembalian Dana</span><b>'+toolsRefund7+'</b></div><div><span>Komplain</span><b>'+toolsComplaint7+'</b></div><div><span>Request Aktif</span><b>'+toolsRequestOpen+'</b></div><div><span>Belanja Material</span><b>'+materialOrderRows.length+'</b><small>Rp '+fmt(materialOrderNominal)+'</small></div><div><span>Generate Image</span><b>'+imageHistoryRows.length+'</b><small>'+imageDone+' selesai</small></div><div><span>Material Stock</span><b>'+materialStock+'</b></div>'+
    '</div><div class="dashx-status-row">'+[['WA',hasWA],['Supabase',hasSB],['Telegram',hasTg],['Drive',hasDrv]].map(function(x){ return '<span class="'+(x[1]?'on':'')+'">'+x[0]+' '+(x[1]?'Aktif':'Belum')+'</span>'; }).join('')+'</div>');

  h+=block('Analytics Snapshot','Data dari menu Analytics','<button class="btns" onclick="_navTo(\'analytics\')">Analytics</button>',
    '<div class="dashx-analytics">'+
      '<div><b>'+analyticsSales+'</b><span>Sales</span></div><div><b>'+analyticsService+'</b><span>Service</span></div><div><b>'+analyticsPromo+'</b><span>Promo</span></div><div><b>'+analyticsCustomers+'</b><span>Customer</span></div>'+
    '</div>');

  h+=block('Supplier Prioritas','Hutang terbesar dari Hutang Supplier','<button class="btns" onclick="_navTo(\'finance\');setTimeout(function(){_renderFinance(\'hutang\')},60)">Hutang</button>',
    supplierTop.length?supplierTop.map(function(r){ return '<div class="dashx-supplier"><div><b>'+esc(r.nama)+'</b><span>Nota Rp '+fmt(r.nota)+' | Bayar Rp '+fmt(r.bayar)+'</span></div><strong>Rp '+fmt(r.hutang)+'</strong></div>'; }).join(''):empty('Belum ada hutang supplier aktif.'));

  h+=block('System Status',sys.detail,'<button class="btns" onclick="_navTo(\'admin\')">Admin</button>',
    '<div class="dashx-system" style="border-left-color:'+sys.tone+'"><b>'+esc(sys.label)+'</b><span>'+esc(sys.detail)+'</span></div>');

  h+=block('Akses Cepat','','',
    '<div class="dashx-quick">'+[
      ['Finance','_navTo(\'finance\')'],['Pendapatan','_navTo(\'finance\');setTimeout(function(){_renderFinance(\'income\')},60)'],['Pengeluaran','_navTo(\'finance\');setTimeout(function(){_renderFinance(\'expense\')},60)'],['Aset','_navTo(\'finance\');setTimeout(function(){_renderFinance(\'asset\')},60)'],['Hutang','_navTo(\'finance\');setTimeout(function(){_renderFinance(\'hutang\')},60)'],['HR','_navTo(\'hr\')'],['Tools','_navTo(\'tools\')'],['Analytics','_navTo(\'analytics\')'],['Admin','_navTo(\'admin\')']
    ].map(function(b){ return '<button class="btns" onclick="'+b[1]+'">'+b[0]+'</button>'; }).join('')+'</div>');
  h+='</aside></div></div>';
  root.innerHTML=h;
}

function _dashEnsureCss(){
  if(document.getElementById('DASHX-CSS')) return;
  var st=document.createElement('style');
  st.id='DASHX-CSS';
  st.textContent='.dashx{display:flex;flex-direction:column;gap:10px}.dashx-hero{background:#fff;border:1px solid var(--bd);border-radius:10px;padding:16px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.dashx-hero h1{font-size:21px;line-height:1.15;margin:0;color:var(--tx);font-weight:850}.dashx-hero p{margin:6px 0 0;color:var(--tx2);font-size:13px;max-width:820px}.dashx-hero-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.dashx-pill{display:inline-flex;align-items:center;border:1px solid;border-radius:999px;padding:5px 10px;font-size:11px;font-weight:800}.dashx-filter{position:relative;display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:4px 0 2px}.dashx-period-btn,.dashx-period-action{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #cfd6df;border-radius:4px;min-height:36px;padding:7px 12px;color:#1f2937;font-size:13px;box-shadow:0 1px 2px rgba(15,23,42,.08);cursor:pointer}.dashx-period-btn span{font-weight:700;color:#111827}.dashx-period-btn b{font-weight:850;color:#111827}.dashx-period-btn em{font-style:normal;color:#334155}.dashx-period-btn .cal{font-size:12px;color:#111827}.dashx-period-pop{position:absolute;top:42px;left:0;width:min(560px,calc(100vw - 36px));display:grid;grid-template-columns:170px 1fr;background:#fff;border:1px solid #e5e7eb;box-shadow:0 10px 32px rgba(15,23,42,.16);border-radius:4px;overflow:hidden;color:#374151;z-index:70}.dashx-period-left{border-right:1px solid #e5e7eb;padding:10px 0}.dashx-period-left button{width:100%;border:0;background:#fff;text-align:left;padding:8px 16px;font-size:13px;color:#3f3f46;cursor:pointer;display:flex;justify-content:space-between}.dashx-period-left button.act,.dashx-period-left button:hover{color:#c77818;background:#f7f7f7}.dashx-period-right{padding:12px;display:grid;grid-template-columns:1fr 1fr auto;gap:8px;align-items:end}.dashx-period-right label{display:block;font-size:10px;font-weight:800;color:var(--tx2);text-transform:uppercase;margin-bottom:4px}.dashx-period-right input{height:34px;border:1px solid #cfd6df;border-radius:4px;background:#fff;color:#1f2937;font-size:12px;font-weight:700;padding:0 10px}.dashx-period-action{font-weight:850;background:#c77818;border-color:#c77818;color:#fff;justify-content:center}.dashx-metrics{display:grid;grid-template-columns:repeat(6,minmax(140px,1fr));gap:9px}.dashx-metric{background:#fff;border:1px solid var(--bd);border-top:3px solid;border-radius:9px;padding:10px 12px;min-width:0}.dashx-metric-k{font-size:10px;text-transform:uppercase;letter-spacing:.04em;font-weight:800;color:var(--tx2)}.dashx-metric-v{font-size:18px;font-weight:850;color:var(--tx);line-height:1.15;margin-top:5px}.dashx-metric-m{font-size:10px;color:var(--tx2);margin-top:5px;line-height:1.3}.dashx-grid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(330px,.55fr);gap:10px;align-items:start}.dashx-left,.dashx-right{display:flex;flex-direction:column;gap:10px}.dashx-block{background:#fff;border:1px solid var(--bd);border-radius:10px;padding:12px;box-shadow:0 1px 2px rgba(15,23,42,.04)}.dashx-block-head{display:flex;justify-content:space-between;gap:9px;align-items:flex-start;margin-bottom:10px}.dashx-block h3{font-size:14px;font-weight:850;color:var(--tx);margin:0}.dashx-block p{font-size:11px;color:var(--tx2);margin:3px 0 0}.dashx-block h4{font-size:12px;font-weight:850;color:var(--tx);margin:0 0 8px}.dashx-split{display:grid;grid-template-columns:1fr 1fr;gap:12px}.dashx-bar-row{padding:8px 0;border-bottom:1px solid var(--bd)}.dashx-bar-row:last-child{border-bottom:none}.dashx-bar-top{display:flex;justify-content:space-between;gap:10px;align-items:center}.dashx-bar-top b{font-size:12px;color:var(--tx)}.dashx-bar-top span{font-size:11px;font-weight:850;color:var(--tx)}.dashx-bar-track{height:7px;background:#EEF2F7;border:1px solid var(--bd);border-radius:999px;overflow:hidden;margin-top:6px}.dashx-bar-track i{display:block;height:100%;border-radius:999px}.dashx-bar-row small{display:block;margin-top:4px;font-size:10px;color:var(--tx2)}.dashx-tile-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.dashx-tile-grid.compact{grid-template-columns:repeat(2,minmax(0,1fr))}.dashx-tile-grid>div{background:#F8FAFC;border:1px solid var(--bd);border-radius:9px;padding:9px}.dashx-tile-grid span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--tx2);font-weight:800}.dashx-tile-grid b{display:block;font-size:17px;color:var(--tx);font-weight:850;margin-top:4px}.dashx-tile-grid small{display:block;font-size:10px;color:var(--tx2);margin-top:3px}.dashx-table-wrap{overflow:auto;border:1px solid var(--bd);border-radius:9px;background:#fff}.dashx-table-wrap .tbl{min-width:720px}.dashx-table-wrap .tbl th,.dashx-table-wrap .tbl td{font-size:12px}.dashx-status-row{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:9px}.dashx-status-row span{border:1px solid var(--bd);border-radius:8px;padding:7px 9px;font-size:11px;font-weight:800;color:#B91C1C;background:#FEF2F2}.dashx-status-row span.on{color:#15803D;background:#F0FDF4}.dashx-analytics{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.dashx-analytics div{background:#F8FAFC;border:1px solid var(--bd);border-radius:9px;text-align:center;padding:9px}.dashx-analytics b{display:block;font-size:17px;font-weight:850;color:var(--tx)}.dashx-analytics span{font-size:10px;text-transform:uppercase;color:var(--tx2);font-weight:800}.dashx-supplier{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;border:1px solid var(--bd);border-radius:9px;padding:9px;margin-bottom:7px;background:#F8FAFC}.dashx-supplier b{display:block;font-size:12px;color:var(--tx)}.dashx-supplier span{display:block;font-size:10px;color:var(--tx2);margin-top:4px}.dashx-supplier strong{font-size:12px;color:#B45309;white-space:nowrap}.dashx-system{border-left:3px solid;border-radius:9px;background:#F8FAFC;border-top:1px solid var(--bd);border-right:1px solid var(--bd);border-bottom:1px solid var(--bd);padding:10px}.dashx-system b{display:block;font-size:13px;color:var(--tx)}.dashx-system span{display:block;font-size:11px;color:var(--tx2);margin-top:4px}.dashx-quick{display:flex;gap:7px;flex-wrap:wrap}.dashx-empty{color:var(--tx3);text-align:center;padding:16px 10px;border:1px dashed var(--bd);border-radius:9px;background:#F8FAFC;font-size:12px}@media(max-width:1180px){.dashx-metrics{grid-template-columns:repeat(3,1fr)}.dashx-grid{grid-template-columns:1fr}.dashx-split{grid-template-columns:1fr}}@media(max-width:720px){.dashx-hero{flex-direction:column}.dashx-metrics{grid-template-columns:1fr 1fr}.dashx-period-pop{grid-template-columns:1fr}.dashx-period-left{border-right:0;border-bottom:1px solid #e5e7eb}.dashx-period-right{grid-template-columns:1fr}.dashx-tile-grid{grid-template-columns:1fr 1fr}.dashx-analytics{grid-template-columns:1fr 1fr}}';
  document.head.appendChild(st);
}

function _dashGenerateImageHistory(){
  try{
    var raw=localStorage.getItem('affiliate-media-studio-request-history');
    var rows=JSON.parse(raw||'[]');
    return Array.isArray(rows)?rows:[];
  }catch(e){
    return [];
  }
}

function _dashFormatYmd(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function _dashPeriodToolbarHtml(st){
  st=st||window._dashPeriod||{};
  _dashEnsureFinPeriodCss();
  var h='<div class="fin-period-wrap"><button class="fin-period-btn" onclick="_dashTogglePeriodMenu()"><span>Periode Data</span><b>'+esc(st.label||'30 hari sebelumnya.')+'</b><em>'+esc((st.from&&st.to)?(st.from+' s/d '+st.to):'')+'</em><span class="cal">▦</span></button>';
  if(window._dashPeriodOpen) h+=_dashPeriodMenu();
  return h+'</div>';
}

function _dashTogglePeriodMenu(){
  window._dashPeriodOpen=!window._dashPeriodOpen;
  window._dashPeriodPanel=window._dashPeriodPanel||'month';
  renderDash();
}

function _dashPeriodMenu(){
  var st=window._dashPeriod||{}, base=_dashParseYmd(st.to)||new Date(), y=base.getFullYear(), m=base.getMonth()+1, panel=window._dashPeriodPanel||'month';
  var h='<div class="fin-period-pop"><div class="fin-period-left">';
  [['realtime','Real-time'],['yesterday','Kemarin'],['last7','7 hari sebelumnya.'],['last30','30 hari sebelumnya.']].forEach(function(x){ h+='<button class="'+(st.mode===x[0]?'act':'')+'" onclick="_dashApplyPeriodPreset(\''+x[0]+'\')">'+x[1]+'</button>'; });
  h+='<div class="fin-period-sep"></div>';
  [['day','Per Hari'],['week','Per Minggu'],['month','Per Bulan'],['year','Berdasarkan Tahun']].forEach(function(x){ h+='<button class="'+(panel===x[0]?'act':'')+'" onclick="_dashSetPeriodPanel(\''+x[0]+'\')">'+x[1]+' <span>›</span></button>'; });
  h+='</div><div class="fin-period-right"><div class="fin-period-head"><button onclick="_dashApplyPeriodYear('+(y-1)+')">«</button><strong>'+y+'</strong><button onclick="_dashApplyPeriodYear('+(y+1)+')">»</button></div>';
  if(panel==='year'){ h+='<div class="fin-period-years">'; for(var yy=y-5;yy<=y+6;yy++) h+='<button class="'+(yy===y?'act':'')+'" onclick="_dashApplyPeriodYear('+yy+')">'+yy+'</button>'; h+='</div>'; }
  else if(panel==='month'){ var names=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']; h+='<div class="fin-period-months">'+names.map(function(n,i){ return '<button class="'+((i+1)===m?'act':'')+'" onclick="_dashApplyPeriodMonth('+y+','+(i+1)+')">'+n+'</button>'; }).join('')+'</div>'; }
  else { var first=new Date(y,m-1,1), start=_dashAddDays(first,-((first.getDay()+6)%7)); h+='<div class="fin-period-days"><b>S</b><b>S</b><b>R</b><b>K</b><b>J</b><b>S</b><b>M</b>'; for(var i=0;i<42;i++){ var d=_dashAddDays(start,i), inMo=d.getMonth()===(m-1), cls=(_dashFormatYmd(d)===_dashFormatYmd(base)?'act ':'')+(inMo?'':'muted'); h+='<button class="'+cls+'" onclick="'+(panel==='week'?'_dashApplyPeriodWeek':'_dashApplyPeriodDay')+'(\''+_dashFormatYmd(d)+'\')">'+d.getDate()+'</button>'; } h+='</div>'; }
  h+='</div></div>'; return h;
}

function _dashSetPeriodPanel(panel){ window._dashPeriodOpen=true; window._dashPeriodPanel=panel||'month'; renderDash(); }

function _dashParseYmd(v){ var m=String(v||'').match(/^(\d{4})-(\d{2})-(\d{2})/); if(!m) return null; var d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3])); return isNaN(d.getTime())?null:d; }
function _dashAddDays(d,n){ var x=new Date(d.getFullYear(),d.getMonth(),d.getDate()); x.setDate(x.getDate()+n); return x; }
function _dashMonthEnd(y,m){ return new Date(y,m,0); }
function _dashApplyRange(label,from,to,mode){ window._dashPeriod={mode:mode||'custom',label:label,from:from,to:to}; window._dashPeriodOpen=false; renderDash(); }
function _dashApplyPeriodPreset(preset){ var base=_dashParseYmd((window._dashPeriod||{}).to)||new Date(), from=base, to=base, label='Real-time'; if(preset==='yesterday'){ from=to=_dashAddDays(base,-1); label='Kemarin'; } else if(preset==='last7'){ from=_dashAddDays(base,-6); label='7 hari sebelumnya.'; } else if(preset==='last30'){ from=_dashAddDays(base,-29); label='30 hari sebelumnya.'; } _dashApplyRange(label,_dashFormatYmd(from),_dashFormatYmd(to),preset); }
function _dashApplyPeriodDay(date){ var d=_dashParseYmd(date)||new Date(); _dashApplyRange('Per Hari '+_dashFormatYmd(d),_dashFormatYmd(d),_dashFormatYmd(d),'day'); }
function _dashApplyPeriodWeek(date){ var d=_dashParseYmd(date)||new Date(), day=(d.getDay()+6)%7, from=_dashAddDays(d,-day), to=_dashAddDays(from,6); _dashApplyRange('Per Minggu '+_dashFormatYmd(from)+' s/d '+_dashFormatYmd(to),_dashFormatYmd(from),_dashFormatYmd(to),'week'); }
function _dashApplyPeriodMonth(y,m){ var from=new Date(Number(y),Number(m)-1,1), to=_dashMonthEnd(Number(y),Number(m)), names=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']; _dashApplyRange('Per Bulan '+names[Number(m)-1]+' '+y,_dashFormatYmd(from),_dashFormatYmd(to),'month'); }
function _dashApplyPeriodYear(y){ _dashApplyRange('Berdasarkan Tahun '+y,y+'-01-01',y+'-12-31','year'); }

function _dashEnsureFinPeriodCss(){
  if(document.getElementById('FIN-PERIOD-FILTER-CSS')) return;
  var st=document.createElement('style'); st.id='FIN-PERIOD-FILTER-CSS';
  st.textContent='.fin-period-wrap{position:relative;margin:0 0 10px;z-index:50;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.fin-period-btn,.fin-period-select,.fin-period-action{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #cfd6df;border-radius:4px;min-height:34px;padding:6px 10px;color:#1f2937;font-size:12px;box-shadow:0 1px 2px rgba(15,23,42,.08);cursor:pointer}.fin-period-select{min-width:150px;display:block}.fin-period-select.session{min-width:190px}.fin-period-action{font-weight:800}.fin-period-action.primary{background:#c77818;border-color:#c77818;color:#fff}.fin-period-action.danger{color:#b91c1c}.fin-period-btn b{font-weight:800;color:#111827}.fin-period-btn em{font-style:normal;color:#374151}.fin-period-btn .cal{margin-left:auto;color:#111}.fin-period-pop{position:absolute;top:40px;left:0;width:min(620px,calc(100vw - 36px));display:grid;grid-template-columns:178px 1fr;background:#fff;border:1px solid #e5e7eb;box-shadow:0 10px 32px rgba(15,23,42,.16);border-radius:4px;overflow:hidden;color:#374151;z-index:60}.fin-period-left{border-right:1px solid #e5e7eb;padding:10px 0}.fin-period-left button{width:100%;border:0;background:#fff;text-align:left;padding:8px 16px;font-size:13px;color:#3f3f46;cursor:pointer;display:flex;justify-content:space-between}.fin-period-left button.act,.fin-period-left button:hover{color:#ff3b30;background:#f7f7f7}.fin-period-sep{height:1px;background:#e5e7eb;margin:10px 16px}.fin-period-right{padding:0 0 16px}.fin-period-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #edf0f3;padding:10px 18px}.fin-period-head button{border:0;background:#fff;font-size:20px;color:#9ca3af;cursor:pointer}.fin-period-head strong{font-size:16px;color:#333}.fin-period-months,.fin-period-years{display:grid;grid-template-columns:repeat(3,1fr);gap:18px 28px;padding:28px 36px}.fin-period-months button,.fin-period-years button,.fin-period-days button{border:0;background:#fff;color:#444;padding:7px;border-radius:4px;cursor:pointer}.fin-period-months button.act,.fin-period-years button.act,.fin-period-days button.act{color:#ff3b30;background:#f1f3f5}.fin-period-days{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;padding:18px 18px 6px;text-align:center}.fin-period-days b{font-size:12px;color:#6b7280;font-weight:500;padding:4px}.fin-period-days button.muted{color:#c5c9cf}@media(max-width:720px){.fin-period-pop{grid-template-columns:1fr;width:calc(100vw - 28px)}.fin-period-left{border-right:0;border-bottom:1px solid #e5e7eb}.fin-period-months,.fin-period-years{gap:10px;padding:18px}.fin-period-select,.fin-period-action,.fin-period-btn{width:100%;justify-content:space-between}}';
  document.head.appendChild(st);
}

function _dashSetPeriod(mode){
  var today=new Date(), from=new Date(today.getFullYear(),today.getMonth(),today.getDate()), label='30 hari sebelumnya.';
  if(mode==='last7'){ from.setDate(from.getDate()-6); label='7 hari terakhir'; }
  else if(mode==='last30'){ from.setDate(from.getDate()-29); label='30 hari sebelumnya.'; }
  else if(mode==='month'){ from=new Date(today.getFullYear(),today.getMonth(),1); label='Bulan ini'; }
  else if(mode==='year'){ from=new Date(today.getFullYear(),0,1); label='Tahun ini'; }
  else { mode='last30'; from.setDate(from.getDate()-29); }
  window._dashPeriod={mode:mode,label:label,from:_dashFormatYmd(from),to:_dashFormatYmd(today)};
  window._dashPeriodOpen=false;
  renderDash();
}

function _dashApplyCustomPeriod(){
  var fromEl=document.getElementById('DASH-FROM'), toEl=document.getElementById('DASH-TO');
  var from=fromEl&&fromEl.value, to=toEl&&toEl.value;
  if(!from||!to){
    if(typeof toast==='function') toast('Isi periode dashboard dulu','warn');
    return;
  }
  if(from>to){
    var tmp=from; from=to; to=tmp;
  }
  window._dashPeriod={mode:'custom',label:'Custom',from:from,to:to};
  window._dashPeriodOpen=false;
  renderDash();
}
