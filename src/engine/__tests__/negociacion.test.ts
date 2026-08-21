import { describe, expect, it, vi } from 'vitest';
import {
  evaluarOferta, franjaEstimada, hayOfertaRival, PENALIZACION_PRESION_RIVAL,
} from '../negociacion';
import type { Jugador } from '../../types';

function jugadorBase(over: Partial<Jugador>): Jugador {
  return {
    id: 'j', nombre: 'Test', edad: 25, posicion: 'DEL', grl: 70, pot: 70, valorMercado: 1000,
    clubId: null, esJoya: false, historialGrl: [], contratoAniosRestantes: 0, salario: 0,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
    ...over,
  };
}

describe('evaluarOferta', () => {
  it('acepta cuando el roll de random cae debajo de la probabilidad', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    expect(evaluarOferta(1000, 0.5).resultado).toBe('aceptada');
    vi.restoreAllMocks();
  });

  it('rechaza de lleno (sin contraoferta) cuando la probabilidad es muy baja', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const r = evaluarOferta(1000, 0.05);
    expect(r.resultado).toBe('rechazada_lejos');
    expect(r.contraofertaSugerida).toBeUndefined();
    vi.restoreAllMocks();
  });

  it('rechaza "cerca" con una contraoferta sugerida por encima del monto cuando la probabilidad no es tan baja', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const r = evaluarOferta(1000, 0.4);
    expect(r.resultado).toBe('rechazada_cerca');
    expect(r.contraofertaSugerida).toBeGreaterThan(1000);
    vi.restoreAllMocks();
  });
});

describe('hayOfertaRival', () => {
  it('nunca hay rival para un jugador de grl bajo', () => {
    const jugador = jugadorBase({ grl: 60 });
    for (let i = 0; i < 20; i += 1) {
      expect(hayOfertaRival(jugador)).toBe(false);
    }
  });

  it('puede haber rival para un jugador de grl muy alto', () => {
    const jugador = jugadorBase({ grl: 95 });
    const resultados = Array.from({ length: 200 }, () => hayOfertaRival(jugador));
    expect(resultados.some(Boolean)).toBe(true);
    expect(resultados.every(Boolean)).toBe(false);
  });
});

describe('franjaEstimada', () => {
  it('la franja queda por debajo/por encima del valor de referencia', () => {
    const { min, max } = franjaEstimada(1_000_000);
    expect(min).toBeLessThan(1_000_000);
    expect(max).toBeGreaterThan(1_000_000);
    expect(min).toBeLessThan(max);
  });
});

describe('PENALIZACION_PRESION_RIVAL', () => {
  it('es un valor chico entre 0 y 1 (resta a la probabilidad, no la anula)', () => {
    expect(PENALIZACION_PRESION_RIVAL).toBeGreaterThan(0);
    expect(PENALIZACION_PRESION_RIVAL).toBeLessThan(0.3);
  });
});
