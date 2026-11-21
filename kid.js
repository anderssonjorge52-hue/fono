/* Falalá — modo criança: a sessão em formato de jogo.
   mode "clinic": no consultório, a fono marca o resultado.
   mode "home": tarefa de casa pelo link, o responsável marca e o treino vai para a fono. */
(function (F) {
  const api = window.FALALA_API;
  const { esc, icon } = F;
  let K = null;

  function buildQueue(exIds, shuffle) {
    const q = [];
    exIds.forEach(id => {
      const e = F.exercise(id);
      if (!e) return;
      if (e.type === "praxis") q.push({ kind: "praxis", ex: e });
      else if (e.type === "breath") q.push({ kind: "breath", ex: e });
      else (e.items || []).forEach((it, i) => q.push({ kind: { pairs: "pair", phrases: "phrase", clap: "clap", rhyme: "rhyme", twister: "twister" }[e.type] || "word", ex: e, item: it, n: i }));
    });
    if (shuffle) for (let i = q.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [q[i], q[j]] = [q[j], q[i]]; }
    return q;
  }

  /* opts: { mode, patient: {id,name,avatar,display}, track, exIds, shuffle, token, recordAudio, onDone } */
  F.startSession = (opts) => {
    const mode = opts.mode || "clinic";
    let patient = opts.patient;
    if (mode === "clinic") {
      if (!F.hasAccess()) return F.paywall();
      patient = F.S.patients.find(p => p.id === opts.patientId);
    }
    const queue = buildQueue(opts.exIds, opts.shuffle);
    if (!patient || !queue.length) return F.toast("Escolha o paciente e pelo menos um exercício.", true);
    K = {
      mode, patient, track: opts.track, exIds: opts.exIds, queue, display: patient.display || "upper",
      token: opts.token, recordAudio: mode === "clinic" ? true : !!opts.recordAudio, onDone: opts.onDone,
      idx: 0, results: [], audio: [], started: Date.now(), reps: 0, holding: false,
      pairTarget: null, pairPicked: null, reveal: false, stream: null, cam: false, mic: null, rec: null, recording: false,
      done: false, sent: false, pending: false, program: opts.program || null, breath: null
    };
    const root = document.createElement("div");
    root.className = `kid t-${opts.track} disp-${K.display}`;
    root.id = "kid";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Sessão com " + patient.name);
    document.body.appendChild(root);
    document.body.style.overflow = "hidden";
    root.addEventListener("click", onClick);
    root.addEventListener("pointerdown", holdStart);
    ["pointerup", "pointerleave", "pointercancel"].forEach(ev => root.addEventListener(ev, holdCancel));
    root.addEventListener("contextmenu", (e) => { if (e.target.closest("[data-k=exit]")) e.preventDefault(); });
    document.addEventListener("keydown", onKey);
    draw();
  };

  const cur = () => K.queue[K.idx];
  const sayText = (c) => c.kind === "clap" ? c.item.w.replace(/-/g, "") : c.item.w;

  function draw() {
    const root = F.$("#kid");
    if (!root || !K) return;
    if (K.sent) { root.innerHTML = sentHTML(); return; }
    if (K.done) { root.innerHTML = finishHTML(); return; }
    const c = cur();
    const dots = K.queue.map((_, i) => `<i class="${K.results[i] ? K.results[i].r : ""} ${i === K.idx ? "now" : ""}"></i>`).join("");
    root.innerHTML = `
      <div class="kid-top">
        <div class="who-kid"><span class="av-kid">${F.avatar(K.patient.avatar)}</span>${esc(K.patient.name)}</div>
        <div class="dots" aria-label="Item ${K.idx + 1} de ${K.queue.length}">${dots}</div>
        <button class="kid-x" data-k="sound" aria-label="${F.soundOn() ? "Desligar sons" : "Ligar sons"}" aria-pressed="${F.soundOn()}">${icon(F.soundOn() ? "sound" : "mute")}</button>
        <button class="kid-x hold-x" data-k="exit" aria-label="Segure para encerrar">${icon("x")}<svg class="ring" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/></svg></button>
      </div>
      <div class="kid-stage">${stageHTML(c)}</div>
      <div class="kid-foot">${footHTML(c)}</div>`;
    attachCam();
    // busca as vozes deste item e do próximo
    [c, K.queue[K.idx + 1]].forEach(x => {
      if (!x || !x.item) return;
      if (x.kind === "pair" || x.kind === "rhyme") { F.prefetchVoice(x.item.a); F.prefetchVoice(x.item.b); }
      else F.prefetchVoice(sayText(x));
    });
  }

  function recControls() {
    if (!K.recordAudio || !F.canRecord()) return "";
    const has = K.audio[K.idx];
    if (K.recording) return `<button class="kbtn rec on" data-k="rec-stop">${icon("stop")}Parar</button>`;
    return `<button class="kbtn light rec" data-k="rec-start">${icon("mic")}${has ? "Gravar de novo" : "Gravar"}</button>${has ? `<button class="kbtn light" data-k="rec-play" aria-label="Ouvir a gravação">${icon("play")}</button>` : ""}`;
  }

  function stageHTML(c) {
    const listen = (extra = "") => `<div class="listen"><button class="kbtn" data-k="say">${icon("sound")}Ouvir</button><button class="kbtn light" data-k="slow">${icon("slow")}Devagar</button>${extra}</div>`;
    if (c.kind === "word") return `<div class="kid-card">
        <div class="pic" aria-hidden="true">${F.pic(c.item.pic)}</div>
        ${K.display === "picture" ? "" : `<div class="word-big say-word">${F.markHTML(c.item.w)}</div>`}
        ${listen(mirrorBtn() + recControls())}
        ${mirrorBox()}
      </div>`;
    if (c.kind === "phrase") return `<div class="kid-card">
        ${F.mascot("talk", F.track(K.track)?.color).replace('class="mascot"', 'class="mascot" style="width:110px"')}
        ${K.display === "picture" ? `<div class="word-big q-title">Ouça e repita!</div>` : `<div class="phrase say-word">${F.markHTML(c.item.w)}</div>`}
        ${listen(mirrorBtn() + recControls())}
        ${mirrorBox()}
      </div>`;
    if (c.kind === "twister") return `<div class="kid-card">
        ${F.mascot("talk", F.track(c.ex.track?.id || K.track)?.color).replace('class="mascot"', 'class="mascot" style="width:96px"')}
        <div class="q-title tw-tag">Trava-línguas</div>
        <div class="phrase say-word">${F.markHTML(c.item.w)}</div>
        ${listen(mirrorBtn() + recControls())}
        <div class="tw-challenge"><span>Desafio: diga 3 vezes seguidas</span>
          <div class="tw-dots">${[0, 1, 2].map(i => `<i class="${i < K.reps ? "on" : ""}"></i>`).join("")}</div>
          <button class="kbtn light" data-k="tw-rep" ${K.reps >= 3 ? "disabled" : ""}>${K.reps >= 3 ? "Conseguiu!" : "+1 vez"}</button></div>
        ${mirrorBox()}
      </div>`;
    if (c.kind === "breath") {
      const e = c.ex, b = K.breath || { phase: "idle", rep: 0 };
      const done = b.rep >= e.reps;
      const label = { idle: "Prontos?", in: e.inLabel, hold: "Segure…", out: e.outLabel, done: "Muito bem!" }[done ? "done" : b.phase];
      const pic = b.phase === "out" ? e.outPic : e.inPic;
      return `<div class="kid-card">
        <div class="word-big q-title" style="font-size:clamp(26px,4.4vw,40px)">${esc(e.title)}</div>
        <p class="hint">${esc(e.kid)}</p>
        <div class="breath-stage">
          <div class="breath-ball ph-${done ? "done" : b.phase}" id="bball"><span class="bpic">${F.pic(pic)}</span></div>
        </div>
        <div class="breath-label" id="blabel">${esc(label)}</div>
        <div class="breath-count" id="bcount">${done ? `${e.reps} de ${e.reps}` : `${b.rep} de ${e.reps}`}</div>
        <div class="listen">${done ? "" : !b.running ? `<button class="kbtn" data-k="breath-go">${icon("play")}${b.rep ? "Continuar" : "Começar"}</button>` : `<button class="kbtn light" data-k="breath-stop">${icon("stop")}Pausar</button>`}</div>
        <p class="tiny-kid">Inspira ${e.inhale}s${e.hold ? ` · segura ${e.hold}s` : ""} · solta ${e.exhale}s</p>
      </div>`;
    }
    if (c.kind === "clap") {
      const syl = c.item.w.split("-");
      return `<div class="kid-card">
        <div class="pic" aria-hidden="true">${F.pic(c.item.pic)}</div>
        ${K.display === "picture" && !K.reveal ? "" : `<div class="word-big say-word">${K.reveal ? syl.map(x => esc(x)).join('<span class="sep">·</span>') : esc(syl.join(""))}</div>`}
        <div class="claps" aria-label="${K.reveal ? syl.length + " sílabas" : ""}">${K.reveal ? syl.map(() => `<span class="clap">${icon("hand")}</span>`).join("") : `<p class="hint">Bata uma palma em cada pedacinho da palavra!</p>`}</div>
        <div class="listen"><button class="kbtn" data-k="say">${icon("sound")}Ouvir</button><button class="kbtn light" data-k="reveal">${K.reveal ? "Esconder" : "Mostrar as sílabas"}</button>${recControls()}</div>
      </div>`;
    }
    if (c.kind === "pair") {
      const st = (w) => K.pairPicked == null ? "" : (w === K.pairPicked ? (K.pairPicked === K.pairTarget ? "right" : "wrong") : (w === K.pairTarget ? "right" : ""));
      return `<div class="kid-card">
        <div class="word-big q-title" style="font-size:clamp(26px,4vw,36px)">Qual palavra você ouviu?</div>
        <p class="hint">Toque em <b>Ouvir</b>. A criança aponta, e você toca na palavra que ela escolheu.</p>
        <button class="kbtn" data-k="pair-say">${icon("sound")}${K.pairTarget ? "Ouvir de novo" : "Ouvir"}</button>
        <div class="pairs">${["a", "b"].map(k => `<button class="pair say-word ${st(k)}" data-k="pair-pick" data-v="${k}" ${!K.pairTarget || K.pairPicked ? "disabled" : ""}>${F.markHTML(c.item[k])}</button>`).join("")}</div>
      </div>`;
    }
    if (c.kind === "rhyme") {
      const ans = K.pairPicked;
      const right = ans != null && ((ans === "sim") === !!c.item.rima);
      return `<div class="kid-card">
        <div class="word-big q-title" style="font-size:clamp(26px,4vw,36px)">Essas palavras rimam?</div>
        <div class="pairs">${["a", "b"].map(k => `<div class="pair say-word">${esc(c.item[k])}</div>`).join("")}</div>
        <button class="kbtn" data-k="rhyme-say">${icon("sound")}Ouvir as duas</button>
        <div class="pairs">
          <button class="pair yn ${ans === "sim" ? (right ? "right" : "wrong") : ""}" data-k="rhyme-pick" data-v="sim" ${ans ? "disabled" : ""}>${icon("check")} Rimam</button>
          <button class="pair yn ${ans === "nao" ? (right ? "right" : "wrong") : ""}" data-k="rhyme-pick" data-v="nao" ${ans ? "disabled" : ""}>${icon("x")} Não rimam</button>
        </div>
      </div>`;
    }
    const e = c.ex;
    const done = K.reps >= e.reps;
    return `<div class="kid-card">
        <div class="word-big q-title" style="font-size:clamp(28px,4.6vw,44px)">${esc(e.title)}</div>
        <p class="hint">${esc(e.kid)}</p>
        <div class="row" style="justify-content:center;gap:22px">
          <div class="mouth-box">${K.cam ? '<video autoplay playsinline muted></video>' : F.mouth(e.pose)}</div>
          <div style="display:grid;justify-items:center;gap:10px">
            <div class="counter"><span class="n">${K.reps}</span><span class="of">de ${e.reps}</span></div>
            <button class="tap" data-k="rep" ${done || K.holding ? "disabled" : ""} aria-label="${e.hold ? "Segurar" : "Mais uma"}">${done ? "★" : e.hold ? "Segura!" : "+1"}</button>
            <div class="hold" id="hold">${done ? "Muito bem!" : K.holding ? "" : e.hold ? `Segure por ${e.hold} segundos` : "Toque a cada vez"}</div>
          </div>
        </div>
        <div class="listen"><button class="kbtn light" data-k="cam">${icon("camera")}${K.cam ? "Ver o desenho" : "Espelho"}</button></div>
      </div>`;
  }

  const mirrorBtn = () => ["s", "oral", "l", "ch"].includes(cur()?.ex?.track?.id || K.track) ? `<button class="kbtn light" data-k="cam">${icon("camera")}${K.cam ? "Fechar espelho" : "Espelho"}</button>` : "";
  const mirrorBox = () => K.cam ? `<div class="mouth-box" style="width:min(240px,60vw)"><video autoplay playsinline muted></video></div>` : "";

  function footHTML(c) {
    const n = `${K.idx + 1} de ${K.queue.length}`;
    const home = K.mode === "home";
    const who = home ? "Responsável" : "Fono";
    const undo = `<button class="score skip undo" data-k="undo" ${K.idx === 0 ? "disabled" : ""} aria-label="Desfazer a última marcação">${icon("undo")}<span class="tx">Desfazer</span></button>`;
    const said = K.display === "picture" && ["word", "phrase", "clap"].includes(c.kind) ? ` · <b>${esc(F.plain(sayText(c)))}</b>` : "";
    if (c.kind === "pair" || c.kind === "rhyme") return `<span class="lbl">${who} · ${n} · ${esc(c.ex.title)}</span>${undo}<button class="score skip" data-k="skip">Pular</button>`;
    const motor = c.kind === "praxis" || c.kind === "breath";
    const okLabel = motor ? "Feito!" : home ? "Falou certinho!" : "Acertou!";
    const missLabel = motor ? "Não conseguiu" : "Ainda não";
    const keys = home ? "" : `<span class="keys"> · teclas 1, 2, 3 e Z desfaz</span>`;
    return `<span class="lbl">${home ? "Responsável: como foi?" : "Fono"} · ${n} · ${esc(c.ex.title)}${said}${keys}</span>
      ${undo}
      <button class="score miss" data-k="score" data-v="miss">${missLabel}</button>
      <button class="score help" data-k="score" data-v="help">Com ajuda</button>
      <button class="score ok" data-k="score" data-v="ok">${icon("check")}${okLabel}</button>
      <button class="score skip" data-k="skip">Pular</button>`;
  }

  function itemText(c) {
    if (c.kind === "praxis" || c.kind === "breath") return c.ex.title;
    if (c.kind === "pair" || c.kind === "rhyme") return F.plain(`${c.item.a} / ${c.item.b}`);
    return F.plain(sayText(c));
  }

  function record(r) {
    if (K.pending) return;
    K.pending = true;
    stopRec();
    F.sfx(r);
    const c = cur();
    K.results[K.idx] = { r, ex: c.ex.id, item: itemText(c), n: K.idx };
    if (r === "ok") F.burst();
    setTimeout(next, r === "ok" ? 420 : 160);
  }

  function resetItem() { breathStop(); K.breath = null; K.reps = 0; K.holding = false; K.pairTarget = null; K.pairPicked = null; K.reveal = false; }

  /* respiração guiada: inspira (bola cresce), segura, solta (bola diminui) */
  function breathStop() {
    if (K && K.breathTimer) { clearTimeout(K.breathTimer); K.breathTimer = null; }
    if (K && K.breath) { K.breath.phase = "idle"; K.breath.running = false; }
  }
  function breathSet(phase, secs) {
    const ball = F.$("#bball"), lab = F.$("#blabel"), cnt = F.$("#bcount");
    const e = cur().ex;
    K.breath.phase = phase;
    if (ball) {
      ball.style.transitionDuration = (secs || 0.4) + "s";
      ball.className = "breath-ball ph-" + phase;
      const pic = ball.querySelector(".bpic");
      if (pic) pic.innerHTML = F.pic(phase === "out" ? e.outPic : e.inPic);
    }
    if (lab) lab.textContent = { in: e.inLabel, hold: "Segure…", out: e.outLabel }[phase] || "";
    if (cnt) cnt.textContent = `${K.breath.rep} de ${e.reps}`;
  }
  function breathRun() {
    const c = cur(), e = c.ex;
    if (!K.breath) K.breath = { phase: "idle", rep: 0 };
    K.breath.running = true;
    K.breath.phase = "idle";
    const cycle = () => {
      if (!K || cur() !== c || !K.breath || !K.breath.running) return;
      if (K.breath.rep >= e.reps) { K.breath.phase = "done"; K.breath.running = false; F.burst(); F.sfx("ok"); draw(); return; }
      breathSet("in", e.inhale); F.sfx("tick");
      K.breathTimer = setTimeout(() => {
        const toOut = () => {
          if (!K || cur() !== c) return;
          breathSet("out", e.exhale);
          K.breathTimer = setTimeout(() => { if (!K || cur() !== c) return; K.breath.rep++; cycle(); }, e.exhale * 1000);
        };
        if (e.hold) { breathSet("hold", 0.3); K.breathTimer = setTimeout(toOut, e.hold * 1000); } else toOut();
      }, e.inhale * 1000);
    };
    draw();
    K.breathTimer = setTimeout(cycle, 60);
  }

  function next() {
    if (!K) return;
    K.pending = false;
    resetItem();
    if (K.idx < K.queue.length - 1) { K.idx++; draw(); }
    else { K.done = true; stopCam(); draw(); F.burst(); F.sfx("finish"); }
  }

  function undo() {
    if (!K || K.pending || K.done || K.idx === 0) return;
    stopRec();
    K.idx--;
    delete K.results[K.idx];
    resetItem();
    F.sfx("undo");
    draw();
  }

  /* gravação */
  async function startRec() {
    try {
      if (!K.mic) K.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mime = F.recMime();
      const rec = new MediaRecorder(K.mic, mime ? { mimeType: mime, audioBitsPerSecond: 48000 } : undefined);
      const chunks = [];
      const at = K.idx;
      rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        if (!K) return;
        if (chunks.length) K.audio[at] = new Blob(chunks, { type: (rec.mimeType || mime || "audio/webm").split(";")[0] });
        K.recording = false;
        if (K.idx === at && !K.done) draw();
      };
      rec.start();
      K.rec = rec; K.recording = true;
      draw();
      setTimeout(() => { if (K && K.rec === rec && rec.state === "recording") rec.stop(); }, 6000);
    } catch (e) {
      K.recording = false;
      F.toast("O microfone não foi liberado. Permita o acesso ao microfone no navegador para gravar.", true);
      draw();
    }
  }
  function stopRec() { if (K && K.rec && K.rec.state === "recording") K.rec.stop(); }
  function playRec() {
    const b = K.audio[K.idx];
    if (!b) return;
    try { new Audio(URL.createObjectURL(b)).play(); } catch (e) {}
  }

  async function attachCam() {
    const v = F.$("#kid video");
    if (!v || !K.cam) return;
    try {
      if (!K.stream) K.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      v.srcObject = K.stream;
    } catch (e) {
      K.cam = false;
      F.toast("A câmera não foi liberada. Permita o acesso à câmera no navegador para usar o espelho.", true);
      draw();
    }
  }
  function stopCam() { if (K && K.stream) { K.stream.getTracks().forEach(t => t.stop()); K.stream = null; } if (K) K.cam = false; }

  function close() {
    if (!K) return;
    stopCam(); stopRec();
    if (K.mic) K.mic.getTracks().forEach(t => t.stop());
    try { speechSynthesis.cancel(); } catch (e) {}
    document.removeEventListener("keydown", onKey);
    const root = F.$("#kid");
    root && root.remove();
    document.body.style.overflow = "";
    K = null;
  }

  async function onClick(e) {
    const b = e.target.closest("[data-k]");
    if (!b || !K) return;
    const k = b.dataset.k;
    if (k === "save") return K.mode === "home" ? sendHome(b) : save(b);
    if (k === "discard") { if (await F.confirm("Descartar o treino?", "Os resultados não serão salvos.", "Descartar", "danger")) close(); return; }
    if (k === "close-sent") { const cb = K.onDone; close(); cb && cb(); return; }
    if (K.done) return;
    const c = cur();
    if (k === "say") F.say(sayText(c));
    else if (k === "slow") F.say(sayText(c), true);
    else if (k === "score") record(b.dataset.v);
    else if (k === "undo") undo();
    else if (k === "sound") { F.setSound(!F.soundOn()); draw(); }
    else if (k === "rec-start") startRec();
    else if (k === "rec-stop") stopRec();
    else if (k === "rec-play") playRec();
    else if (k === "breath-go") breathRun();
    else if (k === "breath-stop") { breathStop(); draw(); }
    else if (k === "tw-rep") { K.reps = Math.min(3, K.reps + 1); F.sfx(K.reps >= 3 ? "ok" : "tick"); if (K.reps >= 3) F.burst(); draw(); }
    else if (k === "reveal") { K.reveal = !K.reveal; if (K.reveal) F.sayBrowser(c.item.w.split("-").join(", "), true); draw(); }
    else if (k === "skip") { stopRec(); K.results[K.idx] = { r: "skip", ex: c.ex.id, item: itemText(c), n: K.idx }; next(); }
    else if (k === "cam") { K.cam = !K.cam; if (!K.cam) stopCam(); draw(); }
    else if (k === "pair-say") {
      if (!K.pairTarget) K.pairTarget = Math.random() < 0.5 ? "a" : "b";
      F.say(c.item[K.pairTarget]);
      draw();
    } else if (k === "pair-pick") {
      K.pairPicked = b.dataset.v;
      draw();
      setTimeout(() => record(K.pairPicked === K.pairTarget ? "ok" : "miss"), 650);
    } else if (k === "rhyme-say") {
      F.say(c.item.a);
      setTimeout(() => K && F.say(c.item.b), 1100);
    } else if (k === "rhyme-pick") {
      K.pairPicked = b.dataset.v;
      draw();
      setTimeout(() => record((K.pairPicked === "sim") === !!c.item.rima ? "ok" : "miss"), 750);
    } else if (k === "rep") {
      const ex = c.ex;
      if (ex.hold) {
        K.holding = true; draw();
        let left = ex.hold;
        const tick = () => {
          if (!K || cur() !== c) return;
          const h = F.$("#hold");
          if (left > 0) { h && (h.textContent = `Segura… ${left}`); left--; setTimeout(tick, 1000); }
          else { K.holding = false; K.reps++; if (K.reps >= ex.reps) { F.burst(); F.sfx("ok"); } else F.sfx("tick"); draw(); }
        };
        tick();
      } else {
        K.reps++;
        if (K.reps >= ex.reps) { F.burst(); F.sfx("ok"); } else F.sfx("tick");
        draw();
      }
    } else if (k === "exit") {
      if (b.dataset.fired) { delete b.dataset.fired; return; }
      F.toast("Para sair, segure o X por 2 segundos.");
    }
  }

  /* sair só segurando o X (a criança não sai sem querer) */
  let holdTimer = null;
  function holdStart(e) {
    const b = e.target.closest("[data-k=exit]");
    if (!b || !K) return;
    b.classList.add("holding");
    holdTimer = setTimeout(() => { holdTimer = null; b.classList.remove("holding"); b.dataset.fired = "1"; exitFlow(); }, 1500);
  }
  function holdCancel() {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    F.$$("#kid .holding").forEach(x => x.classList.remove("holding"));
  }

  async function exitFlow() {
    if (!K || F.$(".modal-back")) return;
    if (K.done || K.sent) { close(); return; }
    stopRec();
    const scored = K.results.filter(r => r && r.r !== "skip").length;
    if (!scored) { if (await F.confirm("Encerrar?", "Nenhum item foi marcado ainda, então nada será salvo.", "Encerrar", "danger")) close(); return; }
    const v = await F.modal({
      title: "Encerrar agora?",
      body: `<p class="muted">${scored} ${scored === 1 ? "item marcado" : "itens marcados"} até aqui.</p>`,
      actions: [{ label: "Continuar", value: null }, { label: "Sair sem salvar", kind: "danger", value: "discard" }, { label: K.mode === "home" ? "Terminar e enviar" : "Finalizar e salvar", kind: "primary", value: "finish" }]
    });
    if (v === "discard") close();
    if (v === "finish") { K.queue = K.queue.slice(0, K.idx + (K.results[K.idx] ? 1 : 0)); K.done = true; stopCam(); draw(); F.sfx("finish"); }
  }

  function onKey(e) {
    if (!K || K.done || e.target.closest("textarea, input")) return;
    if (F.$(".modal-back")) return;
    if (e.key === "Escape") { exitFlow(); return; }
    if (e.key === "z" || e.key === "Z" || e.key === "Backspace") { e.preventDefault(); undo(); return; }
    const c = cur();
    if (c.kind === "pair" || c.kind === "rhyme") return;
    if (e.key === "1") record("miss");
    else if (e.key === "2") record("help");
    else if (e.key === "3") record("ok");
    else if (e.key === " " && c.item) { e.preventDefault(); F.say(sayText(c)); }
  }

  function tally() {
    const scored = K.results.filter(r => r && r.r !== "skip");
    const correct = scored.filter(r => r.r === "ok").length;
    const helped = scored.filter(r => r.r === "help").length;
    const total = scored.length;
    return { scored, correct, helped, miss: total - correct - helped, total, stars: api.starsFor(correct, helped, total), secs: Math.round((Date.now() - K.started) / 1000), recs: K.audio.filter(Boolean).length };
  }

  function finishHTML() {
    const t = tally();
    const mins = Math.max(1, Math.round(t.secs / 60));
    const home = K.mode === "home";
    const cheer = t.stars === 3 ? "Arrasou!" : t.stars === 2 ? "Muito bem!" : t.stars === 1 ? "Boa tentativa!" : "Treino registrado";
    return `<div class="kid-top"><div class="who-kid"><span class="av-kid">${F.avatar(K.patient.avatar)}</span>${esc(K.patient.name)}</div><div class="dots"></div><button class="kid-x" data-k="discard" aria-label="Fechar">${icon("x")}</button></div>
      <div class="kid-stage"><div class="kid-card finish">
        ${F.mascot("happy", F.track(K.track)?.color).replace('class="mascot"', 'class="mascot" style="width:120px"')}
        <div class="word-big">${cheer}</div>
        <div class="big-stars" aria-label="${t.stars} de 3 estrelas">${[0, 1, 2].map(i => `<span class="${i < t.stars ? "" : "off"}" style="color:${i < t.stars ? "#FFC93C" : ""}">★</span>`).join("")}</div>
        <div class="stats"><span class="chip s">${t.correct} certas</span><span class="chip" style="background:#FFF1C2;color:#7A5500">${t.helped} com ajuda</span><span class="chip r">${t.miss} ainda não</span><span class="chip">${mins} min</span>${t.recs ? `<span class="chip">${icon("mic")}${t.recs} ${t.recs === 1 ? "gravação" : "gravações"}</span>` : ""}</div>
        ${home ? "" : `<label class="sr" for="knotes">Anotações da sessão</label>
        <textarea id="knotes" maxlength="2000" placeholder="Anotações para você (opcional): o que funcionou, o que levar para a próxima."></textarea>`}
        <div class="listen"><button class="kbtn light" data-k="discard">Descartar</button><button class="kbtn" data-k="save" ${t.total ? "" : "disabled"}>${icon(home ? "send" : "check")}${home ? "Enviar para a fono" : "Salvar sessão"}</button></div>
        ${t.total ? "" : '<p class="hint">Nenhum item foi marcado, então não há o que salvar.</p>'}
      </div></div><div></div>`;
  }

  function sentHTML() {
    return `<div class="kid-top"><div class="who-kid"><span class="av-kid">${F.avatar(K.patient.avatar)}</span>${esc(K.patient.name)}</div><div class="dots"></div><span></span></div>
      <div class="kid-stage"><div class="kid-card finish">
        ${F.mascot("happy", "#1F8A70").replace('class="mascot"', 'class="mascot" style="width:140px"')}
        <div class="word-big">Treino enviado!</div>
        <p class="hint">A fono já pode ver como foi. Até o próximo treino!</p>
        <button class="kbtn" data-k="close-sent">${icon("check")}Voltar</button>
      </div></div><div></div>`;
  }

  /* resultados na ordem final, com o índice de cada gravação */
  function packResults() {
    const out = [], blobs = [];
    K.results.forEach((r, i) => {
      if (!r) return;
      const row = { r: r.r, ex: r.ex, item: r.item };
      if (K.audio[i] && r.r !== "skip") blobs.push({ n: out.length, blob: K.audio[i] });
      out.push(row);
    });
    return { out, blobs };
  }

  async function save(btn) {
    const t = tally();
    if (!t.total) return;
    btn.disabled = true;
    btn.textContent = "Salvando…";
    try {
      const { out, blobs } = packResults();
      const sid = crypto.randomUUID ? crypto.randomUUID() : null;
      if (blobs.length) {
        btn.textContent = "Enviando gravações…";
        const uid = await api.audio.uid();
        for (const { n, blob } of blobs) {
          const ext = /mp4|m4a|aac/.test(blob.type) ? "m4a" : /ogg/.test(blob.type) ? "ogg" : "webm";
          try { out[n].audio = await api.audio.upload(`${uid}/${K.patient.id}/${sid || Date.now()}/${n}.${ext}`, blob); }
          catch (e) { F.toast("Uma gravação não foi enviada, mas a sessão será salva.", true); }
        }
      }
      const row = {
        patient_id: K.patient.id, track: K.track, exercise_ids: K.exIds, results: out,
        total: t.total, correct: t.correct, helped: t.helped, stars: t.stars, duration_sec: t.secs,
        notes: (F.$("#knotes")?.value || "").trim() || null, started_at: new Date(K.started).toISOString()
      };
      if (K.program) { row.program_id = K.program.id; row.program_session = K.program.n; }
      if (sid) row.id = sid;
      await api.sessions.create(row);
      const pid = K.patient.id;
      close();
      await F.reload();
      F.ui.setup = null;
      F.toast("Sessão salva!");
      location.hash = "#paciente-" + pid;
      F.render();
    } catch (err) {
      F.toast(err.message || "Não foi possível salvar. Tente de novo.", true);
      btn.disabled = false;
      btn.textContent = "Salvar sessão";
    }
  }

  async function sendHome(btn) {
    const t = tally();
    if (!t.total) return;
    btn.disabled = true;
    btn.textContent = "Enviando…";
    try {
      const { out, blobs } = packResults();
      const practiceId = await api.home.submit(K.token, { results: out, total: t.total, correct: t.correct, helped: t.helped, duration_sec: t.secs });
      let fail = 0;
      for (const { n, blob } of blobs) {
        btn.textContent = `Enviando gravações… ${n + 1}`;
        try { await api.home.uploadAudio(K.token, practiceId, n, blob); } catch (e) { fail++; }
      }
      if (fail) F.toast(`${fail} ${fail === 1 ? "gravação não foi enviada" : "gravações não foram enviadas"}, mas o treino chegou.`, true);
      K.sent = true;
      F.burst();
      draw();
    } catch (err) {
      F.toast(err.message || "Não foi possível enviar. Verifique a internet e tente de novo.", true);
      btn.disabled = false;
      btn.textContent = "Enviar para a fono";
    }
  }
})(window.F);
