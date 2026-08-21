import { describe, expect, it } from 'vitest';
import type { Jugador, Posicion } from '../../types';
import {
  asignarDorsalesPlantel, asignarDorsalLibre, calcularValorMercado, debeRetirarse, MAX_VALOR_MERCADO, valorBase,
} from '../jugadores';

describe('valorBase', () => {
  // Recalibrado contra valores reales de mercado (ver el comentario en
  // jugadores.ts — anclas de Transfermarkt: grl70≈$9M, grl82≈$65M). Ya no
  // es la tabla de la spec original (esa curva se quedaba 8-16x corta
  // contra el mercado real). Como valorBase no tiene azar, el valor es
  // reproducible exacto — estos números salen de correr la fórmula actual.
  const referencia: [number, number][] = [
    [50, 332_248],
    [60, 1_724_829],
    [70, 8_954_246],
    [82, 64_620_248],
    [90, 241_320_953],
    [99, 1_062_550_899],
  ];

  it.each(referencia)('valorBase(%d) ≈ %d', (grl, esperado) => {
    expect(valorBase(grl)).toBeCloseTo(esperado, -2);
  });
});

describe('calcularValorMercado', () => {
  it('un DEL joven con techo alto vale más que un ARQ mayor con el mismo GRL', () => {
    const delantero = calcularValorMercado({ grl: 75, edad: 20, pot: 90, posicion: 'DEL' });
    const arquero = calcularValorMercado({ grl: 75, edad: 34, pot: 76, posicion: 'ARQ' });
    expect(delantero).toBeGreaterThan(arquero);
  });

  it('nunca da valores negativos ni NaN', () => {
    const valor = calcularValorMercado({ grl: 40, edad: 39, pot: 40, posicion: 'ARQ' });
    expect(valor).toBeGreaterThan(0);
    expect(Number.isNaN(valor)).toBe(false);
  });

  it('nunca supera el techo MAX_VALOR_MERCADO ni para el mejor caso posible', () => {
    const valor = calcularValorMercado({ grl: 99, edad: 18, pot: 99, posicion: 'DEL' });
    expect(valor).toBeLessThanOrEqual(MAX_VALOR_MERCADO);
  });
});

let contadorFixture = 0;
function jugadorFixture(dorsal?: number, posicion: Posicion = 'MC'): Jugador {
  contadorFixture += 1;
  return {
    id: `j-${contadorFixture}`,
    nombre: 'Test Jugador',
    edad: 25,
    posicion,
    grl: 70,
    pot: 75,
    valorMercado: 1_000_000,
    clubId: 'club-test',
    esJoya: false,
    historialGrl: [],
    contratoAniosRestantes: 2,
    salario: 100_000,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
    dorsal,
  };
}

// Sistema de dorsales (pedido explícito): 1-99, único DENTRO de un mismo
// plantel — ver el comentario grande en types/index.ts sobre por qué no es
// una propiedad fija del jugador.
describe('asignarDorsalLibre', () => {
  it('devuelve un número entre 1 y 99', () => {
    const dorsal = asignarDorsalLibre([]);
    expect(dorsal).toBeGreaterThanOrEqual(1);
    expect(dorsal).toBeLessThanOrEqual(99);
  });

  it('nunca repite un dorsal ya usado en el plantel', () => {
    const plantel = Array.from({ length: 30 }, (_, i) => jugadorFixture(i + 1));
    const dorsal = asignarDorsalLibre(plantel);
    expect(plantel.some((j) => j.dorsal === dorsal)).toBe(false);
  });

  it('ignora a los jugadores del plantel sin dorsal asignado todavía', () => {
    const plantel = [jugadorFixture(undefined), jugadorFixture(undefined)];
    const dorsal = asignarDorsalLibre(plantel);
    expect(dorsal).toBeGreaterThanOrEqual(1);
    expect(dorsal).toBeLessThanOrEqual(99);
  });

  it('asignar dorsales uno a uno a un plantel entero da 25 números únicos', () => {
    let plantel: Jugador[] = [];
    for (let i = 0; i < 25; i += 1) {
      const dorsal = asignarDorsalLibre(plantel);
      plantel = [...plantel, jugadorFixture(dorsal)];
    }
    const dorsales = plantel.map((j) => j.dorsal);
    expect(new Set(dorsales).size).toBe(25);
  });

  it('con posición, prefiere el número clásico de esa posición si está libre', () => {
    expect(asignarDorsalLibre([], 'ARQ')).toBe(1);
    expect(asignarDorsalLibre([], 'DEL')).toBe(9);
  });

  it('con posición, si el número clásico está tomado cae a la zona de suplentes (12+)', () => {
    const plantel = [jugadorFixture(1, 'ARQ')];
    const dorsal = asignarDorsalLibre(plantel, 'ARQ');
    expect(dorsal).toBeGreaterThanOrEqual(12);
  });
});

// Sistema de dorsales v2 (pedido explícito: "realista... del 1 al 11
// dependiendo las posiciones y despues del 12 al 26 los suplentes").
describe('asignarDorsalesPlantel', () => {
  it('con el 11 titular de una 4-4-2 estándar, reparte 1-11 sin choques', () => {
    const titulares = [
      jugadorFixture(undefined, 'ARQ'),
      jugadorFixture(undefined, 'LI'),
      jugadorFixture(undefined, 'DFC'),
      jugadorFixture(undefined, 'DFC'),
      jugadorFixture(undefined, 'LD'),
      jugadorFixture(undefined, 'MC'),
      jugadorFixture(undefined, 'MC'),
      jugadorFixture(undefined, 'EI'),
      jugadorFixture(undefined, 'ED'),
      jugadorFixture(undefined, 'DEL'),
      jugadorFixture(undefined, 'DEL'),
    ];
    const suplentes = Array.from({ length: 15 }, () => jugadorFixture(undefined, 'MC'));
    const plantel = [...titulares, ...suplentes];

    asignarDorsalesPlantel(plantel, titulares.map((j) => j.id));

    const dorsalesTitulares = titulares.map((j) => j.dorsal).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(dorsalesTitulares).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('los suplentes quedan en la zona 12+, sin pisar a los titulares', () => {
    const titulares = [jugadorFixture(undefined, 'ARQ'), jugadorFixture(undefined, 'DEL')];
    const suplentes = Array.from({ length: 5 }, () => jugadorFixture(undefined, 'MC'));
    const plantel = [...titulares, ...suplentes];

    asignarDorsalesPlantel(plantel, titulares.map((j) => j.id));

    suplentes.forEach((j) => expect(j.dorsal).toBeGreaterThanOrEqual(12));
    const todos = plantel.map((j) => j.dorsal);
    expect(new Set(todos).size).toBe(plantel.length);
  });

  it('nunca deja a nadie sin dorsal', () => {
    const plantel = Array.from({ length: 26 }, (_, i) => jugadorFixture(undefined, i < 11 ? 'MC' : 'DEL'));
    const titularesIds = plantel.slice(0, 11).map((j) => j.id);

    asignarDorsalesPlantel(plantel, titularesIds);

    expect(plantel.every((j) => j.dorsal != null)).toBe(true);
  });
});

describe('debeRetirarse', () => {
  it('se retira siempre a los 40 sin importar el GRL', () => {
    expect(debeRetirarse(40, 90)).toBe(true);
  });

  it('se retira a los 36+ si el GRL bajó de 65', () => {
    expect(debeRetirarse(36, 64)).toBe(true);
    expect(debeRetirarse(36, 65)).toBe(false);
  });

  it('no se retira antes de los 36 aunque el GRL sea bajo', () => {
    expect(debeRetirarse(30, 40)).toBe(false);
  });
});
