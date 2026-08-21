import { describe, expect, it } from 'vitest';
import { CANTIDAD_AMISTOSOS_PRETEMPORADA, generarPretemporada } from '../pretemporada';
import { simularPartidoDeFixture } from '../fixture';
import type { Club, DT, Jugador, Posicion } from '../../types';

function dtBase(): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
  };
}

const FORMACION_4_4_2: Posicion[] = ['ARQ', 'DFC', 'DFC', 'LI', 'LD', 'MC', 'MC', 'EI', 'ED', 'DEL', 'DEL'];

function clubConPlantel(id: string): Club {
  const plantel: Jugador[] = FORMACION_4_4_2.map((posicion, i) => ({
    id: `${id}-${i}`,
    nombre: `J${id}${i}`,
    edad: 25,
    posicion,
    grl: 70,
    pot: 70,
    valorMercado: 100000,
    clubId: id,
    esJoya: false,
    historialGrl: [],
    contratoAniosRestantes: 2,
    salario: 1000,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
  }));
  return {
    id, nombre: `Club ${id}`, liga: 'Liga', nc: 70, presupuesto: 100000, cohesion: 55,
    plantel, formacion: '4-4-2', titularesIds: plantel.map((j) => j.id), suplentesIds: [], dt: dtBase(),
    esControladoPorUsuario: id === 'usuario',
  };
}

function clubesDePrueba(cantidadRivales: number): Record<string, Club> {
  const clubes: Record<string, Club> = { usuario: clubConPlantel('usuario') };
  for (let i = 0; i < cantidadRivales; i += 1) {
    const id = `rival-${i}`;
    clubes[id] = clubConPlantel(id);
  }
  return clubes;
}

describe('generarPretemporada', () => {
  it('genera CANTIDAD_AMISTOSOS_PRETEMPORADA partidos cuando hay rivales de sobra', () => {
    const clubes = clubesDePrueba(10);
    const partidos = generarPretemporada('usuario', clubes);
    expect(partidos).toHaveLength(CANTIDAD_AMISTOSOS_PRETEMPORADA);
  });

  it('el club del usuario participa en todos los amistosos, y nunca contra sí mismo', () => {
    const clubes = clubesDePrueba(10);
    const partidos = generarPretemporada('usuario', clubes);
    partidos.forEach((p) => {
      expect([p.localId, p.visitanteId]).toContain('usuario');
      expect(p.localId).not.toBe(p.visitanteId);
    });
  });

  it('todos arrancan sin jugar (golesLocal/golesVisitante null)', () => {
    const clubes = clubesDePrueba(10);
    const partidos = generarPretemporada('usuario', clubes);
    partidos.forEach((p) => {
      expect(p.golesLocal).toBeNull();
      expect(p.golesVisitante).toBeNull();
    });
  });

  it('si hay menos rivales disponibles que la cantidad pedida, genera menos partidos sin romper', () => {
    const clubes = clubesDePrueba(1);
    const partidos = generarPretemporada('usuario', clubes);
    expect(partidos).toHaveLength(1);
  });

  it('simulados con el motor real, dan marcador y eventos completos (mismo criterio que un partido importante de liga)', () => {
    const clubes = clubesDePrueba(3);
    const [partido] = generarPretemporada('usuario', clubes);
    const jugado = simularPartidoDeFixture(partido, clubes, 'usuario');

    expect(jugado.golesLocal).not.toBeNull();
    expect(jugado.golesVisitante).not.toBeNull();
    // partidoImportante se recalcula solo en simularPartidoDeFixture — el
    // usuario siempre participa en un amistoso propio, así que siempre da
    // true, y con eso vienen los eventos completos para el visualizador.
    expect(jugado.partidoImportante).toBe(true);
    expect(jugado.eventos).toBeDefined();
    expect(jugado.eventos!.length).toBeGreaterThan(0);
  });
});
