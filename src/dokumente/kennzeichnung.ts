// Maschinenlesbare Kennzeichnung KI-erzeugter Ausgaben (KI-Verordnung Art. 50 Abs. 2; docs/KI-VERORDNUNG.md, 6.1).
//
// Grundlage ist die Angabe im Entstehungsfeld der Meldung (`ui.rollen.entstehung_feld`, z. B. `_entstehung.verfahren`):
// „KI-Entwurf“ = KI-erzeugt, jede andere Angabe = nicht KI-erzeugt, fehlendes Feld = unbekannt. Die App erfindet keine
// Herkunft: Was das Entstehungsfeld nicht sagt, steht als „unbekannt“ in den Metadaten.
//
// Grenzen: Ein Wasserzeichen im Text erzeugt KI-LEAD nicht (fremde Modelle), und die Metadaten sind nicht signiert.

import type { Meldung, Profil } from "../kern/typen";
import { APP_KENNUNG } from "../kern/version";

export type KiHerkunft = "ki" | "manuell" | "unbekannt";

/** IPTC Digital Source Type für Inhalte, die ganz oder teilweise von einem trainierten Modell stammen */
export const IPTC_KI_TEILWEISE = "http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia";

export interface Herkunftsangabe {
  herkunft: KiHerkunft;
  modell?: string;
  werkzeug?: string;
  erstellt?: string;
}

/** Herkunft einer Meldung aus ihrem Entstehungsfeld */
export function herkunftAusMeldung(d: Meldung | undefined, profil: Profil): Herkunftsangabe {
  const feld = profil.ui.rollen?.entstehung_feld;
  const e = feld && d && typeof d === "object" ? (d as Record<string, any>)[feld] : undefined;
  if (!e || typeof e !== "object" || typeof e.verfahren !== "string" || !e.verfahren) return { herkunft: "unbekannt" };
  const text = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  return {
    herkunft: e.verfahren === "KI-Entwurf" ? "ki" : "manuell",
    modell: text(e.modell),
    werkzeug: text(e.werkzeug),
    erstellt: text(e.erstellt),
  };
}

/** Zusammengefasste Herkunft mehrerer Meldungen: KI, sobald eine KI-erzeugt ist; manuell nur, wenn alle manuell sind */
export function herkunftMehrerer(angaben: Herkunftsangabe[]): KiHerkunft {
  if (angaben.some((a) => a.herkunft === "ki")) return "ki";
  if (angaben.length && angaben.every((a) => a.herkunft === "manuell")) return "manuell";
  return "unbekannt";
}

export const HERKUNFT_TEXT: Record<KiHerkunft, string> = {
  ki: "KI-generiert (Entwurf mit KI-Unterstützung)",
  manuell: "manuell erstellt",
  unbekannt: "Herkunft nicht angegeben",
};

/** Schlüsselwörter für die Dokumenteigenschaften eines PDF */
export function pdfSchluesselwoerter(herkunft: KiHerkunft): string {
  return ["KI-LEAD", herkunft === "ki" ? "KI-generiert" : herkunft === "manuell" ? "manuell" : "Herkunft unbekannt"].join(", ");
}

function xml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/**
 * Vollständiges XMP-Paket (roh, für `addMetadata(…, true)`): Titel, Sprache, Werkzeug und – bei KI-Herkunft – der
 * IPTC Digital Source Type. Alle Werte werden XML-maskiert.
 */
export function xmpPaket(o: { titel: string; herkunft: KiHerkunft; modell?: string; sprache?: string }): string {
  const sprache = o.sprache || "de-DE";
  const ki = o.herkunft === "ki";
  return [
    `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>`,
    `<x:xmpmeta xmlns:x="adobe:ns:meta/">`,
    `<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">`,
    `<rdf:Description rdf:about=""`,
    ` xmlns:dc="http://purl.org/dc/elements/1.1/"`,
    ` xmlns:xmp="http://ns.adobe.com/xap/1.0/"`,
    ` xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/"`,
    ` xmlns:kilead="https://github.com/pereirawolf/ki-lead/ns/1.0/">`,
    `<dc:title><rdf:Alt><rdf:li xml:lang="${xml(sprache)}">${xml(o.titel)}</rdf:li></rdf:Alt></dc:title>`,
    `<dc:language><rdf:Bag><rdf:li>${xml(sprache)}</rdf:li></rdf:Bag></dc:language>`,
    `<xmp:CreatorTool>${xml(APP_KENNUNG)}</xmp:CreatorTool>`,
    ki ? `<Iptc4xmpExt:DigitalSourceType>${IPTC_KI_TEILWEISE}</Iptc4xmpExt:DigitalSourceType>` : "",
    `<kilead:herkunft>${o.herkunft}</kilead:herkunft>`,
    ki && o.modell ? `<kilead:modell>${xml(o.modell)}</kilead:modell>` : "",
    `</rdf:Description>`,
    `</rdf:RDF>`,
    `</x:xmpmeta>`,
    `<?xpacket end="w"?>`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Kopfzeile für die Management Summary als Text. Die Kurzfassung entsteht immer durch ein KI-Modell; die Zeile nennt
 * Werkzeug und Modell. Sie steht nur in der heruntergeladenen Datei, nicht im Text zum Kopieren.
 */
export function kurzfassungKopf(modell: string | undefined): string {
  return `[KI-generiert mit ${APP_KENNUNG}${modell ? `, Modell ${modell}` : ""}; vor Verwendung fachlich prüfen]`;
}

/** Text der Management Summary für die TXT-Datei: Kopfzeile, Leerzeile, unveränderter Text */
export function kurzfassungAlsDatei(text: string, modell: string | undefined): string {
  return `${kurzfassungKopf(modell)}\n\n${text}`;
}
