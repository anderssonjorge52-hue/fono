/* Falalá — telas da fonoaudióloga. */
(function (F) {
  const api = window.FALALA_API;
  const CFG = window.FALALA_CONFIG || {};
  const C = window.FALALA_CONTENT;
  const { esc, icon } = F;
  F.views = F.views || {};
  F.ui = F.ui || {};

  F.S = { user: null, profile: null, status: null, patients: [], sessions: [], custom: [], plans: [], practices: [], loaded: false };

  F.reload = async () => {
    const [profile, status, patients, sessions, custom, plans, practices] = await Promise.all([
      api.profile(), api.accountStatus(), api.patients.list(), api.sessions.list(),
      api.custom.list(), api.home.plans(), api.home.practices()
    ]);
    Object.assign(F.S, { profile, status, patients, sessions, custom, plans, practices, loaded: true });
  };

  const active = () => F.S.patients.filter(p => !p.archived);
  const patientById = (id) => F.S.patients.find(p => p.id === id);
  const sessionsOf = (pid) => F.S.sessions.filter(s => s.patient_id === pid);
  F.hasAccess = () => !!(F.S.status && F.S.status.has_access);
  F.patientById = patientById;
  F.sessionsOf = sessionsOf;
  F.activePatients = active;

  /* ---------- acesso / plano ---------- */
  function planState() {
    const st = F.S.status || {};
    const sub = st.subscription;
    if (sub && sub.status === "active" && (!sub.current_period_end || new Date(sub.current_period_end) > new Date())) {
      return { kind: "active", title: "Assinatura ativa", text: sub.plan ? esc(sub.plan) : "Plano Falalá" };
    }
    if (st.has_access && st.trial_ends_at) {
      const d = F.daysLeft(st.trial_ends_at);
      return { kind: "trial", title: `Teste grátis: ${d} ${d === 1 ? "dia" : "dias"}`, text: "Tudo liberado durante o teste." };
    }
    return { kind: "expired", title: "Acesso pausado", text: "Seus dados estão guardados. Assine para continuar." };
  }

  F.paywall = () => F.modal({
    title: "Continue usando o Falalá",
    wide: true,
    body: plansHTML(true)
  });

  function checkoutLink(url) {
    if (!url) return "";
    const email = F.S.user?.email || "";
    try { const u = new URL(url); if (email) u.searchParams.set("email", email); return u.toString(); } catch (e) { return url; }
  }

  function plansHTML(inModal) {
    const items = ["Pacientes e sessões ilimitados", "Trilhas de R, S/Z e língua e lábios", "Modo criança com áudio e espelho", "Evolução de cada paciente"];
    const btn = (url, label, kind) => url
      ? `<a class="btn ${kind}" href="${esc(checkoutLink(url))}" target="_blank" rel="noopener">${label}</a>`
      : `<button class="btn ${kind}" data-action="no-checkout">${label}</button>`;
    return `${inModal ? `<p class="muted" style="margin-bottom:16px">Seus pacientes e sessões continuam guardados. Escolha um plano para voltar a registrar sessões.</p>` : ""}
      <div class="grid plans">
        <div class="card plan"><h3>Mensal</h3><div class="price">${esc(CFG.priceMonthly || "R$ 47")}<small> /mês</small></div>
          <ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>${btn(CFG.checkoutMonthly, "Assinar mensal", "")}</div>
        <div class="card plan best"><span class="chip r" style="justify-self:start">Mais econômico</span><h3>Anual</h3><div class="price">${esc(CFG.priceAnnual || "R$ 197")}<small> /ano</small></div>
          <ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>${btn(CFG.checkoutAnnual, "Assinar anual", "primary")}</div>
      </div>
      <p class="tiny" style="margin-top:14px">Use na compra o mesmo e-mail da sua conta (${esc(F.S.user?.email || "")}). O acesso é liberado automaticamente após a confirmação do pagamento. 7 dias de garantia.</p>`;
  }

  /* ---------- estrutura ---------- */
  const NAV = [
    ["painel", "Painel", "home"], ["pacientes", "Pacientes", "users"], ["sessao", "Nova sessão", "play"],
    ["biblioteca", "Biblioteca", "book"], ["historico", "Histórico", "clock"], ["conta", "Conta", "user"]
  ];
  F.shell = (route, inner) => {
    const ps = planState();
    const name = F.S.profile?.full_name || F.S.user?.email || "";
    const navTo = (r) => r === "paciente" ? "pacientes" : r === "roteiro" ? "biblioteca" : r;
    const cur = navTo(route);
    const demoNote = api.mode === "demo"
      ? `<div class="notice ${api.fallbackToDemo ? "warn" : ""}">${api.fallbackToDemo ? "Não conectou ao servidor. Mostrando a demonstração." : "Demonstração: os dados ficam só neste navegador."}</div>` : "";
    return `<div class="app">
      <aside class="side">
        ${F.logo()}
        <nav class="nav" aria-label="Principal">${NAV.map(([r, l, i]) => `<a href="#${r}" ${cur === r ? 'aria-current="page"' : ""}>${icon(i)}${l}</a>`).join("")}</nav>
        <div class="side-foot">
          ${demoNote}
          <a class="plan-pill" href="#conta" style="text-decoration:none;color:inherit"><b>${ps.title}</b><span class="muted">${ps.text}</span></a>
          <div class="who"><span class="av">${esc((F.firstName(name)[0] || "F").toUpperCase())}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(name)}</span></div>
        </div>
      </aside>
      <header class="topbar">${F.logo()}<a class="btn sm primary" href="#sessao">${icon("play")}Sessão</a></header>
      <main class="main" id="main">${banner()}${inner}</main>
      <nav class="bottom-nav" aria-label="Principal">${NAV.filter(n => n[0] !== "historico").map(([r, l, i]) => `<a href="#${r}" ${cur === r ? 'aria-current="page"' : ""}>${icon(i)}${l.replace("Nova sessão", "Sessão")}</a>`).join("")}</nav>
    </div>`;
  };

  function banner() {
    const ps = planState();
    if (ps.kind === "expired") return `<div class="banner danger">${icon("lock")}<span>Seu teste grátis terminou. Seus dados estão guardados.</span><button class="btn sm primary" data-action="paywall">Ver planos</button></div>`;
    if (ps.kind === "trial" && F.daysLeft(F.S.status.trial_ends_at) <= 2) return `<div class="banner">${icon("clock")}<span>${ps.title}. Assine para não perder o ritmo dos seus pacientes.</span><button class="btn sm primary" data-action="paywall">Ver planos</button></div>`;
    return "";
  }

  /* ---------- painel ---------- */
  F.views.painel = () => {
    const pts = active();
    const now = Date.now(), week = now - 7 * 86400000, month = now - 30 * 86400000;
    const sWeek = F.S.sessions.filter(s => new Date(s.started_at) > week);
    const sMonth = F.S.sessions.filter(s => new Date(s.started_at) > month);
    const avg = sMonth.length ? Math.round(sMonth.reduce((a, s) => a + F.pct(s), 0) / sMonth.length) : null;
    const homeWeek = F.S.practices.filter(h => new Date(h.created_at) > week);
    const recentHome = F.S.practices.slice(0, 5);
    const hour = new Date().getHours();
    const hi = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
    const first = F.firstName(F.S.profile?.full_name);
    const recent = F.S.sessions.slice(0, 6);
    const didBiblio = (() => { try { return localStorage.getItem("falala-saw-library") === "1"; } catch (e) { return false; } })();
    const onboarding = (pts.length === 0 || F.S.sessions.length === 0) ? `
      <div class="card"><h3 style="margin-bottom:14px">Primeiros passos</h3><div class="steps">
        <a class="step ${pts.length ? "done" : ""}" href="#pacientes" style="text-decoration:none;color:inherit"><span class="n">${pts.length ? icon("check") : 1}</span>Cadastre seu primeiro paciente</a>
        <a class="step ${F.S.sessions.length ? "done" : ""}" href="#sessao" style="text-decoration:none;color:inherit"><span class="n">${F.S.sessions.length ? icon("check") : 2}</span>Faça uma sessão no modo criança</a>
        <a class="step ${didBiblio ? "done" : ""}" href="#biblioteca" style="text-decoration:none;color:inherit"><span class="n">${didBiblio ? icon("check") : 3}</span>Conheça a biblioteca de exercícios</a>
      </div></div>` : "";
    return `<div class="page-head"><div><h1>${hi}${first ? `, ${esc(first)}` : ""}</h1><p class="muted">Aqui está o resumo do seu consultório.</p></div></div>
      <section class="grid kpis" aria-label="Resumo">
        <div class="card kpi"><span class="v">${pts.length}</span><span class="l">pacientes ativos</span></div>
        <div class="card kpi"><span class="v">${sWeek.length}</span><span class="l">sessões nos últimos 7 dias</span></div>
        <div class="card kpi"><span class="v">${avg === null ? "–" : avg + "%"}</span><span class="l">acerto médio em 30 dias</span></div>
        <div class="card kpi"><span class="v">${homeWeek.length}</span><span class="l">treinos feitos em casa (7 dias)</span></div>
      </section>
      <div class="grid two" style="margin-top:16px">
        <div class="grid">
          <div class="card hero"><div><h2>Pronta para a próxima sessão?</h2><p>Escolha o paciente e os exercícios. A criança joga, você marca.</p><a class="btn primary big" href="#sessao">${icon("play")}Começar sessão</a></div>${F.mascot("happy")}</div>
          <div class="card"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3>Últimas sessões</h3><a href="#historico" class="small">Ver tudo</a></div>
            ${recent.length ? `<div class="list">${recent.map(sessionRow).join("")}</div>` : `<p class="muted">As sessões que você fizer aparecem aqui.</p>`}
          </div>
        </div>
        <div class="grid">
          ${onboarding}
          ${recentHome.length ? `<div class="card"><h3 style="margin-bottom:8px">Feito em casa</h3><div class="list">${recentHome.map(h => {
            const pp = patientById(h.patient_id);
            return `<a class="li" href="#paciente-${h.patient_id}"><span class="av-kid">${F.avatar(pp?.avatar)}</span><span><span class="t">${esc(pp?.name || "–")}</span><br><span class="tiny">${F.ago(h.created_at)}</span></span><span class="meta">${F.pct(h)}%<br>${h.correct}/${h.total} certas</span></a>`;
          }).join("")}</div></div>` : ""}
          <div class="card"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3>Pacientes</h3><button class="btn sm" data-action="new-patient">${icon("plus")}Novo</button></div>
            ${pts.length ? `<div class="list">${pts.slice(0, 6).map(patientRow).join("")}</div>` : `<p class="muted">Nenhum paciente ainda.</p>`}
          </div>
        </div>
      </div>`;
  };

  function sessionRow(s) {
    const p = patientById(s.patient_id);
    return `<a class="li" href="#paciente-${s.patient_id}"><span class="av-kid">${F.avatar(p?.avatar)}</span>
      <span><span class="t">${esc(p?.name || "Paciente removido")}</span><br><span class="tiny">${F.chip(s.track)} ${F.ago(s.started_at)}</span></span>
      <span class="meta">${F.stars(s.stars)}<br>${s.correct}/${s.total} certas</span></a>`;
  }
  function patientRow(p) {
    const ss = sessionsOf(p.id);
    const last = ss[0];
    return `<a class="li" href="#paciente-${p.id}"><span class="av-kid">${F.avatar(p.avatar)}</span>
      <span><span class="t">${esc(p.name)}</span><br><span class="tiny">${p.age ? `${p.age} anos · ` : ""}${ss.length} ${ss.length === 1 ? "sessão" : "sessões"}</span></span>
      <span class="meta">${last ? F.ago(last.started_at) : "sem sessões"}</span></a>`;
  }

  /* ---------- pacientes ---------- */
  F.views.pacientes = () => {
    const showArch = F.ui.showArchived;
    const q = (F.ui.q || "").toLowerCase();
    const list = F.S.patients.filter(p => (showArch ? p.archived : !p.archived) && (!q || p.name.toLowerCase().includes(q)));
    const cards = list.map(p => {
      const ss = sessionsOf(p.id);
      const last = ss[0];
      const lastPct = last ? F.pct(last) : 0;
      return `<a class="card pcard" href="#paciente-${p.id}">
        <div class="top"><span class="av-kid">${F.avatar(p.avatar)}</span><div><h3>${esc(p.name)}</h3><span class="tiny">${p.age ? `${p.age} anos` : "Idade não informada"}</span></div></div>
        <div class="row" style="gap:6px">${(p.focus || []).map(F.chip).join("") || '<span class="tiny">Sem trilha definida</span>'}</div>
        <div><div class="row small" style="justify-content:space-between"><span class="muted">Última sessão</span><b>${last ? lastPct + "%" : "–"}</b></div><div class="bar" style="margin-top:6px"><i style="width:${lastPct}%"></i></div></div>
        <span class="tiny">${ss.length} ${ss.length === 1 ? "sessão" : "sessões"}${last ? " · " + F.ago(last.started_at) : ""}</span>
      </a>`;
    }).join("");
    return `<div class="page-head"><div><h1>Pacientes</h1><p class="muted">${active().length} ativos${F.S.patients.some(p => p.archived) ? ` · ${F.S.patients.filter(p => p.archived).length} arquivados` : ""}</p></div>
        <button class="btn primary" data-action="new-patient">${icon("plus")}Novo paciente</button></div>
      <div class="toolbar"><label class="search"><span class="sr">Buscar paciente</span>${icon("search")}<input class="input" id="q" placeholder="Buscar pelo nome" value="${esc(F.ui.q || "")}" autocomplete="off"></label>
        <div class="seg"><button data-action="toggle-arch" aria-pressed="${!showArch}">Ativos</button><button data-action="toggle-arch" aria-pressed="${!!showArch}">Arquivados</button></div></div>
      ${list.length ? `<div class="grid pgrid">${cards}</div>` : `<div class="card empty">${F.mascot("wow")}<h3>${q ? "Nenhum paciente com esse nome" : showArch ? "Nenhum paciente arquivado" : "Seu primeiro paciente começa aqui"}</h3>${!q && !showArch ? `<p>Só precisa do primeiro nome ou apelido e da idade.</p><button class="btn primary" data-action="new-patient">${icon("plus")}Cadastrar paciente</button>` : ""}</div>`}`;
  };

  F.patientForm = async (p = null) => {
    if (!p && !F.hasAccess()) return F.paywall();
    let avatar = p?.avatar || C.avatars[Math.floor(Math.random() * C.avatars.length)].id;
    const focus = new Set(p?.focus || []);
    let display = p?.display || "upper";
    const res = await F.modal({
      title: p ? "Editar paciente" : "Novo paciente",
      body: `<form class="form" id="pform" onsubmit="return false">
        <div class="row" style="align-items:flex-start">
          <div class="field grow"><label for="pname">Nome ou apelido</label><input class="input" id="pname" maxlength="60" value="${esc(p?.name || "")}" placeholder="Ex.: Pedro" required></div>
          <div class="field" style="width:110px"><label for="page">Idade</label><input class="input" id="page" type="number" min="1" max="99" inputmode="numeric" value="${esc(p?.age ?? "")}"></div>
        </div>
        <div class="field"><label>O que vamos trabalhar</label><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px">
          ${C.tracks.map(t => `<label class="check"><input type="checkbox" value="${t.id}" ${focus.has(t.id) ? "checked" : ""}>${esc(t.name)}</label>`).join("")}
        </div></div>
        <div class="field"><label>Como mostrar as palavras no modo criança</label>
          <div class="seg" id="pdisp">${[["upper", "MAIÚSCULA"], ["lower", "minúscula"], ["picture", "Só a figura"]].map(([k, l]) => `<button type="button" data-disp="${k}" aria-pressed="${display === k}">${l}</button>`).join("")}</div>
          <span class="tiny">Maiúscula para quem está aprendendo a ler; só a figura para quem ainda não lê.</span></div>
        <div class="field"><label>Personagem da criança</label><div class="avatar-pick">${C.avatars.map(a => `<button type="button" data-av="${a.id}" aria-pressed="${a.id === avatar}" aria-label="${esc(a.name)}">${a.pic}</button>`).join("")}</div></div>
        <div class="field"><label for="pnotes">Observações (opcional)</label><textarea class="input" id="pnotes" maxlength="2000" placeholder="Queixa, objetivos, combinados com a família">${esc(p?.notes || "")}</textarea></div>
        <p class="tiny">Para proteger a criança, use só o primeiro nome ou um apelido. Não coloque documentos nem dados de contato.</p>
        <div class="err" id="perr"></div>
      </form>`,
      onMount(root) {
        root.addEventListener("click", (e) => {
          const d = e.target.closest("[data-disp]");
          if (d) { display = d.dataset.disp; F.$$("[data-disp]", root).forEach(x => x.setAttribute("aria-pressed", x.dataset.disp === display)); return; }
          const b = e.target.closest("[data-av]");
          if (!b) return;
          avatar = b.dataset.av;
          F.$$("[data-av]", root).forEach(x => x.setAttribute("aria-pressed", x.dataset.av === avatar));
        });
      },
      actions: [
        { label: "Cancelar", value: null },
        {
          label: p ? "Salvar" : "Cadastrar", kind: "primary", run: async (root) => {
            const name = F.$("#pname", root).value.trim();
            const ageRaw = F.$("#page", root).value.trim();
            const err = F.$("#perr", root);
            if (!name) { err.textContent = "Escreva o nome ou apelido."; F.$("#pname", root).focus(); return false; }
            const age = ageRaw ? parseInt(ageRaw, 10) : null;
            if (ageRaw && (!age || age < 1 || age > 99)) { err.textContent = "Idade deve ser entre 1 e 99."; return false; }
            const data = { name, age, avatar, display, notes: F.$("#pnotes", root).value.trim() || null, focus: F.$$(".check input:checked", root).map(i => i.value) };
            return p ? api.patients.update(p.id, data) : api.patients.create(data);
          }
        }
      ]
    });
    if (res) {
      await F.reload();
      F.toast(p ? "Paciente atualizado." : "Paciente cadastrado!");
      if (!p && res.id) location.hash = "#paciente-" + res.id; else F.render();
    }
  };

  F.views.paciente = (pid) => {
    const p = patientById(pid);
    if (!p) return `<div class="card empty"><h3>Paciente não encontrado</h3><a class="btn" href="#pacientes">Voltar para pacientes</a></div>`;
    const ss = sessionsOf(pid);
    const avg = ss.length ? Math.round(ss.reduce((a, s) => a + F.pct(s), 0) / ss.length) : null;
    const last = ss[0];
    const first = ss[ss.length - 1];
    const gain = ss.length >= 2 ? F.pct(last) - F.pct(first) : null;
    return `<a href="#pacientes" class="btn ghost sm" style="margin-bottom:12px">${icon("left")}Pacientes</a>
      <div class="page-head"><div class="phead"><span class="av-kid">${F.avatar(p.avatar)}</span><div><h1>${esc(p.name)}</h1>
        <div class="row" style="gap:6px;margin-top:8px">${p.age ? `<span class="chip">${p.age} anos</span>` : ""}${(p.focus || []).map(F.chip).join("")}${p.archived ? '<span class="chip">Arquivado</span>' : ""}</div></div></div>
        <div class="row"><button class="btn" data-action="edit-patient" data-id="${p.id}">${icon("edit")}Editar</button>
        <a class="btn" href="#relatorio-${p.id}">${icon("file")}Relatório</a>
        <a class="btn primary" href="#sessao" data-action="session-for" data-id="${p.id}">${icon("play")}Nova sessão</a></div></div>
      <section class="grid kpis">
        <div class="card kpi"><span class="v">${ss.length}</span><span class="l">sessões</span></div>
        <div class="card kpi"><span class="v">${last ? F.pct(last) + "%" : "–"}</span><span class="l">última sessão</span></div>
        <div class="card kpi"><span class="v">${avg === null ? "–" : avg + "%"}</span><span class="l">média geral</span></div>
        <div class="card kpi"><span class="v">${gain === null ? "–" : (gain > 0 ? "+" : "") + gain}</span><span class="l">pontos desde a 1ª sessão</span></div>
      </section>
      <div class="grid two" style="margin-top:16px">
        <div class="card"><div class="row" style="justify-content:space-between"><h3>Evolução</h3><span class="tiny">% de acerto por sessão (com ajuda vale meio)</span></div>
          ${ss.length >= 2 ? `<div class="fig" id="evo" data-pid="${p.id}"></div>` : `<div class="empty"><p>O gráfico aparece a partir da 2ª sessão.</p></div>`}
        </div>
        <div class="card"><h3 style="margin-bottom:10px">Observações</h3><p class="muted" style="white-space:pre-wrap">${p.notes ? esc(p.notes) : "Nenhuma observação."}</p>
          <div class="row" style="margin-top:16px"><button class="btn sm" data-action="archive-patient" data-id="${p.id}">${icon("archive")}${p.archived ? "Reativar" : "Arquivar"}</button>
          <button class="btn sm danger" data-action="delete-patient" data-id="${p.id}">${icon("trash")}Excluir</button></div></div>
      </div>
      ${F.programCardHTML(p)}
      ${F.homeCardHTML(p)}
      ${attentionHTML(ss.concat(F.S.practices.filter(h => h.patient_id === p.id)))}
      ${F.recordingsHTML(p)}
      <div class="card" style="margin-top:16px"><h3 style="margin-bottom:10px">Sessões</h3>
        ${ss.length ? sessionsTable(ss, false) : `<p class="muted">Nenhuma sessão ainda. Que tal começar agora?</p>`}
      </div>`;
  };

  /* palavras que mais erra x palavras dominadas, somando todas as sessões */
  F.attentionHTML = (ss) => attentionHTML(ss);
  function attentionHTML(ss) {
    const map = new Map();
    ss.forEach(s => (s.results || []).forEach(r => {
      if (!r || !r.item || r.r === "skip") return;
      const m = map.get(r.item) || { item: r.item, n: 0, ok: 0, help: 0, last: null };
      m.n++; if (r.r === "ok") m.ok++; if (r.r === "help") m.help++;
      if (!m.last) m.last = r.r;
      map.set(r.item, m);
    }));
    const rows = [...map.values()].map(m => ({ ...m, score: Math.round(((m.ok + m.help * 0.5) / m.n) * 100) }));
    if (!rows.length) return "";
    const hard = rows.filter(m => m.score < 70).sort((a, b) => a.score - b.score || b.n - a.n).slice(0, 6);
    const good = rows.filter(m => m.n >= 2 && m.score >= 80).sort((a, b) => b.score - a.score || b.n - a.n).slice(0, 6);
    const li = (m, color) => `<li><span class="w">${esc(m.item)}</span><span class="mini"><i style="width:${m.score}%;background:${color}"></i></span><span class="pc">${m.score}%</span></li>`;
    return `<div class="card" style="margin-top:16px"><div class="row" style="justify-content:space-between;margin-bottom:12px"><h3>Pontos de atenção</h3><span class="tiny">Somando sessões e treinos em casa · com ajuda vale meio</span></div>
      <div class="attn">
        <div><h4>${icon("alert")}Mais erra</h4>${hard.length ? `<ol>${hard.map(m => li(m, "#E8613C")).join("")}</ol>` : `<p class="muted small">Nenhuma palavra abaixo de 70%. Ótimo sinal!</p>`}</div>
        <div><h4>${icon("star")}Já domina</h4>${good.length ? `<ol>${good.map(m => li(m, "#1F8A70")).join("")}</ol>` : `<p class="muted small">Aparece quando a mesma palavra for acertada em 2 sessões ou mais.</p>`}</div>
      </div></div>`;
  }

  function sessionsTable(ss, withPatient) {
    return `<div class="scroll"><table class="table stack"><thead><tr><th>Data</th>${withPatient ? "<th>Paciente</th>" : ""}<th>Trilha</th><th>Exercícios</th><th class="num">Acertos</th><th>Estrelas</th><th>Notas</th><th></th></tr></thead><tbody>
      ${ss.map(s => {
        const p = patientById(s.patient_id);
        const prog = s.program_id && F.program(s.program_id);
        const ex = (prog ? `${prog.title} · Sessão ${s.program_session}: ` : "") + (s.exercise_ids || []).map(id => F.exercise(id)?.title).filter(Boolean).join(", ");
        return `<tr><td>${F.dateTime(s.started_at)}</td>${withPatient ? `<td><a href="#paciente-${s.patient_id}">${esc(p?.name || "–")}</a></td>` : ""}
        <td>${F.chip(s.track)}</td><td class="small">${esc(ex) || "–"}</td><td class="num"><b>${F.pct(s)}%</b><br><span class="tiny">${s.correct} certas · ${s.helped} c/ ajuda · ${s.total}</span></td>
        <td>${F.stars(s.stars)}</td><td class="small" style="max-width:240px">${esc(s.notes || "")}</td>
        <td class="num"><button class="btn sm ghost" data-action="note-session" data-id="${s.id}" aria-label="Editar nota">${icon("edit")}</button><button class="btn sm ghost danger" data-action="delete-session" data-id="${s.id}" aria-label="Excluir sessão">${icon("trash")}</button></td></tr>`;
      }).join("")}</tbody></table></div>`;
  }

  F.drawEvolution = () => {
    const box = F.$("#evo");
    if (!box) return;
    const ss = sessionsOf(box.dataset.pid).slice(0, 14).reverse();
    const draw = () => {
      const W = box.clientWidth, H = box.clientHeight || 240;
      const pad = { l: 46, r: 18, t: 22, b: 30 };
      const x = (i) => pad.l + (ss.length === 1 ? 0 : (i / (ss.length - 1)) * (W - pad.l - pad.r));
      const y = (v) => pad.t + (1 - v / 100) * (H - pad.t - pad.b);
      const pts = ss.map((s, i) => [x(i), y(F.pct(s))]);
      const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
      const area = line + ` L${pts[pts.length - 1][0]} ${y(0)} L${pts[0][0]} ${y(0)} Z`;
      const narrow = W < 420;
      box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do acerto">
        ${[0, 50, 100].map(v => `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" opacity=".12"/><text x="${pad.l - 8}" y="${y(v) + 4}" text-anchor="end" font-size="12" fill="currentColor" opacity=".55">${v}%</text>`).join("")}
        <path d="${area}" fill="#1F8A70" opacity=".12"/><path d="${line}" fill="none" stroke="#1F8A70" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
        ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#fff" stroke="#1F8A70" stroke-width="3"><title>${F.day(ss[i].started_at)}: ${F.pct(ss[i])}%</title></circle>`).join("")}
        ${(() => { const show = new Set([0, ss.length - 1]); let lastX = x(0); const endX = x(ss.length - 1); for (let i = 1; i < ss.length - 1; i++) { if (!narrow && x(i) - lastX >= 70 && endX - x(i) >= 70) { show.add(i); lastX = x(i); } } return ss.map((s, i) => show.has(i) ? `<text x="${x(i)}" y="${H - 8}" text-anchor="${i === 0 ? "start" : i === ss.length - 1 ? "end" : "middle"}" font-size="12" fill="currentColor" opacity=".55">${F.day(s.started_at)}</text>` : "").join(""); })()}
        <text x="${pts[pts.length - 1][0] - 4}" y="${pts[pts.length - 1][1] - 12}" text-anchor="end" font-size="14" font-weight="800" fill="#1F8A70">${F.pct(ss[ss.length - 1])}%</text>
      </svg>`;
    };
    draw();
    if (F._evoRO) F._evoRO.disconnect();
    F._evoRO = new ResizeObserver(draw);
    F._evoRO.observe(box);
  };

  /* ---------- histórico ---------- */
  F.views.historico = () => {
    const fp = F.ui.hPatient || "", ft = F.ui.hTrack || "";
    const ss = F.S.sessions.filter(s => (!fp || s.patient_id === fp) && (!ft || s.track === ft));
    return `<div class="page-head"><div><h1>Histórico</h1><p class="muted">${F.S.sessions.length} sessões registradas</p></div>
        <button class="btn" data-action="export-csv" ${ss.length ? "" : "disabled"}>${icon("copy")}Exportar planilha</button></div>
      <div class="toolbar">
        <select class="input" id="hPatient" style="max-width:260px" aria-label="Filtrar por paciente"><option value="">Todos os pacientes</option>${F.S.patients.map(p => `<option value="${p.id}" ${fp === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select>
        <select class="input" id="hTrack" style="max-width:220px" aria-label="Filtrar por trilha"><option value="">Todas as trilhas</option>${C.tracks.map(t => `<option value="${t.id}" ${ft === t.id ? "selected" : ""}>${esc(t.name)}</option>`).join("")}</select>
      </div>
      <div class="card">${ss.length ? sessionsTable(ss, true) : `<div class="empty">${F.mascot("happy")}<p>Nenhuma sessão com esses filtros.</p></div>`}</div>`;
  };

  F.exportCSV = () => {
    const fp = F.ui.hPatient || "", ft = F.ui.hTrack || "";
    const ss = F.S.sessions.filter(s => (!fp || s.patient_id === fp) && (!ft || s.track === ft));
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [["Data", "Paciente", "Trilha", "Exercícios", "Total", "Certas", "Com ajuda", "Acerto %", "Estrelas", "Duração (min)", "Notas"]]
      .concat(ss.map(s => [F.dateTime(s.started_at), patientById(s.patient_id)?.name, F.track(s.track)?.name, (s.exercise_ids || []).map(id => F.exercise(id)?.title).join(" | "), s.total, s.correct, s.helped, F.pct(s), s.stars, Math.round((s.duration_sec || 0) / 60), s.notes]));
    const csv = rows.map(r => r.map(q).join(";")).join("\n");
    let downloaded = false;
    try {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      a.download = `falala-sessoes-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      downloaded = true;
    } catch (e) { downloaded = false; }
    F.modal({
      title: "Planilha das sessões",
      body: `<p class="muted" style="margin-bottom:10px">${downloaded ? "O download deve ter começado. Se não começou, copie o texto abaixo e cole no Excel ou no Google Planilhas." : "Copie o texto abaixo e cole no Excel ou no Google Planilhas."}</p><textarea class="input" readonly style="min-height:180px;font-size:13px">${esc(csv)}</textarea>`,
      actions: [{ label: "Fechar", value: null }, { label: "Copiar", kind: "primary", run: () => F.copy(csv).then(() => false) }]
    });
  };

  /* ---------- conta ---------- */
  F.views.conta = () => {
    const pr = F.S.profile || {};
    const ps = planState();
    const st = F.S.status || {};
    return `<div class="page-head"><div><h1>Conta</h1><p class="muted">${esc(F.S.user?.email || "")}</p></div><button class="btn" data-action="logout">${icon("out")}Sair</button></div>
      <div class="grid two">
        <div class="card"><h3 style="margin-bottom:16px">Seus dados</h3>
          <form class="form" id="profileForm" onsubmit="return false">
            <div class="field"><label for="fn">Nome completo</label><input class="input" id="fn" maxlength="80" value="${esc(pr.full_name || "")}"></div>
            <div class="row" style="align-items:flex-start"><div class="field grow"><label for="crfa">CRFa (opcional)</label><input class="input" id="crfa" maxlength="20" value="${esc(pr.crfa || "")}" placeholder="Ex.: 2-12345"></div>
            <div class="field grow"><label for="clinic">Consultório (opcional)</label><input class="input" id="clinic" maxlength="80" value="${esc(pr.clinic || "")}"></div></div>
            <div class="row"><button class="btn primary" data-action="save-profile">Salvar dados</button><button class="btn" data-action="change-password">${icon("lock")}Trocar senha</button></div>
          </form></div>
        <div class="card"><h3>Seu plano</h3>
          <p style="margin:10px 0 4px"><span class="chip ${ps.kind === "active" ? "s" : ps.kind === "trial" ? "r" : ""}">${ps.title}</span></p>
          <p class="muted small">${ps.kind === "trial" ? `O teste termina em ${F.dateTime(st.trial_ends_at)}.` : ps.kind === "active" && st.subscription?.current_period_end ? `Renova até ${F.dateTime(st.subscription.current_period_end)}.` : ps.text}</p>
          ${CFG.supportWhatsapp ? `<a class="btn sm" style="margin-top:14px" href="https://wa.me/${esc(CFG.supportWhatsapp)}" target="_blank" rel="noopener">${icon("whats")}Falar com o suporte</a>` : ""}
        </div>
      </div>
      ${ps.kind !== "active" ? `<h2 style="margin:28px 0 14px">Planos</h2>${plansHTML(false)}` : ""}
      ${api.mode === "demo" ? `<div class="card" style="margin-top:20px"><h3>Demonstração</h3><p class="muted small" style="margin:6px 0 12px">Apague os dados de exemplo e comece do zero neste navegador.</p><button class="btn sm danger" data-action="reset-demo">${icon("trash")}Recomeçar demonstração</button></div>` : ""}`;
  };

  /* ---------- entrada ---------- */
  F.views.auth = () => {
    const tab = F.ui.authTab || "in";
    const demo = api.mode === "demo";
    return `<div class="auth">
      <section class="auth-art">
        ${F.logo("#entrar", true)}
        <div><h1>A lição de casa que a criança pede para fazer.</h1>
          <p class="lead">Sessões de fala em formato de jogo, com áudio e espelho. A criança treina em casa pelo link e você acompanha a evolução de cada paciente.</p></div>
        ${F.mascot("happy", "#FFC93C").replace('class="mascot"', 'class="mascot auth-mascot"')}
        <ul><li>${icon("check")}7 trilhas: R, S/Z, L/LH, CH/J, trocas, sílabas e rimas</li><li>${icon("check")}Tarefa de casa por link, direto no WhatsApp da família</li><li>${icon("check")}Gravação da voz e relatório de evolução para os pais</li></ul>
      </section>
      <section class="auth-form"><div class="auth-card">
        ${demo ? `<div class="notice">${api.fallbackToDemo ? "Não foi possível conectar ao servidor agora. Você está na demonstração; os dados ficam só neste navegador." : "Você está na demonstração. Qualquer e-mail funciona e os dados ficam só neste navegador."}</div>` : ""}
        <div class="tabs" role="tablist"><button role="tab" aria-selected="${tab === "in"}" data-action="auth-tab" data-id="in">Entrar</button><button role="tab" aria-selected="${tab === "up"}" data-action="auth-tab" data-id="up">Criar conta</button></div>
        ${tab === "in" ? `<form class="form" id="loginForm" novalidate>
            <div><h2>Que bom te ver de novo</h2><p class="muted small" style="margin-top:4px">Entre com o e-mail da sua conta.</p></div>
            <div class="field"><label for="le">E-mail</label><input class="input" id="le" type="email" autocomplete="email" required></div>
            <div class="field"><label for="lp">Senha</label><input class="input" id="lp" type="password" autocomplete="current-password" required></div>
            <div class="err" id="lerr" role="alert"></div>
            <button class="btn primary big" type="submit">Entrar</button>
            <button class="btn ghost sm" type="button" data-action="forgot">Esqueci minha senha</button>
            ${demo ? `<button class="btn" type="button" data-action="demo-login">${icon("play")}Ver a demonstração com pacientes de exemplo</button>` : ""}
          </form>` : `<form class="form" id="signupForm" novalidate>
            <div><h2>Comece seu teste grátis</h2><p class="muted small" style="margin-top:4px">7 dias com tudo liberado. Sem cartão.</p></div>
            <div class="field"><label for="sn">Nome completo</label><input class="input" id="sn" autocomplete="name" maxlength="80" required></div>
            <div class="field"><label for="se">E-mail</label><input class="input" id="se" type="email" autocomplete="email" required></div>
            <div class="row" style="align-items:flex-start"><div class="field grow"><label for="sp">Senha</label><input class="input" id="sp" type="password" autocomplete="new-password" minlength="6" required placeholder="Mínimo 6 caracteres"></div>
            <div class="field" style="width:150px"><label for="sc">CRFa (opcional)</label><input class="input" id="sc" maxlength="20"></div></div>
            <div class="err" id="serr" role="alert"></div>
            <button class="btn primary big" type="submit">Criar conta grátis</button>
            <p class="tiny">Ao criar a conta você concorda em usar o Falalá como apoio ao seu atendimento, guardando só o necessário de cada paciente.</p>
          </form>`}
      </div></section>
    </div>`;
  };
})(window.F);
