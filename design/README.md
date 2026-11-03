# Grunddesign der App-Familie

Fassung 1.0 vom 03.11.2026 · Heiko Pereira Wolf · © 2026 Heiko Pereira Wolf, alle Rechte vorbehalten (siehe [Rechte](#rechte))

Diese Beschreibung legt das gemeinsame Grunddesign der Apps **KI-LEAD**, **KRITIS-LEAD** und **Thessa** fest. Es geht um Rahmen, Navigation, Seitenaufbau, Bedienmuster, Farbrollen, Schrift und Zugänglichkeit. Referenzumsetzung ist KI-LEAD. Jede Regel nennt ihre Fundstelle dort, Tests halten Beschreibung und Code im Gleichlauf.

Die Familie folgt dem Vorbild einer Office-Suite: Textverarbeitung, Tabellenkalkulation und Präsentation sehen verschieden aus, weil ihr Inhalt verschieden ist. Rahmen, Menüs, Dialoge und Bedienung sind dagegen gleich, deshalb findet man sich in jeder App sofort zurecht. Anders als bei einer Office-Suite hat hier **keine App eine eigene Produktfarbe**. Die Farbgebung bestimmt allein das Profil, mit dem die App arbeitet (LD-F01).

| Datei | Inhalt | lesbar für |
|---|---|---|
| `README.md` (diese Datei) | Regeln, Wireframes als Text, Hinweise zur Übernahme | Menschen |
| [`rahmen.json`](rahmen.json) | Rahmen, Leisten, Komponenten, Wireframes und alle Regeln; Schema [`rahmen.schema.json`](rahmen.schema.json) | Maschinen, KI-Assistenz |
| [`lead-design.tokens.json`](lead-design.tokens.json) | Design Tokens: Farbrollen, Signalfarben, Schrift, Radien, Maße, Umbrüche, Kontraste | Maschinen (Format der W3C Design Tokens Community Group) |
| [`lead-farbschemata.tokens.json`](lead-farbschemata.tokens.json) | alle Farbschemata des Katalogs mit ihren Kennungen | Maschinen |
| [`wireframe-breit.svg`](wireframe-breit.svg), [`wireframe-schmal.svg`](wireframe-schmal.svg) | Wireframes in Graustufen, 1280 px und 390 px | Menschen |

## Verbindlichkeit

- **MUSS**: gilt für jede App der Familie ohne Ausnahme.
- **SOLL**: gilt, außer eine App begründet die Abweichung (siehe [Übernahme](#übernahme-in-eine-schwester-app)).
- **KANN**: freigestellt.

Regeln sind mit Kennungen `LD-<Gruppe><Nr>` versehen. Die Kennung einer Regel ändert sich nie, eine entfallene Regel wird nicht neu vergeben. Wo eine Regel Namen aus KI-LEAD nennt (Bereiche, Kennsätze, „KI ruht“), sind das Beispiele der Referenzumsetzung. Jede App setzt ihre eigenen Arbeitsschritte ein.

## Aufbau einer Ansicht

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Produktname Zusatz │ Schritt A │ Schritt B │ Profile │ Einstellungen   [Status]  │  Kopfleiste, mitlaufend   LD-R02
├══════════════════════════════════════════════════════════════════════════════════┤  Identitätsband 8 px      LD-R03
│ Hinweisband: Einsatzgrenzen in einem Satz                                        │  role=note                LD-R04
├──────────────────────────────────────────────────────────────────────────────────┤
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
│ Hinweisband                        │
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
| <a id="ld-r01"></a>**LD-R01** | MUSS | Die App besteht aus Kopfleiste, Identitätsband, Hinweisband, Inhalt und Fußzeile, in dieser Reihenfolge. Die Kopfleiste bleibt beim Scrollen oben stehen. | `src/App.tsx`, `src/styles/basis.css` |
| <a id="ld-r02"></a>**LD-R02** | MUSS | Die Kopfleiste zeigt links den Produktnamen (mit Zusatz, der bis zum Umbruch „breit“ entfällt), daneben die Hauptnavigation und rechts die Statusanzeige. Das aktive Profil steht nicht in der Kopfleiste, sondern in der Profilzeile (LD-A01). | `src/App.tsx`, `src/styles/basis.css` |
| <a id="ld-r03"></a>**LD-R03** | MUSS | Unter der Kopfleiste liegt ein dekoratives Identitätsband von 8 px aus den Farbrollen marke-akzent-1 bis -3. Es trägt keine Information und entfällt bei erzwungenen Farben. | `src/styles.css`, `src/styles/a11y.css` |
| <a id="ld-r04"></a>**LD-R04** | SOLL | Ein Hinweisband unter dem Kopf nennt in einem Satz die Einsatzgrenzen der App (Rolle note), etwa nur fiktive oder offen zugängliche Inhalte. | `src/App.tsx` |
| <a id="ld-r05"></a>**LD-R05** | MUSS | Die Fußzeile nennt Produktname mit Fassung, wohin Daten gehen, und verweist extern auf Lizenzen, Impressum und Datenschutz. | `src/App.tsx` |
| <a id="ld-r06"></a>**LD-R06** | MUSS | Der Inhalt ist höchstens 1180 px breit und mittig. Abstände am Rand berücksichtigen die sicheren Bereiche des Geräts (env(safe-area-inset-*)). | `src/styles/basis.css` |

### Navigation

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-n01"></a>**LD-N01** | MUSS | Die Hauptnavigation nennt die Arbeitsschritte der App in fachlicher Reihenfolge, danach immer „Profile“ und „Einstellungen“. KI-LEAD: Erfassung, KI-Erfassung, Auswertung, Profile, Einstellungen. | `src/App.tsx`, `docs/SPEZIFIKATION.md` |
| <a id="ld-n02"></a>**LD-N02** | MUSS | Bereichsnamen, Überschriften und Kennsätze legt die App fest, nicht das Profil. Das Profil liefert Produkttitel für Ausgaben wie PDF und Dateinamen. | `CHANGELOG.md` |
| <a id="ld-n03"></a>**LD-N03** | MUSS | Die aktive Stelle trägt aria-current (page in Navigation, Bereichsleiste und Reitern, step in Schrittfolgen) und ist nicht nur über Farbe erkennbar, sondern zusätzlich über Unterstreichung, Rand oder gefüllte Nummer. | `src/styles/basis.css`, `src/ui/Meldung.tsx` |
| <a id="ld-n04"></a>**LD-N04** | MUSS | Ansicht, Bereich und Reiter stehen im Hash der Adresse (#/<ansicht>/<teil>), Inhalte nie. Neuladen behält die Ansicht, Zurück und Vor wechseln sie, Tiefenlinks öffnen sie. | `src/ui/app/adresse.ts` |
| <a id="ld-n05"></a>**LD-N05** | MUSS | Bis zum Umbruch „mittel“ steht die Hauptnavigation in einer eigenen Zeile und bricht um; alle Bereiche bleiben sichtbar, ohne Menüknopf und ohne Abschneiden. | `src/styles/basis.css` |
| <a id="ld-n06"></a>**LD-N06** | SOLL | Die Einstellungen sind in Bereiche geteilt: „Übersicht“ zuerst, dann die Bereiche der App, am Ende „Darstellung“, „Daten“ und „Über <Produktname>“. | `src/ui/Einstellungen.tsx` |

### Seitenaufbau

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-a01"></a>**LD-A01** | MUSS | Jeder Bereich beginnt mit einem Seitenkopf: Überschrift h1 mit dem Bereichsnamen, Kennsatz in einem Satz und rechts den Aktionen des Bereichs. Darunter steht die Profilzeile mit Name und Fassung des aktiven Profils und einem Verweis auf „Profile“. | `src/ui/Meldung.tsx`, `src/ui/Lagebild.tsx`, `src/ui/ProfilZeile.tsx` |
| <a id="ld-a02"></a>**LD-A02** | SOLL | Die Kennsätze der Bereiche sind parallel gebaut (<Tätigkeit> nach <Methode>, gegebenenfalls mit Zusatz), etwa „Erfassung einer Meldung nach LEAD-Systematik“. | `CHANGELOG.md` |
| <a id="ld-a03"></a>**LD-A03** | MUSS | Mehrteilige Bereiche haben einen Arbeitsbereich aus Leiste (15 rem, links, mitlaufend) und Arbeitsfläche. Bis zum Umbruch „breit“ steht die Leiste waagerecht über dem Inhalt, ist scrollbar, zeigt am Rand einen Verlauf, solange dort weitere Abschnitte liegen, und rückt den aktiven Abschnitt ins Bild. | `src/styles/basis.css`, `src/ui/leiste.ts` |
| <a id="ld-a04"></a>**LD-A04** | MUSS | Schrittfolgen sind nummeriert. Ein Schritt mit angezeigtem Befund trägt einen Punkt an der Nummer, die Zahl steht im zugänglichen Namen. Schritte werden nicht nach ihrer Position als „erledigt“ gekennzeichnet. | `src/ui/Meldung.tsx`, `src/styles/basis.css` |
| <a id="ld-a05"></a>**LD-A05** | MUSS | Die Arbeitsfläche ist eine Karte mit Überschrift h2 als Fokusziel, optional einer Einleitung, den Inhalten und am Ende „Zurück: <Titel>“ links (leiser Knopf) und „Weiter: <Titel>“ rechts (Hauptknopf). | `src/ui/Meldung.tsx`, `src/styles/basis.css` |
| <a id="ld-a06"></a>**LD-A06** | SOLL | Gleichrangige Ansichten eines Ergebnisses stehen als Reiterleiste über dem Inhalt statt in einer seitlichen Leiste (KI-LEAD: Auswertung). | `src/ui/Lagebild.tsx` |
| <a id="ld-a07"></a>**LD-A07** | MUSS | Nach einem Wechsel von Schritt, Phase, Bereich, Reiter oder Ansicht beginnt der neue Inhalt oben unter der Kopfleiste, ohne Animation, und der Fokus liegt auf der neuen Überschrift. Knöpfe von Leisten, die stehen bleiben, behalten den Fokus. | `src/ui/sprung.ts`, `docs/BARRIEREFREIHEIT.md` |

### Farbe

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-f01"></a>**LD-F01** | MUSS | Farben werden nur über die Farbrollen gesetzt (CSS-Variablen --<rolle>). Es gibt keine Produktfarbe je App: Die Werte bestimmt allein das aktive Profil (farbschema.basis aus dem gemeinsamen Katalog, einzelne Rollen in farbschema.farben), sonst die Wahl unter „Einstellungen → Darstellung“. | `src/darstellung/thema.ts`, `docs/PROFILFORMAT.md`, `docs/farbschemas.md` |
| <a id="ld-f02"></a>**LD-F02** | MUSS | Alle Apps führen denselben Katalog der Farbschemata mit denselben Kennungen (Neutral, Kontrast, Bund, Bevölkerungsschutz, 16 Länder), damit ein Profil in jeder App gleich aussieht. | `src/darstellung/katalog.ts`, `design/lead-farbschemata.tokens.json` |
| <a id="ld-f03"></a>**LD-F03** | MUSS | Kontraste werden für jedes Schema und jedes Profilschema geprüft: Text 4,5:1, Konturen und Bedienelemente 3:1, Text in Kontrastschemata 7:1. Ein Profilschema, das sie verfehlt, wird mit Warnung verworfen; das Profil bleibt nutzbar. | `src/darstellung/thema.ts` |
| <a id="ld-f04"></a>**LD-F04** | MUSS | Signalfarben tragen ausschließlich Bewertung und Prüfergebnis, sind in allen Apps gleich, hängen nur von hell, dunkel und Kontrast ab und kommen nie aus einem Profil. Eine Bewertung ist nie nur über Farbe erkennbar. | `src/darstellung/thema.ts`, `src/styles.css` |
| <a id="ld-f05"></a>**LD-F05** | MUSS | Die Vorgabe „Automatisch“ folgt hell und dunkel des Systems und bei „mehr Kontrast“ dem Kontrastschema. Erzwungene Farben (forced-colors) werden mit Systemfarben unterstützt. | `src/darstellung/thema.ts`, `src/styles/a11y.css` |
| <a id="ld-f06"></a>**LD-F06** | SOLL | Farbwerte stehen an einer Stelle (Katalog); die Stylesheets setzen keine Farbwerte. Ohne JavaScript gilt ein Fallback aus demselben Katalog. | `src/styles/basis.css`, `src/darstellung/fallback.ts` |

### Schrift und Sprache

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-t01"></a>**LD-T01** | MUSS | Schrift ist Atkinson Hyperlegible in den Gewichten 400 und 700, mit der App gebündelt. | `src/main.tsx`, `src/styles/basis.css` |
| <a id="ld-t02"></a>**LD-T02** | MUSS | Schriftgrößen und Maße von Text stehen in rem und folgen der Schriftgröße des Systems: Grundschrift 1,0625 rem (bis zum Umbruch „breit“ 1 rem), Zeilenhöhe 1,5, h1 1,6 rem, h2 1,35 rem. | `src/styles/basis.css` |
| <a id="ld-t03"></a>**LD-T03** | MUSS | Die Oberfläche spricht neutral an, ohne „du“ und ohne „Sie“: Infinitiv, Passiv oder sachlicher Bezug. | `CHANGELOG.md` |
| <a id="ld-t04"></a>**LD-T04** | SOLL | Daten und Uhrzeiten stehen in der Oberfläche deutsch (TT.MM.JJJJ, hh:mm). Dateinamen von Downloads beginnen mit dem Datum, damit sie im Ordner zeitlich sortiert stehen. | `docs/SPEZIFIKATION.md`, `src/kern/ausgabe.ts` |

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
| <a id="ld-e04"></a>**LD-E04** | MUSS | Befunde haben die Stufen Fehler, Warnung und Hinweis und führen per Sprung zum betroffenen Feld in seinem Schritt. | `src/ui/Pruefen.tsx` |

### Rückmeldung

| Kennung | Stufe | Regel | Fundstelle in KI-LEAD |
|---|---|---|---|
| <a id="ld-m01"></a>**LD-M01** | MUSS | Meldungen der App stehen in Kästen mit Randstreifen links: Information (Aktionsfarbe), Hinweis (gering), Fehler (kritisch, Rolle alert) und Erfolg (ok). | `src/styles/formular.css` |
| <a id="ld-m02"></a>**LD-M02** | MUSS | Laufende Vorgänge zeigen eine Laufanzeige mit Uhr, erwarteter Dauer und voraussichtlichen Kosten. Sie werden über eine eigene Statusregion höchstens alle 5 s angesagt; der Sekundenzähler steht außerhalb jeder Live-Region. | `src/ui/kiErfassung/Laufanzeige.tsx`, `docs/BARRIEREFREIHEIT.md` |
| <a id="ld-m03"></a>**LD-M03** | MUSS | Die Statusanzeige rechts in der Kopfleiste ist eine reine Anzeige (kein Knopf, kein Tabstopp) und zeigt, ob Anfragen laufen; ihr zugänglicher Name nennt die Zahl gleichzeitiger Anfragen. KI-LEAD: „KI ruht“ und „KI aktiv“. | `src/ui/KiSymbol.tsx`, `src/styles/basis.css` |
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
- `profil`: `true`, wenn ein Profil die Rolle setzen darf (alle Farbrollen); `false` für Signalfarben;
- `modi`: Werte der Rolle in den Schemata „Neutral · Night Mode“ und „Kontrast · Hell/Dunkel“ bzw. der Signalfarben in dunkel und Kontrast.

`$value` einer Farbrolle ist der Wert in „Neutral · Hell“. Die Werte aller übrigen Schemata stehen in [`lead-farbschemata.tokens.json`](lead-farbschemata.tokens.json); deren Kennungen (`neutral-hell`, `bund`, `de-th` …) sind die zulässigen Werte von `farbschema.basis` im Profilmanifest ([docs/PROFILFORMAT.md](../docs/PROFILFORMAT.md), [docs/farbschemas.md](../docs/farbschemas.md)). In [`rahmen.json`](rahmen.json) verweisen Werte in geschweiften Klammern wie `{mass.zielgroesse}` auf diese Tokens (Alias-Schreibweise der DTCG).

Die Token-Dateien sind **erzeugt**. `npm run design:tokens` liest Farbrollen, Signalfarben und Katalog aus `src/darstellung/` und Maße, Schrift und Umbrüche aus den Stylesheets. Es schreibt auch die Regeltabellen oben aus `rahmen.json`. `npm run design:tokens -- pruefe` meldet veraltete Dateien. `tests/format/lead-design.test.ts` prüft beides, dazu das Schema, die Fundstellen der Regeln und die Namen von Navigation, Leisten und Reitern gegen den Code.

## Übernahme in eine Schwester-App

1. Auf eine **feste Fassung** verweisen, nicht auf `main`: einen Permalink mit Commit oder Tag, etwa `https://github.com/pereirawolf/ki-lead/blob/<commit>/design/README.md`. Die Fassung steht im Kopf dieser Datei und in `rahmen.json` (`fassung`).
2. Die Tokens aus `lead-design.tokens.json` übernehmen, mit derselben Fassung. Die App setzt ihre Farben ausschließlich über die Farbrollen und bezieht die Werte aus dem Profil (LD-F01, LD-F02).
3. In der Schwester-App eine Datei `design-abweichungen.md` führen: je abweichender SOLL-Regel die Kennung, die Begründung und gegebenenfalls ein Datum, bis zu dem sie gilt. MUSS-Regeln kennen keine Abweichung; passt eine nicht, wird sie hier geändert.
4. Für Prüfungen durch eine KI genügt der Verweis auf `rahmen.json`. Die Regeln haben dort Kennung, Stufe, Text und Fundstelle in KI-LEAD.

Änderungen am Grunddesign entstehen in diesem Repository. Jede neue Fassung steht unten im Änderungsverlauf; erhöht wird die Fassung in dieser Datei und in `rahmen.json`.

## Rechte

© 2026 Heiko Pereira Wolf. **Alle Rechte vorbehalten** an dieser Beschreibung, an `rahmen.json` mit Schema, an den Wireframes und an den Token-Dateien in diesem Ordner ([LICENSE-CONTENT](../LICENSE-CONTENT), Nr. 7). Erlaubt ist das Lesen und das Verweisen auf diese Dateien. Jede andere Nutzung bedarf der Zustimmung des Herausgebers, insbesondere die Übernahme in eigene Projekte.

Der Vorbehalt gilt nur für die Dateien in diesem Ordner. Er schränkt keine Rechte ein, die für andere Dateien schon bestehen (LICENSE-CONTENT, Grundsatz): Programmcode und Stylesheets von KI-LEAD bleiben unter der EUPL-1.2, die übrige Dokumentation unter CC BY 4.0, darunter [docs/farbschemas.md](../docs/farbschemas.md) und [docs/BARRIEREFREIHEIT.md](../docs/BARRIEREFREIHEIT.md). Diese Hinweise sind keine Rechtsberatung.

## Änderungsverlauf

| Fassung | Datum | Änderung |
|---|---|---|
| 1.0 | 03.11.2026 | Erste Fassung nach dem Stand von KI-LEAD 0.7.2: 47 Regeln, Wireframes, Tokens im Format der DTCG |
