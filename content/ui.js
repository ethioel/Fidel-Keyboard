(() => {
  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0}
    :host{all:initial;display:block;position:fixed;left:0;top:0;width:0;height:0;
      z-index:2147483647;pointer-events:none;
      font-family:'Noto Sans Ethiopic','Abyssinica SIL','Nyala',system-ui,sans-serif;
      --kh:44px;--kw:720px;
      --bg1:rgba(255,255,255,.78);--bg2:rgba(244,248,255,.55);--fg:#1c2333;--muted:#7a8398;
      --bd:rgba(255,255,255,.8);--key:rgba(255,255,255,.72);--keyh:#fff;
      --kbd-bd:rgba(28,35,51,.08);--chip:rgba(255,255,255,.7);
      --pv:rgba(20,30,60,.06);--pvfg:#5a6377;--gkey:rgba(255,255,255,.6);
      --shadow:0 12px 40px rgba(35,45,95,.16);--toast:rgba(28,35,51,.85)}
    .wrap.dark{
      --bg1:rgba(22,26,40,.80);--bg2:rgba(15,19,32,.62);--fg:#e8ecf6;--muted:#98a2b8;
      --bd:rgba(255,255,255,.14);--key:rgba(255,255,255,.07);--keyh:rgba(255,255,255,.15);
      --kbd-bd:rgba(255,255,255,.10);--chip:rgba(255,255,255,.06);
      --pv:rgba(255,255,255,.08);--pvfg:#aab3c8;--gkey:rgba(255,255,255,.05);
      --shadow:0 14px 44px rgba(0,0,0,.55);--toast:rgba(240,244,255,.92)}
    .wrap{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);
      width:min(var(--kw),94vw);
      display:flex;flex-direction:column;gap:10px;color:var(--fg)}
    .wrap.dragging{user-select:none;-webkit-user-select:none}
    .glass{pointer-events:auto;color:var(--fg);border-radius:20px;
      background:linear-gradient(135deg,var(--bg1),var(--bg2));
      backdrop-filter:blur(22px) saturate(1.7);-webkit-backdrop-filter:blur(22px) saturate(1.7);
      border:1px solid var(--bd);box-shadow:var(--shadow),inset 0 1px 0 rgba(255,255,255,.18)}
    .bar{display:flex;align-items:center;gap:7px;padding:8px 10px;
      opacity:0;transform:translateY(14px);visibility:hidden;transition:.22s ease}
    .bar.on{opacity:1;transform:none;visibility:visible}
    .grip{flex:0 0 auto;width:20px;height:38px;border:none;background:transparent;
      color:var(--muted);cursor:grab;font-size:14px;line-height:1;touch-action:none}
    .grip:active{cursor:grabbing}
    /* 🆕 edge + corner resize handles (fade in on hover).
       MUST set pointer-events:auto — :host is pointer-events:none and these are
       children of .wrap, not of .glass, so they were previously unclickable. */
    .rz{position:absolute;z-index:4;opacity:0;transition:opacity .15s ease;
      pointer-events:auto;touch-action:none}
    .wrap:hover .rz{opacity:1}
    .rz.e{right:-4px;top:14px;bottom:14px;width:9px;cursor:ew-resize}
    .rz.s{left:14px;right:14px;bottom:-4px;height:9px;cursor:ns-resize}
    .rz.se{right:-5px;bottom:-5px;width:18px;height:18px;cursor:nwse-resize;
      border-radius:0 0 18px 0}
    .rz::after{content:'';position:absolute;background:var(--muted);opacity:.55;border-radius:2px}
    .rz.e::after{right:3px;top:50%;transform:translateY(-50%);width:3px;height:26px}
    .rz.s::after{bottom:3px;left:50%;transform:translateX(-50%);width:26px;height:3px}
    .rz.se::after{right:5px;bottom:5px;width:7px;height:7px;border-radius:0 0 3px 0}
    .logo{flex:0 0 auto;height:38px;border:none;border-radius:12px;cursor:pointer;color:#fff;
      display:flex;align-items:center;gap:4px;padding:0 10px;font-family:inherit;
      background:linear-gradient(135deg,#0a8a3a 0%,#f2c500 52%,#d8241f 100%);
      box-shadow:0 4px 12px rgba(216,36,31,.25);transition:filter .2s}
    .logo b{font-size:18px;font-weight:700}
    .logo i{width:1px;height:16px;background:rgba(255,255,255,.6)}
    .logo small{font-size:9px;font-weight:700;font-family:ui-monospace,monospace;opacity:.95}
    .logo[data-mode="en"]{filter:grayscale(.85) brightness(1.05)}
    .preview{flex:0 0 auto;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
      font:600 12px/1 ui-monospace,Menlo,monospace;color:var(--pvfg);
      background:var(--pv);padding:9px;border-radius:10px}
    .cands{display:flex;gap:6px;flex:1;overflow-x:auto;scrollbar-width:none;padding:2px}
    .cands::-webkit-scrollbar{display:none}
    .cand{flex:0 0 auto;display:flex;align-items:center;gap:7px;padding:8px 12px;font-size:15px;
      color:var(--fg);background:var(--chip);border:1px solid var(--kbd-bd);
      border-radius:12px;cursor:pointer;transition:.15s;font-family:inherit}
    .cand:hover{background:var(--keyh);box-shadow:0 4px 14px rgba(0,0,0,.14);transform:translateY(-1px)}
    .cand.primary{background:linear-gradient(135deg,rgba(10,138,58,.13),rgba(242,197,0,.16));
      border-color:rgba(10,138,58,.35)}
    .num{font-size:10px;line-height:1;color:var(--muted);border:1px solid var(--kbd-bd);
      border-radius:4px;padding:2px 4px}
    .act{flex:0 0 auto;width:36px;height:36px;border-radius:11px;cursor:pointer;font-size:15px;
      border:1px solid var(--kbd-bd);background:var(--chip);color:var(--fg);font-family:inherit}
    .act.on{background:linear-gradient(135deg,rgba(10,138,58,.18),rgba(242,197,0,.2));
      border-color:rgba(10,138,58,.4);color:#0a6e2f}
    .wrap.dark .act.on{color:#8fe0a8}
    .kbd{display:none;flex-direction:column;gap:8px;padding:10px;transform-origin:50% 100%}
    .kbd.on{display:flex;animation:kbIn .26s cubic-bezier(.2,.85,.3,1.12)}
    @keyframes kbIn{from{opacity:0;transform:translateY(16px) scale(.985)}}
    .tabs{display:flex;gap:6px;align-items:center}
    .tab{flex:1;height:34px;border-radius:10px;border:1px solid var(--kbd-bd);background:var(--chip);
      color:var(--fg);cursor:pointer;font-size:13px;font-family:inherit;
      display:flex;align-items:center;justify-content:center;gap:6px}
    .tab.on{background:linear-gradient(135deg,rgba(10,138,58,.16),rgba(242,197,0,.18));
      border-color:rgba(10,138,58,.4)}
    .sizeBtn{flex:0 0 auto;width:34px;height:34px;border-radius:10px;border:1px solid var(--kbd-bd);
      background:var(--chip);color:var(--fg);cursor:pointer;font-size:14px}
    .pane{display:none;flex-direction:column;gap:7px}
    .pane.on{display:flex}
    .strip{display:flex;gap:5px;overflow-x:auto;scrollbar-width:none;padding:2px}
    .strip::-webkit-scrollbar{display:none}
    .skey{flex:0 0 auto;min-width:calc(var(--kh)*.72);height:calc(var(--kh)*.72);
      display:flex;align-items:center;justify-content:center;gap:4px;
      border-radius:8px;border:1px solid var(--kbd-bd);background:var(--gkey);
      color:var(--fg);font-size:calc(var(--kh)*.42);cursor:pointer;font-family:inherit;
      transition:height .18s ease,font-size .18s ease}
    .skey:hover{background:var(--keyh)}
    /* 🆕 sibling-family chip — gold tint to distinguish from form keys */
    .skey.sibk{border-color:rgba(242,197,0,.6);
      background:linear-gradient(135deg,rgba(242,197,0,.14),rgba(216,36,31,.08))}
    .wrap.dark .skey.sibk{border-color:rgba(242,197,0,.45)}
    .rows{display:flex;flex-direction:column;gap:7px}
    .row{display:flex;gap:6px}
    .key{flex:1;height:var(--kh);border-radius:12px;cursor:pointer;
      font-size:calc(var(--kh)*.42);color:var(--fg);
      border:1px solid var(--kbd-bd);background:var(--key);font-family:inherit;
      touch-action:manipulation;
      transition:height .18s ease,font-size .18s ease,transform .06s,background .15s}
    .key:hover{background:var(--keyh)}
    .key:active{transform:scale(.93);
      background:linear-gradient(135deg,rgba(10,138,58,.16),rgba(242,197,0,.18))}
    .key.trace{background:linear-gradient(135deg,rgba(10,138,58,.3),rgba(242,197,0,.32));
      border-color:rgba(10,138,58,.5)}
    .trace-on .rows{touch-action:none}
    .key.shift,.key.shk,.key.symk{flex:1.5;font-size:calc(var(--kh)*.38)}
    .key.enter{flex:1.8}
    .key.sp{flex:4.6;color:var(--muted);font-size:calc(var(--kh)*.32)}
    .key.shift.on{background:linear-gradient(135deg,rgba(10,138,58,.18),rgba(242,197,0,.2));
      border-color:rgba(10,138,58,.4)}
    .key.shift.lock{background:linear-gradient(135deg,rgba(10,138,58,.34),rgba(242,197,0,.36));
      border-color:rgba(10,138,58,.55)}
    .symk{color:#0a6e2f}
    .wrap.dark .symk{color:#8fe0a8}
    .key.fam{display:flex;flex-direction:column;align-items:center;justify-content:center;
      line-height:1.05;height:calc(var(--kh) - 2px)}
    .key.fam span{font-size:calc(var(--kh)*.36)}
    .key.fam small{font-size:calc(var(--kh)*.2);color:var(--muted);font-family:ui-monospace,monospace}
    /* 🆕 extended (non-standard) family keys — gold tint */
    .key.fam.extk{background:linear-gradient(135deg,rgba(242,197,0,.14),rgba(216,36,31,.10));
      border-color:rgba(242,197,0,.5)}
    .grid-wrap{max-height:calc(var(--kh)*5.2);overflow:auto;border-radius:12px;padding-right:2px;
      transition:max-height .18s ease}
    .grow{display:flex;gap:4px;margin-bottom:4px}
    /* 🆕 the ⇧-revealed labiovelar / ዋ-compound block of the ሰሌዳ pane */
    .grid-wrap.ext:empty{display:none}
    .grid-wrap.ext{margin-top:6px;padding-top:6px;border-top:1px solid var(--kbd-bd)}
    .grid-wrap.ext .gkey{background:linear-gradient(135deg,rgba(242,197,0,.14),rgba(216,36,31,.10))}
    .glab{flex:0 0 28px;display:grid;place-items:center;font:10px ui-monospace,monospace;color:var(--muted)}
    .gkey{flex:1;height:calc(var(--kh)*.68);border-radius:8px;border:1px solid var(--kbd-bd);
      background:var(--gkey);color:var(--fg);font-size:calc(var(--kh)*.32);cursor:pointer;
      font-family:inherit;transition:height .18s ease,font-size .18s ease}
    .gkey:hover{background:var(--keyh)}
    .etabs{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}
    .etabs::-webkit-scrollbar{display:none}
    .etab{flex:0 0 auto;width:40px;height:32px;border-radius:9px;border:1px solid var(--kbd-bd);
      background:var(--chip);cursor:pointer;font-size:17px}
    .etab.on{background:linear-gradient(135deg,rgba(10,138,58,.18),rgba(242,197,0,.2));
      border-color:rgba(10,138,58,.4)}
    .egrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(40px,1fr));gap:4px;
      max-height:calc(var(--kh)*4.4);overflow:auto;align-content:start;transition:max-height .18s ease}
    .emoji{height:calc(var(--kh)*.86);border:none;border-radius:9px;background:transparent;
      cursor:pointer;font-size:calc(var(--kh)*.5);color:var(--fg)}
    .emoji:hover{background:var(--keyh)}
    .ehint{grid-column:1/-1;color:var(--muted);font-size:12px;text-align:center;padding:18px 0}
    /* 🆕 toast lives inside .wrap so the .wrap.dark override actually applies,
       and uses a light colour on the dark chip so the text is readable */
    .toast{position:fixed;left:50%;bottom:130px;transform:translateX(-50%);z-index:5;
      color:#eef2ff;background:var(--toast);padding:8px 14px;border-radius:999px;font-size:13px;
      opacity:0;transition:.25s;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.2)}
    .wrap.dark .toast{color:#111827}
    .toast.on{opacity:1}
    button:focus-visible{outline:2px solid #0a8a3a;outline-offset:1px}
    .wrap.dark button:focus-visible{outline-color:#8fe0a8}
    .lh{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  `;

  const NUM_GEEZ = ["፩","፪","፫","፬","፭","፮","፯","፰","፱","፲","፳","፴","፵","፶","፷","፸","፹","፺","፻","፼"];
  const DIGITS = "1234567890".split("");
  /* 🆕 punctuation split: Ethiopic marks vs common ASCII — mode picks the order */
  const ETHIOPIC_MARKS = ["፡","።","፣","፤","፥","፦","፧","፠","፨"];
  const SYM_COMMON = ["«","»","‹","›","!","?","¡","¿","@","#","$","%","^","&","*",
    "(",")","[","]","{","}","-","_","=","+","/","\\","|",";",":","'","\"","<",">","~","`",
    "€","£","¥","•","…","°","§","©","®","™","±","×","÷","≠","≤","≥","✦","✧","★"];
  const SYMS = { am: [...ETHIOPIC_MARKS, ...SYM_COMMON], en: SYM_COMMON };
  const NUMS = { am: NUM_GEEZ, en: DIGITS };

  const GRID_ORDER = ["h","l","hh","m","ss","r","s","sh","q","b","v","t","ch","x","n","ny",
    "a","aa","k","kh","w","z","zh","y","d","j","g","gn","t'","ch'","p'","ts","ts'","f","p"];
  const QWERTY = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const GEEZ_LAYOUTS = {
    hagaz: { label: "ሀግዕዝ", def: 0, rows: [
      ["h","l","hh","m","ss","r","s","sh","q","b"],
      ["v","t","ch","x","n","ny","a","aa","k","kh"],
      ["w","z","zh","y","d","j","g","gn","t'","ch'"],
      ["p'","ts","ts'","f","p"] ]},
    sadis: { label: "ሳድስ", def: 5, rows: [
      ["t","n","m","s","l","a","r","b","g","d"],
      ["k","w","h","sh","y","ch","j","z","f","p"],
      ["q","kh","x","ny","zh","gn","t'","ch'","ts"],
      ["aa","p'","ts'","ss","hh","v"] ]}
  };
  /* 🆕 ⇧ reveals the non-standard families: the extra series (ቐ ዸ), the
     labiovelars (ቈ ኰ ኈ ጐ ዀ) and the fused ዋ-compounds (ሏ ሗ ሟ ቧ ኗ ዟ …). */
  const GEEZ_EXT = { def: 0, rows: [
    ["qh","dh","khw"],
    ["qʷ","kʷ","xʷ","gʷ"],
    ["lʷ","hhʷ","mʷ","ssʷ","rʷ","sʷ","shʷ","bʷ","vʷ","tʷ","chʷ"],
    ["nʷ","nyʷ","zʷ","zhʷ","jʷ","t'ʷ","ch'ʷ","tsʷ","fʷ","pʷ"] ]};

  /* 🆕 Ethiopic interchangeable (homophonous) families.
     ቀ/ከ/ኸ are NOT grouped — distinct sounds, kept separate on purpose.
     ቐ/ዸ/ዀ are standalone: they have no homophone group. */
  const SIB = { h:["h","hh","x"], s:["s","ss"], a:["a","aa"], ts:["ts","ts'"] };
  const SIBOF = { hh:"h", x:"h", ss:"s", aa:"a", "ts'":"ts" };
  const sibGroup = f => SIB[f] || (SIBOF[f] ? SIB[SIBOF[f]] : null);

  const H = {};
  let root, wrap, bar, candsEl, previewEl, toastEl, logoEl, kbdBtn, emojiBtn, clipBtn, sizeBtn, symBtn, liveEl;
  let kbdEl, stripEl, rowsEl, panes = {}, tabs = {}, egridEl, etabsEl, shiftBtn;
  let gridWrap = null, gridExt = null, buildGrid = null;
  let p1El, p2El;
  let pendingPane = "hagaz", etab = 0, shiftState = 0;
  let stripMode = "gez";
  let curFam = null, gStripMode = "gez";
  const gStrips = {};
  let curFormIdx = 0;
  let gStripKey = "";
  /* 🆕 typing mode (drives strips) + extended-shift state */
  let uiMode = "am";
  let gShift = 0;                                   /* 0 off · 1 one-shot · 2 lock */
  const gRows = {}, gShiftBtns = [];
  let traceOn = false, tracing = false, traceSet = null, traceLast = null;
  let hbTimer = 0, wdCheckTimer = 0;
  /* 🆕 teardown bookkeeping: window/visualViewport handlers registered by build(),
     plus the host element itself, so destroy() can unregister every one of them. */
  const winBound = [];
  let mountedHost = null;

  /* 🆕 the removal watcher, as a page-world source string. The content script injects it
     inline (works on most sites) and background.js registers the identical code as a
     document_start MAIN-world content script (works on strict-CSP sites too), so one
     definition is kept here in the shipped file and mirrored in background.js.

     It runs entirely in the page's world, so it outlives the extension's isolated world
     — which is the only reason anything can clean up after the extension is gone. Once
     the heartbeats stop (extension removed or reloaded) it deletes the host, and it
     re-checks immediately when the page becomes visible instead of waiting out Chrome's
     once-a-minute throttling of hidden-tab timers. */
  const AMK_WATCHDOG_SRC =
    "(()=>{if(window.__amkWd)return;window.__amkWd=1;var S=6000,T=500,t0=Date.now(),iv=0;"
    + "function sweep(){if(document.hidden)return;"
    /* 🆕 stop signal: destroy() sets this flag, and the watcher tears its own 500ms
       interval down on the next sweep. Without it the interval outlives the keyboard
       and keeps waking the page forever. */
    + "if(document.documentElement.hasAttribute('data-amk-wdstop')){"
    + "document.documentElement.removeAttribute('data-amk-wdstop');"
    + "try{clearInterval(iv)}catch(e){}return;}"
    + "var hs=document.querySelectorAll('#fidle-host');"
    + "for(var i=0;i<hs.length;i++){var h=hs[i];"
    + "var b=Number(h.getAttribute('data-amk-beat'))||0;"
    + "var born=Number(h.getAttribute('data-amk-born'))||t0;"
    + "var ref=b?Date.now()-b:Date.now()-born;"
    + "if(ref>S){try{h.remove()}catch(e){}}}}"
    + "iv=setInterval(sweep,T);"
    + "document.addEventListener('visibilitychange',function(){if(!document.hidden)sweep()});"
    + "addEventListener('focus',sweep);addEventListener('pageshow',sweep);"
    + "try{document.documentElement.setAttribute('data-amk-wd','1')}catch(e){}"
    + "sweep()})()";
  let theme = "auto", curPos = null, dragged = false, dragging = false, dragOff = { x: 0, y: 0 };

  const ready = () => !!wrap;
  const famOf = k => window.AMKTranslit.fam(k);
  const symLabel = mode => uiMode === "en"
    ? (mode === "sym" ? "!#@" : "123")
    : (mode === "gez" ? "#±" : mode === "sym" ? "123" : "፩");
  function stripList(kind) {
    if (kind === "sym") return SYMS[uiMode];
    if (kind === "num") return DIGITS;
    return NUMS[uiMode];                            /* "gez": am→፩ · en→123 */
  }

  /* ================= SMART RESIZE ================= */
  const SIZES = { s: 36, m: 44, l: 54 };
  const KH_MIN = 26, KH_MAX = 64;
  let sizeMode = "m", rafR = 0, khManual = null;      /* khManual: set by edge-drag / saved px */
  const vhPx = () => (window.visualViewport ? visualViewport.height : innerHeight) || innerHeight;
  function clampManual() {
    let k = Math.max(KH_MIN, Math.min(KH_MAX, khManual));
    const budget = Math.floor((vhPx() - 200) / 4.6);
    k = Math.max(KH_MIN, Math.min(k, Math.max(KH_MIN, budget)));
    khManual = k;
    wrap.style.setProperty("--kh", k + "px");
  }
  function applySize() {
    if (!ready()) return;
    if (khManual != null) { clampManual(); return; }
    const vw = innerWidth;
    let k = SIZES[sizeMode] || 44;
    if (vw < 560) k = Math.min(k, 38);
    if (vw < 400) k = Math.min(k, 33);
    const budget = Math.floor((vhPx() - 200) / 4.6);
    k = Math.max(28, Math.min(k, Math.max(28, budget)));
    wrap.style.setProperty("--kh", k + "px");
  }
  function onResize() { cancelAnimationFrame(rafR); rafR = requestAnimationFrame(applySize); }
  function cycleSize() {
    if (!ready()) return;
    khManual = null;                                   /* drop manual override */
    sizeMode = sizeMode === "s" ? "m" : sizeMode === "m" ? "l" : "s";
    applySize(); sizeBtn.title = "Key size: " + sizeMode.toUpperCase();
    toast("Key size: " + sizeMode.toUpperCase());
    H.saveSize && H.saveSize(sizeMode);
  }

  /* ================= theme / panes ================= */
  const mq = matchMedia("(prefers-color-scheme: dark)");
  function applyTheme() { if (ready()) wrap.classList.toggle("dark", theme === "dark" || (theme === "auto" && mq.matches)); }
  const onSchemeChange = () => theme === "auto" && applyTheme();
  mq.addEventListener("change", onSchemeChange);

  function setPane(name) {
    if (!ready() || !panes[name]) return;
    pendingPane = name;
    for (const k in panes) panes[k].classList.toggle("on", k === name);
    for (const k in tabs) tabs[k].classList.toggle("on", k === name);
    if (name === "emoji") renderEmoji();
  }

  function renderEmoji() {
    if (!ready()) return;
    egridEl.innerHTML = "";
    const fill = list => list.forEach(ch => {
      const b = document.createElement("button"); b.className = "emoji"; b.textContent = ch;
      b.onclick = () => H.emoji && H.emoji(ch);
      egridEl.append(b);
    });
    if (etab === 0) {
      window.AMKEmoji.recents().then(r => {
        if (etab !== 0) return;
        if (r.length) fill(r);
        else { const p = document.createElement("div"); p.className = "ehint";
               p.textContent = "እስካ አሁን ምንም emoji — No recents yet"; egridEl.append(p); }
      });
    } else fill(window.AMK_EMOJI_TABS[etab].list || []);
  }

  /* ================= 🆕 mode-aware strips ================= */
  function setMode(m) {
    const nm = m === "en" ? "en" : "am";
    if (nm === uiMode) return;
    uiMode = nm;
    stripMode = uiMode === "en" ? "num" : "gez";
    gStripKey = "";
    if (!ready()) return;
    renderStrip(); renderGeezStrips();
    if (p1El) {
      p1El.textContent = uiMode === "en" ? "," : "፣";
      p2El.textContent = uiMode === "en" ? "." : "።";
    }
  }

  function renderStrip() {
    if (!ready()) return;
    stripEl.innerHTML = "";
    stripList(stripMode).forEach(ch => {
      const b = document.createElement("button"); b.className = "skey"; b.textContent = ch;
      b.setAttribute("aria-label", ch);
      b.onclick = () => { announce(ch); H.char && H.char(ch); };
      stripEl.append(b);
    });
    if (symBtn) {
      symBtn.textContent = symLabel(stripMode);
      symBtn.title = uiMode === "en" ? "Digits / symbols" : "የግዕዝ ቁጥሮች / ምልክቶች / ቁጥሮች";
    }
  }
  function cycleStrip() {
    if (!ready()) return;
    if (uiMode === "en") stripMode = stripMode === "sym" ? "num" : "sym";
    else stripMode = stripMode === "gez" ? "sym" : stripMode === "sym" ? "num" : "gez";
    renderStrip();
    toast(stripMode === "sym" ? (uiMode === "en" ? "Symbols" : "ምልክቶች")
        : uiMode === "en" ? "Digits" : stripMode === "num" ? "ቁጥሮች (digits)" : "የግዕዝ ቁጥሮች");
  }

  /* ================= Geez strips: family forms + siblings ================= */
  function renderGeezStrips() {
    if (!ready()) return;
    const key = (curFam || "-") + "|" + curFormIdx + "|" + gStripMode + "|" + uiMode;
    if (key === gStripKey) return;
    gStripKey = key;
    for (const name of Object.keys(gStrips)) {
      const el = gStrips[name]; if (!el) continue;
      el.innerHTML = "";
      if (curFam && famOf(curFam)) {
        const back = document.createElement("button"); back.className = "skey";
        back.textContent = "፩"; back.title = "Ge'ez numerals";
        back.onclick = () => { curFam = null; renderGeezStrips(); };
        el.append(back);
        [...famOf(curFam)].forEach((ch, i) => {
          const b = document.createElement("button"); b.className = "skey";
          const n = document.createElement("span"); n.className = "num"; n.textContent = i + 1;
          b.append(n, document.createTextNode(ch));
          b.setAttribute("aria-label", ch);
          b.title = "Form " + (i + 1);
          b.onclick = () => { curFormIdx = i; renderGeezStrips(); announce(ch); H.form && H.form(ch); };
          el.append(b);
        });
        const grp = sibGroup(curFam);
        (grp || []).forEach(sk => {
          if (sk === curFam) return;
          const SF = famOf(sk); if (!SF) return;
          const b = document.createElement("button"); b.className = "skey sibk";
          b.textContent = SF[curFormIdx] ?? SF[0];
          b.title = sk + " family — same form · physical: Tab";
          b.setAttribute("aria-label", b.textContent);
          b.onclick = () => {
            curFam = sk; renderGeezStrips();
            announce(b.textContent);
            H.familySwap && H.familySwap(sk, curFormIdx);
          };
          el.append(b);
        });
        const sym = document.createElement("button"); sym.className = "skey";
        sym.textContent = "#±"; sym.title = "Symbols / digits";
        sym.onclick = () => { curFam = null; cycleGStrip(); };
        el.append(sym);
      } else {
        stripList(gStripMode).forEach(ch => {
          const b = document.createElement("button"); b.className = "skey"; b.textContent = ch;
          b.setAttribute("aria-label", ch);
          b.onclick = () => { announce(ch); H.char && H.char(ch); };
          el.append(b);
        });
        const sym = document.createElement("button"); sym.className = "skey";
        sym.textContent = symLabel(gStripMode); sym.title = "Symbols / digits";
        sym.onclick = () => cycleGStrip();
        el.append(sym);
      }
    }
  }
  function cycleGStrip() {
    if (uiMode === "en") gStripMode = gStripMode === "sym" ? "num" : "sym";
    else gStripMode = gStripMode === "gez" ? "sym" : gStripMode === "sym" ? "num" : "gez";
    gStripKey = "";
    renderGeezStrips();
    toast(gStripMode === "sym" ? (uiMode === "en" ? "Symbols" : "ምልክቶች")
        : uiMode === "en" ? "Digits" : gStripMode === "num" ? "ቁጥሮች (digits)" : "የግዕዝ ቁጥሮች");
  }

  /* ================= shift / EN rows ================= */
  function paintShift() {
    if (!shiftBtn) return;
    shiftBtn.classList.toggle("on", shiftState > 0);
    shiftBtn.classList.toggle("lock", shiftState === 2);
    shiftBtn.setAttribute("aria-pressed", String(shiftState > 0));
  }
  function cycleShift() { if (!ready()) return; shiftState = shiftState === 2 ? 0 : shiftState + 1; paintShift(); }

  /* 🆕 extended-shift (Geez panes) */
  function paintGShift() {
    gShiftBtns.forEach(b => {
      b.classList.toggle("on", gShift > 0);
      b.classList.toggle("lock", gShift === 2);
      b.setAttribute("aria-pressed", String(gShift > 0));
    });
  }
  function cycleGShift() {
    if (!ready()) return;
    gShift = gShift === 2 ? 0 : gShift + 1;
    paintGShift();
    Object.keys(gRows).forEach(buildGeezRows);
    if (buildGrid) buildGrid(gShift > 0);
    toast(gShift === 2 ? "ተጨማሪ ፊደላት — lock" : gShift === 1 ? "ተጨማሪ ፊደላት (extended)"
         : "መደበኛ ፊደላት");
  }
  function buildGeezRows(name) {
    const el = gRows[name]; if (!el) return;
    const ext = gShift > 0;
    const L = ext ? GEEZ_EXT : GEEZ_LAYOUTS[name];
    el.innerHTML = "";
    L.rows.forEach(rowKeys => {
      const r = document.createElement("div"); r.className = "row";
      rowKeys.forEach(k => {
        const F = famOf(k); if (!F) return;
        const b = document.createElement("button");
        b.className = "key fam" + (ext ? " extk" : "");
        const s = document.createElement("span"); s.textContent = F[L.def];
        const sm = document.createElement("small"); sm.textContent = k;
        b.append(s, sm);
        b.setAttribute("aria-label", F[L.def]);
        b.title = k + (sibGroup(k) ? " · interchangeable: " + sibGroup(k).join(" ")
                        : " — " + F.length + " form" + (F.length === 1 ? "" : "s") + " on the number row");
        b.onclick = () => {
          curFam = k; curFormIdx = L.def;
          renderGeezStrips();
          announce(F[L.def]);
          H.family && H.family(k, L.def);
          if (ext && gShift === 1) { gShift = 0; paintGShift(); buildGeezRows(name); }
        };
        r.append(b);
      });
      el.append(r);
    });
  }

  function mkKey(label, cls, fn) {
    const b = document.createElement("button");
    b.className = "key" + (cls ? " " + cls : "");
    b.textContent = label;
    b.setAttribute("aria-label", label);
    b.onclick = fn;
    return b;
  }
  function mkLetter(ch) {
    const b = document.createElement("button");
    b.className = "key"; b.textContent = ch; b.dataset.l = ch;
    b.setAttribute("aria-label", ch);
    b.onclick = () => pressLetter(ch);
    return b;
  }
  function pressLetter(ch) {
    const c = shiftState ? ch.toUpperCase() : ch;
    if (shiftState === 1) { shiftState = 0; paintShift(); }
    announce(c);
    H.latin && H.latin(c);
  }
  function buildRows() {
    rowsEl.innerHTML = "";
    const [r1s, r2s, r3s] = QWERTY;
    const mk = str => { const d = document.createElement("div"); d.className = "row";
      [...str].forEach(c => d.append(mkLetter(c))); return d; };
    rowsEl.append(mk(r1s), mk(r2s));
    const r3 = document.createElement("div"); r3.className = "row";
    shiftBtn = document.createElement("button");
    shiftBtn.className = "key shift"; shiftBtn.textContent = "⇧"; shiftBtn.setAttribute("aria-label", "Shift");
    shiftBtn.onclick = cycleShift;
    r3.append(shiftBtn);
    [...r3s].forEach(c => r3.append(mkLetter(c)));
    const bs = document.createElement("button");
    bs.className = "key shk"; bs.textContent = "⌫"; bs.setAttribute("aria-label", "Backspace");
    bs.onclick = () => H.backspace && H.backspace();
    r3.append(bs);
    rowsEl.append(r3);
    paintShift();
  }

  /* ================= Geez letter panes ================= */
  function buildGeezPane(name) {
    const pane = document.createElement("div"); pane.className = "pane";
    const strip = document.createElement("div"); strip.className = "strip";
    gStrips[name] = strip;
    const rowsElG = document.createElement("div"); rowsElG.className = "rows";
    gRows[name] = rowsElG;
    buildGeezRows(name);
    const bottom = document.createElement("div"); bottom.className = "row";
    const shb = document.createElement("button");
    shb.className = "key shift"; shb.textContent = "⇧";
    shb.setAttribute("aria-label", "Extended letters");
    shb.title = "ተጨማሪ ፊደላት (ቐ ዸ ዀ · ላቢዮ · ው-ኮምፖውንድ) — double-tap = lock";
    shb.onclick = cycleGShift;
    gShiftBtns.push(shb);
    bottom.append(shb,
      mkKey("፣", "", () => { announce("፣"); H.punct && H.punct("፣"); }),
      mkKey("⌫", "shk", () => H.backspace && H.backspace()),
      mkKey("ክፍት", "sp", () => H.space && H.space()),
      mkKey("።", "", () => { announce("።"); H.punct && H.punct("።"); }),
      mkKey("↵", "enter", () => H.enter && H.enter())
    );
    pane.append(strip, rowsElG, bottom);
    panes[name] = pane;
  }

  /* ================= trace typing (EN pane) ================= */
  function addTrace(k) { k.classList.add("trace"); traceSet.add(k); }
  function clearTrace() { traceSet && traceSet.forEach(b => b.classList.remove("trace")); traceSet = null; traceLast = null; }
  function wireTrace() {
    panes.intl.addEventListener("pointerdown", e => {
      if (!traceOn) return;
      const k = e.target.closest && e.target.closest(".key");
      if (!k || !k.dataset.l) return;
      tracing = true; traceSet = new Set(); traceLast = k;
      addTrace(k);
      try { panes.intl.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    panes.intl.addEventListener("pointermove", e => {
      if (!tracing) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const k = el && el.closest ? el.closest(".key") : null;
      if (k && k.dataset.l && k !== traceLast) { traceLast = k; addTrace(k); }
    });
    const finish = () => {
      if (!tracing) return;
      tracing = false;
      const letters = traceSet ? [...traceSet].map(b => b.dataset.l) : [];
      clearTrace();
      if (!letters.length) return;
      if (letters.length === 1) { pressLetter(letters[0]); return; }
      letters.forEach(c => H.latin && H.latin(shiftState ? c.toUpperCase() : c));
      if (shiftState === 1) { shiftState = 0; paintShift(); }
      announce(letters.join(""));
    };
    panes.intl.addEventListener("pointerup", finish);
    panes.intl.addEventListener("pointercancel", () => { tracing = false; clearTrace(); });
  }
  function setTrace(v) { if (!ready()) return; traceOn = !!v; kbdEl.classList.toggle("trace-on", traceOn); }

  /* ================= a11y ================= */
  function announce(msg) {
    if (!liveEl) return;
    liveEl.textContent = "";
    setTimeout(() => { liveEl.textContent = msg; }, 10);
  }

  /* ================= drag · snap · edge resize ================= */
  const EDGE = 6, SNAP = 24, KW_MIN = 300, KW_MAX = 1100;
  let rzing = null, dragPid = null;
  function vwPx() { return innerWidth; }
  function clampPos(p) {
    const w = wrap.offsetWidth || 300, h = wrap.offsetHeight || 80;
    const W = vwPx(), H = vhPx();
    return { left: Math.min(Math.max(EDGE, p.left), Math.max(EDGE, W - w - EDGE)),
             top:  Math.min(Math.max(EDGE, p.top),  Math.max(EDGE, H - h - EDGE)) };
  }
  function applyPos(p) {
    if (!ready()) return;
    curPos = clampPos(p);
    wrap.style.left = curPos.left + "px"; wrap.style.top = curPos.top + "px";
    wrap.style.bottom = "auto"; wrap.style.transform = "none";
  }
  function resetPos() {
    if (!ready()) return;
    curPos = null; dragged = false;
    wrap.style.left = ""; wrap.style.top = ""; wrap.style.bottom = ""; wrap.style.transform = "";
  }
  /* 🆕 graceful edges: snap to the nearest edge / centre on release */
  function snapPos() {
    if (!ready() || !curPos) return;
    const w = wrap.offsetWidth || 300, h = wrap.offsetHeight || 80;
    const W = vwPx(), H = vhPx();
    let left = curPos.left, top = curPos.top;
    let bx = null, bxd = SNAP + 1;
    for (const x of [EDGE, (W - w) / 2, W - w - EDGE]) {
      const d = Math.abs(left - x); if (d < bxd) { bxd = d; bx = x; }
    }
    let by = null, byd = SNAP + 1;
    for (const y of [EDGE, H - h - EDGE]) {
      const d = Math.abs(top - y); if (d < byd) { byd = d; by = y; }
    }
    if (bx !== null) left = bx;
    if (by !== null) top = by;
    applyPos({ left, top });
  }
  function startDrag(e) {
    if (!ready()) return;
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    dragged = true; dragging = true; dragPid = e.pointerId;
    wrap.classList.add("dragging");
    const r = wrap.getBoundingClientRect();      /* measured live → no transition jump */
    dragOff = { x: e.clientX - r.left, y: e.clientY - r.top };
    try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
    moveDrag(e);
  }
  function moveDrag(e) {
    if (!dragging) return;
    applyPos({ left: e.clientX - dragOff.x, top: e.clientY - dragOff.y });
  }
  function endDrag() {
    if (!dragging) return;
    dragging = false; dragPid = null;
    wrap.classList.remove("dragging");
    snapPos();
    H.savePos && H.savePos(curPos);
  }
  /* 🆕 edge / corner resize: right edge = width, bottom edge + corner = key size */
  function startResize(e, mode) {
    if (!ready()) return;
    if (e.button != null && e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    dragged = true;
    const rw = wrap.getBoundingClientRect().width || wrap.offsetWidth ||
               parseFloat(getComputedStyle(wrap).getPropertyValue("--kw")) || 0;
    rzing = { mode, x: e.clientX, y: e.clientY,
              w: rw || KW_MAX,
              kh: parseFloat(getComputedStyle(wrap).getPropertyValue("--kh")) || 44 };
    wrap.classList.add("dragging");
    try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
  }
  function moveResize(e) {
    if (!rzing) return;
    if (rzing.mode === "e" || rzing.mode === "se") {
      const w = Math.min(Math.max(KW_MIN, rzing.w + (e.clientX - rzing.x)),
                         Math.min(KW_MAX, vwPx() - EDGE * 2));
      wrap.style.setProperty("--kw", w + "px");
    }
    if (rzing.mode === "s" || rzing.mode === "se") {
      khManual = rzing.kh + (e.clientY - rzing.y) / 4.6;   /* ~4.6 key-heights of travel */
      clampManual();
    }
    if (curPos) applyPos(curPos);                            /* keep it on screen as it grows */
  }
  function endResize() {
    if (!rzing) return;
    const mode = rzing.mode;
    rzing = null;
    wrap.classList.remove("dragging");
    if (curPos) { applyPos(curPos); H.savePos && H.savePos(curPos); }
    H.saveWidth && H.saveWidth(parseFloat(getComputedStyle(wrap).getPropertyValue("--kw")) || KW_MAX);
    if (mode === "s" || mode === "se") H.saveSizePx && H.saveSizePx(Math.round(khManual || 44));
  }

  function anchorTo(el) {
    if (!ready() || dragged || !el || !document.contains(el)) return;
    const r = el.getBoundingClientRect();
    const h = wrap.offsetHeight || 120, w = wrap.offsetWidth || 320;
    const vTop = window.visualViewport ? visualViewport.offsetTop : 0;
    const vH = vhPx();
    let top = r.top - h - 10;
    if (top < vTop + 6) {
      top = r.bottom + 10;
      if (top + h > vTop + vH - 6) top = Math.max(6, vTop + vH - h - 6);
    }
    let left = r.left;
    if (left + w > innerWidth - 6) left = innerWidth - w - 6;
    if (left < 6) left = 6;
    wrap.style.left = left + "px"; wrap.style.top = top + "px";
    wrap.style.bottom = "auto"; wrap.style.transform = "none";
    curPos = { left, top };
  }

  /* ================= build ================= */
  function build() {
    /* re-arm what destroy() may have unbound; addEventListener dedupes the
       identical (type, fn, capture) triple, so this is a no-op on a fresh mount */
    try { mq.addEventListener("change", onSchemeChange); } catch (_) {}
    /* 🆕 a reload or removal leaves the old closed shadow root sitting in the page */
    for (const stale of [...document.querySelectorAll("#fidle-host")]) {
      try { stale.remove(); } catch (_) {}
    }
    const host = document.createElement("div"); host.id = "fidle-host";
    /* the page-world watcher needs a mount timestamp so it can also judge a host whose
       heartbeat never started (extension reloaded between create and first beat) */
    host.setAttribute("data-amk-born", String(Date.now()));
    const sh = host.attachShadow({ mode: "closed" });
    const st = document.createElement("style"); st.textContent = CSS; sh.append(st);
    wrap = document.createElement("div"); wrap.className = "wrap";

    bar = document.createElement("div"); bar.className = "bar glass"; bar.setAttribute("role", "toolbar");
    const grip = document.createElement("button"); grip.className = "grip";
    grip.textContent = "⠿"; grip.title = "Drag to move — snaps to edges";
    grip.setAttribute("aria-label", "Move keyboard");
    grip.addEventListener("pointerdown", startDrag);
    /* 🆕 window-level move/up so the drag survives the pointer leaving the grip.
       Named so destroy() can unregister them — an anonymous arrow here leaks a
       listener per mount. */
    const onWinMove = e => { moveDrag(e); moveResize(e); };
    const onWinUp = e => { endDrag(); endResize();
      if (dragPid != null && e.pointerId === dragPid) dragPid = null; };
    const onWinCancel = () => {
      dragging = false; dragPid = null; rzing = null;
      wrap && wrap.classList.remove("dragging");
    };
    addEventListener("pointermove", onWinMove, true);
    addEventListener("pointerup", onWinUp, true);
    addEventListener("pointercancel", onWinCancel, true);
    /* store unregister closures, not the handlers, so destroy() needs no type map */
    winBound.push(
      () => removeEventListener("pointermove", onWinMove, true),
      () => removeEventListener("pointerup", onWinUp, true),
      () => removeEventListener("pointercancel", onWinCancel, true));

    logoEl = document.createElement("button"); logoEl.className = "logo";
    logoEl.innerHTML = "<b>ፊ</b><i></i><small>fi</small>";
    logoEl.title = "አማርኛ / English toggle"; logoEl.setAttribute("aria-label", "Toggle language");
    logoEl.onclick = () => H.toggleMode && H.toggleMode();

    previewEl = document.createElement("div"); previewEl.className = "preview"; previewEl.style.display = "none";
    candsEl = document.createElement("div"); candsEl.className = "cands";
    candsEl.addEventListener("wheel", e => { candsEl.scrollLeft += e.deltaY; e.preventDefault(); }, { passive: false });

    clipBtn = document.createElement("button"); clipBtn.className = "act";
    clipBtn.textContent = "⧉"; clipBtn.title = "Clipboard history"; clipBtn.style.display = "none";
    clipBtn.onclick = () => H.clip && H.clip();
    emojiBtn = document.createElement("button"); emojiBtn.className = "act";
    emojiBtn.textContent = "😊"; emojiBtn.title = "Emoji";
    emojiBtn.onclick = () => H.openEmoji && H.openEmoji();
    kbdBtn = document.createElement("button"); kbdBtn.className = "act";
    kbdBtn.textContent = "⌨"; kbdBtn.title = "On-screen keyboard";
    kbdBtn.onclick = () => H.toggleKbd && H.toggleKbd();
    const closeBtn = document.createElement("button"); closeBtn.className = "act";
    closeBtn.textContent = "✕"; closeBtn.title = "Hide";
    closeBtn.onclick = () => H.hide && H.hide();
    bar.append(grip, logoEl, previewEl, candsEl, clipBtn, emojiBtn, kbdBtn, closeBtn);

    kbdEl = document.createElement("div"); kbdEl.className = "kbd glass";
    kbdEl.setAttribute("role", "application"); kbdEl.setAttribute("aria-label", "ፊደል on-screen keyboard");
    const tabsRow = document.createElement("div"); tabsRow.className = "tabs";
    const mkTab = (name, label) => {
      const t = document.createElement("button"); t.className = "tab"; t.textContent = label;
      t.onclick = () => setPane(name); tabs[name] = t; return t;
    };
    tabsRow.append(mkTab("intl", "⌨ EN"), mkTab("hagaz", "ሀግዕዝ"), mkTab("sadis", "ሳድስ"),
                   mkTab("grid", "ሰሌዳ"), mkTab("emoji", "😊"));
    sizeBtn = document.createElement("button"); sizeBtn.className = "sizeBtn";
    sizeBtn.textContent = "⇕"; sizeBtn.title = "Key size: M"; sizeBtn.setAttribute("aria-label", "Key size");
    sizeBtn.onclick = cycleSize;
    tabsRow.append(sizeBtn);

    /* EN pane */
    panes.intl = document.createElement("div"); panes.intl.className = "pane";
    stripEl = document.createElement("div"); stripEl.className = "strip";
    renderStrip();
    rowsEl = document.createElement("div"); rowsEl.className = "rows";
    buildRows();
    const bottom = document.createElement("div"); bottom.className = "row";
    symBtn = document.createElement("button");
    symBtn.className = "key symk"; symBtn.textContent = symLabel(stripMode);
    symBtn.setAttribute("aria-label", "Symbols");
    symBtn.onclick = cycleStrip;
    p1El = document.createElement("button"); p1El.className = "key"; p1El.textContent = "፣";
    p1El.onclick = () => {
      if (uiMode === "en") { H.char && H.char(","); }
      else { announce("፣"); H.punct && H.punct("፣"); }
    };
    const sp = document.createElement("button"); sp.className = "key sp"; sp.textContent = "ክፍት";
    sp.setAttribute("aria-label", "Space");
    sp.onclick = () => H.space && H.space();
    p2El = document.createElement("button"); p2El.className = "key"; p2El.textContent = "።";
    p2El.onclick = () => {
      if (uiMode === "en") { H.char && H.char("."); }
      else { announce("።"); H.punct && H.punct("።"); }
    };
    const en = document.createElement("button"); en.className = "key enter"; en.textContent = "↵";
    en.setAttribute("aria-label", "Enter");
    en.onclick = () => H.enter && H.enter();
    bottom.append(symBtn, p1El, sp, p2El, en);
    panes.intl.append(stripEl, rowsEl, bottom);
    wireTrace();

    buildGeezPane("hagaz");
    buildGeezPane("sadis");

    /* grid pane — the full ሰሌዳ. Labiovelars and ዋ-compounds live in a second
       block that ⇧ reveals, same shared state as the letter panes. */
    panes.grid = document.createElement("div"); panes.grid.className = "pane";
    gridWrap = document.createElement("div"); gridWrap.className = "grid-wrap";
    gridExt = document.createElement("div"); gridExt.className = "grid-wrap ext";
    const gridRow = (wrap, k, F) => {
      const r = document.createElement("div"); r.className = "grow";
      const lab = document.createElement("span"); lab.className = "glab"; lab.textContent = k;
      r.append(lab);
      [...F].forEach((ch, i) => {
        /* the base families are 7 long; the extended ones are 5 or 1, so the
           mid gap is only drawn for a 7-form row */
        if (i === 5 && F.length === 7) {
          const gap = document.createElement("span"); gap.className = "glab";
          gap.textContent = "·"; r.append(gap);
        }
        const b = document.createElement("button"); b.className = "gkey"; b.textContent = ch;
        b.setAttribute("aria-label", ch);
        b.title = k + " · form " + (i + 1);
        b.onclick = () => { announce(ch); H.key && H.key(ch); };
        r.append(b);
      });
      wrap.append(r);
    };
    /* assigned to the outer binding (not a const of the same name) so cycleGShift
       can call it — a local const here would shadow it and the ⇧ would do nothing */
    buildGrid = ext => {
      gridWrap.innerHTML = "";
      GRID_ORDER.forEach(k => { const F = famOf(k); if (F) gridRow(gridWrap, k, F); });
      gridExt.innerHTML = "";
      if (!ext) return;
      const h = document.createElement("div"); h.className = "glab";
      h.textContent = "ላቢዮ · ው-ኮምፖውንድ";
      gridExt.append(h);
      GEEZ_EXT.rows.forEach(row => row.forEach(k => { const F = famOf(k); if (F) gridRow(gridExt, k, F); }));
    };
    buildGrid(false);
    const gb = document.createElement("div"); gb.className = "row";
    const gsh = document.createElement("button"); gsh.className = "key shift"; gsh.textContent = "⇧";
    gsh.setAttribute("aria-label", "Extended letters");
    gsh.title = "ተጨማሪ ፊደላት (ላቢዮ · ው-ኮምፖውንድ) — double-tap = lock";
    gsh.onclick = cycleGShift;
    gShiftBtns.push(gsh);
    const gbs = document.createElement("button"); gbs.className = "key shk"; gbs.textContent = "⌫";
    gbs.onclick = () => H.backspace && H.backspace();
    const gsp = document.createElement("button"); gsp.className = "key sp"; gsp.textContent = "ክፍት";
    gsp.onclick = () => H.space && H.space();
    const gen = document.createElement("button"); gen.className = "key enter"; gen.textContent = "↵";
    gen.onclick = () => H.enter && H.enter();
    gb.append(gsh, gbs, gsp, gen);
    panes.grid.append(gridWrap, gridExt, gb);

    /* emoji pane */
    panes.emoji = document.createElement("div"); panes.emoji.className = "pane";
    etabsEl = document.createElement("div"); etabsEl.className = "etabs";
    window.AMK_EMOJI_TABS.forEach((t, i) => {
      const b = document.createElement("button");
      b.className = "etab" + (i === 0 ? " on" : ""); b.textContent = t.name; b.title = t.name;
      b.onclick = () => { etab = i;
        [...etabsEl.children].forEach((c, j) => c.classList.toggle("on", j === i));
        renderEmoji(); };
      etabsEl.append(b);
    });
    egridEl = document.createElement("div"); egridEl.className = "egrid";
    panes.emoji.append(etabsEl, egridEl);

    kbdEl.append(tabsRow, panes.intl, panes.hagaz, panes.sadis, panes.grid, panes.emoji);
    wrap.append(bar, kbdEl);

    /* 🆕 resize handles — appended after the panes so they sit on top */
    [["e", "Resize width"], ["s", "Resize key size"], ["se", "Resize width and key size"]]
      .forEach(([mode, tip]) => {
        const h = document.createElement("div");
        h.className = "rz " + mode; h.title = tip; h.setAttribute("role", "separator");
        h.setAttribute("aria-label", tip);
        h.addEventListener("pointerdown", e => startResize(e, mode));
        wrap.append(h);
      });

    const toast = document.createElement("div"); toast.className = "toast";
    liveEl = document.createElement("div"); liveEl.className = "lh";
    liveEl.setAttribute("aria-live", "polite"); liveEl.setAttribute("role", "status");
    wrap.append(toast);                     /* inside .wrap → .wrap.dark applies */
    sh.append(wrap, liveEl);
    toastEl = toast;
    root = sh;

    host.addEventListener("mousedown", e => e.preventDefault());
    (document.body || document.documentElement).append(host);
    mountedHost = host;

/* 🆕 heartbeat + in-page watchdog. Removing or reloading the extension does not
       reload the page, so this closed shadow root would linger with dead handlers. We beat
       once a second; an in-page watcher deletes the host once the beats stop. It must
       run in the PAGE world (injected inline) because the isolated world is torn down
       with the extension — surviving that teardown is the whole point.

       STALE is 6s and the check is SKIPPED WHILE THE PAGE IS HIDDEN. Chrome throttles
       timers in hidden tabs to ~1/min, so a hidden tab's beat can be a minute old; judging
       it there made the watchdog delete a perfectly healthy keyboard.

       6s (not 15s) because a hidden tab's interval is throttled to once a MINUTE: with a
       long threshold AND a once-a-minute poll, a tab that was hidden when the extension
       was removed kept its dead keyboard on screen for over a minute after being
       brought back. The watchdog also re-checks the moment the page becomes visible
       again (visibilitychange/focus/pageshow) instead of waiting for the next throttled
       tick, so a visible tab is cleaned within STALE of the extension going away.

       A host that never beat at all (extension reloaded between create and first beat) is
       judged against its data-amk-born mount time, so it cannot hide from the watcher.

       background.js injects this same watcher with chrome.scripting on every
       navigation, on every tab activation and every 30s — that route is immune to page
       CSP, unlike the inline script, so a strict-CSP page still gets a watcher. The
       handshake below asks for that injection when the inline one did not run. */
const beat = () => {
      try {
        host.setAttribute("data-amk-beat", String(Date.now()));
        /* 🆕 self-heal: if anything removed our host while the extension is still
           alive, put it back rather than leaving the page with no keyboard. Only when
           the page has NO host at all — if something else (a page script, a clone)
           left a host behind, re-appending ours would give the page two keyboards. */
        if (!host.isConnected && !document.getElementById("fidle-host")) {
          (document.body || document.documentElement).append(host);
          host.setAttribute("data-amk-beat", String(Date.now()));
        }
      } catch (_) {}
    };
    beat();
    clearInterval(hbTimer);
    hbTimer = setInterval(beat, 1000);
    try {
      const prev = document.getElementById("amk-watchdog");
      if (prev) prev.remove();
      const wd = document.createElement("script");
      wd.id = "amk-watchdog";
      wd.textContent = AMK_WATCHDOG_SRC;
      (document.head || document.documentElement).append(wd);
    } catch (_) {}
    /* 🆕 handshake: the inline watcher flags <html> when it runs. A strict-CSP page
       blocks it, and the isolated world cannot see the page's window, so the only way to
       notice is through the DOM. If the flag never appears, ask the background to inject
       the same watcher through chrome.scripting (CSP-proof) instead. */
    clearTimeout(wdCheckTimer);
    wdCheckTimer = setTimeout(() => {
      try {
        if (document.documentElement.hasAttribute("data-amk-wd")) return;
        chrome.runtime.sendMessage({ t: "needWd" });
      } catch (_) {}
    }, 600);

    addEventListener("resize", onResize);
    winBound.push(() => removeEventListener("resize", onResize));
    if (window.visualViewport) {
      const onVVScroll = () => H.vvScroll && H.vvScroll();
      visualViewport.addEventListener("resize", onResize);
      visualViewport.addEventListener("scroll", onVVScroll);
      winBound.push(() => visualViewport.removeEventListener("resize", onResize),
                     () => visualViewport.removeEventListener("scroll", onVVScroll));
    }

    renderGeezStrips();
    setPane(pendingPane); applyTheme(); applySize();
  }

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add("on");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove("on"), 1600);
  }

  /* ================= teardown ================= */
  /* Removes everything build() put on the page: the host element, every window
     and visualViewport listener, the media-query listener, all timers/frames, the
     watchdog script, and the page-world watchdog's own interval. Idempotent, and
     safe to call when the keyboard was never mounted. */
  function destroy() {
    /* every window / visualViewport listener build() added */
    while (winBound.length) { const off = winBound.pop(); try { off(); } catch (_) {} }
    try { mq.removeEventListener("change", onSchemeChange); } catch (_) {}
    /* timers + the pending resize frame */
    clearInterval(hbTimer); hbTimer = 0;
    clearTimeout(wdCheckTimer); wdCheckTimer = 0;
    if (toastEl) clearTimeout(toastEl._t);
    if (rafR) { cancelAnimationFrame(rafR); rafR = 0; }
    /* the injected watchdog script and the page-world interval it started */
    try { const wd = document.getElementById("amk-watchdog"); if (wd) wd.remove(); } catch (_) {}
    try { document.documentElement.setAttribute("data-amk-wdstop", "1"); } catch (_) {}
    /* the host itself */
    try { if (mountedHost) mountedHost.remove(); } catch (_) {}
    try { const h = document.getElementById("fidle-host"); if (h) h.remove(); } catch (_) {}
    mountedHost = null;
    /* drop the cached nodes so a later build()/destroy() cannot touch a dead tree */
    root = null; wrap = null; kbdEl = null; bar = null; toastEl = null; liveEl = null;
    Object.keys(gRows).forEach(k => delete gRows[k]);
    Object.keys(panes).forEach(k => delete panes[k]);
    Object.keys(tabs).forEach(k => delete tabs[k]);
    gShiftBtns.length = 0;
    gridWrap = null; gridExt = null; buildGrid = null;
    gShift = 0; shiftState = 0; curFam = null; curFormIdx = 0;
    tracing = false; traceOn = false; traceSet = null; traceLast = null;
    khManual = null; rafR = 0; dragged = false; dragging = false; rzing = null; dragPid = null;
  }

  window.AMKUI = {
    H, mount: build, toast, announce, setMode, destroy,
    get kbdOpen() { return !!kbdEl && kbdEl.classList.contains("on"); },
    get dragged() { return dragged; },
    showKbd(v) {
      if (!ready()) return;
      kbdEl.classList.toggle("on", !!v);
      if (v) { bar.classList.add("on"); setPane(pendingPane || "hagaz"); applySize(); }
    },
    show(v) {
      if (!ready()) return;
      bar.classList.toggle("on", !!v);
      if (!v) kbdEl.classList.remove("on");
    },
    setPane,
    setDefaultPane(name) {
      if (!ready()) return;
      if (name === "compact") name = "hagaz";
      if (panes[name]) { pendingPane = name; if (kbdEl.classList.contains("on")) setPane(name); }
    },
    /* 🆕 content-driven family sync (physical Tab / 1–7 / reset) */
    syncFam(f, idx) {
      if (!ready()) return;
      curFam = f || null;
      if (typeof idx === "number") curFormIdx = idx;
      gStripKey = "";
      renderGeezStrips();
    },
    setTrace,
    /* the ⇧ layer's keys, exported so a key that fails to resolve is visible
       instead of being silently dropped from the rendered row */
    extKeys: GEEZ_EXT.rows.flat(),
    setTheme(m) { theme = m || "auto"; applyTheme(); },
    setSize(m) { if (ready() && SIZES[m]) { khManual = null; sizeMode = m; applySize(); } },
    setSizePx(px) { if (ready() && +px > 0) { khManual = +px; clampManual(); } },
    setWidth(px) { if (ready() && +px > 0)
      wrap.style.setProperty("--kw", Math.max(KW_MIN, Math.min(KW_MAX, +px)) + "px"); },
    setClipAvail(v) { if (ready()) clipBtn.style.display = v ? "" : "none"; },
    anchorTo, applyPos, resetPos,
    refreshEmoji() { if (ready() && pendingPane === "emoji" && kbdEl.classList.contains("on")) renderEmoji(); },
    renderBar(d) {
      if (!ready()) return;
      logoEl.dataset.mode = d.mode || "am";
      kbdBtn.classList.toggle("on", !!d.showKbd);
      previewEl.style.display = d.composing ? "" : "none";
      previewEl.textContent = d.latin ? d.latin : "⌨ ፊደል…";
      candsEl.innerHTML = "";
      const mkC = (label, fn, primary, num) => {
        const b = document.createElement("button");
        b.className = "cand" + (primary ? " primary" : "");
        if (num) { const n = document.createElement("span"); n.className = "num"; n.textContent = num; b.append(n); }
        b.append(document.createTextNode(label));
        b.onclick = fn; candsEl.append(b);
      };
      if (d.composing) {
        (d.extraChips || []).forEach(c => mkC(c.t, () => H.chip && H.chip(c)));
        if (d.latin) mkC("abc", () => H.commitRaw && H.commitRaw());
        (d.candidates || []).forEach((w, i) =>
          mkC(w, () => { announce(w); H.candidate && H.candidate(i); }, i === 0, i + 1));
      } else {
        (d.chips || []).forEach(c =>
          mkC((c.icon ? c.icon + " " : "") + c.t, () => H.chip && H.chip(c)));
      }
    }
  };
})();