// Goleador/asistidor por partido (pedido explícito: "que cada jugador
// afecte" la simulación). Hasta ahora partido.ts sólo calculaba un
// marcador abstracto (2-1) a partir del promedio de grl por sector, sin
// saber QUIÉN metió los goles — y estadisticasTemporada.goles/asistencias
// ya existía en el tipo Jugador pero nunca se actualizaba en ningún lado
// (un campo fantasma). Ahora, para cada gol que partido.ts decide que
// pasó (con su minuto), se sortea de forma ponderada por posición+grl
// quién lo metió y quién asistió entre los titulares reales de ese
// partido. Esto NO toca el resultado — el marcador lo sigue decidiendo
// partido.ts a nivel de sector — sólo le pone nombre a cada gol y
// actualiza las estadísticas reales de los jugadores.
import type {
  Club, GolPartido, Jugador, Partido, Posicion, SubStats,
} from '../types';
import type { EventoGolPartido, EventoPartido } from './partido';
import { randomUniforme } from './random';

// Peso relativo de cada posición para ser el GOLEADOR de una jugada —
// recalibrado a las 10 posiciones granulares (antes sólo distinguía
// DEL/MED/DEF/ARQ). Delanteros y extremos arriba de todo (los extremos
// modernos cortan hacia adentro y rematan casi tanto como el 9), el
// enganche (MCO) mete bastante menos pero no es raro, el resto de
// mediocampistas y laterales rara vez, centrales sólo de cabezazo en
// pelota parada, arquero casi nunca.
const PESO_GOLEADOR: Record<Posicion, number> = {
  DEL: 10, EI: 6.5, ED: 6.5, MCO: 4, MC: 1.8, MCD: 0.8, DFC: 0.9, LI: 0.7, LD: 0.7, ARQ: 0.05,
};

// Peso para ser el ASISTIDOR — el enganche (MCO) es el que más asiste
// (esa es literalmente su función), seguido de cerca por el mediocampista
// central y los extremos (centro/último pase); los laterales suman con el
// centro tras la tapada por afuera; el central casi no asiste salvo algún
// pelotazo largo o cabezazo de "cabeza a cabeza" en un córner; el arquero
// casi nunca salvo algún saque largo directo a gol.
const PESO_ASISTENCIA: Record<Posicion, number> = {
  MCO: 11, MC: 8, EI: 7.5, ED: 7.5, DEL: 4.5, LI: 6, LD: 6, MCD: 3.5, DFC: 2, ARQ: 0.3,
};

// No todos los goles tienen un asistidor limpio (rebote, gambeta en
// soledad, penal, tiro libre directo) — el resto queda sin asistencia.
const PROB_CON_ASISTENCIA = 0.78;

// Sorteo ponderado: peso de la posición del jugador, escalado por el nivel
// real del jugador — mitad grl, mitad el sub-stat relevante a la jugada
// (tiro para goleador, pase para asistidor — ver sub-stats-diseno.md
// sección 7.1). Antes sólo pesaba grl/70; ahora un DEL de grl 78 con tiro
// 90 mete más que un DEL de grl 82 con tiro 68, aunque el segundo sea
// "mejor jugador" en general. Fallback a grl si el jugador no tiene
// subStats (arquero, o save viejo sin el campo).
function elegirPonderado(
  candidatos: Jugador[],
  pesos: Record<Posicion, number>,
  subStatKey: keyof SubStats,
  excluirId?: string,
): Jugador | null {
  const disponibles = excluirId ? candidatos.filter((j) => j.id !== excluirId) : candidatos;
  if (disponibles.length === 0) return null;

  const pesados = disponibles.map((j) => {
    const subStat = j.subStats?.[subStatKey] ?? j.grl;
    const nivel = (j.grl * 0.5 + subStat * 0.5) / 70;
    return { jugador: j, peso: pesos[j.posicion] * nivel };
  });
  const total = pesados.reduce((acc, p) => acc + p.peso, 0);
  if (total <= 0) return disponibles[Math.floor(Math.random() * disponibles.length)];

  let r = randomUniforme(0, total);
  for (const p of pesados) {
    r -= p.peso;
    if (r <= 0) return p.jugador;
  }
  return pesados[pesados.length - 1].jugador;
}

// Quién ya estaba AFUERA de la cancha (expulsado o sustituido) en cada
// gol de juego abierto — el 11 titular original que recibe atribuirGoleadores
// no se entera de expulsiones/cambios ocurridos durante el partido, así
// que sin esto el sorteo podía elegir como goleador/asistidor a alguien
// que ya no estaba en cancha en ese minuto (gap real, chico pero posible:
// tarjeta roja o cambio antes de un gol de juego abierto posterior).
// `eventos` es la secuencia completa de partido.ts (superset de
// eventosGol, mismo orden de ejecución) — se recorre una sola vez
// llevando el set de excluidos de cada equipo y se saca una foto de ese
// set justo en cada evento 'gol' (penal/falta incluidos, aunque esos no
// la usan porque ya vienen con jugadorId resuelto) para que el índice
// coincida 1 a 1 con eventosGol, que sale del mismo filter().
function exclusionesPorGol(eventos: EventoPartido[]): Array<{ local: Set<string>; visitante: Set<string> }> {
  const afueraLocal = new Set<string>();
  const afueraVisitante = new Set<string>();
  const fotos: Array<{ local: Set<string>; visitante: Set<string> }> = [];

  eventos.forEach((evento) => {
    if ((evento.tipo === 'tarjeta_roja' || evento.tipo === 'cambio') && evento.jugadorId) {
      const afuera = evento.equipo === 'local' ? afueraLocal : afueraVisitante;
      afuera.add(evento.jugadorId);
    } else if (evento.tipo === 'gol') {
      fotos.push({ local: new Set(afueraLocal), visitante: new Set(afueraVisitante) });
    }
  });

  return fotos;
}

// A partir de los eventos de gol que devuelve partido.ts, les asigna
// jugador real usando los titulares de cada equipo en ESTE partido
// puntual. Los goles de penal/falta ya vienen con jugadorId puesto (el
// pateador de mejor tiro, elegido en partido.ts vía elegirPateador) — ahí
// no hay lotería ni asistencia (un gol de pelota parada no tiene
// asistidor real). Sólo los goles de juego abierto (jugadorId vacío)
// siguen resolviéndose con el sorteo ponderado de siempre, excluyendo del
// sorteo a quien ya esté expulsado o afuera por cambio en ese momento del
// partido (ver exclusionesPorGol). `eventos` es opcional (default []) para
// no romper callers/tests viejos que sólo pasan eventosGol — sin él,
// simplemente no hay exclusión, igual que antes.
export function atribuirGoleadores(
  eventosGol: EventoGolPartido[],
  titularesLocal: Jugador[],
  titularesVisitante: Jugador[],
  eventos: EventoPartido[] = [],
): GolPartido[] {
  const fotos = exclusionesPorGol(eventos);

  return eventosGol
    .map((evento, indice): GolPartido | null => {
      if (evento.jugadorId) {
        return {
          equipo: evento.equipo,
          jugadorId: evento.jugadorId,
          minuto: evento.minuto,
          origen: evento.origen,
          minutoAgregado: evento.minutoAgregado,
        };
      }

      const titularesOriginales = evento.equipo === 'local' ? titularesLocal : titularesVisitante;
      const afuera = evento.equipo === 'local' ? fotos[indice]?.local : fotos[indice]?.visitante;
      const disponibles = afuera ? titularesOriginales.filter((j) => !afuera.has(j.id)) : titularesOriginales;
      // Si por algún motivo la exclusión dejara la lista vacía (no debería
      // pasar con 11 titulares y a lo sumo un puñado de bajas), mejor
      // atribuir el gol igual con el 11 original que perder la estadística.
      const titulares = disponibles.length > 0 ? disponibles : titularesOriginales;

      const goleador = elegirPonderado(titulares, PESO_GOLEADOR, 'tiro');
      if (!goleador) return null; // plantel sin titulares cargados (no debería pasar en partido real)

      const asistidor = Math.random() < PROB_CON_ASISTENCIA
        ? elegirPonderado(titulares, PESO_ASISTENCIA, 'pase', goleador.id)
        : null;

      return {
        equipo: evento.equipo,
        jugadorId: goleador.id,
        asistenciaId: asistidor?.id,
        minuto: evento.minuto,
        minutoAgregado: evento.minutoAgregado,
      };
    })
    .filter((g): g is GolPartido => g != null);
}

// Después de simular una fecha: suma un partido jugado (pj) a todo
// titular que jugó, y gol/asistencia a quien corresponda según
// partido.goles. Sólo toca a los clubes de los partidos pasados —
// jugadores de clubes que no jugaron esa fecha (o no fueron titulares)
// quedan iguales.
export function aplicarEstadisticasPostFecha(
  clubes: Record<string, Club>,
  partidosJugados: Partido[],
): Record<string, Club> {
  const resultado = { ...clubes };

  partidosJugados.forEach((partido) => {
    (['local', 'visitante'] as const).forEach((equipo) => {
      const clubId = equipo === 'local' ? partido.localId : partido.visitanteId;
      const club = resultado[clubId];
      if (!club) return;

      const titularesSet = new Set(club.titularesIds);
      const golesDeEsteEquipo = (partido.goles ?? []).filter((g) => g.equipo === equipo);
      if (!titularesSet.size) return;

      const plantel = club.plantel.map((j) => {
        if (!titularesSet.has(j.id)) return j;
        let { pj, goles, asistencias } = j.estadisticasTemporada;
        pj += 1;
        golesDeEsteEquipo.forEach((g) => {
          if (g.jugadorId === j.id) goles += 1;
          if (g.asistenciaId === j.id) asistencias += 1;
        });
        return { ...j, estadisticasTemporada: { pj, goles, asistencias } };
      });
      resultado[clubId] = { ...club, plantel };
    });
  });

  return resultado;
}

// -------------------- tabla de goleadores/asistidores --------------------

export interface FilaGoleador {
  jugadorId: string;
  nombre: string;
  clubId: string;
  clubNombre: string;
  pj: number;
  goles: number;
  asistencias: number;
}

// Junta estadisticasTemporada de TODO el plantel de la liga (no sólo
// titulares actuales — un jugador que hizo goles y después perdió el
// puesto sigue apareciendo) en una sola tabla ordenada por goles, y por
// asistencias como desempate. Sólo incluye a quien ya sumó algo esta
// temporada (pj > 0) — que un plantel de 26 nunca ensucie la tabla con
// ceros.
export function tablaGoleadores(clubes: Record<string, Club>, clubIds: string[]): FilaGoleador[] {
  const filas: FilaGoleador[] = [];
  clubIds.forEach((clubId) => {
    const club = clubes[clubId];
    if (!club) return;
    club.plantel.forEach((j) => {
      if (j.estadisticasTemporada.pj === 0) return;
      filas.push({
        jugadorId: j.id,
        nombre: j.nombre,
        clubId,
        clubNombre: club.nombre,
        pj: j.estadisticasTemporada.pj,
        goles: j.estadisticasTemporada.goles,
        asistencias: j.estadisticasTemporada.asistencias,
      });
    });
  });
  return filas.sort((a, b) => b.goles - a.goles || b.asistencias - a.asistencias);
}
