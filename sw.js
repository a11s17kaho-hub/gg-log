// オフラインでも最後に開いた画面を出すための小さなサービスワーカー。
// 自分のサイトのファイルだけを扱い、Firebase(ログイン・データ)には触らない。
const CACHE = "gglog-v3";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(["/", "/manifest.json", "/icons/icon-192.png"]))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/__/")) return;
  // 新しい版を優先し、つながらないときだけ保存しておいたものを使う
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); } return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match("/"))));
});
