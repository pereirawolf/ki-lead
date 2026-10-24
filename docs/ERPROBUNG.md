# KI-LEAD – Erprobung im Testkreis

Fassung 1.1 vom 24.10.2026, gilt für App-Version 0.5.5 und folgende · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Dieses Dokument beschreibt die Erprobung von KI-LEAD in einem Testkreis (Meilenstein M6): Ziel, Fragestellungen, Regeln für die Teilnahme, Rückmeldeweg und Auswertung. Es ist keine Rechtsberatung.

---

## 1. Rahmen

- KI-LEAD ist ein **privates Forschungsvorhaben** von Heiko Pereira Wolf. Herausgeber ist keine Behörde und keine Einrichtung. Die Erprobung ist keine dienstliche Maßnahme.
- Die Teilnahme ist **freiwillig und unentgeltlich**. Es gibt keine Vergütung und keine Verpflichtung, Rückmeldungen zu geben.
- Wer im Rahmen einer Stelle teilnehmen möchte, klärt das mit dieser Stelle selbst. Hilfen dafür: [Datenschutzhinweise](DATENSCHUTZ.md), Anhang C (Vorlage zur Schwellwertanalyse), und [KI-Verordnung](KI-VERORDNUNG.md), Abschnitt 4.
- Erprobt wird ein **fester Stand**: ein Release-Kandidat mit Git-Tag, noch ohne DOI. Der erste Release mit Zenodo-DOI folgt nach der Auswertung (Abschnitt 8).

## 2. Ziel und Fragestellungen

Ziel ist zu erfahren, ob KI-LEAD in der Hand fachkundiger Personen nachvollziehbare und brauchbare Entwürfe liefert und wo Methodik, Profile und App nachgebessert werden müssen. Eine fachliche Freigabe der LEAD-Systematik ist nicht Ziel der Erprobung.

| Nr. | Fragestellung | Hinweise aus |
|---|---|---|
| F1 | Ist der gestufte Ablauf (Auftrag, S1 bis S3, Lagebild, Verdichtung, Management Summary) ohne Einweisung bedienbar? | Fehlerberichte, Fachrückmeldungen |
| F2 | Wie viel Nacharbeit brauchen die Entwürfe? | Fachrückmeldungen mit Einschätzung nach den sechs Kriterien der [Modellbewertung](../evaluation/README.md#kriterien-je-15) |
| F3 | Lassen sich Aussagen nachvollziehen: Belege, Quellenkategorien, Laufprotokoll, KI-Kennzeichnung? | Fachrückmeldungen |
| F4 | Lässt sich KI-LEAD auf eine andere Organisation oder Ebene übertragen (eigene Profile, Organisationsneutralität)? | Fachrückmeldungen |
| F5 | Stimmen Kosten und Dauer mit der Schätzung der App überein? | Kenndaten der Läufe |
| F6 | Funktioniert KI-LEAD auf den genutzten Geräten, als PWA und barrierefrei? | Fehlerberichte, Meldungen zur Barrierefreiheit |

## 3. Teilnahmehinweise

- **Nur fiktive oder offen zugängliche Inhalte.** Keine personenbezogenen Daten, keine eingestuften Inhalte (VS), keine internen Unterlagen einer Stelle. Das gilt für Material, Eingaben, Profile und Rückmeldungen.
- **Eigener API-Schlüssel** von Anthropic, OpenAI oder Mistral (Mistral seit 0.5.6, im kostenlosen Tarif Trainingsnutzung abschalten), nur für KI-LEAD angelegt und mit **Ausgabenlimit** beim Anbieter. Die Kosten der Läufe trägt die testende Person über ihr Konto beim Anbieter. Der Herausgeber erhält weder Schlüssel noch Inhalte ([Datenschutzhinweise](DATENSCHUTZ.md), Abschnitt 6).
- **Einstieg ohne KI** mit dem fiktiven Datensatz Orkantief „Ilka“ (README, „Schnellstart“). Für KI-Läufe eignen sich die fiktiven Fälle unter [evaluation/faelle/](../evaluation/faelle/README.md) mit ihrem Material.
- **Entwürfe bleiben Entwürfe.** Ergebnisse nicht für reale Lagen, Meldungen oder Entscheidungen verwenden. Eine Erprobung im laufenden Lagedienst wäre ein Test unter Realbedingungen und ist nicht Teil dieser Erprobung ([KI-Verordnung](KI-VERORDNUNG.md), Abschnitt 4).
- Hinweise zur sicheren Nutzung: [Sicherheit](SICHERHEIT.md), Abschnitt 4.

## 4. Nutzungsbedingungen und Haftung

- Lizenzen: Code unter EUPL-1.2 ([LICENSE](../LICENSE)); Beispielprofile, Evaluationsmaterial und Dokumentation unter CC BY 4.0, maschinenlesbare Dateien und die Vorlage zusätzlich unter CC0 1.0, mit den Ausnahmen in [LICENSE-CONTENT](../LICENSE-CONTENT). Diese Bedingungen schränken die Lizenzen nicht ein; sie regeln nur die Teilnahme an der Erprobung.
- KI-LEAD ist ein Forschungsdemonstrator in Entwicklung. Er wird **ohne Gewähr** bereitgestellt (EUPL-1.2, Art. 7). Fehler, Ausfälle und ungeeignete Entwürfe sind zu erwarten; Inhaltsgerüste der SOP-Sammelmappe sind nicht fachlich freigegeben.
- Die **Haftung** des Herausgebers ist ausgeschlossen, soweit das Gesetz es zulässt (EUPL-1.2, Art. 8). Unberührt bleibt die Haftung für Vorsatz und grobe Fahrlässigkeit, für Schäden an Leben, Körper und Gesundheit und nach anderen zwingenden Vorschriften.
- Für die Verarbeitung in der App ist die testende Person oder Stelle verantwortlich, für die Verarbeitung beim KI-Anbieter gelten dessen Bedingungen ([Datenschutzhinweise](DATENSCHUTZ.md), Abschnitte 2 und 5).
- Wer gegen Abschnitt 3 verstößt, etwa personenbezogene Daten in ein Issue schreibt, dessen Beitrag entfernt der Herausgeber.

## 5. Rückmeldeweg

Rückmeldungen gehen über [Issues im Repository](https://github.com/pereirawolf/ki-lead/issues/new/choose). Issues sind öffentlich.

| Vorlage | Wofür |
|---|---|
| Fehler | Die App tut etwas nicht oder falsch: Absturz, falsche Anzeige, Prüfung, Export, Installation |
| Fachrückmeldung | Inhalt eines Entwurfs, einer SOP, einer Arbeitsanweisung oder des Kodierleitfadens; Einschätzung der Nacharbeit |
| Barrierefreiheit | Eine Barriere in Bedienung oder Ausgabe ([Barrierefreiheit](BARRIEREFREIHEIT.md)) |
| Datenschutz | Fragen zu den Datenschutzhinweisen |

Sicherheitslücken nicht als Issue, sondern vertraulich nach [SECURITY.md](../SECURITY.md).

## 6. Laufprotokolle und Meldungen

Ein Laufprotokoll enthält Profilbezug, vollständige Prompts mit Material, Rohantworten, Token, Kosten und Dauer, aber keinen API-Schlüssel ([Datenschutzhinweise](DATENSCHUTZ.md), Abschnitt 8).

- **Anhängen nur, wenn** das Material fiktiv oder selbst verfasst ist und der Lauf ohne Websuche und Seitenabruf lief. Sonst können Inhalte Dritter, etwa Artikeltexte, im Protokoll stehen.
- **Sonst nur Kenndaten** angeben: Lauf-ID, App-Version, Profil mit Version und Prüfsumme, Anbieter, Modelle und Aufwand je Stufe, Kosten, Dauer.
- **Meldungen** (JSON, PDF) gelten wie Laufprotokolle: nur mit fiktivem oder offenem Inhalt.
- Der Herausgeber übernimmt Laufprotokolle und Meldungen **nicht ins Repository**. Ins Repository gehen nur zusammengefasste Bewertungen ([evaluation/ergebnisse/](../evaluation/ergebnisse/README.md)), ohne Rohantworten und ohne Texte Dritter.
- Bemerkt der Herausgeber unzulässige Inhalte in einem Issue oder Anhang, entfernt er den Beitrag und bittet um eine bereinigte Fassung.

## 7. Übergang in die Lernschleife

Jedes Issue aus der Erprobung wird gesichtet, einer Kategorie zugeordnet und mit seinem Verbleib geschlossen oder offen gehalten.

| Kategorie | Weg | Nachweis |
|---|---|---|
| Fehler | Korrektur im Code mit Regressionstest ([Tests](TESTS.md), Regel 8) | [CHANGELOG.md](../CHANGELOG.md) mit Verweis auf das Issue |
| Barrierefreiheit | Korrektur oder Eintrag als bekannte Lücke | [Barrierefreiheit](BARRIEREFREIHEIT.md), Abschnitt 4 |
| Fachrückmeldung zu SOP oder Teil A | Pflege nach Teil A der SOP-Sammelmappe: Prüffrage, Prüfpunkt oder Stolperstelle (A.10.2); Kalibrierung der Radarkodierung (A.10.3); eine neue Ereignisart nur unter den Voraussetzungen von A.10.4 | Änderungsverlauf der SOPs (`profile/lead-beispiel/sop/CHANGELOG.md`) |
| Fachrückmeldung zu Arbeitsanweisung, Kodierleitfaden, Schema | Neue Fassung im Profil | `profile/lead-beispiel/CHANGELOG.md` |
| Fall, der eine Lücke zeigt | Vollständig fiktionalisierter Bewertungsfall nach [fall.schema.json](../evaluation/faelle/fall.schema.json), ohne Texte Dritter und ohne personenbezogene Daten | `evaluation/faelle/` |
| Modellqualität, Kosten, Dauer | Eingang in einen Bewertungsplan oder die Schätzung der App ([Modellbewertung](../evaluation/README.md), Schritt 5) | `evaluation/plaene/`, `evaluation/ergebnisse/` |

Aus einer einzelnen Rückmeldung folgt keine Regeländerung. Ereignisfakten gehören nicht in SOP-Texte; übernommen wird die allgemeine Prüffrage.

## 8. Auswertung und Abnahme M6

1. **Plan vor Beginn:** Ein Erprobungsplan unter `evaluation/plaene/` legt fest: Stand (Git-Tag), Zeitraum, Teilnehmende (Zahl, Zusammensetzung nach Ebenen ohne Namen), Mindestbeteiligung und Ende der Sichtung. Änderungen nur als neue Planfassung, wie bei der [Modellbewertung](../evaluation/README.md).
2. **Ergebnis:** unter `evaluation/abnahmen/`, je Fragestellung F1–F6: Zahl und Art der Rückmeldungen, Befunde, Verbleib nach Abschnitt 7, offene Punkte. Keine Namen, keine Rohdaten.
3. **Abnahmekriterium M6 (Erprobungsteil):** Die Erprobung hat nach dem Plan stattgefunden; jede Rückmeldung ist gesichtet und zugeordnet (umgesetzt, eingeplant oder abgelehnt mit Grund); das Ergebnis ist veröffentlicht. Die Qualität der Entwürfe wird beschrieben, ist aber keine Bestehensbedingung.
4. **Danach:** Release mit Zenodo-DOI ([Spezifikation](SPEZIFIKATION.md), Abschnitt 9). Eine Abnahme ist keine fachliche Freigabe der Methodik.

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 1.0 | 24.10.2026 | Erste Fassung (App 0.5.5) |
| 1.1 | 24.10.2026 | Abschnitt 4: Lizenzangabe an LICENSE-CONTENT angeglichen (KP-2026-W43-55, -59) |
