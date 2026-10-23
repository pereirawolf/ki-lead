// Abschnitt „Über KI-LEAD“ in den Einstellungen (seit 0.5.5): Version, Abgrenzung, Impressum, Datenschutz, Lizenzen,
// Rückmeldung. Alle Verweise öffnen extern; die App selbst ruft sie nicht auf.
import type { ReactNode } from "react";
import { APP_VERSION, HERAUSGEBER, VERWEISE } from "../kern/herausgeber";

/** Link, der sich außerhalb der App öffnet */
export function ExternerLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function UeberAbschnitt() {
  return (
    <section className="schritt-inhalt abschnitt-einzeln" aria-labelledby="ueber-titel">
      <h2 id="ueber-titel">Über KI-LEAD</h2>
      <p className="einleitung">
        Version <strong>{APP_VERSION}</strong>. Forschungsdemonstrator für die KI-gestützte Anwendung der LEAD-Systematik (Lageerfassung, -auswertung und
        -darstellung).
      </p>
      <p>
        KI-LEAD ist ein privates Forschungsvorhaben von {HERAUSGEBER}. Es ist kein Produkt und keine Spezifikation einer Behörde oder Einrichtung und unabhängig
        von dienstlichen Vorhaben gleichen oder ähnlichen Namens. Die mitgelieferten Profile sind Beispiele; sie geben keine offiziellen Vorgaben wieder.
      </p>
      <ul className="ueber-verweise">
        <li>
          <ExternerLink href={VERWEISE.impressum}>Impressum</ExternerLink> und Kontakt auf der Website des Herausgebers
        </li>
        <li>
          <ExternerLink href={VERWEISE.datenschutz}>Datenschutzhinweise</ExternerLink>: Daten bleiben auf diesem Gerät; nur die KI-Funktionen senden Inhalte an
          den gewählten Anbieter
        </li>
        <li>
          Lizenzen: Code unter EUPL-1.2, Profilinhalte unter CC BY 4.0;{" "}
          <ExternerLink href={VERWEISE.drittkomponenten}>Drittkomponenten und Lizenzen</ExternerLink>
        </li>
        <li>
          <ExternerLink href={VERWEISE.quellcode}>Quellcode</ExternerLink> und <ExternerLink href={VERWEISE.rueckmeldung}>Rückmeldung</ExternerLink>{" "}
          (öffentliche Issues; Hinweise zur <ExternerLink href={VERWEISE.erprobung}>Erprobung</ExternerLink>)
        </li>
      </ul>
      <p className="hinweis">Die Verweise öffnen sich außerhalb der App. KI-LEAD selbst verbindet sich nur mit den KI-Anbietern.</p>
    </section>
  );
}
