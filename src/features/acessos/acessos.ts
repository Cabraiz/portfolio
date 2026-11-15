// Contador de acessos próprio (sem cookies e sem terceiros).
//
// Manda para acessos.cabraiz.com, que roda no PC do Mateus: páginas vistas,
// um sinal a cada 15 s enquanto a aba está visível (para o "agora no site"),
// cliques e um pouco do movimento do mouse (para o mapa de calor).
// O id da visita é aleatório, fica no sessionStorage e some ao fechar a aba.
// Não lê nem manda texto digitado, nome, e-mail ou qualquer dado de formulário.
//
// Para não contar o próprio navegador: abra o site uma vez com ?nao-contar=1
// (e ?contar=1 para voltar a contar).

const DESTINO = "https://acessos.cabraiz.com/c";
const HOSTS = new Set(["cabraiz.com", "www.cabraiz.com"]);
const SINAL_MS = 15_000;
const ENVIO_MS = 5_000;
const MOVIMENTO_MS = 400;
const MAX_MOVIMENTOS_POR_PAGINA = 300;

type Evento =
  | { t: "view"; p: string; ref: string; lang: string }
  | { t: "ping" | "leave"; p: string }
  | { t: "click" | "move"; p: string; x: number; y: number };

function lerFlag(): boolean {
  try {
    const busca = new URLSearchParams(globalThis.location.search);
    if (busca.get("nao-contar") === "1") globalThis.localStorage.setItem("nao-contar", "1");
    if (busca.get("contar") === "1") globalThis.localStorage.removeItem("nao-contar");
    return globalThis.localStorage.getItem("nao-contar") === "1";
  } catch {
    return false;
  }
}

function idDaVisita(): string {
  try {
    const salvo = globalThis.sessionStorage.getItem("acessos-sid");
    if (salvo) return salvo;
    const novo = Array.from(globalThis.crypto.getRandomValues(new Uint8Array(10)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
    globalThis.sessionStorage.setItem("acessos-sid", novo);
    return novo;
  } catch {
    return Math.random().toString(36).slice(2, 14);
  }
}

export function iniciarAcessos(): void {
  if (typeof globalThis.window === "undefined") return;
  const w = globalThis.window;
  if (!HOSTS.has(w.location.hostname)) return;
  if (w.navigator.webdriver) return;
  try {
    if (w.top !== w.self) return; // dentro de iframe (inclusive o próprio painel)
  } catch {
    return;
  }
  if (lerFlag()) return;

  const sid = idDaVisita();
  const aparelho = () => (w.innerWidth < 768 ? "mobile" : "desktop");
  let fila: Evento[] = [];
  let caminho = w.location.pathname;
  let movimentos = 0;
  let ultimoMov = 0;
  let ultimoX = -1;
  let ultimoY = -1;
  let primeiraVista = true;

  const corpo = () => JSON.stringify({ sid, d: aparelho(), ev: fila });

  const enviar = (saindo = false) => {
    if (!fila.length) return;
    const dados = corpo();
    fila = [];
    try {
      // text/plain não dispara pré-checagem de CORS.
      if (saindo && w.navigator.sendBeacon) {
        w.navigator.sendBeacon(DESTINO, new Blob([dados], { type: "text/plain" }));
        return;
      }
      void fetch(DESTINO, { method: "POST", body: dados, keepalive: true, headers: { "content-type": "text/plain" }, mode: "cors", credentials: "omit" }).catch(() => {});
    } catch {
      // contador nunca pode quebrar o site
    }
  };

  const enfileirar = (ev: Evento) => {
    fila.push(ev);
    if (fila.length >= 40) enviar();
  };

  const registrarVista = () => {
    caminho = w.location.pathname;
    movimentos = 0;
    enfileirar({ t: "view", p: caminho, ref: primeiraVista ? w.document.referrer : "", lang: w.navigator.language || "" });
    primeiraVista = false;
    enviar();
  };

  // Troca de rota no React Router (pushState/replaceState) e voltar/avançar.
  const aoMudarRota = () => {
    if (w.location.pathname !== caminho) registrarVista();
  };
  for (const nome of ["pushState", "replaceState"] as const) {
    const original = w.history[nome].bind(w.history);
    w.history[nome] = ((...args: Parameters<History["pushState"]>) => {
      original(...args);
      queueMicrotask(aoMudarRota);
    }) as History["pushState"];
  }
  w.addEventListener("popstate", aoMudarRota);

  w.addEventListener(
    "click",
    (e) => {
      if (!w.innerWidth) return;
      enfileirar({ t: "click", p: caminho, x: e.clientX / w.innerWidth, y: e.clientY + w.scrollY });
    },
    { capture: true, passive: true },
  );

  w.addEventListener(
    "mousemove",
    (e) => {
      const agora = Date.now();
      if (agora - ultimoMov < MOVIMENTO_MS || movimentos >= MAX_MOVIMENTOS_POR_PAGINA) return;
      if (Math.abs(e.clientX - ultimoX) + Math.abs(e.clientY - ultimoY) < 30) return;
      ultimoMov = agora;
      ultimoX = e.clientX;
      ultimoY = e.clientY;
      movimentos++;
      enfileirar({ t: "move", p: caminho, x: e.clientX / w.innerWidth, y: e.clientY + w.scrollY });
    },
    { passive: true },
  );

  w.setInterval(() => {
    if (w.document.visibilityState === "visible") enfileirar({ t: "ping", p: caminho });
  }, SINAL_MS);
  w.setInterval(() => enviar(), ENVIO_MS);

  w.document.addEventListener("visibilitychange", () => {
    if (w.document.visibilityState === "hidden") enviar(true);
    else enfileirar({ t: "ping", p: caminho });
  });
  w.addEventListener("pagehide", () => {
    enfileirar({ t: "leave", p: caminho });
    enviar(true);
  });

  registrarVista();
}
