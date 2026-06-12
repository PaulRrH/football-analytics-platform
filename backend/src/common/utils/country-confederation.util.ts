import { Confederation } from '@prisma/client';

/**
 * Mapeo heurístico país -> confederación, usado para clasificar equipos
 * importados desde proveedores externos (que no exponen la confederación
 * directamente). Cubre las naciones más habituales en las competiciones
 * disponibles en el tier gratuito de football-data.org. Si un país no
 * aparece aquí, se asume UEFA (la mayoría de esas competiciones son
 * europeas) y puede corregirse manualmente desde el admin de equipos.
 */
const COUNTRY_CONFEDERATION: Record<string, Confederation> = {
  // CONMEBOL
  argentina: Confederation.CONMEBOL,
  brazil: Confederation.CONMEBOL,
  uruguay: Confederation.CONMEBOL,
  colombia: Confederation.CONMEBOL,
  chile: Confederation.CONMEBOL,
  peru: Confederation.CONMEBOL,
  ecuador: Confederation.CONMEBOL,
  paraguay: Confederation.CONMEBOL,
  bolivia: Confederation.CONMEBOL,
  venezuela: Confederation.CONMEBOL,

  // CONCACAF
  mexico: Confederation.CONCACAF,
  'united states': Confederation.CONCACAF,
  usa: Confederation.CONCACAF,
  canada: Confederation.CONCACAF,
  'costa rica': Confederation.CONCACAF,
  jamaica: Confederation.CONCACAF,
  honduras: Confederation.CONCACAF,
  panama: Confederation.CONCACAF,
  'el salvador': Confederation.CONCACAF,
  'trinidad and tobago': Confederation.CONCACAF,

  // CAF
  morocco: Confederation.CAF,
  senegal: Confederation.CAF,
  nigeria: Confederation.CAF,
  egypt: Confederation.CAF,
  algeria: Confederation.CAF,
  tunisia: Confederation.CAF,
  cameroon: Confederation.CAF,
  ghana: Confederation.CAF,
  'ivory coast': Confederation.CAF,
  "côte d'ivoire": Confederation.CAF,
  'south africa': Confederation.CAF,
  mali: Confederation.CAF,
  'dr congo': Confederation.CAF,
  'democratic republic of the congo': Confederation.CAF,

  // AFC
  japan: Confederation.AFC,
  'south korea': Confederation.AFC,
  'korea republic': Confederation.AFC,
  'saudi arabia': Confederation.AFC,
  iran: Confederation.AFC,
  australia: Confederation.AFC,
  qatar: Confederation.AFC,
  iraq: Confederation.AFC,
  china: Confederation.AFC,
  'china pr': Confederation.AFC,

  // OFC
  'new zealand': Confederation.OFC,
  fiji: Confederation.OFC,
  'papua new guinea': Confederation.OFC,

  // UEFA
  spain: Confederation.UEFA,
  france: Confederation.UEFA,
  england: Confederation.UEFA,
  germany: Confederation.UEFA,
  italy: Confederation.UEFA,
  portugal: Confederation.UEFA,
  netherlands: Confederation.UEFA,
  belgium: Confederation.UEFA,
  croatia: Confederation.UEFA,
  switzerland: Confederation.UEFA,
  poland: Confederation.UEFA,
  austria: Confederation.UEFA,
  denmark: Confederation.UEFA,
  sweden: Confederation.UEFA,
  norway: Confederation.UEFA,
  scotland: Confederation.UEFA,
  wales: Confederation.UEFA,
  'republic of ireland': Confederation.UEFA,
  ireland: Confederation.UEFA,
  serbia: Confederation.UEFA,
  ukraine: Confederation.UEFA,
  'czech republic': Confederation.UEFA,
  czechia: Confederation.UEFA,
  turkey: Confederation.UEFA,
  greece: Confederation.UEFA,
  hungary: Confederation.UEFA,
  romania: Confederation.UEFA,
  russia: Confederation.UEFA,
  iceland: Confederation.UEFA,
  slovakia: Confederation.UEFA,
  slovenia: Confederation.UEFA,
  finland: Confederation.UEFA,
  'bosnia and herzegovina': Confederation.UEFA,
  'north macedonia': Confederation.UEFA,
  albania: Confederation.UEFA,
  bulgaria: Confederation.UEFA,
  israel: Confederation.UEFA,
  'northern ireland': Confederation.UEFA,
};

/**
 * Mapea el nombre de un país (en inglés, formato `area.name` de
 * football-data.org) a una `Confederation`. Si no hay coincidencia,
 * devuelve `UEFA` como valor por defecto.
 */
export function mapCountryToConfederation(countryName: string): Confederation {
  return (
    COUNTRY_CONFEDERATION[countryName.trim().toLowerCase()] ??
    Confederation.UEFA
  );
}
