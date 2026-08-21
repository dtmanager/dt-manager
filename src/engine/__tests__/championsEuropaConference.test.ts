import { describe, expect, it } from 'vitest';
import {
  generarCompeticionSuiza, simularProximaEtapaSuizaCompeticion, simularProximaFechaSuizaCompeticion,
  type CompeticionSuiza,
} from '../championsEuropaConference';
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

// Plantel completo y fuerte en las 4 posiciones — ver la nota equivalente
// en libertadoresYSudamericana.test.ts (con 1 solo jugador el club
// perdía casi todo y el test de playoff/knockout quedaba flaky).
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
    liga: 'Premier League',
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

function jugarHastaTerminar(competicion: CompeticionSuiza): CompeticionSuiza {
  let c = competicion;
  let iteraciones = 0;
  // Pedido explícito ("si te eliminan de una copa esta se deja de
  // simular"): 'eliminado' ya no es una fase terminal — la competencia
  // sigue hasta 'campeon' siempre, con `usuarioEliminado` como bandera
  // aparte.
  while (c.fase !== 'campeon' && iteraciones < 200) {
    c = c.fase === 'fase-liga' ? simularProximaFechaSuizaCompeticion(c) : simularProximaEtapaSuizaCompeticion(c);
    iteraciones += 1;
  }
  expect(iteraciones).toBeLessThan(200); // nunca debería colgarse
  return c;
}

describe('generarCompeticionSuiza', () => {
  it('arma 36 clubes (el del usuario + 35 rivales) y una fase de liga de 8 fechas', () => {
    const competicion = generarCompeticionSuiza('champions', clubUsuario(), 'Premier League', undefined, 2);
    expect(competicion.clubIds).toHaveLength(36);
    expect(Object.keys(competicion.clubes)).toHaveLength(36);
    expect(competicion.clubIds).toContain('club-usuario');
    const fechas = new Set(competicion.fixtureFaseLiga.map((p) => p.fecha));
    expect(fechas.size).toBe(8);
  });
});

describe('flujo completo — UEFA Champions League', () => {
  it('siempre termina con un campeón definido, nunca se cuelga (usuario campeón o eliminado en el camino)', () => {
    for (let intento = 0; intento < 5; intento += 1) {
      const competicion = generarCompeticionSuiza('champions', clubUsuario(), 'Premier League', undefined, 2);
      const final = jugarHastaTerminar(competicion);
      expect(final.fase).toBe('campeon');
      expect(final.campeonId).not.toBeNull();
      if (final.usuarioEliminado) {
        expect(final.campeonId).not.toBe('club-usuario');
      } else {
        expect(final.campeonId).toBe('club-usuario');
      }
    }
  });

  it('si el usuario llega al playoff de acceso, ese playoff tiene 8 llaves ida y vuelta', () => {
    let encontrado = false;
    for (let intento = 0; intento < 30 && !encontrado; intento += 1) {
      let c = generarCompeticionSuiza('champions', clubUsuario(), 'Premier League', undefined, 2);
      while (c.fase === 'fase-liga') c = simularProximaFechaSuizaCompeticion(c);
      if (c.fase === 'playoff-acceso') {
        encontrado = true;
        expect(c.playoffAcceso).toHaveLength(8);
        c.playoffAcceso.forEach((l) => expect(l.aPartidoUnico).toBe(false));
      }
    }
    expect(encontrado).toBe(true);
  });
});

describe('flujo completo — UEFA Europa League y Conference League', () => {
  it('ambas siempre terminan con un campeón definido, nunca se cuelgan', () => {
    (['europa', 'conference'] as const).forEach((tipo) => {
      const competicion = generarCompeticionSuiza(tipo, clubUsuario(), 'Premier League', undefined, 2);
      const final = jugarHastaTerminar(competicion);
      expect(final.fase).toBe('campeon');
      expect(final.campeonId).not.toBeNull();
    });
  });
});
