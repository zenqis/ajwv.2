/* ═══════════════════════════════════════════════════════
   CONTENT MODULE — AJW Workspace
   Sub-tabs: dash | listing | aplus | multiangle | requests | prompt | video | api
   ═══════════════════════════════════════════════════════ */

/* ── Content data stores ─────────────────────────────── */
var _contentRequests = [];
var _contentPrompts  = [];
(function(){
  try { _contentRequests = JSON.parse(localStorage.getItem('ajw_content_requests') || '[]'); } catch(e) { _contentRequests = []; }
  try { _contentPrompts  = JSON.parse(localStorage.getItem('ajw_content_prompts')  || '[]'); } catch(e) { _contentPrompts  = []; }
})();
function _contentSaveRequests() { try { localStorage.setItem('ajw_content_requests', JSON.stringify(_contentRequests)); } catch(e){} }
function _contentSavePrompts()  { try { localStorage.setItem('ajw_content_prompts',  JSON.stringify(_contentPrompts));  } catch(e){} }

/* ── Main router ─────────────────────────────────────── */
function _renderContent(sub) {
  sub = sub || window._contentSub || 'dash';
  window._contentSub = sub;
  var v = document.getElementById('V-content');
  if (!v) return;
  if (!document.getElementById('CNT-SHELL')) {
    v.innerHTML = '<div id="CNT-SHELL"></div><div id="CNT-CONTENT"></div>';
  }
  var shell   = document.getElementById('CNT-SHELL');
  var content = document.getElementById('CNT-CONTENT');
  if (!shell || !content) return;

  var tabs = [
    ['dash',       'Dashboard'],
    ['listing',    'Listing Images'],
    ['aplus',      'A+ Content'],
    ['multiangle', 'Multi-Angle'],
    ['requests',   'Requests'],
    ['prompt',     'Prompt Library'],
    ['video',      'Generate Video'],
    ['api',        'Admin API']
  ];
  var h = '<div class="card" style="margin-bottom:12px"><div style="display:flex;gap:8px;flex-wrap:wrap">';
  tabs.forEach(function(s) {
    h += '<button class="' + (sub===s[0]?'btnp':'btns') + '" onclick="_renderContent(\'' + s[0] + '\')" style="padding:8px 12px">' + s[1] + '</button>';
  });
  h += '</div></div>';
  shell.innerHTML = h;

  if      (sub==='dash')       content.innerHTML = _renderContentDash();
  else if (sub==='listing')    content.innerHTML = _renderContentListing();
  else if (sub==='aplus')      content.innerHTML = _renderContentAPlus();
  else if (sub==='multiangle') content.innerHTML = _renderContentMultiAngle();
  else if (sub==='requests')   content.innerHTML = _renderContentRequests();
  else if (sub==='prompt')     content.innerHTML = _renderContentPrompt();
  else if (sub==='video')      content.innerHTML = _renderContentVideo();
  else if (sub==='api')        content.innerHTML = _renderContentAPI();
}

/* ══════════════════════════════════════════════
   1. DASHBOARD CONTENT
   ══════════════════════════════════════════════ */
function _renderContentDash() {
  var totalReq   = _contentRequests.length;
  var openReq    = _contentRequests.filter(function(r){ return String(r.status||'').toLowerCase()!=='done'; }).length;
  var doneReq    = _contentRequests.filter(function(r){ return String(r.status||'').toLowerCase()==='done'; }).length;
  var totalPrompt= _contentPrompts.length;

  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px;background:linear-gradient(135deg,rgba(215,150,255,.07),rgba(143,208,255,.04))">';
  h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">';
  h += '<div><div style="font-size:16px;font-weight:800;color:#D796FF">Dashboard Content</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Pantauan listing images, A+ content, multi-angle, request konten, dan prompt library.</div></div>';
  h += '<span class="chip" style="border:1px solid rgba(215,150,255,.28);background:rgba(215,150,255,.07);color:#D796FF">Content Team</span></div></div>';

  h += '<div style="display:grid;grid-template-columns:repeat(4,minmax(130px,1fr));gap:10px;margin-bottom:12px">';
  [
    ['Total Requests', totalReq,    '#8FD0FF', openReq + ' aktif · ' + doneReq + ' selesai'],
    ['Request Aktif',  openReq,     '#FFB76B', 'Perlu ditangani'],
    ['Request Selesai',doneReq,     '#A7F3B6', 'Completed'],
    ['Prompt Library', totalPrompt, '#D796FF', 'Template prompt tersimpan']
  ].forEach(function(k) {
    h += '<div class="card" style="margin-bottom:0;background:var(--bg3);position:relative;overflow:hidden">';
    h += '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:' + k[2] + '"></div>';
    h += '<div style="font-size:10px;font-weight:700;color:' + k[2] + ';text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">' + k[0] + '</div>';
    h += '<div style="font-size:24px;font-weight:800;color:var(--tx)">' + k[1] + '</div>';
    h += '<div style="font-size:10px;color:var(--tx2);margin-top:5px">' + k[3] + '</div></div>';
  });
  h += '</div>';

  h += '<div style="display:grid;grid-template-columns:repeat(4,minmax(160px,1fr));gap:10px;margin-bottom:12px">';
  var quickItems = [
    ['listing',    'Listing Images',   '#8FD0FF', 'Kelola foto listing produk'],
    ['aplus',      'A+ Content',       '#D796FF', 'Enhanced brand content'],
    ['multiangle', 'Multi-Angle',      '#F0C56A', 'Set foto multi sudut'],
    ['requests',   'Requests',         '#FFB76B', 'Request konten dari tim'],
  ];
  quickItems.forEach(function(item) {
    h += '<div class="card" style="margin-bottom:0;cursor:pointer;border-left:3px solid ' + item[2] + '" onclick="_renderContent(\'' + item[0] + '\')">';
    h += '<div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:6px">' + item[1] + '</div>';
    h += '<div style="font-size:10px;color:var(--tx2)">' + item[2+1] + '</div>';
    h += '<div style="margin-top:8px"><button class="btns" style="font-size:10px;padding:5px 9px">Buka</button></div></div>';
  });
  h += '</div>';

  /* Recent requests */
  h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">';
  h += '<div style="font-size:13px;font-weight:800;color:var(--tx)">Request Konten Terbaru</div>';
  h += '<button class="btns" onclick="_renderContent(\'requests\')" style="font-size:11px;padding:6px 10px">Lihat Semua</button></div>';
  if (_contentRequests.length) {
    h += '<div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Waktu</th><th>Produk / SKU</th><th>Tipe</th><th>Status</th><th>PIC</th></tr></thead><tbody>';
    _contentRequests.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).slice(0,6).forEach(function(r) {
      var sc = r.status==='Done'?'#A7F3B6': r.status==='Proses'?'#8FD0FF':'#FFB76B';
      h += '<tr><td style="white-space:nowrap;font-size:10px">' + esc(r.ts ? new Date(r.ts).toLocaleString('id-ID') : '-') + '</td>';
      h += '<td style="font-weight:700">' + esc(r.produk||r.sku||'-') + '</td>';
      h += '<td>' + esc(r.tipe||'-') + '</td>';
      h += '<td><span style="color:' + sc + ';font-weight:700;font-size:10px">' + esc(r.status||'Open') + '</span></td>';
      h += '<td>' + esc(r.pic||'-') + '</td></tr>';
    });
    h += '</tbody></table></div>';
  } else {
    h += '<div style="color:var(--tx3);text-align:center;padding:20px;font-size:11px">Belum ada request konten.</div>';
  }
  h += '</div>';
  return h;
}

/* ══════════════════════════════════════════════
   2. LISTING IMAGES
   ══════════════════════════════════════════════ */
function _renderContentListing() {
  var cfg = getCfg ? getCfg() : {};
  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px">';
  h += '<div style="font-size:16px;font-weight:800;color:#8FD0FF">Listing Images</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Kelola foto utama, thumbnail, dan set gambar listing produk marketplace.</div></div>';

  h += '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:12px;align-items:start">';

  h += '<div style="display:flex;flex-direction:column;gap:12px">';
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Upload / Link Foto Listing</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="lbl">SKU / Kode Produk</label><input id="LST-SKU" class="fi" placeholder="SKU-001"></div>';
  h += '<div><label class="lbl">Nama Produk</label><input id="LST-NAMA" class="fi" placeholder="Nama produk"></div>';
  h += '<div><label class="lbl">Marketplace</label><select id="LST-MKT" class="fi"><option>Shopee</option><option>Tokopedia</option><option>Lazada</option><option>TikTok</option><option>Semua</option></select></div>';
  h += '<div><label class="lbl">Tipe Gambar</label><select id="LST-TIPE" class="fi"><option>Main Photo</option><option>Infographic</option><option>Detail Shot</option><option>Lifestyle</option><option>White Background</option></select></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">URL Gambar / Google Drive Link</label><input id="LST-URL" class="fi" placeholder="https://..."></div>';
  h += '<div><label class="lbl">Status</label><select id="LST-STATUS" class="fi"><option>Draft</option><option>Review</option><option>Approved</option><option>Live</option></select></div>';
  h += '<div><label class="lbl">PIC</label><input id="LST-PIC" class="fi" placeholder="Nama desainer"></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Catatan</label><input id="LST-NOTE" class="fi" placeholder="Keterangan"></div>';
  h += '</div><div style="margin-top:10px;display:flex;justify-content:flex-end"><button class="btnp" onclick="_contentAddListing()">Simpan Listing</button></div></div>';

  /* Listing table */
  var listings = [];
  try { listings = JSON.parse(localStorage.getItem('ajw_content_listing') || '[]'); } catch(e){}
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Daftar Listing Images <span style="font-size:11px;color:var(--tx2);font-weight:400">(' + listings.length + ')</span></div>';
  if (listings.length) {
    h += '<div style="overflow-x:auto"><table class="tbl" style="min-width:700px"><thead><tr><th>SKU</th><th>Produk</th><th>Marketplace</th><th>Tipe</th><th>Status</th><th>PIC</th><th class="c">Aksi</th></tr></thead><tbody>';
    listings.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).forEach(function(r) {
      var sc = r.status==='Live'?'#A7F3B6': r.status==='Approved'?'#8FD0FF': r.status==='Review'?'#FFD68A':'#FF9D9D';
      h += '<tr><td style="font-size:10px;font-weight:700">' + esc(r.sku||'-') + '</td><td>' + esc(r.nama||'-') + '</td>';
      h += '<td>' + esc(r.marketplace||'-') + '</td><td>' + esc(r.tipe||'-') + '</td>';
      h += '<td><span style="color:' + sc + ';font-weight:700;font-size:10px">' + esc(r.status||'-') + '</span></td>';
      h += '<td>' + esc(r.pic||'-') + '</td>';
      h += '<td class="c" style="white-space:nowrap">';
      if (r.url) h += '<a href="' + escAttr(r.url) + '" target="_blank" class="btns" style="font-size:10px;padding:4px 8px;display:inline-block;text-decoration:none;margin-right:4px">Lihat</a>';
      h += '<button class="btns" onclick="_contentDeleteListing(\'' + escAttr(r.id) + '\')" style="padding:4px 8px;color:#FF9D9D;font-size:10px;border-color:rgba(255,120,120,.3)">Hapus</button></td></tr>';
    });
    h += '</tbody></table></div>';
  } else {
    h += '<div style="color:var(--tx3);text-align:center;padding:20px;font-size:11px">Belum ada listing image.</div>';
  }
  h += '</div></div>';

  /* Info panel */
  h += '<div style="display:flex;flex-direction:column;gap:12px">';
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Panduan Foto Listing</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  [
    ['Main Photo', 'White/clean background, produk di tengah, resolusi min 1000×1000', '#8FD0FF'],
    ['Infographic', 'Highlight fitur produk, text ringkas, tidak lebih dari 3-4 poin', '#D796FF'],
    ['Detail Shot', 'Close-up material, texture, jahitan, kualitas produk', '#F0C56A'],
    ['Lifestyle', 'Konteks penggunaan nyata, human element, situasional', '#A7F3B6'],
  ].forEach(function(item) {
    h += '<div style="background:var(--bg3);border:1px solid var(--bd);border-left:3px solid ' + item[2] + ';border-radius:8px;padding:9px 11px">';
    h += '<div style="font-size:11px;font-weight:800;color:var(--tx);margin-bottom:3px">' + item[0] + '</div>';
    h += '<div style="font-size:10px;color:var(--tx2)">' + item[1] + '</div></div>';
  });
  h += '</div></div>';
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:8px">Spesifikasi per Marketplace</div>';
  h += '<div style="display:flex;flex-direction:column;gap:6px;font-size:10px">';
  [['Shopee','Max 9 foto, min 1:1, max 2MB'], ['Tokopedia','Max 10 foto, 1:1 atau 3:4, max 5MB'], ['Lazada','Max 8 foto, square atau 1:1.33, max 2MB'], ['TikTok','Max 9 foto, square, max 20MB']].forEach(function(item) {
    h += '<div style="padding:6px 8px;background:var(--bg3);border-radius:6px;display:flex;justify-content:space-between"><b style="color:var(--tx)">' + item[0] + '</b><span style="color:var(--tx2)">' + item[1] + '</span></div>';
  });
  h += '</div></div></div>';
  h += '</div>';
  return h;
}

function _contentAddListing() {
  var g = function(id) { return ((document.getElementById(id)||{}).value||'').trim(); };
  var key = 'ajw_content_listing';
  var list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}
  var rec = { id:'lst_'+Date.now(), sku:g('LST-SKU'), nama:g('LST-NAMA'), marketplace:g('LST-MKT'), tipe:g('LST-TIPE'), url:g('LST-URL'), status:g('LST-STATUS'), pic:g('LST-PIC'), catatan:g('LST-NOTE'), ts:new Date().toISOString() };
  if (!rec.nama && !rec.sku) { toast('SKU atau nama produk wajib diisi', 'error'); return; }
  list.unshift(rec);
  try { localStorage.setItem(key, JSON.stringify(list)); } catch(e){}
  toast('Listing disimpan', 'success');
  _renderContent('listing');
}

function _contentDeleteListing(id) {
  var key = 'ajw_content_listing';
  var list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}
  var idx = list.findIndex(function(r){ return r.id===id; });
  if (idx<0) return;
  list.splice(idx,1);
  try { localStorage.setItem(key, JSON.stringify(list)); } catch(e){}
  toast('Listing dihapus', 'success');
  _renderContent('listing');
}

/* ══════════════════════════════════════════════
   3. A+ CONTENT
   ══════════════════════════════════════════════ */
function _renderContentAPlus() {
  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px">';
  h += '<div style="font-size:16px;font-weight:800;color:#D796FF">A+ Content</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Enhanced Brand Content (EBC) — modul konten premium marketplace seperti Shopee Brand Showcase dan Tokopedia Gold Merchant.</div></div>';

  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">';
  var aplusTypes = [
    ['Brand Story', 'Narasi brand, nilai, dan misi perusahaan. Digunakan di halaman toko.', '#D796FF', 'Buat'],
    ['Product Story', 'Cerita di balik produk, material, dan proses produksi.', '#8FD0FF', 'Buat'],
    ['Feature Highlight', 'Grid visual fitur-fitur utama produk dengan ikon dan copywriting.', '#F0C56A', 'Buat'],
    ['Comparison Table', 'Tabel perbandingan varian atau produk kompetitor.', '#A7F3B6', 'Buat'],
  ];
  aplusTypes.forEach(function(item) {
    h += '<div class="card" style="margin-bottom:0;border-left:3px solid ' + item[2] + '">';
    h += '<div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:6px">' + item[0] + '</div>';
    h += '<div style="font-size:11px;color:var(--tx2);margin-bottom:10px">' + item[1] + '</div>';
    h += '<button class="btns" style="font-size:11px;padding:6px 10px" onclick="_renderContent(\'requests\')">' + item[3] + ' Request</button></div>';
  });
  h += '</div>';

  /* A+ content list */
  var aplus = [];
  try { aplus = JSON.parse(localStorage.getItem('ajw_content_aplus') || '[]'); } catch(e){}
  h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px">';
  h += '<div style="font-size:13px;font-weight:800;color:var(--tx)">A+ Content Tersimpan</div>';
  h += '<button class="btnp" onclick="_contentAddAPlus()" style="font-size:11px;padding:6px 11px">+ Tambah</button></div>';
  if (aplus.length) {
    h += '<div style="display:flex;flex-direction:column;gap:8px">';
    aplus.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).forEach(function(r,idx) {
      var sc = r.status==='Live'?'#A7F3B6': r.status==='Approved'?'#8FD0FF':'#FFD68A';
      h += '<div style="background:var(--bg3);border:1px solid var(--bd);border-radius:8px;padding:10px 12px">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">';
      h += '<div><div style="font-size:12px;font-weight:800;color:var(--tx)">' + esc(r.produk||'-') + '</div>';
      h += '<div style="font-size:10px;color:var(--tx2);margin-top:3px">' + esc(r.tipe||'-') + ' · ' + esc(r.marketplace||'-') + '</div></div>';
      h += '<div style="display:flex;gap:6px;align-items:center">';
      h += '<span style="font-size:10px;font-weight:700;color:' + sc + '">' + esc(r.status||'-') + '</span>';
      h += '<button class="btns" onclick="_contentDeleteAPlus('+idx+')" style="padding:4px 8px;font-size:10px;color:#FF9D9D;border-color:rgba(255,120,120,.3)">Hapus</button></div></div></div>';
    });
    h += '</div>';
  } else {
    h += '<div style="color:var(--tx3);text-align:center;padding:20px;font-size:11px">Belum ada A+ content tersimpan.</div>';
  }
  h += '</div>';
  return h;
}

function _contentAddAPlus() {
  var produk = prompt('Nama Produk:');
  if (!produk) return;
  var tipe = prompt('Tipe A+ Content (Brand Story / Product Story / Feature Highlight / Comparison Table):') || 'Brand Story';
  var mkt = prompt('Marketplace:') || 'Shopee';
  var key = 'ajw_content_aplus';
  var list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}
  list.unshift({ id:'aplus_'+Date.now(), produk:produk, tipe:tipe, marketplace:mkt, status:'Draft', ts:new Date().toISOString() });
  try { localStorage.setItem(key, JSON.stringify(list)); } catch(e){}
  toast('A+ Content ditambahkan', 'success');
  _renderContent('aplus');
}

function _contentDeleteAPlus(idx) {
  var key = 'ajw_content_aplus';
  var list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}
  list.splice(idx, 1);
  try { localStorage.setItem(key, JSON.stringify(list)); } catch(e){}
  toast('Dihapus', 'success');
  _renderContent('aplus');
}

/* ══════════════════════════════════════════════
   4. MULTI-ANGLE
   ══════════════════════════════════════════════ */
function _renderContentMultiAngle() {
  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px">';
  h += '<div style="font-size:16px;font-weight:800;color:#F0C56A">Multi-Angle Photo</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Set foto produk dari berbagai sudut pandang untuk coverage visual yang komprehensif.</div></div>';

  h += '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(280px,.9fr);gap:12px;align-items:start">';

  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Daftarkan Set Multi-Angle</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="lbl">SKU / Kode</label><input id="MA-SKU" class="fi" placeholder="SKU-001"></div>';
  h += '<div><label class="lbl">Nama Produk</label><input id="MA-NAMA" class="fi" placeholder="Nama produk"></div>';
  h += '<div><label class="lbl">Jumlah Angle</label><input id="MA-ANGLE" class="fi" type="number" min="1" max="20" placeholder="8"></div>';
  h += '<div><label class="lbl">Status</label><select id="MA-STATUS" class="fi"><option>Planned</option><option>Shoot</option><option>Editing</option><option>Done</option></select></div>';
  h += '<div><label class="lbl">Fotografer / PIC</label><input id="MA-PIC" class="fi" placeholder="Nama PIC"></div>';
  h += '<div><label class="lbl">Tanggal Shoot</label><input id="MA-DATE" class="fi" type="date" value="' + (typeof _todayYMD==='function'?_todayYMD():'') + '"></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Link Google Drive / Folder</label><input id="MA-URL" class="fi" placeholder="https://drive.google.com/..."></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Catatan</label><input id="MA-NOTE" class="fi" placeholder="Keterangan"></div>';
  h += '</div><div style="margin-top:10px;display:flex;justify-content:flex-end"><button class="btnp" onclick="_contentAddMultiAngle()" style="background:#8B6914">Simpan Set</button></div></div>';

  var sets = [];
  try { sets = JSON.parse(localStorage.getItem('ajw_content_multiangle') || '[]'); } catch(e){}
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Angle Checklist Standar</div>';
  h += '<div style="display:flex;flex-direction:column;gap:6px;font-size:11px">';
  ['Front view (Depan)', 'Back view (Belakang)', 'Side view kiri', 'Side view kanan', 'Top view (Atas)', 'Detail close-up', 'Label / Branding', 'Konteks / In-use'].forEach(function(angle, i) {
    h += '<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:var(--bg3);border-radius:6px">';
    h += '<span style="font-size:10px;color:var(--tx2);min-width:16px">' + (i+1) + '</span>';
    h += '<span style="color:var(--tx)">' + angle + '</span></div>';
  });
  h += '</div></div>';
  h += '</div>';

  /* Table */
  h += '<div class="card" style="margin-top:12px"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Daftar Set Multi-Angle <span style="font-size:11px;color:var(--tx2);font-weight:400">(' + sets.length + ')</span></div>';
  if (sets.length) {
    h += '<div style="overflow-x:auto"><table class="tbl" style="min-width:720px"><thead><tr><th>SKU</th><th>Produk</th><th>Angle</th><th>Tanggal Shoot</th><th>PIC</th><th>Status</th><th class="c">Aksi</th></tr></thead><tbody>';
    sets.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).forEach(function(r) {
      var sc = r.status==='Done'?'#A7F3B6': r.status==='Editing'?'#8FD0FF': r.status==='Shoot'?'#FFD68A':'#FF9D9D';
      h += '<tr><td style="font-weight:700">' + esc(r.sku||'-') + '</td><td>' + esc(r.nama||'-') + '</td>';
      h += '<td class="c">' + esc(String(r.angle||'-')) + '</td><td>' + esc(r.tanggal||'-') + '</td>';
      h += '<td>' + esc(r.pic||'-') + '</td>';
      h += '<td><span style="color:' + sc + ';font-weight:700;font-size:10px">' + esc(r.status||'-') + '</span></td>';
      h += '<td class="c" style="white-space:nowrap">';
      if (r.url) h += '<a href="' + escAttr(r.url) + '" target="_blank" class="btns" style="font-size:10px;padding:4px 8px;display:inline-block;text-decoration:none;margin-right:4px">Drive</a>';
      h += '<button class="btns" onclick="_contentDeleteMultiAngle(\'' + escAttr(r.id) + '\')" style="padding:4px 8px;color:#FF9D9D;font-size:10px;border-color:rgba(255,120,120,.3)">Hapus</button></td></tr>';
    });
    h += '</tbody></table></div>';
  } else {
    h += '<div style="color:var(--tx3);text-align:center;padding:20px;font-size:11px">Belum ada set multi-angle.</div>';
  }
  h += '</div>';
  return h;
}

function _contentAddMultiAngle() {
  var g = function(id) { return ((document.getElementById(id)||{}).value||'').trim(); };
  var key = 'ajw_content_multiangle';
  var list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}
  var rec = { id:'ma_'+Date.now(), sku:g('MA-SKU'), nama:g('MA-NAMA'), angle:parseInt(g('MA-ANGLE')||'0'), status:g('MA-STATUS'), pic:g('MA-PIC'), tanggal:g('MA-DATE'), url:g('MA-URL'), catatan:g('MA-NOTE'), ts:new Date().toISOString() };
  if (!rec.nama && !rec.sku) { toast('SKU atau nama produk wajib diisi', 'error'); return; }
  list.unshift(rec);
  try { localStorage.setItem(key, JSON.stringify(list)); } catch(e){}
  toast('Set multi-angle disimpan', 'success');
  _renderContent('multiangle');
}

function _contentDeleteMultiAngle(id) {
  var key = 'ajw_content_multiangle';
  var list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}
  var idx = list.findIndex(function(r){ return r.id===id; });
  if (idx<0) return;
  list.splice(idx,1);
  try { localStorage.setItem(key, JSON.stringify(list)); } catch(e){}
  toast('Set dihapus', 'success');
  _renderContent('multiangle');
}

/* ══════════════════════════════════════════════
   5. REQUESTS KONTEN
   ══════════════════════════════════════════════ */
function _renderContentRequests() {
  var filter = window._contentReqFilter || {status:'', tipe:'', keyword:''};
  window._contentReqFilter = filter;
  var rows = _contentRequests.filter(function(r) {
    if (filter.status && r.status !== filter.status) return false;
    if (filter.tipe && r.tipe !== filter.tipe) return false;
    if (filter.keyword) {
      var hay = ((r.produk||'')+(r.sku||'')+(r.pic||'')+(r.catatan||'')).toLowerCase();
      if (hay.indexOf(filter.keyword.toLowerCase()) < 0) return false;
    }
    return true;
  });
  var types = [''].concat(Array.from(new Set(_contentRequests.map(function(r){ return r.tipe||''; }).filter(Boolean))).sort());
  var statuses = ['','Open','Proses','Review','Done','Cancel'];

  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px">';
  h += '<div style="font-size:16px;font-weight:800;color:#FFB76B">Request Konten</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Kelola semua permintaan pembuatan konten dari tim marketplace dan product.</div></div>';

  var byStatus = {};
  _contentRequests.forEach(function(r){ var s=r.status||'Open'; byStatus[s]=(byStatus[s]||0)+1; });
  h += '<div style="display:grid;grid-template-columns:repeat(5,minmax(100px,1fr));gap:8px;margin-bottom:12px">';
  [['Open',byStatus['Open']||0,'#FFB76B'],['Proses',byStatus['Proses']||0,'#8FD0FF'],['Review',byStatus['Review']||0,'#FFD68A'],['Done',byStatus['Done']||0,'#A7F3B6'],['Cancel',byStatus['Cancel']||0,'#FF9D9D']].forEach(function(k){
    h += '<div class="card" style="margin-bottom:0;background:var(--bg3);padding:10px"><div style="font-size:10px;font-weight:700;color:' + k[2] + ';text-transform:uppercase">' + k[0] + '</div><div style="font-size:20px;font-weight:800;color:var(--tx);margin-top:4px">' + k[1] + '</div></div>';
  });
  h += '</div>';

  h += '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(250px,.9fr);gap:12px;margin-bottom:12px;align-items:start">';

  /* Form */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Tambah Request</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="lbl">SKU / Kode Produk</label><input id="CNT-REQ-SKU" class="fi" placeholder="SKU-001"></div>';
  h += '<div><label class="lbl">Nama Produk</label><input id="CNT-REQ-NAMA" class="fi" placeholder="Nama produk"></div>';
  h += '<div><label class="lbl">Tipe Konten</label><select id="CNT-REQ-TIPE" class="fi"><option>Listing Photo</option><option>A+ Content</option><option>Multi-Angle</option><option>Video Produk</option><option>Infographic</option><option>Social Media</option><option>Lainnya</option></select></div>';
  h += '<div><label class="lbl">Marketplace Target</label><select id="CNT-REQ-MKT" class="fi"><option>Shopee</option><option>Tokopedia</option><option>TikTok</option><option>Semua</option></select></div>';
  h += '<div><label class="lbl">PIC / Requestor</label><input id="CNT-REQ-PIC" class="fi" placeholder="Nama peminta"></div>';
  h += '<div><label class="lbl">Deadline</label><input id="CNT-REQ-DL" class="fi" type="date"></div>';
  h += '<div><label class="lbl">Prioritas</label><select id="CNT-REQ-PRIO" class="fi"><option>Normal</option><option>Urgent</option><option>Low</option></select></div>';
  h += '<div><label class="lbl">Status</label><select id="CNT-REQ-STATUS" class="fi"><option>Open</option><option>Proses</option><option>Review</option><option>Done</option></select></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Brief / Catatan</label><textarea id="CNT-REQ-NOTE" class="fi" rows="3" placeholder="Detail request, referensi, ukuran, warna, dll"></textarea></div>';
  h += '</div><div style="margin-top:10px;display:flex;justify-content:flex-end"><button class="btnp" onclick="_contentAddRequest()">Tambah Request</button></div></div>';

  /* Filter */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Filter</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  h += '<div><label class="lbl">Status</label><select class="fi" onchange="window._contentReqFilter.status=this.value;_renderContent(\'requests\')">' + statuses.map(function(s){ return '<option value="'+s+'"'+(filter.status===s?' selected':'')+'>'+( s||'Semua Status')+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Tipe</label><select class="fi" onchange="window._contentReqFilter.tipe=this.value;_renderContent(\'requests\')">' + types.map(function(t){ return '<option value="'+t+'"'+(filter.tipe===t?' selected':'')+'>'+( t||'Semua Tipe')+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Keyword</label><input class="fi" value="' + escAttr(filter.keyword||'') + '" placeholder="Produk / SKU / PIC" oninput="window._contentReqFilter.keyword=this.value;_renderContent(\'requests\')"></div>';
  h += '<button class="btns" onclick="window._contentReqFilter={status:\'\',tipe:\'\',keyword:\'\'};_renderContent(\'requests\')">Reset</button></div></div>';
  h += '</div>';

  /* Table */
  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Daftar Request <span style="font-size:11px;color:var(--tx2);font-weight:400">(' + rows.length + ')</span></div>';
  h += '<div style="overflow-x:auto"><table class="tbl" style="min-width:900px"><thead><tr>';
  h += '<th>Waktu</th><th>SKU</th><th>Produk</th><th>Tipe</th><th>Marketplace</th><th>PIC</th><th>Deadline</th><th>Prioritas</th><th>Status</th><th class="c">Aksi</th></tr></thead><tbody>';
  rows.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).forEach(function(r) {
    var sc = r.status==='Done'?'#A7F3B6': r.status==='Cancel'?'#FF9D9D': r.status==='Review'?'#FFD68A':'#8FD0FF';
    var pc = r.prioritas==='Urgent'?'#FF9D9D': r.prioritas==='Low'?'var(--tx2)':'#F0C56A';
    h += '<tr><td style="font-size:10px;white-space:nowrap">' + esc(r.ts ? new Date(r.ts).toLocaleString('id-ID') : '-') + '</td>';
    h += '<td style="font-weight:700;font-size:10px">' + esc(r.sku||'-') + '</td>';
    h += '<td style="font-weight:700">' + esc(r.produk||r.nama||'-') + '</td>';
    h += '<td>' + esc(r.tipe||'-') + '</td>';
    h += '<td>' + esc(r.marketplace||'-') + '</td>';
    h += '<td>' + esc(r.pic||'-') + '</td>';
    h += '<td>' + esc(r.deadline||'-') + '</td>';
    h += '<td><span style="color:' + pc + ';font-weight:700;font-size:10px">' + esc(r.prioritas||'Normal') + '</span></td>';
    h += '<td><span style="color:' + sc + ';font-weight:700;font-size:10px">' + esc(r.status||'Open') + '</span></td>';
    h += '<td class="c" style="white-space:nowrap"><button class="btns" onclick="_contentToggleRequest(\'' + escAttr(r.id) + '\')" style="padding:4px 7px;font-size:10px;margin-right:3px">Toggle Done</button>';
    h += '<button class="btns" onclick="_contentDeleteRequest(\'' + escAttr(r.id) + '\')" style="padding:4px 7px;color:#FF9D9D;font-size:10px;border-color:rgba(255,120,120,.3)">Hapus</button></td></tr>';
  });
  if (!rows.length) h += '<tr><td colspan="10" style="text-align:center;color:var(--tx3);padding:20px">Belum ada request.</td></tr>';
  h += '</tbody></table></div></div>';
  return h;
}

function _contentAddRequest() {
  var g = function(id) { return ((document.getElementById(id)||{}).value||'').trim(); };
  var rec = { id:'creq_'+Date.now(), sku:g('CNT-REQ-SKU'), produk:g('CNT-REQ-NAMA'), tipe:g('CNT-REQ-TIPE'), marketplace:g('CNT-REQ-MKT'), pic:g('CNT-REQ-PIC'), deadline:g('CNT-REQ-DL'), prioritas:g('CNT-REQ-PRIO'), status:g('CNT-REQ-STATUS')||'Open', catatan:g('CNT-REQ-NOTE'), ts:new Date().toISOString() };
  if (!rec.produk && !rec.sku) { toast('SKU atau nama produk wajib diisi', 'error'); return; }
  _contentRequests.unshift(rec);
  _contentSaveRequests();
  toast('Request ditambahkan', 'success');
  _renderContent('requests');
}

function _contentToggleRequest(id) {
  var r = _contentRequests.find(function(x){ return x.id===id; });
  if (!r) return;
  r.status = r.status==='Done' ? 'Open' : 'Done';
  r.updatedAt = new Date().toISOString();
  _contentSaveRequests();
  toast('Status diperbarui', 'success');
  _renderContent('requests');
}

function _contentDeleteRequest(id) {
  var idx = _contentRequests.findIndex(function(r){ return r.id===id; });
  if (idx<0) return;
  _contentRequests.splice(idx,1);
  _contentSaveRequests();
  toast('Request dihapus', 'success');
  _renderContent('requests');
}

/* ══════════════════════════════════════════════
   6. PROMPT LIBRARY
   ══════════════════════════════════════════════ */
function _renderContentPrompt() {
  var filter = window._contentPromptFilter || {kategori:'', keyword:''};
  window._contentPromptFilter = filter;
  var rows = _contentPrompts.filter(function(r) {
    if (filter.kategori && r.kategori !== filter.kategori) return false;
    if (filter.keyword) {
      var hay = ((r.nama||'')+(r.prompt||'')+(r.catatan||'')).toLowerCase();
      if (hay.indexOf(filter.keyword.toLowerCase()) < 0) return false;
    }
    return true;
  });
  var cats = [''].concat(Array.from(new Set(_contentPrompts.map(function(r){ return r.kategori||''; }).filter(Boolean))).sort());

  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px">';
  h += '<div style="font-size:16px;font-weight:800;color:#8FD0FF">Prompt Library</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Simpan dan kelola prompt AI untuk keperluan pembuatan konten, copywriting, dan visual produk.</div></div>';

  h += '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(250px,.9fr);gap:12px;margin-bottom:12px;align-items:start">';

  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Tambah Prompt</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="lbl">Nama Prompt</label><input id="PRM-NAMA" class="fi" placeholder="Nama prompt"></div>';
  h += '<div><label class="lbl">Kategori</label><select id="PRM-CAT" class="fi"><option>Copywriting</option><option>Listing Description</option><option>A+ Content</option><option>Social Media</option><option>Image Generation</option><option>Video Script</option><option>Lainnya</option></select></div>';
  h += '<div><label class="lbl">Model AI</label><select id="PRM-MODEL" class="fi"><option>Claude</option><option>GPT-4o</option><option>Gemini</option><option>Midjourney</option><option>DALL-E</option><option>Lainnya</option></select></div>';
  h += '<div><label class="lbl">Rating</label><select id="PRM-RATE" class="fi"><option value="5">⭐⭐⭐⭐⭐ Sangat Bagus</option><option value="4">⭐⭐⭐⭐ Bagus</option><option value="3">⭐⭐⭐ Cukup</option><option value="2">⭐⭐ Kurang</option></select></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Isi Prompt</label><textarea id="PRM-BODY" class="fi" rows="5" placeholder="Tulis prompt lengkap di sini..."></textarea></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Catatan / Konteks</label><input id="PRM-NOTE" class="fi" placeholder="Keterangan penggunaan prompt ini"></div>';
  h += '</div><div style="margin-top:10px;display:flex;justify-content:flex-end"><button class="btnp" onclick="_contentAddPrompt()">Simpan Prompt</button></div></div>';

  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Filter</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  h += '<div><label class="lbl">Kategori</label><select class="fi" onchange="window._contentPromptFilter.kategori=this.value;_renderContent(\'prompt\')">' + cats.map(function(c){ return '<option value="'+c+'"'+(filter.kategori===c?' selected':'')+'>'+( c||'Semua')+'</option>'; }).join('') + '</select></div>';
  h += '<div><label class="lbl">Keyword</label><input class="fi" value="' + escAttr(filter.keyword||'') + '" placeholder="Nama / konten prompt" oninput="window._contentPromptFilter.keyword=this.value;_renderContent(\'prompt\')"></div>';
  h += '<button class="btns" onclick="window._contentPromptFilter={kategori:\'\',keyword:\'\'};_renderContent(\'prompt\')">Reset</button></div>';
  h += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--bd)"><div style="font-size:11px;font-weight:700;color:var(--tx);margin-bottom:6px">Total Prompt: ' + _contentPrompts.length + '</div>';
  h += '<div style="font-size:10px;color:var(--tx2)">Tersaring: ' + rows.length + '</div></div></div>';
  h += '</div>';

  /* Prompt cards */
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  rows.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).forEach(function(r, idx) {
    var stars = parseInt(r.rating||3);
    var starStr = Array(stars+1).join('⭐');
    h += '<div class="card" style="margin-bottom:0">';
    h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:8px">';
    h += '<div><div style="font-size:13px;font-weight:800;color:var(--tx)">' + esc(r.nama||'-') + '</div>';
    h += '<div style="font-size:10px;color:var(--tx2);margin-top:3px">' + esc(r.kategori||'-') + ' · ' + esc(r.model||'-') + ' · ' + starStr + '</div></div>';
    h += '<div style="display:flex;gap:6px">';
    h += '<button class="btns" onclick="_contentCopyPrompt(' + idx + ')" style="font-size:10px;padding:5px 8px">Copy</button>';
    h += '<button class="btns" onclick="_contentDeletePrompt(\'' + escAttr(r.id) + '\')" style="font-size:10px;padding:5px 8px;color:#FF9D9D;border-color:rgba(255,120,120,.3)">Hapus</button></div></div>';
    h += '<div style="background:var(--bg3);border:1px solid var(--bd);border-radius:6px;padding:8px 10px;font-size:11px;color:var(--tx2);line-height:1.6;font-family:monospace;white-space:pre-wrap;max-height:100px;overflow:auto">' + esc(r.prompt||'-') + '</div>';
    if (r.catatan) h += '<div style="font-size:10px;color:var(--tx2);margin-top:6px">' + esc(r.catatan) + '</div>';
    h += '</div>';
  });
  if (!rows.length) h += '<div class="card" style="text-align:center;color:var(--tx3);padding:24px;font-size:11px">Belum ada prompt tersimpan.</div>';
  h += '</div>';
  return h;
}

function _contentAddPrompt() {
  var g = function(id) { return ((document.getElementById(id)||{}).value||'').trim(); };
  var rec = { id:'prm_'+Date.now(), nama:g('PRM-NAMA'), kategori:g('PRM-CAT'), model:g('PRM-MODEL'), rating:g('PRM-RATE')||'3', prompt:g('PRM-BODY'), catatan:g('PRM-NOTE'), ts:new Date().toISOString() };
  if (!rec.nama) { toast('Nama prompt wajib diisi', 'error'); return; }
  if (!rec.prompt) { toast('Isi prompt wajib diisi', 'error'); return; }
  _contentPrompts.unshift(rec);
  _contentSavePrompts();
  toast('Prompt disimpan', 'success');
  _renderContent('prompt');
}

function _contentCopyPrompt(idx) {
  var filteredRows = _contentPrompts.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); });
  var r = filteredRows[idx];
  if (!r) return;
  navigator.clipboard && navigator.clipboard.writeText(r.prompt||'').then(function(){ toast('Prompt disalin', 'success'); }).catch(function(){ toast('Gagal copy: ' + (r.prompt||'').slice(0,40) + '...', 'warn', 5000); });
}

function _contentDeletePrompt(id) {
  var idx = _contentPrompts.findIndex(function(r){ return r.id===id; });
  if (idx<0) return;
  _contentPrompts.splice(idx,1);
  _contentSavePrompts();
  toast('Prompt dihapus', 'success');
  _renderContent('prompt');
}

/* ══════════════════════════════════════════════
   7. GENERATE VIDEO
   ══════════════════════════════════════════════ */
function _renderContentVideo() {
  var videos = [];
  try { videos = JSON.parse(localStorage.getItem('ajw_content_video') || '[]'); } catch(e){}

  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px">';
  h += '<div style="font-size:16px;font-weight:800;color:#A7F3B6">Generate Video</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Request dan kelola pembuatan video produk untuk TikTok, Reels, dan video listing marketplace.</div></div>';

  h += '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(260px,.9fr);gap:12px;margin-bottom:12px;align-items:start">';

  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Request Video</div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">';
  h += '<div><label class="lbl">SKU / Produk</label><input id="VID-SKU" class="fi" placeholder="SKU / nama produk"></div>';
  h += '<div><label class="lbl">Tipe Video</label><select id="VID-TIPE" class="fi"><option>TikTok Short</option><option>Reels / Stories</option><option>Listing Video</option><option>Unboxing</option><option>Tutorial</option><option>Product Demo</option></select></div>';
  h += '<div><label class="lbl">Durasi Target</label><select id="VID-DUR" class="fi"><option>15 detik</option><option>30 detik</option><option>60 detik</option><option>3 menit</option><option>Bebas</option></select></div>';
  h += '<div><label class="lbl">Resolusi</label><select id="VID-RES" class="fi"><option>9:16 (Vertikal)</option><option>1:1 (Square)</option><option>16:9 (Horizontal)</option></select></div>';
  h += '<div><label class="lbl">PIC / Videografer</label><input id="VID-PIC" class="fi" placeholder="Nama PIC"></div>';
  h += '<div><label class="lbl">Deadline</label><input id="VID-DL" class="fi" type="date"></div>';
  h += '<div><label class="lbl">Status</label><select id="VID-STATUS" class="fi"><option>Planned</option><option>Shoot</option><option>Editing</option><option>Review</option><option>Done</option></select></div>';
  h += '<div><label class="lbl">Link Output</label><input id="VID-URL" class="fi" placeholder="https://..."></div>';
  h += '<div style="grid-column:1/-1"><label class="lbl">Brief / Script</label><textarea id="VID-NOTE" class="fi" rows="3" placeholder="Brief video, key message, referensi, dll"></textarea></div>';
  h += '</div><div style="margin-top:10px;display:flex;justify-content:flex-end"><button class="btnp" onclick="_contentAddVideo()" style="background:#0F5132">Simpan Request Video</button></div></div>';

  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Panduan Video Produk</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px;font-size:10px;color:var(--tx2)">';
  [['TikTok','9:16, 15-60 detik, hook 1-3 detik pertama, audio trending'], ['Reels','9:16, max 90 detik, transisi smooth, caption kuat'], ['Listing Video','1:1 atau 16:9, max 60 detik, show fitur produk'], ['Unboxing','Durasi bebas, lighting bagus, tampilkan semua komponen']].forEach(function(item) {
    h += '<div style="background:var(--bg3);border:1px solid var(--bd);border-radius:6px;padding:8px"><b style="color:var(--tx)">' + item[0] + ':</b> ' + item[1] + '</div>';
  });
  h += '</div></div>';
  h += '</div>';

  h += '<div class="card"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Daftar Video <span style="font-size:11px;color:var(--tx2);font-weight:400">(' + videos.length + ')</span></div>';
  if (videos.length) {
    h += '<div style="overflow-x:auto"><table class="tbl" style="min-width:820px"><thead><tr><th>SKU/Produk</th><th>Tipe</th><th>Durasi</th><th>Resolusi</th><th>PIC</th><th>Deadline</th><th>Status</th><th class="c">Aksi</th></tr></thead><tbody>';
    videos.slice().sort(function(a,b){ return String(b.ts||'').localeCompare(String(a.ts||'')); }).forEach(function(r) {
      var sc = r.status==='Done'?'#A7F3B6': r.status==='Review'?'#FFD68A': r.status==='Editing'?'#8FD0FF': r.status==='Shoot'?'#FFB76B':'#FF9D9D';
      h += '<tr><td style="font-weight:700">' + esc(r.sku||'-') + '</td><td>' + esc(r.tipe||'-') + '</td>';
      h += '<td>' + esc(r.durasi||'-') + '</td><td>' + esc(r.resolusi||'-') + '</td>';
      h += '<td>' + esc(r.pic||'-') + '</td><td>' + esc(r.deadline||'-') + '</td>';
      h += '<td><span style="color:' + sc + ';font-weight:700;font-size:10px">' + esc(r.status||'-') + '</span></td>';
      h += '<td class="c" style="white-space:nowrap">';
      if (r.url) h += '<a href="' + escAttr(r.url) + '" target="_blank" class="btns" style="font-size:10px;padding:4px 8px;display:inline-block;text-decoration:none;margin-right:4px">Link</a>';
      h += '<button class="btns" onclick="_contentDeleteVideo(\'' + escAttr(r.id) + '\')" style="padding:4px 8px;color:#FF9D9D;font-size:10px;border-color:rgba(255,120,120,.3)">Hapus</button></td></tr>';
    });
    h += '</tbody></table></div>';
  } else {
    h += '<div style="color:var(--tx3);text-align:center;padding:20px;font-size:11px">Belum ada request video.</div>';
  }
  h += '</div>';
  return h;
}

function _contentAddVideo() {
  var g = function(id) { return ((document.getElementById(id)||{}).value||'').trim(); };
  var key = 'ajw_content_video';
  var list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}
  var rec = { id:'vid_'+Date.now(), sku:g('VID-SKU'), tipe:g('VID-TIPE'), durasi:g('VID-DUR'), resolusi:g('VID-RES'), pic:g('VID-PIC'), deadline:g('VID-DL'), status:g('VID-STATUS'), url:g('VID-URL'), catatan:g('VID-NOTE'), ts:new Date().toISOString() };
  if (!rec.sku) { toast('SKU / nama produk wajib diisi', 'error'); return; }
  list.unshift(rec);
  try { localStorage.setItem(key, JSON.stringify(list)); } catch(e){}
  toast('Request video disimpan', 'success');
  _renderContent('video');
}

function _contentDeleteVideo(id) {
  var key = 'ajw_content_video';
  var list = [];
  try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e){}
  var idx = list.findIndex(function(r){ return r.id===id; });
  if (idx<0) return;
  list.splice(idx,1);
  try { localStorage.setItem(key, JSON.stringify(list)); } catch(e){}
  toast('Request video dihapus', 'success');
  _renderContent('video');
}

/* ══════════════════════════════════════════════
   8. ADMIN API
   ══════════════════════════════════════════════ */
function _renderContentAPI() {
  var cfg = (typeof getCfg==='function' ? getCfg() : {});
  var h = '';
  h += '<div class="card" style="margin-bottom:12px;padding:12px 14px">';
  h += '<div style="font-size:16px;font-weight:800;color:#F0C56A">Admin API — Content</div>';
  h += '<div style="font-size:11px;color:var(--tx2);margin-top:4px">Konfigurasi API key untuk generate konten otomatis menggunakan AI.</div></div>';

  h += '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">';

  h += '<div class="card" style="margin-bottom:0"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">API Keys AI</div>';
  h += '<div style="background:rgba(240,197,106,.04);border:1px solid rgba(240,197,106,.15);border-radius:8px;padding:10px;margin-bottom:10px;font-size:10px;color:var(--tx2);line-height:1.7">';
  h += 'API keys dikonfigurasi di <b>Admin → Integrasi & API</b>. Halaman ini hanya menampilkan status koneksi untuk modul konten.</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  [['OpenAI / GPT-4o', !!(cfg.openaiKey), '#A7F3B6', 'Untuk copywriting, listing description'], ['Google Gemini', !!(cfg.geminiKey), '#A7F3B6', 'Untuk image caption, alt text'], ['Anthropic Claude', !!(cfg.anthropicKey), '#A7F3B6', 'Untuk long-form content, A+ copy']].forEach(function(api) {
    h += '<div style="background:var(--bg3);border:1px solid ' + (api[1] ? api[2]+'44' : 'var(--bd)') + ';border-radius:8px;padding:10px">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">';
    h += '<div><div style="font-size:11px;font-weight:800;color:var(--tx)">' + api[0] + '</div>';
    h += '<div style="font-size:10px;color:var(--tx2);margin-top:3px">' + api[3] + '</div></div>';
    h += '<span style="font-size:10px;font-weight:700;color:' + (api[1] ? '#A7F3B6' : '#FF9D9D') + '">' + (api[1] ? 'Aktif' : 'Belum') + '</span></div></div>';
  });
  h += '</div>';
  h += '<div style="margin-top:10px"><button class="btns" onclick="typeof _navTo===\'function\'&&_navTo(\'admin\')" style="font-size:11px">Konfigurasi di Admin</button></div></div>';

  h += '<div class="card" style="margin-bottom:0"><div style="font-size:13px;font-weight:800;color:var(--tx);margin-bottom:10px">Integrasi Drive & Storage</div>';
  h += '<div style="background:rgba(143,208,255,.04);border:1px solid rgba(143,208,255,.15);border-radius:8px;padding:10px;margin-bottom:10px;font-size:10px;color:var(--tx2);line-height:1.7">';
  h += 'Google Drive digunakan untuk menyimpan aset foto dan video konten. Pastikan token Drive sudah dikonfigurasi.</div>';
  h += '<div style="display:flex;flex-direction:column;gap:8px">';
  [['Google Drive', !!(cfg.driveToken), 'Upload foto listing & video'], ['Supabase', !!(cfg.supabaseUrl && cfg.supabaseKey), 'Sinkronisasi data konten']].forEach(function(integ) {
    h += '<div style="background:var(--bg3);border:1px solid ' + (integ[1] ? '#8FD0FF44' : 'var(--bd)') + ';border-radius:8px;padding:10px">';
    h += '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">';
    h += '<div><div style="font-size:11px;font-weight:800;color:var(--tx)">' + integ[0] + '</div>';
    h += '<div style="font-size:10px;color:var(--tx2);margin-top:3px">' + integ[2] + '</div></div>';
    h += '<span style="font-size:10px;font-weight:700;color:' + (integ[1] ? '#8FD0FF' : '#FF9D9D') + '">' + (integ[1] ? 'Terhubung' : 'Belum') + '</span></div></div>';
  });
  h += '</div></div>';
  h += '</div>';
  return h;
}
