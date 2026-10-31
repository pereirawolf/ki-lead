// Bereich „Daten“ in den Einstellungen (seit 0.6.15, TP-2026-W44-44, -45): Gerätestand sichern und wiederherstellen,
// alle Daten dieses Geräts löschen. Die Logik liegt in src/speicher/sicherung.ts; Schlüssel im Schlüsselbund und das
// Farbschema im localStorage löscht dieser Bereich über ihre eigenen Schichten mit.
import { useRef, useState } from "react";
import { exportStempel, mitDatum } from "../kern/ausgabe";
import { startLoeschen } from "../darstellung/speicher";
import { alleSchluesselEntfernen } from "../schluessel/ablage";
import { dateiAnbieten } from "../speicher/speicher";
import { geraetestandLoeschen, sicherungEinspielen, sicherungErstellen, sicherungLesen } from "../speicher/sicherung";
import { bestaetigen } from "./bestaetigung";

export interface DatenBereichProps {
  /** Zeitzone des Profils für den Dateinamen */
  zeitzone?: string;
  /** Neustart nach Wiederherstellung oder Löschen; Vorgabe: Seite neu laden */
  neuStarten?: () => void;
}

export function DatenBereich({ zeitzone, neuStarten = () => window.location.reload() }: DatenBereichProps) {
  const eingabe = useRef<HTMLInputElement>(null);
  const [meldung, setMeldung] = useState<{ text: string; fehler?: boolean } | null>(null);
  const [beschaeftigt, setBeschaeftigt] = useState(false);

  const sichern = async () => {
    setMeldung(null);
    setBeschaeftigt(true);
    try {
      const { text, eintraege } = await sicherungErstellen();
      dateiAnbieten(text, mitDatum(exportStempel(zeitzone), "KI-LEAD_Sicherung", "json"), "application/json");
      setMeldung({ text: `Sicherung mit ${eintraege} Einträgen erstellt. Sie enthält Inhalte, aber keine API-Schlüssel.` });
    } catch (e) {
      setMeldung({ text: `Die Sicherung ist gescheitert: ${(e as Error)?.message || String(e)}`, fehler: true });
    } finally {
      setBeschaeftigt(false);
    }
  };

  const wiederherstellen = async (datei: File | undefined) => {
    if (!datei) return;
    setMeldung(null);
    try {
      const s = sicherungLesen(await datei.text());
      const ok = await bestaetigen(
        `Sicherung vom ${new Date(s.erstellt).toLocaleString("de-DE")} (KI-LEAD ${s.app}) einspielen? Profile, Meldungen, Lagebild, Läufe, Einstellungen und Testläufe dieses Geräts werden dadurch ersetzt. API-Schlüssel bleiben unverändert.`,
        { ja: "Sicherung einspielen" },
      );
      if (!ok) return;
      setBeschaeftigt(true);
      await sicherungEinspielen(s);
      // Neustart erst nach dem Ende des Ereignisses der Dateiauswahl: WebKit stürzte beim sofortigen Neuladen ab
      setTimeout(neuStarten, 100);
    } catch (e) {
      setMeldung({ text: `Die Sicherung wurde nicht eingespielt: ${(e as Error)?.message || String(e)}`, fehler: true });
    } finally {
      setBeschaeftigt(false);
    }
  };

  const loeschen = async () => {
    setMeldung(null);
    const ok = await bestaetigen(
      "Alle Daten dieses Geräts löschen? Entfernt werden Profile, Meldungen, Lagebild, Laufprotokolle, Einstellungen, Testläufe, das Farbschema und alle API-Schlüssel. Das lässt sich nicht rückgängig machen; vorher „Gerätestand sichern“ wählen, wenn etwas erhalten bleiben soll.",
      { ja: "Alle Daten löschen" },
    );
    if (!ok) return;
    setBeschaeftigt(true);
    try {
      await alleSchluesselEntfernen();
      await geraetestandLoeschen();
      startLoeschen();
      neuStarten();
    } catch (e) {
      setMeldung({ text: `Das Löschen ist gescheitert: ${(e as Error)?.message || String(e)}`, fehler: true });
      setBeschaeftigt(false);
    }
  };

  return (
    <section className="schritt-inhalt abschnitt-einzeln" aria-labelledby="daten-titel">
      <h2 id="daten-titel">Daten</h2>
      <p className="einleitung">
        Alle Inhalte liegen nur auf diesem Gerät in diesem Browser bzw. dieser App. Eine Sicherung überträgt sie auf ein anderes Gerät oder bewahrt sie vor dem
        Löschen von Websitedaten.
      </p>

      <h3>Gerätestand sichern und wiederherstellen</h3>
      <p className="hinweis">
        Die Sicherung ist eine JSON-Datei mit Profilen, Meldungen, Lagebild, Laufprotokollen, Einstellungen und Testläufen, ohne API-Schlüssel. Sie enthält die
        Inhalte im Klartext; bitte wie das verwendete Material behandeln. Das Einspielen ersetzt den Stand dieses Geräts.
      </p>
      <div className="aktionen">
        <button type="button" className="knopf" disabled={beschaeftigt} onClick={() => void sichern()}>
          Gerätestand sichern
        </button>
        <button type="button" className="knopf" disabled={beschaeftigt} onClick={() => eingabe.current?.click()}>
          Gerätestand wiederherstellen
        </button>
      </div>
      <input
        ref={eingabe}
        type="file"
        hidden
        accept=".json,application/json"
        aria-label="Sicherungsdatei wählen"
        onChange={(e) => {
          void wiederherstellen(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <h3>Alle Daten dieses Geräts löschen</h3>
      <p className="hinweis">
        Entfernt alle Inhalte, Einstellungen und API-Schlüssel der App auf diesem Gerät, in der nativen App auch die Schlüssel im Schlüsselbund. Die
        Programmdateien bleiben; Startprobleme behebt die Reparaturseite.
      </p>
      <div className="aktionen">
        <button type="button" className="knopf" disabled={beschaeftigt} onClick={() => void loeschen()}>
          Alle Daten dieses Geräts löschen
        </button>
      </div>

      {meldung && (
        <p className={meldung.fehler ? "hinweis fehler" : "hinweis"} role={meldung.fehler ? "alert" : "status"}>
          {meldung.text}
        </p>
      )}
    </section>
  );
}
