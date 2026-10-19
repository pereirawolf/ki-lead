import { useId } from "react";
import { heuteDE } from "../kern/ausgabe";
import { kategorienGeordnet, neuerQuellenEintrag, rangfolgeText } from "../kern/quellen";
import type { Profil } from "../kern/typen";

interface Props {
  profil: Profil;
  label: string;
  hinweis?: string;
  zeilen?: number;
  wert: string;
  onChange: (v: string) => void;
}

export function QuellenFeld({ profil, label, hinweis, zeilen, wert, onChange }: Props) {
  const id = useId();
  const k = profil.ui.quellen;
  const rang = rangfolgeText(profil.ui);
  const anfuegen = () => {
    const eintrag = neuerQuellenEintrag(wert, profil.ui, heuteDE());
    onChange((wert.trim() ? wert.replace(/\s+$/, "") + "\n" : "") + eintrag);
  };
  return (
    <div className="feld feld-quellen">
      {k && (
        <dl className="kategorien">
          {kategorienGeordnet(profil.ui).map(([code, text]) => (
            <div key={code}>
              <dt>{code}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      )}
      {rang && (
        <p className="hinweis">
          <strong>Quellenpriorität: {rang}</strong>
        </p>
      )}
      {k?.rangfolge_hinweis && <p className="hinweis">{k.rangfolge_hinweis}</p>}
      <label className="feld-label" htmlFor={id}>
        {label}
      </label>
      <textarea id={id} className="quellen-text" rows={zeilen || 10} value={wert} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
      {hinweis && <p className="hinweis">{hinweis}</p>}
      <button type="button" className="knopf leise" onClick={anfuegen}>
        Eintrag anfügen
      </button>
    </div>
  );
}
