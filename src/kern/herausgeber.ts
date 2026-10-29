// Herausgeber, Impressum und Verweise (seit 0.5.5). Die App ruft keine dieser Adressen selbst auf; sie öffnen sich als
// Link in einem eigenen Fenster bzw. im Browser des Systems. Netzaufrufe der App gehen nur an die KI-Anbieter.

/** Versionsnummer der App; seit 0.6.3 (TP-2026-W44-23) aus src/kern/version.ts */
export { APP_VERSION } from "./version";

export const HERAUSGEBER = "Heiko Pereira Wolf";

const REPOSITORY = "https://github.com/pereirawolf/ki-lead";

/** Externe Verweise; Impressum nach § 18 Abs. 1 MStV auf der Website des Herausgebers (SPEZIFIKATION, Abschnitt 1) */
export const VERWEISE = {
  impressum: "https://www.pereirawolf.de/impressum.html",
  website: "https://www.pereirawolf.de",
  datenschutz: `${REPOSITORY}/blob/main/docs/DATENSCHUTZ.md`,
  drittkomponenten: `${REPOSITORY}/blob/main/THIRD-PARTY-NOTICES.md`,
  inhaltslizenz: `${REPOSITORY}/blob/main/LICENSE-CONTENT`,
  erprobung: `${REPOSITORY}/blob/main/docs/ERPROBUNG.md`,
  rueckmeldung: `${REPOSITORY}/issues/new/choose`,
  quellcode: REPOSITORY,
} as const;
