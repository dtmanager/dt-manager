import { describe, expect, it } from 'vitest';
import {
  clasificaParaCopa, generarCopaMundialClubes, simularProximaEtapaMundial, simularProximaFechaGruposMundial,
  type CopaMundialClubes,
} from '../copaMundialClubes';
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
// en libertadoresYSudamericana.test.ts / championsEuropaConference.test.ts.
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

function jugarHastaTerminar(copa: CopaMundialClubes): CopaMundialClubes {
  let c = copa;
  let iteraciones = 0;
  // Pedido explícito ("si te eliminan de una copa esta se deja de
  // simular"): 'eliminado' ya no es una fase terminal — el torneo sigue
  // hasta 'campeon' siempre, con `usuarioEliminado` como bandera aparte.
  while (c.fase !== 'campeon' && iteraciones < 200) {
    c = c.fase === 'grupos' ? simularProximaFechaGruposMundial(c) : simularProximaEtapaMundial(c);
    iteraciones += 1;
  }
  expect(iteraciones).toBeLessThan(200); // nunca debería colgarse
  return c;
}

describe('clasificaParaCopa', () => {
  it('clasifican los primeros 4 puestos (0-indexed)', () => {
    expect(clasificaParaCopa(0)).toBe(true);
    expect(clasificaParaCopa(3)).toBe(true);
    expect(clasificaParaCopa(4)).toBe(false);
    expect(clasificaParaCopa(-1)).toBe(false);
  });
});

describe('generarCopaMundialClubes', () => {
  it('arma 32 clubes (el del usuario + 31) y 8 grupos de 4 a una sola rueda', () => {
    const copa = generarCopaMundialClubes(clubUsuario(), 'Liga Profesional', undefined, 2);
    expect(copa.clubIds).toHaveLength(32);
    expect(Object.keys(copa.clubes)).toHaveLength(32);
    expect(copa.clubIds).toContain('club-usuario');
    expect(copa.grupos).toHaveLength(8);
    copa.grupos.forEach((g) => {
      expect(g.clubIds).toHaveLength(4);
      // Una sola rueda: 3 fechas (no 6 como en Libertadores/Sudamericana).
      const fechas = new Set(g.fixture.map((p) => p.fecha));
      expect(fechas.size).toBe(3);
      expect(g.fixture).toHaveLength(6); // C(4,2) = 6 partidos totales, uno por par
    });
  });
});

describe('flujo completo — Copa Mundial de Clubes', () => {
  it('siempre termina con un campeón definido, nunca se cuelga (usuario campeón o eliminado en el camino)', () => {
    for (let intento = 0; intento < 5; intento += 1) {
      const copa = generarCopaMundialClubes(clubUsuario(), 'Liga Profesional', undefined, 2);
      const final = jugarHastaTerminar(copa);
      expect(final.fase).toBe('campeon');
      expect(final.campeonId).not.toBeNull();
      if (final.usuarioEliminado) {
        expect(final.campeonId).not.toBe('club-usuario');
      } else {
        expect(final.campeonId).toBe('club-usuario');
      }
    }
  });

  it('si el usuario clasifica a octavos, el cuadro arranca con 8 llaves a partido único', () => {
    let encontrado = false;
    for (let intento = 0; intento < 30 && !encontrado; intento += 1) {
      let c = generarCopaMundialClubes(clubUsuario(), 'Liga Profesional', undefined, 2);
      while (c.fase === 'grupos') c = simularProximaFechaGruposMundial(c);
      if (c.fase === 'knockout') {
        encontrado = true;
        expect(c.bracket).toHaveLength(1);
        expect(c.bracket[0].nombre).toBe('Octavos de final');
        expect(c.bracket[0].llaves).toHaveLength(8);
        c.bracket[0].llaves.forEach((l) => expect(l.aPartidoUnico).toBe(true));
      }
    }
    expect(encontrado).toBe(true);
  });
});
