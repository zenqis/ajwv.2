(function(){
  function style(){return `
<style id="AJW-GI-STYLE">
#AJW-GI-ROOT{color:var(--tx,#D7E1EA);font-family:inherit;background:transparent!important}
.ajwgi-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:12px}
.ajwgi-title{font-size:18px;font-weight:800;color:var(--tx,#D7E1EA)}
.ajwgi-sub{font-size:12px;color:var(--tx2,#8FA0B3);margin-top:5px;line-height:1.5;max-width:980px}
.ajwgi-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
.ajwgi-tabs .workspace-tab{border:1px solid var(--bd,rgba(255,255,255,.10));background:var(--bg3,#111);color:var(--tx2,#8FA0B3);border-radius:8px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer}
.ajwgi-tabs .workspace-tab.active{background:rgba(251,191,36,.12)!important;color:var(--accent,#F0C56A)!important;border-color:rgba(251,191,36,.28)!important;box-shadow:none}
.workspace-panel.hidden,#AJW-GI-ROOT .hidden{display:none!important}
.gi-workspace{display:grid;grid-template-columns:minmax(320px,390px) minmax(0,1fr);gap:12px;align-items:start}
.gi-panel{background:var(--bg2,#0F1115)!important;border:1px solid var(--bd,rgba(255,255,255,.10))!important;border-radius:8px;padding:14px;box-shadow:none!important;color:var(--tx,#D7E1EA)!important}
.gi-output{min-height:520px;display:grid;grid-template-rows:auto auto 1fr;gap:12px}
.gi-panel-title{font-size:14px;font-weight:800;color:var(--tx,#D7E1EA);margin-bottom:10px}
.gi-grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.gi-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.gi-api-stack{display:grid;gap:12px}
.gi-api-section{background:var(--bg3,#111)!important;border:1px solid var(--bd,rgba(255,255,255,.10))!important;border-radius:8px;padding:14px}
.gi-api-section.primary{background:var(--bg3,#111)!important;border-color:rgba(251,191,36,.24)!important}
.gi-section-title{font-size:12px;font-weight:800;color:var(--tx2,#8FA0B3);text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px}
.gi-grid-fit{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
.gi-field{display:grid;gap:6px;margin-bottom:10px}
.gi-field label,.gi-label{font-size:11px;font-weight:700;color:var(--tx2,#8FA0B3);text-transform:uppercase;letter-spacing:.04em}
.gi-field input,.gi-field select,.gi-field textarea{width:100%;background:#111!important;border:1px solid var(--bd,rgba(255,255,255,.10))!important;color:var(--tx,#D7E1EA)!important;border-radius:8px;padding:9px 10px;font-size:12px;outline:none}
.gi-field textarea{min-height:92px;resize:vertical}
.gi-drop{display:grid;place-items:center;gap:8px;min-height:118px;border:1px dashed var(--bd,rgba(255,255,255,.10));border-radius:8px;background:var(--bg3,#111);color:var(--tx,#D7E1EA);text-align:center;cursor:pointer;padding:14px}
.gi-drop strong{font-size:14px}
.gi-drop span{font-size:11px;color:var(--tx2,#8FA0B3)}
.gi-action{width:100%;border:1px solid transparent;border-radius:8px;background:var(--accent,#F0C56A);color:#0A0A0A;font-weight:800;padding:12px 14px;cursor:pointer}
.gi-muted{font-size:11px;color:var(--tx2,#8FA0B3);line-height:1.5}
.gi-row{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}
.gi-mini-btn{border:1px solid var(--bd,rgba(255,255,255,.10));background:var(--bg3,#111);color:var(--tx,#D7E1EA);border-radius:8px;padding:7px 10px;font-size:11px;font-weight:700;cursor:pointer}
.gi-tools{display:flex;gap:8px;flex-wrap:wrap}
.gi-upload-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}
.gi-upload-list img,.h-full.w-full{width:100%;height:100%;object-fit:cover}
.relative{position:relative}.absolute{position:absolute}.aspect-square{aspect-ratio:1}.overflow-hidden{overflow:hidden}.rounded-lg{border-radius:8px}.border{border:1px solid var(--bd,rgba(255,255,255,.10))}.font-bold{font-weight:800}.text-white{color:var(--tx,#D7E1EA)}
.listing-output-header{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:0}
.listing-output-kicker{font-size:10px;font-weight:800;color:var(--tx2,#8FA0B3);text-transform:uppercase;letter-spacing:.18em}
.listing-output-title{font-size:18px;font-weight:900;color:var(--tx,#D7E1EA)}
.listing-output-tools{display:flex;gap:8px;flex-wrap:wrap}
.listing-output-chip{border:1px solid var(--bd,rgba(255,255,255,.10));background:var(--bg3,#111);color:var(--tx,#D7E1EA);border-radius:999px;padding:7px 10px;font-size:10px;font-weight:800;cursor:pointer}
.listing-output-chip.active,.listing-output-chip:hover{background:rgba(251,191,36,.12);color:var(--accent,#F0C56A);border-color:rgba(251,191,36,.28)}
.gi-progress-shell{border:1px solid #E7E5E4;background:linear-gradient(180deg,#FFFFFF,#FAFAF9);border-radius:12px;padding:12px}
.gi-progress-meta{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}
.gi-progress-title{font-size:12px;font-weight:800;color:#37352F}
.gi-progress-percent{font-size:12px;font-weight:800;color:#57534E}
.gi-progress-track{height:9px;border-radius:999px;overflow:hidden;background:#F1F1EF;border:1px solid #E7E5E4}
.gi-progress-fill{display:block;height:100%;width:0;background:linear-gradient(90deg,#B9A47A,#6D5C4A);transition:width .25s ease}
.gi-progress-detail{margin-top:8px}
.gi-estimator{border:1px solid #E7E5E4;background:linear-gradient(180deg,#FFFFFF,#FAFAF9);border-radius:12px;padding:12px;margin-bottom:10px}
.gi-estimator-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}
.gi-estimator-title{font-size:12px;font-weight:800;color:#37352F}
.gi-estimator-sub{font-size:10px;color:#787774;text-transform:uppercase;letter-spacing:.08em}
.gi-estimator-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.gi-estimator-badge{border:1px solid #E7E5E4;border-radius:10px;background:#FFFFFF;padding:9px 10px}
.gi-estimator-badge .k{font-size:10px;color:#787774;text-transform:uppercase;letter-spacing:.05em}
.gi-estimator-badge .v{font-size:14px;font-weight:800;color:#37352F;margin-top:4px}
.gi-estimator-prompt{margin-top:10px;padding:10px;border-radius:10px;border:1px solid #E7E5E4;background:#FAFAF9;color:#57534E;font-size:11px;line-height:1.55;white-space:pre-wrap;word-break:break-word;max-height:132px;overflow:auto}
.listing-preview-grid,.multi-preview-grid,.aplus-preview-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;align-items:stretch}
.gi-result-card,.listing-card,.multi-card,.aplus-card{overflow:hidden;border-radius:12px;border:1px solid #E7E5E4;background:#FFFFFF;min-height:240px}
.gi-result-frame{display:grid;place-items:center;min-height:240px;background:#FAFAF9}
.gi-result-frame img,.listing-card img,.multi-card img,.aplus-card img{width:100%;height:100%;object-fit:contain;background:#FAFAF9}
.listing-card.main,.multi-card-hero,.aplus-hero{grid-row:span 1;min-height:240px}
.listing-empty,.multi-empty,.bgremove-empty{display:flex;align-items:center;justify-content:center;min-height:520px;border:1px dashed #D6D3D1;border-radius:12px;color:#787774;grid-column:1/-1;text-align:center;padding:18px;background:#FFFFFF}
.module-card,.multi-angle-tile{position:relative;display:grid;gap:5px;border:1px solid #E7E5E4;border-radius:10px;background:#FFFFFF;color:#37352F;padding:12px;text-align:left;cursor:pointer}
.module-card.active,.multi-angle-tile.active{border-color:#D6D3D1;background:#F1F1EF}
.module-card strong,.multi-angle-tile strong{font-size:13px}
.module-card span:last-child,.multi-angle-tile span{font-size:11px;color:#787774}
.module-check{position:absolute;right:10px;top:8px;color:#6D5C4A}
.multi-angle-picker{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.aplus-card-label{position:absolute;top:10px;left:12px;color:#37352F;font-size:18px;font-weight:900}
.light-card{background:#f3eee8;color:#111}.dark-text{color:#777!important}
.aplus-placeholder-content{display:grid;height:100%;place-items:center;text-align:center;padding:16px}
.aplus-placeholder-content h3{font-size:24px;line-height:1.1}
.aplus-placeholder-content p{font-size:12px;color:#666}
.bgremove-preview-grid{display:grid;gap:14px}
.bgremove-card{border:1px solid #E7E5E4;border-radius:12px;background:#FFFFFF;overflow:hidden}
.bgremove-pair{display:grid;grid-template-columns:1fr 1fr}
.bgremove-pane{position:relative;min-height:320px;background:#FAFAF9}
.bgremove-pane img{width:100%;height:100%;object-fit:contain}
.checkerboard{background-color:#f8f8f8;background-image:linear-gradient(45deg,#ececec 25%,transparent 25%),linear-gradient(-45deg,#ececec 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ececec 75%),linear-gradient(-45deg,transparent 75%,#ececec 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0}
.bgremove-badge{position:absolute;top:12px;left:12px;background:rgba(55,53,47,.68);color:#fff;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:800}
.bgremove-card-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;border-top:1px solid #E7E5E4;padding:12px 14px}
.prompt-card{display:grid;grid-template-columns:108px minmax(0,1fr);gap:12px;border:1px solid #E7E5E4;background:#FFFFFF;border-radius:14px;padding:12px;text-align:left;color:#37352F;cursor:pointer;align-items:start}
.prompt-card.active{border-color:#D6D3D1;box-shadow:0 0 0 1px rgba(214,211,209,.7) inset}
.prompt-card-media{width:108px;height:108px;border-radius:12px;overflow:hidden;border:1px solid #E7E5E4;background:#FAFAF9;display:grid;place-items:center;color:#787774;font-size:10px;text-align:center}
.prompt-card-media img{width:100%;height:100%;object-fit:cover}
.prompt-card-body{display:grid;gap:7px;min-width:0}
.prompt-card-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}
.prompt-card-title{font-size:16px;font-weight:800;color:#37352F}
.prompt-card-key{font-size:11px;color:#787774}
.prompt-card-copy{font-size:12px;line-height:1.55;color:#57534E;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.prompt-tag-row{display:flex;gap:6px;flex-wrap:wrap}
.prompt-tag{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:#FAFAF9;border:1px solid #E7E5E4;font-size:10px;font-weight:700;color:#57534E}
.prompt-memory{display:grid;gap:8px;margin-top:12px}
.prompt-memory-item{border:1px solid #E7E5E4;background:#FFFFFF;border-radius:12px;padding:10px 11px}
.prompt-memory-item strong{font-size:12px;color:#37352F}
.prompt-memory-item p{font-size:11px;color:#57534E;line-height:1.5;margin-top:6px}
.prompt-toolbar{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.prompt-toolbar-meta{display:flex;gap:8px;flex-wrap:wrap}
.prompt-cover-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}
.prompt-cover-grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;border:1px solid #E7E5E4}
.multi-prompt-list{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:10px}
.multi-prompt-chip{display:inline-flex;align-items:center;gap:6px;max-width:100%;border:1px solid #E7E5E4;background:#FFFFFF;color:#37352F;border-radius:999px;padding:6px 9px;font-size:11px;font-weight:700;cursor:pointer}
.multi-prompt-chip.active{border-color:#D6D3D1;background:#F1F1EF;color:#37352F}
.multi-prompt-chip input{width:auto!important;margin:0;accent-color:#6D5C4A}
.multi-prompt-chip strong{max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px}
.multi-prompt-chip span{font-size:10px;color:#787774;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.style-mode-btn.active{background:#F1F1EF!important;color:#37352F!important}
.request-layout{display:grid;grid-template-columns:minmax(0,1fr) 390px;gap:12px;align-items:start}
.request-toolbar{display:grid;grid-template-columns:1fr 170px auto;gap:10px;align-items:end}
.request-list{display:grid;gap:10px}
.request-item{display:grid;grid-template-columns:minmax(0,1fr) 112px;gap:12px;border:1px solid #E7E5E4;background:#FFFFFF;border-radius:10px;padding:12px;color:#37352F;text-align:left;cursor:pointer}
.request-item:hover,.request-item.active{border-color:#D6D3D1;background:#FAFAF9}
.request-meta{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11px;color:#787774}
.request-title{font-size:13px;font-weight:800;color:#37352F;margin:6px 0}
.request-prompt{font-size:12px;line-height:1.45;color:#57534E;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.request-preview{width:112px;height:112px;border-radius:8px;border:1px solid #E7E5E4;background:#FAFAF9;display:grid;place-items:center;overflow:hidden;color:#787774;font-size:10px;text-align:center}
.request-preview img{width:100%;height:100%;object-fit:cover}
.request-status{border-radius:999px;padding:3px 7px;font-size:10px;font-weight:800;border:1px solid #E7E5E4;background:#FFFFFF;color:#37352F}
.request-status.success{background:#EEF8F1;border-color:#CFE7D5;color:#2F7D4A}
.request-status.processing{background:#F3F4F6;border-color:#D6D3D1;color:#57534E}
.request-status.error{background:#FFF1F0;border-color:#F5D4D0;color:#B85C5C}
.request-progress{height:7px;background:#F1F1EF;border-radius:999px;overflow:hidden;margin-top:8px}
.request-progress span{display:block;height:100%;width:0;background:#8C7A67;transition:width .2s ease}
.request-detail{position:sticky;top:12px;display:grid;gap:10px;max-height:calc(100vh - 120px);overflow:auto}
.request-detail-image{min-height:230px;border:1px solid #E7E5E4;border-radius:10px;background:#FAFAF9;display:grid;place-items:center;overflow:hidden;color:#787774;font-size:12px;text-align:center}
.request-detail-image img{width:100%;height:100%;object-fit:contain}
.request-detail-kv{display:grid;grid-template-columns:100px 1fr;gap:7px;font-size:11px;color:#57534E}
.request-detail-kv span:nth-child(odd){color:#787774}
.request-code{white-space:pre-wrap;word-break:break-word;background:#FAFAF9;border:1px solid #E7E5E4;border-radius:8px;color:#57534E;padding:12px;font-size:11px;line-height:1.55;max-height:260px;overflow:auto}
.request-section-title{font-size:12px;font-weight:800;color:#37352F;margin-top:4px}
.request-empty{border:1px dashed #D6D3D1;border-radius:12px;padding:24px;text-align:center;color:#787774;background:#FFFFFF}
#AJW-GI-ROOT [style*="background:#ffffff"],
#AJW-GI-ROOT [style*="background:#FFFFFF"],
#AJW-GI-ROOT [style*="background: #ffffff"],
#AJW-GI-ROOT [style*="background:#fafafa"],
#AJW-GI-ROOT [style*="background:#FAFAF9"],
#AJW-GI-ROOT [style*="background:#f8f6f1"],
#AJW-GI-ROOT [style*="background:#f7fbf8"]{background:var(--bg2,#0F1115)!important}
#AJW-GI-ROOT [style*="border:1px solid #e5e5e5"],
#AJW-GI-ROOT [style*="border:1px solid #E7E5E4"],
#AJW-GI-ROOT [style*="border:1px solid #d9d9d9"],
#AJW-GI-ROOT [style*="border-color:#d9d9d9"]{border-color:var(--bd,rgba(255,255,255,.10))!important}
#AJW-GI-ROOT [style*="color:#1f1f1f"],
#AJW-GI-ROOT [style*="color:#37352F"],
#AJW-GI-ROOT [style*="color:#57534E"]{color:var(--tx,#D7E1EA)!important}
#AJW-GI-ROOT [style*="color:#5f5f5f"],
#AJW-GI-ROOT [style*="color:#787774"],
#AJW-GI-ROOT [style*="color:#666"]{color:var(--tx2,#8FA0B3)!important}
#AJW-GI-ROOT input,
#AJW-GI-ROOT select,
#AJW-GI-ROOT textarea{background:#111!important;border-color:var(--bd,rgba(255,255,255,.10))!important;color:var(--tx,#D7E1EA)!important}
#AJW-GI-ROOT .gi-estimator,
#AJW-GI-ROOT .gi-estimator-badge,
#AJW-GI-ROOT .gi-estimator-prompt,
#AJW-GI-ROOT .gi-progress-shell,
#AJW-GI-ROOT .gi-result-card,
#AJW-GI-ROOT .listing-card,
#AJW-GI-ROOT .multi-card,
#AJW-GI-ROOT .aplus-card,
#AJW-GI-ROOT .bgremove-card,
#AJW-GI-ROOT .prompt-card,
#AJW-GI-ROOT .prompt-memory-item,
#AJW-GI-ROOT .multi-prompt-chip,
#AJW-GI-ROOT .request-item,
#AJW-GI-ROOT .request-preview,
#AJW-GI-ROOT .request-status,
#AJW-GI-ROOT .request-detail-image,
#AJW-GI-ROOT .request-code,
#AJW-GI-ROOT .module-card,
#AJW-GI-ROOT .multi-angle-tile,
#AJW-GI-ROOT .listing-empty,
#AJW-GI-ROOT .multi-empty,
#AJW-GI-ROOT .bgremove-empty,
#AJW-GI-ROOT .request-empty{background:var(--bg2,#0F1115)!important;border-color:var(--bd,rgba(255,255,255,.10))!important;color:var(--tx,#D7E1EA)!important}
#AJW-GI-ROOT .gi-result-frame,
#AJW-GI-ROOT .listing-card img,
#AJW-GI-ROOT .multi-card img,
#AJW-GI-ROOT .aplus-card img,
#AJW-GI-ROOT .prompt-card-media,
#AJW-GI-ROOT .request-progress{background:var(--bg3,#111)!important;border-color:var(--bd,rgba(255,255,255,.10))!important}
#AJW-GI-ROOT .module-card.active,
#AJW-GI-ROOT .multi-angle-tile.active,
#AJW-GI-ROOT .multi-prompt-chip.active,
#AJW-GI-ROOT .style-mode-btn.active{background:rgba(251,191,36,.12)!important;color:var(--accent,#F0C56A)!important;border-color:rgba(251,191,36,.28)!important}
#AJW-GI-ROOT .prompt-card-title,
#AJW-GI-ROOT .prompt-memory-item strong,
#AJW-GI-ROOT .request-title,
#AJW-GI-ROOT .gi-estimator-title,
#AJW-GI-ROOT .gi-estimator-badge .v{color:var(--tx,#D7E1EA)!important}
#AJW-GI-ROOT .prompt-card-key,
#AJW-GI-ROOT .prompt-card-copy,
#AJW-GI-ROOT .prompt-memory-item p,
#AJW-GI-ROOT .module-card span:last-child,
#AJW-GI-ROOT .multi-angle-tile span,
#AJW-GI-ROOT .request-meta,
#AJW-GI-ROOT .request-prompt,
#AJW-GI-ROOT .gi-estimator-badge .k,
#AJW-GI-ROOT .gi-estimator-sub{color:var(--tx2,#8FA0B3)!important}
.request-section-title{color:var(--tx,#D7E1EA)!important}
.request-empty{border-color:var(--bd,rgba(255,255,255,.10))!important;color:var(--tx2,#8FA0B3)!important;background:var(--bg2,#0F1115)!important}
table,th,td{border-color:var(--bd,rgba(255,255,255,.10))!important}
@media(max-width:1100px){.gi-workspace{grid-template-columns:1fr}.gi-estimator-grid,.listing-preview-grid,.multi-preview-grid,.aplus-preview-grid{grid-template-columns:1fr 1fr}.prompt-card{grid-template-columns:88px minmax(0,1fr)}.prompt-card-media{width:88px;height:88px}}
@media(max-width:900px){.request-layout,.request-toolbar{grid-template-columns:1fr}.request-detail{position:static;max-height:none}}
@media(max-width:720px){.gi-grid2,.gi-grid3,.gi-estimator-grid,.listing-preview-grid,.multi-preview-grid,.aplus-preview-grid,.bgremove-pair,.prompt-cover-grid{grid-template-columns:1fr}.multi-angle-picker{grid-template-columns:1fr 1fr}.prompt-card{grid-template-columns:1fr}.prompt-card-media{width:100%;height:160px}}
</style>`}
  function field(label, body){return '<div class="gi-field"><label>'+label+'</label>'+body+'</div>'}
  function upload(id,count,label){var btnMap={listingProductUpload:'listingUploadBtn',multiProductUpload:'multiUploadBtn',aplusProductUpload:'aplusUploadBtn',bgremoveUpload:'bgremoveUploadBtn'};var listMap={listingProductUpload:'listingUploadList',multiProductUpload:'multiUploadList',aplusProductUpload:'aplusUploadList',bgremoveUpload:'bgremoveUploadList'};var btnId=btnMap[id]||id+'Btn';var listId=listMap[id]||id+'List';return '<div class="gi-field"><div class="gi-row"><label>'+label+'</label><span id="'+count+'" class="gi-muted">0/8</span></div><input id="'+id+'" class="hidden" accept="image/*" multiple type="file"><button id="'+btnId+'" class="gi-drop" type="button"><strong>Upload Images</strong><span>JPG, PNG, WEBP sampai 10MB</span></button><div id="'+listId+'" class="gi-upload-list"></div></div>'}
  function markup(){return style()+`
<div class="ajwgi-head"><div><div class="ajwgi-title">Generate Image</div><div class="ajwgi-sub">Studio AI image AJW untuk input gambar, prompt, dan output visual. Layout sudah native mengikuti tema web AJW, sementara logic generate tetap memakai sistem lama.</div></div><div class="gi-tools"><span class="chip" id="apiStatus">API belum disetel</span></div></div>
<div class="ajwgi-tabs">
<button class="workspace-tab active" data-workspace-target="listing-images" type="button">Listing Images</button><button class="workspace-tab" data-workspace-target="aplus-content" type="button">A+ Content</button><button class="workspace-tab" data-workspace-target="multi-angle" type="button">Multi-Angle</button><button class="workspace-tab" data-workspace-target="requests-tab" type="button">Requests</button><button class="workspace-tab" data-workspace-target="admin-tab" type="button">Admin API</button><button class="workspace-tab" data-workspace-target="prompt-hub" type="button">Prompt</button><button class="workspace-tab" data-workspace-target="video-generation" type="button">Generate Video</button>
</div>
<div style="display:none"><button id="folderToggleBtn"></button><span id="folderToggleIcon"></span><div id="folderDropdown"></div><span id="folderListingCount"></span><span id="folderMultiCount"></span><span id="folderAplusCount"></span></div>
<section id="listing-images" class="workspace-panel"><div class="gi-workspace"><aside class="gi-panel"><div class="gi-panel-title">Input Listing</div>${upload('listingProductUpload','listingProductCount','Gambar Produk')}
<div class="gi-grid2">${field('Model','<select id="listingProvider"><option value="custom" selected>Custom API</option><option value="gpt">GPT</option><option value="fal">Fal.ai GPT Image 2</option><option value="gemini">Gemini</option></select>')}${field('Model Image','<select id="listingImageModel"><option value="cx/gpt-5.5">cx/gpt-5.5</option><option value="nano-banana-pro">nano-banana-pro</option><option value="gpt-image-1">gpt-image-1</option></select>')}</div><div class="gi-grid2">${field('Image Count','<select id="listingQuantity"><option value="1">1 Image</option><option value="2">2 Images</option><option value="3">3 Images</option><option value="4">4 Images</option><option value="5">5 Images</option></select>')}${field('Aspect Ratio','<select id="listingSize"><option value="auto">Auto</option><option value="1536x1024">16:9</option><option value="1024x1024">1:1</option></select>')}</div>
${field('Target Bahasa','<select id="listingLanguage"><option value="Indonesia">Indonesia</option><option value="English">Inggris</option><option value="Chinese">China</option></select>')}${field('Product Selling Points','<textarea id="listingSellingPoints" placeholder="Product Name:\nCore Selling Points:\nTarget Audience:\nExpected Scenarios:\nSize Parameters:"></textarea>')}${field('Template Prompt','<select id="listingTemplate"></select>')}${field('Custom Prompt','<textarea id="listingPrompt" placeholder="Tambahkan arahan visual..."></textarea>')}<div id="listingEstimateBox" class="gi-estimator"></div><button id="generateListingBtn" class="gi-action" type="button">Generate Listing Images</button><p id="listingStatus" class="gi-muted">Upload minimal satu gambar produk.</p></aside><main class="gi-panel gi-output"><div id="listingProgressBox" class="gi-progress-shell hidden"><div class="gi-progress-meta"><div class="gi-progress-title" id="listingProgressTitle">Menunggu generate</div><div class="gi-progress-percent" id="listingProgressPercent">0%</div></div><div class="gi-progress-track"><span id="listingProgressBar" class="gi-progress-fill"></span></div><div id="listingProgressDetail" class="gi-muted gi-progress-detail">Progress output listing akan muncul di sini.</div></div><div class="listing-output-header"><div><p class="listing-output-kicker">Generated Output</p><h3 class="listing-output-title">Listing Image Output</h3></div><div class="listing-output-tools"><button id="listingPreviewModeBtn" class="listing-output-chip active" type="button">Preview</button><button id="listingAutoLayoutBtn" class="listing-output-chip" type="button">Auto Layout</button><button id="listingDownloadBtn" class="listing-output-chip" type="button">Unduh</button></div></div><div id="listingPreviewGrid" class="listing-preview-grid"><div class="listing-empty">Belum ada listing image yang dihasilkan.</div></div></main></div></section>
<section id="aplus-content" class="workspace-panel hidden"><div class="gi-workspace"><aside class="gi-panel"><div class="gi-panel-title">Input A+ Content</div>${upload('aplusProductUpload','aplusProductCount','Product Images').replace('0/8','0/5')}${field('E-commerce Platform','<select id="aplusPlatform"><option>Amazon</option><option>TikTok Shop</option><option>Shopify</option><option>Walmart</option></select>')}<div class="gi-grid2">${field('Model','<select id="aplusProvider"><option value="custom" selected>Custom API</option><option value="gpt">GPT</option><option value="fal">Fal.ai GPT Image 2</option><option value="gemini">Gemini</option></select>')}${field('Model Image','<select id="aplusImageModel"></select>')}</div><div class="gi-grid2">${field('Target Bahasa','<select id="aplusLanguage"><option value="Indonesia">Indonesia</option><option value="English">Inggris</option><option value="Chinese">China</option></select>')}${field('Aspect Ratio','<select id="aplusAspectRatio"><option>1:1 Square</option><option>4:5 Portrait</option><option>16:9 Landscape</option><option>3:4 Story Layout</option></select>')}</div>${field('Prompt Preset','<select id="aplusPromptPreset"></select>')}${field('Core Selling Points','<textarea id="aplusSellingPoints" placeholder="Product name, selling points, target audience..."></textarea>')}<div class="gi-grid2"><button id="oneClickAnalysisBtn" class="gi-mini-btn" type="button">One-Click Analysis</button><button id="generateSellingPointsBtn" class="gi-mini-btn" type="button">AI Generate</button></div><div class="gi-grid2" style="margin:10px 0"><button id="styleModeTrending" class="gi-mini-btn style-mode-btn active" type="button">Trending</button><button id="styleModeReference" class="gi-mini-btn style-mode-btn" type="button">Reference</button></div><div id="trendingStylePanel"><button id="trendingStyleAnalysisBtn" class="gi-mini-btn" type="button">Trending Style Analysis</button></div><div id="referenceStylePanel" class="hidden"><div class="gi-field"><div class="gi-row"><label>Style Reference</label><span id="aplusReferenceCount" class="gi-muted">0/5</span></div><input id="aplusReferenceUpload" class="hidden" accept="image/*" multiple type="file"><button id="aplusReferenceBtn" class="gi-drop" type="button"><strong>Upload Reference</strong><span>Style atau layout acuan</span></button><div id="aplusReferenceList" class="gi-upload-list"></div></div>${field('Design Requirements','<textarea id="aplusDesignRequirements" placeholder="Warna, layout, creative direction..."></textarea>')}</div><div class="gi-row"><span id="aplusModuleCount" class="gi-muted">0/16 selected</span></div><div id="aplusModuleGrid" class="gi-grid2">${['hero-shot:Hero Shot','selling-points:Selling Points','lifestyle-scene:Lifestyle Scene','multi-angle-view:Multi-Angle View','atmosphere-scene:Atmosphere Scene','product-detail:Product Detail','brand-story:Brand Story','size-chart:Size Chart','before-after:Before & After','detailed-specs:Detailed Specs','craftsmanship:Craftsmanship','accessories:Accessories','series-showcase:Series Showcase','ingredients:Ingredients','comparison:Comparison Table','faq:FAQ Block'].map(function(x,i){var p=x.split(':');return '<button class="module-card '+(i<6?'active':'')+'" data-module-key="'+p[0]+'" data-module-label="'+p[1]+'" data-module-description="AJW product visual module" type="button"><span class="module-check">✓</span><strong>'+p[1]+'</strong><span>Prompt module</span></button>'}).join('')}</div><div id="aplusEstimateBox" class="gi-estimator"></div><button id="generateAplusBtn" class="gi-action" type="button" style="margin-top:10px">Generate A+ Content</button><p id="aplusGenerateHint" class="gi-muted">Upload minimal satu produk.</p></aside><main class="gi-panel gi-output"><div id="aplusProgressBox" class="gi-progress-shell hidden"><div class="gi-progress-meta"><div class="gi-progress-title" id="aplusProgressTitle">Menunggu generate</div><div class="gi-progress-percent" id="aplusProgressPercent">0%</div></div><div class="gi-progress-track"><span id="aplusProgressBar" class="gi-progress-fill"></span></div><div id="aplusProgressDetail" class="gi-muted gi-progress-detail">Progress output A+ akan muncul di sini.</div></div><div class="listing-output-header"><div><p class="listing-output-kicker">Generated Output</p><h3 class="listing-output-title">A+ Content Output</h3></div></div><div id="aplusPreviewGrid" class="aplus-preview-grid"><article class="aplus-card aplus-hero"><img id="aplusHeroImage" src="tools/generate-image/assets/premium-example.png" alt="Hero preview"></article><article class="aplus-card"><img id="aplusCard2Image" src="tools/generate-image/assets/premium-example.png" alt="Preview"></article><article class="aplus-card"><img id="aplusCard3Image" src="tools/generate-image/assets/premium-example.png" alt="Preview"></article></div></main></div></section>
<section id="multi-angle" class="workspace-panel hidden"><div class="gi-workspace"><aside class="gi-panel"><div class="gi-panel-title">Input Multi-Angle</div>${upload('multiProductUpload','multiProductCount','Gambar Produk')}<div class="gi-grid2">${field('Model','<select id="multiProvider"><option value="custom" selected>Custom API</option><option value="gpt">GPT</option><option value="fal">Fal.ai GPT Image 2</option><option value="gemini">Gemini</option></select>')}${field('Model Image','<select id="multiImageModel"></select>')}</div>${field('Aspect Ratio','<select id="multiAspectRatio"><option value="1024x1024">1:1</option><option value="1536x1024">16:9</option><option value="1024x1536">2:3</option><option value="auto">Auto</option></select>')}${field('List Prompt','<select id="multiTemplate"><option value="all">All Prompt</option><option value="angle" selected>Prompt Angle</option><option value="custom">Custom Prompt</option></select>')}<div class="gi-row"><span id="multiAngleCountLabel" class="gi-muted">0 prompt selected</span><div><button id="multiSelectAllBtn" class="gi-mini-btn" type="button">Select All</button><button id="multiClearBtn" class="gi-mini-btn" type="button">Clear Selected</button></div></div>${field('Custom Prompt','<textarea id="multiPrompt" placeholder="Tulis prompt custom untuk 1 output..."></textarea>')}<div id="multiPromptList" class="multi-prompt-list"></div><div id="multiEstimateBox" class="gi-estimator"></div><div id="multiAngleGrid" class="multi-angle-picker" style="display:none">${[['front','Front','0°'],['front-side','Front Side','45°'],['side','Side','90°'],['back-side','Back Side','135°'],['back','Back','180°'],['top-down','Top Down','55°'],['bottom-up','Bottom Up','-40°'],['front-elevated','Front Elevated','45° / 35°'],['front-closeup','Front Close-up','1.6x']].map(function(a){return '<button class="multi-angle-tile active" data-angle-key="'+a[0]+'" data-angle-name="'+a[1]+'" data-angle-prompt="'+a[1]+' product angle" type="button"><strong>'+a[1]+'</strong><span>'+a[2]+'</span></button>'}).join('')}</div><button id="generateMultiBtn" class="gi-action" type="button" style="margin-top:10px">Generate Multi-Angle</button><p id="multiStatus" class="gi-muted">Upload gambar produk untuk generate angle.</p></aside><main class="gi-panel gi-output"><div id="multiProgressBox" class="gi-progress-shell hidden"><div class="gi-progress-meta"><div class="gi-progress-title" id="multiProgressTitle">Menunggu generate</div><div class="gi-progress-percent" id="multiProgressPercent">0%</div></div><div class="gi-progress-track"><span id="multiProgressBar" class="gi-progress-fill"></span></div><div id="multiProgressDetail" class="gi-muted gi-progress-detail">Progress output multi-angle akan muncul di sini.</div></div><div class="listing-output-header"><div><p class="listing-output-kicker">Generated Output</p><h3 class="listing-output-title">Multi-Angle Output</h3><p id="multiHeroSubtitle" class="gi-muted">AI generates selected angles automatically</p></div><button id="multiDownloadBtn" class="listing-output-chip" type="button">Unduh Semua</button></div><div id="multiPreviewGrid" class="multi-preview-grid"><div class="multi-empty">Belum ada hasil multi-angle.</div></div></main></div></section>
<section id="background-removal" class="workspace-panel hidden"><div class="gi-workspace"><aside class="gi-panel"><div class="gi-panel-title">Input Background Removal</div>${upload('bgremoveUpload','bgremoveCount','Gambar Untuk Cutout')}<div class="gi-grid2">${field('Model','<select id="bgremoveProvider"><option value="custom" selected>Custom API</option><option value="gpt">GPT</option><option value="fal">Fal.ai GPT Image 2</option><option value="gemini">Gemini</option></select>')}${field('Model Image','<select id="bgremoveImageModel"></select>')}</div>${field('Cutout Model','<select id="bgremoveModel"><option value="quick">Quick Remove</option><option value="quick-hd">Quick Remove HD</option><option value="product">Product Cutout</option></select>')}${field('Prompt Preset','<select id="bgremovePromptPreset"></select>')}<div class="gi-grid2">${field('Target Bahasa','<select id="bgremoveLanguage"><option value="Indonesia">Indonesia</option><option value="English">Inggris</option><option value="Chinese">China</option></select>')}${field('Resolution','<select id="bgremoveResolution"><option>High</option><option>Standard</option></select>')}</div><div class="gi-grid2">${field('Output Format','<select id="bgremoveFormat"><option>PNG transparent</option><option>PNG white background</option></select>')}<label class="gi-field"><span class="gi-label">Refine</span><input id="bgremoveRefine" type="checkbox" checked></label></div><div id="bgremoveEstimateBox" class="gi-estimator"></div><button id="generateBgremoveBtn" class="gi-action" type="button">Remove Background</button><p id="bgremoveStatus" class="gi-muted">Upload gambar untuk mulai.</p></aside><main class="gi-panel gi-output"><div id="bgremoveProgressBox" class="gi-progress-shell hidden"><div class="gi-progress-meta"><div class="gi-progress-title" id="bgremoveProgressTitle">Menunggu proses</div><div class="gi-progress-percent" id="bgremoveProgressPercent">0%</div></div><div class="gi-progress-track"><span id="bgremoveProgressBar" class="gi-progress-fill"></span></div><div id="bgremoveProgressDetail" class="gi-muted gi-progress-detail">Progress background removal akan muncul di sini.</div></div><div class="listing-output-header"><div><p class="listing-output-kicker">Generated Output</p><h3 class="listing-output-title">Before / After</h3></div><button id="bgremoveDownloadBtn" class="listing-output-chip" type="button">Unduh Semua</button></div><div id="bgremovePreviewGrid" class="bgremove-preview-grid"><div class="bgremove-empty">Belum ada hasil background removal.</div></div></main></div></section>
<section id="brand-information" class="workspace-panel hidden"><div class="gi-workspace"><aside class="gi-panel"><div class="gi-panel-title">Brand Information</div>${field('Logo Brand','<input id="brandLogo" type="file" accept="image/*"><img id="brandLogoPreview" class="hidden" style="width:84px;height:84px;object-fit:contain;border:1px solid #E7E5E4;border-radius:10px;margin-top:8px">')}${field('Nama Brand','<input id="brandName" placeholder="AJW Official">')}${field('Kategori Produk','<input id="brandProductCategory">')}${field('Reputasi Toko','<input id="brandStoreReputation">')}${field('Deskripsi Lainnya','<textarea id="brandDescription"></textarea>')}<div class="gi-grid2"><button id="brandSaveBtn" class="gi-action" type="button">Simpan Brand</button><button id="brandClearBtn" class="gi-mini-btn" type="button">Reset</button></div><p id="brandStatus" class="gi-muted"></p></aside><main class="gi-panel"><div class="gi-panel-title">Preview Context</div><div class="gi-row" style="justify-content:flex-start"><div style="width:72px;height:72px;border:1px solid #E7E5E4;border-radius:10px;display:grid;place-items:center;background:#FAFAF9"><img id="brandReferenceLogo" class="hidden" style="width:100%;height:100%;object-fit:contain"><span id="brandReferenceLogoPlaceholder" class="gi-muted">No Logo</span></div><div><div id="brandReferenceName" style="font-weight:900;color:#37352F">Belum ada nama brand</div><div id="brandReferenceMeta" class="gi-muted"></div></div></div><pre id="brandReferencePrompt" class="gi-panel" style="white-space:pre-wrap;margin-top:12px"></pre></main></div></section>
<section id="video-generation" class="workspace-panel hidden"><div id="AJW-GI-VIDEO-ROOT" class="gi-panel">Memuat Generate Video...</div></section><section id="requests-tab" class="workspace-panel hidden"><div class="gi-panel"><div class="listing-output-header"><div><p class="listing-output-kicker">History</p><h3 class="listing-output-title">Request History</h3></div><div class="listing-output-tools"><button id="requestClearHistoryBtn" class="listing-output-chip" type="button">Clear History</button></div></div><div class="request-toolbar">${field('Search Request','<input id="requestSearch" placeholder="Cari request ID, prompt, model...">')}${field('Status','<select id="requestStatusFilter"><option value="all">All</option><option value="processing">In progress</option><option value="success">Success</option><option value="error">Error</option></select>')}<label class="gi-field"><span class="gi-label">Preview</span><input id="requestShowPreview" type="checkbox" checked></label></div></div><div class="request-layout"><main class="gi-panel"><div id="requestHistoryList" class="request-list"><div class="request-empty">Belum ada request. Generate gambar pertama akan muncul di sini.</div></div></main><aside id="requestDetailPanel" class="gi-panel request-detail"><div><div class="listing-output-kicker">Request</div><h3 id="requestDetailTitle" class="listing-output-title">Pilih request</h3><p id="requestDetailSubtitle" class="gi-muted">Detail request akan muncul di sini.</p></div><div id="requestDetailImage" class="request-detail-image">No image selected</div><div class="gi-tools"><button id="requestShareBtn" class="gi-mini-btn" type="button">Share</button><button id="requestDownloadBtn" class="gi-mini-btn" type="button">Download</button><button id="requestCopyPromptBtn" class="gi-mini-btn" type="button">Copy Prompt</button></div><div id="requestDetailMeta" class="request-detail-kv"></div><div class="request-section-title">Input</div><pre id="requestInputBlock" class="request-code">{}</pre><div class="request-section-title">Output</div><pre id="requestOutputBlock" class="request-code">{}</pre><div class="request-section-title">Code</div><pre id="requestCodeBlock" class="request-code">// code akan muncul setelah request dipilih</pre></aside></div></section><section id="admin-tab" class="workspace-panel hidden"><div class="gi-api-stack"><div class="gi-panel"><div class="gi-panel-title">Admin API</div><p class="gi-muted" style="margin-bottom:10px">Isi API GPT, Custom API, Gemini, dan Grok/xAI di sini. Generate Video akan otomatis memakai key Grok dari form ini.</p><div class="gi-api-section primary"><div class="gi-section-title">Custom API</div><div class="gi-grid-fit">${field('Custom Provider','<input id="customProviderName" placeholder="cx/gpt-5.5">')}${field('Custom API Base','<input id="customApiBaseUrl" placeholder="https://r566dyc.9router.com/v1">')}${field('Custom API Key','<input id="customApiKey" type="password">')}${field('Custom Model Default','<input id="customImageModel" placeholder="cx/gpt-5.5">')}</div><div class="gi-tools"><button id="testCustomConnectionBtn" class="gi-mini-btn" type="button">Test Custom</button><p id="customConnectionStatus" class="gi-muted"></p></div></div><div class="gi-api-section"><div class="gi-section-title">GPT</div><div class="gi-grid-fit">${field('GPT API Base','<input id="gptApiBaseUrl" placeholder="https://api.openai.com/v1">')}${field('GPT API Key','<input id="gptApiKey" type="password">')}${field('Test GPT','<button id="testGptConnectionBtn" class="gi-mini-btn" type="button">Test GPT</button><p id="gptConnectionStatus" class="gi-muted"></p>')}</div></div><div class="gi-api-section"><div class="gi-section-title">Gemini</div><div class="gi-grid-fit">${field('Gemini API Base','<input id="geminiApiBaseUrl">')}${field('Gemini API Key','<input id="geminiApiKey" type="password">')}${field('Gemini Model','<input id="geminiImageModel">')}${field('Test Gemini','<button id="testGeminiConnectionBtn" class="gi-mini-btn" type="button">Test Gemini</button><p id="geminiConnectionStatus" class="gi-muted"></p>')}</div></div><div class="gi-api-section"><div class="gi-section-title">Fal.ai GPT Image 2</div><div class="gi-grid-fit">${field('Fal API Base','<input id="falApiBaseUrl" placeholder="https://fal.run">')}${field('Fal API Key','<input id="falApiKey" type="password" placeholder="FAL_KEY">')}${field('Fal Model','<input id="falImageModel" placeholder="openai/gpt-image-2/edit">')}${field('Image Size','<select id="falImageSize"><option value="auto">auto</option><option value="square">square</option><option value="square_hd">square_hd</option><option value="portrait_4_3">portrait_4_3</option><option value="portrait_16_9">portrait_16_9</option><option value="landscape_4_3">landscape_4_3</option><option value="landscape_16_9">landscape_16_9</option></select>')}${field('Quality','<select id="falQuality"><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select>')}${field('Test Fal.ai','<button id="testFalConnectionBtn" class="gi-mini-btn" type="button">Test Fal.ai</button><p id="falConnectionStatus" class="gi-muted"></p>')}</div><p class="gi-muted" style="margin-top:8px">Fal.ai openai/gpt-image-2/edit memakai prompt + image_urls, quality high, output PNG. Key disimpan di browser seperti API key lain.</p></div><div class="gi-api-section"><div class="gi-section-title">Grok / xAI Video</div><div class="gi-grid-fit">${field('Grok / xAI API Key','<input id="xaiApiKey" type="password" placeholder="xai-...">')}${field('Video Model','<input id="videoModel" placeholder="grok-imagine-video">')}${field('Polling Interval','<input id="pollInterval" type="number">')}</div><p class="gi-muted" style="margin-top:8px">Dipakai otomatis oleh tab Generate Video. Jika kosong, sistem masih akan fallback ke xAI key dari Admin utama AJW.</p></div><div class="gi-api-section"><div class="gi-section-title">Storage & System</div><div class="gi-grid-fit">${field('Supabase URL','<input id="supabaseUrl">')}${field('Supabase Anon Key','<input id="supabaseAnonKey" type="password">')}</div></div><div class="gi-tools"><button id="saveSettingsBtn" class="gi-action" type="button" style="width:auto">Simpan Setting</button><button id="clearSettingsBtn" class="gi-mini-btn" type="button">Clear</button></div></div></div></section><section id="prompt-hub" class="workspace-panel hidden"><div class="gi-workspace"><aside class="gi-panel"><div class="gi-panel-title">Prompt Editor</div><div class="gi-grid2">${field('Feature','<select id="promptFeature"><option value="listing">Listing</option><option value="aplus">A+ Content</option><option value="multi_angle">Multi-Angle</option><option value="bgremove">Background Removal</option></select>')}${field('Prompt Key','<input id="promptKey" placeholder="thumbnail-hero">')}</div>${field('Prompt Title','<input id="promptTitle" placeholder="Thumbnail Hero Marketplace">')}${field('Tag','<input id="promptTag" placeholder="thumbnail, marketplace, hero">')}${field('Prompt Content','<textarea id="promptContent" placeholder="Tulis prompt utama yang akan dipakai generate..."></textarea>')}<div class="gi-field"><div class="gi-row"><label>Gambar Prompt</label><span id="promptImageCount" class="gi-muted">0/8</span></div><input id="promptImageUpload" class="hidden" accept="image/*" multiple type="file"><button id="promptImageBtn" class="gi-drop" type="button"><strong>Upload Images</strong><span>Thumbnail dan referensi visual untuk prompt</span></button><div id="promptImageList" class="gi-upload-list"></div></div><div class="gi-tools"><button id="promptNewBtn" class="gi-mini-btn" type="button">New</button><button id="promptPreviewBtn" class="gi-mini-btn" type="button">Preview</button><button id="promptSaveBtn" class="gi-action" type="button" style="width:auto">Simpan</button><button id="promptDeleteBtn" class="gi-mini-btn" type="button">Hapus</button></div><p id="promptStatus" class="gi-muted"></p></aside><main class="gi-panel"><div class="prompt-toolbar"><div><div class="gi-panel-title" style="margin-bottom:4px">Prompt Library</div><div class="gi-muted">Kumpulan prompt rapi dengan thumbnail, tag, dan bisa diedit ulang.</div></div><div class="prompt-toolbar-meta"><span id="promptCount" class="chip">0 preset</span></div></div><div id="promptList" style="display:grid;gap:10px"></div><div class="prompt-memory"><div class="gi-panel-title" style="margin-bottom:0">Memory Dari Generate</div><div id="promptMemoryList" style="display:grid;gap:8px"></div></div><pre id="promptPreviewOutput" class="gi-panel" style="white-space:pre-wrap;margin-top:12px;min-height:180px"></pre></main></div></section>`}
  window.AJWGenerateImageMount=function(root){
    root.innerHTML=markup();
    var old=document.getElementById('AJW-GI-APP'); if(old) old.remove();
    var s=document.createElement('script'); s.id='AJW-GI-APP'; s.src='tools/generate-image/app.embedded.js?v='+(Date.now()); document.body.appendChild(s);
  };
})();

