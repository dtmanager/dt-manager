// Copa nacional (prompt-copas-manager-app.md): bracket de eliminación
// directa a partido único con TODOS los clubes de la liga doméstica ya
// cargada (Copa Argentina, FA Cup, Copa del Rey, Coppa Italia, DFB-Pokal,
// Coupe de France, Copa do Brasil — mapeo en competicionesConfig.ts).
// Arranca independiente de la posición en la liga: participan todos los
// clubes, cada temporada, sorteo aleatorio en cada ronda (sin ida y
// vuelta ni protección de cabezas de serie).
//
// Simplificación documentada: en la realidad estas copas incluyen
// decenas o cientos de clubes amateurs y de categorías inferiores que
// este juego no modela — acá participan sólo los clubes de primera
// división ya cargados para esa liga.

import type { Club } from '../types';
import {
  armarPrimeraRonda, armarSiguienteRonda, simularLlave, type Llave,
} from './eliminatoria';

export interface CopaNacional {
  nombre: string;
  clubes: Record<string, Club>;
  rondas: { nombre: string; llaves: Llave[] }[];
  clasificadosPendientes: string[]; // clubes con "bye" a la espera de la próxima ronda
  campeonId: string | null;
}

export function generarCopaNacional(nombre: string, clubes: Record<string, Club>): CopaNacional {
  const { llaves, clasificadosPendientes, nombreRonda } = armarPrimeraRonda(Object.keys(clubes), true);
  return {
    nombre, clubes, rondas: [{ nombre: nombreRonda, llaves }], clasificadosPendientes, campeonId: null,
  };
}

// Simula todas las llaves pendientes de la ronda actual y arma la
// siguiente (o define campeón si ya no queda a quién enfrentar).
export function simularRondaCopaNacional(copa: CopaNacional): CopaNacional {
  if (copa.campeonId) return copa;
  const rondaActual = copa.rondas[copa.rondas.length - 1];
  const llavesJugadas = rondaActual.llaves.map((l) => simularLlave(l, copa.clubes));
  const rondas = [...copa.rondas.slice(0, -1), { ...rondaActual, llaves: llavesJugadas }];

  const { llaves: nuevasLlaves, nombreRonda: proximaRonda } = armarSiguienteRonda(
    llavesJugadas,
    copa.clasificadosPendientes,
    true,
  );

  if (proximaRonda == null) {
    const ganadores = llavesJugadas.map((l) => l.ganadorId).filter((id): id is string => id != null);
    const campeonId = [...ganadores, ...copa.clasificadosPendientes][0] ?? null;
    return {
      ...copa, rondas, clasificadosPendientes: [], campeonId,
    };
  }

  return {
    ...copa,
    rondas: [...rondas, { nombre: proximaRonda, llaves: nuevasLlaves }],
    clasificadosPendientes: [],
  };
}
