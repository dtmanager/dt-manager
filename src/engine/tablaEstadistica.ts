// Tabla "estadística" de una liga que NO se está jugando (pedido
// explícito: para que el ascenso/descenso sea real sin tener que
// simular las ~21 ligas partido a partido). Estima una posición final
// plausible de cada club a partir de su nc + ruido — no se juega un
// solo partido. Sólo se usa para decidir a quién le toca "hacerle
// lugar" cuando el club del usuario entra a esa liga (ver liga.ts,
// generarLigaConClubExistente).

import type { ClubBase } from '../data/clubesLigaProfesional';
import { randomNormal } from './random';

export interface FilaEstadistica {
  clubId: string;
  nombre: string;
  puntosEstimados: number;
}

// Orden de mejor a peor (como calcularTabla).
export function tablaEstadistica(clubes: ClubBase[]): FilaEstadistica[] {
  return clubes
    .map((c) => ({
      clubId: c.id,
      nombre: c.nombre,
      puntosEstimados: c.nc * 1.2 + randomNormal(0, 8),
    }))
    .sort((a, b) => b.puntosEstimados - a.puntosEstimados);
}
