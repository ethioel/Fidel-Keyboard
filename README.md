<div align="center">

# ፊደል Keyboard

**A smart Amharic (Ge'ez) IME for the browser — 100% on-device.**

React-safe input · trace typing · 5-row on-screen keyboard · Ge'ez numerals · emoji & flags

![Manifest V3](https://img.shields.io/badge/manifest-MV3-4285F4?style=flat-square)
![Version](https://img.shields.io/badge/version-1.5.0-0a8a3a?style=flat-square)
![Privacy](https://img.shields.io/badge/network_calls-none-d8241f?style=flat-square)
![License](https://img.shields.io/badge/license-unlicensed-lightgrey?style=flat-square)

</div>

---

ፊደል Keyboard turns a Latin keyboard into a full Ge'ez input method. It runs
entirely inside the browser as a Manifest V3 extension: no account, no server, no
telemetry. Everything you type, everything it learns, and the dictionary it ships
with stay on your machine.

## Highlights

| | |
| --- | --- |
| **Full Ge'ez transliteration** | 37 consonant families, 7 vowel orders, labiovelars and ዋ-compounds |
| **Extended ⇧ layer** | 28 further keys — ቐ ዸ ዀ, the 4 labiovelars, and the 21 fused ዋ-compounds |
| **5-tab on-screen keyboard** | ⌨ EN · ሀግዕዝ · ሳድስ · ሰሌዳ · emoji, with drag, snap-to-edge and resize |
| **Word prediction** | 958-word ranked dictionary with bigram chaining, learned on-device |
| **Emoji & flags** | 158 word mappings (124 Ge'ez + 34 English), plus flags for 72 countries |
| **Clipboard history** | Every copy/cut you make, searchable and insertable |
| **Snippets** | Your own saved phrases, one keystroke to expand |
| **Per-site control** | Enable everywhere, everywhere except a list, or only on a list |
| **React-safe** | Dispatches native input events — works in editors that ignore synthetic ones |
| **Cleans up after itself** | Survives extension reloads/uninstalls without leaving a dead keyboard |

## Install

### From source (development)

1. Clone or download this repository.
2. Open `chrome://extensions` in a Chromium-based browser.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.
5. Reload any already-open tab — content scripts only run on newly loaded pages.

### Requirements

- A Chromium-based browser (Chrome, Edge, Brave, Opera) with Manifest V3 support.
- The extension requests `<all_urls>` because an IME has to be present on whatever
  page you are typing into. You can narrow this to specific sites from the popup.

## Using it

### Writing Ge'ez text

Type Latin letters and they transliterate to Ge'ez as you go.

```
selam          →  ሰላም
ityop'ya       →  ኢትዮጵያ
kwa            →  ኰ          (labiovelar, see the ⇧ layer below)
lwa            →  ሏ          (ዋ-compound)
```

Each syllable ends in a vowel, and the vowel you type selects the **order** of
the consonant:

| Vowel | Order | | Vowel | Order |
| --- | --- | --- | --- | --- |
| `e` | 1st — ሀ | | `ie` / `ee` | 5th — ሄ |
| `u` | 2nd — ሁ | | *(no vowel)* | 6th — ህ |
| `i` | 3rd — ሂ | | `o` | 7th — ሆ |
| `a` | 4th — ሃ | | | |

So `k` + `a` gives `ካ`, because `a` is the fourth order of `k`. A bare `a` on
its own is the exception: it is the syllable `አ`, not the sixth order.

`ie` and `ee` on their own both give `ኤ`.

To change the order of a syllable you have already placed, tap its key on the
on-screen keyboard — the strip underneath fills with every order, and you press
the matching number to switch (`1ኰ 2ኲ 3ኳ 4ኴ 5ኵ`).

### Consonant families

| Key | Order 1–3 | Order 4–7 |
| --- | --- | --- |
| `h` | ሀ ሁ ሂ | ሃ ሄ ህ ሆ |
| `l` | ለ ሉ ሊ | ላ ሌ ል ሎ |
| `hh` | ሐ ሑ ሒ | ሓ ሔ ሕ ሖ |
| `m` | መ ሙ ሚ | ማ ሜ ም ሞ |
| `ss` | ሠ ሡ ሢ | ሣ ሤ ሥ ሦ |
| `r` | ረ ሩ ሪ | ራ ሬ ር ሮ |
| `s` | ሰ ሱ ሲ | ሳ ሴ ስ ሶ |
| `sh` | ሸ ሹ ሺ | ሻ ሼ ሽ ሾ |
| `q` | ቀ ቁ ቂ | ቃ ቄ ቅ ቆ |
| `b` | በ ቡ ቢ | ባ ቤ ብ ቦ |
| `v` | ቨ ቩ ቪ | ቫ ቬ ቭ ቮ |
| `t` | ተ ቱ ቲ | ታ ቴ ት ቶ |
| `ch` | ቸ ቹ ቺ | ቻ ቼ ች ቾ |
| `x` | ኀ ኁ ኂ | ኃ ኄ ኅ ኆ |
| `n` | ነ ኑ ኒ | ና ኔ ን ኖ |
| `ny` | ኘ ኙ ኚ | ኛ ኜ ኝ ኞ |
| `a` | አ ኡ ኢ | ኣ ኤ እ ኦ |
| `aa` | ዐ ዑ ዒ | ዓ ዔ ዕ ዖ |
| `k` | ከ ኩ ኪ | ካ ኬ ክ ኮ |
| `kh` | ኸ ኹ ኺ | ኻ ኼ ኽ ኾ |
| `w` | ወ ዉ ዊ | ዋ ዌ ው ዎ |
| `z` | ዘ ዙ ዚ | ዛ ዜ ዝ ዞ |
| `zh` | ዠ ዡ ዢ | ዣ ዤ ዥ ዦ |
| `y` | የ ዩ ዪ | ያ ዬ ይ ዮ |
| `d` | ደ ዱ ዲ | ዳ ዴ ድ ዶ |
| `j` | ጀ ጁ ጂ | ጃ ጄ ጅ ጆ |
| `g` | ገ ጉ ጊ | ጋ ጌ ግ ጎ |
| `gn` | ጘ ጙ ጚ | ጛ ጜ ጝ ጞ |
| `t'` | ጠ ጡ ጢ | ጣ ጤ ጥ ጦ |
| `ch'` | ጨ ጩ ጪ | ጫ ጬ ጭ ጮ |
| `p'` | ጰ ጱ ጲ | ጳ ጴ ጵ ጶ |
| `ts` | ጸ ጹ ጺ | ጻ ጼ ጽ ጾ |
| `ts'` | ፀ ፁ ፂ | ፃ ፄ ፅ ፆ |
| `f` | ፈ ፉ ፊ | ፋ ፌ ፍ ፎ |
| `p` | ፐ ፑ ፒ | ፓ ፔ ፕ ፖ |
| `qh` | ቐ ቑ ቒ | ቓ ቔ ቕ ቖ |
| `dh` | ዸ ዹ ዺ | ዻ ዼ ዽ ዾ |

### The extended ⇧ layer

Not every series is reachable from plain Latin letters. The **⇧** key (on the
on-screen keyboard, or the extended-shift strip) reveals the 28 remaining series.
It cycles **off → once → locked** — tap twice to keep the layer up while you pick.

The labiovelars have **five** orders, not seven:

| Key | Series |
| --- | --- |
| `qʷ` | ቈ ቊ ቋ ቌ ቍ |
| `kʷ` | ኰ ኲ ኳ ኴ ኵ |
| `xʷ` | ኈ ኊ ኋ ኌ ኍ |
| `gʷ` | ጐ ጒ ጓ ጔ ጕ |

and the ዋ-compounds are single fused glyphs:

| Key | Glyph | Key | Glyph | Key | Glyph |
| --- | --- | --- | --- | --- | --- |
| `lʷ` | ሏ | `hhʷ` | ሗ | `mʷ` | ሟ |
| `ssʷ` | ሧ | `rʷ` | ሯ | `sʷ` | ሷ |
| `shʷ` | ሿ | `bʷ` | ቧ | `vʷ` | ቯ |
| `tʷ` | ቷ | `chʷ` | ቿ | `nʷ` | ኗ |
| `nyʷ` | ኟ | `zʷ` | ዟ | `zhʷ` | ዧ |
| `jʷ` | ጇ | `t'ʷ` | ጧ | `ch'ʷ` | ጯ |
| `tsʷ` | ጿ | `fʷ` | ፏ | `pʷ` | ፗ |

The ዀ series (`ዀ ዁ ዂ ዃ ዄ ዅ ዆`) sits in the same layer as `khw` so it can never
collide with the `kh` + `w` labiovelar path.

## The on-screen keyboard

Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>K</kbd>, or click the ⌨ button, to show it.

| Tab | What it holds |
| --- | --- |
| **⌨ EN** | Your QWERTY keys, each mapped to the Ge'ez family it produces |
| **ሀግዕዝ** | All 37 families, each key showing its **1st-order** glyph |
| **ሳድስ** | The same families laid out for **6th-order** reading |
| **ሰሌዳ** | The classic ሀ–ፐ grid — one row per order, for learners |
| **😊** | Emoji and flags by category, with a recents list |

Drag it by the ⠿ grip on the left — it snaps to the nearest edge when you let go.
Resize it from the right, bottom and corner handles, or pin it in place so it
follows the focused field instead of floating over the page.

## Features

- **Word prediction** — a ranked 958-word dictionary with bigram chaining, shown
  as a strip under the keyboard. Turn on *Learn my typing* and it adapts to the
  words you actually use, stored on-device and synced through your browser profile.
- **Emoji that follows the text** — finish a word and any matching emoji join the
  candidates in the strip; tap one to insert it. 158 words are mapped (124 in
  Ge'ez, 34 in English), including flags for 72 countries. Inserted emoji are kept
  in a recents list on the 😊 tab.
- **Trace typing** — hold a finger on the on-screen keyboard and it draws the path
  you traced across the keys, so you can see which series you hit.
- **Clipboard history** — every copy and cut is captured locally, with a preview,
  ready to re-insert.
- **Snippets** — save phrases you retype often and expand them by name.
- **Key sound & haptics** — an optional click per keystroke, plus vibration where
  supported.
- **Theme** — auto (follows the system), light, or dark. The keyboard is a
  translucent "glass" panel that sits over the page.
- **Per-site control** — run everywhere, everywhere *except* a list of sites, or
  only on a list. The toolbar icon shows a badge when it is inactive on a page.
- **Canvas & closed-shadow detection** — tells you plainly when a field cannot be
  typed into, instead of silently dropping your input.

## Privacy

ፊደል Keyboard makes **no network requests**. There is no analytics code, no
account, and no remote endpoint.

- The dictionary is a file inside the extension, loaded locally.
- Clipboard history, learned words and snippets live in `chrome.storage`.
- Settings sync through your browser's own signed-in profile, not through us.

The extension does need `<all_urls>` and `storage` — an IME has to be injected
into the page you are typing on, and that is the only way to work. The per-site
switch lets you keep it switched off where you do not want it.

The full policy, including a table of exactly what is stored where, lives in
[`privacy.html`](privacy.html) and is linked from the extension's popup.

## Project structure

```
manifest.json          MV3 manifest: permissions, content scripts, command
background.js          Toolbar icon, hotkey relay, page-world watchdog injection
privacy.html           Privacy policy (no data collected; what is stored/synced)
data/
  dictionary.json      958 ranked words + 60 bigrams
  emoji.js             Ge'ez → emoji map, numerals, flag list
content/
  translit.js          Transliteration engine: consonant families, ⇧ layer
  predict.js           Dictionary, bigrams, learning, candidate ranking
  ui.js                On-screen keyboard, drag/resize, theme, teardown
  content.js           Field detection, input dispatch, clipboard, snippets
popup/
  popup.html/.js       Settings panel
```

Content scripts load in a fixed order — `emoji → translit → predict → ui → content`
— because each layer builds on the previous one.

## How it works

A few decisions worth knowing before you change the code:

**The keyboard lives in a closed shadow root.** A `<div id="fidle-host">` is
attached to the page with `attachShadow({ mode: "closed" })`. Page CSS cannot reach
the keyboard and the keyboard cannot be styled by the host page, which is what
keeps it from breaking on sites with aggressive global styles.

**Input is inserted the way a real keystroke would.** React and several other
frameworks keep their own copy of an input's value and ignore anything that
changes it behind their back. So instead of assigning `.value`, the extension
edits the text with `setRangeText` (falling back to `execCommand("insertText")`)
and then fires the real `beforeinput` / `input` sequence. In `contenteditable`
regions it goes through `CompositionEvent` instead. This is why it works in React
apps and plain textareas alike, and why the caret does not jump.

**There is a removal watchdog.** Reloading or uninstalling an extension does not
reload the pages it was on, so the closed shadow root would survive with dead
handlers. The content script beats a heartbeat attribute once a second, and a
watchdog running in the **page's** world deletes the host once the beats stop —
within about six seconds, and immediately when you return to a hidden tab. The
watchdog is injected twice over: inline, and again through `chrome.scripting` in
the MAIN world for sites with a strict CSP that blocks the inline version.

**Teardown is explicit.** `AMKUI.destroy()` and `AMKContent.selfDestruct()` remove
the host, every listener, every timer, the `AudioContext`, and the globals —
and hand the keyboard back cleanly enough to be rebuilt on the same page.

## Development

```bash
# syntax-check every script the extension ships
for f in background.js content/*.js popup/*.js data/*.js; do
  node --check "$f" || echo "FAILED: $f"
done

# validate the manifest and dictionary
node -e "JSON.parse(require('fs').readFileSync('manifest.json'))" && echo "manifest ok"
node -e "const d=require('./data/dictionary.json'); \
  console.log('dictionary', Object.keys(d.words).length, 'words')"
```

Then load the folder through `chrome://extensions` → **Load unpacked** and reload
an open tab.

There is a jsdom-based test suite (258 assertions across 9 suites) covering
transliteration, the ⇧ layer, prediction, the watchdog, and teardown. It lives
outside the repository at the moment; moving it into a `tests/` folder is on the
roadmap.

## Known limitations

- Chromium-based browsers only — the extension uses `chrome.scripting` and a
  Manifest V3 service worker, and has not been tested on Firefox.
- Fields drawn on a `<canvas>` cannot receive typed text. The extension detects
  this and says so rather than failing quietly.
- Elements that keep a **closed** shadow root are unreachable from any content
  script. This is a browser security boundary, not something the extension can
  work around; it is detected and reported.
- The dictionary is intentionally small (958 words) to keep the package light.
  It is designed to be extended — see `data/dictionary.json`.

## Roadmap

- [ ] Add the test suite to the repository under `tests/`
- [ ] Icons for store submission, and set `homepage_url` to the hosted policy
- [ ] Add a monitored contact address to `privacy.html` (store review requires one)
- [ ] Choose and add a license
- [ ] Larger dictionary, and a way for users to add their own words
- [ ] Firefox / Manifest V3 compatibility

## Contributing

Issues and pull requests are welcome. A few things that will make yours easy to
merge:

- **Do not reorder the content scripts** in `manifest.json`. They depend on load
  order.
- **Keep the two watchdog copies in sync.** `background.js` mirrors
  `AMK_WATCHDOG_SRC` in `content/ui.js`; if they drift, some pages will keep a
  dead keyboard forever. There is a test that guards this.
- **Run the tests** before opening a pull request. They are not in the repository
  yet, so ask if you need them moved into `tests/`.
- Match the existing comment style: explain *why* something is done, not what the
  next line obviously does.

## License

**Not yet licensed.** The author has not chosen a license for this project yet.
Add a `LICENSE` file before redistributing.

---

<div align="center">

Made with care for the Ge'ez script · ፊደል Keyboard

</div>
