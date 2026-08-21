// Paleta por posición: arquero naranja, defensores en tonos de azul,
// mediocampistas en tonos de verde, ofensivos en tonos de rojo — mismo
// esquema de 4 colores de siempre (ver data/posiciones.ts
// BUCKET_DE_POSICION), pero con un matiz distinto por posición puntual
// dentro de cada familia para diferenciarlas a simple vista en la cancha
// (ej.: LI/LD comparten tono, distinto del DFC central). Se usa tanto en
// el círculo de la cancha como en el cuadrado de GRL de la tarjeta de
// jugador.
import type { Posicion } from '../types';

export const COLOR_POSICION: Record<Posicion, { borde: string; fondo: string; texto: string }> = {
  ARQ: { borde: 'border-orange-400', fondo: 'bg-orange-500/20', texto: 'text-orange-400' },
  DFC: { borde: 'border-blue-400', fondo: 'bg-blue-500/20', texto: 'text-blue-400' },
  LI: { borde: 'border-sky-400', fondo: 'bg-sky-500/20', texto: 'text-sky-400' },
  LD: { borde: 'border-sky-400', fondo: 'bg-sky-500/20', texto: 'text-sky-400' },
  MCD: { borde: 'border-teal-400', fondo: 'bg-teal-500/20', texto: 'text-teal-400' },
  MC: { borde: 'border-green-400', fondo: 'bg-green-500/20', texto: 'text-green-400' },
  MCO: { borde: 'border-lime-400', fondo: 'bg-lime-500/20', texto: 'text-lime-400' },
  EI: { borde: 'border-rose-400', fondo: 'bg-rose-500/20', texto: 'text-rose-400' },
  ED: { borde: 'border-rose-400', fondo: 'bg-rose-500/20', texto: 'text-rose-400' },
  DEL: { borde: 'border-red-400', fondo: 'bg-red-500/20', texto: 'text-red-400' },
};

export function claseCuadrado(posicion: Posicion): string {
  const c = COLOR_POSICION[posicion];
  return `${c.fondo} ${c.texto} border ${c.borde}/40`;
}

export function claseCirculo(posicion: Posicion): string {
  const c = COLOR_POSICION[posicion];
  return `${c.borde} ${c.fondo}`;
}
