// Sistema de contratos (pedido explícito, no estaba en la spec original):
// cada jugador con clubId tiene un contrato que baja un año al cerrar la
// temporada; al llegar a 0 queda libre. Esto es también lo que resuelve
// el hueco que había quedado en M5 (no había forma de que aparecieran
// jugadores libres para fichar).

import type { Club, Jugador } from '../types';
import { clamp, randomEntero } from './random';
import { calcularSalario, MULTIPLICADOR_SALARIAL_DEFAULT } from './jugadores';
import { multiplicadorSalarialDeLiga } from './economiaLigas';

// A partir de qué año restante se puede empezar a negociar una renovación
// (no tiene sentido ofertar a alguien que recién firmó por 4 años).
export const ANIOS_PARA_RENOVAR = 2;

export function puedeRenovar(jugador: Jugador): boolean {
  return jugador.contratoAniosRestantes > 0 && jugador.contratoAniosRestantes <= ANIOS_PARA_RENOVAR;
}

// Tope de plantel pedido explícitamente (26 jugadores).
export const TOPE_PLANTEL = 26;

export function hayCupo(club: Club): boolean {
  return club.plantel.length < TOPE_PLANTEL;
}

// -------------------- piso obligatorio de plantel (pedido explícito) --------------------
//
// Además del backstop de fin de temporada (aplicarPisoDePlantel, más
// abajo), esto tapa el otro hueco: vender a mano un jugador propio
// (aceptarOferta en useGameStore.ts) NO pasaba por ningún piso — se podía
// vender al último arquero o vaciar el plantel por debajo de 16 sin
// ningún aviso. `puedeLiberarSinRomperPiso` se usa tanto para bloquear la
// venta en el store como para deshabilitar el botón "Aceptar" en
// PantallaMercado.tsx con un motivo visible, en vez de un fallo mudo.
//
// "que sea obligatorio tener en la plantilla 2 arqueros y 11 titulares y
// 5 suplentes" — hasta ahora nada impedía que el plantel se quedara sin
// arquero (contrato vencido sin reemplazo) o por debajo de lo necesario
// para completar un 11 + banco. TOPE_PLANTEL_MINIMO = 16 (11+5, lo mínimo
// para armar una alineación completa con banco); PISO_ARQUEROS = 2.
export const TOPE_PLANTEL_MINIMO = 16;
export const PISO_ARQUEROS = 2;

// Para vender/liberar a un jugador puntual A MANO (no el vencimiento de
// contrato de fin de temporada, que usa aplicarPisoDePlantel más abajo):
// ¿el plantel sigue cumpliendo el piso si este jugador se va?
export function puedeLiberarSinRomperPiso(club: Club, jugadorId: string): boolean {
  const jugador = club.plantel.find((j) => j.id === jugadorId);
  if (!jugador) return true;
  const resto = club.plantel.filter((j) => j.id !== jugadorId);
  if (resto.length < TOPE_PLANTEL_MINIMO) return false;
  if (jugador.posicion === 'ARQ' && resto.filter((j) => j.posicion === 'ARQ').length < PISO_ARQUEROS) return false;
  return true;
}

// Aplica el piso sobre un resultado ya calculado de vigentes/candidatos a
// liberar (compartido por avanzarContratos y avanzarContratosIA, cada una
// con su propio criterio de a quién le toca vencer/renovar ANTES de
// llegar acá) — si liberar a todos los candidatos deja el plantel sin
// arqueros suficientes o por debajo del mínimo, se "salva" a los
// necesarios con una renovación corta (2 años, salario justo) en vez de
// dejarlos ir: primero arqueros (hasta completar el piso), después el
// resto por mejor GRL (hasta completar el tamaño mínimo) — así el jugador
// salvado es el más útil disponible, no uno al azar.
const ANIOS_RENOVACION_DE_PISO = 2;

function aplicarPisoDePlantel(
  vigentes: Jugador[],
  candidatosLiberar: Jugador[],
  multiplicadorLiga?: number,
): { vigentes: Jugador[]; liberados: Jugador[]; renovadosPorPiso: Jugador[] } {
  const arquerosVigentes = vigentes.filter((j) => j.posicion === 'ARQ').length;
  const faltanArqueros = Math.max(0, PISO_ARQUEROS - arquerosVigentes);
  const arquerosASalvar = [...candidatosLiberar]
    .filter((j) => j.posicion === 'ARQ')
    .sort((a, b) => b.grl - a.grl)
    .slice(0, faltanArqueros);

  const idsArquerosSalvados = new Set(arquerosASalvar.map((j) => j.id));
  const faltanParaMinimo = Math.max(0, TOPE_PLANTEL_MINIMO - (vigentes.length + arquerosASalvar.length));
  const otrosASalvar = [...candidatosLiberar]
    .filter((j) => !idsArquerosSalvados.has(j.id))
    .sort((a, b) => b.grl - a.grl)
    .slice(0, faltanParaMinimo);

  const salvados = [...arquerosASalvar, ...otrosASalvar];
  const idsSalvados = new Set(salvados.map((j) => j.id));
  const renovadosPorPiso = salvados.map((j) => renovarContrato(j, calcularSalarioJusto(j, multiplicadorLiga), ANIOS_RENOVACION_DE_PISO));

  return {
    vigentes: [...vigentes, ...renovadosPorPiso],
    liberados: candidatosLiberar
      .filter((j) => !idsSalvados.has(j.id))
      .map((j) => ({
        ...j, clubId: null, contratoAniosRestantes: 0, salario: 0, transferible: false,
      })),
    renovadosPorPiso,
  };
}

// Al cerrar la temporada: descuenta un año a cada contrato del plantel;
// los que llegan a 0 salen del club y quedan libres (clubId: null) — salvo
// que liberarlos rompa el piso obligatorio de arriba, en cuyo caso se
// renuevan solos en vez de irse. `renovadosPorPiso` (pedido explícito,
// "sistema de notificaciones... que se renuevan los contratos
// automaticamente o que se vencen") — se expone para que useGameStore.ts
// pueda avisarle al usuario CUÁLES jugadores pasó cada cosa, con toast +
// noticia + badge en Plantel.
export function avanzarContratos(club: Club): { club: Club; liberados: Jugador[]; renovadosPorPiso: Jugador[] } {
  const vigentesDeEntrada: Jugador[] = [];
  const candidatosLiberar: Jugador[] = [];

  club.plantel.forEach((jugador) => {
    const restante = jugador.contratoAniosRestantes - 1;
    if (restante <= 0) {
      candidatosLiberar.push(jugador);
      return;
    }
    vigentesDeEntrada.push({ ...jugador, contratoAniosRestantes: restante });
  });

  const { vigentes, liberados, renovadosPorPiso } = aplicarPisoDePlantel(
    vigentesDeEntrada, candidatosLiberar, multiplicadorSalarialDeLiga(club.liga),
  );
  const idsLiberados = new Set(liberados.map((j) => j.id));

  return {
    club: {
      ...club,
      plantel: vigentes,
      titularesIds: club.titularesIds.filter((id) => !idsLiberados.has(id)),
      suplentesIds: club.suplentesIds.filter((id) => !idsLiberados.has(id)),
    },
    liberados,
    renovadosPorPiso,
  };
}

// Contrato nuevo al fichar a alguien que no lo tenía (libre o canterano
// recién aceptado). Las transferencias entre clubes (mercado 6.2/6.3) NO
// pasan por acá — arrancan con un contrato piso armado a mano en
// ofertarPorJugador (useGameStore.ts), no con este generador.
//
// multiplicadorLiga (pedido explícito, mercado realista — ver
// economiaLigas.ts): qué tan bien paga la liga del club que ficha, para
// que un club de Liga Profesional no le ponga sueldo de Premier League a
// un canterano/libre. Opcional con default para no romper call-sites/tests
// que todavía no pasan el club.
//
// aniosElegidos (pedido explícito, "elegir años al renovar/fichar" —
// docs/anios-contrato-y-fichajes.md): antes SIEMPRE salían sorteados acá
// (randomEntero(1,4)), sin que el usuario los viera ni eligiera. Opcional
// con ese mismo sorteo de default — sigue así para la IA (fichajes de
// canteranos automáticos, ver useGameStore.ts) y para los call-sites/tests
// que no pasan nada; PantallaOfertaCantera.tsx sí pasa un valor elegido
// por el usuario cuando es el propio DT quien ficha al canterano.
export function asignarContrato(jugador: Jugador, clubId: string, multiplicadorLiga?: number, aniosElegidos?: number): Jugador {
  return {
    ...jugador,
    clubId,
    contratoAniosRestantes: aniosElegidos ?? randomEntero(1, 4),
    salario: calcularSalario(jugador.valorMercado, multiplicadorLiga),
    transferible: false,
  };
}

// -------------------- renovación de contrato (pedido explícito) --------------------
//
// Hasta ahora no había forma de retener a un jugador propio salvo que el
// contrato original (sorteado al azar entre 1-4 años) le alcanzara — un
// crack de 4 años atrás podía irse de la nada. Con esto el usuario puede
// ofertar una renovación cuando le quedan pocos años, con una probabilidad
// de que la acepte según qué tan cerca esté la oferta de lo que el
// jugador "merece" (mismo criterio que calcularSalario).

// Lo que el jugador "espera" ganar hoy — recalculado sobre el valorMercado
// actual, no el que tenía cuando firmó el contrato original. A propósito
// NO reusa calcularSalario (que sortea 1-2% al azar): esto se muestra en
// pantalla como referencia Y se usa para calcular la probabilidad de
// aceptación, así que tiene que dar el mismo número cada vez que se
// llama con el mismo jugador — variar en cada render/cálculo haría que
// la referencia mostrada no fuera la que realmente decide si acepta.
// multiplicadorLiga (pedido explícito, mercado realista — ver
// economiaLigas.ts): antes era un 1.5% fijo del valorMercado sin importar
// la liga del club, igual que calcularSalario antes de la recalibración.
// Opcional con default para no romper call-sites/tests existentes.
export function calcularSalarioJusto(jugador: Jugador, multiplicadorLiga = MULTIPLICADOR_SALARIAL_DEFAULT): number {
  return Math.round(jugador.valorMercado * multiplicadorLiga);
}

// Misma forma que probabilidadAceptarOferta (mercado.ts) pero sin el
// ajuste por DT vendedor — acá no hay un DT rival de por medio, es tu
// propio jugador negociando directo con vos.
//
// aniosElegidos (pedido explícito, "elegir años al renovar/fichar"):
// pedir más años de los que un jugador normalmente firmaría (>3) le baja
// un poco las ganas de aceptar — no es gratis pedir siempre el máximo.
// Default en 3 (el punto medio que ya usa la UI) para no romper
// call-sites/tests que todavía no pasan nada.
const PENALIZACION_POR_ANIO_EXTRA = 0.08;
const ANIOS_SIN_PENALIZACION = 3;

export function probabilidadAceptarRenovacion(salarioOfrecido: number, salarioJusto: number, aniosElegidos = ANIOS_SIN_PENALIZACION): number {
  const factor = clamp(salarioOfrecido / (salarioJusto * 1.1), 0, 1.3);
  const penalizacion = Math.max(0, aniosElegidos - ANIOS_SIN_PENALIZACION) * PENALIZACION_POR_ANIO_EXTRA;
  return clamp(factor - penalizacion, 0, 1);
}

// aniosElegidos (pedido explícito): antes SIEMPRE salía sorteado
// (randomEntero(2,4)) — ahora lo elige el usuario en NegociacionRenovacion.tsx
// (rango 1-5, default 3). Default en 3 acá también para avanzarContratosIA
// más abajo (la IA no negocia años, sólo salario).
export function renovarContrato(jugador: Jugador, nuevoSalario: number, aniosElegidos = ANIOS_SIN_PENALIZACION): Jugador {
  return {
    ...jugador,
    contratoAniosRestantes: aniosElegidos,
    salario: nuevoSalario,
  };
}

// Bug encontrado jugando (no un pedido nuevo): sólo el usuario podía
// renovar contratos — los clubes de la IA no tenían ningún equivalente,
// así que TODOS sus jugadores se iban apenas se les acababa el contrato
// (como mucho 4 años) sin que nada los reemplazara de forma sostenible.
// Sumado a que los canteranos de la IA se agregaban sin contrato (ver
// useGameStore.ts), los planteles se vaciaban en cascada con el correr
// de las temporadas. Esto le da a la IA un equivalente automático de la
// renovación del usuario: antes de liberar a alguien por vencimiento,
// intenta retenerlo ofreciendo el salario "justo" — probabilidad alta
// pero no garantizada, para que siga habiendo rotación de plantel.
const PROB_RENOVACION_IA = 0.75;

export function avanzarContratosIA(club: Club): { club: Club; liberados: Jugador[] } {
  const vigentesTrasProbabilidad: Jugador[] = [];
  const candidatosLiberar: Jugador[] = [];
  const multiplicadorLiga = multiplicadorSalarialDeLiga(club.liga);

  club.plantel.forEach((jugador) => {
    const restante = jugador.contratoAniosRestantes - 1;
    if (restante > 0) {
      vigentesTrasProbabilidad.push({ ...jugador, contratoAniosRestantes: restante });
      return;
    }
    if (Math.random() < PROB_RENOVACION_IA) {
      vigentesTrasProbabilidad.push(renovarContrato(jugador, calcularSalarioJusto(jugador, multiplicadorLiga)));
      return;
    }
    candidatosLiberar.push(jugador);
  });

  // Piso obligatorio (pedido explícito, ver aplicarPisoDePlantel arriba) —
  // backstop DESPUÉS del sorteo de retención: si la mala suerte dejó a la
  // IA sin arqueros o por debajo del mínimo, se salva a los necesarios acá
  // en vez de dejar un club rival roto (rompería también SUS partidos).
  const { vigentes, liberados } = aplicarPisoDePlantel(vigentesTrasProbabilidad, candidatosLiberar, multiplicadorLiga);
  const idsLiberados = new Set(liberados.map((j) => j.id));

  return {
    club: {
      ...club,
      plantel: vigentes,
      titularesIds: club.titularesIds.filter((id) => !idsLiberados.has(id)),
      suplentesIds: club.suplentesIds.filter((id) => !idsLiberados.has(id)),
    },
    liberados,
  };
}
