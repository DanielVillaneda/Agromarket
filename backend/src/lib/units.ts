import { ProductUnit } from '../modules/products/product.schemas';

export const WEIGHT_UNITS = ['kilo', 'tonelada', 'libra'] as const;
export type WeightUnit = (typeof WEIGHT_UNITS)[number];

const GRAMS_PER_UNIT: Record<WeightUnit, number> = {
  kilo: 1000,
  tonelada: 1_000_000,
  libra: 453.59237,
};

export function isWeightUnit(unit: string): unit is WeightUnit {
  return (WEIGHT_UNITS as readonly string[]).includes(unit);
}

/**
 * Dice si `amount` en `fromUnit` puede convertirse a `toUnit`: siempre que
 * sean la misma unidad, o cuando ambas son unidades de peso (kilo, tonelada,
 * libra). Litro y unidad no se convierten a nada más.
 */
export function canConvert(fromUnit: string, toUnit: string): boolean {
  if (fromUnit === toUnit) {
    return true;
  }
  return isWeightUnit(fromUnit) && isWeightUnit(toUnit);
}

/**
 * Convierte una cantidad entre unidades de peso. Si las unidades son
 * iguales devuelve el mismo monto (sirve también para litro/unidad); si no
 * son ambas de peso, lanza — el caller debe validar con `canConvert` antes.
 */
export function convertWeight(amount: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) {
    return amount;
  }
  if (!isWeightUnit(fromUnit) || !isWeightUnit(toUnit)) {
    throw new Error(`No se puede convertir de ${fromUnit} a ${toUnit}.`);
  }
  const grams = amount * GRAMS_PER_UNIT[fromUnit];
  return grams / GRAMS_PER_UNIT[toUnit];
}

/**
 * Precio por `toUnit` a partir de un precio dado por `fromUnit` (ej. precio
 * por libra -> precio por kilo). Solo válido cuando `canConvert` es true.
 */
export function convertPrice(pricePerFromUnit: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) {
    return pricePerFromUnit;
  }
  const amountOfFromPerOneTo = convertWeight(1, toUnit, fromUnit);
  return pricePerFromUnit * amountOfFromPerOneTo;
}

/** Redondea a 2 decimales para mostrar cantidades convertidas en mensajes. */
export function formatAmount(value: number): string {
  return (Math.round(value * 100) / 100).toString();
}

export type { ProductUnit };
