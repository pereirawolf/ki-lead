# Sicherheit: Schwachstellen melden

KI-LEAD ist ein privates Forschungsvorhaben ohne Betriebsorganisation. Meldungen werden nach bestem Vermögen bearbeitet; eine Frist wird nicht zugesagt.

## Meldeweg

Schwachstellen bitte **nicht** als öffentliches Issue melden, sondern vertraulich über GitHub:

**[Schwachstelle melden](https://github.com/pereirawolf/ki-lead/security/advisories/new)** (Reiter „Security“ → „Report a vulnerability“)

Hilfreich sind: betroffene Version oder Commit, Schritte zum Nachstellen, erwartete und tatsächliche Wirkung. Bitte keine echten API-Schlüssel, personenbezogenen oder eingestuften Daten mitsenden.

Nach einer Korrektur steht die Schwachstelle im [Änderungsverlauf](CHANGELOG.md); wer sie gemeldet hat, wird auf Wunsch genannt.

## Unterstützte Versionen

| Version | unterstützt |
|---|---|
| jeweils letzter Stand von `main` und die auf GitHub Pages veröffentlichte Fassung | ja |
| Release-Kandidat einer laufenden Erprobung (Git-Tag `v…-rc.N`, siehe [docs/ERPROBUNG.md](docs/ERPROBUNG.md)) | ja, bis zum Ende der Erprobung; Korrekturen erscheinen als neuer Kandidat |
| ältere Versionen | nein |
| Apps für iOS und Android | noch nicht veröffentlicht |

Bis zum ersten Release (Meilenstein M6) gibt es keine Wartungszweige.

## Nicht im Rahmen

- Schwachstellen der KI-Anbieter, von GitHub oder der Betriebssysteme: bitte an diese melden.
- Missbrauch eines eigenen API-Schlüssels auf einem fremden oder ungesperrten Gerät.
- Inhaltliche Fehler von KI-Entwürfen; sie sind bekannt und werden durch die fachliche Prüfung aufgefangen ([KI-Verordnung und Systemkarte](docs/KI-VERORDNUNG.md)).

Bedrohungsmodell und offene Maßnahmen: [docs/SICHERHEIT.md](docs/SICHERHEIT.md).
