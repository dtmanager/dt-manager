// Motor puro de simulación de partidos. Desde rediseno-motor-partido.md
// fase 2: ya no se decide un xG total del partido y se reparte en 90
// tiradas de moneda — se simulan POSESIONES que avanzan zona por zona (3.1
// a 3.4 del documento) con duelos 1 contra 1 entre el jugador puntual que
// tiene la pelota y el rival más relevante de esa zona (no un promedio de
// equipo), y el marcador es la consecuencia de esas posesiones, no un
// número decidido de antemano. `calcularFuerzaSector`/`aplicarMultiplicadoresDT`/
// `calcularVentajaLocal`/`calcularXG` se mantienen (siguen usándose para
// `medio` en la posesión y como capa de compatibilidad para quien todavía
// los consuma) aunque el marcador ya no sale de `calcularXG`.

import type { Jugador, TirosEquipo } from '../types';
import {
  BUCKET_ANCHO_DE_POSICION, BUCKET_DE_POSICION, type Ancho, type SectorPosicion,
} from '../data/posiciones';
import { clamp, randomEntero } from './random';

export interface StatsDT {
  tactica: number;
  adaptabilidad: number;
  desarrollo: number;
  gestionVestuario: number;
  motivacion: number;
  analisis: number;
  mercado: number;
  reaccion: number;
  mentalidad: number;
  reputacion: number;
}

export interface FuerzaSector {
  ataque: number;
  defensa: number;
  // Promedio de GRL del mediocampo (bucket MED), aparte de cómo ya pesa
  // dentro de `ataque` — lo usa calcularPosesion (rediseno-motor-partido.md
  // fase 1) para comparar mediocampos entre los dos equipos.
  medio: number;
}

function promedio(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}

// 5.1 — fuerza de equipo por sector, a partir del GRL de los 11 titulares
// agrupados por posición.
export function calcularFuerzaSector(grlPorPosicion: {
  DEL: number[];
  MED: number[];
  DEF: number[];
  ARQ: number[];
}): FuerzaSector {
  const ataque = promedio(grlPorPosicion.DEL) * 0.55 + promedio(grlPorPosicion.MED) * 0.45;
  const defensa = promedio(grlPorPosicion.DEF) * 0.65 + promedio(grlPorPosicion.ARQ) * 0.35;
  const medio = promedio(grlPorPosicion.MED);
  return { ataque, defensa, medio };
}

// rediseno-motor-partido.md sección 3.2 — fase 1: la posesión ya no es un
// derivado invisible del xG, es el primer número que se calcula (curva no
// lineal tipo Hattrick: una ventaja chica de mediocampo da una ventaja de
// posesión más que proporcional). Devuelve 0-1, probabilidad de que el
// local se quede con la pelota en cada disputa.
export function calcularPosesion(medioLocal: number, medioVisitante: number): number {
  const fLocal = Math.exp(medioLocal / 20);
  const fVisitante = Math.exp(medioVisitante / 20);
  return fLocal / (fLocal + fVisitante);
}

function multiplicador(stat: number, k: number): number {
  return 1 + (stat - 50) * k;
}

// 5.2 — multiplicadores del DT sobre ataque/defensa.
export function aplicarMultiplicadoresDT(
  sector: FuerzaSector,
  dt: StatsDT,
  dtRival: StatsDT,
  cohesion: number,
  partidoImportante: boolean,
): FuerzaSector {
  const multTactica = multiplicador(dt.tactica, 0.003);
  const multMotivacion = multiplicador(dt.motivacion, 0.0025);
  const multMoral = multiplicador(cohesion, 0.002);
  const multAnalisis = clamp(1 + (dt.analisis - dtRival.analisis) / 500, 0.9, 1.1);
  const multMentalidad = partidoImportante ? multiplicador(dt.mentalidad, 0.004) : 1;

  const factor = multTactica * multMotivacion * multMoral * multAnalisis * multMentalidad;
  // `medio` pasa sin modificar: los multiplicadores del DT son sobre
  // ataque/defensa (5.2), la posesión (fase 1 del rediseño de motor) se
  // calcula aparte a partir del medio "crudo" de cada plantel.
  return { ataque: sector.ataque * factor, defensa: sector.defensa * factor, medio: sector.medio };
}

// 5.3 — ventaja de local, escalada por reputación del DT local.
export function calcularVentajaLocal(dtLocal: StatsDT): number {
  return 1.1 * (1 + (dtLocal.reputacion - 50) * 0.001);
}

export const PENALIZACION_VISITANTE = 0.95;

// 5.4 — xG esperado para todo el partido de un equipo.
export function calcularXG(ataqueFinal: number, defensaFinalRival: number, factorLocalia: number): number {
  const io = ataqueFinal - defensaFinalRival;
  return clamp(1.35 + io / 25, 0.2, 4.5) * factorLocalia;
}

const MINUTOS_POR_MITAD = 45;

// -------------------- 3.6 — modelo de datos de eventos --------------------

export type TipoEvento =
  | 'inicio_posesion' | 'avance' | 'tiro' | 'gol' | 'perdida'
  | 'corner' | 'falta' | 'penal' | 'fuera_de_juego' | 'centro'
  | 'tarjeta_amarilla' | 'tarjeta_roja' | 'cambio' | 'fin_mitad' | 'fin_partido';

export interface EventoPartido {
  tipo: TipoEvento;
  equipo: 'local' | 'visitante';
  minuto: number;
  // 0 (área propia del equipo que tiene la pelota) a ZONAS-1 (área rival).
  zona: number;
  // rediseno-motor-partido_1.md §3.1 — franja de ancho (grilla 6x3) de la
  // posesión: qué banda del campo está jugando en este evento. Constante
  // para toda una posesión (se sortea una vez, ver elegirAnchoInicial),
  // no cambia de banda a mitad de la jugada (fase 2 pendiente). Pensado
  // para un futuro visualizador (§3.6/§5), hoy no se muestra en ninguna
  // pantalla.
  ancho: Ancho;
  // rediseno-motor-partido_1.md §3.5: sólo se completa para penal/falta (el
  // pateador elegido por elegirPateador) y para el 'gol' que sale de esa
  // jugada — el resto de eventos (avance/tiro/gol de juego abierto) sigue
  // sin jugador puntual, eso lo sigue resolviendo el sorteo ponderado de
  // atribuirGoleadores (estadisticasPartido.ts).
  jugadorId?: string;
  // Arquero que enfrenta el penal/tiro libre — sólo se completa junto con
  // jugadorId en esos dos eventos.
  arqueroId?: string;
  // De qué jugada salió un evento 'gol' — undefined para juego abierto
  // (incluye córner). Pedido explícito: "que se sepa quien metió los
  // penales" en el partido normal, no sólo el nombre.
  origen?: 'penal' | 'falta';
  // rediseno-motor-partido_1.md §3.3.1 punto 2 — sólo en 'inicio_posesion':
  // true si esta posesión arrancó como contraataque (recuperada con
  // ventaja de ritmo, arranca 2 zonas más adelante de lo normal).
  // Undefined (no `false`) en el resto para no inflar cada evento del
  // partido con un campo que casi nunca aplica.
  contraataque?: boolean;
  // Pase filtrado (pedido explícito, la otra mitad de "contraataque/pase
  // filtrado") — sólo en 'avance': true si este avance fue un pase entre
  // líneas que saltó directo de zona 3 a zona 5 (ver ZONA_PASE_FILTRADO)
  // en vez del avance normal de a una zona. Mismo criterio que
  // `contraataque`: undefined en el resto, no `false`.
  paseFiltrado?: boolean;
  // xG (expected goals) del remate puntual que representa este evento —
  // sólo se completa en 'tiro'/'corner'/'falta'/'penal' cuando ESE evento
  // en particular fue un intento de gol real (para falta/corner no todos
  // lo son, ver simularPosesion). Pedido explícito: "xG visible en el
  // detalle de partido" — se suma por equipo en ResultadoPartido.xgLocal/
  // xgVisitante, no hace falta guardar cada valor individual en el Partido
  // persistido (sólo el acumulado).
  xg?: number;
  // Si este remate fue al arco (pedido explícito: "no se diferencia
  // cuando patean afuera") — sólo tiene sentido junto con `xg` (mismo
  // conjunto de tipos: 'tiro'/'corner', y sólo cuando ESE evento fue un
  // intento de gol real). El motor YA calculaba esto internamente para
  // los contadores tirosLocal.alArco/afuera (ver ResultadoPasoPosesion en
  // simularPosesion) pero nunca se lo pegaba al evento — el visualizador
  // no tenía forma de saber si mostrar la pelota entrando al arco o
  // yéndose afuera, así que TODO tiro se dibujaba como si fuera al arco.
  alArco?: boolean;
  // Tiempo complementario/descuento (pedido explícito) — cuando está
  // presente, `minuto` se queda fijo en el cierre de la mitad (45 o 90) y
  // `minutoAgregado` marca cuánto del descuento pasó ("45+2'"), en vez de
  // seguir sumando al minuto real y pisar la numeración de la mitad
  // siguiente. Undefined durante el tiempo reglamentario (la inmensa
  // mayoría de los eventos), igual que `contraataque`/`paseFiltrado`.
  minutoAgregado?: number;
  // Cambios (pedido explícito: "sistema de cambios y suplentes en
  // partido") — sólo en 'cambio': jugadorId es quien SALE, jugadorEntraId
  // quien ENTRA. El resto de eventos no lo usa.
  jugadorEntraId?: string;
}

export interface EventoGolPartido {
  equipo: 'local' | 'visitante';
  minuto: number; // 1-90 en tiempo reglamentario, hasta 120 si hubo alargue
  jugadorId?: string;
  origen?: 'penal' | 'falta';
  // Ver EventoPartido.minutoAgregado — mismo criterio.
  minutoAgregado?: number;
}

// Sistema de tarjetas (pedido explícito) — equipo es el del jugador
// AMONESTADO (el infractor), no el equipo que tenía la pelota en la
// jugada. jugadorId siempre viene completo (a diferencia de un gol de
// juego abierto, acá no hace falta ningún sorteo: quien comete la falta
// ya se sabe, es jugadorDefensor de ese paso — ver simularPosesion).
export interface EventoTarjetaPartido {
  equipo: 'local' | 'visitante';
  jugadorId: string;
  tipo: 'amarilla' | 'roja';
  minuto: number;
  minutoAgregado?: number;
}

export interface ResultadoPartido {
  golesLocal: number;
  golesVisitante: number;
  eventosGol: EventoGolPartido[];
  // Secuencia completa de eventos (3.6) — superset de eventosGol, pensada
  // para consumo futuro (visualizador, sección 5; estadísticas de tiros).
  eventos: EventoPartido[];
  // 0-100, % de posesión del local — ya no es la probabilidad teórica de
  // calcularPosesion (eso queda como el sorteo de CADA disputa), sino el
  // resultado real medido: cuántas posesiones tuvo cada equipo sobre el
  // total (3.5 — "sale sola, ya no hay que inventarla").
  posesionLocal: number;
  tirosLocal: TirosEquipo;
  tirosVisitante: TirosEquipo;
  // Pedido explícito: poder clickear un partido y ver todas las
  // estadísticas, no sólo el marcador — se derivan contando los eventos
  // 'corner'/'falta' de la fase 3, no hace falta un cálculo aparte.
  cornersLocal: number;
  cornersVisitante: number;
  faltasLocal: number;
  faltasVisitante: number;
  penalesLocal: number;
  penalesVisitante: number;
  eventosTarjeta: EventoTarjetaPartido[];
  tarjetasAmarillasLocal: number;
  tarjetasAmarillasVisitante: number;
  tarjetasRojasLocal: number;
  tarjetasRojasVisitante: number;
  // xG acumulado (pedido explícito: "xG visible en el detalle de
  // partido") — suma del campo `xg` de todos los eventos de ese equipo
  // que representaron un remate real (ver EventoPartido.xg).
  xgLocal: number;
  xgVisitante: number;
  // Cambios (pedido explícito) — cuántas sustituciones hizo cada equipo.
  cambiosLocal: number;
  cambiosVisitante: number;
}

export interface EquipoPartido {
  sector: FuerzaSector;
  dt: StatsDT;
  cohesion: number;
  // Titulares reales del equipo — el modelo de posesión por zonas (3.3)
  // resuelve cada duelo entre EL jugador puntual que tiene la pelota y el
  // rival más relevante de esa zona, no contra un promedio de equipo (así
  // lo valida Football Manager, sección 2.7 del documento).
  titulares: Jugador[];
  // Banco (pedido explícito: "sistema de cambios y suplentes en
  // partido") — de acá sale el reemplazo cuando un titular se cansa (ver
  // intentarCambio más abajo). Opcional: si no viene (ej. tests viejos
  // que arman un EquipoPartido a mano), simplemente nunca hay cambios —
  // no rompe nada, sólo desactiva la funcionalidad para ese caller.
  suplentes?: Jugador[];
  // Mentalidad de partido (pedido explícito, mecánica 2 de
  // docs/que-le-falta-profundidad.md — "un solo dial, no un sistema
  // táctico completo"): opcional, default 'equilibrado' (ver
  // ajusteMentalidad) — sólo el club del usuario la elige de verdad hoy,
  // la IA nunca setea este campo y simplemente juega equilibrado.
  mentalidad?: MentalidadPartido;
}

export type MentalidadPartido = 'defensivo' | 'equilibrado' | 'ofensivo';

// 5.2 (mecánica 2 del documento de profundidad) — "más ofensivo sube la
// varianza (más goles a favor Y en contra posibles), más defensivo la
// baja": se aplica como un empuje SIMÉTRICO sobre el nudge de ambos
// equipos (ver simularPartido) — jugar ofensivo mejora el propio ataque
// PERO también facilita el ataque rival (la defensa se afloja al empujar
// hombres arriba), y viceversa con defensivo. Magnitud chica a propósito
// (mismo orden que un nudge de DT bien calibrado, no un multiplicador que
// domine el partido por sí solo — ver comentario de nudgeLocalBase en
// simularPartido).
const AJUSTE_MENTALIDAD: Record<MentalidadPartido, number> = {
  defensivo: -0.04,
  equilibrado: 0,
  ofensivo: 0.04,
};

export function ajusteMentalidad(mentalidad: MentalidadPartido | undefined): number {
  return AJUSTE_MENTALIDAD[mentalidad ?? 'equilibrado'];
}

// -------------------- 3.1 — grilla de zonas --------------------

const ZONAS = 6; // 0 (área propia) .. 5 (área rival) — grilla 6x1, ver 3.1
const ZONA_MIN_TIRO = 3; // zonas 3,4,5 (0-based) = zonas 4,5,6 del documento (1-based)

// A qué "línea" del equipo suele pertenecer el jugador que tiene la pelota
// (atacante) o el que la marca (defensor) según la zona — aproximación
// simple de la matriz de transición de xT (2.3) usando los 4 buckets que
// ya existen (BUCKET_DE_POSICION) en vez de datos reales de tracking. El
// defensor "espeja" al atacante: en el tercio propio del atacante lo
// presionan los delanteros rivales, en el tercio rival lo marcan los
// defensores rivales.
const BUCKET_ATACANTE_POR_ZONA: SectorPosicion[] = ['DEF', 'DEF', 'MED', 'MED', 'DEL', 'DEL'];
const BUCKET_DEFENSOR_POR_ZONA: SectorPosicion[] = ['DEL', 'DEL', 'MED', 'MED', 'DEF', 'DEF'];

// rediseno-motor-partido_1.md §3.1/§3.3: dentro del sector de largo que le
// toca a la zona (DEF/MED/DEL), preferir al jugador de ESA franja de
// ancho — un duelo por la izquierda lo disputan más seguido LI/EI que un
// central cualquiera del mismo sector.
//
// PROB_PREFERIR_FRANJA es una preferencia, no un filtro exclusivo — el
// mismo jugador que picó por la banda no es siempre el que termina
// definiendo (un centro lo puede rematar el 9, no sólo el que lo tiró).
// La primera versión SÍ filtraba de forma exclusiva (sólo EI/ED podían
// aparecer en banda, nunca un DEL) y eso hundió los goles a la mitad
// (medido: ~1.29 → ~0.62 por equipo) porque en un 4-4-2 el DEL tiene
// mucho más `tiro` que un extremo (perfil de sub-stats-diseno.md: DEL
// ronda 86 de tiro con grl 70, EI/ED rondan 72) y con el filtro exclusivo
// el 9 dejaba de aparecer en 2 de cada 3 posesiones (las que caían en
// banda) — bajaba mucho el tiro promedio de quien remataba. Con la
// preferencia (no exclusividad) el 9 sigue apareciendo bastante menos en
// banda que antes (real: los extremos sí llevan más la pelota ahí) pero
// no desaparece, así que la banda pesa distinto sin romper el balance de
// goles ya calibrado.
const PROB_PREFERIR_FRANJA = 0.6;

function elegirJugadorDeBucket(titulares: Jugador[], bucket: SectorPosicion, anchoPreferido: Ancho): Jugador | null {
  const candidatosSector = titulares.filter((j) => j.posicion !== 'ARQ' && BUCKET_DE_POSICION[j.posicion] === bucket);
  if (candidatosSector.length === 0) {
    const cualquiera = titulares.filter((j) => j.posicion !== 'ARQ');
    return cualquiera.length > 0 ? cualquiera[Math.floor(Math.random() * cualquiera.length)] : null;
  }
  const candidatosFranja = candidatosSector.filter((j) => BUCKET_ANCHO_DE_POSICION[j.posicion] === anchoPreferido);
  const disponibles = candidatosFranja.length > 0 && Math.random() < PROB_PREFERIR_FRANJA
    ? candidatosFranja
    : candidatosSector;
  return disponibles[Math.floor(Math.random() * disponibles.length)];
}

// -------------------- 3.4 — resolución de un tiro (xG por zona) --------------------

// xG base por zona de origen del tiro — StatsBomb, benchmark de 5
// temporadas de Premier League (documento sección 2.2): adentro del área
// 13.1%, borde del área 5% (punto medio), afuera del área 2.7%.
const XG_BASE_POR_ZONA: Record<number, number> = {
  5: 0.16, // área rival
  4: 0.06, // borde del área
  3: 0.032, // mediocampo ofensivo, "de afuera del área"
};

// Probabilidad de que el tiro sea "al arco" (no necesariamente gol) en vez
// de "afuera" — sólo para las estadísticas de tirosLocal/tirosVisitante,
// no afecta si es gol (eso lo decide resolverTiro). Aproximación simple:
// cuanto más cerca del arco, más preciso.
const PROB_AL_ARCO_POR_ZONA: Record<number, number> = { 5: 0.65, 4: 0.45, 3: 0.32 };

// 3.5 — córner: un tiro que sale desviado (no al arco) desde zona 4-5
// (borde del área / área rival) puede resolverse en córner en vez de
// "nada" — da pie a un remate extra con probabilidad de gol algo más alta
// (cabezazo, duelo simplificado por `fisico` en vez de `tiro`) que
// empezar de cero.
const ZONA_MIN_CORNER = 4;
const PROB_CORNER_SI_AFUERA = 0.4;

// 3.5 — offside: un intento de avanzar a la última zona (área rival)
// puede resolverse en fuera de juego en vez de avance limpio. No afecta
// el marcador (la posesión se pierde igual que con un 'pierde' normal),
// es sólo un evento más para un futuro feed de comentario en vivo.
const PROB_OFFSIDE_ZONA_FINAL = 0.06;

// Extraído de resolverTiro (pedido explícito: "xG visible en el detalle
// de partido") para poder guardar el valor puntual de cada remate, no
// sólo si fue gol o no — resolverTiro sigue existiendo tal cual para no
// tocar su firma ya cubierta por tests.
export function calcularXGTiro(zona: number, tiroDelDelantero: number, atajadaDelArquero: number): number {
  const xgBase = XG_BASE_POR_ZONA[zona] ?? 0.02;
  // El sub-stat `tiro` y la `atajada` del arquero rival modulan el xG
  // base, igual que grl/70 modula PESO_GOLEADOR hoy (estadisticasPartido.ts).
  const factor = (tiroDelDelantero / 70) / (atajadaDelArquero / 70);
  return clamp(xgBase * factor, 0.01, 0.9);
}

export function resolverTiro(zona: number, tiroDelDelantero: number, atajadaDelArquero: number): boolean {
  return Math.random() < calcularXGTiro(zona, tiroDelDelantero, atajadaDelArquero);
}

// -------------------- 3.3 — avance de una posesión, zona por zona --------------------

// `ritmo` (3.3.1): un desborde por banda pesa más que el mismo duelo por
// el medio (1.4x vs 0.7x, tal cual el documento) — un extremo rápido gana
// más duelos por afuera que un mediocampista lento por el centro, la
// asimetría real del fútbol. Antes de la grilla 6x3 todos los duelos
// usaban el 0.7x "de centro" sin importar la banda.
// cansancioAtacante/cansancioDefensor (pedido explícito: "sistema de
// cambios y suplentes... por stamina", ver penalizacionPorCansancio más
// abajo): puntos de ritmo que se restan por acumular minutos en cancha —
// el efecto de la fatiga se modela SÓLO sobre `ritmo` (las piernas
// cansadas pierden velocidad antes que técnica), no sobre todos los
// sub-stats, para no tener que tocar cada duelo del motor.
function ventajaRitmo(
  atacante: Jugador, defensor: Jugador, ancho: Ancho, cansancioAtacante: number, cansancioDefensor: number,
): number {
  const ritmoAtacante = (atacante.subStats?.ritmo ?? atacante.grl) - cansancioAtacante;
  const ritmoDefensor = (defensor.subStats?.ritmo ?? defensor.grl) - cansancioDefensor;
  const diferencia = (ritmoAtacante - ritmoDefensor) / 100;
  return diferencia * (ancho === 'centro' ? 0.7 : 1.4);
}

type ResultadoPaso = 'avanza' | 'pierde' | 'tira' | 'sigue' | 'falta';

// 3.5 — falta/tiro libre: a partir de qué zona un avance puede resolverse
// en falta del defensor en vez de avance limpio — idea tomada de la
// mejora de "Dribbling AI" de FM26 (sección 2.7: el defensor superado
// "corta la jugada" antes de dejarlo pasar). Conversión del tiro libre
// directo resultante: 6.6% (sección 2.2, benchmark StatsBomb) — salvo que
// la falta sea DENTRO del área (zona rival, ZONA_PENAL): ahí es penal, no
// tiro libre, y convierte al 75.6% (mismo benchmark).
//
// Bug reportado jugando ("casi no hay faltas como antes"): la versión
// anterior exigía `diferencia > 0.35` (el atacante ganándole el duelo de
// pase+regate contra la defensa por 35+ puntos) para siquiera CONSIDERAR
// una falta — entre dos planteles parejos (mismo grl) eso casi nunca pasa
// (medido: ~0 faltas por partido en 200 simulaciones 70 vs 70), así que
// las faltas sólo aparecían en partidos muy desparejos. En la realidad las
// faltas no dependen de una diferencia de nivel tan marcada — pasan en
// cualquier partido por duelos puntuales, entradas tarde, faltas
// tácticas. Ahora `diferencia` es un BONUS (más probable cuanto más claro
// gana el atacante) sobre una base pareja, no un requisito. Los penales
// quedan con una base bastante más baja que una falta cualquiera —
// mezclados en la misma fórmula que la falta común, dar un "salto" de
// probabilidad al llegar a la última zona convertía casi cualquier ataque
// peligroso en penal (medido: ~1 por partido, muy por encima de la
// realidad de ~0.25-0.3 por partido).
const ZONA_MIN_FALTA = ZONA_MIN_TIRO;
const ZONA_PENAL = ZONAS - 1;
const PROB_FALTA_BASE = 0.4;
const PROB_FALTA_POR_DIFERENCIA = 0.3;
// 0.09 medido en una liga real daba ~0.42 penales por partido (ambos
// equipos) — por encima de la realidad (~0.25-0.3/partido) y goles de
// penal = 15% del total (realidad ~8-10%). Bajado a 0.06.
const PROB_PENAL_BASE = 0.06;
const PROB_PENAL_POR_DIFERENCIA = 0.05;
// Bug reportado jugando ("ahora hay un montón de goles de tiro libre"):
// subir PROB_FALTA_BASE para que hubiera faltas en partidos parejos (ver
// comentario de arriba) multiplicó también los goles de tiro libre,
// porque CADA falta fuera del área se convertía en un remate directo al
// arco al 6.6% (el benchmark de StatsBomb, pero ese número mide la
// conversión de los tiros libres que un equipo YA ELIGIÓ rematar directo
// al arco — en la realidad la mayoría de las faltas de juego se reponen
// rápido o van centradas/cruzadas, no todas son un remate directo). Ahora
// sólo una fracción de las faltas fuera del área termina en un remate
// directo; el resto reanuda el juego sin ocasión de gol inmediata. El
// penal siempre se patea (no aplica acá).
//
// Esa fracción también depende de la zona (pregunta jugando: "¿se tiene
// en cuenta la zona si se patean directo o indirecto?" — antes NO, era un
// único 25% sin importar qué tan lejos del arco fuera la falta, algo
// irreal: una falta a la altura del medio campo casi nunca se remata
// directo — no hay forma realista de meterla desde ahí, se usa para
// centrar o relanzar el ataque — mientras que una falta al borde del
// área SÍ es el clásico tiro libre directo con barrera). Sólo hay 2 zonas
// posibles para una falta no-penal (ZONA_MIN_FALTA=3 y 4, la zona 5 ya es
// penal), así que alcanza con un valor por zona en vez de una fórmula.
// Bug reportado jugando ("siguen habiendo un montón de goles de tiro
// libre"): 0.08/0.45 medido en una temporada de liga real (no el 70 vs 70
// sintético) daba goles de tiro libre = 9.8% del total de goles — la
// referencia real (StatsBomb, sección 2.2 del documento) es ~2-3%. El
// tiro libre directo es un evento vistoso pero relativamente RARO como
// fuente de gol real, no una vía de gol habitual como el juego abierto.
const PROB_TIRO_LIBRE_DIRECTO_POR_ZONA: Record<number, number> = {
  3: 0.02, // mediocampo ofensivo — prácticamente nunca se remata directo
  4: 0.14, // borde del área — el tiro libre directo "de manual", pero sigue siendo la excepción, no la norma
};
const CONVERSION_TIRO_LIBRE = 0.066;
const CONVERSION_PENAL = 0.756;

// rediseno-motor-partido_1.md §3.5 / sistema-penales-diseno.md: quién
// patea un penal o tiro libre directo no es un sorteo — es el jugador de
// mejor `tiro` entre los titulares en cancha (sin arquero). Simplificación
// explícita de ambos documentos: no hay pateador designado por el club
// (eso queda para una fase 2), siempre el de mejor tiro del momento.
// Exportada porque eliminatoria.ts la reusa tal cual para ordenar la tanda
// de penales — mismo criterio, un solo lugar que lo calcula.
export function ordenPateadoresPorTiro(titulares: Jugador[]): Jugador[] {
  return titulares
    .filter((j) => j.posicion !== 'ARQ')
    .slice()
    .sort((a, b) => (b.subStats?.tiro ?? b.grl) - (a.subStats?.tiro ?? a.grl));
}

export function elegirPateador(titulares: Jugador[]): Jugador | null {
  return ordenPateadoresPorTiro(titulares)[0] ?? null;
}

// -------------------- sistema de tarjetas --------------------
//
// No todas las faltas son amonestables — la mayoría son entradas normales
// del juego. Un penal, en cambio, casi siempre sale de una falta más
// cruda (cortar un mano a mano, una jugada clara de gol) así que amerita
// tarjeta bastante más seguido. La roja directa (o segunda amarilla, ver
// más abajo) es la excepción dentro de la excepción — sólo una fracción
// chica de las faltas que YA se amonestan.
const PROB_TARJETA_EN_FALTA = 0.18;
const PROB_TARJETA_EN_PENAL = 0.35;
const PROB_ROJA_DIRECTA_SI_TARJETA_FALTA = 0.015;
const PROB_ROJA_DIRECTA_SI_TARJETA_PENAL = 0.08;

// Quién está expulsado en cada equipo, por PARTIDO (no por mitad) — un
// Set por lado, creado una vez en simularPartido. A propósito NO se
// muta `EquipoPartido.titulares` directamente: local/visitante pueden
// ser el MISMO objeto en la práctica (ej. tests que arman un solo
// `equipo()` y lo pasan dos veces) y en `fixture.ts` los tests históricos
// también reusan instancias — mutar el array compartido duplicaría cada
// expulsión en los dos lados a la vez. Filtrar por id en el momento de
// elegir jugador es más lento por duelo pero seguro sin importar si los
// objetos se comparten.
interface ExpulsadosPorEquipo {
  local: Set<string>;
  visitante: Set<string>;
}

// -------------------- cambios/suplentes por stamina --------------------
//
// Pedido explícito: "sistema de cambios y suplentes en partido de
// stamina". Mismo criterio que ExpulsadosPorEquipo de arriba (NUNCA mutar
// `EquipoPartido.titulares`, local y visitante pueden ser el mismo
// objeto) — un cambio se registra en un Map externo (saliente → entrante)
// y titularesEnCancha() lo resuelve al vuelo cada vez que hace falta el
// 11 actual, sin tocar el array original.
interface EstadoCambios {
  cambios: Map<string, Jugador>; // id del que SALE -> jugador que ENTRA
  entrantesUsados: Set<string>; // suplentes ya usados, no pueden volver a entrar
  // Minuto en el que entró cada suplente — sólo tiene entradas para
  // quienes ENTRARON de cambio; un titular original no necesita entrada
  // acá, minutosEnCancha() asume 0 cuando no encuentra el id.
  minutoIngreso: Map<string, number>;
  hechos: number;
  siguienteVentana: number; // índice en VENTANAS_DE_CAMBIO
}

interface CambiosPorEquipo {
  local: EstadoCambios;
  visitante: EstadoCambios;
}

function estadoCambiosVacio(): EstadoCambios {
  return {
    cambios: new Map(), entrantesUsados: new Set(), minutoIngreso: new Map(), hechos: 0, siguienteVentana: 0,
  };
}

// El 11 actual en cancha: titulares originales menos expulsados, con
// cualquier sustituido reemplazado por quien entró en su lugar — mismo
// orden/tamaño que equipo.titulares siempre (nunca más ni menos de lo que
// corresponde), así el resto del motor (buckets por posición, arquero)
// sigue funcionando igual.
function titularesEnCancha(equipo: EquipoPartido, expulsados: Set<string>, cambios: EstadoCambios): Jugador[] {
  return equipo.titulares
    .filter((j) => !expulsados.has(j.id))
    .map((j) => cambios.cambios.get(j.id) ?? j);
}

function minutosEnCancha(jugadorId: string, minutoActual: number, cambios: EstadoCambios): number {
  const ingreso = cambios.minutoIngreso.get(jugadorId) ?? 0;
  return Math.max(0, minutoActual - ingreso);
}

// A partir de qué tanto tiempo jugado empieza a pesar el cansancio, y
// cuánto pesa como máximo (en puntos de ritmo-equivalente, ver
// ventajaRitmo) — `fisico` amortigua la penalización: un jugador con
// buen físico aguanta más minutos antes de sentirlo. Escalado para que a
// los 90' un jugador de físico promedio (70) ya esté cerca del tope, y
// uno de físico alto lo sienta bastante menos.
const UMBRAL_CANSANCIO = 55;
const TOPE_PENALIZACION_CANSANCIO = 10;
export function penalizacionPorCansancio(minutosJugados: number, fisico: number): number {
  if (minutosJugados <= UMBRAL_CANSANCIO) return 0;
  const exceso = minutosJugados - UMBRAL_CANSANCIO;
  const resistencia = clamp(fisico / 70, 0.7, 1.3);
  return clamp((exceso / 35) * TOPE_PENALIZACION_CANSANCIO / resistencia, 0, TOPE_PENALIZACION_CANSANCIO * 1.4);
}

// Ventanas de cambio (pedido explícito, calibrado a la regla real de
// FIFA desde 2022: 3 ventanas/paradas de juego, hasta 5 cambios en
// total) — simplificación arcade: en vez de un cambio en cualquier
// minuto, el DT (automático, no hay control interactivo del usuario
// minuto a minuto) evalúa 3 momentos típicos de un partido real
// (alrededor de la hora, los 70' y los 80') y en cada uno DECIDE si usa
// esa ventana o no (PROB_USAR_VENTANA); si la usa, puede meter más de un
// cambio de una sola vez (el clásico doble/triple cambio de los últimos
// minutos) sin que eso le cueste una ventana extra — el tope real es
// MAX_CAMBIOS_POR_EQUIPO (5), ya desacoplado de la cantidad de ventanas
// (3): antes estaban atados 1 a 1 (3 ventanas = 3 cambios como mucho),
// lo que no dejaba modelar un doble/triple cambio.
const VENTANAS_DE_CAMBIO = [60, 70, 80];
const MAX_CAMBIOS_POR_EQUIPO = 5;
const PROB_USAR_VENTANA = 0.55;

// Cuántos cambios mete de una vez el DT cuando decide usar la ventana —
// lo más común es uno solo; doble y triple cambio son la excepción
// (tapado acá con una única distribución fija por simplicidad, sin
// diferenciar por ventana ni por si el equipo va perdiendo).
function cuantosCambiosEnEstaVentana(): number {
  const r = Math.random();
  if (r < 0.6) return 1;
  if (r < 0.9) return 2;
  return 3;
}

// Decide y ejecuta UN cambio si corresponde: sale el jugador de campo con
// más cansancio acumulado (arqueros no se tocan, muy raro en la
// realidad), entra el suplente disponible de mejor GRL en su mismo
// bucket de posición (o el mejor disponible si no hay ninguno de ese
// bucket) — mismo criterio de prioridad que reemplazarLesionados
// (desgaste.ts). Devuelve el evento 'cambio' para el feed, o null si no
// había nadie cansado o no quedaban suplentes.
function intentarCambio(
  equipo: EquipoPartido,
  equipoNombre: 'local' | 'visitante',
  expulsados: Set<string>,
  estado: EstadoCambios,
  minutoActual: number,
): EventoPartido | null {
  if (estado.hechos >= MAX_CAMBIOS_POR_EQUIPO) return null;
  const enCancha = titularesEnCancha(equipo, expulsados, estado);
  const candidatos = enCancha
    .filter((j) => j.posicion !== 'ARQ')
    .map((j) => ({
      jugador: j,
      cansancio: penalizacionPorCansancio(minutosEnCancha(j.id, minutoActual, estado), j.subStats?.fisico ?? j.grl),
    }))
    .filter((c) => c.cansancio > 0)
    .sort((a, b) => b.cansancio - a.cansancio);
  if (candidatos.length === 0) return null;
  const saliente = candidatos[0].jugador;

  const suplentesDisponibles = (equipo.suplentes ?? []).filter((s) => !estado.entrantesUsados.has(s.id) && s.posicion !== 'ARQ');
  if (suplentesDisponibles.length === 0) return null;
  const bucket = BUCKET_DE_POSICION[saliente.posicion];
  const mismoBucket = suplentesDisponibles.filter((s) => BUCKET_DE_POSICION[s.posicion] === bucket);
  const pool = mismoBucket.length > 0 ? mismoBucket : suplentesDisponibles;
  const entrante = pool.slice().sort((a, b) => b.grl - a.grl)[0];

  estado.cambios.set(saliente.id, entrante);
  estado.entrantesUsados.add(entrante.id);
  estado.minutoIngreso.set(entrante.id, minutoActual);
  estado.hechos += 1;

  return {
    tipo: 'cambio', equipo: equipoNombre, minuto: minutoActual, zona: ZONA_INICIAL, ancho: 'centro', jugadorId: saliente.id, jugadorEntraId: entrante.id,
  };
}

// 3.5: antes la conversión de tiro libre/penal era un valor plano (6.6%/
// 75.6%) sin importar quién pateaba o quién atajaba — ahora varía con el
// `tiro` del pateador y la `atajada` del arquero rival, mismo mecanismo
// (divisores sobre la base) que probabilidadConvertirTanda en
// eliminatoria.ts (sistema-penales-diseno.md), con los coeficientes que da
// el propio documento para el tiro libre.
export function probabilidadConvertirTiroLibre(tiro: number, atajada: number): number {
  return clamp(CONVERSION_TIRO_LIBRE + (tiro - 70) / 800 - (atajada - 70) / 900, 0.02, 0.18);
}

// El documento no da coeficientes propios para el penal en juego (sólo
// para la tanda de penales de eliminatoria.ts) más allá de "mismo
// mecanismo" — se reusan los mismos divisores/cota que
// probabilidadConvertirTanda ya que ambos parten de una base similar
// (75.6% acá, 69.4% en la tanda), en vez de los divisores del tiro libre
// (pensados para una base mucho más chica, 6.6%).
export function probabilidadConvertirPenal(tiro: number, atajada: number): number {
  return clamp(CONVERSION_PENAL + (tiro - 70) / 300 - (atajada - 70) / 350, 0.35, 0.92);
}

// `nudge`: empuje chico de localía/DT (calculado una vez por posesión en
// simularPartido, ver factorGlobalEquipo) — no reemplaza el duelo 1v1,
// sólo lo inclina un poco a favor del equipo con mejor DT/localía.
function resolverPasoPosesion(
  zona: number, atacante: Jugador, defensor: Jugador, nudge: number, ancho: Ancho,
  cansancioAtacante: number, cansancioDefensor: number,
): ResultadoPaso {
  const paseRegate = ((atacante.subStats?.pase ?? atacante.grl) + (atacante.subStats?.regate ?? atacante.grl)) / 2;
  const defensa = defensor.subStats?.defensa ?? defensor.grl;
  const diferencia = (paseRegate - defensa) / 100 + nudge;
  const ritmo = ventajaRitmo(atacante, defensor, ancho, cansancioAtacante, cansancioDefensor);

  let probTira = 0;
  if (zona >= ZONA_MIN_TIRO) {
    const tiroAtacante = atacante.subStats?.tiro ?? atacante.grl;
    probTira = clamp((zona - ZONA_MIN_TIRO + 1) * 0.15 + (tiroAtacante - 70) / 300, 0.06, 0.5);
  }
  // Calibrado empíricamente (probando partidos reales en el navegador): con
  // valores más bajos casi ninguna posesión llegaba nunca a zona de tiro
  // (la mayoría se perdía o se apagaba en el camino) y los partidos
  // terminaban 0-0 la mayoría de las veces — muy lejos de los ~1.3-1.5
  // goles por equipo reales que cita el propio documento (sección 2.2).
  const probAvanza = clamp(0.42 + diferencia * 0.6 + ritmo, 0.15, 0.65);
  const probPierde = clamp(0.16 - diferencia * 0.5 - ritmo * 0.5, 0.05, 0.4);

  const suma = probTira + probAvanza + probPierde;
  const escala = suma > 0.92 ? 0.92 / suma : 1;

  const r = Math.random();
  if (r < probTira * escala) return 'tira';
  if (r < (probTira + probAvanza) * escala) {
    if (zona >= ZONA_MIN_FALTA) {
      const bonusPorDiferencia = Math.max(0, diferencia);
      const probFalta = zona === ZONA_PENAL
        ? clamp(PROB_PENAL_BASE + bonusPorDiferencia * PROB_PENAL_POR_DIFERENCIA, 0.005, 0.05)
        : clamp(PROB_FALTA_BASE + bonusPorDiferencia * PROB_FALTA_POR_DIFERENCIA, 0.05, 0.4);
      if (Math.random() < probFalta) return 'falta';
    }
    return 'avanza';
  }
  if (r < (probTira + probAvanza + probPierde) * escala) return 'pierde';
  return 'sigue';
}

const MAX_PASOS_POR_POSESION = 12;

interface ResultadoPosesion {
  eventos: EventoPartido[];
  gol: boolean;
  tiro: { alArco: boolean } | null;
  // rediseno-motor-partido_1.md §3.3.1 punto 2: el defensor que se quedó
  // con la pelota cuando la posesión termina en pérdida (evento
  // 'perdida') — null en cualquier otro final (gol, falta/penal, offside,
  // plantel incompleto). Lo usa simularMitadPosesion para decidir si la
  // PRÓXIMA posesión de ese jugador arranca como contraataque.
  recuperadaPor: Jugador | null;
}

// Zona donde arranca cada posesión nueva — no es literalmente "en el
// arco propio": calcularPosesion (3.2) ya representa ganar la disputa de
// mediocampo, así que una posesión nueva empieza más realista a mitad de
// cancha (zona 2) en vez de forzar a reconstruir desde atrás cada vez.
const ZONA_INICIAL = 2;

// §3.3.1 punto 2 — contraataque: si quien acaba de recuperar la pelota
// tiene bastante más `ritmo` que la defensa+medio rival en ese momento
// (no un simple duelo puntual, el panorama general de esa línea), la
// posesión arranca 2 zonas más adelante en vez de 1 — el equipo que
// contragolpea no tiene que reconstruir el ataque desde el fondo. Techo
// de intentos por partido (no por mitad, ver simularPartido) igual al de
// Hattrick para que no se vuelva la forma dominante de atacar.
const UMBRAL_CONTRAATAQUE = 6;
const TECHO_CONTRAATAQUES_POR_EQUIPO = 5;
const ZONA_INICIAL_CONTRAATAQUE = Math.min(ZONAS - 1, ZONA_INICIAL + 2);

// Pase filtrado (pedido explícito, la otra mitad de "contraataque/pase
// filtrado" del §3.3.1 punto 2) — desde el mediocampo ofensivo (zona 3)
// un buen pase entre líneas puede mandar a alguien directo al área rival
// (zona 5), saltándose el borde del área (zona 4): la jugada clásica de
// "quedar mano a mano con el arquero", en vez del avance normal de a una
// zona por vez. Depende del `pase` del que da la asistencia contra la
// `defensa` de la última línea rival — mismo patrón de "bonus por
// diferencia sobre una base pareja" que ya usan falta/penal más abajo, no
// un requisito estricto (cualquier plantel puede filtrar un pase de vez
// en cuando, uno con mejor pase lo logra más seguido).
//
// Contrapartida real: es la jugada que MÁS offside genera (la línea sale
// jugando el fuera de juego a propósito buscando cortar el pase), así que
// el riesgo de fuera de juego acá es bastante más alto que el de un
// avance normal a la zona final (PROB_OFFSIDE_ZONA_FINAL).
const ZONA_PASE_FILTRADO = 3; // sólo desde el mediocampo ofensivo
const PROB_PASE_FILTRADO_BASE = 0.1;
const PROB_PASE_FILTRADO_POR_DIFERENCIA = 0.25;
const PROB_OFFSIDE_PASE_FILTRADO = 0.28;

function ritmoPromedioDefensivo(titulares: Jugador[]): number {
  const defensaYMedio = titulares.filter((j) => {
    const bucket = BUCKET_DE_POSICION[j.posicion];
    return bucket === 'DEF' || bucket === 'MED';
  });
  return promedio(defensaYMedio.map((j) => j.subStats?.ritmo ?? j.grl));
}

// §3.1 — grilla 6x3: la franja de ancho por la que se desarrolla una
// posesión se sortea una sola vez al arrancarla y queda fija (no cambia
// de banda a mitad de la jugada — fase 2 pendiente, ver comentario de
// EventoPartido.ancho). Sin datos reales de reparto izq/centro/der por
// equipo, sortear parejo entre las 3 franjas es la aproximación más
// simple que no le da un sesgo arbitrario a ningún lado.
const ANCHOS: Ancho[] = ['izq', 'centro', 'der'];
function elegirAnchoInicial(): Ancho {
  return ANCHOS[Math.floor(Math.random() * ANCHOS.length)];
}

// El "izquierda"/"derecha" de una posesión es desde el punto de vista del
// equipo que ataca — al rival que defiende esa banda le toca el lateral
// del lado ESPEJADO (un extremo izquierdo enfrenta al lateral derecho
// rival, no al lateral izquierdo propio).
function anchoEspejado(ancho: Ancho): Ancho {
  if (ancho === 'izq') return 'der';
  if (ancho === 'der') return 'izq';
  return 'centro';
}

// §3.3.2: cuando una posesión que viene por banda llega a rematar cerca
// del área, buena parte de esos ataques se resuelven con un centro
// (cabezazo) en vez de un remate técnico — el duelo pasa a depender de
// `fisico` del rematador en vez de `tiro`. Por el medio no aplica (no hay
// "centro" posible si ya estás de frente al arco).
const PROB_CENTRO_DESDE_BANDA = 0.35;

// Simula UNA posesión completa: arranca en ZONA_INICIAL y va resolviendo
// pasos (avanza/pierde/tira/sigue, 3.3) hasta que se pierde la pelota, se
// tira al arco, o se agotan los intentos (posesión "se apaga", cuenta como
// pérdida — cota de seguridad, no debería ser lo común).
function simularPosesion(
  atacante: EquipoPartido,
  rival: EquipoPartido,
  equipoNombre: 'local' | 'visitante',
  minuto: number,
  nudge: number,
  esContraataque: boolean,
  amarillasPorJugador: Map<string, number>,
  expulsados: ExpulsadosPorEquipo,
  cambios: CambiosPorEquipo,
): ResultadoPosesion {
  const eventos: EventoPartido[] = [];
  let zona = esContraataque ? ZONA_INICIAL_CONTRAATAQUE : ZONA_INICIAL;
  const ancho = elegirAnchoInicial();
  eventos.push({
    tipo: 'inicio_posesion', equipo: equipoNombre, minuto, zona, ancho, contraataque: esContraataque || undefined,
  });

  const expulsadosAtacante = equipoNombre === 'local' ? expulsados.local : expulsados.visitante;
  const expulsadosRival = equipoNombre === 'local' ? expulsados.visitante : expulsados.local;
  const cambiosAtacante = equipoNombre === 'local' ? cambios.local : cambios.visitante;
  const cambiosRival = equipoNombre === 'local' ? cambios.visitante : cambios.local;
  // Instantánea al arrancar la posesión — si hay una expulsión A MITAD de
  // esta misma posesión (falta que no se remata directo y sigue el loop,
  // ver más abajo) el recién expulsado puede seguir disputando ESTA
  // posesión puntual; recién la próxima ya lo filtra. Simplificación
  // aceptable (una posesión dura como mucho unos pocos segundos de juego).
  const titularesAtacante = titularesEnCancha(atacante, expulsadosAtacante, cambiosAtacante);
  const titularesRival = titularesEnCancha(rival, expulsadosRival, cambiosRival);

  const arquero = titularesRival.find((j) => j.posicion === 'ARQ') ?? null;
  const atajadaArquero = arquero?.subStatsArquero?.atajada ?? arquero?.grl ?? 65;
  let ultimoDefensor: Jugador | null = null;

  for (let paso = 0; paso < MAX_PASOS_POR_POSESION; paso += 1) {
    const jugadorAtacante = elegirJugadorDeBucket(titularesAtacante, BUCKET_ATACANTE_POR_ZONA[zona], ancho);
    const jugadorDefensor = elegirJugadorDeBucket(titularesRival, BUCKET_DEFENSOR_POR_ZONA[zona], anchoEspejado(ancho));
    if (!jugadorAtacante || !jugadorDefensor) break; // plantel incompleto — no debería pasar en un partido real
    ultimoDefensor = jugadorDefensor;

    const cansancioAtacante = penalizacionPorCansancio(
      minutosEnCancha(jugadorAtacante.id, minuto, cambiosAtacante), jugadorAtacante.subStats?.fisico ?? jugadorAtacante.grl,
    );
    const cansancioDefensor = penalizacionPorCansancio(
      minutosEnCancha(jugadorDefensor.id, minuto, cambiosRival), jugadorDefensor.subStats?.fisico ?? jugadorDefensor.grl,
    );
    const resultado = resolverPasoPosesion(zona, jugadorAtacante, jugadorDefensor, nudge, ancho, cansancioAtacante, cansancioDefensor);

    if (resultado === 'tira') {
      // §3.3.2 — ataque por banda cerca del área: buena parte termina en
      // centro/cabezazo (fisico) en vez de remate técnico (tiro).
      const esCentroPorBanda = ancho !== 'centro' && zona >= ZONA_MIN_CORNER && Math.random() < PROB_CENTRO_DESDE_BANDA;
      const eventoTiro: EventoPartido = { tipo: 'tiro', equipo: equipoNombre, minuto, zona, ancho };
      eventos.push(eventoTiro);
      if (esCentroPorBanda) eventos.push({ tipo: 'centro', equipo: equipoNombre, minuto, zona, ancho });
      const statRemate = esCentroPorBanda
        ? (jugadorAtacante.subStats?.fisico ?? jugadorAtacante.grl)
        : (jugadorAtacante.subStats?.tiro ?? jugadorAtacante.grl);
      const xgTiro = calcularXGTiro(zona, statRemate, atajadaArquero);
      eventoTiro.xg = xgTiro;
      const esGol = Math.random() < xgTiro;
      const alArco = esGol || Math.random() < (PROB_AL_ARCO_POR_ZONA[zona] ?? 0.3);
      eventoTiro.alArco = alArco;
      if (esGol) {
        eventos.push({ tipo: 'gol', equipo: equipoNombre, minuto, zona, ancho });
        return { eventos, gol: true, tiro: { alArco: true }, recuperadaPor: null };
      }
      if (!alArco && zona >= ZONA_MIN_CORNER && Math.random() < PROB_CORNER_SI_AFUERA) {
        const eventoCorner: EventoPartido = { tipo: 'corner', equipo: equipoNombre, minuto, zona, ancho };
        eventos.push(eventoCorner);
        // Remate de córner: duelo simplificado por `fisico` (cabezazo) en
        // vez de `tiro` — misma xG base que un tiro de área (3.3.2 del
        // documento, versión reducida sin duelo aéreo explícito del
        // defensor todavía).
        const fisicoAtacante = jugadorAtacante.subStats?.fisico ?? jugadorAtacante.grl;
        const xgCorner = calcularXGTiro(ZONAS - 1, fisicoAtacante, atajadaArquero);
        eventoCorner.xg = xgCorner;
        const golCorner = Math.random() < xgCorner;
        // Igual que el tiro de arriba: el cabezazo de córner siempre se
        // modela "al arco" (no hay un segundo rebote/desvío simulado), así
        // que el visualizador siempre lo dibuja entrando al arco.
        eventoCorner.alArco = true;
        if (golCorner) eventos.push({ tipo: 'gol', equipo: equipoNombre, minuto, zona, ancho });
        return { eventos, gol: golCorner, tiro: { alArco: true }, recuperadaPor: null };
      }
      return { eventos, gol: false, tiro: { alArco }, recuperadaPor: null };
    }
    if (resultado === 'falta') {
      const esPenal = zona === ZONA_PENAL;
      const infractor = jugadorDefensor; // quien "corta la jugada con una falta" — ver comentario de §3.5 más arriba
      const pateador = elegirPateador(titularesAtacante);
      const tiroPateador = pateador?.subStats?.tiro ?? pateador?.grl ?? 70;
      const probConversion = esPenal
        ? probabilidadConvertirPenal(tiroPateador, atajadaArquero)
        : probabilidadConvertirTiroLibre(tiroPateador, atajadaArquero);

      // Sistema de tarjetas: la falta puede amonestar al infractor —
      // equipo acá es el DEL INFRACTOR (el que defiende), no el que tenía
      // la pelota. Segunda amarilla en el mismo partido = roja, igual que
      // una roja directa (falta muy grave o última chance de gol clara).
      // Se resuelve ANTES de empujar el evento 'falta'/'penal' — el árbitro
      // muestra la tarjeta al cobrar la falta, antes de que se patee — así
      // el evento 'gol' que eventualmente sale de la ejecución sigue
      // siendo el PRÓXIMO evento después de 'falta'/'penal' sin nada en el
      // medio (varios tests/consumidores asumen esa adyacencia).
      const equipoInfractor: 'local' | 'visitante' = equipoNombre === 'local' ? 'visitante' : 'local';
      const yaAmonestado = (amarillasPorJugador.get(infractor.id) ?? 0) >= 1;
      // Bug encontrado calibrando: con la probabilidad de tarjeta pareja
      // para todos, un jugador que ya está amonestado sigue disputando
      // duelos al mismo ritmo que cualquiera (los buckets/franjas de
      // §3.1 concentran fouls en unos pocos jugadores puntuales, no
      // reparten parejo entre los 11), así que le tocaban MUCHAS
      // oportunidades de foul después de la primera amarilla — daba
      // ~0.67 rojas por partido (uno de cada dos partidos con expulsión),
      // muy por encima de la realidad (~0.05-0.1/partido). En la vida
      // real un jugador amonestado juega más cuidado — bajarle la
      // probabilidad de otra tarjeta modela justo eso, no sólo lo hace
      // "más difícil de expulsar" de forma arbitraria.
      const probTarjetaBase = esPenal ? PROB_TARJETA_EN_PENAL : PROB_TARJETA_EN_FALTA;
      const probTarjeta = yaAmonestado ? probTarjetaBase * 0.015 : probTarjetaBase;
      if (Math.random() < probTarjeta) {
        const probRojaDirecta = esPenal ? PROB_ROJA_DIRECTA_SI_TARJETA_PENAL : PROB_ROJA_DIRECTA_SI_TARJETA_FALTA;
        const esRojaDirecta = Math.random() < probRojaDirecta;
        if (yaAmonestado || esRojaDirecta) {
          eventos.push({
            tipo: 'tarjeta_roja', equipo: equipoInfractor, minuto, zona, ancho, jugadorId: infractor.id,
          });
          expulsadosRival.add(infractor.id);
        } else {
          amarillasPorJugador.set(infractor.id, 1);
          eventos.push({
            tipo: 'tarjeta_amarilla', equipo: equipoInfractor, minuto, zona, ancho, jugadorId: infractor.id,
          });
        }
      }

      const eventoFalta: EventoPartido = {
        tipo: esPenal ? 'penal' : 'falta', equipo: equipoNombre, minuto, zona, ancho, jugadorId: pateador?.id, arqueroId: arquero?.id,
      };
      eventos.push(eventoFalta);

      const probTiroDirecto = PROB_TIRO_LIBRE_DIRECTO_POR_ZONA[zona] ?? 0.25;
      const seRemataDirecto = esPenal || Math.random() < probTiroDirecto;
      if (!seRemataDirecto) {
        // Bug encontrado calibrando (goles totales por partido se habían
        // desplomado a la mitad tras el fix de "un montón de goles de tiro
        // libre"): antes, CUALQUIER falta terminaba la posesión ahí mismo
        // — con PROB_FALTA_BASE alto (necesario para que hubiera faltas en
        // partidos parejos) eso significaba que ~3 de cada 4 faltas fuera
        // del área mataban la posesión sin ninguna ocasión, ni siquiera
        // indirecta. En la realidad un tiro libre que no se remata directo
        // igual repone el juego con el equipo atacante reteniendo la
        // pelota (centro, pase corto, segunda jugada) — no es una pérdida.
        // Se modela como retener la posesión en la misma zona (sigue el
        // loop) en vez de cortar la jugada.
        continue;
      }
      eventoFalta.xg = probConversion;
      const esGol = Math.random() < probConversion;
      if (esGol) {
        eventos.push({
          tipo: 'gol', equipo: equipoNombre, minuto, zona, ancho, jugadorId: pateador?.id, origen: esPenal ? 'penal' : 'falta',
        });
      } else {
        // Igual que `alArco` en el remate de juego abierto de arriba
        // (pedido explícito: "no se diferencia... hay faltas tiros
        // libres"): un penal errado casi siempre sigue yendo al arco (lo
        // ataja el arquero), un tiro libre directo desde más lejos y con
        // barrera de por medio se va afuera con más frecuencia.
        eventoFalta.alArco = Math.random() < (esPenal ? 0.8 : 0.5);
      }
      return { eventos, gol: esGol, tiro: null, recuperadaPor: null };
    }
    if (resultado === 'avanza') {
      const esUltimaZona = zona === ZONAS - 2;
      if (esUltimaZona && Math.random() < PROB_OFFSIDE_ZONA_FINAL) {
        eventos.push({ tipo: 'fuera_de_juego', equipo: equipoNombre, minuto, zona: zona + 1, ancho });
        return { eventos, gol: false, tiro: null, recuperadaPor: null };
      }

      if (zona === ZONA_PASE_FILTRADO) {
        const paseAtacante = jugadorAtacante.subStats?.pase ?? jugadorAtacante.grl;
        const defensaRival = jugadorDefensor.subStats?.defensa ?? jugadorDefensor.grl;
        const bonusPorDiferencia = Math.max(0, (paseAtacante - defensaRival) / 100);
        const probPaseFiltrado = clamp(PROB_PASE_FILTRADO_BASE + bonusPorDiferencia * PROB_PASE_FILTRADO_POR_DIFERENCIA, 0.03, 0.3);
        if (Math.random() < probPaseFiltrado) {
          if (Math.random() < PROB_OFFSIDE_PASE_FILTRADO) {
            eventos.push({ tipo: 'fuera_de_juego', equipo: equipoNombre, minuto, zona: ZONAS - 1, ancho });
            return { eventos, gol: false, tiro: null, recuperadaPor: null };
          }
          zona = ZONAS - 1;
          eventos.push({
            tipo: 'avance', equipo: equipoNombre, minuto, zona, ancho, paseFiltrado: true,
          });
          continue;
        }
      }

      zona = Math.min(ZONAS - 1, zona + 1);
      eventos.push({ tipo: 'avance', equipo: equipoNombre, minuto, zona, ancho });
      continue;
    }
    if (resultado === 'pierde') {
      eventos.push({ tipo: 'perdida', equipo: equipoNombre, minuto, zona, ancho });
      return { eventos, gol: false, tiro: null, recuperadaPor: jugadorDefensor };
    }
    // 'sigue' — toque lateral, se reintenta el paso en la misma zona.
  }

  eventos.push({ tipo: 'perdida', equipo: equipoNombre, minuto, zona, ancho });
  return { eventos, gol: false, tiro: null, recuperadaPor: ultimoDefensor };
}

// Techo de contraataques por PARTIDO (no por mitad) — un objeto mutable
// compartido entre las dos mitades, creado una vez en simularPartido.
interface ContadorContraataques {
  local: number;
  visitante: number;
}

interface ResultadoMitad {
  golesLocal: number;
  golesVisitante: number;
  eventos: EventoPartido[];
  pasosLocal: number;
  pasosVisitante: number;
  tirosLocal: TirosEquipo;
  tirosVisitante: TirosEquipo;
}

function tirosVacios(): TirosEquipo {
  return { total: 0, afuera: 0, alArco: 0 };
}

// Tiempo complementario/descuento (pedido explícito) — al llegar al
// cierre de la mitad se sortea cuánto se agrega: una base chica (1-3')
// más un poco por cada gol y cada tarjeta de la mitad (paradas que
// "cuestan" tiempo real, arcade pero con la idea correcta), con un techo
// para que no se vuelva absurdo.
const DESCUENTO_BASE_MIN = 1;
const DESCUENTO_BASE_MAX = 3;
const TOPE_DESCUENTO = 8;
function calcularTiempoAgregado(golesEnMitad: number, tarjetasEnMitad: number): number {
  const base = randomEntero(DESCUENTO_BASE_MIN, DESCUENTO_BASE_MAX);
  const extra = golesEnMitad + Math.floor(tarjetasEnMitad / 2);
  return clamp(base + extra, 1, TOPE_DESCUENTO);
}

// Cada "disputa" (arranque de posesión) se sortea con calcularPosesion —
// el resto de la mitad son posesiones encadenadas, cada una consumiendo
// 1-3 minutos simulados, hasta llegar al final de la mitad (+ el
// descuento que se juegue después, ver más abajo). `reaccion` del DT
// rival (5.5 original) sigue aplicando como un "pánico" chico tras
// encajar un gol, ahora como nudge aditivo en vez de multiplicador de
// lambda.
//
// `permitirCambios` está en false para las mitades del alargue
// (simularAlargue): las 3 ventanas de cambio (60'/70'/80') son sólo de
// tiempo reglamentario — no se ofrecen cambios nuevos en el alargue (v1,
// simplificación arcade), aunque el cansancio acumulado sigue pesando
// igual sobre quien ya está en cancha.
function simularMitadPosesion(
  local: EquipoPartido,
  visitante: EquipoPartido,
  posesionLocalProb: number,
  nudgeLocalBase: number,
  nudgeVisitanteBase: number,
  minutoInicio: number,
  minutoFin: number,
  contadorContraataques: ContadorContraataques,
  amarillasPorJugador: Map<string, number>,
  expulsados: ExpulsadosPorEquipo,
  cambios: CambiosPorEquipo,
  permitirCambios: boolean,
): ResultadoMitad {
  let golesLocal = 0;
  let golesVisitante = 0;
  let pasosLocal = 0;
  let pasosVisitante = 0;
  let panicLocal = 0;
  let panicVisitante = 0;
  const eventos: EventoPartido[] = [];
  const tirosLocal = tirosVacios();
  const tirosVisitante = tirosVacios();
  // Quién se quedó con la pelota en la última posesión que terminó en
  // pérdida (§3.3.1 punto 2) — se resetea cada mitad (el saque del medio
  // de la segunda mitad no "hereda" una recuperación de la primera).
  let ultimaRecuperacion: { equipo: 'local' | 'visitante'; jugador: Jugador } | null = null;

  const simularUnaPosesion = (minutoEvento: number, minutoAgregadoEvento?: number) => {
    const esLocal = Math.random() < posesionLocalProb;
    const atacante = esLocal ? local : visitante;
    const rival = esLocal ? visitante : local;
    const nudge = esLocal ? nudgeLocalBase - panicLocal : nudgeVisitanteBase - panicVisitante;
    const equipoNombre: 'local' | 'visitante' = esLocal ? 'local' : 'visitante';

    let esContraataque = false;
    if (ultimaRecuperacion && ultimaRecuperacion.equipo === equipoNombre) {
      const contadorEquipo = esLocal ? contadorContraataques.local : contadorContraataques.visitante;
      if (contadorEquipo < TECHO_CONTRAATAQUES_POR_EQUIPO) {
        const ritmoRecuperador = ultimaRecuperacion.jugador.subStats?.ritmo ?? ultimaRecuperacion.jugador.grl;
        const ritmoDefensivoRival = ritmoPromedioDefensivo(rival.titulares);
        if (ritmoRecuperador - ritmoDefensivoRival > UMBRAL_CONTRAATAQUE) {
          esContraataque = true;
          if (esLocal) contadorContraataques.local += 1;
          else contadorContraataques.visitante += 1;
        }
      }
    }

    const resultado = simularPosesion(atacante, rival, equipoNombre, minutoEvento, nudge, esContraataque, amarillasPorJugador, expulsados, cambios);
    const eventosPosesion = minutoAgregadoEvento != null
      ? resultado.eventos.map((e) => ({ ...e, minutoAgregado: minutoAgregadoEvento }))
      : resultado.eventos;
    eventos.push(...eventosPosesion);
    ultimaRecuperacion = resultado.recuperadaPor
      ? { equipo: esLocal ? 'visitante' : 'local', jugador: resultado.recuperadaPor }
      : null;

    if (esLocal) pasosLocal += 1;
    else pasosVisitante += 1;

    if (resultado.tiro) {
      const tirosEquipo = esLocal ? tirosLocal : tirosVisitante;
      tirosEquipo.total += 1;
      if (resultado.tiro.alArco) tirosEquipo.alArco += 1;
      else tirosEquipo.afuera += 1;
    }

    if (resultado.gol) {
      if (esLocal) {
        golesLocal += 1;
        panicVisitante = clamp(panicVisitante + (55 - visitante.dt.reaccion) / 400, -0.05, 0.12);
      } else {
        golesVisitante += 1;
        panicLocal = clamp(panicLocal + (55 - local.dt.reaccion) / 400, -0.05, 0.12);
      }
    }
  };

  const chequearCambios = (minutoActual: number) => {
    ([
      ['local', local, expulsados.local, cambios.local] as const,
      ['visitante', visitante, expulsados.visitante, cambios.visitante] as const,
    ]).forEach(([nombre, equipo, expulsadosEquipo, estado]) => {
      while (estado.siguienteVentana < VENTANAS_DE_CAMBIO.length && minutoActual >= VENTANAS_DE_CAMBIO[estado.siguienteVentana]) {
        estado.siguienteVentana += 1;
        if (Math.random() < PROB_USAR_VENTANA) {
          const cantidad = cuantosCambiosEnEstaVentana();
          for (let i = 0; i < cantidad; i += 1) {
            const evento = intentarCambio(equipo, nombre, expulsadosEquipo, estado, minutoActual);
            if (evento) eventos.push(evento);
            else break; // sin más candidatos cansados o sin más banco — no tiene sentido seguir insistiendo esta ventana
          }
        }
      }
    });
  };

  let minuto = minutoInicio;
  while (minuto <= minutoFin) {
    if (permitirCambios) chequearCambios(minuto);
    simularUnaPosesion(minuto);
    minuto += randomEntero(1, 3);
  }

  // Tiempo complementario/descuento (pedido explícito) — se juega después
  // del cierre de la mitad, pero el reloj se muestra "45+N"/"90+N", no
  // sigue sumando al minuto real (ver EventoPartido.minutoAgregado).
  const tarjetasEnMitad = eventos.filter((e) => e.tipo === 'tarjeta_amarilla' || e.tipo === 'tarjeta_roja').length;
  const golesEnMitad = golesLocal + golesVisitante;
  const tiempoAgregado = calcularTiempoAgregado(golesEnMitad, tarjetasEnMitad);
  let agregado = 1;
  while (agregado <= tiempoAgregado) {
    simularUnaPosesion(minutoFin, agregado);
    agregado += randomEntero(1, 3);
  }

  return { golesLocal, golesVisitante, eventos, pasosLocal, pasosVisitante, tirosLocal, tirosVisitante };
}

// Combina los multiplicadores de DT/cohesión/localía en un único escalar
// (misma composición que usaba aplicarMultiplicadoresDT para ataque/
// defensa) — acá se usa como un empuje chico sobre los duelos de posesión
// en vez de sobre un agregado ataque/defensa.
function factorGlobalEquipo(
  dt: StatsDT,
  dtRival: StatsDT,
  cohesion: number,
  partidoImportante: boolean,
  factorLocalia: number,
): number {
  const multTactica = multiplicador(dt.tactica, 0.003);
  const multMotivacion = multiplicador(dt.motivacion, 0.0025);
  const multMoral = multiplicador(cohesion, 0.002);
  const multAnalisis = clamp(1 + (dt.analisis - dtRival.analisis) / 500, 0.9, 1.1);
  const multMentalidad = partidoImportante ? multiplicador(dt.mentalidad, 0.004) : 1;
  return multTactica * multMotivacion * multMoral * multAnalisis * multMentalidad * factorLocalia;
}

function sumarTiros(a: TirosEquipo, b: TirosEquipo): TirosEquipo {
  return { total: a.total + b.total, afuera: a.afuera + b.afuera, alArco: a.alArco + b.alArco };
}

// Simulación completa de un partido: posesión por posesión (3.1-3.4),
// ambas mitades + ajuste de entretiempo (mismo mecanismo que antes —
// sólo el equipo que va perdiendo puede intentar el ajuste, según su
// adaptabilidad — pero ahora nudgeando los duelos de posesión en vez de
// un xG total). `partidoImportante` habilita el multiplicador de
// mentalidad (5.2).
export function simularPartido(
  local: EquipoPartido,
  visitante: EquipoPartido,
  partidoImportante: boolean,
): ResultadoPartido {
  const ventajaLocal = calcularVentajaLocal(local.dt);
  // Nudge pequeño (no reemplaza el duelo 1v1): un factor de 1.10 se
  // traduce en +0.05 de "diferencia" en cada duelo de ese equipo, no en
  // dominar el partido por sí solo.
  //
  // Mentalidad (mecánica 2 del documento de profundidad): el ajuste de
  // CADA equipo se suma a los nudges de LOS DOS lados (ver
  // ajusteMentalidad) — jugar ofensivo mejora el ataque propio y afloja
  // la defensa propia (así el rival también ataca mejor), jugar
  // defensivo hace lo inverso en ambos sentidos.
  const ajusteMentalidadLocal = ajusteMentalidad(local.mentalidad);
  const ajusteMentalidadVisitante = ajusteMentalidad(visitante.mentalidad);
  const nudgeLocalBase = (factorGlobalEquipo(local.dt, visitante.dt, local.cohesion, partidoImportante, ventajaLocal) - 1) * 0.5
    + ajusteMentalidadLocal + ajusteMentalidadVisitante;
  const nudgeVisitanteBase = (factorGlobalEquipo(visitante.dt, local.dt, visitante.cohesion, partidoImportante, PENALIZACION_VISITANTE) - 1) * 0.5
    + ajusteMentalidadVisitante + ajusteMentalidadLocal;

  const posesionLocalProb = calcularPosesion(local.sector.medio, visitante.sector.medio);
  // Techo de contraataques compartido entre las dos mitades (§3.3.1
  // punto 2) — es "por partido", no "por mitad".
  const contadorContraataques: ContadorContraataques = { local: 0, visitante: 0 };
  // Sistema de tarjetas: quién ya tiene amarilla ESTE partido (para
  // segunda amarilla = roja) — compartido entre las dos mitades, un
  // jugador amonestado en la primera sigue "en amarilla" en la segunda.
  const amarillasPorJugador = new Map<string, number>();
  // Quién está expulsado — también compartido entre mitades, un rojo en
  // la primera sigue afuera en la segunda.
  const expulsados: ExpulsadosPorEquipo = { local: new Set(), visitante: new Set() };
  // Cambios/suplentes por stamina — compartido entre mitades (un cambio
  // hecho en la primera sigue en cancha en la segunda, y el cupo de
  // MAX_CAMBIOS_POR_EQUIPO es por partido, no por mitad).
  const cambios: CambiosPorEquipo = { local: estadoCambiosVacio(), visitante: estadoCambiosVacio() };

  const primeraMitad = simularMitadPosesion(
    local, visitante, posesionLocalProb, nudgeLocalBase, nudgeVisitanteBase, 1, MINUTOS_POR_MITAD, contadorContraataques, amarillasPorJugador, expulsados, cambios, true,
  );

  let nudgeLocal2T = nudgeLocalBase;
  let nudgeVisitante2T = nudgeVisitanteBase;

  // 5.5 — adaptabilidad al entretiempo: sólo el equipo que va perdiendo
  // puede intentar el ajuste.
  if (primeraMitad.golesLocal < primeraMitad.golesVisitante) {
    const probAjuste = clamp(local.dt.adaptabilidad / 300, 0, 0.5);
    if (Math.random() < probAjuste) {
      nudgeLocal2T += 0.08;
      nudgeVisitante2T -= 0.03;
    }
  } else if (primeraMitad.golesVisitante < primeraMitad.golesLocal) {
    const probAjuste = clamp(visitante.dt.adaptabilidad / 300, 0, 0.5);
    if (Math.random() < probAjuste) {
      nudgeVisitante2T += 0.08;
      nudgeLocal2T -= 0.03;
    }
  }

  const segundaMitad = simularMitadPosesion(
    local, visitante, posesionLocalProb, nudgeLocal2T, nudgeVisitante2T, MINUTOS_POR_MITAD + 1, MINUTOS_POR_MITAD * 2, contadorContraataques, amarillasPorJugador, expulsados, cambios, true,
  );

  const eventos = [...primeraMitad.eventos, ...segundaMitad.eventos];
  const eventosGol: EventoGolPartido[] = eventos
    .filter((e) => e.tipo === 'gol')
    .map((e) => ({
      equipo: e.equipo, minuto: e.minuto, jugadorId: e.jugadorId, origen: e.origen, minutoAgregado: e.minutoAgregado,
    }));

  const pasosLocal = primeraMitad.pasosLocal + segundaMitad.pasosLocal;
  const pasosVisitante = primeraMitad.pasosVisitante + segundaMitad.pasosVisitante;
  const totalPasos = pasosLocal + pasosVisitante;
  // 3.5 — la posesión ya no se inventa aparte: es la proporción real de
  // posesiones que tuvo cada equipo en la simulación. Fallback a la
  // probabilidad teórica sólo por si totalPasos diera 0 (no debería pasar).
  const posesionLocal = totalPasos > 0 ? (pasosLocal / totalPasos) * 100 : posesionLocalProb * 100;

  const contarPorTipoYEquipo = (tipo: TipoEvento, equipo: 'local' | 'visitante') => eventos.filter((e) => e.tipo === tipo && e.equipo === equipo).length;
  const sumarXG = (equipo: 'local' | 'visitante') => eventos.reduce((suma, e) => (e.equipo === equipo && e.xg != null ? suma + e.xg : suma), 0);

  return {
    golesLocal: primeraMitad.golesLocal + segundaMitad.golesLocal,
    golesVisitante: primeraMitad.golesVisitante + segundaMitad.golesVisitante,
    eventosGol,
    eventos,
    posesionLocal,
    tirosLocal: sumarTiros(primeraMitad.tirosLocal, segundaMitad.tirosLocal),
    tirosVisitante: sumarTiros(primeraMitad.tirosVisitante, segundaMitad.tirosVisitante),
    cornersLocal: contarPorTipoYEquipo('corner', 'local'),
    cornersVisitante: contarPorTipoYEquipo('corner', 'visitante'),
    faltasLocal: contarPorTipoYEquipo('falta', 'local'),
    faltasVisitante: contarPorTipoYEquipo('falta', 'visitante'),
    penalesLocal: contarPorTipoYEquipo('penal', 'local'),
    penalesVisitante: contarPorTipoYEquipo('penal', 'visitante'),
    eventosTarjeta: eventos
      .filter((e): e is EventoPartido & { jugadorId: string } => (e.tipo === 'tarjeta_amarilla' || e.tipo === 'tarjeta_roja') && e.jugadorId != null)
      .map((e) => ({
        equipo: e.equipo, jugadorId: e.jugadorId, tipo: e.tipo === 'tarjeta_amarilla' ? 'amarilla' as const : 'roja' as const, minuto: e.minuto, minutoAgregado: e.minutoAgregado,
      })),
    tarjetasAmarillasLocal: contarPorTipoYEquipo('tarjeta_amarilla', 'local'),
    tarjetasAmarillasVisitante: contarPorTipoYEquipo('tarjeta_amarilla', 'visitante'),
    tarjetasRojasLocal: contarPorTipoYEquipo('tarjeta_roja', 'local'),
    tarjetasRojasVisitante: contarPorTipoYEquipo('tarjeta_roja', 'visitante'),
    xgLocal: sumarXG('local'),
    xgVisitante: sumarXG('visitante'),
    cambiosLocal: contarPorTipoYEquipo('cambio', 'local'),
    cambiosVisitante: contarPorTipoYEquipo('cambio', 'visitante'),
  };
}

// -------------------- alargue --------------------
//
// Pedido explícito: "y el alargue?" — hasta ahora una llave de copa
// empatada en el agregado iba directo a penales (eliminatoria.ts). Acá se
// juegan 2 tiempos de 15' (91'-105' y 106'-120') como CONTINUACIÓN del
// mismo partido, no un partido nuevo: quien ya está amonestado/expulsado
// sigue así, el cupo de contraataques ya usado sigue gastado, y quien ya
// está cansado/cambiado sigue en las mismas condiciones. Como
// simularPartido no expone sus Maps/Sets internos (quedan encapsulados a
// propósito), este estado se RECONSTRUYE a partir de lo público que ya
// devuelve ResultadoPartido (eventosTarjeta, eventos) — no hace falta
// tocar la firma de simularPartido para esto.
//
// Sin nudge de DT/localía ni ajuste de entretiempo — el alargue es un
// desempate corto (arcade, no hace falta modelar más reputación sobre
// 30' extra) donde los dos equipos parten iguales.
export function simularAlargue(
  local: EquipoPartido,
  visitante: EquipoPartido,
  resultadoRegular: ResultadoPartido,
): ResultadoPartido {
  const posesionLocalProb = calcularPosesion(local.sector.medio, visitante.sector.medio);
  const nudgeCero = 0;

  const amarillasPorJugador = new Map<string, number>();
  const expulsados: ExpulsadosPorEquipo = { local: new Set(), visitante: new Set() };
  resultadoRegular.eventosTarjeta.forEach((t) => {
    if (t.tipo === 'amarilla') amarillasPorJugador.set(t.jugadorId, 1);
    else (t.equipo === 'local' ? expulsados.local : expulsados.visitante).add(t.jugadorId);
  });

  const contadorContraataques: ContadorContraataques = { local: 0, visitante: 0 };
  resultadoRegular.eventos.forEach((e) => {
    if (e.tipo === 'inicio_posesion' && e.contraataque) {
      if (e.equipo === 'local') contadorContraataques.local += 1;
      else contadorContraataques.visitante += 1;
    }
  });

  // Cambios ya hechos en el tiempo reglamentario: se reconstruyen desde
  // los eventos 'cambio' (jugadorId = quien salió, jugadorEntraId = quien
  // entró) buscando al entrante en el banco del equipo correspondiente.
  // `siguienteVentana` queda en el límite a propósito — v1 no ofrece
  // ventanas de cambio nuevas en el alargue, ver comentario en
  // simularMitadPosesion.
  const cambios: CambiosPorEquipo = { local: estadoCambiosVacio(), visitante: estadoCambiosVacio() };
  resultadoRegular.eventos.forEach((e) => {
    if (e.tipo !== 'cambio' || !e.jugadorId || !e.jugadorEntraId) return;
    const equipoObj = e.equipo === 'local' ? local : visitante;
    const estado = e.equipo === 'local' ? cambios.local : cambios.visitante;
    const entrante = (equipoObj.suplentes ?? []).find((s) => s.id === e.jugadorEntraId);
    if (!entrante) return;
    estado.cambios.set(e.jugadorId, entrante);
    estado.entrantesUsados.add(entrante.id);
    estado.minutoIngreso.set(entrante.id, e.minuto);
    estado.hechos += 1;
  });
  cambios.local.siguienteVentana = VENTANAS_DE_CAMBIO.length;
  cambios.visitante.siguienteVentana = VENTANAS_DE_CAMBIO.length;

  const inicioAlargue = MINUTOS_POR_MITAD * 2;
  const primerTiempoExtra = simularMitadPosesion(
    local, visitante, posesionLocalProb, nudgeCero, nudgeCero, inicioAlargue + 1, inicioAlargue + 15, contadorContraataques, amarillasPorJugador, expulsados, cambios, false,
  );
  const segundoTiempoExtra = simularMitadPosesion(
    local, visitante, posesionLocalProb, nudgeCero, nudgeCero, inicioAlargue + 16, inicioAlargue + 30, contadorContraataques, amarillasPorJugador, expulsados, cambios, false,
  );

  const eventos = [...resultadoRegular.eventos, ...primerTiempoExtra.eventos, ...segundoTiempoExtra.eventos];
  const eventosGol: EventoGolPartido[] = eventos
    .filter((e) => e.tipo === 'gol')
    .map((e) => ({
      equipo: e.equipo, minuto: e.minuto, jugadorId: e.jugadorId, origen: e.origen, minutoAgregado: e.minutoAgregado,
    }));

  const pasosAlargue = primerTiempoExtra.pasosLocal + primerTiempoExtra.pasosVisitante
    + segundoTiempoExtra.pasosLocal + segundoTiempoExtra.pasosVisitante;
  const pasosAlargueLocal = primerTiempoExtra.pasosLocal + segundoTiempoExtra.pasosLocal;
  // La posesión del alargue se pondera por minutos jugados (30) contra el
  // % ya calculado en el tiempo reglamentario (90) — no hay pasos crudos
  // de la parte regular a mano acá (ResultadoPartido sólo expone el %
  // final, no pasosLocal/pasosVisitante), así que se aproxima así en vez
  // de recalcular todo desde cero.
  const posesionAlargue = pasosAlargue > 0 ? (pasosAlargueLocal / pasosAlargue) * 100 : posesionLocalProb * 100;
  const posesionLocal = (resultadoRegular.posesionLocal * 90 + posesionAlargue * 30) / 120;

  const contarPorTipoYEquipo = (tipo: TipoEvento, equipo: 'local' | 'visitante') => eventos.filter((e) => e.tipo === tipo && e.equipo === equipo).length;
  const sumarXG = (equipo: 'local' | 'visitante') => eventos.reduce((suma, e) => (e.equipo === equipo && e.xg != null ? suma + e.xg : suma), 0);

  return {
    golesLocal: resultadoRegular.golesLocal + primerTiempoExtra.golesLocal + segundoTiempoExtra.golesLocal,
    golesVisitante: resultadoRegular.golesVisitante + primerTiempoExtra.golesVisitante + segundoTiempoExtra.golesVisitante,
    eventosGol,
    eventos,
    posesionLocal,
    tirosLocal: sumarTiros(sumarTiros(resultadoRegular.tirosLocal, primerTiempoExtra.tirosLocal), segundoTiempoExtra.tirosLocal),
    tirosVisitante: sumarTiros(sumarTiros(resultadoRegular.tirosVisitante, primerTiempoExtra.tirosVisitante), segundoTiempoExtra.tirosVisitante),
    cornersLocal: contarPorTipoYEquipo('corner', 'local'),
    cornersVisitante: contarPorTipoYEquipo('corner', 'visitante'),
    faltasLocal: contarPorTipoYEquipo('falta', 'local'),
    faltasVisitante: contarPorTipoYEquipo('falta', 'visitante'),
    penalesLocal: contarPorTipoYEquipo('penal', 'local'),
    penalesVisitante: contarPorTipoYEquipo('penal', 'visitante'),
    eventosTarjeta: eventos
      .filter((e): e is EventoPartido & { jugadorId: string } => (e.tipo === 'tarjeta_amarilla' || e.tipo === 'tarjeta_roja') && e.jugadorId != null)
      .map((e) => ({
        equipo: e.equipo, jugadorId: e.jugadorId, tipo: e.tipo === 'tarjeta_amarilla' ? 'amarilla' as const : 'roja' as const, minuto: e.minuto, minutoAgregado: e.minutoAgregado,
      })),
    tarjetasAmarillasLocal: contarPorTipoYEquipo('tarjeta_amarilla', 'local'),
    tarjetasAmarillasVisitante: contarPorTipoYEquipo('tarjeta_amarilla', 'visitante'),
    tarjetasRojasLocal: contarPorTipoYEquipo('tarjeta_roja', 'local'),
    tarjetasRojasVisitante: contarPorTipoYEquipo('tarjeta_roja', 'visitante'),
    xgLocal: sumarXG('local'),
    xgVisitante: sumarXG('visitante'),
    cambiosLocal: contarPorTipoYEquipo('cambio', 'local'),
    cambiosVisitante: contarPorTipoYEquipo('cambio', 'visitante'),
  };
}
