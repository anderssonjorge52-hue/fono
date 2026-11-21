/* Falalá — inicialização, rotas e ações. */
(function (F) {
  const api = window.FALALA_API;
  const app = document.getElementById("root");
  F.ui = F.ui || {};
  // vindo do pós-compra: abre direto em "Criar conta" (e preenche o e-mail se vier na URL)
  try {
    const q = new URLSearchParams(location.search);
    if (q.has("cadastro") || location.hash === "#criar-conta") F.ui.authTab = "up";
    const em = q.get("email") || q.get("client_email") || "";
    if (/^\S+@\S+\.\S+$/.test(em)) F.ui.prefillEmail = em.trim().toLowerCase();
    if (location.hash === "#criar-conta") history.replaceState(null, "", location.pathname + location.search);
  } catch (e) {}

  const ROUTES = ["painel", "agenda", "pacientes", "sessao", "biblioteca", "historico", "conta"];
  function parse() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (h.startsWith("paciente-")) return { r: "paciente", id: h.slice(9) };
    if (h.startsWith("trilha-")) return { r: "biblioteca", id: h.slice(7) };
    if (h.startsWith("casa-")) return { r: "casa", id: h.slice(5) };
    if (h.startsWith("roteiro-")) return { r: "roteiro", id: h.slice(8) };
    if (h.startsWith("relatorio-")) return { r: "relatorio", id: h.slice(10) };
    if (ROUTES.includes(h)) return { r: h };
    if (h === "entrar") return { r: "entrar" };
    return { r: "painel" };
  }

  let loading = false;
  F.render = async () => {
    const { r, id } = parse();
    if (r === "casa") { await F.renderCasa(id); return; }
    F.homeToken = null; F.homeCustom = null;
    if (!F.S.user) {
      app.innerHTML = F.views.auth();
      document.title = "Falalá · Entrar";
      return;
    }
    if (r === "entrar") { location.replace("#painel"); return; }
    if (!F.S.loaded) {
      app.innerHTML = `<div class="loading"><div class="spin"></div><span>Carregando seu consultório…</span></div>`;
      if (loading) return;
      loading = true;
      try { await F.reload(); setTimeout(() => F.notifyCheck && F.notifyCheck(false), 1500); }
      catch (e) { app.innerHTML = `<div class="loading"><p>${F.esc(e.message || "Não foi possível carregar.")}</p><button class="btn" onclick="location.reload()">Tentar de novo</button></div>`; loading = false; return; }
      loading = false;
    }
    if (r === "relatorio") {
      app.innerHTML = F.views.relatorio(id);
      document.title = "Falalá · Relatório";
      window.scrollTo(0, 0);
      F.drawEvolution();
      return;
    }
    const view = F.views[r] || F.views.painel;
    const scrollKeep = r === F.ui.lastRoute ? window.scrollY : 0;
    app.innerHTML = F.shell(r, view(id));
    F.ui.lastRoute = r;
    window.scrollTo(0, scrollKeep);
    const titles = { painel: "Painel", agenda: "Agenda", pacientes: "Pacientes", paciente: "Paciente", sessao: "Nova sessão", biblioteca: "Biblioteca", historico: "Histórico", conta: "Conta" };
    document.title = "Falalá · " + (titles[r] || "Painel");
    F.drawEvolution();
    if (!F.ui.paywallShown && F.planState && F.planState().kind === "expired" && r !== "conta") { F.ui.paywallShown = true; F.paywall(); }
  };

  /* ---------- ações por clique ---------- */
  document.addEventListener("click", async (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const a = el.dataset.action, id = el.dataset.id;
    const run = async (fn, okMsg) => {
      try { await fn(); await F.reload(); okMsg && F.toast(okMsg); F.render(); }
      catch (err) { F.toast(err.message || "Algo deu errado.", true); }
    };
    switch (a) {
      case "say": F.say(el.dataset.text); break;
      case "paywall": F.paywall(); break;
      case "no-checkout": F.toast("O link de pagamento ainda não foi configurado. Fale com o suporte para assinar."); break;
      case "new-patient": F.patientForm(); break;
      case "edit-patient": F.patientForm(F.S.patients.find(p => p.id === id)); break;
      case "archive-patient": {
        const p = F.S.patients.find(x => x.id === id);
        run(() => api.patients.update(id, { archived: !p.archived }), p.archived ? "Paciente reativado." : "Paciente arquivado.");
        break;
      }
      case "delete-patient": {
        const p = F.S.patients.find(x => x.id === id);
        if (await F.confirm(`Excluir ${p.name}?`, "O paciente e todas as sessões dele serão apagados para sempre. Se quiser só tirar da lista, use Arquivar.", "Excluir para sempre", "danger")) {
          try { await api.patients.remove(id); await F.reload(); F.toast("Paciente excluído."); location.hash = "#pacientes"; F.render(); }
          catch (err) { F.toast(err.message, true); }
        }
        break;
      }
      case "toggle-arch": F.ui.showArchived = el.textContent.trim() === "Arquivados"; F.render(); break;
      case "session-for": F.ui.setup = { patient: id, track: null, ex: new Set(), shuffle: false }; break;
      case "session-track": F.ui.setup = { patient: null, track: id, ex: new Set(), shuffle: false }; break;
      case "pick-patient": {
        const s = F.ui.setup;
        s.patient = id;
        const p = F.S.patients.find(x => x.id === id);
        if (!s.track) s.track = (p.focus && p.focus[0]) || "r";
        F.render();
        break;
      }
      case "pick-track": F.ui.setup.track = id; F.ui.setup.ex = new Set(); F.render(); break;
      case "select-all": { F.exercisesOf(F.ui.setup.track).forEach(x => F.ui.setup.ex.add(x.id)); F.render(); break; }
      case "start-session": {
        const s = F.ui.setup;
        if (s.mode === "program") {
          const prog = F.program(s.program);
          const n = s.programN || F.programNext(s.patient, prog);
          F.startSession({ mode: "clinic", patientId: s.patient, track: prog.track, exIds: prog.sessions[n - 1].blocks, program: { id: prog.id, n } });
        } else {
          F.startSession({ mode: "clinic", patientId: s.patient, track: s.track, exIds: F.exercisesOf(s.track).filter(x => s.ex.has(x.id)).map(x => x.id), shuffle: s.shuffle });
        }
        break;
      }
      case "setup-mode": F.ui.setup.mode = id; F.render(); break;
      case "pick-program": F.ui.setup.program = id; F.ui.setup.programN = null; F.render(); break;
      case "pick-program-n": F.ui.setup.programN = +id; F.render(); break;
      case "use-program": F.ui.setup = { patient: el.dataset.pid || (F.ui.setup && F.ui.setup.patient) || null, track: null, ex: new Set(), shuffle: false, mode: "program", program: id, programN: +el.dataset.n }; if (location.hash === "#sessao") F.render(); break;
      case "scroll-sess": e.preventDefault(); F.$("#sessao-" + id)?.scrollIntoView({ behavior: "smooth", block: "start" }); break;
      case "home-from-program": {
        const prog = F.program(el.dataset.prog);
        const ses = prog.sessions[(+el.dataset.n || 1) - 1];
        F.homeForm(id, { track: prog.track, ids: ses.home || [] });
        break;
      }
      case "plan-new": F.planForm(id); break;
      case "plan-start": F.planStart(id, +el.dataset.n); break;
      case "plan-move": F.planMove(id, +el.dataset.n); break;
      case "plan-toggle": { F.ui.planOpen = F.ui.planOpen || {}; const k = id + ":" + el.dataset.n; F.ui.planOpen[k] = !F.ui.planOpen[k]; F.render(); break; }
      case "plan-missed": run(() => F.planSetStatus(id, +el.dataset.n, "missed"), "Falta registrada."); break;
      case "plan-reopen": run(() => F.planSetStatus(id, +el.dataset.n, "planned"), "Sessão voltou para agendada."); break;
      case "plan-home": {
        const plan = F.S.treatments.find(t => t.id === id);
        const s = plan && plan.sessions.find(x => x.n === +el.dataset.n);
        if (s) F.homeForm(plan.patient_id, { track: s.track || "r", ids: s.home || [] });
        break;
      }
      case "plan-ics": F.downloadICS(F.S.treatments.filter(t => t.id === id)); break;
      case "plan-ics-all": F.downloadICS(F.S.treatments.filter(t => t.active)); break;
      case "plan-delete":
        if (await F.confirm("Excluir o plano de tratamento?", "As datas e o roteiro do plano somem. As sessões já feitas continuam no histórico do paciente.", "Excluir plano", "danger")) run(() => api.treatment.remove(id), "Plano excluído.");
        break;
      case "notif-on": F.notifyEnable(); break;
      case "new-list": F.listForm(null, id || null); break;
      case "edit-list": F.listForm(F.S.custom.find(c => c.id === id)); break;
      case "delete-list":
        if (await F.confirm("Excluir esta lista?", "A lista sai da biblioteca. Sessões já feitas continuam no histórico.", "Excluir", "danger")) run(() => api.custom.remove(id), "Lista excluída.");
        break;
      case "home-new": case "home-edit": F.homeForm(id); break;
      case "home-stop":
        if (await F.confirm("Encerrar a tarefa de casa?", "O link deixa de funcionar para a família. Os treinos feitos continuam guardados.", "Encerrar", "danger")) run(() => api.home.update(id, { active: false }), "Tarefa encerrada.");
        break;
      case "home-copy": F.copy(F.homeLink(id)); break;
      case "play-audio": F.playAudio(el.dataset.path); break;
      case "casa-start": F.startCasa(); break;
      case "print": {
        const ta = F.$("#repnote");
        let tmp = null;
        if (ta) { tmp = document.createElement("div"); tmp.className = "rep-note-print"; tmp.textContent = ta.value; ta.after(tmp); ta.closest("section").classList.toggle("no-print", !ta.value.trim()); }
        try { window.print(); } catch (e) { F.toast("Use o menu do navegador para imprimir ou salvar em PDF.", true); }
        setTimeout(() => tmp && tmp.remove(), 500);
        break;
      }
      case "export-csv": F.exportCSV(); break;
      case "note-session": {
        const s = F.S.sessions.find(x => x.id === id);
        const v = await F.modal({
          title: "Anotação da sessão",
          body: `<textarea class="input" id="snote" maxlength="2000">${F.esc(s.notes || "")}</textarea>`,
          actions: [{ label: "Cancelar", value: null }, { label: "Salvar", kind: "primary", run: (root) => api.sessions.update(id, { notes: F.$("#snote", root).value.trim() || null }) }]
        });
        if (v) { await F.reload(); F.toast("Anotação salva."); F.render(); }
        break;
      }
      case "delete-session":
        if (await F.confirm("Excluir esta sessão?", "Os resultados desta sessão serão apagados.", "Excluir", "danger")) run(() => api.sessions.remove(id), "Sessão excluída.");
        break;
      case "save-profile": {
        const full_name = F.$("#fn").value.trim();
        if (!full_name) { F.toast("Escreva seu nome.", true); break; }
        run(() => api.updateProfile({ full_name, crfa: F.$("#crfa").value.trim(), clinic: F.$("#clinic").value.trim() }), "Dados salvos.");
        break;
      }
      case "change-password": passwordModal("Trocar senha"); break;
      case "logout": await api.auth.signOut(); F.S.user = null; F.S.loaded = false; location.hash = "#entrar"; F.render(); break;
      case "reset-demo":
        if (await F.confirm("Recomeçar a demonstração?", "Todos os dados deste navegador serão apagados.", "Recomeçar", "danger")) { api.reset(); location.hash = "#entrar"; location.reload(); }
        break;
      case "auth-tab": F.ui.authTab = id; F.render(); break;
      case "demo-login": await api.auth.signIn({ email: "demo@falala.app" }); break;
      case "forgot": {
        const email = F.$("#le")?.value.trim() || "";
        F.modal({
          title: "Recuperar senha",
          body: `<div class="form"><p class="muted">Enviaremos um link para você criar uma nova senha.</p><div class="field"><label for="fe">E-mail</label><input class="input" id="fe" type="email" value="${F.esc(email)}"></div><div class="err" id="ferr"></div></div>`,
          actions: [{ label: "Cancelar", value: null }, {
            label: "Enviar link", kind: "primary", run: async (root) => {
              const v = F.$("#fe", root).value.trim();
              if (!/^\S+@\S+\.\S+$/.test(v)) { F.$("#ferr", root).textContent = "Escreva um e-mail válido."; return false; }
              await api.auth.resetPassword(v);
              F.toast("Se houver uma conta com esse e-mail, o link chega em instantes.");
            }
          }]
        });
        break;
      }
    }
  });

  function passwordModal(title) {
    return F.modal({
      title,
      body: `<div class="form"><div class="field"><label for="np">Nova senha</label><input class="input" id="np" type="password" autocomplete="new-password" minlength="6"></div><div class="field"><label for="np2">Repita a senha</label><input class="input" id="np2" type="password" autocomplete="new-password"></div><div class="err" id="nperr"></div></div>`,
      actions: [{ label: "Cancelar", value: null }, {
        label: "Salvar senha", kind: "primary", run: async (root) => {
          const a = F.$("#np", root).value, b = F.$("#np2", root).value, err = F.$("#nperr", root);
          if (a.length < 6) { err.textContent = "Use pelo menos 6 caracteres."; return false; }
          if (a !== b) { err.textContent = "As senhas não são iguais."; return false; }
          await api.auth.updatePassword(a);
          F.toast("Senha atualizada!");
        }
      }]
    });
  }

  /* ---------- formulários de entrada ---------- */
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (form.id !== "loginForm" && form.id !== "signupForm") return;
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const err = form.querySelector(".err");
    err.textContent = "";
    const val = (sel) => F.$(sel, form).value.trim();
    try {
      if (form.id === "loginForm") {
        const email = val("#le"), password = F.$("#lp", form).value;
        if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Escreva um e-mail válido."; return; }
        if (!password && api.mode !== "demo") { err.textContent = "Escreva sua senha."; return; }
        btn.disabled = true; btn.textContent = "Entrando…";
        await api.auth.signIn({ email, password });
      } else {
        const name = val("#sn"), email = val("#se"), password = F.$("#sp", form).value, crfa = val("#sc");
        if (!name) { err.textContent = "Escreva seu nome."; return; }
        if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = "Escreva um e-mail válido."; return; }
        if (password.length < 6) { err.textContent = "A senha precisa ter pelo menos 6 caracteres."; return; }
        btn.disabled = true; btn.textContent = "Criando sua conta…";
        const r = await api.auth.signUp({ name, email, password, crfa });
        try { if (window.fbq) { fbq("track", "CompleteRegistration", { content_name: "Teste grátis 3 dias", status: true }); fbq("track", "StartTrial", { value: 0, currency: "BRL", predicted_ltv: 197 }); } } catch (e) {}
        if (r.needsConfirmation) {
          form.innerHTML = `<div class="notice ok"><b>Quase lá!</b> Enviamos um link de confirmação para <b>${F.esc(email)}</b>. Abra seu e-mail, confirme e volte para entrar.</div><button class="btn" type="button" data-action="auth-tab" data-id="in">Ir para Entrar</button>`;
        }
      }
    } catch (ex) {
      err.textContent = ex.message || "Algo deu errado.";
    } finally {
      if (btn && btn.isConnected) { btn.disabled = false; btn.textContent = form.id === "loginForm" ? "Entrar" : "Criar conta e testar grátis"; }
    }
  });

  /* ---------- campos que filtram ao digitar ---------- */
  let qTimer;
  document.addEventListener("input", (e) => {
    if (e.target.id === "repnote") { const pid = parse().id; F.ui["note-" + pid] = e.target.value; return; }
    if (e.target.id === "q") {
      clearTimeout(qTimer);
      const v = e.target.value, pos = e.target.selectionStart;
      qTimer = setTimeout(() => { F.ui.q = v; F.render().then(() => { const q = F.$("#q"); if (q) { q.focus(); q.setSelectionRange(pos, pos); } }); }, 180);
    }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.ex) { t.checked ? F.ui.setup.ex.add(t.dataset.ex) : F.ui.setup.ex.delete(t.dataset.ex); F.render(); }
    else if (t.id === "shuffle") F.ui.setup.shuffle = t.checked;
    else if (t.id === "hPatient") { F.ui.hPatient = t.value; F.render(); }
    else if (t.id === "hTrack") { F.ui.hTrack = t.value; F.render(); }
  });

  window.addEventListener("hashchange", () => {
    const { r } = parse();
    if (r === "sessao" && !F.ui.setup) F.ui.setup = { patient: null, track: null, ex: new Set(), shuffle: false };
    F.render();
  });

  /* ---------- sessão de login ---------- */
  api.auth.onChange(async (event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      F.S.user = session?.user || F.S.user;
      history.replaceState(null, "", location.pathname + "#painel");
      await F.render();
      passwordModal("Crie sua nova senha");
      return;
    }
    if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
      const wasOut = !F.S.user;
      F.S.user = session?.user || null;
      if (F.S.user && /access_token|type=/.test(location.hash)) history.replaceState(null, "", location.pathname + "#painel");
      if (wasOut && F.S.user) { F.S.loaded = false; if (parse().r === "entrar") history.replaceState(null, "", location.pathname + "#painel"); F.render(); }
    }
    if (event === "SIGNED_OUT") { F.S.user = null; F.S.loaded = false; F.render(); }
  });

  (async function boot() {
    try {
      const s = await api.auth.session();
      F.S.user = s?.user || null;
    } catch (e) { F.S.user = null; }
    F.render();
  })();
})(window.F);

document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest('a[href*="checkout.wiven"]');
  if (!a || !window.fbq) return;
  const anual = /RL5YEJL/.test(a.href);
  try { fbq("track", "InitiateCheckout", { content_name: anual ? "Falalá anual" : "Falalá mensal", value: anual ? 197 : 47, currency: "BRL" }); } catch (err) {}
});
