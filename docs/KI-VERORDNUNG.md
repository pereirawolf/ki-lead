# KI-LEAD – Einordnung nach der KI-Verordnung und Systemkarte

Fassung 1.1 vom 24.10.2026, gilt für App-Version 0.5.4 · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Dieses Dokument ordnet KI-LEAD nach der Verordnung (EU) 2024/1689 (KI-Verordnung, KI-VO) in der Fassung der Verordnung (EU) 2026/1744 (Digital Omnibus on AI) ein und beschreibt das System. Es ist eine Einschätzung des Herausgebers, **keine Rechtsberatung** und keine verbindliche Einstufung. Wer KI-LEAD dienstlich erprobt, prüft die Einordnung für den eigenen Einsatz selbst.

---

## 1. Zweckbestimmung

KI-LEAD erstellt **Entwürfe** für drei Arbeitsprodukte der Lageerfassung nach einem Profil:

- einen belegten Meldungsentwurf aus Auftrag und Material (Erfassung),
- eine eigene Meldung aus mehreren Eingangsmeldungen (Verdichtung),
- eine Kurzfassung einer Meldung für die Leitung (Management Summary).

Jeder Entwurf bleibt bis zur fachlichen Prüfung und Freigabe durch eine Person ein Entwurf. KI-LEAD ist ein Forschungsdemonstrator für fiktive oder offen zugängliche Inhalte ([README](../README.md), [Spezifikation](SPEZIFIKATION.md), Abschnitt 1).

## 2. Verwendungsgrenzen

KI-LEAD ist **nicht** bestimmt für:

- die Annahme, Bewertung oder Einstufung von Notrufen,
- die Disposition oder Priorisierung von Einsatzkräften und Einsatzmitteln,
- die Triage von Patientinnen und Patienten,
- die Steuerung oder Überwachung kritischer Infrastruktur,
- Entscheidungen über natürliche Personen,
- den Echtbetrieb mit personenbezogenen oder eingestuften Daten,
- die Veröffentlichung von Ausgaben ohne fachliche Prüfung.

Eine Verwendung außerhalb dieser Grenzen ändert die Einordnung (Abschnitte 4 bis 6). Sie liegt dann in der Verantwortung der verwendenden Stelle.

## 3. Rollen

KI-LEAD ist ein KI-System im Sinne von Art. 3 Nr. 1 KI-VO. Es nutzt KI-Modelle mit allgemeinem Verwendungszweck von Anthropic und OpenAI über deren Schnittstellen. Pflichten für diese Modelle (Kapitel V) treffen die Modellanbieter, nicht KI-LEAD.

- **Anbieter des Systems** wäre der Herausgeber, sofern KI-LEAD in Verkehr gebracht oder in Betrieb genommen wird. Inverkehrbringen setzt eine Bereitstellung im Rahmen einer Geschäftstätigkeit voraus, entgeltlich oder unentgeltlich (Art. 3 Nr. 9 und 10). Bei einem privaten, unentgeltlichen Forschungsvorhaben spricht viel dafür, dass das nicht vorliegt. Sicher ist das nicht; dieses Dokument behandelt die Anbieterpflichten deshalb so, als könnten sie greifen.
- **Betreiberin** ist die Stelle, die KI-LEAD in eigener Verantwortung verwendet (Art. 3 Nr. 4). Wer KI-LEAD ausschließlich privat nutzt, ist nicht Betreiber.

## 4. Ausnahmen und ihre Grenzen

| Vorschrift | Inhalt | Bedeutung für KI-LEAD |
|---|---|---|
| Art. 2 Abs. 6 | Die KI-VO gilt nicht für KI-Systeme und ihre Ausgaben, die eigens für den alleinigen Zweck der wissenschaftlichen Forschung und Entwicklung entwickelt und in Betrieb genommen werden. | Trägt, solange KI-LEAD nur der Forschung dient. Geht eine Erprobung in die tägliche Lagearbeit über, ist der Zweck nicht mehr allein Forschung. |
| Art. 2 Abs. 8 | Forschungs-, Test- und Entwicklungstätigkeiten vor dem Inverkehrbringen oder der Inbetriebnahme sind ausgenommen; Tests unter Realbedingungen nicht. | Der Testkreis (Meilenstein M6) bleibt nur mit fiktivem oder offenem Material im Rahmen der Forschung gedeckt. Ein Test im laufenden Lagedienst wäre ein Test unter Realbedingungen. |
| Art. 2 Abs. 12 | Systeme unter freier und quelloffener Lizenz sind ausgenommen, außer sie werden als Hochrisiko-KI-System oder als System nach Art. 5 oder Art. 50 in Verkehr gebracht oder in Betrieb genommen. | KI-LEAD steht unter EUPL-1.2. Weil es Text erzeugt, fällt es unter Art. 50; für diese Pflichten hilft Abs. 12 deshalb nicht. |

## 5. Kein Hochrisiko-KI-System bei bestimmungsgemäßer Verwendung

Geprüft werden die Bereiche des Anhangs III, die für den Bevölkerungsschutz naheliegen.

- **Anhang III Nr. 5 Buchst. d** erfasst KI-Systeme, die Notrufe bewerten und einstufen oder die Entsendung von Not- und Rettungsdiensten einschließlich Polizei und Feuerwehr disponieren oder priorisieren, sowie Triagesysteme der Notfallversorgung. KI-LEAD bewertet keine Notrufe, disponiert und priorisiert keine Einsatzkräfte und triagiert nicht. Es erstellt Lageentwürfe für die Steuerungsebene; Entscheidungen über Einsätze trifft eine Person auf anderem Weg.
- **Anhang III Nr. 2** erfasst KI-Systeme, die als Sicherheitsbauteile beim Betrieb oder der Steuerung kritischer digitaler Infrastruktur, des Straßenverkehrs oder der Versorgung mit Wasser, Gas, Wärme oder Strom verwendet werden. KI-LEAD ist kein Bauteil einer solchen Anlage und steuert nichts.
- **Art. 6 Abs. 3:** Selbst bei Berührung eines Bereichs wäre ein System kein Hochrisikosystem, wenn es kein erhebliches Risiko birgt, etwa weil es nur eine vorbereitende Aufgabe erfüllt. Der Entwurf der Leitlinien der Kommission nennt als Beispiel vorbereitende Lageinformationen für die Vorplanung von Einsatzmitteln, wenn eine Person die Einsatzentscheidung trifft (McCann FitzGerald, 2026). Die Leitlinien lagen am 24.10.2026 nur als Entwurf vor.

**Ergebnis:** Bei Verwendung nach Abschnitt 1 und 2 ist KI-LEAD kein Hochrisiko-KI-System. Die Grenze ziehen die Zweckbestimmung und die Verwendungsgrenzen.

## 6. Transparenz nach Art. 50

### 6.1 Kennzeichnung der Ausgaben (Abs. 2)

Anbieter von KI-Systemen, die Text erzeugen, sorgen dafür, dass die Ausgaben in maschinenlesbarem Format gekennzeichnet und als künstlich erzeugt erkennbar sind. Ausgenommen ist eine unterstützende Funktion für die Standardbearbeitung. Zusammenfassungen und Umformulierungen, die Inhalt, Stil oder Aufbau verändern, sind nach den Leitlinien der Kommission nicht ausgenommen (Orrick, 2026). Der Verhaltenskodex der Kommission sieht für Dokumente wie PDF zwei Ebenen vor, signierte Metadaten und ein nicht wahrnehmbares Wasserzeichen (Orrick, 2026).

KI-LEAD erzeugt Text in allen drei Arbeitsprodukten. Ob die Pflicht den Herausgeber trifft, hängt von Abschnitt 3 und 4 ab. Unabhängig davon kennzeichnet KI-LEAD seine Ausgaben, soweit das ohne eigene Modelle möglich ist:

| Ausgabe | Stand 0.5.4 |
|---|---|
| Meldung als JSON | `_entstehung.verfahren = "KI-Entwurf"` mit Werkzeug, Modell und Erstellzeit, sofern das Schema des Profils ein Entstehungsfeld hat (Beispiel- und Musterprofil: ja). Fehlt es, meldet die Profilprüfung einen Hinweis (`KI_KENNZEICHNUNG_OHNE_ENTSTEHUNGSFELD`). |
| Meldung als PDF | maschinenlesbar: XMP-Metadaten mit IPTC Digital Source Type `compositeWithTrainedAlgorithmicMedia` bei einem KI-Entwurf, Herkunft (`ki`, `manuell`, `unbekannt`) und Modell; Dokumenteigenschaften mit Ersteller „KI-LEAD &lt;Version&gt;“ und Schlüsselwort „KI-generiert“; Dokumentsprache. Sichtbar: Zeile „Entstehung“, Fußzeile „Erstellt mit KI-LEAD · KI-generiert“, Wasserzeichen „ENTWURF“ bis zur Freigabe |
| Lagebild als PDF und CSV | PDF: Metadaten wie oben, „KI-generiert“, sobald eine enthaltene Meldung ein KI-Entwurf ist; CSV: Spalten „Entstehung“ und „SOP (Entstehung)“ |
| Management Summary als TXT | erste Zeile „[KI-generiert mit KI-LEAD &lt;Version&gt;, Modell &lt;id&gt;; vor Verwendung fachlich prüfen]“; der Text zum Kopieren bleibt ohne diese Zeile |
| Laufprotokoll als JSON | Modell und Parameter je Stufe |

Die Herkunft stammt immer aus dem Entstehungsfeld der Meldung; die App erfindet keine (`src/dokumente/kennzeichnung.ts`). Wird ein KI-Entwurf von Hand überarbeitet, bleibt er als „KI-Entwurf“ gekennzeichnet.

**Grenzen:** Die Metadaten sind nicht signiert. Ein Wasserzeichen im Text kann KI-LEAD nicht selbst erzeugen; das wäre Sache der Modellanbieter. Die zwei Ebenen des Verhaltenskodex erfüllt KI-LEAD deshalb nicht ([Spezifikation](SPEZIFIKATION.md), Abschnitt 10).

### 6.2 Veröffentlichte Texte (Abs. 4)

Abs. 4 betrifft Betreiber, deren KI-erzeugte Texte veröffentlicht werden, um die Öffentlichkeit über Angelegenheiten von öffentlichem Interesse zu informieren. Lagemeldungen und Kurzfassungen im Dienstweg sind nicht öffentlich; Abs. 4 greift dann nicht.

Wird eine Ausgabe doch veröffentlicht, entfällt die Pflicht zur Offenlegung nur, wenn der Text von einer Person inhaltlich geprüft oder redaktionell kontrolliert wurde **und** eine natürliche oder juristische Person die redaktionelle Verantwortung trägt. Nach den Leitlinien genügen Rechtschreibprüfung oder automatische Prüfungen dafür nicht (Orrick, 2026). Status „final“, der Block „Freigabe & Versand“ und die Prüfhinweise der App unterstützen diese Prüfung. Sie ersetzen sie nicht und begründen keine redaktionelle Verantwortung; die trägt die veröffentlichende Stelle.

## 7. KI-Kompetenz (Art. 4)

Seit dem 27.07.2026 verlangt Art. 4, dass Anbieter und Betreiber Maßnahmen ergreifen, um die KI-Kompetenz ihres Personals zu fördern. Ein bestimmtes Niveau müssen sie nicht gewährleisten (nicfab, 2026). Die Pflicht liegt bei der verwendenden Stelle. KI-LEAD trägt bei mit dieser Systemkarte, den Hinweisen in der App, den in der App lesbaren Arbeitsanweisungen und dem Laufprotokoll, das jeden Prompt zeigt.

## 8. Fristen

Stand nach der Verordnung (EU) 2026/1744, veröffentlicht im Amtsblatt der EU am 24.07.2026, in Kraft seit 27.07.2026 (nicfab, 2026):

| Pflicht | gilt ab |
|---|---|
| Art. 4 KI-Kompetenz in neuer Fassung | 27.07.2026 |
| Art. 50 Transparenz | 02.08.2026 |
| Art. 50 Abs. 2 für generative Systeme, die vor dem 02.08.2026 in Verkehr gebracht wurden | 02.12.2026 |
| Hochrisiko-KI-Systeme nach Anhang III | 02.12.2027 |
| Hochrisiko-KI-Systeme nach Anhang I | 02.08.2028 |

## 9. Systemkarte

### 9.1 Aufbau

| Stufe | Aufgabe | Vorgabe der App (Anthropic) | Standard-Profil OpenAI |
|---|---|---|---|
| S1 | Gegenstand und SOP-Auswahl vorschlagen | claude-haiku-5-5, Aufwand hoch | gpt-6-luna, hoch |
| S2 Erfassung | Recherche und Entwurf | claude-opus-5-5, mittel | gpt-6-astra, mittel |
| S2 Verdichtung | Entwurf aus Eingangsmeldungen | claude-sonnet-5-5, mittel (Beispielprofil: claude-opus-5-5) | gpt-6-astra, mittel |
| S3 | Reparatur von Schemafehlern, ohne Recherche | claude-sonnet-5-5, niedrig | gpt-6.1-sol, niedrig |
| Management Summary | Kurzfassung ohne Recherche | claude-sonnet-5-5, mittel | gpt-6.1-sol, mittel |

Profil und Einstellungen können andere Modelle vorgeben; je Lauf lässt sich abweichend wählen. Maßgeblich ist das Laufprotokoll, das Modell, Parameter, Prompts und Antworten jeder Stufe festhält (`src/pipeline/einstellungen.ts`, [Spezifikation](SPEZIFIKATION.md), Abschnitte 5.1 und 5.4).

### 9.2 Menschliche Aufsicht

- **S1:** Die Person bestätigt oder ändert Gegenstand, t0, Gliederung und SOP-Auswahl, bevor S2 beginnt.
- **Recherche:** Websuche und Seitenabruf nur, wenn der Auftrag sie erlaubt, mit Höchstzahlen.
- **S3:** höchstens zwei Reparaturen ohne neue Recherche, kein automatischer Folgeaufruf.
- **S4:** Der Entwurf geht in die Meldungsmaske. Status „Entwurf“ bis zur Freigabe; das PDF trägt bis dahin das Wasserzeichen „ENTWURF“, der Dateiname „_ENTWURF“, die Management Summary den Vermerk „ENTWURF – Meldung nicht freigegeben“.
- **Abbruch:** Jeder Lauf lässt sich jederzeit abbrechen.

### 9.3 Bekannte Fehlerbilder

Aus der technischen Abnahme M4 vom 23.10.2026, sechs Läufe zur Verdichtung des fiktiven Falls Orkantief „Ilka“ ([Ergebnis](../evaluation/abnahmen/2026-10-23-m4-ergebnis.md)):

- „Handlungsrelevant bis“ stand in vier von sechs Läufen auf t0 selbst, also auf einer bei Ausgabe schon erreichten Frist.
- Die Tendenz fehlte in allen drei OpenAI-Läufen und in einem Anthropic-Lauf.
- OpenAI ließ die Radarachsen D1 bis D5 in allen Läufen offen (mit Begründung); Anthropic setzte D1 und D4 meist eine Stufe abweichend von der Redaktionsfassung.
- Beide Anbieter gliederten die Lage verschieden (zwei Sachverhalte gegenüber einem).
- Ob Angaben außerhalb der Eingangsmeldungen ungekennzeichnet einflossen, wurde nicht vollständig geprüft.

Die Aussagekraft ist gering: sechs Läufe, ein fiktiver Fall, der in der Entwicklung bekannt war. Eine inhaltliche Bewertung der Modelle steht aus ([evaluation/](../evaluation/README.md)).

### 9.4 Grenzen der Prüfungen

- Die **Schemaprüfung** belegt die Form einer Meldung, nicht ihre Richtigkeit oder Vollständigkeit.
- Die **Quellenprüfung** prüft, ob Quellen formal vorhanden und zugeordnet sind, nicht, ob sie die Aussage tragen.
- Der **Redaktionscheck** prüft Fristen, Kennsätze und Zusammenhang nach festen Regeln; er bewertet keine Lage.
- `_entstehung.sop` belegt, welche SOPs dem Modell beigefügt waren, nicht, dass es sie angewendet hat.
- Recherche über das Internet kann veraltete, falsche oder manipulierte Inhalte einbringen ([SICHERHEIT.md](SICHERHEIT.md)).

---

## Quellen

- Europäische Union (2024): Verordnung (EU) 2024/1689 des Europäischen Parlaments und des Rates vom 13. Juni 2024 zur Festlegung harmonisierter Vorschriften für künstliche Intelligenz. Online abrufbar unter: https://eur-lex.europa.eu/eli/reg/2024/1689/oj [Zugriff: 24.10.2026]
- Europäische Union (2026): Verordnung (EU) 2026/1744 (Digital Omnibus on AI), ABl. L vom 24.07.2026. Online abrufbar unter: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=OJ%3AL_202601744 [Zugriff: 24.10.2026]
- Europäische Kommission (o. J.): AI Act Service Desk, Artikel 2. Online abrufbar unter: https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-2 [Zugriff: 24.10.2026]
- McCann FitzGerald (2026): Essential Services Spotlight: EU AI Act – Draft Guidelines on High-Risk AI Classification. Online abrufbar unter: https://www.mccannfitzgerald.com/knowledge/technology-and-innovation/essential-services-spotlight-eu-ai-act-draft-guidelines-on-high-risk-ai-classification [Zugriff: 24.10.2026]
- nicfab (2026): Digital Omnibus on AI: Regulation (EU) 2026/1744 Is Published in the Official Journal. Online abrufbar unter: https://www.nicfab.eu/en/posts/digital-omnibus-ai-official-journal/ [Zugriff: 24.10.2026]
- Orrick (2026): EU AI Act – Transparency Obligations for AI-Generated Content (Article 50). Online abrufbar unter: https://www.orrick.com/en/Insights/2026/08/EU-AI-Act-Transparency-Obligations-for-AI-Generated-Content-Article-50 [Zugriff: 24.10.2026]

Prüftiefe: Der Wortlaut von Art. 2 stammt aus dem AI Act Service Desk der Kommission. Fundstelle und Fristen des Digital Omnibus sind einer Zusammenfassung mit Verweis auf das Amtsblatt entnommen; die Leitlinien zu Art. 6 und Art. 50 lagen am 24.10.2026 ebenfalls nur in Zusammenfassungen vor. Bei der nächsten Fassung gegen den Text im Amtsblatt und die Originaldokumente der Kommission prüfen.

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 1.1 | 24.10.2026 | Abschnitt 6.1: Kennzeichnung in PDF-Metadaten, Kopfzeile der Management Summary und Profilhinweis (App 0.5.4) |
| 1.0 | 24.10.2026 | Erste Fassung (App 0.5.3) |
