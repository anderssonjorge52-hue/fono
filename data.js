/* Camada de dados do Falalá: mesma interface para Supabase (produção) e demonstração (navegador). */
(function () {
  const CFG = window.FALALA_CONFIG || { mode: "demo" };
  const DAY = 86400000;

  /* ---------------- Supabase ---------------- */
  function supabaseAdapter() {
    const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
    const must = ({ data, error }) => { if (error) throw friendly(error); return data; };
    const uid = async () => (await sb.auth.getUser()).data.user?.id;

    return {
      mode: "supabase",
      auth: {
        async session() { return (await sb.auth.getSession()).data.session; },
        onChange(cb) { sb.auth.onAuthStateChange((event, session) => cb(event, session)); },
        async signUp({ name, email, password, crfa }) {
          const data = must(await sb.auth.signUp({
            email, password,
            options: { data: { full_name: name, crfa: crfa || "" }, emailRedirectTo: location.origin + location.pathname }
          }));
          return { needsConfirmation: !data.session };
        },
        async signIn({ email, password }) { must(await sb.auth.signInWithPassword({ email, password })); },
        async signOut() { await sb.auth.signOut(); },
        async resetPassword(email) {
          must(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
        },
        async updatePassword(password) { must(await sb.auth.updateUser({ password })); },
        async user() { return (await sb.auth.getUser()).data.user; }
      },
      async profile() {
        return must(await sb.from("profiles").select("id, full_name, crfa, clinic, trial_ends_at, created_at").single());
      },
      async updateProfile(p) {
        const id = await uid();
        must(await sb.from("profiles").update({ full_name: p.full_name, crfa: p.crfa || null, clinic: p.clinic || null }).eq("id", id));
      },
      async accountStatus() { return must(await sb.rpc("account_status")); },
      patients: {
        async list() {
          return must(await sb.from("patients").select("*").order("archived").order("name"));
        },
        async create(p) { return must(await sb.from("patients").insert(clean(p)).select().single()); },
        async update(id, p) { return must(await sb.from("patients").update(clean(p)).eq("id", id).select().single()); },
        async remove(id) { must(await sb.from("patients").delete().eq("id", id)); }
      },
      sessions: {
        async list() {
          return must(await sb.from("sessions").select("*").order("started_at", { ascending: false }).limit(1000));
        },
        async create(s) { return must(await sb.from("sessions").insert(s).select().single()); },
        async update(id, s) { return must(await sb.from("sessions").update(s).eq("id", id).select().single()); },
        async remove(id) { must(await sb.from("sessions").delete().eq("id", id)); }
      },
      custom: {
        async list() { return must(await sb.from("custom_exercises").select("*").order("created_at")); },
        async create(c) { return must(await sb.from("custom_exercises").insert(cleanCustom(c)).select().single()); },
        async update(id, c) { return must(await sb.from("custom_exercises").update(cleanCustom(c)).eq("id", id).select().single()); },
        async remove(id) { must(await sb.from("custom_exercises").delete().eq("id", id)); }
      },
      home: {
        async plans() { return must(await sb.from("home_plans").select("*").order("created_at", { ascending: false })); },
        async create(p) {
          must(await sb.from("home_plans").update({ active: false }).eq("patient_id", p.patient_id).eq("active", true));
          return must(await sb.from("home_plans").insert(cleanPlan(p)).select().single());
        },
        async update(id, p) { return must(await sb.from("home_plans").update(p).eq("id", id).select().single()); },
        async practices() { return must(await sb.from("home_practices").select("*").order("created_at", { ascending: false }).limit(1000)); },
        async removePractice(id) { must(await sb.from("home_practices").delete().eq("id", id)); },
        async get(token) { return must(await sb.rpc("get_home_plan", { p_token: token })); },
        async submit(token, r) {
          return must(await sb.rpc("submit_home_practice", { p_token: token, p_results: r.results, p_total: r.total, p_correct: r.correct, p_helped: r.helped, p_duration: r.duration_sec }));
        },
        async uploadAudio(token, practiceId, n, blob) {
          const fd = new FormData();
          fd.append("token", token); fd.append("practice_id", practiceId); fd.append("n", String(n));
          fd.append("file", blob, `${n}.${extFor(blob)}`);
          const r = await fetch(`${CFG.supabaseUrl}/functions/v1/casa-audio`, { method: "POST", headers: { apikey: CFG.supabaseKey, Authorization: `Bearer ${CFG.supabaseKey}` }, body: fd });
          if (!r.ok) throw new Error("Não foi possível enviar a gravação.");
          return (await r.json()).path;
        }
      },
      treatment: {
        async list() { return must(await sb.from("treatment_plans").select("*").order("created_at", { ascending: false })); },
        async create(p) {
          must(await sb.from("treatment_plans").update({ active: false }).eq("patient_id", p.patient_id).eq("active", true));
          return must(await sb.from("treatment_plans").insert(cleanTreat(p)).select().single());
        },
        async update(id, p) { return must(await sb.from("treatment_plans").update(cleanTreat(p)).eq("id", id).select().single()); },
        async remove(id) { must(await sb.from("treatment_plans").delete().eq("id", id)); }
      },
      audio: {
        async upload(path, blob) {
          must(await sb.storage.from("gravacoes").upload(path, blob, { contentType: (blob.type || "audio/webm").split(";")[0], upsert: true }));
          return path;
        },
        async url(path) {
          if (!path) return null;
          if (path.startsWith("blob:")) return path;
          const { data, error } = await sb.storage.from("gravacoes").createSignedUrl(path, 3600);
          if (error) return null;
          return data.signedUrl;
        },
        async uid() { return uid(); }
      },
      async voice(text, slow, token) {
        const session = (await sb.auth.getSession()).data.session;
        const r = await fetch(`${CFG.supabaseUrl}/functions/v1/voz`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: CFG.supabaseKey, Authorization: `Bearer ${session ? session.access_token : CFG.supabaseKey}` },
          body: JSON.stringify({ text, slow: !!slow, token: token || undefined })
        });
        if (!r.ok) throw new Error("sem voz");
        return (await r.json()).url;
      }
    };
  }

  function extFor(blob) {
    const t = (blob && blob.type) || "";
    return /mp4|m4a|aac/.test(t) ? "m4a" : /ogg/.test(t) ? "ogg" : "webm";
  }
  function cleanCustom(c) {
    const out = {};
    ["track", "type", "title", "items"].forEach(k => { if (c[k] !== undefined) out[k] = c[k]; });
    return out;
  }
  function cleanPlan(p) {
    const out = {};
    ["patient_id", "track", "exercise_ids", "message", "days_per_week", "show_progress", "record_audio", "active"].forEach(k => { if (p[k] !== undefined) out[k] = p[k]; });
    return out;
  }

  function cleanTreat(p) {
    const out = {};
    ["patient_id", "complaints", "total_sessions", "weekdays", "every_weeks", "session_time", "duration_min", "start_date", "sessions", "notes", "active"].forEach(k => { if (p[k] !== undefined) out[k] = p[k]; });
    return out;
  }

  function clean(p) {
    const out = {};
    ["name", "age", "focus", "notes", "avatar", "archived", "display"].forEach(k => { if (p[k] !== undefined) out[k] = p[k]; });
    return out;
  }

  function friendly(error) {
    const m = (error && (error.message || error.error_description)) || "Algo deu errado.";
    const map = [
      [/Invalid login credentials/i, "E-mail ou senha incorretos."],
      [/Email not confirmed/i, "Confirme seu e-mail pelo link que enviamos antes de entrar."],
      [/User already registered/i, "Já existe uma conta com este e-mail. Tente entrar."],
      [/Password should be at least/i, "A senha precisa ter pelo menos 6 caracteres."],
      [/row-level security/i, "Seu acesso está pausado. Assine para continuar criando pacientes e sessões."],
      [/rate limit|too many/i, "Muitas tentativas seguidas. Aguarde um minuto e tente de novo."],
      [/Failed to fetch|NetworkError|network/i, "Sem conexão com o servidor. Verifique sua internet."],
      [/Unable to validate email|invalid format/i, "Este e-mail não parece válido."],
      [/tarefa_invalida/i, "Este link de tarefa não está mais ativo. Peça um novo link para a fono."],
      [/tarefa_pausada/i, "A tarefa está pausada no momento. Fale com a fono."],
      [/limite_diario/i, "Muitos treinos enviados hoje. Que dedicação! Continue amanhã."],
      [/dados_invalidos/i, "Não foi possível registrar este treino."]
    ];
    for (const [re, msg] of map) if (re.test(m)) return new Error(msg);
    return new Error(m);
  }

  /* ---------------- Demonstração ---------------- */
  function demoAdapter() {
    const KEY = "falala-demo-v5";
    let mem = null;
    const listeners = [];
    const load = () => {
      if (mem) return mem;
      try { mem = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { mem = null; }
      if (!mem) mem = { session: null, profile: null, patients: [], sessions: [], custom: [], plans: [], practices: [], treatments: [], seeded: false };
      ["custom", "plans", "practices", "treatments"].forEach(k => { if (!mem[k]) mem[k] = []; });
      return mem;
    };
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* sem armazenamento: segue em memória */ } };
    const id = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
    const emit = (ev) => listeners.forEach(cb => cb(ev, load().session));
    const wait = (v) => new Promise(r => setTimeout(() => r(v), 120));

    function seed(db) {
      if (db.seeded) return;
      db.seeded = true;
      const now = Date.now();
      const mk = (name, age, focus, avatar, notes) => ({ id: id(), owner_id: "demo", name, age, focus, avatar, notes, display: "upper", archived: false, created_at: new Date(now - 40 * DAY).toISOString(), updated_at: new Date().toISOString() });
      const pedro = mk("Pedro", 6, ["r"], "dino", "Troca R fraco por L. Família pratica bem em casa.");
      const alice = mk("Alice", 5, ["s", "oral"], "unicornio", "Interposição de língua no S. Trabalhando postura de repouso.");
      const theo = mk("Theo", 7, ["r", "oral"], "foguete", "Omissão de R em encontros.");
      db.patients = [pedro, alice, theo];
      const plan = [
        [pedro, "r", ["r-tepe"], [0.35, 0.45, 0.5, 0.62, 0.7, 0.78]],
        [alice, "s", ["s-inicio"], [0.4, 0.5, 0.55, 0.7]],
        [alice, "oral", ["oral-papila", "oral-fora"], [0.5, 0.75]],
        [theo, "r", ["r-encontro"], [0.3, 0.4, 0.55]]
      ];
      db.sessions = [];
      const C = window.FALALA_CONTENT;
      const itemsOf = (exIds) => exIds.flatMap(eid => {
        for (const t of C.tracks) {
          const e = t.exercises.find(x => x.id === eid);
          if (e) return e.items ? e.items.map(it => ({ ex: eid, item: (it.w || `${it.a} / ${it.b}`).replace(/[\[\]]/g, "") })) : [{ ex: eid, item: e.title }];
        }
        return [];
      });
      // palavras "difíceis" erram mais nas sessões de exemplo, para o painel de atenção ter o que mostrar
      const hard = /cenoura|xícara|girafa|estrela|zebra|sapato|sabonete|língua/i;
      // tarefa de casa de exemplo (Pedro), com treinos nesta semana
      const tokenP = Array.from({ length: 24 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
      const planP = { id: id(), owner_id: "demo", patient_id: pedro.id, token: tokenP, track: "r", exercise_ids: ["r-tepe", "r-l-pares"], message: "Faça antes do banho, sem pressa.", days_per_week: 5, show_progress: true, record_audio: true, active: true, created_at: new Date(now - 6 * DAY).toISOString() };
      db.plans = [planP];
      db.practices = [0, 1, 3].map((d, k) => {
        const res = itemsOf(["r-tepe"]).slice(0, 8).map((it, j) => ({ ...it, r: (j + k) % 4 === 0 ? "help" : (j + k) % 5 === 0 ? "miss" : "ok" }));
        return { id: id(), plan_id: planP.id, owner_id: "demo", patient_id: pedro.id, results: res, total: res.length, correct: res.filter(r => r.r === "ok").length, helped: res.filter(r => r.r === "help").length, duration_sec: 300 + k * 30, created_at: new Date(now - d * DAY - 3600000 * (k + 1)).toISOString() };
      });
      plan.forEach(([p, track, ex, rates]) => {
        rates.forEach((rate, i) => {
          const all = itemsOf(ex);
          const results = all.slice(0, 10).map((it, k) => {
            const roll = ((k * 37 + i * 11) % 100) / 100;
            const r = hard.test(it.item) ? (roll < rate - 0.35 ? "ok" : roll < rate ? "help" : "miss") : (roll < rate + 0.1 ? "ok" : roll < rate + 0.25 ? "help" : "miss");
            return { ...it, r };
          });
          const total = results.length, correct = results.filter(r => r.r === "ok").length, helped = results.filter(r => r.r === "help").length;
          const daysAgo = (rates.length - i) * 5 - 2 + (p === alice ? 1 : 0);
          const progRow = (p === pedro && i < 3) ? { program_id: "prog-r", program_session: i + 1 } : {};
          db.sessions.push({
            ...progRow,
            id: id(), owner_id: "demo", patient_id: p.id, track, exercise_ids: progRow.program_id ? C.programs[0].sessions[i].blocks : ex, results,
            total, correct, helped, stars: starsFor(correct, helped, total), duration_sec: 600 + i * 40,
            notes: i === rates.length - 1 ? "Boa evolução hoje." : "", started_at: new Date(now - daysAgo * DAY).toISOString(),
            created_at: new Date(now - daysAgo * DAY).toISOString()
          });
        });
      });
      // planos de tratamento de exemplo: Pedro tem sessão hoje, Alice começa em 2 dias
      try {
        const FF = window.F;
        if (FF && FF.buildPlan) {
          const mkPlan = (p, complaints, startDate, time, doneCount) => {
            const list = FF.buildPlan({ complaints, total: 10, reevalLast: true });
            const s = FF.ymd(startDate);
            const dates = FF.planDates({ start: s, time, weekdays: [startDate.getDay()], every: 1, count: list.length });
            const done = db.sessions.filter(x => x.patient_id === p.id).sort((a, b) => a.started_at.localeCompare(b.started_at));
            list.forEach((x, i) => { x.at = dates[i]; if (i < doneCount) { x.status = "done"; x.session_id = done[i] ? done[i].id : null; } });
            return { id: id(), owner_id: "demo", patient_id: p.id, complaints, total_sessions: list.length, weekdays: [startDate.getDay()], every_weeks: 1, session_time: time, duration_min: 40, start_date: s, sessions: list, active: true, notes: null, created_at: new Date(now - 22 * DAY).toISOString(), updated_at: new Date().toISOString() };
          };
          db.treatments = [mkPlan(pedro, ["r"], new Date(now - 21 * DAY), "15:00", 3), mkPlan(alice, ["s", "resp"], new Date(now + 2 * DAY), "10:30", 0)];
        }
      } catch (e) { db.treatments = []; }
    }

    return {
      mode: "demo",
      auth: {
        async session() { return load().session; },
        onChange(cb) { listeners.push(cb); },
        async signUp({ name, email, crfa }) {
          const db = load();
          db.session = { user: { id: "demo", email } };
          db.profile = { id: "demo", full_name: name, crfa: crfa || null, clinic: null, trial_ends_at: new Date(Date.now() + 3 * DAY).toISOString(), created_at: new Date().toISOString() };
          seed(db); save(); emit("SIGNED_IN");
          return wait({ needsConfirmation: false });
        },
        async signIn({ email }) {
          const db = load();
          db.session = { user: { id: "demo", email: email || "demo@falala.app" } };
          if (!db.profile) db.profile = { id: "demo", full_name: "Dra. Camila Souza", crfa: "2-00000", clinic: "Consultório exemplo", trial_ends_at: new Date(Date.now() + 3 * DAY).toISOString(), created_at: new Date().toISOString() };
          seed(db); save(); emit("SIGNED_IN");
          return wait();
        },
        async signOut() { const db = load(); db.session = null; save(); emit("SIGNED_OUT"); },
        async resetPassword() { return wait(); },
        async updatePassword() { return wait(); },
        async user() { return load().session?.user || null; }
      },
      async profile() { return wait({ ...load().profile }); },
      async updateProfile(p) { const db = load(); Object.assign(db.profile, { full_name: p.full_name, crfa: p.crfa || null, clinic: p.clinic || null }); save(); return wait(); },
      async accountStatus() {
        const db = load();
        const ends = db.profile?.trial_ends_at;
        return wait({ has_access: !ends || new Date(ends) > new Date(), trial_ends_at: ends, subscription: db.subscription || null });
      },
      patients: {
        async list() { return wait([...load().patients].sort((a, b) => (a.archived - b.archived) || a.name.localeCompare(b.name, "pt-BR"))); },
        async create(p) { const db = load(); const row = { id: id(), owner_id: "demo", archived: false, focus: [], avatar: "lala", notes: "", display: "upper", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...clean(p) }; db.patients.push(row); save(); return wait(row); },
        async update(pid, p) { const db = load(); const row = db.patients.find(x => x.id === pid); Object.assign(row, clean(p), { updated_at: new Date().toISOString() }); save(); return wait(row); },
        async remove(pid) { const db = load(); db.patients = db.patients.filter(x => x.id !== pid); db.sessions = db.sessions.filter(s => s.patient_id !== pid); db.treatments = db.treatments.filter(t => t.patient_id !== pid); save(); return wait(); }
      },
      sessions: {
        async list() { return wait([...load().sessions].sort((a, b) => b.started_at.localeCompare(a.started_at))); },
        async create(s) { const db = load(); const row = { id: id(), owner_id: "demo", created_at: new Date().toISOString(), ...s }; db.sessions.push(row); save(); return wait(row); },
        async update(sid, s) { const db = load(); const row = db.sessions.find(x => x.id === sid); Object.assign(row, s); save(); return wait(row); },
        async remove(sid) { const db = load(); db.sessions = db.sessions.filter(x => x.id !== sid); save(); return wait(); }
      },
      custom: {
        async list() { return wait([...load().custom]); },
        async create(c) { const db = load(); const row = { id: id(), owner_id: "demo", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...cleanCustom(c) }; db.custom.push(row); save(); return wait(row); },
        async update(cid, c) { const db = load(); const row = db.custom.find(x => x.id === cid); Object.assign(row, cleanCustom(c), { updated_at: new Date().toISOString() }); save(); return wait(row); },
        async remove(cid) { const db = load(); db.custom = db.custom.filter(x => x.id !== cid); save(); return wait(); }
      },
      home: {
        async plans() { return wait([...load().plans].sort((a, b) => b.created_at.localeCompare(a.created_at))); },
        async create(p) {
          const db = load();
          db.plans.forEach(x => { if (x.patient_id === p.patient_id) x.active = false; });
          const token = Array.from({ length: 24 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");
          const row = { id: id(), owner_id: "demo", token, days_per_week: 5, show_progress: true, record_audio: true, active: true, created_at: new Date().toISOString(), ...cleanPlan(p) };
          db.plans.push(row); save(); return wait(row);
        },
        async update(pid, p) { const db = load(); const row = db.plans.find(x => x.id === pid); Object.assign(row, p); save(); return wait(row); },
        async practices() { return wait([...load().practices].sort((a, b) => b.created_at.localeCompare(a.created_at))); },
        async removePractice(hid) { const db = load(); db.practices = db.practices.filter(x => x.id !== hid); save(); return wait(); },
        async get(token) {
          const db = load();
          const pl = db.plans.find(x => x.token === token && x.active);
          if (!pl) return wait(null);
          const pt = db.patients.find(x => x.id === pl.patient_id) || {};
          const ends = db.profile?.trial_ends_at;
          const res = {
            plan: { id: pl.id, track: pl.track, exercise_ids: pl.exercise_ids, message: pl.message, days_per_week: pl.days_per_week, show_progress: pl.show_progress, record_audio: pl.record_audio, created_at: pl.created_at },
            patient: { name: pt.name, avatar: pt.avatar, display: pt.display },
            fono: { name: db.profile?.full_name, crfa: db.profile?.crfa, clinic: db.profile?.clinic },
            access: !ends || new Date(ends) > new Date(),
            custom: db.custom.filter(c => pl.exercise_ids.includes("c:" + c.id)).map(c => ({ id: "c:" + c.id, title: c.title, type: c.type, track: c.track, items: c.items })),
            practices: db.practices.filter(h => h.plan_id === pl.id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(h => ({ created_at: h.created_at, total: h.total, correct: h.correct, helped: h.helped }))
          };
          if (pl.show_progress) res.sessions = db.sessions.filter(s => s.patient_id === pt.id).sort((a, b) => a.started_at.localeCompare(b.started_at)).slice(-20);
          return wait(res);
        },
        async submit(token, r) {
          const db = load();
          const pl = db.plans.find(x => x.token === token && x.active);
          if (!pl) throw new Error("Este link de tarefa não está mais ativo. Peça um novo link para a fono.");
          const row = { id: id(), plan_id: pl.id, owner_id: "demo", patient_id: pl.patient_id, created_at: new Date().toISOString(), results: r.results, total: r.total, correct: r.correct, helped: r.helped, duration_sec: r.duration_sec };
          db.practices.push(row); save(); return wait(row.id);
        },
        async uploadAudio(token, practiceId, n, blob) {
          const db = load();
          const url = URL.createObjectURL(blob);
          const pr = db.practices.find(x => x.id === practiceId);
          if (pr && pr.results[n]) { pr.results[n].audio = url; save(); }
          return url;
        }
      },
      treatment: {
        async list() { return wait([...load().treatments].sort((a, b) => b.created_at.localeCompare(a.created_at))); },
        async create(p) {
          const db = load();
          db.treatments.forEach(x => { if (x.patient_id === p.patient_id) x.active = false; });
          const row = { id: id(), owner_id: "demo", active: true, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...cleanTreat(p) };
          db.treatments.push(row); save(); return wait(row);
        },
        async update(tid, p) { const db = load(); const row = db.treatments.find(x => x.id === tid); Object.assign(row, cleanTreat(p), { updated_at: new Date().toISOString() }); save(); return wait(row); },
        async remove(tid) { const db = load(); db.treatments = db.treatments.filter(x => x.id !== tid); save(); return wait(); }
      },
      audio: {
        async upload(path, blob) { return URL.createObjectURL(blob); },
        async url(path) { return path && path.startsWith("blob:") ? path : null; },
        async uid() { return "demo"; }
      },
      async voice() { throw new Error("sem voz na demonstração"); },
      reset() { try { localStorage.removeItem(KEY); } catch (e) {} mem = null; }
    };
  }

  function starsFor(correct, helped, total) {
    if (!total) return 0;
    const score = (correct + helped * 0.5) / total;
    return score >= 0.8 ? 3 : score >= 0.5 ? 2 : score > 0 ? 1 : 0;
  }

  const wantsSupabase = CFG.mode === "supabase" && window.supabase && window.supabase.createClient;
  window.FALALA_API = wantsSupabase ? supabaseAdapter() : demoAdapter();
  window.FALALA_API.starsFor = starsFor;
  window.FALALA_API.fallbackToDemo = CFG.mode === "supabase" && !wantsSupabase;
})();
