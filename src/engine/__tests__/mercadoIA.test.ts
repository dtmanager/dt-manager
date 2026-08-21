import { describe, expect, it, vi } from 'vitest';
import { simularTransferenciasIA } from '../mercadoIA';
import type { Club, DT, Jugador } from '../../types';

function jugadorBase(over: Partial<Jugador>): Jugador {
  return {
    id: 'j', nombre: 'Test', edad: 25, posicion: 'DEL', grl: 70, pot: 70, valorMercado: 1000,
    clubId: null, esJoya: false, historialGrl: [], contratoAniosRestantes: 0, salario: 0,
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

describe('simularTransferenciasIA', () => {
  // Reproduce el bug de "Encountered two children with the same key": club
  // A vende a X hacia club B en la primera pasada del forEach externo: como
  // clubOrigen se relee de clubesActuales, cuando el forEach externo llega
  // a B (que también es un club "origen" de la lista original) su plantel
  // ya incluye a X recién comprado, y si X también resulta "vendible" para
  // B (acá vía el umbral de desborde de nc, ver UMBRAL_DESBORDE_NC en
  // mercadoIA.ts) el guard existente no lo detecta porque sólo chequea que
  // el jugador siga en el plantel del club actual — cosa que es cierta,
  // sigue en el plantel de B. Con el fix (Set de ids ya movidos en esta
  // pasada) debe venderse una sola vez.
  it('no vuelve a vender en la misma pasada a un jugador que el comprador ya recibió', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const x = jugadorBase({
        id: 'x', posicion: 'DEL', grl: 79, valorMercado: 10000, transferible: true, clubId: 'a',
      });
      const clubA = clubBase({ id: 'a', nc: 60, liga: 'Liga', presupuesto: 100000, plantel: [x] });
      const clubB = clubBase({
        id: 'b', nc: 65, liga: 'Liga', presupuesto: 1_000_000,
        plantel: [jugadorBase({ id: 'm1', posicion: 'MC', grl: 40 })],
      });
      const clubC = clubBase({
        id: 'c', nc: 65, liga: 'Liga', presupuesto: 1_000_000,
        plantel: [jugadorBase({ id: 'm2', posicion: 'MC', grl: 50 })],
      });
      // El orden de inserción importa: el forEach externo debe procesar a
      // A antes que a B para que la venta A->B ocurra antes de que B sea
      // evaluado como origen.
      const clubes = { a: clubA, b: clubB, c: clubC };

      const { movimientos } = simularTransferenciasIA(clubes, 'usuario-no-participa');

      const movimientosDeX = movimientos.filter((m) => m.jugadorId === 'x');
      expect(movimientosDeX).toHaveLength(1);

      const ids = movimientos.map((m) => m.jugadorId);
      expect(new Set(ids).size).toBe(ids.length);
    } finally {
      randomSpy.mockRestore();
    }
  });
});
