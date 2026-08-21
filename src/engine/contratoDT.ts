// Contrato propio del DT (pedido explícito, sección "Contrato propio del
// DT" del audit de sistemas pendientes): hasta ahora el DT dirigía gratis
// y para siempre en el mismo club — no había salario propio ni riesgo de
// que el contrato se terminara. Mismo patrón general que
// engine/contratos.ts (jugadores): duración que baja un año al cerrar
// cada temporada, salario que sale de una fórmula ligada al club. La
// diferencia es que acá no hay mercado de pases de DTs ni negociación con
// probabilidad de rechazo — cuando el contrato se vence, el club hace UNA
// oferta de renovación y el usuario decide (aceptar o irse, ver
// ofertaRenovacionDT/useGameStore.ts). No se creó un motor de negociación
// más elaborado a propósito: no hay otro club "comprando" al DT acá (eso
// ya existe, separado, en ofertasDT.ts).
import type { Club, ContratoDT, DT } from '../types';
import { clamp, randomEntero } from './random';

// Fracción del presupuesto ANUAL del club (mismo campo que ya usa
// presupuestoInicial/escalaEconomica en economiaLigas.ts) — un club grande
// le paga a su DT bastante más en términos absolutos aunque la fracción
// relativa sea parecida, mismo criterio que el resto de la economía del
// juego (separar "cuánto cobra" de "en qué mercado juega").
const FRACCION_PRESUPUESTO_SALARIO_DT = 0.02;
const SALARIO_DT_MINIMO = 50_000;

export function calcularSalarioDT(presupuestoClub: number): number {
  return Math.max(SALARIO_DT_MINIMO, Math.round(presupuestoClub * FRACCION_PRESUPUESTO_SALARIO_DT));
}

// Duración inicial de cualquier contrato de DT nuevo (arranque de carrera,
// DT que se genera para un club de la IA, o el DT del usuario después de
// aceptar una oferta de otro club — ver aceptarOfertaDT en useGameStore.ts).
export function contratoDTInicial(presupuestoClub: number): ContratoDT {
  return {
    salarioAnual: calcularSalarioDT(presupuestoClub),
    temporadasRestantes: randomEntero(2, 4),
  };
}

// Al cerrar la temporada: descuenta un año, igual que avanzarContratos con
// los jugadores. No libera a nadie acá — cuando llega a 0 lo resuelve
// ofertaRenovacionDT/aceptarRenovacionDT/rechazarRenovacionDT en
// useGameStore.ts (a diferencia de un jugador, un DT sin contrato no puede
// quedar dando vueltas "libre": o renueva o se termina la carrera con ese
// club, ver motivo 'renuncia' de FinCarrera).
export function avanzarContratoDT(dt: DT): DT {
  if (!dt.contrato) return dt;
  return { ...dt, contrato: { ...dt.contrato, temporadasRestantes: dt.contrato.temporadasRestantes - 1 } };
}

export interface RenovacionDT {
  salarioOfrecido: number;
  duracionOfrecida: number;
  temporada: number;
}

// Oferta de renovación que hace el CLUB al vencerse el contrato (pedido
// explícito: el usuario decide, no hay probabilidad de rechazo de por
// medio como con un jugador — acá el que negocia "del otro lado" es la
// directiva, no una persona con voluntad propia). El salario ofrecido
// escala con la reputación actual del DT (0.7x-1.3x sobre la base de
// calcularSalarioDT) — un DT que se hizo un nombre en el club cobra más
// que uno recién llegado con el mismo presupuesto.
const REPUTACION_FACTOR_MIN = 0.7;
const REPUTACION_FACTOR_RANGO = 0.6;

export function ofertaRenovacionDT(club: Club, temporada: number): RenovacionDT {
  const factorReputacion = REPUTACION_FACTOR_MIN + (clamp(club.dt.reputacion, 0, 99) / 99) * REPUTACION_FACTOR_RANGO;
  const salarioOfrecido = Math.max(SALARIO_DT_MINIMO, Math.round(calcularSalarioDT(club.presupuesto) * factorReputacion));
  return {
    salarioOfrecido,
    duracionOfrecida: randomEntero(2, 4),
    temporada,
  };
}

export function renovarContratoDT(dt: DT, renovacion: RenovacionDT): DT {
  return { ...dt, contrato: { salarioAnual: renovacion.salarioOfrecido, temporadasRestantes: renovacion.duracionOfrecida } };
}
