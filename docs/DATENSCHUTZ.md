# KI-LEAD – Datenschutzhinweise und Verarbeitungsbeschreibung

Fassung 1.0 vom 24.10.2026, gilt für App-Version 0.5.3 · Heiko Pereira Wolf · Änderungen am Ende unter „Änderungsverlauf“

Diese Hinweise beschreiben, welche Daten KI-LEAD wo verarbeitet und wohin sie gehen. Sie sind keine Rechtsberatung. Wer KI-LEAD dienstlich erprobt, prüft die Einordnung mit der eigenen Datenschutzbeauftragten oder dem eigenen Datenschutzbeauftragten.

---

## 1. Grundsatz

KI-LEAD ist ein Forschungsdemonstrator. Er ist für **fiktive oder offen zugängliche Inhalte** gedacht, nicht für personenbezogene und nicht für eingestufte Daten. Die App weist beim Start und vor jedem KI-Lauf darauf hin; vor einem KI-Lauf bestätigt die Person das ausdrücklich.

Werden nur fiktive oder offen zugängliche Inhalte ohne Personenbezug verwendet, verarbeitet KI-LEAD außer technischen Verbindungsdaten keine personenbezogenen Daten. Die übrigen Abschnitte beschreiben trotzdem alle Datenflüsse, damit eine nutzende Stelle das selbst beurteilen kann.

## 2. Wer verantwortlich ist

| Rolle | Wer | Wofür |
|---|---|---|
| Herausgeber der Software | Heiko Pereira Wolf, privates Forschungsvorhaben ([ORCID 0009-0004-0014-7616](https://orcid.org/0009-0004-0014-7616)) | Quellcode, Profile, diese Hinweise; Betrieb der Seite auf GitHub Pages |
| Verantwortlicher für die Verarbeitung in der App | die nutzende Person oder Stelle | was sie in die App eingibt, speichert, an einen KI-Anbieter sendet und exportiert |
| KI-Anbieter | Anthropic oder OpenAI, nach Wahl der nutzenden Person | Verarbeitung der Anfragen nach dem eigenen API-Vertrag der nutzenden Person oder Stelle |
| Hosting der Web-App | GitHub (GitHub Pages) | Auslieferung der Programmdateien, Verbindungsprotokolle |

KI-LEAD hat **keinen eigenen Server**. Inhalte gehen vom Gerät direkt an den gewählten Anbieter, mit dem API-Schlüssel der nutzenden Person. Der Herausgeber erhält weder Inhalte noch Schlüssel, Protokolle oder Nutzungsdaten. Er kann deshalb auch keine Auskunft über die Verarbeitung in der App geben und nichts löschen.

Nutzt eine Behörde KI-LEAD, ist sie Verantwortliche für ihre Verarbeitung. Sie führt das Verzeichnis der Verarbeitungstätigkeiten und entscheidet über eine Datenschutz-Folgenabschätzung (Anhang C).

## 3. Was wo gespeichert wird

Alles, was die App speichert, liegt **auf dem Gerät**: im Browser (IndexedDB, für das Farbschema auch localStorage) oder, bei der App für iOS und Android, im Speicher der App-WebView. Eine Datei im Dateisystem legt die App nur an, wenn die Person etwas herunterlädt oder exportiert.

| Was | Speicherschlüssel | Inhalt | Dauer |
|---|---|---|---|
| Einstellungen | `einstellungen` | Modelle, Aufwand, Höchstzahlen | bis zur Änderung oder Löschung |
| Farbschema | `darstellung`, `darstellung:profil:…`; zusätzlich localStorage `ki-lead-darstellung` | gewähltes Schema und eigene Profilfarben (localStorage nur, damit das Schema vor dem ersten Zeichnen gilt) | bis zur Änderung oder Löschung |
| Zwischenstand der Meldung | `entwurf:<profil>` | die gerade bearbeitete Meldung | bis zur Änderung oder Löschung |
| Lagebild | `lagebild:<profil>` | eingelesene Meldungen, Prüfstand | bis zur Änderung oder Löschung |
| Laufprotokolle | `lauf:<id>` | siehe Abschnitt 8 | bis zur Löschung durch die Person |
| Profile und Profilarchiv | `aktives-profil`, `profilarchiv:…` | importierte Profile mit Prüfsumme | bis zur Löschung |
| Management Summary | je Profil | zuletzt erstellte Fassung | bis zum Leeren oder Ersetzen |
| API-Schlüssel | `schluessel:<anbieter>` oder Schlüsselbund | siehe Abschnitt 9 | bis zur Löschung |
| Programmdateien (nur PWA) | Caches `ki-lead-…` | HTML, Skripte, Symbole der App | bis zur nächsten Fassung |

Der Service Worker der PWA hält nur Programmdateien vor. Inhalte und Anfragen an die KI-Anbieter fängt er nicht ab und speichert er nie (`src/pwa/sw-vorlage.js`).

## 4. Datenflüsse

```
Gerät ──(nur bei einer KI-Funktion, HTTPS)──▶ api.anthropic.com  oder  api.openai.com
                                                  │
                                                  └─(nur wenn im Auftrag erlaubt)─▶ Websuche und Seitenabruf
                                                                                     beim Anbieter → Suchdienste, Webseiten
Browser ──(Aufruf der Web-App)──▶ GitHub Pages (Programmdateien)
```

- **Andere Verbindungen gibt es nicht.** Die Content-Security-Policy der App (`index.html`) erlaubt Verbindungen nur zur eigenen Adresse und zu den beiden Anbietern. Es gibt keine Telemetrie, keine Analytics, keine Absturzberichte, kein CDN und keine nachgeladenen Schriften; alle Bibliotheken und die Schrift sind gebündelt.
- **Was an den Anbieter geht:** die für die Stufe zusammengestellten Inhalte. Das sind Arbeitsanweisung, Profilregeln, gewählte SOPs, Kodierleitfaden, Schema, der Auftrag und das bereitgestellte Material. PDF-Dateien gehen unverändert als Dokument mit, DOCX-Dateien als Text. Die App begrenzt PDF auf 30 MB und andere Dateien auf 20 MB (`src/pipeline/material.ts`).
- **Websuche und Seitenabruf** führt der Anbieter aus, nicht das Gerät. Suchanfragen gehen an den Anbieter und gegebenenfalls an dessen Suchdienst. Abgerufene Webseiten sehen eine Anfrage des Anbieters. Anthropic weist darauf hin, dass Seitenbetreiber abgerufene Adressen und Anfragedaten nach eigenen Regeln speichern können (Anthropic, o. J. a). Recherche ist nur aktiv, wenn der Auftrag sie erlaubt; die Verdichtung startet ohne Websuche.
- **Erinnerungen an meldende Stellen** öffnen nur das Mailprogramm des Geräts (mailto). Die App versendet selbst nichts. Kontaktadressen stammen aus `kontakte.json` des Profils oder aus der nicht eingecheckten `kontakte.lokal.json`.

## 5. Bedingungen der KI-Anbieter

Es gelten die Bedingungen, die die nutzende Person oder Stelle mit dem Anbieter vereinbart hat. Der folgende Stand ist am 24.10.2026 geprüft. Er kann sich ändern; maßgeblich sind die verlinkten Seiten.

### Anthropic

- **Vertrag:** Die API unterliegt den kommerziellen Nutzungsbedingungen. Sie sind ausdrücklich nicht für Verbraucher bestimmt. Ein Auftragsverarbeitungsvertrag (Data Processing Addendum) ist durch Verweis Bestandteil (Anthropic, 2025).
- **Kein Training:** Anthropic darf Modelle nicht mit Kundeninhalten aus den Diensten trainieren (Anthropic, 2025).
- **Aufbewahrung:** Ein- und Ausgaben der API werden binnen 30 Tagen gelöscht. Verstoßen Inhalte gegen die Nutzungsrichtlinie, können Ein- und Ausgaben bis zu zwei Jahre, Klassifikationswerte bis zu sieben Jahre aufbewahrt werden. Längere Fristen sind auch zur Erfüllung gesetzlicher Pflichten möglich (Anthropic, 2026).
- **Prompt-Caching**, das KI-LEAD für Profilgrundlagen nutzt, speichert keine Prompts und Ausgaben, sondern kurzzeitig technische Zwischenwerte (Anthropic, o. J. b).

### OpenAI

- **Kein Training:** Daten, die an die API gesendet werden, nutzt OpenAI ohne ausdrückliche Zustimmung nicht zum Training (OpenAI, o. J.).
- **Aufbewahrung:** Protokolle zur Missbrauchsüberwachung bis zu 30 Tage, sofern nicht gesetzlich länger geboten (OpenAI, o. J.).
- **`store: false`:** KI-LEAD sendet jede Anfrage mit `store: false` (`src/anbieter/openai.ts`). Damit speichert OpenAI keinen Anwendungszustand der Antwort; ausgenommen ist das Prompt-Caching mit bis zu 24 Stunden (OpenAI, o. J.).
- **Dateien:** PDF-Material geht inline mit der Anfrage, nicht über den Dateispeicher `/v1/files`. OpenAI prüft eingehende Dateien automatisch auf Darstellungen sexuellen Kindesmissbrauchs; Treffer werden zur manuellen Prüfung aufbewahrt (OpenAI, o. J.).

### Übermittlung in die USA

Beide Anbieter verarbeiten Anfragen in den USA. Das ist eine Übermittlung in ein Drittland im Sinne von Kapitel V DSGVO, sofern personenbezogene Daten enthalten sind. Die Rechtsgrundlage der Übermittlung regelt der Auftragsverarbeitungsvertrag des jeweiligen Anbieters mit der nutzenden Person oder Stelle. Wer personenbezogene Daten verarbeiten will, prüft diesen Vertrag selbst. Für KI-LEAD gilt unabhängig davon: keine personenbezogenen Daten.

## 6. Keine Verarbeitung beim Herausgeber

Der Herausgeber betreibt keinen Dienst, über den Inhalte laufen. Er sieht nicht, wer KI-LEAD nutzt, mit welchem Anbieter oder mit welchen Inhalten. Die Kosten der KI-Läufe trägt die nutzende Person über ihr eigenes Konto beim Anbieter.

## 7. GitHub Pages

Die Web-App wird über GitHub Pages ausgeliefert (`https://pereirawolf.github.io/ki-lead/`). Beim Aufruf protokolliert und speichert GitHub die IP-Adresse der Besucherin oder des Besuchers zu Sicherheitszwecken, auch ohne Anmeldung bei GitHub (GitHub, o. J.). Darauf hat der Herausgeber keinen Einfluss und keinen Zugriff. Einzelheiten stehen in der Datenschutzerklärung von GitHub.

Nach dem ersten Aufruf startet die installierte PWA aus dem Gerät. GitHub wird dann nur noch nach neuen Programmfassungen gefragt. Die Apps für iOS und Android rufen GitHub nicht auf; ihre Programmdateien liegen in der App.

## 8. Laufprotokolle

Jeder KI-Lauf wird auf dem Gerät protokolliert (`src/pipeline/lauf.ts`). Ein Laufprotokoll enthält:

- Profil-ID, Profilversion und Prüfsumme
- je Stufe Modell, Parameter, **vollständige Prompts** einschließlich Auftrag und Material sowie die **Rohantworten**
- Token, Kosten und Dauer
- PDF-Inhalte nur als Verweis, nicht als Datei

Protokolle bleiben, bis die Person sie löscht; jedes lässt sich in der KI-Erfassung einzeln löschen. Ein exportiertes Protokoll (`ki-lead-lauf/1`, JSON) enthält dasselbe. Es ist wie das verwendete Material zu behandeln. Der API-Schlüssel steht nie in einem Protokoll oder Export; die Tests prüfen das.

## 9. API-Schlüssel

Der Schlüssel geht nur im Aufruf an die Schnittstelle des jeweiligen Anbieters. Wo er auf dem Gerät liegt, wählt die Person unter „Einstellungen“ (`src/schluessel/ablage.ts`):

| Ablage | Wo | Schutz |
|---|---|---|
| Gerätespeicher der App (Vorgabe) | IndexedDB | unverschlüsselt; lesbar für jeden mit Zugriff auf das entsperrte Gerät |
| Nur für diese Sitzung | Arbeitsspeicher | nach Schließen oder Neuladen weg |
| Schlüsselbund des Systems (nur iOS und Android) | Keychain bzw. Keystore | verschlüsselt, nur dieses Gerät, nie in der iCloud; iOS nur entsperrt |

Die App für Android schließt App-Daten von der Sicherung aus (`android:allowBackup="false"`). Ein Ausgabenlimit beim Anbieter begrenzt das Risiko eines verlorenen Schlüssels in jedem Fall. Weiteres in [SICHERHEIT.md](SICHERHEIT.md).

## 10. Löschen

| Was | Wie |
|---|---|
| ein Laufprotokoll | KI-Erfassung, Liste der Läufe, „Löschen“ |
| Management Summary | „Leeren“ in der Ansicht |
| API-Schlüssel | Feld leeren und speichern; bei Wechsel der Ablage zieht er um und wird in der alten entfernt |
| alle Daten der Web-App | Websitedaten von `pereirawolf.github.io` in den Browsereinstellungen löschen |
| alle Daten der nativen App | App deinstallieren |
| Daten beim KI-Anbieter | nach dessen Fristen (Abschnitt 5); Anfragen dazu an den Anbieter |

Die Reparaturseite `reparatur.html` entfernt nur Programmdateien und die Service-Worker-Registrierung. Sie löscht ausdrücklich keine Meldungen, Profile, Einstellungen oder Schlüssel. Einen Knopf „Alle Daten dieses Geräts löschen“ gibt es noch nicht ([Spezifikation](SPEZIFIKATION.md), Abschnitt 10).

## 11. Fragen und Hinweise

Fragen und Hinweise zu diesen Datenschutzhinweisen über ein [Issue im Repository](https://github.com/pereirawolf/ki-lead/issues/new/choose) (Vorlage „Datenschutz“). Issues sind öffentlich; bitte keine personenbezogenen Daten hineinschreiben. Fragen zur Verarbeitung beim KI-Anbieter richten sich an den Anbieter.

---

## Anhang A: Datenschutzangaben im App Store (Apple)

Antworten für „App Privacy“ in App Store Connect. Gewählt ist die vorsichtige Lesart: Apple versteht unter „Collect“ die Übermittlung vom Gerät, wenn Daten länger gespeichert werden, als es die Bearbeitung der Anfrage in Echtzeit erfordert, auch durch Partner (Apple, o. J.). Die Anbieter bewahren Anfragen bis zu 30 Tage auf. Die Ausnahme für optionale Angaben greift nicht, weil die KI-Funktionen zur Hauptfunktion gehören.

| Frage | Antwort |
|---|---|
| Do you or your third-party partners collect data from this app? | Yes |
| Datenart | User Content → Other User Content (Auftrag, Material, Profiltexte an den KI-Anbieter) |
| Zweck | App Functionality |
| Linked to the user? | Yes (Anfragen laufen über das Anbieterkonto der Person) |
| Used for tracking? | No |
| Weitere Datenarten (Kontakt, Standort, Kennungen, Nutzungsdaten, Diagnose) | nicht erhoben |

Hinweis für die Beschreibung im Store: KI-Funktionen senden Inhalte mit dem eigenen API-Schlüssel der Person an Anthropic oder OpenAI; ohne Schlüssel arbeitet die App vollständig lokal.

## Anhang B: Datensicherheit bei Google Play

Antworten für das Formular „Data safety“. Google versteht unter Erhebung jede Übermittlung vom Gerät; Weitergabe an Dritte muss nicht angegeben werden, wenn sie auf einer bestimmten Handlung der Person beruht, bei der sie die Weitergabe erwartet (Google, o. J.).

| Frage | Antwort |
|---|---|
| Does your app collect or share any of the required user data types? | Yes |
| Erhobene Datenarten | App activity → Other user-generated content; Files and docs (nur wenn die Person Dateien als Material wählt) |
| Zweck | App functionality |
| Erhebung optional? | Ja: nur bei KI-Funktionen, die die Person selbst startet |
| Weitergabe (sharing) | Nein: Übermittlung an den KI-Anbieter löst die Person selbst aus und erwartet sie |
| Is all of the user data collected by your app encrypted in transit? | Yes (nur HTTPS; gemischte Inhalte gesperrt) |
| Do you provide a way for users to request that their data is deleted? | Ja: Daten auf dem Gerät löscht die Person selbst; beim Anbieter werden API-Daten nach dessen Fristen gelöscht (Abschnitt 5) |
| Datenschutzerklärung | Link auf diese Datei im Repository |

## Anhang C: Vorlage Schwellwertanalyse zur Datenschutz-Folgenabschätzung

Für Stellen, die KI-LEAD erproben. Die Vorlage hilft bei der Frage, ob eine Datenschutz-Folgenabschätzung (DSFA) nach Art. 35 DSGVO nötig ist. **DSFA und Verzeichnis der Verarbeitungstätigkeiten bleiben bei der nutzenden Stelle.** Die Vorlage ersetzt keine Beratung durch die eigene Datenschutzbeauftragte oder den eigenen Datenschutzbeauftragten.

**Stelle:** … **Vorhaben:** Erprobung von KI-LEAD, Version … **Ausgefüllt von / am:** …

### Schritt 1: Personenbezug

| Frage | Antwort | Begründung |
|---|---|---|
| Werden personenbezogene Daten eingegeben, als Material bereitgestellt oder in Profilen (z. B. `kontakte.json`) gespeichert? | ja / nein | |
| Wenn nein: Wie ist sichergestellt, dass nur fiktive oder offen zugängliche Inhalte ohne Personenbezug verwendet werden? | | z. B. Dienstanweisung zur Erprobung, fiktive Testlagen |

Lautet die Antwort „nein“ und ist sie begründet, ist keine DSFA nötig. Ergebnis unter Schritt 3 festhalten und Schritt 2 überspringen.

### Schritt 2: Prüfung, falls personenbezogene Daten verarbeitet werden

**a) Muss-Liste.** Prüfen, ob die Verarbeitung unter eine Liste von Verarbeitungsvorgängen nach Art. 35 Abs. 4 DSGVO fällt, für die eine DSFA durchzuführen ist. Die bundesweit abgestimmte Liste der Datenschutzkonferenz gilt für den nicht-öffentlichen Bereich (Datenschutzkonferenz, 2018); öffentliche Stellen ziehen die Liste ihrer zuständigen Aufsichtsbehörde heran, soweit vorhanden. Ergebnis: …

**b) Kriterien.** Die Leitlinien der Artikel-29-Datenschutzgruppe (2017) nennen neun Kriterien. Treffen zwei oder mehr zu, ist in der Regel eine DSFA durchzuführen.

| Kriterium | Hinweis zu KI-LEAD | trifft zu? | Begründung |
|---|---|---|---|
| 1. Bewerten oder Einstufen (Scoring, Profiling) | KI-LEAD bewertet Lagen, nicht Personen | | |
| 2. Automatisierte Entscheidung mit Rechtswirkung | nein: Entwürfe, Freigabe durch eine Person | | |
| 3. Systematische Überwachung | nein | | |
| 4. Sensible oder höchstpersönliche Daten | nur, wenn sie im Material stehen | | |
| 5. Verarbeitung in großem Umfang | Erprobung, kleiner Kreis | | |
| 6. Abgleich oder Zusammenführen von Datensätzen | Verdichtung führt Meldungen zusammen | | |
| 7. Daten schutzbedürftiger Betroffener | nur, wenn sie im Material stehen | | |
| 8. Innovative Nutzung neuer Technologien | ja: generative KI | | |
| 9. Verarbeitung hindert Betroffene an der Ausübung von Rechten | nein | | |

**c) Zusätzlich beachten:** Übermittlung in die USA (Abschnitt 5); Laufprotokolle enthalten vollständige Prompts und Material (Abschnitt 8); Aufbewahrung beim Anbieter bis zu 30 Tage, bei Verstößen länger.

### Schritt 3: Ergebnis

- [ ] Keine personenbezogenen Daten; keine DSFA erforderlich.
- [ ] Personenbezogene Daten; keine DSFA erforderlich, weil: …
- [ ] DSFA erforderlich.

Datum, Unterschrift, Beteiligung der oder des Datenschutzbeauftragten: …

---

## Quellen

Zugriff jeweils am 24.10.2026.

- Anthropic (2025): Commercial Terms of Service. Online abrufbar unter: https://www.anthropic.com/legal/commercial-terms [Zugriff: 24.10.2026]
- Anthropic (2026): How long do you store my organization's data? Online abrufbar unter: https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data [Zugriff: 24.10.2026]
- Anthropic (o. J. a): Web fetch tool. Online abrufbar unter: https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool [Zugriff: 24.10.2026]
- Anthropic (o. J. b): API and data retention. Online abrufbar unter: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention [Zugriff: 24.10.2026]
- Apple (o. J.): App privacy details on the App Store. Online abrufbar unter: https://developer.apple.com/support/app-privacy-on-the-app-store/ [Zugriff: 24.10.2026]
- Artikel-29-Datenschutzgruppe (2017): Guidelines on Data Protection Impact Assessment (DPIA) and determining whether processing is "likely to result in a high risk" for the purposes of Regulation 2016/679 (WP 248 rev.01), vom Europäischen Datenschutzausschuss bestätigt. Online abrufbar unter: http://ec.europa.eu/newsroom/article29/item-detail.cfm?item_id=611236 [Zugriff: 24.10.2026]
- Datenschutzkonferenz (2018): Liste von Verarbeitungsvorgängen nach Art. 35 Abs. 4 DS-GVO – DSFA-Liste Deutschland, nicht-öffentlicher Bereich, Version 1.1 vom 17.10.2018. Online abrufbar unter: https://datenschutz-hamburg.de/fileadmin/user_upload/HmbBfDI/Datenschutz/Informationen/DSFA_Muss-Liste_fuer_den_nicht-oeffentlicher_Bereich_-_Stand_17.10.2018.pdf [Zugriff: 24.10.2026]
- GitHub (o. J.): About GitHub Pages. Online abrufbar unter: https://docs.github.com/en/articles/about-github-pages [Zugriff: 24.10.2026]
- Google (o. J.): Provide information for Google Play's Data safety section. Online abrufbar unter: https://support.google.com/googleplay/android-developer/answer/10787469 [Zugriff: 24.10.2026]
- OpenAI (o. J.): Data controls in the OpenAI platform. Online abrufbar unter: https://developers.openai.com/api/docs/guides/your-data [Zugriff: 24.10.2026]

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 1.0 | 24.10.2026 | Erste Fassung (App 0.5.3) |
