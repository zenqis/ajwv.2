/* AJW Flow Canvas — node-based image generation workflow
   v20260514.1 — pure vanilla JS, no external deps
   Defines window.AJWFlowCanvasMount(root)
*/
(function(){
'use strict';

/* ─── helpers ─────────────────────────────────────────────── */
function uid(){ return 'n_'+Date.now()+'_'+Math.random().toString(36).slice(2,5); }
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function getCfg(){ return (typeof window.getCfg==='function') ? window.getCfg() : (window._ajwCfg||{}); }

function dataUrlToBlob(dataUrl){
  var arr=dataUrl.split(','), mime=arr[0].match(/:(.*?);/)[1];
  var bstr=atob(arr[1]), n=bstr.length, u8=new Uint8Array(n);
  for(var i=0;i<n;i++) u8[i]=bstr.charCodeAt(i);
  return new Blob([u8],{type:mime});
}

/* ─── state ────────────────────────────────────────────────── */
var state={
  nodes:[],
  edges:[],
  view:{x:0,y:0,scale:1},
  dragging:null,
  connecting:null,
  pendingConnect:null, // {nodeId,port,side}
  selected:null,
  tempLine:null        // {x1,y1,x2,y2}
};

/* ─── port definitions ─────────────────────────────────────── */
var PORT_COLOR={
  'image':'#4ade80',
  'image[]':'#4ade80',
  'text':'#60a5fa',
  'prompt':'#60a5fa'
};

function portColor(type){ return PORT_COLOR[type]||'#a78bfa'; }

function portsCompatible(outType, inType){
  if(outType===inType) return true;
  if(outType==='image[]' && inType==='image') return true;
  if(outType==='text' && inType==='prompt') return true;
  return false;
}

/* ─── node definitions ────────────────────────────────────── */
var NODE_DEFS={
  'image-source':{
    label:'Gambar Input',
    inputs:[],
    outputs:[{id:'images',type:'image[]',label:'images'}],
    defaultData:function(){ return {images:[],isBatch:false}; }
  },
  'prompt':{
    label:'Prompt',
    inputs:[],
    outputs:[{id:'text',type:'text',label:'text'}],
    defaultData:function(){ return {text:''}; }
  },
  'generate':{
    label:'GPT Image Generate',
    inputs:[{id:'image',type:'image',label:'image (opt)'},
            {id:'prompt',type:'prompt',label:'prompt'}],
    outputs:[{id:'image',type:'image[]',label:'image'}],
    defaultData:function(){ return {model:'gpt-image-1',size:'1024x1024',quality:'medium',status:'idle',result:null}; }
  },
  'output':{
    label:'Output / Preview',
    inputs:[{id:'image',type:'image',label:'image'}],
    outputs:[],
    defaultData:function(){ return {projectName:'',imageDataUrl:''}; }
  }
};

/* ─── get connected value ───────────────────────────────────── */
function getConnectedValue(node, portId){
  // find edges targeting this node/port
  var results=[];
  state.edges.forEach(function(e){
    if(e.toNodeId===node.id && e.toPort===portId){
      var srcNode=state.nodes.find(function(n){ return n.id===e.fromNodeId; });
      if(!srcNode) return;
      if(e.fromPort==='images'||e.fromPort==='image'){
        // image data
        if(srcNode.type==='image-source') results=results.concat(srcNode.data.images||[]);
        if(srcNode.type==='generate' && srcNode.data.result) results.push({name:'generated.png',dataUrl:srcNode.data.result});
      }
      if(e.fromPort==='text'){
        results.push(srcNode.data.text||'');
      }
    }
  });
  if(results.length===0) return null;
  // if text, join
  if(typeof results[0]==='string') return results.join('\n');
  return results;
}

/* ─── localStorage flows ────────────────────────────────────── */
var LS_KEY='ajw_gi_flows';
function loadFlows(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY)||'[]'); }catch(e){ return []; }
}
function saveFlows(flows){
  try{ localStorage.setItem(LS_KEY,JSON.stringify(flows)); }catch(e){}
}
function saveCurrentFlow(name){
  var flows=loadFlows();
  var existing=flows.find(function(f){ return f.name===name; });
  var flow={
    id:existing?existing.id:uid(),
    name:name,
    nodes:state.nodes.map(function(n){ return {id:n.id,type:n.type,x:n.x,y:n.y,data:JSON.parse(JSON.stringify(n.data))}; }),
    edges:state.edges.map(function(e){ return Object.assign({},e); }),
    updatedAt:Date.now()
  };
  if(existing){ Object.assign(existing,flow); } else { flows.push(flow); }
  saveFlows(flows);
}
function loadFlow(flow){
  state.nodes=flow.nodes.map(function(n){
    var def=NODE_DEFS[n.type];
    return {id:n.id,type:n.type,x:n.x,y:n.y,data:Object.assign(def?def.defaultData():{},n.data)};
  });
  state.edges=flow.edges.map(function(e){ return Object.assign({},e); });
  state.selected=null;
  state.connecting=null;
  state.pendingConnect=null;
}

/* ─── port element helpers ──────────────────────────────────── */
// Called AFTER render; we store port world-positions in state for SVG drawing
function collectPortPositions(){
  var positions={};
  state.nodes.forEach(function(node){
    var el=document.getElementById('fc-node-'+node.id);
    if(!el) return;
    var nodeRect=el.getBoundingClientRect();
    var canvasEl=document.getElementById('fc-canvas');
    if(!canvasEl) return;
    var canvasRect=canvasEl.getBoundingClientRect();

    // inputs (left side)
    var def=NODE_DEFS[node.type]||{inputs:[],outputs:[]};
    def.inputs.forEach(function(p,i){
      var portEl=document.getElementById('fc-port-'+node.id+'-in-'+p.id);
      if(!portEl) return;
      var pr=portEl.getBoundingClientRect();
      // center in world coords
      var cx=(pr.left+pr.width/2-canvasRect.left-state.view.x)/state.view.scale;
      var cy=(pr.top+pr.height/2-canvasRect.top-state.view.y)/state.view.scale;
      positions[node.id+'|in|'+p.id]={x:cx,y:cy,type:p.type,side:'in',nodeId:node.id,port:p.id};
    });
    def.outputs.forEach(function(p,i){
      var portEl=document.getElementById('fc-port-'+node.id+'-out-'+p.id);
      if(!portEl) return;
      var pr=portEl.getBoundingClientRect();
      var cx=(pr.left+pr.width/2-canvasRect.left-state.view.x)/state.view.scale;
      var cy=(pr.top+pr.height/2-canvasRect.top-state.view.y)/state.view.scale;
      positions[node.id+'|out|'+p.id]={x:cx,y:cy,type:p.type,side:'out',nodeId:node.id,port:p.id};
    });
  });
  return positions;
}

/* ─── SVG bezier for connections ────────────────────────────── */
function edgePath(x1,y1,x2,y2){
  var cx1=x1+(x2-x1)*0.5, cy1=y1;
  var cx2=x1+(x2-x1)*0.5, cy2=y2;
  return 'M'+x1+','+y1+' C'+cx1+','+cy1+' '+cx2+','+cy2+' '+x2+','+y2;
}

/* ─── main render ────────────────────────────────────────────── */
var ROOT=null;
var portPositions={};

function render(){
  if(!ROOT) return;
  var world=document.getElementById('fc-world');
  var svg=document.getElementById('fc-svg');
  if(!world||!svg) return;

  // render nodes
  world.innerHTML=state.nodes.map(function(node){ return renderNode(node); }).join('');

  // collect port positions after DOM update
  requestAnimationFrame(function(){
    portPositions=collectPortPositions();
    drawSVG(svg);
    rebindNodeEvents();
  });
}

function renderNode(node){
  var def=NODE_DEFS[node.type]||{label:node.type,inputs:[],outputs:[],defaultData:function(){return{};}};
  var isSelected=state.selected===node.id;
  var borderColor=isSelected?'#c77818':'#2a2a3e';
  var html='<div id="fc-node-'+node.id+'" class="fc-node" '+
    'style="left:'+node.x+'px;top:'+node.y+'px;width:260px;position:absolute;'+
    'background:#1a1a2e;border:2px solid '+borderColor+';border-radius:10px;'+
    'box-shadow:0 4px 16px rgba(0,0,0,.5);user-select:none;z-index:'+(isSelected?10:1)+'">'+
    // header
    '<div class="fc-node-hdr" data-nodeid="'+node.id+'" '+
    'style="background:#0d0d1a;border-radius:8px 8px 0 0;padding:0 10px;height:36px;'+
    'display:flex;align-items:center;cursor:move;gap:8px">'+
    '<span style="font-size:10px;color:#888">⣿</span>'+
    '<span style="font-size:12px;font-weight:700;color:#e2e8f0;flex:1">'+esc(def.label)+'</span>'+
    '<button data-del="'+node.id+'" title="Hapus" style="background:none;border:none;color:#666;cursor:pointer;font-size:14px;padding:0;line-height:1">×</button>'+
    '</div>'+
    // port row (inputs left, outputs right, overlapping sides)
    '<div style="position:relative">'+
    // input ports (absolutely placed on left)
    def.inputs.map(function(p,i){
      return '<div id="fc-port-'+node.id+'-in-'+p.id+'" class="fc-port fc-port-in" '+
        'data-nodeid="'+node.id+'" data-port="'+p.id+'" data-side="in" '+
        'title="'+esc(p.label)+' ('+p.type+')" '+
        'style="position:absolute;left:-6px;top:'+(16+i*22)+'px;'+
        'width:12px;height:12px;border-radius:50%;'+
        'background:'+portColor(p.type)+';border:2px solid #0d0d1a;'+
        'cursor:crosshair;z-index:20"></div>';
    }).join('')+
    // output ports (absolutely placed on right)
    def.outputs.map(function(p,i){
      return '<div id="fc-port-'+node.id+'-out-'+p.id+'" class="fc-port fc-port-out" '+
        'data-nodeid="'+node.id+'" data-port="'+p.id+'" data-side="out" '+
        'title="'+esc(p.label)+' ('+p.type+')" '+
        'style="position:absolute;right:-6px;top:'+(16+i*22)+'px;'+
        'width:12px;height:12px;border-radius:50%;'+
        'background:'+portColor(p.type)+';border:2px solid #0d0d1a;'+
        'cursor:crosshair;z-index:20"></div>';
    }).join('')+
    // body
    '<div class="fc-node-body" style="padding:10px 14px 12px;color:#ccc;font-size:12px;'+
    'min-height:'+(Math.max(def.inputs.length,def.outputs.length)*22+16)+'px">'+
    renderNodeBody(node)+
    '</div>'+
    '</div>'+
    '</div>';
  return html;
}

function renderNodeBody(node){
  switch(node.type){
    case 'image-source': return renderImageSourceBody(node);
    case 'prompt': return renderPromptBody(node);
    case 'generate': return renderGenerateBody(node);
    case 'output': return renderOutputBody(node);
    default: return '<em>Unknown node type</em>';
  }
}

function renderImageSourceBody(node){
  var imgs=node.data.images||[];
  var thumbs=imgs.slice(0,4).map(function(img){
    return '<img src="'+img.dataUrl+'" style="width:54px;height:54px;object-fit:cover;border-radius:4px;border:1px solid #333" title="'+esc(img.name)+'">';
  }).join('');
  var more=imgs.length>4?'<span style="color:#888;font-size:10px">+'+( imgs.length-4)+' more</span>':'';
  return '<div style="text-align:center;border:2px dashed #333;border-radius:6px;padding:8px;cursor:pointer;color:#666;font-size:11px;margin-bottom:8px" '+
    'data-dropzone="'+node.id+'" id="fc-dz-'+node.id+'">'+
    (imgs.length===0?'<div>Drop images here</div>':'<div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center">'+thumbs+more+'</div>')+
    '</div>'+
    '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">'+
    '<button data-upload="'+node.id+'" style="'+btnStyle('#2a2a4e','#60a5fa')+'">Upload</button>'+
    '<label style="display:flex;align-items:center;gap:4px;font-size:11px;color:#aaa;cursor:pointer">'+
    '<input type="checkbox" '+(node.data.isBatch?'checked':'')+' data-batch="'+node.id+'"> Batch</label>'+
    '<span style="color:#888;font-size:10px">'+imgs.length+' image(s)</span>'+
    '</div>'+
    '<input type="file" id="fc-file-'+node.id+'" accept="image/*" multiple style="display:none">';
}

function renderPromptBody(node){
  return '<textarea id="fc-ta-'+node.id+'" placeholder="Tulis prompt di sini..." '+
    'style="width:100%;box-sizing:border-box;min-height:80px;background:#0d0d1a;'+
    'border:1px solid #333;border-radius:4px;color:#e2e8f0;font-size:12px;padding:6px;resize:vertical;font-family:inherit">'+
    esc(node.data.text||'')+
    '</textarea>';
}

function renderGenerateBody(node){
  var statusColor={idle:'#888',running:'#60a5fa',done:'#4ade80',error:'#f87171'}[node.data.status]||'#888';
  var statusText={idle:'Siap',running:'Memproses...',done:'Selesai',error:'Gagal'}[node.data.status]||node.data.status;
  return '<div style="display:flex;flex-direction:column;gap:6px">'+
    '<div style="display:flex;gap:4px;align-items:center">'+
    '<span style="font-size:10px;color:#888;width:46px">Model</span>'+
    '<select data-genfield="'+node.id+'" data-field="model" style="'+selectStyle()+'flex:1">'+
    '<option value="gpt-image-1" '+(node.data.model==='gpt-image-1'?'selected':'')+'>gpt-image-1</option>'+
    '</select></div>'+
    '<div style="display:flex;gap:4px;align-items:center">'+
    '<span style="font-size:10px;color:#888;width:46px">Size</span>'+
    '<select data-genfield="'+node.id+'" data-field="size" style="'+selectStyle()+'flex:1">'+
    ['1024x1024','1792x1024','1024x1792'].map(function(s){
      return '<option value="'+s+'" '+(node.data.size===s?'selected':'')+'>'+s+'</option>';
    }).join('')+
    '</select></div>'+
    '<div style="display:flex;gap:4px;align-items:center">'+
    '<span style="font-size:10px;color:#888;width:46px">Quality</span>'+
    '<select data-genfield="'+node.id+'" data-field="quality" style="'+selectStyle()+'flex:1">'+
    ['low','medium','high','auto'].map(function(q){
      return '<option value="'+q+'" '+(node.data.quality===q?'selected':'')+'>'+q+'</option>';
    }).join('')+
    '</select></div>'+
    '<div style="display:flex;align-items:center;gap:8px;margin-top:4px">'+
    '<button data-generate="'+node.id+'" style="'+btnStyle('#c77818','#fff')+'flex:1;font-weight:700" '+
    (node.data.status==='running'?'disabled':'')+'>'+
    (node.data.status==='running'?'⏳ Generating...':'⚡ Generate')+
    '</button>'+
    '<span style="font-size:10px;color:'+statusColor+'">●&nbsp;'+esc(statusText)+'</span>'+
    '</div>'+
    (node.data.result?'<img src="'+node.data.result+'" style="width:100%;border-radius:4px;margin-top:4px">':'')+
    '</div>';
}

function renderOutputBody(node){
  if(node.data.imageDataUrl){
    return '<img src="'+node.data.imageDataUrl+'" style="width:100%;border-radius:6px;margin-bottom:8px">'+
      '<div style="display:flex;gap:6px">'+
      '<button data-outdown="'+node.id+'" style="'+btnStyle('#1e293b','#4ade80')+'flex:1">⬇ Download</button>'+
      '</div>';
  }
  return '<div style="text-align:center;color:#555;font-size:11px;padding:20px 0">Connect a Generate node to see output here</div>';
}

function btnStyle(bg,color){
  return 'background:'+bg+';color:'+color+';border:1px solid '+color+'33;border-radius:4px;'+
    'padding:5px 10px;font-size:11px;cursor:pointer;';
}
function selectStyle(){
  return 'background:#0d0d1a;color:#e2e8f0;border:1px solid #333;border-radius:4px;'+
    'font-size:11px;padding:3px 4px;';
}

/* ─── SVG drawing ───────────────────────────────────────────── */
function drawSVG(svg){
  var paths=[];
  // existing edges
  state.edges.forEach(function(e,idx){
    var fromKey=e.fromNodeId+'|out|'+e.fromPort;
    var toKey=e.toNodeId+'|in|'+e.toPort;
    var fp=portPositions[fromKey];
    var tp=portPositions[toKey];
    if(!fp||!tp) return;
    // convert world coords to SVG coords (SVG is same scale as world)
    var x1=fp.x, y1=fp.y, x2=tp.x, y2=tp.y;
    paths.push('<path data-edgeidx="'+idx+'" d="'+edgePath(x1,y1,x2,y2)+'" '+
      'stroke="'+portColor(fp.type)+'" stroke-width="2" fill="none" opacity="0.85" '+
      'stroke-dasharray="0" cursor="pointer" '+
      'oncontextmenu="event.stopPropagation();window._fcDeleteEdge('+idx+');return false"/>');
    // invisible thick hit area
    paths.push('<path d="'+edgePath(x1,y1,x2,y2)+'" stroke="transparent" stroke-width="10" fill="none" '+
      'cursor="pointer" oncontextmenu="event.stopPropagation();window._fcDeleteEdge('+idx+');return false"/>');
  });
  // temp connection line
  if(state.tempLine){
    var t=state.tempLine;
    paths.push('<line x1="'+t.x1+'" y1="'+t.y1+'" x2="'+t.x2+'" y2="'+t.y2+'" '+
      'stroke="#c77818" stroke-width="2" stroke-dasharray="6 3" opacity="0.8"/>');
  }
  svg.innerHTML=paths.join('');
}

/* ─── event binding (after render) ─────────────────────────── */
function rebindNodeEvents(){
  var world=document.getElementById('fc-world');
  if(!world) return;

  // drag headers
  world.querySelectorAll('.fc-node-hdr').forEach(function(hdr){
    hdr.addEventListener('mousedown',function(e){
      if(e.button!==0) return;
      var nid=hdr.getAttribute('data-nodeid');
      var node=state.nodes.find(function(n){return n.id===nid;});
      if(!node) return;
      state.selected=nid;
      state.dragging={nodeId:nid,startX:e.clientX,startY:e.clientY,origX:node.x,origY:node.y};
      e.stopPropagation();
    });
  });

  // delete buttons
  world.querySelectorAll('[data-del]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var nid=btn.getAttribute('data-del');
      state.nodes=state.nodes.filter(function(n){return n.id!==nid;});
      state.edges=state.edges.filter(function(e){return e.fromNodeId!==nid&&e.toNodeId!==nid;});
      if(state.selected===nid) state.selected=null;
      render();
    });
  });

  // port click for connections
  world.querySelectorAll('.fc-port').forEach(function(port){
    port.addEventListener('mousedown',function(e){
      e.stopPropagation();
      e.preventDefault();
      var nid=port.getAttribute('data-nodeid');
      var pid=port.getAttribute('data-port');
      var side=port.getAttribute('data-side');
      var pr=port.getBoundingClientRect();
      var canvasEl=document.getElementById('fc-canvas');
      var cr=canvasEl.getBoundingClientRect();
      var wx=(pr.left+pr.width/2-cr.left-state.view.x)/state.view.scale;
      var wy=(pr.top+pr.height/2-cr.top-state.view.y)/state.view.scale;

      if(!state.pendingConnect){
        // start connection
        state.pendingConnect={nodeId:nid,port:pid,side:side,wx:wx,wy:wy};
        state.tempLine={x1:wx,y1:wy,x2:wx,y2:wy};
      } else {
        // finish connection
        var from=state.pendingConnect;
        if(from.nodeId===nid){
          // same node, cancel
          state.pendingConnect=null; state.tempLine=null;
          drawSVG(document.getElementById('fc-svg'));
          return;
        }
        // determine from/to
        var fromInfo, toInfo;
        if(from.side==='out' && side==='in'){
          fromInfo=from; toInfo={nodeId:nid,port:pid};
        } else if(from.side==='in' && side==='out'){
          fromInfo={nodeId:nid,port:pid}; toInfo=from;
        } else {
          state.pendingConnect=null; state.tempLine=null;
          drawSVG(document.getElementById('fc-svg'));
          return;
        }
        // type check
        var srcDef=NODE_DEFS[state.nodes.find(function(n){return n.id===fromInfo.nodeId;}).type];
        var dstDef=NODE_DEFS[state.nodes.find(function(n){return n.id===toInfo.nodeId;}).type];
        var outPort=srcDef.outputs.find(function(p){return p.id===fromInfo.port;});
        var inPort=dstDef.inputs.find(function(p){return p.id===toInfo.port;});
        if(!outPort||!inPort||!portsCompatible(outPort.type,inPort.type)){
          state.pendingConnect=null; state.tempLine=null;
          drawSVG(document.getElementById('fc-svg'));
          return;
        }
        // remove duplicate edges targeting same input
        state.edges=state.edges.filter(function(e){ return !(e.toNodeId===toInfo.nodeId&&e.toPort===toInfo.port); });
        state.edges.push({fromNodeId:fromInfo.nodeId,fromPort:fromInfo.port,toNodeId:toInfo.nodeId,toPort:toInfo.port});
        state.pendingConnect=null; state.tempLine=null;
        render();
      }
    });
  });

  // textarea changes
  world.querySelectorAll('textarea[id^="fc-ta-"]').forEach(function(ta){
    var nid=ta.id.replace('fc-ta-','');
    ta.addEventListener('input',function(){
      var node=state.nodes.find(function(n){return n.id===nid;});
      if(node) node.data.text=ta.value;
    });
    ta.addEventListener('mousedown',function(e){ e.stopPropagation(); });
  });

  // generate selects
  world.querySelectorAll('select[data-genfield]').forEach(function(sel){
    sel.addEventListener('change',function(){
      var nid=sel.getAttribute('data-genfield');
      var field=sel.getAttribute('data-field');
      var node=state.nodes.find(function(n){return n.id===nid;});
      if(node) node.data[field]=sel.value;
    });
    sel.addEventListener('mousedown',function(e){ e.stopPropagation(); });
  });

  // generate buttons
  world.querySelectorAll('[data-generate]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var nid=btn.getAttribute('data-generate');
      var node=state.nodes.find(function(n){return n.id===nid;});
      if(!node) return;
      runGenerate(node);
    });
  });

  // upload buttons
  world.querySelectorAll('[data-upload]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var nid=btn.getAttribute('data-upload');
      var fi=document.getElementById('fc-file-'+nid);
      if(fi) fi.click();
    });
  });

  // file inputs
  world.querySelectorAll('input[id^="fc-file-"]').forEach(function(fi){
    var nid=fi.id.replace('fc-file-','');
    fi.addEventListener('change',function(){
      handleFileInput(nid, fi.files);
    });
  });

  // batch checkboxes
  world.querySelectorAll('[data-batch]').forEach(function(cb){
    cb.addEventListener('change',function(e){
      e.stopPropagation();
      var nid=cb.getAttribute('data-batch');
      var node=state.nodes.find(function(n){return n.id===nid;});
      if(node) node.data.isBatch=cb.checked;
    });
    cb.addEventListener('mousedown',function(e){ e.stopPropagation(); });
  });

  // drop zones
  world.querySelectorAll('[data-dropzone]').forEach(function(dz){
    var nid=dz.getAttribute('data-dropzone');
    dz.addEventListener('dragover',function(e){ e.preventDefault(); dz.style.borderColor='#c77818'; });
    dz.addEventListener('dragleave',function(){ dz.style.borderColor='#333'; });
    dz.addEventListener('drop',function(e){
      e.preventDefault();
      dz.style.borderColor='#333';
      handleFileInput(nid, e.dataTransfer.files);
    });
  });

  // download buttons
  world.querySelectorAll('[data-outdown]').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var nid=btn.getAttribute('data-outdown');
      var node=state.nodes.find(function(n){return n.id===nid;});
      if(!node||!node.data.imageDataUrl) return;
      var a=document.createElement('a');
      a.href=node.data.imageDataUrl;
      a.download='ajw-generated-'+Date.now()+'.png';
      a.click();
    });
  });

  // node click for selection
  world.querySelectorAll('.fc-node').forEach(function(nodeEl){
    nodeEl.addEventListener('mousedown',function(e){
      var nid=nodeEl.id.replace('fc-node-','');
      if(state.selected!==nid){
        state.selected=nid;
        // re-render just the border colors without full re-render
        world.querySelectorAll('.fc-node').forEach(function(el){
          el.style.borderColor=el.id==='fc-node-'+nid?'#c77818':'#2a2a3e';
        });
      }
    });
  });
}

/* ─── file handling ─────────────────────────────────────────── */
function handleFileInput(nodeId, files){
  if(!files||!files.length) return;
  var node=state.nodes.find(function(n){return n.id===nodeId;});
  if(!node) return;
  var arr=Array.prototype.slice.call(files);
  var pending=arr.length;
  arr.forEach(function(f){
    var reader=new FileReader();
    reader.onload=function(ev){
      node.data.images.push({name:f.name,dataUrl:ev.target.result});
      pending--;
      if(pending===0) render();
    };
    reader.readAsDataURL(f);
  });
}

/* ─── generate API call ─────────────────────────────────────── */
async function runGenerate(node){
  var cfg=getCfg();
  var apiKey=cfg.openaiKey||cfg.openAiKey||'';
  if(!apiKey){
    alert('OpenAI API key tidak ditemukan di konfigurasi.');
    return;
  }
  node.data.status='running';
  node.data.result=null;
  render();

  try{
    var promptText=getConnectedValue(node,'prompt')||'';
    var images=getConnectedValue(node,'image')||[];

    var res;
    if(images.length>0){
      var fd=new FormData();
      fd.append('model',node.data.model);
      fd.append('prompt',promptText);
      fd.append('n','1');
      fd.append('size',node.data.size);
      // convert first image dataUrl to Blob
      var imgObj=images[0];
      if(imgObj && imgObj.dataUrl){
        var blob=dataUrlToBlob(imgObj.dataUrl);
        fd.append('image[]',blob,imgObj.name||'image.png');
      }
      res=await fetch('https://api.openai.com/v1/images/edits',{
        method:'POST',
        headers:{'Authorization':'Bearer '+apiKey},
        body:fd
      });
    } else {
      res=await fetch('https://api.openai.com/v1/images/generations',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
        body:JSON.stringify({
          model:node.data.model,
          prompt:promptText,
          n:1,
          size:node.data.size,
          quality:node.data.quality,
          output_format:'png'
        })
      });
    }

    var json=await res.json();
    if(!res.ok) throw new Error(json.error&&json.error.message?json.error.message:'API error '+res.status);
    var b64=json.data&&json.data[0]&&json.data[0].b64_json;
    if(!b64) throw new Error('No image data in response');
    node.data.result='data:image/png;base64,'+b64;
    node.data.status='done';

    // propagate to connected output nodes
    state.edges.forEach(function(e){
      if(e.fromNodeId===node.id && e.fromPort==='image'){
        var tgt=state.nodes.find(function(n){return n.id===e.toNodeId;});
        if(tgt && tgt.type==='output'){
          tgt.data.imageDataUrl=node.data.result;
        }
      }
    });

  } catch(err){
    node.data.status='error';
    console.error('[AJW FlowCanvas] Generate error:',err);
    alert('Generate error: '+err.message);
  }
  render();
}

/* ─── toolbar actions ───────────────────────────────────────── */
function addNode(type){
  var def=NODE_DEFS[type];
  if(!def) return;
  // place in view center
  var cx=(300-state.view.x)/state.view.scale;
  var cy=(200-state.view.y)/state.view.scale;
  state.nodes.push({
    id:uid(),
    type:type,
    x:cx + (Math.random()*60-30),
    y:cy + (Math.random()*60-30),
    data:def.defaultData()
  });
  render();
}

function doSaveFlow(){
  var name=prompt('Nama flow:','My Flow '+(loadFlows().length+1));
  if(!name) return;
  saveCurrentFlow(name.trim());
  refreshLoadDropdown();
}

function doLoadFlow(id){
  var flows=loadFlows();
  var flow=flows.find(function(f){return f.id===id;});
  if(!flow) return;
  loadFlow(flow);
  render();
}

function doClearCanvas(){
  if(!confirm('Kosongkan canvas? Semua node akan dihapus.')) return;
  state.nodes=[];
  state.edges=[];
  state.selected=null;
  state.connecting=null;
  state.pendingConnect=null;
  state.tempLine=null;
  render();
}

function refreshLoadDropdown(){
  var flows=loadFlows();
  var dd=document.getElementById('fc-load-dd');
  if(!dd) return;
  dd.innerHTML='<option value="">— Pilih Flow —</option>'+
    flows.map(function(f){
      return '<option value="'+esc(f.id)+'">'+esc(f.name)+' ('+new Date(f.updatedAt).toLocaleDateString()+')</option>';
    }).join('');
}

/* ─── canvas event handlers ─────────────────────────────────── */
var _panStart=null;

function initCanvasEvents(canvas){
  // pan on mousedown on canvas (not on node)
  canvas.addEventListener('mousedown',function(e){
    if(e.button!==0) return;
    // cancel pending connect if clicking empty canvas
    if(state.pendingConnect){
      state.pendingConnect=null; state.tempLine=null;
      drawSVG(document.getElementById('fc-svg'));
      return;
    }
    if(e.target===canvas || e.target===document.getElementById('fc-world') || e.target===document.getElementById('fc-svg')){
      _panStart={x:e.clientX,y:e.clientY,vx:state.view.x,vy:state.view.y};
      state.selected=null;
    }
  });

  document.addEventListener('mousemove',function(e){
    if(_panStart){
      state.view.x=_panStart.vx+(e.clientX-_panStart.x);
      state.view.y=_panStart.vy+(e.clientY-_panStart.y);
      applyView();
      return;
    }
    if(state.dragging){
      var d=state.dragging;
      var dx=(e.clientX-d.startX)/state.view.scale;
      var dy=(e.clientY-d.startY)/state.view.scale;
      var node=state.nodes.find(function(n){return n.id===d.nodeId;});
      if(node){ node.x=d.origX+dx; node.y=d.origY+dy; }
      // move node element directly (no full re-render)
      var el=document.getElementById('fc-node-'+d.nodeId);
      if(el){ el.style.left=node.x+'px'; el.style.top=node.y+'px'; }
      // redraw connections
      requestAnimationFrame(function(){
        portPositions=collectPortPositions();
        drawSVG(document.getElementById('fc-svg'));
      });
      return;
    }
    if(state.pendingConnect && state.tempLine){
      var canvasEl=document.getElementById('fc-canvas');
      var cr=canvasEl.getBoundingClientRect();
      var wx=(e.clientX-cr.left-state.view.x)/state.view.scale;
      var wy=(e.clientY-cr.top-state.view.y)/state.view.scale;
      state.tempLine.x2=wx; state.tempLine.y2=wy;
      drawSVG(document.getElementById('fc-svg'));
    }
  });

  document.addEventListener('mouseup',function(){
    if(_panStart) _panStart=null;
    if(state.dragging){ state.dragging=null; }
  });

  // zoom
  canvas.addEventListener('wheel',function(e){
    e.preventDefault();
    var cr=canvas.getBoundingClientRect();
    var mx=e.clientX-cr.left;
    var my=e.clientY-cr.top;
    var delta=e.deltaY<0?1.1:0.91;
    var newScale=Math.min(2.0,Math.max(0.3,state.view.scale*delta));
    var ratio=newScale/state.view.scale;
    state.view.x=mx-(mx-state.view.x)*ratio;
    state.view.y=my-(my-state.view.y)*ratio;
    state.view.scale=newScale;
    applyView();
  },{passive:false});

  // right-click on canvas to cancel pending connect
  canvas.addEventListener('contextmenu',function(e){
    if(state.pendingConnect){
      e.preventDefault();
      state.pendingConnect=null; state.tempLine=null;
      drawSVG(document.getElementById('fc-svg'));
    }
  });
}

function applyView(){
  var world=document.getElementById('fc-world');
  var svg=document.getElementById('fc-svg');
  if(!world) return;
  var t='translate('+state.view.x+'px,'+state.view.y+'px) scale('+state.view.scale+')';
  world.style.transform=t;
  if(svg){
    svg.style.transform=t;
  }
}

/* ─── global helpers accessible from SVG onclick ────────────── */
window._fcDeleteEdge=function(idx){
  state.edges.splice(idx,1);
  render();
};

/* ─── mount ─────────────────────────────────────────────────── */
window.AJWFlowCanvasMount=function(root){
  if(!root) return;
  ROOT=root;

  // reset state
  state.nodes=[];
  state.edges=[];
  state.view={x:0,y:0,scale:1};
  state.dragging=null;
  state.connecting=null;
  state.pendingConnect=null;
  state.selected=null;
  state.tempLine=null;

  // inject CSS
  if(!document.getElementById('fc-css')){
    var st=document.createElement('style');
    st.id='fc-css';
    st.textContent=[
      '.fc-node { transition: box-shadow .15s; }',
      '.fc-node:hover { box-shadow: 0 6px 24px rgba(0,0,0,.7) !important; }',
      '.fc-port:hover { transform: scale(1.4); filter: brightness(1.3); }',
      '.fc-port { transition: transform .1s, filter .1s; }',
      '#fc-toolbar button { cursor:pointer; border-radius:4px; padding:5px 10px; font-size:11px; font-weight:700; border:1px solid #333; }',
      '#fc-toolbar select { cursor:pointer; border-radius:4px; padding:5px 6px; font-size:11px; border:1px solid #333; background:#1a1a2e; color:#e2e8f0; }',
    ].join('\n');
    document.head.appendChild(st);
  }

  root.innerHTML='<div style="display:flex;flex-direction:column;height:100%">'+
    // toolbar
    '<div id="fc-toolbar" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;'+
    'padding:8px 10px;background:#111122;border:1px solid #2a2a3e;border-radius:8px 8px 0 0;'+
    'border-bottom:none">'+
    '<button id="fc-add-imgsrc" style="background:#1a3a1a;color:#4ade80">+ Gambar Input</button>'+
    '<button id="fc-add-prompt" style="background:#1a2a3a;color:#60a5fa">+ Prompt</button>'+
    '<button id="fc-add-generate" style="background:#3a1a00;color:#c77818">+ Generate</button>'+
    '<button id="fc-add-output" style="background:#2a1a3a;color:#a78bfa">+ Output</button>'+
    '<span style="color:#444;padding:0 4px">|</span>'+
    '<button id="fc-save-btn" style="background:#1a1a2e;color:#e2e8f0">💾 Simpan Flow</button>'+
    '<select id="fc-load-dd" style="min-width:140px"><option value="">— Muat Flow —</option></select>'+
    '<button id="fc-clear-btn" style="background:#3a1a1a;color:#f87171">🗑 Kosongkan</button>'+
    '<span style="color:#666;font-size:10px;margin-left:auto">Scroll=zoom · Drag=pan · Port click=connect · Right-click edge=delete</span>'+
    '</div>'+
    // canvas
    '<div id="fc-canvas" style="position:relative;overflow:hidden;width:100%;flex:1;'+
    'min-height:600px;background:#0f0f0f;border-radius:0 0 12px 12px;'+
    'border:1px solid #2a2a3e;cursor:default">'+
    // world div
    '<div id="fc-world" style="position:absolute;transform-origin:0 0;width:0;height:0"></div>'+
    // SVG overlay
    '<svg id="fc-svg" style="position:absolute;top:0;left:0;width:100%;height:100%;'+
    'pointer-events:none;transform-origin:0 0;overflow:visible"></svg>'+
    '</div>'+
    '</div>';

  // toolbar events
  document.getElementById('fc-add-imgsrc').onclick=function(){ addNode('image-source'); };
  document.getElementById('fc-add-prompt').onclick=function(){ addNode('prompt'); };
  document.getElementById('fc-add-generate').onclick=function(){ addNode('generate'); };
  document.getElementById('fc-add-output').onclick=function(){ addNode('output'); };
  document.getElementById('fc-save-btn').onclick=doSaveFlow;
  document.getElementById('fc-clear-btn').onclick=doClearCanvas;
  document.getElementById('fc-load-dd').addEventListener('change',function(){
    var id=this.value;
    if(id) doLoadFlow(id);
    this.value='';
  });

  refreshLoadDropdown();
  initCanvasEvents(document.getElementById('fc-canvas'));
  render();
};

})();
