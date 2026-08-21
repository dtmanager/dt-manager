import { describe, expect, it } from 'vitest';
import {
  generarTorneoConmebol, simularProximaEtapaConmebol, simularProximaFechaGruposConmebol, type TorneoConmebol,
} from '../libertadoresYSudamericana';
import type { Club, DT, Jugador } from '../../types';

function dtBase(): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
  };
}

function jugador(id: string, posicion: Jugador['posicion'], grl: number): Jugador {
  return {
    id, nombre: `J${id}`, edad: 25, posicion, grl, pot: grl, valorMercado: 100000,
    clubId: null, esJoya: false, historialGrl: [], contratoAniosRestantes: 2, salario: 1000,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
  };
}

// Plantel completo (no sólo 1 jugador) y fuerte en las 4 posiciones —
// con un solo DEL y nada más, calcularFuerzaSector le daba defensa 0
// (promedio de un array vacío de ARQ/DEF) y perdía casi todo, lo que
// hacía flaky el test que necesita que sobreviva hasta el playoff.
function clubUsuario(): Club {
  const titulares = [
    jugador('u-arq', 'ARQ', 92),
    jugador('u-def1', 'DFC', 92), jugador('u-def2', 'DFC', 92), jugador('u-def3', 'DFC', 92), jugador('u-def4', 'DFC', 92),
    jugador('u-med1', 'MC', 92), jugador('u-med2', 'MC', 92), jugador('u-med3', 'MC', 92), jugador('u-med4', 'MC', 92),
    jugador('u-del1', 'DEL', 92), jugador('u-del2', 'DEL', 92),
  ];
  return {
    id: 'club-usuario',
    nombre: 'Mi Club',
    liga: 'Liga Profesional',
    nc: 90,
    presupuesto: 1_000_000,
    cohesion: 55,
    plantel: titulares,
    formacion: '4-4-2',
    titularesIds: titulares.map((j) => j.id),
    suplentesIds: [],
    dt: dtBase(),
    esControladoPorUsuario: true,
  };
}

function jugarHastaTerminar(torneo: TorneoConmebol): TorneoConmebol {
  let t = torneo;
  let iteraciones = 0;
  // Pedido explícito ("si te eliminan de una copa esta se deja de
  // simular"): 'eliminado' ya no es una fase terminal — el torneo sigue
  // hasta 'campeon' siempre, con `usuarioEliminado` como bandera aparte.
  while (t.fase !== 'campeon' && iteraciones < 200) {
    if (t.fase === 'grupos') {
      t = simularProximaFechaGruposConmebol(t);
    } else {
      t = simularProximaEtapaConmebol(t);
    }
    iteraciones += 1;
  }
  expect(iteraciones).toBeLessThan(200); // nunca debería colgarse
  return t;
}

describe('generarTorneoConmebol', () => {
  it('arma 32 clubes (el del usuario + 31 rivales) y 8 grupos de 4', () => {
    const torneo = generarTorneoConmebol('libertadores', clubUsuario(), 2);
    expect(torneo.clubIds).toHaveLength(32);
    expect(Object.keys(torneo.clubes)).toHaveLength(32);
    expect(torneo.clubIds).toContain('club-usuario');
    expect(torneo.grupos).toHaveLength(8);
    torneo.grupos.forEach((g) => expect(g.clubIds).toHaveLength(4));
  });
});

describe('flujo completo — Copa Libertadores', () => {
  it('siempre termina con un campeón definido, nunca se cuelga (usuario campeón o eliminado en el camino)', () => {
    for (let intento = 0; intento < 5; intento += 1) {
      const torneo = generarTorneoConmebol('libertadores', clubUsuario(), 2);
      const final = jugarHastaTerminar(torneo);
      expect(final.fase).toBe('campeon');
      expect(final.campeonId).not.toBeNull();
      if (final.usuarioEliminado) {
        expect(final.campeonId).not.toBe('club-usuario');
      } else {
        expect(final.campeonId).toBe('club-usuario');
      }
    }
  });
});

describe('flujo completo — Copa Sudamericana (con playoff de acceso)', () => {
  it('siempre termina con un campeón definido, nunca se cuelga (usuario campeón o eliminado en el camino)', () => {
    for (let intento = 0; intento < 5; intento += 1) {
      const torneo = generarTorneoConmebol('sudamericana', clubUsuario(), 2);
      const final = jugarHastaTerminar(torneo);
      expect(final.fase).toBe('campeon');
      expect(final.campeonId).not.toBeNull();
      if (!final.usuarioEliminado) {
        expect(final.campeonId).toBe('club-usuario');
      }
    }
  });

  it('si el usuario llega al playoff de acceso, ese playoff tiene 8 llaves ida y vuelta', () => {
    // Repetimos hasta encontrar una corrida donde el usuario llegue vivo
    // a la fase de playoff-acceso (no siempre pasa — puede quedar
    // eliminado en grupos si no sale 1° ni 2°).
    let encontrado = false;
    for (let intento = 0; intento < 30 && !encontrado; intento += 1) {
      let t = generarTorneoConmebol('sudamericana', clubUsuario(), 2);
      while (t.fase === 'grupos') t = simularProximaFechaGruposConmebol(t);
      if (t.fase === 'playoff-acceso') {
        encontrado = true;
        expect(t.playoffAcceso).toHaveLength(8);
        t.playoffAcceso.forEach((l) => expect(l.aPartidoUnico).toBe(false));
      }
    }
    expect(encontrado).toBe(true);
  });
});
