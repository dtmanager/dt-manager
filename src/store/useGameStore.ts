// Estado global del modo carrera (Zustand + persist en localStorage — no
// hace falta backend, sección 2 de la spec). Wrappea el motor puro de
// src/engine/ — el store es la única parte que "muta" el mundo.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Club, Jugador, Liga, NoticiaItem, OfertaTransferencia, Partido, RespuestaOferta,
} from '../types';
import type { MentalidadPartido } from '../engine/partido';
import {
  actividadTemporadaVacia, evolucionarDT, evolucionarReputacionDT, type ActividadTemporadaDT,
} from '../engine/progresoDT';
import { calcularMovimientoSemanal, type MovimientoSemanal } from '../engine/economiaSemanal';
import {
  abrirEtapaClub, actualizarCarreraPorPartidos, actualizarIdolatria, carreraDTVacia, cerrarEtapaClub, registrarCanterano,
  registrarFichaje, registrarTituloLigaSiCorresponde, registrarTituloSiCorresponde, titulosNuevosDesde,
  type CarreraDT, type TituloGanado,
} from '../engine/carreraDT';
import {
  generarOfertasDT, generarOfertasRescate, type OfertaDT, type OfertaRescateDT,
} from '../engine/ofertasDT';
import {
  avanzarContratoDT, contratoDTInicial, ofertaRenovacionDT, renovarContratoDT, type RenovacionDT,
} from '../engine/contratoDT';
import { generarNombreJugador } from '../engine/nombres';
import { LIGAS } from '../data/ligas';
import {
  aplicarAscensoDescensoIA, generarDT, generarLigaConClubExistente, generarLigaInicial, type LicenciaDT,
} from '../engine/liga';
import {
  generarFixture, proximaFechaSinJugar, simularJornada, simularPartidoDeFixture, calcularTabla,
} from '../engine/fixture';
import { generarPretemporada } from '../engine/pretemporada';
import {
  evaluarOfertasIA, generarClubesExtranjeros, probabilidadAceptarOferta, rotarListadosIA, semanaAperturaVentanaInvierno,
} from '../engine/mercado';
import { simularTransferenciasIA, type MovimientoMercadoIA } from '../engine/mercadoIA';
import {
  campeonMundialDeClubesDelMundo, copasContinentalesDelMundo, copasNacionalesDelMundo, type CampeonDelMundo,
} from '../engine/campeonesDelMundo';
import { aplicarDesgastePostFecha, aplicarRotacionPreFecha, type LesionOcurrida } from '../engine/desgaste';
import { aplicarEstadisticasPostFecha, tablaGoleadores } from '../engine/estadisticasPartido';
import { aplicarTarjetasPostFecha, type TarjetaOcurrida } from '../engine/tarjetas';
import { evolucionarClub, generarCanteranosClub } from '../engine/finDeTemporada';
import { asignarDorsalLibre } from '../engine/jugadores';
import {
  agregarNoticias, generarNoticiaConfianzaDirectiva, generarNoticiasContrato, generarNoticiasDestacado, generarNoticiasFichaje,
  generarNoticiasGoleador, generarNoticiasJoya, generarNoticiasResultado, generarRumoresMercado,
} from '../engine/noticias';
import { useToastStore } from './useToastStore';
import { evaluarOferta, PENALIZACION_PRESION_RIVAL } from '../engine/negociacion';
import {
  actualizarConfianza, ajustarConfianzaPorPresupuesto, asignarObjetivoTemporada, CONFIANZA_INICIAL, DESPIDO_HABILITADO,
  evaluarObjetivoTemporada, INCUMPLIMIENTOS_PARA_DESPIDO, type ObjetivoTemporada,
} from '../engine/objetivos';
import {
  asignarContrato, avanzarContratos, avanzarContratosIA, calcularSalarioJusto, hayCupo, probabilidadAceptarRenovacion,
  puedeLiberarSinRomperPiso, puedeRenovar, renovarContrato,
} from '../engine/contratos';
import {
  clasificaParaCopa, generarCopaMundialClubes, simularProximaEtapaMundial, simularProximaFechaGruposMundial,
  type CopaMundialClubes,
} from '../engine/copaMundialClubes';
import {
  calcularPremio, calcularSueldosTemporada, calcularTaquilla, estaEnZonaAscenso, estaEnZonaDescenso,
  type ResumenTemporada,
} from '../engine/economia';
import { multiplicadorSalarialDeLiga } from '../engine/economiaLigas';
import { copaNacionalDeLiga, cuposContinentalesDeLiga, ligaInferiorDe, ligaSuperiorDe } from '../engine/competicionesConfig';
import { generarCopaNacional, simularRondaCopaNacional, type CopaNacional } from '../engine/copaNacional';
import {
  generarTorneoConmebol, simularProximaEtapaConmebol, simularProximaFechaGruposConmebol, type TorneoConmebol,
} from '../engine/libertadoresYSudamericana';
import {
  generarCompeticionSuiza, simularProximaEtapaSuizaCompeticion, simularProximaFechaSuizaCompeticion,
  type CompeticionSuiza,
} from '../engine/championsEuropaConference';
import type { FilaEstadistica } from '../engine/tablaEstadistica';

// Bug reportado: los goles/asistencias de copas (Nacional, Mundial de
// Clubes, Libertadores/Sudamericana, Champions/Europa/Conference) nunca
// se sumaban a `estadisticasTemporada` del jugador — sólo la liga
// doméstica llamaba a aplicarEstadisticasPostFecha. El perfil del
// jugador y la tabla de goleadores de PantallaLiga sólo reflejaban
// partidos de liga. Estas dos funciones extraen TODOS los Partido de
// cualquiera de las 4 competiciones (duck-typed: cada una tiene un
// subconjunto distinto de grupos/fixtureFaseLiga/playoffAcceso/bracket/
// rondas) y comparan antes/después de cada acción para sumarle al jugador
// SÓLO los partidos recién jugados en esa acción — no todos los ya
// jugados, que ya estaban contados en acciones anteriores.
function todosLosPartidosDeCopa(copa: {
  grupos?: { fixture: Partido[] }[];
  fixtureFaseLiga?: Partido[];
  playoffAcceso?: { partidoIda: Partido | null; partidoVuelta: Partido }[];
  bracket?: { llaves: { partidoIda: Partido | null; partidoVuelta: Partido }[] }[];
  rondas?: { llaves: { partidoIda: Partido | null; partidoVuelta: Partido }[] }[];
}): Partido[] {
  const partidos: Partido[] = [];
  copa.grupos?.forEach((g) => partidos.push(...g.fixture));
  if (copa.fixtureFaseLiga) partidos.push(...copa.fixtureFaseLiga);
  const agregarLlaves = (llaves: { partidoIda: Partido | null; partidoVuelta: Partido }[]) => {
    llaves.forEach((ll) => {
      if (ll.partidoIda) partidos.push(ll.partidoIda);
      partidos.push(ll.partidoVuelta);
    });
  };
  if (copa.playoffAcceso) agregarLlaves(copa.playoffAcceso);
  copa.bracket?.forEach((ronda) => agregarLlaves(ronda.llaves));
  copa.rondas?.forEach((ronda) => agregarLlaves(ronda.llaves));
  return partidos;
}

// Devuelve también `partidosNuevos` (antes se descartaba) — noticias de
// copas (pedido explícito: "que las noticias cubran también las copas, no
// sólo la liga") necesita exactamente esta misma lista de partidos recién
// jugados para generar resultado/destacado, sin duplicar la lógica de
// diff que ya hace esta función.
function aplicarGolesDeCopaAlClub(
  clubesLiga: Record<string, Club>,
  copaAntes: Parameters<typeof todosLosPartidosDeCopa>[0],
  copaDespues: Parameters<typeof todosLosPartidosDeCopa>[0],
): { clubes: Record<string, Club>; partidosNuevos: Partido[] } {
  const idsAntes = new Set(
    todosLosPartidosDeCopa(copaAntes).filter((p) => p.golesLocal != null).map((p) => p.id),
  );
  const partidosNuevos = todosLosPartidosDeCopa(copaDespues).filter((p) => p.golesLocal != null && !idsAntes.has(p.id));
  if (partidosNuevos.length === 0) return { clubes: clubesLiga, partidosNuevos };
  return { clubes: aplicarEstadisticasPostFecha(clubesLiga, partidosNuevos), partidosNuevos };
}

// Noticias de resultado/destacado para una tanda de partidos de copa
// (pedido explícito, ver nota arriba) — mismas funciones que ya usa la
// liga (engine/noticias.ts), sin categoría "goleador": esa tabla está
// scopeada a `liga.clubIds` y a un título ("nuevo goleador DE LA LIGA")
// que no tiene sentido disparado por un gol de Champions/Libertadores/etc.
function generarNoticiasDeCopa(
  partidosNuevos: Partido[],
  clubes: Record<string, Club>,
  clubUsuarioId: string,
  temporada: number,
): NoticiaItem[] {
  if (partidosNuevos.length === 0) return [];
  return [
    ...generarNoticiasResultado(partidosNuevos, clubes, clubUsuarioId, temporada),
    ...generarNoticiasDestacado(partidosNuevos, clubes, clubUsuarioId, temporada),
  ];
}

// Carrera del DT en una tanda de partidos de copa (pedido explícito, ver
// engine/carreraDT.ts) — junta partidos dirigidos/mentalidad y detección
// de título nuevo (campeonId antes/después) en una sola llamada, para no
// repetir la misma composición de dos funciones en cada una de las ~11
// acciones de copa de más abajo.
function actualizarCarreraDeCopa(
  carreraActual: CarreraDT,
  partidosNuevos: Partido[],
  clubes: Record<string, Club>,
  clubUsuarioId: string,
  campeonIdAntes: string | null,
  campeonIdDespues: string | null,
  competencia: string,
  temporada: number,
): CarreraDT {
  const conPartidos = actualizarCarreraPorPartidos(carreraActual, partidosNuevos, clubUsuarioId, clubes[clubUsuarioId]?.mentalidad);
  return registrarTituloSiCorresponde(conPartidos, campeonIdAntes, campeonIdDespues, clubUsuarioId, competencia, temporada);
}

export interface FinCarrera {
  // 'renuncia': pedido explícito, contrato propio del DT (engine/contratoDT.ts)
  // — se venció el contrato y el usuario rechazó la renovación que ofreció
  // el club, a diferencia de 'despedido'/'descenso' que son decisiones del
  // motor, no del jugador.
  motivo: 'descenso' | 'despedido' | 'renuncia';
  temporada: number;
}

export interface CambioDeLiga {
  destino: string; // id de LIGAS
  // 'oferta': pedido explícito, "ofertas de otros clubes extranjeros" —
  // aceptar una oferta de un club de OTRA liga (ver aceptarOfertaDT) usa
  // el mismo mecanismo que ascenso/descenso para reconstruir la liga de
  // destino entera en finalizarTemporada (generarLigaConClubExistente).
  motivo: 'ascenso' | 'descenso' | 'oferta';
}

interface GameState {
  liga: Liga | null;
  clubes: Record<string, Club>;
  clubUsuarioId: string | null;
  ofertasRecibidas: OfertaTransferencia[];
  canteranosOfrecidos: Jugador[];
  // Rotación/lesiones (pedido explícito, ver engine/desgaste.ts): lesiones
  // nuevas del club del usuario en la última fecha simulada. Se pisa cada
  // vez que se simula una fecha o la temporada completa.
  ultimasLesiones: LesionOcurrida[];
  // Sistema de tarjetas (pedido explícito, ver engine/tarjetas.ts):
  // tarjetas nuevas del club del usuario en la última fecha simulada que
  // generaron una suspensión (roja, o quinta amarilla) — mismo criterio
  // que ultimasLesiones, se pisa cada vez que se simula.
  ultimasTarjetas: TarjetaOcurrida[];
  // Mercado IA-IA (pedido explícito, ver engine/mercadoIA.ts): fichajes
  // ejecutados entre clubes de la IA (y salidas al exterior) en el último
  // cierre de temporada — para mostrarle al usuario "novedades" en el
  // resumen de fin de temporada.
  movimientosMercado: MovimientoMercadoIA[];
  // Sistema de noticias (pedido explícito, ver docs/sistema-noticias.md y
  // engine/noticias.ts): a diferencia de ultimasLesiones/ultimasTarjetas,
  // ACÁ SÍ se acumula (con tope, ver agregarNoticias) en vez de pisarse —
  // el carrusel de noticias del Hub necesita contenido para rotar aunque
  // el usuario simule fecha por fecha, no sólo la última tanda.
  noticias: NoticiaItem[];
  // Campeones del resto del mundo (pedido explícito, ver
  // engine/campeonesDelMundo.ts): copas nacionales de otros países y
  // continentales que el usuario no jugó de verdad esta temporada, con un
  // campeón de sabor sorteado por nc (sin simular nada). Se pisa en cada
  // cierre de temporada.
  campeonesDelMundo: CampeonDelMundo[];
  copaMundialClubes: CopaMundialClubes | null;
  copaNacional: CopaNacional | null;
  copaConmebol: TorneoConmebol | null;
  copaUefa: CompeticionSuiza | null;
  resumenTemporada: ResumenTemporada | null;
  finCarrera: FinCarrera | null;
  cambioDeLigaPendiente: CambioDeLiga | null;
  // Objetivo de temporada + riesgo de despido (pedido explícito, ver
  // engine/objetivos.ts): objetivo asignado por la directiva para la
  // temporada EN CURSO (se reasigna en iniciarPartidaNueva y en cada
  // finalizarTemporada), confianza acumulada (0-100, sube/baja al cerrar
  // cada temporada según se haya cumplido o no), y cuántas temporadas
  // seguidas SIN cumplirlo lleva el usuario (se resetea a 0 en cuanto
  // cumple una) — a los 2 seguidos, despedido.
  objetivoTemporada: ObjetivoTemporada | null;
  confianzaDirectiva: number;
  objetivosIncumplidosSeguidos: number;
  // Progreso del DT propio (pedido explícito, mecánica 5 de
  // docs/que-le-falta-profundidad.md): cuenta fichajes concretados y
  // canteranos aceptados DURANTE la temporada en curso — se lee y se
  // resetea en procesarFinDeTemporada (evolucionarDT sube mercado o
  // desarrollo según cuál predominó, ver engine/progresoDT.ts).
  actividadTemporadaDT: ActividadTemporadaDT;
  // Economía semanal real (pedido explícito, ver engine/economiaSemanal.ts):
  // un registro por cada fecha de liga jugada en la temporada EN CURSO,
  // sólo del club del usuario — se resetea en cada temporada nueva y se
  // consume (sumado) en procesarFinDeTemporada para mostrar el desglose
  // real de la temporada que termina.
  historialSemanalUsuario: MovimientoSemanal[];
  // Carrera del DT propio (pedido explícito, ver engine/carreraDT.ts):
  // partidos dirigidos/títulos/idolatría/apodo — a diferencia de todo lo
  // demás de esta sección, esto NO se resetea entre temporadas, sólo al
  // arrancar una carrera nueva (o al aceptar una oferta de otro club, que
  // cambia clubUsuarioId pero conserva esto — es la identidad del DT, no
  // del club).
  carreraDT: CarreraDT;
  // Cola de celebraciones pendientes (pedido explícito, animación de
  // "ganaste un trofeo"): cada vez que `carreraDT.titulos` crece (ver
  // titulosNuevosDesde en engine/carreraDT.ts), el título nuevo se agrega
  // acá — un solo partido agrega uno, "simular temporada completa" puede
  // agregar varios de golpe (liga + copa nacional + copa continental,
  // cada una en su propia llamada de store). AnimacionTrofeoOverlay.tsx
  // consume de a uno (consumirCelebracion) y encadena el ghost→reveal→
  // glow de cada uno en cola, nunca superpuestos — no se resetea entre
  // temporadas, sólo al arrancar/reiniciar carrera o al consumirse.
  celebracionesPendientes: TituloGanado[];
  consumirCelebracion: () => void;
  // Ofertas de otros clubes (pedido explícito, "por lo menos 4, 5
  // opciones" — ver engine/ofertasDT.ts): otros clubes de la misma liga
  // pueden querer robarte el DT al cerrar una temporada. Array vacío
  // cuando no hay ninguna ronda de ofertas pendiente.
  ofertasDT: OfertaDT[];
  // Contrato propio del DT (pedido explícito, ver engine/contratoDT.ts):
  // cuando el contrato del DT del usuario llega a 0 temporadas restantes
  // al cerrar la temporada, el club ofrece UNA renovación acá — null
  // cuando no hay ninguna pendiente. A diferencia de ofertasDT (otros
  // clubes te quieren), esto es el MISMO club preguntando si seguís.
  renovacionDT: RenovacionDT | null;
  aceptarRenovacionDT: () => void;
  rechazarRenovacionDT: () => void;
  // Oferta de rescate (pedido explícito: "oferta si te despiden y que te
  // lleguen también otras ofertas según tu GRL y tu rendimiento" — ver
  // engine/ofertasDT.ts). Se llena SÓLO cuando finCarrera se dispara por
  // despido o descenso sin liga inferior — si hay al menos una oferta acá,
  // PantallaFinDeTemporada muestra PantallaOfertaRescate en vez de saltar
  // directo a PantallaRepasoCarrera. Array vacío (no null) tanto cuando no
  // aplica como cuando aplicó pero no hubo suerte — ambos casos terminan
  // en PantallaRepasoCarrera igual, no hace falta distinguirlos en la UI.
  ofertasRescate: OfertaRescateDT[];
  aceptarOfertaRescate: (clubId: string) => void;
  retirarseDT: () => void;
  // ids en `clubes` que son del mercado internacional (se resortean cada
  // temporada) — para poder limpiarlos sin tocar los clubes de la liga.
  clubesExtranjerosIds: string[];
  // Amistosos de pretemporada (pedido explícito, ver engine/pretemporada.ts)
  // — se resortean en cada arranque de carrera y en cada cierre de
  // temporada, igual que copaNacional. Opcionales/sin efecto: jugarlos o
  // no no cambia nada del resto de la carrera.
  partidosPretemporada: Partido[];
  // Badge amarillo de Plantel (pedido explícito, "sistema de
  // notificaciones... que salga la notificacion en amarillo en plantel
  // como salen cuando tenes canteranos" — mismo patrón que
  // canteranosOfrecidos.length en el tab de Cantera). Cuenta
  // renovaciones automáticas + vencimientos de contrato desde la última
  // vez que el usuario abrió Plantel — se resetea con
  // marcarContratoEventosVistos, llamado al entrar a esa pantalla.
  contratoEventosSinVer: number;
  marcarContratoEventosVistos: () => void;

  iniciarPartidaNueva: (
    ligaId: string, clubUsuarioId: string, nombreDT: string, nacionalidadDT?: string, licenciaDT?: LicenciaDT,
  ) => void;
  reiniciarPartida: () => void;
  actualizarAlineacion: (
    clubId: string,
    datos: { formacion: string; titularesIds: string[]; suplentesIds: string[] },
  ) => void;
  // Mentalidad de partido (pedido explícito, mecánica 2 de
  // docs/que-le-falta-profundidad.md): se guarda en el club del usuario y
  // se usa tal cual en cada partido hasta que se cambie de nuevo — no es
  // "por partido", es un dial que queda puesto (ver engine/partido.ts).
  cambiarMentalidad: (clubId: string, mentalidad: MentalidadPartido) => void;
  // Ofertas de otros clubes (pedido explícito, ver engine/ofertasDT.ts):
  // aceptar UNA (de las 4-5 posibles, por eso recibe clubId — mismo
  // patrón que aceptarOfertaRescate) cambia clubUsuarioId al club
  // elegido (conserva SU plantel/formación tal cual estaban, se lleva
  // puesto el DT — atributos, mentalidad, carreraDT — al club nuevo) y le
  // genera un DT de la IA nuevo al club que se deja. Rechazar descarta
  // TODA la ronda de ofertas.
  aceptarOfertaDT: (clubId: string) => void;
  rechazarOfertaDT: () => void;
  simularProximaJornada: () => void;
  simularFixtureCompleto: () => void;
  simularProximoAmistoso: () => void;
  simularPretemporadaCompleta: () => void;

  marcarTransferible: (jugadorId: string, transferible: boolean) => void;
  cambiarDorsal: (jugadorId: string, nuevoDorsal: number) => boolean;
  aceptarOferta: (oferta: OfertaTransferencia) => boolean;
  rechazarOferta: (oferta: OfertaTransferencia) => void;
  // Negociación en rondas (pedido explícito, ver
  // docs/sistema-oferta-fichajes.md): devuelve la RespuestaOferta de esta
  // ronda (aceptada/rechazada_cerca/rechazada_lejos con contraoferta
  // sugerida), o null si la oferta ni siquiera se pudo intentar
  // (presupuesto insuficiente, sin cupo, jugador inexistente, etc. — la UI
  // distingue este caso de un rechazo real de negociación). `ronda` y
  // `presionRival` sólo afectan la probabilidad (presión de una oferta
  // rival cosmética, ver engine/negociacion.ts) — la UI lleva la cuenta de
  // en qué ronda está, el store no guarda estado de negociación.
  ofertarPorJugador: (
    jugadorId: string, clubVendedorId: string, monto: number, ronda?: number, presionRival?: boolean,
  ) => RespuestaOferta | null;
  ofertarRenovacion: (jugadorId: string, nuevoSalario: number, aniosElegidos?: number) => RespuestaOferta | null;

  procesarFinDeTemporada: () => void;
  aceptarCanterano: (jugadorId: string, aniosElegidos?: number) => boolean;
  descartarCanterano: (jugadorId: string) => void;
  finalizarTemporada: () => void;

  simularProximaFechaCopaMundial: () => void;
  simularProximaEtapaCopaMundial: () => void;
  simularCopaMundialCompleta: () => void;

  simularProximaRondaCopaNacional: () => void;
  simularCopaNacionalCompleta: () => void;

  simularProximaFechaCopaConmebol: () => void;
  simularProximaEtapaCopaConmebol: () => void;
  simularCopaConmebolCompleta: () => void;

  simularProximaFechaCopaUefa: () => void;
  simularProximaEtapaCopaUefa: () => void;
  simularCopaUefaCompleta: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      liga: null,
      clubes: {},
      clubUsuarioId: null,
      ofertasRecibidas: [],
      canteranosOfrecidos: [],
      ultimasLesiones: [],
      ultimasTarjetas: [],
      movimientosMercado: [],
      noticias: [],
      campeonesDelMundo: [],
      copaMundialClubes: null,
      copaNacional: null,
      copaConmebol: null,
      copaUefa: null,
      resumenTemporada: null,
      finCarrera: null,
      cambioDeLigaPendiente: null,
      objetivoTemporada: null,
      confianzaDirectiva: CONFIANZA_INICIAL,
      objetivosIncumplidosSeguidos: 0,
      actividadTemporadaDT: actividadTemporadaVacia(),
      historialSemanalUsuario: [],
      carreraDT: carreraDTVacia(),
      celebracionesPendientes: [],
      ofertasDT: [],
      renovacionDT: null,
      ofertasRescate: [],
      clubesExtranjerosIds: [],
      partidosPretemporada: [],
      contratoEventosSinVer: 0,

      iniciarPartidaNueva: (ligaId, clubUsuarioId, nombreDT, nacionalidadDT, licenciaDT) => {
        const ligaOpcion = LIGAS.find((l) => l.id === ligaId && l.disponible) ?? LIGAS[0];
        const { liga, clubes: clubesGenerados } = generarLigaInicial(
          ligaOpcion.clubes,
          clubUsuarioId,
          nombreDT,
          ligaOpcion.nombre,
          nacionalidadDT,
          licenciaDT,
        );
        // rotarListadosIA va SÓLO sobre los clubes domésticos — si corriera
        // después de mezclar los extranjeros, les resetearía el
        // transferible que generarClubesExtranjeros les acaba de poner
        // (son clubes distintos, no "clubes de la liga sin listar
        // todavía").
        const clubesExtranjeros = generarClubesExtranjeros(liga.nombre);
        const clubesDomesticos = rotarListadosIA(clubesGenerados, clubUsuarioId);
        const clubes = { ...clubesDomesticos, ...clubesExtranjeros };
        const nombreCopaNacional = copaNacionalDeLiga(liga.nombre);
        set({
          liga,
          clubes,
          clubUsuarioId,
          ofertasRecibidas: [],
          canteranosOfrecidos: [],
          ultimasLesiones: [],
      ultimasTarjetas: [],
          movimientosMercado: [],
          noticias: [],
          campeonesDelMundo: [],
          copaMundialClubes: null,
          // Sólo clubes domésticos — el mercado internacional (clubes de
          // otras ligas, mezclados en `clubes` de acá arriba) no participa
          // de la copa nacional (bug reportado: aparecía el Real Madrid en
          // la Copa Argentina porque generarCopaNacional toma TODOS los
          // clubes que se le pasan, sin filtrar por liga).
          copaNacional: nombreCopaNacional ? generarCopaNacional(nombreCopaNacional, clubesDomesticos) : null,
          copaConmebol: null,
          copaUefa: null,
          resumenTemporada: null,
          finCarrera: null,
          cambioDeLigaPendiente: null,
          objetivoTemporada: asignarObjetivoTemporada(clubesDomesticos[clubUsuarioId], Object.values(clubesDomesticos)),
          confianzaDirectiva: CONFIANZA_INICIAL,
          objetivosIncumplidosSeguidos: 0,
          actividadTemporadaDT: actividadTemporadaVacia(),
          historialSemanalUsuario: [],
          // Historial "club por club" (pedido explícito, ver comentario
          // grande en engine/carreraDT.ts) — arranca la primera etapa acá
          // mismo, temporada 1.
          carreraDT: abrirEtapaClub(carreraDTVacia(), clubUsuarioId, clubesDomesticos[clubUsuarioId].nombre, liga.nombre, 1),
          celebracionesPendientes: [],
          ofertasDT: [],
          renovacionDT: null,
          ofertasRescate: [],
          clubesExtranjerosIds: Object.keys(clubesExtranjeros),
          partidosPretemporada: generarPretemporada(clubUsuarioId, clubes),
          contratoEventosSinVer: 0,
        });
      },

      reiniciarPartida: () =>
        set({
          liga: null,
          clubes: {},
          clubUsuarioId: null,
          ofertasRecibidas: [],
          canteranosOfrecidos: [],
          ultimasLesiones: [],
      ultimasTarjetas: [],
          movimientosMercado: [],
          noticias: [],
          campeonesDelMundo: [],
          copaMundialClubes: null,
          copaNacional: null,
          copaConmebol: null,
          copaUefa: null,
          resumenTemporada: null,
          finCarrera: null,
          cambioDeLigaPendiente: null,
          objetivoTemporada: null,
          confianzaDirectiva: CONFIANZA_INICIAL,
          objetivosIncumplidosSeguidos: 0,
          actividadTemporadaDT: actividadTemporadaVacia(),
          historialSemanalUsuario: [],
          carreraDT: carreraDTVacia(),
          celebracionesPendientes: [],
          ofertasDT: [],
          renovacionDT: null,
          ofertasRescate: [],
          clubesExtranjerosIds: [],
          partidosPretemporada: [],
          contratoEventosSinVer: 0,
        }),

      actualizarAlineacion: (clubId, datos) =>
        set((state) => {
          const club = state.clubes[clubId];
          if (!club) return state;
          return {
            clubes: {
              ...state.clubes,
              [clubId]: { ...club, ...datos },
            },
          };
        }),

      cambiarMentalidad: (clubId, mentalidad) =>
        set((state) => {
          const club = state.clubes[clubId];
          if (!club) return state;
          return {
            clubes: {
              ...state.clubes,
              [clubId]: { ...club, mentalidad },
            },
          };
        }),

      // Ofertas de otros clubes (pedido explícito, ver
      // engine/ofertasDT.ts): aceptar UNA de las 4-5 posibles te lleva a
      // ese club — te llevás puesto tu DT (atributos, mentalidad,
      // partidos/títulos/apodo son de VOS, no del club) y conservás igual
      // el plantel/formación que YA tenía ese club (no es "tu" plantel,
      // es el que había ahí). El club que dejás se queda con un DT de la
      // IA nuevo (mismo generador que usa cualquier club rival). La
      // idolatría SÍ se resetea a 0 (pedido explícito, más abajo) — es el
      // cariño de esa hinchada puntual, no algo transferible.
      aceptarOfertaDT: (clubId) =>
        set((state) => {
          const oferta = state.ofertasDT.find((o) => o.clubId === clubId);
          if (!oferta || !state.clubUsuarioId || !state.liga) return state;
          const clubViejo = state.clubes[state.clubUsuarioId];
          const clubNuevo = state.clubes[oferta.clubId];
          if (!clubViejo || !clubNuevo) return state;
          const clubViejoId = state.clubUsuarioId;

          // CORRECCIÓN (bug reportado: "cuando elijo un club extranjero...
          // no me deja clickear arrancar temporada" — ver engine/ofertasDT.ts,
          // "ofertas de otros clubes extranjeros"): si el club ofertante
          // es de OTRA liga, no alcanza con cambiar clubUsuarioId a secas
          // — ese club no pertenece a NINGÚN Liga cargado (viene del pool
          // efímero clubesExtranjerosIds, sin fixture/tabla propia).
          // finalizarTemporada() reventaba después (asignarObjetivoTemporada
          // recibía undefined) porque el club nuevo no estaba en la liga
          // vieja. Mismo mecanismo que ascenso/descenso: se deja un
          // cambioDeLigaPendiente para que finalizarTemporada arme la
          // liga de destino entera con generarLigaConClubExistente.
          const esExtranjero = oferta.clubLiga !== state.liga.nombre;
          const ligaDestinoOpcion = esExtranjero ? LIGAS.find((l) => l.nombre === oferta.clubLiga && l.disponible) : null;

          // Historial "club por club" (pedido explícito, ver comentario
          // grande en engine/carreraDT.ts) — cierra la etapa en el club
          // viejo (con la idolatría ANTES de resetearla más abajo) y
          // abre la etapa nueva, misma temporada como frontera entre las
          // dos (mismo criterio visual que el mockup de referencia: el
          // año de salida de un club es el mismo que el de llegada al
          // siguiente).
          const carreraConEtapaCerrada = cerrarEtapaClub(state.carreraDT, state.carreraDT.idolatria, state.liga.temporadaActual);

          return {
            clubUsuarioId: oferta.clubId,
            clubes: {
              ...state.clubes,
              [clubViejoId]: {
                ...clubViejo,
                esControladoPorUsuario: false,
                dt: generarDT(generarNombreJugador(), clubViejo.presupuesto),
              },
              [oferta.clubId]: {
                ...clubNuevo,
                esControladoPorUsuario: true,
                // Contrato propio del DT (pedido explícito, ver
                // engine/contratoDT.ts): el DT se lleva sus atributos y su
                // carrera, pero NO el contrato viejo — el club nuevo (más
                // grande, si te está ofertando) negocia uno propio, no
                // hereda el salario/duración que tenías en el club que
                // dejás. Usa los términos que YA se mostraron en la
                // tarjeta de oferta (salarioOfrecido/duracionOfrecida, ver
                // engine/ofertasDT.ts) — no un contratoDTInicial nuevo,
                // que podría no coincidir con lo que el usuario vio antes
                // de aceptar.
                dt: {
                  ...clubViejo.dt,
                  contrato: { salarioAnual: oferta.salarioOfrecido, temporadasRestantes: oferta.duracionOfrecida },
                },
                mentalidad: clubViejo.mentalidad,
              },
            },
            // Ya no es parte del pool efímero de extranjeros — se
            // resortea de cero en finalizarTemporada de todos modos, pero
            // sacarlo ACÁ evita que finalizarTemporada lo borre de
            // clubesSinExtranjeros ANTES de leer cambioDeLigaPendiente
            // (mismo bug de arriba, versión más sutil).
            clubesExtranjerosIds: state.clubesExtranjerosIds.filter((id) => id !== oferta.clubId),
            // Idolatría (pedido explícito, tarjetas de oferta estilo "El
            // dado trajo estas ofertas": "Allá arrancás: Querido (0/100)")
            // — es el cariño de LA HINCHADA de tu club actual (ver
            // engine/carreraDT.ts), no algo que te "llevás puesto" a un
            // club que nunca te vio dirigir. Partidos/títulos/apodo sí
            // siguen siendo tuyos (identidad del DT), la idolatría es del
            // vínculo con ESE club — arranca de 0 en el nuevo.
            carreraDT: abrirEtapaClub(
              { ...carreraConEtapaCerrada, idolatria: 0 },
              oferta.clubId, clubNuevo.nombre, oferta.clubLiga, state.liga.temporadaActual,
            ),
            ofertasDT: [],
            renovacionDT: null,
            cambioDeLigaPendiente: ligaDestinoOpcion
              ? { destino: ligaDestinoOpcion.id, motivo: 'oferta' }
              : state.cambioDeLigaPendiente,
          };
        }),

      rechazarOfertaDT: () => set({ ofertasDT: [] }),

      // Contrato propio del DT (pedido explícito, ver engine/contratoDT.ts):
      // se resuelve en la pantalla de fin de temporada, igual que ofertaDT
      // — aceptar renueva con el club actual (nuevo salario/duración,
      // conserva todo lo demás), rechazar termina la carrera acá mismo
      // (motivo 'renuncia', PantallaFinDeTemporada ya redirige sola a
      // PantallaRepasoCarrera en cuanto finCarrera deja de ser null).
      aceptarRenovacionDT: () =>
        set((state) => {
          const renovacion = state.renovacionDT;
          if (!renovacion || !state.clubUsuarioId) return state;
          const club = state.clubes[state.clubUsuarioId];
          if (!club) return state;
          return {
            clubes: {
              ...state.clubes,
              [state.clubUsuarioId]: { ...club, dt: renovarContratoDT(club.dt, renovacion) },
            },
            renovacionDT: null,
          };
        }),

      rechazarRenovacionDT: () =>
        set((state) => {
          const renovacion = state.renovacionDT;
          if (!renovacion) return state;
          return {
            finCarrera: { motivo: 'renuncia', temporada: renovacion.temporada },
            renovacionDT: null,
            // Historial "club por club" (ver comentario grande en
            // engine/carreraDT.ts) — la renuncia termina la carrera de
            // una (no pasa por oferta de rescate), así que cierra la
            // última etapa acá mismo.
            carreraDT: cerrarEtapaClub(state.carreraDT, state.carreraDT.idolatria, renovacion.temporada),
          };
        }),

      // Oferta de rescate (pedido explícito, ver engine/ofertasDT.ts):
      // aceptar te lleva al club rescatador — mismo criterio de "te
      // llevás tu DT, dejás el plantel" que aceptarOfertaDT (arriba), pero
      // ACÁ además hay que arrancar la temporada siguiente de una: no
      // había "temporada en curso" esperando un finalizarTemporada normal
      // (la carrera ya había terminado), así que después de cambiar de
      // club se llama a finalizarTemporada() directo — reusa toda la
      // lógica de fixture/copaNacional/objetivo/pretemporada nuevos sin
      // duplicarla. confianzaDirectiva/objetivosIncumplidosSeguidos se
      // resetean: es una directiva nueva, no arrastra tu historial con el
      // club anterior.
      aceptarOfertaRescate: (clubId) => {
        const state = get();
        if (!state.finCarrera || !state.clubUsuarioId) return;
        const clubViejo = state.clubes[state.clubUsuarioId];
        const clubDestino = state.clubes[clubId];
        const oferta = state.ofertasRescate.find((o) => o.clubId === clubId);
        if (!clubViejo || !clubDestino || !oferta) return;
        const clubViejoId = state.clubUsuarioId;
        set({
          clubUsuarioId: clubId,
          clubes: {
            ...state.clubes,
            [clubViejoId]: {
              ...clubViejo,
              esControladoPorUsuario: false,
              dt: generarDT(generarNombreJugador(), clubViejo.presupuesto),
            },
            [clubId]: {
              ...clubDestino,
              esControladoPorUsuario: true,
              // Términos ya mostrados en la tarjeta de oferta (ver la
              // misma nota en aceptarOfertaDT, más arriba).
              dt: {
                ...clubViejo.dt,
                contrato: { salarioAnual: oferta.salarioOfrecido, temporadasRestantes: oferta.duracionOfrecida },
              },
              mentalidad: clubViejo.mentalidad,
            },
          },
          // Idolatría a 0 (pedido explícito, mismo criterio que
          // aceptarOfertaDT arriba) — es el cariño de la hinchada del club
          // que dejás, no algo que se lleve a uno nuevo que nunca te vio.
          // Historial "club por club" (ver comentario grande en
          // engine/carreraDT.ts): la etapa del club viejo ya se cerró en
          // procesarFinDeTemporada (despido/descenso, más abajo en este
          // archivo) apenas se supo que la carrera ahí terminaba — acá
          // sólo hace falta abrir la etapa nueva en el club rescatador.
          carreraDT: abrirEtapaClub(
            { ...state.carreraDT, idolatria: 0 },
            clubId, clubDestino.nombre, clubDestino.liga, state.liga?.temporadaActual ?? 0,
          ),
          finCarrera: null,
          ofertasRescate: [],
          confianzaDirectiva: CONFIANZA_INICIAL,
          objetivosIncumplidosSeguidos: 0,
        });
        get().finalizarTemporada();
      },

      // "Retirarme" (pedido explícito): rechazar todas las ofertas de
      // rescate — finCarrera ya estaba seteado (despido/descenso), esto
      // sólo vacía la cola para que PantallaFinDeTemporada caiga a
      // PantallaRepasoCarrera en el próximo render.
      retirarseDT: () => set({ ofertasRescate: [] }),

      // Badge de Plantel (pedido explícito, ver comentario grande en
      // contratoEventosSinVer más arriba) — se llama al abrir Plantel.
      marcarContratoEventosVistos: () => set({ contratoEventosSinVer: 0 }),

      // Saca el primero de la cola de celebraciones (pedido explícito,
      // animación de "ganaste un trofeo") — lo llama
      // AnimacionTrofeoOverlay.tsx cuando termina el ciclo fantasma→
      // aparición→glow de un título, para pasar al siguiente en cola (o
      // cerrar el overlay si no queda ninguno).
      consumirCelebracion: () => set((state) => ({ celebracionesPendientes: state.celebracionesPendientes.slice(1) })),

      // Rotación/desgaste (pedido explícito, ver engine/desgaste.ts): antes
      // de simular una fecha, la IA arma su mejor 11 sano (siempre — no
      // tenía "alineación elegida" propia) y al club del usuario se le
      // reemplazan sólo los titulares lesionados. Después de simular, se
      // desgasta a quien jugó (fatiga + chance de lesión nueva) y descansa
      // el resto del plantel.
      simularProximaJornada: () =>
        set((state) => {
          if (!state.liga || !state.clubUsuarioId) return state;
          const fecha = proximaFechaSinJugar(state.liga.fixture);
          if (fecha == null) return state;

          const clubesPreFecha = aplicarRotacionPreFecha(state.clubes, state.clubUsuarioId);
          const partidosDeLaFecha = state.liga.fixture.filter((p) => p.fecha === fecha && p.golesLocal == null);
          const fixture = simularJornada(state.liga.fixture, fecha, clubesPreFecha, state.clubUsuarioId);
          const { clubes: clubesConDesgaste, lesiones } = aplicarDesgastePostFecha(clubesPreFecha, partidosDeLaFecha);
          // aplicarEstadisticasPostFecha necesita los partidos YA
          // simulados (con .goles) — partidosDeLaFecha de arriba es de
          // antes de simular, sólo sirve para el desgaste (no le importa
          // el resultado, sólo quién jugó).
          const partidosJugados = fixture.filter((p) => p.fecha === fecha);
          const tablaGoleadoresAntes = tablaGoleadores(state.clubes, state.liga.clubIds);
          const clubesConEstadisticas = aplicarEstadisticasPostFecha(clubesConDesgaste, partidosJugados);
          const { clubes: clubesConTarjetasRaw, tarjetas } = aplicarTarjetasPostFecha(clubesConEstadisticas, partidosJugados);
          // Bug reportado ("a veces los jugadores se lesionan o son
          // suspendidos y siguen en el 11 inicial"): aplicarDesgastePostFecha/
          // aplicarTarjetasPostFecha sólo tocan partidosLesionRestantes/
          // partidosSuspensionRestantes en el plantel — NO sacan al jugador
          // de titularesIds. Antes eso recién se corregía en la PRÓXIMA
          // fecha (aplicarRotacionPreFecha, arriba, antes de simular), así
          // que entre una fecha y la otra el 11 mostrado (Hub/Armar equipo)
          // podía seguir listando a alguien que se lesionó/vio una tarjeta
          // en el partido que se acaba de jugar. Mismo reemplazo, aplicado
          // de una — reemplazarLesionados ya cubre lesión Y suspensión
          // (estaDisponible, engine/desgaste.ts).
          const clubesConTarjetas = aplicarRotacionPreFecha(clubesConTarjetasRaw, state.clubUsuarioId);

          // Noticias de la fecha (pedido explícito, ver engine/noticias.ts
          // y docs/sistema-noticias.md) — resultado/goleador/destacado
          // salen 100% de lo que se acaba de simular, sin tocar el
          // resultado en sí (post-procesamiento puro).
          const noticiasFecha = [
            ...generarNoticiasResultado(partidosJugados, clubesConEstadisticas, state.clubUsuarioId, state.liga.temporadaActual),
            ...generarNoticiasGoleador(
              tablaGoleadoresAntes,
              tablaGoleadores(clubesConEstadisticas, state.liga.clubIds),
              state.liga.temporadaActual,
              fecha,
            ),
            ...generarNoticiasDestacado(partidosJugados, clubesConEstadisticas, state.clubUsuarioId, state.liga.temporadaActual),
          ];

          // Ventana de invierno (pedido explícito: "que haya movimiento
          // real de mercado en enero, no sólo en junio") — además de
          // re-listar (como ya hacía), ahora también EJECUTA
          // transferencias IA-IA reales sobre lo recién listado, y genera
          // noticias de fichaje + un par de rumores con lo que quedó
          // listado y no se movió (ver 8.5 del documento de diseño).
          let clubes = clubesConTarjetas;
          let noticiasMercado: NoticiaItem[] = [];
          if (fecha === semanaAperturaVentanaInvierno(fixture)) {
            const clubesRelistados = rotarListadosIA(clubesConTarjetas, state.clubUsuarioId);
            const { clubes: clubesConMercado, movimientos } = simularTransferenciasIA(clubesRelistados, state.clubUsuarioId);
            clubes = clubesConMercado;
            noticiasMercado = [
              ...generarNoticiasFichaje(movimientos, state.liga.temporadaActual, fecha),
              ...generarRumoresMercado(
                clubesConMercado, state.liga.clubIds, state.clubUsuarioId, movimientos, state.liga.temporadaActual, fecha,
              ),
            ];
          }

          // Economía semanal real (pedido explícito, ver
          // engine/economiaSemanal.ts) — se cobra/paga siempre que se
          // simula UNA fecha de liga, sólo para el club del usuario (la
          // IA se sigue liquidando de una sola vez a fin de temporada).
          const totalFechasLiga = Math.max(...state.liga.fixture.map((p) => p.fecha));
          const esLocalEstaFecha = partidosDeLaFecha.some((p) => p.localId === state.clubUsuarioId);
          const clubUsuarioPreEconomia = clubes[state.clubUsuarioId];
          const movimientoSemanal = clubUsuarioPreEconomia
            ? calcularMovimientoSemanal(clubUsuarioPreEconomia, fecha, esLocalEstaFecha, totalFechasLiga)
            : null;
          const clubesConEconomiaSemanal = movimientoSemanal
            ? { ...clubes, [state.clubUsuarioId]: { ...clubUsuarioPreEconomia, presupuesto: movimientoSemanal.presupuesto } }
            : clubes;

          // Título de liga (pedido explícito: "que se dispare la animación
          // cuando la ganás jugando el último partido, no sólo si tocás
          // cerrar temporada") — se detecta ACÁ, apenas el fixture recién
          // simulado queda completo, no en procesarFinDeTemporada (que
          // sigue registrándolo también, por si acaso, pero de forma
          // idempotente — ver registrarTituloLigaSiCorresponde).
          const fixtureCompletado = proximaFechaSinJugar(fixture) == null;
          const esCampeonLiga = fixtureCompletado
            && calcularTabla(fixture, state.liga.clubIds)[0]?.clubId === state.clubUsuarioId;
          const carreraDT = registrarTituloLigaSiCorresponde(
            actualizarCarreraPorPartidos(state.carreraDT, partidosJugados, state.clubUsuarioId, clubUsuarioPreEconomia?.mentalidad),
            esCampeonLiga, state.liga.nombre, state.liga.temporadaActual,
          );

          // Notificaciones toast de la fecha (pedido explícito: "que te
          // salten notificaciones si te faltan jugadores en el 11
          // inicial, los resultados de los partidos, si se lesionan
          // jugadores, suspenden, etc") — mismo patrón que el toast de
          // contratos (ver procesarFinDeTemporada): side-effect síncrono
          // acá adentro del set(), useToastStore.getState() porque es un
          // store separado sin persist. Sólo en simularProximaJornada (no
          // en simularFixtureCompleto/pretemporada) para no inundar de
          // toasts al simular muchas fechas de un saque.
          const lesionesPropiasFecha = lesiones.filter((l) => l.clubId === state.clubUsuarioId);
          const suspensionesPropiasFecha = tarjetas.filter((t) => t.clubId === state.clubUsuarioId && t.generaSuspension);
          const partidoUsuarioFecha = partidosJugados.find(
            (p) => p.localId === state.clubUsuarioId || p.visitanteId === state.clubUsuarioId,
          );
          if (partidoUsuarioFecha && partidoUsuarioFecha.golesLocal != null && partidoUsuarioFecha.golesVisitante != null) {
            const esLocal = partidoUsuarioFecha.localId === state.clubUsuarioId;
            const golesPropios = esLocal ? partidoUsuarioFecha.golesLocal : partidoUsuarioFecha.golesVisitante;
            const golesRival = esLocal ? partidoUsuarioFecha.golesVisitante : partidoUsuarioFecha.golesLocal;
            const rivalId = esLocal ? partidoUsuarioFecha.visitanteId : partidoUsuarioFecha.localId;
            const rivalNombre = clubesConEconomiaSemanal[rivalId]?.nombre ?? 'el rival';
            const gano = golesPropios > golesRival;
            const perdio = golesPropios < golesRival;
            useToastStore.getState().mostrarToast(
              gano ? '✅ Victoria' : perdio ? '❌ Derrota' : '➖ Empate',
              `${esLocal ? 'vs.' : 'como visitante ante'} ${rivalNombre}: ${golesPropios}-${golesRival}.`,
            );
          }
          if (lesionesPropiasFecha.length > 0) {
            useToastStore.getState().mostrarToast(
              '🩹 Lesión',
              lesionesPropiasFecha.length === 1
                ? `${lesionesPropiasFecha[0].nombre} se lesionó: afuera ${lesionesPropiasFecha[0].partidosBaja} fecha(s).`
                : `${lesionesPropiasFecha.length} jugadores se lesionaron en la fecha.`,
            );
          }
          if (suspensionesPropiasFecha.length > 0) {
            useToastStore.getState().mostrarToast(
              '🟥 Suspensión',
              suspensionesPropiasFecha.length === 1
                ? `${suspensionesPropiasFecha[0].nombre} quedó suspendido para la próxima.`
                : `${suspensionesPropiasFecha.length} jugadores quedaron suspendidos para la próxima.`,
            );
          }
          const clubUsuarioPostRotacion = clubesPreFecha[state.clubUsuarioId];
          const faltanTitulares = clubUsuarioPostRotacion ? 11 - clubUsuarioPostRotacion.titularesIds.length : 0;
          if (faltanTitulares > 0) {
            useToastStore.getState().mostrarToast(
              '⚠️ Faltan jugadores',
              `No llegás a completar el 11 titular: te faltan ${faltanTitulares} jugador${faltanTitulares === 1 ? '' : 'es'} disponible${faltanTitulares === 1 ? '' : 's'}.`,
            );
          }

          return {
            liga: { ...state.liga, fixture },
            clubes: clubesConEconomiaSemanal,
            ultimasLesiones: lesionesPropiasFecha,
            ultimasTarjetas: suspensionesPropiasFecha,
            noticias: agregarNoticias(state.noticias, [...noticiasMercado, ...noticiasFecha]),
            historialSemanalUsuario: movimientoSemanal
              ? [...state.historialSemanalUsuario, movimientoSemanal]
              : state.historialSemanalUsuario,
            // Carrera del DT (pedido explícito, ver engine/carreraDT.ts).
            carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      simularFixtureCompleto: () =>
        set((state) => {
          if (!state.liga || !state.clubUsuarioId) return state;
          let fixture = state.liga.fixture;
          let clubesActuales = state.clubes;
          let lesionesAcumuladas: LesionOcurrida[] = [];
          let tarjetasAcumuladas: TarjetaOcurrida[] = [];
          // Newest-first (misma convención que agregarNoticias/state.noticias)
          // — cada fecha nueva se antepone, así al final sólo importan las
          // últimas TOPE_NOTICIAS generadas en esta corrida, no las
          // primeras (relevante en "simular temporada completa", que puede
          // recorrer 58 fechas de un saque).
          let noticiasAcumuladas: NoticiaItem[] = [];
          // Economía semanal real (ver engine/economiaSemanal.ts) — mismo
          // criterio que simularProximaJornada, acumulado fecha por fecha
          // en este loop.
          const totalFechasLiga = Math.max(...state.liga.fixture.map((p) => p.fecha));
          let historialSemanalAcumulado: MovimientoSemanal[] = [];
          let carreraAcumulada = state.carreraDT;
          let fecha = proximaFechaSinJugar(fixture);
          while (fecha != null) {
            const fechaActual = fecha;
            const clubesPreFecha = aplicarRotacionPreFecha(clubesActuales, state.clubUsuarioId);
            const partidosDeLaFecha = fixture.filter((p) => p.fecha === fechaActual && p.golesLocal == null);
            fixture = simularJornada(fixture, fechaActual, clubesPreFecha, state.clubUsuarioId);
            const resultado = aplicarDesgastePostFecha(clubesPreFecha, partidosDeLaFecha);
            const partidosJugados = fixture.filter((p) => p.fecha === fechaActual);
            const tablaGoleadoresAntes = tablaGoleadores(clubesActuales, state.liga.clubIds);
            const clubesConEstadisticas = aplicarEstadisticasPostFecha(resultado.clubes, partidosJugados);
            const resultadoTarjetas = aplicarTarjetasPostFecha(clubesConEstadisticas, partidosJugados);
            // Mismo arreglo que simularProximaJornada (ver comentario
            // grande ahí — bug reportado: "los jugadores se lesionan o son
            // suspendidos y siguen en el 11 inicial"): refresca
            // titularesIds ACÁ, no recién en la vuelta siguiente del loop.
            const clubesPostFecha = aplicarRotacionPreFecha(resultadoTarjetas.clubes, state.clubUsuarioId);

            const noticiasDeEstaFecha = [
              ...generarNoticiasResultado(partidosJugados, clubesConEstadisticas, state.clubUsuarioId, state.liga.temporadaActual),
              ...generarNoticiasGoleador(
                tablaGoleadoresAntes,
                tablaGoleadores(clubesConEstadisticas, state.liga.clubIds),
                state.liga.temporadaActual,
                fechaActual,
              ),
              ...generarNoticiasDestacado(partidosJugados, clubesConEstadisticas, state.clubUsuarioId, state.liga.temporadaActual),
            ];

            if (fechaActual === semanaAperturaVentanaInvierno(fixture)) {
              const clubesRelistados = rotarListadosIA(clubesPostFecha, state.clubUsuarioId);
              const { clubes: clubesConMercado, movimientos } = simularTransferenciasIA(clubesRelistados, state.clubUsuarioId);
              clubesActuales = clubesConMercado;
              noticiasDeEstaFecha.push(
                ...generarNoticiasFichaje(movimientos, state.liga.temporadaActual, fechaActual),
                ...generarRumoresMercado(
                  clubesConMercado, state.liga.clubIds, state.clubUsuarioId, movimientos, state.liga.temporadaActual, fechaActual,
                ),
              );
            } else {
              clubesActuales = clubesPostFecha;
            }

            const esLocalEstaFecha = partidosDeLaFecha.some((p) => p.localId === state.clubUsuarioId);
            const clubUsuarioPreEconomia = clubesActuales[state.clubUsuarioId];
            if (clubUsuarioPreEconomia) {
              const movimientoSemanal = calcularMovimientoSemanal(clubUsuarioPreEconomia, fechaActual, esLocalEstaFecha, totalFechasLiga);
              clubesActuales = {
                ...clubesActuales,
                [state.clubUsuarioId]: { ...clubUsuarioPreEconomia, presupuesto: movimientoSemanal.presupuesto },
              };
              historialSemanalAcumulado = [...historialSemanalAcumulado, movimientoSemanal];
            }
            carreraAcumulada = actualizarCarreraPorPartidos(
              carreraAcumulada, partidosJugados, state.clubUsuarioId, clubUsuarioPreEconomia?.mentalidad,
            );

            noticiasAcumuladas = [...noticiasDeEstaFecha, ...noticiasAcumuladas];
            lesionesAcumuladas = [...lesionesAcumuladas, ...resultado.lesiones];
            tarjetasAcumuladas = [...tarjetasAcumuladas, ...resultadoTarjetas.tarjetas];
            fecha = proximaFechaSinJugar(fixture);
          }
          // Título de liga (mismo criterio que simularProximaJornada de
          // arriba — ver el comentario grande ahí) — acá el fixture queda
          // completo recién al SALIR del while, no fecha por fecha.
          const esCampeonLiga = calcularTabla(fixture, state.liga.clubIds)[0]?.clubId === state.clubUsuarioId;
          const carreraDT = registrarTituloLigaSiCorresponde(carreraAcumulada, esCampeonLiga, state.liga.nombre, state.liga.temporadaActual);
          return {
            liga: { ...state.liga, fixture },
            clubes: clubesActuales,
            ultimasLesiones: lesionesAcumuladas.filter((l) => l.clubId === state.clubUsuarioId),
            ultimasTarjetas: tarjetasAcumuladas.filter((t) => t.clubId === state.clubUsuarioId && t.generaSuspension),
            noticias: agregarNoticias(state.noticias, noticiasAcumuladas),
            historialSemanalUsuario: [...state.historialSemanalUsuario, ...historialSemanalAcumulado],
            carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      // Amistosos de pretemporada (pedido explícito, ver
      // engine/pretemporada.ts) — simularPartidoDeFixture directo, SIN
      // pasar por aplicarDesgastePostFecha/aplicarEstadisticasPostFecha/
      // aplicarTarjetasPostFecha (eso es justo lo que hace que no generen
      // lesiones/suspensiones/estadísticas reales, a propósito).
      //
      // Bug reportado ("los 3 partidos se simulan a la vez, tienen que
      // jugarse por separado"): esto resuelve UN SOLO amistoso pendiente
      // por click (el primero sin jugar) — mismo criterio que
      // simularProximaJornada para la liga — en vez de todos de golpe.
      // useProximaSemana.ts la usa para "Ir al partido/Simular partido"
      // desde la tarjeta del Hub (que ya no tiene una pantalla propia de
      // pretemporada, ver PantallaHub.tsx). simularPretemporadaCompleta
      // (abajo) sigue resolviendo TODOS de una — la sigue usando "Simular
      // temporada completa", que a propósito adelanta todo de golpe.
      simularProximoAmistoso: () =>
        set((state) => {
          if (!state.clubUsuarioId) return state;
          const partido = state.partidosPretemporada.find((p) => p.golesLocal == null);
          if (!partido) return state;
          const partidosPretemporada = state.partidosPretemporada.map((p) => (
            p.id === partido.id ? simularPartidoDeFixture(p, state.clubes, state.clubUsuarioId!) : p
          ));
          return { partidosPretemporada };
        }),

      simularPretemporadaCompleta: () =>
        set((state) => {
          if (!state.clubUsuarioId) return state;
          const partidosPretemporada = state.partidosPretemporada.map((p) => (
            p.golesLocal == null ? simularPartidoDeFixture(p, state.clubes, state.clubUsuarioId!) : p
          ));
          return { partidosPretemporada };
        }),

      // 6.2 — el usuario pone (o saca) un jugador propio en el mercado. Al
      // ponerlo, se evalúan de una IA qué clubes ofertan.
      marcarTransferible: (jugadorId, transferible) =>
        set((state) => {
          if (!state.clubUsuarioId) return state;
          const club = state.clubes[state.clubUsuarioId];
          const jugador = club?.plantel.find((j) => j.id === jugadorId);
          if (!club || !jugador) return state;

          const plantel = club.plantel.map((j) => (j.id === jugadorId ? { ...j, transferible } : j));
          const clubes = { ...state.clubes, [club.id]: { ...club, plantel } };

          const ofertasSinEsteJugador = state.ofertasRecibidas.filter((o) => o.jugadorId !== jugadorId);
          if (!transferible) {
            return { clubes, ofertasRecibidas: ofertasSinEsteJugador };
          }
          const nuevasOfertas = evaluarOfertasIA(jugador, club.id, state.clubes).map((o) => ({
            jugadorId,
            clubOfertanteId: o.clubOfertanteId,
            clubVendedorId: club.id,
            monto: o.monto,
            estado: 'pendiente' as const,
          }));
          return { clubes, ofertasRecibidas: [...ofertasSinEsteJugador, ...nuevasOfertas] };
        }),

      // Sistema de dorsales (pedido explícito): el usuario puede reasignar
      // a mano el dorsal de un jugador PROPIO, 1-99, siempre que no lo
      // tenga ya otro compañero de plantel (el dorsal es del cupo, no una
      // propiedad libre — ver comentario grande en types/index.ts). Sólo
      // sobre el club del usuario, mismo criterio que marcarTransferible:
      // no tiene sentido tocarle el dorsal a un plantel rival.
      cambiarDorsal: (jugadorId, nuevoDorsal) => {
        const state = get();
        if (!state.clubUsuarioId) return false;
        if (!Number.isInteger(nuevoDorsal) || nuevoDorsal < 1 || nuevoDorsal > 99) return false;
        const club = state.clubes[state.clubUsuarioId];
        const jugador = club?.plantel.find((j) => j.id === jugadorId);
        if (!club || !jugador) return false;
        if (club.plantel.some((j) => j.id !== jugadorId && j.dorsal === nuevoDorsal)) return false;

        set((s) => ({
          clubes: {
            ...s.clubes,
            [club.id]: {
              ...club,
              plantel: club.plantel.map((j) => (j.id === jugadorId ? { ...j, dorsal: nuevoDorsal } : j)),
            },
          },
        }));
        return true;
      },

      // Las transferencias (venta/compra entre clubes) no reasignan
      // contrato — el jugador se lleva el que ya tenía.
      aceptarOferta: (oferta) => {
        const state = get();
        const vendedor = state.clubes[oferta.clubVendedorId];
        const comprador = state.clubes[oferta.clubOfertanteId];
        const jugador = vendedor?.plantel.find((j) => j.id === oferta.jugadorId);
        if (!vendedor || !comprador || !jugador) return false;
        if (!hayCupo(comprador)) return false;
        // Piso obligatorio de plantel (pedido explícito: "2 arqueros y 11
        // titulares y 5 suplentes") — no se puede vender si eso te deja
        // sin el mínimo, ver engine/contratos.ts.
        if (!puedeLiberarSinRomperPiso(vendedor, jugador.id)) return false;

        set((s) => {
          const plantelVendedor = vendedor.plantel.filter((j) => j.id !== jugador.id);
          // El dorsal es del cupo en el plantel, no del jugador (ver
          // types/index.ts) — al cambiar de club puede chocar con alguien
          // que ya lo tiene ahí, así que se resortea contra el plantel de
          // destino.
          const jugadorTransferido = { ...jugador, clubId: comprador.id, transferible: false, dorsal: asignarDorsalLibre(comprador.plantel, jugador.posicion) };
          return {
            clubes: {
              ...s.clubes,
              [vendedor.id]: {
                ...vendedor,
                plantel: plantelVendedor,
                titularesIds: vendedor.titularesIds.filter((id) => id !== jugador.id),
                suplentesIds: vendedor.suplentesIds.filter((id) => id !== jugador.id),
                presupuesto: vendedor.presupuesto + oferta.monto,
              },
              [comprador.id]: {
                ...comprador,
                plantel: [...comprador.plantel, jugadorTransferido],
                presupuesto: comprador.presupuesto - oferta.monto,
              },
            },
            ofertasRecibidas: s.ofertasRecibidas.filter((o) => o.jugadorId !== oferta.jugadorId),
          };
        });
        return true;
      },

      rechazarOferta: (oferta) =>
        set((state) => ({
          ofertasRecibidas: state.ofertasRecibidas.filter(
            (o) => !(o.jugadorId === oferta.jugadorId && o.clubOfertanteId === oferta.clubOfertanteId),
          ),
        })),

      // 6.3 — el usuario ofrece comprar un jugador de otro club.
      // Negociación en rondas (pedido explícito, ver
      // docs/sistema-oferta-fichajes.md): `probabilidadAceptarOferta` es
      // la MISMA fórmula de siempre, sólo que ahora el resultado se
      // traduce a 3 niveles (evaluarOferta) en vez de aceptado/rechazado
      // seco. `ronda`/`presionRival` (oferta rival cosmética, sección 3.1
      // punto 4) sólo restan un poco a la probabilidad a partir de la
      // segunda ronda — la cuenta de en qué ronda va la lleva la UI, acá
      // no se guarda ningún estado de negociación.
      ofertarPorJugador: (jugadorId, clubVendedorId, monto, ronda = 1, presionRival = false) => {
        const state = get();
        if (!state.clubUsuarioId) return null;
        const comprador = state.clubes[state.clubUsuarioId];
        const vendedor = state.clubes[clubVendedorId];
        const jugador = vendedor?.plantel.find((j) => j.id === jugadorId);
        if (!comprador || !vendedor || !jugador) return null;
        if (comprador.presupuesto < monto) return null;
        if (!hayCupo(comprador)) return null;

        let prob = probabilidadAceptarOferta(monto, jugador.valorMercado, vendedor.dt);
        if (presionRival && ronda > 1) prob = Math.max(0, prob - PENALIZACION_PRESION_RIVAL);
        const respuesta = evaluarOferta(monto, prob);
        if (respuesta.resultado !== 'aceptada') return respuesta;

        set((s) => {
          const plantelVendedor = vendedor.plantel.filter((j) => j.id !== jugador.id);
          // CORRECCIÓN (pedido explícito, "elegir años al renovar/fichar" —
          // docs/anios-contrato-y-fichajes.md): antes el jugador transferido
          // se llevaba el contrato que ya tenía con el vendedor tal cual
          // (podías pagar una fortuna por un crack y que te quedara con 1
          // año de contrato, sin ninguna instancia para arreglarlo en el
          // momento de la compra). Ahora arranca con un contrato "piso"
          // (1 año, salario justo escalado a TU liga) — nunca peor que
          // antes, y de inmediato queda en condiciones de renovar
          // (puedeRenovar) para que NegociacionFichaje.tsx pueda ofrecerle
          // ahí mismo un contrato mejor apenas se cierra la transferencia.
          const jugadorTransferido = {
            ...jugador,
            clubId: comprador.id,
            transferible: false,
            dorsal: asignarDorsalLibre(comprador.plantel, jugador.posicion),
            contratoAniosRestantes: 1,
            salario: calcularSalarioJusto(jugador, multiplicadorSalarialDeLiga(comprador.liga)),
          };
          return {
            clubes: {
              ...s.clubes,
              [vendedor.id]: {
                ...vendedor,
                plantel: plantelVendedor,
                titularesIds: vendedor.titularesIds.filter((id) => id !== jugador.id),
                suplentesIds: vendedor.suplentesIds.filter((id) => id !== jugador.id),
                presupuesto: vendedor.presupuesto + monto,
              },
              [comprador.id]: {
                ...comprador,
                plantel: [...comprador.plantel, jugadorTransferido],
                presupuesto: comprador.presupuesto - monto,
              },
            },
            // Progreso del DT (ver engine/progresoDT.ts) — un fichaje
            // concretado cuenta para la evolución de `mercado` a fin de
            // temporada.
            actividadTemporadaDT: {
              ...s.actividadTemporadaDT,
              fichajesRealizados: s.actividadTemporadaDT.fichajesRealizados + 1,
            },
            // Carrera del DT (ver engine/carreraDT.ts) — cuenta CARRERA
            // completa (no se resetea por temporada), para el apodo "El
            // Tiburón"/"El Formador".
            carreraDT: registrarFichaje(s.carreraDT),
          };
        });
        return respuesta;
      },

      // Renovación de contrato (pedido explícito): sólo para jugadores del
      // propio club con pocos años restantes (puedeRenovar). Mismo
      // esquema de negociación en rondas que ofertarPorJugador, sin
      // presión de oferta rival (no aplica — es tu propio jugador, ver
      // sección 6 del documento de diseño).
      ofertarRenovacion: (jugadorId, nuevoSalario, aniosElegidos = 3) => {
        const state = get();
        if (!state.clubUsuarioId) return null;
        const club = state.clubes[state.clubUsuarioId];
        const jugador = club?.plantel.find((j) => j.id === jugadorId);
        if (!club || !jugador) return null;
        if (!puedeRenovar(jugador)) return null;
        // Bug reportado ("si no me queda presupuesto puedo seguir
        // renovando jugadores, no tengo penalizaciones si me paso del
        // presupuesto") — ofertarPorJugador (fichajes) ya frenaba esto
        // comparando contra el monto de la oferta puntual; una renovación
        // no tiene un monto único para comparar (es un compromiso de
        // sueldo A FUTURO, pagado semana a semana — ver
        // engine/economiaSemanal.ts), así que el corte acá es más simple:
        // con el club YA en rojo, no se puede ni empezar a negociar un
        // sueldo nuevo hasta salir del rojo.
        if (club.presupuesto <= 0) return null;

        const salarioJusto = calcularSalarioJusto(jugador, multiplicadorSalarialDeLiga(club.liga));
        const prob = probabilidadAceptarRenovacion(nuevoSalario, salarioJusto, aniosElegidos);
        const respuesta = evaluarOferta(nuevoSalario, prob);
        if (respuesta.resultado !== 'aceptada') return respuesta;

        set((s) => {
          const jugadorRenovado = renovarContrato(jugador, nuevoSalario, aniosElegidos);
          const plantel = club.plantel.map((j) => (j.id === jugadorId ? jugadorRenovado : j));
          return { clubes: { ...s.clubes, [club.id]: { ...club, plantel } } };
        });
        return respuesta;
      },

      // M6 — fin de temporada (4.2 + 7). Evoluciona a TODOS los jugadores
      // de la liga, baja un año los contratos y genera canteranos para
      // cada club; los del club del usuario no se suman solos, quedan en
      // canteranosOfrecidos para la pantalla de "Oferta de cantera" (8.5).
      //
      // No hay agentes libres para el usuario (pedido explícito): al
      // vencer el contrato, el jugador sale del plantel y desaparece — no
      // queda listado en ningún lado. La única forma de sumar un jugador
      // de otro club es la transferencia del mercado (6.2/6.3), que
      // además se resortea acá mismo (rotarListadosIA) para que "De
      // otros clubes" no quede vacío para siempre.
      //
      // Los clubes de la IA usan avanzarContratosIA (no avanzarContratos)
      // — intentan retener a sus jugadores antes de liberarlos, igual que
      // el usuario puede renovar a los suyos a mano. Sin esto (bug
      // encontrado jugando, no un pedido nuevo) los planteles de la IA se
      // vaciaban solos: nadie renovaba nunca, y encima los canteranos que
      // se les sumaban entraban con contrato de 0 años y se liberaban
      // ellos mismos la temporada siguiente.
      //
      // Copa Internacional (pedido explícito): si el club del usuario
      // terminó entre los 4 primeros de la temporada que cierra, clasifica
      // a un mini-torneo de fantasía contra clubes de otras ligas.
      //
      // Economía (pedido explícito): antes el presupuesto sólo se movía
      // con transferencias — los sueldos nunca se descontaban y no había
      // premios/ingresos. Ahora cada club cobra un premio según su
      // posición + una taquilla base, y paga los sueldos de su plantel.
      // Terminar en los últimos 2 puestos termina la carrera del usuario
      // (no hay una categoría inferior real a la que descender en este
      // juego).
      procesarFinDeTemporada: () =>
        set((state) => {
          if (!state.liga || !state.clubUsuarioId) return state;
          // Alias local (pedido explícito, fix de tsc): TS no propaga el
          // narrowing de `state.liga` (guard de arriba) hacia adentro del
          // .forEach() más abajo — es una función anidada aparte, y sólo
          // ese punto necesitaba el alias para dejar de marcar
          // "state.liga is possibly null" ahí (bug de tipos, no de
          // runtime: `state` es un snapshot sincrónico, liga no cambia en
          // el medio).
          const nombreLiga = state.liga.nombre;
          const temporadaQueTermina = state.liga.temporadaActual;
          const tablaFinal = calcularTabla(state.liga.fixture, state.liga.clubIds);
          const totalClubes = tablaFinal.length;
          const posicionUsuario0 = tablaFinal.findIndex((f) => f.clubId === state.clubUsuarioId);
          const descendidoUsuario = estaEnZonaDescenso(posicionUsuario0, totalClubes);
          const ascendidoUsuario = !descendidoUsuario
            && estaEnZonaAscenso(posicionUsuario0)
            && ligaSuperiorDe(state.liga.nombre) != null;

          const nombreLigaDestino = descendidoUsuario
            ? ligaInferiorDe(state.liga.nombre)
            : (ascendidoUsuario ? ligaSuperiorDe(state.liga.nombre) : null);
          const ligaDestinoOpcion = nombreLigaDestino
            ? LIGAS.find((l) => l.nombre === nombreLigaDestino && l.disponible) ?? null
            : null;
          const cambioDeLigaPendiente: CambioDeLiga | null = ligaDestinoOpcion
            ? { destino: ligaDestinoOpcion.id, motivo: descendidoUsuario ? 'descenso' : 'ascenso' }
            : null;

          // Objetivo de temporada + riesgo de despido (pedido explícito,
          // ver engine/objetivos.ts) — se evalúa acá, con la tabla final
          // REAL que se acaba de calcular arriba, contra el objetivo que
          // la directiva había fijado al ARRANCAR esta temporada
          // (state.objetivoTemporada, asignado en iniciarPartidaNueva o en
          // el finalizarTemporada anterior). Si nunca se asignó uno (no
          // debería pasar fuera de partidas viejas persistidas antes de
          // esta mecánica) se lo considera cumplido, para no despedir a
          // nadie por un objetivo que jamás llegó a ver.
          const objetivoQueTermina = state.objetivoTemporada;
          const objetivoCumplido = objetivoQueTermina
            ? evaluarObjetivoTemporada(objetivoQueTermina, posicionUsuario0, totalClubes, descendidoUsuario)
            : true;
          const confianzaAnterior = state.confianzaDirectiva;
          // `let`, no `const` (pedido explícito: "no tengo penalizaciones
          // si me paso del presupuesto") — se reajusta más abajo, dentro
          // del forEach, apenas se conoce presupuestoNuevo del club del
          // usuario (ver ajustarConfianzaPorPresupuesto/engine/objetivos.ts).
          let confianzaNueva = actualizarConfianza(confianzaAnterior, objetivoCumplido);
          const incumplidosSeguidos = objetivoCumplido ? 0 : state.objetivosIncumplidosSeguidos + 1;
          // Pedido explícito: "desactiva por ahora que la directiva te
          // eche" — el conteo de incumplidosSeguidos se sigue llevando
          // normal (así que reactivar DESPIDO_HABILITADO más adelante
          // refleja el historial real, no arranca de cero), sólo se
          // apaga la consecuencia de terminar la carrera por esto.
          const despedido = DESPIDO_HABILITADO && incumplidosSeguidos >= INCUMPLIMIENTOS_PARA_DESPIDO;

          // Copas continentales (pedido explícito, "formato real completo"):
          // se decide con la posición REAL del usuario en la tabla que
          // recién terminó — vale para la copa de la temporada que viene
          // aunque el club además ascienda/descienda (así funciona en la
          // realidad: el cupo lo da el campeonato ya jugado, no el que
          // arranca). Como el usuario sólo puede clasificar a UNA de las 5
          // copas (su liga sólo tiene cupos para Libertadores/Sudamericana
          // O para Champions/Europa/Conference, nunca ambas — ver
          // CUPOS_CONTINENTALES_POR_LIGA), alcanza con el primer rango que
          // matchee.
          const cuposLiga = !descendidoUsuario ? cuposContinentalesDeLiga(state.liga.nombre) : null;
          let tipoCopaContinental: 'champions' | 'europa' | 'conference' | 'libertadores' | 'sudamericana' | null = null;
          if (cuposLiga) {
            (['champions', 'europa', 'conference', 'libertadores', 'sudamericana'] as const).forEach((tipo) => {
              if (tipoCopaContinental) return;
              const rango = cuposLiga[tipo];
              if (rango && posicionUsuario0 >= rango[0] && posicionUsuario0 <= rango[1]) tipoCopaContinental = tipo;
            });
          }

          const nuevosClubes: Record<string, Club> = {};
          let canteranosUsuario: Jugador[] = [];
          let resumenTemporada: ResumenTemporada | null = null;
          // Carrera del DT (pedido explícito, ver engine/carreraDT.ts) —
          // título de liga + idolatría se resuelven ACÁ (con la tabla
          // final ya calculada), los de copa ya se fueron sumando durante
          // la temporada en cada acción de copa (ver arriba en este
          // archivo).
          let carreraDTFinal = state.carreraDT;
          // Joyas en ascenso (pedido explícito, categoría 6 de
          // docs/sistema-noticias.md) — se detectan ACÁ, comparando el
          // plantel antes/después de evolucionarClub, en vez de leer
          // historialGrl: es el mismo dato, pero ya tenemos las dos
          // versiones del jugador a mano en este mismo loop.
          let noticiasJoyas: NoticiaItem[] = [];
          // Contratos del usuario (pedido explícito, "sistema de
          // notificaciones... que se renuevan los contratos
          // automaticamente o que se vencen") — se completan sólo en la
          // rama esUsuario de abajo, y se usan después del loop para
          // toast + noticia + badge de Plantel.
          let contratosLiberadosUsuario: Jugador[] = [];
          let contratosRenovadosUsuario: Jugador[] = [];

          Object.values(state.clubes).forEach((club) => {
            const { club: clubEvolucionado } = evolucionarClub(club, temporadaQueTermina);
            noticiasJoyas = [...noticiasJoyas, ...generarNoticiasJoya(club, clubEvolucionado, temporadaQueTermina)];
            const esUsuario = club.id === state.clubUsuarioId;
            let clubConContratos: Club;
            if (esUsuario) {
              const resultado = avanzarContratos(clubEvolucionado);
              clubConContratos = resultado.club;
              contratosLiberadosUsuario = resultado.liberados;
              contratosRenovadosUsuario = resultado.renovadosPorPiso;
            } else {
              clubConContratos = avanzarContratosIA(clubEvolucionado).club;
            }

            const posicion0 = tablaFinal.findIndex((f) => f.clubId === club.id);
            const campeonLiga = posicion0 === 0;
            const premio = calcularPremio(posicion0, totalClubes, club.nc, club.liga);
            const presupuestoAnterior = club.presupuesto;
            // Economía semanal real (pedido explícito, ver
            // engine/economiaSemanal.ts): la taquilla y los sueldos del
            // usuario YA se cobraron/pagaron fecha a fecha durante la
            // temporada (simularProximaJornada/simularFixtureCompleto) —
            // acá sólo se suma el premio por posición, que recién se sabe
            // con la tabla final. Los campos de abajo (taquilla/
            // sueldosPagados) muestran el REAL total acumulado semana a
            // semana, no un segundo cálculo aparte que duplicaría el
            // movimiento de plata. La IA se sigue liquidando de una sola
            // vez (no hace falta rastrear su economía semanal para nada
            // que se le muestre al jugador).
            const taquilla = esUsuario
              ? state.historialSemanalUsuario.reduce((acc, r) => acc + r.ingresos, 0)
              : calcularTaquilla(club.nc, club.liga);
            const sueldosPagados = esUsuario
              ? state.historialSemanalUsuario.reduce((acc, r) => acc + r.gastos, 0)
              : calcularSueldosTemporada(clubConContratos);
            // Progreso del DT propio (pedido explícito, mecánica 5 de
            // docs/que-le-falta-profundidad.md) — sólo el DT del usuario
            // evoluciona así (el de la IA no tiene actividad rastreada).
            const dtEvolucionado = esUsuario
              ? evolucionarDT(clubConContratos.dt, state.actividadTemporadaDT)
              : clubConContratos.dt;
            // Reputación del DT propio (pedido explícito: "que te lleguen
            // también otras ofertas según tu GRL y tu rendimiento" — ver
            // engine/ofertasDT.ts. Sin esto el GRL quedaba fijo desde que
            // se generaba el DT, así que usarlo como señal de largo plazo
            // para las ofertas no tenía sentido). Sólo cuenta el título de
            // LIGA de este cierre — los de copa ya impactaron carreraDT
            // durante la temporada, retroalimentarlos acá otra vez sería
            // sumar doble.
            const dtConReputacion = esUsuario
              ? evolucionarReputacionDT(dtEvolucionado, campeonLiga, objetivoCumplido)
              : dtEvolucionado;
            // Contrato propio del DT (pedido explícito, ver
            // engine/contratoDT.ts) — mismo criterio que dtEvolucionado:
            // sólo se hace avanzar/cobrar el contrato del DT del usuario
            // (el de la IA no tiene economía propia rastreada). Backfill
            // lazy para carreras guardadas antes de esta mecánica
            // (dt.contrato todavía no existía en esos saves).
            const dtConContratoVigente = esUsuario && !dtConReputacion.contrato
              ? { ...dtConReputacion, contrato: contratoDTInicial(presupuestoAnterior) }
              : dtConReputacion;
            const sueldoDT = esUsuario ? (dtConContratoVigente.contrato?.salarioAnual ?? 0) : 0;
            const dtFinal = esUsuario ? avanzarContratoDT(dtConContratoVigente) : dtConContratoVigente;
            const presupuestoNuevo = esUsuario
              ? presupuestoAnterior + premio - sueldoDT
              : presupuestoAnterior + premio + taquilla - sueldosPagados;
            const clubConEconomia = { ...clubConContratos, presupuesto: presupuestoNuevo, dt: dtFinal };

            // Penalización financiera (pedido explícito: "no tengo
            // penalizaciones si me paso del presupuesto") — recién ACÁ se
            // conoce presupuestoNuevo del usuario, así que confianzaNueva
            // (calculada arriba sólo por objetivo cumplido/no cumplido) se
            // reajusta EN ESTE PUNTO — todo lo que lee confianzaNueva más
            // abajo en esta función (noticia, próximo objetivo, historial,
            // el propio state.confianzaDirectiva final) ya queda con el
            // valor correcto porque corre después del forEach.
            if (esUsuario) {
              confianzaNueva = ajustarConfianzaPorPresupuesto(confianzaNueva, presupuestoNuevo);
            }

            if (esUsuario) {
              // Récord + goleador propio (pedido explícito, ver comentario
              // grande en ResumenTemporada/economia.ts): tienen que salir
              // del `club` ORIGINAL (parámetro del forEach, antes de
              // evolucionarClub) y de `tablaFinal` (calculada más arriba
              // con el fixture YA jugado) — un renglón más abajo, `club`
              // deja de estar disponible en su forma pre-evolución.
              const filaTabla = tablaFinal[posicion0];
              const [golTop] = tablaGoleadores({ [club.id]: club }, [club.id]);
              resumenTemporada = {
                temporada: temporadaQueTermina,
                posicion: posicion0 + 1,
                totalClubes,
                campeon: campeonLiga,
                descendido: descendidoUsuario,
                ascendido: ascendidoUsuario,
                nuevaLiga: ligaDestinoOpcion?.nombre ?? null,
                premio,
                taquilla,
                sueldosPagados,
                sueldoDT,
                presupuestoAnterior,
                presupuestoNuevo,
                objetivoDescripcion: objetivoQueTermina?.descripcion ?? '',
                objetivoCumplido,
                confianzaAnterior,
                confianzaNueva,
                record: {
                  pj: filaTabla.pj, pg: filaTabla.pg, pe: filaTabla.pe, pp: filaTabla.pp, gf: filaTabla.gf, gc: filaTabla.gc,
                },
                goleadorPropio: golTop
                  ? {
                    nombre: golTop.nombre, goles: golTop.goles, asistencias: golTop.asistencias, pj: golTop.pj,
                  }
                  : null,
              };
              // Idempotente (ver registrarTituloLigaSiCorresponde en
              // engine/carreraDT.ts): si ya se había registrado apenas se
              // completó el fixture (simularProximaJornada/
              // simularFixtureCompleto), esto no lo duplica.
              carreraDTFinal = registrarTituloLigaSiCorresponde(
                carreraDTFinal, campeonLiga, nombreLiga, temporadaQueTermina,
              );
              carreraDTFinal = {
                ...carreraDTFinal,
                idolatria: actualizarIdolatria(carreraDTFinal.idolatria, {
                  campeon: campeonLiga, objetivoCumplido, descendido: descendidoUsuario,
                }),
              };
            }

            const canteranos = generarCanteranosClub(clubConEconomia);

            if (esUsuario) {
              canteranosUsuario = canteranos;
              nuevosClubes[club.id] = clubConEconomia;
            } else {
              // Los canteranos de la IA se suman directo (con contrato
              // recién asignado — ver nota arriba), respetando el tope de
              // 26 (se descartan los que no entran).
              let plantelConCanteranos = clubConEconomia.plantel;
              const multiplicadorLiga = multiplicadorSalarialDeLiga(club.liga);
              canteranos.forEach((c) => {
                if (plantelConCanteranos.length < 26) {
                  const fichado = asignarContrato(c, club.id, multiplicadorLiga);
                  fichado.dorsal = asignarDorsalLibre(plantelConCanteranos, fichado.posicion);
                  plantelConCanteranos = [...plantelConCanteranos, fichado];
                }
              });
              nuevosClubes[club.id] = { ...clubConEconomia, plantel: plantelConCanteranos };
            }
          });

          // Mercado IA-IA (pedido explícito: "que los jugadores se vayan
          // intercambiando naturalmente entre equipos [...] si de repente
          // tiene 85 de media lo tiene que comprar un equipo de Europa") —
          // corre sobre el plantel YA evolucionado/con canteranos de esta
          // temporada, antes de rotarListadosIA (así lo que rotarListadosIA
          // deja listado para el usuario ya refleja quién sigue en el
          // club). No toca al club del usuario.
          const { clubes: nuevosClubesConMercado, movimientos: movimientosMercado } = simularTransferenciasIA(
            nuevosClubes,
            state.clubUsuarioId,
          );

          // Noticias de fichaje real + un par de rumores (categorías 4 y
          // 5) — fecha 0 marca "fuera de jornada" (mercado de cierre de
          // temporada, no una fecha de fixture).
          const noticiasMercadoFinTemporada = [
            ...generarNoticiasFichaje(movimientosMercado, temporadaQueTermina, 0),
            ...generarRumoresMercado(
              nuevosClubesConMercado, state.liga.clubIds, state.clubUsuarioId, movimientosMercado, temporadaQueTermina, 0,
            ),
            // Confianza de la directiva (pedido explícito, ver
            // engine/objetivos.ts y engine/noticias.ts) — sólo dispara
            // noticia cuando CRUZA hacia abajo el umbral bajo, no cada vez
            // que se recalcula.
            ...generarNoticiaConfianzaDirectiva(confianzaAnterior, confianzaNueva, state.clubUsuarioId, temporadaQueTermina),
            // Contratos del usuario (pedido explícito, "sistema de
            // notificaciones... que se renuevan los contratos
            // automaticamente o que se vencen" — ver engine/noticias.ts).
            ...generarNoticiasContrato(contratosRenovadosUsuario, contratosLiberadosUsuario, state.clubUsuarioId, temporadaQueTermina),
          ];

          // Toasts (pedido explícito, mismo pedido de arriba — ver
          // store/useToastStore.ts y components/Toast.tsx): un toast por
          // TIPO de evento, no uno por jugador (con varios vencimientos a
          // la vez, un toast por cabeza inundaría la pantalla — mismo
          // criterio de "no ruido" que ya usa el resto de noticias.ts).
          // Store separado de éste (useToastStore no usa persist), así
          // que se llama con getState() en vez de un import normal de
          // React — es un side-effect deliberado dentro de un action de
          // Zustand, no un hook.
          if (contratosRenovadosUsuario.length > 0) {
            useToastStore.getState().mostrarToast(
              '📋 Contrato renovado',
              contratosRenovadosUsuario.length === 1
                ? `${contratosRenovadosUsuario[0].nombre} renovó su contrato automáticamente.`
                : `${contratosRenovadosUsuario.length} jugadores renovaron su contrato automáticamente.`,
            );
          }
          if (contratosLiberadosUsuario.length > 0) {
            useToastStore.getState().mostrarToast(
              '📋 Contrato vencido',
              contratosLiberadosUsuario.length === 1
                ? `${contratosLiberadosUsuario[0].nombre} quedó libre al vencer su contrato.`
                : `${contratosLiberadosUsuario.length} jugadores quedaron libres al vencer su contrato.`,
            );
          }

          // clasificacionDeTodasLasLigas necesita la tabla REAL de la liga
          // del usuario (no estimada) para no reemplazar la posición que
          // se acaba de calcular arriba con un número al azar — la
          // necesitan tanto la Copa Mundial de Clubes (campeones de todas
          // las ligas cargadas) como Champions/Europa/Conference.
          const tablaFinalEstadistica: FilaEstadistica[] = tablaFinal.map((f) => ({
            clubId: f.clubId,
            nombre: state.clubes[f.clubId]?.nombre ?? f.clubId,
            puntosEstimados: f.pts,
          }));

          // Bug reportado ("quien clasifica al mundial de clubes"): esta
          // condición no chequeaba que la liga del usuario fuera de
          // PRIMERA división — un top 4 en una segunda división (Primera
          // Nacional, Championship, etc.) clasificaba igual, cosa que no
          // pasa en la realidad (mismo criterio que ya usa
          // campeonesDeLigasCargadas en copaMundialClubes.ts para excluir
          // esas 6 ligas del resto del bombo).
          const esLigaDePrimera = ligaSuperiorDe(state.liga.nombre) == null;
          const copaMundialClubes = !descendidoUsuario && esLigaDePrimera && clasificaParaCopa(posicionUsuario0)
            ? generarCopaMundialClubes(nuevosClubes[state.clubUsuarioId], state.liga.nombre, tablaFinalEstadistica, temporadaQueTermina + 1)
            : null;

          let copaConmebol: TorneoConmebol | null = null;
          let copaUefa: CompeticionSuiza | null = null;
          if (tipoCopaContinental === 'libertadores' || tipoCopaContinental === 'sudamericana') {
            copaConmebol = generarTorneoConmebol(tipoCopaContinental, nuevosClubes[state.clubUsuarioId], temporadaQueTermina + 1);
          } else if (tipoCopaContinental) {
            copaUefa = generarCompeticionSuiza(
              tipoCopaContinental,
              nuevosClubes[state.clubUsuarioId],
              state.liga.nombre,
              tablaFinalEstadistica,
              temporadaQueTermina + 1,
            );
          }

          // Campeones del resto del mundo (pedido explícito: "una
          // simulación básica para ver quién ganó cada torneo") — para las
          // copas que el usuario NO juega de verdad esta temporada, se
          // sortea un campeón de sabor con el mismo criterio que
          // tablaEstadistica. No genera clubes ni afecta la partida.
          const campeonesDelMundo: CampeonDelMundo[] = [
            ...copasNacionalesDelMundo(state.liga.nombre),
            ...copasContinentalesDelMundo(
              state.liga.nombre,
              tablaFinalEstadistica,
              tipoCopaContinental ? [tipoCopaContinental] : [],
            ),
            ...(copaMundialClubes ? [] : [campeonMundialDeClubesDelMundo(state.liga.nombre, tablaFinalEstadistica)].filter((c): c is CampeonDelMundo => c != null)),
          ];

          const finCarreraFinal: FinCarrera | null = (descendidoUsuario && !cambioDeLigaPendiente)
            ? { motivo: 'descenso', temporada: temporadaQueTermina }
            : (despedido ? { motivo: 'despedido', temporada: temporadaQueTermina } : null);

          // Historial "club por club" (pedido explícito, ver comentario
          // grande en engine/carreraDT.ts): si la carrera termina ACÁ
          // (despido o descenso sin liga inferior), se cierra la etapa
          // del club actual para que quede en el historial — si sigue
          // (ascenso/descenso con liga inferior, o simplemente otra
          // temporada en el mismo club), NO se toca: sigue siendo la
          // MISMA etapa, no una nueva. Si el usuario después acepta una
          // oferta de rescate (aceptarOfertaRescate, más abajo), esa
          // etapa ya va a estar cerrada de acá.
          if (finCarreraFinal) {
            carreraDTFinal = cerrarEtapaClub(carreraDTFinal, carreraDTFinal.idolatria, temporadaQueTermina);
          }

          // Ofertas de otros clubes (pedido explícito, ver
          // engine/ofertasDT.ts) — sólo tiene sentido evaluar esto si la
          // carrera SIGUE (no hay que ofrecerle un club nuevo a alguien
          // que se está yendo del juego esta misma temporada).
          const clubesFinales = rotarListadosIA(nuevosClubesConMercado, state.clubUsuarioId);
          const clubUsuarioFinal = clubesFinales[state.clubUsuarioId];
          const ofertasDT: OfertaDT[] = (finCarreraFinal || !clubUsuarioFinal)
            ? []
            : generarOfertasDT(
              clubesFinales, state.clubUsuarioId, state.liga.nombre, clubUsuarioFinal.dt, carreraDTFinal.idolatria,
              confianzaNueva, temporadaQueTermina + 1,
            );

          // Contrato propio del DT (pedido explícito, ver
          // engine/contratoDT.ts): si el contrato del DT del usuario llegó
          // a 0 temporadas restantes cerrando ESTA temporada, el club
          // ofrece una renovación (mismo guard que ofertasDT: no tiene
          // sentido si la carrera ya termina por despido/descenso).
          const renovacionDT = (!finCarreraFinal && clubUsuarioFinal && (clubUsuarioFinal.dt.contrato?.temporadasRestantes ?? 1) <= 0)
            ? ofertaRenovacionDT(clubUsuarioFinal, temporadaQueTermina)
            : null;

          // Oferta de rescate (pedido explícito, ver engine/ofertasDT.ts):
          // sólo tiene sentido evaluar esto si la carrera JUSTO está por
          // terminar (despido/descenso sin liga inferior) — es la última
          // chance antes de PantallaRepasoCarrera.
          const ofertasRescate: OfertaRescateDT[] = (finCarreraFinal && clubUsuarioFinal)
            ? generarOfertasRescate(
              clubesFinales, state.clubUsuarioId, state.liga.nombre, clubUsuarioFinal.dt, carreraDTFinal.idolatria, confianzaNueva,
              // Pedido explícito: "que si te despiden no termine tu
              // carrera que te lleguen otras ofertas tambien", ampliado
              // después a "garantizar también la oferta de rescate para
              // descenso (como hice con despido)" — los dos motivos que
              // llegan hasta acá (despido/descenso sin liga inferior) ya
              // no corren el riesgo probabilístico de quedarte sin
              // ninguna oferta; `finCarreraFinal` sólo puede tener uno de
              // esos dos motivos en este punto (ver más arriba), así que
              // alcanza con `true` — ver comentario grande en
              // engine/ofertasDT.ts.
              true,
            )
            : [];

          return {
            clubes: clubesFinales,
            canteranosOfrecidos: canteranosUsuario,
            movimientosMercado,
            noticias: agregarNoticias(state.noticias, [...noticiasMercadoFinTemporada, ...noticiasJoyas]),
            copaMundialClubes,
            copaConmebol,
            copaUefa,
            campeonesDelMundo,
            resumenTemporada,
            // Sin liga inferior en este país, el descenso termina la
            // carrera (como antes). Con liga inferior, cambioDeLigaPendiente
            // se resuelve en finalizarTemporada — la carrera sigue. El
            // despido por objetivo (2 temporadas seguidas incumplidas)
            // termina la carrera igual, incluso si hay liga inferior
            // disponible — que te echen no depende de si podés seguir
            // jugando en otra categoría.
            finCarrera: finCarreraFinal,
            cambioDeLigaPendiente,
            confianzaDirectiva: confianzaNueva,
            objetivosIncumplidosSeguidos: incumplidosSeguidos,
            // Ya se leyó arriba (evolucionarDT) para la temporada que
            // termina — la que arranca ahora empieza a contar de cero.
            actividadTemporadaDT: actividadTemporadaVacia(),
            carreraDT: carreraDTFinal,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDTFinal)],
            ofertasDT,
            renovacionDT,
            ofertasRescate,
            // Badge de Plantel (pedido explícito, ver contratoEventosSinVer
            // más arriba) — se ACUMULA (no se pisa) hasta que el usuario
            // entra a Plantel, para no perder el aviso si simula varias
            // temporadas seguidas sin mirar esa pantalla.
            contratoEventosSinVer: state.contratoEventosSinVer
              + contratosRenovadosUsuario.length + contratosLiberadosUsuario.length,
          };
        }),

      aceptarCanterano: (jugadorId, aniosElegidos) => {
        const state = get();
        if (!state.clubUsuarioId) return false;
        const canterano = state.canteranosOfrecidos.find((j) => j.id === jugadorId);
        const club = state.clubes[state.clubUsuarioId];
        if (!canterano || !club) return false;
        if (!hayCupo(club)) return false;

        const jugadorFichado = asignarContrato(canterano, club.id, multiplicadorSalarialDeLiga(club.liga), aniosElegidos);
        jugadorFichado.dorsal = asignarDorsalLibre(club.plantel, jugadorFichado.posicion);
        set((s) => ({
          clubes: { ...s.clubes, [club.id]: { ...club, plantel: [...club.plantel, jugadorFichado] } },
          canteranosOfrecidos: s.canteranosOfrecidos.filter((j) => j.id !== jugadorId),
          // Progreso del DT (ver engine/progresoDT.ts) — aceptar un
          // canterano cuenta para la evolución de `desarrollo`.
          actividadTemporadaDT: {
            ...s.actividadTemporadaDT,
            canteranosAceptados: s.actividadTemporadaDT.canteranosAceptados + 1,
          },
          // Carrera del DT (ver engine/carreraDT.ts) — cuenta carrera
          // completa, para el apodo "El Formador"/"El Tiburón".
          carreraDT: registrarCanterano(s.carreraDT),
        }));
        return true;
      },

      // Si se descarta: 50% se pierde, 50% termina en la cantera de un
      // club rival al azar (simplificación de v1 que prevé la spec).
      descartarCanterano: (jugadorId) =>
        set((state) => {
          const canterano = state.canteranosOfrecidos.find((j) => j.id === jugadorId);
          const restantes = state.canteranosOfrecidos.filter((j) => j.id !== jugadorId);
          if (!canterano || !state.liga) return { canteranosOfrecidos: restantes };

          const otrosClubs = state.liga.clubIds.filter((id) => id !== state.clubUsuarioId);
          if (otrosClubs.length === 0 || Math.random() >= 0.5) {
            return { canteranosOfrecidos: restantes };
          }
          const rivalId = otrosClubs[Math.floor(Math.random() * otrosClubs.length)];
          const rival = state.clubes[rivalId];
          if (!rival || !hayCupo(rival)) return { canteranosOfrecidos: restantes };
          const jugadorFichado = asignarContrato(canterano, rival.id, multiplicadorSalarialDeLiga(rival.liga));
          jugadorFichado.dorsal = asignarDorsalLibre(rival.plantel, jugadorFichado.posicion);
          return {
            clubes: {
              ...state.clubes,
              [rivalId]: { ...rival, plantel: [...rival.plantel, jugadorFichado] },
            },
            canteranosOfrecidos: restantes,
          };
        }),

      // La copa nacional se resortea entera cada temporada (participan
      // todos los clubes de la liga de nuevo, sin arrastrar nada de la
      // anterior) — mismo criterio que el fixture doméstico. El mercado
      // internacional (clubesExtranjerosIds) también se resortea acá.
      //
      // Ascenso/descenso real (pedido explícito): si procesarFinDeTemporada
      // dejó un cambioDeLigaPendiente, la temporada nueva arranca
      // directamente en la liga de destino — se arma con
      // generarLigaConClubExistente (el club del usuario se conserva tal
      // cual, el resto de la liga se genera de cero).
      finalizarTemporada: () =>
        set((state) => {
          if (!state.liga || !state.clubUsuarioId) return state;

          const clubesSinExtranjeros: Record<string, Club> = { ...state.clubes };
          state.clubesExtranjerosIds.forEach((id) => { delete clubesSinExtranjeros[id]; });

          if (state.cambioDeLigaPendiente) {
            const ligaDestino = LIGAS.find((l) => l.id === state.cambioDeLigaPendiente!.destino);
            const clubUsuario = clubesSinExtranjeros[state.clubUsuarioId];
            if (ligaDestino && clubUsuario) {
              const { liga, clubes: clubesNuevaLiga } = generarLigaConClubExistente(
                ligaDestino.clubes,
                clubUsuario,
                ligaDestino.nombre,
                state.liga.temporadaActual + 1,
              );
              // rotarListadosIA primero (sólo domésticos de la liga
              // nueva), extranjeros después sin tocar — mismo orden que
              // iniciarPartidaNueva, mismo motivo.
              const clubesExtranjeros = generarClubesExtranjeros(liga.nombre);
              const clubesDomesticos = rotarListadosIA(clubesNuevaLiga, state.clubUsuarioId);
              const clubes = { ...clubesDomesticos, ...clubesExtranjeros };
              const nombreCopaNacional = copaNacionalDeLiga(liga.nombre);
              return {
                liga,
                clubes,
                ultimasLesiones: [],
      ultimasTarjetas: [],
                // Sólo domésticos — ver nota en iniciarPartidaNueva.
                copaNacional: nombreCopaNacional ? generarCopaNacional(nombreCopaNacional, clubesDomesticos) : null,
                cambioDeLigaPendiente: null,
                objetivoTemporada: asignarObjetivoTemporada(clubesDomesticos[state.clubUsuarioId], Object.values(clubesDomesticos)),
                historialSemanalUsuario: [],
                clubesExtranjerosIds: Object.keys(clubesExtranjeros),
                partidosPretemporada: generarPretemporada(state.clubUsuarioId, clubes),
              };
            }
          }

          // Ascenso/descenso real de la IA (bug reportado: un club como
          // Osasuna terminaba último y seguía en la misma liga la
          // temporada siguiente — antes esto SÓLO se aplicaba al club del
          // usuario). Sólo tiene sentido acá, en la rama donde el usuario
          // NO cambia de liga (si cambia, la rama de arriba ya reconstruye
          // toda la liga de destino de cero).
          const nombreLigaInferior = ligaInferiorDe(state.liga.nombre);
          const ligaInferiorOpcion = nombreLigaInferior
            ? LIGAS.find((l) => l.nombre === nombreLigaInferior && l.disponible) ?? null
            : null;

          let clubIdsLiga = state.liga.clubIds;
          let clubesLiga = clubesSinExtranjeros;
          if (ligaInferiorOpcion) {
            const tablaFinal = calcularTabla(state.liga.fixture, state.liga.clubIds);
            const resultado = aplicarAscensoDescensoIA(
              clubesSinExtranjeros,
              state.liga.clubIds,
              tablaFinal,
              state.clubUsuarioId,
              state.liga.nombre,
              ligaInferiorOpcion.clubes,
            );
            clubIdsLiga = resultado.clubIds;
            clubesLiga = resultado.clubes;
          }

          const clubesExtranjeros = generarClubesExtranjeros(state.liga.nombre);
          const clubes = { ...clubesLiga, ...clubesExtranjeros };
          const nombreCopaNacional = copaNacionalDeLiga(state.liga.nombre);
          return {
            liga: {
              ...state.liga,
              clubIds: clubIdsLiga,
              temporadaActual: state.liga.temporadaActual + 1,
              fixture: generarFixture(clubIdsLiga),
            },
            clubes,
            ultimasLesiones: [],
      ultimasTarjetas: [],
            // clubesLiga, no `clubes` — ver nota en iniciarPartidaNueva.
            copaNacional: nombreCopaNacional ? generarCopaNacional(nombreCopaNacional, clubesLiga) : null,
            cambioDeLigaPendiente: null,
            objetivoTemporada: asignarObjetivoTemporada(clubesLiga[state.clubUsuarioId], Object.values(clubesLiga)),
            historialSemanalUsuario: [],
            clubesExtranjerosIds: Object.keys(clubesExtranjeros),
            partidosPretemporada: generarPretemporada(state.clubUsuarioId, clubes),
          };
        }),

      // Copa Mundial de Clubes de la FIFA — 8 grupos de 4 a una sola rueda
      // (fecha por fecha, como la liga doméstica), luego octavos de final
      // en adelante a partido único (ronda por ronda, como la copa
      // nacional: no hace falta pausa "fecha por fecha" dentro de una
      // llave de un solo partido).
      simularProximaFechaCopaMundial: () =>
        set((state) => {
          if (!state.copaMundialClubes || !state.liga || !state.clubUsuarioId) return state;
          const copaMundialClubes = simularProximaFechaGruposMundial(state.copaMundialClubes);
          const { clubes, partidosNuevos } = aplicarGolesDeCopaAlClub(state.clubes, state.copaMundialClubes, copaMundialClubes);
          const noticias = generarNoticiasDeCopa(partidosNuevos, clubes, state.clubUsuarioId, state.liga.temporadaActual);
          const carreraDT = actualizarCarreraDeCopa(
            state.carreraDT, partidosNuevos, clubes, state.clubUsuarioId,
            state.copaMundialClubes.campeonId, copaMundialClubes.campeonId, 'Copa Mundial de Clubes', state.liga.temporadaActual,
          );
          return {
            copaMundialClubes, clubes, noticias: agregarNoticias(state.noticias, noticias), carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      simularProximaEtapaCopaMundial: () =>
        set((state) => {
          if (!state.copaMundialClubes || !state.liga || !state.clubUsuarioId) return state;
          const copaMundialClubes = simularProximaEtapaMundial(state.copaMundialClubes);
          const { clubes, partidosNuevos } = aplicarGolesDeCopaAlClub(state.clubes, state.copaMundialClubes, copaMundialClubes);
          const noticias = generarNoticiasDeCopa(partidosNuevos, clubes, state.clubUsuarioId, state.liga.temporadaActual);
          const carreraDT = actualizarCarreraDeCopa(
            state.carreraDT, partidosNuevos, clubes, state.clubUsuarioId,
            state.copaMundialClubes.campeonId, copaMundialClubes.campeonId, 'Copa Mundial de Clubes', state.liga.temporadaActual,
          );
          return {
            copaMundialClubes, clubes, noticias: agregarNoticias(state.noticias, noticias), carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      simularCopaMundialCompleta: () =>
        set((state) => {
          if (!state.copaMundialClubes || !state.liga || !state.clubUsuarioId) return state;
          const copaAntes = state.copaMundialClubes;
          let copa = copaAntes;
          let iteraciones = 0;
          while (copa.fase !== 'campeon' && iteraciones < 100) {
            copa = copa.fase === 'grupos' ? simularProximaFechaGruposMundial(copa) : simularProximaEtapaMundial(copa);
            iteraciones += 1;
          }
          const { clubes, partidosNuevos } = aplicarGolesDeCopaAlClub(state.clubes, copaAntes, copa);
          const noticias = generarNoticiasDeCopa(partidosNuevos, clubes, state.clubUsuarioId, state.liga.temporadaActual);
          const carreraDT = actualizarCarreraDeCopa(
            state.carreraDT, partidosNuevos, clubes, state.clubUsuarioId,
            copaAntes.campeonId, copa.campeonId, 'Copa Mundial de Clubes', state.liga.temporadaActual,
          );
          return {
            copaMundialClubes: copa, clubes, noticias: agregarNoticias(state.noticias, noticias), carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      // Copa nacional — cada llamada resuelve TODA la ronda actual de una
      // (a diferencia de la liga/Copa Internacional no tiene sentido una
      // pausa "fecha por fecha" dentro de una ronda: cada llave son 1-2
      // partidos nomás) y arma la siguiente.
      simularProximaRondaCopaNacional: () =>
        set((state) => {
          if (!state.copaNacional || !state.liga || !state.clubUsuarioId) return state;
          const copaNacional = simularRondaCopaNacional(state.copaNacional);
          const { clubes, partidosNuevos } = aplicarGolesDeCopaAlClub(state.clubes, state.copaNacional, copaNacional);
          const noticias = generarNoticiasDeCopa(partidosNuevos, clubes, state.clubUsuarioId, state.liga.temporadaActual);
          const carreraDT = actualizarCarreraDeCopa(
            state.carreraDT, partidosNuevos, clubes, state.clubUsuarioId,
            state.copaNacional.campeonId, copaNacional.campeonId, copaNacional.nombre, state.liga.temporadaActual,
          );
          return {
            copaNacional, clubes, noticias: agregarNoticias(state.noticias, noticias), carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      simularCopaNacionalCompleta: () =>
        set((state) => {
          if (!state.copaNacional || !state.liga || !state.clubUsuarioId) return state;
          const copaAntes = state.copaNacional;
          let copa = copaAntes;
          let iteraciones = 0;
          // Tope de seguridad: con hasta ~500 clubes (nunca va a pasar en
          // este juego) son ≤9 rondas — 50 es un margen amplio para que
          // esto nunca pueda quedar en loop infinito ante un bug futuro.
          while (!copa.campeonId && iteraciones < 50) {
            copa = simularRondaCopaNacional(copa);
            iteraciones += 1;
          }
          const { clubes, partidosNuevos } = aplicarGolesDeCopaAlClub(state.clubes, copaAntes, copa);
          const noticias = generarNoticiasDeCopa(partidosNuevos, clubes, state.clubUsuarioId, state.liga.temporadaActual);
          const carreraDT = actualizarCarreraDeCopa(
            state.carreraDT, partidosNuevos, clubes, state.clubUsuarioId,
            copaAntes.campeonId, copa.campeonId, copa.nombre, state.liga.temporadaActual,
          );
          return {
            copaNacional: copa, clubes, noticias: agregarNoticias(state.noticias, noticias), carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      // Copa Libertadores / Copa Sudamericana ("formato real completo",
      // pedido explícito) — fase de grupos fecha por fecha (como la liga
      // doméstica), luego playoff de acceso/knockout ronda por ronda (como
      // la copa nacional: cada llave son 1-2 partidos nomás, no hace falta
      // pausa intermedia).
      simularProximaFechaCopaConmebol: () =>
        set((state) => {
          if (!state.copaConmebol || !state.liga || !state.clubUsuarioId) return state;
          const copaConmebol = simularProximaFechaGruposConmebol(state.copaConmebol);
          const { clubes, partidosNuevos } = aplicarGolesDeCopaAlClub(state.clubes, state.copaConmebol, copaConmebol);
          const noticias = generarNoticiasDeCopa(partidosNuevos, clubes, state.clubUsuarioId, state.liga.temporadaActual);
          const nombreCopaConmebol = copaConmebol.tipo === 'libertadores' ? 'Copa Libertadores' : 'Copa Sudamericana';
          const carreraDT = actualizarCarreraDeCopa(
            state.carreraDT, partidosNuevos, clubes, state.clubUsuarioId,
            state.copaConmebol.campeonId, copaConmebol.campeonId, nombreCopaConmebol, state.liga.temporadaActual,
          );
          return {
            copaConmebol, clubes, noticias: agregarNoticias(state.noticias, noticias), carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      simularProximaEtapaCopaConmebol: () =>
        set((state) => {
          if (!state.copaConmebol || !state.liga || !state.clubUsuarioId) return state;
          const copaConmebol = simularProximaEtapaConmebol(state.copaConmebol);
          const { clubes, partidosNuevos } = aplicarGolesDeCopaAlClub(state.clubes, state.copaConmebol, copaConmebol);
          const noticias = generarNoticiasDeCopa(partidosNuevos, clubes, state.clubUsuarioId, state.liga.temporadaActual);
          const nombreCopaConmebol = copaConmebol.tipo === 'libertadores' ? 'Copa Libertadores' : 'Copa Sudamericana';
          const carreraDT = actualizarCarreraDeCopa(
            state.carreraDT, partidosNuevos, clubes, state.clubUsuarioId,
            state.copaConmebol.campeonId, copaConmebol.campeonId, nombreCopaConmebol, state.liga.temporadaActual,
          );
          return {
            copaConmebol, clubes, noticias: agregarNoticias(state.noticias, noticias), carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      simularCopaConmebolCompleta: () =>
        set((state) => {
          if (!state.copaConmebol || !state.liga || !state.clubUsuarioId) return state;
          const copaAntes = state.copaConmebol;
          let copa = copaAntes;
          let iteraciones = 0;
          while (copa.fase !== 'campeon' && iteraciones < 100) {
            copa = copa.fase === 'grupos' ? simularProximaFechaGruposConmebol(copa) : simularProximaEtapaConmebol(copa);
            iteraciones += 1;
          }
          const { clubes, partidosNuevos } = aplicarGolesDeCopaAlClub(state.clubes, copaAntes, copa);
          const noticias = generarNoticiasDeCopa(partidosNuevos, clubes, state.clubUsuarioId, state.liga.temporadaActual);
          const nombreCopaConmebol = copa.tipo === 'libertadores' ? 'Copa Libertadores' : 'Copa Sudamericana';
          const carreraDT = actualizarCarreraDeCopa(
            state.carreraDT, partidosNuevos, clubes, state.clubUsuarioId,
            copaAntes.campeonId, copa.campeonId, nombreCopaConmebol, state.liga.temporadaActual,
          );
          return {
            copaConmebol: copa, clubes, noticias: agregarNoticias(state.noticias, noticias), carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      // UEFA Champions/Europa/Conference League ("formato real completo",
      // pedido explícito) — fase de liga suiza fecha por fecha (8 en
      // total), luego playoff de acceso/knockout ronda por ronda.
      simularProximaFechaCopaUefa: () =>
        set((state) => {
          if (!state.copaUefa || !state.liga || !state.clubUsuarioId) return state;
          const copaUefa = simularProximaFechaSuizaCompeticion(state.copaUefa);
          const { clubes, partidosNuevos } = aplicarGolesDeCopaAlClub(state.clubes, state.copaUefa, copaUefa);
          const noticias = generarNoticiasDeCopa(partidosNuevos, clubes, state.clubUsuarioId, state.liga.temporadaActual);
          const carreraDT = actualizarCarreraDeCopa(
            state.carreraDT, partidosNuevos, clubes, state.clubUsuarioId,
            state.copaUefa.campeonId, copaUefa.campeonId, copaUefa.nombre, state.liga.temporadaActual,
          );
          return {
            copaUefa, clubes, noticias: agregarNoticias(state.noticias, noticias), carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      simularProximaEtapaCopaUefa: () =>
        set((state) => {
          if (!state.copaUefa || !state.liga || !state.clubUsuarioId) return state;
          const copaUefa = simularProximaEtapaSuizaCompeticion(state.copaUefa);
          const { clubes, partidosNuevos } = aplicarGolesDeCopaAlClub(state.clubes, state.copaUefa, copaUefa);
          const noticias = generarNoticiasDeCopa(partidosNuevos, clubes, state.clubUsuarioId, state.liga.temporadaActual);
          const carreraDT = actualizarCarreraDeCopa(
            state.carreraDT, partidosNuevos, clubes, state.clubUsuarioId,
            state.copaUefa.campeonId, copaUefa.campeonId, copaUefa.nombre, state.liga.temporadaActual,
          );
          return {
            copaUefa, clubes, noticias: agregarNoticias(state.noticias, noticias), carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),

      simularCopaUefaCompleta: () =>
        set((state) => {
          if (!state.copaUefa || !state.liga || !state.clubUsuarioId) return state;
          const copaAntes = state.copaUefa;
          let copa = copaAntes;
          let iteraciones = 0;
          while (copa.fase !== 'campeon' && iteraciones < 100) {
            copa = copa.fase === 'fase-liga' ? simularProximaFechaSuizaCompeticion(copa) : simularProximaEtapaSuizaCompeticion(copa);
            iteraciones += 1;
          }
          const { clubes, partidosNuevos } = aplicarGolesDeCopaAlClub(state.clubes, copaAntes, copa);
          const noticias = generarNoticiasDeCopa(partidosNuevos, clubes, state.clubUsuarioId, state.liga.temporadaActual);
          const carreraDT = actualizarCarreraDeCopa(
            state.carreraDT, partidosNuevos, clubes, state.clubUsuarioId,
            copaAntes.campeonId, copa.campeonId, copa.nombre, state.liga.temporadaActual,
          );
          return {
            copaUefa: copa, clubes, noticias: agregarNoticias(state.noticias, noticias), carreraDT,
            celebracionesPendientes: [...state.celebracionesPendientes, ...titulosNuevosDesde(state.carreraDT, carreraDT)],
          };
        }),
    }),
    { name: 'dt-manager-savegame' },
  ),
);
