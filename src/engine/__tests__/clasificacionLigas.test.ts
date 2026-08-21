import { describe, expect, it } from 'vitest';
import { clasificacionDeTodasLasLigas, clubesEnRango } from '../clasificacionLigas';
import { LIGAS } from '../../data/ligas';

describe('clasificacionDeTodasLasLigas', () => {
  it('devuelve una entrada por cada liga disponible, con tabla completa', () => {
    const clasificacion = clasificacionDeTodasLasLigas();
    const ligasDisponibles = LIGAS.filter((l) => l.disponible);

    expect(clasificacion).toHaveLength(ligasDisponibles.length);
    clasificacion.forEach((c) => {
      const liga = ligasDisponibles.find((l) => l.id === c.ligaId)!;
      expect(c.tabla).toHaveLength(liga.clubes.length);
    });
  });

  it('usa la tabla real pasada para la liga activa en vez de estimarla', () => {
    const tablaReal = [{ clubId: 'fake-champion', nombre: 'Fake', puntosEstimados: 999 }];
    const clasificacion = clasificacionDeTodasLasLigas('Premier League', tablaReal);
    const premier = clasificacion.find((c) => c.nombreLiga === 'Premier League')!;
    expect(premier.tabla).toBe(tablaReal);
  });
});

describe('clubesEnRango', () => {
  it('devuelve los clubIds del rango pedido, 0-indexado e inclusive', () => {
    const clasificacion = [
      {
        ligaId: 'x',
        nombreLiga: 'X',
        tabla: [
          { clubId: 'a', nombre: 'A', puntosEstimados: 90 },
          { clubId: 'b', nombre: 'B', puntosEstimados: 80 },
          { clubId: 'c', nombre: 'C', puntosEstimados: 70 },
          { clubId: 'd', nombre: 'D', puntosEstimados: 60 },
        ],
      },
    ];
    expect(clubesEnRango(clasificacion, 'X', 0, 1)).toEqual(['a', 'b']);
    expect(clubesEnRango(clasificacion, 'X', 2, 3)).toEqual(['c', 'd']);
  });

  it('devuelve [] si la liga no está en la clasificación', () => {
    expect(clubesEnRango([], 'No existe', 0, 3)).toEqual([]);
  });
});
