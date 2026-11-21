// Einleitung eines Bearbeitungsschritts mit Links auf Dateien des Profils (seit 0.9.10, Profilformat 1.38; Entscheidung des
// Herausgebers vom 21.11.2026): Ein Link in Markdown-Form, etwa „[Kodierleitfaden des Profils](kodierleitfaden.md)“, öffnet
// die Datei direkt unter der Einleitung, ohne die Erfassung zu verlassen. Ein zweiter Klick schließt sie. Links im geöffneten
// Dokument auf weitere Dateien oder SOPs des Pakets wechseln das Dokument an derselben Stelle. Ziele außerhalb des Pakets
// erscheinen als Text; beim Laden warnt die Prüfung der Darstellungsdatei.

import { Fragment, useId, useState } from "react";
import { einleitungsTeile } from "../kern/einleitung";
import type { Profil } from "../kern/typen";
import { Lesetext } from "./Lesetext";

export function Einleitung({ text, profil }: { text: string; profil: Profil }) {
  const [offen, setOffen] = useState<string | null>(null);
  const id = useId();
  const teile = einleitungsTeile(text, profil.dateien);
  // Links im geöffneten Dokument: andere Datei oder SOP des Pakets an derselben Stelle zeigen
  const oeffnen = (ziel: string) => {
    const [art, ...r] = ziel.split(":");
    const wert = r.join(":");
    const pfad = art === "sop" ? profil.sops.find((s) => s.id === wert)?.datei : wert;
    if (pfad && typeof profil.dateien[pfad] === "string") setOffen(pfad);
  };
  return (
    <>
      <p className="einleitung">
        {teile.map((t, i) =>
          t.ziel ? (
            <button
              key={i}
              type="button"
              className="text-knopf"
              aria-expanded={offen !== null && offen === t.ziel}
              aria-controls={`${id}-dokument`}
              onClick={() => setOffen((o) => (o === t.ziel ? null : t.ziel!))}
            >
              {t.text}
            </button>
          ) : (
            <Fragment key={i}>{t.text}</Fragment>
          ),
        )}
      </p>
      <div id={`${id}-dokument`} className="einleitung-dokument" hidden={offen === null}>
        {offen !== null && (
          <>
            <Lesetext
              text={profil.dateien[offen] ?? ""}
              von={offen}
              profil={profil}
              oeffnen={oeffnen}
              original={{ text: profil.dateien[offen] ?? "", dateiname: offen.replace(/^.*\//, "") }}
            />
            <button type="button" className="knopf leise" onClick={() => setOffen(null)}>
              Schließen
            </button>
          </>
        )}
      </div>
    </>
  );
}
