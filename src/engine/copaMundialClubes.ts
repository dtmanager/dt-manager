// Copa Mundial de Clubes de la FIFA (pedido explícito: reemplaza a la
// vieja "Copa Internacional" — grupo de 4 + final — por el formato real
// vigente desde 2025: 32 equipos, 8 grupos de 4 a una sola rueda (no ida
// y vuelta, a diferencia de Libertadores/Sudamericana), los 2 primeros de
// cada grupo pasan a un cuadro de eliminación directa a partido único
// (16 clasificados = octavos de final) hasta la final.
//
// Simplificación documentada: la clasificación real depende de resultados
// continentales de los últimos 4 años (campeones de Champions/Libertadores
// de cada edición, ranking, etc.) — datos que este juego no tiene. Acá se
// arma el bombo con los campeones (reales o estimados por tabla
// estadística — ver clasificacionLigas.ts) de todas las ligas domésticas
// de primera división ya cargadas, más relleno de clubes de los pools de
// referencia hasta completar 32. El club del usuario entra si clasificó
// (mismo criterio que la vieja Copa Internacional: terminar entre los 4
// primeros de su liga doméstica esa temporada).

import type { Club } from '../types';
import type { ClubBase } from '../data/clubesLigaProfesional';
import { LIGAS, paisDeLiga } from '../data/ligas';
import { CLUBES_OTROS_CONMEBOL } from '../data/clubesOtrosConmebol';
import { CLUBES_OTRAS_LIGAS_EUROPA } from '../data/clubesOtrasLigasEuropa';
import { CLUBES_SIN_LIGA_FIFA } from '../data/clubesSinLigaFifa';
import { ligaSuperiorDe } from './competicionesConfig';
import { clasificacionDeTodasLasLigas } from './clasificacionLigas';
import type { FilaEstadistica } from './tablaEstadistica';
import { generarClub } from './liga';
import { generarNombreJugador } from './nombres';
import { elegirVariosAlAzar } from './random';
import {
  armarGruposSimple, simularProximaFechaDeGrupos, tablaDeGrupo, todosLosGruposTerminados, type Grupo,
} from './faseDeGrupos';
import {
  armarLlave, armarSiguienteRonda, simularLlave, type Llave,
} from './eliminatoria';

const EQUIPOS_TOTAL = 32;
const POSICIONES_QUE_CLASIFICAN = 4;

// tablaFinal viene de calcularTabla (ya ordenada), 0-indexed.
export function clasificaParaCopa(posicionEnTabla: number): boolean {
  return posicionEnTabla >= 0 && posicionEnTabla < POSICIONES_QUE_CLASIFICAN;
}

interface ClubConLiga { club: ClubBase; nombreLiga: string }

function generarClubDePool({ club, nombreLiga }: ClubConLiga): Club {
  return generarClub(club, {
    liga: nombreLiga, esControladoPorUsuario: false, nombreDT: generarNombreJugador(club.pais ?? paisDeLiga(nombreLiga) ?? undefined),
  });
}

// Campeón (real o estimado) de cada liga de PRIMERA división ya cargada —
// se excluyen las 6 segundas divisiones (ligaSuperiorDe != null) porque en
// la realidad tampoco mandan representante directo a este torneo.
function campeonesDeLigasCargadas(
  nombreLigaUsuario: string,
  tablaLigaUsuario: FilaEstadistica[] | undefined,
  clubUsuarioId: string,
): ClubConLiga[] {
  const clasificacion = clasificacionDeTodasLasLigas(nombreLigaUsuario, tablaLigaUsuario);
  const resultado: ClubConLiga[] = [];
  LIGAS.forEach((liga) => {
    if (!liga.disponible || ligaSuperiorDe(liga.nombre) != null) return;
    const campeonId = clasificacion.find((c) => c.nombreLiga === liga.nombre)?.tabla[0]?.clubId;
    if (!campeonId || campeonId === clubUsuarioId) return;
    const base = liga.clubes.find((c) => c.id === campeonId);
    if (base) resultado.push({ club: base, nombreLiga: liga.nombre });
  });
  return resultado;
}

// Relleno hasta 32: cualquier otro club de las ligas cargadas + los 3
// pools de referencia (Otros CONMEBOL / Otras ligas de Europa / Clubes
// sin liga en FIFA) — mismo criterio ya usado en las copas continentales.
function poolRelleno(): ClubConLiga[] {
  return [
    ...LIGAS.filter((l) => l.disponible).flatMap((l) => l.clubes.map((club) => ({ club, nombreLiga: l.nombre }))),
    ...CLUBES_OTROS_CONMEBOL.map((club) => ({ club, nombreLiga: 'Otros CONMEBOL' })),
    ...CLUBES_OTRAS_LIGAS_EUROPA.map((club) => ({ club, nombreLiga: 'Otras ligas de Europa' })),
    ...CLUBES_SIN_LIGA_FIFA.map((club) => ({ club, nombreLiga: 'Clubes sin liga en FIFA' })),
  ];
}

export interface CopaMundialClubes {
  temporada: number;
  clubUsuarioId: string;
  clubIds: string[]; // 32
  clubes: Record<string, Club>;
  grupos: Grupo[]; // 8 grupos de 4, a una sola rueda
  // Ver el comentario grande equivalente en libertadoresYSudamericana.ts
  // (pedido explícito: "si te eliminan de una copa esta se deja de
  // simular") — sin fase terminal 'eliminado'; `usuarioEliminado` es la
  // bandera aparte.
  fase: 'grupos' | 'knockout' | 'campeon';
  usuarioEliminado: boolean;
  bracket: { nombre: string; llaves: Llave[] }[];
  campeonId: string | null;
}

// nombreLigaUsuario/tablaLigaUsuario: para que la liga del usuario use su
// tabla REAL (ya jugada) en vez de que clasificacionDeTodasLasLigas la
// estime — igual que en libertadoresYSudamericana.ts/championsEuropaConference.ts.
export function generarCopaMundialClubes(
  clubUsuario: Club,
  nombreLigaUsuario: string,
  tablaLigaUsuario: FilaEstadistica[] | undefined,
  temporada: number,
): CopaMundialClubes {
  const campeones = campeonesDeLigasCargadas(nombreLigaUsuario, tablaLigaUsuario, clubUsuario.id);

  const clubes: Record<string, Club> = { [clubUsuario.id]: clubUsuario };
  campeones.forEach((c) => { const generado = generarClubDePool(c); clubes[generado.id] = generado; });

  const idsExistentes = new Set(Object.keys(clubes));
  const faltan = EQUIPOS_TOTAL - Object.keys(clubes).length;
  if (faltan > 0) {
    const relleno = elegirVariosAlAzar(poolRelleno().filter(({ club }) => !idsExistentes.has(club.id)), faltan);
    relleno.forEach((c) => { const generado = generarClubDePool(c); clubes[generado.id] = generado; });
  }

  const clubIds = Object.keys(clubes);
  return {
    temporada,
    clubUsuarioId: clubUsuario.id,
    clubIds,
    clubes,
    grupos: armarGruposSimple(clubIds),
    fase: 'grupos',
    usuarioEliminado: false,
    bracket: [],
    campeonId: null,
  };
}

function armarKnockout(copa: CopaMundialClubes): CopaMundialClubes {
  const clasificados: string[] = [];
  copa.grupos.forEach((g) => {
    const tabla = tablaDeGrupo(g);
    clasificados.push(tabla[0].clubId, tabla[1].clubId);
  });

  const usuarioEliminado = copa.usuarioEliminado || !clasificados.includes(copa.clubUsuarioId);

  const mezclados = [...clasificados].sort(() => Math.random() - 0.5);
  const llaves: Llave[] = [];
  for (let i = 0; i < mezclados.length; i += 2) {
    llaves.push(armarLlave('Octavos de final', mezclados[i], mezclados[i + 1], true));
  }
  return { ...copa, fase: 'knockout', usuarioEliminado, bracket: [{ nombre: 'Octavos de final', llaves }] };
}

// Simula la próxima fecha pendiente de TODOS los grupos a la vez (8
// grupos, 3 fechas cada uno). Al terminar la última, arma automáticamente
// los octavos de final — marcando `usuarioEliminado` si el club del
// usuario no clasificó dentro de su grupo (el cuadro se arma igual, con
// los 16 que sí clasificaron).
export function simularProximaFechaGruposMundial(copa: CopaMundialClubes): CopaMundialClubes {
  if (copa.fase !== 'grupos') return copa;
  const grupos = simularProximaFechaDeGrupos(copa.grupos, copa.clubes, copa.clubUsuarioId);
  if (!todosLosGruposTerminados(grupos)) {
    return { ...copa, grupos };
  }
  return armarKnockout({ ...copa, grupos });
}

// Resuelve TODA la ronda actual del cuadro (partido único, no hace falta
// pausa "fecha por fecha" — mismo criterio que copaNacional.ts) y arma la
// siguiente.
export function simularProximaEtapaMundial(copa: CopaMundialClubes): CopaMundialClubes {
  if (copa.fase !== 'knockout') return copa;

  const rondaActual = copa.bracket[copa.bracket.length - 1];
  const llavesJugadas = rondaActual.llaves.map((l) => simularLlave(l, copa.clubes));
  const bracket = [...copa.bracket.slice(0, -1), { ...rondaActual, llaves: llavesJugadas }];
  const ganadores = llavesJugadas.map((l) => l.ganadorId!).filter(Boolean);
  const usuarioEliminado = copa.usuarioEliminado || !ganadores.includes(copa.clubUsuarioId);

  if (llavesJugadas.length === 1) {
    return {
      ...copa, bracket, usuarioEliminado, fase: 'campeon', campeonId: llavesJugadas[0].ganadorId,
    };
  }

  const { llaves: nuevasLlaves, nombreRonda } = armarSiguienteRonda(llavesJugadas, [], true);
  return { ...copa, bracket: [...bracket, { nombre: nombreRonda!, llaves: nuevasLlaves }], usuarioEliminado };
}
