/* Falalá — utilidades de interface: ícones, mascote, modais, avisos e fala. */
window.F = window.F || {};
(function (F) {
  const C = window.FALALA_CONTENT;

  F.esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  F.$ = (sel, root = document) => root.querySelector(sel);
  F.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* palavra com [alvo] -> HTML com destaque / texto limpo */
  F.markHTML = (w) => F.esc(w).replace(/\[(.+?)\]/g, "<mark>$1</mark>");
  F.plain = (w) => String(w || "").replace(/[\[\]]/g, "");

  /* datas */
  const fmtDay = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  const fmtFull = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  F.day = (iso) => fmtDay.format(new Date(iso)).replace(".", "");
  F.dateTime = (iso) => fmtFull.format(new Date(iso)).replace(".", "");
  F.ago = (iso) => {
    const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (d <= 0) return "hoje";
    if (d === 1) return "ontem";
    if (d < 7) return `há ${d} dias`;
    if (d < 30) return `há ${Math.floor(d / 7)} sem.`;
    return F.day(iso);
  };
  F.daysLeft = (iso) => Math.max(0, Math.ceil((new Date(iso) - Date.now()) / 86400000));
  F.pct = (s) => s.total ? Math.round(((s.correct + s.helped * 0.5) / s.total) * 100) : 0;
  F.firstName = (n) => {
    const parts = String(n || "").trim().split(/\s+/).filter(Boolean);
    const skip = /^(dra?|fga?|fono|prof|profa|sra?|srta)\.?$/i;
    return parts.find(p => !skip.test(p)) || parts[0] || "";
  };

  /* conteúdo */
  F.track = (id) => C.tracks.find(t => t.id === id);
  /* listas próprias da fono viram exercícios como os outros (id "c:<uuid>") */
  F.customToEx = (c) => ({
    id: c.id && String(c.id).startsWith("c:") ? c.id : "c:" + c.id, custom: true, rowId: String(c.id).replace(/^c:/, ""),
    type: c.type || "words", title: c.title, kid: c.type === "phrases" ? "Frases escolhidas pela sua fono" : "Palavras escolhidas pela sua fono",
    tip: "Lista criada por você.", items: c.items || [], trackId: c.track
  });
  F.customAll = () => [...((F.S && F.S.custom) || []).map(F.customToEx), ...(F.homeCustom || []).map(F.customToEx)];
  F.exercise = (id) => {
    for (const t of C.tracks) { const e = t.exercises.find(x => x.id === id); if (e) return { ...e, track: t }; }
    const c = F.customAll().find(x => x.id === id);
    return c ? { ...c, track: F.track(c.trackId) || C.tracks[0] } : null;
  };
  F.exercisesOf = (trackId) => [...(F.track(trackId)?.exercises || []), ...F.customAll().filter(c => c.trackId === trackId)];
  F.itemCount = (e) => e.items ? e.items.length : 1;
  F.itemLabel = (e) => {
    const n = F.itemCount(e);
    if (e.type === "breath") return `${e.reps} respirações`;
    return { words: `${n} palavras`, phrases: `${n} frases`, pairs: `${n} pares`, clap: `${n} palavras`, rhyme: `${n} pares`, twister: `${n} trava-línguas` }[e.type] || `${e.reps} repetições${e.hold ? ` · segura ${e.hold}s` : ""}`;
  };

  /* figuras: PNG próprio (igual em todo aparelho), com o emoji como reserva */
  F.code = (e) => [...String(e || "")].map(c => c.codePointAt(0)).filter(cp => cp !== 0xFE0F).map(cp => cp.toString(16)).join("-");
  F.pic = (e, cls = "") => e ? `<img class="emo ${cls}" src="img/${F.code(e)}.png" alt="" data-e="${F.esc(e)}" draggable="false">` : "";
  document.addEventListener("error", (ev) => {
    const im = ev.target;
    if (im && im.tagName === "IMG" && im.classList.contains("emo") && im.dataset.e) {
      const sp = document.createElement("span"); sp.className = im.className.replace("emo", "emo-txt"); sp.textContent = im.dataset.e; im.replaceWith(sp);
    }
  }, true);
  F.avatar = (id) => F.pic((C.avatars.find(a => a.id === id) || C.avatars[0]).pic);
  F.chip = (trackId) => { const t = F.track(trackId); return t ? `<span class="chip ${t.id}">${F.esc(t.name)}</span>` : ""; };
  F.stars = (n) => `<span class="stars" aria-label="${n} de 3 estrelas">${"★".repeat(n)}<span class="off">${"★".repeat(3 - n)}</span></span>`;

  /* ícones (traço simples) */
  const P = {
    home: '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h12V10"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.8 2.5 3 5.2"/>',
    book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5z"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    right: '<path d="m9 6 6 6-6 6"/>',
    left: '<path d="m15 6-6 6 6 6"/>',
    sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    slow: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 12h5"/>',
    camera: '<path d="M4 8.5C4 7.7 4.7 7 5.5 7h2l1.5-2h6l1.5 2h2c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5h-13C4.7 19 4 18.3 4 17.5z"/><circle cx="12" cy="13" r="3.5"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    star: '<path d="m12 4 2.4 5 5.4.7-4 3.7 1 5.4L12 16.3 7.2 18.8l1-5.4-4-3.7 5.4-.7z"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
    edit: '<path d="M5 19h4L19.5 8.5a2.1 2.1 0 0 0-3-3L6 16z"/>',
    out: '<path d="M14 5h4.5c.8 0 1.5.7 1.5 1.5v11c0 .8-.7 1.5-1.5 1.5H14"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    archive: '<rect x="4" y="5" width="16" height="4" rx="1"/><path d="M5.5 9v9.5c0 .8.7 1.5 1.5 1.5h10c.8 0 1.5-.7 1.5-1.5V9M10 13h4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5c0-.8-.7-1.5-1.5-1.5h-9C4.7 4 4 4.7 4 5.5v9c0 .8.7 1.5 1.5 1.5H8"/>',
    shuffle: '<path d="M4 7h3c4 0 6 10 10 10h3M4 17h3c1.5 0 2.7-1.3 3.7-3M14 9.7C15 8.2 16 7 17 7h3"/><path d="m18 4 3 3-3 3M18 14l3 3-3 3"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    mute: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="m16 9.5 5 5M21 9.5l-5 5"/>',
    alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.3"/>',
    file: '<path d="M7 3.5h7l4.5 4.5v12.5H7z"/><path d="M14 3.5V8h4.5M9.5 13h6M9.5 16.5h6"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    hand: '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12M11 11V5a1.5 1.5 0 0 1 3 0v6M14 11V6.5a1.5 1.5 0 0 1 3 0V14c0 3.6-2.4 6.5-6 6.5-2.5 0-4.2-1.3-5.4-3.4L4 13.8a1.5 1.5 0 0 1 2.5-1.6L8 14"/>',
    mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',
    stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
    send: '<path d="M4 12 20 4l-4 16-4-6.5z"/><path d="m12 13.5 8-9.5"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2h-14z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19.5h14"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    chart: '<path d="M4 19h16M7 16v-5M12 16V7M17 16v-8"/>',
    whats: '<path d="M4.5 19.5l1.2-3.8A8 8 0 1 1 8.6 18.5z"/><path d="M9 9.5c.4 2.2 2.3 4.1 4.5 4.5l1.2-1.2 1.8.9c-.3 1.2-1.3 1.8-2.5 1.6-3-.5-5.3-2.8-5.8-5.8-.2-1.2.4-2.2 1.6-2.5l.9 1.8z"/>'
  };
  F.icon = (name, cls = "") => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ""}</svg>`;

  /* logo e mascote */
  F.logoMark = (bg = "#FF6A3D", fg = "#fff") => `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4c11 0 20 8.4 20 19.5S35 43 24 43c-3 0-5.8-.6-8.3-1.7L6 44l2.6-8.6C5.7 32 4 28 4 23.5 4 12.4 13 4 24 4z" fill="${bg}"/><path d="M15 25c2.5 5 15.5 5 18 0" stroke="${fg}" stroke-width="3.4" fill="none" stroke-linecap="round"/><circle cx="17.5" cy="18" r="2.6" fill="${fg}"/><circle cx="30.5" cy="18" r="2.6" fill="${fg}"/></svg>`;
  F.logo = (href = "#painel", inverted = false) => `<a class="logo" href="${href}" ${inverted ? 'style="color:#fff"' : ""}>${inverted ? F.logoMark("#fff", "#FF6A3D") : F.logoMark()}<span>Falalá</span></a>`;

  F.mascot = (mood = "happy", color = "#FF6A3D") => {
    const mouth = {
      happy: '<path d="M70 118c12 22 48 22 60 0" stroke="#24324A" stroke-width="7" fill="#fff" stroke-linecap="round" stroke-linejoin="round"/>',
      talk: '<ellipse cx="100" cy="124" rx="20" ry="16" fill="#24324A"/><ellipse cx="100" cy="131" rx="11" ry="6" fill="#FF8FA3"/>',
      wow: '<circle cx="100" cy="124" r="13" fill="#24324A"/>'
    }[mood] || "";
    return `<svg class="mascot" viewBox="0 0 200 200" aria-hidden="true">
      <g class="body">
        <path d="M100 22c46 0 78 30 78 74s-30 82-78 82-78-38-78-82 32-74 78-74z" fill="${color}"/>
        <ellipse cx="62" cy="58" rx="16" ry="10" fill="#fff" opacity=".35"/>
        <circle cx="74" cy="88" r="15" fill="#fff"/><circle cx="126" cy="88" r="15" fill="#fff"/>
        <circle cx="77" cy="91" r="7" fill="#24324A"/><circle cx="129" cy="91" r="7" fill="#24324A"/>
        <circle cx="56" cy="114" r="8" fill="#FFB0A0" opacity=".7"/><circle cx="144" cy="114" r="8" fill="#FFB0A0" opacity=".7"/>
        ${mouth}
      </g>
      <path d="M180 64c8 8 8 22 0 30M190 54c14 14 14 36 0 50" stroke="${color}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>
    </svg>`;
  };

  /* boca desenhada para os exercícios de língua e lábios */
  F.mouth = (pose) => {
    const lips = (d, fill = "#C8475E") => `<path d="${d}" fill="${fill}"/>`;
    const open = '<path d="M60 120c0-26 36-38 80-38s80 12 80 38-36 56-80 56-80-30-80-56z" fill="#5C1B2B"/>';
    const teethTop = '<path d="M92 94h96c-4 10-10 14-18 14H110c-8 0-14-4-18-14z" fill="#fff"/>';
    const teethBot = '<path d="M100 160h80c-6 6-14 9-22 9h-36c-8 0-16-3-22-9z" fill="#fff"/>';
    const face = '<rect width="280" height="280" rx="28" fill="#FFE2CC"/><circle cx="62" cy="58" r="10" fill="#24324A"/><circle cx="218" cy="58" r="10" fill="#24324A"/><circle cx="48" cy="150" r="16" fill="#FFB0A0" opacity=".6"/><circle cx="232" cy="150" r="16" fill="#FFB0A0" opacity=".6"/>';
    const tongue = (d, cls = "") => `<path class="${cls}" d="${d}" fill="#FF8FA3" stroke="#E0607A" stroke-width="3"/>`;
    const poses = {
      up: face + open + teethTop + teethBot + tongue("M104 150c4-30 22-44 36-44s32 14 36 44c-20 8-52 8-72 0z", "anim-pulse") + '<circle cx="140" cy="102" r="6" fill="#FFC93C"/>',
      out: face + open + teethTop + teethBot + tongue("M122 140c0-10 8-16 18-16s18 6 18 16v58c0 14-8 24-18 24s-18-10-18-24z", "anim-pulse"),
      side: face + open + teethTop + teethBot + tongue("M120 136c10-8 40-8 50 0l40 4c8 2 8 14 0 16l-40 6c-14 6-36 6-50-2z", "anim-side"),
      click: face + open + teethTop + teethBot + tongue("M100 156c6-36 24-52 40-52s34 16 40 52c-24 10-56 10-80 0z", "anim-pulse") + '<path d="M232 96l16-10M236 116l20 0M232 136l16 10" stroke="#5B4FC4" stroke-width="5" stroke-linecap="round"/>',
      kiss: face + '<ellipse cx="140" cy="140" rx="34" ry="30" fill="#C8475E" class="anim-pulse"/><ellipse cx="140" cy="140" rx="10" ry="8" fill="#5C1B2B"/>',
      puff: face.replace(/r="16"/g, 'r="30"') + '<path d="M110 146c10-8 50-8 60 0" stroke="#C8475E" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="54" cy="150" r="34" fill="#FFD1BC" class="anim-pulse"/><circle cx="226" cy="150" r="34" fill="#FFD1BC" class="anim-pulse"/>',
      blow: face + '<ellipse cx="140" cy="146" rx="22" ry="18" fill="#C8475E"/><ellipse cx="140" cy="146" rx="8" ry="6" fill="#5C1B2B"/><path class="anim-side" d="M176 140c14-4 26 0 40-6M178 156c16 0 28 6 44 2" stroke="#7FB8E6" stroke-width="5" fill="none" stroke-linecap="round"/>',
      lick: face + lips("M70 126c20-20 120-20 140 0-20 34-120 34-140 0z") + '<path d="M96 128c14-10 74-10 88 0-14 14-74 14-88 0z" fill="#5C1B2B"/>' + tongue("M168 124c10-6 24-6 30 4s-2 20-12 20-18-4-22-10z", "anim-side")
    };
    return `<svg viewBox="0 0 280 280" aria-hidden="true">${poses[pose] || poses.up}</svg>`;
  };

  /* avisos */
  F.toast = (msg, bad = false) => {
    let box = F.$(".toasts");
    if (!box) { box = document.createElement("div"); box.className = "toasts"; box.setAttribute("role", "status"); document.body.appendChild(box); }
    const t = document.createElement("div");
    t.className = "toast" + (bad ? " bad" : "");
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3600);
  };

  /* modal próprio (o navegador pode bloquear confirm/alert) */
  F.modal = ({ title, body, actions = [], onMount, wide = false }) => new Promise((resolve) => {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${F.esc(title)}" style="${wide ? "width:min(680px,100%)" : ""}">
      <div class="modal-head"><h2>${F.esc(title)}</h2><button class="icon-btn" data-close aria-label="Fechar">${F.icon("x")}</button></div>
      <div class="modal-body">${body}</div>
      ${actions.length ? `<div class="row" style="justify-content:flex-end">${actions.map((a, i) => `<button class="btn ${a.kind || ""}" data-act="${i}">${a.label}</button>`).join("")}</div>` : ""}
    </div>`;
    const close = (v) => { back.remove(); document.removeEventListener("keydown", onKey); resolve(v); };
    const onKey = (e) => { if (e.key === "Escape") close(null); };
    back.addEventListener("click", async (e) => {
      if (e.target === back || e.target.closest("[data-close]")) return close(null);
      const b = e.target.closest("[data-act]");
      if (!b) return;
      const a = actions[+b.dataset.act];
      if (a.run) {
        b.disabled = true;
        try { const v = await a.run(back); if (v !== false) close(v ?? true); }
        catch (err) { F.toast(err.message || "Algo deu errado.", true); }
        finally { b.disabled = false; }
      } else close(a.value ?? true);
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(back);
    onMount && onMount(back, close);
    const first = back.querySelector("input, select, textarea, [data-act]");
    first && first.focus();
  });

  F.confirm = (title, text, label = "Confirmar", kind = "primary") =>
    F.modal({ title, body: `<p class="muted">${text}</p>`, actions: [{ label: "Cancelar", value: false }, { label, kind, value: true }] }).then(Boolean);

  /* fala sintetizada (pt-BR) */
  let voice = null;
  const pickVoice = () => {
    try {
      const vs = speechSynthesis.getVoices();
      voice = vs.find(v => /pt-BR/i.test(v.lang) && /female|luciana|francisca|google/i.test(v.name)) || vs.find(v => /pt-BR/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)) || null;
    } catch (e) { voice = null; }
  };
  try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
  F.canSpeak = () => { try { return "speechSynthesis" in window; } catch (e) { return false; } };
  /* voz de verdade (ElevenLabs, guardada no servidor). Busca em segundo plano;
     no toque toca na hora se já tiver chegado, senão usa a voz do navegador. */
  const vcache = new Map();
  const vkey = (t, slow) => (slow ? "s|" : "n|") + F.plain(t).toLowerCase().trim();
  F.prefetchVoice = (text, slow = false) => {
    const api = window.FALALA_API;
    if (!text || !api || api.mode !== "supabase" || !api.voice) return;
    const k = vkey(text, slow);
    if (vcache.has(k)) return;
    vcache.set(k, null);
    api.voice(F.plain(text), slow, F.homeToken).then(url => {
      vcache.set(k, url);
      try { const a = new Audio(); a.preload = "auto"; a.src = url; } catch (e) {}
    }).catch(() => vcache.delete(k));
  };
  let player = null;
  F.say = (text, slow = false) => {
    const url = vcache.get(vkey(text, slow));
    if (url) {
      try {
        try { speechSynthesis.cancel(); } catch (e) {}
        if (player) player.pause();
        player = new Audio(url);
        player.play().catch(() => F.sayBrowser(text, slow));
        return;
      } catch (e) { /* cai para a voz do navegador */ }
    }
    F.sayBrowser(text, slow);
    F.prefetchVoice(text, slow);
  };
  F.sayBrowser = (text, slow = false) => {
    if (!F.canSpeak()) { F.toast("Este navegador não tem leitura em voz alta. Leia a palavra para a criança."); return; }
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(F.plain(text));
      u.lang = "pt-BR";
      if (voice) u.voice = voice;
      u.rate = slow ? 0.55 : 0.85;
      u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) { F.toast("Não foi possível tocar o áudio agora.", true); }
  };

  /* sons do modo criança, gerados na hora (sem arquivos) */
  let actx = null;
  F.soundOn = () => { try { return localStorage.getItem("falala-sound") !== "off"; } catch (e) { return true; } };
  F.setSound = (on) => { try { localStorage.setItem("falala-sound", on ? "on" : "off"); } catch (e) {} };
  F.sfx = (kind) => {
    if (!F.soundOn()) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      const now = actx.currentTime;
      const tone = (freq, start, dur, type = "sine", vol = 0.18) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, now + start);
        g.gain.setValueAtTime(0.0001, now + start);
        g.gain.exponentialRampToValueAtTime(vol, now + start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
        o.connect(g).connect(actx.destination);
        o.start(now + start); o.stop(now + start + dur + 0.05);
      };
      const seq = {
        ok: () => { tone(784, 0, 0.18); tone(1175, 0.1, 0.3); },
        help: () => { tone(659, 0, 0.22, "triangle", 0.14); },
        miss: () => { tone(392, 0, 0.18, "triangle", 0.1); tone(349, 0.12, 0.25, "triangle", 0.08); },
        tick: () => { tone(988, 0, 0.08, "square", 0.05); },
        undo: () => { tone(523, 0, 0.1, "triangle", 0.08); tone(440, 0.08, 0.12, "triangle", 0.08); },
        finish: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.32)); tone(1319, 0.5, 0.6, "sine", 0.14); }
      }[kind];
      seq && seq();
    } catch (e) { /* áudio indisponível: segue sem som */ }
  };

  /* confete */
  F.burst = () => {
    const b = document.createElement("div");
    b.className = "burst";
    const colors = ["#FF6A3D", "#FFC93C", "#1F8A70", "#5B4FC4", "#7FB8E6"];
    b.innerHTML = Array.from({ length: 26 }, (_, i) => {
      const a = (i / 26) * Math.PI * 2, r = 160 + Math.random() * 160;
      return `<i style="background:${colors[i % 5]};--x:${Math.cos(a) * r}px;--y:${Math.sin(a) * r}px;--r:${Math.random() * 540}deg"></i>`;
    }).join("");
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1000);
  };

  /* gravação de voz (MediaRecorder) */
  F.canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  F.recMime = () => {
    const opts = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
    try { return opts.find(t => MediaRecorder.isTypeSupported(t)) || ""; } catch (e) { return ""; }
  };

  F.copy = async (text) => {
    try { await navigator.clipboard.writeText(text); F.toast("Copiado!"); }
    catch (e) { F.toast("Não deu para copiar automaticamente. Selecione e copie manualmente.", true); }
  };
})(window.F);
