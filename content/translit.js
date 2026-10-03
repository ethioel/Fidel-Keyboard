(() => {
  const FAM = {
    "h":"ሀሁሂሃሄህሆ",   "l":"ለሉሊላሌልሎ",   "hh":"ሐሑሒሓሔሕሖ",  "m":"መሙሚማሜምሞ",
    "ss":"ሠሡሢሣሤሥሦ",  "r":"ረሩሪራሬርሮ",  "s":"ሰሱሲሳሴስሶ",   "sh":"ሸሹሺሻሼሽሾ",
    "q":"ቀቁቂቃቄቅቆ",   "b":"በቡቢባቤብቦ",   "v":"ቨቩቪቫቬቭቮ",  "t":"ተቱቲታቴትቶ",
    "ch":"ቸቹቺቻቼችቾ",  "x":"ኀኁኂኃኄኅኆ",   "n":"ነኑኒናኔንኖ",   "ny":"ኘኙኚኛኜኝኞ",
    "a":"አኡኢኣኤእኦ",   "aa":"ዐዑዒዓዔዕዖ",  "k":"ከኩኪካኬክኮ",   "kh":"ኸኹኺኻኼኽኾ",
    "w":"ወዉዊዋዌውዎ",  "z":"ዘዙዚዛዜዝዞ",   "zh":"ዠዡዢዣዤዥዦ",  "y":"የዩዪያዬይዮ",
    "d":"ደዱዲዳዴድዶ",  "j":"ጀጁጂጃጄጅጆ",  "g":"ገጉጊጋጌግጎ",  "gn":"ጘጙጚጛጜጝጞ",
    "t'":"ጠጡጢጣጤጥጦ", "ch'":"ጨጩጪጫጬጭጮ","p'":"ጰጱጲጳጴጵጶ",
"ts":"ጸጹጺጻጼጽጾ",  "ts'":"ፀፁፂፃፄፅፆ",  "f":"ፈፉፊፋፌፍፎ",  "p":"ፐፑፒፓፔፕፖ",
    "qh":"ቐቑቒቓቔቕቖ",  "dh":"ዸዹዺዻዼዽዾ"
  };
  /* Extended families not on the latin scan — OSK / 1–7 only.
     Kept out of FAM so the latin scanner never swallows "khw" before the
     kh + w labiovelar path gets a chance to handle it. */
  const XFAM = { khw: "ዀ዁ዂዃዄዅ዆" };

  /* 🆕 labiovelars: 5 forms each — ኸʷ (ዀ series) exists in Unicode too,
     kept for physical typing even though the photo's 20 omit it */
  const LABIO = {
    q:"ቈቊቋቌቍ", k:"ኰኲኳኴኵ", x:"ኈኊኋኌኍ",
    g:"ጐጒጓጔጕ", kh:"ዀዂዃዄዅ"
  };
  const LABIO_VOW = { a:0, i:1, aa:2, ee:3, e:4 };
  /* non-velar compounds; ch differs per scheme: ቸʷ=ቿ · ጨʷ=ጯ */
  const WCOMP = {
    l:"ሏ", hh:"ሗ", m:"ሟ", ss:"ሧ", r:"ሯ", s:"ሷ", sh:"ሿ",
    b:"ቧ", v:"ቯ", t:"ቷ", ch:["ቿ","ጯ"], n:"ኗ", ny:"ኟ",
    z:"ዟ", zh:"ዧ", j:"ጇ", "t'":"ጧ", "ch'":"ጯ", ts:"ጿ", f:"ፏ", p:"ፗ"
  };

  /* 🆕 the ⇧ (extended-shift) layer as ONE lookup. The OSK and the physical 1–7
     handler both need a single `key -> forms` map, and these families are not
     all 7 long: labiovelars carry 5 forms, w-compounds a single fused glyph.
     Keys are suffixed with ʷ (U+02B7 MODIFIER LETTER SMALL W) so they can never
     collide with the base families, whose keys are the bare consonant letters.
     ኸʷ is deliberately absent — XFAM.khw above already is that series. */
  const EXT = Object.assign({}, XFAM);
  for (const c in LABIO) if (c !== "kh") EXT[c + "ʷ"] = LABIO[c];
  for (const c in WCOMP) EXT[c + "ʷ"] = Array.isArray(WCOMP[c]) ? WCOMP[c][0] : WCOMP[c];

  /* every family the OSK can show, in one map: base (7) + extended (5 or 1) */
  function fam(k) { return FAM[k] || EXT[k]; }
  /* how the ⇧ layer labels a key, for the tooltip */
  function famKind(k) {
    if (EXT[k] === undefined) return "base";
    if (LABIO[k.slice(0, -1)] && k.endsWith("ʷ") && k.slice(0, -1) !== "kh") return "labio";
    return "wcomp";
  }

  const KEYS = Object.keys(FAM).sort((a, b) => b.length - a.length);
  const VOW  = { e:0, u:1, i:2, a:3, ie:4, ee:4, o:6 };
  const VSTAND = { a:0, e:5, i:2, u:1, o:6 };

  function word(latin) {
    let out = "", i = 0;
    latin = (latin || "").toLowerCase();
    while (i < latin.length) {
      if (latin.startsWith("::", i)) { out += "።"; i += 2; continue; }
      if (latin.startsWith("ie", i) || latin.startsWith("ee", i)) { out += "ኤ"; i += 2; continue; }
      let cons = null;
      for (const k of KEYS) if (latin.startsWith(k, i)) { cons = k; break; }
      if (cons) {
        const rest = i + cons.length;

        /* 🆕 velar + w → labiovelar series (qwa → ቈ, kwa → ኰ, xwa → ኈ, gwa → ጐ,
           khwa → ዀ). This must run BEFORE the plain syllable below, which would
           otherwise read "qwa" as ቅ+ዋ. */
        if (LABIO[cons] && latin[rest] === "w") {
          const m2 = latin.slice(rest + 1).match(/^(aa|ee|[aeiou])/);
          if (m2 && LABIO_VOW[m2[1]] !== undefined) {
            out += LABIO[cons][LABIO_VOW[m2[1]]];
            i = rest + 1 + m2[1].length; continue;
          }
        }
        /* 🆕 cons + wa / cons + awa → the fused ዋ-compound (lwa → ሏ, mwa → ሟ, …) */
        const wc = WCOMP[cons];
        if (wc) {
          const rr = latin.slice(rest);
          const skip = (rr[0] === "a" && rr[1] === "w") ? 1 : 0;   /* zhawa, chawa */
          if (rr[skip] === "w" && rr[skip + 1] === "a") {
            out += Array.isArray(wc) ? wc[0] : wc;
            i = rest + skip + 2; continue;
          }
        }

        const m = latin.slice(rest).match(/^(ie|ee|[euiao])/);
        /* bare "a" takes the 1st order (አ), not the 6th: "alema" -> አለማ, not እለማ */
        let idx = cons === "a" ? 0 : 5, vow = "";
        if (m && VOW[m[1]] !== undefined) { idx = VOW[m[1]]; vow = m[1]; }
        out += FAM[cons][idx];
        i = rest + vow.length;
        continue;
      }
      if (FALLBACK[latin[i]]) {
        const fc = FALLBACK[latin[i]], frest = i + 1;
        const fm = latin.slice(frest).match(/^(ie|ee|[euiao])/);
        let fidx = 5, fvow = "";
        if (fm && VOW[fm[1]] !== undefined) { fidx = VOW[fm[1]]; fvow = fm[1]; }
        out += FAM[fc][fidx];
        i = frest + fvow.length;
        continue;
      }
      if (VSTAND[latin[i]] !== undefined) { out += FAM.a[VSTAND[latin[i]]]; i++; continue; }
      out += latin[i]; i++;
    }
    return out;
  }

  const ALIAS = { h:["h","hh","x"], s:["s","ss"], t:["t","t'"], c:["ch","ch'"],
                  k:["k","q","kh"], a:["a","aa"], p:["p","p'"], n:["n","ny"],
                  z:["z","zh"], g:["g","gn"], ts:["ts","ts'"], b:["b","v"] };
  /* the Ge'ez syllabary has no plain "c" series — the "ch" series stands in for it,
     otherwise a typed "c" fell through and leaked a literal Latin "c" into the output */
  const FALLBACK = { c: "ch" };
  function firstCons(latin) {
    for (const k of KEYS) if (latin.startsWith(k)) return k;
    for (const k in FALLBACK) if (latin.startsWith(k)) return k;
    return null;
  }
  function variants(latin) {
    const list = [latin];
    const c = firstCons(latin);
    if (c && ALIAS[c]) {
      const rest = latin.slice(c.length);
      for (const alt of ALIAS[c]) { const cand = alt + rest; if (!list.includes(cand)) list.push(cand); }
    }
    return list.slice(0, 6);
  }
  window.AMKTranslit = { FAM, XFAM, LABIO, LABIO_VOW, WCOMP, EXT, KEYS, fam, famKind,
                         word, variants, firstCons, VSTAND, PUNCT: { "::": "።" } };
})();