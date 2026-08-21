import { describe, expect, it } from 'vitest';
import { buscarRefuerzos, CANDIDATOS_SCOUTING } from '../scouting';
import type { Club, DT, Jugador } from '../../types';

function dtBase(): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
  };
}

function jugador(over: Partial<Jugador>): Jugador {
  return {
    id: 'j', nombre: 'Test', edad: 25, posicion: 'DEL', grl: 70, pot: 70, valorMercado: 1_000_000,
    clubId: null, esJoya: false, historialGrl: [], contratoAniosRestantes: 2, salario: 1000,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
    ...over,
  };
}

function club(id: string, plantel: Jugador[]): Club {
  return {
    id, nombre: `Club ${id}`, liga: 'Liga', nc: 70, presupuesto: 100000, cohesion: 55,
    plantel, formacion: '4-4-2', titularesIds: [], suplentesIds: [], dt: dtBase(),
    esControladoPorUsuario: false,
  };
}

describe('buscarRefuerzos', () => {
  it('excluye al club del usuario', () => {
    const clubes = {
      usuario: club('usuario', [jugador({ id: 'u1', posicion: 'DEL', edad: 22, valorMercado: 100 })]),
      rival: club('rival', [jugador({ id: 'r1', posicion: 'DEL', edad: 22, valorMercado: 100 })]),
    };
    const resultado = buscarRefuerzos(clubes, 'usuario', { posicion: 'DEL', edadMax: 30, presupuestoMax: 1_000_000 });
    expect(resultado.map((c) => c.jugador.id)).toEqual(['r1']);
  });

  it('filtra por posición', () => {
    const clubes = {
      rival: club('rival', [
        jugador({ id: 'del', posicion: 'DEL' }),
        jugador({ id: 'arq', posicion: 'ARQ' }),
      ]),
    };
    const resultado = buscarRefuerzos(clubes, 'usuario', { posicion: 'ARQ', edadMax: 40, presupuestoMax: 10_000_000 });
    expect(resultado.map((c) => c.jugador.id)).toEqual(['arq']);
  });

  it('filtra por edad máxima', () => {
    const clubes = {
      rival: club('rival', [
        jugador({ id: 'joven', edad: 20 }),
        jugador({ id: 'veterano', edad: 34 }),
      ]),
    };
    const resultado = buscarRefuerzos(clubes, 'usuario', { posicion: 'TODOS', edadMax: 25, presupuestoMax: 10_000_000 });
    expect(resultado.map((c) => c.jugador.id)).toEqual(['joven']);
  });

  it('filtra por presupuesto máximo', () => {
    const clubes = {
      rival: club('rival', [
        jugador({ id: 'barato', valorMercado: 500_000 }),
        jugador({ id: 'caro', valorMercado: 50_000_000 }),
      ]),
    };
    const resultado = buscarRefuerzos(clubes, 'usuario', { posicion: 'TODOS', edadMax: 40, presupuestoMax: 1_000_000 });
    expect(resultado.map((c) => c.jugador.id)).toEqual(['barato']);
  });

  it('no exige que el jugador esté transferible — la idea es encontrar lo que no está listado', () => {
    const clubes = {
      rival: club('rival', [jugador({ id: 'noListado', transferible: false })]),
    };
    const resultado = buscarRefuerzos(clubes, 'usuario', { posicion: 'TODOS', edadMax: 40, presupuestoMax: 10_000_000 });
    expect(resultado.map((c) => c.jugador.id)).toEqual(['noListado']);
  });

  it('devuelve como mucho CANDIDATOS_SCOUTING, ordenados por mejor grl', () => {
    const plantel = Array.from({ length: 10 }, (_, i) => jugador({ id: `j${i}`, grl: 50 + i }));
    const clubes = { rival: club('rival', plantel) };
    const resultado = buscarRefuerzos(clubes, 'usuario', { posicion: 'TODOS', edadMax: 40, presupuestoMax: 10_000_000 });
    expect(resultado).toHaveLength(CANDIDATOS_SCOUTING);
    expect(resultado.map((c) => c.jugador.grl)).toEqual([59, 58, 57]);
  });
});
