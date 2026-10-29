// Einstellungen im Gerätespeicher (seit 0.6.3, TP-2026-W44-24, aus src/pipeline/einstellungen.ts). Die Umstellung
// älterer Fassungen ist eine reine Funktion der Pipeline (`einstellungenMigrieren`); hier wird nur gelesen und geschrieben.

import { get, set } from "idb-keyval";
import { einstellungenMigrieren, type Einstellungen } from "../pipeline/einstellungen";

export async function einstellungenLesen(): Promise<Einstellungen> {
  return einstellungenMigrieren(await get<Partial<Einstellungen>>("einstellungen"));
}

export async function einstellungenSchreiben(e: Einstellungen): Promise<void> {
  await set("einstellungen", e);
}
