import { describe, expect, it } from 'vitest';
import { generarCopaNacional, simularRondaCopaNacional } from '../copaNacional';
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
  const plantel = [jugador(`${id}-1`, nc)];
  return {
    id, nombre: `Club ${id}`, liga: 'Liga', nc, presupuesto: 100000, cohesion: 55,
    plantel, formacion: '4-4-2', titularesIds: [`${id}-1`], suplentesIds: [], dt: dtBase(),
    esControladoPorUsuario: false,
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

describe('generarCopaNacional', () => {
  it('arranca con todos los clubes, sin campeón', () => {
    const clubes = clubesDePrueba(28);
    const copa = generarCopaNacional('Copa Argentina', clubes);
    expect(copa.campeonId).toBeNull();
    expect(copa.rondas).toHaveLength(1);
    const enPrimeraRonda = copa.rondas[0].llaves.flatMap((l) => [l.localId, l.visitanteId]);
    expect(new Set([...enPrimeraRonda, ...copa.clasificadosPendientes]).size).toBe(28);
  });
});

describe('simularRondaCopaNacional', () => {
  it('de punta a punta con 28 clubes, termina con exactamente un campeón', () => {
    const clubes = clubesDePrueba(28);
    let copa = generarCopaNacional('Copa Argentina', clubes);

    let iteraciones = 0;
    while (!copa.campeonId && iteraciones < 20) {
      copa = simularRondaCopaNacional(copa);
      iteraciones += 1;
    }

    expect(copa.campeonId).not.toBeNull();
    expect(Object.keys(clubes)).toContain(copa.campeonId);
    // Nunca se cuelga: con 28 clubes son 5 rondas (32→16→8→4→2→1).
    expect(iteraciones).toBeLessThanOrEqual(5);
  });

  it('cada ronda jugada tiene todas las llaves con ganador definido', () => {
    const clubes = clubesDePrueba(16);
    let copa = generarCopaNacional('FA Cup', clubes);
    copa = simularRondaCopaNacional(copa);
    const rondaJugada = copa.rondas[0];
    expect(rondaJugada.llaves.every((l) => l.ganadorId != null)).toBe(true);
  });

  it('no rompe si ya hay campeón (llamar de más es un no-op)', () => {
    const clubes = clubesDePrueba(2);
    let copa = generarCopaNacional('Final directa', clubes);
    copa = simularRondaCopaNacional(copa);
    expect(copa.campeonId).not.toBeNull();
    const copaOtraVez = simularRondaCopaNacional(copa);
    expect(copaOtraVez).toBe(copa);
  });
});
