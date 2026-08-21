// Tabla central del sistema de posiciones granular (pedido explícito: "un
// sistema de posiciones y que cada jugador afecte la simulación"). Un solo
// lugar con el orden de despliegue, el nombre largo para UI, y el mapeo a
// "sector" (las 4 posiciones viejas ARQ/DEF/MED/DEL) que sigue usando
// partido.ts para calcular fuerza de ataque/defensa — así el motor de
// partido no tuvo que reescribirse entero, sólo la capa que arma sus
// inputs a partir del plantel real (fixture.ts).
import type { Posicion } from '../types';

export const POSICIONES: Posicion[] = ['ARQ', 'DFC', 'LI', 'LD', 'MCD', 'MC', 'MCO', 'EI', 'ED', 'DEL'];

export const NOMBRE_POSICION: Record<Posicion, string> = {
  ARQ: 'Arquero',
  DFC: 'Defensor central',
  LI: 'Lateral izquierdo',
  LD: 'Lateral derecho',
  MCD: 'Volante central',
  MC: 'Mediocampista central',
  MCO: 'Mediocampista ofensivo',
  EI: 'Extremo izquierdo',
  ED: 'Extremo derecho',
  DEL: 'Delantero',
};

export type SectorPosicion = 'ARQ' | 'DEF' | 'MED' | 'DEL';

// Sector agregado de cada posición granular — lo usa fixture.ts para armar
// el input de calcularFuerzaSector (partido.ts), que sigue pensando en 4
// baldes de ataque/defensa, no en las 10 posiciones puntuales.
export const BUCKET_DE_POSICION: Record<Posicion, SectorPosicion> = {
  ARQ: 'ARQ',
  DFC: 'DEF',
  LI: 'DEF',
  LD: 'DEF',
  MCD: 'MED',
  MC: 'MED',
  MCO: 'MED',
  EI: 'DEL',
  ED: 'DEL',
  DEL: 'DEL',
};

// rediseno-motor-partido_1.md §3.1 — grilla 6×3 (largo × ancho): a qué
// franja de cancha pertenece cada posición granular. Lo usa partido.ts
// para que los duelos de banda (izq/der) los disputen laterales/extremos
// entre sí en vez de un central cualquiera, y para pesar más el `ritmo`
// en esas franjas (§3.3.1) — el desborde por afuera importa más que el
// mismo duelo por el medio.
export type Ancho = 'izq' | 'centro' | 'der';

export const BUCKET_ANCHO_DE_POSICION: Record<Posicion, Ancho> = {
  ARQ: 'centro',
  DFC: 'centro',
  LI: 'izq',
  LD: 'der',
  MCD: 'centro',
  MC: 'centro',
  MCO: 'centro',
  EI: 'izq',
  ED: 'der',
  DEL: 'centro',
};
