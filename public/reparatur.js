// Reparaturseite von KI-LEAD (seit 0.5.2), ohne Abhängigkeit vom App-Bundle. Entfernt nach ausdrücklicher Betätigung
// nur die Service-Worker-Registrierung genau dieses Bereichs (Scope dieses Ordners) und die Caches mit dem Präfix
// „ki-lead-“. IndexedDB, localStorage und alle anderen Registrierungen und Caches derselben Adresse bleiben unberührt.
// Kein automatisches Neuladen.
(function () {
  "use strict";
  var BEREICH = new URL("./", window.location.href).href;
  var PRAEFIX = "ki-lead-";
  var zustand = document.getElementById("zustand");
  var knopf = document.getElementById("zuruecksetzen");
  var ergebnis = document.getElementById("ergebnis");
  var oeffnen = document.getElementById("oeffnen");

  function eigeneRegistrierungen() {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.getRegistrations) return Promise.resolve([]);
    return navigator.serviceWorker.getRegistrations().then(function (alle) {
      return alle.filter(function (r) {
        return r.scope === BEREICH;
      });
    });
  }

  function eigeneCaches() {
    if (!("caches" in window)) return Promise.resolve([]);
    return caches.keys().then(function (namen) {
      return namen.filter(function (n) {
        return n.indexOf(PRAEFIX) === 0;
      });
    });
  }

  function melden(ziel, art, text) {
    ziel.className = "kasten" + (art ? " " + art : "");
    ziel.textContent = text;
  }

  function ermitteln() {
    return Promise.all([eigeneRegistrierungen(), eigeneCaches()]).then(function (e) {
      var regs = e[0];
      var namen = e[1];
      var teile = [];
      teile.push(regs.length ? "Service Worker angemeldet (" + BEREICH + ")" : "kein Service Worker angemeldet");
      teile.push(namen.length ? "Zwischenspeicher: " + namen.join(", ") : "keine Zwischenspeicher von KI-LEAD");
      melden(zustand, "", teile.join(" · "));
      knopf.disabled = !regs.length && !namen.length;
      return { regs: regs, namen: namen };
    });
  }

  knopf.addEventListener("click", function () {
    knopf.disabled = true;
    melden(ergebnis, "", "Wird zurückgesetzt …");
    var fehler = [];
    ermitteln()
      .then(function (z) {
        var schritte = z.regs.map(function (r) {
          return r.unregister().then(
            function (ok) {
              if (!ok) fehler.push("Abmeldung des Service Workers abgelehnt");
            },
            function (e) {
              fehler.push("Service Worker: " + ((e && e.message) || e));
            },
          );
        });
        z.namen.forEach(function (n) {
          schritte.push(
            caches.delete(n).catch(function (e) {
              fehler.push("Zwischenspeicher " + n + ": " + ((e && e.message) || e));
            }),
          );
        });
        return Promise.all(schritte);
      })
      .then(ermitteln)
      .then(function (danach) {
        if (fehler.length || danach.regs.length || danach.namen.length) {
          melden(
            ergebnis,
            "fehler",
            "Nicht vollständig zurückgesetzt" +
              (fehler.length ? ": " + fehler.join("; ") : "") +
              ". Deine Daten sind unverändert. Bitte alle Fenster mit KI-LEAD schließen und diese Seite erneut aufrufen.",
          );
          knopf.disabled = false;
          return;
        }
        melden(ergebnis, "ok", "Erledigt. Die Programmdateien werden beim nächsten Öffnen neu geladen; deine Daten sind unverändert.");
        // Neuer Aufruf mit Zeitmarke, damit keine ältere index.html aus dem Browser-Cache kommt
        oeffnen.href = "./?neu=" + Date.now();
        oeffnen.focus();
      })
      .catch(function (e) {
        melden(ergebnis, "fehler", "Fehler beim Zurücksetzen: " + ((e && e.message) || e) + ". Deine Daten sind unverändert.");
        knopf.disabled = false;
      });
  });

  ermitteln().catch(function (e) {
    melden(zustand, "fehler", "Zustand nicht ermittelbar: " + ((e && e.message) || e));
    knopf.disabled = false;
  });
})();
