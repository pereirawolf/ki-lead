// Bestätigungsdialog der App (seit 0.6.5, TP-2026-W44-20) anstelle von window.confirm(): bis 0.6.4 öffneten 17 Stellen
// den nativen Dialog, der sich nicht gestalten lässt und in Capacitor teils stumm bleibt. Der Dialog ist ein modales
// <dialog> (showModal: Hintergrund inert), hält den Fokus zwischen seinen Schaltflächen, schließt mit Escape als
// „Abbrechen“ und gibt den Fokus danach an das zuvor fokussierte Element zurück. Ohne React, damit auch Funktionen
// außerhalb von Komponenten ihn nutzen können.

export interface BestaetigungOptionen {
  /** Text der bestätigenden Schaltfläche (Vorgabe „Bestätigen“) */
  ja?: string;
  /** Text der ablehnenden Schaltfläche (Vorgabe „Abbrechen“) */
  nein?: string;
}

let laufendeNummer = 0;

/** Zeigt die Frage und liefert true bei Bestätigung, false bei „Abbrechen“ oder Escape */
export function bestaetigen(frage: string, optionen: BestaetigungOptionen = {}): Promise<boolean> {
  return new Promise<boolean>((fertig) => {
    const vorher = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const nr = ++laufendeNummer;
    const dialog = document.createElement("dialog");
    dialog.className = "rueckfrage";
    dialog.setAttribute("aria-labelledby", `rueckfrage-${nr}-text`);
    const text = document.createElement("p");
    text.className = "rueckfrage-text";
    text.id = `rueckfrage-${nr}-text`;
    text.textContent = frage;
    const aktionen = document.createElement("div");
    aktionen.className = "aktionen";
    const knopf = (beschriftung: string, klasse: string, antwort: "ja" | "nein") => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = klasse;
      b.dataset.antwort = antwort;
      b.textContent = beschriftung;
      return b;
    };
    const nein = knopf(optionen.nein ?? "Abbrechen", "knopf", "nein");
    const ja = knopf(optionen.ja ?? "Bestätigen", "knopf primaer", "ja");
    aktionen.append(nein, ja);
    dialog.append(text, aktionen);

    let erledigt = false;
    const schliessen = (antwort: boolean) => {
      if (erledigt) return;
      erledigt = true;
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      dialog.remove();
      if (vorher?.isConnected) vorher.focus();
      fertig(antwort);
    };
    ja.addEventListener("click", () => schliessen(true));
    nein.addEventListener("click", () => schliessen(false));
    // Escape: bei showModal als „cancel“, sonst als Taste
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      schliessen(false);
    });
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        schliessen(false);
      } else if (e.key === "Tab") {
        // Fokus bleibt im Dialog (die Browser lassen sonst den Wechsel in die Adressleiste zu)
        e.preventDefault();
        (document.activeElement === ja ? nein : ja).focus();
      }
    });

    document.body.appendChild(dialog);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    // Vorgabe ist die Schaltfläche, die nichts verändert
    if (!erledigt) nein.focus();
  });
}
