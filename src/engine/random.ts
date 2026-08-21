export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function randomUniforme(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomEntero(min: number, max: number): number {
  return Math.floor(randomUniforme(min, max + 1));
}

// Box-Muller, para variables normales (grlInicial, evolución de GRL).
export function randomNormal(media: number, desvio: number): number {
  const u1 = Math.random() || Number.EPSILON;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return media + z * desvio;
}

// Distribución triangular (edad de planteles iniciales, moda en 24).
export function randomTriangular(min: number, moda: number, max: number): number {
  const u = Math.random();
  const fModa = (moda - min) / (max - min);
  if (u < fModa) {
    return min + Math.sqrt(u * (max - min) * (moda - min));
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - moda));
}

// Elige `cantidad` elementos distintos al azar de una lista (sin
// repetir). Compartido entre copaInternacional.ts (rivales de otras
// ligas) y mercado.ts (clubes extranjeros del mercado internacional).
export function elegirVariosAlAzar<T>(lista: T[], cantidad: number): T[] {
  const copia = [...lista];
  const elegidos: T[] = [];
  for (let i = 0; i < cantidad && copia.length > 0; i += 1) {
    const idx = Math.floor(Math.random() * copia.length);
    elegidos.push(copia.splice(idx, 1)[0]);
  }
  return elegidos;
}

export function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}
