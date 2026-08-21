import { describe, expect, it } from 'vitest';
import { tablaEstadistica } from '../tablaEstadistica';

describe('tablaEstadistica', () => {
  it('devuelve una fila por club, ordenada de mejor a peor puntaje estimado', () => {
    const clubes = [
      { id: 'a', nombre: 'A', nc: 90, archivo: 'a.svg' },
      { id: 'b', nombre: 'B', nc: 50, archivo: 'b.svg' },
      { id: 'c', nombre: 'C', nc: 70, archivo: 'c.svg' },
    ];
    const tabla = tablaEstadistica(clubes);
    expect(tabla).toHaveLength(3);
    for (let i = 1; i < tabla.length; i += 1) {
      expect(tabla[i - 1].puntosEstimados).toBeGreaterThanOrEqual(tabla[i].puntosEstimados);
    }
  });

  it('en promedio, un club de nc más alto termina mejor rankeado (no siempre, pero sí en la mayoría de las corridas)', () => {
    const clubes = [
      { id: 'fuerte', nombre: 'Fuerte', nc: 95, archivo: 'a.svg' },
      { id: 'debil', nombre: 'Débil', nc: 40, archivo: 'b.svg' },
    ];
    let vecesFuerteArriba = 0;
    for (let i = 0; i < 50; i += 1) {
      const tabla = tablaEstadistica(clubes);
      if (tabla[0].clubId === 'fuerte') vecesFuerteArriba += 1;
    }
    expect(vecesFuerteArriba).toBeGreaterThan(40);
  });
});
