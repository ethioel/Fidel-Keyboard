document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);
  const KEYS = ["amk","amkMode","amkAutoKbd","amkLearning","amkTheme","amkKbdLayout",
    "amkTrace","amkSound","amkAnchor","amkLangMemOn","amkLangMem","amkSiteMode","amkSnippets","amkSites"];
  let curHost = "", siteMode = "all", sites = {};

  /* theme: drives this popup's own colours, same value the on-screen keyboard uses */
  const mqDark = matchMedia("(prefers-color-scheme: dark)");
  let theme = "auto";
  function applyTheme() {
    document.body.classList.toggle("t-dark", theme === "dark" || (theme !== "light" && mqDark.matches));
  }
  mqDark.addEventListener("change", applyTheme);
  applyTheme();

  const pulse = el => { const r = el.closest(".row"); if (!r) return;
    r.classList.remove("pulse"); void r.offsetWidth; r.classList.add("pulse"); };
  const put = obj => { try { chrome.storage.sync.set(obj); } catch (_) {} };

  chrome.storage.sync.get(KEYS, d => {
    $("en").checked = d.amk !== false;
    $("mode").value = d.amkMode || "am";
    $("kbd").checked = d.amkAutoKbd !== false;
    $("learn").checked = d.amkLearning !== false;
    $("langmem").checked = d.amkLangMemOn !== false;
    $("theme").value = d.amkTheme || "auto";
    theme = d.amkTheme || "auto"; applyTheme();
    /* 🆕 layout now selects the default OSK tab */
    const lv = d.amkKbdLayout || "hagaz";
    $("layout").value = ["hagaz","sadis","grid","intl"].includes(lv) ? lv : "hagaz";
    $("trace").checked = !!d.amkTrace;
    $("sound").checked = !!d.amkSound;
    $("anchor").checked = !!d.amkAnchor;
    siteMode = d.amkSiteMode || "all";
    $("siteMode").value = siteMode;
    sites = d.amkSites || {};
    renderSites(); updateCurSite();
  });

  /* snippets live in chrome.storage.local (content.js reads them from there) */
  chrome.storage.local.get("amkSnippets").then(d => {
    const sn = d.amkSnippets || {};
    $("snips").value = Object.entries(sn)
      .map(([k, v]) => `${k} = ${String(v).replace(/\n/g, "\\n")}`).join("\n");
  }).catch(() => {});

  $("en").addEventListener("change", e => { put({ amk: e.target.checked }); pulse(e.target); });
  $("mode").addEventListener("change", e => { put({ amkMode: e.target.value }); pulse(e.target); });
  $("kbd").addEventListener("change", e => { put({ amkAutoKbd: e.target.checked }); pulse(e.target); });
  $("learn").addEventListener("change", e => { put({ amkLearning: e.target.checked }); pulse(e.target); });
  $("langmem").addEventListener("change", e => { put({ amkLangMemOn: e.target.checked }); pulse(e.target); });
  $("theme").addEventListener("change", e => { theme = e.target.value; applyTheme(); put({ amkTheme: theme }); pulse(e.target); });
  $("layout").addEventListener("change", e => { put({ amkKbdLayout: e.target.value }); pulse(e.target); });
  $("trace").addEventListener("change", e => { put({ amkTrace: e.target.checked }); pulse(e.target); });
  $("sound").addEventListener("change", e => { put({ amkSound: e.target.checked }); pulse(e.target); });
  $("anchor").addEventListener("change", e => { put({ amkAnchor: e.target.checked }); pulse(e.target); });
  $("siteMode").addEventListener("change", e => {
    siteMode = e.target.value; put({ amkSiteMode: siteMode }); pulse(e.target);
    renderSites(); updateCurSite();
  });

  chrome.storage.onChanged.addListener((ch, area) => {
    if (area !== "sync") return;
    if (ch.amk) $("en").checked = ch.amk.newValue !== false;
    if (ch.amkMode) $("mode").value = ch.amkMode.newValue || "am";
    if (ch.amkTheme) { theme = ch.amkTheme.newValue || "auto"; $("theme").value = theme; applyTheme(); }
    if (ch.amkSites) { sites = ch.amkSites.newValue || {}; renderSites(); updateCurSite(); }
  });

  function send(m, cb) {
    chrome.tabs.query({ active: true, currentWindow: true }, ts => {
      const tab = ts && ts[0];
      if (tab) chrome.tabs.sendMessage(tab.id, m).then(r => cb && cb(r))
                   .catch(() => { try { chrome.runtime.sendMessage(m, () => void chrome.runtime.lastError); } catch (_) {} cb && cb(); });
      else cb && cb();
    });
  }
  $("clear").onclick = () => send({ t: "clearLearned" }, () => { $("clear").textContent = "Cleared ✓"; });
  /* remove the key here as well as in the tab: if no content script is listening
     (chrome:// page, or the tab reloaded) the popup still clears the stored copy */
  $("clearClip").onclick = () => { chrome.storage.local.remove("amkClip");
    send({ t: "clearClip" }, () => { $("clearClip").textContent = "Clipboard cleared ✓"; }); };
  $("resetPos").onclick = () => { chrome.storage.local.remove("amkPos");
    send({ t: "resetPos" }, () => { $("resetPos").textContent = "Position reset ✓"; }); };

  /* session stats */
  send({ t: "getStats" }, r => {
    if (r) $("stats").textContent = `Session: ${r.words} words · ${r.wpm} WPM`;
  });

  /* snippets */
  $("snipSave").onclick = () => {
    const out = {};
    $("snips").value.split("\n").forEach(line => {
      const i = line.indexOf("=");
      if (i < 1) return;
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim().replace(/\\n/g, "\n");
      if (k && v) out[k] = v;
    });
    chrome.storage.local.set({ amkSnippets: out });
    $("snipSave").textContent = "Saved ✓";
    setTimeout(() => { $("snipSave").textContent = "Save snippets"; }, 1500);
  };

  /* sites */
  function saveSites() { put({ amkSites: sites }); renderSites(); updateCurSite(); }
  function renderSites() {
    const ul = $("siteList"); ul.innerHTML = "";
    const hosts = Object.keys(sites).sort();
    hosts.forEach(h => {
      const li = document.createElement("li");
      const s = document.createElement("span"); s.textContent = h; li.append(s);
      const b = document.createElement("button"); b.textContent = "✕";
      b.onclick = () => { delete sites[h]; saveSites(); };
      li.append(b); ul.append(li);
    });
  }
  $("siteAdd").onclick = () => {
    const h = $("siteInput").value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    if (h && !/^(chrome|about|edge)/.test(h)) { sites[h] = true; $("siteInput").value = ""; saveSites(); }
  };
  $("siteInput").addEventListener("keydown", e => { if (e.key === "Enter") $("siteAdd").click(); });

  /* make the whole row a hit target for every switch */
  document.querySelectorAll(".row").forEach(r => {
    const cb = r.querySelector('.sw input[type=checkbox]');
    if (!cb) return;
    r.style.cursor = "pointer";
    r.addEventListener("click", e => {
      if (e.target.closest && e.target.closest(".sw")) return;   // switch handles itself
      cb.click();
    });
  });

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    try { curHost = new URL(tabs[0].url).hostname; } catch (_) { curHost = ""; }
    if (!curHost || /^(chrome|about|edge)/.test(curHost)) return;
    $("curSiteRow").style.display = "";
    $("curHost").textContent = curHost;
    updateCurSite();
  });
  function updateCurSite() {
    if (!curHost) return;
    const on = siteMode === "all" ? true : siteMode === "except" ? !sites[curHost] : !!sites[curHost];
    $("curSite").checked = on;
  }
  $("curSite").addEventListener("change", e => {
    if (siteMode === "all") { updateCurSite(); return; }
    if (e.target.checked) delete sites[curHost]; else sites[curHost] = true;
    saveSites();
  });
});