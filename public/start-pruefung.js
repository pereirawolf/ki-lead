// Startprüfung von KI-LEAD (seit 0.5.2). Klassisches Skript ohne Abhängigkeit vom App-Bundle, vor dem Hauptprogramm
// geladen: Scheitert das Laden einer Programmdatei oder ist die App nach längerer Zeit nicht gestartet, erscheint ein
// Hinweis mit dem Weg zur Reparaturseite. Kein automatisches Neuladen, keine Änderung an gespeicherten Daten.
// Der Hinweis steht im Wurzelelement der App; startet die App doch noch, ersetzt sie ihn.
(function () {
  "use strict";
  var KENNUNG = "ki-lead-startfehler";

  function gestartet() {
    var wurzel = document.getElementById("root");
    return !!wurzel && wurzel.childElementCount > 0 && !document.getElementById(KENNUNG);
  }

  function element(name, text, attribute) {
    var e = document.createElement(name);
    if (text) e.textContent = text;
    for (var k in attribute || {}) e.setAttribute(k, attribute[k]);
    return e;
  }

  function anzeigen(grund) {
    var wurzel = document.getElementById("root");
    if (!wurzel || gestartet() || document.getElementById(KENNUNG)) return;
    var kasten = element("div", "", {
      id: KENNUNG,
      role: "alert",
      class: "startfehler",
      style: "max-width:40rem;margin:2rem auto;padding:0 1rem;font-family:system-ui,-apple-system,sans-serif;line-height:1.5",
    });
    kasten.appendChild(element("h1", "KI-LEAD startet nicht"));
    kasten.appendChild(element("p", grund));
    kasten.appendChild(element("p", "Deine Meldungen, Zwischenstände, Profile, Einstellungen und API-Schlüssel bleiben auf diesem Gerät gespeichert."));
    var aktionen = element("p");
    var neu = element("button", "Erneut laden", { type: "button" });
    neu.addEventListener("click", function () {
      window.location.reload();
    });
    aktionen.appendChild(neu);
    aktionen.appendChild(document.createTextNode(" "));
    aktionen.appendChild(element("a", "Programmdateien reparieren", { href: "./reparatur.html" }));
    kasten.appendChild(aktionen);
    wurzel.appendChild(kasten);
  }

  // Programmdatei (Skript oder Stylesheet) nicht ladbar: kurz warten, ob die App trotzdem startet
  window.addEventListener(
    "error",
    function (ereignis) {
      var ziel = ereignis.target;
      if (!ziel || (ziel.tagName !== "SCRIPT" && ziel.tagName !== "LINK")) return;
      setTimeout(function () {
        anzeigen("Eine Programmdatei dieser Fassung konnte nicht geladen werden.");
      }, 1500);
    },
    true,
  );

  // Rückfall: nach längerer Zeit noch nicht gestartet (auch bei sehr langsamen Geräten erst nach 20 Sekunden)
  setTimeout(function () {
    anzeigen("Die App ist nach 20 Sekunden nicht gestartet. Möglicherweise passen gespeicherte Programmdateien nicht zusammen.");
  }, 20000);
})();
