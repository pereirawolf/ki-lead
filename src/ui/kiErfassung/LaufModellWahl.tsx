// Modellwahl für diesen Lauf (seit 0.6.5, TP-2026-W44-17): ModellWahl mit Profil, Einstellungen und Schlüsseln aus dem
// KI-Zugang; bis 0.6.4 die Hilfsfunktion `modellwahl()` in KiErfassung.tsx.

import type { ReactNode } from "react";
import type { ModellWahl as Modellwahl } from "../../pipeline/einstellungen";
import { ModellWahl, type StufeModell } from "../ModellWahl";
import { useKiZugang } from "../kiZugang";

export function LaufModellWahl({
  stufen,
  websuche,
  wahl,
  setWahl,
  kopf,
  children,
  erlaeuterung,
}: {
  stufen: StufeModell[];
  websuche: boolean;
  wahl: Modellwahl;
  setWahl: (w: Modellwahl) => void;
  kopf?: ReactNode;
  children?: ReactNode;
  /** im aufklappbaren Teil (seit 0.6.20, UX-2026-W44-03) */
  erlaeuterung?: ReactNode;
}) {
  const zugang = useKiZugang();
  if (!zugang?.profil) return null;
  return (
    <ModellWahl
      stufen={stufen}
      einstellungen={zugang.einstellungen}
      profil={zugang.profil}
      schluessel={zugang.schluessel}
      wahl={wahl}
      onChange={setWahl}
      websuche={websuche}
      kopf={kopf}
      erlaeuterung={erlaeuterung}
      zuEinstellungen={() => zugang.zuEinstellungen("modelle")}
    >
      {children}
    </ModellWahl>
  );
}
