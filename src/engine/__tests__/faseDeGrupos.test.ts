import { describe, expect, it } from 'vitest';
import {
  armarGrupos, simularGruposCompletos, tablaDeGrupo, todosLosGruposTerminados,
} from '../faseDeGrupos';
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

function clubBase(id: string, nc: number): Club {
  return {
    id, nombre: `Club ${id}`, liga: 'Liga', nc, presupuesto: 100000, cohesion: 55,
    plantel: [jugador(`${id}-1`, nc)], formacion: '4-4-2', titularesIds: [`${id}-1`], suplentesIds: [],
    dt: dtBase(), esControladoPorUsuario: false,
  };
}

function clubesDePrueba(cantidad: number): Record<string, Club> {
  const clubes: Record<string, Club> = {};
  for (let i = 0; i < cantidad; i += 1) {
    const id = `c${i}`;
    clubes[id] = clubBase(id, 60 + (i % 30));
  }
  return clubes;
}

describe('armarGrupos', () => {
  it('arma 8 grupos de 4 a partir de 32 clubes, sin repetir a nadie', () => {
    const clubIds = Array.from({ length: 32 }, (_, i) => `c${i}`);
    const grupos = armarGrupos(clubIds);
    expect(grupos).toHaveLength(8);
    grupos.forEach((g) => expect(g.clubIds).toHaveLength(4));
    const todos = grupos.flatMap((g) => g.clubIds);
    expect(new Set(todos).size).toBe(32);
  });
});

describe('simularGruposCompletos + tablaDeGrupo', () => {
  it('deja todos los grupos terminados y cada tabla con los 4 clubes del grupo', () => {
    const clubes = clubesDePrueba(32);
    let grupos = armarGrupos(Object.keys(clubes));
    grupos = simularGruposCompletos(grupos, clubes, 'ninguno-es-el-usuario');

    expect(todosLosGruposTerminados(grupos)).toBe(true);
    grupos.forEach((g) => {
      const tabla = tablaDeGrupo(g);
      expect(tabla).toHaveLength(4);
      expect(new Set(tabla.map((f) => f.clubId))).toEqual(new Set(g.clubIds));
    });
  });
});
