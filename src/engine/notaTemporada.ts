// Resumen de temporada estilo "portada de diario" (pedido explícito: "al
// final de la temporada hace un resumen de esta con nota de tu temporada,
// estadisticas, goleadores, etc de ese estilo con mucha info", mostrando
// un mockup de ejemplo con titular grande + "NOTA DE LA TEMPORADA" + una
// lista de datos con viñetas de color). El mockup traía un "archirrival"
// que compara goles+asistencias temporada a temporada — se dejó afuera a
// propósito (decisión explícita): el juego no tiene ningún club/DT rival
// fijo persistido por carrera, así que armarlo sería una mecánica nueva
// aparte, no sólo presentación. Todo lo de acá sale de datos que YA existen
// (ResumenTemporada + la tabla de posiciones/goleadores de la liga que
// acaba de terminar).
import type { ResumenTemporada } from './economia';
import { clamp } from './random';

// 0-10 con un decimal, mismo lenguaje que una nota de diario deportivo.
// Base según posición relativa en la tabla (4-8), + objetivo cumplido/no
// cumplido, con pisos/techos duros para los resultados extremos (un
// campeón siempre saca 10 así el objetivo haya sido modesto; un
// descendido nunca pasa de 3 así haya cumplido algún objetivo menor).
export function calcularNotaTemporada(resumen: ResumenTemporada): number {
  if (resumen.campeon) return 10;

  const { posicion, totalClubes, objetivoCumplido, ascendido, descendido } = resumen;
  const posicionRatio = totalClubes > 1 ? (totalClubes - posicion) / (totalClubes - 1) : 1;
  let nota = 4 + posicionRatio * 4;
  nota += objetivoCumplido ? 1 : -1.5;

  if (descendido) nota = Math.min(nota, 3);
  if (ascendido) nota = Math.max(nota, 8);

  return Math.round(clamp(nota, 0, 10) * 10) / 10;
}

// Titular tipo diario deportivo — un puñado de variantes fijas según el
// resultado de la temporada (no hace falta generación libre de texto para
// esto, con "estados" bien diferenciados alcanza, mismo criterio arcade
// que engine/noticias.ts).
export function tituloTemporada(resumen: ResumenTemporada): string {
  if (resumen.campeon) return '¡CAMPEÓN!';
  if (resumen.ascendido) return '¡ASCENSO LOGRADO!';
  if (resumen.descendido) return 'TEMPORADA PARA OLVIDAR';
  const tercioSuperior = resumen.posicion <= Math.ceil(resumen.totalClubes / 3);
  if (resumen.objetivoCumplido && tercioSuperior) return 'TEMPORADA SÓLIDA';
  if (resumen.objetivoCumplido) return 'OBJETIVO CUMPLIDO';
  return 'TEMPORADA IRREGULAR';
}

// Bajada tipo diario, con el resultado concreto — mismo dato que ya
// muestra el resto de la pantalla (posición/PJ-PG-PE-PP/goles) pero en
// una sola oración, para que el titular no quede solo.
export function bajadaTemporada(resumen: ResumenTemporada, clubNombre: string): string {
  const { pg, pe, pp, gf } = resumen.record;
  return `${clubNombre} terminó ${resumen.posicion}° de ${resumen.totalClubes} con ${pg}V-${pe}E-${pp}D y ${gf} goles a favor.`;
}
