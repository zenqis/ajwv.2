(function(){
  const STORE_KEY = 'ajw_foto_produk_rows';
  const META_KEY = 'ajw_foto_produk_meta';
  const FOLDER_KEY = 'ajw_foto_produk_folders';
  const DEFAULT_FOLDERS = ['Reel','Senar'];
  const IMAGE_EXTS = ['jpg','jpeg','png','webp','gif','bmp','svg','avif','heic','heif'];
  const VIDEO_EXTS = ['mp4','mov','avi','mkv','webm','m4v','3gp','mpeg','mpg','wmv'];

  function esc(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

  function uid(){
    return 'fp_' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function money(value){
    return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
  }

  function getEl(id){
    return document.getElementById(id);
  }

  function hostId(){
    return window._fotoProdukHostId || 'V-foto';
  }

  function activeFolder(){
    return window._fotoProdukActiveFolder || '';
  }

  function activeView(){
    return window._fotoProdukView || 'grid';
  }

  function activeSearch(){
    return window._fotoProdukSearch || '';
  }

  function activeSection(){
    return window._fotoProdukSection || 'produk';
  }

  function selectedIds(){
    if(!Array.isArray(window._fotoProdukSelectedIds)) window._fotoProdukSelectedIds = [];
    return window._fotoProdukSelectedIds;
  }

  function setSelectedIds(list){
    window._fotoProdukSelectedIds = Array.isArray(list) ? list : [];
  }

  function extOf(file){
    const name = String((file && file.name) || '').trim();
    const idx = name.lastIndexOf('.');
    return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
  }

  function isImage(file){
    const type = String((file && file.type) || '').toLowerCase();
    const ext = extOf(file);
    return type.startsWith('image/') || IMAGE_EXTS.includes(ext);
  }

  function isVideo(file){
    const type = String((file && file.type) || '').toLowerCase();
    const ext = extOf(file);
    return type.startsWith('video/') || VIDEO_EXTS.includes(ext);
  }

  function loadFolders(){
    try{
      const raw = localStorage.getItem(FOLDER_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return [...new Set([...DEFAULT_FOLDERS, ...(Array.isArray(parsed) ? parsed : []).filter(Boolean)])];
    }catch(_){
      return DEFAULT_FOLDERS.slice();
    }
  }

  function saveFolders(list){
    const clean = [...new Set((Array.isArray(list) ? list : []).map(v => String(v || '').trim()).filter(Boolean))];
    localStorage.setItem(FOLDER_KEY, JSON.stringify(clean));
    return clean;
  }

  async function idbGet(key){
    if(typeof window._toolsProductIdbGet === 'function'){
      try{ return await window._toolsProductIdbGet(key); }catch(_){}
    }
    return null;
  }

  async function idbSet(key, value){
    if(typeof window._toolsProductIdbSet === 'function'){
      try{
        await window._toolsProductIdbSet(key, value);
        return true;
      }catch(_){}
    }
    return false;
  }

  async function loadRows(){
    try{
      const rows = await idbGet(STORE_KEY);
      if(Array.isArray(rows)) return rows;
    }catch(_){}
    try{
      const meta = JSON.parse(localStorage.getItem(META_KEY) || '[]');
      return Array.isArray(meta) ? meta : [];
    }catch(_){
      return [];
    }
  }

  async function saveRows(rows){
    const list = Array.isArray(rows) ? rows : [];
    await idbSet(STORE_KEY, list);
    const meta = list.map(row => ({
      id: row.id,
      title: row.title || '',
      folder: row.folder || '',
      price: Number(row.price || 0),
      description: row.description || '',
      createdAt: row.createdAt || Date.now(),
      updatedAt: row.updatedAt || Date.now(),
      imageCount: Array.isArray(row.images) ? row.images.length : 0,
      videoCount: Array.isArray(row.videos) ? row.videos.length : 0
    }));
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }

  function toMedia(file){
    return {
      id: uid(),
      name: file.name || 'media',
      type: file.type || '',
      size: Number(file.size || 0),
      ext: extOf(file),
      blob: file
    };
  }

  function objectUrl(media, rowKey){
    if(!media) return '';
    if(media.dataUrl) return media.dataUrl;
    if(!media.blob || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return '';
    window._fotoProdukObjectUrls = window._fotoProdukObjectUrls || {};
    const key = rowKey + ':' + (media.id || media.name || Math.random().toString(36).slice(2));
    if(!window._fotoProdukObjectUrls[key]){
      window._fotoProdukObjectUrls[key] = URL.createObjectURL(media.blob);
    }
    return window._fotoProdukObjectUrls[key];
  }

  function revokeObjectUrls(){
    const cache = window._fotoProdukObjectUrls || {};
    Object.keys(cache).forEach(key => {
      try{ URL.revokeObjectURL(cache[key]); }catch(_){}
    });
    window._fotoProdukObjectUrls = {};
  }

  function currentRowsSync(){
    return Array.isArray(window._fotoProdukRows) ? window._fotoProdukRows : [];
  }

  function currentEditingId(){
    return window._fotoProdukEditingId || null;
  }

  function setEditingId(id){
    window._fotoProdukEditingId = id || null;
  }

  function mediaDownloadName(row, media, index){
    const base = String(row.title || 'produk').trim().replace(/[\\/:*?"<>|]+/g, '-');
    const ext = media.ext || extOf(media) || 'bin';
    return base + '-' + String(index + 1).padStart(2, '0') + '.' + ext;
  }

  function downloadBlob(blob, filename){
    if(!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => {
      try{ URL.revokeObjectURL(url); }catch(_){}
    }, 1200);
  }

  function closeModal(){
    const modal = getEl('foto-produk-modal');
    if(modal) modal.remove();
    setEditingId(null);
  }

  function folderOptions(selected){
    return loadFolders().map(folder => '<option value="' + esc(folder) + '"' + (folder === selected ? ' selected' : '') + '>' + esc(folder) + '</option>').join('');
  }

  function modalHtml(row){
    const item = row || {};
    const isEdit = !!item.id;
    return `
      <div id="foto-produk-modal" style="position:fixed;inset:0;z-index:9999;background:rgba(31,31,31,.18);display:flex;align-items:center;justify-content:center;padding:24px;">
        <div style="width:min(860px,96vw);max-height:92vh;overflow:auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:18px;padding:20px 20px 22px;color:#1f1f1f;box-shadow:0 20px 48px rgba(17,17,17,.08);">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;">
            <div>
              <div style="font-size:18px;font-weight:800;">${isEdit ? 'Edit Produk' : 'Tambah Produk'}</div>
              <div style="margin-top:6px;color:#5f5f5f;font-size:14px;">Simpan foto, video, harga, dan deskripsi produk dalam satu galeri.</div>
            </div>
            <button type="button" onclick="_fotoProdukCloseModal()" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:12px;padding:9px 13px;cursor:pointer;">Tutup</button>
          </div>
          <form onsubmit="return false;" style="margin-top:14px;display:grid;gap:12px;">
            <div>
              <label style="display:block;font-size:14px;font-weight:600;color:#1f1f1f;margin-bottom:6px;">Judul Produk</label>
              <input id="foto-produk-title" type="text" value="${esc(item.title || '')}" style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:12px;padding:12px 13px;color:#1f1f1f;">
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="display:block;font-size:14px;font-weight:600;color:#1f1f1f;margin-bottom:6px;">Folder</label>
                <select id="foto-produk-folder" style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:12px;padding:12px 13px;color:#1f1f1f;">${folderOptions(item.folder || DEFAULT_FOLDERS[0])}</select>
              </div>
              <div>
                <label style="display:block;font-size:14px;font-weight:600;color:#1f1f1f;margin-bottom:6px;">Harga Modal</label>
                <input id="foto-produk-price" type="number" min="0" step="1000" value="${esc(item.price || 0)}" style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:12px;padding:12px 13px;color:#1f1f1f;">
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div>
                <label style="display:block;font-size:14px;font-weight:600;color:#1f1f1f;margin-bottom:6px;">Foto Produk</label>
                <input id="foto-produk-images" type="file" multiple style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:12px;padding:10px 12px;color:#1f1f1f;">
              </div>
              <div>
                <label style="display:block;font-size:14px;font-weight:600;color:#1f1f1f;margin-bottom:6px;">Video Produk</label>
                <input id="foto-produk-videos" type="file" multiple style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:12px;padding:10px 12px;color:#1f1f1f;">
              </div>
            </div>
            <div style="font-size:13px;color:#5f5f5f;">Biarkan kosong jika ingin mempertahankan media lama saat edit produk.</div>
            <div>
              <label style="display:block;font-size:14px;font-weight:600;color:#1f1f1f;margin-bottom:6px;">Deskripsi</label>
              <textarea id="foto-produk-description" rows="5" style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:12px;padding:12px 13px;color:#1f1f1f;resize:vertical;">${esc(item.description || '')}</textarea>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;">
              <button type="button" onclick="_fotoProdukCloseModal()" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:12px;padding:10px 14px;cursor:pointer;">Batal</button>
              <button type="button" onclick="_fotoProdukSave()" style="border:1px solid #1f1f1f;background:#1f1f1f;color:#ffffff;font-weight:700;border-radius:12px;padding:10px 14px;cursor:pointer;">Simpan Produk</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function openModal(id){
    const rows = currentRowsSync();
    const row = rows.find(item => item.id === id) || null;
    closeModal();
    setEditingId(id || null);
    document.body.insertAdjacentHTML('beforeend', modalHtml(row));
  }

  async function saveProduct(){
    const title = (getEl('foto-produk-title')?.value || '').trim();
    const folder = (getEl('foto-produk-folder')?.value || '').trim() || DEFAULT_FOLDERS[0];
    const description = (getEl('foto-produk-description')?.value || '').trim();
    const price = Number(getEl('foto-produk-price')?.value || 0);
    const imageFiles = Array.from((getEl('foto-produk-images')?.files) || []);
    const videoFiles = Array.from((getEl('foto-produk-videos')?.files) || []);
    if(!title) return;

    const rows = await loadRows();
    window._fotoProdukRows = rows;
    const editingId = currentEditingId();
    const existing = editingId ? rows.find(item => item.id === editingId) : null;
    saveFolders([...loadFolders(), folder]);

    const nextRow = {
      id: existing ? existing.id : uid(),
      title,
      folder,
      price,
      description,
      createdAt: existing ? existing.createdAt : Date.now(),
      updatedAt: Date.now(),
      images: imageFiles.length ? imageFiles.map(toMedia) : ((existing && existing.images) || []),
      videos: videoFiles.length ? videoFiles.map(toMedia) : ((existing && existing.videos) || [])
    };

    const nextRows = existing ? rows.map(item => item.id === existing.id ? nextRow : item) : [nextRow].concat(rows);
    await saveRows(nextRows);
    window._fotoProdukRows = nextRows;
    closeModal();
    await refresh();
  }

  async function deleteProduct(id){
    const rows = await loadRows();
    const nextRows = rows.filter(item => item.id !== id);
    await saveRows(nextRows);
    setSelectedIds(selectedIds().filter(item => item !== id));
    window._fotoProdukRows = nextRows;
    await refresh();
  }

  async function deleteSelected(){
    const ids = selectedIds();
    if(!ids.length) return;
    const rows = await loadRows();
    const nextRows = rows.filter(item => !ids.includes(item.id));
    await saveRows(nextRows);
    setSelectedIds([]);
    window._fotoProdukRows = nextRows;
    await refresh();
  }

  function downloadMedia(rowId, kind, index){
    const row = currentRowsSync().find(item => item.id === rowId);
    if(!row) return;
    const list = kind === 'video' ? (row.videos || []) : (row.images || []);
    const media = list[index || 0];
    if(!media) return;
    if(media.blob) return downloadBlob(media.blob, mediaDownloadName(row, media, index || 0));
    if(media.dataUrl){
      const a = document.createElement('a');
      a.href = media.dataUrl;
      a.download = mediaDownloadName(row, media, index || 0);
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  }

  function downloadAllForRow(rowId){
    const row = currentRowsSync().find(item => item.id === rowId);
    if(!row) return;
    (row.images || []).forEach((media, index) => downloadMedia(row.id, 'image', index));
    (row.videos || []).forEach((media, index) => downloadMedia(row.id, 'video', index));
  }

  function downloadSelected(){
    selectedIds().forEach(id => downloadAllForRow(id));
  }

  function closePreview(){
    const modal = getEl('foto-produk-preview');
    if(modal) modal.remove();
  }

  function renderPreviewModal(row, mode, index){
    const mediaList = mode === 'video' ? (row.videos || []) : (row.images || []);
    const media = mediaList[index || 0];
    if(!media) return;
    const src = objectUrl(media, row.id);
    if(!src) return;
    const content = mode === 'video'
      ? '<video controls autoplay style="max-width:min(1100px,96vw);max-height:84vh;border-radius:14px;background:#000;" src="' + src + '"></video>'
      : '<img alt="' + esc(row.title) + '" style="max-width:min(1100px,96vw);max-height:84vh;border-radius:14px;background:#000;" src="' + src + '">';
    const html = `
      <div id="foto-produk-preview" style="position:fixed;inset:0;z-index:10000;background:rgba(31,31,31,.22);display:flex;align-items:center;justify-content:center;padding:20px;" onclick="_fotoProdukClosePreview()">
        <div style="position:relative;" onclick="event.stopPropagation()">
          <div style="position:absolute;right:10px;top:10px;z-index:2;display:flex;gap:8px;">
            <button type="button" onclick="_fotoProdukDownloadMedia('${esc(row.id)}','${esc(mode)}',${index || 0})" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:999px;padding:7px 11px;cursor:pointer;">Unduh</button>
            <button type="button" onclick="_fotoProdukClosePreview()" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:999px;padding:7px 11px;cursor:pointer;">Tutup</button>
          </div>
          ${content}
        </div>
      </div>
    `;
    const old = getEl('foto-produk-preview');
    if(old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function openDetail(id){
    const row = currentRowsSync().find(item => item.id === id);
    if(!row) return;
    const media = []
      .concat((row.images || []).map((item, idx) => ({ kind: 'image', item, index: idx })))
      .concat((row.videos || []).map((item, idx) => ({ kind: 'video', item, index: idx })));
    const gallery = media.length ? media.map((entry) => {
      const src = objectUrl(entry.item, row.id);
      if(!src){
        return '<div style="height:120px;border-radius:12px;background:#f5f5f3;border:1px dashed #d6d6d6;display:flex;align-items:center;justify-content:center;color:#5f5f5f;padding:10px;text-align:center;">' + esc(entry.item.name || 'media') + '</div>';
      }
      const preview = entry.kind === 'video'
        ? '<video onclick="_fotoProdukPreview(\'' + esc(row.id) + '\',\'video\',' + entry.index + ')" src="' + src + '" muted style="width:100%;height:120px;object-fit:contain;border-radius:12px;background:#0f1115;padding:6px;cursor:pointer;"></video>'
        : '<img onclick="_fotoProdukPreview(\'' + esc(row.id) + '\',\'image\',' + entry.index + ')" src="' + src + '" alt="' + esc(row.title) + '" style="width:100%;height:120px;object-fit:contain;border-radius:12px;background:#0f1115;padding:6px;cursor:pointer;">';
      return `
        <div style="position:relative;border:1px solid #e5e5e5;border-radius:14px;padding:6px;background:#ffffff;">
          ${preview}
          <button type="button" onclick="_fotoProdukDownloadMedia('${esc(row.id)}','${esc(entry.kind)}',${entry.index})" style="position:absolute;right:10px;top:10px;border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:999px;padding:6px 10px;cursor:pointer;opacity:.16;transition:opacity .2s;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='.16'">Unduh</button>
        </div>
      `;
    }).join('') : '<div style="color:#5f5f5f;">Belum ada media.</div>';
    const html = `
      <div id="foto-produk-detail" style="position:fixed;inset:0;z-index:9999;background:rgba(31,31,31,.18);display:flex;align-items:center;justify-content:center;padding:20px;" onclick="_fotoProdukCloseDetail()">
        <div style="width:min(980px,96vw);max-height:90vh;overflow:auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:18px;padding:18px;color:#1f1f1f;box-shadow:0 20px 48px rgba(17,17,17,.08);" onclick="event.stopPropagation()">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;">
            <div>
              <div style="font-size:22px;font-weight:900;">${esc(row.title)}</div>
              <div style="margin-top:6px;color:#5f5f5f;font-size:14px;">Folder: ${esc(row.folder || '-')}</div>
              <div style="margin-top:4px;color:#1f1f1f;font-size:20px;font-weight:800;">${money(row.price)}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" onclick="_fotoProdukDownloadAll('${esc(row.id)}')" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:10px;padding:8px 12px;cursor:pointer;">Unduh Semua</button>
              <button type="button" onclick="_fotoProdukCloseDetail()" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:10px;padding:8px 12px;cursor:pointer;">Tutup</button>
            </div>
          </div>
          <div style="margin-top:14px;color:#5f5f5f;line-height:1.7;">${esc(row.description || '-')}</div>
          <div style="margin-top:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;">${gallery}</div>
          <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" onclick="_fotoProdukEdit('${esc(row.id)}');_fotoProdukCloseDetail();" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:10px;padding:8px 12px;cursor:pointer;">Edit</button>
            <button type="button" onclick="_fotoProdukCloseDetail();_fotoProdukDelete('${esc(row.id)}')" style="border:1px solid #e8caca;background:#fff7f7;color:#b85c5c;border-radius:10px;padding:8px 12px;cursor:pointer;">Hapus</button>
          </div>
        </div>
      </div>
    `;
    const old = getEl('foto-produk-detail');
    if(old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function closeDetail(){
    const modal = getEl('foto-produk-detail');
    if(modal) modal.remove();
  }

  function filteredRows(rows){
    const q = String(activeSearch() || '').trim().toLowerCase();
    const folder = activeFolder();
    return rows.filter(row => {
      const matchFolder = !folder || row.folder === folder;
      const matchSearch = !q || String(row.title || '').toLowerCase().includes(q);
      return matchFolder && matchSearch;
    });
  }

  function galleryItems(rows){
    const q = String(activeSearch() || '').trim().toLowerCase();
    const list = [];
    rows.forEach(row => {
      (row.images || []).forEach((media, index) => {
        if(q && !String(row.title || '').toLowerCase().includes(q)) return;
        list.push({ rowId: row.id, title: row.title || '', price: row.price || 0, media, index });
      });
    });
    return list;
  }

  function sectionTabs(){
    const section = activeSection();
    return `
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
        <button type="button" onclick="_fotoProdukSetSection('produk')" style="border:1px solid ${section === 'produk' ? '#dadada' : '#e5e5e5'};background:${section === 'produk' ? '#efefef' : '#ffffff'};color:#1f1f1f;border-radius:12px;padding:9px 12px;cursor:pointer;font-weight:700;">Produk</button>
        <button type="button" onclick="_fotoProdukSetSection('gallery')" style="border:1px solid ${section === 'gallery' ? '#dadada' : '#e5e5e5'};background:${section === 'gallery' ? '#efefef' : '#ffffff'};color:#1f1f1f;border-radius:12px;padding:9px 12px;cursor:pointer;font-weight:700;">Gallery</button>
      </div>
    `;
  }

  function folderChips(){
    const folders = loadFolders();
    const current = activeFolder();
    const items = [''].concat(folders);
    return '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">' + items.map(folder => {
      const label = folder || 'Semua';
      const active = folder === current;
      return '<button type="button" onclick="_fotoProdukSetFolder(\'' + esc(folder) + '\')" style="border:1px solid ' + (active ? '#dadada' : '#e5e5e5') + ';background:' + (active ? '#efefef' : '#ffffff') + ';color:#1f1f1f;border-radius:999px;padding:8px 12px;font-size:13px;font-weight:600;cursor:pointer;">' + esc(label) + '</button>';
    }).join('') + '</div>';
  }

  function viewToggle(){
    const view = activeView();
    return `
      <div style="display:flex;gap:8px;align-items:center;">
        <button type="button" onclick="_fotoProdukSetView('grid')" style="border:1px solid ${view === 'grid' ? '#dadada' : '#e5e5e5'};background:${view === 'grid' ? '#efefef' : '#ffffff'};color:#1f1f1f;border-radius:12px;padding:10px 12px;cursor:pointer;font-weight:700;">Grid</button>
        <button type="button" onclick="_fotoProdukSetView('list')" style="border:1px solid ${view === 'list' ? '#dadada' : '#e5e5e5'};background:${view === 'list' ? '#efefef' : '#ffffff'};color:#1f1f1f;border-radius:12px;padding:10px 12px;cursor:pointer;font-weight:700;">List</button>
      </div>
    `;
  }

  function bulkActions(rows){
    if(activeSection() !== 'produk') return '';
    const visibleIds = rows.map(row => row.id);
    const count = selectedIds().filter(id => visibleIds.includes(id)).length;
    return `
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px;">
        <button type="button" onclick="_fotoProdukToggleSelectVisible()" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:10px;padding:8px 12px;cursor:pointer;">${count === visibleIds.length && visibleIds.length ? 'Uncheck Semua' : 'Check Semua'}</button>
        <button type="button" onclick="_fotoProdukDownloadSelected()" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:10px;padding:8px 12px;cursor:pointer;">Unduh Terpilih</button>
        <button type="button" onclick="_fotoProdukDeleteSelected()" style="border:1px solid #e8caca;background:#fff7f7;color:#b85c5c;border-radius:10px;padding:8px 12px;cursor:pointer;">Hapus Terpilih</button>
        <div style="color:#8a8a8a;font-size:13px;">${selectedIds().length} produk dipilih</div>
      </div>
    `;
  }

  function toolbar(rows){
    const section = activeSection();
    return `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:16px;">
        <div>
          <div style="font-size:28px;font-weight:800;color:#1f1f1f;">Foto Produk</div>
          <div style="margin-top:6px;color:#5f5f5f;max-width:760px;font-size:16px;">Galeri produk untuk menyimpan foto, video, judul, deskripsi, harga, dan pengelompokan folder custom.</div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          ${section === 'produk' ? viewToggle() : ''}
          <button type="button" onclick="_fotoProdukTambahFolder()" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:12px;padding:10px 14px;cursor:pointer;">+ Folder</button>
          <button type="button" onclick="_fotoProdukOpenModal()" style="border:1px solid #1f1f1f;background:#1f1f1f;color:#ffffff;font-weight:700;border-radius:12px;padding:10px 14px;cursor:pointer;">+ Tambah Produk</button>
        </div>
      </div>
      ${sectionTabs()}
      <div style="display:grid;grid-template-columns:minmax(240px,1fr);gap:12px;margin-bottom:12px;">
        <input id="foto-produk-search" type="text" value="${esc(activeSearch())}" placeholder="${section === 'gallery' ? 'Cari nama produk pada gallery...' : 'Cari nama produk...'}" oninput="_fotoProdukSetSearch(this.value)" style="width:100%;background:#ffffff;border:1px solid #d9d9d9;border-radius:14px;padding:13px 14px;font-size:15px;color:#1f1f1f;">
      </div>
      ${section === 'produk' ? folderChips() : ''}
      ${bulkActions(rows)}
    `;
  }

  function productMediaPreview(row){
    const image = (row.images || [])[0];
    const video = (row.videos || [])[0];
    if(image){
      const src = objectUrl(image, row.id);
      if(src) return '<img src="' + src + '" alt="' + esc(row.title) + '" style="width:100%;height:120px;object-fit:contain;border-radius:12px;background:#f5f5f3;display:block;padding:6px;">';
    }
    if(video){
      const src = objectUrl(video, row.id);
      if(src) return '<video src="' + src + '" style="width:100%;height:120px;object-fit:contain;border-radius:12px;background:#f5f5f3;display:block;padding:6px;" muted></video>';
    }
    return '<div style="height:120px;border-radius:12px;background:#f5f5f3;border:1px dashed #d6d6d6;display:flex;align-items:center;justify-content:center;color:#5f5f5f;">Belum ada media</div>';
  }

  function renderProducts(rows){
    if(!rows.length){
      return '<div style="padding:24px;border:1px dashed #d6d6d6;border-radius:14px;color:#5f5f5f;background:#f5f5f3;">Belum ada produk tersimpan.</div>';
    }
    const view = activeView();
    const wrapStyle = view === 'list'
      ? 'display:grid;grid-template-columns:1fr;gap:10px;'
      : 'display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,210px));gap:12px;align-items:start;';
    const selected = selectedIds();
    return '<div style="' + wrapStyle + '">' + rows.map(row => `
      <div onclick="_fotoProdukOpenDetail('${esc(row.id)}')" style="background:#ffffff;border:1px solid ${selected.includes(row.id) ? '#d0d0d0' : '#e5e5e5'};border-radius:16px;padding:10px;cursor:pointer;position:relative;box-shadow:0 8px 20px rgba(17,17,17,.04);${view === 'list' ? 'display:grid;grid-template-columns:128px 1fr;gap:12px;align-items:center;' : ''}">
        <label style="position:absolute;left:10px;top:10px;z-index:2;display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:999px;background:rgba(255,255,255,.96);border:1px solid #d9d9d9;cursor:pointer;" onclick="event.stopPropagation()">
          <input type="checkbox" ${selected.includes(row.id) ? 'checked' : ''} onchange="_fotoProdukToggleSelect('${esc(row.id)}', this.checked)" style="width:14px;height:14px;cursor:pointer;">
        </label>
        ${productMediaPreview(row)}
        <div style="${view === 'list' ? '' : 'margin-top:10px;'}">
          <div style="font-weight:800;font-size:15px;color:#1f1f1f;line-height:1.4;">${esc(row.title)}</div>
          <div style="margin-top:5px;color:#1f1f1f;font-weight:800;font-size:15px;">${money(row.price)}</div>
        </div>
      </div>
    `).join('') + '</div>';
  }

  function renderGallery(rows){
    const items = galleryItems(rows);
    if(!items.length){
      return '<div style="padding:24px;border:1px dashed #d6d6d6;border-radius:14px;color:#5f5f5f;background:#f5f5f3;">Belum ada foto pada gallery.</div>';
    }
    return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,170px));gap:12px;align-items:start;">' + items.map(entry => {
      const src = objectUrl(entry.media, entry.rowId);
      const button = src
        ? '<img src="' + src + '" alt="' + esc(entry.title) + '" style="width:100%;height:132px;object-fit:contain;border-radius:12px;background:#f5f5f3;padding:6px;display:block;">'
        : '<div style="height:132px;border-radius:12px;background:#f5f5f3;border:1px dashed #d6d6d6;display:flex;align-items:center;justify-content:center;color:#5f5f5f;padding:10px;text-align:center;">' + esc(entry.media.name || 'media') + '</div>';
      return `
        <div onclick="_fotoProdukOpenGalleryItem('${esc(entry.rowId)}',${entry.index})" style="background:#ffffff;border:1px solid #e5e5e5;border-radius:16px;padding:8px;cursor:pointer;box-shadow:0 8px 20px rgba(17,17,17,.04);">
          ${button}
        </div>
      `;
    }).join('') + '</div>';
  }

  function openGalleryItem(rowId, index){
    const row = currentRowsSync().find(item => item.id === rowId);
    if(!row) return;
    const media = (row.images || [])[index || 0];
    if(!media) return;
    const src = objectUrl(media, row.id);
    if(!src) return;
    const html = `
      <div id="foto-produk-gallery-detail" style="position:fixed;inset:0;z-index:10001;background:rgba(31,31,31,.18);display:flex;align-items:center;justify-content:center;padding:20px;" onclick="_fotoProdukCloseGalleryItem()">
        <div style="width:min(980px,96vw);max-height:92vh;overflow:auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:18px;padding:16px;color:#1f1f1f;box-shadow:0 20px 48px rgba(17,17,17,.08);" onclick="event.stopPropagation()">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">
            <div>
              <div style="font-size:21px;font-weight:900;">${esc(row.title)}</div>
              <div style="margin-top:6px;color:#1f1f1f;font-weight:800;">${money(row.price)}</div>
              <div style="margin-top:4px;color:#5f5f5f;font-size:13px;">Folder: ${esc(row.folder || '-')}</div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" onclick="_fotoProdukDownloadMedia('${esc(row.id)}','image',${index})" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:10px;padding:8px 12px;cursor:pointer;">Unduh</button>
              <button type="button" onclick="_fotoProdukCloseGalleryItem()" style="border:1px solid #d9d9d9;background:#ffffff;color:#1f1f1f;border-radius:10px;padding:8px 12px;cursor:pointer;">Tutup</button>
            </div>
          </div>
          <div style="margin-top:14px;">
            <img src="${src}" alt="${esc(row.title)}" style="width:100%;max-height:72vh;object-fit:contain;border-radius:14px;background:#f5f5f3;">
          </div>
        </div>
      </div>
    `;
    const old = getEl('foto-produk-gallery-detail');
    if(old) old.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function closeGalleryItem(){
    const modal = getEl('foto-produk-gallery-detail');
    if(modal) modal.remove();
  }

  async function refresh(){
    await renderInto(hostId());
  }

  async function renderInto(targetId){
    const host = getEl(targetId);
    if(!host) return;
    window._fotoProdukHostId = targetId;
    revokeObjectUrls();
    hideTopFotoMenu();
    const rows = await loadRows();
    window._fotoProdukRows = rows;
    const list = filteredRows(rows);
    host.innerHTML = toolbar(list) + (activeSection() === 'gallery' ? renderGallery(rows) : renderProducts(list));
  }

  function addFolder(){
    const name = window.prompt('Nama folder baru:');
    if(!name) return;
    saveFolders([...loadFolders(), name]);
    refresh();
  }

  function toggleSelect(id, checked){
    const next = new Set(selectedIds());
    if(checked) next.add(id); else next.delete(id);
    setSelectedIds(Array.from(next));
    renderInto(hostId());
  }

  function toggleSelectVisible(){
    const visible = filteredRows(currentRowsSync()).map(row => row.id);
    const current = new Set(selectedIds());
    const allSelected = visible.length && visible.every(id => current.has(id));
    if(allSelected) visible.forEach(id => current.delete(id));
    else visible.forEach(id => current.add(id));
    setSelectedIds(Array.from(current));
    renderInto(hostId());
  }

  function hideTopFotoMenu(){
    const nodes = Array.from(document.querySelectorAll('button, a, div'));
    const matches = nodes.filter(node => {
      const text = String(node.textContent || '').trim().replace(/\s+/g, ' ');
      if(text !== 'FOTO PRODUK') return false;
      const rect = typeof node.getBoundingClientRect === 'function' ? node.getBoundingClientRect() : null;
      return rect && rect.top < 120;
    });
    if(matches.length){
      matches[0].style.display = 'none';
    }
  }

  function installTopFotoMenuGuard(){
    if(window._fotoProdukTopMenuGuardInstalled) return;
    window._fotoProdukTopMenuGuardInstalled = true;
    const run = () => {
      try{ hideTopFotoMenu(); }catch(_){}
    };
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', run, { once:false });
    }
    run();
    try{
      const observer = new MutationObserver(() => run());
      observer.observe(document.documentElement || document.body, { childList:true, subtree:true });
      window._fotoProdukTopMenuObserver = observer;
    }catch(_){}
    try{
      window.setInterval(run, 1200);
    }catch(_){}
  }

  window._fotoProdukOpenModal = openModal;
  window._fotoProdukCloseModal = closeModal;
  window._fotoProdukSave = saveProduct;
  window._fotoProdukDelete = async function(id){
    if(!window.confirm('Hapus produk ini?')) return;
    await deleteProduct(id);
  };
  window._fotoProdukDeleteSelected = async function(){
    if(!selectedIds().length) return;
    if(!window.confirm('Hapus semua produk yang dicentang?')) return;
    await deleteSelected();
  };
  window._fotoProdukEdit = function(id){ openModal(id); };
  window._fotoProdukPreview = function(id, mode, index){
    const row = currentRowsSync().find(item => item.id === id);
    if(!row) return;
    renderPreviewModal(row, mode || 'image', index || 0);
  };
  window._fotoProdukClosePreview = closePreview;
  window._fotoProdukOpenDetail = openDetail;
  window._fotoProdukCloseDetail = closeDetail;
  window._fotoProdukOpenGalleryItem = openGalleryItem;
  window._fotoProdukCloseGalleryItem = closeGalleryItem;
  window._fotoProdukRefresh = refresh;
  window._fotoProdukTambahFolder = addFolder;
  window._fotoProdukSetFolder = function(folder){
    window._fotoProdukActiveFolder = folder || '';
    renderInto(hostId());
  };
  window._fotoProdukSetView = function(view){
    window._fotoProdukView = view === 'list' ? 'list' : 'grid';
    renderInto(hostId());
  };
  window._fotoProdukSetSection = function(section){
    window._fotoProdukSection = section === 'gallery' ? 'gallery' : 'produk';
    renderInto(hostId());
  };
  window._fotoProdukSetSearch = function(value){
    window._fotoProdukSearch = String(value || '');
    renderInto(hostId());
  };
  window._fotoProdukToggleSelect = toggleSelect;
  window._fotoProdukToggleSelectVisible = toggleSelectVisible;
  window._fotoProdukDownloadMedia = downloadMedia;
  window._fotoProdukDownloadAll = downloadAllForRow;
  window._fotoProdukDownloadSelected = downloadSelected;
  window._renderFotoProdukInto = renderInto;
  window._renderFotoProduk = function(){
    return renderInto('V-foto');
  };
  installTopFotoMenuGuard();
})();
