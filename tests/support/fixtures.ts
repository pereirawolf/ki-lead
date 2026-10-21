// Beispielmeldungen des fiktiven Datensatzes Orkantief „Ilka“ mit eindeutiger, benannter Auswahl.
import { jsonDateien } from "./dateien";

export const ILKA_ORDNER = "profile/lead-beispiel/beispiele/orkantief-ilka";

/** Kennzeichen im Dateinamen (…_<Kennung>_…); „Bund“ ist die verdichtete Meldung der Koordinierungsstelle */
export const ILKA_KENNUNGEN = ["Bund", "HE", "NI", "NW", "RP", "ST", "TH"] as const;
export type IlkaKennung = (typeof ILKA_KENNUNGEN)[number];

/** Alle sieben Meldungen (Pflicht), sortiert, jeweils frisch. */
export function ilkaDateien(): { name: string; daten: any }[] {
  return jsonDateien(ILKA_ORDNER, { pflicht: true });
}

/** Die Ländermeldungen ohne die verdichtete Bundesmeldung. */
export function ilkaEingaenge(): { name: string; daten: any }[] {
  return ilkaDateien().filter((x) => !x.name.includes("_Bund_"));
}

/** Genau eine Meldung über ihr Kennzeichen; null oder mehrere Treffer brechen mit verständlicher Meldung ab. */
export function ilkaDatei(kennung: IlkaKennung): { name: string; daten: any } {
  const treffer = ilkaDateien().filter((x) => x.name.includes(`_${kennung}_`));
  if (treffer.length !== 1) throw new Error(`Beispielmeldung „${kennung}“: ${treffer.length} Treffer in ${ILKA_ORDNER} (erwartet genau einer: …_${kennung}_…)`);
  return treffer[0];
}

/** Daten einer Beispielmeldung, frisch geklont (Änderungen eines Tests wirken nicht auf andere). */
export function ilkaMeldung(kennung: IlkaKennung): any {
  return structuredClone(ilkaDatei(kennung).daten);
}
