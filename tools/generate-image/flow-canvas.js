/* AJW Flow Canvas v3 — fixed: node drag, port connect, image chaining */
(function(){
'use strict';

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

/* ── state ── */
var S={nodes:[],edges:[],view:{x:80,y:60,scale:1},dragging:null,pendingConn:null,tempLine:null,selected:null,hoverEdge:null};

/* ── port colours ── */
var PC={'image':'#22c55e','text':'#3b82f6','prompt':'#a78bfa','trigger':'#f59e0b'};
function pc(t){return PC[t]||'#a78bfa';}
function compat(a,b){
  if(a===b) return true;
  if((a==='image')&&(b==='image')) return true;
  if((a==='text'||a==='prompt')&&(b==='text'||b==='prompt')) return true;
  return false;
}

/* ── node definitions ── */
var ND={
  'image-source':{label:'Gambar Input',color:'#16a34a',
    inputs:[],outputs:[{id:'images',type:'image',label:'Gambar'}],
    def:function(){return{images:[],isBatch:false};}},
  'prompt':{label:'Prompt',color:'#2563eb',
    inputs:[],outputs:[{id:'text',type:'text',label:'Teks'}],
    def:function(){return{text:''};}},
  'generate':{label:'GPT Image Generate',color:'#c77818',
    inputs:[{id:'image',type:'image',label:'Gambar (opt)'},{id:'prompt',type:'prompt',label:'Prompt (opt)'}],
    outputs:[{id:'image',type:'image',label:'Hasil'}],
    def:function(){return{model:'gpt-image-2',size:'1024x1024',quality:'medium',status:'idle',result:null,prompt:''};}},
  'output':{label:'Output / Preview',color:'#7c3aed',
    inputs:[{id:'image',type:'image',label:'Gambar'}],outputs:[],
    def:function(){return{imageDataUrl:''};}},
  'trigger':{label:'▶ Run Flow',color:'#dc2626',
    inputs:[],outputs:[{id:'trigger',type:'trigger',label:'Mulai'}],
    def:function(){return{};}},
};

/* ── get connected value ── */
function getConnected(node,portId){
  var results=[];
  S.edges.forEach(function(e){
    if(e.toId!==node.id||e.toPort!==portId) return;
    var src=S.nodes.find(function(n){return n.id===e.fromId;});
    if(!src) return;
    if(portId==='image'||portId==='images'){
      if(src.type==='image-source') results=results.concat(src.data.images||[]);
      if(src.type==='generate'&&src.data.result) results.push({name:'gen.png',dataUrl:src.data.result});
    }
    if(portId==='prompt'||portId==='text'){
      if(src.type==='prompt') results.push(src.data.text||'');
      if(src.type==='generate'&&src.data.result) results.push(''); /* generate doesn't output text */
    }
  });
  if(!results.length) return null;
  return typeof results[0]==='string'?results.join('\n'):results;
}

/* ── localStorage ── */
var LSK='ajw_gi_flows_v2';
function lsGet(){try{return JSON.parse(localStorage.getItem(LSK)||'[]');}catch(e){return[];}}
function lsSet(v){try{localStorage.setItem(LSK,JSON.stringify(v));}catch(e){}}
function saveFlow(name){
  var flows=lsGet();
  var ex=flows.find(function(f){return f.name===name;});
  var flow={id:ex?ex.id:uid(),name:name,
    nodes:S.nodes.map(function(n){return{id:n.id,type:n.type,x:n.x,y:n.y,data:JSON.parse(JSON.stringify(n.data))};}),
    edges:S.edges.map(function(e){return Object.assign({},e);}),
    updatedAt:Date.now()};
  if(ex){Object.assign(ex,flow);}else{flows.push(flow);}
  lsSet(flows); toast('Flow "'+name+'" disimpan','ok'); refreshDD();
}
function loadFlow(id){
  var f=lsGet().find(function(f){return f.id===id;});
  if(!f) return;
  S.nodes=f.nodes.map(function(n){var d=ND[n.type];return{id:n.id,type:n.type,x:n.x,y:n.y,data:Object.assign(d?d.def():{},n.data)};});
  S.edges=f.edges.map(function(e){return Object.assign({},e);});
  S.selected=null;S.pendingConn=null;S.tempLine=null;S.hoverEdge=null;
  render(); toast('Flow "'+f.name+'" dimuat','ok');
}
function refreshDD(){
  var dd=document.getElementById('fc-load-dd'); if(!dd) return;
  var flows=lsGet();
  dd.innerHTML='<option value="">— Muat Template —</option>'+
    flows.map(function(f){return'<option value="'+esc(f.id)+'">'+esc(f.name)+'</option>';}).join('');
}

/* ── port positions (world coordinates) ── */
var PP={};
function collectPP(){
  var pp={};
  var canvas=document.getElementById('fc-canvas'); if(!canvas) return pp;
  var cr=canvas.getBoundingClientRect();
  S.nodes.forEach(function(node){
    var def=ND[node.type]||{inputs:[],outputs:[]};
    def.inputs.forEach(function(p){
      var el=document.getElementById('prt-'+node.id+'-in-'+p.id); if(!el) return;
      var r=el.getBoundingClientRect();
      pp[node.id+'|in|'+p.id]={x:(r.left+r.width/2-cr.left-S.view.x)/S.view.scale,
        y:(r.top+r.height/2-cr.top-S.view.y)/S.view.scale,type:p.type,side:'in',nodeId:node.id,port:p.id};
    });
    def.outputs.forEach(function(p){
      var el=document.getElementById('prt-'+node.id+'-out-'+p.id); if(!el) return;
      var r=el.getBoundingClientRect();
      pp[node.id+'|out|'+p.id]={x:(r.left+r.width/2-cr.left-S.view.x)/S.view.scale,
        y:(r.top+r.height/2-cr.top-S.view.y)/S.view.scale,type:p.type,side:'out',nodeId:node.id,port:p.id};
    });
  });
  return pp;
}

/* ── bezier helpers ── */
function bez(x1,y1,x2,y2){
  var cx=(x1+x2)/2;
  return 'M'+x1+','+y1+' C'+cx+','+y1+' '+cx+','+y2+' '+x2+','+y2;
}
function bezPt(x1,y1,x2,y2,t){
  var cx=(x1+x2)/2,mt=1-t;
  return{x:mt*mt*mt*x1+3*mt*mt*t*cx+3*mt*t*t*cx+t*t*t*x2,
         y:mt*mt*mt*y1+3*mt*mt*t*y1+3*mt*t*t*y2+t*t*t*y2};
}
function edgeDist(fp,tp,wx,wy){
  var minD=1e9;
  for(var i=0;i<=16;i++){var pt=bezPt(fp.x,fp.y,tp.x,tp.y,i/16);var dx=pt.x-wx,dy=pt.y-wy;var d=dx*dx+dy*dy;if(d<minD)minD=d;}
  return Math.sqrt(minD);
}

/* ── SVG draw ── */
function drawSVG(){
  var svg=document.getElementById('fc-svg'); if(!svg) return;
  var paths=[];
  S.edges.forEach(function(e,i){
    var fk=e.fromId+'|out|'+e.fromPort,tk=e.toId+'|in|'+e.toPort;
    var fp=PP[fk],tp=PP[tk]; if(!fp||!tp) return;
    var col=pc(fp.type),isHov=S.hoverEdge===i;
    paths.push(
      '<path d="'+bez(fp.x,fp.y,tp.x,tp.y)+'" stroke="'+col+'" stroke-width="'+(isHov?3.5:2)+
      '" fill="none" opacity="'+(isHov?1:0.75)+'"/>'+
      '<circle cx="'+tp.x+'" cy="'+tp.y+'" r="4" fill="'+col+'" opacity="'+(isHov?1:0.7)+'"/>'
    );
  });
  if(S.tempLine){
    var t=S.tempLine,col2=S.pendingConn?pc(S.pendingConn.type):'#c77818';
    paths.push('<line x1="'+t.x1+'" y1="'+t.y1+'" x2="'+t.x2+'" y2="'+t.y2+
      '" stroke="'+col2+'" stroke-width="2" stroke-dasharray="6 3" opacity="0.85"/>');
  }
  svg.innerHTML=paths.join('');
  updateEdgeHoverBtn();
}

/* ── HTML edge-disconnect button (avoids SVG pointer-event issues) ── */
function updateEdgeHoverBtn(){
  var btn=document.getElementById('fc-ebtn');
  if(S.hoverEdge===null||S.hoverEdge===undefined){if(btn)btn.style.display='none';return;}
  var e=S.edges[S.hoverEdge]; if(!e){if(btn)btn.style.display='none';return;}
  var fp=PP[e.fromId+'|out|'+e.fromPort],tp=PP[e.toId+'|in|'+e.toPort];
  if(!fp||!tp){if(btn)btn.style.display='none';return;}
  var canvas=document.getElementById('fc-canvas'); if(!canvas){if(btn)btn.style.display='none';return;}
  var cr=canvas.getBoundingClientRect();
  var mx=(fp.x+tp.x)/2*S.view.scale+S.view.x+cr.left;
  var my=(fp.y+tp.y)/2*S.view.scale+S.view.y+cr.top;
  if(!btn){
    btn=document.createElement('div');btn.id='fc-ebtn';btn.textContent='×';
    btn.style.cssText='position:fixed;width:22px;height:22px;border-radius:50%;background:#ef4444;color:#fff;'+
      'border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:14px;'+
      'font-weight:900;cursor:pointer;z-index:9999;transform:translate(-50%,-50%);box-shadow:0 2px 10px rgba(0,0,0,.3)';
    btn.addEventListener('click',function(ev){
      ev.stopPropagation();
      if(S.hoverEdge!==null){S.edges.splice(S.hoverEdge,1);S.hoverEdge=null;render();}
    });
    document.body.appendChild(btn);
  }
  btn.style.left=mx+'px';btn.style.top=my+'px';btn.style.display='flex';
}

/* ── render node HTML ── */
function renderNode(node){
  var def=ND[node.type]||{label:node.type,color:'#666',inputs:[],outputs:[],def:function(){return{};}};
  var isSel=S.selected===node.id;
  var W={generate:290,'image-source':240,trigger:180,output:260,prompt:230}[node.type]||250;

  function portDots(ports,side){
    return ports.map(function(p,i){
      var isIn=side==='in';
      return '<div'+
        ' id="prt-'+node.id+'-'+side+'-'+p.id+'"'+
        ' class="fc-port"'+
        ' data-nodeid="'+node.id+'"'+
        ' data-port="'+p.id+'"'+
        ' data-side="'+side+'"'+
        ' data-ptype="'+p.type+'"'+
        ' title="'+esc(p.label)+' ('+p.type+')"'+
        ' style="position:absolute;'+(isIn?'left:-8px':'right:-8px')+';top:'+(22+i*28)+'px;'+
        'width:16px;height:16px;border-radius:50%;background:'+pc(p.type)+';border:2.5px solid #fff;'+
        'cursor:crosshair;z-index:30;box-shadow:0 0 0 3px '+pc(p.type)+'44;transition:transform .12s;">'+
        '</div>';
    }).join('');
  }

  var minBody=Math.max(def.inputs.length,def.outputs.length)*28+14;
  var statusDot='';
  if(node.type==='generate'){
    var sc={idle:'#94a3b8',running:'#3b82f6',done:'#22c55e',error:'#ef4444'}[node.data.status||'idle'];
    statusDot='<span style="width:8px;height:8px;border-radius:50%;background:'+sc+';display:inline-block;flex-shrink:0;margin-right:2px"></span>';
  }

  return '<div id="fcn-'+node.id+'" class="fcn" data-nid="'+node.id+'"'+
    ' style="position:absolute;left:'+node.x+'px;top:'+node.y+'px;width:'+W+'px;'+
    'background:#fff;border-radius:12px;border:2px solid '+(isSel?def.color:'#e2e8f0')+';'+
    'box-shadow:0 2px 12px rgba(0,0,0,.09);z-index:'+(isSel?10:2)+'">'+
    '<div class="fcn-hdr" data-nid="'+node.id+'"'+
    ' style="display:flex;align-items:center;gap:6px;padding:9px 10px;border-radius:10px 10px 0 0;'+
    'background:'+def.color+';cursor:move;user-select:none">'+
    statusDot+
    '<span style="font-size:11px;font-weight:800;color:#fff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(def.label)+'</span>'+
    '<button data-del="'+node.id+'" style="background:rgba(255,255,255,.22);border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:14px;padding:0 5px;line-height:20px;font-weight:700">×</button>'+
    '</div>'+
    '<div style="position:relative;min-height:'+minBody+'px">'+
    portDots(def.inputs,'in')+portDots(def.outputs,'out')+
    '<div style="padding:10px 14px 12px;color:#334155;font-size:12px">'+renderBody(node)+'</div>'+
    '</div></div>';
}

function renderBody(node){
  switch(node.type){
    case 'image-source': return bodyImgSrc(node);
    case 'prompt': return bodyPrompt(node);
    case 'generate': return bodyGenerate(node);
    case 'output': return bodyOutput(node);
    case 'trigger': return bodyTrigger(node);
    default: return '';
  }
}

function bstyle(bg,col){return 'background:'+bg+';color:'+col+';border:1px solid '+col+'33;border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer;';}
function ibtn(){return 'background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:4px;width:24px;height:24px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;';}

function bodyImgSrc(node){
  var imgs=node.data.images||[];
  var thumbs=imgs.slice(0,6).map(function(img){
    return '<img src="'+img.dataUrl+'" title="'+esc(img.name)+'" style="width:44px;height:44px;object-fit:cover;border-radius:5px;border:1px solid #e2e8f0">';
  }).join('');
  var more=imgs.length>6?'<span style="font-size:10px;color:#94a3b8;align-self:center">+'+(imgs.length-6)+'</span>':'';
  return '<div id="dz-'+node.id+'" data-dz="'+node.id+'"'+
    ' style="border:2px dashed #cbd5e1;border-radius:8px;padding:8px;text-align:center;cursor:pointer;'+
    'min-height:66px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px;'+
    'margin-bottom:8px;background:#f8fafc">'+
    (imgs.length?thumbs+more:'<div style="color:#94a3b8;font-size:11px">Drag gambar / klik Upload</div>')+
    '</div>'+
    '<div style="display:flex;gap:6px;align-items:center">'+
    '<button data-upload="'+node.id+'" style="'+bstyle('#f0f9ff','#0284c7')+'">Upload</button>'+
    '<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#64748b;cursor:pointer">'+
    '<input type="checkbox" '+(node.data.isBatch?'checked':'')+' data-batch="'+node.id+'"> Batch</label>'+
    '<span style="color:#94a3b8;font-size:10px;margin-left:auto">'+imgs.length+' file</span>'+
    '</div>'+
    '<input type="file" id="fcf-'+node.id+'" accept="image/*" multiple style="display:none">';
}

function bodyPrompt(node){
  return '<textarea id="fct-'+node.id+'" data-taid="'+node.id+'" placeholder="Tulis prompt di sini..."'+
    ' style="width:100%;box-sizing:border-box;min-height:90px;background:#f8fafc;border:1px solid #e2e8f0;'+
    'border-radius:6px;color:#0f172a;font-size:12px;padding:8px;resize:vertical;font-family:inherit;line-height:1.5">'+
    esc(node.data.text||'')+'</textarea>';
}

function bodyGenerate(node){
  var sc={idle:'#94a3b8',running:'#3b82f6',done:'#22c55e',error:'#ef4444'}[node.data.status||'idle'];
  var st={idle:'Siap',running:'Memproses...',done:'Selesai',error:'Gagal'}[node.data.status||'idle'];
  var promptConn=S.edges.some(function(e){return e.toId===node.id&&e.toPort==='prompt';});
  var imgConn=S.edges.some(function(e){return e.toId===node.id&&e.toPort==='image';});
  return (node.data.result?
    '<div style="position:relative;border-radius:7px;overflow:hidden;margin-bottom:8px;cursor:zoom-in" data-zoom="'+node.id+'">'+
    '<img src="'+node.data.result+'" style="width:100%;display:block;border-radius:7px">'+
    '<div style="position:absolute;top:5px;right:5px;display:flex;gap:3px">'+
    '<button data-outdown="'+node.id+'" title="Download" style="'+ibtn()+'">⬇</button>'+
    '<button data-delresult="'+node.id+'" title="Hapus" style="'+ibtn()+'">✕</button>'+
    '</div></div>':'')+
    (imgConn?'<div style="font-size:10px;color:#166534;padding:4px 8px;background:#f0fdf4;border-radius:5px;border:1px solid #bbf7d0;margin-bottom:6px">✓ Gambar dari node terhubung</div>':'')+
    (!promptConn?
    '<div style="margin-bottom:7px">'+
    '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Prompt</div>'+
    '<textarea id="fct-'+node.id+'" data-taid="'+node.id+'" data-isprompt="1" placeholder="Tulis prompt generate..."'+
    ' style="width:100%;box-sizing:border-box;min-height:66px;background:#f8fafc;border:1px solid #e2e8f0;'+
    'border-radius:6px;color:#0f172a;font-size:11px;padding:7px;resize:vertical;font-family:inherit;line-height:1.5">'+
    esc(node.data.prompt||'')+'</textarea></div>':
    '<div style="font-size:10px;color:#1e40af;padding:4px 8px;background:#eff6ff;border-radius:5px;border:1px solid #bfdbfe;margin-bottom:6px">✓ Prompt dari node terhubung</div>')+
    '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">'+
    selField(node,'model',['gpt-image-2','gpt-image-1'],'Model')+
    selField(node,'size',['1024x1024','1792x1024','1024x1792'],'Ukuran')+
    selField(node,'quality',['auto','medium','high','low'],'Quality')+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:8px">'+
    '<button data-gen="'+node.id+'" style="'+bstyle('#c77818','#fff')+'flex:1;font-weight:800;font-size:12px;padding:7px 10px;"'+(node.data.status==='running'?' disabled':'')+'>'+
    (node.data.status==='running'?'⏳ Generating...':'⚡ Generate')+'</button>'+
    '<span style="font-size:10px;color:'+sc+'">'+esc(st)+'</span>'+
    '</div>';
}

function bodyOutput(node){
  if(node.data.imageDataUrl){
    return '<div style="position:relative;margin-bottom:8px">'+
      '<img src="'+node.data.imageDataUrl+'" style="width:100%;border-radius:8px;display:block;cursor:zoom-in" data-zoom="'+node.id+'"></div>'+
      '<div style="display:flex;gap:6px">'+
      '<button data-outdown="'+node.id+'" style="'+bstyle('#f0fdf4','#16a34a')+'flex:1">⬇ Download</button>'+
      '<button data-zoom="'+node.id+'" style="'+bstyle('#faf5ff','#7c3aed')+'">⛶ Lihat</button>'+
      '</div>';
  }
  return '<div style="text-align:center;color:#94a3b8;font-size:11px;padding:20px 0;border:2px dashed #e2e8f0;border-radius:8px">Sambungkan output Generate ke sini</div>';
}

function bodyTrigger(node){
  return '<button data-runall="1" style="'+bstyle('#dc2626','#fff')+'width:100%;font-size:13px;font-weight:800;padding:10px;letter-spacing:.03em">'+
    '▶&nbsp; Jalankan Semua</button>'+
    '<div style="font-size:10px;color:#94a3b8;margin-top:6px;text-align:center">Eksekusi semua node Generate</div>';
}

function selField(node,field,opts,label){
  return '<div style="display:flex;flex-direction:column;gap:2px;flex:1">'+
    '<span style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">'+label+'</span>'+
    '<select data-gf="'+node.id+'" data-field="'+field+'" style="background:#f8fafc;color:#0f172a;border:1px solid #e2e8f0;border-radius:5px;font-size:10px;padding:3px 4px">'+
    opts.map(function(o){return'<option value="'+o+'"'+(node.data[field]===o?' selected':'')+'>'+o+'</option>';}).join('')+
    '</select></div>';
}

/* ── main render ── */
var ROOT=null;
function render(){
  if(!ROOT) return;
  var world=document.getElementById('fc-world'); if(!world) return;
  world.innerHTML=S.nodes.map(renderNode).join('');
  requestAnimationFrame(function(){PP=collectPP();drawSVG();bindNodes();});
}

/* ── bind node events ── */
function bindNodes(){
  var world=document.getElementById('fc-world'); if(!world) return;

  /* drag node header */
  world.querySelectorAll('.fcn-hdr').forEach(function(h){
    h.addEventListener('mousedown',function(e){
      if(e.button!==0) return;
      if(e.target.getAttribute('data-del')) return;
      var nid=h.getAttribute('data-nid');
      var node=S.nodes.find(function(n){return n.id===nid;});
      if(!node) return;
      S.selected=nid; S.dragging={nodeId:nid,sx:e.clientX,sy:e.clientY,ox:node.x,oy:node.y};
      setSelectionBorder(nid); e.stopPropagation();
    });
  });

  /* delete node */
  world.querySelectorAll('[data-del]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var nid=btn.getAttribute('data-del');
      S.nodes=S.nodes.filter(function(n){return n.id!==nid;});
      S.edges=S.edges.filter(function(x){return x.fromId!==nid&&x.toId!==nid;});
      if(S.selected===nid) S.selected=null; render();
    });
  });

  /* port — DRAG to connect: mousedown starts, document mouseup completes */
  world.querySelectorAll('.fc-port').forEach(function(port){
    port.addEventListener('mousedown',function(e){
      e.stopPropagation(); e.preventDefault();
      var nid=port.getAttribute('data-nodeid'),pid=port.getAttribute('data-port');
      var side=port.getAttribute('data-side'),ptype=port.getAttribute('data-ptype');
      var canvas=document.getElementById('fc-canvas');
      var cr=canvas.getBoundingClientRect(),pr=port.getBoundingClientRect();
      var wx=(pr.left+pr.width/2-cr.left-S.view.x)/S.view.scale;
      var wy=(pr.top+pr.height/2-cr.top-S.view.y)/S.view.scale;
      S.pendingConn={nodeId:nid,port:pid,side:side,wx:wx,wy:wy,type:ptype};
      S.tempLine={x1:wx,y1:wy,x2:wx,y2:wy}; drawSVG();
    });
  });

  /* textareas */
  world.querySelectorAll('textarea[data-taid]').forEach(function(ta){
    ta.addEventListener('mousedown',function(e){e.stopPropagation();});
    ta.addEventListener('input',function(){
      var nid=ta.getAttribute('data-taid');
      var node=S.nodes.find(function(n){return n.id===nid;}); if(!node) return;
      if(ta.getAttribute('data-isprompt')==='1') node.data.prompt=ta.value;
      else node.data.text=ta.value;
    });
  });

  /* selects */
  world.querySelectorAll('select[data-gf]').forEach(function(sel){
    sel.addEventListener('mousedown',function(e){e.stopPropagation();});
    sel.addEventListener('change',function(){
      var node=S.nodes.find(function(n){return n.id===sel.getAttribute('data-gf');});
      if(node) node.data[sel.getAttribute('data-field')]=sel.value;
    });
  });

  /* generate */
  world.querySelectorAll('[data-gen]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-gen');});
      if(node) runGenerate(node);
    });
  });

  /* upload */
  world.querySelectorAll('[data-upload]').forEach(function(btn){
    btn.addEventListener('click',function(e){e.stopPropagation();document.getElementById('fcf-'+btn.getAttribute('data-upload')).click();});
  });
  world.querySelectorAll('input[id^="fcf-"]').forEach(function(fi){
    fi.addEventListener('change',function(){handleFiles(fi.id.replace('fcf-',''),fi.files);});
  });

  /* batch */
  world.querySelectorAll('[data-batch]').forEach(function(cb){
    cb.addEventListener('mousedown',function(e){e.stopPropagation();});
    cb.addEventListener('change',function(){
      var node=S.nodes.find(function(n){return n.id===cb.getAttribute('data-batch');});
      if(node) node.data.isBatch=cb.checked;
    });
  });

  /* drop zones */
  world.querySelectorAll('[data-dz]').forEach(function(dz){
    dz.addEventListener('dragover',function(e){e.preventDefault();dz.style.borderColor='#c77818';dz.style.background='#fefce8';});
    dz.addEventListener('dragleave',function(){dz.style.borderColor='#cbd5e1';dz.style.background='#f8fafc';});
    dz.addEventListener('drop',function(e){e.preventDefault();dz.style.borderColor='#cbd5e1';dz.style.background='#f8fafc';handleFiles(dz.getAttribute('data-dz'),e.dataTransfer.files);});
    dz.addEventListener('click',function(){document.getElementById('fcf-'+dz.getAttribute('data-dz')).click();});
  });

  /* download */
  world.querySelectorAll('[data-outdown]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-outdown');});
      if(!node) return; var url=node.data.result||node.data.imageDataUrl; if(!url) return;
      var a=document.createElement('a');a.href=url;a.download='ajw-'+Date.now()+'.png';a.click();
    });
  });

  /* delete result */
  world.querySelectorAll('[data-delresult]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-delresult');});
      if(node){node.data.result=null;node.data.status='idle';} render();
    });
  });

  /* zoom/lightbox */
  world.querySelectorAll('[data-zoom]').forEach(function(el){
    el.addEventListener('click',function(e){
      e.stopPropagation();
      var node=S.nodes.find(function(n){return n.id===el.getAttribute('data-zoom');}); if(!node) return;
      var url=node.data.result||node.data.imageDataUrl; if(url) showLightbox(url);
    });
  });

  /* run all */
  world.querySelectorAll('[data-runall]').forEach(function(btn){
    btn.addEventListener('click',function(e){e.stopPropagation();runAll();});
  });

  /* node click = select */
  world.querySelectorAll('.fcn').forEach(function(el){
    el.addEventListener('mousedown',function(e){
      var nid=el.getAttribute('data-nid');
      if(S.selected!==nid){S.selected=nid;setSelectionBorder(nid);}
    });
  });
}

function setSelectionBorder(nid){
  var world=document.getElementById('fc-world'); if(!world) return;
  world.querySelectorAll('.fcn').forEach(function(n){
    var id=n.getAttribute('data-nid');
    var nd=S.nodes.find(function(x){return x.id===id;});
    var def=nd?ND[nd.type]:null;
    n.style.borderColor=id===nid?(def?def.color:'#6366f1'):'#e2e8f0';
    n.style.zIndex=id===nid?'10':'2';
  });
}

function completeConnection(from,toId,toPort,toSide,toType){
  var fromInfo,toInfo,fromType,toType2;
  if(from.side==='out'&&toSide==='in'){
    fromInfo={id:from.nodeId,port:from.port};toInfo={id:toId,port:toPort};fromType=from.type;toType2=toType;
  } else if(from.side==='in'&&toSide==='out'){
    fromInfo={id:toId,port:toPort};toInfo={id:from.nodeId,port:from.port};fromType=toType;toType2=from.type;
  } else {S.pendingConn=null;S.tempLine=null;drawSVG();return;}
  if(!compat(fromType,toType2)){
    toast('Port tidak kompatibel ('+fromType+' → '+toType2+')','error');
    S.pendingConn=null;S.tempLine=null;drawSVG();return;
  }
  S.edges=S.edges.filter(function(e){return!(e.toId===toInfo.id&&e.toPort===toInfo.port);});
  S.edges.push({fromId:fromInfo.id,fromPort:fromInfo.port,toId:toInfo.id,toPort:toInfo.port});
  S.pendingConn=null;S.tempLine=null;
  render();
}

/* ── lightbox ── */
function showLightbox(url){
  var lb=document.createElement('div');
  lb.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  lb.innerHTML='<div style="position:relative;max-width:90vw;max-height:90vh">'+
    '<img src="'+url+'" style="max-width:90vw;max-height:90vh;border-radius:8px;display:block">'+
    '<button style="position:absolute;top:-14px;right:-14px;width:32px;height:32px;border-radius:50%;background:#fff;border:none;font-size:16px;font-weight:800;cursor:pointer">×</button>'+
    '<a href="'+url+'" download="ajw-preview-'+Date.now()+'.png" style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);background:#22c55e;color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:5px 18px;border-radius:99px;white-space:nowrap">⬇ Download</a>'+
    '</div>';
  lb.addEventListener('click',function(e){if(e.target===lb||e.target.tagName==='BUTTON')lb.remove();});
  document.body.appendChild(lb);
}

/* ── file handling ── */
function handleFiles(nodeId,files){
  if(!files||!files.length) return;
  var node=S.nodes.find(function(n){return n.id===nodeId;}); if(!node) return;
  var arr=Array.prototype.slice.call(files),pending=arr.length;
  arr.forEach(function(f){
    var r=new FileReader();
    r.onload=function(ev){node.data.images.push({name:f.name,dataUrl:ev.target.result});if(--pending===0)render();};
    r.readAsDataURL(f);
  });
}

/* ── generate API ── */
async function runGenerate(node){
  var cfg=getCfg(),key=cfg.openaiKey||cfg.openAiKey||'';
  if(!key){toast('API Key OpenAI belum diset','error');return;}
  node.data.status='running';node.data.result=null;render();
  try{
    var promptText=getConnected(node,'prompt');
    if(!promptText&&node.data.prompt) promptText=node.data.prompt;
    if(Array.isArray(promptText)) promptText=promptText.join('\n');
    promptText=(promptText||'').trim();

    var images=getConnected(node,'image')||[];
    var res;
    if(images.length>0){
      var fd=new FormData();
      fd.append('model',node.data.model||'gpt-image-2');
      fd.append('prompt',promptText||'enhance this image');
      fd.append('n','1');
      images.forEach(function(imgObj,idx){
        var blob=dataUrlToBlob(imgObj.dataUrl);
        fd.append('image[]',blob,imgObj.name||('image'+idx+'.png'));
      });
      res=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{'Authorization':'Bearer '+key},body:fd});
    } else {
      if(!promptText){toast('Prompt kosong! Isi prompt atau sambungkan node Prompt','error');node.data.status='error';render();return;}
      res=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},
        body:JSON.stringify({model:node.data.model||'gpt-image-2',prompt:promptText,n:1,
          size:node.data.size||'1024x1024',quality:node.data.quality||'medium',output_format:'png'})});
    }
    var json=await res.json();
    if(!res.ok) throw new Error(json.error&&json.error.message?json.error.message:'HTTP '+res.status);
    var b64=json.data&&json.data[0]&&json.data[0].b64_json;
    if(!b64) throw new Error('Tidak ada data gambar dari API');
    node.data.result='data:image/png;base64,'+b64;
    node.data.status='done';
    /* propagate to connected output nodes */
    S.edges.forEach(function(e){
      if(e.fromId===node.id&&e.fromPort==='image'){
        var tgt=S.nodes.find(function(n){return n.id===e.toId;});
        if(tgt&&tgt.type==='output') tgt.data.imageDataUrl=node.data.result;
      }
    });
    toast('Generate selesai!','ok');
  } catch(err){
    node.data.status='error';
    toast('Error: '+err.message,'error');
    console.error('[FlowCanvas]',err);
  }
  render();
}

/* ── run all (topological) ── */
async function runAll(){
  var genNodes=S.nodes.filter(function(n){return n.type==='generate';});
  if(!genNodes.length){toast('Tidak ada node Generate','error');return;}
  var visited={},ordered=[];
  function visit(node){
    if(visited[node.id]) return; visited[node.id]=true;
    S.edges.forEach(function(e){
      if(e.toId===node.id&&e.toPort==='image'){
        var dep=S.nodes.find(function(n){return n.id===e.fromId;});
        if(dep&&dep.type==='generate') visit(dep);
      }
    });
    ordered.push(node);
  }
  genNodes.forEach(visit);
  toast('Menjalankan '+ordered.length+' node Generate...','ok');
  for(var i=0;i<ordered.length;i++){
    await runGenerate(ordered[i]);
    if(i<ordered.length-1) await new Promise(function(r){setTimeout(r,500);});
  }
  toast('✓ Semua selesai!','ok');
}

/* ── add node ── */
function addNode(type){
  var def=ND[type];if(!def) return;
  var canvas=document.getElementById('fc-canvas');
  var W=canvas?canvas.clientWidth:800,H=canvas?canvas.clientHeight:600;
  var cx=(W/2-S.view.x)/S.view.scale,cy=(H/2-S.view.y)/S.view.scale;
  S.nodes.push({id:uid(),type:type,x:cx+(Math.random()*100-50),y:cy+(Math.random()*100-50),data:def.def()});
  render();
}

function doSave(){var name=prompt('Nama template:','Flow '+(lsGet().length+1));if(name&&name.trim())saveFlow(name.trim());}
function doClear(){if(!confirm('Kosongkan canvas?'))return;S.nodes=[];S.edges=[];S.selected=null;S.pendingConn=null;S.tempLine=null;S.hoverEdge=null;render();}

/* ── canvas pan/zoom/edge-hover ── */
var panStart=null;
function initCanvas(canvas){
  canvas.addEventListener('mousedown',function(e){
    if(e.button!==0) return;
    var t=e.target;
    var isEmpty=t===canvas||t.id==='fc-world'||t.id==='fc-svg'||t.tagName==='svg';
    if(!isEmpty) return;
    if(S.pendingConn){S.pendingConn=null;S.tempLine=null;drawSVG();return;}
    panStart={x:e.clientX,y:e.clientY,vx:S.view.x,vy:S.view.y};
    S.selected=null;
  });

  document.addEventListener('mousemove',function(e){
    if(panStart){
      S.view.x=panStart.vx+(e.clientX-panStart.x);
      S.view.y=panStart.vy+(e.clientY-panStart.y);
      applyView();return;
    }
    if(S.dragging){
      var d=S.dragging,node=S.nodes.find(function(n){return n.id===d.nodeId;});
      if(node){
        node.x=d.ox+(e.clientX-d.sx)/S.view.scale;
        node.y=d.oy+(e.clientY-d.sy)/S.view.scale;
        var el=document.getElementById('fcn-'+d.nodeId);
        if(el){el.style.left=node.x+'px';el.style.top=node.y+'px';}
        requestAnimationFrame(function(){PP=collectPP();drawSVG();});
      }
      return;
    }
    if(S.pendingConn&&S.tempLine){
      var cr0=canvas.getBoundingClientRect();
      S.tempLine.x2=(e.clientX-cr0.left-S.view.x)/S.view.scale;
      S.tempLine.y2=(e.clientY-cr0.top-S.view.y)/S.view.scale;
      drawSVG();return;
    }
    /* edge proximity for hover (only inside canvas) */
    if(S.edges.length>0){
      var cr=canvas.getBoundingClientRect();
      if(e.clientX>=cr.left&&e.clientX<=cr.right&&e.clientY>=cr.top&&e.clientY<=cr.bottom){
        var wx=(e.clientX-cr.left-S.view.x)/S.view.scale;
        var wy=(e.clientY-cr.top-S.view.y)/S.view.scale;
        var thr=10/S.view.scale,prev=S.hoverEdge;
        S.hoverEdge=null;
        for(var i=0;i<S.edges.length;i++){
          var ee=S.edges[i];
          var fp=PP[ee.fromId+'|out|'+ee.fromPort],tp=PP[ee.toId+'|in|'+ee.toPort];
          if(fp&&tp&&edgeDist(fp,tp,wx,wy)<thr){S.hoverEdge=i;break;}
        }
        if(S.hoverEdge!==prev) drawSVG();
      } else if(S.hoverEdge!==null){S.hoverEdge=null;drawSVG();}
    }
  });

  document.addEventListener('mouseup',function(e){
    if(S.pendingConn){
      /* find port under cursor via elementFromPoint */
      var el=document.elementFromPoint(e.clientX,e.clientY);
      while(el&&!el.hasAttribute('data-port'))el=el.parentElement;
      if(el&&el.hasAttribute('data-port')){
        var nid=el.getAttribute('data-nodeid');
        if(nid!==S.pendingConn.nodeId){
          completeConnection(S.pendingConn,nid,el.getAttribute('data-port'),el.getAttribute('data-side'),el.getAttribute('data-ptype'));
        } else {S.pendingConn=null;S.tempLine=null;drawSVG();}
      } else {S.pendingConn=null;S.tempLine=null;drawSVG();}
    }
    panStart=null;S.dragging=null;
  });

  canvas.addEventListener('wheel',function(e){
    e.preventDefault();
    var cr=canvas.getBoundingClientRect(),mx=e.clientX-cr.left,my=e.clientY-cr.top;
    var delta=e.deltaY<0?1.08:0.93;
    var ns=Math.min(2.5,Math.max(0.2,S.view.scale*delta)),r=ns/S.view.scale;
    S.view.x=mx-(mx-S.view.x)*r;S.view.y=my-(my-S.view.y)*r;S.view.scale=ns;
    applyView();
  },{passive:false});

  canvas.addEventListener('contextmenu',function(e){
    if(S.pendingConn){e.preventDefault();S.pendingConn=null;S.tempLine=null;drawSVG();}
  });
}

function applyView(){
  var w=document.getElementById('fc-world'),s=document.getElementById('fc-svg');
  var t='translate('+S.view.x+'px,'+S.view.y+'px) scale('+S.view.scale+')';
  if(w)w.style.transform=t;if(s)s.style.transform=t;
}

/* ── mount ── */
window.AJWFlowCanvasMount=function(root){
  if(!root) return;
  ROOT=root;
  S.nodes=[];S.edges=[];S.view={x:80,y:60,scale:1};
  S.dragging=null;S.pendingConn=null;S.selected=null;S.tempLine=null;S.hoverEdge=null;

  /* clean up old edge button */
  var oldBtn=document.getElementById('fc-ebtn');if(oldBtn)oldBtn.remove();

  if(!document.getElementById('fc-css3')){
    var st=document.createElement('style');st.id='fc-css3';
    st.textContent=[
      '.fcn{transition:box-shadow .15s,border-color .15s;}',
      '.fcn:hover{box-shadow:0 4px 24px rgba(0,0,0,.14)!important;}',
      /* KEY FIX: fc-world transparent, nodes clickable */
      '#fc-world{pointer-events:none;}',
      '.fcn{pointer-events:auto;}',
      '.fc-port{transition:transform .12s;}',
      '.fc-port:hover{transform:scale(1.7)!important;}',
      '#fc-canvas{background-image:radial-gradient(circle,#b8c0cc 1px,transparent 1px);background-size:22px 22px;background-color:#eef2f7;}',
    ].join('');
    document.head.appendChild(st);
  }

  root.style.cssText='display:flex;flex-direction:column;height:calc(100vh - 160px);min-height:620px;';
  root.innerHTML=
    '<div id="fc-toolbar" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;padding:8px 12px;'+
    'background:#fff;border:1px solid #e2e8f0;border-radius:10px 10px 0 0;border-bottom:none;box-shadow:0 1px 4px rgba(0,0,0,.06)">'+
    '<button id="fc-ai" style="background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer">＋ Gambar Input</button>'+
    '<button id="fc-ap" style="background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer">＋ Prompt</button>'+
    '<button id="fc-ag" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer">＋ Generate</button>'+
    '<button id="fc-ao" style="background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer">＋ Output</button>'+
    '<button id="fc-at" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer">▶ Trigger</button>'+
    '<span style="width:1px;height:22px;background:#e2e8f0;margin:0 2px"></span>'+
    '<button id="fc-save" style="background:#f8fafc;color:#334155;border:1px solid #e2e8f0;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer">💾 Simpan</button>'+
    '<select id="fc-load-dd" style="background:#f8fafc;color:#334155;border:1px solid #e2e8f0;border-radius:6px;padding:5px 8px;font-size:11px;min-width:130px;cursor:pointer"><option value="">— Muat Template —</option></select>'+
    '<button id="fc-clear" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700;cursor:pointer">🗑 Kosongkan</button>'+
    '<span style="color:#94a3b8;font-size:10px;margin-left:auto">Scroll=zoom · Header=pindah · Drag port=sambung · Hover garis=putus</span>'+
    '</div>'+
    '<div id="fc-canvas" style="position:relative;overflow:hidden;flex:1;border-radius:0 0 10px 10px;border:1px solid #e2e8f0;">'+
    /* SVG below world */
    '<svg id="fc-svg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;transform-origin:0 0;overflow:visible"></svg>'+
    '<div id="fc-world" style="position:absolute;transform-origin:0 0;width:0;height:0"></div>'+
    '</div>';

  document.getElementById('fc-ai').onclick=function(){addNode('image-source');};
  document.getElementById('fc-ap').onclick=function(){addNode('prompt');};
  document.getElementById('fc-ag').onclick=function(){addNode('generate');};
  document.getElementById('fc-ao').onclick=function(){addNode('output');};
  document.getElementById('fc-at').onclick=function(){addNode('trigger');};
  document.getElementById('fc-save').onclick=doSave;
  document.getElementById('fc-clear').onclick=doClear;
  document.getElementById('fc-load-dd').addEventListener('change',function(){if(this.value){loadFlow(this.value);this.value='';}});

  refreshDD();
  initCanvas(document.getElementById('fc-canvas'));
  render();
};

})();
