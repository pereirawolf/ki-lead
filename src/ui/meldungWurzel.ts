// Ganze Meldung für Felder, die über ihren eigenen Wert hinaus lesen (seit 0.9.11): Nummern, die in der Meldung eindeutig
// sind (Zeitstrahl), und Verweise auf andere Listen (Belege auf das Quellenverzeichnis, Empfehlung einer Frist).
// Die Maske setzt sie im Schritt (Meldung.tsx), ein Feld der obersten Ebene ohne Maske (segs = []) mit seinem eigenen Wert.

import { createContext } from "react";

export const MeldungWurzelKontext = createContext<unknown>(undefined);
