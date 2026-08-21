// Copa Libertadores y Copa Sudamericana (CONMEBOL) — prompt-copas-manager-app.md,
// formato real: 32 equipos, 8 grupos de 4 ida y vuelta. Los 2 primeros de
// cada grupo de Libertadores pasan a octavos; el 3° de cada grupo
// "desciende" a la Sudamericana. En Sudamericana sólo el 1° de cada grupo
// pasa directo a octavos — los 2dos juegan un playoff de acceso (ida y
// vuelta) contra los que bajaron de Libertadores. De ahí en más,
// eliminación directa ida y vuelta (eliminatoria.ts) hasta una final a
// partido único en sede neutral.
//
// Simplificaciones documentadas:
// - El usuario sólo juega UNA de las dos copas por temporada (la que le
//   corresponda según su posición en la liga doméstica — ver
//   competicionesConfig.ts). En el reglamento real, el 3° de grupo de
//   Libertadores continúa en la Sudamericana — acá no: si el club del
//   usuario no clasifica dentro de SU copa, queda eliminado ahí nomás
//   (no se modela el salto de competencia a mitad de camino).
// - La copa que el usuario NO juega no se simula completa (sería correr
//   una competencia entera que no le toca) — sólo se generan los 8
//   clubes livianos que le "ceden" rivales al playoff de acceso de
//   Sudamericana.
// - Esos clubes (y los 31 rivales del torneo que sí se juega) salen de
//   Liga Profesional + Brasileirão + el pool "Otros CONMEBOL" (el resto
//   de las ligas sudamericanas, sin modelar en detalle) — mismo criterio
//   que ya usa copaInternacional.ts.

import type { Club } from '../types';
import { CLUBES_LIGA_PROFESIONAL, type ClubBase } from '../data/clubesLigaProfesional';
import { CLUBES_BRASILEIRAO } from '../data/clubesBrasileirao';
import { CLUBES_OTROS_CONMEBOL } from '../data/clubesOtrosConmebol';
import { generarClub } from './liga';
import { generarNombreJugador } from './nombres';
import { elegirVariosAlAzar } from './random';
import { paisDeLiga } from '../data/ligas';
import {
  armarGrupos, simularProximaFechaDeGrupos, tablaDeGrupo, todosLosGruposTerminados, type Grupo,
} from './faseDeGrupos';
import {
  armarLlave, armarSiguienteRonda, simularLlave, type Llave,
} from './eliminatoria';

const EQUIPOS_POR_TORNEO = 32;

interface ClubConLiga { club: ClubBase; nombreLiga: string }

function poolConmebol(): ClubConLiga[] {
  return [
    ...CLUBES_LIGA_PROFESIONAL.map((club) => ({ club, nombreLiga: 'Liga Profesional' })),
    ...CLUBES_BRASILEIRAO.map((club) => ({ club, nombreLiga: 'Brasileirão Série A' })),
    ...CLUBES_OTROS_CONMEBOL.map((club) => ({ club, nombreLiga: 'Otros CONMEBOL' })),
  ];
}

function generarClubDePool({ club, nombreLiga }: ClubConLiga): Club {
  return generarClub(club, {
    liga: nombreLiga, esControladoPorUsuario: false, nombreDT: generarNombreJugador(club.pais ?? paisDeLiga(nombreLiga) ?? undefined),
  });
}

export interface TorneoConmebol {
  tipo: 'libertadores' | 'sudamericana';
  temporada: number;
  clubUsuarioId: string;
  clubIds: string[]; // 32 del torneo real
  clubes: Record<string, Club>; // 32 reales + hasta 8 livianos del cruce
  grupos: Grupo[];
  // Pedido explícito ("si te eliminan de una copa esta se deja de
  // simular"): antes 'eliminado' era una fase TERMINAL — en cuanto el
  // club del usuario no clasificaba, el torneo entero dejaba de armar
  // rondas nuevas, aunque en la realidad el resto de los 31 clubes siguen
  // jugando hasta que hay un campeón (eso define quién entra a la próxima
  // Mundial de Clubes, etc.). Ahora `fase` sigue avanzando SIEMPRE
  // (grupos -> playoff-acceso -> knockout -> campeon) sin importar si el
  // usuario sigue adentro; `usuarioEliminado` es la bandera aparte que
  // marca el momento en que salió, para que la pantalla pueda mostrar
  // "quedamos eliminados" sin frenar el resto del torneo.
  fase: 'grupos' | 'playoff-acceso' | 'knockout' | 'campeon';
  usuarioEliminado: boolean;
  playoffAcceso: Llave[]; // sólo tipo === 'sudamericana'
  bracket: { nombre: string; llaves: Llave[] }[];
  campeonId: string | null;
}

export function generarTorneoConmebol(
  tipo: 'libertadores' | 'sudamericana',
  clubUsuario: Club,
  temporada: number,
): TorneoConmebol {
  const pool = poolConmebol().filter(({ club }) => club.id !== clubUsuario.id);
  const elegidos = elegirVariosAlAzar(pool, EQUIPOS_POR_TORNEO - 1);
  const clubes: Record<string, Club> = { [clubUsuario.id]: clubUsuario };
  elegidos.forEach((c) => { const generado = generarClubDePool(c); clubes[generado.id] = generado; });

  const clubIds = Object.keys(clubes);
  return {
    tipo,
    temporada,
    clubUsuarioId: clubUsuario.id,
    clubIds,
    clubes,
    grupos: armarGrupos(clubIds),
    fase: 'grupos',
    usuarioEliminado: false,
    playoffAcceso: [],
    bracket: [],
    campeonId: null,
  };
}

function armarKnockoutLibertadores(torneo: TorneoConmebol): TorneoConmebol {
  const clasificados: string[] = [];
  torneo.grupos.forEach((g) => {
    const tabla = tablaDeGrupo(g);
    clasificados.push(tabla[0].clubId, tabla[1].clubId);
  });

  const usuarioEliminado = torneo.usuarioEliminado || !clasificados.includes(torneo.clubUsuarioId);

  const mezclados = [...clasificados].sort(() => Math.random() - 0.5);
  const llaves: Llave[] = [];
  for (let i = 0; i < mezclados.length; i += 2) {
    llaves.push(armarLlave('Octavos de final', mezclados[i], mezclados[i + 1], false));
  }
  return { ...torneo, fase: 'knockout', usuarioEliminado, bracket: [{ nombre: 'Octavos de final', llaves }] };
}

function armarPlayoffAccesoSudamericana(torneo: TorneoConmebol): TorneoConmebol {
  const directos = torneo.grupos.map((g) => tablaDeGrupo(g)[0].clubId);
  const segundos = torneo.grupos.map((g) => tablaDeGrupo(g)[1].clubId);

  const usuarioEliminado = torneo.usuarioEliminado
    || (!directos.includes(torneo.clubUsuarioId) && !segundos.includes(torneo.clubUsuarioId));

  const idsExistentes = new Set(Object.keys(torneo.clubes));
  const livianos = elegirVariosAlAzar(
    poolConmebol().filter(({ club }) => !idsExistentes.has(club.id)),
    8,
  ).map(generarClubDePool);

  const clubes = { ...torneo.clubes };
  livianos.forEach((c) => { clubes[c.id] = c; });

  const mezclados = [...segundos].sort(() => Math.random() - 0.5);
  const playoffAcceso = mezclados.map((id, i) => armarLlave('Playoff de acceso', id, livianos[i].id, false));

  return { ...torneo, clubes, fase: 'playoff-acceso', usuarioEliminado, playoffAcceso };
}

// Simula la próxima fecha pendiente de TODOS los grupos a la vez (8
// grupos, 6 fechas cada uno). Al terminar la última, arma automáticamente
// el arranque de la siguiente fase (playoff de acceso o directo a
// octavos, según tipo) — o marca 'eliminado' si el club del usuario no
// clasificó dentro de su propia copa.
export function simularProximaFechaGruposConmebol(torneo: TorneoConmebol): TorneoConmebol {
  if (torneo.fase !== 'grupos') return torneo;
  const grupos = simularProximaFechaDeGrupos(torneo.grupos, torneo.clubes, torneo.clubUsuarioId);
  if (!todosLosGruposTerminados(grupos)) {
    return { ...torneo, grupos };
  }
  const torneoConGruposTerminados = { ...torneo, grupos };
  return torneo.tipo === 'libertadores'
    ? armarKnockoutLibertadores(torneoConGruposTerminados)
    : armarPlayoffAccesoSudamericana(torneoConGruposTerminados);
}

// Resuelve TODO lo que quede pendiente de la etapa actual — el playoff de
// acceso completo, o la ronda de knockout completa — y arma la
// siguiente. Mismo patrón que copaNacional.ts (las llaves acá son a lo
// sumo 2 partidos, no hace falta pausa dentro de una ronda).
export function simularProximaEtapaConmebol(torneo: TorneoConmebol): TorneoConmebol {
  if (torneo.fase === 'playoff-acceso') {
    const llavesJugadas = torneo.playoffAcceso.map((l) => simularLlave(l, torneo.clubes));
    const ganadoresPlayoff = llavesJugadas.map((l) => l.ganadorId!).filter(Boolean);
    const directos = torneo.grupos.map((g) => tablaDeGrupo(g)[0].clubId);
    const clasificados = [...directos, ...ganadoresPlayoff];
    const usuarioEliminado = torneo.usuarioEliminado || !clasificados.includes(torneo.clubUsuarioId);

    const mezclados = [...clasificados].sort(() => Math.random() - 0.5);
    const llaves: Llave[] = [];
    for (let i = 0; i < mezclados.length; i += 2) {
      llaves.push(armarLlave('Octavos de final', mezclados[i], mezclados[i + 1], false));
    }
    return {
      ...torneo, playoffAcceso: llavesJugadas, fase: 'knockout', usuarioEliminado, bracket: [{ nombre: 'Octavos de final', llaves }],
    };
  }

  if (torneo.fase === 'knockout') {
    const rondaActual = torneo.bracket[torneo.bracket.length - 1];
    const llavesJugadas = rondaActual.llaves.map((l) => simularLlave(l, torneo.clubes));
    const bracket = [...torneo.bracket.slice(0, -1), { ...rondaActual, llaves: llavesJugadas }];
    const ganadores = llavesJugadas.map((l) => l.ganadorId!).filter(Boolean);
    const usuarioEliminado = torneo.usuarioEliminado || !ganadores.includes(torneo.clubUsuarioId);

    if (llavesJugadas.length === 1) {
      // Esa llave jugada YA era la final.
      return { ...torneo, bracket, usuarioEliminado, fase: 'campeon', campeonId: llavesJugadas[0].ganadorId };
    }

    const esProximaLaFinal = llavesJugadas.length === 2;
    const { llaves: nuevasLlaves, nombreRonda } = armarSiguienteRonda(llavesJugadas, [], esProximaLaFinal);
    return { ...torneo, bracket: [...bracket, { nombre: nombreRonda!, llaves: nuevasLlaves }], usuarioEliminado };
  }

  return torneo;
}
