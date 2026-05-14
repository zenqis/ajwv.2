/* AJW Flow Canvas v2 — node-based image generation
   Redesigned: full-screen, prompt inside generate node,
   image preview, disconnect UI, trigger node, template save/load
*/
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
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(function(){t.style.opacity='0';setTimeout(function(){t.remove();},400);},3000);
}

/* ── state ── */
var S={
  nodes:[],edges:[],
  view:{x:60,y:60,scale:1},
  dragging:null,        /* {nodeId,sx,sy,ox,oy} */
  pendingConn:null,     /* {nodeId,port,side,wx,wy,type} */
  tempLine:null,        /* {x1,y1,x2,y2} */
  selected:null,
  hoverEdge:null
};

/* ── port colours ── */
var PC={'image':'#22c55e','image[]':'#22c55e','text':'#3b82f6','prompt':'#3b82f6','trigger':'#f59e0b','any':'#a78bfa'};
function pc(t){return PC[t]||'#a78bfa';}
function compat(a,b){
  if(a===b)return true;
  if(a==='image[]'&&b==='image')return true;
  if(a==='text'&&b==='prompt')return true;
  if(a==='trigger'&&b==='trigger')return true;
  return false;
}

/* ── node definitions ── */
var ND={
  'image-source':{label:'Gambar Input',color:'#16a34a',
    inputs:[],outputs:[{id:'images',type:'image[]',label:'Gambar'}],
    def:function(){return{images:[],isBatch:false};}},
  'prompt':{label:'Prompt',color:'#2563eb',
    inputs:[],outputs:[{id:'text',type:'text',label:'Teks'}],
    def:function(){return{text:''};}},
  'generate':{label:'GPT Image Generate',color:'#c77818',
    inputs:[{id:'image',type:'image',label:'Gambar (opt)'},{id:'prompt',type:'prompt',label:'Prompt'}],
    outputs:[{id:'image',type:'image[]',label:'Hasil'}],
    def:function(){return{model:'gpt-image-2',size:'1024x1024',quality:'medium',status:'idle',result:null,prompt:'',useBuiltinPrompt:true};}},
  'output':{label:'Output / Preview',color:'#7c3aed',
    inputs:[{id:'image',type:'image',label:'Gambar'}],outputs:[],
    def:function(){return{projectName:'',imageDataUrl:'',zoom:false};}},
  'trigger':{label:'▶ Run Flow',color:'#dc2626',
    inputs:[],outputs:[{id:'trigger',type:'trigger',label:'Mulai'}],
    def:function(){return{label:'Run Flow'};}},
};

/* ── get connected value ── */
function getConnected(node,portId){
  var results=[];
  S.edges.forEach(function(e){
    if(e.toId!==node.id||e.toPort!==portId) return;
    var src=S.nodes.find(function(n){return n.id===e.fromId;});
    if(!src) return;
    if(e.fromPort==='images'||e.fromPort==='image'){
      if(src.type==='image-source') results=results.concat(src.data.images||[]);
      if(src.type==='generate'&&src.data.result) results.push({name:'gen.png',dataUrl:src.data.result});
    }
    if(e.fromPort==='text') results.push(src.data.text||'');
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
    nodes:S.nodes.map(function(n){return{id:n.id,type:n.type,x:n.x,y:n.y,data:JSON.parse(JSON.stringify(n.data))};} ),
    edges:S.edges.map(function(e){return Object.assign({},e);}),
    updatedAt:Date.now()};
  if(ex){Object.assign(ex,flow);}else{flows.push(flow);}
  lsSet(flows);
  toast('Flow "'+name+'" disimpan','ok');
  refreshDD();
}
function loadFlow(id){
  var f=lsGet().find(function(f){return f.id===id;});
  if(!f) return;
  S.nodes=f.nodes.map(function(n){
    var d=ND[n.type];
    return{id:n.id,type:n.type,x:n.x,y:n.y,data:Object.assign(d?d.def():{},n.data)};
  });
  S.edges=f.edges.map(function(e){return Object.assign({},e);});
  S.selected=null; S.pendingConn=null; S.tempLine=null;
  render();
  toast('Flow "'+f.name+'" dimuat','ok');
}
function deleteFlow(id){
  var flows=lsGet().filter(function(f){return f.id!==id;});
  lsSet(flows);
  toast('Template dihapus','ok');
  refreshDD();
}

/* ── port positions ── */
var PP={};
function collectPP(){
  var pp={};
  var canvas=document.getElementById('fc-canvas');
  if(!canvas) return pp;
  var cr=canvas.getBoundingClientRect();
  S.nodes.forEach(function(node){
    var def=ND[node.type]||{inputs:[],outputs:[]};
    def.inputs.forEach(function(p){
      var el=document.getElementById('prt-'+node.id+'-in-'+p.id);
      if(!el) return;
      var r=el.getBoundingClientRect();
      pp[node.id+'|in|'+p.id]={x:(r.left+r.width/2-cr.left-S.view.x)/S.view.scale,
        y:(r.top+r.height/2-cr.top-S.view.y)/S.view.scale,type:p.type,side:'in',nodeId:node.id,port:p.id};
    });
    def.outputs.forEach(function(p){
      var el=document.getElementById('prt-'+node.id+'-out-'+p.id);
      if(!el) return;
      var r=el.getBoundingClientRect();
      pp[node.id+'|out|'+p.id]={x:(r.left+r.width/2-cr.left-S.view.x)/S.view.scale,
        y:(r.top+r.height/2-cr.top-S.view.y)/S.view.scale,type:p.type,side:'out',nodeId:node.id,port:p.id};
    });
  });
  return pp;
}

/* ── bezier path ── */
function bez(x1,y1,x2,y2){
  var cx=(x1+x2)/2;
  return 'M'+x1+','+y1+' C'+cx+','+y1+' '+cx+','+y2+' '+x2+','+y2;
}

/* ── SVG draw ── */
function drawSVG(){
  var svg=document.getElementById('fc-svg');
  if(!svg) return;
  var paths=[];
  S.edges.forEach(function(e,i){
    var fk=e.fromId+'|out|'+e.fromPort, tk=e.toId+'|in|'+e.toPort;
    var fp=PP[fk], tp=PP[tk];
    if(!fp||!tp) return;
    var col=pc(fp.type);
    var isHover=S.hoverEdge===i;
    paths.push('<g data-ei="'+i+'" class="fc-edge-g" style="cursor:pointer">'+
      '<path d="'+bez(fp.x,fp.y,tp.x,tp.y)+'" stroke="'+col+'" stroke-width="'+(isHover?3:2)+'" fill="none" opacity="'+(isHover?1:0.75)+'"/>'+
      '<path d="'+bez(fp.x,fp.y,tp.x,tp.y)+'" stroke="transparent" stroke-width="14" fill="none"/>'+
      (isHover?'<circle cx="'+((fp.x+tp.x)/2)+'" cy="'+((fp.y+tp.y)/2)+'" r="8" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>'+
               '<text x="'+((fp.x+tp.x)/2)+'" y="'+((fp.y+tp.y)/2+4)+'" text-anchor="middle" fill="#fff" font-size="10" font-weight="800">×</text>':'')
      +'</g>');
  });
  if(S.tempLine){
    var t=S.tempLine;
    paths.push('<line x1="'+t.x1+'" y1="'+t.y1+'" x2="'+t.x2+'" y2="'+t.y2+
      '" stroke="#c77818" stroke-width="2" stroke-dasharray="6 3" opacity="0.9"/>');
  }
  svg.innerHTML=paths.join('');
  /* edge hover/click */
  svg.querySelectorAll('.fc-edge-g').forEach(function(g){
    var ei=parseInt(g.getAttribute('data-ei'));
    g.addEventListener('mouseenter',function(){S.hoverEdge=ei;drawSVG();});
    g.addEventListener('mouseleave',function(){S.hoverEdge=null;drawSVG();});
    g.addEventListener('click',function(){
      if(S.hoverEdge===ei){S.edges.splice(ei,1);S.hoverEdge=null;render();}
    });
  });
}

/* ── render node ── */
function renderNode(node){
  var def=ND[node.type]||{label:node.type,color:'#666',inputs:[],outputs:[],def:function(){return{};}};
  var isSel=S.selected===node.id;
  var W=node.type==='output'&&node.data.zoom?480:node.type==='generate'?290:node.type==='image-source'?240:node.type==='trigger'?160:250;
  /* status ring for generate */
  var ring='';
  if(node.type==='generate'){
    var sc={idle:'#94a3b8',running:'#3b82f6',done:'#22c55e',error:'#ef4444'}[node.data.status]||'#94a3b8';
    ring='<div style="width:8px;height:8px;border-radius:50%;background:'+sc+';flex-shrink:0"></div>';
  }
  /* port circles */
  function portDots(ports,side){
    return ports.map(function(p,i){
      var isIn=side==='in';
      return '<div id="prt-'+node.id+'-'+side+'-'+p.id+'" data-nodeid="'+node.id+'" data-port="'+p.id+'" data-side="'+side+'" data-ptype="'+p.type+'"'+
        ' title="'+esc(p.label)+' ('+p.type+')"'+
        ' style="position:absolute;'+(isIn?'left:-7px':'right:-7px')+';top:'+(18+i*26)+'px;'+
        'width:14px;height:14px;border-radius:50%;background:'+pc(p.type)+';border:2px solid #fff;'+
        'cursor:crosshair;z-index:20;box-shadow:0 0 0 2px '+pc(p.type)+'44;class="fc-port""></div>';
    }).join('');
  }
  var minBody=Math.max((def.inputs.length),(def.outputs.length))*26+10;

  return '<div id="fcn-'+node.id+'" class="fcn" data-nid="'+node.id+'"'+
    ' style="position:absolute;left:'+node.x+'px;top:'+node.y+'px;width:'+W+'px;'+
    'background:#ffffff;border-radius:12px;border:2px solid '+(isSel?def.color:'#e2e8f0')+';'+
    'box-shadow:0 2px 16px rgba(0,0,0,.10);user-select:none;z-index:'+(isSel?10:2)+'">'+
    /* header */
    '<div class="fcn-hdr" data-nid="'+node.id+'" style="display:flex;align-items:center;gap:7px;'+
    'padding:8px 10px;border-radius:10px 10px 0 0;background:'+def.color+';cursor:move">'+
    ring+
    '<span style="font-size:11px;font-weight:800;color:#fff;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(def.label)+'</span>'+
    '<button data-del="'+node.id+'" style="background:rgba(255,255,255,.18);border:none;border-radius:4px;color:#fff;cursor:pointer;font-size:13px;padding:0 5px;line-height:20px;font-weight:700">×</button>'+
    '</div>'+
    /* port layer */
    '<div style="position:relative;min-height:'+minBody+'px">'+
    portDots(def.inputs,'in')+portDots(def.outputs,'out')+
    '<div class="fcn-body" style="padding:10px 12px 12px;color:#334155;font-size:12px">'+
    renderBody(node)+
    '</div></div></div>';
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

function bodyImgSrc(node){
  var imgs=node.data.images||[];
  var thumbs=imgs.slice(0,6).map(function(img){
    return '<img src="'+img.dataUrl+'" title="'+esc(img.name)+'" style="width:48px;height:48px;object-fit:cover;border-radius:5px;border:1px solid #e2e8f0">';
  }).join('');
  var more=imgs.length>6?'<span style="font-size:10px;color:#94a3b8;align-self:center">+'+( imgs.length-6)+'</span>':'';
  return '<div id="dz-'+node.id+'" data-dz="'+node.id+'" style="border:2px dashed #cbd5e1;border-radius:8px;padding:10px;text-align:center;cursor:pointer;min-height:72px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px;margin-bottom:8px;background:#f8fafc">'+
    (imgs.length?thumbs+more:'<div style="color:#94a3b8;font-size:11px">Drag gambar / klik Upload</div>')+
    '</div>'+
    '<div style="display:flex;gap:6px;align-items:center">'+
    '<button data-upload="'+node.id+'" style="'+bstyle('#f0f9ff','#0284c7')+'">Upload</button>'+
    '<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#64748b;cursor:pointer"><input type="checkbox" '+(node.data.isBatch?'checked':'')+' data-batch="'+node.id+'"> Batch</label>'+
    '<span style="color:#94a3b8;font-size:10px;margin-left:auto">'+imgs.length+' file</span>'+
    '</div>'+
    '<input type="file" id="fcf-'+node.id+'" accept="image/*" multiple style="display:none">';
}

function bodyPrompt(node){
  return '<textarea id="fct-'+node.id+'" data-taid="'+node.id+'" placeholder="Tulis prompt di sini..." '+
    'style="width:100%;box-sizing:border-box;min-height:90px;background:#f8fafc;border:1px solid #e2e8f0;'+
    'border-radius:6px;color:#0f172a;font-size:12px;padding:8px;resize:vertical;font-family:inherit;line-height:1.5">'+
    esc(node.data.text||'')+'</textarea>';
}

function bodyGenerate(node){
  var sc={idle:'#94a3b8',running:'#3b82f6',done:'#22c55e',error:'#ef4444'}[node.data.status||'idle'];
  var st={idle:'Siap',running:'Memproses...',done:'Selesai',error:'Gagal'}[node.data.status||'idle'];
  var promptConnected=S.edges.some(function(e){return e.toId===node.id&&e.toPort==='prompt';});
  return (node.data.result?
    '<div style="position:relative;border-radius:7px;overflow:hidden;margin-bottom:8px;background:#f1f5f9">'+
    '<img src="'+node.data.result+'" style="width:100%;display:block;border-radius:7px" id="gimg-'+node.id+'">'+
    '<div style="position:absolute;top:6px;right:6px;display:flex;gap:4px">'+
    '<button data-outdown="'+node.id+'" title="Download" style="'+ibtn()+'">⬇</button>'+
    '<button data-delresult="'+node.id+'" title="Hapus hasil" style="'+ibtn()+'">✕</button>'+
    '</div></div>':
    '')+
    /* prompt textarea (shown when no prompt node connected) */
    (!promptConnected?
    '<div style="margin-bottom:7px">'+
    '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Prompt</div>'+
    '<textarea id="fct-'+node.id+'" data-taid="'+node.id+'" data-isprompt="1" placeholder="Tulis prompt generate..." '+
    'style="width:100%;box-sizing:border-box;min-height:70px;background:#f8fafc;border:1px solid #e2e8f0;'+
    'border-radius:6px;color:#0f172a;font-size:11px;padding:7px;resize:vertical;font-family:inherit;line-height:1.5">'+
    esc(node.data.prompt||'')+'</textarea>'+
    '</div>':'<div style="font-size:10px;color:#94a3b8;margin-bottom:6px;padding:5px 8px;background:#f0fdf4;border-radius:5px;border:1px solid #bbf7d0">✓ Prompt dari node terhubung</div>')+
    /* settings row */
    '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">'+
    selField(node,'model',['gpt-image-2','gpt-image-1'],'Model')+
    selField(node,'size',['1024x1024','1792x1024','1024x1792'],'Ukuran')+
    selField(node,'quality',['auto','medium','high','low'],'Quality')+
    '</div>'+
    '<div style="display:flex;align-items:center;gap:8px">'+
    '<button data-gen="'+node.id+'" style="'+bstyle('#c77818','#fff')+'flex:1;font-weight:800;font-size:12px;padding:7px 10px" '+(node.data.status==='running'?'disabled':'')+'>'+
    (node.data.status==='running'?'⏳ Generating...':'⚡ Generate')+'</button>'+
    '<span style="display:flex;align-items:center;gap:4px;font-size:10px;color:'+sc+'"><span style="width:7px;height:7px;border-radius:50%;background:'+sc+';display:inline-block"></span>'+esc(st)+'</span>'+
    '</div>';
}

function bodyOutput(node){
  if(node.data.imageDataUrl){
    return '<div style="position:relative;margin-bottom:8px">'+
      '<img src="'+node.data.imageDataUrl+'" id="oimg-'+node.id+'" style="width:100%;border-radius:8px;display:block;cursor:zoom-in" data-zoom="'+node.id+'">'+
      '</div>'+
      '<div style="display:flex;gap:6px">'+
      '<button data-outdown="'+node.id+'" style="'+bstyle('#f0fdf4','#16a34a')+'flex:1">⬇ Download</button>'+
      '<button data-zoom="'+node.id+'" style="'+bstyle('#faf5ff','#7c3aed')+'">⛶ Preview</button>'+
      '</div>';
  }
  return '<div style="text-align:center;color:#94a3b8;font-size:11px;padding:24px 0;border:2px dashed #e2e8f0;border-radius:8px">Sambungkan node Generate ke sini</div>';
}

function bodyTrigger(node){
  return '<button data-runall="1" style="'+bstyle('#dc2626','#fff')+'width:100%;font-size:13px;font-weight:800;padding:10px;letter-spacing:.03em">'+
    '▶&nbsp; Jalankan Semua</button>'+
    '<div style="font-size:10px;color:#94a3b8;margin-top:6px;text-align:center">Eksekusi semua node Generate secara berurutan</div>';
}

function selField(node,field,opts,label){
  return '<div style="display:flex;flex-direction:column;gap:2px;flex:1">'+
    '<span style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase">'+label+'</span>'+
    '<select data-gf="'+node.id+'" data-field="'+field+'" style="background:#f8fafc;color:#0f172a;border:1px solid #e2e8f0;border-radius:5px;font-size:10px;padding:3px 4px">'+
    opts.map(function(o){return'<option value="'+o+'"'+(node.data[field]===o?' selected':'')+'>'+o+'</option>';}).join('')+
    '</select></div>';
}

function bstyle(bg,col){return 'background:'+bg+';color:'+col+';border:1px solid '+col+'33;border-radius:6px;padding:5px 10px;font-size:11px;cursor:pointer;';}
function ibtn(){return 'background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:4px;width:26px;height:26px;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;';}

/* ── main render ── */
var ROOT=null;
function render(){
  if(!ROOT) return;
  var world=document.getElementById('fc-world');
  var svg=document.getElementById('fc-svg');
  if(!world||!svg) return;
  world.innerHTML=S.nodes.map(renderNode).join('');
  requestAnimationFrame(function(){
    PP=collectPP();
    drawSVG();
    bindNodes();
  });
}

/* ── bind node events ── */
function bindNodes(){
  var world=document.getElementById('fc-world');
  if(!world) return;

  /* drag header */
  world.querySelectorAll('.fcn-hdr').forEach(function(h){
    h.addEventListener('mousedown',function(e){
      if(e.button!==0) return;
      var nid=h.getAttribute('data-nid');
      var node=S.nodes.find(function(n){return n.id===nid;});
      if(!node) return;
      S.selected=nid;
      S.dragging={nodeId:nid,sx:e.clientX,sy:e.clientY,ox:node.x,oy:node.y};
      e.stopPropagation();
      /* redraw selection border */
      world.querySelectorAll('.fcn').forEach(function(el){
        var nd=ND[S.nodes.find(function(n){return n.id===el.getAttribute('data-nid');})||{}];
        el.style.borderColor=el.getAttribute('data-nid')===nid?(ND[S.nodes.find(function(n){return n.id===nid;}).type]||{color:'#e2e8f0'}).color:'#e2e8f0';
      });
    });
  });

  /* delete node */
  world.querySelectorAll('[data-del]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var nid=btn.getAttribute('data-del');
      S.nodes=S.nodes.filter(function(n){return n.id!==nid;});
      S.edges=S.edges.filter(function(e){return e.fromId!==nid&&e.toId!==nid;});
      if(S.selected===nid) S.selected=null;
      render();
    });
  });

  /* port click — connect */
  world.querySelectorAll('[data-port]').forEach(function(port){
    port.addEventListener('mousedown',function(e){
      e.stopPropagation(); e.preventDefault();
      var nid=port.getAttribute('data-nodeid');
      var pid=port.getAttribute('data-port');
      var side=port.getAttribute('data-side');
      var ptype=port.getAttribute('data-ptype');
      var canvas=document.getElementById('fc-canvas');
      var cr=canvas.getBoundingClientRect();
      var pr=port.getBoundingClientRect();
      var wx=(pr.left+pr.width/2-cr.left-S.view.x)/S.view.scale;
      var wy=(pr.top+pr.height/2-cr.top-S.view.y)/S.view.scale;

      if(!S.pendingConn){
        S.pendingConn={nodeId:nid,port:pid,side:side,wx:wx,wy:wy,type:ptype};
        S.tempLine={x1:wx,y1:wy,x2:wx,y2:wy};
      } else {
        var from=S.pendingConn;
        if(from.nodeId===nid){S.pendingConn=null;S.tempLine=null;drawSVG();return;}
        var fromInfo,toInfo,fromType,toType;
        if(from.side==='out'&&side==='in'){fromInfo={id:from.nodeId,port:from.port};toInfo={id:nid,port:pid};fromType=from.type;toType=ptype;}
        else if(from.side==='in'&&side==='out'){fromInfo={id:nid,port:pid};toInfo={id:from.nodeId,port:from.port};fromType=ptype;toType=from.type;}
        else{S.pendingConn=null;S.tempLine=null;drawSVG();return;}
        if(!compat(fromType,toType)){S.pendingConn=null;S.tempLine=null;drawSVG();return;}
        /* remove existing edge to same input port */
        S.edges=S.edges.filter(function(e){return!(e.toId===toInfo.id&&e.toPort===toInfo.port);});
        S.edges.push({fromId:fromInfo.id,fromPort:fromInfo.port,toId:toInfo.id,toPort:toInfo.port});
        S.pendingConn=null;S.tempLine=null;
        render();
      }
    });
  });

  /* textareas */
  world.querySelectorAll('textarea[data-taid]').forEach(function(ta){
    ta.addEventListener('mousedown',function(e){e.stopPropagation();});
    ta.addEventListener('input',function(){
      var nid=ta.getAttribute('data-taid');
      var isPrompt=ta.getAttribute('data-isprompt')==='1';
      var node=S.nodes.find(function(n){return n.id===nid;});
      if(!node) return;
      if(isPrompt) node.data.prompt=ta.value;
      else node.data.text=ta.value;
    });
  });

  /* selects */
  world.querySelectorAll('select[data-gf]').forEach(function(sel){
    sel.addEventListener('mousedown',function(e){e.stopPropagation();});
    sel.addEventListener('change',function(){
      var nid=sel.getAttribute('data-gf');
      var field=sel.getAttribute('data-field');
      var node=S.nodes.find(function(n){return n.id===nid;});
      if(node) node.data[field]=sel.value;
    });
  });

  /* generate button */
  world.querySelectorAll('[data-gen]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-gen');});
      if(node) runGenerate(node);
    });
  });

  /* upload */
  world.querySelectorAll('[data-upload]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var fi=document.getElementById('fcf-'+btn.getAttribute('data-upload'));
      if(fi) fi.click();
    });
  });
  world.querySelectorAll('input[id^="fcf-"]').forEach(function(fi){
    fi.addEventListener('change',function(){handleFiles(fi.id.replace('fcf-',''),fi.files);});
  });

  /* batch checkbox */
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
    dz.addEventListener('drop',function(e){
      e.preventDefault();dz.style.borderColor='#cbd5e1';dz.style.background='#f8fafc';
      handleFiles(dz.getAttribute('data-dz'),e.dataTransfer.files);
    });
    dz.addEventListener('click',function(e){
      var fi=document.getElementById('fcf-'+dz.getAttribute('data-dz'));
      if(fi) fi.click();
    });
  });

  /* download buttons */
  world.querySelectorAll('[data-outdown]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-outdown');});
      if(!node) return;
      var url=node.data.result||node.data.imageDataUrl;
      if(!url) return;
      var a=document.createElement('a');a.href=url;a.download='ajw-'+Date.now()+'.png';a.click();
    });
  });

  /* delete result */
  world.querySelectorAll('[data-delresult]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var node=S.nodes.find(function(n){return n.id===btn.getAttribute('data-delresult');});
      if(node){node.data.result=null;node.data.status='idle';}
      render();
    });
  });

  /* zoom/preview image */
  world.querySelectorAll('[data-zoom]').forEach(function(el){
    el.addEventListener('click',function(e){
      e.stopPropagation();
      var nid=el.getAttribute('data-zoom');
      var node=S.nodes.find(function(n){return n.id===nid;});
      if(!node) return;
      var url=node.data.imageDataUrl||node.data.result;
      if(!url) return;
      showLightbox(url);
    });
  });

  /* run all trigger */
  world.querySelectorAll('[data-runall]').forEach(function(btn){
    btn.addEventListener('click',function(e){e.stopPropagation();runAll();});
  });

  /* node click select */
  world.querySelectorAll('.fcn').forEach(function(el){
    el.addEventListener('mousedown',function(e){
      var nid=el.getAttribute('data-nid');
      if(S.selected!==nid){
        S.selected=nid;
        world.querySelectorAll('.fcn').forEach(function(n){
          var nd2=S.nodes.find(function(x){return x.id===n.getAttribute('data-nid');});
          n.style.borderColor=n.getAttribute('data-nid')===nid?(ND[nd2&&nd2.type]||{color:'#e2e8f0'}).color:'#e2e8f0';
        });
      }
    });
  });
}

/* ── lightbox ── */
function showLightbox(url){
  var lb=document.createElement('div');
  lb.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;cursor:zoom-out';
  lb.innerHTML='<div style="position:relative;max-width:90vw;max-height:90vh">'+
    '<img src="'+url+'" style="max-width:90vw;max-height:90vh;border-radius:8px;display:block">'+
    '<button style="position:absolute;top:-12px;right:-12px;width:32px;height:32px;border-radius:50%;background:#fff;border:none;font-size:16px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center">×</button>'+
    '<a href="'+url+'" download="ajw-preview-'+Date.now()+'.png" style="position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);background:#22c55e;color:#fff;text-decoration:none;font-size:12px;font-weight:700;padding:5px 16px;border-radius:99px">⬇ Download</a>'+
    '</div>';
  lb.addEventListener('click',function(e){if(e.target===lb||e.target.tagName==='BUTTON')lb.remove();});
  document.body.appendChild(lb);
}

/* ── file handling ── */
function handleFiles(nodeId,files){
  if(!files||!files.length) return;
  var node=S.nodes.find(function(n){return n.id===nodeId;});
  if(!node) return;
  var arr=Array.prototype.slice.call(files);
  var pending=arr.length;
  arr.forEach(function(f){
    var r=new FileReader();
    r.onload=function(ev){
      node.data.images.push({name:f.name,dataUrl:ev.target.result});
      if(--pending===0) render();
    };
    r.readAsDataURL(f);
  });
}

/* ── generate API ── */
async function runGenerate(node){
  var cfg=getCfg();
  var key=cfg.openaiKey||cfg.openAiKey||'';
  if(!key){toast('API Key belum diset','error');return;}
  node.data.status='running';node.data.result=null;render();
  try{
    var promptText=getConnected(node,'prompt');
    if(!promptText && node.data.prompt) promptText=node.data.prompt;
    if(!promptText) promptText='';
    var images=getConnected(node,'image')||[];
    var res;
    if(images.length>0){
      var fd=new FormData();
      fd.append('model',node.data.model||'gpt-image-2');
      fd.append('prompt',promptText);
      fd.append('n','1');
      var imgObj=images[0];
      var blob=dataUrlToBlob(imgObj.dataUrl);
      fd.append('image[]',blob,imgObj.name||'image.png');
      res=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{'Authorization':'Bearer '+key},body:fd});
    }else{
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
    /* propagate to output nodes */
    S.edges.forEach(function(e){
      if(e.fromId===node.id&&e.fromPort==='image'){
        var tgt=S.nodes.find(function(n){return n.id===e.toId;});
        if(tgt&&(tgt.type==='output'||tgt.type==='generate')) tgt.data.imageDataUrl=node.data.result;
      }
    });
    toast('Generate selesai!','ok');
  }catch(err){
    node.data.status='error';
    toast('Error: '+err.message,'error');
    console.error('[FlowCanvas]',err);
  }
  render();
}

/* ── run all (topological order) ── */
async function runAll(){
  /* find all generate nodes, sort by dependency */
  var genNodes=S.nodes.filter(function(n){return n.type==='generate';});
  if(!genNodes.length){toast('Tidak ada node Generate','error');return;}
  /* simple topological: nodes with no image-in dependency first */
  function deps(node){
    return S.edges.filter(function(e){return e.toId===node.id&&e.toPort==='image';}).length;
  }
  genNodes.sort(function(a,b){return deps(a)-deps(b);});
  toast('Menjalankan '+genNodes.length+' node Generate...','ok');
  for(var i=0;i<genNodes.length;i++){
    await runGenerate(genNodes[i]);
    /* wait a bit between calls */
    await new Promise(function(r){setTimeout(r,400);});
  }
  toast('Semua node selesai!','ok');
}

/* ── add node ── */
function addNode(type){
  var def=ND[type]; if(!def) return;
  var canvas=document.getElementById('fc-canvas');
  var W=canvas?canvas.clientWidth:800;
  var H=canvas?canvas.clientHeight:600;
  var cx=(W/2-S.view.x)/S.view.scale;
  var cy=(H/2-S.view.y)/S.view.scale;
  S.nodes.push({id:uid(),type:type,x:cx+(Math.random()*80-40),y:cy+(Math.random()*80-40),data:def.def()});
  render();
}

/* ── save/load UI ── */
function doSave(){
  var name=prompt('Nama template:','Flow '+(lsGet().length+1));
  if(name&&name.trim()) saveFlow(name.trim());
}
function refreshDD(){
  var dd=document.getElementById('fc-load-dd');
  if(!dd) return;
  var flows=lsGet();
  dd.innerHTML='<option value="">— Muat Template —</option>'+
    flows.map(function(f){return'<option value="'+esc(f.id)+'">'+esc(f.name)+'</option>';}).join('');
}
function doClear(){
  if(!confirm('Kosongkan canvas?')) return;
  S.nodes=[];S.edges=[];S.selected=null;S.pendingConn=null;S.tempLine=null;
  render();
}

/* ── canvas pan/zoom ── */
var panStart=null;
function initCanvas(canvas){
  canvas.addEventListener('mousedown',function(e){
    if(e.button!==0) return;
    if(S.pendingConn){S.pendingConn=null;S.tempLine=null;drawSVG();return;}
    var t=e.target;
    var onEmpty=t===canvas||t.id==='fc-world'||t.id==='fc-svg'||t.tagName==='svg';
    if(onEmpty){
      panStart={x:e.clientX,y:e.clientY,vx:S.view.x,vy:S.view.y};
      S.selected=null;
    }
  });
  document.addEventListener('mousemove',function(e){
    if(panStart){
      S.view.x=panStart.vx+(e.clientX-panStart.x);
      S.view.y=panStart.vy+(e.clientY-panStart.y);
      applyView(); return;
    }
    if(S.dragging){
      var d=S.dragging;
      var dx=(e.clientX-d.sx)/S.view.scale, dy=(e.clientY-d.sy)/S.view.scale;
      var node=S.nodes.find(function(n){return n.id===d.nodeId;});
      if(node){node.x=d.ox+dx;node.y=d.oy+dy;}
      var el=document.getElementById('fcn-'+d.nodeId);
      if(el){el.style.left=node.x+'px';el.style.top=node.y+'px';}
      requestAnimationFrame(function(){PP=collectPP();drawSVG();});
      return;
    }
    if(S.pendingConn&&S.tempLine){
      var cr=canvas.getBoundingClientRect();
      S.tempLine.x2=(e.clientX-cr.left-S.view.x)/S.view.scale;
      S.tempLine.y2=(e.clientY-cr.top-S.view.y)/S.view.scale;
      drawSVG();
    }
  });
  document.addEventListener('mouseup',function(){
    panStart=null;
    if(S.dragging) S.dragging=null;
  });
  canvas.addEventListener('wheel',function(e){
    e.preventDefault();
    var cr=canvas.getBoundingClientRect();
    var mx=e.clientX-cr.left, my=e.clientY-cr.top;
    var delta=e.deltaY<0?1.08:0.93;
    var ns=Math.min(2.0,Math.max(0.25,S.view.scale*delta));
    var r=ns/S.view.scale;
    S.view.x=mx-(mx-S.view.x)*r; S.view.y=my-(my-S.view.y)*r; S.view.scale=ns;
    applyView();
  },{passive:false});
  canvas.addEventListener('contextmenu',function(e){
    if(S.pendingConn){e.preventDefault();S.pendingConn=null;S.tempLine=null;drawSVG();}
  });
}

function applyView(){
  var w=document.getElementById('fc-world'), s=document.getElementById('fc-svg');
  var t='translate('+S.view.x+'px,'+S.view.y+'px) scale('+S.view.scale+')';
  if(w) w.style.transform=t;
  if(s) s.style.transform=t;
}

/* ── mount ── */
window.AJWFlowCanvasMount=function(root){
  if(!root) return;
  ROOT=root;
  S.nodes=[];S.edges=[];S.view={x:60,y:60,scale:1};
  S.dragging=null;S.pendingConn=null;S.selected=null;S.tempLine=null;S.hoverEdge=null;

  if(!document.getElementById('fc-css2')){
    var st=document.createElement('style');st.id='fc-css2';
    st.textContent=[
      '.fcn{transition:box-shadow .15s;}',
      '.fcn:hover{box-shadow:0 4px 24px rgba(0,0,0,.13)!important;}',
      '[data-port]{transition:transform .1s;}',
      '[data-port]:hover{transform:scale(1.5)!important;}',
      '#fc-canvas{background-image:radial-gradient(circle,#c8cdd4 1px,transparent 1px);background-size:22px 22px;background-color:#f1f5f9;}',
      '#fc-toolbar button{cursor:pointer;}',
      '#fc-toolbar select{cursor:pointer;}',
      '.fc-edge-g{transition:opacity .1s;}',
    ].join('');
    document.head.appendChild(st);
  }

  /* build UI */
  root.style.cssText='display:flex;flex-direction:column;height:calc(100vh - 160px);min-height:620px;';
  root.innerHTML=
    '<div id="fc-toolbar" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;'+
    'padding:8px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:10px 10px 0 0;'+
    'border-bottom:none;box-shadow:0 1px 4px rgba(0,0,0,.06)">'+
    /* add node buttons */
    '<button id="fc-ai" style="background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700">＋ Gambar Input</button>'+
    '<button id="fc-ap" style="background:#dbeafe;color:#1d4ed8;border:1px solid #bfdbfe;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700">＋ Prompt</button>'+
    '<button id="fc-ag" style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700">＋ Generate</button>'+
    '<button id="fc-ao" style="background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700">＋ Output</button>'+
    '<button id="fc-at" style="background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700">▶ Trigger</button>'+
    '<span style="width:1px;height:24px;background:#e2e8f0;margin:0 2px"></span>'+
    '<button id="fc-save" style="background:#f8fafc;color:#334155;border:1px solid #e2e8f0;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700">💾 Simpan</button>'+
    '<select id="fc-load-dd" style="background:#f8fafc;color:#334155;border:1px solid #e2e8f0;border-radius:6px;padding:5px 8px;font-size:11px;min-width:130px"><option value="">— Muat Template —</option></select>'+
    '<button id="fc-clear" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:6px;padding:5px 10px;font-size:11px;font-weight:700">🗑 Kosongkan</button>'+
    '<span style="color:#94a3b8;font-size:10px;margin-left:auto">Scroll=zoom · Drag=pan · Klik port=sambung · Hover garis=putuskan</span>'+
    '</div>'+
    '<div id="fc-canvas" style="position:relative;overflow:hidden;flex:1;border-radius:0 0 10px 10px;border:1px solid #e2e8f0;cursor:default">'+
    '<div id="fc-world" style="position:absolute;transform-origin:0 0;width:0;height:0"></div>'+
    '<svg id="fc-svg" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;transform-origin:0 0;overflow:visible"></svg>'+
    /* pointer-events on for edges via JS */
    '</div>';

  /* toolbar events */
  document.getElementById('fc-ai').onclick=function(){addNode('image-source');};
  document.getElementById('fc-ap').onclick=function(){addNode('prompt');};
  document.getElementById('fc-ag').onclick=function(){addNode('generate');};
  document.getElementById('fc-ao').onclick=function(){addNode('output');};
  document.getElementById('fc-at').onclick=function(){addNode('trigger');};
  document.getElementById('fc-save').onclick=doSave;
  document.getElementById('fc-clear').onclick=doClear;
  document.getElementById('fc-load-dd').addEventListener('change',function(){
    if(this.value){loadFlow(this.value);this.value='';}
  });

  refreshDD();
  initCanvas(document.getElementById('fc-canvas'));
  render();
  /* enable pointer events on SVG for edge interaction (set after render) */
  setTimeout(function(){
    var s=document.getElementById('fc-svg');
    if(s) s.style.pointerEvents='all';
  },100);
};

})();
