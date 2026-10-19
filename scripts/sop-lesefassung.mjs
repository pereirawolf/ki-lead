// Erzeugt die Lesefassung der SOP-LEAD-Sammelmappe aus den Einzeldateien eines Profils.
// Quelle sind ausschließlich die in profil.json unter sop.dateien genannten Dateien (in dieser Reihenfolge).
// Aufruf: node scripts/sop-lesefassung.mjs [Profilordner] [--check]
//   ohne --check: schreibt sop/SOP-LEAD_Sammelmappe_Lesefassung.md
//   mit --check:  prüft nur, ob die vorhandene Lesefassung aktuell ist (Exit-Code 1, wenn nicht)

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const pruefen = args.includes("--check");
const ordner = args.find((a) => !a.startsWith("--")) || "profile/lead-beispiel";
const ZIEL = "sop/SOP-LEAD_Sammelmappe_Lesefassung.md";

export function lesefassung(profilOrdner) {
  const manifest = JSON.parse(readFileSync(join(profilOrdner, "profil.json"), "utf-8"));
  const dateien = manifest.sop?.dateien || [];
  const einheiten = dateien.map((pfad) => {
    const text = readFileSync(join(profilOrdner, pfad), "utf-8").replace(/\r\n?/g, "\n").trim();
    const anker = text.match(/<a id="([^"]+)"><\/a>/)?.[1] || "";
    const titel = text.match(/^## (.+)$/m)?.[1] || pfad;
    const kennung = text.match(/^kennung: "([^"]+)"$/m)?.[1] || "";
    const lesegruppe = text.match(/^lesegruppe: "([^"]+)"$/m)?.[1] || "";
    return { pfad, text, anker, titel, kennung, lesegruppe, teil: kennung ? kennung[0] : anker === manifest.sop?.teil_gemeinsam ? "A" : "" };
  });
  const TEILE = { A: "Teil A – Gemeinsame Regeln", B: "Teil B – Dach-SOPs je Ereignisart", C: "Teil C – Themen- und Querschnittsbausteine" };
  const kurz = (t) => t.replace(/^([A-Z]\d{2})\.\s*(?:SOP|Baustein) LEAD:\s*/, "$1 ");

  const inhalt = ["## Inhaltsverzeichnis", ""];
  let teil = "";
  let gruppe = "";
  for (const e of einheiten) {
    if (e.teil !== teil) {
      teil = e.teil;
      gruppe = "";
      if (teil === "A") inhalt.push(`- [${TEILE.A}](#${e.anker})`);
      else inhalt.push(`- ${TEILE[teil] || "Weitere Abschnitte"}`);
    }
    if (teil === "A") continue;
    if (teil === "C" && e.lesegruppe && e.lesegruppe !== gruppe) {
      gruppe = e.lesegruppe;
      inhalt.push(`  - Leseblock: ${gruppe}`);
    }
    inhalt.push(`${teil === "C" && gruppe ? "    " : "  "}- [${kurz(e.titel)}](#${e.anker})`);
  }

  const koerper = [];
  teil = "";
  gruppe = "";
  for (const e of einheiten) {
    if (e.teil !== teil) {
      teil = e.teil;
      gruppe = "";
      if (teil !== "A") koerper.push("---", "", `# ${TEILE[teil] || "Weitere Abschnitte"}`, "");
    }
    if (teil === "C" && e.lesegruppe && e.lesegruppe !== gruppe) {
      gruppe = e.lesegruppe;
      koerper.push(`**Leseblock: ${gruppe}**`, "");
    }
    koerper.push(`<!-- Quelle: ${e.pfad} -->`, "", e.text, "");
  }

  return [
    "# SOP-LEAD – Sammelmappe (Lesefassung)",
    "",
    `> Erzeugt aus den ${einheiten.length} Einzeldateien unter \`sop/\` in der Reihenfolge von \`profil.json\` (\`npm run sop:lesefassung\`). Nicht von Hand bearbeiten: Änderungen gehören in die Einzeldateien. Die App liest diese Datei nicht. Fassungen und Gültigkeitsstand: Teil A.`,
    "",
    ...inhalt,
    "",
    "---",
    "",
    ...koerper,
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd()
    .concat("\n");
}

const ziel = join(ordner, ZIEL);
const neu = lesefassung(ordner);
if (pruefen) {
  const alt = existsSync(ziel) ? readFileSync(ziel, "utf-8") : "";
  if (alt !== neu) {
    console.error(`Lesefassung veraltet: ${ziel}. Bitte „npm run sop:lesefassung“ ausführen.`);
    process.exit(1);
  }
  console.log(`Lesefassung aktuell: ${ziel}`);
} else {
  writeFileSync(ziel, neu, "utf-8");
  console.log(`geschrieben: ${ziel}`);
}
