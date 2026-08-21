// Campeones del resto del mundo (pedido explícito: "una simulación básica
// para ver quién ganó cada torneo") — para las copas que el usuario NO
// jugó de verdad esta temporada, en vez de dejarlas sin resultado se
// sortea un campeón plausible con el mismo criterio que tablaEstadistica
// (nc + ruido, sin simular un solo partido de nada). Pura data de sabor
// para el resumen de fin de temporada — no genera clubes nuevos, no toca
// el store, no afecta la partida en absoluto.

import { LIGAS } from '../data/ligas';
import type { ClubBase } from '../data/clubesLigaProfesional';
import { tablaEstadistica, type FilaEstadistica } from './tablaEstadistica';
import { clasificacionDeTodasLasLigas, clubesEnRango, type ClasificacionLiga } from './clasificacionLigas';
import {
  COPA_NACIONAL_POR_LIGA, cuposContinentalesDeLiga, ligaSuperiorDe, type CuposCopasContinentales,
} from './competicionesConfig';

export interface CampeonDelMundo {
  competicion: string;
  campeonNombre: string;
}

// Mismo sorteo pesado por nc que ya usa tablaEstadistica para estimar
// tablas de ligas que no se juegan — acá se reusa tal cual para elegir un
// "campeón" entre los participantes de una copa, sin bracket ni fase de
// grupos de verdad.
function campeonPonderado(pool: ClubBase[]): string | null {
  if (pool.length === 0) return null;
  return tablaEstadistica(pool)[0].nombre;
}

// -------------------- copas nacionales de otros países --------------------

// Abierta a todo el plantel de primera división de ese país (a diferencia
// de las continentales, acá no hay "cupos" — participa toda la liga).
export function copasNacionalesDelMundo(nombreLigaUsuario: string | null): CampeonDelMundo[] {
  const resultado: CampeonDelMundo[] = [];
  Object.entries(COPA_NACIONAL_POR_LIGA).forEach(([nombreLiga, nombreCopa]) => {
    if (nombreLiga === nombreLigaUsuario) return; // esa se juega de verdad, no hace falta inventarle campeón
    const liga = LIGAS.find((l) => l.nombre === nombreLiga && l.disponible);
    if (!liga) return;
    const campeonNombre = campeonPonderado(liga.clubes);
    if (campeonNombre) resultado.push({ competicion: nombreCopa, campeonNombre });
  });
  return resultado;
}

// -------------------- copas continentales --------------------

const NOMBRE_COPA_CONTINENTAL: Record<keyof CuposCopasContinentales, string> = {
  champions: 'UEFA Champions League',
  europa: 'UEFA Europa League',
  conference: 'UEFA Conference League',
  libertadores: 'Copa Libertadores',
  sudamericana: 'Copa Sudamericana',
};

function poolClasificadosContinental(
  tipo: keyof CuposCopasContinentales,
  clasificacion: ClasificacionLiga[],
): ClubBase[] {
  const pool: ClubBase[] = [];
  clasificacion.forEach((c) => {
    const cupos = cuposContinentalesDeLiga(c.nombreLiga);
    const rango = cupos?.[tipo];
    if (!rango) return;
    const liga = LIGAS.find((l) => l.nombre === c.nombreLiga);
    if (!liga) return;
    const idsClasificados = new Set(clubesEnRango(clasificacion, c.nombreLiga, rango[0], rango[1]));
    liga.clubes.forEach((base) => { if (idsClasificados.has(base.id)) pool.push(base); });
  });
  return pool;
}

// nombreLigaUsuario/tablaLigaUsuario: para que la liga del usuario use su
// tabla REAL en la estimación de quién clasificó a cada copa (mismo
// criterio que clasificacionDeTodasLasLigas en todos lados). tiposAExcluir:
// las copas que el usuario SÍ va a jugar de verdad esta temporada — no
// hace falta inventarles un campeón de mentira, ya van a tener uno real.
export function copasContinentalesDelMundo(
  nombreLigaUsuario: string,
  tablaLigaUsuario: FilaEstadistica[] | undefined,
  tiposAExcluir: (keyof CuposCopasContinentales)[],
): CampeonDelMundo[] {
  const clasificacion = clasificacionDeTodasLasLigas(nombreLigaUsuario, tablaLigaUsuario);
  const resultado: CampeonDelMundo[] = [];
  (Object.keys(NOMBRE_COPA_CONTINENTAL) as (keyof CuposCopasContinentales)[]).forEach((tipo) => {
    if (tiposAExcluir.includes(tipo)) return;
    const campeonNombre = campeonPonderado(poolClasificadosContinental(tipo, clasificacion));
    if (campeonNombre) resultado.push({ competicion: NOMBRE_COPA_CONTINENTAL[tipo], campeonNombre });
  });
  return resultado;
}

// -------------------- Copa Mundial de Clubes --------------------

// Mismo pool que arma generarCopaMundialClubes (copaMundialClubes.ts) para
// clasificar de verdad: el campeón (estimado) de cada liga de PRIMERA
// división ya cargada — acá sólo se usa para elegir uno al azar ponderado,
// no arma los 32 cupos completos.
export function campeonMundialDeClubesDelMundo(
  nombreLigaUsuario: string,
  tablaLigaUsuario: FilaEstadistica[] | undefined,
): CampeonDelMundo | null {
  const clasificacion = clasificacionDeTodasLasLigas(nombreLigaUsuario, tablaLigaUsuario);
  const pool: ClubBase[] = [];
  LIGAS.forEach((liga) => {
    if (!liga.disponible || ligaSuperiorDe(liga.nombre) != null) return;
    const campeonId = clasificacion.find((c) => c.nombreLiga === liga.nombre)?.tabla[0]?.clubId;
    if (!campeonId) return;
    const base = liga.clubes.find((c) => c.id === campeonId);
    if (base) pool.push(base);
  });
  const campeonNombre = campeonPonderado(pool);
  return campeonNombre ? { competicion: 'Copa Mundial de Clubes', campeonNombre } : null;
}
