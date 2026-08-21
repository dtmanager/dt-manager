import { describe, expect, it } from 'vitest';
import {
  calcularMovimientoSemanal, sueldosDeLaSemana, taquillaDeLaSemana,
} from '../economiaSemanal';
import { calcularSueldosTemporada, calcularTaquilla } from '../economia';
import type { Club, DT, Jugador } from '../../types';

function dtBase(): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
  };
}

function jugador(id: string, salario: number): Jugador {
  return {
    id, nombre: `J${id}`, edad: 25, posicion: 'DEL', grl: 70, pot: 70, valorMercado: 100000,
    clubId: 'c', esJoya: false, historialGrl: [], contratoAniosRestantes: 2, salario,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
  };
}

function clubBase(over: Partial<Club> = {}): Club {
  return {
    id: 'c', nombre: 'Test FC', liga: 'Liga', nc: 70, presupuesto: 1_000_000, cohesion: 55,
    plantel: [jugador('1', 100_000), jugador('2', 200_000)], formacion: '4-4-2', titularesIds: [], suplentesIds: [],
    dt: dtBase(), esControladoPorUsuario: false,
    ...over,
  };
}

describe('sueldosDeLaSemana', () => {
  it('reparte el total de sueldos entre la cantidad de fechas', () => {
    const club = clubBase();
    const total = calcularSueldosTemporada(club);
    expect(sueldosDeLaSemana(club, 10)).toBe(Math.round(total / 10));
  });

  it('devuelve 0 si no hay fechas (evita dividir por cero)', () => {
    expect(sueldosDeLaSemana(clubBase(), 0)).toBe(0);
  });

  it('sube si el plantel actual es más caro (se recalcula sobre el plantel real, no un valor fijo)', () => {
    const clubBarato = clubBase({ plantel: [jugador('1', 100_000)] });
    const clubCaro = clubBase({ plantel: [jugador('1', 100_000), jugador('2', 900_000)] });
    expect(sueldosDeLaSemana(clubCaro, 10)).toBeGreaterThan(sueldosDeLaSemana(clubBarato, 10));
  });
});

describe('taquillaDeLaSemana', () => {
  it('es 0 fechas de local disponibles con totalFechasLiga en 0', () => {
    expect(taquillaDeLaSemana(clubBase(), 0)).toBe(0);
  });

  it('es positiva con fechas de liga reales', () => {
    expect(taquillaDeLaSemana(clubBase(), 20)).toBeGreaterThan(0);
  });
});

describe('calcularMovimientoSemanal', () => {
  it('sólo cobra taquilla cuando juega de local esa fecha', () => {
    const club = clubBase();
    const comoLocal = calcularMovimientoSemanal(club, 5, true, 20);
    const comoVisitante = calcularMovimientoSemanal(club, 5, false, 20);
    expect(comoLocal.ingresos).toBeGreaterThan(0);
    expect(comoVisitante.ingresos).toBe(0);
  });

  it('paga sueldos todas las semanas, juegue o no de local', () => {
    const club = clubBase();
    const comoLocal = calcularMovimientoSemanal(club, 5, true, 20);
    const comoVisitante = calcularMovimientoSemanal(club, 5, false, 20);
    expect(comoLocal.gastos).toBeGreaterThan(0);
    expect(comoVisitante.gastos).toBe(comoLocal.gastos);
  });

  it('el presupuesto resultante refleja ingresos - gastos sobre el presupuesto anterior', () => {
    const club = clubBase({ presupuesto: 500_000 });
    const mov = calcularMovimientoSemanal(club, 1, true, 20);
    expect(mov.presupuesto).toBe(500_000 + mov.ingresos - mov.gastos);
  });

  it('el ingreso total repartido en las fechas de local se acerca al total de calcularTaquilla', () => {
    const club = clubBase();
    const totalFechas = 20;
    const partidosDeLocal = totalFechas / 2;
    let ingresosAcumulados = 0;
    for (let i = 0; i < partidosDeLocal; i += 1) {
      ingresosAcumulados += calcularMovimientoSemanal(club, i, true, totalFechas).ingresos;
    }
    // No es un valor exacto (calcularTaquilla tiene su propio random
    // interno) — sólo confirmamos que está en el orden de magnitud
    // correcto, no que sea otro número inventado sin relación.
    const referencia = calcularTaquilla(club.nc, club.liga);
    expect(ingresosAcumulados).toBeGreaterThan(referencia * 0.5);
    expect(ingresosAcumulados).toBeLessThan(referencia * 2);
  });
});
