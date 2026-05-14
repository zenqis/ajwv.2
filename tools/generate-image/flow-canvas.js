/* AJW Flow Canvas v6 — futuristic design, IndexedDB, fullscreen, animations, template CRUD */
window.AJWFlowCanvasVersion='20260514.92';
(function(){
'use strict';

/* ── helpers ── */
function uid(){return 'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function getCfg(){return typeof window.getCfg==='function'?window.getCfg():(window._ajwCfg||{});}
function dataUrlToBlob(d){var a=d.split(','),m=a[0].match(/:(.*?);/)[1],b=atob(a[1]),n=b.length,u=new Uint8Array(n);for(var i=0;i<n;i++)u[i]=b.charCodeAt(i);return new Blob([u],{type:m});}
function toast(msg,type){
  var t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:24px;right:24px;z-index:100000;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;backdrop-filter:blur(10px);transition:opacity .4s,transform .4s;transform:translateY(0);'+
    (type==='error'?'background:rgba(239,68,68,.95);color:#fff;box-shadow:0 4px 20px rgba(239,68,68,.35)':'background:rgba(34,197,94,.95);color:#fff;box-shadow:0 4px 20px rgba(34,197,94,.35)');
  t.textContent=msg;document.body.appendChild(t);
  setTimeout(function(){t.style.opacity='0';t.style.transform='translateY(8px)';setTimeout(function(){t.remove();},400);},2800);
}
function compressImage(dataUrl,maxPx,quality,cb){
  var img=new Image();
  img.onload=function(){
    var w=img.width,h=img.height;
    if(w>maxPx||h>maxPx){var r=Math.min(maxPx/w,maxPx/h);w=Math.round(w*r);h=Math.round(h*r);}
    var cv=document.createElement('canvas');cv.width=w;cv.height=h;
    cv.getContext('2d').drawImage(img,0,0,w,h);
    cb(cv.toDataURL('image/jpeg',quality));
  };
  img.onerror=function(){cb(dataUrl);};img.src=dataUrl;
}

/* ── IndexedDB for source images (no localStorage quota limit) ── */
var IDB_NAME='ajw-source-db',IDB_STORE='images',_idb=null;
function idbOpen(cb){
  if(_idb){cb(_idb);return;}
  var req=indexedDB.open(IDB_NAME,1);
  req.onupgradeneeded=function(e){e.target.result.createObjectStore(IDB_STORE,{keyPath:'id'});};
  req.onsuccess=function(e){_idb=e.target.result;cb(_idb);};
  req.onerror=function(){cb(null);};
}
function idbPut(id,dataUrl,cb){idbOpen(function(db){if(!db){cb&&cb();return;}var tx=db.transaction(IDB_STORE,'readwrite');tx.objectStore(IDB_STORE).put({id:id,dataUrl:dataUrl});tx.oncomplete=function(){cb&&cb();};tx.onerror=function(){cb&&cb();};});}
function idbDel(id,cb){idbOpen(function(db){if(!db){cb&&cb();return;}var tx=db.transaction(IDB_STORE,'readwrite');tx.objectStore(IDB_STORE).delete(id);tx.oncomplete=function(){cb&&cb();};});}
function idbGetAll(cb){idbOpen(function(db){if(!db){cb({});return;}var tx=db.transaction(IDB_STORE,'readonly');var req=tx.objectStore(IDB_STORE).getAll();req.onsuccess=function(){var map={};(req.result||[]).forEach(function(x){map[x.id]=x.dataUrl;});cb(map);};req.onerror=function(){cb({});};});}

/* ── Source metadata in localStorage (no images, just ids/names) ── */
var SRC_KEY='ajw_gi_source_v2';/* new key to avoid old format conflict */
var _srcImages={};/* memory cache: imgId → dataUrl */
function srcGet(){try{return JSON.parse(localStorage.getItem(SRC_KEY)||'{"folders":[]}');}catch(e){return{folders:[]};}}
function srcSet(v){try{localStorage.setItem(SRC_KEY,JSON.stringify(v));return true;}catch(e){toast('Metadata gagal disimpan','error');return false;}}
function srcGetFolder(fid){return srcGet().folders.find(function(f){return f.id===fid;});}
/* get dataUrl for an image (from memory cache or IDB) */
function srcImgUrl(imgId){return _srcImages[imgId]||null;}

/* ── Canvas state ── */
var S={nodes:[],edges:[],view:{x:80,y:40,scale:0.9},dragging:null,pendingConn:null,tempLine:null,selected:null,hoverEdge:null};

/* ── Port colours ── */
var PC={image:'#22c55e',text:'#6366f1',prompt:'#a78bfa',trigger:'#f59e0b'};
function pc(t){return PC[t]||'#94a3b8';}
function compat(a,b){if(a===b)return true;if((a==='text'||a==='prompt')&&(b==='text'||b==='prompt'))return true;return false;}

/* ── Node definitions ── */
var NW=252;
var ND={
  'image-source':{label:'Image Input',icon:'🖼',color:'#10b981',inputs:[],outputs:[{id:'images',type:'image',label:'Images'}],def:function(){return{images:[],isBatch:false};}},
  'folder-source':{label:'Folder Source',icon:'📁',color:'#0ea5e9',inputs:[],outputs:[{id:'images',type:'image',label:'Images'}],def:function(){return{folderIds:[],currentFolderId:'',currentIdx:0};}},
  'prompt':{label:'Prompt',icon:'✏️',color:'#8b5cf6',inputs:[],outputs:[{id:'text',type:'text',label:'Text'}],def:function(){return{text:''};}},
  'generate':{label:'Generate',icon:'⚡',color:'#f59e0b',inputs:[{id:'image',type:'image',label:'Image (opt)'},{id:'prompt',type:'prompt',label:'Prompt (opt)'}],outputs:[{id:'image',type:'image',label:'Output'}],def:function(){return{model:'gpt-image-2',size:'1024x1024',quality:'medium',status:'idle',result:null,prompt:''};}},
  'output':{label:'Output',icon:'🖥',color:'#7c3aed',inputs:[{id:'image',type:'image',label:'Image'}],outputs:[],def:function(){return{images:[]};}},
  'trigger':{label:'Run All',icon:'▶',color:'#ef4444',inputs:[],outputs:[{id:'trigger',type:'trigger',label:'Start'}],def:function(){return{};}},
  'status':{label:'Status',icon:'📊',color:'#64748b',inputs:[],outputs:[],def:function(){return{};}},
};

/* ── Get connected value ── */
function getConnected(node,portId){
  var results=[];
  S.edges.forEach(function(e){
    if(e.toId!==node.id||e.toPort!==portId)return;
    var src=S.nodes.find(function(n){return n.id===e.fromId;});if(!src)return;
    if(portId==='image'||portId==='images'){
      if(src.type==='image-source')results=results.concat(src.data.images||[]);
      if(src.type==='folder-source'){
        var fid=src.data.currentFolderId||(src.data.folderIds&&src.data.folderIds[0])||'';
        if(fid){var fl=srcGetFolder(fid);if(fl){var img=fl.images[src.data.currentIdx||0];if(img){var du=srcImgUrl(img.id);if(du)results.push({name:img.name,dataUrl:du});}}}
      }
      if(src.type==='generate'&&src.data.result)results.push({name:'gen.png',dataUrl:src.data.result});
    }
    if(portId==='prompt'||portId==='text'){if(src.type==='prompt')results.push(src.data.text||'');}
  });
  if(!results.length)return null;
  return typeof results[0]==='string'?results.join('\n'):results;
}

/* ── Flow/Template storage ── */
var LSK='ajw_gi_flows_v3';
function lsGet(){try{return JSON.parse(localStorage.getItem(LSK)||'[]');}catch(e){return[];}}
function lsSet(v){try{localStorage.setItem(LSK,JSON.stringify(v));return true;}catch(e){toast('Template gagal disimpan (storage penuh)','error');return false;}}
function saveFlow(name,id){
  var flows=lsGet();
  var ex=id?flows.find(function(f){return f.id===id;}):flows.find(function(f){return f.name===name;});
  /* strip large data from nodes before saving */
  var nodes=S.nodes.map(function(n){
    var d=JSON.parse(JSON.stringify(n.data));
    if(d.images)d.images=d.images.map(function(i){return{name:i.name,id:i.id||''};});
    if(d.result)d.result=null;
    return{id:n.id,type:n.type,x:n.x,y:n.y,data:d};
  });
  var flow={id:ex?ex.id:uid(),name:name,nodes:nodes,edges:S.edges.map(function(e){return Object.assign({},e);}),updatedAt:Date.now()};
  if(ex)Object.assign(ex,flow);else flows.push(flow);
  if(lsSet(flows)){toast('Flow "'+name+'" disimpan ✓','ok');refreshTplList();}
}
function loadFlow(id){
  var f=lsGet().find(function(f){return f.id===id;});if(!f)return;
  S.nodes=f.nodes.map(function(n){var d=ND[n.type];return{id:n.id,type:n.type,x:n.x,y:n.y,data:Object.assign(d?d.def():{},n.data)};});
  S.edges=f.edges.map(function(e){return Object.assign({},e);});
  S.selected=null;S.pendingConn=null;S.tempLine=null;S.hoverEdge=null;
  render();toast('Flow "'+f.name+'" dimuat','ok');
}
function renameFlow(id){
  var flows=lsGet(),fl=flows.find(function(f){return f.id===id;});if(!fl)return;
  var name=prompt('Nama baru:',fl.name);if(!name||!name.trim())return;
  fl.name=name.trim();if(lsSet(flows)){refreshTplList();toast('Diubah ke "'+fl.name+'"','ok');}
}
function deleteFlow(id){
  var flows=lsGet(),fl=flows.find(function(f){return f.id===id;});
  if(!fl||!confirm('Hapus template "'+fl.name+'"?'))return;
  if(lsSet(flows.filter(function(f){return f.id!==id;}))){refreshTplList();toast('Template dihapus','ok');}
}
function refreshTplList(){
  var panel=document.getElementById('fc-tpl-panel');if(!panel)return;
  var flows=lsGet();
  panel.innerHTML=flows.length?flows.map(function(f){
    return '<div style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-radius:7px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);margin-bottom:5px">'+
      '<span style="flex:1;font-size:11px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(f.name)+'</span>'+
      '<button data-loadfl="'+f.id+'" style="'+tbtn('#3b82f6')+'">Muat</button>'+
      '<button data-renfl="'+f.id+'" style="'+tbtn('#64748b')+'">✏</button>'+
      '<button data-delfl="'+f.id+'" style="'+tbtn('#ef4444')+'">🗑</button>'+
      '</div>';
  }).join(''):'<div style="text-align:center;color:#475569;font-size:11px;padding:20px 0">Belum ada template tersimpan</div>';
  panel.querySelectorAll('[data-loadfl]').forEach(function(b){b.addEventListener('click',function(){loadFlow(b.getAttribute('data-loadfl'));});});
  panel.querySelectorAll('[data-renfl]').forEach(function(b){b.addEventListener('click',function(){renameFlow(b.getAttribute('data-renfl'));});});
  panel.querySelectorAll('[data-delfl]').forEach(function(b){b.addEventListener('click',function(){deleteFlow(b.getAttribute('data-delfl'));});});
}
function tbtn(c){return 'background:'+c+'22;color:'+c+';border:1px solid '+c+'44;border-radius:4px;padding:2px 7px;font-size:10px;cursor:pointer;white-space:nowrap;';}

/* ── Port positions ── */
var PP={};
function collectPP(){
  var pp={},canvas=document.getElementById('fc-canvas');if(!canvas)return pp;
  var cr=canvas.getBoundingClientRect();
  S.nodes.forEach(function(node){
    var def=ND[node.type]||{inputs:[],outputs:[]};
    def.inputs.forEach(function(p){var el=document.getElementById('prt-'+node.id+'-in-'+p.id);if(!el)return;var r=el.getBoundingClientRect();pp[node.id+'|in|'+p.id]={x:(r.left+r.width/2-cr.left-S.view.x)/S.view.scale,y:(r.top+r.height/2-cr.top-S.view.y)/S.view.scale,type:p.type,side:'in',nodeId:node.id,port:p.id};});
    def.outputs.forEach(function(p){var el=document.getElementById('prt-'+node.id+'-out-'+p.id);if(!el)return;var r=el.getBoundingClientRect();pp[node.id+'|out|'+p.id]={x:(r.left+r.width/2-cr.left-S.view.x)/S.view.scale,y:(r.top+r.height/2-cr.top-S.view.y)/S.view.scale,type:p.type,side:'out',nodeId:node.id,port:p.id};});
  });
  return pp;
}

/* ── Bezier ── */
function bez(x1,y1,x2,y2){var cx=(x1+x2)/2;return 'M'+x1+','+y1+' C'+cx+','+y1+' '+cx+','+y2+' '+x2+','+y2;}
function bezPt(x1,y1,x2,y2,t){var cx=(x1+x2)/2,mt=1-t;return{x:mt*mt*mt*x1+3*mt*mt*t*cx+3*mt*t*t*cx+t*t*t*x2,y:mt*mt*mt*y1+3*mt*mt*t*y1+3*mt*t*t*y2+t*t*t*y2};}
function edgeDist(fp,tp,wx,wy){var m=1e9;for(var i=0;i<=16;i++){var p=bezPt(fp.x,fp.y,tp.x,tp.y,i/16),dx=p.x-wx,dy=p.y-wy,d=dx*dx+dy*dy;if(d<m)m=d;}return Math.sqrt(m);}

/* ── SVG draw with animated active edges ── */
function drawSVG(){
  var svg=document.getElementById('fc-svg');if(!svg)return;
  /* collect running node ids */
  var runSet={};
  S.nodes.forEach(function(n){if(n.type==='generate'&&n.data.status==='running')runSet[n.id]=true;});
  var paths=[];
  S.edges.forEach(function(e,i){
    var fp=PP[e.fromId+'|out|'+e.fromPort],tp=PP[e.toId+'|in|'+e.toPort];if(!fp||!tp)return;
    var col=pc(fp.type),isH=S.hoverEdge===i,isActive=runSet[e.fromId]||runSet[e.toId];
    var w=isH?2.5:1.8,op=isH?1:0.7;
    var pathStyle=isActive?'stroke-dasharray="10 5" style="animation:fc-dash .45s linear infinite"':'';
    paths.push('<path d="'+bez(fp.x,fp.y,tp.x,tp.y)+'" stroke="'+col+'" stroke-width="'+w+'" fill="none" opacity="'+op+'" '+pathStyle+'/>'+
      '<circle cx="'+fp.x+'" cy="'+fp.y+'" r="3" fill="'+col+'" opacity="'+op+'"/>'+
      '<circle cx="'+tp.x+'" cy="'+tp.y+'" r="3" fill="'+col+'" opacity="'+op+'"/>');
  });
  if(S.tempLine){var t=S.tempLine;paths.push('<line x1="'+t.x1+'" y1="'+t.y1+'" x2="'+t.x2+'" y2="'+t.y2+'" stroke="'+(S.pendingConn?pc(S.pendingConn.type):'#94a3b8')+'" stroke-width="1.5" stroke-dasharray="6 3" opacity="0.7"/>');}
  svg.innerHTML=paths.join('');
  updateEdgeBtn();
}

/* ── Edge disconnect button ── */
function updateEdgeBtn(){
  var btn=document.getElementById('fc-ebtn');
  if(S.hoverEdge===null||S.hoverEdge===undefined){if(btn)btn.style.display='none';return;}
  var e=S.edges[S.hoverEdge];if(!e){if(btn)btn.style.display='none';return;}
  var fp=PP[e.fromId+'|out|'+e.fromPort],tp=PP[e.toId+'|in|'+e.toPort];if(!fp||!tp){if(btn)btn.style.display='none';return;}
  var canvas=document.getElementById('fc-canvas');if(!canvas){if(btn)btn.style.display='none';return;}
  var cr=canvas.getBoundingClientRect();
  var mx=(fp.x+tp.x)/2*S.view.scale+S.view.x+cr.left,my=(fp.y+tp.y)/2*S.view.scale+S.view.y+cr.top;
  if(!btn){
    btn=document.createElement('div');btn.id='fc-ebtn';btn.textContent='×';
    btn.style.cssText='position:fixed;width:20px;height:20px;border-radius:50%;background:#ef4444;color:#fff;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;cursor:pointer;z-index:9999;transform:translate(-50%,-50%);box-shadow:0 2px 10px rgba(239,68,68,.5)';
    btn.addEventListener('click',function(ev){ev.stopPropagation();if(S.hoverEdge!==null){S.edges.splice(S.hoverEdge,1);S.hoverEdge=null;render();}});
    document.body.appendChild(btn);
  }
  btn.style.left=mx+'px';btn.style.top=my+'px';btn.style.display='flex';
}

/* ── Style helpers ── */
function nbtn(bg,col,extra){return 'background:'+bg+';color:'+col+';border:1px solid '+col+'30;border-radius:6px;padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer;transition:all .15s;'+(extra||'');}
function ib2(){return 'background:rgba(0,0,0,.5);backdrop-filter:blur(4px);color:#fff;border:none;border-radius:5px;width:24px;height:24px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:background .15s;';}

/* ── Render node (futuristic design) ── */
function renderNode(node){
  var def=ND[node.type]||{label:node.type,icon:'',color:'#94a3b8',inputs:[],outputs:[],def:function(){return{};}};
  var isSel=S.selected===node.id,acc=def.color;
  var isRunning=node.type==='generate'&&node.data.status==='running';

  function portDot(p,side,i){
    return '<div class="fc-port" id="prt-'+node.id+'-'+side+'-'+p.id+'"'+
      ' data-nodeid="'+node.id+'" data-port="'+p.id+'" data-side="'+side+'" data-ptype="'+p.type+'"'+
      ' title="'+esc(p.label)+'"'+
      ' style="position:absolute;'+(side==='in'?'left:-8px':'right:-8px')+';top:'+(22+i*24)+'px;'+
      'width:16px;height:16px;border-radius:50%;background:'+pc(p.type)+';border:2.5px solid #1e2535;'+
      'cursor:crosshair;z-index:30;box-shadow:0 0 8px '+pc(p.type)+'88;transition:transform .12s,box-shadow .12s;"></div>';
  }
  var ports=(def.inputs||[]).map(function(p,i){return portDot(p,'in',i);}).join('')+
            (def.outputs||[]).map(function(p,i){return portDot(p,'out',i);}).join('');
  var minH=Math.max((def.inputs||[]).length,(def.outputs||[]).length)*24+14;

  var selRing=isSel?'box-shadow:0 0 0 2px '+acc+',0 8px 32px rgba(0,0,0,.4);':'box-shadow:0 4px 24px rgba(0,0,0,.3);';
  var runClass=isRunning?' fcn-running':'';

  return '<div id="fcn-'+node.id+'" class="fcn'+runClass+'" data-nid="'+node.id+'"'+
    ' style="position:absolute;left:'+node.x+'px;top:'+node.y+'px;width:'+NW+'px;'+
    'background:#141824;border-radius:12px;'+
    'border:1px solid '+(isSel?acc:'rgba(255,255,255,.09)')+';'+
    selRing+
    'z-index:'+(isSel?10:2)+';overflow:visible">'+
    /* colored top accent bar */
    '<div style="height:3px;background:linear-gradient(90deg,'+acc+','+acc+'88);border-radius:12px 12px 0 0"></div>'+
    /* header */
    '<div class="fcn-hdr" data-nid="'+node.id+'"'+
    ' style="display:flex;align-items:center;gap:6px;padding:8px 10px;cursor:move;user-select:none;border-bottom:1px solid rgba(255,255,255,.06)">'+
    '<span style="font-size:12px">'+def.icon+'</span>'+
    '<span style="font-size:10px;font-weight:700;color:#e2e8f0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.03em;text-transform:uppercase">'+esc(def.label)+'</span>'+
    (node.type==='generate'?statusDot(node.data.status):'')+
    '<button data-del="'+node.id+'" style="border:none;background:none;color:#475569;cursor:pointer;font-size:14px;padding:0 2px;line-height:1;font-weight:700;transition:color .15s">×</button>'+
    '</div>'+
    /* body */
    '<div style="position:relative;min-height:'+minH+'px">'+
    ports+
    '<div style="padding:10px 12px 12px;font-size:12px;color:#cbd5e1">'+renderBody(node)+'</div>'+
    '</div></div>';
}

function statusDot(st){
  var c={idle:'#475569',running:'#3b82f6',done:'#22c55e',error:'#ef4444'}[st||'idle'];
  var anim=st==='running'?' style="animation:fc-blink 1s ease-in-out infinite"':'';
  return '<span'+anim+' style="width:7px;height:7px;border-radius:50%;background:'+c+';display:inline-block;box-shadow:0 0 6px '+c+'"></span>';
}

function renderBody(node){
  switch(node.type){
    case 'image-source':return bodyImgSrc(node);
    case 'folder-source':return bodyFolderSrc(node);
    case 'prompt':return bodyPrompt(node);
    case 'generate':return bodyGenerate(node);
    case 'output':return bodyOutput(node);
    case 'trigger':return bodyTrigger(node);
    case 'status':return bodyStatus();
    default:return '';
  }
}

/* ── Node bodies ── */
function bodyImgSrc(node){
  var imgs=node.data.images||[];
  var thumbs=imgs.slice(0,4).map(function(img){return '<img src="'+img.dataUrl+'" title="'+esc(img.name)+'" style="width:40px;height:40px;object-fit:cover;border-radius:5px;border:1px solid rgba(255,255,255,.1)">';}).join('');
  var more=imgs.length>4?'<span style="font-size:9px;color:#64748b;align-self:center">+'+(imgs.length-4)+'</span>':'';
  return '<div id="dz-'+node.id+'" data-dz="'+node.id+'"'+
    ' style="border:1.5px dashed rgba(255,255,255,.12);border-radius:8px;padding:8px;min-height:56px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px;margin-bottom:8px;background:rgba(255,255,255,.03);cursor:pointer;transition:border-color .15s">'+
    (imgs.length?thumbs+more:'<span style="color:#475569;font-size:10px">Upload / Drag gambar</span>')+
    '</div>'+
    '<div style="display:flex;gap:6px;align-items:center">'+
    '<label style="'+nbtn('rgba(14,165,233,.15)','#38bdf8','')+'display:inline-block;cursor:pointer">Upload<input type="file" data-uploadnode="'+node.id+'" accept="image/*" multiple style="display:none"></label>'+
    '<label style="display:flex;align-items:center;gap:4px;font-size:10px;color:#64748b;cursor:pointer"><input type="checkbox" '+(node.data.isBatch?'checked':'')+' data-batch="'+node.id+'" style="cursor:pointer"> Batch</label>'+
    '<span style="color:#475569;font-size:9px;margin-left:auto">'+imgs.length+' file</span>'+
    '</div>';
}

function bodyFolderSrc(node){
  var lib=srcGet();
  var selectedIds=node.data.folderIds||[];
  var totalImgs=0;
  selectedIds.forEach(function(fid){var fl=lib.folders.find(function(f){return f.id===fid;});if(fl)totalImgs+=fl.images.length;});
  if(!lib.folders.length){
    return '<div style="font-size:10px;color:#475569;padding:10px;text-align:center;border:1.5px dashed rgba(255,255,255,.08);border-radius:7px">Buat folder di tab 📁 Source</div>';
  }
  var checks=lib.folders.map(function(f){
    var chk=selectedIds.indexOf(f.id)>=0;
    return '<label style="display:flex;align-items:center;gap:6px;padding:4px 0;cursor:pointer;font-size:10px;border-bottom:1px solid rgba(255,255,255,.05)">'+
      '<input type="checkbox" data-foldercb="'+node.id+'" data-folderid="'+f.id+'" '+(chk?'checked':'')+' style="cursor:pointer;accent-color:#0ea5e9">'+
      '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#cbd5e1">'+esc(f.name)+'</span>'+
      '<span style="color:#475569;font-size:9px">'+f.images.length+'</span></label>';
  }).join('');
  return '<div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:5px">Pilih Folder</div>'+
    '<div style="max-height:88px;overflow-y:auto;border:1px solid rgba(255,255,255,.08);border-radius:7px;padding:3px 8px;background:rgba(255,255,255,.03)">'+checks+'</div>'+
    (selectedIds.length?'<div style="font-size:9px;color:#0ea5e9;margin-top:5px;font-weight:600">'+selectedIds.length+' folder · '+totalImgs+' gambar dalam antrian</div>':
    '<div style="font-size:9px;color:#475569;margin-top:4px">Pilih minimal 1 folder</div>');
}

function bodyPrompt(node){
  return '<textarea id="fct-'+node.id+'" data-taid="'+node.id+'" placeholder="Tulis prompt di sini…"'+
    ' style="width:100%;box-sizing:border-box;min-height:88px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);'+
    'border-radius:7px;color:#e2e8f0;font-size:11px;padding:8px;resize:vertical;font-family:inherit;line-height:1.6;outline:none;transition:border-color .15s">'+
    esc(node.data.text||'')+'</textarea>';
}

function bodyGenerate(node){
  var sc={idle:'#64748b',running:'#3b82f6',done:'#22c55e',error:'#ef4444'}[node.data.status||'idle'];
  var st={idle:'Siap',running:'Memproses…',done:'Selesai',error:'Gagal'}[node.data.status||'idle'];
  var pConn=S.edges.some(function(e){return e.toId===node.id&&e.toPort==='prompt';});
  var iConn=S.edges.some(function(e){return e.toId===node.id&&e.toPort==='image';});
  return (node.data.result?
    '<div style="position:relative;border-radius:8px;overflow:hidden;margin-bottom:8px;cursor:zoom-in" data-zoom="'+node.id+'">'+
    '<img src="'+node.data.result+'" style="width:100%;display:block;border-radius:8px">'+
    '<div style="position:absolute;top:5px;right:5px;display:flex;gap:3px">'+
    '<button data-outdown="'+node.id+'" title="Download" style="'+ib2()+'">⬇</button>'+
    '<button data-delresult="'+node.id+'" title="Hapus" style="'+ib2()+'">✕</button>'+
    '</div></div>':'')+
  (iConn?badge('✓ Gambar terhubung','#10b981'):'')+
  (!pConn?'<div style="margin-bottom:7px">'+
    '<div style="font-size:9px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Prompt</div>'+
    '<textarea id="fct-'+node.id+'" data-taid="'+node.id+'" data-isprompt="1" placeholder="Tulis prompt…"'+
    ' style="width:100%;box-sizing:border-box;min-height:60px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);'+
    'border-radius:7px;color:#e2e8f0;font-size:10px;padding:7px;resize:vertical;font-family:inherit;line-height:1.5;outline:none">'+
    esc(node.data.prompt||'')+'</textarea></div>':badge('✓ Prompt terhubung','#6366f1'))+
  '<div style="display:flex;gap:3px;margin-bottom:8px;flex-wrap:wrap">'+
  cmpSel(node,'model',['gpt-image-2','gpt-image-1'])+
  cmpSel(node,'size',['1024x1024','1792x1024','1024x1792'])+
  cmpSel(node,'quality',['auto','medium','high','low'])+
  '</div>'+
  '<div style="display:flex;align-items:center;gap:7px">'+
  '<button data-gen="'+node.id+'" style="'+nbtn(node.data.status==='running'?'rgba(59,130,246,.2)':'rgba(245,158,11,.15)','#f59e0b','flex:1;font-weight:800;font-size:11px;padding:7px 8px;')+'"'+(node.data.status==='running'?' disabled':'')+'>'+
  (node.data.status==='running'?'⏳ Memproses…':'⚡ Generate')+'</button>'+
  '<span style="font-size:9px;color:'+sc+';font-weight:600">'+esc(st)+'</span>'+
  '</div>';
}

function badge(text,color){return '<div style="font-size:9px;color:'+color+';padding:3px 7px;background:'+color+'18;border-radius:5px;border:1px solid '+color+'30;margin-bottom:6px;font-weight:600">'+text+'</div>';}

function cmpSel(node,field,opts){
  return '<select data-gf="'+node.id+'" data-field="'+field+'"'+
    ' style="background:rgba(255,255,255,.05);color:#cbd5e1;border:1px solid rgba(255,255,255,.1);border-radius:5px;font-size:9px;padding:3px 5px;flex:1;min-width:0;outline:none">'+
    opts.map(function(o){return'<option value="'+o+'"'+(node.data[field]===o?' selected':'')+' style="background:#1e2535">'+o+'</option>';}).join('')+
    '</select>';
}

function bodyOutput(node){
  var imgs=node.data.images||[];
  if(!imgs.length)return '<div style="text-align:center;color:#475569;font-size:10px;padding:18px 0;border:1.5px dashed rgba(255,255,255,.08);border-radius:8px">Sambungkan output Generate<br><span style="font-size:9px;color:#334155">Bisa dari banyak node sekaligus</span></div>';
  var html='<div style="display:flex;flex-direction:column;gap:7px">';
  imgs.forEach(function(img,i){
    html+='<div style="position:relative;border-radius:8px;overflow:hidden">'+
      '<div style="position:absolute;top:5px;left:5px;background:rgba(0,0,0,.7);color:#fff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:3px;z-index:2;backdrop-filter:blur(4px)">'+(i+1)+'</div>'+
      '<img src="'+img.dataUrl+'" style="width:100%;display:block;border-radius:8px;cursor:zoom-in" data-zoomurl="'+img.dataUrl+'">'+
      '<div style="position:absolute;top:5px;right:5px;display:flex;gap:3px">'+
      '<button data-dlurl="'+img.dataUrl+'" data-dlname="output-'+(i+1)+'.png" style="'+ib2()+'">⬇</button>'+
      '<button data-rmimg="'+node.id+'" data-rmidx="'+i+'" style="'+ib2()+'">✕</button>'+
      '</div></div>';
  });
  html+='</div>';
  if(imgs.length>1)html+='<button data-dlall="'+node.id+'" style="'+nbtn('rgba(255,255,255,.05)','#cbd5e1','width:100%;margin-top:7px;font-size:10px;')+'">⬇ Download Semua ('+imgs.length+')</button>';
  html+='<button data-clearout="'+node.id+'" style="'+nbtn('rgba(239,68,68,.1)','#ef4444','width:100%;margin-top:4px;font-size:10px;')+'">🗑 Kosongkan</button>';
  return html;
}

function bodyTrigger(node){
  return '<button data-runall="1" style="'+nbtn('rgba(239,68,68,.15)','#ef4444','width:100%;font-size:11px;font-weight:800;padding:10px;')+'">▶ Jalankan Semua</button>'+
    '<div style="font-size:9px;color:#475569;text-align:center;margin-top:6px">Eksekusi semua node Generate</div>';
}

function bodyStatus(){
  var gen=S.nodes.filter(function(n){return n.type==='generate';});
  var done=gen.filter(function(n){return n.data.status==='done';}).length;
  var run=gen.filter(function(n){return n.data.status==='running';}).length;
  var err=gen.filter(function(n){return n.data.status==='error';}).length;
  var idle=gen.filter(function(n){return n.data.status==='idle';}).length;
  var total=gen.length,pct=total?Math.round(done/total*100):0;
  var totalImgs=S.nodes.filter(function(n){return n.type==='output';}).reduce(function(s,n){return s+(n.data.images?n.data.images.length:0);},0);
  function sc(val,label,c){return '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:7px;padding:6px;text-align:center"><div style="font-weight:800;color:'+c+';font-size:14px">'+val+'</div><div style="font-size:9px;color:#475569;margin-top:1px">'+label+'</div></div>';}
  return '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'+
    '<span style="font-size:9px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.05em">Progress</span>'+
    '<span style="font-size:12px;font-weight:800;color:'+(done===total&&total?'#22c55e':'#e2e8f0')+'">'+done+'/'+total+'</span>'+
    '</div>'+
    '<div style="background:rgba(255,255,255,.06);border-radius:4px;height:5px;margin-bottom:9px;overflow:hidden">'+
    '<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#22c55e,#10b981);border-radius:4px;transition:width .5s"></div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px">'+
    sc(run,'Running','#3b82f6')+sc(done,'Selesai','#22c55e')+sc(err,'Error','#ef4444')+sc(idle,'Idle','#475569')+
    '</div>'+
    '<div style="padding:7px 10px;background:rgba(255,255,255,.03);border-radius:7px;border:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;font-size:10px">'+
    '<span style="color:#64748b">🖼 Gambar di-generate</span><span style="font-weight:800;color:#e2e8f0">'+totalImgs+'</span></div>';
}

/* ── Main render ── */
var ROOT=null;
function render(){
  if(!ROOT)return;
  var world=document.getElementById('fc-world');if(!world)return;
  world.innerHTML=S.nodes.map(renderNode).join('');
  requestAnimationFrame(function(){PP=collectPP();drawSVG();bindNodes();});
}

/* ── Bind events ── */
function bindNodes(){
  var world=document.getElementById('fc-world');if(!world)return;

  world.querySelectorAll('.fcn-hdr').forEach(function(h){
    h.addEventListener('mousedown',function(e){
      if(e.button!==0||e.target.getAttribute('data-del'))return;
      var nid=h.getAttribute('data-nid'),node=S.nodes.find(function(n){return n.id===nid;});if(!node)return;
      S.selected=nid;S.dragging={nodeId:nid,sx:e.clientX,sy:e.clientY,ox:node.x,oy:node.y};setSel(nid);e.stopPropagation();
    });
  });

  world.querySelectorAll('[data-del]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();var nid=btn.getAttribute('data-del');
      S.nodes=S.nodes.filter(function(n){return n.id!==nid;});
      S.edges=S.edges.filter(function(x){return x.fromId!==nid&&x.toId!==nid;});
      if(S.selected===nid)S.selected=null;render();
    });
  });

  world.querySelectorAll('.fc-port').forEach(function(port){
    port.addEventListener('mousedown',function(e){
      e.stopPropagation();e.preventDefault();
      var nid=port.getAttribute('data-nodeid'),pid=port.getAttribute('data-port'),side=port.getAttribute('data-side'),ptype=port.getAttribute('data-ptype');
      var canvas=document.getElementById('fc-canvas'),cr=canvas.getBoundingClientRect(),pr=port.getBoundingClientRect();
      var wx=(pr.left+pr.width/2-cr.left-S.view.x)/S.view.scale,wy=(pr.top+pr.height/2-cr.top-S.view.y)/S.view.scale;
      S.pendingConn={nodeId:nid,port:pid,side:side,wx:wx,wy:wy,type:ptype};S.tempLine={x1:wx,y1:wy,x2:wx,y2:wy};drawSVG();
    });
  });

  world.querySelectorAll('textarea[data-taid]').forEach(function(ta){
    ta.addEventListener('mousedown',function(e){e.stopPropagation();});
    ta.addEventListener('input',function(){
      var nid=ta.getAttribute('data-taid'),node=S.nodes.find(function(n){return n.id===nid;});if(!node)return;
      if(ta.getAttribute('data-isprompt')==='1')node.data.prompt=ta.value;else node.data.text=ta.value;
    });
  });

  world.querySelectorAll('select[data-gf]').forEach(function(sel){
    sel.addEventListener('mousedown',function(e){e.stopPropagation();});
    sel.addEventListener('change',function(){var node=S.nodes.find(function(n){return n.id===sel.getAttribute('data-gf');});if(node)node.data[sel.getAttribute('data-field')]=sel.value;});
  });

  world.querySelectorAll('[data-foldercb]').forEach(function(cb){
    cb.addEventListener('mousedown',function(e){e.stopPropagation();});
    cb.addEventListener('change',function(){
      var nid=cb.getAttribute('data-foldercb'),fid=cb.getAttribute('data-folderid');
      var node=S.nodes.find(function(n){return n.id===nid;});if(!node)return;
      var ids=node.data.folderIds||[];
      if(cb.checked){if(ids.indexOf(fid)<0)ids.push(fid);}else{ids=ids.filter(function(x){return x!==fid;});}
      node.data.folderIds=ids;
    });
  });

  /* image-source upload — input inside label */
  world.querySelectorAll('input[data-uploadnode]').forEach(function(fi){
    fi.addEventListener('change',function(){
      var files=Array.prototype.slice.call(fi.files||[]);
      var nid=fi.getAttribute('data-uploadnode');
      fi.value='';
      if(!files.length)return;
      var node=S.nodes.find(function(n){return n.id===nid;});if(!node)return;
      var pend=files.length;
      files.forEach(function(f){
        var r=new FileReader();
        r.onload=function(ev){
          compressImage(ev.target.result,900,0.8,function(c){
            node.data.images.push({name:f.name,dataUrl:c});
            if(--pend===0)render();
          });
        };
        r.readAsDataURL(f);
      });
    });
  });

  world.querySelectorAll('[data-batch]').forEach(function(cb){
    cb.addEventListener('mousedown',function(e){e.stopPropagation();});
    cb.addEventListener('change',function(){var node=S.nodes.find(function(n){return n.id===cb.getAttribute('data-batch');});if(node)node.data.isBatch=cb.checked;});
  });

  world.querySelectorAll('[data-dz]').forEach(function(dz){
    dz.addEventListener('dragover',function(e){e.preventDefault();dz.style.borderColor='#f59e0b';});
    dz.addEventListener('dragleave',function(){dz.style.borderColor='rgba(255,255,255,.12)';});
    dz.addEventListener('drop',function(e){
      e.preventDefault();dz.style.borderColor='rgba(255,255,255,.12)';
      var nid=dz.getAttribute('data-dz'),node=S.nodes.find(function(n){return n.id===nid;});if(!node)return;
      var files=Array.prototype.slice.call(e.dataTransfer.files||[]),pend=files.length;
      files.forEach(function(f){var r=new FileReader();r.onload=function(ev){compressImage(ev.target.result,900,0.8,function(c){node.data.images.push({name:f.name,dataUrl:c});if(--pend===0)render();});};r.readAsDataURL(f);});
    });
  });

  world.querySelectorAll('[data-gen]').forEach(function(btn){
    btn.addEventListener('click',function(e){e.stopPropagation();var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-gen');});if(node)runGenerate(node);});
  });

  world.querySelectorAll('[data-outdown]').forEach(function(btn){
    btn.addEventListener('click',function(e){e.stopPropagation();var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-outdown');});if(node&&node.data.result){var a=document.createElement('a');a.href=node.data.result;a.download='ajw-'+Date.now()+'.png';a.click();}});
  });
  world.querySelectorAll('[data-dlurl]').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();var a=document.createElement('a');a.href=btn.getAttribute('data-dlurl');a.download=btn.getAttribute('data-dlname')||'output.png';a.click();});});
  world.querySelectorAll('[data-zoomurl]').forEach(function(img){img.addEventListener('click',function(e){e.stopPropagation();showLightbox(img.getAttribute('data-zoomurl'));});});
  world.querySelectorAll('[data-rmimg]').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();var nid=btn.getAttribute('data-rmimg'),idx=parseInt(btn.getAttribute('data-rmidx'));var node=S.nodes.find(function(n){return n.id===nid;});if(node&&node.data.images){node.data.images.splice(idx,1);render();}});});
  world.querySelectorAll('[data-dlall]').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-dlall');});if(node&&node.data.images)node.data.images.forEach(function(img,i){var a=document.createElement('a');a.href=img.dataUrl;a.download='output-'+(i+1)+'.png';a.click();});});});
  world.querySelectorAll('[data-clearout]').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-clearout');});if(node){node.data.images=[];render();}});});
  world.querySelectorAll('[data-delresult]').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-delresult');});if(node){node.data.result=null;node.data.status='idle';render();}});});
  world.querySelectorAll('[data-zoom]').forEach(function(el){el.addEventListener('click',function(e){e.stopPropagation();var node=S.nodes.find(function(n){return n.id===el.getAttribute('data-zoom');});if(node&&node.data.result)showLightbox(node.data.result);});});
  world.querySelectorAll('[data-runall]').forEach(function(btn){btn.addEventListener('click',function(e){e.stopPropagation();runAll();});});
  world.querySelectorAll('.fcn').forEach(function(el){el.addEventListener('mousedown',function(){var nid=el.getAttribute('data-nid');if(S.selected!==nid){S.selected=nid;setSel(nid);}});});
}

function setSel(nid){
  var world=document.getElementById('fc-world');if(!world)return;
  world.querySelectorAll('.fcn').forEach(function(n){
    var id=n.getAttribute('data-nid'),nd=S.nodes.find(function(x){return x.id===id;});
    var acc=nd&&ND[nd.type]?ND[nd.type].color:'rgba(255,255,255,.09)';
    n.style.borderColor=id===nid?acc:'rgba(255,255,255,.09)';
    n.style.boxShadow=id===nid?'0 0 0 2px '+acc+',0 8px 32px rgba(0,0,0,.4)':'0 4px 24px rgba(0,0,0,.3)';
    n.style.zIndex=id===nid?'10':'2';
  });
}

/* ── Connect ── */
function completeConnection(from,toId,toPort,toSide,toType){
  var fromInfo,toInfo,fromType,toType2;
  if(from.side==='out'&&toSide==='in'){fromInfo={id:from.nodeId,port:from.port};toInfo={id:toId,port:toPort};fromType=from.type;toType2=toType;}
  else if(from.side==='in'&&toSide==='out'){fromInfo={id:toId,port:toPort};toInfo={id:from.nodeId,port:from.port};fromType=toType;toType2=from.type;}
  else{S.pendingConn=null;S.tempLine=null;drawSVG();return;}
  if(!compat(fromType,toType2)){toast('Port tidak kompatibel','error');S.pendingConn=null;S.tempLine=null;drawSVG();return;}
  var isDup=S.edges.some(function(e){return e.fromId===fromInfo.id&&e.fromPort===fromInfo.port&&e.toId===toInfo.id&&e.toPort===toInfo.port;});
  if(isDup){S.pendingConn=null;S.tempLine=null;drawSVG();return;}
  var targetNode=S.nodes.find(function(n){return n.id===toInfo.id;});
  if(!(targetNode&&targetNode.type==='output'))S.edges=S.edges.filter(function(e){return!(e.toId===toInfo.id&&e.toPort===toInfo.port);});
  S.edges.push({fromId:fromInfo.id,fromPort:fromInfo.port,toId:toInfo.id,toPort:toInfo.port});
  S.pendingConn=null;S.tempLine=null;render();
}

/* ── Lightbox ── */
function showLightbox(url){
  var lb=document.createElement('div');
  lb.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  lb.innerHTML='<div style="position:relative;max-width:90vw;max-height:90vh">'+
    '<img src="'+url+'" style="max-width:90vw;max-height:90vh;border-radius:12px;display:block;box-shadow:0 20px 60px rgba(0,0,0,.8)">'+
    '<button style="position:absolute;top:-16px;right:-16px;width:32px;height:32px;border-radius:50%;background:#fff;border:none;font-size:16px;cursor:pointer;font-weight:800;box-shadow:0 2px 8px rgba(0,0,0,.3)">×</button>'+
    '<a href="'+url+'" download="ajw-'+Date.now()+'.png" style="position:absolute;bottom:-22px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#22c55e,#10b981);color:#fff;text-decoration:none;font-size:11px;font-weight:700;padding:6px 20px;border-radius:99px;white-space:nowrap;box-shadow:0 4px 12px rgba(34,197,94,.4)">⬇ Download</a>'+
    '</div>';
  lb.addEventListener('click',function(e){if(e.target===lb||e.target.tagName==='BUTTON')lb.remove();});
  document.body.appendChild(lb);
}

/* ── Generate API ── */
async function runGenerate(node){
  var cfg=getCfg(),key=cfg.openaiKey||cfg.openAiKey||'';
  if(!key){toast('API Key OpenAI belum diset','error');return;}
  node.data.status='running';node.data.result=null;render();
  try{
    var promptText=getConnected(node,'prompt');
    if(!promptText&&node.data.prompt)promptText=node.data.prompt;
    if(Array.isArray(promptText))promptText=promptText.join('\n');
    promptText=(promptText||'').trim();
    var images=getConnected(node,'image')||[];
    var res;
    if(images.length>0){
      var fd=new FormData();fd.append('model',node.data.model||'gpt-image-2');fd.append('prompt',promptText||'enhance this image');fd.append('n','1');
      images.forEach(function(imgObj,idx){fd.append('image[]',dataUrlToBlob(imgObj.dataUrl),imgObj.name||('img'+idx+'.png'));});
      res=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{'Authorization':'Bearer '+key},body:fd});
    }else{
      if(!promptText){toast('Prompt kosong!','error');node.data.status='error';render();return;}
      res=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body:JSON.stringify({model:node.data.model||'gpt-image-2',prompt:promptText,n:1,size:node.data.size||'1024x1024',quality:node.data.quality||'medium',output_format:'png'})});
    }
    var json=await res.json();
    if(!res.ok)throw new Error(json.error&&json.error.message?json.error.message:'HTTP '+res.status);
    var b64=json.data&&json.data[0]&&json.data[0].b64_json;
    if(!b64)throw new Error('Tidak ada data gambar');
    node.data.result='data:image/png;base64,'+b64;node.data.status='done';
    S.edges.forEach(function(e){
      if(e.fromId===node.id&&e.fromPort==='image'){
        var tgt=S.nodes.find(function(n){return n.id===e.toId;});
        if(tgt&&tgt.type==='output'){
          if(!tgt.data.images)tgt.data.images=[];
          var ex=tgt.data.images.findIndex(function(img){return img.srcNodeId===node.id;});
          if(ex>=0)tgt.data.images[ex].dataUrl=node.data.result;
          else tgt.data.images.push({dataUrl:node.data.result,srcNodeId:node.id,name:'gen-'+Date.now()+'.png'});
        }
      }
    });
    toast('Generate selesai ✓','ok');
  }catch(err){node.data.status='error';toast('Error: '+err.message,'error');console.error('[FC]',err);}
  render();
}

/* ── Run all ── */
async function runAll(){
  var genNodes=S.nodes.filter(function(n){return n.type==='generate';});
  if(!genNodes.length){toast('Tidak ada node Generate','error');return;}
  var visited={},ordered=[];
  function visit(node){if(visited[node.id])return;visited[node.id]=true;S.edges.forEach(function(e){if(e.toId===node.id){var dep=S.nodes.find(function(n){return n.id===e.fromId;});if(dep&&dep.type==='generate')visit(dep);}});ordered.push(node);}
  genNodes.forEach(visit);
  toast('Menjalankan '+ordered.length+' node…','ok');
  for(var i=0;i<ordered.length;i++){
    var gn=ordered[i];
    var fsEdge=S.edges.find(function(e){return e.toId===gn.id&&e.toPort==='image';});
    var fsNode=fsEdge?S.nodes.find(function(n){return n.id===fsEdge.fromId&&n.type==='folder-source';}):null;
    if(fsNode){
      var fids=fsNode.data.folderIds||[];if(!fids.length&&fsNode.data.folderId)fids=[fsNode.data.folderId];
      var queue=[];fids.forEach(function(fid){var fl=srcGetFolder(fid);if(fl)fl.images.forEach(function(img,idx){queue.push({fid:fid,idx:idx});});});
      if(queue.length){
        for(var j=0;j<queue.length;j++){fsNode.data.currentFolderId=queue[j].fid;fsNode.data.currentIdx=queue[j].idx;await runGenerate(gn);if(j<queue.length-1)await new Promise(function(r){setTimeout(r,500);});}
        fsNode.data.currentFolderId='';fsNode.data.currentIdx=0;
      }else await runGenerate(gn);
    }else await runGenerate(gn);
    if(i<ordered.length-1)await new Promise(function(r){setTimeout(r,400);});
  }
  toast('✓ Semua selesai!','ok');render();
}

/* ── Add node ── */
function addNode(type){
  var def=ND[type];if(!def)return;
  var canvas=document.getElementById('fc-canvas');var W=canvas?canvas.clientWidth:800,H=canvas?canvas.clientHeight:600;
  S.nodes.push({id:uid(),type:type,x:(W/2-S.view.x)/S.view.scale+(Math.random()*80-40),y:(H/2-S.view.y)/S.view.scale+(Math.random()*80-40),data:def.def()});render();
}
function doSave(){var n=prompt('Nama flow:','Flow '+(lsGet().length+1));if(n&&n.trim())saveFlow(n.trim());}
function doClear(){if(!confirm('Kosongkan canvas?'))return;S.nodes=[];S.edges=[];S.selected=null;S.pendingConn=null;S.tempLine=null;S.hoverEdge=null;render();}

/* ── Pan / zoom ── */
var panStart=null;
function initCanvas(canvas){
  canvas.addEventListener('mousedown',function(e){
    if(e.button!==0)return;
    var t=e.target,isEmpty=t===canvas||t.id==='fc-world'||t.id==='fc-svg'||t.tagName==='svg';
    if(!isEmpty)return;
    if(S.pendingConn){S.pendingConn=null;S.tempLine=null;drawSVG();return;}
    panStart={x:e.clientX,y:e.clientY,vx:S.view.x,vy:S.view.y};S.selected=null;
  });
  document.addEventListener('mousemove',function(e){
    if(panStart){S.view.x=panStart.vx+(e.clientX-panStart.x);S.view.y=panStart.vy+(e.clientY-panStart.y);applyView();return;}
    if(S.dragging){var d=S.dragging,node=S.nodes.find(function(n){return n.id===d.nodeId;});
      if(node){node.x=d.ox+(e.clientX-d.sx)/S.view.scale;node.y=d.oy+(e.clientY-d.sy)/S.view.scale;var el=document.getElementById('fcn-'+d.nodeId);if(el){el.style.left=node.x+'px';el.style.top=node.y+'px';}requestAnimationFrame(function(){PP=collectPP();drawSVG();});}return;}
    if(S.pendingConn&&S.tempLine){var cr0=canvas.getBoundingClientRect();S.tempLine.x2=(e.clientX-cr0.left-S.view.x)/S.view.scale;S.tempLine.y2=(e.clientY-cr0.top-S.view.y)/S.view.scale;drawSVG();return;}
    if(S.edges.length>0){var cr=canvas.getBoundingClientRect();
      if(e.clientX>=cr.left&&e.clientX<=cr.right&&e.clientY>=cr.top&&e.clientY<=cr.bottom){
        var wx=(e.clientX-cr.left-S.view.x)/S.view.scale,wy=(e.clientY-cr.top-S.view.y)/S.view.scale,thr=10/S.view.scale,prev=S.hoverEdge;S.hoverEdge=null;
        for(var i=0;i<S.edges.length;i++){var ee=S.edges[i];var fp=PP[ee.fromId+'|out|'+ee.fromPort],tp=PP[ee.toId+'|in|'+ee.toPort];if(fp&&tp&&edgeDist(fp,tp,wx,wy)<thr){S.hoverEdge=i;break;}}
        if(S.hoverEdge!==prev)drawSVG();
      }else if(S.hoverEdge!==null){S.hoverEdge=null;drawSVG();}
    }
  });
  document.addEventListener('mouseup',function(e){
    if(S.pendingConn){var el=document.elementFromPoint(e.clientX,e.clientY);while(el&&!el.hasAttribute('data-port'))el=el.parentElement;
      if(el&&el.hasAttribute('data-port')&&el.getAttribute('data-nodeid')!==S.pendingConn.nodeId)completeConnection(S.pendingConn,el.getAttribute('data-nodeid'),el.getAttribute('data-port'),el.getAttribute('data-side'),el.getAttribute('data-ptype'));
      else{S.pendingConn=null;S.tempLine=null;drawSVG();}
    }
    panStart=null;S.dragging=null;
  });
  canvas.addEventListener('wheel',function(e){e.preventDefault();var cr=canvas.getBoundingClientRect(),mx=e.clientX-cr.left,my=e.clientY-cr.top;var delta=e.deltaY<0?1.08:0.93,ns=Math.min(2.5,Math.max(0.15,S.view.scale*delta)),r=ns/S.view.scale;S.view.x=mx-(mx-S.view.x)*r;S.view.y=my-(my-S.view.y)*r;S.view.scale=ns;applyView();},{passive:false});
  canvas.addEventListener('contextmenu',function(e){if(S.pendingConn){e.preventDefault();S.pendingConn=null;S.tempLine=null;drawSVG();}});
}
function applyView(){var w=document.getElementById('fc-world'),s=document.getElementById('fc-svg');var t='translate('+S.view.x+'px,'+S.view.y+'px) scale('+S.view.scale+')';if(w)w.style.transform=t;if(s)s.style.transform=t;}

/* ── CSS ── */
function injectCSS(){
  if(document.getElementById('fc-css6'))return;
  var st=document.createElement('style');st.id='fc-css6';
  st.textContent=
    '#fc-world{pointer-events:none;}'+
    '.fcn{pointer-events:auto;transition:box-shadow .2s,border-color .2s;}'+
    '.fcn:hover{box-shadow:0 8px 40px rgba(0,0,0,.45)!important;}'+
    '.fc-port{transition:transform .12s,box-shadow .12s;}'+
    '.fc-port:hover{transform:scale(1.8)!important;box-shadow:0 0 14px currentColor!important;}'+
    '#fc-canvas{background-color:#ffffff;background-image:radial-gradient(circle,#e0e0e0 1px,transparent 1px);background-size:24px 24px;}'+
    '@keyframes fc-dash{to{stroke-dashoffset:-30}}'+
    '@keyframes fc-blink{0%,100%{opacity:1}50%{opacity:.3}}'+
    '@keyframes fc-pulse-ring{0%{box-shadow:0 0 0 0 rgba(245,158,11,.5),0 4px 24px rgba(0,0,0,.3)}70%{box-shadow:0 0 0 10px rgba(245,158,11,0),0 4px 24px rgba(0,0,0,.3)}100%{box-shadow:0 0 0 0 rgba(245,158,11,0),0 4px 24px rgba(0,0,0,.3)}}'+
    '.fcn-running{animation:fc-pulse-ring 1.4s cubic-bezier(.215,.61,.355,1) infinite!important;}'+
    'textarea:focus{border-color:rgba(99,102,241,.5)!important;}'+
    '::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-track{background:rgba(255,255,255,.03)}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:4px}';
  document.head.appendChild(st);
}

/* ── Flow Canvas Mount ── */
window.AJWFlowCanvasMount=function(root){
  if(!root)return;
  ROOT=root;injectCSS();
  S.nodes=[];S.edges=[];S.view={x:80,y:40,scale:0.9};
  S.dragging=null;S.pendingConn=null;S.selected=null;S.tempLine=null;S.hoverEdge=null;
  var oldBtn=document.getElementById('fc-ebtn');if(oldBtn)oldBtn.remove();

  var topOff=root.getBoundingClientRect?root.getBoundingClientRect().top:160;
  var availH=Math.max(window.innerHeight-topOff-4,520);
  root.style.cssText='display:flex;flex-direction:column;height:'+availH+'px;min-height:520px;background:#ffffff;';

  function tbStyle(c,bg){return 'background:'+bg+';color:'+c+';border:1px solid '+c+'25;border-radius:6px;padding:5px 10px;font-size:10px;font-weight:600;cursor:pointer;white-space:nowrap;transition:all .15s;';}

  root.innerHTML=
    '<div id="fc-toolbar" style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:8px 16px;background:#0f1623;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0">'+
    '<button id="fc-ai"  style="'+tbStyle('#10b981','rgba(16,185,129,.12)')+'">＋ Image</button>'+
    '<button id="fc-afs" style="'+tbStyle('#0ea5e9','rgba(14,165,233,.12)')+'">＋ Folder</button>'+
    '<button id="fc-ap"  style="'+tbStyle('#8b5cf6','rgba(139,92,246,.12)')+'">＋ Prompt</button>'+
    '<button id="fc-ag"  style="'+tbStyle('#f59e0b','rgba(245,158,11,.12)')+'">＋ Generate</button>'+
    '<button id="fc-ao"  style="'+tbStyle('#7c3aed','rgba(124,58,237,.12)')+'">＋ Output</button>'+
    '<button id="fc-at"  style="'+tbStyle('#ef4444','rgba(239,68,68,.12)')+'">▶ Trigger</button>'+
    '<button id="fc-ast" style="'+tbStyle('#64748b','rgba(100,116,139,.12)')+'">📊 Status</button>'+
    '<div style="width:1px;height:20px;background:rgba(255,255,255,.08);margin:0 3px"></div>'+
    '<button id="fc-save"  style="'+tbStyle('#22c55e','rgba(34,197,94,.12)')+'">💾 Simpan</button>'+
    '<button id="fc-tpl-btn" style="'+tbStyle('#cbd5e1','rgba(255,255,255,.06)')+'">📋 Template</button>'+
    '<button id="fc-clear" style="'+tbStyle('#ef4444','rgba(239,68,68,.08)')+'">🗑</button>'+
    '<button id="fc-fs-btn" title="Fullscreen" style="'+tbStyle('#94a3b8','rgba(255,255,255,.05)')+'margin-left:auto">⛶</button>'+
    '</div>'+
    /* template panel (hidden by default) */
    '<div id="fc-tpl-panel-wrap" style="display:none;position:absolute;top:45px;left:16px;z-index:200;width:260px;background:#0f1623;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:12px;box-shadow:0 8px 40px rgba(0,0,0,.5)">'+
    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">'+
    '<span style="font-size:11px;font-weight:700;color:#e2e8f0">Template Tersimpan</span>'+
    '<button id="fc-tpl-close" style="background:none;border:none;color:#64748b;cursor:pointer;font-size:14px;font-weight:700">×</button>'+
    '</div>'+
    '<div id="fc-tpl-panel"></div>'+
    '</div>'+
    '<div id="fc-canvas" style="position:relative;overflow:hidden;flex:1;">'+
    '<svg id="fc-svg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;transform-origin:0 0;overflow:visible"></svg>'+
    '<div id="fc-world" style="position:absolute;transform-origin:0 0;width:0;height:0"></div>'+
    '</div>';

  document.getElementById('fc-ai').onclick=function(){addNode('image-source');};
  document.getElementById('fc-afs').onclick=function(){addNode('folder-source');};
  document.getElementById('fc-ap').onclick=function(){addNode('prompt');};
  document.getElementById('fc-ag').onclick=function(){addNode('generate');};
  document.getElementById('fc-ao').onclick=function(){addNode('output');};
  document.getElementById('fc-at').onclick=function(){addNode('trigger');};
  document.getElementById('fc-ast').onclick=function(){addNode('status');};
  document.getElementById('fc-save').onclick=doSave;
  document.getElementById('fc-clear').onclick=doClear;

  /* template panel toggle */
  var tplWrap=document.getElementById('fc-tpl-panel-wrap');
  document.getElementById('fc-tpl-btn').onclick=function(){tplWrap.style.display=tplWrap.style.display==='none'?'block':'none';refreshTplList();};
  document.getElementById('fc-tpl-close').onclick=function(){tplWrap.style.display='none';};

  /* fullscreen */
  var fsBtn=document.getElementById('fc-fs-btn');
  fsBtn.onclick=function(){if(!document.fullscreenElement){root.requestFullscreen&&root.requestFullscreen();}else{document.exitFullscreen&&document.exitFullscreen();}};
  document.addEventListener('fullscreenchange',function(){fsBtn.textContent=document.fullscreenElement?'⊠':'⛶';});

  /* load IDB images into memory cache then render */
  idbGetAll(function(map){_srcImages=map;refreshTplList();initCanvas(document.getElementById('fc-canvas'));render();});
};

/* ── Source Library Mount ── */
window.AJWSourceMount=function(root){
  if(!root)return;injectCSS();
  var topOff=root.getBoundingClientRect?root.getBoundingClientRect().top:160;
  var availH=Math.max(window.innerHeight-topOff-4,520);
  root.style.cssText='height:'+availH+'px;min-height:520px;overflow:hidden;display:flex;flex-direction:column;background:#0a0e1a;';
  idbGetAll(function(map){_srcImages=map;renderSourceUI(root);});
};

function renderSourceUI(root){
  var lib=srcGet();
  var folderHTML=lib.folders.length?lib.folders.map(function(f){
    var thumbs=f.images.slice(0,10).map(function(img,ii){
      var du=_srcImages[img.id]||'';
      return du?'<div style="position:relative;display:inline-block;flex-shrink:0">'+
        '<img src="'+du+'" title="'+esc(img.name)+'" style="width:80px;height:80px;object-fit:cover;border-radius:7px;border:1px solid rgba(255,255,255,.08);cursor:pointer;display:block" data-srcview="'+du+'">'+
        '<button data-delfimg="'+f.id+'" data-imgidx="'+ii+'" style="position:absolute;top:3px;right:3px;background:rgba(0,0,0,.7);color:#fff;border:none;border-radius:4px;font-size:10px;cursor:pointer;width:18px;height:18px;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)">×</button>'+
        '</div>':'';
    }).join('');
    var more=f.images.length>10?'<div style="width:80px;height:80px;border-radius:7px;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-size:11px;color:#475569;border:1px solid rgba(255,255,255,.06);flex-shrink:0">+'+(f.images.length-10)+'</div>':'';
    return '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;margin-bottom:12px">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+
      '<span style="font-size:13px;font-weight:800;color:#e2e8f0;flex:1">📁 '+esc(f.name)+'</span>'+
      '<span style="font-size:10px;color:#475569;background:rgba(255,255,255,.05);padding:2px 8px;border-radius:99px">'+f.images.length+' gambar</span>'+
      '<label style="background:rgba(14,165,233,.15);color:#38bdf8;border:1px solid rgba(14,165,233,.3);border-radius:6px;padding:4px 10px;font-size:10px;cursor:pointer;font-weight:700;white-space:nowrap;display:inline-block">'+
        '+ Upload<input type="file" data-srcfolderid="'+f.id+'" accept="image/*" multiple style="display:none">'+
      '</label>'+
      '<button data-delfolder="'+f.id+'" style="background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.25);border-radius:6px;padding:4px 8px;font-size:10px;cursor:pointer">🗑</button>'+
      '</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px">'+
      (f.images.length?thumbs+more:'<div style="color:#334155;font-size:11px;padding:16px 0;text-align:center;width:100%;border:1.5px dashed rgba(255,255,255,.07);border-radius:8px">Klik Upload untuk menambah gambar</div>')+
      '</div></div>';
  }).join(''):'<div style="text-align:center;color:#334155;font-size:12px;padding:60px 0;border:2px dashed rgba(255,255,255,.07);border-radius:12px">Belum ada folder.<br>Klik <strong style="color:#10b981">＋ Folder Baru</strong> untuk memulai.<br><span style="font-size:10px;color:#1e3a4a;margin-top:8px;display:block">💡 Gambar disimpan di IndexedDB browser — tidak ada batas ukuran ketat</span></div>';

  root.innerHTML=
    '<div style="padding:14px 20px;background:#0f1623;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:10px;flex-shrink:0">'+
    '<span style="font-size:14px;font-weight:900;color:#e2e8f0">📁 Source Library</span>'+
    '<span style="font-size:10px;color:#334155;background:rgba(255,255,255,.05);padding:2px 10px;border-radius:99px">'+lib.folders.length+' folder · '+lib.folders.reduce(function(s,f){return s+f.images.length;},0)+' gambar</span>'+
    '<button id="src-newfolder" style="margin-left:auto;background:rgba(16,185,129,.15);color:#10b981;border:1px solid rgba(16,185,129,.3);border-radius:7px;padding:7px 16px;font-size:11px;font-weight:700;cursor:pointer">＋ Folder Baru</button>'+
    '</div>'+
    '<div style="flex:1;overflow-y:auto;padding:16px 20px">'+folderHTML+'</div>';

  root.querySelector('#src-newfolder').addEventListener('click',function(){
    var freshLib=srcGet();var name=prompt('Nama folder:','Folder '+(freshLib.folders.length+1));
    if(!name||!name.trim())return;freshLib.folders.push({id:uid(),name:name.trim(),images:[]});srcSet(freshLib);renderSourceUI(root);
  });

  /* upload: input inside label — most reliable cross-browser */
  root.querySelectorAll('input[data-srcfolderid]').forEach(function(fi){
    fi.addEventListener('change',function(){
      var files=Array.prototype.slice.call(fi.files||[]);
      var fid=fi.getAttribute('data-srcfolderid');
      fi.value='';
      if(!files.length)return;
      toast('Memproses '+files.length+' gambar…','ok');
      var done=[],pend=files.length;
      files.forEach(function(file){
        var reader=new FileReader();
        reader.onerror=function(){if(--pend===0)_finishSrcUpload(fid,root,done);};
        reader.onload=function(ev){
          compressImage(ev.target.result,1200,0.85,function(compressed){
            done.push({id:uid(),name:file.name,dataUrl:compressed});
            if(--pend===0)_finishSrcUpload(fid,root,done);
          });
        };
        reader.readAsDataURL(file);
      });
    });
  });

  root.querySelectorAll('[data-delfolder]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var fid=btn.getAttribute('data-delfolder');if(!confirm('Hapus folder ini?'))return;
      var freshLib=srcGet();
      /* delete all images from IDB */
      var fl=freshLib.folders.find(function(f){return f.id===fid;});
      if(fl)fl.images.forEach(function(img){idbDel(img.id);delete _srcImages[img.id];});
      freshLib.folders=freshLib.folders.filter(function(f){return f.id!==fid;});
      srcSet(freshLib);renderSourceUI(root);
    });
  });

  root.querySelectorAll('[data-delfimg]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var fid=btn.getAttribute('data-delfimg'),idx=parseInt(btn.getAttribute('data-imgidx'));
      var freshLib=srcGet();var fl=freshLib.folders.find(function(f){return f.id===fid;});if(!fl)return;
      var img=fl.images[idx];if(img){idbDel(img.id);delete _srcImages[img.id];}
      fl.images.splice(idx,1);srcSet(freshLib);renderSourceUI(root);
    });
  });

  root.querySelectorAll('[data-srcview]').forEach(function(img){img.addEventListener('click',function(){showLightbox(img.getAttribute('data-srcview'));});});
}

function _finishSrcUpload(fid,root,images){
  if(!images.length){toast('Tidak ada gambar diproses','error');return;}
  var lib=srcGet();var fl=lib.folders.find(function(f){return f.id===fid;});
  if(!fl){toast('Folder tidak ditemukan','error');return;}
  var pend=images.length;
  images.forEach(function(img){
    /* save dataUrl to IDB, keep only metadata in localStorage */
    _srcImages[img.id]=img.dataUrl;
    idbPut(img.id,img.dataUrl,function(){if(--pend===0){
      images.forEach(function(i){fl.images.push({id:i.id,name:i.name});});
      srcSet(lib);toast(images.length+' gambar berhasil diupload! ✓','ok');renderSourceUI(root);
    }});
  });
}

})();
