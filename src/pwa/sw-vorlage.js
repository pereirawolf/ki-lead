// Service Worker der KI-LEAD-PWA. Vorlage: Der Build (vite.config.ts) setzt Version und Dateiliste ein und legt
// das Ergebnis als sw.js neben index.html ab.
//
// Grundsätze:
// - Offline zuerst: Alle Dateien des Builds werden bei der Installation vorgehalten; die App startet ohne Netz.
// - Nur eigene Dateien: Anfragen an andere Adressen (KI-Anbieter) gehen unverändert ins Netz und werden nie
//   zwischengespeichert. Ohne Netz scheitern sie wie gewohnt; die App meldet das.
// - Aktualisierung auf Wunsch: Eine neue Fassung wartet, bis die Person „Neu laden“ wählt oder alle Fenster
//   geschlossen sind. So passen Seite und nachgeladene Dateien immer zusammen.

const VERSION = "__VERSION__";
const DATEIEN = ["__DATEIEN__"];
const CACHE = `ki-lead-${VERSION}`;

self.addEventListener("install", (ereignis) => {
  ereignis.waitUntil(caches.open(CACHE).then((c) => c.addAll(DATEIEN.map((d) => new URL(d, self.registration.scope).href))));
});

self.addEventListener("activate", (ereignis) => {
  ereignis.waitUntil(
    caches
      .keys()
      .then((namen) => Promise.all(namen.filter((n) => n.startsWith("ki-lead-") && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (ereignis) => {
  if (ereignis.data === "jetzt-aktualisieren") self.skipWaiting();
  if (ereignis.data === "version" && ereignis.ports[0]) ereignis.ports[0].postMessage(VERSION);
});

self.addEventListener("fetch", (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== "GET") return;
  const url = new URL(anfrage.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;

  // Seitenaufrufe: immer die vorgehaltene index.html (Einzelseiten-App), Netz nur als Rückfall
  if (anfrage.mode === "navigate") {
    ereignis.respondWith(
      caches
        .open(CACHE)
        .then((c) => c.match(new URL("index.html", self.registration.scope).href))
        .then((antwort) => antwort || fetch(anfrage)),
    );
    return;
  }

  // Dateien des Builds: aus dem Cache; Unbekanntes aus dem Netz, ohne es aufzunehmen
  ereignis.respondWith(
    caches
      .open(CACHE)
      .then((c) => c.match(anfrage, { ignoreSearch: true }))
      .then((antwort) => antwort || fetch(anfrage)),
  );
});
