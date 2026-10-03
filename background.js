// ፊደል background: runtime-drawn status icon + popup relay + hotkey relay.
const ICON_CACHE = {};

function drawIcon(on) {
  if (ICON_CACHE[on ? "on" : "off"]) return ICON_CACHE[on ? "on" : "off"];
  const s = 64, c = new OffscreenCanvas(s, s), x = c.getContext("2d");
  const r = 15;
  x.beginPath();
  x.moveTo(r, 0); x.lineTo(s - r, 0); x.quadraticCurveTo(s, 0, s, r);
  x.lineTo(s, s - r); x.quadraticCurveTo(s, s, s - r, s);
  x.lineTo(r, s); x.quadraticCurveTo(0, s, 0, s - r);
  x.lineTo(0, r); x.quadraticCurveTo(0, 0, r, 0); x.closePath();
  const g = x.createLinearGradient(0, 0, s, s);
  if (on) { g.addColorStop(0, "#0a8a3a"); g.addColorStop(.52, "#f2c500"); g.addColorStop(1, "#d8241f"); }
  else    { g.addColorStop(0, "#c9cfd9"); g.addColorStop(1, "#eef0f4"); }
  x.fillStyle = g; x.fill();
  x.fillStyle = on ? "#ffffff" : "#69707f";
  x.font = "700 30px Arial, Helvetica, sans-serif";
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText("fi", s / 2, s / 2 + 1);
  const d = x.getImageData(0, 0, s, s);
  ICON_CACHE[on ? "on" : "off"] = d;
  return d;
}

const hostOf = u => { try { return new URL(u).hostname; } catch (_) { return ""; } };

async function effState(host) {
  const d = await chrome.storage.sync.get(["amk", "amkSiteMode", "amkSites"]);
  if (d.amk === false) return { on: false, why: "off" };
  const mode = d.amkSiteMode || "all", L = d.amkSites || {};
  return { on: mode === "all" ? true : mode === "except" ? !L[host] : !!L[host], why: "site" };
}

async function paintTab(tabId, url) {
  const st = await effState(hostOf(url || ""));
  try {
    await chrome.action.setIcon({ tabId, imageData: drawIcon(st.on) });
    await chrome.action.setBadgeText({ tabId, text: st.on ? "" : st.why });
    if (!st.on) await chrome.action.setBadgeBackgroundColor({ tabId, color: "#69707f" });
  } catch (_) {}
}
async function paintAll() {
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.map(t => paintTab(t.id, t.url)));
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try { const t = await chrome.tabs.get(tabId); paintTab(tabId, t.url); } catch (_) {}
  injectWatchdog(tabId);
});
/* 🆕 page-world removal watchdog.
   When the extension is uninstalled or reloaded the page is NOT reloaded, so our
   closed shadow root survives with dead handlers. The content script beats a
   heartbeat attribute; this runs in the MAIN world (so it survives the isolated
   world being torn down) and deletes the host once the beats stop.

   This source is mirrored from AMK_WATCHDOG_SRC in content/ui.js. chrome.scripting
   is used because it bypasses the page's CSP — an inline <script> injected from the
   content script is blocked on strict-CSP sites, so the background is what actually
   guarantees a watcher exists in every page.

   STALE is 6s, not 15s: a hidden tab's timers are throttled to ~1/min, so with a long
   threshold a tab that was hidden when the extension was removed kept its dead keyboard
   on screen long after being brought back. The sweep also runs the instant the page
   becomes visible again, so a tab you are looking at is cleaned within ~6s. Judging is
   skipped while the page is hidden, where the beat can be a minute old on a live,
   perfectly healthy keyboard. */
function amkWatchdog() {
  if (window.__amkWd) return;
  window.__amkWd = 1;
  const S = 6000, T = 500, t0 = Date.now();
  let iv = 0;
  const sweep = () => {
    if (document.hidden) return;
    /* stop signal set by AMKUI.destroy() — tear this interval down instead of
       waking the page forever. Must stay in sync with AMK_WATCHDOG_SRC in ui.js. */
    if (document.documentElement.hasAttribute("data-amk-wdstop")) {
      document.documentElement.removeAttribute("data-amk-wdstop");
      try { clearInterval(iv); } catch (_) {}
      return;
    }
    const hs = document.querySelectorAll("#fidle-host");
    for (const h of hs) {
      const b = Number(h.getAttribute("data-amk-beat")) || 0;
      const born = Number(h.getAttribute("data-amk-born")) || t0;
      const ref = b ? Date.now() - b : Date.now() - born;
      if (ref > S) { try { h.remove(); } catch (_) {} }
    }
  };
  iv = setInterval(sweep, T);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) sweep(); });
  addEventListener("focus", sweep);
  addEventListener("pageshow", sweep);
  try { document.documentElement.setAttribute("data-amk-wd", "1"); } catch (_) {}
  sweep();
}
async function injectWatchdog(tabId) {
  if (tabId == null) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      world: "MAIN",
      func: amkWatchdog
    });
  } catch (_) {}
}
async function injectAllWatchdogs() {
  try {
    const tabs = await chrome.tabs.query({});
    await Promise.all(tabs.map(t => injectWatchdog(t.id)));
  } catch (_) {}
}

/* 🆕 the content script cannot see the page's window from its isolated world, so when a
   strict-CSP page blocks the inline watcher it signals us and we inject the CSP-proof
   one. Without this the page would keep a dead keyboard forever. */
function needWd(sender) {
  const id = sender && sender.tab && sender.tab.id;
  if (id != null) injectWatchdog(id);
}

/* 🆕 a tab that was open before the extension loaded/reloaded, or one where an injection
   was lost, may have no watcher at all — and then nothing ever cleans the page up. This
   re-injects into every tab periodically; amkWatchdog() is a no-op once installed, so it
   costs one executeScript per tab per 30s and nothing more. */
const WD_ALARM = "amkWd";
function ensureAlarm() {
  try { chrome.alarms.create(WD_ALARM, { periodInMinutes: 0.5 }); } catch (_) {}
}

chrome.tabs.onUpdated.addListener((id, ci, t) => {
  if (ci.url || ci.status === "complete") paintTab(id, t.url);
  if (ci.status === "loading" || ci.status === "complete") injectWatchdog(id);
});
chrome.alarms.onAlarm.addListener(a => { if (a.name === WD_ALARM) injectAllWatchdogs(); });
chrome.storage.onChanged.addListener((ch, area) => { if (area === "sync") paintAll(); });
chrome.runtime.onStartup.addListener(() => { paintAll(); injectAllWatchdogs(); ensureAlarm(); });
chrome.runtime.onInstalled.addListener(() => { paintAll(); injectAllWatchdogs(); ensureAlarm(); });
paintAll();
ensureAlarm();
injectAllWatchdogs();

/* relays */
chrome.runtime.onMessage.addListener((m, s, respond) => {
  if (m && m.t === "needWd") { needWd(s); return; }
  if (m && (m.t === "clearLearned" || m.t === "resetPos" || m.t === "clearClip")) {
    chrome.tabs.query({ active: true, currentWindow: true }, async ts => {
      if (ts[0]) { try { respond(await chrome.tabs.sendMessage(ts[0].id, m) || { ok: true }); }
                   catch (_) { respond({ ok: false }); } }
      else respond({ ok: false });
    });
    return true;
  }
});

/* 🆕 Ctrl+Shift+K */
chrome.commands.onCommand.addListener(cmd => {
  if (cmd !== "toggle-fidle") return;
  chrome.tabs.query({ active: true, currentWindow: true }, ts => {
    if (ts[0]) chrome.tabs.sendMessage(ts[0].id, { t: "hotkey" }).catch(() => {});
  });
});