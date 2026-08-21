import { describe, expect, it } from 'vitest';
import {
  calcularPremio, calcularSueldosTemporada, calcularTaquilla, estaEnZonaDescenso,
} from '../economia';
import type { Club, DT, Jugador } from '../../types';

function jugadorBase(salario: number): Jugador {
  return {
    id: 'j', nombre: 'Test', edad: 25, posicion: 'DEL', grl: 70, pot: 70, valorMercado: 100000,
    clubId: 'c', esJoya: false, historialGrl: [], contratoAniosRestantes: 2, salario,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
  };
}

function dtBase(): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
  };
}

function clubBase(plantel: Jugador[]): Club {
  return {
    id: 'c', nombre: 'Test FC', liga: 'Liga', nc: 70, presupuesto: 100000, cohesion: 55,
    plantel, formacion: '4-4-2', titularesIds: [], suplentesIds: [], dt: dtBase(), esControladoPorUsuario: false,
  };
}

describe('estaEnZonaDescenso', () => {
  it('los últimos 3 de una tabla de 28 descienden', () => {
    expect(estaEnZonaDescenso(27, 28)).toBe(true);
    expect(estaEnZonaDescenso(26, 28)).toBe(true);
    expect(estaEnZonaDescenso(25, 28)).toBe(true);
    expect(estaEnZonaDescenso(24, 28)).toBe(false);
    expect(estaEnZonaDescenso(0, 28)).toBe(false);
  });
});

describe('calcularPremio', () => {
  it('el campeón cobra más que el último', () => {
    const premioCampeon = calcularPremio(0, 20, 75);
    const premioUltimo = calcularPremio(19, 20, 75);
    expect(premioCampeon).toBeGreaterThan(premioUltimo);
  });

  it('escala con el nc del club', () => {
    const premioNcAlto = calcularPremio(0, 20, 90);
    const premioNcBajo = calcularPremio(0, 20, 50);
    expect(premioNcAlto).toBeGreaterThan(premioNcBajo);
  });
});

describe('calcularTaquilla', () => {
  it('siempre es positiva y escala con nc', () => {
    expect(calcularTaquilla(70)).toBeGreaterThan(0);
    expect(calcularTaquilla(90)).toBeGreaterThan(calcularTaquilla(50) * 1.2);
  });
});

describe('calcularSueldosTemporada', () => {
  it('suma el salario de todo el plantel', () => {
    const club = clubBase([jugadorBase(1000), jugadorBase(2000), jugadorBase(500)]);
    expect(calcularSueldosTemporada(club)).toBe(3500);
  });
});
