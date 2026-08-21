// Economía de fin de temporada (pedido explícito, no está en la spec
// original): hasta ahora `presupuesto` sólo se movía con transferencias —
// los sueldos nunca se descontaban y no había premios ni ingresos, así que
// el número no reflejaba nada real. Esto le da consecuencias: cada cierre
// de temporada se cobra un premio según la posición + una "taquilla" base
// (según el nivel del club), y se pagan los sueldos de todo el plantel.
//
// También agrega descenso: terminar entre los últimos 2 de la tabla baja
// a la categoría inferior si la liga tiene una cargada (ver
// competicionesConfig.ts, LIGA_INFERIOR_DE) — si no la tiene, termina la
// carrera del usuario (no hay a dónde bajar en ese país).
//
// Mercado realista (pedido explícito, investigación de presupuestos reales
// de liga/valor de jugadores/salarios — ver economiaLigas.ts para fuentes):
// calcularPremio y calcularTaquilla ya no escalan con una constante fija
// por nc igual para cualquier liga — ahora usan escalaEconomica, que separa
// "qué tan bueno es el club" (nc) de "en qué mercado juega" (liga: Premier
// League vs. Liga Profesional no es lo mismo aunque el nc sea parecido).
// Los parámetros `nombreLiga` quedan opcionales (con un fallback genérico
// si no se pasan) para no romper los call-sites/tests existentes que
// todavía no tenían el concepto de liga acá.

import type { Club } from '../types';
import { randomUniforme } from './random';
import { escalaEconomica } from './economiaLigas';

// Récord de liga del club (PJ/PG/PE/PP/GF/GC) — mismas columnas que
// TablaPosiciones (engine/fixture.ts), pero como su propio tipo acá para
// no crear una dependencia circular economia.ts↔fixture.ts (economia.ts
// no necesita el resto de TablaPosiciones, sólo estos 6 números).
export interface RecordTemporada {
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
}

// Goleador del plantel propio esta temporada (pedido explícito, resumen
// de fin de temporada "con nota de tu temporada, estadisticas,
// goleadores") — null si nadie del plantel sumó un solo partido (no
// debería pasar en una temporada jugada, pero por las dudas).
export interface GoleadorPropioTemporada {
  nombre: string;
  goles: number;
  asistencias: number;
  pj: number;
}

const CLUBES_QUE_DESCIENDEN = 3;
const CLUBES_QUE_ASCIENDEN = 3; // simétrico con el descenso

// posicion0: 0-indexado (0 = campeón), como devuelve calcularTabla.
export function estaEnZonaDescenso(posicion0: number, totalClubes: number): boolean {
  return posicion0 >= totalClubes - CLUBES_QUE_DESCIENDEN;
}

export function estaEnZonaAscenso(posicion0: number): boolean {
  return posicion0 < CLUBES_QUE_ASCIENDEN;
}

// Premio por posición final — porcentaje ADICIONAL de la escala económica
// de la liga del club (no de la taquilla), para que el campeón de una liga
// rica se vea claramente más beneficiado en términos absolutos que el
// campeón de una liga chica, igual que en la realidad (premios de
// UEFA/CONMEBOL, reparto de TV por posición, etc.). Antes era una escala
// arbitraria de factores (campeón 3.0x el último) sobre nc*20_000 — se
// mantiene la misma FORMA (campeón cobra mucho más que el último) pero
// ahora la base es realista por liga en vez de una constante inventada.
export function factorPremioPorPosicion(posicion0: number, totalClubes: number): number {
  const fraccion = (posicion0 + 1) / totalClubes;
  if (posicion0 === 0) return 0.45; // campeón
  if (posicion0 < 3) return 0.28; // resto del podio
  if (fraccion <= 0.25) return 0.16;
  if (fraccion <= 0.5) return 0.09;
  if (fraccion <= 0.75) return 0.05;
  return 0.02; // fondo de la tabla
}

export function calcularPremio(posicion0: number, totalClubes: number, nc: number, nombreLiga?: string): number {
  const factor = factorPremioPorPosicion(posicion0, totalClubes);
  return Math.round(escalaEconomica(nc, nombreLiga) * factor);
}

// Ingreso base de taquilla/TV, cobra cualquier club todas las temporadas
// independientemente de dónde salió — antes escalaba con una constante fija
// (nc*15_000) igual para cualquier liga; ahora se acerca al ingreso anual
// real típico de esa liga en ese nivel de nc (ver economiaLigas.ts).
export function calcularTaquilla(nc: number, nombreLiga?: string): number {
  return Math.round(escalaEconomica(nc, nombreLiga) * 0.7 * randomUniforme(0.85, 1.15));
}

export function calcularSueldosTemporada(club: Club): number {
  return club.plantel.reduce((acc, j) => acc + j.salario, 0);
}

export interface ResumenTemporada {
  temporada: number;
  posicion: number; // 1-indexado, para mostrar
  totalClubes: number;
  campeon: boolean;
  descendido: boolean;
  ascendido: boolean;
  // Nombre de la liga a la que se pasa la próxima temporada (ascenso o
  // descenso reales). null si no hay cambio de liga.
  nuevaLiga: string | null;
  premio: number;
  taquilla: number;
  sueldosPagados: number;
  // Contrato propio del DT (pedido explícito, ver engine/contratoDT.ts) —
  // salario del DT del usuario esta temporada, separado de sueldosPagados
  // (que es sólo plantel) para que el desglose sea transparente.
  sueldoDT: number;
  presupuestoAnterior: number;
  presupuestoNuevo: number;
  // Objetivo de temporada + riesgo de despido (pedido explícito, ver
  // engine/objetivos.ts) — objetivo que tenía asignado el club ANTES de
  // que terminara esta temporada, si se cumplió, y cómo quedó la
  // confianza de la directiva después de evaluarlo.
  objetivoDescripcion: string;
  objetivoCumplido: boolean;
  confianzaAnterior: number;
  confianzaNueva: number;
  // Resumen "portada de diario" (pedido explícito, ver
  // components/TarjetaNotaTemporada.tsx y engine/notaTemporada.ts) — se
  // capturan ACÁ, en el mismo momento en que se arma este resumen dentro
  // de procesarFinDeTemporada, porque evolucionarClub (que corre ANTES en
  // ese mismo loop) ya resetea estadisticasTemporada a 0 para la
  // temporada que arranca — leerlos más tarde desde la pantalla siempre
  // habría dado 0 goles/asistencias.
  record: RecordTemporada;
  goleadorPropio: GoleadorPropioTemporada | null;
}
