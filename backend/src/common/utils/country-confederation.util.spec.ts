import { Confederation } from '@prisma/client';
import { mapCountryToConfederation } from './country-confederation.util';

describe('country-confederation.util', () => {
  describe('mapCountryToConfederation', () => {
    it('mapea países sudamericanos a CONMEBOL', () => {
      expect(mapCountryToConfederation('Argentina')).toBe(
        Confederation.CONMEBOL,
      );
      expect(mapCountryToConfederation('Brazil')).toBe(Confederation.CONMEBOL);
    });

    it('mapea países norte/centroamericanos a CONCACAF', () => {
      expect(mapCountryToConfederation('Mexico')).toBe(Confederation.CONCACAF);
    });

    it('mapea países africanos a CAF', () => {
      expect(mapCountryToConfederation('Morocco')).toBe(Confederation.CAF);
    });

    it('mapea países asiáticos a AFC', () => {
      expect(mapCountryToConfederation('Japan')).toBe(Confederation.AFC);
    });

    it('mapea países de Oceanía a OFC', () => {
      expect(mapCountryToConfederation('New Zealand')).toBe(Confederation.OFC);
    });

    it('mapea países europeos a UEFA', () => {
      expect(mapCountryToConfederation('Spain')).toBe(Confederation.UEFA);
    });

    it('es insensible a mayúsculas/minúsculas y espacios', () => {
      expect(mapCountryToConfederation('  argentina ')).toBe(
        Confederation.CONMEBOL,
      );
    });

    it('devuelve UEFA por defecto para países desconocidos', () => {
      expect(mapCountryToConfederation('Atlantis')).toBe(Confederation.UEFA);
    });
  });
});
