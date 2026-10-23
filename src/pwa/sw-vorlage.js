// Service Worker der KI-LEAD-PWA. Vorlage: Der Build (vite.config.ts) setzt Version und Dateiliste ein und legt
// das Ergebnis als sw.js neben index.html ab.
//
// Grundsätze:
// - Offline zuerst: Alle Dateien des Builds werden bei der Installation vorgehalten; die App startet ohne Netz.
// - Nur eigene Dateien: Anfragen an andere Adressen (KI-Anbieter) gehen unverändert ins Netz und werden nie
//   zwischengespeichert. Ohne Netz scheitern sie wie gewohnt; die App meldet das.
// - Stimmige Fassung (seit 0.5.2): Die Dateien werden am HTTP-Cache des Browsers vorbei geladen, und index.html muss
//   genau auf Dateien dieser Fassung verweisen. Sonst scheitert die Installation, und die bisherige Fassung bleibt.
//   Vorher konnte eine ältere index.html aus dem HTTP-Cache neben neuen Programmdateien landen; sobald der
//   HTTP-Cache ablief, fehlte deren Startdatei und die Seite blieb leer (Startfehler nach 0.5.1).
// - Aktualisierung auf Wunsch: Eine neue Fassung wartet, bis die Person „Neu laden“ wählt oder alle Fenster
//   geschlossen sind. Ausnahme: Ist die bisherige Fassung beschädigt (index.html verweist auf fehlende Dateien),
//   übernimmt die neue sofort und lädt die betroffenen Fenster einmal neu; deren Seiten starten ohnehin nicht.
// - Reparaturseite: reparatur.html wird nie durch index.html ersetzt (Wiederherstellung ohne das App-Bundle).
// - Daten: Der Service Worker berührt nur seine eigenen Caches (Präfix „ki-lead-“), nie IndexedDB oder localStorage.

const VERSION = "__VERSION__";
const DATEIEN = ["__DATEIEN__"];
const PRAEFIX = "ki-lead-";
const CACHE = `${PRAEFIX}${VERSION}`;
const REPARATUR = "reparatur.html";

const adresse = (datei) => new URL(datei, self.registration.scope).href;

/** Relative Verweise einer index.html auf eigene Dateien („./assets/…“, „./icons/…“) */
function verweise(html) {
  return [...new Set([...html.matchAll(/(?:src|href)="\.\/([^"?#]+)"/g)].map((m) => m[1]))];
}

/** Ist ein Cache in sich stimmig: index.html vorhanden und jede verwiesene Datei im selben Cache? */
async function stimmig(cache) {
  const index = await cache.match(adresse("index.html"));
  if (!index) return false;
  for (const datei of verweise(await index.text())) if (!(await cache.match(adresse(datei)))) return false;
  return true;
}

/** Gibt es eine ältere eigene Fassung, deren Cache beschädigt ist? */
async function aeltereBeschaedigt() {
  for (const name of await caches.keys()) {
    if (!name.startsWith(PRAEFIX) || name === CACHE) continue;
    if (!(await stimmig(await caches.open(name)))) return true;
  }
  return false;
}

self.addEventListener("install", (ereignis) => {
  ereignis.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Am HTTP-Cache vorbei: Eine noch gültige ältere index.html darf nicht in den Cache dieser Fassung geraten
      await cache.addAll(DATEIEN.map((d) => new Request(adresse(d), { cache: "reload" })));
      const index = await cache.match(adresse("index.html"));
      const fremd = index ? verweise(await index.text()).filter((d) => !DATEIEN.includes(d)) : ["index.html"];
      if (fremd.length || !(await stimmig(cache))) {
        // Etwa wenn der Server kurz nach einer Veröffentlichung noch die alte index.html ausliefert: nicht
        // installieren; der Browser versucht es bei einem späteren Aufruf erneut, die bisherige Fassung bleibt.
        await caches.delete(CACHE);
        throw new Error(`index.html gehört nicht zu dieser Fassung (${VERSION}): ${fremd.join(", ")}`);
      }
      if (await aeltereBeschaedigt()) await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (ereignis) => {
  ereignis.waitUntil(
    (async () => {
      const beschaedigt = await aeltereBeschaedigt();
      const alte = (await caches.keys()).filter((n) => n.startsWith(PRAEFIX) && n !== CACHE);
      await Promise.all(alte.map((n) => caches.delete(n)));
      await self.clients.claim();
      if (!beschaedigt) return;
      // Fenster mit einer nicht startenden älteren Fassung einmal neu laden; die neue Fassung ist stimmig,
      // ein weiterer Neustart folgt daraus nicht
      for (const fenster of await self.clients.matchAll({ type: "window" })) {
        if (fenster.url.startsWith(self.registration.scope) && !fenster.url.includes(REPARATUR)) fenster.navigate(fenster.url).catch(() => undefined);
      }
    })(),
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

  if (anfrage.mode === "navigate") {
    // Reparaturseite: immer sie selbst, aus dem Netz, sonst aus dem Cache; nie die index.html der App
    if (url.pathname.endsWith(`/${REPARATUR}`)) {
      ereignis.respondWith(fetch(anfrage).catch(() => caches.match(adresse(REPARATUR))));
      return;
    }
    // Übrige Seitenaufrufe: die vorgehaltene index.html (Einzelseiten-App), Netz nur als Rückfall
    ereignis.respondWith(
      caches
        .open(CACHE)
        .then((c) => c.match(adresse("index.html")))
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
