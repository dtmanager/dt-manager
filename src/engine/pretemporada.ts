// Amistosos de pretemporada (pedido explícito) — puramente "de sabor":
// no bloquean el arranque de la fecha 1 ni afectan lesiones/tarjetas/
// desgaste/cohesión/estadísticas de temporada del jugador. Se simulan con
// el mismo motor que un partido de liga real (simularPartidoDeFixture,
// engine/fixture.ts) para que tengan marcador/goleadores/xG/eventos
// completos y se puedan repasar en el visualizador — la diferencia es que
// el resultado NUNCA pasa por aplicarEstadisticasPostFecha/
// aplicarDesgastePostFecha/aplicarTarjetasPostFecha (eso es lo que en la
// liga real genera lesiones/suspensiones/stats): acá el store sólo guarda
// el Partido devuelto, sin ese paso extra.

import type { Club, Partido } from '../types';
import { elegirVariosAlAzar } from './random';
import { idUnico } from './nombres';

export const CANTIDAD_AMISTOSOS_PRETEMPORADA = 3;

// Rivales al azar de TODO el pool de clubes visible en ese momento
// (rivales domésticos + el mercado internacional ya generado por
// generarClubesExtranjeros) — así un amistoso de pretemporada puede tocar
// contra un club extranjero, que es justamente lo más común en la
// realidad (giras de pretemporada).
export function generarPretemporada(clubUsuarioId: string, clubes: Record<string, Club>): Partido[] {
  const rivalesPosibles = Object.keys(clubes).filter((id) => id !== clubUsuarioId);
  const rivalesElegidos = elegirVariosAlAzar(rivalesPosibles, Math.min(CANTIDAD_AMISTOSOS_PRETEMPORADA, rivalesPosibles.length));

  return rivalesElegidos.map((rivalId, i) => {
    const esLocal = Math.random() < 0.5;
    return {
      id: idUnico('amistoso'),
      fecha: i + 1,
      localId: esLocal ? clubUsuarioId : rivalId,
      visitanteId: esLocal ? rivalId : clubUsuarioId,
      golesLocal: null,
      golesVisitante: null,
      partidoImportante: false,
    };
  });
}
