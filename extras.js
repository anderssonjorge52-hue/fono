/* Falalá — biblioteca com listas próprias, montar sessão, tarefa de casa, gravações,
   relatório para os pais e página da família. */
(function (F) {
  const api = window.FALALA_API;
  const CFG = window.FALALA_CONFIG || {};
  const C = window.FALALA_CONTENT;
  const { esc, icon } = F;
  const DAY = 86400000;

  /* índice de figuras do conteúdo, para as listas da fono ganharem desenho sozinhas */
  const picIndex = (() => {
    const m = new Map();
    C.tracks.forEach(t => t.exercises.forEach(e => (e.items || []).forEach(it => {
      if (it.pic && it.w) m.set(F.plain(it.w).replace(/-/g, "").toLowerCase(), it.pic);
    })));
    return m;
  })();

  /* ---------- itens de exercício (biblioteca) ---------- */
  function itemsHTML(e) {
    if (e.type === "praxis") return `<div class="row"><div style="width:120px">${F.mouth(e.pose)}</div></div>`;
    if (e.type === "pairs") return `<div class="words">${e.items.map(it => ["a", "b"].map(k => `<button class="word" data-action="say" data-text="${esc(F.plain(it[k]))}">${icon("sound")}<span>${F.markHTML(it[k])}</span></button>`).join("")).join("")}</div>`;
    if (e.type === "rhyme") return `<div class="words">${e.items.map(it => `<span class="word">${it.rima ? icon("check") : icon("x")}<span>${esc(it.a)} / ${esc(it.b)}</span></span>`).join("")}</div>`;
    if (e.type === "clap") return `<div class="words">${e.items.map(it => `<button class="word" data-action="say" data-text="${esc(it.w.replace(/-/g, ""))}"><span class="p">${F.pic(it.pic)}</span><span>${esc(it.w.replace(/-/g, "·"))}</span></button>`).join("")}</div>`;
    return `<div class="words">${e.items.map(it => `<button class="word" data-action="say" data-text="${esc(F.plain(it.w))}">${it.pic ? `<span class="p">${F.pic(it.pic)}</span>` : icon("sound")}<span>${F.markHTML(it.w)}</span></button>`).join("")}</div>`;
  }

  function exCard(e) {
    return `<div class="card ex">
      <div class="ex-head"><div><h3>${esc(e.title)} ${e.custom ? '<span class="chip r">Minha lista</span>' : ""}</h3><p class="muted small" style="margin-top:4px">${esc(e.kid)}</p></div>
        <div class="row" style="gap:8px"><span class="chip">${F.itemLabel(e)}</span>
        ${e.custom ? `<button class="btn sm" data-action="edit-list" data-id="${e.rowId}">${icon("edit")}Editar</button><button class="btn sm ghost danger" data-action="delete-list" data-id="${e.rowId}" aria-label="Excluir lista">${icon("trash")}</button>` : ""}</div></div>
      ${e.custom ? "" : `<p class="tip"><b>Dica clínica:</b> ${esc(e.tip)}</p>`}
      ${itemsHTML(e)}
    </div>`;
  }

  /* ---------- biblioteca ---------- */
  F.views.biblioteca = (tid) => {
    try { localStorage.setItem("falala-saw-library", "1"); } catch (e) {}
    const t = tid && F.track(tid);
    const mine = F.customAll();
    if (!t) {
      return `<div class="page-head"><div><h1>Biblioteca</h1><p class="muted">Roteiros prontos, exercícios por trilha e as suas próprias listas.</p></div>
          <button class="btn primary" data-action="new-list">${icon("plus")}Nova lista</button></div>
        ${F.programsHTML()}
        <h2 style="margin-bottom:12px">Trilhas de exercícios</h2>
        <div class="grid tracks">${C.tracks.map(tr => {
          const ex = F.exercisesOf(tr.id);
          return `<a class="card track" href="#trilha-${tr.id}" style="background:${tr.color};text-decoration:none">
          <div><h2>${esc(tr.name)}</h2><p style="margin-top:8px">${esc(tr.summary)}</p></div>
          <span class="count">${ex.length} exercícios · ${ex.reduce((a, e) => a + F.itemCount(e), 0)} itens</span>
          <span class="big-letter" aria-hidden="true">${esc(tr.short)}</span></a>`;
        }).join("")}</div>
        <section style="margin-top:28px"><div class="row" style="justify-content:space-between;margin-bottom:12px"><h2>Minhas listas</h2><button class="btn sm" data-action="new-list">${icon("plus")}Nova lista</button></div>
          ${mine.length ? `<div class="grid">${mine.map(exCard).join("")}</div>`
            : `<div class="card empty">${F.mascot("happy")}<h3>Monte listas com as palavras dos seus pacientes</h3><p>Ex.: “Palavras com R do Pedro”. Elas aparecem na sessão e na tarefa de casa.</p><button class="btn primary" data-action="new-list">${icon("plus")}Criar minha primeira lista</button></div>`}
        </section>
        <p class="tiny" style="margin-top:18px">Conteúdo versão ${esc(C.version)}. Figuras: Noto Emoji (Google, licença OFL). Os exercícios são material de apoio e não substituem a avaliação e a conduta da fonoaudióloga responsável.</p>`;
    }
    const ex = F.exercisesOf(t.id);
    return `<a href="#biblioteca" class="btn ghost sm" style="margin-bottom:12px">${icon("left")}Biblioteca</a>
      <div class="page-head"><div><h1>${esc(t.name)}</h1><p class="muted">${esc(t.summary)}</p></div>
        <div class="row"><button class="btn" data-action="new-list" data-id="${t.id}">${icon("plus")}Nova lista</button>
        <a class="btn primary" href="#sessao" data-action="session-track" data-id="${t.id}">${icon("play")}Usar numa sessão</a></div></div>
      <div class="grid">${ex.map(exCard).join("")}</div>`;
  };

  /* ---------- formulário de lista própria ---------- */
  F.listForm = async (row = null, trackId = null) => {
    if (!row && !F.hasAccess()) return F.paywall();
    const toLines = (items) => (items || []).map(it => (it.pic ? it.pic + " " : "") + it.w).join("\n");
    const v = await F.modal({
      title: row ? "Editar lista" : "Nova lista",
      wide: true,
      body: `<form class="form" onsubmit="return false">
        <div class="field"><label for="ltitle">Nome da lista</label><input class="input" id="ltitle" maxlength="80" value="${esc(row?.title || "")}" placeholder="Ex.: Palavras com R do Pedro"></div>
        <div class="row" style="align-items:flex-start">
          <div class="field grow"><label for="ltrack">Trilha</label><select class="input" id="ltrack">${C.tracks.map(t => `<option value="${t.id}" ${(row?.track || trackId || "r") === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div>
          <div class="field grow"><label for="ltype">Tipo</label><select class="input" id="ltype"><option value="words" ${row?.type !== "phrases" ? "selected" : ""}>Palavras</option><option value="phrases" ${row?.type === "phrases" ? "selected" : ""}>Frases</option></select></div>
        </div>
        <div class="field"><label for="litems">Uma por linha</label><textarea class="input" id="litems" style="min-height:200px" placeholder="ca[rr]o&#10;bor[r]acha&#10;🐸 sapo">${esc(toLines(row?.items))}</textarea>
          <span class="tiny">Coloque o som-alvo entre colchetes para destacar: ca[rr]o. As figuras entram sozinhas quando a palavra existe na biblioteca; para escolher outra, comece a linha com um emoji.</span></div>
        <div class="err" id="lerr"></div>
      </form>`,
      actions: [{ label: "Cancelar", value: null }, {
        label: row ? "Salvar lista" : "Criar lista", kind: "primary", run: async (root) => {
          const title = F.$("#ltitle", root).value.trim();
          const err = F.$("#lerr", root);
          if (!title) { err.textContent = "Dê um nome para a lista."; return false; }
          const lines = F.$("#litems", root).value.split("\n").map(l => l.trim()).filter(Boolean).slice(0, 60);
          if (!lines.length) { err.textContent = "Escreva pelo menos uma palavra."; return false; }
          const items = lines.map(l => {
            const m = l.match(/^(\p{Extended_Pictographic}[️‍\p{Extended_Pictographic}]*)\s*(.+)$/u);
            const w = (m ? m[2] : l).slice(0, 120);
            const pic = m ? m[1] : picIndex.get(F.plain(w).toLowerCase()) || null;
            return pic ? { w, pic } : { w };
          });
          const data = { title, track: F.$("#ltrack", root).value, type: F.$("#ltype", root).value, items };
          return row ? api.custom.update(row.id, data) : api.custom.create(data);
        }
      }]
    });
    if (v) { await F.reload(); F.toast(row ? "Lista atualizada." : "Lista criada!"); F.render(); }
  };

  /* ---------- montar sessão ---------- */
  F.views.sessao = () => {
    const pts = F.activePatients();
    const sel = F.ui.setup || (F.ui.setup = { patient: null, track: null, ex: new Set(), shuffle: false });
    sel.mode = sel.mode || "program";
    if (sel.patient && !F.patientById(sel.patient)) sel.patient = null;
    const p = sel.patient && F.patientById(sel.patient);
    if (p && !sel.track) sel.track = (p.focus && p.focus[0]) || C.tracks[0].id;
    const t = sel.track && F.track(sel.track);
    const exs = t ? F.exercisesOf(t.id) : [];
    let count = exs.filter(e => sel.ex.has(e.id)).reduce((a, e) => a + F.itemCount(e), 0);
    if (sel.mode === "program") {
      if (!sel.program && p) { const m = (C.programs || []).find(x => (p.focus || []).includes(x.track)); sel.program = m ? m.id : null; sel.programN = null; }
      const prog = sel.program && F.program(sel.program);
      if (prog && sel.programN) count = F.sessionFacts(prog.sessions[sel.programN - 1]).items;
      else if (prog && p) count = F.sessionFacts(prog.sessions[F.programNext(p.id, prog) - 1]).items;
      else count = 0;
    }
    if (!pts.length) return `<div class="page-head"><h1>Nova sessão</h1></div><div class="card empty">${F.mascot("wow")}<h3>Cadastre um paciente primeiro</h3><button class="btn primary" data-action="new-patient">${icon("plus")}Cadastrar paciente</button></div>`;
    return `<div class="page-head"><div><h1>Nova sessão</h1><p class="muted">Monte em três toques. Depois é só entregar o tablet para a criança.</p></div></div>
      <div class="setup">
        <section class="setup-step"><h2><span class="n">1</span>Paciente</h2>
          <div class="pick-grid">${pts.map(x => `<button class="pick" data-action="pick-patient" data-id="${x.id}" aria-pressed="${sel.patient === x.id}"><span class="av-kid">${F.avatar(x.avatar)}</span><span>${esc(x.name)}<br><span class="tiny">${x.age ? x.age + " anos" : ""}</span></span></button>`).join("")}</div>
        </section>
        <div class="seg" role="group" aria-label="Como montar">
          <button data-action="setup-mode" data-id="program" aria-pressed="${sel.mode === "program"}">${icon("book")}Roteiro pronto</button>
          <button data-action="setup-mode" data-id="free" aria-pressed="${sel.mode === "free"}">${icon("edit")}Escolher exercícios</button>
        </div>
        ${sel.mode === "program" ? F.setupProgramHTML(sel, p) : `
        <section class="setup-step" ${p ? "" : 'style="opacity:.45;pointer-events:none"'}><h2><span class="n">2</span>Trilha</h2>
          <div class="seg">${C.tracks.map(tr => `<button data-action="pick-track" data-id="${tr.id}" aria-pressed="${sel.track === tr.id}">${esc(tr.name)}</button>`).join("")}</div>
        </section>
        <section class="setup-step" ${p && t ? "" : 'style="opacity:.45;pointer-events:none"'}><h2><span class="n">3</span>Exercícios</h2>
          ${t ? `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px">${exs.map(e => `<label class="check"><input type="checkbox" data-ex="${e.id}" ${sel.ex.has(e.id) ? "checked" : ""}><span><b>${esc(e.title)}</b>${e.custom ? ' <span class="chip r">Minha lista</span>' : ""}<br><span class="tiny">${F.itemLabel(e)}</span></span></label>`).join("")}</div>
          <div class="row"><button class="btn sm" data-action="select-all">Selecionar todos</button><label class="row small" style="gap:8px"><input type="checkbox" id="shuffle" ${sel.shuffle ? "checked" : ""} style="width:18px;height:18px;accent-color:var(--brand)">${icon("shuffle")}Embaralhar a ordem</label></div>` : ""}
        </section>`}
        <div class="sticky-go"><span class="muted">${count ? `${count} ${count === 1 ? "item" : "itens"} na sessão` : "Escolha pelo menos um exercício"}</span>
          <button class="btn primary big" data-action="start-session" ${count && p ? "" : "disabled"}>${icon("play")}Começar com ${p ? esc(p.name) : "a criança"}</button></div>
      </div>`;
  };

  /* ---------- tarefa de casa (lado da fono) ---------- */
  F.homeLink = (token) => {
    const base = CFG.appUrl || (location.origin + location.pathname);
    return `${base}#casa-${token}`;
  };
  const weekStart = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d; };
  const WEEK = ["S", "T", "Q", "Q", "S", "S", "D"];
  function weekDots(practices) {
    const ws = weekStart();
    const done = new Set(practices.filter(h => new Date(h.created_at) >= ws).map(h => (new Date(h.created_at).getDay() + 6) % 7));
    const today = (new Date().getDay() + 6) % 7;
    return `<div class="week">${WEEK.map((d, i) => `<span class="${done.has(i) ? "on" : ""} ${i === today ? "today" : ""}" title="${done.has(i) ? "Treinou" : "Sem treino"}">${done.has(i) ? icon("check") : d}</span>`).join("")}</div>`;
  }
  F.weekCount = (practices) => { const ws = weekStart(); return new Set(practices.filter(h => new Date(h.created_at) >= ws).map(h => new Date(h.created_at).toDateString())).size; };

  F.homeCardHTML = (p) => {
    const plan = F.S.plans.find(x => x.patient_id === p.id && x.active);
    const prs = F.S.practices.filter(h => h.patient_id === p.id);
    if (!plan) {
      return `<div class="card home-card" style="margin-top:16px"><div class="row" style="justify-content:space-between"><div><h3>Tarefa de casa</h3><p class="muted small" style="margin-top:4px">Mande um link pelo WhatsApp. A criança treina 5 minutos em casa e você vê quem fez.</p></div>
        <button class="btn primary" data-action="home-new" data-id="${p.id}">${icon("link")}Criar tarefa de casa</button></div>
        ${prs.length ? `<p class="tiny" style="margin-top:10px">${prs.length} treinos em casa registrados em tarefas anteriores.</p>` : ""}</div>`;
    }
    const link = F.homeLink(plan.token);
    const planPrs = prs.filter(h => h.plan_id === plan.id);
    const wk = F.weekCount(planPrs);
    const exNames = plan.exercise_ids.map(id => F.exercise(id)?.title).filter(Boolean);
    return `<div class="card home-card" style="margin-top:16px">
      <div class="row" style="justify-content:space-between;align-items:flex-start"><div><h3>Tarefa de casa</h3><p class="muted small" style="margin-top:4px">${esc(exNames.join(", "))}</p></div>
        <div class="row" style="gap:8px"><button class="btn sm" data-action="home-edit" data-id="${p.id}">${icon("edit")}Trocar exercícios</button><button class="btn sm ghost danger" data-action="home-stop" data-id="${plan.id}">Encerrar</button></div></div>
      <div class="home-grid">
        <div><div class="tiny" style="margin-bottom:6px">Esta semana: <b>${wk} de ${plan.days_per_week}</b> dias</div>${weekDots(planPrs)}</div>
        <div class="linkbox"><input class="input" readonly value="${esc(link)}" aria-label="Link da tarefa" onclick="this.select()">
          <div class="row" style="gap:8px"><button class="btn sm" data-action="home-copy" data-id="${plan.token}">${icon("copy")}Copiar link</button>
          <a class="btn sm primary" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(homeMessage(p, plan, link))}">${icon("whats")}Enviar no WhatsApp</a></div></div>
      </div>
      ${planPrs.length ? `<div class="list" style="margin-top:10px">${planPrs.slice(0, 5).map(h => `<div class="li"><span class="av-kid">${icon("home")}</span><span><span class="t">Treino em casa</span><br><span class="tiny">${F.dateTime(h.created_at)} · ${Math.max(1, Math.round((h.duration_sec || 0) / 60))} min${(h.results || []).some(r => r.audio) ? ` · ${icon("mic")} gravações` : ""}</span></span><span class="meta">${F.pct(h)}%<br>${h.correct}/${h.total} certas</span></div>`).join("")}</div>`
        : `<p class="tiny" style="margin-top:12px">Nenhum treino em casa ainda. Assim que a família fizer, aparece aqui.</p>`}
    </div>`;
  };

  function homeMessage(p, plan, link) {
    const fono = F.firstName(F.S.profile?.full_name) || "sua fono";
    return `Olá! Aqui é a ${fono}. Preparei a tarefa de casa do(a) ${p.name}: são uns 5 minutinhos de jogo, ${plan.days_per_week} vezes por semana.${plan.message ? "\n\n" + plan.message : ""}\n\nÉ só abrir: ${link}`;
  }

  F.homeForm = async (pid, preset = null) => {
    if (!F.hasAccess()) return F.paywall();
    const p = F.patientById(pid);
    const old = F.S.plans.find(x => x.patient_id === pid && x.active);
    let track = preset?.track || old?.track || (p.focus && p.focus[0]) || "r";
    const chosen = new Set(preset?.ids || old?.exercise_ids || []);
    const exList = () => {
      const own = F.exercisesOf(track);
      const extra = [...chosen].map(F.exercise).filter(e => e && !own.some(o => o.id === e.id));
      return extra.concat(own);
    };
    const body = () => `<form class="form" onsubmit="return false">
        <div class="field"><label>Trilha</label><div class="seg" id="htrack">${C.tracks.map(t => `<button type="button" data-ht="${t.id}" aria-pressed="${t.id === track}">${esc(t.name)}</button>`).join("")}</div></div>
        <div class="field"><label>Exercícios para casa</label><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px" id="hex">${exList().map(e => `<label class="check"><input type="checkbox" value="${e.id}" ${chosen.has(e.id) ? "checked" : ""}><span><b>${esc(e.title)}</b><br><span class="tiny">${F.itemLabel(e)}</span></span></label>`).join("")}</div>
          <span class="tiny">Dica: 2 ou 3 exercícios dão uns 5 minutos.</span></div>
        <div class="row" style="align-items:flex-start">
          <div class="field" style="width:170px"><label for="hdays">Dias por semana</label><select class="input" id="hdays">${[1, 2, 3, 4, 5, 6, 7].map(n => `<option ${n === (old?.days_per_week || 5) ? "selected" : ""}>${n}</option>`).join("")}</select></div>
          <div class="field grow"><label for="hmsg">Recado para a família (opcional)</label><input class="input" id="hmsg" maxlength="500" value="${esc(old?.message || "")}" placeholder="Ex.: Faça antes do banho, sem pressa."></div>
        </div>
        <label class="check"><input type="checkbox" id="hrec" ${old ? (old.record_audio ? "checked" : "") : "checked"}><span><b>Pedir gravação da voz</b><br><span class="tiny">O responsável grava a criança falando e você ouve depois.</span></span></label>
        <label class="check"><input type="checkbox" id="hprog" ${old ? (old.show_progress ? "checked" : "") : "checked"}><span><b>Mostrar a evolução para a família</b><br><span class="tiny">Estrelas e palavras que a criança já domina, na página do link.</span></span></label>
        <div class="err" id="herr"></div>
      </form>`;
    const v = await F.modal({
      title: `Tarefa de casa de ${p.name}`,
      wide: true,
      body: body(),
      onMount(root) {
        root.addEventListener("click", (e) => {
          const b = e.target.closest("[data-ht]");
          if (!b) return;
          F.$$("#hex input:checked", root).forEach(i => chosen.add(i.value));
          track = b.dataset.ht;
          F.$(".modal-body", root).innerHTML = body();
        });
        root.addEventListener("change", (e) => { if (e.target.closest("#hex")) e.target.checked ? chosen.add(e.target.value) : chosen.delete(e.target.value); });
      },
      actions: [{ label: "Cancelar", value: null }, {
        label: old ? "Salvar e gerar novo link" : "Criar link", kind: "primary", run: async (root) => {
          F.$$("#hex input", root).forEach(i => i.checked ? chosen.add(i.value) : chosen.delete(i.value));
          const ids = [...chosen].filter(id => F.exercise(id));
          if (!ids.length) { F.$("#herr", root).textContent = "Escolha pelo menos um exercício."; return false; }
          return api.home.create({
            patient_id: pid, track, exercise_ids: ids, days_per_week: parseInt(F.$("#hdays", root).value, 10),
            message: F.$("#hmsg", root).value.trim() || null, record_audio: F.$("#hrec", root).checked, show_progress: F.$("#hprog", root).checked
          });
        }
      }]
    });
    if (v) { await F.reload(); F.toast("Tarefa criada! Agora é só mandar o link."); F.render(); }
  };

  /* ---------- gravações (antes e depois) ---------- */
  function recordingsOf(pid) {
    const rows = [];
    F.sessionsOf(pid).forEach(s => (s.results || []).forEach(r => r && r.audio && rows.push({ item: r.item, audio: r.audio, at: s.started_at, where: "Sessão", r: r.r })));
    F.S.practices.filter(h => h.patient_id === pid).forEach(h => (h.results || []).forEach(r => r && r.audio && rows.push({ item: r.item, audio: r.audio, at: h.created_at, where: "Casa", r: r.r })));
    const by = new Map();
    rows.sort((a, b) => a.at.localeCompare(b.at)).forEach(x => { const k = x.item.toLowerCase(); if (!by.has(k)) by.set(k, []); by.get(k).push(x); });
    return [...by.values()];
  }
  const resLabel = { ok: "certo", help: "com ajuda", miss: "ainda não" };
  F.recordingsHTML = (p) => {
    const groups = recordingsOf(p.id);
    if (!groups.length) return `<div class="card" style="margin-top:16px"><h3>Gravações</h3><p class="muted small" style="margin-top:6px">Toque em <b>Gravar</b> no modo criança (ou peça na tarefa de casa) para comparar o antes e depois da fala.</p></div>`;
    const play = (x, label) => `<button class="btn sm rec-play" data-action="play-audio" data-path="${esc(x.audio)}">${icon("play")}${label}<span class="tiny">${F.day(x.at)} · ${x.where} · ${resLabel[x.r] || ""}</span></button>`;
    const multi = groups.filter(g => g.length >= 2).sort((a, b) => b.length - a.length);
    const single = groups.filter(g => g.length === 1);
    return `<div class="card" style="margin-top:16px"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h3>Gravações · antes e depois</h3><span class="tiny">${groups.reduce((a, g) => a + g.length, 0)} gravações</span></div>
      <div class="recs">${multi.concat(single).slice(0, 12).map(g => `<div class="rec-row"><b class="w">${esc(g[0].item)}</b><div class="row" style="gap:8px">${play(g[0], g.length > 1 ? "Antes" : "Ouvir")}${g.length > 1 ? play(g[g.length - 1], "Agora") : ""}</div></div>`).join("")}</div>
    </div>`;
  };
  let currentAudio = null;
  F.playAudio = async (path) => {
    try {
      const url = await api.audio.url(path);
      if (!url) return F.toast("Esta gravação não está mais disponível neste navegador.", true);
      if (currentAudio) currentAudio.pause();
      currentAudio = new Audio(url);
      await currentAudio.play();
    } catch (e) { F.toast("Não foi possível tocar a gravação.", true); }
  };

  /* ---------- relatório para os pais ---------- */
  function masteredAndTraining(list) {
    const map = new Map();
    list.forEach(s => (s.results || []).forEach(r => {
      if (!r || !r.item || r.r === "skip") return;
      const m = map.get(r.item) || { item: r.item, n: 0, ok: 0, help: 0 };
      m.n++; if (r.r === "ok") m.ok++; if (r.r === "help") m.help++;
      map.set(r.item, m);
    }));
    const rows = [...map.values()].map(m => ({ ...m, score: Math.round(((m.ok + m.help * 0.5) / m.n) * 100) }));
    return {
      mastered: rows.filter(m => m.n >= 2 && m.score >= 80).sort((a, b) => b.score - a.score).slice(0, 12),
      training: rows.filter(m => m.score < 70).sort((a, b) => a.score - b.score).slice(0, 8)
    };
  }

  F.views.relatorio = (pid) => {
    const p = F.patientById(pid);
    if (!p) return `<div class="card empty"><h3>Paciente não encontrado</h3><a class="btn" href="#pacientes">Voltar</a></div>`;
    const ss = F.sessionsOf(pid);
    const prs = F.S.practices.filter(h => h.patient_id === pid);
    const all = ss.concat(prs);
    const first = ss[ss.length - 1], last = ss[0];
    const { mastered, training } = masteredAndTraining(all);
    const plan = F.S.plans.find(x => x.patient_id === pid && x.active);
    const since = first ? F.day(first.started_at) : null;
    const stars = ss.reduce((a, s) => a + (s.stars || 0), 0);
    const pr = F.S.profile || {};
    const tracks = [...new Set(ss.map(s => s.track))].map(F.track).filter(Boolean);
    return `<div class="report-bar no-print"><a href="#paciente-${p.id}" class="btn ghost sm">${icon("left")}${esc(p.name)}</a>
        <div class="row" style="gap:8px">${plan ? `<button class="btn sm" data-action="home-copy" data-id="${plan.token}">${icon("link")}Copiar link da família</button>` : ""}<button class="btn sm primary" data-action="print">${icon("file")}Imprimir ou salvar PDF</button></div></div>
      <article class="report">
        <header class="rep-head"><div>${F.logo("#painel")}<p class="tiny" style="margin-top:6px">Relatório de evolução da fala</p></div>
          <div class="rep-who"><span class="av-kid">${F.avatar(p.avatar)}</span><div><h1>${esc(p.name)}</h1><p class="muted">${p.age ? `${p.age} anos · ` : ""}${since ? `acompanhamento desde ${since}` : "início do acompanhamento"}</p></div></div></header>
        <section class="rep-kpis">
          <div><b>${ss.length}</b><span>sessões</span></div>
          <div><b>${prs.length}</b><span>treinos em casa</span></div>
          <div><b>${last ? F.pct(last) + "%" : "–"}</b><span>acerto na última sessão</span></div>
          <div><b>${stars}</b><span>estrelas conquistadas</span></div>
        </section>
        ${ss.length >= 2 ? `<section><h2>Evolução</h2><p class="muted small">Porcentagem de acerto em cada sessão. De ${F.pct(first)}% na primeira para ${F.pct(last)}% na mais recente.</p><div class="fig" id="evo" data-pid="${p.id}"></div></section>` : ""}
        <section class="rep-two">
          <div><h2>${icon("star")}Já domina</h2>${mastered.length ? `<div class="words">${mastered.map(m => `<span class="word ok">${esc(m.item)}</span>`).join("")}</div>` : `<p class="muted small">Aparece conforme as palavras forem acertadas em mais de uma sessão.</p>`}</div>
          <div><h2>${icon("target")}Estamos treinando</h2>${training.length ? `<div class="words">${training.map(m => `<span class="word">${esc(m.item)}</span>`).join("")}</div>` : `<p class="muted small">Nenhuma palavra com dificuldade marcada.</p>`}</div>
        </section>
        ${tracks.length ? `<section><h2>O que trabalhamos</h2><div class="row" style="gap:6px">${tracks.map(t => F.chip(t.id)).join("")}</div></section>` : ""}
        <section><h2>Recado da fono</h2><textarea class="input rep-note" id="repnote" placeholder="Escreva aqui um recado para a família antes de imprimir (opcional).">${esc(F.ui["note-" + pid] || "")}</textarea></section>
        <footer class="rep-foot"><span>${esc(pr.full_name || "")}${pr.crfa ? ` · CRFa ${esc(pr.crfa)}` : ""}${pr.clinic ? ` · ${esc(pr.clinic)}` : ""}</span><span>Emitido em ${F.dateTime(new Date().toISOString())}</span></footer>
      </article>`;
  };

  /* ---------- página da família (link público) ---------- */
  F.renderCasa = async (token) => {
    const app = document.getElementById("root");
    app.innerHTML = `<div class="loading"><div class="spin"></div><span>Abrindo a tarefa…</span></div>`;
    document.title = "Falalá · Tarefa de casa";
    let d;
    try { d = await api.home.get(token); } catch (e) { d = null; }
    if (!d) {
      app.innerHTML = `<div class="casa"><div class="casa-wrap"><div class="card empty">${F.mascot("wow")}<h2>Este link não está ativo</h2><p>A tarefa pode ter sido trocada pela fono. Peça um novo link a ela.</p></div></div></div>`;
      return;
    }
    F.homeToken = token;
    F.homeCustom = d.custom || [];
    const P = d.patient, plan = d.plan;
    const exs = plan.exercise_ids.map(id => F.exercise(id)).filter(Boolean);
    const items = exs.reduce((a, e) => a + F.itemCount(e), 0);
    const prs = d.practices || [];
    const wk = F.weekCount(prs);
    const track = F.track(plan.track) || C.tracks[0];
    let progress = "";
    if (plan.show_progress) {
      const ss = d.sessions || [];
      const { mastered } = masteredAndTraining(ss);
      const stars = ss.reduce((a, s) => a + (s.stars || 0), 0);
      progress = `<section class="card"><h2>Como ${esc(P.name)} está indo</h2>
        <div class="rep-kpis" style="margin-top:12px"><div><b>${ss.length}</b><span>sessões com a fono</span></div><div><b>${prs.length}</b><span>treinos em casa</span></div><div><b>${stars}</b><span>estrelas</span></div></div>
        ${mastered.length ? `<h3 style="margin-top:16px">${icon("star")}Palavras que já domina</h3><div class="words" style="margin-top:8px">${mastered.map(m => `<span class="word ok">${esc(m.item)}</span>`).join("")}</div>` : ""}
      </section>`;
    }
    app.innerHTML = `<div class="casa" style="--track:${track.color}">
      <header class="casa-top">${F.logo("#casa-" + token)}<span class="tiny">Tarefa de casa</span></header>
      <div class="casa-wrap">
        <section class="casa-hero card">
          <span class="av-kid big">${F.avatar(P.avatar)}</span>
          <div><h1>Oi, ${esc(P.name)}!</h1><p class="muted">${d.fono?.name ? `Sua tarefa foi preparada por ${esc(d.fono.name)}.` : "Sua tarefa está pronta."}</p></div>
          ${plan.message ? `<p class="casa-msg">“${esc(plan.message)}”</p>` : ""}
          <div class="casa-week"><div class="tiny">Esta semana: <b>${wk} de ${plan.days_per_week}</b> dias</div>${weekDots(prs)}</div>
          ${d.access ? `<button class="btn primary big" data-action="casa-start">${icon("play")}Começar o treino de hoje</button><span class="tiny">${exs.length} ${exs.length === 1 ? "exercício" : "exercícios"} · ${items} itens · uns ${Math.max(3, Math.round(items * 0.35))} minutos</span>`
            : `<div class="notice warn">A tarefa está pausada no momento. Fale com a fono.</div>`}
        </section>
        <section class="card"><h2>Como fazer</h2><ol class="howto">
          <li>Sente com a criança num lugar calmo e ligue o som do celular.</li>
          <li>Toque em <b>Ouvir</b>, deixe a criança repetir e marque como foi: <b>Falou certinho</b>, <b>Com ajuda</b> ou <b>Ainda não</b>.</li>
          ${plan.record_audio ? `<li>Quando aparecer <b>Gravar</b>, grave a criança falando. A fono vai ouvir.</li>` : ""}
          <li>No final, toque em <b>Enviar para a fono</b>. Pronto!</li>
        </ol><p class="tiny">Errar faz parte. Elogie o esforço, não só o acerto.</p></section>
        ${progress}
        <footer class="casa-foot">Feito com <b>Falalá</b>, exercícios de fala em formato de jogo.${CFG.appUrl ? ` <a href="${esc(CFG.appUrl)}">Você é fono? Conheça</a>` : ""}</footer>
      </div></div>`;
    F._casa = { token, d, exs };
  };

  F.startCasa = () => {
    const c = F._casa;
    if (!c) return;
    F.startSession({
      mode: "home", patient: c.d.patient, track: c.d.plan.track, exIds: c.exs.map(e => e.id), shuffle: false,
      token: c.token, recordAudio: c.d.plan.record_audio, onDone: () => F.renderCasa(c.token)
    });
  };
})(window.F);

/* ================= Roteiros de sessão ================= */
(function (F) {
  const C = window.FALALA_CONTENT;
  const { esc, icon } = F;

  F.program = (id) => (C.programs || []).find(p => p.id === id);
  const TYPE = { breath: "Respiração", praxis: "Movimento de boca", words: "Palavras", phrases: "Frases", pairs: "Escuta", twister: "Trava-línguas", clap: "Sílabas", rhyme: "Rimas" };
  F.typeLabel = (e) => TYPE[e.type] || "Exercício";

  /* tempo estimado de cada exercício, em segundos */
  F.estSecs = (e) => {
    const n = F.itemCount(e);
    switch (e.type) {
      case "breath": return e.reps * (e.inhale + (e.hold || 0) + e.exhale + 1.5);
      case "praxis": return e.reps * (3 + (e.hold || 0)) + 20;
      case "words": return n * 22;
      case "phrases": return n * 35;
      case "pairs": return n * 20;
      case "twister": return n * 50;
      case "clap": return n * 18;
      case "rhyme": return n * 15;
      default: return 60;
    }
  };
  F.estMinutes = (ids) => Math.max(3, Math.round(ids.map(F.exercise).filter(Boolean).reduce((a, e) => a + F.estSecs(e), 0) / 60));
  F.sessionFacts = (s) => {
    const exs = s.blocks.map(F.exercise).filter(Boolean);
    return {
      exs, minutes: F.estMinutes(s.blocks),
      breath: exs.some(e => e.type === "breath"),
      twister: exs.some(e => e.type === "twister"),
      motor: exs.some(e => e.type === "praxis"),
      items: exs.reduce((a, e) => a + F.itemCount(e), 0)
    };
  };
  const yesNo = (v, label) => `<span class="chip ${v ? "s" : ""}">${v ? icon("check") : icon("x")}${label}</span>`;

  /* o que este paciente já fez de cada roteiro */
  F.programDone = (pid, progId) => new Set(F.sessionsOf(pid).filter(s => s.program_id === progId && s.program_session).map(s => s.program_session));
  F.programNext = (pid, prog) => {
    const done = F.programDone(pid, prog.id);
    for (let i = 1; i <= prog.sessions.length; i++) if (!done.has(i)) return i;
    return prog.sessions.length;
  };

  function blockRow(e, i) {
    const t = e.track || F.track(e.trackId);
    const long = e.type === "phrases" || e.type === "twister";
    const preview = e.items ? e.items.slice(0, long ? 3 : 6).map(it => F.plain(it.w || `${it.a}/${it.b}`).replace(/-/g, "")).join(long ? " · " : ", ") + (e.items.length > (long ? 3 : 6) ? " …" : "") : "";
    return `<li class="blk"><span class="n">${i + 1}</span><div class="grow">
      <div class="row" style="gap:8px"><b>${esc(e.title)}</b><span class="chip ${t ? t.id : ""}">${esc(F.typeLabel(e))}</span><span class="tiny">${F.itemLabel(e)} · ~${Math.max(1, Math.round(F.estSecs(e) / 60))} min</span></div>
      ${preview ? `<p class="small muted" style="margin-top:4px">${esc(preview)}</p>` : ""}
      ${e.type === "breath" ? `<p class="small muted" style="margin-top:4px">Inspira ${e.inhale}s${e.hold ? `, segura ${e.hold}s` : ""}, solta ${e.exhale}s</p>` : ""}
      <p class="tiny" style="margin-top:4px">${esc(e.tip || "")}</p></div></li>`;
  }

  F.sessionCardHTML = (prog, s, idx, opts = {}) => {
    const f = F.sessionFacts(s);
    const homeNames = (s.home || []).map(id => F.exercise(id)?.title).filter(Boolean);
    return `<article class="card sess ${opts.done ? "done" : ""} ${opts.next ? "next" : ""}" id="sessao-${idx + 1}">
      <header class="sess-head"><div><span class="sess-n">Sessão ${idx + 1}${opts.done ? ` · ${icon("check")} feita` : opts.next ? " · próxima" : ""}</span><h3>${esc(s.title)}</h3><p class="muted small">${esc(s.goal)}</p></div>
        ${opts.action || ""}</header>
      <div class="row facts" style="gap:6px">
        <span class="chip">${icon("clock")}~${f.minutes} min</span><span class="chip">${f.exs.length} exercícios · ${f.items} itens</span>
        ${yesNo(f.breath, "Respiração")}${yesNo(f.motor, "Movimentos de boca")}${yesNo(f.twister, "Trava-línguas")}
      </div>
      <ol class="blocks">${f.exs.map(blockRow).join("")}</ol>
      <div class="sess-foot">
        <div><b class="small">Materiais</b><p class="small muted">${s.materials && s.materials.length ? esc(s.materials.join(", ")) : "Só o tablet ou celular."}</p></div>
        <div><b class="small">Tarefa de casa sugerida</b><p class="small muted">${homeNames.length ? esc(homeNames.join(", ")) : "–"}</p></div>
      </div>
    </article>`;
  };

  F.programsHTML = () => `<section style="margin-bottom:28px"><div class="row" style="justify-content:space-between;margin-bottom:12px"><div><h2>Roteiros de sessão</h2><p class="muted small" style="margin-top:4px">Programas prontos: cada sessão já vem com todos os exercícios, na ordem.</p></div></div>
    <div class="grid progs">${C.programs.map(p => {
      const t = F.track(p.track);
      const tw = p.sessions.filter(s => F.sessionFacts(s).twister).length;
      return `<a class="card prog" href="#roteiro-${p.id}" style="--c:${t.color};--s:${t.soft}">
        <span class="prog-bar"></span><h3>${esc(p.title)}</h3><p class="small muted">${esc(p.for)}</p>
        <div class="row" style="gap:6px;margin-top:auto"><span class="chip">${p.sessions.length} sessões</span><span class="chip">~${Math.round(p.sessions.reduce((a, s) => a + F.sessionFacts(s).minutes, 0) / p.sessions.length)} min cada</span>${tw ? `<span class="chip">${tw} com trava-línguas</span>` : ""}</div></a>`;
    }).join("")}</div></section>`;

  F.views.roteiro = (id) => {
    const p = F.program(id);
    if (!p) return `<div class="card empty"><h3>Roteiro não encontrado</h3><a class="btn" href="#biblioteca">Voltar</a></div>`;
    const t = F.track(p.track);
    return `<a href="#biblioteca" class="btn ghost sm" style="margin-bottom:12px">${icon("left")}Biblioteca</a>
      <div class="page-head"><div><span class="chip ${t.id}">${esc(t.name)}</span><h1 style="margin-top:8px">${esc(p.title)}</h1><p class="muted">${esc(p.for)} · ${p.sessions.length} sessões</p></div></div>
      <nav class="row sess-nav" aria-label="Sessões">${p.sessions.map((s, i) => `<a class="btn sm" href="#roteiro-${p.id}" data-action="scroll-sess" data-id="${i + 1}">Sessão ${i + 1}</a>`).join("")}</nav>
      <div class="grid">${p.sessions.map((s, i) => F.sessionCardHTML(p, s, i, {
        action: `<a class="btn primary" href="#sessao" data-action="use-program" data-id="${p.id}" data-n="${i + 1}">${icon("play")}Usar esta sessão</a>`
      })).join("")}</div>
      <p class="tiny" style="margin-top:18px">Roteiro de apoio. A fonoaudióloga ajusta a ordem, a quantidade e o ritmo para cada criança.</p>`;
  };

  /* card na página do paciente */
  F.programCardHTML = (p) => {
    const used = [...new Set(F.sessionsOf(p.id).map(s => s.program_id).filter(Boolean))];
    const progs = used.length ? used.map(F.program).filter(Boolean) : C.programs.filter(x => (p.focus || []).includes(x.track)).slice(0, 2);
    if (!progs.length) return "";
    return `<div class="card" style="margin-top:16px"><div class="row" style="justify-content:space-between;margin-bottom:10px"><h3>Roteiro</h3><a class="small" href="#biblioteca">Ver todos os roteiros</a></div>
      ${progs.map(pr => {
        const done = F.programDone(p.id, pr.id);
        const next = F.programNext(p.id, pr);
        const ns = pr.sessions[next - 1];
        const all = done.size >= pr.sessions.length;
        return `<div class="prog-row"><div class="grow"><b>${esc(pr.title)}</b><div class="prog-steps">${pr.sessions.map((_, i) => `<span class="${done.has(i + 1) ? "on" : ""} ${!all && i + 1 === next ? "next" : ""}">${i + 1}</span>`).join("")}</div>
          <p class="small muted">${all ? "Roteiro concluído. Repita sessões ou siga para outro roteiro." : `Próxima: Sessão ${next} · ${esc(ns.title)}`}</p></div>
          <div class="row" style="gap:8px">${!all ? `<a class="btn sm primary" href="#sessao" data-action="use-program" data-id="${pr.id}" data-n="${next}" data-pid="${p.id}">${icon("play")}Fazer sessão ${next}</a>` : ""}
          <button class="btn sm" data-action="home-from-program" data-id="${p.id}" data-prog="${pr.id}" data-n="${all ? pr.sessions.length : Math.max(1, next - 1)}">${icon("link")}Tarefa de casa</button></div></div>`;
      }).join("")}
    </div>`;
  };

  /* montar sessão: modo roteiro */
  F.setupProgramHTML = (sel, p) => {
    const prog = sel.program && F.program(sel.program);
    const done = p && prog ? F.programDone(p.id, prog.id) : new Set();
    const next = p && prog ? F.programNext(p.id, prog) : 1;
    if (prog && !sel.programN) sel.programN = next;
    const s = prog && prog.sessions[sel.programN - 1];
    return `<section class="setup-step" ${p ? "" : 'style="opacity:.45;pointer-events:none"'}><h2><span class="n">2</span>Roteiro</h2>
        <div class="pick-grid">${C.programs.map(pr => `<button class="pick" data-action="pick-program" data-id="${pr.id}" aria-pressed="${sel.program === pr.id}"><span class="chip ${pr.track}" style="flex:none">${esc(F.track(pr.track).short)}</span><span>${esc(pr.title)}<br><span class="tiny">${pr.sessions.length} sessões</span></span></button>`).join("")}</div>
      </section>
      <section class="setup-step" ${p && prog ? "" : 'style="opacity:.45;pointer-events:none"'}><h2><span class="n">3</span>Sessão</h2>
        ${prog ? `<div class="seg">${prog.sessions.map((x, i) => `<button data-action="pick-program-n" data-id="${i + 1}" aria-pressed="${sel.programN === i + 1}">${done.has(i + 1) ? "✓ " : ""}Sessão ${i + 1}${i + 1 === next && !done.has(i + 1) ? " · próxima" : ""}</button>`).join("")}</div>
        ${F.sessionCardHTML(prog, s, sel.programN - 1, { done: done.has(sel.programN) })}` : ""}
      </section>`;
  };
})(window.F);
