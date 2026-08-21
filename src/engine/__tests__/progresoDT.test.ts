import { describe, expect, it, vi } from 'vitest';
import { evolucionarDT, evolucionarReputacionDT } from '../progresoDT';
import type { DT } from '../../types';

function dtBase(over: Partial<DT> = {}): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
    ...over,
  };
}

describe('evolucionarDT', () => {
  it('no cambia nada si no hubo actividad en ninguno de los dos frentes', () => {
    const dt = dtBase();
    const resultado = evolucionarDT(dt, { fichajesRealizados: 0, canteranosAceptados: 0 });
    expect(resultado).toEqual(dt);
  });

  it('sube mercado cuando predominaron los fichajes', () => {
    const dt = dtBase();
    const resultado = evolucionarDT(dt, { fichajesRealizados: 3, canteranosAceptados: 1 });
    expect(resultado.mercado).toBeGreaterThan(dt.mercado);
    expect(resultado.desarrollo).toBe(dt.desarrollo);
  });

  it('sube desarrollo cuando predominó aceptar canteranos', () => {
    const dt = dtBase();
    const resultado = evolucionarDT(dt, { fichajesRealizados: 0, canteranosAceptados: 2 });
    expect(resultado.desarrollo).toBeGreaterThan(dt.desarrollo);
    expect(resultado.mercado).toBe(dt.mercado);
  });

  it('sube los dos si empatan con actividad real', () => {
    const dt = dtBase();
    const resultado = evolucionarDT(dt, { fichajesRealizados: 2, canteranosAceptados: 2 });
    expect(resultado.mercado).toBeGreaterThan(dt.mercado);
    expect(resultado.desarrollo).toBeGreaterThan(dt.desarrollo);
  });

  it('la suba es de 1 o 2 puntos', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(evolucionarDT(dtBase(), { fichajesRealizados: 1, canteranosAceptados: 0 }).mercado).toBe(51);
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(evolucionarDT(dtBase(), { fichajesRealizados: 1, canteranosAceptados: 0 }).mercado).toBe(52);
    vi.restoreAllMocks();
  });

  it('no supera el tope de 99', () => {
    const dt = dtBase({ mercado: 99 });
    const resultado = evolucionarDT(dt, { fichajesRealizados: 5, canteranosAceptados: 0 });
    expect(resultado.mercado).toBe(99);
  });
});

describe('evolucionarReputacionDT', () => {
  it('sube al salir campeón de la liga', () => {
    const dt = dtBase({ reputacion: 50 });
    const resultado = evolucionarReputacionDT(dt, true, true);
    expect(resultado.reputacion).toBeGreaterThan(dt.reputacion);
  });

  it('sube un poco al cumplir el objetivo sin ser campeón', () => {
    const dt = dtBase({ reputacion: 50 });
    const resultado = evolucionarReputacionDT(dt, false, true);
    expect(resultado.reputacion).toBe(51);
  });

  it('baja al no cumplir el objetivo', () => {
    const dt = dtBase({ reputacion: 50 });
    const resultado = evolucionarReputacionDT(dt, false, false);
    expect(resultado.reputacion).toBeLessThan(dt.reputacion);
  });

  it('nunca sale del rango 0-99', () => {
    expect(evolucionarReputacionDT(dtBase({ reputacion: 98 }), true, true).reputacion).toBeLessThanOrEqual(99);
    expect(evolucionarReputacionDT(dtBase({ reputacion: 0 }), false, false).reputacion).toBeGreaterThanOrEqual(0);
  });
});
