// Beschriftung eines Feldes mit nachgestelltem Zusatz (seit 0.9.10, Entscheidung des Herausgebers vom 21.11.2026; Grunddesign
// LD-E01): Ein Zusatz in Klammern am Ende des Labels, der nur einschränkt („(optional)“, „(nur bei …)“), steht klein und leise
// hinter der Beschriftung wie der Pflichtzusatz „(Pflicht für finale Meldung)“, nicht in ihrer Schrift. Klammern, die zur
// Bezeichnung gehören („Meldezeitpunkt (t0)“, „Adresse (URL)“), bleiben Teil der Beschriftung. Der zugängliche Name bleibt
// der volle Text.

const ZUSATZ = /^(.*\S)\s+(\((?:optional|nur [^()]+)\))$/i;

/** Trennt einen einschränkenden Klammerzusatz vom Ende eines Labels */
export function teileBeschriftung(text: string): { haupt: string; zusatz?: string } {
  const m = ZUSATZ.exec(text);
  return m ? { haupt: m[1]!, zusatz: m[2]! } : { haupt: text };
}

export function Beschriftung({ text }: { text: string }) {
  const { haupt, zusatz } = teileBeschriftung(text);
  if (!zusatz) return <>{text}</>;
  return (
    <>
      {haupt} <span className="label-zusatz">{zusatz}</span>
    </>
  );
}
