// Beispielmeldungen des fiktiven Datensatzes Orkantief „Ilka“ mit eindeutiger, benannter Auswahl.
import { jsonDateien } from "./dateien";

/** v1-Fassung der Meldungen (eingefroren, lead-beispiel 1.44.0); die v2-Fassung steht unter ILKA_V2_ORDNER */
export const ILKA_ORDNER = "tests/fixtures/lead-beispiel-v1/beispiele/orkantief-ilka";
export const ILKA_V2_ORDNER = "profile/lead-beispiel/beispiele/orkantief-ilka";

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

/** Meldung des Datensatzes in der v2-Fassung des Beispielprofils (seit 0.9.0), frisch geklont. */
export function ilkaMeldungV2(kennung: IlkaKennung): any {
  const treffer = jsonDateien(ILKA_V2_ORDNER, { pflicht: true }).filter((x) => x.name.includes(`_${kennung}_`));
  if (treffer.length !== 1) throw new Error(`Beispielmeldung v2 „${kennung}“: ${treffer.length} Treffer in ${ILKA_V2_ORDNER}`);
  return structuredClone(treffer[0]!.daten);
}
