/** Redondea el promedio a 1 decimal; null si no hay calificaciones. */
export function roundRatingAverage(average: number | null | undefined, count: number): number | null {
  if (count === 0 || average === null || average === undefined) return null;
  return Math.round(average * 10) / 10;
}
