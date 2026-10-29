// Fehlergrenze an der Wurzel der App (seit 0.5.2): Scheitert das Zeichnen außerhalb der Ansichten (die eigene
// Fehlergrenzen haben), etwa durch unerwartete gespeicherte Daten, erscheint statt einer leeren Seite ein Hinweis mit
// Neuladen und dem Weg zur Reparaturseite. Gespeicherte Daten werden dabei weder gelesen noch verändert.
import { Component, type ReactNode } from "react";

interface Zustand {
  fehler: Error | null;
}

export class StartFehlergrenze extends Component<{ children: ReactNode }, Zustand> {
  state: Zustand = { fehler: null };

  static getDerivedStateFromError(fehler: Error): Zustand {
    return { fehler };
  }

  render() {
    const { fehler } = this.state;
    if (!fehler) return this.props.children;
    return (
      <div className="startfehler" role="alert">
        <h1>KI-LEAD konnte nicht gestartet werden</h1>
        <p>Beim Aufbau der Oberfläche ist ein Fehler aufgetreten: {fehler.message || String(fehler)}</p>
        <p>Meldungen, Zwischenstände, Profile, Einstellungen und API-Schlüssel bleiben auf diesem Gerät gespeichert.</p>
        <p>
          <button type="button" className="knopf primaer" onClick={() => window.location.reload()}>
            Erneut laden
          </button>{" "}
          <a href="./reparatur.html">Programmdateien reparieren</a>
        </p>
      </div>
    );
  }
}
