const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

/**
 * Convierte duraciones tipo JWT ('15m', '7d', '30s') a milisegundos.
 */
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration.trim());
  if (!match) {
    throw new Error(
      `Formato de duracion invalido: "${duration}". Use por ejemplo "15m" o "7d".`,
    );
  }

  const [, value, unit] = match;
  return parseInt(value, 10) * UNIT_TO_MS[unit];
}
