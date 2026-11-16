// Zeitzone der bearbeiteten Meldung (Feld `zeitzone` nach LEAD-Meldung-v2, seit 0.9.5). Zeitfelder rechnen in dieser
// Zone zwischen Wanduhrzeit und UTC-Versatz um; ohne Angabe gilt die Zone des Profils.

import { createContext } from "react";

export const MeldungZoneKontext = createContext<string | undefined>(undefined);
