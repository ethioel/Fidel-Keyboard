(() => {
  const FALLBACK = {
    "ሰላም":1000,"እንዴት":820,"ናት":540,"ነህ":430,"ነሽ":430,"ነው":700,"አመሰግናለሁ":620,
    "ኢትዮጵያ":920,"አማርኛ":650,"ፊደል":600,"ግዕዝ":520,"እኔ":530,"አዎ":520,"ቤት":520,
    "አገር":560,"ደህና":460,"እሺ":460,"መልካም":500,"ቡና":460,"ጥሩ":430,"በጣም":410,
    "አባት":460,"እናት":410,"ጓደኛ":440,"ዛሬ":430,"አሁን":440,"ስልክ":480,"እና":430
  };
  const FALLBACK_BI = {
    "ሰላም":{"እንዴት":9},"እንዴት":{"ናት":8,"ነህ":7,"ነሽ":7},
    "መልካም":{"ቀን":7},"እንኳን":{"ደህና":8},"አመሰግናለሁ":{"በጣም":6},"በጣም":{"ጥሩ":7}
  };

  let DICT = {}, BI = {}, learned = {}, learnedBI = {};
  let buckets = new Map(), TOP = [];

  function reindex() {
    buckets = new Map();
    for (const w of Object.keys(DICT)) {
      const k = w[0];
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(w);
    }
    TOP = Object.entries(DICT).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0]);
  }
  reindex();   /* safe to query candidates() before the async load() finishes */

  async function loadDict() {
    const ver = chrome.runtime.getManifest().version;
    let json = null;
    try {
      const res = await fetch(chrome.runtime.getURL("data/dictionary.json"));
      json = await res.json();
    } catch (_) {}
    const dv = (json && json.v) || null;
    const st = await chrome.storage.local.get("amkDictCache");
    let cache = st.amkDictCache;
    if (!cache || cache.v !== ver || (dv && cache.dv !== dv)) {
      cache = { v: ver, dv, words: (json && json.words) || {}, bigrams: (json && json.bigrams) || {} };
      chrome.storage.local.set({ amkDictCache: cache });
    }
    DICT = Object.assign({}, FALLBACK, cache.words);
    BI = Object.assign({}, FALLBACK_BI, cache.bigrams);
    reindex();
  }

  function candidates(prefixes) {
    const res = new Map();
    const add = (w, s) => res.set(w, Math.max(res.get(w) || 0, s));
    prefixes.forEach((p, pi) => {
      if (!p) return;
      const boost = pi === 0 ? 250 : 120;
      add(p, 300 + boost);
      for (const w of (buckets.get(p[0]) || []))
        if (w.startsWith(p)) add(w, (DICT[w] || 0) * 0.5 + boost + (w === p ? 200 : 0));
      for (const w in learned)
        if (w.startsWith(p)) add(w, learned[w] * 2 + boost + (w === p ? 200 : 0));
    });
    return [...res.entries()].sort((a, b) => b[1] - a[1]).slice(0, 9).map(e => e[0]);
  }

  function nextWords(prev) {
    const m = new Map();
    const g = BI[prev] || {}, b = learnedBI[prev] || {};
    for (const k in g) m.set(k, g[k]);
    for (const k in b) m.set(k, (m.get(k) || 0) + b[k] * 2);
    const out = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]);
    return out.length ? out : TOP.slice(0, 6);
  }

  const starters = () => TOP.slice(0, 6);

  function learn(word, prev) {
    if (!word) return;
    learned[word] = (learned[word] || 0) + 1;
    if (prev) {
      learnedBI[prev] = learnedBI[prev] || {};
      learnedBI[prev][word] = (learnedBI[prev][word] || 0) + 1;
    }
    chrome.storage.local.set({ amkLearned: learned, amkLearnedBI: learnedBI });
    syncLearned();                                   // 🆕 propagate across devices (capped)
  }

  const topN = (obj, n) =>
    Object.fromEntries(Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n));
  function syncLearned() {
    try {
      chrome.storage.sync.set({
        amkLearnedSync: {
          words: topN(learned, 150),
          bi: Object.fromEntries(
            Object.entries(learnedBI).sort((a, b) => b[1] - a[1]).slice(0, 100)
              .map(([k, m]) => [k, topN(m, 8)]))
        }
      });
    } catch (_) {}
  }

  async function load() {
    const d = await chrome.storage.local.get(["amkLearned", "amkLearnedBI"]);
    learned = d.amkLearned || {};
    learnedBI = d.amkLearnedBI || {};
    const s = await chrome.storage.sync.get("amkLearnedSync");   // merge from other devices
    const sw = (s.amkLearnedSync && s.amkLearnedSync.words) || {};
    const sb = (s.amkLearnedSync && s.amkLearnedSync.bi) || {};
    for (const w in sw) learned[w] = Math.max(learned[w] || 0, sw[w]);
    for (const w in sb) {
      learnedBI[w] = learnedBI[w] || {};
      for (const k in sb[w]) learnedBI[w][k] = Math.max(learnedBI[w][k] || 0, sb[w][k]);
    }
    await loadDict();
  }

  function clearLearned() {
    learned = {}; learnedBI = {};
    chrome.storage.local.remove(["amkLearned", "amkLearnedBI"]);
    chrome.storage.sync.remove("amkLearnedSync");
  }

  window.AMKPredict = { candidates, nextWords, starters, learn, load, clearLearned };
})();