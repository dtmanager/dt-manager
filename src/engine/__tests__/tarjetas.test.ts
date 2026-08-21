import { describe, expect, it } from 'vitest';
import { aplicarTarjetasPostFecha } from '../tarjetas';
import { estaDisponible } from '../desgaste';
import type { Club, DT, Jugador, Partido, TarjetaPartido } from '../../types';

function dtBase(): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
  };
}

function jugador(id: string, extra: Partial<Jugador> = {}): Jugador {
  return {
    id, nombre: `J${id}`, edad: 25, posicion: 'DEL', grl: 70, pot: 70, valorMercado: 100000,
    clubId: 'club-a', esJoya: false, historialGrl: [], contratoAniosRestantes: 2, salario: 1000,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
    ...extra,
  };
}

function clubConJugador(j: Jugador): Club {
  return {
    id: 'club-a', nombre: 'Club A', liga: 'Liga', nc: 70, presupuesto: 100000, cohesion: 55,
    plantel: [j], formacion: '4-4-2', titularesIds: [j.id], suplentesIds: [], dt: dtBase(),
    esControladoPorUsuario: false,
  };
}

function partidoConTarjetas(tarjetas: TarjetaPartido[]): Partido {
  return {
    id: 'p1', fecha: 1, localId: 'club-a', visitanteId: 'club-b', golesLocal: 0, golesVisitante: 0,
    partidoImportante: false, tarjetas,
  };
}

describe('aplicarTarjetasPostFecha', () => {
  it('una roja suma a estadisticasTemporada y carga 1 fecha de suspensión', () => {
    const j = jugador('x');
    const clubes = { 'club-a': clubConJugador(j) };
    const partido = partidoConTarjetas([{ equipo: 'local', jugadorId: 'x', tipo: 'roja', minuto: 60 }]);

    const { clubes: resultado, tarjetas } = aplicarTarjetasPostFecha(clubes, [partido]);

    const actualizado = resultado['club-a'].plantel[0];
    expect(actualizado.estadisticasTemporada.tarjetasRojas).toBe(1);
    expect(actualizado.partidosSuspensionRestantes).toBe(1);
    expect(tarjetas).toHaveLength(1);
    expect(tarjetas[0].generaSuspension).toBe(true);
    expect(estaDisponible(actualizado)).toBe(false);
  });

  it('4 amarillas no suspenden; la 5ta sí', () => {
    let clubes: Record<string, Club> = { 'club-a': clubConJugador(jugador('x')) };

    // 4 fechas con 1 amarilla cada una — nunca debería suspender.
    for (let i = 0; i < 4; i += 1) {
      const partido = partidoConTarjetas([{ equipo: 'local', jugadorId: 'x', tipo: 'amarilla', minuto: 30 }]);
      const { clubes: nuevo } = aplicarTarjetasPostFecha(clubes, [partido]);
      clubes = nuevo;
      expect(clubes['club-a'].plantel[0].partidosSuspensionRestantes ?? 0).toBe(0);
    }
    expect(clubes['club-a'].plantel[0].estadisticasTemporada.tarjetasAmarillas).toBe(4);

    // La 5ta sí suspende.
    const quinta = partidoConTarjetas([{ equipo: 'local', jugadorId: 'x', tipo: 'amarilla', minuto: 30 }]);
    const { clubes: final, tarjetas } = aplicarTarjetasPostFecha(clubes, [quinta]);
    expect(final['club-a'].plantel[0].estadisticasTemporada.tarjetasAmarillas).toBe(5);
    expect(final['club-a'].plantel[0].partidosSuspensionRestantes).toBe(1);
    expect(tarjetas[0].generaSuspension).toBe(true);
  });

  it('decrementa una suspensión existente en vez de cargar una nueva', () => {
    const j = jugador('x', { partidosSuspensionRestantes: 2 });
    const clubes = { 'club-a': clubConJugador(j) };
    // Partido sin tarjetas para este jugador — sólo debe descontar la baja.
    const partido: Partido = {
      id: 'p2', fecha: 2, localId: 'club-a', visitanteId: 'club-b', golesLocal: 1, golesVisitante: 0, partidoImportante: false,
    };

    const { clubes: resultado } = aplicarTarjetasPostFecha(clubes, [partido]);
    expect(resultado['club-a'].plantel[0].partidosSuspensionRestantes).toBe(1);
  });

  it('clubes que no jugaron esta fecha quedan intactos', () => {
    const j = jugador('x');
    const clubes = { 'club-a': clubConJugador(j) };
    const partidoDeOtrosClubes: Partido = {
      id: 'p3', fecha: 1, localId: 'club-b', visitanteId: 'club-c', golesLocal: 1, golesVisitante: 1, partidoImportante: false,
    };

    const { clubes: resultado } = aplicarTarjetasPostFecha(clubes, [partidoDeOtrosClubes]);
    expect(resultado['club-a']).toBe(clubes['club-a']); // misma referencia, sin tocar
  });
});

describe('estaDisponible (con suspensión)', () => {
  it('un jugador suspendido no está disponible aunque no esté lesionado', () => {
    expect(estaDisponible(jugador('x', { partidosSuspensionRestantes: 1 }))).toBe(false);
    expect(estaDisponible(jugador('x', { partidosSuspensionRestantes: 0 }))).toBe(true);
    expect(estaDisponible(jugador('x'))).toBe(true);
  });
});
