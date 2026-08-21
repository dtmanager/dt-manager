// M6 — fin de temporada (secciones 4.2 y 7): evolución de GRL/edad de
// TODOS los jugadores de la liga, retiros, y generación de canteranos.
// Funciones puras — el store decide cuándo llamarlas y qué hacer con el
// resultado (por ejemplo, los canteranos del club del usuario no se suman
// solos: se ofrecen uno por uno en una pantalla aparte).

import type { Club, Jugador, Posicion } from '../types';
import { calcularValorMercado, debeRetirarse, evolucionarGrl, generarCanterano } from './jugadores';
import { generarNombreJugador, idUnico } from './nombres';
import { randomEntero } from './random';
import { generarSubStats, generarSubStatsArquero } from './subStats';
import { paisDeLiga } from '../data/ligas';

// Pool de posiciones para el sorteo de canteranos, repetida en proporción a
// COMPOSICION_PLANTEL de liga.ts (22 entradas) — así el plantel de
// canteranos generado con el tiempo respeta más o menos la misma
// composición típica que el plantel inicial, en vez de un sorteo 1/10
// parejo que sobregeneraría posiciones "raras" (MCD/MCO/EI/ED) respecto a
// las que de verdad hacen falta (DFC, MC, DEL).
const POSICIONES: Posicion[] = [
  'ARQ', 'ARQ',
  'DFC', 'DFC', 'DFC', 'DFC',
  'LI',
  'LD',
  'MCD', 'MCD', 'MCD',
  'MC', 'MC', 'MC', 'MC',
  'MCO', 'MCO',
  'EI',
  'ED',
  'DEL', 'DEL', 'DEL',
];

export interface ResultadoEvolucionClub {
  club: Club;
  retirados: Jugador[];
}

// Aplica evolución de GRL (4.2) a todo el plantel de un club y saca a los
// que se retiran. El bonus de "Desarrollo" del DT sólo aplica a los
// jugadores <=23 de ESTE club (según la edad antes de sumar el año).
export function evolucionarClub(club: Club, temporadaQueTermina: number): ResultadoEvolucionClub {
  const jugadoresVigentes: Jugador[] = [];
  const retirados: Jugador[] = [];

  club.plantel.forEach((jugador) => {
    const dtDesarrollo = jugador.edad <= 23 ? club.dt.desarrollo : undefined;
    const { grl: nuevoGrl, pot: nuevoPot } = evolucionarGrl(
      jugador.grl,
      jugador.pot,
      jugador.edad,
      jugador.posicion,
      dtDesarrollo,
    );
    const nuevaEdad = jugador.edad + 1;

    if (debeRetirarse(nuevaEdad, nuevoGrl)) {
      retirados.push(jugador);
      return;
    }

    const actualizado: Jugador = {
      ...jugador,
      grl: nuevoGrl,
      pot: nuevoPot,
      edad: nuevaEdad,
      historialGrl: [...jugador.historialGrl, { temporada: temporadaQueTermina, grl: nuevoGrl }],
      // Pretemporada (pedido explícito, ver desgaste.ts): las lesiones se
      // resetean entre temporadas — nadie arranca el año nuevo todavía de
      // baja por algo de la temporada anterior.
      partidosLesionRestantes: 0,
      // estadisticasTemporada es "de la temporada" por nombre (ver
      // engine/estadisticasPartido.ts, que las va sumando partido a
      // partido) — se resetea a 0 en cada pretemporada, si no los goles
      // de toda la carrera se acumularían en un solo número sin sentido.
      estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
      // Sub-stats recalculadas con el nuevoGrl de esta temporada (sección
      // 6.1 de sub-stats-diseno.md) — así "siguen" al grl con la edad
      // (declive de grl por años también les baja ritmo/tiro/etc, sin
      // tocar evolucionarGrl).
      subStats: generarSubStats(nuevoGrl, jugador.posicion),
      subStatsArquero: jugador.posicion === 'ARQ' ? generarSubStatsArquero(nuevoGrl) : undefined,
    };
    actualizado.valorMercado = calcularValorMercado(actualizado);
    jugadoresVigentes.push(actualizado);
  });

  const idsRetirados = new Set(retirados.map((j) => j.id));

  return {
    club: {
      ...club,
      plantel: jugadoresVigentes,
      titularesIds: club.titularesIds.filter((id) => !idsRetirados.has(id)),
      suplentesIds: club.suplentesIds.filter((id) => !idsRetirados.has(id)),
    },
    retirados,
  };
}

// 7 — entre 2 y 4 canteranos nuevos por club, posición al azar (la spec
// no da una distribución, se sortea pareja entre las 4).
export function generarCanteranosClub(club: Club): Jugador[] {
  const cantidad = randomEntero(2, 4);
  const pais = paisDeLiga(club.liga) ?? undefined;
  return Array.from({ length: cantidad }, () => {
    const posicion = POSICIONES[Math.floor(Math.random() * POSICIONES.length)];
    return generarCanterano(idUnico('canterano'), generarNombreJugador(pais), posicion, club.nc);
  });
}
