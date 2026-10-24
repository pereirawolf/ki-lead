# Eingang offener Befunde (Daten-Branch)

Dieser Branch enthält nur Daten und wird **nie in main gemergt**. Die automatisierten Prüfläufe (Prüfung montags, Erfassungstest mittwochs) legen hier vor der Freigabefrage ab:

- `eingang/ki-lead-befund_<teilaspekt>_<JJJJ>-W<KW>.json` – vollständige Befunddatei des Laufs (`ki-lead-befund/1`), einschließlich „Weitere Beobachtungen“
- `eingang/pruefsteine/<JJJJ>-W<KW>_<kurzname>/` – Meldung und Begleitnotiz aus dem Erfassungstest, bis sie über einen Pull Request nach `evaluation/pruefsteine/` übernommen sind

Offen ist ein Befund, der hier liegt, aber in `evaluation/befunde/befundregister.json` auf main nicht entschieden ist. Der Freitagslauf arbeitet offene Befunde gesammelt ab. Regeln: README in `evaluation/befunde/` auf main.

Dateien werden nicht gelöscht oder umgeschrieben; maßgeblich für den Stand ist das Register.
