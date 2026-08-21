import { describe, expect, it } from 'vitest';
import { evolucionarClub, generarCanteranosClub } from '../finDeTemporada';
import type { Club, DT, Jugador } from '../../types';

function jugadorBase(over: Partial<Jugador>): Jugador {
  return {
    id: 'j', nombre: 'Test', edad: 25, posicion: 'DEL', grl: 70, pot: 70, valorMercado: 1000,
    clubId: 'c', esJoya: false, historialGrl: [], contratoAniosRestantes: 0, salario: 0,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
    ...over,
  };
}

function dtBase(over: Partial<DT>): DT {
  return {
    id: 'dt', nombre: 'Test DT', tactica: 50, adaptabilidad: 50, desarrollo: 50, gestionVestuario: 50,
    motivacion: 50, analisis: 50, mercado: 50, reaccion: 50, mentalidad: 50, reputacion: 50,
    ...over,
  };
}

function clubBase(over: Partial<Club>): Club {
  return {
    id: 'c', nombre: 'Test FC', liga: 'Liga', nc: 70, presupuesto: 100000, cohesion: 55,
    plantel: [], formacion: '4-4-2', titularesIds: [], suplentesIds: [], dt: dtBase({}),
    esControladoPorUsuario: false,
    ...over,
  };
}

describe('evolucionarClub', () => {
  it('todos los jugadores que siguen tienen un año más y un registro nuevo en historialGrl', () => {
    const club = clubBase({
      plantel: [jugadorBase({ id: '1', edad: 25, grl: 70, pot: 75, historialGrl: [{ temporada: 1, grl: 68 }] })],
    });
    const { club: clubNuevo } = evolucionarClub(club, 1);
    expect(clubNuevo.plantel).toHaveLength(1);
    expect(clubNuevo.plantel[0].edad).toBe(26);
    expect(clubNuevo.plantel[0].historialGrl).toHaveLength(2);
    expect(clubNuevo.plantel[0].historialGrl[1].temporada).toBe(1);
  });

  it('retira a los jugadores de 40+ y los saca del plantel y de la alineación', () => {
    const club = clubBase({
      plantel: [
        jugadorBase({ id: 'viejo', edad: 39, grl: 70 }),
        jugadorBase({ id: 'joven', edad: 25, grl: 70 }),
      ],
      titularesIds: ['viejo', 'joven'],
      suplentesIds: [],
    });
    const { club: clubNuevo, retirados } = evolucionarClub(club, 1);
    expect(retirados).toHaveLength(1);
    expect(retirados[0].id).toBe('viejo');
    expect(clubNuevo.plantel.map((j) => j.id)).toEqual(['joven']);
    expect(clubNuevo.titularesIds).toEqual(['joven']);
  });

  it('recalcula el valorMercado después de cambiar grl/edad', () => {
    const club = clubBase({ plantel: [jugadorBase({ id: '1', edad: 20, grl: 60, pot: 90, valorMercado: 1 })] });
    const { club: clubNuevo } = evolucionarClub(club, 1);
    expect(clubNuevo.plantel[0].valorMercado).toBeGreaterThan(1);
  });
});

describe('generarCanteranosClub', () => {
  it('genera entre 2 y 4 jugadores libres, de 15 a 17 años', () => {
    const club = clubBase({});
    const canteranos = generarCanteranosClub(club);
    expect(canteranos.length).toBeGreaterThanOrEqual(2);
    expect(canteranos.length).toBeLessThanOrEqual(4);
    canteranos.forEach((j) => {
      expect(j.edad).toBeGreaterThanOrEqual(15);
      expect(j.edad).toBeLessThanOrEqual(17);
      expect(j.clubId).toBeNull();
    });
  });
});
