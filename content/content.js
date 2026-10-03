(() => {
  const T = window.AMKTranslit, P = window.AMKPredict;
  /* 🆕 one resolver for every family the OSK can show: the 7-form base
     families plus the ⇧ layer's labiovelars (5 forms) and ዋ-compounds (1).
     XFAM used to be checked separately at each call site. */
  const famOf = k => T.fam(k);
  const S = { enabled: true, mode: "am", autoKbd: true, learning: true,
              kbdOpen: false, focused: false, siteOk: true,
              trace: false, sound: false, anchor: false, langMemOn: true, langMem: {} };
  let ctx = null, lastField = null, lastWord = "", hideTimer = null;
  let clipMode = false, SNIP = {}, hotkeyAt = 0;
  let curFam = null, curFormIdx = 0;      /* armed Geez family + current form index */
  /* 🆕 interchangeable families (mirror of ui.js) */
  const SIB = { h:["h","hh","x"], s:["s","ss"], a:["a","aa"], ts:["ts","ts'"] };
  const SIBOF = { hh:"h", x:"h", ss:"s", aa:"a", "ts'":"ts" };
  const sibGroup = f => SIB[f] || (SIBOF[f] ? SIB[SIBOF[f]] : null);
  S.stats = { words: 0, chars: 0, t0: 0 };
  const warned = {};

  /* ---------- helpers ---------- */
  const tgt = e => (e.composedPath ? e.composedPath()[0] : e.target);
  const host = () => location.hostname;
  const isEditable = el => el && (
    el.tagName === "TEXTAREA" ||
    (el.tagName === "INPUT" && !/^(button|submit|checkbox|radio|range|color|file|hidden)$/.test(el.type || "text")) ||
    el.isContentEditable);
  const isCE = el => el.isContentEditable && el.tagName !== "INPUT" && el.tagName !== "TEXTAREA";
  function fieldKind(el) {
    if (isCE(el)) return "ce";
    if (el.tagName === "TEXTAREA") return "text";
    const t = (el.type || "text").toLowerCase();
    if (t === "text" || t === "search") return "text";
    if (["email", "url", "tel", "number", "password"].includes(t)) return "latin";
    return "other";
  }
  const amAllowed = el => { const k = fieldKind(el); return k === "ce" || k === "text"; };
  const caretOf = el => isCE(el)
    ? (window.getSelection().rangeCount && window.getSelection().getRangeAt(0).collapsed
        ? { node: window.getSelection().getRangeAt(0).startContainer, off: window.getSelection().getRangeAt(0).startOffset }
        : null)
    : (el.selectionStart ?? el.value.length);
  const curText = el => isCE(el) ? el.textContent : el.value;
  const active = () => S.enabled && S.siteOk;

  /* 🆕 deepest focused element — document.activeElement stops at a page shadow host,
     so fields inside web components used to look "not editable" and closed the OSK */
  function deepActive() {
    let a = document.activeElement;
    for (let i = 0; a && a.shadowRoot && a.shadowRoot.activeElement && i < 12; i++)
      a = a.shadowRoot.activeElement;
    return a;
  }
  const stillInField = () => { const a = deepActive(); return !!a && isEditable(a); };

  /* 🆕 single place that makes the on-screen keyboard match S.kbdOpen */
  function syncKbd() {
    AMKUI.showKbd(!!S.kbdOpen);
    AMKUI.show(S.focused || S.kbdOpen);
  }

  function toastOnce(key, msg) { if (warned[key]) return; warned[key] = true; AMKUI.toast(msg); }

  /* ---------- IME event fidelity ---------- */
  function fireBI(el, inputType, data) {
    try {
      const e = new InputEvent("beforeinput", { bubbles: true, cancelable: true, inputType, data });
      el.dispatchEvent(e);
      return !e.defaultPrevented;
    } catch (_) { return true; }
  }
  const fireComp = (el, type, data) => {
    try { el.dispatchEvent(new CompositionEvent(type, { bubbles: true, data: data || "" })); } catch (_) {}
  };
  function fireInput(el, inputType, data) {
    try { el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType, data: data || "" })); }
    catch (_) { el.dispatchEvent(new Event("input", { bubbles: true })); }
  }
  function execInsert(el, text) {
    try { return document.execCommand("insertText", false, text); } catch (_) { return false; }
  }

  /* ---------- clipboard history (local; captured from page copy/cut) ---------- */
  const Clip = {
    items: [],
    async load() { const d = await chrome.storage.local.get("amkClip"); this.items = d.amkClip || []; },
    push(txt) {
      this.items = [txt, ...this.items.filter(x => x !== txt)].slice(0, 20);
      chrome.storage.local.set({ amkClip: this.items });
    },
    list() { return this.items; }
  };
  /* 🆕 teardown bookkeeping: every document listener is registered through onDoc()
     so selfDestruct() can unregister all of them. Registering by hand left the
     handlers anonymous, which made them impossible to remove. */
  const DOC_BOUND = [];
  const onDoc = (type, fn, cap) => {
    document.addEventListener(type, fn, !!cap);
    DOC_BOUND.push([type, fn, !!cap]);
  };

  onDoc("copy", e => {
    try {
      const txt = e.clipboardData && e.clipboardData.getData("text/plain");
      if (txt && txt.trim()) Clip.push(txt);
    } catch (_) {}
  }, true);
  onDoc("cut", e => {
    try {
      const txt = e.clipboardData && e.clipboardData.getData("text/plain");
      if (txt && txt.trim()) Clip.push(txt);
    } catch (_) {}
  }, true);

  /* ---------- snippets ---------- */
  const DEFAULT_SNIP = {
    sig:  "ከሠላምታ ጋርᣠ\nፊደል Keyboard",
    ty:   "በቅድሚህ አመሰግናለሁ።",
    brb:  "እቆምልሃለሁ።",
    addr: "አዲስ አበባ፣ ኢትዮጵያ",
    mail: "እባክዎ ይምለሱ።"
  };
  async function loadSnips() {
    const d = await chrome.storage.local.get("amkSnippets");
    SNIP = Object.assign({}, DEFAULT_SNIP, d.amkSnippets || {});
  }
  const firstLine = s => (s || "").split("\n")[0].slice(0, 24);
  function expandSnippet(name) {
    const txt = SNIP[name];
    cancel();
    if (txt) { insertAtCaret(txt); AMKUI.toast("⤳ snippet: " + name); }
    else AMKUI.toast('No snippet "' + name + '" — add it in the popup');
  }

  /* ---------- sound / haptic ---------- */
  let AC = null;
  function tick() {
    if (!S.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = "square"; o.frequency.value = 1700 + Math.random() * 400;
      g.gain.setValueAtTime(.028, AC.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + .03);
      o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + .035);
    } catch (_) {}
    try { navigator.vibrate && navigator.vibrate(8); } catch (_) {}
  }

  /* ---------- placeholder / token awareness ---------- */
  const CONTEXT = [
    [/name|ስም/i,                    ["ስም", "ሙሉ ስም", "አበበ በቀለ"]],
    [/email|mail|ኢሜይል/i,            ["ኢሜይል", "ኢሜይል አድራሻ"]],
    [/phone|tel|ስልክ/i,              ["ስልክ ቁጥር", "ቁጥር"]],
    [/search|query|ፈልግ/i,           ["ፈልግ", "አዲስ ፍለጋ"]],
    [/comment|message|አስተያየት|መልእክት/i,["አስተያየት ይጻፉ", "ጥሩ ነው", "አመሰግናለሁ"]],
    [/address|አድራሻ/i,               ["አድራሻ", "ከተማ", "ክፍለ ከተማ"]],
    [/date|ቀን/i,                    ["ቀን", "ዛሬ"]],
    [/city|ከተማ/i,                   ["ከተማ", "አዲስ አበባ"]],
    [/title|subject|ርዕስ/i,          ["ርዕስ", "አዲስ ጉዳይ"]]
  ];
  const labelFor = el => (el.labels && el.labels[0] && el.labels[0].textContent) || "";
  function contextChips(el) {
    if (!el) return null;
    const ph = el.getAttribute?.("placeholder") || el.getAttribute?.("aria-label") || labelFor(el) || "";
    const txt = curText(el) || "";
    const a = isCE(el) ? null : el.selectionStart ?? txt.length;
    if (!txt.trim() && ph) {
      for (const [re, arr] of CONTEXT) if (re.test(ph))
        return arr.map(t => ({ t, icon: "✦", ctx: true }));
    }
    if (a != null) {
      const m = txt.slice(0, a).match(/(\{[^{}]{0,24}\}|\[[^\[\]]{0,24}\]|_{2,})\s*$/);
      if (m) {
        const key = m[0];
        for (const [re, arr] of CONTEXT) if (re.test(key))
          return arr.map(t => ({ t, icon: "↦", token: key }));
        return ["ስም", "ቀን", "አድራሻ", "ማስታወሻ"].map(t => ({ t, icon: "↦", token: key }));
      }
    }
    return null;
  }

  /* ---------- composition ---------- */
  function ensureCtx(el) {
    if (ctx && ctx.el === el) return ctx;
    ctx = { el, ce: isCE(el), anchor: caretOf(el), after: "",
            latin: "", kbdBuf: "", gez: "", candidates: [], best: "",
            ceNode: null, prevLen: 0, compActive: false, prev: lastWord };
    return ctx;
  }
  const composing = () => ctx && (ctx.latin || ctx.kbdBuf);
  const endAnchor = el => {
    const r = document.createRange(); r.selectNodeContents(el); r.collapse(false);
    return { node: r.startContainer, off: r.startOffset };
  };
  function anchorNow() {
    if (!ctx) return;
    if (!ctx.ce) {
      const el = ctx.el;
      ctx.anchor = el.selectionStart ?? el.value.length;
      ctx.after = el.value.slice(el.selectionEnd ?? ctx.anchor);
      ctx.prevLen = 0;
    } else if (!ctx.anchor) ctx.anchor = endAnchor(ctx.el);
  }
  function startLatin(ch) { if (!ctx) return; curFam = null; curFormIdx = 0; AMKUI.syncFam(null, 0);
    anchorNow(); ctx.latin = ch; update(); }
  function startGez(ch)  { if (!ctx) return; anchorNow(); ctx.kbdBuf = ch; update(); }

  function update() {
    if (!ctx || !document.contains(ctx.el)) return;

    /* snippet mode: latin starts with "/" */
    if (ctx.latin.startsWith("/")) {
      const name = ctx.latin.slice(1), sn = SNIP[name];
      ctx.gez = ctx.latin; ctx.candidates = []; ctx.best = ctx.latin;
      renderField();
      AMKUI.renderBar({ composing: true, latin: ctx.latin, candidates: [],
        extraChips: [{ t: "⤳ " + (sn ? firstLine(sn) : (name ? name + " — not found" : "type a snippet name")),
                       snip: name || null }],
        mode: S.mode, showKbd: S.kbdOpen });
      return;
    }

    if (ctx.kbdBuf && !ctx.latin) {
      ctx.gez = ctx.kbdBuf;
      ctx.candidates = P.candidates([ctx.kbdBuf]);
    } else {
      const gezs = T.variants(ctx.latin).map(l => T.word(l));
      ctx.candidates = P.candidates(gezs);
      ctx.gez = T.word(ctx.latin);
    }
    ctx.best = ctx.candidates[0] || ctx.gez;
    renderField();
    AMKUI.renderBar({ composing: true, latin: ctx.latin || "",
      candidates: ctx.candidates, mode: S.mode, showKbd: S.kbdOpen });
  }

  function renderField() {
    const el = ctx.el;
    if (ctx.ce) {
      try {
        if (!ctx.compActive) { fireComp(el, "compositionstart", ctx.gez); ctx.compActive = true; }
        const r = document.createRange(); r.setStart(ctx.anchor.node, ctx.anchor.off);
        if (ctx.ceNode) { r.setEnd(ctx.ceNode, ctx.ceNode.data.length); r.deleteContents(); }
        const t = document.createTextNode(ctx.gez); r.insertNode(t); ctx.ceNode = t;
        const sel = window.getSelection(); const r2 = document.createRange();
        r2.setStart(t, t.length); r2.collapse(true);
        sel.removeAllRanges(); sel.addRange(r2);
        fireComp(el, "compositionupdate", ctx.gez);
        ctx.prevLen = ctx.gez.length;
      } catch (_) { cancel(); }
    } else {
      if (!fireBI(el, "insertCompositionText", ctx.gez)) return;
      if (!ctx.compActive) { fireComp(el, "compositionstart", ctx.gez); ctx.compActive = true; }
      try { el.setRangeText(ctx.gez, ctx.anchor, ctx.anchor + (ctx.prevLen || 0), "end"); } catch (_) { return; }
      fireComp(el, "compositionupdate", ctx.gez);
      fireInput(el, "insertCompositionText", ctx.gez);
      ctx.prevLen = ctx.gez.length;
    }
  }

  function endComposition(el, data) {
    if (ctx && ctx.compActive) { fireComp(el, "compositionend", data || ctx.gez || ""); ctx.compActive = false; }
  }

  /* ---------- commits ---------- */
  function commit(w, space) {
    if (!ctx || !w) return;
    const el = ctx.el, ins = w + (space ? " " : "");
    if (ctx.ce) {
      try {
        endComposition(el, w);
        let r = document.createRange();
        if (ctx.ceNode) { r.setStart(ctx.ceNode, 0); r.setEnd(ctx.ceNode, ctx.ceNode.data.length); }
        else { const a = ctx.anchor || endAnchor(el); r.setStart(a.node, a.off); r.collapse(true); }
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        if (!execInsert(el, ins)) throw 0;
        ctx.anchor = caretOf(el) || ctx.anchor; ctx.ceNode = null;
      } catch (_) {
        try {
          let node;
          if (ctx.ceNode) { node = ctx.ceNode; node.data = ins; }
          else {
            const a = ctx.anchor || endAnchor(el);
            const r = document.createRange(); r.setStart(a.node, a.off); r.collapse(true);
            node = document.createTextNode(ins); r.insertNode(node);
          }
          ctx.anchor = { node, off: node.length }; ctx.ceNode = null;
          endComposition(el, w);
        } catch (_) {}
      }
    } else {
      endComposition(el, w);
      try { el.setSelectionRange(ctx.anchor, ctx.anchor + (ctx.prevLen || 0)); } catch (_) {}
      if (!execInsert(el, ins)) {
        try { el.setRangeText(ins, ctx.anchor, ctx.anchor + (ctx.prevLen || 0), "end");
              fireInput(el, "insertText", ins); } catch (_) {}
      }
      ctx.anchor = el.selectionStart ?? ctx.anchor;
      ctx.after = el.value.slice(ctx.anchor);
      ctx.prevLen = 0;
    }
    lastWord = w;
    S.stats.words++; S.stats.chars += w.length;
    if (!S.stats.t0) S.stats.t0 = Date.now();
    AMKUI.announce(w);
    if (S.learning) P.learn(w, ctx.prev);
    ctx.prev = w; ctx.latin = ""; ctx.kbdBuf = ""; ctx.gez = "";
    curFam = null; curFormIdx = 0; AMKUI.syncFam(null, 0);
    updateIdleBar();
  }

  function cancel() {
    if (!ctx) return;
    const el = ctx.el;
    if (ctx.ce && ctx.ceNode) {
      try { ctx.ceNode.remove(); } catch (_) {} ctx.ceNode = null;
    } else if (!ctx.ce && ctx.prevLen) {
      try { el.setRangeText("", ctx.anchor, ctx.anchor + ctx.prevLen, "end"); } catch (_) {}
      fireInput(el, "deleteContentBackward", "");
    }
    endComposition(el, "");
    ctx.latin = ""; ctx.kbdBuf = ""; ctx.gez = ""; ctx.prevLen = 0;
    curFam = null; curFormIdx = 0; AMKUI.syncFam(null, 0);
    updateIdleBar();
  }

  function insertAtCaret(str) {
    if (!ctx || !document.contains(ctx.el)) return;
    const el = ctx.el;
    if (ctx.ce) { el.focus(); if (!execInsert(el, str)) {} ctx.anchor = caretOf(el) || ctx.anchor; }
    else {
      el.focus();
      const ok = execInsert(el, str);
      if (!ok) {
        const s = el.selectionStart ?? el.value.length, e2 = el.selectionEnd ?? s, v = el.value;
        try { el.setRangeText(str, s, e2, "end"); fireInput(el, "insertText", str); } catch (_) {}
      }
      ctx.anchor = el.selectionStart ?? ctx.anchor;
      ctx.after = el.value.slice(ctx.anchor);
    }
    updateIdleBar();
  }

  function backspaceEdit() {
    if (!ctx || !document.contains(ctx.el)) return;
    if (composing()) {
      if (ctx.latin) ctx.latin = ctx.latin.slice(0, -1);
      else if (ctx.kbdBuf) ctx.kbdBuf = ctx.kbdBuf.slice(0, -1);
      (ctx.latin || ctx.kbdBuf) ? update() : cancel();
      return;
    }
    const el = ctx.el;
    if (ctx.ce) { el.focus(); try { document.execCommand("delete"); } catch (_) {}
      ctx.anchor = caretOf(el) || ctx.anchor; }
    else {
      el.focus();
      const a = el.selectionStart ?? 0, b = el.selectionEnd ?? a;
      let ok = false;
      if (a !== b) { try { el.setSelectionRange(a, b); ok = document.execCommand("delete"); } catch (_) {} }
      else if (a > 0) { try { el.setSelectionRange(a - 1, b); ok = document.execCommand("delete"); } catch (_) {} }
      if (!ok) {
        const a2 = el.selectionStart ?? 0, b2 = el.selectionEnd ?? a2;
        try {
          if (a2 !== b2) el.setRangeText("", a2, b2, "end");
          else if (a2 > 0) el.setRangeText("", a2 - 1, b2, "end");
          fireInput(el, "deleteContentBackward", "");
        } catch (_) {}
      }
      ctx.anchor = el.selectionStart ?? 0;
      ctx.after = el.value.slice(ctx.anchor);
    }
    updateIdleBar();
  }

  /* ---------- idle bar ---------- */
  const wpm = () => { const dt = (Date.now() - S.stats.t0) / 60000; return dt > 0 ? S.stats.words / dt : 0; };
  function updateIdleBar() {
    if (!active()) { AMKUI.show(false); AMKUI.setClipAvail(false); return; }
    AMKUI.setClipAvail(Clip.list().length > 0);
    let chips;
    if (clipMode) {
      chips = Clip.list().slice(0, 8)
        .map(t => ({ t: "⧉ " + t.replace(/\n/g, "⏎").slice(0, 26) + (t.length > 26 ? "…" : ""), clip: t }));
      chips.push({ t: "✕ close", closeClip: true });
    } else {
      const emo = window.AMKEmoji.forWord(lastWord).slice(0, 4).map(t => ({ t, emoji: true }));
      const rest = contextChips(ctx?.el) ||
        (lastWord ? P.nextWords(lastWord) : P.starters()).map(t => ({ t, icon: "→", next: true }));
      chips = S.mode === "en" ? rest : [...emo, ...rest];
    }
    syncKbd();
    AMKUI.renderBar({ composing: false, chips, mode: S.mode, showKbd: S.kbdOpen });
    if (S.anchor && !AMKUI.dragged && S.focused && ctx?.el && document.contains(ctx.el))
      AMKUI.anchorTo(ctx.el);
  }

  /* ---------- physical keyboard ---------- */
  const PUNCT = { ",": "፣", ";": "፤", ":": "፡", "?": "፧", ".": "።" };

  onDoc("keydown", onKey, true);
  function onKey(e) {
    if (e.amkReplay) return;
    /* hotkey: debounce so commands-relay + page handler can't double-toggle */
    if (e.ctrlKey && e.shiftKey && !e.altKey && (e.key === "K" || e.key === "k")) {
      if (Date.now() - hotkeyAt < 300) return;
      hotkeyAt = Date.now();
      e.preventDefault(); e.stopPropagation();
      chrome.storage.sync.set({ amk: !S.enabled });
      return;
    }
    if (!active() || S.mode !== "am" || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = tgt(e);
    if (!isEditable(el)) return;
    const kind = fieldKind(el);
    if (kind === "latin" || kind === "other") {
      toastOnce("latin", "ይህ ሜዳ ላቲን ብቻ ነው — English pass-through");
      return;
    }
    ensureCtx(el);
    const k = e.key;

    if (composing()) {
      if (k === "Backspace") { e.preventDefault(); backspaceEdit(); return; }
      /* 🆕 physical 1–7 picks fidel forms while composing via a Geez layout family */
      if (ctx.kbdBuf && !ctx.latin && curFam && /^[1-7]$/.test(k)) {
        const F = famOf(curFam);
        if (F && F[+k - 1]) { e.preventDefault();
          curFormIdx = +k - 1;
          ctx.kbdBuf = ctx.kbdBuf.slice(0, -1) + F[curFormIdx];
          AMKUI.syncFam(curFam, curFormIdx);
          update(); return; }
      }
      /* 🆕 Tab: cycle interchangeable sibling family, same form */
      if (k === "Tab" && ctx.kbdBuf && !ctx.latin && curFam && sibGroup(curFam)) {
        e.preventDefault();
        const grp = sibGroup(curFam);
        const next = grp[(grp.indexOf(curFam) + 1) % grp.length];
        const F = T.FAM[next];
        if (F) {
          curFam = next;
          curFormIdx = Math.min(curFormIdx, F.length - 1);
          ctx.kbdBuf = ctx.kbdBuf.slice(0, -1) + F[curFormIdx];
          AMKUI.syncFam(curFam, curFormIdx);
          update();
        }
        return;
      }
      if (/^[1-9]$/.test(k)) { e.preventDefault();
        const w = ctx.candidates[+k - 1]; if (w) commit(w, false); return; }
      if (k === " " || k === "Spacebar") { e.preventDefault();
        if (ctx.latin.startsWith("/") && ctx.latin.length > 1) expandSnippet(ctx.latin.slice(1));
        else commit(ctx.best, true);
        return; }
      if (k === "Enter") { e.preventDefault();
        if (ctx.latin.startsWith("/") && ctx.latin.length > 1) { expandSnippet(ctx.latin.slice(1)); return; }
        commit(ctx.best, false); insertEnter(); return; }
      if (k === "Escape") { e.preventDefault(); cancel(); return; }
      if (PUNCT[k]) { e.preventDefault(); commit(ctx.best, false); insertAtCaret(PUNCT[k] + " "); return; }
      if (/^[a-zA-Z']$/.test(k)) {
        if (ctx.kbdBuf && !ctx.latin) commit(ctx.best, false);
        e.preventDefault(); tick();
        ctx.latin += k.toLowerCase(); update(); return;
      }
      if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End","Tab","PageUp","PageDown"].includes(k))
        { commit(ctx.best, false); return; }
      if (k.length === 1) commit(ctx.best, false);
      return;
    }

    // idle
    if (/^[a-zA-Z']$/.test(k) && k.length === 1) { e.preventDefault(); tick(); startLatin(k.toLowerCase()); return; }
    if (k === " " && !isCE(el)) {                            // double-space → ።
      const a = el.selectionStart;
      if (a != null && a > 0 && el.value[a - 1] === " ") {
        e.preventDefault();
        try { el.setSelectionRange(a - 1, a); execInsert(el, "። "); } catch (_) {}
        updateIdleBar(); return;
      }
    }
  }

  function insertEnter() {
    const el = ctx?.el; if (!el) return;
    if (ctx.ce) document.execCommand("insertText", false, "\n");
    else if (el.tagName === "TEXTAREA") insertAtCaret("\n");
    else {
      const ev = new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true });
      Object.defineProperty(ev, "keyCode", { get: () => 13 });
      Object.defineProperty(ev, "which",   { get: () => 13 });
      ev.amkReplay = true; el.dispatchEvent(ev);
    }
  }

  /* ---------- focus & tracking ---------- */
  onDoc("focusin", e => {
    const el = tgt(e);
    if (el && el.tagName === "CANVAS")
      toastOnce("canvas", "Canvas-based field detected — typing here isn't possible");
    if (el && !isEditable(el) && el.shadowRoot === null && el.localName && el.localName.includes("-"))
      toastOnce("closed", "Embedded widget field — closed shadow DOM can't be reached");
    if (!isEditable(el)) return;
    clearTimeout(hideTimer);
    lastField = el; clipMode = false;
    if (!active()) { S.kbdOpen = false; AMKUI.show(false); AMKUI.showKbd(false); return; }
    if (S.langMemOn && S.langMem[host()] && S.langMem[host()] !== S.mode) {
      S.mode = S.langMem[host()];
    }
    S.focused = true;
    ensureCtx(el);
    if (S.autoKbd && !S.kbdOpen) { S.kbdOpen = true; AMKUI.showKbd(true); }
    updateIdleBar();
  });
  onDoc("focusout", e => {
    const el = tgt(e);
    if (ctx && ctx.el === el) {
      if (composing()) commit(ctx.best, true);
      clearTimeout(hideTimer);
      /* 🆕 clicking anywhere on the page (a link, a button, plain text) used to
         close the OSK. It now only tracks focus and stays put until dismissed. */
      hideTimer = setTimeout(() => {
        S.focused = stillInField();
        syncKbd();
      }, 150);
    }
  });
  onDoc("selectionchange", () => {
    if (ctx && !composing() && ctx.ce && document.activeElement === ctx.el)
      ctx.anchor = caretOf(ctx.el);
  });
  ["keyup", "click", "input"].forEach(ev => onDoc(ev, e => {
    const el = tgt(e);
    if (ctx && !composing() && el === ctx.el && !ctx.ce) ctx.anchor = el.selectionStart ?? el.value.length;
    if (ev === "input" && ctx && !composing() && el === ctx.el) updateIdleBar();
  }, true));

  let scrollRaf = 0;
  const onScroll = () => {
    if (!S.anchor || AMKUI.dragged || !S.focused || !ctx?.el) return;
    cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => { if (document.contains(ctx.el)) AMKUI.anchorTo(ctx.el); });
  };
  onDoc("scroll", onScroll, true);

  /* ---------- settings ---------- */
  function applyEffect() {
    if (!active()) { if (composing()) cancel(); S.kbdOpen = false;
      AMKUI.show(false); AMKUI.showKbd(false); return; }
    if (S.focused || S.kbdOpen) updateIdleBar();
  }
  async function refreshSite() {
    const d = await chrome.storage.sync.get(["amkSiteMode", "amkSites"]);
    const mode = d.amkSiteMode || "all", list = d.amkSites || {};
    S.siteOk = mode === "all" ? true : mode === "except" ? !list[host()] : !!list[host()];
    applyEffect();
  }
  function apply(d) {
    if ("amk" in d) { const v = d.amk !== false;
      if (v !== S.enabled) { S.enabled = v; AMKUI.toast(v ? "ፊደል Keyboard: ON" : "ፊደል Keyboard: OFF"); } }
    if ("amkMode" in d) { const v = d.amkMode || "am";
      if (v !== S.mode) { S.mode = v;
        AMKUI.toast(v === "am" ? "ሞድ: አማርኛ" : "Mode: English");
        AMKUI.setMode(v);                          /* 🆕 strips follow mode */
        if (v === "en" && composing()) cancel(); } }
    if ("amkAutoKbd" in d) S.autoKbd = !!d.amkAutoKbd;
    if ("amkLearning" in d) S.learning = d.amkLearning !== false;
    if ("amkTheme" in d) AMKUI.setTheme(d.amkTheme || "auto");
    if ("amkKbdLayout" in d) AMKUI.setDefaultPane(d.amkKbdLayout || "hagaz");   /* 🆕 default ሀግዕዝ */
    if ("amkTrace" in d) { S.trace = !!d.amkTrace; AMKUI.setTrace(S.trace); }
    if ("amkSound" in d) S.sound = !!d.amkSound;
    if ("amkAnchor" in d) S.anchor = !!d.amkAnchor;
    if ("amkLangMemOn" in d) S.langMemOn = d.amkLangMemOn !== false;
    if ("amkLangMem" in d) S.langMem = d.amkLangMem || {};
    if ("amkSnippets" in d) loadSnips();
    if ("amkSiteMode" in d || "amkSites" in d) { refreshSite(); return; }
    applyEffect();
  }

  /* ---------- on-screen handlers ---------- */
  const KH = window.AMKUI.H;
  const focusField = () => {
    if (!ctx || !document.contains(ctx.el)) {
      if (lastField && document.contains(lastField)) lastField.focus();
      if (!ctx || !document.contains(ctx.el)) { AMKUI.toast("የጽሑፍ ሜዳ ይምረጡ (select a text field)"); return false; }
    }
    return true;
  };
  KH.latin = ch => {
    if (!active()) return;
    if (!focusField()) return;
    tick();
    if (S.mode === "en" || !amAllowed(ctx.el)) {
      if (composing()) commit(ctx.best, false);
      insertAtCaret(ch); return;
    }
    if (composing() && ctx.kbdBuf && !ctx.latin) commit(ctx.best, false);
    if (composing() && ctx.latin) { ctx.latin += ch.toLowerCase(); update(); }
    else startLatin(ch.toLowerCase());
  };
  KH.char = ch => { if (!focusField()) return; tick(); if (composing()) commit(ctx.best, false); insertAtCaret(ch); };
  KH.key = ch => {
    if (!active()) return;
    if (S.mode !== "am") { AMKUI.toast("ወደ አማርኛ ሞድ ይቀየሩ — tap the ፊ logo"); return; }
    if (!focusField()) return;
    tick();
    curFam = null; AMKUI.syncFam(null, 0);           /* 🆕 grid-pane composing → 1–9 = candidates */
    if (composing() && ctx.latin) commit(ctx.best, false);
    if (!composing()) startGez(ch);
    else { ctx.kbdBuf += ch; update(); }
  };
  /* 🆕 Geez-layout family key: insert default form + arm 1–7 form picking */
  KH.family = (fam, defIdx) => {
    if (!active()) return;
    if (S.mode !== "am") { AMKUI.toast("ወደ አማርኛ ሞድ ይቀየሩ — tap the ፊ logo"); return; }
    if (!focusField()) return;
    tick();
    const F = famOf(fam);
    if (!F) return;
    curFam = fam;
    curFormIdx = Math.min(defIdx ?? 0, F.length - 1);
    const ch = F[curFormIdx];
    AMKUI.syncFam(curFam, curFormIdx);
    if (composing() && ctx.latin) commit(ctx.best, false);
    if (!composing()) startGez(ch);
    else { ctx.kbdBuf += ch; update(); }
  };
  /* 🆕 sibling chip: swap family, keep the current form index */
  KH.familySwap = (fam, idx) => {
    const F = famOf(fam);
    if (!F || !ctx) return;
    curFam = fam;
    curFormIdx = Math.min(idx ?? curFormIdx, F.length - 1);
    const ch = F[curFormIdx];
    if (composing() && ctx.kbdBuf && !ctx.latin) {
      ctx.kbdBuf = ctx.kbdBuf.slice(0, -1) + ch; update();
    } else if (!composing()) startGez(ch);
  };
  /* 🆕 number-row form tap: replace pending syllable, or insert directly */
  KH.form = ch => {
    if (!focusField()) return;
    tick();
    if (composing() && ctx.kbdBuf && !ctx.latin) {
      ctx.kbdBuf = ctx.kbdBuf.slice(0, -1) + ch;
      /* keep the form index in step so a later physical Tab cycles from the right
         form — the armed family may be an ⇧ one, so it is not always in FAM */
      if (curFam) { const F = famOf(curFam); const i = F ? F.indexOf(ch) : -1;
                    if (i >= 0) curFormIdx = i; }
      AMKUI.syncFam(curFam, curFormIdx);
      update();
    } else KH.key(ch);
  };
  KH.candidate = i => { const w = ctx?.candidates[i]; if (w) commit(w, false); };
  KH.commitRaw = () => { if (composing()) commit(ctx.latin || ctx.kbdBuf, false); };
  KH.chip = c => {
    if (!ctx) return;
    if (c.closeClip) { clipMode = false; updateIdleBar(); return; }
    if (c.clip) { insertAtCaret(c.clip); AMKUI.toast("Pasted from clipboard ⧉"); return; }
    if (c.snip) { expandSnippet(c.snip); return; }
    if (c.emoji) { insertAtCaret(c.t); window.AMKEmoji.remember(c.t); return; }
    if (c.token) {
      const el = ctx.el, txt = curText(el);
      const a = isCE(el) ? null : el.selectionStart ?? txt.length;
      if (a != null) { try { el.setSelectionRange(a - c.token.length, a); } catch (_) {}
        execInsert(el, c.t); }
    } else insertAtCaret(c.t + " ");
    lastWord = c.t; updateIdleBar();
  };
  KH.emoji = ch => { if (composing()) commit(ctx.best, false); if (!ctx) return;
    insertAtCaret(ch); window.AMKEmoji.remember(ch); };
  KH.openEmoji = () => { S.kbdOpen = true; AMKUI.showKbd(true); AMKUI.setPane("emoji"); updateIdleBar(); };
  KH.clip = () => { clipMode = !clipMode; updateIdleBar(); };
  KH.space = () => {
    if (composing() && ctx.latin.startsWith("/") && ctx.latin.length > 1) { expandSnippet(ctx.latin.slice(1)); return; }
    composing() ? commit(ctx.best, true) : insertAtCaret(" ");
  };
  KH.backspace = () => { if (ctx && ctx.ce) ctx.el.focus(); backspaceEdit(); };
  KH.enter = () => {
    if (composing() && ctx.latin.startsWith("/") && ctx.latin.length > 1) { expandSnippet(ctx.latin.slice(1)); return; }
    composing() ? (commit(ctx.best, false), insertEnter()) : insertEnter();
  };
  KH.punct = ch => { composing() ? (commit(ctx.best, false), insertAtCaret(ch + " ")) : insertAtCaret(ch + " "); };
  KH.toggleKbd = () => {
    if (!active()) { AMKUI.toast("ፊደል Keyboard is disabled"); return; }
    if (!ctx || !document.contains(ctx.el)) {
      if (lastField && document.contains(lastField)) lastField.focus();
    }
    S.kbdOpen = !S.kbdOpen;
    AMKUI.showKbd(S.kbdOpen);
    updateIdleBar();
  };
  KH.toggleMode = () => {
    const nm = S.mode === "am" ? "en" : "am";
    chrome.storage.sync.set({ amkMode: nm });
    if (S.langMemOn) { S.langMem[host()] = nm; chrome.storage.sync.set({ amkLangMem: S.langMem }); }
  };
  KH.hide = () => { S.kbdOpen = false; syncKbd(); };
  KH.savePos = pos => { if (pos) chrome.storage.local.set({ amkPos: pos }); };
  KH.saveSize = s => chrome.storage.local.set({ amkKbdSize: s });
  KH.saveWidth = w => chrome.storage.local.set({ amkKbdWidth: Math.round(w) });
  KH.saveSizePx = k => chrome.storage.local.set({ amkKbdSizePx: Math.round(k) });
  KH.vvScroll = onScroll;

  /* ---------- messages ---------- */
  chrome.runtime.onMessage.addListener((m, _s, respond) => {
    if (m?.t === "clearLearned") { P.clearLearned(); AMKUI.toast("Learned words cleared"); respond({ ok: true }); return true; }
    if (m?.t === "resetPos") { chrome.storage.local.remove("amkPos"); AMKUI.resetPos(); respond({ ok: true }); return true; }
    /* 🆕 clearing the clipboard history has to reset the in-memory list too —
       otherwise the next copy would re-persist everything we just deleted */
    if (m?.t === "clearClip") { Clip.items = []; chrome.storage.local.remove("amkClip");
      AMKUI.toast("Clipboard history cleared"); respond({ ok: true }); return true; }
    if (m?.t === "hotkey") { hotkeyAt = Date.now();          /* debounce vs page handler */
      chrome.storage.sync.set({ amk: !S.enabled }); respond({ ok: true }); return true; }
    if (m?.t === "getStats") { respond({ words: S.stats.words, wpm: Math.round(wpm()) }); return true; }
  });

  /* ---------- boot ---------- */
  try {   try { AMKUI.mount(); }
  catch (err) { console.warn("[ፊደል] UI mount failed — settings still work:", err); } }
  catch (err) { console.warn("[ፊደል] UI mount failed — settings still work:", err); }
  chrome.storage.local.get(["amkKbdSize", "amkKbdSizePx", "amkKbdWidth", "amkPos"], d => {
    if (d.amkKbdSize) AMKUI.setSize(d.amkKbdSize);
    if (d.amkKbdSizePx) AMKUI.setSizePx(d.amkKbdSizePx);
    if (d.amkKbdWidth) AMKUI.setWidth(d.amkKbdWidth);
    if (d.amkPos) AMKUI.applyPos(d.amkPos);
  });
  refreshSite();
  loadSnips();
  Clip.load();
  P.load().then(() => { if (S.focused || S.kbdOpen) updateIdleBar(); });
  chrome.storage.sync.get(
["amk","amkMode","amkAutoKbd","amkLearning","amkTheme","amkKbdLayout",
      "amkTrace","amkSound","amkAnchor","amkLangMemOn","amkLangMem","amkSiteMode","amkSnippets","amkSites"],
    apply);
  const onStorageChanged = (ch, area) => {
    if (area === "local") { if ("amkSnippets" in ch) loadSnips(); return; }
    if (area !== "sync") return;
    const d = {}; for (const k in ch) d[k] = ch[k].newValue; apply(d);
  };
  chrome.storage.onChanged.addListener(onStorageChanged);

  /* ================= teardown ================= */
  /* Releases every resource this script holds: the 10 document listeners, the
     pending focus/scroll timers, the AudioContext, and the whole UI. Idempotent,
     and safe to call when nothing was mounted. */
  function selfDestruct() {
    while (DOC_BOUND.length) {
      const [type, fn, cap] = DOC_BOUND.pop();
      try { document.removeEventListener(type, fn, cap); } catch (_) {}
    }
    try { chrome.storage.onChanged.removeListener(onStorageChanged); } catch (_) {}
    clearTimeout(hideTimer);
    if (scrollRaf) { cancelAnimationFrame(scrollRaf); scrollRaf = 0; }
    /* close the audio graph — a live AudioContext keeps a hardware thread alive
       and Chrome logs "not allowed to start" until it is explicitly closed */
    try { if (AC && AC.state !== "closed") AC.close(); } catch (_) {}
    AC = null;
    ctx = null; lastField = null;
    S.focused = false; S.kbdOpen = false;
    try { if (window.AMKUI && window.AMKUI.destroy) window.AMKUI.destroy(); } catch (_) {}
    try { delete window.AMKContent; } catch (_) {}
  }
  window.AMKContent = { selfDestruct };
})();