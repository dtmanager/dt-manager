// UEFA Champions League, Europa League y Conference League —
// prompt-copas-manager-app.md, formato liga suiza vigente desde 2024-25:
// 36 equipos, cada uno juega 8 partidos de fase de liga (ligaSuiza.ts),
// una única tabla. Puestos 1-8 pasan directo a octavos. Puestos 9-24
// juegan un playoff de acceso ida y vuelta (mejor vs. peor de la banda:
// 9no vs 24to, 10mo vs 23ro, ..., hasta completar los otros 8 cupos de
// octavos). Puestos 25+ quedan eliminados de esa copa — a diferencia de
// Libertadores/Sudamericana, acá no hay "efecto cascada" a la copa de
// abajo. De ahí en más, eliminación directa ida y vuelta (eliminatoria.ts)
// hasta una final a partido único en sede neutral.
//
// Cupos por liga doméstica en competicionesConfig.ts (CUPOS_CONTINENTALES_POR_LIGA).
// Premier League/LaLiga/Serie A/Bundesliga/Ligue 1 y, ahora, las 5 ligas
// "chicas" (Eredivisie, Bélgica, Portugal, Turquía, Escocia) tienen cupos
// reales asignados — el resto de los 36 cupos de cada copa se completa con
// clubes de esas mismas ligas chicas + el pool "Otras ligas de Europa",
// elegidos al azar (simplificación explícita, permitida en el prompt: nada
// de coeficientes UEFA reales).

import type { Club } from '../types';
import type { ClubBase } from '../data/clubesLigaProfesional';
import { CLUBES_PREMIER_LEAGUE } from '../data/clubesPremierLeague';
import { CLUBES_LALIGA } from '../data/clubesLaLiga';
import { CLUBES_SERIE_A } from '../data/clubesSerieA';
import { CLUBES_BUNDESLIGA } from '../data/clubesBundesliga';
import { CLUBES_LIGUE_1 } from '../data/clubesLigue1';
import { CLUBES_EREDIVISIE } from '../data/clubesEredivisie';
import { CLUBES_PRO_LEAGUE_BELGICA } from '../data/clubesProLeagueBelgica';
import { CLUBES_PRIMEIRA_LIGA_PORTUGAL } from '../data/clubesPrimeiraLigaPortugal';
import { CLUBES_SUPER_LIG_TURQUIA } from '../data/clubesSuperLigTurquia';
import { CLUBES_PREMIERSHIP_ESCOCIA } from '../data/clubesPremiershipEscocia';
import { CLUBES_OTRAS_LIGAS_EUROPA } from '../data/clubesOtrasLigasEuropa';
import { generarClub } from './liga';
import { generarNombreJugador } from './nombres';
import { elegirVariosAlAzar } from './random';
import { paisDeLiga } from '../data/ligas';
import { proximaFechaSinJugar } from './fixture';
import {
  armarFaseLigaSuiza, simularProximaFechaSuiza, tablaSuiza,
} from './ligaSuiza';
import {
  armarLlave, armarSiguienteRonda, simularLlave, type Llave,
} from './eliminatoria';
import { clasificacionDeTodasLasLigas, clubesEnRango } from './clasificacionLigas';
import type { FilaEstadistica } from './tablaEstadistica';
import { cuposContinentalesDeLiga } from './competicionesConfig';

export type TipoCopaUefa = 'champions' | 'europa' | 'conference';

const NOMBRE_COPA: Record<TipoCopaUefa, string> = {
  champions: 'UEFA Champions League',
  europa: 'UEFA Europa League',
  conference: 'UEFA Conference League',
};

const EQUIPOS_POR_COMPETICION = 36;
const DIRECTOS_A_OCTAVOS = 8;
const BANDA_PLAYOFF = 16; // puestos 9 a 24

interface ClubConLiga { club: ClubBase; nombreLiga: string }

function clubesDeLigasGrandes(): ClubConLiga[] {
  return [
    ...CLUBES_PREMIER_LEAGUE.map((club) => ({ club, nombreLiga: 'Premier League' })),
    ...CLUBES_LALIGA.map((club) => ({ club, nombreLiga: 'LaLiga' })),
    ...CLUBES_SERIE_A.map((club) => ({ club, nombreLiga: 'Serie A' })),
    ...CLUBES_BUNDESLIGA.map((club) => ({ club, nombreLiga: 'Bundesliga' })),
    ...CLUBES_LIGUE_1.map((club) => ({ club, nombreLiga: 'Ligue 1' })),
  ];
}

function poolRelleno(): ClubConLiga[] {
  return [
    ...CLUBES_EREDIVISIE.map((club) => ({ club, nombreLiga: 'Eredivisie' })),
    ...CLUBES_PRO_LEAGUE_BELGICA.map((club) => ({ club, nombreLiga: 'Pro League' })),
    ...CLUBES_PRIMEIRA_LIGA_PORTUGAL.map((club) => ({ club, nombreLiga: 'Primeira Liga' })),
    ...CLUBES_SUPER_LIG_TURQUIA.map((club) => ({ club, nombreLiga: 'Süper Lig' })),
    ...CLUBES_PREMIERSHIP_ESCOCIA.map((club) => ({ club, nombreLiga: 'Premiership' })),
    ...CLUBES_OTRAS_LIGAS_EUROPA.map((club) => ({ club, nombreLiga: 'Otras ligas de Europa' })),
  ];
}

// Usado para resolver los ids clasificados vía cupos (línea ~130 más abajo):
// tiene que incluir TODAS las ligas que puedan tener cupos configurados en
// CUPOS_CONTINENTALES_POR_LIGA, no sólo las 5 grandes — si no, un club
// clasificado de una liga chica (ej. 2do de Eredivisie) nunca se encuentra
// acá, su id queda sin resolver y esa plaza se rellena con un club al azar
// del pool en vez del clasificado real. Bug encontrado al agregar cupos
// para Eredivisie/Bélgica/Portugal/Turquía/Escocia (pedido explícito:
// "trofeos que faltan") — hasta entonces sólo las 5 grandes tenían cupos,
// así que nunca hacía falta buscar acá.
function clubesPosiblesParaClasificados(): ClubConLiga[] {
  return [...clubesDeLigasGrandes(), ...poolRelleno()];
}

function generarClubDePool({ club, nombreLiga }: ClubConLiga): Club {
  return generarClub(club, {
    liga: nombreLiga, esControladoPorUsuario: false, nombreDT: generarNombreJugador(club.pais ?? paisDeLiga(nombreLiga) ?? undefined),
  });
}

export interface CompeticionSuiza {
  tipo: TipoCopaUefa;
  nombre: string;
  temporada: number;
  clubUsuarioId: string;
  clubIds: string[]; // 36
  clubes: Record<string, Club>;
  fixtureFaseLiga: import('../types').Partido[];
  // Ver el comentario grande equivalente en libertadoresYSudamericana.ts
  // ("SEGUNDA CORRECCIÓN" / pedido explícito: "si te eliminan de una copa
  // esta se deja de simular") — `fase` ya no tiene un valor terminal
  // 'eliminado' que frena el torneo; sigue avanzando siempre y
  // `usuarioEliminado` es la bandera aparte.
  fase: 'fase-liga' | 'playoff-acceso' | 'knockout' | 'campeon';
  usuarioEliminado: boolean;
  playoffAcceso: Llave[];
  bracket: { nombre: string; llaves: Llave[] }[];
  campeonId: string | null;
}

// nombreLigaUsuario/tablaRealUsuario: para que la liga del usuario use su
// tabla REAL (ya jugada) en vez de que clasificacionDeTodasLasLigas la
// estime — ver clasificacionLigas.ts.
export function generarCompeticionSuiza(
  tipo: TipoCopaUefa,
  clubUsuario: Club,
  nombreLigaUsuario: string,
  tablaRealUsuario: FilaEstadistica[] | undefined,
  temporada: number,
): CompeticionSuiza {
  const clasificacion = clasificacionDeTodasLasLigas(nombreLigaUsuario, tablaRealUsuario);
  const clubesPosibles = clubesPosiblesParaClasificados();

  const idsClasificados = new Set<string>();
  clasificacion.forEach((c) => {
    const cupos = cuposContinentalesDeLiga(c.nombreLiga);
    const rango = cupos?.[tipo];
    if (!rango) return;
    clubesEnRango(clasificacion, c.nombreLiga, rango[0], rango[1]).forEach((id) => idsClasificados.add(id));
  });

  const clubes: Record<string, Club> = { [clubUsuario.id]: clubUsuario };
  idsClasificados.forEach((id) => {
    if (id === clubUsuario.id || clubes[id]) return;
    const encontrado = clubesPosibles.find(({ club }) => club.id === id);
    if (encontrado) clubes[id] = generarClubDePool(encontrado);
  });

  const idsExistentes = new Set(Object.keys(clubes));
  const faltan = EQUIPOS_POR_COMPETICION - Object.keys(clubes).length;
  if (faltan > 0) {
    const relleno = elegirVariosAlAzar(poolRelleno().filter(({ club }) => !idsExistentes.has(club.id)), faltan);
    relleno.forEach((c) => { const generado = generarClubDePool(c); clubes[generado.id] = generado; });
  }

  const clubIds = Object.keys(clubes);
  return {
    tipo,
    nombre: NOMBRE_COPA[tipo],
    temporada,
    clubUsuarioId: clubUsuario.id,
    clubIds,
    clubes,
    fixtureFaseLiga: armarFaseLigaSuiza(clubes),
    fase: 'fase-liga',
    usuarioEliminado: false,
    playoffAcceso: [],
    bracket: [],
    campeonId: null,
  };
}

function armarPlayoffAcceso(competicion: CompeticionSuiza): CompeticionSuiza {
  const tabla = tablaSuiza(competicion.fixtureFaseLiga, competicion.clubIds);
  const directos = tabla.slice(0, DIRECTOS_A_OCTAVOS).map((f) => f.clubId);
  const banda = tabla.slice(DIRECTOS_A_OCTAVOS, DIRECTOS_A_OCTAVOS + BANDA_PLAYOFF).map((f) => f.clubId);

  const usuarioEliminado = competicion.usuarioEliminado
    || (!directos.includes(competicion.clubUsuarioId) && !banda.includes(competicion.clubUsuarioId));

  // Mejor vs. peor de la banda: 9no vs 24to, 10mo vs 23ro, ...
  const llaves: Llave[] = [];
  for (let i = 0; i < banda.length / 2; i += 1) {
    llaves.push(armarLlave('Playoff de acceso', banda[i], banda[banda.length - 1 - i], false));
  }
  return { ...competicion, fase: 'playoff-acceso', usuarioEliminado, playoffAcceso: llaves };
}

// Simula la próxima fecha pendiente de la fase de liga (8 en total). Al
// terminar la última, arma automáticamente el playoff de acceso (o marca
// 'eliminado' si el club del usuario terminó 25° o peor).
export function simularProximaFechaSuizaCompeticion(competicion: CompeticionSuiza): CompeticionSuiza {
  if (competicion.fase !== 'fase-liga') return competicion;
  const fixtureFaseLiga = simularProximaFechaSuiza(competicion.fixtureFaseLiga, competicion.clubes, competicion.clubUsuarioId);
  if (proximaFechaSinJugar(fixtureFaseLiga) != null) {
    return { ...competicion, fixtureFaseLiga };
  }
  return armarPlayoffAcceso({ ...competicion, fixtureFaseLiga });
}

// Resuelve TODO lo que quede pendiente de la etapa actual — el playoff de
// acceso completo, o la ronda de knockout completa — y arma la
// siguiente. Mismo patrón que copaNacional.ts / libertadoresYSudamericana.ts.
export function simularProximaEtapaSuizaCompeticion(competicion: CompeticionSuiza): CompeticionSuiza {
  if (competicion.fase === 'playoff-acceso') {
    const llavesJugadas = competicion.playoffAcceso.map((l) => simularLlave(l, competicion.clubes));
    const ganadoresPlayoff = llavesJugadas.map((l) => l.ganadorId!).filter(Boolean);
    const directos = tablaSuiza(competicion.fixtureFaseLiga, competicion.clubIds)
      .slice(0, DIRECTOS_A_OCTAVOS)
      .map((f) => f.clubId);
    const clasificados = [...directos, ...ganadoresPlayoff];
    const usuarioEliminado = competicion.usuarioEliminado || !clasificados.includes(competicion.clubUsuarioId);

    const mezclados = [...clasificados].sort(() => Math.random() - 0.5);
    const llaves: Llave[] = [];
    for (let i = 0; i < mezclados.length; i += 2) {
      llaves.push(armarLlave('Octavos de final', mezclados[i], mezclados[i + 1], false));
    }
    return {
      ...competicion, playoffAcceso: llavesJugadas, fase: 'knockout', usuarioEliminado, bracket: [{ nombre: 'Octavos de final', llaves }],
    };
  }

  if (competicion.fase === 'knockout') {
    const rondaActual = competicion.bracket[competicion.bracket.length - 1];
    const llavesJugadas = rondaActual.llaves.map((l) => simularLlave(l, competicion.clubes));
    const bracket = [...competicion.bracket.slice(0, -1), { ...rondaActual, llaves: llavesJugadas }];
    const ganadores = llavesJugadas.map((l) => l.ganadorId!).filter(Boolean);
    const usuarioEliminado = competicion.usuarioEliminado || !ganadores.includes(competicion.clubUsuarioId);

    if (llavesJugadas.length === 1) {
      return { ...competicion, bracket, usuarioEliminado, fase: 'campeon', campeonId: llavesJugadas[0].ganadorId };
    }

    const esProximaLaFinal = llavesJugadas.length === 2;
    const { llaves: nuevasLlaves, nombreRonda } = armarSiguienteRonda(llavesJugadas, [], esProximaLaFinal);
    return { ...competicion, bracket: [...bracket, { nombre: nombreRonda!, llaves: nuevasLlaves }], usuarioEliminado };
  }

  return competicion;
}
