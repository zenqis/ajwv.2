/* ═══════════════════════════════════════════════════════
   OPERASIONAL MODULE — AJW Workspace
   Sub-tabs: dash | refund | komplain | request | blast | material
   Data: _toolRefunds, _toolComplaints, _toolRequests (global)
   Blast Konfirmasi: ajw_blast_konfirmasi (localStorage)
   ═══════════════════════════════════════════════════════ */

/* ── Blast Konfirmasi data ─────────────────────────────── */
var _opsBlastHistory = [];
var _opsBlastTemplates = [];
(function(){
  try { _opsBlastHistory = JSON.parse(localStorage.getItem('ajw_blast_konfirmasi') || '[]'); } catch(e) { _opsBlastHistory = []; }
  try { _opsBlastTemplates = JSON.parse(localStorage.getItem('ajw_blast_templates') || '[]'); } catch(e) { _opsBlastTemplates = []; }
})();
function _opsSaveBlast() {
  try { localStorage.setItem('ajw_blast_konfirmasi', JSON.stringify(_opsBlastHistory)); } catch(e) {}
}
function _opsSaveBlastTemplates() {
  try { localStorage.setItem('ajw_blast_templates', JSON.stringify(_opsBlastTemplates)); } catch(e) {}
}

/* ── Main router ─────────────────────────────────────────── */
function _renderOperasional(sub) {
  sub = sub || window._opsSub || 'dash';
  window._opsSub = sub;
  var v = document.getElementById('V-operasional');
  if (!v) return;
  if (!document.getElementById('OPS-SHELL')) {
    v.innerHTML = '<div id="OPS-SHELL"></div><div id="OPS-CONTENT"></div>';
  }
  var shell = document.getElementById('OPS-SHELL');
  var content = document.getElementById('OPS-CONTENT');
  if (!shell || !content) return;

  var tabs = [
    ['dash',     'Dashboard'],
    ['refund',   'Refund'],
    ['komplain', 'Komplain'],
    ['request',  'Request'],
    ['blast',    'Blast Konfirmasi'],
    ['material', 'Material Operasional']
  ];
  var h = '<div class="card" style="margin-bottom:12px"><div style="display:flex;gap:8px;flex-wrap:wrap">';
  tabs.forEach(function(s) {
    h += '<button class="' + (sub === s[0] ? 'btnp' : 'btns') + '" onclick="_renderOperasional(\'' + s[0] + '\')" style="padding:8px 12px">' + s[1] + '</button>';
  });
  h += '</div></div>';
  shell.innerHTML = h;

  if      (sub === 'dash')     content.innerHTML = _renderOpsDash();
  else if (sub === 'refund')   content.innerHTML = _renderOpsRefund();
  else if (sub === 'komplain') content.innerHTML = _renderOpsKomplain();
  else if (sub === 'request')  content.innerHTML = _renderOpsRequest();
  else if (sub === 'blast')    content.innerHTML = _renderOpsBlast();
  else if (sub === 'material') content.innerHTML = _renderOpsMaterial();
}

/* ══════════════════════════════════════════════
   1. DASHBOARD OPERASIONAL
   ══════════════════════════════════════════════ */
function _renderOpsDash() {
  var refunds    = (typeof _toolRefunds    !== 'undefined' ? _toolRefunds    : []);
  var complaints = (typeof _toolComplaints !== 'undefined' ? _toolComplaints : []);
  var requests   = (typeof _toolRequests   !== 'undefined' ? _toolRequests   : []);
  var today      = new Date();
  var d7ago      = new Date(today - 7 * 86400000).toISOString().slice(0,10);
  var d30ago     = new Date(today - 30 * 86400000).toISOString().slice(0,10);

  function filterRange(arr, days) {
    var cutoff = new Date(today - days * 86400000).toISOString();
    return arr.filter(function(r) { return String(r.ts||r.tanggal||'') >= cutoff; });
  }

  var ref7   = filterRange(refunds, 7).length;
  var ref30  = filterRange(refunds, 30).length;
  var cmp7   = filterRange(complaints, 7).length;
  var cmp30  = filterRange(complaints, 30).length;
  var reqOpen = requests.filter(function(r) { return String(r.status||'').toLowerCase() !== 'done'; }).length;
  var reqDone = requests.filter(function(r) { return String(r.status||'').toLowerCase() === 'done'; }).length;

  var blast7 = filterRange(_opsBlastHistory, 7);
  var blastOK  = blast7.filter(function(r) { return r.status === 'terkirim'; }).length;
  var blastFail= blast7.filter(function(r) { return r.status === 'gagal'; }).length;
  var blastPend= blast7.filter(function(r) { return r.status === 'pending'; }).length;

  var kpis = [
    ['Refund 7 Hari',    ref7,    '#FF9D9D', ref30 + ' bulan ini'],
    ['Komplain 7 Hari',  cmp7,    '#FFB76B', cmp30 + ' bulan ini'],
    ['Request Aktif',    reqOpen, '#8FD0FF', reqDone + ' selesai'],
    ['Blast Terkirim',   blastOK, '#A7F3B6', blastFail + ' gagal · ' + blastPend + ' pending'],
  ];

  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px;background:linear-gradient(135deg,rgba(255,183,107,.08),rgba(143,208,255,.04))">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">';
  h += '<div><div style="font-size:16px;font-weight:800;color:#FFB76B">Dashboard Operasional</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Pantauan refund, komplain, request, blast, dan material operasional.</div></div>';
  h += '<span class="chip" style="border:1px solid rgba(255,183,107,.28);background:rgba(255,183,107,.07);color:#FFB76B">Data Live</span></div></div>';

  h += '<div style="display:grid;grid-template-columns:repeat(4,minmax(140px,1fr));gap:10px;margin-bottom:12px">';
  kpis.forEach(function(k) {
    h += '<div class="card" style="margin-bottom:0;background:var(--bg3);position:relative;overflow:hidden">';
    h += '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:' + k[2] + '"></div>';
    h += '<div style="font-size:10px;font-weight:700;color:' + k[2] + ';text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">' + k[0] + '</div>';
    h += '<div style="font-size:24px;font-weight:800;color:var(--tx)">' + k[1] + '</div>';
    h += '<div style="font-size:10px;color:var(--tx2);margin-top:5px">' + k[3] + '</div></div>';
  });
  h += '</div>';

  h += '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:12px">';

  /* Recent Refunds */
  h += '<div class="card" style="margin-bottom:0"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">';
  h += '<div style="font-size:13px;font-weight:800;color:var(--tx)">Refund Terbaru</div>';
  h += '<button class="btns" onclick="_renderOperasional(\'refund\')" style="font-size:11px;padding:6px 10px">Lihat Semua</button></div>';
  if (refunds.length) {
    refunds.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).slice(0,5).forEach(function(r) {
      var statusColor = r.status === 'Selesai' ? '#A7F3B6' : r.status === 'Ditolak' ? '#FF9D9D' : '#FFB76B';
      h += '<div style="padding:8px 0;border-bottom:1px solid var(--bd)">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">';
      h += '<div style="font-size:11px;font-weight:700;color:var(--tx)">' + esc(r.nama || r.pembeli || '-') + '</div>';
      h += '<span style="font-size:10px;color:' + statusColor + ';font-weight:700">' + esc(r.status || 'Proses') + '</span></div>';
      h += '<div style="font-size:10px;color:var(--tx2)">Rp ' + fmt(_num(r.nominal || 0)) + ' · ' + esc(r.marketplace || '-') + '</div></div>';
    });
  } else {
    h += '<div style="color:var(--tx3);text-align:center;padding:18px 10px;font-size:11px">Belum ada refund.</div>';
  }
  h += '</div>';

  /* Recent Complaints */
  h += '<div class="card" style="margin-bottom:0"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">';
  h += '<div style="font-size:13px;font-weight:800;color:var(--tx)">Komplain Terbaru</div>';
  h += '<button class="btns" onclick="_renderOperasional(\'komplain\')" style="font-size:11px;padding:6px 10px">Lihat Semua</button></div>';
  if (complaints.length) {
    complaints.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).slice(0,5).forEach(function(r) {
      var lvl = (r.level || r.prioritas || 'Normal');
      var lvlColor = lvl === 'Tinggi' || lvl === 'Urgent' ? '#FF9D9D' : lvl === 'Sedang' ? '#FFB76B' : '#8FD0FF';
      h += '<div style="padding:8px 0;border-bottom:1px solid var(--bd)">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">';
      h += '<div style="font-size:11px;font-weight:700;color:var(--tx)">' + esc(r.nama || r.judul || '-') + '</div>';
      h += '<span style="font-size:10px;color:' + lvlColor + ';font-weight:700">' + esc(lvl) + '</span></div>';
      h += '<div style="font-size:10px;color:var(--tx2)">' + esc(r.status || 'Buka') + ' · ' + esc(r.marketplace || '-') + '</div></div>';
    });
  } else {
    h += '<div style="color:var(--tx3);text-align:center;padding:18px 10px;font-size:11px">Belum ada komplain.</div>';
  }
  h += '</div>';

  /* Open Requests */
  h += '<div class="card" style="margin-bottom:0"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">';
  h += '<div style="font-size:13px;font-weight:800;color:var(--tx)">Request Pending</div>';
  h += '<button class="btns" onclick="_renderOperasional(\'request\')" style="font-size:11px;padding:6px 10px">Lihat Semua</button></div>';
  var openReqs = requests.filter(function(r) { return String(r.status||'').toLowerCase() !== 'done'; });
  if (openReqs.length) {
    openReqs.slice(0,5).forEach(function(r) {
      h += '<div style="padding:8px 0;border-bottom:1px solid var(--bd)">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px">';
      h += '<div style="font-size:11px;font-weight:700;color:var(--tx)">' + esc(r.judul || r.nama || '-') + '</div>';
      h += '<span style="font-size:10px;color:#FFB76B;font-weight:700">' + esc(r.status || 'Open') + '</span></div>';
      h += '<div style="font-size:10px;color:var(--tx2)">' + esc(r.kategori || r.tipe || '-') + '</div></div>';
    });
  } else {
    h += '<div style="color:var(--tx3);text-align:center;padding:18px 10px;font-size:11px">Tidak ada request pending.</div>';
  }
  h += '</div>';

  h += '</div>'; /* end 3-col grid */

  /* Blast statistik */
  h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">';
  h += '<div><div style="font-size:13px;font-weight:800;color:var(--tx)">Blast Konfirmasi — 7 Hari</div>';
  h += '<div style="font-size:10px;color:var(--tx2);margin-top:3px">Statistik pengiriman blast konfirmasi customer terakhir.</div></div>';
  h += '<button class="btns" onclick="_renderOperasional(\'blast\')" style="font-size:11px;padding:6px 10px">Buka Blast</button></div>';
  h += '<div style="display:grid;grid-template-columns:repeat(4,minmax(100px,1fr));gap:8px">';
  [
    ['Total', blast7.length, '#8FD0FF'],
    ['Terkirim', blastOK, '#A7F3B6'],
    ['Pending', blastPend, '#FFD68A'],
    ['Gagal', blastFail, '#FF9D9D']
  ].forEach(function(s) {
    h += '<div style="background:var(--bg3);border:1px solid var(--bd);border-radius:8px;padding:10px">';
    h += '<div style="font-size:10px;font-weight:700;color:' + s[2] + ';text-transform:uppercase">' + s[0] + '</div>';
    h += '<div style="font-size:20px;font-weight:800;color:var(--tx);margin-top:4px">' + s[1] + '</div></div>';
  });
  h += '</div></div>';

  return h;
}

/* ══════════════════════════════════════════════
   2. REFUND
   ══════════════════════════════════════════════ */
function _renderOpsRefund() {
  var refunds = (typeof _toolRefunds !== 'undefined' ? _toolRefunds : []);
  var filter = window._opsRefundFilter || {status:'', marketplace:'', keyword:''};
  window._opsRefundFilter = filter;

  var rows = refunds.filter(function(r) {
    if (filter.status && String(r.status||'') !== filter.status) return false;
    if (filter.marketplace && String(r.marketplace||'') !== filter.marketplace) return false;
    if (filter.keyword) {
      var hay = ((r.nama||'')+(r.pembeli||'')+(r.noOrder||'')+(r.catatan||'')).toLowerCase();
      if (hay.indexOf(filter.keyword.toLowerCase()) < 0) return false;
    }
    return true;
  });
  var total = refunds.reduce(function(t,r) { return t + _num(r.nominal||0); }, 0);
  var filtered = rows.reduce(function(t,r) { return t + _num(r.nominal||0); }, 0);
  var statuses = ['', 'Proses', 'Selesai', 'Ditolak'];
  var marketplaces = [''].concat(Array.from(new Set(refunds.map(function(r){ return r.marketplace||''; }).filter(Boolean))).sort());

  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">';
  h += '<div><div style="font-size:16px;font-weight:800;color:#FF9D9D">Pengembalian Dana (Refund)</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Kelola semua pengajuan refund customer dari berbagai marketplace.</div></div>';
  h += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
  h += '<span class="chip" style="border:1px solid rgba(255,157,157,.3);background:rgba(255,157,157,.07);color:#FF9D9D">' + refunds.length + ' total</span>';
  h += '<span class="chip" style="border:1px solid rgba(255,183,107,.3);background:rgba(255,183,107,.07);color:#FFB76B">Rp ' + fmt(total) + '</span></div></div></div>';

  /* KPI strip */
  var byStatus = {};
  refunds.forEach(function(r) { var s = r.status||'Proses'; byStatus[s]=(byStatus[s]||0)+1; });
  h += '<div style="display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:8px;margin-bottom:12px">';
  [['Total Refund', refunds.length, '#8FD0FF'], ['Proses', byStatus['Proses']||0, '#FFB76B'], ['Selesai', byStatus['Selesai']||0, '#A7F3B6'], ['Ditolak', byStatus['Ditolak']||0, '#FF9D9D']].forEach(function(k) {
    h += '<div class="card" style="margin-bottom:0;background:var(--bg3);padding:10px"><div style="font-size:10px;font-weight:700;color:' + k[2] + ';text-transform:uppercase">' + k[0] + '</div><div style="font-size:20px;font-weight:800;color:var(--tx);margin-top:4px">' + k[1] + '</div></div>';
  });
  h += '</div>';

  /* Form tambah + Filter */
  h += '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:12px;margin-bottom:12px;align-items:start">';

  /* Form tambah */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Tambah Refund</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="lbl">Tanggal</label><input id="OPS-REF-DATE" class="fi" type="date" value="' + _todayYMD() + '"></div>';
  h += '<div><label class="lbl">Marketplace</label><select id="OPS-REF-MKT" class="fi"><option value="">Pilih</option>' + ['Shopee','Tokopedia','Lazada','TikTok','Lainnya'].map(function(m){ return '<option>'+m+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Nama / Pembeli</label><input id="OPS-REF-NAMA" class="fi" placeholder="Nama customer"></div>';
  h += '<div><label class="lbl">No. Order</label><input id="OPS-REF-ORDER" class="fi" placeholder="Order ID"></div>';
  h += '<div><label class="lbl">Nominal Refund</label><input id="OPS-REF-NOM" class="fi" type="number" placeholder="0"></div>';
  h += '<div><label class="lbl">Status</label><select id="OPS-REF-STATUS" class="fi"><option>Proses</option><option>Selesai</option><option>Ditolak</option></select></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Alasan / Catatan</label><input id="OPS-REF-NOTE" class="fi" placeholder="Keterangan refund"></div>';
  h += '</div><div style="margin-top:10px;display:flex;justify-content:flex-end">';
  h += '<button class="btnp" onclick="_opsAddRefund()" style="background:#CC0000">Simpan Refund</button></div></div>';

  /* Filter */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Filter</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  h += '<div><label class="lbl">Status</label><select id="OPS-REF-FLT-ST" class="fi" onchange="window._opsRefundFilter.status=this.value;_renderOperasional(\'refund\')">' + statuses.map(function(s){ return '<option value="'+s+'"'+(filter.status===s?' selected':'')+'>'+( s||'Semua Status')+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Marketplace</label><select id="OPS-REF-FLT-MKT" class="fi" onchange="window._opsRefundFilter.marketplace=this.value;_renderOperasional(\'refund\')">' + marketplaces.map(function(m){ return '<option value="'+m+'"'+(filter.marketplace===m?' selected':'')+'>'+( m||'Semua Marketplace')+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Keyword</label><input id="OPS-REF-FLT-KEY" class="fi" value="' + escAttr(filter.keyword||'') + '" placeholder="Nama / order / catatan" oninput="window._opsRefundFilter.keyword=this.value;_renderOperasional(\'refund\')"></div>';
  h += '<button class="btns" onclick="window._opsRefundFilter={status:\'\',marketplace:\'\',keyword:\'\'};_renderOperasional(\'refund\')">Reset Filter</button></div></div>';
  h += '</div>'; /* end grid */

  /* Table */
  h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">';
  h += '<div><div style="font-size:13px;font-weight:800;color:var(--tx)">Daftar Refund</div>';
  h += '<div style="font-size:10px;color:var(--tx2);margin-top:3px">' + rows.length + ' baris · Rp ' + fmt(filtered) + '</div></div></div>';
  h += '<div style="overflow-x:auto"><table class="tbl" style="min-width:780px"><thead><tr>';
  h += '<th>Tanggal</th><th>Marketplace</th><th>Nama / Pembeli</th><th>No. Order</th><th>Nominal</th><th>Status</th><th>Catatan</th><th class="c">Aksi</th></tr></thead><tbody>';
  rows.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).forEach(function(r) {
    var sc = r.status==='Selesai' ? '#A7F3B6' : r.status==='Ditolak' ? '#FF9D9D' : '#FFB76B';
    h += '<tr><td>' + esc(r.tanggal||'-') + '</td><td>' + esc(r.marketplace||'-') + '</td>';
    h += '<td style="font-weight:700">' + esc(r.nama||r.pembeli||'-') + '</td>';
    h += '<td>' + esc(r.noOrder||'-') + '</td>';
    h += '<td style="font-weight:800;color:#FF9D9D">Rp ' + fmt(_num(r.nominal)) + '</td>';
    h += '<td><span style="color:' + sc + ';font-weight:700;font-size:10px">' + esc(r.status||'Proses') + '</span></td>';
    h += '<td>' + esc(r.catatan||'-') + '</td>';
    h += '<td class="c"><button class="btns" onclick="_opsDeleteRefund(\'' + escAttr(r.id) + '\')" style="padding:4px 8px;color:#FF9D9D;font-size:10px;border-color:rgba(255,120,120,.3)">Hapus</button></td></tr>';
  });
  if (!rows.length) h += '<tr><td colspan="8" style="text-align:center;color:var(--tx3);padding:20px">Belum ada refund pada filter ini.</td></tr>';
  h += '</tbody></table></div></div>';
  return h;
}

function _opsAddRefund() {
  var g = function(id) { return ((document.getElementById(id)||{}).value||'').trim(); };
  var rec = {
    id: 'ref_' + Date.now(),
    tanggal: g('OPS-REF-DATE') || _todayYMD(),
    marketplace: g('OPS-REF-MKT'),
    nama: g('OPS-REF-NAMA'),
    noOrder: g('OPS-REF-ORDER'),
    nominal: _num(g('OPS-REF-NOM')),
    status: g('OPS-REF-STATUS') || 'Proses',
    catatan: g('OPS-REF-NOTE'),
    ts: new Date().toISOString()
  };
  if (!rec.nama) { toast('Nama / pembeli wajib diisi', 'error'); return; }
  if (!rec.nominal) { toast('Nominal wajib diisi', 'error'); return; }
  if (typeof _toolRefunds !== 'undefined') { _toolRefunds.push(rec); }
  try { localStorage.setItem('ajw_tools_refunds', JSON.stringify(typeof _toolRefunds !== 'undefined' ? _toolRefunds : [])); } catch(e){}
  toast('Refund disimpan', 'success');
  _renderOperasional('refund');
}

function _opsDeleteRefund(id) {
  if (typeof _toolRefunds === 'undefined') return;
  var idx = _toolRefunds.findIndex(function(r){ return r.id === id; });
  if (idx < 0) return;
  _toolRefunds.splice(idx, 1);
  try { localStorage.setItem('ajw_tools_refunds', JSON.stringify(_toolRefunds)); } catch(e){}
  toast('Refund dihapus', 'success');
  _renderOperasional('refund');
}

/* ══════════════════════════════════════════════
   3. KOMPLAIN
   ══════════════════════════════════════════════ */
function _renderOpsKomplain() {
  var complaints = (typeof _toolComplaints !== 'undefined' ? _toolComplaints : []);
  var filter = window._opsKomplainFilter || {status:'', level:'', marketplace:'', keyword:''};
  window._opsKomplainFilter = filter;

  var rows = complaints.filter(function(r) {
    if (filter.status && String(r.status||'') !== filter.status) return false;
    if (filter.level && String(r.level||r.prioritas||'Normal') !== filter.level) return false;
    if (filter.marketplace && String(r.marketplace||'') !== filter.marketplace) return false;
    if (filter.keyword) {
      var hay = ((r.nama||'')+(r.judul||'')+(r.catatan||'')+(r.noOrder||'')).toLowerCase();
      if (hay.indexOf(filter.keyword.toLowerCase()) < 0) return false;
    }
    return true;
  });

  var statuses   = ['','Buka','Proses','Selesai','Eskalasi'];
  var levels     = ['','Rendah','Sedang','Tinggi','Urgent'];
  var mkts       = [''].concat(Array.from(new Set(complaints.map(function(r){ return r.marketplace||''; }).filter(Boolean))).sort());

  var byLevel = {};
  complaints.forEach(function(r){ var l = r.level||r.prioritas||'Normal'; byLevel[l]=(byLevel[l]||0)+1; });

  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">';
  h += '<div><div style="font-size:16px;font-weight:800;color:#FFB76B">Komplain Customer</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Pantau dan kelola semua komplain dari marketplace.</div></div>';
  h += '<span class="chip" style="border:1px solid rgba(255,183,107,.3);background:rgba(255,183,107,.07);color:#FFB76B">' + complaints.length + ' total</span></div></div>';

  h += '<div style="display:grid;grid-template-columns:repeat(5,minmax(100px,1fr));gap:8px;margin-bottom:12px">';
  var kpis = [['Total', complaints.length, '#8FD0FF'], ['Urgent', byLevel['Urgent']||0, '#FF9D9D'], ['Tinggi', byLevel['Tinggi']||0, '#FFB76B'], ['Sedang', byLevel['Sedang']||0, '#FFD68A'], ['Rendah', byLevel['Rendah']||byLevel['Normal']||0, '#A7F3B6']];
  kpis.forEach(function(k) {
    h += '<div class="card" style="margin-bottom:0;background:var(--bg3);padding:10px"><div style="font-size:10px;font-weight:700;color:' + k[2] + ';text-transform:uppercase">' + k[0] + '</div><div style="font-size:20px;font-weight:800;color:var(--tx);margin-top:4px">' + k[1] + '</div></div>';
  });
  h += '</div>';

  h += '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(260px,.9fr);gap:12px;margin-bottom:12px;align-items:start">';

  /* Form */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Tambah Komplain</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="lbl">Tanggal</label><input id="OPS-CMP-DATE" class="fi" type="date" value="' + _todayYMD() + '"></div>';
  h += '<div><label class="lbl">Marketplace</label><select id="OPS-CMP-MKT" class="fi"><option value="">Pilih</option>' + ['Shopee','Tokopedia','Lazada','TikTok','Lainnya'].map(function(m){ return '<option>'+m+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Nama / Pembeli</label><input id="OPS-CMP-NAMA" class="fi" placeholder="Nama customer"></div>';
  h += '<div><label class="lbl">No. Order</label><input id="OPS-CMP-ORDER" class="fi" placeholder="Order ID"></div>';
  h += '<div><label class="lbl">Judul Komplain</label><input id="OPS-CMP-JUDUL" class="fi" placeholder="Deskripsi singkat"></div>';
  h += '<div><label class="lbl">Level Prioritas</label><select id="OPS-CMP-LEVEL" class="fi"><option>Rendah</option><option>Sedang</option><option>Tinggi</option><option>Urgent</option></select></div>';
  h += '<div><label class="lbl">Status</label><select id="OPS-CMP-STATUS" class="fi"><option>Buka</option><option>Proses</option><option>Selesai</option><option>Eskalasi</option></select></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Catatan</label><input id="OPS-CMP-NOTE" class="fi" placeholder="Detail komplain"></div>';
  h += '</div><div style="margin-top:10px;display:flex;justify-content:flex-end"><button class="btnp" onclick="_opsAddKomplain()" style="background:#B45309">Simpan Komplain</button></div></div>';

  /* Filter */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Filter</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  h += '<div><label class="lbl">Status</label><select class="fi" onchange="window._opsKomplainFilter.status=this.value;_renderOperasional(\'komplain\')">' + statuses.map(function(s){ return '<option value="'+s+'"'+(filter.status===s?' selected':'')+'>'+( s||'Semua Status')+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Level</label><select class="fi" onchange="window._opsKomplainFilter.level=this.value;_renderOperasional(\'komplain\')">' + levels.map(function(l){ return '<option value="'+l+'"'+(filter.level===l?' selected':'')+'>'+( l||'Semua Level')+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Marketplace</label><select class="fi" onchange="window._opsKomplainFilter.marketplace=this.value;_renderOperasional(\'komplain\')">' + mkts.map(function(m){ return '<option value="'+m+'"'+(filter.marketplace===m?' selected':'')+'>'+( m||'Semua Marketplace')+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Keyword</label><input class="fi" value="' + escAttr(filter.keyword||'') + '" placeholder="Nama / judul / catatan" oninput="window._opsKomplainFilter.keyword=this.value;_renderOperasional(\'komplain\')"></div>';
  h += '<button class="btns" onclick="window._opsKomplainFilter={status:\'\',level:\'\',marketplace:\'\',keyword:\'\'};_renderOperasional(\'komplain\')">Reset</button></div></div>';
  h += '</div>';

  /* Table */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Daftar Komplain <span style="font-size:11px;color:var(--tx2);font-weight:400">(' + rows.length + ' baris)</span></div>';
  h += '<div style="overflow-x:auto"><table class="tbl" style="min-width:800px"><thead><tr>';
  h += '<th>Tanggal</th><th>Marketplace</th><th>Customer</th><th>Judul</th><th>Level</th><th>Status</th><th>Catatan</th><th class="c">Aksi</th></tr></thead><tbody>';
  rows.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).forEach(function(r) {
    var lvl = r.level||r.prioritas||'Normal';
    var lc = lvl==='Urgent'?'#FF9D9D': lvl==='Tinggi'?'#FFB76B': lvl==='Sedang'?'#FFD68A':'#A7F3B6';
    var sc = r.status==='Selesai'?'#A7F3B6': r.status==='Eskalasi'?'#FF9D9D':'#8FD0FF';
    h += '<tr><td>' + esc(r.tanggal||'-') + '</td><td>' + esc(r.marketplace||'-') + '</td>';
    h += '<td style="font-weight:700">' + esc(r.nama||r.pembeli||'-') + '</td>';
    h += '<td>' + esc(r.judul||'-') + '</td>';
    h += '<td><span style="color:' + lc + ';font-weight:700;font-size:10px">' + esc(lvl) + '</span></td>';
    h += '<td><span style="color:' + sc + ';font-weight:700;font-size:10px">' + esc(r.status||'Buka') + '</span></td>';
    h += '<td>' + esc(r.catatan||'-') + '</td>';
    h += '<td class="c"><button class="btns" onclick="_opsDeleteKomplain(\'' + escAttr(r.id) + '\')" style="padding:4px 8px;color:#FF9D9D;font-size:10px;border-color:rgba(255,120,120,.3)">Hapus</button></td></tr>';
  });
  if (!rows.length) h += '<tr><td colspan="8" style="text-align:center;color:var(--tx3);padding:20px">Belum ada komplain pada filter ini.</td></tr>';
  h += '</tbody></table></div></div>';
  return h;
}

function _opsAddKomplain() {
  var g = function(id) { return ((document.getElementById(id)||{}).value||'').trim(); };
  var rec = {
    id: 'cmp_' + Date.now(),
    tanggal: g('OPS-CMP-DATE') || _todayYMD(),
    marketplace: g('OPS-CMP-MKT'),
    nama: g('OPS-CMP-NAMA'),
    noOrder: g('OPS-CMP-ORDER'),
    judul: g('OPS-CMP-JUDUL'),
    level: g('OPS-CMP-LEVEL') || 'Rendah',
    status: g('OPS-CMP-STATUS') || 'Buka',
    catatan: g('OPS-CMP-NOTE'),
    ts: new Date().toISOString()
  };
  if (!rec.judul && !rec.nama) { toast('Judul / nama wajib diisi', 'error'); return; }
  if (typeof _toolComplaints !== 'undefined') { _toolComplaints.push(rec); }
  try { localStorage.setItem('ajw_tools_complaints', JSON.stringify(typeof _toolComplaints !== 'undefined' ? _toolComplaints : [])); } catch(e){}
  toast('Komplain disimpan', 'success');
  _renderOperasional('komplain');
}

function _opsDeleteKomplain(id) {
  if (typeof _toolComplaints === 'undefined') return;
  var idx = _toolComplaints.findIndex(function(r){ return r.id === id; });
  if (idx < 0) return;
  _toolComplaints.splice(idx, 1);
  try { localStorage.setItem('ajw_tools_complaints', JSON.stringify(_toolComplaints)); } catch(e){}
  toast('Komplain dihapus', 'success');
  _renderOperasional('komplain');
}

/* ══════════════════════════════════════════════
   4. REQUEST
   ══════════════════════════════════════════════ */
function _renderOpsRequest() {
  var requests = (typeof _toolRequests !== 'undefined' ? _toolRequests : []);
  var filter = window._opsRequestFilter || {status:'', tipe:'', keyword:''};
  window._opsRequestFilter = filter;

  var rows = requests.filter(function(r) {
    if (filter.status && String(r.status||'') !== filter.status) return false;
    if (filter.tipe && String(r.tipe||r.kategori||'') !== filter.tipe) return false;
    if (filter.keyword) {
      var hay = ((r.judul||'')+(r.nama||'')+(r.catatan||'')+(r.requestor||'')).toLowerCase();
      if (hay.indexOf(filter.keyword.toLowerCase()) < 0) return false;
    }
    return true;
  });

  var types = [''].concat(Array.from(new Set(requests.map(function(r){ return r.tipe||r.kategori||''; }).filter(Boolean))).sort());
  var statuses = ['','Open','Proses','Done','Cancel'];

  var byStatus = {};
  requests.forEach(function(r){ var s = r.status||'Open'; byStatus[s]=(byStatus[s]||0)+1; });

  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">';
  h += '<div><div style="font-size:16px;font-weight:800;color:#8FD0FF">Request Operasional</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Kelola semua permintaan operasional internal dan eksternal.</div></div>';
  h += '<span class="chip" style="border:1px solid rgba(143,208,255,.3);background:rgba(143,208,255,.07);color:#8FD0FF">' + requests.length + ' total</span></div></div>';

  h += '<div style="display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:8px;margin-bottom:12px">';
  [['Open', byStatus['Open']||0, '#FFB76B'], ['Proses', byStatus['Proses']||0, '#8FD0FF'], ['Done', byStatus['Done']||0, '#A7F3B6'], ['Cancel', byStatus['Cancel']||0, '#FF9D9D']].forEach(function(k) {
    h += '<div class="card" style="margin-bottom:0;background:var(--bg3);padding:10px"><div style="font-size:10px;font-weight:700;color:' + k[2] + ';text-transform:uppercase">' + k[0] + '</div><div style="font-size:20px;font-weight:800;color:var(--tx);margin-top:4px">' + k[1] + '</div></div>';
  });
  h += '</div>';

  h += '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(260px,.9fr);gap:12px;margin-bottom:12px;align-items:start">';

  /* Form */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Tambah Request</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="lbl">Tanggal</label><input id="OPS-REQ-DATE" class="fi" type="date" value="' + _todayYMD() + '"></div>';
  h += '<div><label class="lbl">Tipe / Kategori</label><input id="OPS-REQ-TIPE" class="fi" placeholder="Pembelian / Perbaikan / Lainnya"></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Judul Request</label><input id="OPS-REQ-JUDUL" class="fi" placeholder="Deskripsi singkat request"></div>';
  h += '<div><label class="lbl">Requestor</label><input id="OPS-REQ-REQ" class="fi" placeholder="Nama pengaju"></div>';
  h += '<div><label class="lbl">Status</label><select id="OPS-REQ-STATUS" class="fi"><option>Open</option><option>Proses</option><option>Done</option><option>Cancel</option></select></div>';
  h += '<div><label class="lbl">Deadline</label><input id="OPS-REQ-DL" class="fi" type="date"></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Catatan</label><input id="OPS-REQ-NOTE" class="fi" placeholder="Detail request"></div>';
  h += '</div><div style="margin-top:10px;display:flex;justify-content:flex-end"><button class="btnp" onclick="_opsAddRequest()">Simpan Request</button></div></div>';

  /* Filter */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Filter</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  h += '<div><label class="lbl">Status</label><select class="fi" onchange="window._opsRequestFilter.status=this.value;_renderOperasional(\'request\')">' + statuses.map(function(s){ return '<option value="'+s+'"'+(filter.status===s?' selected':'')+'>'+( s||'Semua Status')+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Tipe</label><select class="fi" onchange="window._opsRequestFilter.tipe=this.value;_renderOperasional(\'request\')">' + types.map(function(t){ return '<option value="'+t+'"'+(filter.tipe===t?' selected':'')+'>'+( t||'Semua Tipe')+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Keyword</label><input class="fi" value="' + escAttr(filter.keyword||'') + '" placeholder="Judul / requestor" oninput="window._opsRequestFilter.keyword=this.value;_renderOperasional(\'request\')"></div>';
  h += '<button class="btns" onclick="window._opsRequestFilter={status:\'\',tipe:\'\',keyword:\'\'};_renderOperasional(\'request\')">Reset</button></div></div>';
  h += '</div>';

  /* Table */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Daftar Request <span style="font-size:11px;color:var(--tx2);font-weight:400">(' + rows.length + ' baris)</span></div>';
  h += '<div style="overflow-x:auto"><table class="tbl" style="min-width:800px"><thead><tr>';
  h += '<th>Tanggal</th><th>Tipe</th><th>Judul</th><th>Requestor</th><th>Deadline</th><th>Status</th><th>Catatan</th><th class="c">Aksi</th></tr></thead><tbody>';
  rows.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).forEach(function(r) {
    var sc = r.status==='Done'?'#A7F3B6': r.status==='Cancel'?'#FF9D9D': r.status==='Proses'?'#8FD0FF':'#FFB76B';
    h += '<tr><td>' + esc(r.tanggal||'-') + '</td><td>' + esc(r.tipe||r.kategori||'-') + '</td>';
    h += '<td style="font-weight:700">' + esc(r.judul||r.nama||'-') + '</td>';
    h += '<td>' + esc(r.requestor||'-') + '</td>';
    h += '<td>' + esc(r.deadline||'-') + '</td>';
    h += '<td><span style="color:' + sc + ';font-weight:700;font-size:10px">' + esc(r.status||'Open') + '</span></td>';
    h += '<td>' + esc(r.catatan||'-') + '</td>';
    h += '<td class="c" style="white-space:nowrap"><button class="btns" onclick="_opsToggleRequest(\'' + escAttr(r.id) + '\')" style="padding:4px 8px;font-size:10px;margin-right:4px">Toggle Done</button><button class="btns" onclick="_opsDeleteRequest(\'' + escAttr(r.id) + '\')" style="padding:4px 8px;color:#FF9D9D;font-size:10px;border-color:rgba(255,120,120,.3)">Hapus</button></td></tr>';
  });
  if (!rows.length) h += '<tr><td colspan="8" style="text-align:center;color:var(--tx3);padding:20px">Belum ada request pada filter ini.</td></tr>';
  h += '</tbody></table></div></div>';
  return h;
}

function _opsAddRequest() {
  var g = function(id) { return ((document.getElementById(id)||{}).value||'').trim(); };
  var rec = {
    id: 'req_' + Date.now(),
    tanggal: g('OPS-REQ-DATE') || _todayYMD(),
    tipe: g('OPS-REQ-TIPE'),
    judul: g('OPS-REQ-JUDUL'),
    requestor: g('OPS-REQ-REQ'),
    status: g('OPS-REQ-STATUS') || 'Open',
    deadline: g('OPS-REQ-DL'),
    catatan: g('OPS-REQ-NOTE'),
    ts: new Date().toISOString()
  };
  if (!rec.judul) { toast('Judul request wajib diisi', 'error'); return; }
  if (typeof _toolRequests !== 'undefined') { _toolRequests.push(rec); }
  try { localStorage.setItem('ajw_tools_requests', JSON.stringify(typeof _toolRequests !== 'undefined' ? _toolRequests : [])); } catch(e){}
  toast('Request disimpan', 'success');
  _renderOperasional('request');
}

function _opsToggleRequest(id) {
  if (typeof _toolRequests === 'undefined') return;
  var r = _toolRequests.find(function(x){ return x.id === id; });
  if (!r) return;
  r.status = r.status === 'Done' ? 'Open' : 'Done';
  r.updatedAt = new Date().toISOString();
  try { localStorage.setItem('ajw_tools_requests', JSON.stringify(_toolRequests)); } catch(e){}
  toast('Status diperbarui', 'success');
  _renderOperasional('request');
}

function _opsDeleteRequest(id) {
  if (typeof _toolRequests === 'undefined') return;
  var idx = _toolRequests.findIndex(function(r){ return r.id === id; });
  if (idx < 0) return;
  _toolRequests.splice(idx, 1);
  try { localStorage.setItem('ajw_tools_requests', JSON.stringify(_toolRequests)); } catch(e){}
  toast('Request dihapus', 'success');
  _renderOperasional('request');
}

/* ══════════════════════════════════════════════
   5. BLAST KONFIRMASI CUSTOMER
   ══════════════════════════════════════════════ */
function _renderOpsBlast() {
  var blastSub = window._opsBlastSub || 'dashboard';

  var subTabs = [
    ['dashboard', 'Dashboard'],
    ['kirim',     'Kirim Blast'],
    ['history',   'History'],
    ['template',  'Template'],
    ['statistik', 'Statistik']
  ];

  var h = '';
  h += '<div class="card" style="margin-bottom:10px"><div style="display:flex;gap:6px;flex-wrap:wrap">';
  subTabs.forEach(function(s) {
    h += '<button class="' + (blastSub === s[0] ? 'btnp' : 'btns') + '" onclick="window._opsBlastSub=\'' + s[0] + '\';_renderOperasional(\'blast\')" style="padding:6px 11px;font-size:11px">' + s[1] + '</button>';
  });
  h += '</div></div>';

  if (blastSub === 'dashboard') h += _renderOpsBlastDash();
  else if (blastSub === 'kirim') h += _renderOpsBlastKirim();
  else if (blastSub === 'history') h += _renderOpsBlastHistory();
  else if (blastSub === 'template') h += _renderOpsBlastTemplate();
  else if (blastSub === 'statistik') h += _renderOpsBlastStatistik();
  return h;
}

function _renderOpsBlastDash() {
  var total = _opsBlastHistory.length;
  var ok  = _opsBlastHistory.filter(function(r){ return r.status==='terkirim'; }).length;
  var pend= _opsBlastHistory.filter(function(r){ return r.status==='pending'; }).length;
  var fail= _opsBlastHistory.filter(function(r){ return r.status==='gagal'; }).length;
  var rate = total > 0 ? ((ok / total) * 100).toFixed(1) : '0.0';

  var today7 = new Date(Date.now() - 7*86400000).toISOString();
  var recent = _opsBlastHistory.filter(function(r){ return r.ts >= today7; });
  var recentOK = recent.filter(function(r){ return r.status==='terkirim'; }).length;
  var recentFail = recent.filter(function(r){ return r.status==='gagal'; }).length;

  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px;background:linear-gradient(135deg,rgba(167,243,182,.06),rgba(143,208,255,.04))">';
  h += '<div style="font-size:16px;font-weight:800;color:#A7F3B6">Blast Konfirmasi Customer</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Kirim blast konfirmasi pesanan, pembayaran, dan informasi ke customer berbagai marketplace.</div></div>';

  h += '<div style="display:grid;grid-template-columns:repeat(6,minmax(110px,1fr));gap:8px;margin-bottom:12px">';
  [
    ['Total Blast', total, '#8FD0FF'],
    ['Terkirim', ok, '#A7F3B6'],
    ['Pending', pend, '#FFD68A'],
    ['Gagal', fail, '#FF9D9D'],
    ['Success Rate', rate+'%', '#D796FF'],
    ['7 Hari OK', recentOK, '#A7F3B6']
  ].forEach(function(k) {
    h += '<div class="card" style="margin-bottom:0;background:var(--bg3);padding:10px"><div style="font-size:10px;font-weight:700;color:' + k[2] + ';text-transform:uppercase;letter-spacing:.05em">' + k[0] + '</div><div style="font-size:20px;font-weight:800;color:var(--tx);margin-top:4px">' + k[1] + '</div></div>';
  });
  h += '</div>';

  /* Quick actions */
  h += '<div class="card" style="margin-bottom:12px"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Aksi Cepat</div>';
  h += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
  h += '<button class="btnp" onclick="window._opsBlastSub=\'kirim\';_renderOperasional(\'blast\')" style="background:#0F9D58">Kirim Blast Baru</button>';
  h += '<button class="btnp" onclick="window._opsBlastSub=\'template\';_renderOperasional(\'blast\')" style="background:#1565C0">Kelola Template</button>';
  if (fail > 0 || pend > 0) {
    h += '<button class="btnp" onclick="_opsBlastResendFailed()" style="background:#CC0000">Resend Gagal/Pending (' + (fail+pend) + ')</button>';
  }
  h += '</div></div>';

  /* Recent blasts */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Blast Terbaru</div>';
  if (_opsBlastHistory.length) {
    h += '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Waktu</th><th>Customer</th><th>Marketplace</th><th>Template</th><th>Status</th><th class="c">Resend</th></tr></thead><tbody>';
    _opsBlastHistory.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).slice(0,8).forEach(function(r) {
      var sc = r.status==='terkirim'?'#A7F3B6': r.status==='gagal'?'#FF9D9D':'#FFD68A';
      h += '<tr><td style="white-space:nowrap">' + esc(r.ts ? new Date(r.ts).toLocaleString('id-ID') : '-') + '</td>';
      h += '<td style="font-weight:700">' + esc(r.customer||'-') + '</td>';
      h += '<td>' + esc(r.marketplace||'-') + '</td>';
      h += '<td>' + esc(r.templateName||'-') + '</td>';
      h += '<td><span style="color:' + sc + ';font-weight:700;font-size:10px">' + esc(r.status||'-') + '</span></td>';
      h += '<td class="c"><button class="btns" onclick="_opsBlastResendOne(\'' + escAttr(r.id) + '\')" style="padding:4px 8px;font-size:10px">Resend</button></td></tr>';
    });
    h += '</tbody></table></div>';
  } else {
    h += '<div style="color:var(--tx3);text-align:center;padding:20px;font-size:11px">Belum ada blast terkirim.</div>';
  }
  h += '</div>';
  return h;
}

function _renderOpsBlastKirim() {
  var tplOptions = _opsBlastTemplates.map(function(t,i){ return '<option value="' + i + '">' + esc(t.nama) + '</option>'; }).join('');
  var h = '';
  h += '<div class="card" style="margin-bottom:12px"><div style="font-size:14px;font-weight:800;color:var(--tx);margin-bottom:10px">Kirim Blast Konfirmasi</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">';
  h += '<div><label class="lbl">Nama Customer</label><input id="BL-CUSTOMER" class="fi" placeholder="Nama / username"></div>';
  h += '<div><label class="lbl">Marketplace</label><select id="BL-MKT" class="fi"><option value="">Pilih Marketplace</option>' + ['Shopee','Tokopedia','Lazada','TikTok','WhatsApp','Lainnya'].map(function(m){ return '<option>'+m+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">No. Order</label><input id="BL-ORDER" class="fi" placeholder="Order ID / referensi"></div>';
  h += '<div><label class="lbl">Template</label><select id="BL-TPL" class="fi" onchange="_opsBlastFillTemplate(this.value)"><option value="">Pilih Template</option>' + tplOptions + '</select></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Pesan Blast</label><textarea id="BL-MSG" class="fi" rows="5" placeholder="Tulis pesan konfirmasi atau pilih template di atas..."></textarea></div>';
  h += '<div><label class="lbl">Status Awal</label><select id="BL-STATUS" class="fi"><option value="terkirim">Terkirim</option><option value="pending">Pending</option><option value="gagal">Gagal</option></select></div>';
  h += '<div><label class="lbl">Catatan</label><input id="BL-NOTE" class="fi" placeholder="Keterangan tambahan"></div>';
  h += '</div>';
  h += '<div style="display:flex;gap:8px;margin-top:12px">';
  h += '<button class="btnp" onclick="_opsBlastSend()" style="background:#0F9D58">Kirim & Simpan</button>';
  h += '<button class="btns" onclick="_opsBlastPreview()">Preview Pesan</button>';
  h += '</div></div>';

  if (!_opsBlastTemplates.length) {
    h += '<div class="card" style="background:rgba(255,183,107,.05);border:1px solid rgba(255,183,107,.2)">';
    h += '<div style="font-size:12px;color:#FFB76B;font-weight:700">Tip: Tambahkan template di tab Template untuk pengiriman cepat.</div></div>';
  }
  return h;
}

function _renderOpsBlastHistory() {
  var filter = window._opsBlastHisFilter || {status:'', marketplace:''};
  window._opsBlastHisFilter = filter;
  var rows = _opsBlastHistory.filter(function(r) {
    if (filter.status && r.status !== filter.status) return false;
    if (filter.marketplace && r.marketplace !== filter.marketplace) return false;
    return true;
  });
  var mkts = [''].concat(Array.from(new Set(_opsBlastHistory.map(function(r){ return r.marketplace||''; }).filter(Boolean))).sort());

  var h = '';
  h += '<div class="card" style="margin-bottom:12px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">';
  h += '<label class="lbl" style="margin:0">Status:</label>';
  ['','terkirim','pending','gagal'].forEach(function(s) {
    h += '<button class="' + (filter.status===s?'btnp':'btns') + '" onclick="window._opsBlastHisFilter.status=\'' + s + '\';_renderOperasional(\'blast\')" style="padding:5px 10px;font-size:11px">' + (s||'Semua') + '</button>';
  });
  h += '<label class="lbl" style="margin:0;margin-left:8px">Marketplace:</label>';
  h += '<select class="fi" style="width:auto;padding:5px 8px;font-size:11px" onchange="window._opsBlastHisFilter.marketplace=this.value;_renderOperasional(\'blast\')">' + mkts.map(function(m){ return '<option value="'+m+'"'+(filter.marketplace===m?' selected':'')+'>'+( m||'Semua')+'</option>'; }).join('') + '</select>';
  h += '<button class="btns" onclick="window._opsBlastHisFilter={status:\'\',marketplace:\'\'};_renderOperasional(\'blast\')" style="font-size:11px;padding:5px 10px">Reset</button></div></div>';

  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">History Blast <span style="font-size:11px;color:var(--tx2);font-weight:400">(' + rows.length + ' blast)</span></div>';
  h += '<div style="overflow-x:auto"><table class="tbl" style="min-width:820px"><thead><tr>';
  h += '<th>Waktu</th><th>Customer</th><th>Marketplace</th><th>No. Order</th><th>Template</th><th>Status</th><th>Catatan</th><th class="c">Aksi</th></tr></thead><tbody>';
  rows.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).forEach(function(r) {
    var sc = r.status==='terkirim'?'#A7F3B6': r.status==='gagal'?'#FF9D9D':'#FFD68A';
    h += '<tr><td style="white-space:nowrap;font-size:10px">' + esc(r.ts ? new Date(r.ts).toLocaleString('id-ID') : '-') + '</td>';
    h += '<td style="font-weight:700">' + esc(r.customer||'-') + '</td>';
    h += '<td>' + esc(r.marketplace||'-') + '</td>';
    h += '<td>' + esc(r.noOrder||'-') + '</td>';
    h += '<td>' + esc(r.templateName||'-') + '</td>';
    h += '<td><span style="color:' + sc + ';font-weight:700;font-size:10px">' + esc(r.status||'-') + '</span></td>';
    h += '<td style="font-size:10px;max-width:180px">' + esc((r.catatan||'').slice(0,60)) + (r.catatan&&r.catatan.length>60?'...':'') + '</td>';
    h += '<td class="c" style="white-space:nowrap"><button class="btns" onclick="_opsBlastResendOne(\'' + escAttr(r.id) + '\')" style="padding:4px 8px;font-size:10px;margin-right:4px">Resend</button>';
    h += '<button class="btns" onclick="_opsBlastDelete(\'' + escAttr(r.id) + '\')" style="padding:4px 8px;font-size:10px;color:#FF9D9D;border-color:rgba(255,120,120,.3)">Hapus</button></td></tr>';
  });
  if (!rows.length) h += '<tr><td colspan="8" style="text-align:center;color:var(--tx3);padding:20px">Belum ada history blast.</td></tr>';
  h += '</tbody></table></div></div>';
  return h;
}

function _renderOpsBlastTemplate() {
  var h = '';
  h += '<div class="card" style="margin-bottom:12px"><div style="font-size:14px;font-weight:800;color:var(--tx);margin-bottom:10px">Tambah Template Blast</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="lbl">Nama Template</label><input id="BL-TPL-NAMA" class="fi" placeholder="Konfirmasi Pembayaran / Pengiriman"></div>';
  h += '<div><label class="lbl">Kategori</label><select id="BL-TPL-CAT" class="fi"><option>Konfirmasi Order</option><option>Konfirmasi Pembayaran</option><option>Info Pengiriman</option><option>Follow Up</option><option>Lainnya</option></select></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Isi Template</label><textarea id="BL-TPL-BODY" class="fi" rows="5" placeholder="Halo {nama}, pesanan #{noOrder} sudah dikonfirmasi..."></textarea></div>';
  h += '<div style="grid-column:1/-1;font-size:10px;color:var(--tx2)">Variabel tersedia: {nama} {noOrder} {marketplace} {tanggal} {nominal}</div>';
  h += '</div><div style="margin-top:10px;display:flex;justify-content:flex-end"><button class="btnp" onclick="_opsBlastSaveTemplate()">Simpan Template</button></div></div>';

  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Daftar Template <span style="font-size:11px;color:var(--tx2);font-weight:400">(' + _opsBlastTemplates.length + ')</span></div>';
  if (_opsBlastTemplates.length) {
    _opsBlastTemplates.forEach(function(t, idx) {
      h += '<div style="background:var(--bg3);border:1px solid var(--bd);border-radius:8px;padding:10px 12px;margin-bottom:8px">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">';
      h += '<div><div style="font-size:12px;font-weight:800;color:var(--tx)">' + esc(t.nama) + '</div>';
      h += '<div style="font-size:10px;color:var(--tx2);margin-top:3px">' + esc(t.kategori||'-') + '</div>';
      h += '<div style="font-size:11px;color:var(--tx2);margin-top:6px;line-height:1.5">' + esc((t.body||'').slice(0,100)) + (t.body&&t.body.length>100?'...':'') + '</div></div>';
      h += '<div style="display:flex;gap:6px;flex-shrink:0">';
      h += '<button class="btns" onclick="window._opsBlastSub=\'kirim\';document.getElementById&&(window._opsBlastPreloadTpl=' + idx + ');_renderOperasional(\'blast\')" style="font-size:10px;padding:5px 8px">Pakai</button>';
      h += '<button class="btns" onclick="_opsBlastDeleteTemplate(' + idx + ')" style="font-size:10px;padding:5px 8px;color:#FF9D9D;border-color:rgba(255,120,120,.3)">Hapus</button></div></div></div>';
    });
  } else {
    h += '<div style="color:var(--tx3);text-align:center;padding:20px;font-size:11px">Belum ada template. Tambahkan di atas.</div>';
  }
  h += '</div>';
  return h;
}

function _renderOpsBlastStatistik() {
  var byMkt = {}, byStatus = {}, byTpl = {};
  _opsBlastHistory.forEach(function(r) {
    var m = r.marketplace||'Lainnya';
    byMkt[m] = (byMkt[m]||0) + 1;
    byStatus[r.status||'pending'] = (byStatus[r.status||'pending']||0) + 1;
    var t = r.templateName||'Manual';
    byTpl[t] = (byTpl[t]||0) + 1;
  });
  var total = _opsBlastHistory.length || 1;

  var h = '';
  h += '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">';

  h += '<div class="card" style="margin-bottom:0"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Per Marketplace</div>';
  Object.keys(byMkt).sort(function(a,b){ return byMkt[b]-byMkt[a]; }).forEach(function(m) {
    var pct = (byMkt[m]/total*100).toFixed(1);
    h += '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:11px;color:var(--tx)">' + esc(m) + '</span><span style="font-size:11px;color:var(--tx2)">' + byMkt[m] + ' (' + pct + '%)</span></div>';
    h += '<div style="height:6px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:#8FD0FF"></div></div></div>';
  });
  if (!Object.keys(byMkt).length) h += '<div style="color:var(--tx3);text-align:center;padding:16px;font-size:11px">Belum ada data.</div>';
  h += '</div>';

  h += '<div class="card" style="margin-bottom:0"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Per Status</div>';
  var statusColors = {terkirim:'#A7F3B6', pending:'#FFD68A', gagal:'#FF9D9D'};
  Object.keys(byStatus).forEach(function(s) {
    var pct = (byStatus[s]/total*100).toFixed(1);
    var c = statusColors[s] || '#8FD0FF';
    h += '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:11px;color:' + c + ';font-weight:700">' + esc(s) + '</span><span style="font-size:11px;color:var(--tx2)">' + byStatus[s] + ' (' + pct + '%)</span></div>';
    h += '<div style="height:6px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:' + c + '"></div></div></div>';
  });
  if (!Object.keys(byStatus).length) h += '<div style="color:var(--tx3);text-align:center;padding:16px;font-size:11px">Belum ada data.</div>';
  h += '</div>';

  h += '<div class="card" style="margin-bottom:0"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Per Template</div>';
  Object.keys(byTpl).sort(function(a,b){ return byTpl[b]-byTpl[a]; }).slice(0,6).forEach(function(t) {
    var pct = (byTpl[t]/total*100).toFixed(1);
    h += '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:11px;color:var(--tx)">' + esc(t) + '</span><span style="font-size:11px;color:var(--tx2)">' + byTpl[t] + ' (' + pct + '%)</span></div>';
    h += '<div style="height:6px;background:rgba(255,255,255,.06);border-radius:999px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:#D796FF"></div></div></div>';
  });
  if (!Object.keys(byTpl).length) h += '<div style="color:var(--tx3);text-align:center;padding:16px;font-size:11px">Belum ada data.</div>';
  h += '</div>';

  h += '</div>';
  return h;
}

/* Blast action helpers */
function _opsBlastSend() {
  var g = function(id) { return ((document.getElementById(id)||{}).value||'').trim(); };
  var rec = {
    id: 'blast_' + Date.now(),
    customer: g('BL-CUSTOMER'),
    marketplace: g('BL-MKT'),
    noOrder: g('BL-ORDER'),
    pesan: g('BL-MSG'),
    templateName: (document.getElementById('BL-TPL')||{}).selectedOptions ? ((document.getElementById('BL-TPL').selectedOptions[0])||{}).text||'' : '',
    status: g('BL-STATUS') || 'terkirim',
    catatan: g('BL-NOTE'),
    ts: new Date().toISOString()
  };
  if (!rec.customer) { toast('Nama customer wajib diisi', 'error'); return; }
  if (!rec.pesan) { toast('Pesan blast wajib diisi', 'error'); return; }
  _opsBlastHistory.unshift(rec);
  _opsSaveBlast();
  toast('Blast disimpan' + (rec.status==='terkirim'?' · Terkirim':rec.status==='pending'?' · Pending':' · Gagal'), 'success');
  window._opsBlastSub = 'history';
  _renderOperasional('blast');
}

function _opsBlastPreview() {
  var msg = ((document.getElementById('BL-MSG')||{}).value||'').trim();
  if (!msg) { toast('Tulis pesan terlebih dahulu', 'warn'); return; }
  alert('Preview Pesan:\n\n' + msg);
}

function _opsBlastFillTemplate(idx) {
  if (idx === '' || !_opsBlastTemplates[idx]) return;
  var tpl = _opsBlastTemplates[parseInt(idx)];
  var el = document.getElementById('BL-MSG');
  if (el && tpl.body) el.value = tpl.body;
}

function _opsBlastSaveTemplate() {
  var g = function(id) { return ((document.getElementById(id)||{}).value||'').trim(); };
  var tpl = { nama: g('BL-TPL-NAMA'), kategori: g('BL-TPL-CAT'), body: g('BL-TPL-BODY') };
  if (!tpl.nama) { toast('Nama template wajib diisi', 'error'); return; }
  if (!tpl.body) { toast('Isi template wajib diisi', 'error'); return; }
  _opsBlastTemplates.push(tpl);
  _opsSaveBlastTemplates();
  toast('Template disimpan', 'success');
  _renderOperasional('blast');
}

function _opsBlastDeleteTemplate(idx) {
  _opsBlastTemplates.splice(idx, 1);
  _opsSaveBlastTemplates();
  toast('Template dihapus', 'success');
  _renderOperasional('blast');
}

function _opsBlastDelete(id) {
  var idx = _opsBlastHistory.findIndex(function(r){ return r.id === id; });
  if (idx < 0) return;
  _opsBlastHistory.splice(idx, 1);
  _opsSaveBlast();
  toast('Blast dihapus', 'success');
  _renderOperasional('blast');
}

function _opsBlastResendOne(id) {
  var r = _opsBlastHistory.find(function(x){ return x.id === id; });
  if (!r) return;
  var newRec = Object.assign({}, r, { id: 'blast_' + Date.now(), status: 'terkirim', ts: new Date().toISOString(), catatan: 'Resend dari ' + (r.ts ? new Date(r.ts).toLocaleString('id-ID') : '-') });
  _opsBlastHistory.unshift(newRec);
  _opsSaveBlast();
  toast('Resend berhasil disimpan', 'success');
  _renderOperasional('blast');
}

function _opsBlastResendFailed() {
  var failed = _opsBlastHistory.filter(function(r){ return r.status==='gagal'||r.status==='pending'; });
  failed.forEach(function(r) {
    var newRec = Object.assign({}, r, { id: 'blast_' + Date.now() + '_' + Math.random().toString(36).slice(2), status: 'terkirim', ts: new Date().toISOString(), catatan: 'Resend massal' });
    _opsBlastHistory.unshift(newRec);
  });
  _opsSaveBlast();
  toast('Resend ' + failed.length + ' blast selesai', 'success');
  _renderOperasional('blast');
}

/* ══════════════════════════════════════════════
   6. MATERIAL OPERASIONAL
   ══════════════════════════════════════════════ */
function _renderOpsMaterial() {
  var matKey = 'ajw_ops_material';
  var materials = [];
  try { materials = JSON.parse(localStorage.getItem(matKey) || '[]'); } catch(e) {}
  var filter = window._opsMaterialFilter || {status:'', keyword:''};
  window._opsMaterialFilter = filter;

  var rows = materials.filter(function(r) {
    if (filter.status && String(r.status||'') !== filter.status) return false;
    if (filter.keyword) {
      var hay = ((r.nama||'')+(r.kategori||'')+(r.catatan||'')+(r.supplier||'')).toLowerCase();
      if (hay.indexOf(filter.keyword.toLowerCase()) < 0) return false;
    }
    return true;
  });

  var total = materials.reduce(function(t,r){ return t + _num(r.nominal||0); }, 0);
  var byStatus = {};
  materials.forEach(function(r){ var s=r.status||'Aktif'; byStatus[s]=(byStatus[s]||0)+1; });

  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px">';
  h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">';
  h += '<div><div style="font-size:16px;font-weight:800;color:#D796FF">Material Operasional</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Kelola kebutuhan material dan bahan operasional harian.</div></div>';
  h += '<span class="chip" style="border:1px solid rgba(215,150,255,.3);background:rgba(215,150,255,.07);color:#D796FF">' + materials.length + ' item · Rp ' + fmt(total) + '</span></div></div>';

  h += '<div style="display:grid;grid-template-columns:repeat(4,minmax(110px,1fr));gap:8px;margin-bottom:12px">';
  [['Total Item', materials.length, '#8FD0FF'], ['Aktif', byStatus['Aktif']||0, '#A7F3B6'], ['Habis', byStatus['Habis']||0, '#FF9D9D'], ['Total Biaya', 'Rp '+fmt(total), '#D796FF']].forEach(function(k) {
    h += '<div class="card" style="margin-bottom:0;background:var(--bg3);padding:10px"><div style="font-size:10px;font-weight:700;color:' + k[2] + ';text-transform:uppercase">' + k[0] + '</div><div style="font-size:' + (k[0]==='Total Biaya'?'15':'20') + 'px;font-weight:800;color:var(--tx);margin-top:4px">' + k[1] + '</div></div>';
  });
  h += '</div>';

  h += '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(260px,.9fr);gap:12px;margin-bottom:12px;align-items:start">';

  /* Form */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Tambah Material</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="lbl">Nama Material</label><input id="OPS-MAT-NAMA" class="fi" placeholder="Nama material"></div>';
  h += '<div><label class="lbl">Kategori</label><input id="OPS-MAT-CAT" class="fi" placeholder="Packing / Bahan / Alat"></div>';
  h += '<div><label class="lbl">Supplier</label><input id="OPS-MAT-SUP" class="fi" placeholder="Nama supplier"></div>';
  h += '<div><label class="lbl">Status</label><select id="OPS-MAT-STATUS" class="fi"><option>Aktif</option><option>Habis</option><option>Dipesan</option></select></div>';
  h += '<div><label class="lbl">Jumlah</label><input id="OPS-MAT-QTY" class="fi" type="number" placeholder="0"></div>';
  h += '<div><label class="lbl">Satuan</label><input id="OPS-MAT-UNIT" class="fi" placeholder="pcs / kg / roll"></div>';
  h += '<div><label class="lbl">Nominal / Harga</label><input id="OPS-MAT-NOM" class="fi" type="number" placeholder="0"></div>';
  h += '<div><label class="lbl">Tanggal</label><input id="OPS-MAT-DATE" class="fi" type="date" value="' + _todayYMD() + '"></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Catatan</label><input id="OPS-MAT-NOTE" class="fi" placeholder="Keterangan"></div>';
  h += '</div><div style="margin-top:10px;display:flex;justify-content:flex-end"><button class="btnp" onclick="_opsAddMaterial()" style="background:#6A1B9A">Simpan Material</button></div></div>';

  /* Filter */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Filter</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  h += '<div><label class="lbl">Status</label><select class="fi" onchange="window._opsMaterialFilter.status=this.value;_renderOperasional(\'material\')"><option value="">Semua</option><option value="Aktif"'+(filter.status==='Aktif'?' selected':'')+'>Aktif</option><option value="Habis"'+(filter.status==='Habis'?' selected':'')+'>Habis</option><option value="Dipesan"'+(filter.status==='Dipesan'?' selected':'')+'>Dipesan</option></select></div>';
  h += '<div><label class="lbl">Keyword</label><input class="fi" value="' + escAttr(filter.keyword||'') + '" placeholder="Nama / kategori" oninput="window._opsMaterialFilter.keyword=this.value;_renderOperasional(\'material\')"></div>';
  h += '<button class="btns" onclick="window._opsMaterialFilter={status:\'\',keyword:\'\'};_renderOperasional(\'material\')">Reset</button></div></div>';
  h += '</div>';

  /* Table */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Daftar Material <span style="font-size:11px;color:var(--tx2);font-weight:400">(' + rows.length + ' item)</span></div>';
  h += '<div style="overflow-x:auto"><table class="tbl" style="min-width:820px"><thead><tr>';
  h += '<th>Tanggal</th><th>Nama Material</th><th>Kategori</th><th>Supplier</th><th class="c">Jumlah</th><th>Satuan</th><th>Nominal</th><th>Status</th><th>Catatan</th><th class="c">Aksi</th></tr></thead><tbody>';
  rows.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).forEach(function(r) {
    var sc = r.status==='Aktif'?'#A7F3B6': r.status==='Habis'?'#FF9D9D':'#FFD68A';
    h += '<tr><td>' + esc(r.tanggal||'-') + '</td><td style="font-weight:700">' + esc(r.nama||'-') + '</td>';
    h += '<td>' + esc(r.kategori||'-') + '</td><td>' + esc(r.supplier||'-') + '</td>';
    h += '<td class="c">' + esc(String(r.jumlah||0)) + '</td><td>' + esc(r.satuan||'-') + '</td>';
    h += '<td style="font-weight:700">Rp ' + fmt(_num(r.nominal)) + '</td>';
    h += '<td><span style="color:' + sc + ';font-weight:700;font-size:10px">' + esc(r.status||'Aktif') + '</span></td>';
    h += '<td>' + esc(r.catatan||'-') + '</td>';
    h += '<td class="c"><button class="btns" onclick="_opsDeleteMaterial(\'' + escAttr(r.id) + '\')" style="padding:4px 8px;color:#FF9D9D;font-size:10px;border-color:rgba(255,120,120,.3)">Hapus</button></td></tr>';
  });
  if (!rows.length) h += '<tr><td colspan="10" style="text-align:center;color:var(--tx3);padding:20px">Belum ada material.</td></tr>';
  h += '</tbody></table></div></div>';
  return h;
}

function _opsAddMaterial() {
  var g = function(id) { return ((document.getElementById(id)||{}).value||'').trim(); };
  var matKey = 'ajw_ops_material';
  var materials = [];
  try { materials = JSON.parse(localStorage.getItem(matKey) || '[]'); } catch(e) {}
  var rec = {
    id: 'mat_' + Date.now(),
    tanggal: g('OPS-MAT-DATE') || _todayYMD(),
    nama: g('OPS-MAT-NAMA'),
    kategori: g('OPS-MAT-CAT'),
    supplier: g('OPS-MAT-SUP'),
    status: g('OPS-MAT-STATUS') || 'Aktif',
    jumlah: _num(g('OPS-MAT-QTY')),
    satuan: g('OPS-MAT-UNIT'),
    nominal: _num(g('OPS-MAT-NOM')),
    catatan: g('OPS-MAT-NOTE'),
    ts: new Date().toISOString()
  };
  if (!rec.nama) { toast('Nama material wajib diisi', 'error'); return; }
  materials.unshift(rec);
  try { localStorage.setItem(matKey, JSON.stringify(materials)); } catch(e){}
  toast('Material disimpan', 'success');
  _renderOperasional('material');
}

function _opsDeleteMaterial(id) {
  var matKey = 'ajw_ops_material';
  var materials = [];
  try { materials = JSON.parse(localStorage.getItem(matKey) || '[]'); } catch(e) {}
  var idx = materials.findIndex(function(r){ return r.id === id; });
  if (idx < 0) return;
  materials.splice(idx, 1);
  try { localStorage.setItem(matKey, JSON.stringify(materials)); } catch(e){}
  toast('Material dihapus', 'success');
  _renderOperasional('material');
}
