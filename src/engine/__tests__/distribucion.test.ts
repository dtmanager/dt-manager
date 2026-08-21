import { describe, expect, it } from 'vitest';
import { generarGrlInicial } from '../jugadores';

describe('distribución de generarGrlInicial (diagnóstico)', () => {
  it('el promedio de muchas muestras queda cerca del nc del club', () => {
    const nc = 68;
    const muestras = Array.from({ length: 5000 }, () => generarGrlInicial(nc));
    const promedio = muestras.reduce((a, b) => a + b, 0) / muestras.length;
    const max = Math.max(...muestras);
    // eslint-disable-next-line no-console
    console.log('nc=68 → promedio:', promedio.toFixed(2), 'max:', max);
    expect(promedio).toBeGreaterThan(nc - 3);
    expect(promedio).toBeLessThan(nc + 3);
  });
});
