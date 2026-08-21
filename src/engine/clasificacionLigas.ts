// Clasificación de TODAS las ligas del juego (pedido explícito): usa
// tablaEstadistica (ver ese archivo) para estimar cómo termina cada liga
// que el usuario NO está jugando — sin simular un solo partido de esas
// ligas. Es la pieza que permite saber quién sale campeón de cada una y
// quién clasifica a Champions/Europa/Conference/Libertadores/Sudamericana
// sin tener que correr las ~21 ligas del juego en paralelo.
//
// Para la liga que el usuario SÍ está jugando, hay que pasar la tabla
// REAL (calcularTabla sobre el fixture ya jugado) en vez de dejar que
// esto la estime — por eso `tablaLigaActiva` es un override opcional.

import { LIGAS } from '../data/ligas';
import { tablaEstadistica, type FilaEstadistica } from './tablaEstadistica';

export interface ClasificacionLiga {
  ligaId: string;
  nombreLiga: string;
  tabla: FilaEstadistica[]; // de mejor a peor
}

export function clasificacionDeTodasLasLigas(
  nombreLigaActiva?: string,
  tablaLigaActiva?: FilaEstadistica[],
): ClasificacionLiga[] {
  return LIGAS.filter((l) => l.disponible).map((l) => ({
    ligaId: l.id,
    nombreLiga: l.nombre,
    tabla: (l.nombre === nombreLigaActiva && tablaLigaActiva) ? tablaLigaActiva : tablaEstadistica(l.clubes),
  }));
}

// clubIds de la liga `nombreLiga` en el rango de posiciones [desde0,
// hasta0] (0-indexado, ambos inclusive) según esa clasificación.
export function clubesEnRango(
  clasificacion: ClasificacionLiga[],
  nombreLiga: string,
  desde0: number,
  hasta0: number,
): string[] {
  const liga = clasificacion.find((c) => c.nombreLiga === nombreLiga);
  if (!liga) return [];
  return liga.tabla.slice(desde0, hasta0 + 1).map((f) => f.clubId);
}
