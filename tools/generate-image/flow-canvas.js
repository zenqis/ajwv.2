/* AJW Flow Canvas v4 — minimalist nodes, multi-image output, folder source, source library */
(function(){
'use strict';

/* ── helpers ── */
function uid(){ return 'n'+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function getCfg(){ return typeof window.getCfg==='function'?window.getCfg():(window._ajwCfg||{}); }
function dataUrlToBlob(d){
  var a=d.split(','),m=a[0].match(/:(.*?);/)[1],b=atob(a[1]),n=b.length,u=new Uint8Array(n);
  for(var i=0;i<n;i++)u[i]=b.charCodeAt(i);
  return new Blob([u],{type:m});
}
function toast(msg,type){
  var t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:24px;right:24px;z-index:99999;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:700;box-shadow:0 4px 20px rgba(0,0,0,.18);transition:opacity .4s;'+
    (type==='error'?'background:#fee2e2;color:#991b1b;border:1px solid #fca5a5':'background:#dcfce7;color:#166534;border:1px solid #86efac');
  t.textContent=msg; document.body.appendChild(t);
  setTimeout(function(){t.style.opacity='0';setTimeout(function(){t.remove();},400);},3000);
}

/* ── SOURCE LIBRARY (localStorage) ── */
var SRC_KEY='ajw_gi_source_v1';
function srcGet(){try{return JSON.parse(localStorage.getItem(SRC_KEY)||'{"folders":[]}');}catch(e){return{folders:[]};}}
function srcSet(v){try{localStorage.setItem(SRC_KEY,JSON.stringify(v));}catch(e){}}
function srcGetFolder(fid){return srcGet().folders.find(function(f){return f.id===fid;});}

/* ── CANVAS STATE ── */
var S={nodes:[],edges:[],view:{x:80,y:40,scale:0.9},dragging:null,pendingConn:null,tempLine:null,selected:null,hoverEdge:null};

/* ── PORT COLOURS ── */
var PC={'image':'#22c55e','text':'#3b82f6','prompt':'#a78bfa','trigger':'#f59e0b'};
function pc(t){return PC[t]||'#94a3b8';}
function compat(a,b){
  if(a===b)return true;
  if((a==='image')&&(b==='image'))return true;
  if((a==='text'||a==='prompt')&&(b==='text'||b==='prompt'))return true;
  return false;
}

/* ── NODE DEFINITIONS ── */
var ND={
  'image-source':{label:'Gambar Input',color:'#16a34a',
    inputs:[],outputs:[{id:'images',type:'image',label:'Gambar'}],
    def:function(){return{images:[],isBatch:false};}},
  'folder-source':{label:'Folder Source',color:'#0891b2',
    inputs:[],outputs:[{id:'images',type:'image',label:'Gambar'}],
    def:function(){return{folderId:'',folderName:'',currentIdx:0};}},
  'prompt':{label:'Prompt',color:'#6366f1',
    inputs:[],outputs:[{id:'text',type:'text',label:'Teks'}],
    def:function(){return{text:''};}},
  'generate':{label:'Generate Image',color:'#c77818',
    inputs:[{id:'image',type:'image',label:'Gambar (opt)'},{id:'prompt',type:'prompt',label:'Prompt (opt)'}],
    outputs:[{id:'image',type:'image',label:'Hasil'}],
    def:function(){return{model:'gpt-image-2',size:'1024x1024',quality:'medium',status:'idle',result:null,prompt:''};}},
  'output':{label:'Output / Preview',color:'#7c3aed',
    inputs:[{id:'image',type:'image',label:'Gambar'}],outputs:[],
    def:function(){return{images:[]};}},
  'trigger':{label:'Run Flow',color:'#dc2626',
    inputs:[],outputs:[{id:'trigger',type:'trigger',label:'Mulai'}],
    def:function(){return{};}},
};

/* ── GET CONNECTED VALUE ── */
function getConnected(node,portId){
  var results=[];
  S.edges.forEach(function(e){
    if(e.toId!==node.id||e.toPort!==portId)return;
    var src=S.nodes.find(function(n){return n.id===e.fromId;});
    if(!src)return;
    if(portId==='image'||portId==='images'){
      if(src.type==='image-source') results=results.concat(src.data.images||[]);
      if(src.type==='folder-source'){
        var fl=srcGetFolder(src.data.folderId);
        if(fl){
          var idx=src.data.currentIdx||0;
          var img=fl.images[idx];
          if(img) results.push({name:img.name,dataUrl:img.dataUrl});
        }
      }
      if(src.type==='generate'&&src.data.result) results.push({name:'gen.png',dataUrl:src.data.result});
    }
    if(portId==='prompt'||portId==='text'){
      if(src.type==='prompt') results.push(src.data.text||'');
    }
  });
  if(!results.length)return null;
  return typeof results[0]==='string'?results.join('\n'):results;
}

/* ── FLOW STORAGE ── */
var LSK='ajw_gi_flows_v2';
function lsGet(){try{return JSON.parse(localStorage.getItem(LSK)||'[]');}catch(e){return[];}}
function lsSet(v){try{localStorage.setItem(LSK,JSON.stringify(v));}catch(e){}}
function saveFlow(name){
  var flows=lsGet(),ex=flows.find(function(f){return f.name===name;});
  var flow={id:ex?ex.id:uid(),name:name,
    nodes:S.nodes.map(function(n){return{id:n.id,type:n.type,x:n.x,y:n.y,data:JSON.parse(JSON.stringify(n.data))};}),
    edges:S.edges.map(function(e){return Object.assign({},e);}),updatedAt:Date.now()};
  if(ex)Object.assign(ex,flow);else flows.push(flow);
  lsSet(flows);toast('Flow "'+name+'" disimpan','ok');refreshDD();
}
function loadFlow(id){
  var f=lsGet().find(function(f){return f.id===id;});if(!f)return;
  S.nodes=f.nodes.map(function(n){var d=ND[n.type];return{id:n.id,type:n.type,x:n.x,y:n.y,data:Object.assign(d?d.def():{},n.data)};});
  S.edges=f.edges.map(function(e){return Object.assign({},e);});
  S.selected=null;S.pendingConn=null;S.tempLine=null;S.hoverEdge=null;
  render();toast('Flow "'+f.name+'" dimuat','ok');
}
function refreshDD(){
  var dd=document.getElementById('fc-load-dd');if(!dd)return;
  dd.innerHTML='<option value="">— Muat Template —</option>'+
    lsGet().map(function(f){return'<option value="'+esc(f.id)+'">'+esc(f.name)+'</option>';}).join('');
}

/* ── PORT POSITIONS ── */
var PP={};
function collectPP(){
  var pp={},canvas=document.getElementById('fc-canvas');if(!canvas)return pp;
  var cr=canvas.getBoundingClientRect();
  S.nodes.forEach(function(node){
    var def=ND[node.type]||{inputs:[],outputs:[]};
    def.inputs.forEach(function(p){
      var el=document.getElementById('prt-'+node.id+'-in-'+p.id);if(!el)return;
      var r=el.getBoundingClientRect();
      pp[node.id+'|in|'+p.id]={x:(r.left+r.width/2-cr.left-S.view.x)/S.view.scale,y:(r.top+r.height/2-cr.top-S.view.y)/S.view.scale,type:p.type,side:'in',nodeId:node.id,port:p.id};
    });
    def.outputs.forEach(function(p){
      var el=document.getElementById('prt-'+node.id+'-out-'+p.id);if(!el)return;
      var r=el.getBoundingClientRect();
      pp[node.id+'|out|'+p.id]={x:(r.left+r.width/2-cr.left-S.view.x)/S.view.scale,y:(r.top+r.height/2-cr.top-S.view.y)/S.view.scale,type:p.type,side:'out',nodeId:node.id,port:p.id};
    });
  });
  return pp;
}

/* ── BEZIER ── */
function bez(x1,y1,x2,y2){var cx=(x1+x2)/2;return 'M'+x1+','+y1+' C'+cx+','+y1+' '+cx+','+y2+' '+x2+','+y2;}
function bezPt(x1,y1,x2,y2,t){var cx=(x1+x2)/2,mt=1-t;return{x:mt*mt*mt*x1+3*mt*mt*t*cx+3*mt*t*t*cx+t*t*t*x2,y:mt*mt*mt*y1+3*mt*mt*t*y1+3*mt*t*t*y2+t*t*t*y2};}
function edgeDist(fp,tp,wx,wy){var m=1e9;for(var i=0;i<=16;i++){var p=bezPt(fp.x,fp.y,tp.x,tp.y,i/16),dx=p.x-wx,dy=p.y-wy,d=dx*dx+dy*dy;if(d<m)m=d;}return Math.sqrt(m);}

/* ── SVG DRAW ── */
function drawSVG(){
  var svg=document.getElementById('fc-svg');if(!svg)return;
  var paths=[];
  S.edges.forEach(function(e,i){
    var fp=PP[e.fromId+'|out|'+e.fromPort],tp=PP[e.toId+'|in|'+e.toPort];if(!fp||!tp)return;
    var col=pc(fp.type),isH=S.hoverEdge===i;
    paths.push('<path d="'+bez(fp.x,fp.y,tp.x,tp.y)+'" stroke="'+col+'" stroke-width="'+(isH?2.5:1.5)+'" fill="none" opacity="'+(isH?1:0.65)+'"/>'+
      '<circle cx="'+tp.x+'" cy="'+tp.y+'" r="3" fill="'+col+'" opacity="'+(isH?1:0.65)+'"/>');
  });
  if(S.tempLine){var t=S.tempLine;paths.push('<line x1="'+t.x1+'" y1="'+t.y1+'" x2="'+t.x2+'" y2="'+t.y2+'" stroke="'+(S.pendingConn?pc(S.pendingConn.type):'#94a3b8')+'" stroke-width="1.5" stroke-dasharray="5 3" opacity="0.8"/>');}
  svg.innerHTML=paths.join('');
  updateEdgeBtn();
}

/* ── EDGE HOVER BUTTON ── */
function updateEdgeBtn(){
  var btn=document.getElementById('fc-ebtn');
  if(S.hoverEdge===null||S.hoverEdge===undefined){if(btn)btn.style.display='none';return;}
  var e=S.edges[S.hoverEdge];if(!e){if(btn)btn.style.display='none';return;}
  var fp=PP[e.fromId+'|out|'+e.fromPort],tp=PP[e.toId+'|in|'+e.toPort];
  if(!fp||!tp){if(btn)btn.style.display='none';return;}
  var canvas=document.getElementById('fc-canvas');if(!canvas){if(btn)btn.style.display='none';return;}
  var cr=canvas.getBoundingClientRect();
  var mx=(fp.x+tp.x)/2*S.view.scale+S.view.x+cr.left;
  var my=(fp.y+tp.y)/2*S.view.scale+S.view.y+cr.top;
  if(!btn){
    btn=document.createElement('div');btn.id='fc-ebtn';btn.textContent='×';
    btn.style.cssText='position:fixed;width:18px;height:18px;border-radius:50%;background:#ef4444;color:#fff;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;cursor:pointer;z-index:9999;transform:translate(-50%,-50%);box-shadow:0 1px 6px rgba(0,0,0,.25)';
    btn.addEventListener('click',function(ev){ev.stopPropagation();if(S.hoverEdge!==null){S.edges.splice(S.hoverEdge,1);S.hoverEdge=null;render();}});
    document.body.appendChild(btn);
  }
  btn.style.left=mx+'px';btn.style.top=my+'px';btn.style.display='flex';
}

/* ── RENDER NODE (minimalist white style) ── */
function renderNode(node){
  var def=ND[node.type]||{label:node.type,color:'#94a3b8',inputs:[],outputs:[],def:function(){return{};}};
  var isSel=S.selected===node.id;
  var W={generate:252,'image-source':200,'folder-source':210,prompt:210,output:230,trigger:160}[node.type]||210;
  var acc=def.color;

  function portDot(p,side,i){
    return '<div class="fc-port" id="prt-'+node.id+'-'+side+'-'+p.id+'"'+
      ' data-nodeid="'+node.id+'" data-port="'+p.id+'" data-side="'+side+'" data-ptype="'+p.type+'"'+
      ' title="'+esc(p.label)+'"'+
      ' style="position:absolute;'+(side==='in'?'left:-7px':'right:-7px')+';top:'+(18+i*22)+'px;'+
      'width:14px;height:14px;border-radius:50%;background:'+pc(p.type)+';border:2px solid #fff;'+
      'cursor:crosshair;z-index:30;box-shadow:0 0 0 2px '+pc(p.type)+'33;transition:transform .1s;"></div>';
  }
  var def2=ND[node.type]||{inputs:[],outputs:[]};
  var ports=def2.inputs.map(function(p,i){return portDot(p,'in',i);}).join('')+def2.outputs.map(function(p,i){return portDot(p,'out',i);}).join('');
  var minH=Math.max(def2.inputs.length,def2.outputs.length)*22+12;

  /* status indicator for generate */
  var statusBadge='';
  if(node.type==='generate'){
    var sc={idle:'#d1d5db',running:'#3b82f6',done:'#22c55e',error:'#ef4444'}[node.data.status||'idle'];
    statusBadge='<span style="width:6px;height:6px;border-radius:50%;background:'+sc+';display:inline-block;margin-left:4px;flex-shrink:0"></span>';
  }

  return '<div id="fcn-'+node.id+'" class="fcn" data-nid="'+node.id+'"'+
    ' style="position:absolute;left:'+node.x+'px;top:'+node.y+'px;width:'+W+'px;'+
    'background:#fff;border-radius:8px;'+
    'border:1px solid '+(isSel?acc:'#e5e7eb')+';'+
    'border-left:3px solid '+acc+';'+
    'box-shadow:0 1px 6px rgba(0,0,0,.07);z-index:'+(isSel?10:2)+'">'+
    '<div class="fcn-hdr" data-nid="'+node.id+'"'+
    ' style="display:flex;align-items:center;gap:5px;padding:6px 8px 6px 10px;'+
    'border-bottom:1px solid #f3f4f6;cursor:move;user-select:none;background:#fafafa;border-radius:6px 6px 0 0">'+
    '<span style="font-size:10px;font-weight:700;color:#374151;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(def.label)+'</span>'+
    statusBadge+
    '<button data-del="'+node.id+'" style="border:none;background:none;color:#9ca3af;cursor:pointer;font-size:14px;padding:0 2px;line-height:1;font-weight:700">×</button>'+
    '</div>'+
    '<div style="position:relative;min-height:'+minH+'px">'+
    ports+
    '<div style="padding:8px 12px 10px;font-size:12px;color:#374151">'+renderBody(node)+'</div>'+
    '</div></div>';
}

function renderBody(node){
  switch(node.type){
    case 'image-source':return bodyImgSrc(node);
    case 'folder-source':return bodyFolderSrc(node);
    case 'prompt':return bodyPrompt(node);
    case 'generate':return bodyGenerate(node);
    case 'output':return bodyOutput(node);
    case 'trigger':return bodyTrigger(node);
    default:return '';
  }
}

/* style helpers */
function bs(bg,col,extra){return 'background:'+bg+';color:'+col+';border:1px solid '+col+'22;border-radius:5px;padding:4px 9px;font-size:10px;cursor:pointer;'+(extra||'');}
function ib(){return 'background:rgba(0,0,0,.45);color:#fff;border:none;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;';}

function bodyImgSrc(node){
  var imgs=node.data.images||[];
  var thumbs=imgs.slice(0,4).map(function(img){return'<img src="'+img.dataUrl+'" title="'+esc(img.name)+'" style="width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid #e5e7eb">';}).join('');
  var more=imgs.length>4?'<span style="font-size:9px;color:#9ca3af;align-self:center">+'+(imgs.length-4)+'</span>':'';
  return '<div id="dz-'+node.id+'" data-dz="'+node.id+'"'+
    ' style="border:1.5px dashed #d1d5db;border-radius:6px;padding:6px;min-height:52px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:3px;margin-bottom:7px;background:#f9fafb;cursor:pointer">'+
    (imgs.length?thumbs+more:'<span style="color:#9ca3af;font-size:10px">Upload / Drag gambar</span>')+
    '</div>'+
    '<div style="display:flex;gap:5px;align-items:center">'+
    '<button data-upload="'+node.id+'" style="'+bs('#f0f9ff','#0284c7')+'">Upload</button>'+
    '<label style="display:flex;align-items:center;gap:3px;font-size:10px;color:#6b7280;cursor:pointer"><input type="checkbox" '+(node.data.isBatch?'checked':'')+' data-batch="'+node.id+'"> Batch</label>'+
    '<span style="color:#9ca3af;font-size:9px;margin-left:auto">'+imgs.length+' file</span>'+
    '</div>'+
    '<input type="file" id="fcf-'+node.id+'" accept="image/*" multiple style="display:none">';
}

function bodyFolderSrc(node){
  var lib=srcGet(),fid=node.data.folderId;
  var folder=fid?lib.folders.find(function(f){return f.id===fid;}):null;
  var opts=lib.folders.map(function(f){return'<option value="'+esc(f.id)+'"'+(f.id===fid?' selected':'')+'>'+esc(f.name)+'</option>';}).join('');
  var info=folder?('<span style="color:#9ca3af;font-size:9px;margin-top:4px;display:block">'+folder.images.length+' gambar</span>'):'';
  return '<div style="margin-bottom:4px;font-size:10px;color:#6b7280;font-weight:600">Pilih Folder Source</div>'+
    '<select data-folderpick="'+node.id+'" style="width:100%;box-sizing:border-box;background:#f9fafb;border:1px solid #e5e7eb;border-radius:5px;font-size:10px;padding:5px 6px;color:#374151;margin-bottom:4px">'+
    '<option value="">— Pilih folder —</option>'+opts+
    '</select>'+info;
}

function bodyPrompt(node){
  return '<textarea id="fct-'+node.id+'" data-taid="'+node.id+'" placeholder="Tulis prompt..."'+
    ' style="width:100%;box-sizing:border-box;min-height:80px;background:#f9fafb;border:1px solid #e5e7eb;'+
    'border-radius:5px;color:#111827;font-size:11px;padding:7px;resize:vertical;font-family:inherit;line-height:1.5">'+
    esc(node.data.text||'')+'</textarea>';
}

function bodyGenerate(node){
  var sc={idle:'#9ca3af',running:'#3b82f6',done:'#22c55e',error:'#ef4444'}[node.data.status||'idle'];
  var st={idle:'Siap',running:'Proses...',done:'Selesai',error:'Gagal'}[node.data.status||'idle'];
  var pConn=S.edges.some(function(e){return e.toId===node.id&&e.toPort==='prompt';});
  var iConn=S.edges.some(function(e){return e.toId===node.id&&e.toPort==='image';});
  return (node.data.result?
    '<div style="position:relative;border-radius:6px;overflow:hidden;margin-bottom:7px;cursor:zoom-in" data-zoom="'+node.id+'">'+
    '<img src="'+node.data.result+'" style="width:100%;display:block;border-radius:6px">'+
    '<div style="position:absolute;top:4px;right:4px;display:flex;gap:2px">'+
    '<button data-outdown="'+node.id+'" title="Download" style="'+ib()+'">⬇</button>'+
    '<button data-delresult="'+node.id+'" title="Hapus" style="'+ib()+'">✕</button>'+
    '</div></div>':'')+
  (iConn?'<div style="font-size:9px;color:#16a34a;padding:3px 6px;background:#f0fdf4;border-radius:4px;border:1px solid #bbf7d0;margin-bottom:5px">✓ Gambar terhubung</div>':'')+
  (!pConn?'<div style="margin-bottom:6px">'+
    '<div style="font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">Prompt</div>'+
    '<textarea id="fct-'+node.id+'" data-taid="'+node.id+'" data-isprompt="1" placeholder="Tulis prompt..." '+
    'style="width:100%;box-sizing:border-box;min-height:58px;background:#f9fafb;border:1px solid #e5e7eb;'+
    'border-radius:5px;color:#111827;font-size:10px;padding:6px;resize:vertical;font-family:inherit;line-height:1.5">'+
    esc(node.data.prompt||'')+'</textarea></div>':
    '<div style="font-size:9px;color:#1e40af;padding:3px 6px;background:#eff6ff;border-radius:4px;border:1px solid #bfdbfe;margin-bottom:5px">✓ Prompt terhubung</div>')+
  /* compact settings */
  '<div style="display:flex;gap:4px;margin-bottom:7px;align-items:center;flex-wrap:wrap">'+
  cmpSel(node,'model',['gpt-image-2','gpt-image-1'])+
  cmpSel(node,'size',['1024x1024','1792x1024','1024x1792'])+
  cmpSel(node,'quality',['auto','medium','high','low'])+
  '</div>'+
  '<div style="display:flex;align-items:center;gap:6px">'+
  '<button data-gen="'+node.id+'" style="'+bs('#fff7ed','#c77818','flex:1;font-weight:800;font-size:11px;padding:6px 8px;border:1px solid #fed7aa;')+'"'+(node.data.status==='running'?' disabled':'')+'>'+
  (node.data.status==='running'?'⏳...':'⚡ Generate')+'</button>'+
  '<span style="font-size:9px;color:'+sc+'">'+esc(st)+'</span>'+
  '</div>';
}

function cmpSel(node,field,opts){
  return '<select data-gf="'+node.id+'" data-field="'+field+'"'+
    ' style="background:#f9fafb;color:#374151;border:1px solid #e5e7eb;border-radius:4px;font-size:9px;padding:2px 4px;flex:1;min-width:0">'+
    opts.map(function(o){return'<option value="'+o+'"'+(node.data[field]===o?' selected':'')+'>'+o+'</option>';}).join('')+
    '</select>';
}

function bodyOutput(node){
  var imgs=node.data.images||[];
  if(!imgs.length){
    return '<div style="text-align:center;color:#9ca3af;font-size:10px;padding:16px 0;border:1.5px dashed #e5e7eb;border-radius:6px">Sambungkan output Generate ke sini</div>';
  }
  var html='<div style="display:flex;flex-direction:column;gap:6px">';
  imgs.forEach(function(img,i){
    html+='<div style="position:relative;border-radius:6px;overflow:hidden">'+
      '<div style="position:absolute;top:5px;left:5px;background:rgba(0,0,0,.55);color:#fff;font-size:9px;font-weight:800;padding:2px 6px;border-radius:3px;z-index:2">'+(i+1)+'</div>'+
      '<img src="'+img.dataUrl+'" style="width:100%;display:block;border-radius:6px;cursor:zoom-in" data-zoomurl="'+img.dataUrl+'">'+
      '<div style="position:absolute;top:4px;right:4px;display:flex;gap:2px">'+
      '<button data-dlurl="'+img.dataUrl+'" data-dlname="output-'+(i+1)+'.png" style="'+ib()+'">⬇</button>'+
      '<button data-rmimg="'+node.id+'" data-rmidx="'+i+'" style="'+ib()+'">✕</button>'+
      '</div></div>';
  });
  html+='</div>';
  if(imgs.length>1){
    html+='<button data-dlall="'+node.id+'" style="'+bs('#f9fafb','#374151','width:100%;margin-top:6px;font-size:10px;')+'">⬇ Download Semua ('+imgs.length+')</button>';
  }
  html+='<button data-clearout="'+node.id+'" style="'+bs('#fff5f5','#dc2626','width:100%;margin-top:4px;font-size:10px;')+'">🗑 Kosongkan</button>';
  return html;
}

function bodyTrigger(node){
  return '<button data-runall="1" style="'+bs('#fef2f2','#dc2626','width:100%;font-size:11px;font-weight:800;padding:8px;')+'">▶ Jalankan Semua</button>'+
    '<div style="font-size:9px;color:#9ca3af;text-align:center;margin-top:5px">Eksekusi semua node Generate</div>';
}

/* ── MAIN RENDER ── */
var ROOT=null;
function render(){
  if(!ROOT)return;
  var world=document.getElementById('fc-world');if(!world)return;
  world.innerHTML=S.nodes.map(renderNode).join('');
  requestAnimationFrame(function(){PP=collectPP();drawSVG();bindNodes();});
}

/* ── BIND EVENTS ── */
function bindNodes(){
  var world=document.getElementById('fc-world');if(!world)return;

  world.querySelectorAll('.fcn-hdr').forEach(function(h){
    h.addEventListener('mousedown',function(e){
      if(e.button!==0||e.target.getAttribute('data-del'))return;
      var nid=h.getAttribute('data-nid'),node=S.nodes.find(function(n){return n.id===nid;});if(!node)return;
      S.selected=nid;S.dragging={nodeId:nid,sx:e.clientX,sy:e.clientY,ox:node.x,oy:node.y};
      setSel(nid);e.stopPropagation();
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
      S.pendingConn={nodeId:nid,port:pid,side:side,wx:wx,wy:wy,type:ptype};
      S.tempLine={x1:wx,y1:wy,x2:wx,y2:wy};drawSVG();
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
    sel.addEventListener('change',function(){
      var node=S.nodes.find(function(n){return n.id===sel.getAttribute('data-gf');});
      if(node)node.data[sel.getAttribute('data-field')]=sel.value;
    });
  });

  world.querySelectorAll('select[data-folderpick]').forEach(function(sel){
    sel.addEventListener('mousedown',function(e){e.stopPropagation();});
    sel.addEventListener('change',function(){
      var nid=sel.getAttribute('data-folderpick'),node=S.nodes.find(function(n){return n.id===nid;});
      if(!node)return;
      var fl=srcGetFolder(sel.value);
      node.data.folderId=sel.value;node.data.folderName=fl?fl.name:'';
      render();
    });
  });

  world.querySelectorAll('[data-gen]').forEach(function(btn){
    btn.addEventListener('click',function(e){e.stopPropagation();var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-gen');});if(node)runGenerate(node);});
  });

  world.querySelectorAll('[data-upload]').forEach(function(btn){
    btn.addEventListener('click',function(e){e.stopPropagation();document.getElementById('fcf-'+btn.getAttribute('data-upload')).click();});
  });
  world.querySelectorAll('input[id^="fcf-"]').forEach(function(fi){
    fi.addEventListener('change',function(){handleFiles(fi.id.replace('fcf-',''),fi.files);});
  });

  world.querySelectorAll('[data-batch]').forEach(function(cb){
    cb.addEventListener('mousedown',function(e){e.stopPropagation();});
    cb.addEventListener('change',function(){var node=S.nodes.find(function(n){return n.id===cb.getAttribute('data-batch');});if(node)node.data.isBatch=cb.checked;});
  });

  world.querySelectorAll('[data-dz]').forEach(function(dz){
    dz.addEventListener('dragover',function(e){e.preventDefault();dz.style.borderColor='#c77818';});
    dz.addEventListener('dragleave',function(){dz.style.borderColor='#d1d5db';});
    dz.addEventListener('drop',function(e){e.preventDefault();dz.style.borderColor='#d1d5db';handleFiles(dz.getAttribute('data-dz'),e.dataTransfer.files);});
    dz.addEventListener('click',function(){document.getElementById('fcf-'+dz.getAttribute('data-dz')).click();});
  });

  world.querySelectorAll('[data-outdown]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-outdown');});
      if(!node)return;var url=node.data.result||node.data.imageDataUrl;if(!url)return;
      var a=document.createElement('a');a.href=url;a.download='ajw-'+Date.now()+'.png';a.click();
    });
  });

  /* per-image download in output node */
  world.querySelectorAll('[data-dlurl]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var a=document.createElement('a');a.href=btn.getAttribute('data-dlurl');a.download=btn.getAttribute('data-dlname')||'output.png';a.click();
    });
  });

  /* zoom url (output images) */
  world.querySelectorAll('[data-zoomurl]').forEach(function(img){
    img.addEventListener('click',function(e){e.stopPropagation();showLightbox(img.getAttribute('data-zoomurl'));});
  });

  /* remove single image from output */
  world.querySelectorAll('[data-rmimg]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();var nid=btn.getAttribute('data-rmimg'),idx=parseInt(btn.getAttribute('data-rmidx'));
      var node=S.nodes.find(function(n){return n.id===nid;});
      if(node&&node.data.images){node.data.images.splice(idx,1);render();}
    });
  });

  /* download all images from output */
  world.querySelectorAll('[data-dlall]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-dlall');});
      if(!node||!node.data.images)return;
      node.data.images.forEach(function(img,i){var a=document.createElement('a');a.href=img.dataUrl;a.download='output-'+(i+1)+'.png';a.click();});
    });
  });

  /* clear output */
  world.querySelectorAll('[data-clearout]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-clearout');});
      if(node){node.data.images=[];render();}
    });
  });

  world.querySelectorAll('[data-delresult]').forEach(function(btn){
    btn.addEventListener('click',function(e){e.stopPropagation();var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-delresult');});if(node){node.data.result=null;node.data.status='idle';}render();});
  });

  world.querySelectorAll('[data-zoom]').forEach(function(el){
    el.addEventListener('click',function(e){e.stopPropagation();var node=S.nodes.find(function(n){return n.id===el.getAttribute('data-zoom');});if(!node)return;var url=node.data.result||node.data.imageDataUrl;if(url)showLightbox(url);});
  });

  world.querySelectorAll('[data-runall]').forEach(function(btn){
    btn.addEventListener('click',function(e){e.stopPropagation();runAll();});
  });

  world.querySelectorAll('.fcn').forEach(function(el){
    el.addEventListener('mousedown',function(){var nid=el.getAttribute('data-nid');if(S.selected!==nid){S.selected=nid;setSel(nid);}});
  });
}

function setSel(nid){
  var world=document.getElementById('fc-world');if(!world)return;
  world.querySelectorAll('.fcn').forEach(function(n){
    var id=n.getAttribute('data-nid'),nd=S.nodes.find(function(x){return x.id===id;});
    var acc=nd&&ND[nd.type]?ND[nd.type].color:'#e5e7eb';
    n.style.borderColor=id===nid?acc:'#e5e7eb';
    n.style.zIndex=id===nid?'10':'2';
  });
}

function completeConnection(from,toId,toPort,toSide,toType){
  var fromInfo,toInfo,fromType,toType2;
  if(from.side==='out'&&toSide==='in'){fromInfo={id:from.nodeId,port:from.port};toInfo={id:toId,port:toPort};fromType=from.type;toType2=toType;}
  else if(from.side==='in'&&toSide==='out'){fromInfo={id:toId,port:toPort};toInfo={id:from.nodeId,port:from.port};fromType=toType;toType2=from.type;}
  else{S.pendingConn=null;S.tempLine=null;drawSVG();return;}
  if(!compat(fromType,toType2)){toast('Port tidak kompatibel','error');S.pendingConn=null;S.tempLine=null;drawSVG();return;}
  S.edges=S.edges.filter(function(e){return!(e.toId===toInfo.id&&e.toPort===toInfo.port);});
  S.edges.push({fromId:fromInfo.id,fromPort:fromInfo.port,toId:toInfo.id,toPort:toInfo.port});
  S.pendingConn=null;S.tempLine=null;render();
}

/* ── LIGHTBOX ── */
function showLightbox(url){
  var lb=document.createElement('div');
  lb.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  lb.innerHTML='<div style="position:relative;max-width:90vw;max-height:90vh">'+
    '<img src="'+url+'" style="max-width:90vw;max-height:90vh;border-radius:8px;display:block">'+
    '<button style="position:absolute;top:-14px;right:-14px;width:30px;height:30px;border-radius:50%;background:#fff;border:none;font-size:16px;cursor:pointer;font-weight:800">×</button>'+
    '<a href="'+url+'" download="ajw-'+Date.now()+'.png" style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#22c55e;color:#fff;text-decoration:none;font-size:11px;font-weight:700;padding:5px 16px;border-radius:99px;white-space:nowrap">⬇ Download</a>'+
    '</div>';
  lb.addEventListener('click',function(e){if(e.target===lb||e.target.tagName==='BUTTON')lb.remove();});
  document.body.appendChild(lb);
}

/* ── FILE HANDLING ── */
function handleFiles(nodeId,files){
  if(!files||!files.length)return;
  var node=S.nodes.find(function(n){return n.id===nodeId;});if(!node)return;
  var arr=Array.prototype.slice.call(files),pend=arr.length;
  arr.forEach(function(f){
    var r=new FileReader();
    r.onload=function(ev){node.data.images.push({name:f.name,dataUrl:ev.target.result});if(--pend===0)render();};
    r.readAsDataURL(f);
  });
}

/* ── GENERATE API ── */
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
      var fd=new FormData();
      fd.append('model',node.data.model||'gpt-image-2');
      fd.append('prompt',promptText||'enhance this image');
      fd.append('n','1');
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
    node.data.result='data:image/png;base64,'+b64;
    node.data.status='done';
    /* propagate to connected output nodes — push to images array */
    S.edges.forEach(function(e){
      if(e.fromId===node.id&&e.fromPort==='image'){
        var tgt=S.nodes.find(function(n){return n.id===e.toId;});
        if(tgt&&tgt.type==='output'){
          if(!tgt.data.images)tgt.data.images=[];
          var existing=tgt.data.images.findIndex(function(img){return img.srcNodeId===node.id;});
          if(existing>=0)tgt.data.images[existing].dataUrl=node.data.result;
          else tgt.data.images.push({dataUrl:node.data.result,srcNodeId:node.id,name:'gen-'+Date.now()+'.png'});
        }
      }
    });
    toast('Generate selesai!','ok');
  }catch(err){node.data.status='error';toast('Error: '+err.message,'error');console.error('[FC]',err);}
  render();
}

/* ── RUN ALL (topological, with folder batch support) ── */
async function runAll(){
  var genNodes=S.nodes.filter(function(n){return n.type==='generate';});
  if(!genNodes.length){toast('Tidak ada node Generate','error');return;}
  var visited={},ordered=[];
  function visit(node){
    if(visited[node.id])return;visited[node.id]=true;
    S.edges.forEach(function(e){if(e.toId===node.id&&e.toPort==='image'){var dep=S.nodes.find(function(n){return n.id===e.fromId;});if(dep&&dep.type==='generate')visit(dep);}});
    ordered.push(node);
  }
  genNodes.forEach(visit);
  toast('Menjalankan '+ordered.length+' node...','ok');
  for(var i=0;i<ordered.length;i++){
    var gn=ordered[i];
    /* check if folder-source is connected — batch per image */
    var fsEdge=S.edges.find(function(e){return e.toId===gn.id&&e.toPort==='image';});
    var fsNode=fsEdge?S.nodes.find(function(n){return n.id===fsEdge.fromId&&n.type==='folder-source';}):null;
    if(fsNode&&fsNode.data.folderId){
      var fl=srcGetFolder(fsNode.data.folderId);
      var imgs=fl?fl.images:[];
      for(var j=0;j<imgs.length;j++){
        fsNode.data.currentIdx=j;
        await runGenerate(gn);
        if(j<imgs.length-1)await new Promise(function(r){setTimeout(r,500);});
      }
      fsNode.data.currentIdx=0;
    }else{
      await runGenerate(gn);
    }
    if(i<ordered.length-1)await new Promise(function(r){setTimeout(r,400);});
  }
  toast('✓ Semua selesai!','ok');
}

/* ── ADD NODE ── */
function addNode(type){
  var def=ND[type];if(!def)return;
  var canvas=document.getElementById('fc-canvas');
  var W=canvas?canvas.clientWidth:800,H=canvas?canvas.clientHeight:600;
  S.nodes.push({id:uid(),type:type,x:(W/2-S.view.x)/S.view.scale+(Math.random()*80-40),y:(H/2-S.view.y)/S.view.scale+(Math.random()*80-40),data:def.def()});
  render();
}

function doSave(){var n=prompt('Nama flow:','Flow '+(lsGet().length+1));if(n&&n.trim())saveFlow(n.trim());}
function doClear(){if(!confirm('Kosongkan canvas?'))return;S.nodes=[];S.edges=[];S.selected=null;S.pendingConn=null;S.tempLine=null;S.hoverEdge=null;render();}

/* ── PAN / ZOOM ── */
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
    if(S.dragging){
      var d=S.dragging,node=S.nodes.find(function(n){return n.id===d.nodeId;});
      if(node){node.x=d.ox+(e.clientX-d.sx)/S.view.scale;node.y=d.oy+(e.clientY-d.sy)/S.view.scale;
        var el=document.getElementById('fcn-'+d.nodeId);if(el){el.style.left=node.x+'px';el.style.top=node.y+'px';}
        requestAnimationFrame(function(){PP=collectPP();drawSVG();});}return;}
    if(S.pendingConn&&S.tempLine){
      var cr0=canvas.getBoundingClientRect();
      S.tempLine.x2=(e.clientX-cr0.left-S.view.x)/S.view.scale;S.tempLine.y2=(e.clientY-cr0.top-S.view.y)/S.view.scale;drawSVG();return;}
    /* edge proximity */
    if(S.edges.length>0){
      var cr=canvas.getBoundingClientRect();
      if(e.clientX>=cr.left&&e.clientX<=cr.right&&e.clientY>=cr.top&&e.clientY<=cr.bottom){
        var wx=(e.clientX-cr.left-S.view.x)/S.view.scale,wy=(e.clientY-cr.top-S.view.y)/S.view.scale;
        var thr=10/S.view.scale,prev=S.hoverEdge;S.hoverEdge=null;
        for(var i=0;i<S.edges.length;i++){var ee=S.edges[i];var fp=PP[ee.fromId+'|out|'+ee.fromPort],tp=PP[ee.toId+'|in|'+ee.toPort];if(fp&&tp&&edgeDist(fp,tp,wx,wy)<thr){S.hoverEdge=i;break;}}
        if(S.hoverEdge!==prev)drawSVG();
      }else if(S.hoverEdge!==null){S.hoverEdge=null;drawSVG();}
    }
  });
  document.addEventListener('mouseup',function(e){
    if(S.pendingConn){
      var el=document.elementFromPoint(e.clientX,e.clientY);
      while(el&&!el.hasAttribute('data-port'))el=el.parentElement;
      if(el&&el.hasAttribute('data-port')&&el.getAttribute('data-nodeid')!==S.pendingConn.nodeId){
        completeConnection(S.pendingConn,el.getAttribute('data-nodeid'),el.getAttribute('data-port'),el.getAttribute('data-side'),el.getAttribute('data-ptype'));
      }else{S.pendingConn=null;S.tempLine=null;drawSVG();}
    }
    panStart=null;S.dragging=null;
  });
  canvas.addEventListener('wheel',function(e){
    e.preventDefault();var cr=canvas.getBoundingClientRect(),mx=e.clientX-cr.left,my=e.clientY-cr.top;
    var delta=e.deltaY<0?1.08:0.93,ns=Math.min(2.5,Math.max(0.15,S.view.scale*delta)),r=ns/S.view.scale;
    S.view.x=mx-(mx-S.view.x)*r;S.view.y=my-(my-S.view.y)*r;S.view.scale=ns;applyView();
  },{passive:false});
  canvas.addEventListener('contextmenu',function(e){if(S.pendingConn){e.preventDefault();S.pendingConn=null;S.tempLine=null;drawSVG();}});
}
function applyView(){
  var w=document.getElementById('fc-world'),s=document.getElementById('fc-svg');
  var t='translate('+S.view.x+'px,'+S.view.y+'px) scale('+S.view.scale+')';
  if(w)w.style.transform=t;if(s)s.style.transform=t;
}

/* ── FLOW CANVAS MOUNT ── */
window.AJWFlowCanvasMount=function(root){
  if(!root)return;
  ROOT=root;
  S.nodes=[];S.edges=[];S.view={x:80,y:40,scale:0.9};
  S.dragging=null;S.pendingConn=null;S.selected=null;S.tempLine=null;S.hoverEdge=null;
  var oldBtn=document.getElementById('fc-ebtn');if(oldBtn)oldBtn.remove();

  if(!document.getElementById('fc-css4')){
    var st=document.createElement('style');st.id='fc-css4';
    st.textContent=[
      '#fc-world{pointer-events:none;}',
      '.fcn{pointer-events:auto;transition:box-shadow .15s,border-color .15s;}',
      '.fcn:hover{box-shadow:0 3px 16px rgba(0,0,0,.11)!important;}',
      '.fc-port{transition:transform .1s;}',
      '.fc-port:hover{transform:scale(1.7)!important;}',
      '#fc-canvas{background-image:radial-gradient(circle,#c5ccd6 1px,transparent 1px);background-size:20px 20px;background-color:#eef1f6;}',
    ].join('');
    document.head.appendChild(st);
  }

  var topOff=root.getBoundingClientRect?root.getBoundingClientRect().top:160;
  var availH=Math.max(window.innerHeight-topOff-4,520);
  root.style.cssText='display:flex;flex-direction:column;height:'+availH+'px;min-height:520px;';
  root.innerHTML=
    '<div id="fc-toolbar" style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;padding:7px 16px;'+
    'background:#fff;border-bottom:1px solid #e5e7eb;flex-shrink:0">'+
    '<button id="fc-ai" style="'+bs('#f0fdf4','#16a34a')+'">＋ Gambar Input</button>'+
    '<button id="fc-afs" style="'+bs('#ecfeff','#0891b2')+'">＋ Folder Source</button>'+
    '<button id="fc-ap" style="'+bs('#eef2ff','#4f46e5')+'">＋ Prompt</button>'+
    '<button id="fc-ag" style="'+bs('#fff7ed','#c2410c','border-color:#fed7aa;')+'">＋ Generate</button>'+
    '<button id="fc-ao" style="'+bs('#faf5ff','#6d28d9')+'">＋ Output</button>'+
    '<button id="fc-at" style="'+bs('#fef2f2','#b91c1c')+'">▶ Trigger</button>'+
    '<span style="width:1px;height:20px;background:#e5e7eb;margin:0 2px"></span>'+
    '<button id="fc-save" style="'+bs('#f9fafb','#374151')+'">💾 Simpan</button>'+
    '<select id="fc-load-dd" style="background:#f9fafb;color:#374151;border:1px solid #e5e7eb;border-radius:5px;padding:4px 8px;font-size:10px;min-width:120px;cursor:pointer"><option value="">— Muat Template —</option></select>'+
    '<button id="fc-clear" style="'+bs('#fff5f5','#dc2626')+'">🗑 Kosongkan</button>'+
    '<span style="color:#9ca3af;font-size:9px;margin-left:auto">Scroll=zoom · Header=pindah · Drag port=sambung · Hover garis=putus</span>'+
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
  document.getElementById('fc-save').onclick=doSave;
  document.getElementById('fc-clear').onclick=doClear;
  document.getElementById('fc-load-dd').addEventListener('change',function(){if(this.value){loadFlow(this.value);this.value='';}});

  refreshDD();initCanvas(document.getElementById('fc-canvas'));render();
};

/* ── SOURCE LIBRARY MOUNT ── */
window.AJWSourceMount=function(root){
  if(!root)return;
  var topOff=root.getBoundingClientRect?root.getBoundingClientRect().top:160;
  var availH=Math.max(window.innerHeight-topOff-4,520);
  root.style.cssText='height:'+availH+'px;min-height:520px;overflow:hidden;display:flex;flex-direction:column;';
  renderSourceUI(root);
};

function renderSourceUI(root){
  var lib=srcGet();
  var folderHTML=lib.folders.length?lib.folders.map(function(f,fi){
    var thumbs=f.images.slice(0,8).map(function(img,ii){
      return '<div style="position:relative;display:inline-block">'+
        '<img src="'+img.dataUrl+'" title="'+esc(img.name)+'" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;cursor:pointer" data-srcview="'+esc(img.dataUrl)+'">'+
        '<button data-delfimg="'+esc(f.id)+'" data-imgidx="'+ii+'" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.55);color:#fff;border:none;border-radius:3px;font-size:10px;cursor:pointer;width:18px;height:18px;display:flex;align-items:center;justify-content:center;line-height:1">×</button>'+
        '</div>';
    }).join('');
    var more=f.images.length>8?'<div style="width:80px;height:80px;border-radius:6px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:11px;color:#9ca3af;border:1px solid #e5e7eb">+'+(f.images.length-8)+'</div>':'';
    return '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:14px;margin-bottom:12px">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
      '<span style="font-size:13px;font-weight:800;color:#111827;flex:1">📁 '+esc(f.name)+'</span>'+
      '<span style="font-size:11px;color:#9ca3af">'+f.images.length+' gambar</span>'+
      '<button data-uploadfolder="'+esc(f.id)+'" style="background:#f0f9ff;color:#0284c7;border:1px solid #bae6fd;border-radius:5px;padding:4px 10px;font-size:10px;cursor:pointer;font-weight:700">+ Upload</button>'+
      '<button data-delfolder="'+esc(f.id)+'" style="background:#fff5f5;color:#dc2626;border:1px solid #fecaca;border-radius:5px;padding:4px 8px;font-size:10px;cursor:pointer">🗑</button>'+
      '</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px">'+
      (f.images.length?thumbs+more:'<div style="color:#9ca3af;font-size:11px;padding:12px 0">Belum ada gambar. Klik Upload.</div>')+
      '</div>'+
      '</div>';
  }).join(''):'<div style="text-align:center;color:#9ca3af;font-size:12px;padding:40px 0;border:2px dashed #e5e7eb;border-radius:10px">Belum ada folder. Buat folder baru untuk mulai mengelola media.</div>';

  root.innerHTML=
    '<div style="padding:14px 20px;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:10px;flex-shrink:0">'+
    '<span style="font-size:14px;font-weight:900;color:#111827">📁 Source Library</span>'+
    '<span style="font-size:11px;color:#9ca3af">'+lib.folders.length+' folder · '+lib.folders.reduce(function(s,f){return s+f.images.length;},0)+' gambar</span>'+
    '<button id="src-newfolder" style="margin-left:auto;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:6px;padding:6px 14px;font-size:11px;font-weight:700;cursor:pointer">＋ Folder Baru</button>'+
    '</div>'+
    '<div style="flex:1;overflow-y:auto;padding:16px 20px">'+folderHTML+'</div>';

  /* new folder */
  root.querySelector('#src-newfolder').addEventListener('click',function(){
    var freshLib=srcGet();
    var name=prompt('Nama folder:','Folder '+(freshLib.folders.length+1));
    if(!name||!name.trim())return;
    freshLib.folders.push({id:uid(),name:name.trim(),images:[]});
    srcSet(freshLib);renderSourceUI(root);
  });

  /* upload images to folder — use dynamic file input (most reliable) */
  root.querySelectorAll('[data-uploadfolder]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var fid=btn.getAttribute('data-uploadfolder');
      var fi=document.createElement('input');
      fi.type='file'; fi.accept='image/*'; fi.multiple=true;
      fi.style.cssText='position:fixed;top:-9999px;left:-9999px;opacity:0;width:1px;height:1px;';
      document.body.appendChild(fi);
      fi.addEventListener('change',function(){
        var arr=Array.prototype.slice.call(fi.files);
        if(!arr.length){fi.remove();return;}
        /* re-read lib fresh to avoid stale data */
        var freshLib=srcGet();
        var fl2=freshLib.folders.find(function(f){return f.id===fid;});
        if(!fl2){fi.remove();return;}
        var pend=arr.length;
        arr.forEach(function(file){
          var r=new FileReader();
          r.onload=function(ev){
            fl2.images.push({id:uid(),name:file.name,dataUrl:ev.target.result});
            if(--pend===0){srcSet(freshLib);fi.remove();renderSourceUI(root);}
          };
          r.readAsDataURL(file);
        });
      });
      fi.click();
    });
  });

  /* delete folder */
  root.querySelectorAll('[data-delfolder]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var fid=btn.getAttribute('data-delfolder');
      if(!confirm('Hapus folder ini?'))return;
      var freshLib=srcGet();
      freshLib.folders=freshLib.folders.filter(function(f){return f.id!==fid;});
      srcSet(freshLib);renderSourceUI(root);
    });
  });

  /* delete image from folder */
  root.querySelectorAll('[data-delfimg]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var fid=btn.getAttribute('data-delfimg'),idx=parseInt(btn.getAttribute('data-imgidx'));
      var freshLib=srcGet();
      var fl2=freshLib.folders.find(function(f){return f.id===fid;});if(!fl2)return;
      fl2.images.splice(idx,1);srcSet(freshLib);renderSourceUI(root);
    });
  });

  /* view image */
  root.querySelectorAll('[data-srcview]').forEach(function(img){
    img.addEventListener('click',function(){showLightbox(img.getAttribute('data-srcview'));});
  });
}

})();
