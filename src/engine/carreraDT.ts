// Carrera del DT propio (pedido explícito): stats de carrera (partidos
// dirigidos, títulos, idolatría de la hinchada) + apodo asignado según
// las decisiones que fue tomando el usuario — mismo espíritu que
// engine/progresoDT.ts (mecánica 5 de profundidad) pero a nivel de TODA
// la carrera, no de una sola temporada. La idolatría es un número
// DISTINTO de `confianzaDirectiva` (objetivos.ts) a propósito: la
// directiva puede estar impaciente con vos mientras la hinchada te sigue
// bancando (o al revés) — son dos audiencias distintas del mismo DT.
import type { Partido } from '../types';
import type { MentalidadPartido } from './partido';
import { clamp } from './random';

export interface TituloGanado {
  competencia: string;
  temporada: number;
}

// Historial "club por club" (pedido explícito, mockups de referencia:
// "TU HISTORIA, CLUB POR CLUB" con barra de idolatría/nivel, PJ, goles,
// títulos y rango de temporadas por cada club que dirigiste — pedido dos
// veces, la primera se había dejado afuera por complejidad, la segunda
// se construye). Una `EtapaClubDT` es una etapa YA CERRADA (dejaste ese
// club) — mientras estás dirigiendo el club actual, esa etapa vive en
// `etapaActual` (abajo), sin partidos/goles/títulos calculados todavía
// (se calculan recién al cerrarla, restando contra el snapshot que guarda
// `abrirEtapaClub`).
export interface EtapaClubDT {
  clubId: string;
  clubNombre: string;
  ligaNombre: string;
  temporadaInicio: number;
  temporadaFin: number;
  partidos: number;
  goles: number;
  idolatriaFinal: number;
  titulos: TituloGanado[];
}

// Snapshot de los contadores acumulados de carrera en el momento en que
// arrancó la etapa actual — `cerrarEtapaClub` resta esto contra los
// valores de ESE momento para sacar sólo lo que pasó en esta etapa
// puntual, sin duplicar la acumulación en un contador aparte por club.
export interface EtapaEnCursoDT {
  clubId: string;
  clubNombre: string;
  ligaNombre: string;
  temporadaInicio: number;
  partidosInicio: number;
  golesInicio: number;
  titulosInicioCount: number;
}

export interface CarreraDT {
  partidosDirigidos: number;
  titulos: TituloGanado[];
  idolatria: number; // 0-100
  golesAFavorCarrera: number;
  fichajesCarrera: number;
  canteranosCarrera: number;
  vecesOfensivo: number;
  vecesDefensivo: number;
  vecesEquilibrado: number;
  historialClubes: EtapaClubDT[];
  etapaActual: EtapaEnCursoDT | null;
}

// Arranca en 0 (pedido explícito: "porque el nivel de referente en el
// club empieza en 50? hace que arranque de 0") — un DT nuevo todavía no
// se ganó nada con la hinchada, así que "Querido" (el primer nivel, ver
// NIVELES_IDOLATRIA más abajo) es algo a construir, no un piso neutral.
export const IDOLATRIA_INICIAL = 0;

export function carreraDTVacia(): CarreraDT {
  return {
    partidosDirigidos: 0,
    titulos: [],
    idolatria: IDOLATRIA_INICIAL,
    golesAFavorCarrera: 0,
    fichajesCarrera: 0,
    canteranosCarrera: 0,
    vecesOfensivo: 0,
    vecesDefensivo: 0,
    vecesEquilibrado: 0,
    historialClubes: [],
    etapaActual: null,
  };
}

// Ver el comentario grande de EtapaClubDT/EtapaEnCursoDT más arriba — se
// llama en useGameStore.ts al arrancar una carrera nueva (primera etapa)
// y cada vez que se acepta una oferta de otro club (aceptarOfertaDT/
// aceptarOfertaRescate), ahí mismo después de cerrar la etapa vieja.
export function abrirEtapaClub(
  carrera: CarreraDT,
  clubId: string,
  clubNombre: string,
  ligaNombre: string,
  temporadaInicio: number,
): CarreraDT {
  return {
    ...carrera,
    etapaActual: {
      clubId,
      clubNombre,
      ligaNombre,
      temporadaInicio,
      partidosInicio: carrera.partidosDirigidos,
      golesInicio: carrera.golesAFavorCarrera ?? 0,
      titulosInicioCount: carrera.titulos.length,
    },
  };
}

// No-op si no hay etapa en curso (autocura partidas guardadas antes de
// esta mecánica, donde `etapaActual` viene `undefined`, no `null`). Se
// llama al aceptar una oferta de otro club (antes de abrir la etapa
// nueva) y cuando la carrera termina de una — procesarFinDeTemporada
// (despido/descenso sin liga inferior) y rechazarRenovacionDT (renuncia)
// en useGameStore.ts — para que la ÚLTIMA etapa quede en el historial.
export function cerrarEtapaClub(carrera: CarreraDT, idolatriaFinal: number, temporadaFin: number): CarreraDT {
  const etapa = carrera.etapaActual;
  if (!etapa) return carrera;
  const nuevaEtapa: EtapaClubDT = {
    clubId: etapa.clubId,
    clubNombre: etapa.clubNombre,
    ligaNombre: etapa.ligaNombre,
    temporadaInicio: etapa.temporadaInicio,
    temporadaFin,
    partidos: carrera.partidosDirigidos - etapa.partidosInicio,
    goles: (carrera.golesAFavorCarrera ?? 0) - etapa.golesInicio,
    idolatriaFinal,
    titulos: carrera.titulos.slice(etapa.titulosInicioCount),
  };
  return {
    ...carrera,
    historialClubes: [...(carrera.historialClubes ?? []), nuevaEtapa],
    etapaActual: null,
  };
}

// Se llama una vez por cada tanda de partidos recién simulados (fecha de
// liga, ronda de copa, amistoso de pretemporada) — si NINGUNO de esos
// partidos era del club del usuario (ej. una ronda de copa nacional donde
// ya estás eliminado pero el resto del cuadro sigue jugando), no cuenta
// como "partido dirigido" ni mueve el contador de mentalidad. Los goles a
// favor SÍ se suman de TODOS los partidos propios de la tanda (a
// diferencia de partidosDirigidos, que sólo cuenta +1 por tanda —
// pretemporada puede tener varios amistosos en una sola tanda al
// "simular todo").
export function actualizarCarreraPorPartidos(
  carrera: CarreraDT,
  partidosNuevos: Partido[],
  clubUsuarioId: string,
  mentalidad: MentalidadPartido | undefined,
): CarreraDT {
  const partidosDelClub = partidosNuevos.filter((p) => p.localId === clubUsuarioId || p.visitanteId === clubUsuarioId);
  if (partidosDelClub.length === 0) return carrera;
  const golesNuevos = partidosDelClub.reduce((acc, p) => {
    const propios = p.localId === clubUsuarioId ? p.golesLocal : p.golesVisitante;
    return acc + (propios ?? 0);
  }, 0);
  return {
    ...carrera,
    partidosDirigidos: carrera.partidosDirigidos + 1,
    // `?? 0` autocura partidas guardadas ANTES de que este campo
    // existiera — el merge de zustand/persist no es profundo, así que un
    // `carreraDT` viejo persistido pisa por completo al default de
    // carreraDTVacia() y queda sin este campo (undefined, no 0).
    golesAFavorCarrera: (carrera.golesAFavorCarrera ?? 0) + golesNuevos,
    vecesOfensivo: carrera.vecesOfensivo + (mentalidad === 'ofensivo' ? 1 : 0),
    vecesDefensivo: carrera.vecesDefensivo + (mentalidad === 'defensivo' ? 1 : 0),
    vecesEquilibrado: carrera.vecesEquilibrado + (mentalidad === 'ofensivo' || mentalidad === 'defensivo' ? 0 : 1),
  };
}

// Título nuevo: se detecta comparando el campeonId ANTES/DESPUÉS de
// resolver una copa — las 4 (Nacional, Mundial de Clubes, Libertadores/
// Sudamericana, Champions/Europa/Conference) usan el mismo campo
// `campeonId: string | null`, así que alcanza con una función genérica.
export function registrarTituloSiCorresponde(
  carrera: CarreraDT,
  campeonIdAntes: string | null | undefined,
  campeonIdDespues: string | null | undefined,
  clubUsuarioId: string,
  competencia: string,
  temporada: number,
): CarreraDT {
  const seAcabaDeGanar = campeonIdAntes !== clubUsuarioId && campeonIdDespues === clubUsuarioId;
  if (!seAcabaDeGanar) return carrera;
  return { ...carrera, titulos: [...carrera.titulos, { competencia, temporada }] };
}

// Título de LIGA (pedido explícito: "que la animación se dispare cuando
// la ganás jugando el último partido, no sólo si tocás cerrar
// temporada" — a diferencia de una copa, la liga no tiene un
// `campeonId` que vaya cambiando; sólo hay "campeón" una vez que se
// jugó toda la fecha). Se llama en DOS lugares: apenas se completa el
// fixture (simularProximaJornada/simularFixtureCompleto — dispara la
// celebración en el momento exacto en que se define, jugando de a una o
// simulando todo de golpe) Y de nuevo en procesarFinDeTemporada (por si
// ese camino no pasó por ahí). Idempotente por diseño (chequea si esta
// competencia+temporada ya está, en vez de comparar un campeonId antes/
// después que la liga no tiene) para no duplicar el título si ya se
// había registrado en el primer lugar.
export function registrarTituloLigaSiCorresponde(
  carrera: CarreraDT,
  esCampeon: boolean,
  nombreLiga: string,
  temporada: number,
): CarreraDT {
  if (!esCampeon) return carrera;
  const yaRegistrado = carrera.titulos.some((t) => t.competencia === nombreLiga && t.temporada === temporada);
  if (yaRegistrado) return carrera;
  return { ...carrera, titulos: [...carrera.titulos, { competencia: nombreLiga, temporada }] };
}

// Títulos agregados entre dos snapshots de CarreraDT (pedido explícito,
// animación de "ganaste un trofeo"): `registrarTituloSiCorresponde` sólo
// agrega 0 o 1 título por llamada (nunca reordena ni saca ninguno), así
// que alcanza con comparar la longitud y tomar la cola — usado en
// useGameStore.ts para encolar la celebración de cada título nuevo,
// sin importar si viene de un solo partido o de "simular temporada
// completa" (donde puede haber varios de golpe: liga + copa + copa
// continental, cada uno en su propia llamada).
export function titulosNuevosDesde(antes: CarreraDT, despues: CarreraDT): TituloGanado[] {
  return despues.titulos.slice(antes.titulos.length);
}

const AJUSTE_IDOLATRIA_CAMPEON = 20;
const AJUSTE_IDOLATRIA_CUMPLIDO = 8;
const AJUSTE_IDOLATRIA_INCUMPLIDO = -12;
const AJUSTE_IDOLATRIA_DESCENSO = -25;

// Se llama una vez por cierre de temporada, junto a actualizarConfianza
// (objetivos.ts) — a propósito NO usa los mismos deltas: la hinchada
// perdona menos un objetivo incumplido pero también castiga menos un
// descenso puntual que la directiva (la lectura real: "la hinchada te
// banca más tiempo que el board").
export function actualizarIdolatria(
  idolatriaActual: number,
  { campeon, objetivoCumplido, descendido }: { campeon: boolean; objetivoCumplido: boolean; descendido: boolean },
): number {
  let idolatria = idolatriaActual;
  if (campeon) idolatria += AJUSTE_IDOLATRIA_CAMPEON;
  else idolatria += objetivoCumplido ? AJUSTE_IDOLATRIA_CUMPLIDO : AJUSTE_IDOLATRIA_INCUMPLIDO;
  if (descendido) idolatria += AJUSTE_IDOLATRIA_DESCENSO;
  return clamp(idolatria, 0, 100);
}

// Niveles de idolatría (pedido explícito: "que tenga niveles querido
// referente idolo leyenda") — puramente de presentación, no tocan el
// número real de `idolatria` ni sus deltas de arriba. Cubren todo el 0-100
// sin huecos (el primero arranca en 0) para que siempre haya un nivel
// vigente; `nivelIdolatria` devuelve el de umbral más alto que todavía no
// se pasa del valor actual.
export interface NivelIdolatria {
  nombre: string;
  umbral: number;
}

export const NIVELES_IDOLATRIA: NivelIdolatria[] = [
  { nombre: 'Querido', umbral: 0 },
  { nombre: 'Referente', umbral: 40 },
  { nombre: 'Ídolo', umbral: 65 },
  { nombre: 'Leyenda', umbral: 85 },
];

export function nivelIdolatria(idolatria: number): NivelIdolatria {
  return [...NIVELES_IDOLATRIA].reverse().find((n) => idolatria >= n.umbral) ?? NIVELES_IDOLATRIA[0];
}

// Pedido explícito (tarjetas de oferta de club estilo "El dado trajo
// estas ofertas": "Te faltan 11 pts para ser Querido") — null en Leyenda,
// no hay nivel siguiente al que le falten puntos.
export function proximoNivelIdolatria(idolatria: number): { nombre: string; faltan: number } | null {
  const siguiente = NIVELES_IDOLATRIA.find((n) => n.umbral > idolatria);
  return siguiente ? { nombre: siguiente.nombre, faltan: siguiente.umbral - idolatria } : null;
}

export function registrarFichaje(carrera: CarreraDT): CarreraDT {
  return { ...carrera, fichajesCarrera: carrera.fichajesCarrera + 1 };
}

export function registrarCanterano(carrera: CarreraDT): CarreraDT {
  return { ...carrera, canteranosCarrera: carrera.canteranosCarrera + 1 };
}

// -------------------- apodo --------------------
//
// Pedido explícito: "un sistema de apodos... según las decisiones que
// tomás" — se recalcula SIEMPRE en vivo a partir de `CarreraDT` (no se
// guarda un apodo "pegado" en el store) para no tener una segunda fuente
// de verdad — con el umbral mínimo de partidos de abajo, en la práctica
// no cambia de un partido a otro una vez que se estabiliza.
export interface DefinicionApodo {
  id: string;
  apodo: string;
  descripcion: string;
  cumple: (carrera: CarreraDT) => boolean;
}

// No hay apodo hasta dirigir suficientes partidos como para que la
// tendencia sea real — "según las decisiones que tomás" implica haber
// tomado bastantes, no una sola.
const PARTIDOS_MINIMOS_PARA_APODO = 15;
const RATIO_TENDENCIA_MERCADO = 2; // el doble de fichajes que canteranos (o viceversa) para que cuente

// Umbral de partidos para "El Fiel" (nunca cambiaste de club) y de goles
// para "El Artillero" — mismo criterio arcade que el resto de este
// archivo, no hace falta más precisión que "a ojo, pero razonable".
const PARTIDOS_MINIMOS_FIEL = 100;
const GOLES_MINIMOS_ARTILLERO = 250;
// A partir de cuántos clubes distintos en el historial ya se considera
// "trotamundo" — 3 en el historial = tu 4to club en la carrera.
const CLUBES_MINIMOS_TROTAMUNDOS = 3;

// Pedido explícito: "agregar muchos mas apodos segun tu carrera" — se
// evalúan en orden (el primero que cumple gana), de más prestigioso/
// específico a más genérico, mismo criterio que ya tenía la lista
// original. "Leyenda" se separó de "Ídolo" (antes los dos pedían
// idolatria>=85, con "Ídolo" quedando inalcanzable en la práctica porque
// "Leyenda" ni siquiera existía como id propio) — ahora Leyenda es el
// nivel de arriba (85+, igual que NIVELES_IDOLATRIA) e Ídolo cubre el
// escalón de abajo (65-84), así los dos son alcanzables de verdad.
export const DEFINICIONES_APODO: DefinicionApodo[] = [
  {
    id: 'multicampeon',
    apodo: 'El Multicampeón',
    descripcion: 'Ganaste 3 títulos o más.',
    cumple: (c) => c.titulos.length >= 3,
  },
  {
    id: 'bicampeon',
    apodo: 'El Bicampeón',
    descripcion: 'Ganaste 2 títulos.',
    cumple: (c) => c.titulos.length === 2,
  },
  {
    id: 'campeon',
    apodo: 'El Campeón',
    descripcion: 'Ganaste al menos un título.',
    cumple: (c) => c.titulos.length >= 1,
  },
  {
    id: 'leyenda',
    apodo: 'La Leyenda',
    descripcion: 'La hinchada te puso en un altar.',
    cumple: (c) => c.idolatria >= 85,
  },
  {
    id: 'idolo',
    apodo: 'El Ídolo',
    descripcion: 'La hinchada te adora.',
    cumple: (c) => c.idolatria >= 65,
  },
  {
    id: 'resistido',
    apodo: 'El Resistido',
    descripcion: 'La hinchada ya no te banca.',
    cumple: (c) => c.idolatria <= 20,
  },
  {
    id: 'trotamundos',
    apodo: 'El Trotamundos',
    descripcion: 'Ya pasaste por varios clubes.',
    cumple: (c) => (c.historialClubes?.length ?? 0) >= CLUBES_MINIMOS_TROTAMUNDOS,
  },
  {
    id: 'fiel',
    apodo: 'El Fiel',
    descripcion: 'Nunca dejaste tu club de toda la vida.',
    cumple: (c) => (c.historialClubes?.length ?? 0) === 0 && c.partidosDirigidos >= PARTIDOS_MINIMOS_FIEL,
  },
  {
    id: 'artillero',
    apodo: 'El Artillero',
    descripcion: 'Tus equipos metieron muchísimos goles.',
    cumple: (c) => (c.golesAFavorCarrera ?? 0) >= GOLES_MINIMOS_ARTILLERO,
  },
  {
    id: 'loco',
    apodo: 'El Loco',
    descripcion: 'Jugás ofensivo casi siempre.',
    cumple: (c) => c.vecesOfensivo >= 10 && c.vecesOfensivo > c.vecesDefensivo && c.vecesOfensivo > c.vecesEquilibrado,
  },
  {
    id: 'candado',
    apodo: 'El Candado',
    descripcion: 'Jugás defensivo casi siempre.',
    cumple: (c) => c.vecesDefensivo >= 10 && c.vecesDefensivo > c.vecesOfensivo && c.vecesDefensivo > c.vecesEquilibrado,
  },
  {
    id: 'estratega',
    apodo: 'El Estratega',
    descripcion: 'Jugás equilibrado casi siempre.',
    cumple: (c) => c.vecesEquilibrado >= 10 && c.vecesEquilibrado > c.vecesOfensivo && c.vecesEquilibrado > c.vecesDefensivo,
  },
  {
    id: 'tiburon',
    apodo: 'El Tiburón',
    descripcion: 'Fichás mucho más de lo que formás canteranos.',
    cumple: (c) => c.fichajesCarrera >= 6 && c.fichajesCarrera > c.canteranosCarrera * RATIO_TENDENCIA_MERCADO,
  },
  {
    id: 'formador',
    apodo: 'El Formador',
    descripcion: 'Le das más lugar a la cantera que al mercado.',
    cumple: (c) => c.canteranosCarrera >= 6 && c.canteranosCarrera > c.fichajesCarrera * RATIO_TENDENCIA_MERCADO,
  },
  {
    id: 'profesor',
    apodo: 'El Profesor',
    descripcion: 'Un DT parejo, sin extremos marcados.',
    cumple: () => true, // apodo por defecto — siempre cumple, va último
  },
];

// Evalúa en orden: el primero que cumple gana (multicampeón le gana a
// campeón, ídolo/resistido antes que los de estilo de juego, etc.) —
// `null` sólo cuando todavía no hay muestra suficiente de partidos.
export function calcularApodo(carrera: CarreraDT): DefinicionApodo | null {
  if (carrera.partidosDirigidos < PARTIDOS_MINIMOS_PARA_APODO) return null;
  return DEFINICIONES_APODO.find((d) => d.cumple(carrera)) ?? null;
}

// Reconstruye una `DefinicionApodo` a partir de su id (pedido explícito:
// "compartir carrera... que te copie el link" — el link para compartir
// (ver utils/compartirCarrera.ts) sólo guarda el ID del apodo, no su
// texto, para que un link viejo siga mostrando el texto/descripción
// ACTUAL si esta lista cambia más adelante, en vez de quedar con una
// copia congelada del momento en que se compartió.
export function apodoPorId(id: string): DefinicionApodo | undefined {
  return DEFINICIONES_APODO.find((d) => d.id === id);
}
