# Grunddesign der App-Familie

Fassung 1.7 vom 11.11.2026 · Heiko Pereira Wolf · Lizenz CC BY 4.0 (siehe [Lizenz](#lizenz))

Diese Beschreibung legt das gemeinsame Grunddesign der Apps **KI-LEAD**, **KRITIS-LEAD** und **Thessa** fest. Es geht um Rahmen, Navigation, Seitenaufbau, Bedienmuster, Farbrollen, Schrift und Zugänglichkeit. Referenzumsetzung ist KI-LEAD. Jede Regel nennt ihre Fundstelle dort, Tests halten Beschreibung und Code im Gleichlauf.

Die Familie folgt dem Vorbild einer Office-Suite: Textverarbeitung, Tabellenkalkulation und Präsentation sehen verschieden aus, weil ihr Inhalt verschieden ist. Rahmen, Menüs, Dialoge und Bedienung sind dagegen gleich, deshalb findet man sich in jeder App sofort zurecht. Anders als bei einer Office-Suite hat hier **keine App eine eigene Produktfarbe**. Die Farbgebung bestimmt das Profil, mit dem die App arbeitet; eine App ohne Profile setzt ein festes Farbschema aus dem gemeinsamen Katalog (LD-F01).

| Datei | Inhalt | lesbar für |
|---|---|---|
| `README.md` (diese Datei) | Regeln, Wireframes als Text, Hinweise zur Übernahme | Menschen |
| [`rahmen.json`](rahmen.json) | Rahmen, Leisten, Komponenten, Wireframes und alle Regeln; Schema [`rahmen.schema.json`](rahmen.schema.json) | Maschinen, KI-Assistenz |
| [`lead-design.tokens.json`](lead-design.tokens.json) | Design Tokens: Farbrollen, Signalfarben, Füllfarben für Diagramme, Schrift, Radien, Maße, Umbrüche, Kontraste | Maschinen (Format der W3C Design Tokens Community Group) |
| [`lead-farbschemata.tokens.json`](lead-farbschemata.tokens.json) | alle Farbschemata des Katalogs mit ihren Kennungen | Maschinen |
| [`wireframe-breit.svg`](wireframe-breit.svg), [`wireframe-schmal.svg`](wireframe-schmal.svg) | Wireframes in Graustufen, 1280 px und 390 px | Menschen |

## Verbindlichkeit

- **MUSS**: gilt für jede App der Familie ohne Ausnahme.
- **SOLL**: gilt, außer eine App begründet die Abweichung (siehe [Übernahme](#übernahme-in-eine-schwester-app)).
- **KANN**: freigestellt.

Regeln sind mit Kennungen `LD-<Gruppe><Nr>` versehen. Die Kennung einer Regel ändert sich nie, eine entfallene Regel wird nicht neu vergeben. Regeln zu Profilen, Einstellungen, Statusanzeige, Laufanzeige und KI gelten nur für Apps, die diesen Bestandteil haben (seit Fassung 1.1). Wo eine Regel Namen aus KI-LEAD nennt (Bereiche, Kennsätze, „KI ruht“), sind das Beispiele der Referenzumsetzung. Jede App setzt ihre eigenen Arbeitsschritte ein.

## Aufbau einer Ansicht

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Produktname Zusatz │ Schritt A │ Schritt B │ Profile │ Einstellungen   [Status]  │  Kopfleiste               LD-R02
├══════════════════════════════════════════════════════════════════════════════════┤  Identitätsband 8 px      LD-R03
│▓Forschungsdemonstrator · Nur fiktive oder offen zugängliche Inhalte verwenden –  ▓│  Hinweisband, role=note   LD-R04
│▓keine personenbezogenen und keine eingestuften Daten.                            ▓│  ganzer Wortlaut, Umbruch nach Bedarf
├──────────────────────────────────────────────────────────────────────────────────┤  ▲ Kopfbereich, mitlaufend LD-R01
│   Bereichsname (h1)                                         [Aktion] [Aktion]    │  Seitenkopf               LD-A01
│   Kennsatz: Tätigkeit nach Methode                                               │
│   Profil: Name 1.0 · Profile                                                     │  Profilzeile
│                                                                                  │
│   ┃ ① Schritt 1      ┌────────────────────────────────────────────────────────┐  │  Arbeitsbereich           LD-A03
│   ┃ ② Schritt 2 •    │ Schritt 1 (h2, Fokusziel)                              │  │  • = Befundmarke          LD-A04
│   ┃ ③ Schritt 3      │ Einleitung                                             │  │
│   ┃ ④ Schritt 4      │ Beschriftung                                           │  │  Feld                     LD-E01
│   ┃                  │ Hilfetext                                              │  │
│   ┃  Leiste 15 rem   │ [ Eingabe                                  ]           │  │
│   ┃  mitlaufend      │ Fehlertext · Rückmeldungen · Werkzeuge                 │  │
│                      │ ▌Kasten: Information · Hinweis · Fehler · Erfolg       │  │  Kasten                   LD-M01
│                      │ ────────────────────────────────────────────────────── │  │
│                      │ [Zurück: Titel]                   [■ Weiter: Titel]    │  │  Schrittnavigation        LD-A05
│                      └────────────────────────────────────────────────────────┘  │
│                                                                                  │
│      Produktname Fassung · Datenhinweis · Lizenzen · Impressum · Datenschutz     │  Fußzeile                 LD-R05
└──────────────────────────────────────────────────────────────────────────────────┘
      ◄────────────────────── Inhalt höchstens 1180 px, mittig ────────────────────►      LD-R06
```

### Wireframe: schmal

Unter 860 px steht die Leiste waagerecht über der Arbeitsfläche, unter 640 px bricht die Hauptnavigation in eine eigene Zeile um. Unter 480 px werden Kopf und Segmente kompakt.

```
┌────────────────────────────────────┐
│ Produktname              [Status]  │
│ Schritt A  Schritt B  Schritt C    │  Navigation umbrechend, vollständig   LD-N05
│ Profile  Einstellungen             │
├════════════════════════════════════┤
│▓Forschungsdemonstrator · Nur      ▓│  Hinweisband, Kopfbereich mitlaufend LD-R04
│▓fiktive oder offen zugängliche    ▓│
│▓Inhalte verwenden – keine         ▓│
│▓personenbezogenen und keine       ▓│
│▓eingestuften Daten.               ▓│
├────────────────────────────────────┤
│ Bereichsname                       │
│ Kennsatz                           │
│ [Aktion]  [Aktion]                 │
│ Profil: Name 1.0 · Profile         │
│ ① Schritt 1  ② Schritt 2  ③ Sch…░ │  Leiste waagerecht, Verlauf am Rand   LD-A03
│ ━━━━━━━━━━━━───────────────────── │
│ ┌────────────────────────────────┐ │
│ │ Schritt 1                      │ │
│ │ …                              │ │
│ │ [Zurück: Titel] [■ Weiter: …]  │ │
│ └────────────────────────────────┘ │
│ Fußzeile                           │
└────────────────────────────────────┘
```

Die SVG-Fassungen ([breit](wireframe-breit.svg), [schmal](wireframe-schmal.svg)) zeigen dasselbe maßstäblich. Ihre Graustufen sind Platzhalter: Farben kommen aus den Farbrollen.

### Entsprechung zur Office-Suite

| Office-Suite | App-Familie |
|---|---|
| Titelleiste und Registerkarten des Menübands | Kopfleiste mit Hauptnavigation (LD-R02, LD-N01) |
| Navigationsbereich, Folienübersicht | Schrittleiste oder Bereichsleiste (LD-A03) |
| Dokument, Tabelle, Folie | Arbeitsfläche (LD-A05) |
| Ansichten (Normal, Gliederung) | Reiter einer Auswertung (LD-A06) |
| Dokumentvorlage und Design | Profil mit Farbschema (LD-F01) |
| Optionen | Einstellungen in Bereichen (LD-N06) |
| Statusleiste | Statusanzeige in der Kopfleiste und Laufanzeige (LD-M02, LD-M03) |

## Regeln

<!-- regeln:anfang (erzeugt aus rahmen.json mit „npm run design:tokens“; nicht von Hand ändern) -->

### Rahmen

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-r01"></a>**LD-R01** | MUSS | Die App besteht aus Kopfleiste, Identitätsband, Hinweisband, Inhalt und Fußzeile, in dieser Reihenfolge. Kopfleiste, Identitätsband und Hinweisband bilden den Kopfbereich; er bleibt beim Scrollen oben stehen, und Leisten, die unter ihm stehen bleiben, richten sich nach seiner gemessenen Höhe. | `src/App.tsx`, `src/styles/basis.css`, `src/ui/kopfHoehe.ts` |
| <a id="ld-r02"></a>**LD-R02** | MUSS | Die Kopfleiste zeigt links den Produktnamen (mit Zusatz, der bis zum Umbruch „breit“ entfällt), daneben die Hauptnavigation und rechts die Statusanzeige, wenn die App Anfragen stellt (LD-M03); eine App ohne Anfragen kann dort einen Anzeiger der Anmeldung oder Sicht führen. Das aktive Profil steht nicht in der Kopfleiste, sondern in der Profilzeile (LD-A01). | `src/App.tsx`, `src/styles/basis.css` |
| <a id="ld-r03"></a>**LD-R03** | MUSS | Unter der Kopfleiste liegt ein dekoratives Identitätsband von 8 px aus den Farbrollen marke-akzent-1 bis -3. Es trägt keine Information und entfällt bei erzwungenen Farben. | `src/styles.css`, `src/styles/a11y.css` |
| <a id="ld-r04"></a>**LD-R04** | MUSS | Unter dem Identitätsband steht ein Hinweisband (Rolle note) mit dem Wortlaut „Forschungsdemonstrator · Nur fiktive oder offen zugängliche Inhalte verwenden – keine personenbezogenen und keine eingestuften Daten.“: Kennung fett, Mittelpunkt mit gleichem Abstand davor und danach, natürlicher Umbruch im Satz, aber nie direkt vor oder nach dem Mittelpunkt. Fläche amt-tief, Text auf-amt-hover, keine Signalfarbe (LD-F04). Ab 96 px Scrollhöhe, mindestens aber eine volle Bandhöhe über 8 px, wird es schmaler (weniger Innenabstand, kleinere Schrift), unter 8 px wieder wie zuvor; der ganze Wortlaut bleibt immer sichtbar und bricht bei Bedarf um, nichts wird abgeschnitten. Es lässt sich nicht ausblenden. Hinweise, die nur eine App betreffen, stehen nicht im Band, sondern in Fußzeile (LD-R05), Startseite oder „Über“. | `src/App.tsx`, `src/ui/hinweisband.ts`, `src/ui/kopfKompakt.ts`, `src/styles/basis.css` |
| <a id="ld-r05"></a>**LD-R05** | MUSS | Die Fußzeile nennt Produktname mit Fassung, wohin Daten gehen, und verweist extern auf Lizenzen, Impressum und Datenschutz. | `src/App.tsx` |
| <a id="ld-r06"></a>**LD-R06** | MUSS | Der Inhalt ist höchstens 1180 px breit und mittig. Abstände am Rand berücksichtigen die sicheren Bereiche des Geräts (env(safe-area-inset-*)). | `src/styles/basis.css` |

### Navigation

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-n01"></a>**LD-N01** | MUSS | Die Hauptnavigation nennt die Arbeitsschritte der App in fachlicher Reihenfolge, danach „Profile“ und „Einstellungen“, soweit die App Profile und Einstellungen hat; diese stehen dann immer am Ende. Besteht eine App aus mehreren Seiten (etwa Start, Formular, Beschreibung einer Schnittstelle), nennt die Hauptnavigation diese Seiten, und die Arbeitsschritte stehen in der Schrittleiste. KI-LEAD: Erfassung, KI-Erfassung, Auswertung, Profile, Einstellungen. | `src/App.tsx`, `docs/SPEZIFIKATION.md` |
| <a id="ld-n02"></a>**LD-N02** | MUSS | Bereichsnamen, Überschriften und Kennsätze legt die App fest, nicht das Profil. Das Profil liefert Produkttitel für Ausgaben wie PDF und Dateinamen. | `CHANGELOG.md` |
| <a id="ld-n03"></a>**LD-N03** | MUSS | Die aktive Stelle trägt aria-current (page in Navigation, Bereichsleiste und Reitern, step in Schrittfolgen) und ist nicht nur über Farbe erkennbar, sondern zusätzlich über Unterstreichung, Rand oder gefüllte Nummer. | `src/styles/basis.css`, `src/ui/Meldung.tsx` |
| <a id="ld-n04"></a>**LD-N04** | MUSS | Ansicht, Bereich und Reiter stehen im Hash der Adresse (#/<ansicht>/<teil>), Inhalte nie. Neuladen behält die Ansicht, Zurück und Vor wechseln sie, Tiefenlinks öffnen sie. | `src/ui/app/adresse.ts` |
| <a id="ld-n05"></a>**LD-N05** | MUSS | Bis zum Umbruch „mittel“ steht die Hauptnavigation in einer eigenen Zeile und bricht um; alle Bereiche bleiben sichtbar, ohne Menüknopf und ohne Abschneiden. | `src/styles/basis.css` |
| <a id="ld-n06"></a>**LD-N06** | SOLL | Hat die App Einstellungen, sind sie in Bereiche geteilt: „Übersicht“ zuerst, dann die Bereiche der App, am Ende „Darstellung“, „Daten“ und „Über <Produktname>“. | `src/ui/Einstellungen.tsx` |

### Seitenaufbau

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-a01"></a>**LD-A01** | MUSS | Jeder Bereich beginnt mit einem Seitenkopf: Überschrift h1 mit dem Bereichsnamen, Kennsatz in einem Satz und rechts den Aktionen des Bereichs. Arbeitet die App mit Profilen, steht darunter die Profilzeile mit Name und Fassung des aktiven Profils und einem Verweis auf „Profile“. | `src/ui/Meldung.tsx`, `src/ui/Lagebild.tsx`, `src/ui/ProfilZeile.tsx` |
| <a id="ld-a02"></a>**LD-A02** | SOLL | Die Kennsätze der Bereiche sind parallel gebaut (<Tätigkeit> nach <Methode>, gegebenenfalls mit Zusatz), etwa „Erfassung einer Meldung nach LEAD-Systematik“. | `CHANGELOG.md` |
| <a id="ld-a03"></a>**LD-A03** | MUSS | Mehrteilige Bereiche haben einen Arbeitsbereich aus Leiste (15 rem, links, mitlaufend) und Arbeitsfläche. Bis zum Umbruch „breit“ steht die Leiste waagerecht über dem Inhalt, ist scrollbar, zeigt am Rand einen Verlauf, solange dort weitere Abschnitte liegen, und rückt den aktiven Abschnitt ins Bild. | `src/styles/basis.css`, `src/ui/leiste.ts` |
| <a id="ld-a04"></a>**LD-A04** | MUSS | Schrittfolgen sind nummeriert. Ein Schritt mit angezeigtem Befund trägt einen Punkt an der Nummer, die Zahl steht im zugänglichen Namen. Schritte werden nicht nach ihrer Position als „erledigt“ gekennzeichnet. | `src/ui/Meldung.tsx`, `src/styles/basis.css` |
| <a id="ld-a05"></a>**LD-A05** | MUSS | Die Arbeitsfläche ist eine Karte mit Überschrift h2 als Fokusziel, optional einer Einleitung und den Inhalten. In Schrittfolgen (LD-A04) stehen am Ende „Zurück: <Titel>“ links (leiser Knopf) und „Weiter: <Titel>“ rechts (Hauptknopf); Bereiche ohne Reihenfolge haben keine Blätterknöpfe. | `src/ui/Meldung.tsx`, `src/styles/basis.css` |
| <a id="ld-a06"></a>**LD-A06** | SOLL | Gleichrangige Ansichten eines Ergebnisses stehen als Reiterleiste über dem Inhalt statt in einer seitlichen Leiste (KI-LEAD: Auswertung). | `src/ui/Lagebild.tsx` |
| <a id="ld-a07"></a>**LD-A07** | MUSS | Nach einem Wechsel von Schritt, Phase, Bereich, Reiter oder Ansicht beginnt der neue Inhalt oben unter der Kopfleiste, ohne Animation, und der Fokus liegt auf der neuen Überschrift. Knöpfe von Leisten, die stehen bleiben, behalten den Fokus. | `src/ui/sprung.ts`, `docs/BARRIEREFREIHEIT.md` |

### Farbe

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-f01"></a>**LD-F01** | MUSS | Farben werden nur über die Farbrollen gesetzt (CSS-Variablen --<rolle>). Es gibt keine Produktfarbe je App: Die Werte bestimmt das aktive Profil (farbschema.basis aus dem gemeinsamen Katalog, einzelne Rollen in farbschema.farben), sonst die Wahl unter „Einstellungen → Darstellung“. Eine App ohne Profile und ohne diese Wahl setzt ein festes Farbschema aus dem gemeinsamen Katalog, hell und dunkel; Werte außerhalb des Katalogs gibt es nicht. Bettet eine App ihr Profil beim Bau ein, ist das feste Schema das des Profils (farbschema.basis); dunkel gilt dann „Neutral · Night Mode“, bei „mehr Kontrast“ das Kontrastschema, wie bei „Automatisch“ (LD-F05). | `src/darstellung/thema.ts`, `docs/PROFILFORMAT.md`, `docs/farbschemas.md` |
| <a id="ld-f02"></a>**LD-F02** | MUSS | Alle Apps beziehen ihre Farbschemata aus demselben Katalog mit denselben Kennungen (Neutral, Kontrast, Bund, Bevölkerungsschutz, 16 Länder), damit ein Profil in jeder App gleich aussieht. Apps mit Profilen oder einer Wahl unter „Darstellung“ führen den ganzen Katalog; eine App mit festem Farbschema (LD-F01) übernimmt nur die Schemata, die sie setzt, mit Kennung und unveränderten Werten. | `src/darstellung/katalog.ts`, `design/lead-farbschemata.tokens.json` |
| <a id="ld-f03"></a>**LD-F03** | MUSS | Kontraste werden für jedes Schema und jedes Profilschema geprüft: Text 4,5:1, Konturen und Bedienelemente 3:1, Text in Kontrastschemata 7:1. Ein Profilschema, das sie verfehlt, wird mit Warnung verworfen; das Profil bleibt nutzbar. Setzt eine App ihr Farbschema beim Bau, prüft der Bau die Kontraste aller Schemata, die sie setzt, und bricht ab, wenn eines sie verfehlt. | `src/darstellung/thema.ts` |
| <a id="ld-f04"></a>**LD-F04** | MUSS | Signalfarben tragen ausschließlich Bewertung, Prüfergebnis und den Status der Einsatzbereitschaft, sind in allen Apps gleich, hängen nur von hell, dunkel und Kontrast ab und kommen nie aus einem Profil. Eine Bewertung oder ein Status ist nie nur über Farbe erkennbar. Die Ampel der Einsatzbereitschaft nutzt: einsatzbereit ok, eingeschränkt gering, im Einsatz einsatz, nicht einsatzbereit kritisch. Balken, Linien und Flächen in Diagrammen nutzen die Füllfarben fuell-ok, fuell-gering, fuell-einsatz und fuell-kritisch aus den Tokens; sie tragen nie allein Bedeutung, Zahl oder Beschriftung stehen daneben. | `src/darstellung/thema.ts`, `src/styles.css` |
| <a id="ld-f05"></a>**LD-F05** | MUSS | Die Vorgabe „Automatisch“ folgt hell und dunkel des Systems und bei „mehr Kontrast“ dem Kontrastschema. Erzwungene Farben (forced-colors) werden mit Systemfarben unterstützt. | `src/darstellung/thema.ts`, `src/styles/a11y.css` |
| <a id="ld-f06"></a>**LD-F06** | SOLL | Farbwerte stehen an einer Stelle (Katalog); die Stylesheets setzen keine Farbwerte. Ohne JavaScript gilt ein Fallback aus demselben Katalog. | `src/styles/basis.css`, `src/darstellung/fallback.ts` |

### Schrift und Sprache

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-t01"></a>**LD-T01** | MUSS | Schrift ist Atkinson Hyperlegible in den Gewichten 400 und 700, mit der App gebündelt. | `src/main.tsx`, `src/styles/basis.css` |
| <a id="ld-t02"></a>**LD-T02** | MUSS | Schriftgrößen und Maße von Text stehen in rem und folgen der Schriftgröße des Systems: Grundschrift 1,0625 rem (bis zum Umbruch „breit“ 1 rem), Zeilenhöhe 1,5, h1 1,6 rem, h2 1,35 rem. | `src/styles/basis.css` |
| <a id="ld-t03"></a>**LD-T03** | MUSS | Die Oberfläche spricht neutral an, ohne „du“ und ohne „Sie“: Infinitiv, Passiv oder sachlicher Bezug. | `CHANGELOG.md` |
| <a id="ld-t04"></a>**LD-T04** | SOLL | Daten und Uhrzeiten stehen in der Oberfläche deutsch (TT.MM.JJJJ, hh:mm). Dateinamen von Downloads beginnen mit dem Datum, damit sie im Ordner zeitlich sortiert stehen. | `docs/SPEZIFIKATION.md`, `src/kern/ausgabe.ts` |
| <a id="ld-t05"></a>**LD-T05** | SOLL | Beschriftungen der Oberfläche verbinden mit „und“, nicht mit „&“. Das gilt auch für die Schrittnamen der Schrittleiste, wenn der gleichnamige Feldname „&“ oder „/“ trägt (etwa „Quellen und Referenzen“, „Ereignisse und Sachverhalte“); ein Umbruch hinter „/“ stellte das Zeichen sonst ans Zeilenende. „&“ steht nur in Feldnamen der LEAD-Meldevorlage und der Darstellungsdatei eines Profils (etwa „Lage & Ereignis“, „Quellen & Referenzen“), damit sie gleich lauten wie in Vorlage, SOPs und Kodierleitfaden. | `src/ui/Einstellungen.tsx`, `profile/lead-beispiel/meldung.ui.json` |

### Bedienelemente

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-b01"></a>**LD-B01** | MUSS | Knöpfe gibt es als Hauptknopf (gefüllt in der Aktionsfarbe, für die vorgesehene nächste Aktion), Standard (Umriss) und leise, dazu klein für Zeilenaktionen. Knöpfe sind mindestens 44 px hoch; bei grober Zeigereingabe gilt das für alle Bedienelemente. | `src/styles/basis.css` |
| <a id="ld-b02"></a>**LD-B02** | MUSS | Knöpfe sind mit einem Verb oder Verb und Gegenstand beschriftet (etwa „In die Erfassung übernehmen“). Knöpfe zum Blättern nennen ihr Ziel (etwa „Weiter: Quellen & Referenzen“). | `src/ui/Meldung.tsx` |
| <a id="ld-b03"></a>**LD-B03** | MUSS | Ist eine Hauptaktion gesperrt, nennt die App darüber, was noch fehlt („Noch offen“ mit Sprung zur Stelle), und verknüpft den Knopf per aria-describedby damit. | `src/ui/kiErfassung/Auftragsformular.tsx`, `src/ui/Kurzfassung.tsx` |
| <a id="ld-b04"></a>**LD-B04** | MUSS | Rückfragen stehen in einem modalen Dialog der App, nie in window.confirm: Text, „Abbrechen“ mit dem ersten Fokus und die bestätigende Aktion mit eigenem Verb. Escape bricht ab, danach kehrt der Fokus zum Auslöser zurück. | `src/ui/bestaetigung.ts` |

### Eingabe

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-e01"></a>**LD-E01** | MUSS | Ein Feld hat die Reihenfolge Beschriftung, Hilfetext, Eingabe, Fehlertext, Rückmeldungen, Werkzeuge: Anleitung vor der Eingabe, Rückmeldungen und Werkzeuge danach. Der Hilfetext ist per aria-describedby verknüpft. | `src/ui/HilfeFeld.tsx` |
| <a id="ld-e02"></a>**LD-E02** | MUSS | Eine fehlende Pflichtangabe erscheint am Feld erst, wenn es bearbeitet und verlassen wurde, nach dem Besuch des Prüfschritts oder bei einer geöffneten Datei; andere Befunde sofort. Ein Feld mit Befund trägt aria-invalid. | `src/ui/feldBefunde.ts`, `src/ui/HilfeFeld.tsx` |
| <a id="ld-e03"></a>**LD-E03** | SOLL | Listen gleichartiger Einträge lassen sich je Eintrag ein- und aufklappen; der Kopf zeigt Bezeichnung und Befundzahl, der Knopf trägt aria-expanded. | `src/ui/Feld.tsx` |
| <a id="ld-e04"></a>**LD-E04** | MUSS | Befunde zu Eingaben in einem Formular haben die Stufen Fehler, Warnung und Hinweis und führen per Sprung zum betroffenen Feld in seinem Schritt. Für die Prüfung eines geladenen Datenstands außerhalb eines Formulars gilt die Regel nicht. | `src/ui/Pruefen.tsx` |

### Rückmeldung

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-m01"></a>**LD-M01** | MUSS | Meldungen der App stehen in Kästen mit Randstreifen links: Information (Aktionsfarbe), Hinweis (gering), Fehler (kritisch, Rolle alert) und Erfolg (ok). | `src/styles/formular.css` |
| <a id="ld-m02"></a>**LD-M02** | MUSS | Laufende Vorgänge (Anfragen an einen Dienst) zeigen eine Laufanzeige mit Uhr, erwarteter Dauer und voraussichtlichen Kosten. Sie werden über eine eigene Statusregion höchstens alle 5 s angesagt; der Sekundenzähler steht außerhalb jeder Live-Region. | `src/ui/kiErfassung/Laufanzeige.tsx`, `docs/BARRIEREFREIHEIT.md` |
| <a id="ld-m03"></a>**LD-M03** | MUSS | Stellt die App Anfragen, zeigt sie rechts in der Kopfleiste eine Statusanzeige. Sie ist eine reine Anzeige (kein Knopf, kein Tabstopp) und zeigt, ob Anfragen laufen; ihr zugänglicher Name nennt die Zahl gleichzeitiger Anfragen. KI-LEAD: „KI ruht“ und „KI aktiv“. | `src/ui/KiSymbol.tsx`, `src/styles/basis.css` |
| <a id="ld-m04"></a>**LD-M04** | MUSS | Ausgaben, an denen eine KI mitgewirkt hat, sind sichtbar und maschinenlesbar gekennzeichnet; nicht freigegebene Ausgaben tragen „ENTWURF“. | `docs/KI-VERORDNUNG.md` |

### Zugänglichkeit und Plattform

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-z01"></a>**LD-Z01** | MUSS | Die Oberfläche erfüllt WCAG 2.2 Stufe AA. Jeder Bereich wird mit axe-core geprüft, breit und hell sowie 390 px breit und dunkel, ohne Ausnahmen. | `tests/browser/barrierefreiheit.spec.ts`, `docs/BARRIEREFREIHEIT.md` |
| <a id="ld-z02"></a>**LD-Z02** | MUSS | Der Fokus ist sichtbar: 3 px Ring in der Farbrolle fokus mit 2 px Abstand und einem zweiten Ring in fokus-abstand. | `src/styles/basis.css` |
| <a id="ld-z03"></a>**LD-Z03** | MUSS | Bewegung gibt es nur, wenn das System sie nicht reduziert (prefers-reduced-motion); Sprünge nach LD-A07 sind nie animiert. | `src/ui/bewegung.ts`, `src/styles.css` |
| <a id="ld-z04"></a>**LD-Z04** | MUSS | Die Ansicht bricht an drei Breiten um (860, 640 und 480 px) und richtet sich sonst nach Eigenschaften statt nach Geräten: grobe Zeigereingabe, reduzierte Bewegung, erzwungene Farben und Druck. | `src/styles.css` |
| <a id="ld-z05"></a>**LD-Z05** | SOLL | Beim Drucken entfallen Kopfleiste, Hinweisband, Fußzeile und Bedienleisten. | `src/styles/lagebild.css` |
| <a id="ld-z06"></a>**LD-Z06** | SOLL | Die App lädt nichts nach (keine fremden Schriften, kein CDN, keine Telemetrie) und startet als installierte App auch ohne Netz. | `docs/DATENSCHUTZ.md`, `src/pwa/sw-vorlage.js` |

<!-- regeln:ende -->

## Tokens

[`lead-design.tokens.json`](lead-design.tokens.json) folgt dem Format der [W3C Design Tokens Community Group](https://www.designtokens.org/tr/drafts/format/): Gruppen mit `$type`, `$value` und `$description`, Farben als Hexwert (`#RRGGBB`, mit Deckkraft `#RRGGBBAA`), Maße als `{ "value", "unit" }`. Werkzeuge wie Style Dictionary können daraus CSS-Variablen, Swift- oder Android-Ressourcen erzeugen. Eigene Angaben stehen unter `$extensions["de.pereirawolf.lead-design"]`:

- `css`: Name der CSS-Variablen in der Referenzumsetzung (`--<rolle>`);
- `profil`: `true`, wenn ein Profil die Rolle setzen darf (alle Farbrollen); `false` für Signal- und Füllfarben;
- `modi`: Werte der Rolle in den Schemata „Neutral · Night Mode“ und „Kontrast · Hell/Dunkel“ bzw. der Signal- und Füllfarben in dunkel und Kontrast. Die Füllfarben (`fuell`, seit Fassung 1.5) sind für Balken, Linien und Flächen in Diagrammen bestimmt; in den Kontrastschemata gelten ihre Werte von hell bzw. dunkel.

`$value` einer Farbrolle ist der Wert in „Neutral · Hell“. Die Werte aller übrigen Schemata stehen in [`lead-farbschemata.tokens.json`](lead-farbschemata.tokens.json); deren Kennungen (`neutral-hell`, `bund`, `de-th` …) sind die zulässigen Werte von `farbschema.basis` im Profilmanifest ([docs/PROFILFORMAT.md](../docs/PROFILFORMAT.md), [docs/farbschemas.md](../docs/farbschemas.md)). In [`rahmen.json`](rahmen.json) verweisen Werte in geschweiften Klammern wie `{mass.zielgroesse}` auf diese Tokens (Alias-Schreibweise der DTCG).

Die Token-Dateien sind **erzeugt**. `npm run design:tokens` liest Farbrollen, Signal- und Füllfarben und Katalog aus `src/darstellung/` und Maße, Schrift und Umbrüche aus den Stylesheets. Es schreibt auch die Regeltabellen oben aus `rahmen.json`. `npm run design:tokens -- pruefe` meldet veraltete Dateien. `tests/format/lead-design.test.ts` prüft beides, dazu das Schema, die Fundstellen der Regeln und die Namen von Navigation, Leisten und Reitern gegen den Code.

## Übernahme in eine Schwester-App

1. Auf eine **feste Fassung** verweisen, nicht auf `main`: einen Permalink mit Commit oder Tag, etwa `https://github.com/pereirawolf/ki-lead/blob/<commit>/design/README.md`. Die Fassung steht im Kopf dieser Datei und in `rahmen.json` (`fassung`).
2. Die Tokens aus `lead-design.tokens.json` übernehmen, mit derselben Fassung. Die App setzt ihre Farben ausschließlich über die Farbrollen und bezieht die Werte aus dem Profil oder, ohne Profile, aus einem festen Schema des Katalogs (LD-F01, LD-F02). Signalfarben übernimmt sie unverändert, auch „einsatz“ für den Status „im Einsatz“ (LD-F04).
3. In der Schwester-App eine Datei `design-abweichungen.md` führen: je abweichender SOLL-Regel die Kennung, die Begründung und gegebenenfalls ein Datum, bis zu dem sie gilt. MUSS-Regeln kennen keine Abweichung; passt eine nicht, wird sie hier geändert.
4. Für Prüfungen durch eine KI genügt der Verweis auf `rahmen.json`. Die Regeln haben dort Kennung, Stufe, Text und Fundstelle in KI-LEAD.

Änderungen am Grunddesign entstehen in diesem Repository. Jede neue Fassung steht unten im Änderungsverlauf; erhöht wird die Fassung in dieser Datei und in `rahmen.json`.

## Lizenz

© 2026 Heiko Pereira Wolf. Alle Dateien in diesem Ordner stehen wie die übrige Dokumentation unter [CC BY 4.0](../LICENSE-CONTENT) ([LICENSE-CONTENT](../LICENSE-CONTENT), Nr. 1 f). Wer sie übernimmt oder bearbeitet, nennt den Herausgeber und macht Änderungen kenntlich. Vorschlag für die Namensnennung: „Grunddesign der App-Familie, Fassung <x.y>, Heiko Pereira Wolf, KI-LEAD, https://github.com/pereirawolf/ki-lead, CC BY 4.0“. Programmcode und Stylesheets von KI-LEAD stehen weiter unter der EUPL-1.2.

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 1.0 | 03.11.2026 | Erste Fassung nach dem Stand von KI-LEAD 0.7.3: 47 Regeln, Wireframes, Tokens im Format der DTCG |
| 1.1 | 04.11.2026 | Nach dem Abgleich mit Thessa ([thessa#16](https://github.com/pereirawolf/thessa/pull/16)): Regeln zu Profilen, Einstellungen, Statusanzeige und Laufanzeige gelten nur, wo eine App den Bestandteil hat (LD-R02, LD-N01, LD-N06, LD-A01, LD-M02, LD-M03); eine App ohne Profile setzt ein festes Farbschema aus dem Katalog (LD-F01, LD-F02); neue Signalfarben `einsatz` und `einsatz-zart` für den Status „im Einsatz“, Zuordnung der Ampel der Einsatzbereitschaft (LD-F04); „Zurück“ und „Weiter“ nur in Schrittfolgen (LD-A05); Befunde mit Sprung nur für Eingaben in Formularen (LD-E04). Kennungen und Zahl der Regeln unverändert. |
| 1.2 | 04.11.2026 | Nach dem Abgleich mit KRITIS-LEAD ([kritis-lead#18](https://github.com/pereirawolf/kritis-lead/pull/18)), Entscheidungen des Herausgebers vom 03.11.2026: Hauptnavigation einer App aus mehreren Seiten (LD-N01); Farbschema eines beim Bau eingebetteten Profils, dunkel und bei „mehr Kontrast“ wie „Automatisch“ (LD-F01); Kontrastprüfung beim Bau mit Abbruch (LD-F03); Referenzumsetzung zu LD-B01 und LD-Z02 nachgezogen (Chips und Segmente, KI-LEAD 0.7.6). Kennungen, Zahl der Regeln und Tokens unverändert. |
| 1.3 | 04.11.2026 | Referenzumsetzung nach der Durchsicht der Oberfläche (Befunddatei `ki-lead-befund_ux_2026-W45.json`, KI-LEAD 0.7.11): Reiter der Auswertung in der Reihenfolge Lage, Redaktion, Ausgabe mit feinen Trennern und unter dem Kopf stehend (UX-2026-W45-03, Beispiel zu LD-A06 und LD-A07); Adresse der Auswertung `#/auswertung/<reiter>` (UX-2026-W45-05, Beispiel zu LD-N04). Regeln, Kennungen und Tokens unverändert. |
| 1.4 | 05.11.2026 | Neue SOLL-Regel LD-T05: Beschriftungen verbinden mit „und“, „&“ nur in Feld- und Schrittnamen der LEAD-Meldevorlage und der Darstellungsdatei eines Profils (Entscheidung des Herausgebers vom 05.11.2026). Referenzumsetzung: Bereiche der Einstellungen „KI-Anbieter und API“, „Modelle und Aufwand“, „Recherche und Grenzen“ (KI-LEAD 0.7.14). Thessa und KRITIS-LEAD erfüllen LD-T05 bereits; übrige Regeln, Kennungen und Tokens unverändert |
| 1.5 | 05.11.2026 | Füllfarben für Diagramme als Token-Gruppe `fuell` (`fuell-ok`, `fuell-gering`, `fuell-einsatz`, `fuell-kritisch`, hell und dunkel, in den Kontrastschemata wie hell bzw. dunkel), übernommen aus Thessa; LD-F04 nennt sie und verlangt Zahl oder Beschriftung daneben (Entscheidung des Herausgebers vom 05.11.2026 beim Abgleich von Thessa mit Fassung 1.4: LD-F01 lässt für Apps mit festem Farbschema keine Werte außerhalb des Katalogs zu). Übrige Regeln, Kennungen, Farbrollen und Signalfarben unverändert |
| 1.6 | 10.11.2026 | Hinweisband der App-Familie (Entscheidung des Herausgebers vom 10.11.2026): LD-R04 von SOLL zu MUSS mit einheitlichem Wortlaut „Forschungsdemonstrator · Nur fiktive oder offen zugängliche Inhalte verwenden – keine personenbezogenen und keine eingestuften Daten.“, Fläche amt-tief und Text auf-amt-hover statt einer Signalfarbe (LD-F04), Umbruch nach Bedarf, aber nie am Mittelpunkt, nach dem Scrollen schmaler bei stets vollständig sichtbarem Wortlaut, nicht ausblendbar; Hinweise einer einzelnen App in Fußzeile, Startseite oder „Über“. LD-R01: Kopfleiste, Identitätsband und Hinweisband bilden den mitlaufenden Kopfbereich, stehende Leisten richten sich nach seiner Höhe. Referenzumsetzung KI-LEAD 0.7.16; Wireframes angepasst. Kennungen, Zahl der Regeln und Tokens unverändert |
| 1.7 | 11.11.2026 | LD-T05 gilt auch für die Schrittnamen der Schrittleiste: Sie verbinden mit „und“, auch wo der gleichnamige Feldname „&“ oder „/“ trägt; „&“ bleibt nur in Feldnamen der LEAD-Meldevorlage (Entscheidung des Herausgebers vom 11.11.2026, Anlass: Umbruch hinter „/“ in „Ereignisse/Sachverhalte“). Referenzumsetzung KI-LEAD 0.7.17: „Ereignisse und Sachverhalte“, „Beeinträchtigungen und Sachverhalte“, „Quellen und Referenzen“, „Prüfen und Exportieren“. Kennungen, Zahl der Regeln und Tokens unverändert |
