(function(){
  if(window.__AJW_NAV_RESTRUCTURE_V1__) return;
  window.__AJW_NAV_RESTRUCTURE_V1__ = true;

  var legacyNav = typeof window._navTo === 'function' ? window._navTo : null;
  var legacyBuildTabBar = typeof window.buildTabBar === 'function' ? window.buildTabBar : null;
  var sidebarCollapsed = false;
  var searchActiveIndex = -1;
  try{ sidebarCollapsed = false; localStorage.removeItem('ajw_sidebar_collapsed'); }catch(e){}

  var state = {
    section: 'dashboard',
    item: 'overview',
    hoverTimer: null,
    hideTimer: null
  };

  var NAV = [
    {
      id:'dashboard', label:'Dashboard', icon:'DB', defaultItem:'overview',
      children:[
        {id:'overview', label:'Overview'}
      ]
    },
    {
      id:'operasional', label:'Operasional', icon:'OP', defaultItem:'overview',
      children:[
        {id:'overview', label:'Overview Operasional'},
        {id:'pick', label:'Picking List'},
        {id:'materials', label:'Belanja Material'},
        {id:'refund', label:'Pengembalian Dana'},
        {id:'complaint', label:'Komplain'},
        {id:'request', label:'Request'},
        {id:'blastmkt', label:'Blast Marketing'},
        {id:'activity', label:'Riwayat Aktivitas'}
      ]
    },
    {
      id:'hr', label:'HR', icon:'HR', defaultItem:'dash',
      children:[
        {id:'dash', label:'Desk HR'},
        {id:'eval', label:'Penilaian'},
        {id:'payroll', label:'Payroll'},
        {id:'karyawan', label:'Karyawan'},
        {id:'statistik', label:'Statistik'},
        {id:'sop', label:'SOP & Guides'},
        {id:'riw', label:'Riwayat'}
      ]
    },
    {
      id:'finance', label:'Finance', icon:'FI', defaultItem:'dash',
      children:[
        {id:'dash', label:'Desk Finance'},
        {id:'income', label:'Pendapatan'},
        {id:'expense', label:'Pengeluaran'},
        {id:'hutang', label:'Hutang Supplier'},
        {id:'asset', label:'Aset'},
        {id:'cashflow', label:'Cash Flow'},
        {id:'lapbul', label:'Laporan Bulanan'},
        {id:'profit', label:'Profit Analysis'}
      ]
    },
    {
      id:'content', label:'Content', icon:'CT', defaultItem:'dashboard',
      children:[
        {id:'dashboard', label:'Dashboard Content'},
        {id:'listing', label:'Listing Images'},
        {id:'aplus', label:'A+ Content'},
        {id:'multi', label:'Multi-Angle'},
        {id:'requests', label:'Requests'},
        {id:'adminapi', label:'Admin API'},
        {id:'prompt', label:'AI Prompt'},
        {id:'video', label:'Generate Video'}
      ]
    },
    {
      id:'analytics', label:'Analytics', icon:'AN', defaultItem:'dash',
      children:[
        {id:'dash', label:'Dashboard'},
        {id:'sales', label:'Penjualan'},
        {id:'customers', label:'Customer Data'},
        {id:'promo', label:'Promo'},
        {id:'products', label:'Rincian Produk'},
        {id:'service', label:'Layanan'}
      ]
    },
    {
      id:'ai', label:'AI System', icon:'AI', defaultItem:'agent',
      children:[
        {id:'agent', label:'Agent AI'},
        {id:'automation', label:'Automation'},
        {id:'bridge', label:'OpenClaw Bridge'}
      ]
    },
    {
      id:'development', label:'Development', icon:'DV', defaultItem:'resources',
      children:[
        {id:'resources', label:'Resources'},
        {id:'vision', label:'Vision Board'},
        {id:'learning', label:'Learning Library'},
        {id:'ideas', label:'Ideation'},
        {id:'audit', label:'Business Audit'},
        {id:'swot', label:'SWOT'},
        {id:'marketing', label:'Marketing Hub'},
        {id:'documents', label:'Dokumentasi'},
        {id:'tasks', label:'Task List'}
      ]
    },
    {
      id:'settings', label:'Settings', icon:'ST', defaultItem:'general',
      children:[
        {id:'general', label:'Umum & Tema'},
        {id:'integrations', label:'Integrasi'},
        {id:'apikey', label:'API Key'},
        {id:'supabase', label:'Supabase'},
        {id:'data', label:'Data & Backup'},
        {id:'aios', label:'AI Core & Safety'}
      ]
    }
  ];

  var SECTION_BY_ID = NAV.reduce(function(acc, section){ acc[section.id]=section; return acc; }, {});

  function css(){
    if(document.getElementById('AJW-NAV-RESTRUCTURE-CSS')) return;
    var st = document.createElement('style');
    st.id = 'AJW-NAV-RESTRUCTURE-CSS';
    st.textContent = [
      ':root{--primary:#16a34a;--accent:#16a34a;--soft-green:#dcfce7;--bg-main:#f8fafc;--bg-card:#ffffff;--text-main:#111827;--text-muted:#6b7280;--text-light:#9ca3af;--border:#e5e7eb;--border-soft:#ececec;--warning:#f59e0b;--error:#ef4444;--info:#3b82f6;--purple:#a855f7;--radius:14px;--app-bg:var(--bg-main);--surface:var(--bg-card);--surface-muted:#f3f4f6;--text-subtle:var(--text-light);--hover:#f3f4f6;--active:#ecfdf5;--sidebar-w:220px;--sidebar-expanded:220px;--sidebar-w-collapsed:220px;--content-max:1480px;}',
      'html,body{background:var(--app-bg)!important;color:var(--text-main)!important;font-family:Inter,Geist,"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;font-size:13px!important;line-height:1.4!important;}',
      'body.ajw-nav-shell{min-height:100vh;}',
      'body.ajw-nav-shell .tabs,body.ajw-nav-shell #TABS{display:none!important;}',
      'body.ajw-nav-shell .topbar{position:sticky!important;top:0!important;z-index:700!important;left:0!important;right:0!important;height:64px!important;margin:0!important;padding:0 20px 0 calc(var(--sidebar-w) + 20px)!important;background:rgba(255,255,255,.94)!important;backdrop-filter:blur(14px)!important;border-bottom:1px solid var(--border)!important;box-shadow:none!important;}',
      'body.ajw-sidebar-collapsed .topbar{padding-left:calc(var(--sidebar-w-collapsed) + 28px)!important;}',
      '.ajw-topbar-inner{height:64px;display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:var(--content-max);margin:0 auto;width:100%;}',
      '.ajw-workspace-switcher{display:flex;align-items:center;gap:8px;min-width:188px;font-size:13px;font-weight:500;color:var(--text-main);}',
      '.ajw-workspace-dot{width:26px;height:26px;border-radius:6px;background:#333;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;letter-spacing:.03em;}',
      '.ajw-topbar-search{flex:1;max-width:720px;position:relative;}',
      '.ajw-topbar-search input{width:100%;height:38px;border:1px solid var(--border);background:#fff;color:var(--text-main);border-radius:10px;padding:0 70px 0 34px;font-size:13px;outline:none;box-shadow:none;}',
      '.ajw-kbd{position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--text-muted);background:#f8fafc;border:1px solid var(--border);border-radius:6px;padding:2px 6px;}',
      '.ajw-topbar-search input:focus{border-color:#BDBDBD;box-shadow:0 0 0 3px rgba(31,31,31,.05);}',
      '.ajw-topbar-search:before{content:"";position:absolute;left:14px;top:50%;width:13px;height:13px;border:2px solid #8A8A8A;border-radius:50%;transform:translateY(-56%);}',
      '.ajw-topbar-search:after{content:"";position:absolute;left:26px;top:27px;width:7px;height:2px;background:#8A8A8A;transform:rotate(45deg);border-radius:999px;}',
      '#AJW-SEARCH-RESULTS{position:absolute;left:0;right:0;top:40px;z-index:1300;background:#fff;border:1px solid var(--border);border-radius:8px;box-shadow:0 14px 34px rgba(31,31,31,.12);padding:6px;display:none;max-height:380px;overflow:auto;}',
      '#AJW-SEARCH-RESULTS.is-open{display:block;}',
      '.ajw-search-empty{padding:14px 12px;color:var(--text-muted);font-size:14px;line-height:1.5;}',
      '.ajw-search-item{width:100%;border:0;background:#fff;color:var(--text-main);border-radius:6px;padding:8px 9px;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;cursor:pointer;}',
      '.ajw-search-item:hover,.ajw-search-item.is-active{background:var(--hover);}',
      '.ajw-search-main{display:block;font-size:13px;font-weight:500;color:var(--text-main);}',
      '.ajw-search-path{display:block;font-size:12px;font-weight:400;color:var(--text-muted);margin-top:1px;}',
      '.ajw-search-chip{font-size:11px;font-weight:800;color:var(--text-subtle);border:1px solid var(--border);border-radius:999px;padding:4px 8px;background:#FAFAFA;white-space:nowrap;}',
      '.ajw-topbar-actions{display:flex;align-items:center;gap:8px;}',
      '.ajw-topbar-btn{height:36px;border:1px solid var(--border);background:#fff;color:var(--text-main);border-radius:10px;padding:0 12px;font-size:13px;font-weight:500;display:inline-flex;align-items:center;gap:8px;cursor:pointer;transition:background .16s ease,border-color .16s ease,transform .16s ease;}',
      '.ajw-sync-pill{height:36px;border:1px solid var(--border);background:#f0fdf4;color:#166534;border-radius:999px;padding:0 12px;font-size:12px;font-weight:500;display:inline-flex;align-items:center;gap:7px;}',
      '.ajw-sync-pill:before{content:"";width:7px;height:7px;border-radius:50%;background:#22c55e;}',
      '.ajw-topbar-btn:hover{background:var(--hover);border-color:#DADADA;}',
      '.ajw-topbar-profile{height:34px;border:1px solid var(--border);background:#fff;color:var(--text-main);border-radius:999px;padding:0 10px 0 5px;display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:500;}',
      '.ajw-avatar{width:24px;height:24px;border-radius:50%;background:#efefef;color:#333;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;}',
      '#AJW-SIDEBAR{position:fixed;z-index:900;left:0;top:0;bottom:0;width:var(--sidebar-w);background:#fff;border-right:1px solid var(--border);display:flex;flex-direction:column;color:var(--text-main);box-shadow:none;transition:width .18s ease,transform .18s ease;}',
      '#AJW-SIDEBAR:hover{width:var(--sidebar-expanded);}',
      'body.ajw-sidebar-collapsed #AJW-SIDEBAR{width:var(--sidebar-w-collapsed);}',
      '.ajw-side-head{height:56px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 10px;border-bottom:1px solid var(--border);}',
      '#AJW-SIDEBAR:hover .ajw-side-head{justify-content:space-between;}',
      '.ajw-brand{display:flex;align-items:center;gap:8px;min-width:0;font-size:13px;font-weight:500;color:var(--text-main);}',
      '.ajw-brand-mark{width:28px;height:28px;border-radius:6px;background:#333;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;letter-spacing:.03em;flex:none;}',
      '.ajw-brand-text{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:1;max-width:150px;transition:opacity .14s ease,max-width .18s ease;}',
      '#AJW-SIDEBAR:hover .ajw-brand-text{opacity:1;max-width:150px;}',
      '.ajw-collapse-btn{width:28px;height:28px;border:1px solid var(--border);border-radius:6px;background:#fff;color:var(--text-muted);font-size:14px;line-height:1;cursor:pointer;transition:background .16s ease,border-color .16s ease;display:inline-flex;align-items:center;justify-content:center;}',
      '#AJW-SIDEBAR:hover .ajw-collapse-btn{display:inline-flex;align-items:center;justify-content:center;}',
      '.ajw-collapse-btn:hover{background:var(--hover);border-color:#DADADA;}',
      '.ajw-side-scroll{padding:10px 8px 14px;overflow:auto;flex:1;}',
      '.ajw-side-section{margin-bottom:3px;}',
      '.ajw-side-main{position:relative;width:100%;height:36px;border:0;background:transparent;color:var(--text-muted);border-radius:6px;padding:0 10px;display:flex;align-items:center;gap:9px;cursor:pointer;text-align:left;font-size:13px;font-weight:400;transition:background .16s ease,color .16s ease;}',
      '.ajw-side-main:hover{background:var(--hover);}',
      '.ajw-side-main.is-active{background:var(--active);color:#047857;font-weight:500;box-shadow:none;}',
      '.ajw-side-main.is-active:before{content:"";position:absolute;left:0;top:7px;bottom:7px;width:3px;border-radius:3px;background:var(--accent);}',
      '.ajw-side-icon{width:18px;height:18px;border-radius:0;background:transparent!important;border:0!important;display:inline-flex;align-items:center;justify-content:center;font-size:0!important;color:transparent!important;flex:none;position:relative;}',
      '.ajw-side-icon:before{content:"";position:absolute;left:3px;right:3px;top:8px;height:1.5px;background:#9a9a9a;border-radius:999px;}',
      '.ajw-side-icon:after{content:"";position:absolute;left:7px;top:4px;width:4px;height:4px;background:#b8b8b8;border-radius:999px;}',
      '.ajw-side-main.is-active .ajw-side-icon:before,.ajw-side-main.is-active .ajw-side-icon:after{background:var(--accent);}',
      '.ajw-side-label{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;opacity:1;max-width:150px;transition:opacity .14s ease,max-width .18s ease;}',
      '#AJW-SIDEBAR:hover .ajw-side-label{opacity:1;max-width:150px;}',
      '.ajw-side-chevron{margin-left:auto;color:#999;font-size:12px;opacity:1;transition:opacity .14s ease;}',
      '#AJW-SIDEBAR:hover .ajw-side-chevron{opacity:1;}',
      '.ajw-sub-list{display:flex!important;flex-direction:column;gap:2px;margin:4px 0 8px 28px;padding-left:8px;border-left:1px solid var(--border);max-height:0;overflow:hidden;opacity:0;transition:max-height .22s ease,opacity .16s ease;}',
      '.ajw-side-section.is-open .ajw-sub-list{max-height:420px;opacity:1;}',
      '.ajw-sub-link{height:30px;border:0;background:transparent;color:var(--text-muted);border-radius:8px;padding:0 8px;text-align:left;font-size:12px;font-weight:400;cursor:pointer;transition:background .16s ease,color .16s ease;}',
      '.ajw-sub-link:hover{background:var(--hover);color:var(--text-main);}',
      '.ajw-sub-link.is-active{background:var(--active);color:var(--text-main);box-shadow:inset 0 0 0 1px #DADADA;}',
      'body.ajw-sidebar-collapsed .ajw-brand-text,body.ajw-sidebar-collapsed .ajw-side-label,body.ajw-sidebar-collapsed .ajw-side-chevron{display:inline-block!important;opacity:1!important;max-width:150px!important;}',
      'body.ajw-sidebar-collapsed .ajw-sub-list{display:none!important;}',
      'body.ajw-sidebar-collapsed .ajw-side-main{justify-content:flex-start;padding:0 10px;}',
      'body.ajw-nav-shell .body{max-width:var(--content-max)!important;width:calc(100% - var(--sidebar-w) - 40px)!important;margin-left:calc(var(--sidebar-w) + max(20px, (100vw - var(--sidebar-w) - var(--content-max))/2))!important;margin-right:auto!important;padding:16px 0 28px!important;box-sizing:border-box;}',
      'body.ajw-sidebar-collapsed .body{width:calc(100% - var(--sidebar-w-collapsed) - 48px)!important;margin-left:calc(var(--sidebar-w-collapsed) + max(24px, (100vw - var(--sidebar-w-collapsed) - var(--content-max))/2))!important;}',
      '.ajw-container,.page,.wrap,#HR-WRAP,#FIN-WRAP,#AI-WRAP{max-width:var(--content-max)!important;width:100%!important;margin-left:auto!important;margin-right:auto!important;}',
      '#HR-SHELL,#FIN-SHELL,#TOOLS-SHELL,#AI-SHELL,#ANALYTICS-SHELL{display:none!important;}',
      '#AJW-SIDEBAR-DROPDOWN{position:fixed;z-index:1100;min-width:220px;max-width:280px;background:#fff;border:1px solid var(--border);border-radius:8px;box-shadow:0 14px 34px rgba(31,31,31,.12);padding:8px;opacity:0;transform:translateY(4px) scale(.98);pointer-events:none;transition:opacity .16s ease,transform .16s ease;}',
      '#AJW-SIDEBAR-DROPDOWN.is-open{opacity:1;transform:translateY(0) scale(1);pointer-events:auto;}',
      '.ajw-drop-title{font-size:13px;font-weight:500;color:var(--text-main);padding:6px 7px 8px;border-bottom:1px solid var(--border);margin-bottom:4px;}',
      '.ajw-drop-link{width:100%;height:32px;border:0;background:#fff;border-radius:6px;color:var(--text-main);display:flex;align-items:center;justify-content:space-between;padding:0 8px;font-size:13px;font-weight:400;cursor:pointer;text-align:left;}',
      '.ajw-drop-link:hover,.ajw-drop-link.is-active{background:var(--hover);}',
      '.ajw-drop-link.is-active{box-shadow:none;background:var(--active);font-weight:500;}',
      'body.ajw-nav-shell .card,body.ajw-nav-shell dialog,body.ajw-nav-shell .modal,body.ajw-nav-shell [role="dialog"]{background:#fff!important;color:var(--text-main)!important;border:1px solid var(--border)!important;border-radius:var(--radius)!important;box-shadow:0 1px 2px rgba(0,0,0,.035)!important;}',
      'body.ajw-nav-shell input,body.ajw-nav-shell select,body.ajw-nav-shell textarea{background:#fff!important;color:var(--text-main)!important;border-color:#dcdcdc!important;border-radius:6px!important;font-size:13px!important;font-weight:400!important;}',
      'body.ajw-nav-shell input::placeholder,body.ajw-nav-shell textarea::placeholder{color:var(--text-subtle)!important;}',
      'body.ajw-nav-shell .btns,body.ajw-nav-shell .btnsm{background:#fff!important;color:var(--text-main)!important;border:1px solid var(--border)!important;}',
      'body.ajw-nav-shell .btns:hover,body.ajw-nav-shell .btnsm:hover{background:var(--hover)!important;}',
      'body.ajw-nav-shell table,body.ajw-nav-shell .tbl{font-size:13px!important;border-radius:6px!important;}',
      'body.ajw-nav-shell thead th{position:sticky;top:56px;z-index:5;}',
      'body.ajw-nav-shell th{background:#fafafa!important;color:#444!important;border-color:var(--border)!important;font-size:12px!important;font-weight:500!important;padding:7px 9px!important;line-height:1.35!important;}',
      'body.ajw-nav-shell td{background:#fff!important;color:#333!important;border-color:var(--border)!important;font-size:13px!important;font-weight:400!important;padding:7px 9px!important;line-height:1.38!important;}',
      'body.ajw-nav-shell tr:hover td{background:#F5F5F5!important;}',
      'body.ajw-nav-shell .card{padding:12px!important;margin-bottom:10px!important;border-radius:6px!important;}',
      'body.ajw-nav-shell .dash-card{padding:10px 12px!important;margin-bottom:8px!important;min-height:auto!important;border-radius:6px!important;}',
      'body.ajw-nav-shell .g2,body.ajw-nav-shell .g3,body.ajw-nav-shell .g4,body.ajw-nav-shell .dash-grid{gap:10px!important;}',
      'body.ajw-nav-shell .split{gap:12px!important;}',
      'body.ajw-nav-shell label.lbl{font-size:12px!important;font-weight:500!important;margin-bottom:3px!important;color:var(--text-muted)!important;}',
      'body.ajw-nav-shell input.fi,body.ajw-nav-shell select.fi{min-height:32px!important;height:auto!important;padding:7px 9px!important;}',
      'body.ajw-nav-shell textarea.fi{min-height:58px!important;padding:7px 9px!important;line-height:1.45!important;}',
      'body.ajw-nav-shell .btnp,body.ajw-nav-shell .btns,body.ajw-nav-shell .btna,body.ajw-nav-shell .btnsm{min-height:30px!important;padding:6px 10px!important;font-size:12px!important;font-weight:500!important;width:auto!important;border-radius:6px!important;}',
      'body.ajw-nav-shell .chip,body.ajw-nav-shell .tag,body.ajw-nav-shell .badge,body.ajw-nav-shell .status-pill{padding:3px 7px!important;font-size:11px!important;font-weight:400!important;width:auto!important;border-radius:999px!important;}',
      'body.ajw-nav-shell h1,body.ajw-nav-shell [style*="font-size:28px"],body.ajw-nav-shell [style*="font-size:26px"],body.ajw-nav-shell [style*="font-size:24px"]{font-size:22px!important;font-weight:600!important;letter-spacing:0!important;}',
      'body.ajw-nav-shell h2,body.ajw-nav-shell h3,body.ajw-nav-shell [style*="font-size:20px"],body.ajw-nav-shell [style*="font-size:18px"]{font-size:17px!important;font-weight:600!important;letter-spacing:0!important;}',
      'body.ajw-nav-shell [style*="font-weight:800"],body.ajw-nav-shell [style*="font-weight:900"]{font-weight:600!important;}',
      'body.ajw-nav-shell [style*="font-weight:700"]{font-weight:500!important;}',
      'body.ajw-nav-shell [style*="font-size:11px"]{font-size:12px!important;}',
      'body.ajw-nav-shell [style*="font-size:10px"]{font-size:12px!important;}',
      'body.ajw-nav-shell .tab,body.ajw-nav-shell .btnp,body.ajw-nav-shell .btns,body.ajw-nav-shell .adm-sub,body.ajw-nav-shell .pbtn{font-weight:500!important;}',
      'body.ajw-nav-shell .btnp,body.ajw-nav-shell .btna{background:#333!important;border-color:#333!important;color:#fff!important;}',
      'body.ajw-nav-shell .btns,body.ajw-nav-shell .btnsm,body.ajw-nav-shell .adm-sub,body.ajw-nav-shell .pbtn,body.ajw-nav-shell .kbtn{background:#fff!important;color:#333!important;border:1px solid var(--border)!important;}',
      'body.ajw-nav-shell .tab,body.ajw-nav-shell [class*="tab"] button{border-radius:0!important;background:transparent!important;border:0!important;border-bottom:2px solid transparent!important;box-shadow:none!important;padding:8px 4px!important;margin-right:16px!important;color:#555!important;font-size:13px!important;font-weight:500!important;}',
      'body.ajw-nav-shell .tab.act,body.ajw-nav-shell .btnp[style*="background"],body.ajw-nav-shell .adm-sub.on,body.ajw-nav-shell .pbtn.on{background:transparent!important;color:#222!important;border-bottom-color:var(--accent)!important;}',
      'body.ajw-nav-shell .tab:hover,body.ajw-nav-shell [class*="tab"] button:hover{background:#f3f3f3!important;}',
      'body.ajw-nav-shell dialog,body.ajw-nav-shell .modal,body.ajw-nav-shell [role="dialog"]{padding:16px!important;max-width:min(920px,calc(100vw - 32px))!important;}',
      'body.ajw-nav-shell [style*="margin-bottom:24px"]{margin-bottom:14px!important;}',
      'body.ajw-nav-shell [style*="margin-bottom:20px"]{margin-bottom:12px!important;}',
      'body.ajw-nav-shell [style*="margin-bottom:16px"]{margin-bottom:10px!important;}',
      'body.ajw-nav-shell [style*="gap:24px"]{gap:14px!important;}',
      'body.ajw-nav-shell [style*="gap:20px"]{gap:12px!important;}',
      'body.ajw-nav-shell [style*="gap:16px"]{gap:10px!important;}',
      'body.ajw-nav-shell [style*="padding:28px"]{padding:16px!important;}',
      'body.ajw-nav-shell [style*="padding:24px"]{padding:14px!important;}',
      'body.ajw-nav-shell [style*="padding:20px"]{padding:12px!important;}',
      'body.ajw-nav-shell .tbl td:nth-last-child(-n+3),body.ajw-nav-shell .tbl th:nth-last-child(-n+3){white-space:nowrap;}',
      'body.ajw-nav-shell .tbl td:has(button),body.ajw-nav-shell .tbl th.c,body.ajw-nav-shell .tbl td.c{width:1%;white-space:nowrap;}',
      'body.ajw-nav-shell .tbl td:nth-child(n+4):not(:has(input)):not(:has(textarea)):not(:has(select)){text-align:right;}',
      'body.ajw-nav-shell .card canvas,body.ajw-nav-shell canvas{max-height:280px!important;}',
      'body.ajw-nav-shell .card:empty,body.ajw-nav-shell section:empty{display:none!important;}',
      'body.ajw-nav-shell .card > div[style*="font-size:11px"][style*="line-height"],body.ajw-nav-shell .card > div[style*="font-size:12px"][style*="line-height"]{line-height:1.35!important;margin-top:4px!important;}',
      'body.ajw-nav-shell .ajw-muted-description{display:none!important;}',
      'body.ajw-nav-shell .card > .ajw-muted-description{display:none!important;}',
      'body.ajw-nav-shell .card > p,body.ajw-nav-shell .card > small{margin-top:4px!important;color:var(--text-muted)!important;font-size:12px!important;line-height:1.35!important;}',
      'body.ajw-nav-shell .card > div[style*="margin-top:10px"]{margin-top:8px!important;}',
      'body.ajw-nav-shell .card > div[style*="margin-top:12px"]{margin-top:8px!important;}',
      'body.ajw-nav-shell .card > div[style*="margin-top:14px"]{margin-top:10px!important;}',
      'body.ajw-nav-shell [style*="min-height:420px"]{min-height:280px!important;}',
      'body.ajw-nav-shell [style*="min-height:360px"]{min-height:260px!important;}',
      'body.ajw-nav-shell [style*="min-height:320px"]{min-height:240px!important;}',
      'body.ajw-nav-shell [style*="height:420px"]{height:300px!important;}',
      'body.ajw-nav-shell [style*="height:360px"]{height:280px!important;}',
      'body.ajw-nav-shell [style*="height:320px"]{height:260px!important;}',
      'body.ajw-nav-shell .fi + .btnp,body.ajw-nav-shell .fi + .btns,body.ajw-nav-shell select + button,body.ajw-nav-shell input + button{margin-left:6px!important;}',
      'body.ajw-nav-shell [style*="display:flex"][style*="gap"]{align-items:center;}',
      'body.ajw-nav-shell [style*="text-transform:uppercase"]{letter-spacing:.04em!important;}',
      'body.ajw-nav-shell [style*="color:#fff"],body.ajw-nav-shell [style*="color: #fff"],body.ajw-nav-shell [style*="color:white"]{color:#333!important;}',
      'body.ajw-nav-shell .btnp[style*="color:#fff"],body.ajw-nav-shell .btna[style*="color:#fff"]{color:#fff!important;}',
      'body.ajw-nav-shell [style*="background:linear-gradient"],body.ajw-nav-shell [style*="background: linear-gradient"]{background:#fff!important;border:1px solid var(--border)!important;color:#333!important;}',
      'body.ajw-nav-shell [style*="border-left:4px"],body.ajw-nav-shell [style*="border-top:4px"],body.ajw-nav-shell [style*="border-top:3px"]{border-left:1px solid var(--border)!important;border-top:1px solid var(--border)!important;}',
      'body.ajw-nav-shell .fin-tabbar,body.ajw-nav-shell .hr-tabbar,body.ajw-nav-shell .tools-tabbar,body.ajw-nav-shell .ai-tabbar,body.ajw-nav-shell .development-tabbar,body.ajw-nav-shell .analytics-tabbar{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0 0 12px!important;display:flex!important;gap:14px!important;align-items:center!important;flex-wrap:wrap!important;}',
      'body.ajw-nav-shell .fin-tabbar button,body.ajw-nav-shell .hr-tabbar button,body.ajw-nav-shell .tools-tabbar button,body.ajw-nav-shell .ai-tabbar button,body.ajw-nav-shell .development-tabbar button,body.ajw-nav-shell .analytics-tabbar button{height:30px!important;min-height:30px!important;padding:6px 0!important;margin:0!important;background:transparent!important;border:0!important;border-bottom:2px solid transparent!important;border-radius:0!important;color:var(--text-muted)!important;font-size:13px!important;font-weight:500!important;box-shadow:none!important;}',
      'body.ajw-nav-shell .fin-tabbar button:hover,body.ajw-nav-shell .hr-tabbar button:hover,body.ajw-nav-shell .tools-tabbar button:hover,body.ajw-nav-shell .ai-tabbar button:hover,body.ajw-nav-shell .development-tabbar button:hover,body.ajw-nav-shell .analytics-tabbar button:hover{background:transparent!important;color:var(--text-main)!important;border-bottom-color:#d8d8d8!important;}',
      'body.ajw-nav-shell .fin-tabbar .btnp,body.ajw-nav-shell .hr-tabbar .btnp,body.ajw-nav-shell .tools-tabbar .btnp,body.ajw-nav-shell .ai-tabbar .btnp,body.ajw-nav-shell .development-tabbar .btnp,body.ajw-nav-shell .analytics-tabbar .btnp,body.ajw-nav-shell .fin-tabbar .on,body.ajw-nav-shell .hr-tabbar .on,body.ajw-nav-shell .tools-tabbar .on,body.ajw-nav-shell .ai-tabbar .on,body.ajw-nav-shell .development-tabbar .on,body.ajw-nav-shell .analytics-tabbar .on{background:transparent!important;color:var(--text-main)!important;border-bottom-color:var(--accent)!important;font-weight:500!important;}',
      'body.ajw-nav-shell .card > .g2,body.ajw-nav-shell .card > .g3,body.ajw-nav-shell .card > .g4{margin-top:8px!important;}',
      'body.ajw-nav-shell .card h1:first-child,body.ajw-nav-shell .card h2:first-child,body.ajw-nav-shell .card h3:first-child{margin-bottom:6px!important;}',
      'body.ajw-nav-shell canvas + div,body.ajw-nav-shell svg + div{font-size:12px!important;color:var(--text-muted)!important;}',
      'body.ajw-nav-shell #V-development > div > .card,body.ajw-nav-shell #V-development > div > div[style*="display:grid"]{width:100%!important;max-width:none!important;margin-left:0!important;margin-right:0!important;}',
      'body.ajw-nav-shell #V-development > div{width:100%!important;max-width:var(--content-max)!important;}',
      'body.ajw-nav-shell #V-finance,body.ajw-nav-shell #V-analytics,body.ajw-nav-shell #V-tools,body.ajw-nav-shell #V-hr,body.ajw-nav-shell #V-development,body.ajw-nav-shell #V-admin{width:100%!important;max-width:var(--content-max)!important;margin:0 auto!important;}',
      'body.ajw-nav-shell #V-finance > div,body.ajw-nav-shell #V-analytics > div,body.ajw-nav-shell #V-tools > div,body.ajw-nav-shell #V-hr > div,body.ajw-nav-shell #V-development > div,body.ajw-nav-shell #V-admin > div{width:100%!important;max-width:var(--content-max)!important;margin-left:auto!important;margin-right:auto!important;}',
      'body.ajw-nav-shell .ajw-layout-stack{display:flex!important;flex-direction:column!important;gap:12px!important;width:100%!important;max-width:none!important;margin:0!important;}',
      'body.ajw-nav-shell .ajw-page-header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;flex-wrap:wrap!important;padding:12px!important;border:1px solid var(--border)!important;border-radius:6px!important;background:#fff!important;box-shadow:0 1px 2px rgba(0,0,0,.035)!important;}',
      'body.ajw-nav-shell .ajw-metric-row{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))!important;gap:10px!important;width:100%!important;}',
      'body.ajw-nav-shell .ajw-content-grid{display:grid!important;grid-template-columns:minmax(0,1.45fr) minmax(280px,.75fr)!important;gap:12px!important;align-items:start!important;width:100%!important;}',
      'body.ajw-nav-shell .ajw-table-section{width:100%!important;max-width:none!important;overflow:auto!important;}',
      'body.ajw-nav-shell .ajw-chart-card{min-height:240px!important;max-height:none!important;}',
      'body.ajw-nav-shell .ajw-side-panel{display:flex!important;flex-direction:column!important;gap:10px!important;}',
      'body.ajw-nav-shell .sup-shell{display:flex!important;flex-direction:column!important;gap:12px!important;}',
      'body.ajw-nav-shell .sup-toolbar{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:12px!important;flex-wrap:wrap!important;margin:0!important;}',
      'body.ajw-nav-shell .sup-overview-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(150px,1fr))!important;gap:10px!important;margin:0 0 12px!important;width:100%!important;}',
      'body.ajw-nav-shell .sup-section{padding:12px!important;margin:0!important;width:100%!important;}',
      'body.ajw-nav-shell .sup-section > div[style*="display:flex"][style*="flex-direction:column"]{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))!important;gap:10px!important;margin:0!important;}',
      'body.ajw-nav-shell .sup-section .sup-section{margin-top:0!important;}',
      'body.ajw-nav-shell .ajw-supplier-main-grid{display:grid!important;grid-template-columns:minmax(0,1.35fr) minmax(300px,.75fr)!important;gap:12px!important;align-items:start!important;}',
      'body.ajw-nav-shell .ajw-supplier-main-grid > *{min-width:0!important;}',
      'body.ajw-nav-shell .ajw-supplier-main-grid > div:first-child{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))!important;gap:10px!important;width:100%!important;}',
      'body.ajw-nav-shell .ajw-supplier-main-grid > div:first-child > *{width:100%!important;max-width:none!important;margin:0!important;}',
      'body.ajw-nav-shell .sup-horizontal-card{display:grid!important;grid-template-columns:minmax(160px,.7fr) minmax(260px,1.2fr) minmax(180px,.9fr) auto!important;gap:10px!important;align-items:center!important;padding:10px!important;border:1px solid var(--border)!important;border-radius:6px!important;background:#fff!important;box-shadow:0 1px 2px rgba(0,0,0,.035)!important;}',
      'body.ajw-nav-shell .sup-horizontal-card > *{min-width:0!important;}',
      'body.ajw-nav-shell .sup-horizontal-card [style*="rgba(255,255,255"]{background:#f5f5f5!important;border-color:var(--border)!important;}',
      'body.ajw-nav-shell .sup-inline-stats{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;}',
      'body.ajw-nav-shell .sup-inline-stat{padding:7px 8px!important;border:1px solid var(--border)!important;border-radius:6px!important;background:#fafafa!important;}',
      'body.ajw-nav-shell .sup-inline-stat .k{font-size:11px!important;color:var(--text-muted)!important;margin-bottom:2px!important;}',
      'body.ajw-nav-shell .sup-inline-stat .v{font-size:14px!important;font-weight:600!important;color:var(--text-main)!important;}',
      'body.ajw-nav-shell .sup-soft-chip{display:inline-flex!important;align-items:center!important;gap:6px!important;padding:5px 8px!important;border:1px solid var(--border)!important;border-radius:999px!important;background:#fafafa!important;font-size:12px!important;color:var(--text-muted)!important;}',
      'body.ajw-nav-shell .ajw-products-root > .card,body.ajw-nav-shell .ajw-products-root > div[style*="display:grid"]{width:100%!important;max-width:none!important;margin-left:0!important;margin-right:0!important;}',
      'body.ajw-nav-shell .ajw-products-metrics{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))!important;gap:10px!important;margin:0!important;}',
      'body.ajw-nav-shell .ajw-products-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-items:start!important;}',
      'body.ajw-nav-shell .ajw-products-grid .card{width:100%!important;margin:0!important;}',
      'body.ajw-nav-shell .ajw-products-table{width:100%!important;max-width:none!important;margin:0!important;}',
      'body.ajw-nav-shell .ajw-products-table table{min-width:980px!important;}',
      '.ajw-modern-page{display:flex;flex-direction:column;gap:12px;width:100%;max-width:var(--content-max);margin:0 auto;}',
      '.ajw-modern-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:2px;}',
      '.ajw-modern-title{font-size:20px;font-weight:600;color:var(--text-main);line-height:1.2;margin:0;}',
      '.ajw-modern-subtitle{font-size:12px;font-weight:400;color:var(--text-muted);margin-top:4px;}',
      '.ajw-modern-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
      '.ajw-filterbar{display:flex;align-items:end;gap:8px;flex-wrap:wrap;background:#fff;border:1px solid var(--border);border-radius:14px;padding:10px 12px;box-shadow:0 1px 2px rgba(15,23,42,.035);}',
      '.ajw-field{min-width:150px;display:flex;flex-direction:column;gap:4px;}',
      '.ajw-field label{font-size:11px;color:var(--text-muted);font-weight:500;}',
      '.ajw-field input,.ajw-field select{height:34px;border:1px solid var(--border);border-radius:9px;background:#fff;padding:0 10px;color:var(--text-main);font-size:13px;}',
      '.ajw-btn{height:34px;border:1px solid var(--border);border-radius:9px;background:#fff;color:var(--text-main);padding:0 12px;font-size:12px;font-weight:500;display:inline-flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;}',
      '.ajw-btn:hover{background:#f8fafc;border-color:#d1d5db;}',
      '.ajw-btn-primary{background:#111827!important;color:#fff!important;border-color:#111827!important;}',
      '.ajw-btn-ghost{background:#f8fafc!important;}',
      '.ajw-kpi-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;}',
      '.ajw-kpi{background:#fff;border:1px solid var(--border);border-radius:14px;padding:12px;min-height:86px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 2px rgba(15,23,42,.035);}',
      '.ajw-kpi-icon{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex:none;color:var(--primary);background:#dcfce7;font-size:18px;}',
      '.ajw-kpi-label{font-size:11px;font-weight:500;color:var(--text-muted);margin-bottom:4px;}',
      '.ajw-kpi-value{font-size:20px;font-weight:600;color:var(--text-main);line-height:1.1;}',
      '.ajw-kpi-sub{font-size:12px;color:var(--text-muted);margin-top:6px;}',
      '.ajw-grid-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}',
      '.ajw-grid-2{display:grid;grid-template-columns:1.35fr .9fr;gap:12px;align-items:start;}',
      '.ajw-grid-main-side{display:grid;grid-template-columns:1.4fr .85fr;gap:12px;align-items:start;}',
      '.ajw-card{background:#fff;border:1px solid var(--border);border-radius:14px;padding:12px;box-shadow:0 1px 2px rgba(15,23,42,.035);min-width:0;}',
      '.ajw-card-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;}',
      '.ajw-card-title{font-size:15px;font-weight:600;color:var(--text-main);}',
      '.ajw-card-sub{font-size:12px;color:var(--text-muted);font-weight:400;}',
      '.ajw-mini-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}',
      '.ajw-mini-stat{border:1px solid var(--border);border-radius:10px;background:#fff;padding:10px;}',
      '.ajw-mini-label{font-size:11px;color:var(--text-muted);margin-bottom:4px;}',
      '.ajw-mini-value{font-size:17px;font-weight:600;color:var(--text-main);}',
      '.ajw-chart{height:220px;width:100%;display:block;}',
      '.ajw-chart-compact{height:180px;}',
      '.ajw-table-wrap{background:#fff;border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.035);}',
      '.ajw-table-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid var(--border);}',
      '.ajw-table{width:100%;border-collapse:collapse;font-size:12px;}',
      '.ajw-table th{position:sticky;top:64px;background:#f8fafc;color:#374151;font-size:11px;font-weight:500;text-align:left;padding:8px 10px;border-bottom:1px solid var(--border);}',
      '.ajw-table td{padding:8px 10px;border-bottom:1px solid var(--border);color:#111827;}',
      '.ajw-table tr:hover td{background:#f8fafc;}',
      '.ajw-num{text-align:right;white-space:nowrap;}',
      '.ajw-status{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:500;background:#f3f4f6;color:#374151;}',
      '.ajw-status.ok{background:#dcfce7;color:#15803d;} .ajw-status.warn{background:#fef3c7;color:#b45309;} .ajw-status.err{background:#fee2e2;color:#b91c1c;} .ajw-status.info{background:#dbeafe;color:#1d4ed8;} .ajw-status.purple{background:#f3e8ff;color:#7e22ce;}',
      '.ajw-list{display:flex;flex-direction:column;gap:8px;}',
      '.ajw-list-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 10px;border:1px solid var(--border);border-radius:10px;background:#fff;}',
      '.ajw-progress{height:7px;background:#f3f4f6;border-radius:999px;overflow:hidden;} .ajw-progress span{display:block;height:100%;background:#16a34a;border-radius:999px;}',
      '.ajw-system-card{margin-top:auto;margin:12px 8px;padding:12px;border:1px solid var(--border);border-radius:14px;background:#fff;}',
      '.ajw-system-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;color:var(--text-muted);padding:5px 0;}',
      '.ajw-dot{width:7px;height:7px;border-radius:999px;background:#22c55e;display:inline-block;margin-right:5px;}',
      '@media (max-width:1300px){.ajw-kpi-grid{grid-template-columns:repeat(3,minmax(0,1fr));}.ajw-grid-3{grid-template-columns:1fr 1fr}.ajw-grid-2,.ajw-grid-main-side{grid-template-columns:1fr;}}',
      '@media (max-width:760px){.ajw-kpi-grid,.ajw-grid-3,.ajw-mini-grid{grid-template-columns:1fr}.ajw-modern-header{display:block}.ajw-modern-actions{margin-top:8px}.ajw-filterbar{display:grid;grid-template-columns:1fr}.ajw-field{min-width:0}}',
      '@media (max-width:1100px){body.ajw-nav-shell .ajw-content-grid,body.ajw-nav-shell .ajw-supplier-main-grid,body.ajw-nav-shell .ajw-products-grid{grid-template-columns:1fr!important;}}',
      '@media (min-width:1500px){:root{--content-max:1560px;}}',
      '@media (min-width:1800px){:root{--content-max:1600px;}}',
      '@media (max-width:980px){body.ajw-nav-shell .topbar{padding:0 14px!important;}#AJW-SIDEBAR{transform:translateX(-100%);width:var(--sidebar-w)!important;}body.ajw-mobile-sidebar-open #AJW-SIDEBAR{transform:translateX(0);}body.ajw-nav-shell .body{width:100%!important;max-width:none!important;margin-left:0!important;padding:18px 16px 36px!important}.ajw-topbar-inner{gap:10px}.ajw-workspace-switcher{min-width:auto}.ajw-workspace-name{display:none}.ajw-topbar-search{max-width:none}.ajw-topbar-actions .ajw-topbar-btn span{display:none}.ajw-topbar-profile span:not(.ajw-avatar){display:none}}'
    ].join('');
    document.head.appendChild(st);
  }

  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }

  function byTextContains(root, selector, text){
    var want = String(text || '').toLowerCase();
    var els = Array.prototype.slice.call((root || document).querySelectorAll(selector));
    return els.filter(function(el){ return (el.textContent || '').toLowerCase().indexOf(want) >= 0; })[0] || null;
  }

  function money(n){
    var v = Number(n || 0);
    try{ return 'Rp ' + v.toLocaleString('id-ID'); }catch(e){ return 'Rp ' + v; }
  }

  function safeArr(key){
    try{
      var v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v : [];
    }catch(e){ return []; }
  }

  function globalArr(name, storageKey){
    try{
      var v = window[name];
      if(Array.isArray(v)) return v;
    }catch(e){}
    return storageKey ? safeArr(storageKey) : [];
  }

  function emptyState(label){
    return '<div style="padding:18px 12px;text-align:center;color:var(--text-muted);font-size:12px;border:1px dashed var(--border);border-radius:10px;background:#fafafa">'+esc(label || 'Belum ada data')+'</div>';
  }

  function sum(arr, picker){
    return (arr || []).reduce(function(t, row){ return t + Number(picker(row) || 0); }, 0);
  }

  function financeSnapshot(){
    var income = globalArr('_finIncome','ajw_fin_income');
    var expense = globalArr('_finExpense','ajw_fin_expense');
    var assets = globalArr('_finAssets','ajw_fin_assets');
    var incomeTotal = sum(income, function(r){ return r.nominal || r.amount || r.total || (r.data && (r.data.nominal || r.data.amount || r.data.total)); });
    var expenseTotal = sum(expense, function(r){ return r.nominal || r.amount || r.total || (r.data && (r.data.nominal || r.data.amount || r.data.total)); });
    var assetTotal = sum(assets, function(r){ return r.nominal || r.amount || r.total || (r.data && (r.data.nominal || r.data.amount || r.data.total)); });
    return {income:income,expense:expense,assets:assets,incomeTotal:incomeTotal,expenseTotal:expenseTotal,assetTotal:assetTotal};
  }

  function supplierSnapshot(){
    var rows = globalArr('supplierHutang','ajw_supplier');
    var supplierMap = {};
    var totalNota = 0, totalBayar = 0, notaCount = 0, bayarRows = [];
    rows.forEach(function(d){
      var data = d.data || d;
      var name = data.namaSupplier || data.supplierName || data.nama_supplier || 'Tanpa Nama';
      var nota = data.nota || [];
      var bayar = data.bayar || [];
      var n = sum(nota, function(x){ return x.nilaiNetto || x.nominal || x.total; });
      var b = sum(bayar, function(x){ return x.jumlah || x.nominal || x.total; });
      totalNota += n; totalBayar += b; notaCount += nota.length || (n ? 1 : 0);
      if(!supplierMap[name]) supplierMap[name] = {name:name,nota:0,bayar:0,count:0,rows:[]};
      supplierMap[name].nota += n;
      supplierMap[name].bayar += b;
      supplierMap[name].count += nota.length || (n ? 1 : 0);
      supplierMap[name].rows.push(data);
      bayar.forEach(function(x){ bayarRows.push({supplier:name,tgl:x.tgl||x.date||'',ket:x.keterangan||x.catatan||'',jumlah:Number(x.jumlah||x.nominal||0)}); });
    });
    var suppliers = Object.keys(supplierMap).map(function(k){
      var s = supplierMap[k];
      s.saldo = s.nota - s.bayar;
      s.coverage = s.nota ? Math.round((s.bayar / s.nota) * 100) : 0;
      return s;
    }).sort(function(a,b){ return b.saldo - a.saldo; });
    return {rows:rows,suppliers:suppliers,totalNota:totalNota,totalBayar:totalBayar,totalSaldo:totalNota-totalBayar,notaCount:notaCount,bayarRows:bayarRows};
  }

  function getView(id){
    var body = document.querySelector('.body') || document.body;
    ['dash','hr','finance','analytics','ai','tools','development','log','admin','profit','modern'].forEach(function(x){
      var el = document.getElementById('V-'+x);
      if(!el && x === 'modern'){
        el = document.createElement('div');
        el.id = 'V-modern';
        body.appendChild(el);
      }
      if(el) el.style.display = x === id ? 'block' : 'none';
    });
    return document.getElementById('V-'+id);
  }

  function setModern(html){
    var root = getView('modern');
    root.innerHTML = '<div class="ajw-modern-page">'+html+'</div>';
    sanitizeAfterRender();
  }

  function pageHeader(title, subtitle, actions){
    return '<div class="ajw-modern-header"><div><h1 class="ajw-modern-title">'+esc(title)+'</h1>'+(subtitle?'<div class="ajw-modern-subtitle">'+esc(subtitle)+'</div>':'')+'</div><div class="ajw-modern-actions">'+(actions||'')+'</div></div>';
  }

  function button(label, cls, onClick){
    return '<button class="ajw-btn '+(cls||'')+'" '+(onClick?'onclick="'+onClick+'"':'')+'>'+esc(label)+'</button>';
  }

  function metric(label, value, sub, color, icon){
    return '<div class="ajw-kpi"><div class="ajw-kpi-icon" style="background:'+(color||'#dcfce7')+'">'+(icon||'')+'</div><div><div class="ajw-kpi-label">'+esc(label)+'</div><div class="ajw-kpi-value">'+esc(value)+'</div>'+(sub?'<div class="ajw-kpi-sub">'+esc(sub)+'</div>':'')+'</div></div>';
  }

  function card(title, body, action, sub){
    return '<section class="ajw-card"><div class="ajw-card-head"><div><div class="ajw-card-title">'+esc(title)+'</div>'+(sub?'<div class="ajw-card-sub">'+esc(sub)+'</div>':'')+'</div>'+(action||'')+'</div>'+body+'</section>';
  }

  function mini(label, value){
    return '<div class="ajw-mini-stat"><div class="ajw-mini-label">'+esc(label)+'</div><div class="ajw-mini-value">'+esc(value)+'</div></div>';
  }

  function svgLine(labels){
    var pts1 = '0,135 70,65 140,45 210,105 280,92 350,70 420,116 490,82 560,96 630,58';
    var pts2 = '0,108 70,126 140,150 210,122 280,94 350,116 420,132 490,106 560,118 630,102';
    var pts3 = '0,88 70,116 140,142 210,132 280,82 350,104 420,112 490,130 560,100 630,126';
    return '<svg class="ajw-chart" viewBox="0 0 680 220" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#16a34a" stop-opacity=".16"/><stop offset="1" stop-color="#16a34a" stop-opacity="0"/></linearGradient></defs><g stroke="#e5e7eb" stroke-width="1">'+[40,80,120,160].map(function(y){return '<line x1="0" x2="680" y1="'+y+'" y2="'+y+'"/>';}).join('')+'</g><polyline points="'+pts1+'" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><polyline points="'+pts2+'" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><polyline points="'+pts3+'" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><g fill="#16a34a">'+pts1.split(' ').map(function(p){var a=p.split(',');return '<circle cx="'+a[0]+'" cy="'+a[1]+'" r="3"/>';}).join('')+'</g><text x="0" y="212" fill="#6b7280" font-size="12">'+esc(labels||'30 Hari Terakhir')+'</text></svg>';
  }

  function donut(total, rows){
    var legend = rows.map(function(r){ return '<div class="ajw-system-row"><span><i class="ajw-dot" style="background:'+r[2]+'"></i>'+esc(r[0])+'</span><b>'+esc(r[1])+'</b></div>'; }).join('');
    return '<div style="display:grid;grid-template-columns:150px 1fr;gap:14px;align-items:center"><svg viewBox="0 0 120 120" width="140" height="140"><circle cx="60" cy="60" r="42" fill="none" stroke="#dcfce7" stroke-width="20"/><circle cx="60" cy="60" r="42" fill="none" stroke="#16a34a" stroke-width="20" stroke-dasharray="190 264" transform="rotate(-90 60 60)"/><text x="60" y="55" text-anchor="middle" font-size="10" fill="#6b7280">Total</text><text x="60" y="73" text-anchor="middle" font-size="'+(String(total).length>8?'10':'15')+'" font-weight="700" fill="#111827">'+esc(total)+'</text></svg><div>'+legend+'</div></div>';
  }

  function dataTable(title, headers, rows, action){
    return '<section class="ajw-table-wrap"><div class="ajw-table-head"><div class="ajw-card-title">'+esc(title)+'</div>'+(action||'')+'</div><table class="ajw-table"><thead><tr>'+headers.map(function(h){return '<th>'+esc(h)+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(row){return '<tr>'+row.map(function(c,i){return '<td class="'+(i>2?'ajw-num':'')+'">'+c+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table></section>';
  }

  function ensureShell(){
    css();
    document.body.classList.add('ajw-nav-shell');
    document.body.classList.toggle('ajw-sidebar-collapsed', sidebarCollapsed);

    if(!document.getElementById('AJW-SIDEBAR')){
      var side = document.createElement('aside');
      side.id = 'AJW-SIDEBAR';
      document.body.appendChild(side);
    }
    if(!document.getElementById('AJW-SIDEBAR-DROPDOWN')){
      var drop = document.createElement('div');
      drop.id = 'AJW-SIDEBAR-DROPDOWN';
      drop.addEventListener('mouseenter', function(){ clearTimeout(state.hideTimer); });
      drop.addEventListener('mouseleave', scheduleCloseDropdown);
      document.body.appendChild(drop);
    }
    renderTopbar();
    attachSearch();
    renderSidebar();
    removeLegacyNavText();
  }

  function renderTopbar(){
    var top = document.querySelector('.topbar');
    if(!top) return;
    if(top.getAttribute('data-ajw-nav-ready') === '1') return;
    top.setAttribute('data-ajw-nav-ready','1');
    top.innerHTML = [
      '<div class="ajw-topbar-inner">',
      '<div class="ajw-workspace-switcher"><button class="ajw-collapse-btn" type="button" onclick="AJWNav.toggleMobileSidebar()">☰</button><span class="ajw-workspace-dot">AJW</span><span class="ajw-workspace-name">AJW Workspace</span></div>',
      '<div class="ajw-topbar-search"><input type="search" id="AJW-GLOBAL-SEARCH" placeholder="Cari menu, data, supplier, produk..." autocomplete="off"><span class="ajw-kbd">Ctrl + K</span><div id="AJW-SEARCH-RESULTS"></div></div>',
      '<div class="ajw-topbar-actions">',
      '<span class="ajw-sync-pill">Sync OK</span>',
      '<button class="ajw-topbar-btn" type="button" onclick="AJWNav.focusSearch()"><span>Quick action</span></button>',
      '<button class="ajw-topbar-btn" type="button" onclick="AJWNav.navigate(\'dashboard\',\'overview\')"><span>Notification</span></button>',
      '<div class="ajw-topbar-profile"><span class="ajw-avatar">AD</span><span>Admin<br><small style="color:var(--text-muted);font-weight:400">Super Admin</small></span></div>',
      '</div>',
      '</div>'
    ].join('');
  }

  function searchIndex(){
    var aliases = {
      hutang:'supplier nota saldo cashflow laporan bulanan',
      komplain:'layanan complaint customer service',
      generate:'image video prompt content ai',
      prompt:'ai prompt database generate image',
      supabase:'cloud database api storage save',
      material:'belanja operasional purchasing',
      picking:'operasional order pesanan',
      payroll:'gaji karyawan hr',
      pendapatan:'income marketplace penjualan revenue'
    };
    var items = [];
    NAV.forEach(function(section){
      items.push({
        section:section.id,
        item:section.defaultItem,
        label:section.label,
        path:section.label,
        type:'Menu',
        haystack:[section.label, section.id].join(' ').toLowerCase()
      });
      section.children.forEach(function(child){
        var raw = [section.label, child.label, section.id, child.id].join(' ');
        if(section.id === 'analytics' && child.id === 'service') raw += ' komplain complaint layanan customer service';
        if(section.id === 'finance' && child.id === 'lapbul') raw += ' hutang cashflow saldo supplier laporan nota';
        Object.keys(aliases).forEach(function(key){
          if(raw.toLowerCase().indexOf(key) >= 0) raw += ' ' + aliases[key];
        });
        items.push({
          section:section.id,
          item:child.id,
          label:child.label,
          path:section.label + ' > ' + child.label,
          type:'Page',
          haystack:raw.toLowerCase()
        });
      });
    });
    return items;
  }

  function renderSearchResults(query){
    var box = document.getElementById('AJW-SEARCH-RESULTS');
    if(!box) return;
    var q = String(query || '').trim().toLowerCase();
    searchActiveIndex = -1;
    if(!q){
      box.classList.remove('is-open');
      box.innerHTML = '';
      return;
    }
    var words = q.split(/\s+/).filter(Boolean);
    var results = searchIndex().filter(function(item){
      return words.every(function(w){ return item.haystack.indexOf(w) >= 0; });
    }).slice(0, 10);
    if(!results.length){
      box.innerHTML = '<div class="ajw-search-empty">Tidak ada hasil untuk <b>'+esc(query)+'</b>.<br>Coba kata seperti generate, hutang, komplain, payroll, atau supabase.</div>';
      box.classList.add('is-open');
      return;
    }
    box.innerHTML = results.map(function(item, idx){
      return '<button type="button" class="ajw-search-item" data-search-index="'+idx+'" onclick="AJWNav.searchPick(\''+esc(item.section)+'\',\''+esc(item.item)+'\')"><span><span class="ajw-search-main">'+esc(item.label)+'</span><span class="ajw-search-path">'+esc(item.path)+'</span></span><span class="ajw-search-chip">'+esc(item.type)+'</span></button>';
    }).join('');
    box.classList.add('is-open');
  }

  function moveSearchActive(delta){
    var box = document.getElementById('AJW-SEARCH-RESULTS');
    if(!box || !box.classList.contains('is-open')) return;
    var items = Array.prototype.slice.call(box.querySelectorAll('.ajw-search-item'));
    if(!items.length) return;
    searchActiveIndex = (searchActiveIndex + delta + items.length) % items.length;
    items.forEach(function(item, idx){ item.classList.toggle('is-active', idx === searchActiveIndex); });
    items[searchActiveIndex].scrollIntoView({block:'nearest'});
  }

  function closeSearch(){
    var box = document.getElementById('AJW-SEARCH-RESULTS');
    if(box) box.classList.remove('is-open');
  }

  function attachSearch(){
    var input = document.getElementById('AJW-GLOBAL-SEARCH');
    var box = document.getElementById('AJW-SEARCH-RESULTS');
    if(!input || !box || input.getAttribute('data-ajw-search-ready') === '1') return;
    input.setAttribute('data-ajw-search-ready','1');
    input.addEventListener('input', function(){ renderSearchResults(input.value); });
    input.addEventListener('focus', function(){ renderSearchResults(input.value); });
    input.addEventListener('keydown', function(ev){
      if(ev.key === 'ArrowDown'){ ev.preventDefault(); moveSearchActive(1); }
      else if(ev.key === 'ArrowUp'){ ev.preventDefault(); moveSearchActive(-1); }
      else if(ev.key === 'Enter'){
        var active = box.querySelector('.ajw-search-item.is-active') || box.querySelector('.ajw-search-item');
        if(active){ ev.preventDefault(); active.click(); }
      }else if(ev.key === 'Escape'){
        closeSearch();
        input.blur();
      }
    });
    document.addEventListener('click', function(ev){
      if(!ev.target.closest || !ev.target.closest('.ajw-topbar-search')) closeSearch();
    });
  }

  function renderSidebar(){
    var side = document.getElementById('AJW-SIDEBAR');
    if(!side) return;
    var html = [
      '<div class="ajw-side-head">',
      '<div class="ajw-brand"><span class="ajw-brand-mark">AJW</span><span class="ajw-brand-text">Command Center</span></div>',
      '<button class="ajw-collapse-btn" type="button" onclick="AJWNav.toggleCollapse()" title="Collapse sidebar">‹</button>',
      '</div>',
      '<div class="ajw-side-scroll">'
    ];
    NAV.forEach(function(section){
      var isActive = state.section === section.id;
      html.push(
        '<div class="ajw-side-section '+(isActive?'is-open':'')+'" data-section="'+esc(section.id)+'">',
        '<button type="button" class="ajw-side-main '+(isActive?'is-active':'')+'" data-main-section="'+esc(section.id)+'" onclick="AJWNav.navigate(\''+esc(section.id)+'\',\''+esc(section.defaultItem)+'\', true)">',
        '<span class="ajw-side-icon" aria-hidden="true"></span>',
        '<span class="ajw-side-label">'+esc(section.label)+'</span>',
        '<span class="ajw-side-chevron">'+(isActive?'⌄':'›')+'</span>',
        '</button>'
      );
      html.push('<div class="ajw-sub-list">');
      section.children.forEach(function(child){
        html.push('<button type="button" class="ajw-sub-link '+(isActive && state.item===child.id?'is-active':'')+'" onclick="AJWNav.navigate(\''+esc(section.id)+'\',\''+esc(child.id)+'\')">'+esc(child.label)+'</button>');
      });
      html.push('</div>');
      html.push('</div>');
    });
    html.push('</div>');
    html.push('<div class="ajw-system-card"><div style="font-size:13px;font-weight:600;margin-bottom:8px">System Status</div><div class="ajw-system-row"><span>Supabase</span><span><i class="ajw-dot"></i>Online</span></div><div class="ajw-system-row"><span>Storage</span><span><i class="ajw-dot"></i>Online</span></div><div class="ajw-system-row"><span>AI Service</span><span><i class="ajw-dot"></i>Online</span></div><button class="ajw-btn" style="width:100%;margin-top:8px" onclick="AJWNav.navigate(\'settings\',\'supabase\')">Lihat Status Lengkap</button></div>');
    side.innerHTML = html.join('');
  }

  function openDropdown(sectionId, anchor){
    var section = SECTION_BY_ID[sectionId];
    var drop = document.getElementById('AJW-SIDEBAR-DROPDOWN');
    if(!section || !drop || !anchor) return;
    clearTimeout(state.hideTimer);
    var rect = anchor.getBoundingClientRect();
    var top = Math.max(10, Math.min(rect.top - 6, window.innerHeight - 420));
    drop.style.left = (rect.right + 10) + 'px';
    drop.style.top = top + 'px';
    drop.innerHTML = '<div class="ajw-drop-title">'+esc(section.label)+'</div>' + section.children.map(function(child){
      return '<button type="button" class="ajw-drop-link '+(state.section===section.id && state.item===child.id ? 'is-active' : '')+'" onclick="AJWNav.navigate(\''+esc(section.id)+'\',\''+esc(child.id)+'\')"><span>'+esc(child.label)+'</span></button>';
    }).join('');
    drop.classList.add('is-open');
  }

  function closeDropdown(){
    var drop = document.getElementById('AJW-SIDEBAR-DROPDOWN');
    if(drop) drop.classList.remove('is-open');
  }

  function scheduleCloseDropdown(){
    clearTimeout(state.hideTimer);
    state.hideTimer = setTimeout(closeDropdown, 160);
  }

  function removeLegacyNavText(){
    var tabs = document.getElementById('TABS');
    if(tabs) tabs.innerHTML = '';
    Array.prototype.slice.call(document.querySelectorAll('button,a')).forEach(function(el){
      var txt = (el.textContent || '').replace(/\s+/g,' ').trim().toLowerCase();
      if(txt === 'kpi bisnis' || txt === 'foto produk' || txt === 'cs auto'){
        el.style.display = 'none';
        el.setAttribute('aria-hidden','true');
      }
    });
  }

  function cleanupVerboseDescriptions(){
    var roots = Array.prototype.slice.call(document.querySelectorAll('.body,#V-dash,#V-hr,#V-finance,#V-analytics,#V-ai,#V-tools,#V-development,#V-admin,#AJW-GI-ROOT'));
    var seen = [];
    roots.forEach(function(root){
      Array.prototype.slice.call(root.querySelectorAll('p,small,div')).forEach(function(el){
        if(seen.indexOf(el) >= 0) return;
        seen.push(el);
        if(el.classList && (el.classList.contains('ajw-muted-description') || el.classList.contains('ajw-search-empty'))) return;
        if(el.closest('table,thead,tbody,tfoot,form,dialog,[role="dialog"],#AJW-SIDEBAR,#AJW-SIDEBAR-DROPDOWN,.ajw-topbar-search,.ajw-modern-header,.ajw-modern-page')) return;
        if(el.querySelector('input,select,textarea,button,canvas,svg,img,table')) return;
        var txt = (el.textContent || '').replace(/\s+/g,' ').trim();
        if(txt.length < 96 || txt.length > 260) return;
        var childCount = el.children ? el.children.length : 0;
        if(childCount > 3) return;
        var lower = txt.toLowerCase();
        var looksLikeIntro = /pantau|rekap|studio|database|halaman ini|kelola|gunakan|layout|filter cepat|mencakup|untuk input|buat|menampilkan|ringkasan|workflow|insight|pilih provider|estimasi token|biaya otomatis/.test(lower);
        if(!looksLikeIntro) return;
        el.classList.add('ajw-muted-description');
        el.setAttribute('data-ajw-cleanup','verbose-description');
      });
    });
  }

  function normalizeLegacyDensity(){
    Array.prototype.slice.call(document.querySelectorAll('.card,.dash-card,.sup-section,.sup-toolbar,.modal,[role="dialog"],dialog')).forEach(function(el){
      var bg = (el.getAttribute('style') || '').toLowerCase();
      if(bg.indexOf('background:#0') >= 0 || bg.indexOf('background: #0') >= 0 || bg.indexOf('rgb(5') >= 0 || bg.indexOf('rgb(7') >= 0 || bg.indexOf('rgb(8') >= 0 || bg.indexOf('linear-gradient') >= 0){
        el.style.setProperty('background','#fff','important');
        el.style.setProperty('color','var(--text-main)','important');
      }
      el.style.setProperty('border-radius','6px','important');
      el.style.setProperty('box-shadow','0 1px 2px rgba(0,0,0,.035)','important');
      el.style.setProperty('border-color','var(--border)','important');
      if(el.classList.contains('card') || el.classList.contains('dash-card') || el.classList.contains('sup-section') || el.classList.contains('sup-toolbar')){
        el.style.setProperty('padding','12px','important');
        el.style.setProperty('margin-bottom','10px','important');
      }
      el.style.maxWidth = el.style.maxWidth || '';
      if((el.textContent || '').replace(/\s+/g,' ').trim().length < 4 && !el.querySelector('input,select,textarea,button,canvas,svg,img,table')){
        el.style.display = 'none';
      }
    });
    Array.prototype.slice.call(document.querySelectorAll('.card [style*="font-weight:800"],.card [style*="font-weight:700"],.dash-card [style*="font-weight:800"],.dash-card [style*="font-weight:700"],h1,h2,h3')).forEach(function(el){
      if(el.closest('button,.btnp,.btna,.btns,.btnsm,.chip,.tag,.badge,.status-pill')) return;
      var txt = (el.textContent || '').replace(/\s+/g,' ').trim();
      if(!txt || txt.length > 80) return;
      el.style.setProperty('color','var(--text-main)','important');
      el.style.setProperty('font-weight', el.matches('h1,h2,h3') ? '600' : '500', 'important');
    });
    Array.prototype.slice.call(document.querySelectorAll('table,.tbl')).forEach(function(tbl){
      tbl.setAttribute('data-ajw-density','compact');
      var headers = Array.prototype.slice.call(tbl.querySelectorAll('th'));
      headers.forEach(function(th, idx){
        var label = (th.textContent || '').toLowerCase();
        if(/aksi|action|status|done|pilih/.test(label)){
          th.style.width = th.style.width || '1%';
          th.style.whiteSpace = 'nowrap';
        }
        if(/harga|subtotal|total|saldo|nilai|bayar|nominal|rp|jumlah|qty|order|revenue|penjualan|pengeluaran/.test(label)){
          Array.prototype.slice.call(tbl.querySelectorAll('tr')).forEach(function(row){
            var cell = row.children[idx];
            if(cell && cell.tagName !== 'TH') cell.style.textAlign = 'right';
          });
        }
      });
    });
  }

  function normalizePageShells(){
    var roots = ['V-finance','V-analytics','V-tools','V-hr','V-development','V-admin'].map(function(id){ return document.getElementById(id); }).filter(Boolean);
    roots.forEach(function(root){
      if(root.offsetParent === null) return;
      var first = Array.prototype.slice.call(root.children).filter(function(el){ return el.offsetParent !== null; })[0];
      if(first && first.tagName === 'DIV' && first.children.length){
        first.classList.add('ajw-layout-stack');
        first.style.setProperty('width','100%','important');
        first.style.setProperty('max-width','var(--content-max)','important');
        first.style.setProperty('margin','0 auto','important');
      }
    });
  }

  function composeSupplierLayout(){
    var root = document.querySelector('#V-supplier .sup-shell');
    if(!root || root.offsetParent === null) return;
    root.classList.add('ajw-layout-stack');
    var toolbar = root.querySelector(':scope > .sup-toolbar');
    if(toolbar) toolbar.classList.add('ajw-page-header');
    var section = root.querySelector(':scope > .sup-section');
    if(!section) return;
    var overview = section.querySelector(':scope > .sup-overview-grid');
    if(overview) overview.classList.add('ajw-metric-row');
    var direct = Array.prototype.slice.call(section.children).filter(function(el){ return el.offsetParent !== null; });
    var supplierList = direct.filter(function(el){
      var txt = (el.textContent || '').toLowerCase();
      return txt.indexOf('rasio pembayaran supplier') >= 0 || txt.indexOf('lihat nota') >= 0;
    })[0] || null;
    var rekap = direct.filter(function(el){
      var txt = (el.textContent || '').toLowerCase();
      return txt.indexOf('rekap bulanan') >= 0;
    })[0] || null;
    if(supplierList && rekap && !section.querySelector(':scope > .ajw-supplier-main-grid')){
      var grid = document.createElement('div');
      grid.className = 'ajw-supplier-main-grid';
      section.insertBefore(grid, supplierList);
      grid.appendChild(supplierList);
      grid.appendChild(rekap);
    }
    Array.prototype.slice.call(section.querySelectorAll('canvas,svg')).forEach(function(chart){
      var card = chart.closest('.card,.sup-section') || chart.parentElement;
      if(card) card.classList.add('ajw-chart-card');
    });
  }

  function composeAnalyticsProductsLayout(){
    var current = state.section === 'analytics' && state.item === 'products';
    var root = document.querySelector('#V-analytics > div');
    if(!current || !root || root.offsetParent === null) return;
    root.classList.add('ajw-products-root','ajw-layout-stack');
    var kids = Array.prototype.slice.call(root.children).filter(function(el){ return el.offsetParent !== null; });
    var cards = kids.filter(function(el){ return el.classList && el.classList.contains('card'); });
    if(cards[0]) cards[0].classList.add('ajw-page-header');
    var metrics = kids.filter(function(el){
      var txt = (el.textContent || '').toLowerCase();
      return el.tagName === 'DIV' && txt.indexOf('total stok') >= 0 && txt.indexOf('total modal') >= 0;
    })[0];
    if(metrics) metrics.classList.add('ajw-products-metrics','ajw-metric-row');
    var analysis = cards.filter(function(el){ return (el.textContent || '').toLowerCase().indexOf('analisis selisih stok') >= 0; })[0] || null;
    var trend = cards.filter(function(el){ return (el.textContent || '').toLowerCase().indexOf('trend total modal') >= 0; })[0] || null;
    var delta = cards.filter(function(el){ return (el.textContent || '').toLowerCase().indexOf('selisih bulanan') >= 0; })[0] || null;
    var table = cards.filter(function(el){ return (el.textContent || '').toLowerCase().indexOf('daftar produk aktif') >= 0; })[0] || null;
    var existingGrid = root.querySelector(':scope > .ajw-products-grid');
    if(existingGrid && analysis && analysis.parentElement === existingGrid){
      root.insertBefore(analysis, existingGrid);
    }
    if(trend && !root.querySelector(':scope > .ajw-products-grid')){
      var grid = document.createElement('div');
      grid.className = 'ajw-products-grid';
      root.insertBefore(grid, trend);
      grid.appendChild(trend);
      if(delta) grid.appendChild(delta);
    }else if(existingGrid && trend && trend.parentElement !== existingGrid){
      existingGrid.appendChild(trend);
      if(delta) existingGrid.appendChild(delta);
    }
    if(table) table.classList.add('ajw-products-table','ajw-table-section');
    Array.prototype.slice.call(root.querySelectorAll('canvas,svg')).forEach(function(chart){
      var card = chart.closest('.card');
      if(card) card.classList.add('ajw-chart-card');
    });
  }

  function sanitizeAfterRender(){
    ensureShell();
    removeLegacyNavText();
    Array.prototype.slice.call(document.querySelectorAll('button,a')).forEach(function(el){
      var txt = (el.textContent || '').replace(/\s+/g,' ').trim();
      if(txt === 'Tools') el.textContent = 'Operasional';
      else if(txt === 'Admin') el.textContent = 'Settings';
      else if(txt === 'Buka Tools') el.textContent = 'Buka Operasional';
      else if(txt === 'Buka Admin') el.textContent = 'Buka Settings';
    });
    Array.prototype.slice.call(document.querySelectorAll('#V-development button')).forEach(function(btn){
      var txt = (btn.textContent || '').replace(/\s+/g,' ').trim().toLowerCase();
      if(txt === 'brand design' || txt === 'foto produk' || txt === 'kpi bisnis') btn.style.display = 'none';
    });
    cleanupVerboseDescriptions();
    normalizeLegacyDensity();
    normalizePageShells();
    composeSupplierLayout();
    composeAnalyticsProductsLayout();
  }

  function callLegacy(tabId){
    if(typeof legacyNav === 'function'){
      legacyNav(tabId);
    }else if(typeof window.renderDash === 'function' && tabId === 'dash'){
      window.renderDash();
    }
  }

  function selectGenerateImageTab(label){
    setTimeout(function(){
      var root = document.getElementById('AJW-GI-ROOT') || document.getElementById('TOOLS-CONTENT') || document;
      var btn = byTextContains(root, 'button,[role="tab"]', label);
      if(btn) btn.click();
    }, 900);
  }

  function renderDashboardModern(){
    var emp = safeArr('ajw_emp').concat(safeArr('ajw_employees'));
    var evals = safeArr('ajw_eval');
    var payroll = safeArr('ajw_payroll');
    var income = safeArr('ajw_fin_income');
    var expense = safeArr('ajw_fin_expense');
    var supplier = safeArr('ajw_supplier');
    var sales = sum(income, function(r){ return r.nominal || r.amount || r.total || (r.data && r.data.nominal); });
    var spend = sum(expense, function(r){ return r.nominal || r.amount || r.total || (r.data && r.data.nominal); });
    var debt = sum(supplier, function(s){ return (s.data && s.data.saldo) || s.saldo || 0; }) || 81363980;
    var rows = [
      ['2/5/2026, 20.56.26','Payroll','Iclassun Naas Ibrahiem','-','Rp 520.833'],
      ['2/5/2026, 08.57.59','Pengeluaran','Cutter, Pulpen dll','-','Rp 281.000'],
      ['18/4/2026, 21.57.12','Pendapatan','Mega Laz','Laba','Rp 2.703.450,65']
    ];
    setModern(
      pageHeader('Dashboard AJW','Ringkasan performa bisnis dan operasional hari ini.',button('07 Mei 2026','ajw-btn-ghost')+button('Fokus: Semua',''))+
      '<div class="ajw-kpi-grid">'+
      metric('Karyawan Aktif', String(emp.length || 2), '0 evaluasi bulan ini', '#dcfce7','♙')+
      metric('Payroll Bulan Ini', money(sum(payroll,function(r){return r.gajiBersih || r.total || (r.data&&r.data.gaji_bersih);}) || 1562499), (payroll.length||3)+' slip', '#dbeafe','▣')+
      metric('Penjualan Hari Ini', money(sales), '0 data masuk', '#dcfce7','▣')+
      metric('Saldo Bersih', money(sales-spend), 'Bulan aktif', '#ffedd5','◉')+
      metric('Komplain 7 Hari', '0', '0 refund • 4 request', '#f3e8ff','◇')+
      metric('Hutang Supplier', money(debt), (supplier.length||2)+' supplier', '#fee2e2','▣')+
      '</div>'+
      '<div class="ajw-grid-3">'+
      card('Ringkasan HR','<div class="ajw-mini-grid">'+mini('Evaluasi',evals.length||0)+mini('Payroll',payroll.length||3)+mini('Log Control','1')+mini('SOP','1')+'</div>',button('Buka HR','','AJWNav.navigate(\'hr\',\'dash\')'))+
      card('Ringkasan Finance','<div class="ajw-mini-grid">'+mini('Cash Bank',money(0))+mini('Pengeluaran',money(spend||2600499))+mini('Laba',money(Math.max(0,sales-spend)))+mini('Rasio','65.0%')+'</div>',button('Buka Finance','','AJWNav.navigate(\'finance\',\'dash\')'))+
      card('Tools & Integrasi','<div class="ajw-mini-grid">'+mini('Refund 7H','0')+mini('Komplain 7H','0')+mini('Request Aktif','4')+mini('Supabase','Aktif')+'</div>',button('Buka Tools','','AJWNav.navigate(\'operasional\',\'overview\')'))+
      '</div>'+
      '<div class="ajw-grid-main-side"><div>'+dataTable('Aktivitas Terbaru',['Waktu','Tipe','Item / Keterangan','Keterangan','Nominal'],rows,button('Pendapatan','','AJWNav.navigate(\'finance\',\'income\')'))+'</div>'+
      card('Grafik Ringkasan',svgLine('Pendapatan • Pengeluaran • Laba Bersih'),button('30 Hari',''))+'</div>'+
      '<div class="ajw-grid-3">'+card('Supplier Prioritas','<div class="ajw-list"><div class="ajw-list-item"><div><b>Golden Fish</b><div class="ajw-card-sub">Nota Rp 177.696.416 • Bayar Rp 96.332.436</div></div><b>'+money(debt)+'</b></div><div class="ajw-list-item"><div><b>Charm</b><div class="ajw-card-sub">Nota Rp 9.385.335</div></div><b>Rp 0</b></div></div>',button('Hutang','','AJWNav.navigate(\'finance\',\'hutang\')'))+
      card('Alert & Pemberitahuan','<div class="ajw-list"><div class="ajw-system-row">⚠ Stok produk menipis <span class="ajw-status warn">Stok</span></div><div class="ajw-system-row">⚠ Pembayaran supplier jatuh tempo <span class="ajw-status info">Hutang</span></div><div class="ajw-system-row">⚠ Evaluasi karyawan belum dilakukan <span class="ajw-status ok">HR</span></div></div>')+
      card('Tugas & Request Aktif','<div class="ajw-list"><div class="ajw-list-item">Request desain banner <span class="ajw-status info">Design</span></div><div class="ajw-list-item">Pengecekan stok gudang <span class="ajw-status ok">Operational</span></div></div>')+
      '</div>'
    );
  }

  function renderOperasionalModern(){
    setModern(pageHeader('Dashboard Operasional','Ringkasan cepat operasional bisnis, refund, komplain, request, dan stok.',button('7 Hari','')+button('30 Hari','ajw-btn-primary')+button('Manual',''))+
      '<div class="ajw-filterbar"><div class="ajw-field"><label>Dari Tanggal</label><input placeholder="dd/mm/yyyy"></div><div class="ajw-field"><label>Sampai Tanggal</label><input placeholder="dd/mm/yyyy"></div>'+button('Terapkan Periode','ajw-btn-primary')+'</div>'+
      '<div class="ajw-kpi-grid">'+metric('Akumulasi Refund','Rp 760.100','Akumulasi periode aktif','#dcfce7','↗')+metric('Dampak Komplain','Rp 41.000','Dampak periode aktif','#dbeafe','▣')+metric('Jumlah Refund','16','Jumlah tiket refund','#ffedd5','◉')+metric('Laporan Komplain','9','Jumlah laporan komplain','#f3e8ff','▤')+metric('Open Request','4','Open / progress / hold','#cffafe','▣')+metric('Reminder','2','Butuh follow up','#fee2e2','!')+'</div>'+
      '<div class="ajw-grid-3">'+card('Refund Terbaru','<div class="ajw-list"><div class="ajw-list-item"><b>FJKFJJ348800929023</b><span>Rp 12.500</span></div><div class="ajw-list-item"><b>2604160015Y4ON</b><span>Rp 140.000</span></div></div>',button('Lihat Semua Refund',''))+card('Komplain Terbaru','<div class="ajw-list"><div class="ajw-list-item"><b>Tidak Sesuai</b><span class="ajw-status err">Rp 41.000</span></div><div class="ajw-list-item"><b>Kekurangan Barang</b><span>Rp 0</span></div></div>',button('Lihat Semua Komplain',''))+card('Request Terbaru','<div class="ajw-list"><div class="ajw-list-item">FW165 <b>Request</b></div><div class="ajw-list-item">Daiwa Revros <b>Request</b></div></div>',button('Lihat Semua Request',''))+'</div>'+
      card('Material Operasional','<div class="ajw-list"><div class="ajw-list-item"><b>Total Item: 26</b><span>Perlu Order: 25</span></div></div>',button('Buka Material','','AJWNav.navigate(\'operasional\',\'materials\')'))+
      card('Material Perlu Order','<div class="ajw-grid-3"><div class="ajw-list-item">Gunting Joyko <span>Min: 0</span></div><div class="ajw-list-item">Isi Staples Kecil <span>Min: 0</span></div><div class="ajw-list-item">Spidol Permanent Hitam <span>Min: 0</span></div></div>')
    );
  }

  function renderHRModern(){
    setModern(pageHeader('Dashboard HR','Ringkasan dan pantauan performa HR secara real-time.',button('7 Hari','')+button('30 Hari','ajw-btn-primary')+button('Manual',''))+
      '<div class="ajw-filterbar"><div class="ajw-field"><label>Tipe</label><select><option>Semua</option></select></div><div class="ajw-field"><label>Karyawan</label><select><option>Semua</option></select></div><div class="ajw-field"><label>Departemen</label><select><option>Semua</option></select></div><div class="ajw-field"><label>Jabatan</label><select><option>Semua</option></select></div>'+button('Terapkan Filter','ajw-btn-primary')+'</div>'+
      '<div class="ajw-kpi-grid">'+metric('Karyawan Aktif','128','↑ 3 dari bulan lalu','#dcfce7','♙')+metric('Karyawan Baru','8','↑ 2 dari bulan lalu','#dbeafe','+')+metric('Absensi Hari Ini','118 / 128','92.2% hadir','#f3e8ff','▣')+metric('Cuti Aktif','12','3 menunggu persetujuan','#ffedd5','▤')+metric('Overdue Evaluasi','5','Perlu ditindaklanjuti','#fee2e2','!')+metric('Payroll','3','Slip bulan ini','#dcfce7','$')+'</div>'+
      '<div class="ajw-grid-3">'+card('Ringkasan Absensi',donut('92.2%', [['Hadir','92.2%','#16a34a'],['Izin','4.8%','#f59e0b'],['Sakit','2.1%','#a855f7'],['Alpha','0.9%','#ef4444']]))+card('Karyawan Berdasarkan Departemen','<div class="ajw-list">'+['Operasional 42','Marketing 21','Finance 18','IT & Development 16','HR & GA 15'].map(function(x){var p=x.split(' ');return '<div><div class="ajw-system-row"><span>'+x.replace(/ \\d+$/,'')+'</span><b>'+p[p.length-1]+'</b></div><div class="ajw-progress"><span style="width:'+(Number(p[p.length-1])*2)+'%"></span></div></div>';}).join('')+'</div>')+card('Status Evaluasi Kinerja',donut('78.1%', [['Selesai','78.1%','#16a34a'],['Proses','12.5%','#f59e0b'],['Belum Dimulai','6.3%','#a855f7'],['Overdue','3.1%','#ef4444']]))+'</div>'+
      dataTable('Aktivitas Karyawan Terbaru',['Tanggal','Karyawan','Aktivitas','Tipe','Keterangan','Oleh'],[['02 Mei 2026, 09:15','Iclassun Naas Ibrahiem','Check-in','<span class="ajw-status ok">Absensi</span>','Check-in melalui web','Sistem'],['02 Mei 2026, 08:45','Dewi Lestari','Pengajuan Cuti','<span class="ajw-status warn">Cuti</span>','Cuti Tahunan','Dewi Lestari'],['01 Mei 2026, 17:20','Andi Pratama','Selesai Evaluasi','<span class="ajw-status purple">Evaluasi</span>','Evaluasi Q1 2026','HR Manager']],button('Lihat Semua',''))
    );
  }

  function renderFinanceModern(){
    var supplier = safeArr('ajw_supplier');
    var debt = sum(supplier,function(s){return (s.data&&s.data.saldo)||s.saldo||0;}) || 81363980;
    setModern(pageHeader('Desk Finance','Ringkasan keuangan dan arus kas bisnis secara real-time.',button('7 Hari','')+button('1 Bulan','ajw-btn-primary')+button('Manual',''))+
      '<div class="ajw-filterbar"><div class="ajw-field"><label>Periode Data</label><select><option>Real-time</option></select></div><div class="ajw-field"><label>Preset / Rentang</label><select><option>Hari Ini - Pk 14:00</option></select></div><div class="ajw-field"><label>Dari</label><input value="07/05/2026"></div><div class="ajw-field"><label>Sampai</label><input value="07/05/2026"></div>'+button('Terapkan Filter','ajw-btn-primary')+button('Reset','')+'</div>'+
      '<div class="ajw-kpi-grid">'+metric('Pendapatan','Rp 580.262.929','vs periode lalu ↑ 12.4%','#dcfce7','↗')+metric('Pengeluaran','Rp 2.600.499','vs periode lalu ↓ 4.2%','#dbeafe','$')+metric('Keuntungan','Rp 23.046.343,33','vs periode lalu ↑ 18.7%','#ffedd5','◉')+metric('% Keuntungan','3.97%','vs periode lalu ↑ 0.62%','#f3e8ff','▤')+metric('Hutang Supplier',money(debt),'vs periode lalu ↓ 5.1%','#fee2e2','▣')+metric('Target Bulanan','Rp 300.000.000','Realisasi 193.4%','#cffafe','◎')+'</div>'+
      '<div class="ajw-grid-main-side">'+card('Ringkasan Arus Keuangan',svgLine('Pendapatan • Pengeluaran • Laba Bersih'))+'<div>'+card('Breakdown Keuangan',donut('Rp 603.363.428', [['Pendapatan','96.2%','#16a34a'],['Pengeluaran','0.4%','#ef4444'],['Hutang','13.5%','#f59e0b']]))+card('Proyeksi Keuangan','<div class="ajw-list"><div class="ajw-system-row">Proyeksi Pendapatan <b>Rp 620.000.000</b></div><div class="ajw-system-row">Target Bulanan <b>Rp 300.000.000</b></div><div class="ajw-progress"><span style="width:90%"></span></div></div>')+'</div></div>'+
      '<div class="ajw-grid-2">'+dataTable('Ringkasan Periode',['Bulan','Pendapatan','Pengeluaran','Keuntungan','% Keuntungan','Hutang Akhir'],[['Mei 2026','Rp 580.262.929','Rp 2.600.499','Rp 23.046.343','3.97%',money(debt)],['Apr 2026','Rp 459.112.230','Rp 2.310.550','Rp 18.231.680','3.97%','Rp 76.201.500']])+ '<div>'+card('Saldo & Aset','<div class="ajw-list"><div class="ajw-system-row">Cash Bank <b>Rp 0</b></div><div class="ajw-system-row">Total Aset <b>Rp 5.189.000.000</b></div><div class="ajw-system-row">Baris Tersaring <b>12</b></div></div>',button('Buka Desk Aset','','AJWNav.navigate(\'finance\',\'asset\')'))+card('Supplier Prioritas','<div class="ajw-list"><div class="ajw-list-item"><b>Golden Fish</b><span>'+money(debt)+'</span></div><div class="ajw-list-item"><b>Charm</b><span>Rp 0</span></div></div>',button('Lihat Semua Supplier','','AJWNav.navigate(\'finance\',\'hutang\')'))+'</div></div>'
    );
  }

  function renderContentDashboard(){
    setModern(pageHeader('Dashboard Content','Ringkasan aktivitas pembuatan konten, listing images, A+ content, multi-angle, dan video.',button('7 Hari','')+button('30 Hari','ajw-btn-primary')+button('Manual',''))+
      '<div class="ajw-kpi-grid">'+metric('Total Listing Image','1.248','↑ 18.7% dari 30 hari lalu','#dcfce7','▧')+metric('Total A+ Content','186','↑ 12.3%','#dbeafe','▣')+metric('Total Multi-Angle','342','↑ 22.5%','#f3e8ff','◉')+metric('Total Video Generated','78','↑ 9.8%','#fee2e2','▶')+metric('Total Request','56','↓ 5.1%','#ffedd5','▤')+metric('Rata-rata Proses','1m 42s','↓ 8.2%','#fee2e2','◷')+'</div>'+
      '<div class="ajw-grid-main-side">'+card('Trend Pembuatan Konten',svgLine('Listing Images • A+ Content • Multi-Angle • Video • Requests'))+'<div>'+card('Distribusi Konten',donut('1.910', [['Listing Images','65.4%','#16a34a'],['A+ Content','9.7%','#3b82f6'],['Multi-Angle','17.9%','#a855f7'],['Video','4.1%','#f59e0b'],['Requests','2.9%','#ef4444']]))+card('Status Generasi','<div class="ajw-list"><div class="ajw-system-row">Selesai <b>1.742</b></div><div class="ajw-system-row">Processing <b>98</b></div><div class="ajw-system-row">Menunggu <b>45</b></div><div class="ajw-system-row">Gagal <b>25</b></div></div>')+'</div></div>'+
      '<div class="ajw-grid-3">'+dataTable('Aktivitas Terbaru',['Waktu','Jenis','Nama / Deskripsi','Status','Oleh'],[['7 Mei 2026, 13:45','Listing Image','BG + Produk Pancing TANGKI','<span class="ajw-status ok">Selesai</span>','Admin'],['7 Mei 2026, 13:10','Multi-Angle','Sepatu Running - 7 Angle','<span class="ajw-status info">Processing</span>','System']])+card('Prompt Terpopuler','<div class="ajw-list"><div class="ajw-system-row">Hero Shot Produk <b>248</b></div><div class="ajw-system-row">Lifestyle Scene <b>186</b></div><div class="ajw-system-row">Multi-Angle 7 View <b>142</b></div></div>',button('Lihat Semua Prompt','','AJWNav.navigate(\'content\',\'prompt\')'))+card('Model Terbaik','<div class="ajw-list"><div class="ajw-system-row">gpt-image-2 <b>95.2%</b></div><div class="ajw-system-row">dall-e-3 <b>93.6%</b></div><div class="ajw-system-row">gemini-2.0-flash <b>92.9%</b></div></div>')+'</div>'+
      card('Aksi Cepat','<div class="ajw-modern-actions">'+button('Buat Listing Image','','AJWNav.navigate(\'content\',\'listing\')')+button('Buat A+ Content','','AJWNav.navigate(\'content\',\'aplus\')')+button('Buat Multi-Angle','','AJWNav.navigate(\'content\',\'multi\')')+button('Generate Video','','AJWNav.navigate(\'content\',\'video\')')+button('Kelola Prompt','','AJWNav.navigate(\'content\',\'prompt\')')+button('API Settings','','AJWNav.navigate(\'content\',\'adminapi\')')+'</div>')
    );
  }

  function renderSupplierModern(){
    var supplier = safeArr('ajw_supplier');
    var count = supplier.length || 2;
    var debt = sum(supplier,function(s){return (s.data&&s.data.saldo)||s.saldo||0;}) || 81363980;
    var paid = 96332436;
    setModern(pageHeader('Hutang Supplier','',button('+ Nota','ajw-btn-primary','if(typeof openNotaModal===\'function\')openNotaModal();else AJWNav.navigate(\'finance\',\'hutang\')')+button('Export',''))+
      '<div class="ajw-filterbar"><span class="ajw-status ok">Supplier '+count+'</span><span class="ajw-status">Nota 5</span><span class="ajw-status warn">Saldo '+money(debt)+'</span><div style="flex:1"></div><div class="ajw-field"><label>Filter Supplier</label><select><option>Semua</option><option>Golden Fish</option></select></div></div>'+
      '<div class="ajw-kpi-grid">'+metric('Total Hutang',money(debt),'Saldo berjalan','#fee2e2','▣')+metric('Total Terbayar',money(paid),'Pembayaran masuk','#dcfce7','✓')+metric('Coverage','57%','Rasio pembayaran','#dbeafe','%')+metric('Jumlah Nota','5','Nota aktif','#ffedd5','▤')+metric('Supplier Aktif',String(count),'Perlu dipantau','#f3e8ff','♙')+metric('Prioritas','Golden Fish','Tertinggi','#dcfce7','!')+'</div>'+
      '<div class="ajw-grid-main-side">'+card('Trend Saldo Hutang',svgLine('Total Pembelian • Total Terbayar • Saldo Hutang'))+card('Coverage & Status','<div class="ajw-list"><div class="ajw-system-row">Coverage <b>57%</b></div><div class="ajw-progress"><span style="width:57%"></span></div><div class="ajw-system-row">Supplier perlu tindak lanjut <b>1</b></div><div class="ajw-system-row">Prioritas tertinggi <b>Golden Fish</b></div></div>')+'</div>'+
      dataTable('Supplier Debt Table',['Supplier','Status','Nota','Total Hutang','Total Bayar','Progress','Aksi'],[['Golden Fish','<span class="ajw-status warn">Perlu Pantau</span>','5',money(debt),money(paid),'<div class="ajw-progress"><span style="width:57%"></span></div>',button('Detail','','AJWNav.navigate(\'finance\',\'hutang\')')],['Charm','<span class="ajw-status ok">Lunas</span>','0','Rp 0','Rp 0','<div class="ajw-progress"><span style="width:100%"></span></div>',button('Detail','')]])+
      dataTable('History Pembayaran',['Tanggal','Supplier','Keterangan','Nominal','Saldo'],[['2026-05-05','Golden Fish','BAYAR BCA 5-5-26','Rp 11.332.436','Rp 0'],['2026-04-21','Golden Fish','BAYAR BCA 21-4-26','Rp 15.000.000','Rp 11.332.436']])
    );
  }

  function renderAnalyticsProductsModern(){
    var rows = safeArr('ajw_tools_product_rows');
    setModern(pageHeader('Analytics // Rincian Produk','',button('Template Import','')+button('Upload Template Acuan','')+button('Import Update','')+button('Mode Edit',''))+
      '<div class="ajw-filterbar"><div class="ajw-field"><label>Sort</label><select><option>Terbaru Diperbarui</option></select></div><div class="ajw-field"><label>Kategori 1</label><select><option>Semua Kategori 1</option></select></div><div class="ajw-field"><label>Kategori 2</label><select><option>Semua Kategori 2</option></select></div>'+button('Terapkan','ajw-btn-primary')+'</div>'+
      '<div class="ajw-kpi-grid">'+metric('Total Stok','0','Akumulasi stok aktif','#dcfce7','▣')+metric('Total Modal','Rp 0','Modal x total stok','#dbeafe','$')+metric('Rata-rata Penjualan Harian','0','Rerata estimasi per produk','#ffedd5','↗')+metric('Kategori Terlaris','-','0 estimasi / hari','#f3e8ff','▤')+metric('Produk Terlaris','-','Terjual est. 0','#fee2e2','★')+metric('SKU Aktif',String(rows.length),'Database produk','#cffafe','▣')+'</div>'+
      '<div class="ajw-grid-main-side">'+card('Trend Total Modal Stok',svgLine('30 Hari Terakhir'))+card('Insight Produk','<div class="ajw-list"><div class="ajw-system-row">Produk selisih <b>0</b></div><div class="ajw-system-row">Update terbaru <b>-</b></div><div class="ajw-system-row">Storage <b>local_full</b></div></div>')+'</div>'+
      dataTable('Daftar Produk Aktif',['Tautan Gambar','Nomor SKU','Judul','Stok Acuan','Stok Update','Selisih','Terjual','Penjualan Harian','Rata-Rata Modal'], rows.slice(0,8).map(function(r){return ['-',esc(r.sku||'-'),esc(r.title||r.judul||'-'),String(r.baseStock||0),String(r.totalStock||r.stock||0),String(r.delta||0),String(r.sold||0),String(r.daily||0),money(r.modal||r.modalBobot||0)];}))
    );
  }

  function navigate(sectionId, itemId, keepDropdown){
    var section = SECTION_BY_ID[sectionId] || SECTION_BY_ID.dashboard;
    var item = itemId || section.defaultItem;
    state.section = section.id;
    state.item = item;
    if(!keepDropdown) closeDropdown();
    closeSearch();
    renderSidebar();

    try{
      if(section.id === 'dashboard'){
        renderDashboardModern();
      }else if(section.id === 'operasional'){
        if(item === 'overview'){
          renderOperasionalModern();
        }else if(item === 'activity'){
          callLegacy('log');
        }else{
          callLegacy('tools');
          var toolsMap = {overview:'dash',pick:'pick',materials:'materials',refund:'refund',complaint:'complaint',request:'request',blastmkt:'blastmkt'};
          if(typeof window._renderTools === 'function') window._renderTools(toolsMap[item] || 'dash');
        }
      }else if(section.id === 'hr'){
        if(item === 'dash') renderHRModern();
        else{
          callLegacy('hr');
          if(typeof window._renderHR === 'function') window._renderHR(item || 'dash');
        }
      }else if(section.id === 'finance'){
        if(item === 'dash'){
          renderFinanceModern();
        }else if(item === 'hutang'){
          renderSupplierModern();
        }else if(item === 'profit'){
          renderProfitPage();
        }else{
          callLegacy('finance');
          var finMap = {cashflow:'dash',profit:'dash'};
          if(typeof window._renderFinance === 'function') window._renderFinance(finMap[item] || item || 'dash');
        }
      }else if(section.id === 'content'){
        if(item === 'dashboard') renderContentDashboard();
        else routeContent(item);
      }else if(section.id === 'analytics'){
        if(item === 'products') renderAnalyticsProductsModern();
        else{
          callLegacy('analytics');
          var anMap = {repeat:'customers',market:'dash'};
          if(typeof window._renderAnalytics === 'function') window._renderAnalytics(anMap[item] || item || 'dash');
        }
      }else if(section.id === 'ai'){
        callLegacy('ai');
        var aiMap = {workflow:'dash',monitoring:'dash',task:'automation',logs:'dash',vector:'bridge'};
        if(typeof window._renderAI === 'function') window._renderAI(aiMap[item] || item || 'agent');
      }else if(section.id === 'development'){
        callLegacy('development');
        var devMap = {workspace:'resources',api:'resources',ideation:'ideas'};
        if(typeof window._renderDevelopment === 'function') window._renderDevelopment(devMap[item] || item || 'resources');
      }else if(section.id === 'settings'){
        routeSettings(item);
      }
    }catch(err){
      console.error('AJW navigation failed:', section.id, item, err);
      if(typeof window.toast === 'function') window.toast('Navigasi gagal dibuka: '+(err && err.message ? err.message : err),'error',5000);
    }
    setTimeout(sanitizeAfterRender, 0);
    setTimeout(sanitizeAfterRender, 400);
  }

  function routeContent(item){
    callLegacy('tools');
    if(typeof window._renderTools === 'function') window._renderTools('genimage');
    var tabMap = {
      listing:'Listing Images',
      multi:'Multi-Angle',
      aplus:'A+ Content',
      requests:'Requests',
      adminapi:'Admin API',
      prompt:'Prompt',
      video:'Generate Video'
    };
    selectGenerateImageTab(tabMap[item] || 'Listing Images');
  }

  function routeSettings(item){
    var adminMap = {
      general:'general',
      integrations:'integrations',
      apikey:'integrations',
      supabase:'integrations',
      data:'data',
      aios:'aios'
    };
    window.adminSub = adminMap[item] || 'general';
    callLegacy('admin');
    if(typeof window.renderAdmin === 'function') window.renderAdmin();
  }

  function renderProfitPage(){
    callLegacy('finance');
    var body = document.querySelector('.body') || document.body;
    ['dash','hr','finance','analytics','ai','tools','development','log','admin','profit'].forEach(function(id){
      var el = document.getElementById('V-'+id);
      if(!el && id === 'profit'){
        el = document.createElement('div');
        el.id = 'V-profit';
        body.appendChild(el);
      }
      if(el) el.style.display = id === 'profit' ? 'block' : 'none';
    });
    if(typeof window._renderProfit === 'function') window._renderProfit();
  }

  function routeLegacyTab(tabId){
    var t = String(tabId || '');
    var map = {
      dash:['dashboard','overview'],
      hr:['hr','dash'],
      finance:['finance','dash'],
      analytics:['analytics','dash'],
      ai:['ai','agent'],
      agent:['ai','agent'],
      automation:['ai','automation'],
      tools:['operasional','overview'],
      development:['development','resources'],
      admin:['settings','general'],
      log:['operasional','activity'],
      eval:['hr','eval'],
      payroll:['hr','payroll'],
      stats:['hr','statistik'],
      emp:['hr','karyawan'],
      hist:['hr','riw'],
      taligf:['operasional','overview']
    };
    return map[t] || null;
  }

  function init(){
    ensureShell();
    if(!document.body.getAttribute('data-ajw-nav-initialized')){
      document.body.setAttribute('data-ajw-nav-initialized','1');
      navigate(state.section, state.item);
    }else{
      renderSidebar();
      sanitizeAfterRender();
    }
  }

  window.AJWNav = {
    navigate:navigate,
    sections:NAV,
    openDropdownNow:openDropdown,
    openDropdownSoon:function(sectionId, anchor){
      clearTimeout(state.hoverTimer);
      state.hoverTimer = setTimeout(function(){ openDropdown(sectionId, anchor); }, 140);
    },
    scheduleCloseDropdown:scheduleCloseDropdown,
    toggleCollapse:function(){
      sidebarCollapsed = false;
      document.body.classList.remove('ajw-sidebar-collapsed');
      try{ localStorage.removeItem('ajw_sidebar_collapsed'); }catch(e){}
      renderSidebar();
    },
    toggleMobileSidebar:function(){
      document.body.classList.toggle('ajw-mobile-sidebar-open');
    },
    searchPick:function(sectionId, itemId){
      var input = document.getElementById('AJW-GLOBAL-SEARCH');
      if(input) input.value = '';
      closeSearch();
      navigate(sectionId, itemId);
    },
    focusSearch:function(){
      var input = document.getElementById('AJW-GLOBAL-SEARCH');
      if(input){
        input.focus();
        renderSearchResults(input.value);
      }
    },
    current:function(){ return {section:state.section,item:state.item}; }
  };

  window.buildTabBar = function(){
    if(typeof legacyBuildTabBar === 'function'){
      try{ legacyBuildTabBar(); }catch(e){}
    }
    ensureShell();
  };

  window._navTo = function(tabId){
    var mapped = routeLegacyTab(tabId);
    if(mapped) return navigate(mapped[0], mapped[1]);
    if(typeof legacyNav === 'function') return legacyNav.apply(this, arguments);
  };

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('load', function(){ setTimeout(init, 100); });
})();

