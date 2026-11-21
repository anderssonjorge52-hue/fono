/* Falalá — conteúdo clínico dos exercícios.
   Rascunho para revisão por fonoaudióloga responsável antes do uso com pacientes.
   Marcação: o trecho entre [colchetes] é o som-alvo, destacado na tela. */
window.FALALA_CONTENT = {
  version: "2026.11b-rascunho",
  extraPics: ["🎈", "🫁"],
  tracks: [
    {
      id: "resp",
      name: "Respiração e sopro",
      short: "Ar",
      color: "#2F8FD1",
      soft: "#DDEEFA",
      summary: "Aquecimento de toda sessão: inspirar pelo nariz, segurar e soltar o ar devagar, com sopro e som.",
      exercises: [
        { id: "resp-flor", type: "breath", title: "Cheirar a flor, soprar a vela",
          kid: "Cheire a flor bem devagar… agora sopre a vela sem pressa!",
          tip: "Inspiração nasal e expiração oral lenta. Ombros parados; observe se a barriga se movimenta.",
          inhale: 3, hold: 0, exhale: 4, reps: 5, inLabel: "Cheire a flor", outLabel: "Sopre a vela", inPic: "🌸", outPic: "🕯️" },
        { id: "resp-balao", type: "breath", title: "Encher o balão",
          kid: "Encha o balão de ar, segure… e solte bem devagarinho!",
          tip: "Controle de fluxo expiratório com pausa. Aumente o tempo de soltar aos poucos.",
          inhale: 3, hold: 2, exhale: 5, reps: 4, inLabel: "Encha o balão", outLabel: "Solte devagar", inPic: "🎈", outPic: "🎈" },
        { id: "resp-nariz", type: "breath", title: "Respirar pelo nariz",
          kid: "Boca fechadinha: o ar entra e sai pelo nariz",
          tip: "Respiração nasal com lábios fechados. Importante para a postura de repouso da língua.",
          inhale: 3, hold: 1, exhale: 3, reps: 6, inLabel: "Ar entra pelo nariz", outLabel: "Ar sai pelo nariz", inPic: "👃", outPic: "👃" },
        { id: "resp-barriga", type: "breath", title: "Respiração da barriga",
          kid: "Mão na barriga: ela enche como balão e depois esvazia",
          tip: "Respiração diafragmática. A criança deita ou senta com a mão na barriga.",
          inhale: 4, hold: 1, exhale: 4, reps: 5, inLabel: "Barriga enche", outLabel: "Barriga esvazia", inPic: "🫁", outPic: "🫁" },
        { id: "resp-sss", type: "breath", title: "Sopro da cobrinha (ssss)",
          kid: "Puxe o ar e solte fazendo o barulho da cobrinha: ssssss",
          tip: "Expiração sonorizada em S, com postura correta de língua. Bom aquecimento para S e Z.",
          inhale: 3, hold: 0, exhale: 5, reps: 5, inLabel: "Puxe o ar", outLabel: "Ssssss…", inPic: "🌸", outPic: "🐍" },
        { id: "resp-chiado", type: "breath", title: "Sopro do trem (chhhh)",
          kid: "Puxe o ar e solte como o trem: chhhhh",
          tip: "Expiração sonorizada em CH, lábios arredondados para a frente.",
          inhale: 3, hold: 0, exhale: 5, reps: 5, inLabel: "Puxe o ar", outLabel: "Chhhhh…", inPic: "🌸", outPic: "🚂" }
      ]
    },
    {
      id: "r",
      name: "Som do R",
      short: "R",
      color: "#E8613C",
      soft: "#FDE5DC",
      summary: "R fraco entre vogais, R em encontros (br, tr…), R no fim da sílaba e R forte.",
      exercises: [
        {
          id: "r-tepe", type: "words", title: "R fraquinho entre vogais",
          kid: "Palavras com o R que faz cócegas na língua",
          tip: "Tepe alveolar: um toque rápido da ponta da língua atrás dos dentes de cima. Se houver troca por L, volte ao par cara/cala.",
          items: [
            { w: "a[r]a[r]a", pic: "🦜" }, { w: "ba[r]ata", pic: "🪳" }, { w: "cadei[r]a", pic: "🪑" },
            { w: "pe[r]a", pic: "🍐" }, { w: "co[r]uja", pic: "🦉" }, { w: "gi[r]afa", pic: "🦒" },
            { w: "pi[r]ulito", pic: "🍭" }, { w: "co[r]oa", pic: "👑" }, { w: "xíca[r]a", pic: "☕" },
            { w: "cenou[r]a", pic: "🥕" }, { w: "ca[r]acol", pic: "🐌" }
          ]
        },
        {
          id: "r-tepe-frases", type: "phrases", title: "Frases com R entre vogais",
          kid: "Frases para falar devagarinho",
          tip: "Peça a frase inteira, sem pressa. Marque “com ajuda” se precisar repetir junto.",
          items: [
            { w: "A a[r]a[r]a come pe[r]a." }, { w: "A co[r]uja usa co[r]oa." },
            { w: "A gi[r]afa bebe na xíca[r]a." }, { w: "O ca[r]acol come cenou[r]a." },
            { w: "A ba[r]ata subiu na cadei[r]a." }
          ]
        },
        {
          id: "r-encontro", type: "words", title: "R em encontros (br, dr, tr…)",
          kid: "Palavras com R grudadinho",
          tip: "Encontro consonantal. Se houver omissão (ex.: “tem” por “trem”), separe em sílabas e junte de novo.",
          items: [
            { w: "[br]aço", pic: "💪" }, { w: "co[br]a", pic: "🐍" }, { w: "[dr]agão", pic: "🐉" },
            { w: "[fr]uta", pic: "🍓" }, { w: "[gr]ilo", pic: "🦗" }, { w: "[pr]ato", pic: "🍽️" },
            { w: "[tr]em", pic: "🚂" }, { w: "li[vr]o", pic: "📖" }, { w: "ze[br]a", pic: "🦓" },
            { w: "es[tr]ela", pic: "⭐" }, { w: "[pr]esente", pic: "🎁" }
          ]
        },
        {
          id: "r-encontro-frases", type: "phrases", title: "Frases com R em encontros",
          kid: "Frases com R grudadinho",
          tip: "Observe se o encontro se mantém na fala encadeada.",
          items: [
            { w: "O [tr]em passa na ponte." }, { w: "A ze[br]a tem lis[tr]as [pr]etas." },
            { w: "O [dr]agão é [gr]ande." }, { w: "Eu li um li[vr]o de es[tr]elas." },
            { w: "Ganhei um [pr]esente de [fr]uta." }
          ]
        },
        {
          id: "r-final", type: "words", title: "R no fim da sílaba",
          kid: "Palavras com R no final do pedacinho",
          tip: "R em coda silábica. Aceite a variante regional da família (retroflexo, tepe ou aspirado).",
          items: [
            { w: "po[r]ta", pic: "🚪" }, { w: "ca[r]ta", pic: "✉️" }, { w: "ga[r]fo", pic: "🍴" },
            { w: "ba[r]co", pic: "⛵" }, { w: "ci[r]co", pic: "🎪" }, { w: "flo[r]", pic: "🌸" },
            { w: "ma[r]", pic: "🌊" }, { w: "colhe[r]", pic: "🥄" }, { w: "tambo[r]", pic: "🥁" },
            { w: "to[r]ta", pic: "🥧" }
          ]
        },
        {
          id: "r-forte", type: "words", title: "R forte (começo e RR)",
          kid: "Palavras com o R forte",
          tip: "R inicial e RR. Também use variante regional. Útil para comparar com o R fraco (caro/carro).",
          items: [
            { w: "[r]ato", pic: "🐭" }, { w: "[r]oda", pic: "🛞" }, { w: "[r]ei", pic: "🤴" },
            { w: "[r]osa", pic: "🌹" }, { w: "ca[rr]o", pic: "🚗" }, { w: "cacho[rr]o", pic: "🐶" },
            { w: "to[rr]e", pic: "🗼" }, { w: "te[rr]a", pic: "🌍" }, { w: "[r]elógio", pic: "⌚" },
            { w: "[r]ádio", pic: "📻" }
          ]
        },
        {
          id: "r-trava", type: "twister", title: "Trava-línguas do R",
          kid: "Fale devagar primeiro, depois mais rápido!",
          tip: "Use só quando o R já sai bem em frases. Primeiro devagar e articulado; a velocidade vem depois.",
          items: [
            { w: "O [r]ato [r]oeu a [r]oupa do [r]ei de [R]oma." },
            { w: "Três p[r]atos de t[r]igo para t[r]ês t[r]igres t[r]istes." },
            { w: "A a[r]anha a[rr]anha a [r]ã, a [r]ã a[rr]anha a a[r]anha." },
            { w: "Ped[r]o p[r]egou um p[r]ego na po[r]ta p[r]eta." }
          ]
        },
        {
          id: "r-l-pares", type: "pairs", title: "Escuta: R ou L?",
          kid: "Qual palavra eu falei?",
          tip: "Discriminação auditiva de pares mínimos. Toque em ouvir; a criança aponta a palavra que escutou.",
          items: [
            { a: "ca[r]a", b: "ca[l]a" }, { a: "co[r]o", b: "co[l]o" }, { a: "pe[r]a", b: "pe[l]a" },
            { a: "to[r]a", b: "to[l]a" }, { a: "ca[r]o", b: "ca[rr]o" }
          ]
        }
      ]
    },
    {
      id: "s",
      name: "S e Z",
      short: "S",
      color: "#1F8A70",
      soft: "#D9F0E7",
      summary: "Para o famoso “língua presa” na fala: S e Z no começo, no meio e no fim das palavras.",
      exercises: [
        {
          id: "s-inicio", type: "words", title: "S no começo",
          kid: "Palavras que começam com o som da cobrinha",
          tip: "Ponta da língua atrás dos dentes de baixo ou na papila, dentes quase fechados, ar pelo meio. Se a língua aparecer entre os dentes, use o espelho.",
          items: [
            { w: "[s]apo", pic: "🐸" }, { w: "[s]ol", pic: "☀️" }, { w: "[s]ino", pic: "🔔" },
            { w: "[s]apato", pic: "👞" }, { w: "[s]uco", pic: "🧃" }, { w: "[s]orvete", pic: "🍦" },
            { w: "[s]aia", pic: "👗" }, { w: "[s]abonete", pic: "🧼" }, { w: "[s]ofá", pic: "🛋️" },
            { w: "[c]enoura", pic: "🥕" }
          ]
        },
        {
          id: "s-meio", type: "words", title: "S no meio (ss, ç, c)",
          kid: "O som da cobrinha no meio da palavra",
          tip: "Mesma postura do S inicial, agora entre vogais.",
          items: [
            { w: "pá[ss]aro", pic: "🐦" }, { w: "o[ss]o", pic: "🦴" }, { w: "ma[ss]a", pic: "🍝" },
            { w: "bol[s]a", pic: "👜" }, { w: "palha[ç]o", pic: "🤡" }, { w: "do[c]e", pic: "🍬" },
            { w: "ta[ç]a", pic: "🏆" }, { w: "va[ss]oura", pic: "🧹" }
          ]
        },
        {
          id: "z-palavras", type: "words", title: "Som de Z (z e s entre vogais)",
          kid: "O som da abelhinha: zzzz",
          tip: "Mesma postura do S, com vibração da voz. Peça para sentir a garganta vibrar com a mão.",
          items: [
            { w: "[z]ebra", pic: "🦓" }, { w: "ca[s]a", pic: "🏠" }, { w: "ro[s]a", pic: "🌹" },
            { w: "a[z]ul", pic: "🔵" }, { w: "va[s]o", pic: "🏺" }, { w: "bu[z]ina", pic: "📯" },
            { w: "cami[s]a", pic: "👕" }, { w: "[z]íper", pic: "🧥" }
          ]
        },
        {
          id: "s-final", type: "words", title: "S no fim",
          kid: "O som da cobrinha no final",
          tip: "S/Z em coda. Aceite a variante regional (chiado do S final).",
          items: [
            { w: "lápi[s]", pic: "✏️" }, { w: "ônibu[s]", pic: "🚌" }, { w: "trê[s]", pic: "3️⃣" },
            { w: "nari[z]", pic: "👃" }, { w: "arro[z]", pic: "🍚" }, { w: "pé[s]", pic: "🦶" },
            { w: "lu[z]", pic: "💡" }
          ]
        },
        {
          id: "s-frases", type: "phrases", title: "Frases com S e Z",
          kid: "Frases da cobrinha e da abelhinha",
          tip: "Observe a postura da língua na fala encadeada. Use o espelho se precisar.",
          items: [
            { w: "O [s]apo pula no [s]ofá." }, { w: "[S]ei[s] pá[ss]aro[s] cantam." },
            { w: "A [z]ebra mora na ca[s]a a[z]ul." }, { w: "Trê[s] ônibu[s] pa[ss]am na rua." },
            { w: "O palha[ç]o come do[c]e." }
          ]
        },
        {
          id: "s-trava", type: "twister", title: "Trava-línguas do S",
          kid: "A cobrinha desafia: fale sem a língua escapar!",
          tip: "Observe se a postura da língua se mantém quando a velocidade aumenta. Use o espelho.",
          items: [
            { w: "O [s]abiá não [s]abia que o [s]ábio [s]abia que o [s]abiá não [s]abia a[ss]obiar." },
            { w: "[S]ete [s]apos [s]apecas [s]altaram no [s]ofá." },
            { w: "[S]e o [s]apo [s]abe o [s]amba, o [s]amba [s]abe o [s]apo." }
          ]
        },
        {
          id: "s-z-pares", type: "pairs", title: "Escuta: S ou Z?",
          kid: "Qual palavra eu falei?",
          tip: "Discriminação de pares mínimos com contraste de sonoridade.",
          items: [
            { a: "ca[ç]a", b: "ca[s]a" }, { a: "do[c]e", b: "do[z]e" }, { a: "a[ss]a", b: "a[s]a" },
            { a: "[s]elo", b: "[z]elo" }
          ]
        }
      ]
    },
    {
      id: "oral",
      name: "Língua e lábios",
      short: "L",
      color: "#5B4FC4",
      soft: "#E7E4FB",
      summary: "Exercícios de movimento (praxias) com espelho: ponta da língua, estalos, bico, sorriso e sopro.",
      exercises: [
        { id: "oral-papila", type: "praxis", pose: "up", title: "Ponta no céu da boca",
          kid: "Encoste a pontinha da língua na bolinha atrás dos dentes de cima",
          tip: "Postura de repouso da língua na papila. Segurar sem pressionar os dentes.", reps: 8, hold: 5 },
        { id: "oral-fora", type: "praxis", pose: "out", title: "Língua pontuda para fora e para dentro",
          kid: "Faça a língua de lápis: sai e entra!",
          tip: "Língua afilada, sem apoiar no lábio inferior.", reps: 10, hold: 0 },
        { id: "oral-relogio", type: "praxis", pose: "side", title: "Relógio",
          kid: "A língua vai de um cantinho da boca ao outro: tic, tac!",
          tip: "Lateralização com boca aberta, sem mover a mandíbula junto.", reps: 10, hold: 0 },
        { id: "oral-cavalinho", type: "praxis", pose: "click", title: "Cavalinho",
          kid: "Estale a língua como o trotar do cavalo",
          tip: "Sucção e estalo de língua no palato. Observe elevação do dorso.", reps: 15, hold: 0 },
        { id: "oral-varrer", type: "praxis", pose: "up", title: "Varrer o céu da boca",
          kid: "A língua é uma vassoura: varre da frente para trás",
          tip: "Ponta da língua desliza da papila em direção ao palato mole.", reps: 10, hold: 0 },
        { id: "oral-bico", type: "praxis", pose: "kiss", title: "Bico e sorriso",
          kid: "Faça bico de beijo, depois um sorrisão",
          tip: "Alternância de protrusão e estiramento labial.", reps: 10, hold: 2 },
        { id: "oral-balao", type: "praxis", pose: "puff", title: "Bochechas de balão",
          kid: "Encha as bochechas de ar e segure!",
          tip: "Vedamento labial. Não deixe escapar ar pelo nariz.", reps: 6, hold: 5 },
        { id: "oral-vela", type: "praxis", pose: "blow", title: "Soprar a vela",
          kid: "Sopre bem devagar, como numa velinha que não pode apagar",
          tip: "Sopro longo e direcionado, lábios arredondados.", reps: 6, hold: 4 },
        { id: "oral-sorvete", type: "praxis", pose: "lick", title: "Lamber o sorvete",
          kid: "Passe a língua em volta dos lábios, como se fosse sorvete",
          tip: "Movimento circular amplo da língua em volta dos lábios.", reps: 6, hold: 0 }
      ]
    },
    {
      id: "l",
      name: "L e LH",
      short: "L",
      color: "#C27C0E",
      soft: "#FBEFD9",
      summary: "L no começo e no meio, L em encontros (bl, fl, pl…) e o LH de palhaço e abelha.",
      exercises: [
        {
          id: "l-simples", type: "words", title: "L no começo e no meio",
          kid: "Palavras com a língua lá em cima",
          tip: "Ponta da língua toca atrás dos dentes de cima e o ar sai pelos lados. Observe troca por R ou omissão.",
          items: [
            { w: "[l]ua", pic: "🌙" }, { w: "[l]eão", pic: "🦁" }, { w: "[l]ápis", pic: "✏️" },
            { w: "[l]imão", pic: "🍋" }, { w: "[l]ivro", pic: "📖" }, { w: "bo[l]a", pic: "⚽" },
            { w: "jane[l]a", pic: "🪟" }, { w: "ga[l]inha", pic: "🐔" }, { w: "ge[l]o", pic: "🧊" },
            { w: "ve[l]a", pic: "🕯️" }, { w: "ma[l]a", pic: "🧳" }
          ]
        },
        {
          id: "l-encontro", type: "words", title: "L em encontros (bl, cl, fl, gl, pl)",
          kid: "Palavras com L grudadinho",
          tip: "Encontro consonantal com L. Separe em sílabas se houver omissão (“fo” por “flor”).",
          items: [
            { w: "[bl]usa", pic: "👚" }, { w: "[cl]ipe", pic: "📎" }, { w: "[fl]or", pic: "🌸" },
            { w: "[gl]obo", pic: "🌎" }, { w: "[pl]aneta", pic: "🪐" }, { w: "bici[cl]eta", pic: "🚲" },
            { w: "te[cl]ado", pic: "⌨️" }, { w: "[pl]anta", pic: "🪴" }
          ]
        },
        {
          id: "lh-palavras", type: "words", title: "LH",
          kid: "Palavras com LH, de palhaço e abelha",
          tip: "Dorso da língua no palato, ponta apoiada atrás dos dentes de baixo. Observe troca por L ou I (“paiaço”).",
          items: [
            { w: "pa[lh]aço", pic: "🤡" }, { w: "o[lh]o", pic: "👁️" }, { w: "co[lh]er", pic: "🥄" },
            { w: "a[lh]o", pic: "🧄" }, { w: "abe[lh]a", pic: "🐝" }, { w: "fo[lh]a", pic: "🍃" },
            { w: "mi[lh]o", pic: "🌽" }, { w: "ove[lh]a", pic: "🐑" }, { w: "coe[lh]o", pic: "🐰" },
            { w: "ore[lh]a", pic: "👂" }
          ]
        },
        {
          id: "l-frases", type: "phrases", title: "Frases com L e LH",
          kid: "Frases da língua dançarina",
          tip: "Fala encadeada com L e LH.",
          items: [
            { w: "O [l]eão chupou [l]imão." }, { w: "A abe[lh]a pousou na [fl]or." },
            { w: "A ove[lh]a e o coe[lh]o comem fo[lh]a." }, { w: "A ga[l]inha viu a [l]ua." }
          ]
        },
        {
          id: "l-trava", type: "twister", title: "Trava-línguas do L e LH",
          kid: "A língua dança lá em cima!",
          tip: "Use depois que L e LH saírem bem em frases.",
          items: [
            { w: "A [l]ua c[l]ara c[l]areia a [l]agoa." },
            { w: "[L]i[l]i [l]ava o [l]enço [l]i[l]ás." },
            { w: "O ga[l]o e a ga[l]inha o[lh]am a ove[lh]a." }
          ]
        },
        {
          id: "l-lh-pares", type: "pairs", title: "Escuta: L ou LH?",
          kid: "Qual palavra eu falei?",
          tip: "Pares mínimos L x LH.",
          items: [
            { a: "fi[l]a", b: "fi[lh]a" }, { a: "mo[l]a", b: "mo[lh]a" }, { a: "bo[l]a", b: "bo[lh]a" },
            { a: "ve[l]a", b: "ve[lh]a" }
          ]
        }
      ]
    },
    {
      id: "ch",
      name: "CH e J",
      short: "CH",
      color: "#C2417F",
      soft: "#FBE3EF",
      summary: "O som do chiado (CH, X) e do J, com escuta para não trocar um pelo outro.",
      exercises: [
        {
          id: "ch-palavras", type: "words", title: "CH e X",
          kid: "O som do trem: chhhh",
          tip: "Lábios levemente arredondados para a frente, língua recuada. Observe troca por S (“sapéu”).",
          items: [
            { w: "[ch]ave", pic: "🔑" }, { w: "[ch]uva", pic: "🌧️" }, { w: "[ch]apéu", pic: "🎩" },
            { w: "[ch]inelo", pic: "🩴" }, { w: "[x]ícara", pic: "☕" }, { w: "pei[x]e", pic: "🐟" },
            { w: "ca[ch]orro", pic: "🐶" }, { w: "[ch]ocolate", pic: "🍫" }, { w: "li[x]o", pic: "🗑️" },
            { w: "cai[x]a", pic: "📦" }
          ]
        },
        {
          id: "j-palavras", type: "words", title: "J e G (de gelo)",
          kid: "O mesmo chiado, agora com voz: jjjj",
          tip: "Mesma postura do CH com vibração da voz. Observe troca por Z ou dessonorização (J por CH).",
          items: [
            { w: "[j]acaré", pic: "🐊" }, { w: "[j]anela", pic: "🪟" }, { w: "[g]elo", pic: "🧊" },
            { w: "[g]irafa", pic: "🦒" }, { w: "[j]oaninha", pic: "🐞" }, { w: "lo[j]a", pic: "🏪" },
            { w: "bei[j]o", pic: "💋" }, { w: "laran[j]a", pic: "🍊" }, { w: "[j]ogo", pic: "🎮" }
          ]
        },
        {
          id: "ch-frases", type: "phrases", title: "Frases com CH e J",
          kid: "Frases do trem e da joaninha",
          tip: "Fala encadeada com CH e J.",
          items: [
            { w: "A [ch]uva mo[lh]ou o [ch]inelo." }, { w: "O pei[x]e está na cai[x]a." },
            { w: "A [j]oaninha subiu na [j]anela." }, { w: "O ca[ch]orro comeu [ch]ocolate." }
          ]
        },
        {
          id: "ch-trava", type: "twister", title: "Trava-línguas do CH e J",
          kid: "Chiado do trem e da joaninha, bem rapidinho!",
          tip: "Contraste CH e J na mesma frase. Observe troca por S ou Z.",
          items: [
            { w: "[Ch]iquinho [ch]upou [ch]iclete de [ch]ocolate." },
            { w: "O [j]acaré [j]oga [j]ogo com a [j]oaninha." },
            { w: "A [ch]uva [ch]ata mo[lh]ou o [ch]apéu do [J]oão." }
          ]
        },
        {
          id: "ch-j-pares", type: "pairs", title: "Escuta: CH ou J?",
          kid: "Qual palavra eu falei?",
          tip: "Pares mínimos com contraste de sonoridade.",
          items: [ { a: "[ch]á", b: "[j]á" }, { a: "[ch]ato", b: "[j]ato" }, { a: "quei[x]o", b: "quei[j]o" } ]
        }
      ]
    },
    {
      id: "trocas",
      name: "Trocas P/B, T/D, F/V",
      short: "P B",
      color: "#2F6FB8",
      soft: "#E0ECF9",
      summary: "Sons sem voz e com voz: para a criança que fala “pola” em vez de “bola” ou “faca” em vez de “vaca”.",
      exercises: [
        {
          id: "trocas-sem-voz", type: "words", title: "Sons sem voz (P, T, F, K)",
          kid: "Sons fortinhos, sem vibrar a garganta",
          tip: "Peça para sentir a garganta com a mão: nesses sons ela não vibra.",
          items: [
            { w: "[p]ato", pic: "🦆" }, { w: "[p]ipoca", pic: "🍿" }, { w: "[t]omate", pic: "🍅" },
            { w: "[t]elefone", pic: "☎️" }, { w: "[f]aca", pic: "🔪" }, { w: "[f]oca", pic: "🦭" },
            { w: "[c]oelho", pic: "🐰" }, { w: "[c]ama", pic: "🛏️" }
          ]
        },
        {
          id: "trocas-com-voz", type: "words", title: "Sons com voz (B, D, V, G)",
          kid: "Sons que fazem a garganta vibrar",
          tip: "A garganta vibra. Contraste com o par sem voz quando houver troca.",
          items: [
            { w: "[b]ola", pic: "⚽" }, { w: "[b]anana", pic: "🍌" }, { w: "[d]ado", pic: "🎲" },
            { w: "[d]ente", pic: "🦷" }, { w: "[v]aca", pic: "🐄" }, { w: "[v]ela", pic: "🕯️" },
            { w: "[g]ato", pic: "🐱" }, { w: "[g]alo", pic: "🐓" }
          ]
        },
        {
          id: "trocas-pb", type: "pairs", title: "Escuta: P ou B?",
          kid: "Qual palavra eu falei?",
          tip: "Pares mínimos P x B.",
          items: [ { a: "[p]ato", b: "[b]ato" }, { a: "[p]ote", b: "[b]ote" }, { a: "[p]ala", b: "[b]ala" } ]
        },
        {
          id: "trocas-td", type: "pairs", title: "Escuta: T ou D?",
          kid: "Qual palavra eu falei?",
          tip: "Pares mínimos T x D.",
          items: [ { a: "[t]ia", b: "[d]ia" }, { a: "[t]oca", b: "[d]oca" }, { a: "ca[t]a", b: "ca[d]a" } ]
        },
        {
          id: "trocas-fv", type: "pairs", title: "Escuta: F ou V?",
          kid: "Qual palavra eu falei?",
          tip: "Pares mínimos F x V.",
          items: [ { a: "[f]aca", b: "[v]aca" }, { a: "[f]ila", b: "[v]ila" }, { a: "[f]oto", b: "[v]oto" } ]
        }
      ]
    },
    {
      id: "silabas",
      name: "Sílabas e rimas",
      short: "Aa",
      color: "#0F8A8A",
      soft: "#DCF2F1",
      summary: "Consciência fonológica: bater palmas nas sílabas e descobrir se as palavras rimam.",
      exercises: [
        {
          id: "silabas-palmas", type: "clap", title: "Palmas nas sílabas",
          kid: "Bata uma palma em cada pedacinho da palavra",
          tip: "Segmentação silábica. A criança bate palmas e diz quantas sílabas ouviu; revele a divisão depois.",
          items: [
            { w: "sol", pic: "☀️" }, { w: "pão", pic: "🍞" }, { w: "bo-la", pic: "⚽" }, { w: "ga-to", pic: "🐱" },
            { w: "ca-sa", pic: "🏠" }, { w: "sa-pa-to", pic: "👞" }, { w: "ma-ca-co", pic: "🐒" },
            { w: "gi-ra-fa", pic: "🦒" }, { w: "ja-ca-ré", pic: "🐊" }, { w: "bor-bo-le-ta", pic: "🦋" },
            { w: "a-ba-ca-xi", pic: "🍍" }, { w: "te-le-fo-ne", pic: "☎️" }
          ]
        },
        {
          id: "rimas", type: "rhyme", title: "Rimam ou não rimam?",
          kid: "Escute as duas palavras: o finalzinho é igual?",
          tip: "Julgamento de rima. Leia as duas palavras devagar e deixe a criança responder.",
          items: [
            { a: "gato", b: "pato", rima: true }, { a: "mão", b: "pão", rima: true }, { a: "bola", b: "casa", rima: false },
            { a: "janela", b: "panela", rima: true }, { a: "sapo", b: "sol", rima: false }, { a: "chapéu", b: "céu", rima: true },
            { a: "dado", b: "fada", rima: false }, { a: "cama", b: "lama", rima: true }, { a: "rato", b: "peixe", rima: false }
          ]
        }
      ]
    }
  ],
  /* Roteiros: cada sessão já vem com todos os exercícios, na ordem em que a criança faz.
     materials: o que separar antes; home: sugestão de tarefa de casa. */
  programs: [
    {
      id: "prog-r", track: "r", title: "Programa do R",
      for: "Troca ou dificuldade no R (R fraco, encontros, R final e R forte)",
      sessions: [
        { title: "Língua ativa e escuta", goal: "Aquecer a língua e treinar a escuta da diferença entre R e L.", blocks: ["resp-flor", "oral-fora", "oral-cavalinho", "oral-varrer", "r-l-pares"], materials: ["Espelho"], home: ["oral-cavalinho", "r-l-pares"] },
        { title: "R fraco em palavras", goal: "Produzir o R entre vogais em palavras.", blocks: ["resp-flor", "oral-cavalinho", "oral-papila", "r-tepe", "r-l-pares"], materials: ["Espelho"], home: ["oral-cavalinho", "r-tepe"] },
        { title: "R fraco em frases", goal: "Levar o R entre vogais para a fala encadeada.", blocks: ["resp-balao", "oral-cavalinho", "r-tepe", "r-tepe-frases"], materials: [], home: ["r-tepe", "r-tepe-frases"] },
        { title: "R em encontros", goal: "Produzir br, cr, dr, fr, gr, pr, tr sem omitir o R.", blocks: ["resp-flor", "oral-varrer", "r-encontro", "r-encontro-frases"], materials: ["Espelho"], home: ["r-encontro"] },
        { title: "R final e R forte", goal: "Treinar o R no fim da sílaba e o R forte (rato, carro).", blocks: ["resp-balao", "oral-cavalinho", "r-final", "r-forte"], materials: [], home: ["r-final", "r-forte"] },
        { title: "Revisão com trava-línguas", goal: "Revisar todas as posições e desafiar a velocidade.", blocks: ["resp-flor", "r-tepe", "r-encontro-frases", "r-trava"], materials: [], home: ["r-tepe-frases", "r-trava"] }
      ]
    },
    {
      id: "prog-s", track: "s", title: "Programa do S (língua presa na fala)",
      for: "Ceceio: língua entre os dentes no S e no Z",
      sessions: [
        { title: "Postura de repouso", goal: "Respirar pelo nariz e manter a ponta da língua na papila.", blocks: ["resp-nariz", "oral-papila", "oral-fora", "oral-bico", "s-z-pares"], materials: ["Espelho"], home: ["resp-nariz", "oral-papila"] },
        { title: "Sopro e o som da cobrinha", goal: "Produzir o S isolado com a língua para dentro.", blocks: ["resp-flor", "resp-sss", "oral-papila", "s-inicio"], materials: ["Espelho", "Vela ou papel picado para o sopro"], home: ["resp-sss", "s-inicio"] },
        { title: "S no meio da palavra", goal: "Manter a postura do S entre vogais.", blocks: ["resp-sss", "oral-papila", "oral-sorvete", "s-meio"], materials: ["Espelho"], home: ["s-meio"] },
        { title: "O som do Z", goal: "Diferenciar S e Z sentindo a vibração da garganta.", blocks: ["resp-balao", "resp-sss", "z-palavras", "s-z-pares"], materials: [], home: ["z-palavras", "s-z-pares"] },
        { title: "S no fim e em frases", goal: "Levar o S para o fim das palavras e para frases.", blocks: ["resp-flor", "oral-papila", "s-final", "s-frases"], materials: ["Espelho"], home: ["s-final", "s-frases"] },
        { title: "Revisão com trava-línguas", goal: "Manter a postura correta com mais velocidade.", blocks: ["resp-sss", "s-inicio", "s-frases", "s-trava"], materials: ["Espelho"], home: ["s-frases", "s-trava"] }
      ]
    },
    {
      id: "prog-l", track: "l", title: "Programa do L e LH",
      for: "Troca de L por R, omissão do L em encontros, LH como “i”",
      sessions: [
        { title: "Língua lá em cima", goal: "Elevar a ponta da língua e produzir o L em palavras.", blocks: ["resp-flor", "oral-papila", "oral-fora", "l-simples"], materials: ["Espelho"], home: ["oral-papila", "l-simples"] },
        { title: "L em encontros", goal: "Produzir bl, cl, fl, gl, pl.", blocks: ["resp-balao", "oral-varrer", "l-simples", "l-encontro"], materials: ["Espelho"], home: ["l-encontro"] },
        { title: "O LH", goal: "Produzir o LH e diferenciá-lo do L.", blocks: ["resp-flor", "oral-cavalinho", "lh-palavras", "l-lh-pares"], materials: [], home: ["lh-palavras", "l-lh-pares"] },
        { title: "Frases e trava-línguas", goal: "Usar L e LH na fala encadeada.", blocks: ["resp-flor", "l-frases", "lh-palavras", "l-trava"], materials: [], home: ["l-frases", "l-trava"] }
      ]
    },
    {
      id: "prog-ch", track: "ch", title: "Programa do CH e J",
      for: "Troca do chiado por S ou Z, troca entre CH e J",
      sessions: [
        { title: "Bico e o som do trem", goal: "Arredondar os lábios e produzir o CH.", blocks: ["resp-chiado", "oral-bico", "ch-palavras"], materials: ["Espelho"], home: ["resp-chiado", "ch-palavras"] },
        { title: "CH ou J?", goal: "Escutar e produzir a diferença entre CH e J.", blocks: ["resp-chiado", "oral-bico", "j-palavras", "ch-j-pares"], materials: [], home: ["j-palavras", "ch-j-pares"] },
        { title: "Frases do chiado", goal: "Levar CH e J para frases.", blocks: ["resp-balao", "ch-palavras", "ch-frases"], materials: [], home: ["ch-frases"] },
        { title: "Trava-línguas", goal: "Revisar com velocidade.", blocks: ["resp-chiado", "ch-frases", "ch-trava"], materials: [], home: ["ch-trava"] }
      ]
    },
    {
      id: "prog-trocas", track: "trocas", title: "Programa das trocas (P/B, T/D, F/V)",
      for: "Troca de sons com voz e sem voz (“pola” por “bola”)",
      sessions: [
        { title: "Sentir a voz", goal: "Perceber a vibração da garganta nos sons com voz.", blocks: ["resp-barriga", "trocas-sem-voz", "trocas-pb"], materials: ["Mão no pescoço para sentir a vibração"], home: ["trocas-pb"] },
        { title: "Sons com voz", goal: "Produzir B, D, V, G com vibração.", blocks: ["resp-barriga", "trocas-com-voz", "trocas-pb"], materials: [], home: ["trocas-com-voz"] },
        { title: "T ou D?", goal: "Diferenciar T e D na escuta e na fala.", blocks: ["resp-flor", "trocas-com-voz", "trocas-td"], materials: [], home: ["trocas-td"] },
        { title: "F ou V?", goal: "Diferenciar F e V e revisar todos os pares.", blocks: ["resp-flor", "trocas-sem-voz", "trocas-fv", "trocas-com-voz"], materials: [], home: ["trocas-fv"] }
      ]
    },
    {
      id: "prog-silabas", track: "silabas", title: "Programa de sílabas e rimas",
      for: "Consciência fonológica, base para a fala e a alfabetização",
      sessions: [
        { title: "Palmas nas sílabas", goal: "Segmentar palavras em sílabas.", blocks: ["resp-flor", "silabas-palmas"], materials: [], home: ["silabas-palmas"] },
        { title: "Rimas e sílabas", goal: "Julgar rimas e revisar a segmentação.", blocks: ["resp-balao", "rimas", "silabas-palmas"], materials: [], home: ["rimas"] }
      ]
    }
  ],
  avatars: [
    { id: "lala", pic: "🫧", name: "Lalá" }, { id: "raposa", pic: "🦊", name: "Raposa" },
    { id: "coruja", pic: "🦉", name: "Coruja" }, { id: "sapo", pic: "🐸", name: "Sapo" },
    { id: "polvo", pic: "🐙", name: "Polvo" }, { id: "leao", pic: "🦁", name: "Leão" },
    { id: "gato", pic: "🐱", name: "Gato" }, { id: "dino", pic: "🦕", name: "Dino" },
    { id: "unicornio", pic: "🦄", name: "Unicórnio" }, { id: "foguete", pic: "🚀", name: "Foguete" }
  ]
};
