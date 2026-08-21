import { describe, expect, it } from 'vitest';
import { atribuirGoleadores } from '../estadisticasPartido';
import type { EventoGolPartido, EventoPartido } from '../partido';
import type { Jugador, Posicion, SubStats } from '../../types';

// Mismo criterio que partido.test.ts: 11 titulares de un 4-4-2, pero acá
// el DEL (índice 9) se arma a propósito con el peso más alto posible
// (PESO_GOLEADOR/PESO_ASISTENCIA de estadisticasPartido.ts favorecen
// fuerte a DEL) para que, si el gap de exclusión NO estuviera arreglado,
// aparezca como goleador/asistidor casi con certeza en unas pocas
// decenas de sorteos — así el test estadístico es sensible al bug real.
const FORMACION_4_4_2: Posicion[] = ['ARQ', 'DFC', 'DFC', 'LI', 'LD', 'MC', 'MC', 'EI', 'ED', 'DEL', 'DEL'];
const IDX_DEL_FAVORITO = 9; // primer DEL de la formación

function subStats(): SubStats {
  return {
    ritmo: 90, tiro: 95, pase: 90, regate: 90, defensa: 50, fisico: 90,
  };
}

function titulares(): Jugador[] {
  return FORMACION_4_4_2.map((posicion, i) => ({
    id: `j-${i}`,
    nombre: `Jugador ${i}`,
    edad: 25,
    posicion,
    grl: i === IDX_DEL_FAVORITO ? 95 : 65,
    pot: 65,
    valorMercado: 0,
    clubId: 'c',
    esJoya: false,
    historialGrl: [],
    contratoAniosRestantes: 0,
    salario: 0,
    estadisticasTemporada: { pj: 0, goles: 0, asistencias: 0 },
    subStats: i === IDX_DEL_FAVORITO ? subStats() : { ...subStats(), tiro: 40, pase: 40 },
  }));
}

// `eventos` (la secuencia completa que arma partido.ts) es la fuente real
// de exclusión — exclusionesPorGol (estadisticasPartido.ts) la recorre en
// orden y saca una foto de "quién está afuera" en CADA evento 'gol' que
// encuentra ahí, para alinearse índice a índice con `eventosGol`. Así que
// el `eventos` de prueba tiene que incluir también el propio evento 'gol'
// en la posición cronológica correcta (no alcanza con pasar sólo la baja
// como en partido.ts real, donde el 'gol' SIEMPRE está en `eventos`).
function golAbierto(equipo: 'local' | 'visitante', minuto: number): EventoGolPartido {
  return { equipo, minuto };
}

function eventoGolDeEventoGolPartido(evento: EventoGolPartido): EventoPartido {
  return {
    tipo: 'gol', equipo: evento.equipo, minuto: evento.minuto, zona: 5, ancho: 'centro',
  };
}

const REPETICIONES = 300;

function recolectarIdsSorteados(
  eventosGol: EventoGolPartido[],
  local: Jugador[],
  visitante: Jugador[],
  bajas: EventoPartido[],
): Set<string> {
  // Orden cronológico: las bajas antes que los goles que van después de
  // ellas en minuto (mismo criterio que usaría partido.ts al empujar
  // eventos secuencialmente).
  const eventos = [...bajas, ...eventosGol.map(eventoGolDeEventoGolPartido)]
    .sort((a, b) => a.minuto - b.minuto);

  const ids = new Set<string>();
  for (let i = 0; i < REPETICIONES; i += 1) {
    const goles = atribuirGoleadores(eventosGol, local, visitante, eventos);
    goles.forEach((g) => {
      ids.add(g.jugadorId);
      if (g.asistenciaId) ids.add(g.asistenciaId);
    });
  }
  return ids;
}

describe('atribuirGoleadores — exclusión de jugadores afuera de cancha', () => {
  it('nunca atribuye un gol de juego abierto a un jugador ya expulsado (tarjeta_roja) en ese minuto', () => {
    const local = titulares();
    const idExpulsado = local[IDX_DEL_FAVORITO].id;
    const eventos: EventoPartido[] = [
      {
        tipo: 'tarjeta_roja', equipo: 'local', minuto: 30, zona: 3, ancho: 'centro', jugadorId: idExpulsado,
      },
    ];
    const eventosGol = [golAbierto('local', 75)];

    const ids = recolectarIdsSorteados(eventosGol, local, titulares(), eventos);
    expect(ids.has(idExpulsado)).toBe(false);
  });

  it('nunca atribuye un gol de juego abierto a un jugador ya sustituido (cambio) en ese minuto', () => {
    const local = titulares();
    const idSaliente = local[IDX_DEL_FAVORITO].id;
    const eventos: EventoPartido[] = [
      {
        tipo: 'cambio', equipo: 'local', minuto: 60, zona: 2, ancho: 'centro', jugadorId: idSaliente, jugadorEntraId: 's-1',
      },
    ];
    const eventosGol = [golAbierto('local', 75)];

    const ids = recolectarIdsSorteados(eventosGol, local, titulares(), eventos);
    expect(ids.has(idSaliente)).toBe(false);
  });

  it('sólo excluye para goles OCURRIDOS DESPUÉS de la baja — un gol anterior a la expulsión sigue elegible', () => {
    const local = titulares();
    const idExpulsado = local[IDX_DEL_FAVORITO].id;
    const eventos: EventoPartido[] = [
      {
        tipo: 'tarjeta_roja', equipo: 'local', minuto: 80, zona: 3, ancho: 'centro', jugadorId: idExpulsado,
      },
    ];
    // El gol de juego abierto pasa ANTES de la roja (minuto 50 < 80).
    const eventosGol = [golAbierto('local', 50)];

    const ids = recolectarIdsSorteados(eventosGol, local, titulares(), eventos);
    expect(ids.has(idExpulsado)).toBe(true);
  });

  it('sólo excluye del equipo correcto — la baja del rival no afecta al otro equipo', () => {
    const local = titulares();
    const visitante = titulares();
    const idExpulsadoVisitante = visitante[IDX_DEL_FAVORITO].id;
    const idFavoritoLocal = local[IDX_DEL_FAVORITO].id;
    const eventos: EventoPartido[] = [
      {
        tipo: 'tarjeta_roja', equipo: 'visitante', minuto: 10, zona: 3, ancho: 'centro', jugadorId: idExpulsadoVisitante,
      },
    ];
    const eventosGol = [golAbierto('local', 75)];

    const ids = recolectarIdsSorteados(eventosGol, local, visitante, eventos);
    expect(ids.has(idFavoritoLocal)).toBe(true);
  });

  it('sin el parámetro eventos (compatibilidad hacia atrás) no excluye a nadie', () => {
    const local = titulares();
    const idFavorito = local[IDX_DEL_FAVORITO].id;
    const eventosGol = [golAbierto('local', 75)];

    const ids = new Set<string>();
    for (let i = 0; i < REPETICIONES; i += 1) {
      const goles = atribuirGoleadores(eventosGol, local, titulares());
      goles.forEach((g) => ids.add(g.jugadorId));
    }
    expect(ids.has(idFavorito)).toBe(true);
  });

  it('los goles de penal/falta (jugadorId ya resuelto) no pasan por el sorteo ni por la exclusión', () => {
    const local = titulares();
    const idPateador = local[IDX_DEL_FAVORITO].id;
    // El pateador está expulsado ANTES de patear — no debería pasar en un
    // partido real (partido.ts ya filtra con titularesEnCancha antes de
    // elegir pateador), pero sirve para confirmar que un evento con
    // jugadorId resuelto se devuelve tal cual, sin tocar la exclusión.
    const eventos: EventoPartido[] = [
      {
        tipo: 'tarjeta_roja', equipo: 'local', minuto: 10, zona: 3, ancho: 'centro', jugadorId: idPateador,
      },
    ];
    const eventosGol: EventoGolPartido[] = [{
      equipo: 'local', minuto: 75, jugadorId: idPateador, origen: 'penal',
    }];

    const [gol] = atribuirGoleadores(eventosGol, local, titulares(), eventos);
    expect(gol.jugadorId).toBe(idPateador);
    expect(gol.origen).toBe('penal');
  });
});
