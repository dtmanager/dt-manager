import { describe, expect, it } from 'vitest';
import {
  avanzarContratoDT, calcularSalarioDT, contratoDTInicial, ofertaRenovacionDT, renovarContratoDT,
} from '../contratoDT';
import type { Club, DT } from '../../types';

function dtBase(over: Partial<DT> = {}): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
    ...over,
  };
}

function clubBase(over: Partial<Club> = {}): Club {
  return {
    id: 'c', nombre: 'Test FC', liga: 'Liga', nc: 70, presupuesto: 10_000_000, cohesion: 55,
    plantel: [], formacion: '4-4-2', titularesIds: [], suplentesIds: [], dt: dtBase(),
    esControladoPorUsuario: false,
    ...over,
  };
}

describe('calcularSalarioDT', () => {
  it('es una fracción del presupuesto del club', () => {
    expect(calcularSalarioDT(10_000_000)).toBe(200_000);
  });

  it('nunca baja del mínimo aunque el presupuesto sea muy chico', () => {
    expect(calcularSalarioDT(100)).toBe(50_000);
  });
});

describe('contratoDTInicial', () => {
  it('arranca con una duración de entre 2 y 4 temporadas', () => {
    const contrato = contratoDTInicial(10_000_000);
    expect(contrato.temporadasRestantes).toBeGreaterThanOrEqual(2);
    expect(contrato.temporadasRestantes).toBeLessThanOrEqual(4);
  });

  it('el salario sale de calcularSalarioDT sobre el presupuesto pasado', () => {
    const contrato = contratoDTInicial(10_000_000);
    expect(contrato.salarioAnual).toBe(calcularSalarioDT(10_000_000));
  });
});

describe('avanzarContratoDT', () => {
  it('descuenta una temporada al contrato vigente', () => {
    const dt = dtBase({ contrato: { salarioAnual: 100_000, temporadasRestantes: 3 } });
    const resultado = avanzarContratoDT(dt);
    expect(resultado.contrato?.temporadasRestantes).toBe(2);
    expect(resultado.contrato?.salarioAnual).toBe(100_000);
  });

  it('no rompe si el DT todavía no tiene contrato (carreras viejas)', () => {
    const dt = dtBase();
    expect(avanzarContratoDT(dt)).toBe(dt);
  });

  it('puede llegar a 0 (se resuelve afuera, en useGameStore.ts)', () => {
    const dt = dtBase({ contrato: { salarioAnual: 100_000, temporadasRestantes: 1 } });
    expect(avanzarContratoDT(dt).contrato?.temporadasRestantes).toBe(0);
  });
});

describe('ofertaRenovacionDT', () => {
  it('un DT con más reputación recibe una oferta más alta, mismo presupuesto', () => {
    const clubReputacionBaja = clubBase({ dt: dtBase({ reputacion: 20 }) });
    const clubReputacionAlta = clubBase({ dt: dtBase({ reputacion: 90 }) });
    const ofertaBaja = ofertaRenovacionDT(clubReputacionBaja, 5);
    const ofertaAlta = ofertaRenovacionDT(clubReputacionAlta, 5);
    expect(ofertaAlta.salarioOfrecido).toBeGreaterThan(ofertaBaja.salarioOfrecido);
  });

  it('nunca ofrece menos del salario mínimo', () => {
    const club = clubBase({ presupuesto: 100, dt: dtBase({ reputacion: 0 }) });
    const oferta = ofertaRenovacionDT(club, 3);
    expect(oferta.salarioOfrecido).toBeGreaterThanOrEqual(50_000);
  });

  it('conserva la temporada pasada', () => {
    const club = clubBase();
    expect(ofertaRenovacionDT(club, 7).temporada).toBe(7);
  });

  it('ofrece una duración de entre 2 y 4 temporadas', () => {
    const club = clubBase();
    const oferta = ofertaRenovacionDT(club, 1);
    expect(oferta.duracionOfrecida).toBeGreaterThanOrEqual(2);
    expect(oferta.duracionOfrecida).toBeLessThanOrEqual(4);
  });
});

describe('renovarContratoDT', () => {
  it('reemplaza el contrato con los términos de la renovación', () => {
    const dt = dtBase({ contrato: { salarioAnual: 100_000, temporadasRestantes: 0 } });
    const resultado = renovarContratoDT(dt, { salarioOfrecido: 250_000, duracionOfrecida: 3, temporada: 4 });
    expect(resultado.contrato).toEqual({ salarioAnual: 250_000, temporadasRestantes: 3 });
  });
});
