// Sub-stats granulares por jugador (sub-stats-diseno.md, fase 1): derivadas
// de grl + un perfil de peso por posición + ruido, no independientes (ver
// sección 6.1 del documento) — así no hace falta tocar evolucionarGrl, y
// los sub-stats "siguen" al grl con la edad de forma coherente. Arqueros no
// comparten perfil con el resto (SubStatsArquero aparte, sección 5.1).
import type { Jugador, Posicion, SubStats, SubStatsArquero } from '../types';
import { clamp, randomNormal } from './random';

// Peso relativo (0-1) de cada categoría para esa posición — cuánto se aleja
// del promedio "grl" en cada sentido. 0.5 = neutro (la categoría queda
// pegada al grl); >0.5 tira para arriba, <0.5 tira para abajo.
export const PERFIL_POSICION: Record<Exclude<Posicion, 'ARQ'>, SubStats> = {
  DFC: { ritmo: 0.40, tiro: 0.20, pase: 0.45, regate: 0.30, defensa: 0.90, fisico: 0.80 },
  LI: { ritmo: 0.70, tiro: 0.25, pase: 0.55, regate: 0.55, defensa: 0.65, fisico: 0.55 },
  LD: { ritmo: 0.70, tiro: 0.25, pase: 0.55, regate: 0.55, defensa: 0.65, fisico: 0.55 },
  MCD: { ritmo: 0.45, tiro: 0.30, pase: 0.65, regate: 0.45, defensa: 0.70, fisico: 0.65 },
  MC: { ritmo: 0.55, tiro: 0.40, pase: 0.70, regate: 0.55, defensa: 0.45, fisico: 0.55 },
  MCO: { ritmo: 0.55, tiro: 0.60, pase: 0.80, regate: 0.70, defensa: 0.20, fisico: 0.40 },
  EI: { ritmo: 0.90, tiro: 0.55, pase: 0.55, regate: 0.85, defensa: 0.15, fisico: 0.45 },
  ED: { ritmo: 0.90, tiro: 0.55, pase: 0.55, regate: 0.85, defensa: 0.15, fisico: 0.45 },
  DEL: { ritmo: 0.75, tiro: 0.90, pase: 0.40, regate: 0.65, defensa: 0.10, fisico: 0.65 },
};

// grl + (peso-0.5)*rango + ruido, clampeado 40-99 — con peso 0.5 el valor
// queda pegado al grl (±ruido); con peso 0.9 sube fuerte, con 0.1 baja fuerte.
function derivarSubStat(grl: number, peso: number): number {
  const desplazamiento = (peso - 0.5) * 40; // hasta ±20 sobre el grl
  return Math.round(clamp(grl + desplazamiento + randomNormal(0, 4), 40, 99));
}

export function generarSubStats(grl: number, posicion: Posicion): SubStats | undefined {
  if (posicion === 'ARQ') return undefined;
  const perfil = PERFIL_POSICION[posicion];
  return {
    ritmo: derivarSubStat(grl, perfil.ritmo),
    tiro: derivarSubStat(grl, perfil.tiro),
    pase: derivarSubStat(grl, perfil.pase),
    regate: derivarSubStat(grl, perfil.regate),
    defensa: derivarSubStat(grl, perfil.defensa),
    fisico: derivarSubStat(grl, perfil.fisico),
  };
}

export function generarSubStatsArquero(grl: number): SubStatsArquero {
  return {
    atajada: derivarSubStat(grl, 0.75),
    salidas: derivarSubStat(grl, 0.55),
    juegoDePies: derivarSubStat(grl, 0.45),
    reflejos: derivarSubStat(grl, 0.80),
  };
}

// -------------------- 7.6 aptitud posicional --------------------

// "Grl efectivo" de un jugador si se lo pone a jugar en posicionDestino. En
// su posición nativa da ~igual a jugador.grl (sus sub-stats fueron
// generadas apuntando a ese mismo perfil). Fuera de puesto, cae en función
// de cuánto le faltan sus sub-stats reales respecto al perfil que pide el
// puesto nuevo — mismo mecanismo que EA FC usa para el "rating en otras
// posiciones" de la carta de un jugador.
//
// OJO con la primera versión de esta función (promedio ponderado directo
// de `stats[k] * perfil[k]`): dejaba que un excedente en una habilidad que
// el puesto nuevo no pide (ej. la `defensa` alta de un MCD) tape en el
// promedio una carencia real en otra que sí pide (`tiro`/`regate` para
// jugar de MCO) — un MCD terminaba con aptitud de MCO casi intacta, que no
// tiene sentido futbolístico. Ahora se compara cada sub-stat contra el
// valor ESPERADO de un jugador nativo del puesto destino con el mismo grl
// (misma cuenta que derivarSubStat, sin el ruido) y sólo se penaliza el
// DÉFICIT (cuando el jugador queda por debajo de lo que ese puesto pide) —
// un excedente en algo que no hace falta no compensa nada. La suma de
// déficits se pondera al cuadrado (no lineal) para que una carencia
// puntual grave en una sola stat clave (ej. `defensa` de un DEL puesto de
// DFC) pese más que varias carencias chicas repartidas.
export function grlEfectivoEnPosicion(jugador: Jugador, posicionDestino: Posicion): number {
  // Arqueros no comparten perfil con el resto — jugar de ARQ sin serlo, o
  // un ARQ jugando de la cancha para afuera, no tiene un cálculo razonable
  // acá (0 sub-stats en común); se sigue bloqueando aparte.
  if (posicionDestino === 'ARQ' || jugador.posicion === 'ARQ') return jugador.grl;

  const stats = jugador.subStats;
  if (!stats) return jugador.grl; // fallback: jugador sin subStats (save viejo)

  const perfil = PERFIL_POSICION[posicionDestino];
  const claves = Object.keys(perfil) as (keyof SubStats)[];
  const totalPeso = claves.reduce((acc, k) => acc + perfil[k], 0);

  const sumaPenalizacionCuadratica = claves.reduce((acc, k) => {
    const esperado = jugador.grl + (perfil[k] - 0.5) * 40; // misma fórmula que derivarSubStat, sin ruido
    const deficit = Math.max(0, esperado - stats[k]);
    return acc + deficit ** 2 * perfil[k];
  }, 0);
  const penalizacion = Math.sqrt(sumaPenalizacionCuadratica / totalPeso);

  return clamp(jugador.grl - penalizacion, 20, 99);
}
