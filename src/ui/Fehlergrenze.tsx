// Fehlergrenze: Fängt Darstellungsfehler (z. B. durch eine fehlerhafte Meldungsdatei) ab und bietet
// Wiederherstellung an, statt die ganze App mit einer leeren Seite stehen zu lassen.

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Ändert sich der Schlüssel, wird die Grenze zurückgesetzt */
  schluessel?: string;
  /** Daten, die sich vor dem Zurücksetzen noch sichern lassen */
  sichern?: () => void;
  zuruecksetzen?: () => void;
  zuruecksetzenText?: string;
}

interface Zustand {
  fehler: Error | null;
  schluessel?: string;
}

export class Fehlergrenze extends Component<Props, Zustand> {
  state: Zustand = { fehler: null, schluessel: this.props.schluessel };

  static getDerivedStateFromError(fehler: Error): Partial<Zustand> {
    return { fehler };
  }

  static getDerivedStateFromProps(p: Props, z: Zustand): Partial<Zustand> | null {
    return p.schluessel !== z.schluessel ? { fehler: null, schluessel: p.schluessel } : null;
  }

  render() {
    if (!this.state.fehler) return this.props.children;
    return (
      <div className="kasten kasten-fehler" role="alert">
        <h3>Diese Ansicht konnte nicht dargestellt werden</h3>
        <p>
          Wahrscheinlich enthält die geöffnete Meldung Werte, die nicht zum Schema passen (z. B. ein Objekt, wo ein Text erwartet wird). Technische Meldung:{" "}
          {this.state.fehler.message}
        </p>
        <div className="aktionen">
          {this.props.sichern && (
            <button type="button" className="knopf" onClick={this.props.sichern}>
              Daten als JSON sichern
            </button>
          )}
          {this.props.zuruecksetzen && (
            <button
              type="button"
              className="knopf primaer"
              onClick={() => {
                this.props.zuruecksetzen!();
                this.setState({ fehler: null });
              }}
            >
              {this.props.zuruecksetzenText || "Zurücksetzen"}
            </button>
          )}
          <button type="button" className="knopf leise" onClick={() => this.setState({ fehler: null })}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }
}
