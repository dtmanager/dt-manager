// Mercado natural entre clubes de la IA (pedido explícito): "quiero que en
// el mercado de intercambio en liga los jugadores se vayan intercambiando
// naturalmente entre equipos [...] si de repente tiene 85 de media lo
// tiene que comprar un equipo de Europa". Hasta ahora la única forma de
// que un jugador rival cambiara de club era que el USUARIO ofertara por
// él (6.2/6.3) — entre clubes de la IA nunca pasaba nada, así que un
// crack nacido en un club chico se quedaba ahí toda la carrera.
//
// Se corre una vez por cierre de temporada (procesarFinDeTemporada), sobre
// TODOS los clubes menos el del usuario, en dos pasos por jugador
// "vendible" (ver jugadoresVendiblesIA):
//   1. ¿Se lo lleva un club de Europa/afuera de la liga simulada? — sólo
//      si su grl ya superó el "techo" de lo que esa liga puede sostener
//      (ver techoGrlDomestico). El jugador sale del universo simulado
//      (mismo criterio que ya usa liga.ts para no simular las ~21 ligas en
//      paralelo — ver generarLigaConClubExistente): no hay a dónde
//      "agregarlo", se resuelve como una salida con un cheque a cambio.
//   2. Si no, ¿lo compra otro club DOMÉSTICO? Reusa evaluarOfertasIA
//      (mercado.ts) tal cual — que ya filtra por necesidad de puesto y
//      presupuesto suficiente. Eso solo alcanza para el efecto pedido:
//      valorMercado de un jugador top es una cifra que sólo los clubes
//      grandes (más presupuesto = más escalaEconomica = clubes de más nc)
//      pueden pagar, así que las ofertas que pasan el filtro ya vienen
//      sesgadas hacia "el más rico se lo lleva" sin necesidad de una regla
//      de prestigio aparte.
import type { Club, Jugador } from '../types';
import { clamp, elegirVariosAlAzar, randomUniforme } from './random';
import { evaluarOfertasIA, probabilidadAceptarOferta } from './mercado';
import { asignarDorsalLibre } from './jugadores';
import { multiplicadorSalarialDeLiga } from './economiaLigas';
import { LIGAS } from '../data/ligas';

// A partir de qué tan por encima del nc de su propio club está el grl de
// un jugador se lo considera "desbordado" — un talento que su club ya no
// puede sostener aunque nadie lo haya puesto en venta a propósito (el caso
// "un pibe de Sarmiento que de repente es un crack" del pedido). No hace
// falta que el club lo liste: los ojeadores de afuera lo detectan solos.
const UMBRAL_DESBORDE_NC = 10;

export function jugadorEsVendibleIA(jugador: Jugador, club: Club): boolean {
  if (jugador.transferible) return true;
  return jugador.grl - club.nc >= UMBRAL_DESBORDE_NC;
}

// Techo de grl que la liga doméstica del jugador puede sostener antes de
// que un grande de afuera venga a buscarlo, derivado del multiplicadorSalarial
// de esa liga (economiaLigas.ts, ya investigado — ver ese archivo para las
// fuentes de presupuestos/salarios reales por liga). Cuanto peor paga la
// liga en relación al valor de mercado "global" del jugador, antes se
// dispara la presión de venta al exterior: en la Premier League (mult=0.16)
// el techo queda en ~96 (en la práctica casi nunca se gatilla — ya es un
// destino final), en la Liga Profesional argentina (mult=0.012) baja a
// ~76 (con un jugador de grl 82-85 ya hay presión real de venta afuera,
// que es exactamente el caso que pidió investigar el usuario).
export function techoGrlDomestico(nombreLiga: string): number {
  const mult = multiplicadorSalarialDeLiga(nombreLiga);
  return clamp(74 + mult * 140, 74, 97);
}

// Probabilidad de que un club del exterior se lleve al jugador esta
// temporada. Escala con cuánto grl le sobra respecto al techo de su liga,
// y con la edad: Europa compra sobre todo upside joven, no estrellas
// domésticas de 32 años que ya pasaron su ventana de salida.
export function probabilidadExportacion(jugador: Jugador, nombreLiga: string): number {
  const techo = techoGrlDomestico(nombreLiga);
  const exceso = jugador.grl - techo;
  if (exceso <= 0) return 0;
  let prob = clamp(exceso * 0.09, 0, 0.65);
  if (jugador.edad <= 23) prob *= 1.3;
  else if (jugador.edad >= 30) prob *= 0.4;
  return clamp(prob, 0, 0.75);
}

// Ligas "de destino" para la salida al exterior — las top-5 europeas más
// alguna candidata de nivel medio-alto, mismo pool de datos reales que ya
// usa generarClubesExtranjeros (mercado.ts) para el mercado internacional
// "arcade". Sólo se usa para sacar un nombre de club real y darle sabor al
// anuncio de transferencia — el club de destino no se simula ni se agrega
// a ningún lado (mismo criterio que el resto del juego con ligas no
// simuladas en paralelo).
const LIGAS_DESTINO_EXPORTACION = new Set([
  'Premier League', 'LaLiga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Eredivisie', 'Primeira Liga',
]);

function elegirClubDestinoExterior(nombreLigaOrigen: string): { clubNombre: string; ligaNombre: string } {
  const pool = LIGAS
    .filter((l) => l.disponible && l.nombre !== nombreLigaOrigen && LIGAS_DESTINO_EXPORTACION.has(l.nombre))
    .flatMap((l) => l.clubes.map((c) => ({ club: c, nombreLiga: l.nombre })));
  if (pool.length === 0) return { clubNombre: 'un club del exterior', ligaNombre: 'Europa' };
  const [elegido] = elegirVariosAlAzar(pool, 1);
  return { clubNombre: elegido.club.nombre, ligaNombre: elegido.nombreLiga };
}

export interface MovimientoMercadoIA {
  jugadorId: string;
  jugadorNombre: string;
  clubOrigenId: string;
  clubOrigenNombre: string;
  clubDestinoNombre: string; // nombre del club comprador, o del club "de afuera" en una exportación
  ligaDestinoNombre?: string; // sólo en exportaciones
  monto: number;
  tipo: 'domestico' | 'exterior';
}

// Orquesta el mercado IA-IA de fin de temporada. Devuelve los clubes
// actualizados (ventas ejecutadas: plantel, presupuesto) y la lista de
// movimientos para mostrarle al usuario como novedades de mercado.
export function simularTransferenciasIA(
  clubes: Record<string, Club>,
  clubUsuarioId: string,
): { clubes: Record<string, Club>; movimientos: MovimientoMercadoIA[] } {
  let clubesActuales = { ...clubes };
  const movimientos: MovimientoMercadoIA[] = [];
  // Un jugador recién comprado por el club B puede terminar en los
  // "vendibles" de B si el forEach externo llega a B más tarde en esta
  // misma pasada (B es tanto comprador como potencial origen dentro del
  // mismo Object.values(clubes)) — sin este set se podía revender dos
  // veces al mismo jugador en un solo simularTransferenciasIA.
  const jugadoresMovidos = new Set<string>();

  Object.values(clubes)
    .filter((c) => c.id !== clubUsuarioId)
    .forEach((clubOrigenOriginal) => {
      const clubOrigen = clubesActuales[clubOrigenOriginal.id];
      if (!clubOrigen) return;

      const vendibles = clubOrigen.plantel.filter((j) => jugadorEsVendibleIA(j, clubOrigen));

      vendibles.forEach((jugador) => {
        // El jugador puede haber sido vendido ya en una iteración anterior
        // de este mismo forEach (dos "vendibles" del mismo club no pueden
        // irse los dos si el primero ya te dejó sin cupo/cambió el
        // plantel) — se vuelve a leer el club actual antes de cada intento.
        const clubActual = clubesActuales[clubOrigen.id];
        if (!clubActual || !clubActual.plantel.some((j) => j.id === jugador.id)) return;
        if (jugadoresMovidos.has(jugador.id)) return;

        const probExport = probabilidadExportacion(jugador, clubActual.liga);
        if (probExport > 0 && Math.random() < probExport) {
          const monto = Math.round(jugador.valorMercado * randomUniforme(1.0, 1.35));
          const { clubNombre, ligaNombre } = elegirClubDestinoExterior(clubActual.liga);
          clubesActuales = {
            ...clubesActuales,
            [clubActual.id]: {
              ...clubActual,
              plantel: clubActual.plantel.filter((j) => j.id !== jugador.id),
              titularesIds: clubActual.titularesIds.filter((id) => id !== jugador.id),
              suplentesIds: clubActual.suplentesIds.filter((id) => id !== jugador.id),
              presupuesto: clubActual.presupuesto + monto,
            },
          };
          movimientos.push({
            jugadorId: jugador.id,
            jugadorNombre: jugador.nombre,
            clubOrigenId: clubActual.id,
            clubOrigenNombre: clubActual.nombre,
            clubDestinoNombre: clubNombre,
            ligaDestinoNombre: ligaNombre,
            monto,
            tipo: 'exterior',
          });
          jugadoresMovidos.add(jugador.id);
          return;
        }

        const ofertas = evaluarOfertasIA(jugador, clubActual.id, clubesActuales)
          .filter((o) => o.clubOfertanteId !== clubUsuarioId);
        if (ofertas.length === 0) return;

        const mejorOferta = ofertas.reduce((mejor, o) => (o.monto > mejor.monto ? o : mejor));
        const comprador = clubesActuales[mejorOferta.clubOfertanteId];
        if (!comprador) return;

        const prob = probabilidadAceptarOferta(mejorOferta.monto, jugador.valorMercado, clubActual.dt);
        if (Math.random() >= prob) return;

        // Las transferencias entre clubes no reasignan contrato (mismo
        // criterio que el mercado del usuario en useGameStore.ts) — el
        // jugador se lleva el que ya tenía.
        const jugadorTransferido: Jugador = { ...jugador, clubId: comprador.id, transferible: false, dorsal: asignarDorsalLibre(comprador.plantel, jugador.posicion) };

        clubesActuales = {
          ...clubesActuales,
          [clubActual.id]: {
            ...clubActual,
            plantel: clubActual.plantel.filter((j) => j.id !== jugador.id),
            titularesIds: clubActual.titularesIds.filter((id) => id !== jugador.id),
            suplentesIds: clubActual.suplentesIds.filter((id) => id !== jugador.id),
            presupuesto: clubActual.presupuesto + mejorOferta.monto,
          },
          [comprador.id]: {
            ...comprador,
            plantel: [...comprador.plantel, jugadorTransferido],
            presupuesto: comprador.presupuesto - mejorOferta.monto,
          },
        };
        movimientos.push({
          jugadorId: jugador.id,
          jugadorNombre: jugador.nombre,
          clubOrigenId: clubActual.id,
          clubOrigenNombre: clubActual.nombre,
          clubDestinoNombre: comprador.nombre,
          monto: mejorOferta.monto,
          tipo: 'domestico',
        });
        jugadoresMovidos.add(jugador.id);
      });
    });

  return { clubes: clubesActuales, movimientos };
}
