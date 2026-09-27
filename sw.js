// Guarda o app no aparelho para abrir sem internet.
// Arquivos do app: usa o que está guardado e atualiza em segundo plano (a versão nova aparece na próxima abertura).
const VERSION = "fluxo-v1";
const SHELL = [
  "./", "./index.html", "./manifest.webmanifest",
  "./vendor/peerjs.min.js", "./vendor/qrcode.js", "./vendor/jsQR.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png", "./icons/maskable-512.png"
];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== "fluxo-fonts").map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.open(VERSION).then(async cache => {
      const hit = await cache.match(req, { ignoreSearch: true });
      const net = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
      return hit || (await net) || cache.match("./index.html");
    }));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open("fluxo-fonts").then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); cache.put(req, res.clone()); return res; } catch (err) { return new Response("", { status: 504 }); }
    }));
  }
  // o resto (ponto de encontro da sincronização) vai direto para a rede
});
