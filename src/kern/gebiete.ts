// Amtliche Gebietsschlüssel und Gebietsverzeichnis (seit 0.9.7, Entscheidungen des Herausgebers vom 21.11.2026).
//
// Regel: Gebiete in Deutschland tragen den amtlichen Schlüssel in Ziffern – Land 2-stellig (16), Regierungsbezirk
// 3-stellig, Kreis 5-stellig (16072), Gemeinde 8-stellig als Amtlicher Gemeindeschlüssel (16072018). Staaten tragen
// ISO 3166-1 (DE, CZ). So liegt jedes Gebiet am Präfix erkennbar in seinem übergeordneten (16 ⊃ 16072 ⊃ 16072018).
// ISO-Codes der Länder (DE-TH) und der 12-stellige Regionalschlüssel bleiben lesbar und werden beim Vergleich und bei
// der Eingabe umgerechnet. Das Verzeichnis selbst stammt aus dem Gemeindeverzeichnis-Informationssystem GV-ISys der
// Statistischen Ämter des Bundes und der Länder (scripts/gebietsverzeichnis.mjs, formate/fremd/gv-isys/).

/** Länder nach ISO 3166-2:DE und ihr Schlüssel im Amtlichen Gemeindeschlüssel */
export const LAND_ISO_ZU_ZIFFERN: Readonly<Record<string, string>> = {
  "DE-SH": "01",
  "DE-HH": "02",
  "DE-NI": "03",
  "DE-HB": "04",
  "DE-NW": "05",
  "DE-HE": "06",
  "DE-RP": "07",
  "DE-BW": "08",
  "DE-BY": "09",
  "DE-SL": "10",
  "DE-BE": "11",
  "DE-BB": "12",
  "DE-MV": "13",
  "DE-SN": "14",
  "DE-ST": "15",
  "DE-TH": "16",
};

/**
 * Schlüssel in der Form der Regel: „DE-TH“ → „16“, 12-stelliger Regionalschlüssel einer Gemeinde → 8-stelliger
 * Gemeindeschlüssel (Stellen 1–5 und 10–12), Leerraum entfernt. Alles andere bleibt, wie es ist.
 */
export function normSchluessel(s: unknown): string {
  if (typeof s !== "string") return "";
  const t = s.replace(/\s+/g, "").toUpperCase();
  if (LAND_ISO_ZU_ZIFFERN[t]) return LAND_ISO_ZU_ZIFFERN[t];
  if (/^\d{12}$/.test(t)) return `${t.slice(0, 5)}${t.slice(9)}`;
  return t;
}

const istZiffern = (s: string) => /^\d+$/.test(s);

/** Liegt Gebiet a in Gebiet b oder ist es b? Ziffern am Präfix, „DE“ umfasst jedes Gebiet mit Ziffernschlüssel. */
export function liegtIn(a: unknown, b: unknown): boolean {
  const x = normSchluessel(a);
  const y = normSchluessel(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (y === "DE") return istZiffern(x);
  return istZiffern(x) && istZiffern(y) && x.startsWith(y);
}

export const ueberlappen = (a: unknown, b: unknown): boolean => liegtIn(a, b) || liegtIn(b, a);

// ---------------------------------------------------------------------------------------------------------------
// Verzeichnis
// ---------------------------------------------------------------------------------------------------------------

export const GEBIETE_FORMAT = "ki-lead-gebiete/1";

/** Ebene eines Eintrags */
export type GebietEbene = "Staat" | "Land" | "Regierungsbezirk" | "Kreis" | "Gemeinde";

/** Datei des Verzeichnisses: Einträge als [Schlüssel, Name, Ebene] */
export interface GebietDatei {
  format: string;
  stand: string;
  quelle: string;
  /** Rechtevermerk der Herausgeber */
  rechte?: string;
  inhalt?: string;
  eintraege: [string, string, GebietEbene][];
}

export interface GebietEintrag {
  schluessel: string;
  name: string;
  ebene: GebietEbene;
}

export interface GebietVerzeichnis {
  stand: string;
  quelle: string;
  eintraege: GebietEintrag[];
  /** Schlüssel → Eintrag */
  nach: Map<string, GebietEintrag>;
}

export function verzeichnisAus(...dateien: (GebietDatei | undefined)[]): GebietVerzeichnis {
  const eintraege: GebietEintrag[] = [];
  const nach = new Map<string, GebietEintrag>();
  let stand = "";
  let quelle = "";
  for (const d of dateien) {
    if (!d || d.format !== GEBIETE_FORMAT || !Array.isArray(d.eintraege)) continue;
    stand ||= d.stand;
    quelle ||= d.quelle;
    for (const [schluessel, name, ebene] of d.eintraege) {
      if (nach.has(schluessel)) continue;
      const e = { schluessel, name, ebene };
      eintraege.push(e);
      nach.set(schluessel, e);
    }
  }
  return { stand, quelle, eintraege, nach };
}

/** Übergeordnete Einträge für die Anzeige („Thüringen“ zu einem Kreis, „Landkreis Sonneberg, Thüringen“ zu einer Gemeinde) */
export function kontext(v: GebietVerzeichnis, e: GebietEintrag): string {
  if (!istZiffern(e.schluessel) || e.schluessel.length <= 2) return "";
  const teile: string[] = [];
  if (e.schluessel.length === 8) {
    const kreis = v.nach.get(e.schluessel.slice(0, 5));
    // kreisfreie Stadt (Gemeindeschlüssel auf 000): Gemeinde und Kreis sind dasselbe Gebiet, der Kreis bringt keine Auskunft
    if (kreis && !(e.schluessel.endsWith("000") && gleicherKern(kreis.name, e.name))) teile.push(kreis.name);
  }
  const land = v.nach.get(e.schluessel.slice(0, 2));
  if (land) teile.push(land.name);
  return teile.join(", ");
}

/** Klein, ohne Umlaute und Satzzeichen, für Suche und Namensvergleich */
export function suchform(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Bezeichnungen der Gebietsart vor einem Namen („Landkreis Sonneberg“, „Freistaat Thüringen“) */
const VORN = [
  "landkreis",
  "kreisfreie stadt",
  "stadtkreis",
  "kreis",
  "regionalverband",
  "staedteregion",
  "region",
  "landeshauptstadt",
  "freie und hansestadt",
  "hansestadt",
  "stadt",
  "gemeinde",
  "markt",
  "freistaat",
  "land",
  "regierungsbezirk",
  "reg bez",
];
/** … und nach einem Namen („Sonneberg, Stadt“, „Ilm-Kreis“); „Land“ nicht, sonst verlöre „Weimarer Land“ einen Teil */
const HINTEN = ["landeshauptstadt", "hansestadt", "universitaetsstadt", "wissenschaftsstadt", "stadt", "landkreis", "kreis", "gemeinde", "markt"];
const ART_RE = new RegExp(`^(?:(?:${VORN.join("|")})\\s+)+|(?:\\s+(?:${HINTEN.join("|")}))+$`, "g");

/** Name ohne Art („Landkreis Sonneberg“, „Sonneberg, Stadt“ → „sonneberg“) */
export function kern(name: unknown): string {
  let t = suchform(name);
  for (let i = 0; i < 3; i++) t = t.replace(ART_RE, "").trim();
  return t;
}

const gleicherKern = (a: string, b: string) => kern(a) === kern(b);

/** „Stadt Erfurt“, „Hansestadt Rostock“, „Sonneberg, Stadt“ (in Suchform) */
const STADT_RE = /^(stadt|hansestadt|landeshauptstadt|universitaetsstadt)\b|\bstadt$/;

/** Hinweis auf die Ebene aus dem Namen selbst („Landkreis …“ → Kreis, „Stadt …“ → Kreis oder Gemeinde) */
function ebenenHinweis(name: string): GebietEbene[] | null {
  const s = suchform(name);
  if (/^(landkreis|kreis|stadtkreis|regionalverband)\b/.test(s) || /\b(landkreis|kreis)$/.test(s)) return ["Kreis"];
  if (/^kreisfreie stadt\b/.test(s)) return ["Kreis"];
  if (/^(regierungsbezirk|reg bez)\b/.test(s)) return ["Regierungsbezirk"];
  if (/^(gemeinde|markt)\b/.test(s)) return ["Gemeinde"];
  if (STADT_RE.test(s)) return ["Kreis", "Gemeinde"];
  return null;
}

const RANG: Record<GebietEbene, number> = { Staat: 0, Land: 1, Regierungsbezirk: 2, Kreis: 3, Gemeinde: 4 };

/**
 * Eintrag zu einem Namen, nur wenn er eindeutig ist: zuerst die genaue Bezeichnung, dann der Name ohne Art (mit dem
 * Hinweis auf die Ebene aus dem Namen). Eine kreisfreie Stadt steht als Kreis und als Gemeinde im Verzeichnis; dann gilt
 * der Kreis. Mehrdeutige Namen (zwei Gemeinden „Neustadt“) ergeben nichts – die App rät nicht.
 */
export function nachName(v: GebietVerzeichnis, name: unknown, imGebiet?: string): GebietEintrag | undefined {
  const s = suchform(name);
  if (!s) return undefined;
  const im = (e: GebietEintrag) => !imGebiet || liegtIn(e.schluessel, imGebiet);
  const genau = v.eintraege.filter((e) => suchform(e.name) === s && im(e));
  if (genau.length === 1) return genau[0];
  const k = kern(name);
  if (!k) return undefined;
  const ebenen = ebenenHinweis(String(name));
  // „Stadt …“ meint unter den Kreisen nur kreisfreie Städte, nicht den gleichnamigen Landkreis
  const stadt = STADT_RE.test(suchform(name));
  const passt = (e: GebietEintrag) =>
    (!ebenen || ebenen.includes(e.ebene)) && !(stadt && e.ebene === "Kreis" && !/^(Kreisfreie Stadt|Stadtkreis) /.test(e.name));
  let treffer = (genau.length ? genau : v.eintraege).filter((e) => kern(e.name) === k && im(e) && passt(e));
  // kreisfreie Stadt als Kreis und Gemeinde (Gemeindeschlüssel = Kreisschlüssel + 000): nur den Kreis behalten
  treffer = treffer.filter((e) => !(e.ebene === "Gemeinde" && treffer.some((x) => x.ebene === "Kreis" && e.schluessel === `${x.schluessel}000`)));
  if (treffer.length <= 1) return treffer[0];
  // ohne Hinweis auf die Ebene: genau ein Eintrag der obersten Ebene (Land vor Kreis vor Gemeinde)
  if (!ebenen) {
    const oben = Math.min(...treffer.map((e) => RANG[e.ebene]));
    const top = treffer.filter((e) => RANG[e.ebene] === oben);
    if (top.length === 1 && oben <= RANG.Kreis) return top[0];
  }
  return undefined;
}

export interface SuchOptionen {
  /** Schlüssel, dessen Gebiete zuerst kommen (etwa das eigene Land, „16“) */
  vorrang?: string;
  max?: number;
}

/**
 * Suche nach Namen oder Schlüssel. Reihenfolge: genauer Schlüssel, Namensanfang, Wortanfang, irgendwo im Namen; innerhalb
 * davon das Vorranggebiet, die höhere Ebene und das Alphabet.
 */
export function suche(v: GebietVerzeichnis, text: string, opt: SuchOptionen = {}): GebietEintrag[] {
  const max = opt.max ?? 12;
  const roh = text.trim();
  if (!roh) return [];
  const ziffern = normSchluessel(roh);
  if (/^\d{2,8}$/.test(ziffern)) {
    return v.eintraege
      .filter((e) => e.schluessel.startsWith(ziffern))
      .sort((a, b) => a.schluessel.length - b.schluessel.length || a.schluessel.localeCompare(b.schluessel))
      .slice(0, max);
  }
  const q = suchform(roh);
  if (!q) return [];
  const qk = kern(roh) || q;
  const bewertet: { e: GebietEintrag; p: number }[] = [];
  for (const e of v.eintraege) {
    const n = suchform(e.name);
    const nk = kern(e.name);
    let p: number;
    if (n === q || nk === qk) p = 0;
    else if (nk.startsWith(qk) || n.startsWith(q)) p = 1;
    else if (` ${n}`.includes(` ${q}`) || ` ${nk}`.includes(` ${qk}`)) p = 2;
    else if (n.includes(q)) p = 3;
    else continue;
    bewertet.push({ e, p });
  }
  const vor = (e: GebietEintrag) => (opt.vorrang && liegtIn(e.schluessel, opt.vorrang) ? 0 : 1);
  return bewertet
    .sort((a, b) => a.p - b.p || vor(a.e) - vor(b.e) || RANG[a.e.ebene] - RANG[b.e.ebene] || a.e.name.localeCompare(b.e.name, "de"))
    .slice(0, max)
    .map((x) => x.e);
}

/** Prüft eine Verzeichnisdatei; leere Liste = verwendbar */
export function gebietDateiFehler(d: unknown): string[] {
  const f: string[] = [];
  if (!d || typeof d !== "object") return ["Verzeichnis ist kein Objekt"];
  const x = d as Partial<GebietDatei>;
  if (x.format !== GEBIETE_FORMAT) f.push(`„format“ muss „${GEBIETE_FORMAT}“ sein`);
  if (typeof x.stand !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x.stand)) f.push("„stand“ fehlt (JJJJ-MM-TT)");
  if (typeof x.quelle !== "string" || !x.quelle.trim()) f.push("„quelle“ fehlt");
  if (!Array.isArray(x.eintraege)) return [...f, "„eintraege“ fehlt"];
  const gesehen = new Set<string>();
  const LAENGE: Record<string, number[]> = { Land: [2], Regierungsbezirk: [3], Kreis: [5], Gemeinde: [8] };
  for (const z of x.eintraege) {
    if (!Array.isArray(z) || z.length !== 3 || z.some((t) => typeof t !== "string")) {
      f.push(`ungültiger Eintrag ${JSON.stringify(z)}`);
      continue;
    }
    const [s, , ebene] = z;
    if (gesehen.has(s)) f.push(`Schlüssel ${s} doppelt`);
    gesehen.add(s);
    const l = LAENGE[ebene];
    if (ebene === "Staat" ? !/^[A-Z]{2}$/.test(s) : !l || !/^\d+$/.test(s) || !l.includes(s.length)) f.push(`Schlüssel ${s} passt nicht zur Ebene „${ebene}“`);
  }
  return f;
}
