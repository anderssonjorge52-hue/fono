/* Falalá — plano de tratamento, agenda e avisos.
   A fono marca as queixas, quantas sessões e quando; o Falalá monta cada sessão com os exercícios
   e a data. No dia, o painel e o sino avisam, e o navegador mostra uma notificação se ela permitir. */
(function (F) {
  const api = window.FALALA_API;
  const { esc, icon } = F;

  /* ---------- queixas ---------- */
  F.COMPLAINTS = [
    { id: "r", label: "Troca ou omite o R", hint: "“lato” por “rato”, “pato” por “prato”", prog: "prog-r", track: "r" },
    { id: "s", label: "Língua entre os dentes no S e no Z", hint: "ceceio: “thapo” por “sapo”", prog: "prog-s", track: "s" },
    { id: "l", label: "Dificuldade com L e LH", hint: "“pranta” por “planta”, “paia” por “palha”", prog: "prog-l", track: "l" },
    { id: "ch", label: "Troca o CH e o J", hint: "“sapéu” por “chapéu”, “zogo” por “jogo”", prog: "prog-ch", track: "ch" },
    { id: "trocas", label: "Troca sons com voz e sem voz", hint: "“pola” por “bola”, “faca” por “vaca”", prog: "prog-trocas", track: "trocas" },
    { id: "silabas", label: "Dificuldade com sílabas e rimas", hint: "consciência fonológica", prog: "prog-silabas", track: "silabas" },
    { id: "resp", label: "Respira pela boca ou fica de boca aberta", hint: "reforça respiração pelo nariz e postura de repouso", track: "resp" },
    { id: "oral", label: "Língua e lábios com pouca força ou controle", hint: "reforça movimentos de boca em todas as sessões", track: "oral" },
    { id: "atencao", label: "Cansa rápido ou perde a atenção", hint: "sessões mais curtas, com menos exercícios" }
  ];
  const complaint = (id) => F.COMPLAINTS.find(c => c.id === id);

  /* rodízios usados para reforçar respiração e movimentos de boca */
  const RESP_ROT = ["resp-nariz", "resp-barriga", "resp-flor", "resp-nariz", "resp-balao"];
  const ORAL_ROT = ["oral-cavalinho", "oral-bico", "oral-sorvete", "oral-relogio", "oral-balao", "oral-vela", "oral-varrer", "oral-fora"];

  const BASE = {
    id: null, track: "oral", title: "Respiração e motricidade",
    sessions: [
      { title: "Nariz e postura de repouso", goal: "Respirar pelo nariz e manter a língua no lugar certo com a boca fechada.", blocks: ["resp-nariz", "oral-papila", "oral-fora", "oral-bico"], materials: ["Espelho"], home: ["resp-nariz", "oral-papila"] },
      { title: "Língua forte", goal: "Ganhar força e controle de língua.", blocks: ["resp-flor", "oral-cavalinho", "oral-sorvete", "oral-relogio"], materials: ["Espelho"], home: ["oral-cavalinho", "oral-sorvete"] },
      { title: "Lábios e bochechas", goal: "Fortalecer lábios e bochechas com sopro controlado.", blocks: ["resp-balao", "oral-balao", "oral-vela", "oral-bico"], materials: ["Vela ou papel picado"], home: ["oral-balao", "oral-vela"] },
      { title: "Respiração com a barriga", goal: "Usar o diafragma e alongar a saída do ar.", blocks: ["resp-barriga", "resp-sss", "oral-papila", "oral-varrer"], materials: [], home: ["resp-barriga"] },
      { title: "Coordenação de movimentos", goal: "Alternar movimentos com precisão e ritmo.", blocks: ["resp-nariz", "oral-relogio", "oral-fora", "oral-cavalinho"], materials: ["Espelho"], home: ["oral-relogio"] },
      { title: "Revisão de postura e sopro", goal: "Manter a respiração nasal e a postura de repouso por mais tempo.", blocks: ["resp-nariz", "resp-balao", "oral-papila", "oral-vela"], materials: [], home: ["resp-nariz", "oral-papila"] }
    ]
  };

  const uniq = (arr) => [...new Set(arr)].filter(id => F.exercise(id));
  const isBreath = (id) => F.exercise(id)?.type === "breath";
  const isPraxis = (id) => F.exercise(id)?.type === "praxis";

  /* divide S vagas entre os programas, proporcional ao tamanho de cada um */
  function allocate(sizes, S) {
    if (S < sizes.length) return sizes.map((_, i) => (i < S ? 1 : 0));
    const sum = sizes.reduce((a, b) => a + b, 0);
    const a = sizes.map(k => Math.max(1, Math.round((S * k) / sum)));
    let diff = S - a.reduce((x, y) => x + y, 0);
    while (diff !== 0) {
      const i = diff > 0 ? a.indexOf(Math.min(...a)) : a.indexOf(Math.max(...a));
      if (diff < 0 && a[i] <= 1) break;
      a[i] += diff > 0 ? 1 : -1;
      diff += diff > 0 ? -1 : 1;
    }
    return a;
  }

  /* distribui m vagas pelas sessões do programa; repete (consolidação) ou escolhe as principais */
  function spread(prog, m) {
    const k = prog.sessions.length;
    const out = [];
    const mk = (s, i, rep) => ({
      kind: "work", title: rep ? `${s.title} · consolidação` : s.title,
      goal: rep ? "Repetir com menos ajuda, buscando 80% de acerto." : s.goal,
      blocks: [...s.blocks], home: [...(s.home || [])], materials: [...(s.materials || [])],
      program_id: prog.id, program_session: prog.id ? i + 1 : null, track: prog.track
    });
    if (m >= k) {
      const base = Math.floor(m / k), extra = m % k;
      const bonus = new Set(Array.from({ length: extra }, (_, t) => Math.min(k - 1, Math.floor(((t + 0.5) * k) / extra))));
      prog.sessions.forEach((s, i) => {
        const reps = base + (bonus.has(i) ? 1 : 0);
        for (let r = 0; r < reps; r++) out.push(mk(s, i, r > 0));
      });
    } else {
      const idx = m === 1 ? [k - 1] : Array.from({ length: m }, (_, t) => Math.round((t * (k - 1)) / (m - 1)));
      [...new Set(idx)].forEach(i => out.push(mk(prog.sessions[i], i, false)));
    }
    return out;
  }

  function probeBlocks(progs) {
    // um exercício de palavras e um de escuta de cada alvo: o mesmo conjunto na avaliação e na reavaliação
    const out = [];
    progs.forEach(p => {
      const all = p.sessions.flatMap(s => s.blocks);
      const w = all.find(id => ["words"].includes(F.exercise(id)?.type));
      const pr = all.find(id => F.exercise(id)?.type === "pairs");
      if (w) out.push(w);
      if (pr) out.push(pr);
    });
    return uniq(out).slice(0, 5);
  }

  F.buildPlan = ({ complaints = [], total = 10, evalFirst = false, reevalLast = true }) => {
    total = Math.max(1, Math.min(60, total | 0));
    const progs = complaints.map(complaint).filter(c => c && c.prog).map(c => F.program(c.prog)).filter(Boolean);
    const base = progs.length ? progs : [BASE];
    const wantEval = evalFirst && total >= 3, wantRe = reevalLast && total >= 3;
    const slots = total - (wantEval ? 1 : 0) - (wantRe ? 1 : 0);
    const alloc = allocate(base.map(p => p.sessions.length), slots);
    const probe = probeBlocks(base);
    const mainTrack = base[0].track;
    let list = [];
    if (wantEval) list.push({ kind: "eval", title: "Avaliação inicial e vínculo", goal: "Conhecer a criança, registrar como ela fala hoje e explicar o plano para a família.", blocks: probe.length ? probe : base[0].sessions[0].blocks, home: [], materials: ["Espelho"], track: mainTrack });
    base.forEach((p, i) => { list = list.concat(spread(p, alloc[i])); });
    if (wantRe) list.push({ kind: "review", title: "Reavaliação e devolutiva para a família", goal: "Repetir os exercícios da avaliação, comparar a evolução e combinar os próximos passos.", blocks: probe.length ? probe : base[base.length - 1].sessions.slice(-1)[0].blocks, home: [], materials: [], track: mainTrack });

    const has = (id) => complaints.includes(id);
    let ri = 0, oi = 0;
    list = list.map(s => {
      let b = [...s.blocks];
      if (s.kind === "work") {
        if (has("resp")) {
          const r = RESP_ROT[ri++ % RESP_ROT.length];
          const at = b.findIndex(isBreath);
          if (at >= 0) b[at] = r; else b.unshift(r);
          if (!b.includes("oral-papila")) b.splice(1, 0, "oral-papila");
        }
        if (has("oral") && b.filter(isPraxis).length < 2) {
          const need = 2 - b.filter(isPraxis).length;
          const add = [];
          for (let t = 0; t < 8 && add.length < need; t++) { const o = ORAL_ROT[oi++ % ORAL_ROT.length]; if (!b.includes(o)) add.push(o); }
          const after = b.findIndex(isBreath) + 1;
          b.splice(after, 0, ...add);
        }
        if (has("atencao") && b.length > 4) {
          const first = b.find(isBreath);
          const rest = b.filter(id => id !== first).slice(-3);
          b = first ? [first, ...rest] : b.slice(-4);
        }
      }
      return { ...s, blocks: uniq(b) };
    });
    return list.map((s, i) => ({ n: i + 1, status: "planned", session_id: null, ...s }));
  };

  /* ---------- datas (horário local, sem fuso: "AAAA-MM-DDTHH:MM") ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  F.todayYmd = () => ymd(new Date());
  F.ymd = ymd;
  F.planDates = ({ start, time = "14:00", weekdays = [], every = 1, count }) => {
    const s = parseYmd(start);
    const days = weekdays.length ? weekdays : [s.getDay()];
    const week0 = new Date(s); week0.setDate(s.getDate() - s.getDay());
    const out = [];
    const d = new Date(s);
    for (let guard = 0; out.length < count && guard < 1500; guard++) {
      const wk = Math.floor(Math.round((d - week0) / 86400000) / 7);
      if (days.includes(d.getDay()) && wk % every === 0) out.push(`${ymd(d)}T${time}`);
      d.setDate(d.getDate() + 1);
    }
    return out;
  };
  const WD = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const WDL = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const MON = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  F.whenLabel = (at, withDay = true) => {
    if (!at) return "Sem data";
    const [ds, ts] = at.split("T");
    const d = parseYmd(ds);
    const today = F.todayYmd();
    const tm = new Date(); tm.setDate(tm.getDate() + 1);
    const rel = ds === today ? "Hoje" : ds === ymd(tm) ? "Amanhã" : null;
    const day = rel || `${WD[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`;
    return withDay ? `${day}${ts ? " · " + ts : ""}` : (ts || "");
  };
  const dateOnly = (at) => (at || "").split("T")[0];
  const shiftAt = (at, days) => { const [ds, ts] = at.split("T"); const d = parseYmd(ds); d.setDate(d.getDate() + days); return `${ymd(d)}T${ts || "14:00"}`; };

  /* ---------- estado ---------- */
  F.activePlanOf = (pid) => (F.S.treatments || []).find(t => t.patient_id === pid && t.active);
  F.agendaItems = () => {
    const out = [];
    (F.S.treatments || []).filter(t => t.active).forEach(t => {
      const p = F.patientById(t.patient_id);
      if (!p || p.archived) return;
      (t.sessions || []).forEach(s => out.push({ plan: t, s, p, total: t.sessions.length }));
    });
    return out.sort((a, b) => (a.s.at || "").localeCompare(b.s.at || ""));
  };
  F.agendaBuckets = () => {
    const today = F.todayYmd();
    const items = F.agendaItems().filter(x => x.s.status === "planned" && x.s.at);
    const lim = new Date(); lim.setDate(lim.getDate() + 14);
    return {
      overdue: items.filter(x => dateOnly(x.s.at) < today),
      today: items.filter(x => dateOnly(x.s.at) === today),
      next: items.filter(x => dateOnly(x.s.at) > today && dateOnly(x.s.at) <= ymd(lim))
    };
  };
  F.alertCount = () => { const b = F.agendaBuckets(); return b.today.length + b.overdue.length; };

  async function savePlanSessions(plan, sessions) {
    await api.treatment.update(plan.id, { sessions });
  }
  F.planMarkDone = async (planId, n, sessionId) => {
    const plan = (F.S.treatments || []).find(t => t.id === planId);
    if (!plan) return;
    const sessions = plan.sessions.map(s => s.n === n ? { ...s, status: "done", session_id: sessionId || null, done_at: new Date().toISOString() } : s);
    try { await savePlanSessions(plan, sessions); } catch (e) { F.toast("A sessão foi salva, mas não deu para marcar no plano.", true); }
  };

  /* ---------- telas ---------- */
  const statusChip = (s) => {
    if (s.status === "done") return `<span class="chip s">${icon("check")}Feita</span>`;
    if (s.status === "missed") return `<span class="chip">Faltou</span>`;
    if (s.at && dateOnly(s.at) < F.todayYmd()) return `<span class="chip danger-chip">Atrasada</span>`;
    if (s.at && dateOnly(s.at) === F.todayYmd()) return `<span class="chip r">Hoje</span>`;
    return "";
  };
  const kindChip = (s) => s.kind === "eval" ? `<span class="chip">Avaliação</span>` : s.kind === "review" ? `<span class="chip">Reavaliação</span>` : "";
  const nextOf = (plan) => plan.sessions.find(s => s.status === "planned");

  F.planCardHTML = (p) => {
    const plan = F.activePlanOf(p.id);
    if (!plan) {
      return `<div class="card plan-cta" style="margin-top:16px"><div class="grow"><h3>Plano de tratamento</h3>
        <p class="muted small" style="margin-top:4px">Marque as queixas, quantas sessões e os dias. O Falalá monta cada sessão com os exercícios e avisa você no dia.</p></div>
        <button class="btn primary" data-action="plan-new" data-id="${p.id}">${icon("calendar")}Montar plano</button></div>`;
    }
    const done = plan.sessions.filter(s => s.status === "done").length;
    const nx = nextOf(plan);
    const open = F.ui.planOpen || {};
    const names = plan.complaints.map(c => complaint(c)?.label).filter(Boolean);
    return `<div class="card tplan" style="margin-top:16px">
      <div class="row tplan-head"><div class="grow"><h3>Plano de tratamento</h3>
        <p class="muted small" style="margin-top:4px">${done} de ${plan.sessions.length} sessões feitas${nx ? ` · próxima: <b>${esc(F.whenLabel(nx.at))}</b>` : " · plano concluído"}</p>
        ${names.length ? `<p class="tiny" style="margin-top:4px">${esc(names.join(" · "))}</p>` : ""}</div>
        <div class="row" style="gap:8px">
          <button class="btn sm" data-action="plan-ics" data-id="${plan.id}">${icon("download")}Pôr na agenda do celular</button>
          <button class="btn sm ghost" data-action="plan-delete" data-id="${plan.id}" aria-label="Excluir plano">${icon("trash")}</button>
        </div></div>
      <div class="prog-steps tplan-steps">${plan.sessions.map(s => `<span class="${s.status === "done" ? "on" : ""} ${nx && s.n === nx.n ? "next" : ""} ${s.status === "missed" ? "miss" : ""}" title="Sessão ${s.n}">${s.n}</span>`).join("")}</div>
      <ol class="tlist">${plan.sessions.map(s => {
        const f = F.sessionFacts(s);
        const isOpen = open[plan.id + ":" + s.n];
        const canStart = s.status !== "done";
        return `<li class="trow ${s.status} ${nx && s.n === nx.n ? "is-next" : ""}">
          <div class="trow-main">
            <span class="tn">${s.n}</span>
            <div class="grow">
              <div class="row" style="gap:6px"><b>${esc(s.title)}</b>${kindChip(s)}${statusChip(s)}</div>
              <p class="tiny">${esc(F.whenLabel(s.at))} · ${f.exs.length} exercícios · ~${f.minutes} min</p>
            </div>
            <div class="row trow-act" style="gap:6px">
              ${canStart ? `<button class="btn sm ${nx && s.n === nx.n ? "primary" : ""}" data-action="plan-start" data-id="${plan.id}" data-n="${s.n}">${icon("play")}Começar</button>` : ""}
              ${s.status === "planned" ? `<button class="btn sm" data-action="plan-move" data-id="${plan.id}" data-n="${s.n}">${icon("calendar")}Remarcar</button>` : ""}
              <button class="btn sm ghost" data-action="plan-toggle" data-id="${plan.id}" data-n="${s.n}" aria-expanded="${!!isOpen}">${isOpen ? "Fechar" : "Exercícios"}</button>
            </div>
          </div>
          ${isOpen ? `<div class="trow-detail">${F.sessionCardHTML(null, s, s.n - 1, {})}
            <div class="row" style="gap:8px;margin-top:10px">${s.status === "planned" ? `<button class="btn sm" data-action="plan-missed" data-id="${plan.id}" data-n="${s.n}">Marcar falta</button>` : ""}
            ${s.status !== "planned" ? `<button class="btn sm" data-action="plan-reopen" data-id="${plan.id}" data-n="${s.n}">${icon("undo")}Voltar para agendada</button>` : ""}
            ${(s.home || []).length ? `<button class="btn sm" data-action="plan-home" data-id="${plan.id}" data-n="${s.n}">${icon("link")}Mandar tarefa de casa</button>` : ""}</div></div>` : ""}
        </li>`;
      }).join("")}</ol>
      <p class="tiny" style="margin-top:12px">Plano sugerido pelo Falalá a partir das queixas. Você ajusta datas e exercícios conforme a evolução da criança.</p>
    </div>`;
  };

  /* agenda no painel */
  F.agendaCardHTML = () => {
    const b = F.agendaBuckets();
    const hasPlans = (F.S.treatments || []).some(t => t.active);
    if (!hasPlans) {
      return `<div class="card agenda-card"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3>${icon("calendar")}Agenda</h3></div>
        <p class="muted small">Monte o plano de tratamento de cada paciente e as sessões aparecem aqui no dia certo, com aviso.</p>
        ${F.activePatients().length ? `<a class="btn sm" href="#paciente-${F.activePatients()[0].id}" style="margin-top:10px">${icon("plus")}Montar um plano</a>` : ""}</div>`;
    }
    const row = (x, showDay) => agendaRow(x, showDay);
    return `<div class="card agenda-card"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3>${icon("calendar")}Hoje</h3><a href="#agenda" class="small">Ver agenda</a></div>
      ${b.overdue.length ? `<div class="notice warn small" style="margin-bottom:10px">${b.overdue.length} ${b.overdue.length === 1 ? "sessão atrasada" : "sessões atrasadas"}. <a href="#agenda">Resolver</a></div>` : ""}
      ${b.today.length ? `<div class="list">${b.today.map(x => row(x, false)).join("")}</div>` : `<p class="muted small">Nenhuma sessão marcada para hoje.</p>`}
      ${b.next.length ? `<p class="tiny" style="margin:12px 0 4px">Próximas</p><div class="list">${b.next.slice(0, 3).map(x => row(x, true)).join("")}</div>` : ""}
    </div>`;
  };

  function agendaRow(x, showDay = true) {
    const { plan, s, p, total } = x;
    return `<div class="li arow"><span class="av-kid">${F.avatar(p.avatar)}</span>
      <a class="grow" href="#paciente-${p.id}" style="color:inherit;text-decoration:none"><span class="t">${esc(p.name)}</span><br>
        <span class="tiny">${esc(showDay ? F.whenLabel(s.at) : F.whenLabel(s.at, false) || "Hoje")} · Sessão ${s.n} de ${total} · ${esc(s.title)}</span></a>
      <button class="btn sm primary" data-action="plan-start" data-id="${plan.id}" data-n="${s.n}" aria-label="Começar sessão de ${esc(p.name)}">${icon("play")}<span class="hide-sm">Começar</span></button></div>`;
  }

  F.views.agenda = () => {
    const b = F.agendaBuckets();
    const all = F.agendaItems().filter(x => x.s.status === "planned" && x.s.at);
    const today = F.todayYmd();
    const later = all.filter(x => dateOnly(x.s.at) > today);
    const byDay = new Map();
    later.forEach(x => { const d = dateOnly(x.s.at); if (!byDay.has(d)) byDay.set(d, []); byDay.get(d).push(x); });
    const perm = ("Notification" in window) ? Notification.permission : "unsupported";
    const hasPlans = (F.S.treatments || []).some(t => t.active);
    return `<div class="page-head"><div><h1>Agenda</h1><p class="muted">Sessões marcadas nos planos de tratamento.</p></div>
        <div class="row">${perm === "default" ? `<button class="btn" data-action="notif-on">${icon("bell")}Ativar avisos</button>` : ""}
        ${hasPlans ? `<button class="btn" data-action="plan-ics-all">${icon("download")}Pôr tudo na agenda do celular</button>` : ""}</div></div>
      ${perm === "granted" ? `<p class="tiny" style="margin:-8px 0 14px">${icon("check")}Avisos do navegador ativados: com o Falalá aberto, você recebe um aviso no dia e 15 minutos antes de cada sessão.</p>` : ""}
      ${perm === "denied" ? `<div class="notice small" style="margin-bottom:14px">Os avisos do navegador estão bloqueados. Libere nas configurações do site, ou use "Pôr tudo na agenda do celular" para receber o lembrete pelo calendário.</div>` : ""}
      ${!hasPlans ? `<div class="card empty">${F.mascot("happy")}<h3>Sua agenda começa no plano de tratamento</h3><p>Abra um paciente, toque em <b>Montar plano</b> e escolha quantas sessões e os dias. Elas aparecem aqui.</p><a class="btn primary" href="#pacientes">${icon("users")}Ver pacientes</a></div>` : `
      ${b.overdue.length ? `<div class="card" style="margin-bottom:16px"><h3 style="margin-bottom:4px">Atrasadas</h3><p class="tiny" style="margin-bottom:8px">A data passou e a sessão não foi feita. Comece agora, remarque ou marque a falta.</p>
        <div class="list">${b.overdue.map(x => `<div class="li arow"><span class="av-kid">${F.avatar(x.p.avatar)}</span><a class="grow" href="#paciente-${x.p.id}" style="color:inherit;text-decoration:none"><span class="t">${esc(x.p.name)}</span><br><span class="tiny">${esc(F.whenLabel(x.s.at))} · Sessão ${x.s.n} de ${x.total}</span></a>
          <div class="row" style="gap:6px"><button class="btn sm" data-action="plan-move" data-id="${x.plan.id}" data-n="${x.s.n}">Remarcar</button><button class="btn sm" data-action="plan-missed" data-id="${x.plan.id}" data-n="${x.s.n}">Faltou</button><button class="btn sm primary" data-action="plan-start" data-id="${x.plan.id}" data-n="${x.s.n}">${icon("play")}<span class="hide-sm">Começar</span></button></div></div>`).join("")}</div></div>` : ""}
      <div class="card" style="margin-bottom:16px"><h3 style="margin-bottom:8px">Hoje</h3>
        ${b.today.length ? `<div class="list">${b.today.map(x => agendaRow(x, false)).join("")}</div>` : `<p class="muted small">Nenhuma sessão hoje.</p>`}</div>
      ${byDay.size ? `<div class="card"><h3 style="margin-bottom:8px">Próximas</h3>${[...byDay.entries()].slice(0, 30).map(([d, xs]) => `<p class="day-h">${esc(F.whenLabel(d + "T", true).replace(/ · $/, ""))}</p><div class="list">${xs.map(x => agendaRow(x, false)).join("")}</div>`).join("")}</div>` : ""}`}`;
  };

  /* ---------- montar plano ---------- */
  const FOCUS_TO_COMPLAINT = { r: "r", s: "s", l: "l", ch: "ch", trocas: "trocas", silabas: "silabas", resp: "resp", oral: "oral" };
  F.planForm = async (pid) => {
    if (!F.hasAccess()) return F.paywall();
    const p = F.patientById(pid);
    if (!p) return;
    const sel = new Set((p.focus || []).map(f => FOCUS_TO_COMPLAINT[f]).filter(Boolean));
    const today = new Date();
    const st = { total: 10, weekdays: [today.getDay()], every: 1, start: ymd(today), time: "14:00", dur: 40, evalFirst: false, reevalLast: true };
    const preview = (root) => {
      const complaints = [...sel];
      const box = F.$("#tpprev", root);
      if (!complaints.length) { box.innerHTML = `<p class="muted small">Marque pelo menos uma queixa para ver o plano.</p>`; return; }
      const list = F.buildPlan({ complaints, total: st.total, evalFirst: st.evalFirst, reevalLast: st.reevalLast });
      const dates = F.planDates({ start: st.start, time: st.time, weekdays: st.weekdays, every: st.every, count: list.length });
      const days = st.weekdays.length ? st.weekdays : [parseYmd(st.start).getDay()];
      box.innerHTML = `<p class="small"><b>${list.length} sessões</b> · ${st.every === 2 ? "a cada 2 semanas" : "toda semana"} ${days.length > 1 ? "às " : "na "}${days.sort().map(d => WDL[d]).join(" e ")} · ${esc(st.time)}<br>
        <span class="muted">De ${esc(F.whenLabel(dates[0], true).split(" · ")[0])} até ${esc(F.whenLabel(dates[dates.length - 1], true).split(" · ")[0])}</span></p>
        <ol class="tprev">${list.map((s, i) => `<li><span class="tiny">${esc(F.whenLabel(dates[i]).split(" · ")[0])}</span>${esc(s.title)}</li>`).join("")}</ol>`;
    };
    const res = await F.modal({
      title: `Plano de tratamento · ${p.name}`,
      wide: true,
      body: `<form class="form" onsubmit="return false">
        <div class="field"><label>Queixas e dificuldades</label>
          <div class="cgrid">${F.COMPLAINTS.map(c => `<label class="check cpick"><input type="checkbox" value="${c.id}" ${sel.has(c.id) ? "checked" : ""}><span><b>${esc(c.label)}</b><br><span class="tiny">${esc(c.hint)}</span></span></label>`).join("")}</div>
          <span class="tiny">A ordem dos sons segue a lista. O Falalá começa pelo primeiro marcado.</span></div>
        <div class="row" style="align-items:flex-start;gap:14px">
          <div class="field" style="width:150px"><label for="tpn">Número de sessões</label><input class="input" id="tpn" type="number" min="1" max="60" value="${st.total}" inputmode="numeric"></div>
          <div class="field" style="width:170px"><label for="tpd">1ª sessão</label><input class="input" id="tpd" type="date" value="${st.start}"></div>
          <div class="field" style="width:120px"><label for="tpt">Horário</label><input class="input" id="tpt" type="time" value="${st.time}"></div>
          <div class="field" style="width:130px"><label for="tpdur">Duração</label><select class="input" id="tpdur">${[30, 40, 45, 50, 60].map(m => `<option value="${m}" ${m === st.dur ? "selected" : ""}>${m} min</option>`).join("")}</select></div>
        </div>
        <div class="field"><label>Dias da semana</label><div class="seg wdays">${WD.map((d, i) => `<button type="button" data-wd="${i}" aria-pressed="${st.weekdays.includes(i)}">${d}</button>`).join("")}</div></div>
        <div class="field"><label>Frequência</label><div class="seg" id="tpevery"><button type="button" data-every="1" aria-pressed="true">Toda semana</button><button type="button" data-every="2" aria-pressed="false">A cada 2 semanas</button></div></div>
        <label class="check"><input type="checkbox" id="tpeval">Começar com uma sessão de avaliação</label>
        <label class="check"><input type="checkbox" id="tpre" checked>Terminar com reavaliação e devolutiva para a família</label>
        <div class="tpbox" id="tpprev"></div>
        <div class="err" id="tperr"></div>
      </form>`,
      onMount(root) {
        const sync = () => {
          st.total = Math.max(1, Math.min(60, parseInt(F.$("#tpn", root).value, 10) || 1));
          st.start = F.$("#tpd", root).value || ymd(new Date());
          st.time = F.$("#tpt", root).value || "14:00";
          st.dur = +F.$("#tpdur", root).value;
          st.evalFirst = F.$("#tpeval", root).checked;
          st.reevalLast = F.$("#tpre", root).checked;
          sel.clear(); F.$$(".cpick input:checked", root).forEach(i => sel.add(i.value));
          preview(root);
        };
        root.addEventListener("input", sync);
        root.addEventListener("change", (e) => {
          if (e.target.id === "tpd") {
            // ao trocar a data, o dia da semana acompanha se só havia um marcado
            if (st.weekdays.length <= 1) { st.weekdays = [parseYmd(e.target.value || ymd(new Date())).getDay()]; F.$$("[data-wd]", root).forEach(b => b.setAttribute("aria-pressed", st.weekdays.includes(+b.dataset.wd))); }
          }
          sync();
        });
        root.addEventListener("click", (e) => {
          const w = e.target.closest("[data-wd]");
          if (w) {
            const d = +w.dataset.wd;
            st.weekdays = st.weekdays.includes(d) ? st.weekdays.filter(x => x !== d) : [...st.weekdays, d];
            if (!st.weekdays.length) st.weekdays = [d];
            F.$$("[data-wd]", root).forEach(b => b.setAttribute("aria-pressed", st.weekdays.includes(+b.dataset.wd)));
            preview(root);
          }
          const ev = e.target.closest("[data-every]");
          if (ev) { st.every = +ev.dataset.every; F.$$("[data-every]", root).forEach(b => b.setAttribute("aria-pressed", b === ev)); preview(root); }
        });
        preview(root);
      },
      actions: [
        { label: "Cancelar", value: null },
        {
          label: "Criar plano", kind: "primary", run: async (root) => {
            const complaints = [...sel];
            const err = F.$("#tperr", root);
            if (!complaints.length) { err.textContent = "Marque pelo menos uma queixa."; return false; }
            // a ordem segue a lista de queixas
            complaints.sort((a, b) => F.COMPLAINTS.findIndex(c => c.id === a) - F.COMPLAINTS.findIndex(c => c.id === b));
            const list = F.buildPlan({ complaints, total: st.total, evalFirst: st.evalFirst, reevalLast: st.reevalLast });
            const dates = F.planDates({ start: st.start, time: st.time, weekdays: st.weekdays, every: st.every, count: list.length });
            list.forEach((s, i) => { s.at = dates[i]; });
            return api.treatment.create({ patient_id: p.id, complaints, total_sessions: list.length, weekdays: st.weekdays, every_weeks: st.every, session_time: st.time, duration_min: st.dur, start_date: st.start, sessions: list, active: true });
          }
        }
      ]
    });
    if (res) { await F.reload(); F.toast("Plano criado! As sessões já estão na agenda."); F.render(); F.notifyCheck(true); }
  };

  F.planMove = async (planId, n) => {
    const plan = (F.S.treatments || []).find(t => t.id === planId);
    const s = plan && plan.sessions.find(x => x.n === n);
    if (!s) return;
    const [ds, ts] = (s.at || `${F.todayYmd()}T${plan.session_time || "14:00"}`).split("T");
    const later = plan.sessions.filter(x => x.n > n && x.status === "planned").length;
    const ok = await F.modal({
      title: `Remarcar sessão ${n}`,
      body: `<div class="form"><div class="row" style="gap:12px"><div class="field"><label for="mvd">Nova data</label><input class="input" id="mvd" type="date" value="${ds}"></div>
        <div class="field" style="width:130px"><label for="mvt">Horário</label><input class="input" id="mvt" type="time" value="${ts || "14:00"}"></div></div>
        ${later ? `<label class="check"><input type="checkbox" id="mvall" checked>Empurrar também as próximas ${later} ${later === 1 ? "sessão" : "sessões"} na mesma quantidade de dias</label>` : ""}</div>`,
      actions: [{ label: "Cancelar", value: null }, {
        label: "Remarcar", kind: "primary", run: async (root) => {
          const nd = F.$("#mvd", root).value, nt = F.$("#mvt", root).value || "14:00";
          if (!nd) return false;
          const delta = Math.round((parseYmd(nd) - parseYmd(ds)) / 86400000);
          const all = F.$("#mvall", root)?.checked;
          const sessions = plan.sessions.map(x => {
            if (x.n === n) return { ...x, at: `${nd}T${nt}` };
            if (all && x.n > n && x.status === "planned" && x.at) return { ...x, at: shiftAt(x.at, delta) };
            return x;
          });
          await savePlanSessions(plan, sessions);
        }
      }]
    });
    if (ok) { await F.reload(); F.toast("Sessão remarcada."); F.render(); }
  };

  F.planSetStatus = async (planId, n, status) => {
    const plan = (F.S.treatments || []).find(t => t.id === planId);
    if (!plan) return;
    const sessions = plan.sessions.map(x => x.n === n ? { ...x, status, ...(status === "planned" ? { session_id: null, done_at: null } : {}) } : x);
    await savePlanSessions(plan, sessions);
    await F.reload(); F.render();
  };

  F.planStart = (planId, n) => {
    const plan = (F.S.treatments || []).find(t => t.id === planId);
    const s = plan && plan.sessions.find(x => x.n === n);
    if (!s) return;
    F.startSession({
      mode: "clinic", patientId: plan.patient_id, track: s.track || "r", exIds: s.blocks,
      program: s.program_id ? { id: s.program_id, n: s.program_session } : null,
      plan: { id: plan.id, n: s.n }
    });
  };

  /* ---------- agenda do celular (.ics) ---------- */
  const icsEsc = (t) => String(t || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (m) => "\\" + m);
  const icsDT = (at, plusMin = 0) => {
    const [ds, ts] = at.split("T"); const [h, m] = (ts || "14:00").split(":").map(Number);
    const d = parseYmd(ds); d.setHours(h, m + plusMin, 0, 0);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };
  F.downloadICS = (plans) => {
    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Falala//Agenda//PT-BR", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Falalá"];
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    let count = 0;
    plans.forEach(plan => {
      const p = F.patientById(plan.patient_id);
      plan.sessions.filter(s => s.status === "planned" && s.at).forEach(s => {
        count++;
        lines.push("BEGIN:VEVENT", `UID:${plan.id}-${s.n}@usefalala.online`, `DTSTAMP:${stamp}`,
          `DTSTART:${icsDT(s.at)}`, `DTEND:${icsDT(s.at, plan.duration_min || 40)}`,
          `SUMMARY:${icsEsc(`Fono: ${p?.name || "Paciente"} · Sessão ${s.n} de ${plan.sessions.length}`)}`,
          `DESCRIPTION:${icsEsc(`${s.title}\n${s.goal || ""}\nAbrir no Falalá: ${(window.FALALA_CONFIG?.appUrl || location.origin + "/")}#paciente-${plan.patient_id}`)}`,
          "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(`Sessão de ${p?.name || "fono"} em 30 minutos`)}`, "TRIGGER:-PT30M", "END:VALARM",
          "END:VEVENT");
      });
    });
    lines.push("END:VCALENDAR");
    if (!count) return F.toast("Não há sessões agendadas para exportar.", true);
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    const one = plans.length === 1 ? F.patientById(plans[0].patient_id)?.name : null;
    a.href = URL.createObjectURL(blob);
    a.download = `falala-${(one || "agenda").toLowerCase().normalize("NFD").replace(/[^\w]+/g, "-")}.ics`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    F.toast(`${count} ${count === 1 ? "sessão exportada" : "sessões exportadas"}. Abra o arquivo para pôr na agenda do celular.`);
  };

  /* ---------- avisos do navegador ---------- */
  const timers = [];
  const seen = (k) => { try { return localStorage.getItem(k) === "1"; } catch (e) { return false; } };
  const mark = (k) => { try { localStorage.setItem(k, "1"); } catch (e) {} };
  const show = (title, body, tag) => {
    try {
      const n = new Notification(title, { body, tag });
      n.onclick = () => { window.focus(); location.hash = "#agenda"; n.close(); };
    } catch (e) { /* alguns celulares só permitem aviso por service worker */ }
  };
  F.notifyCheck = (force) => {
    timers.splice(0).forEach(clearTimeout);
    if (!F.S.user || !F.S.loaded) return;
    const b = F.agendaBuckets();
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const today = F.todayYmd();
    const keyDay = `falala-aviso-${today}`;
    if (b.today.length && (!seen(keyDay) || force)) {
      mark(keyDay);
      const names = b.today.map(x => `${x.p.name} às ${(x.s.at || "").split("T")[1] || "?"}`);
      show(`Hoje: ${b.today.length} ${b.today.length === 1 ? "sessão" : "sessões"}`, names.join(" · "), keyDay);
    }
    b.today.forEach(x => {
      const [ds, ts] = x.s.at.split("T");
      const [h, m] = (ts || "00:00").split(":").map(Number);
      const when = parseYmd(ds); when.setHours(h, m - 15, 0, 0);
      const ms = when - Date.now();
      const key = `falala-aviso-${x.plan.id}-${x.s.n}-${ds}`;
      if (ms > 0 && ms < 12 * 3600000 && !seen(key)) timers.push(setTimeout(() => { mark(key); show(`Em 15 minutos: ${x.p.name}`, `Sessão ${x.s.n} de ${x.total} · ${x.s.title}`, key); }, ms));
    });
  };
  F.notifyEnable = async () => {
    if (!("Notification" in window)) return F.toast("Este navegador não mostra avisos. Use \"Pôr tudo na agenda do celular\".", true);
    const r = await Notification.requestPermission();
    if (r === "granted") { F.toast("Avisos ativados."); F.notifyCheck(true); }
    else F.toast("Os avisos não foram permitidos. Você pode usar a agenda do celular.", true);
    F.render();
  };
  setInterval(() => F.notifyCheck(false), 10 * 60000);
})(window.F);
