import { describe, expect, it } from 'vitest';
import {
  armarFaseLigaSuiza, PARTIDOS_FASE_LIGA, simularFaseSuizaCompleta, tablaSuiza,
} from '../ligaSuiza';
import type { Club, DT, Jugador } from '../../types';

function dtBase(): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
  };
}

function jugador(id: string, grl: number): Jugador {
  return {
    id, nombre: `J${id}`, edad: 25, posicion: 'DEL', grl, pot: grl, valorMercado: 100000,
    clubId: null, esJoya: false, historialGrl: [], contratoAniosRestantes: 2, salario: 1000,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
  };
}

function clubBase(id: string, liga: string, nc: number): Club {
  return {
    id, nombre: `Club ${id}`, liga, nc, presupuesto: 100000, cohesion: 55,
    plantel: [jugador(`${id}-1`, nc)], formacion: '4-4-2', titularesIds: [`${id}-1`], suplentesIds: [],
    dt: dtBase(), esControladoPorUsuario: false,
  };
}

// 36 clubes repartidos entre 5 ligas distintas, como en Champions real.
function clubesDePrueba(cantidad: number): Record<string, Club> {
  const ligas = ['Premier League', 'LaLiga', 'Serie A', 'Bundesliga', 'Ligue 1'];
  const clubes: Record<string, Club> = {};
  for (let i = 0; i < cantidad; i += 1) {
    const id = `c${i}`;
    clubes[id] = clubBase(id, ligas[i % ligas.length], 65 + (i % 20));
  }
  return clubes;
}

describe('armarFaseLigaSuiza', () => {
  it('cada club juega exactamente 8 partidos, todos contra rivales distintos', () => {
    const clubes = clubesDePrueba(36);
    const fixture = armarFaseLigaSuiza(clubes);

    const fechas = new Set(fixture.map((p) => p.fecha));
    expect(fechas.size).toBe(PARTIDOS_FASE_LIGA);

    Object.keys(clubes).forEach((id) => {
      const partidos = fixture.filter((p) => p.localId === id || p.visitanteId === id);
      expect(partidos).toHaveLength(PARTIDOS_FASE_LIGA);
      const rivales = partidos.map((p) => (p.localId === id ? p.visitanteId : p.localId));
      expect(new Set(rivales).size).toBe(PARTIDOS_FASE_LIGA); // sin repetir rival
    });
  });

  it('en cada fecha, cada club juega como máximo un partido', () => {
    const clubes = clubesDePrueba(36);
    const fixture = armarFaseLigaSuiza(clubes);
    for (let fecha = 1; fecha <= PARTIDOS_FASE_LIGA; fecha += 1) {
      const partidosFecha = fixture.filter((p) => p.fecha === fecha);
      const clubesJugando = partidosFecha.flatMap((p) => [p.localId, p.visitanteId]);
      expect(new Set(clubesJugando).size).toBe(clubesJugando.length);
    }
  });
});

describe('simularFaseSuizaCompleta + tablaSuiza', () => {
  it('deja una tabla con los 36 clubes y 8 partidos jugados cada uno', () => {
    const clubes = clubesDePrueba(36);
    let fixture = armarFaseLigaSuiza(clubes);
    fixture = simularFaseSuizaCompleta(fixture, clubes, 'ninguno-es-el-usuario');

    const tabla = tablaSuiza(fixture, Object.keys(clubes));
    expect(tabla).toHaveLength(36);
    tabla.forEach((fila) => expect(fila.pj).toBe(PARTIDOS_FASE_LIGA));
  });
});
