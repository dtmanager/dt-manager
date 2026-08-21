// Posiciones granulares estilo FIFA/FM (pedido explícito: "un sistema de
// posiciones y que cada jugador afecte la simulación" — ver
// engine/estadisticasPartido.ts y engine/jugadores.ts para cómo cada una
// pesa distinto en goles/asistencias y en la curva de edad/declive). Las 4
// posiciones viejas (ARQ/DEF/MED/DEL) siguen existiendo como "sector"
// agregado — ver data/posiciones.ts BUCKET_DE_POSICION — para no tener que
// reescribir el cálculo de fuerza de partido.ts, que sigue pensando en
// ataque/defensa por sector.
// Sólo tipos (se borran al compilar, no crean una dependencia real en
// tiempo de ejecución) — engine/partido.ts sigue siendo dueño del modelo
// de eventos, acá sólo se referencia para poder guardar la secuencia
// completa en el Partido (visualizador, ver PantallaVisualizadorPartido).
import type { EventoPartido, MentalidadPartido } from '../engine/partido';

export type Posicion =
  | 'ARQ' // arquero
  | 'DFC' // defensor central
  | 'LI' // lateral izquierdo
  | 'LD' // lateral derecho
  | 'MCD' // mediocampista defensivo / volante de contención
  | 'MC' // mediocampista central
  | 'MCO' // mediocampista ofensivo / enganche
  | 'EI' // extremo izquierdo
  | 'ED' // extremo derecho
  | 'DEL'; // delantero centro

// Sub-stats granulares (pedido explícito — ver engine/subStats.ts). Sólo
// jugadores de campo tienen SubStats; el arquero tiene su propio set
// (SubStatsArquero) porque sus habilidades no se comparan con las de
// campo. Ambos 40-99, mismo rango que grl. Opcionales para no romper los
// fixtures de Jugador ya existentes en los tests (mismo criterio que
// `transferible`/`partidosLesionRestantes` más abajo) — todo el código que
// los lee usa `?? grl` como fallback.
export interface SubStats {
  ritmo: number;
  tiro: number;
  pase: number;
  regate: number;
  defensa: number;
  fisico: number;
}

export interface SubStatsArquero {
  atajada: number;
  salidas: number;
  juegoDePies: number;
  reflejos: number;
}

// Pierna hábil (pedido explícito). Flavor puro por ahora — igual que
// `nacionalidad` del DT, no mueve ninguna fórmula del motor todavía; se
// muestra en el perfil del jugador. Se sortea una sola vez al generar al
// jugador (no es un derivado de grl como SubStats, así que no se
// recalcula en evolucionarClub).
export type PiernaHabil = 'derecha' | 'izquierda' | 'ambidiestro';

export interface Jugador {
  id: string;
  nombre: string;
  edad: number;
  posicion: Posicion;
  grl: number; // 40-99, overall actual
  pot: number; // 40-99, techo máximo, pot >= grl
  valorMercado: number; // se recalcula cada vez que cambian grl/edad
  clubId: string | null; // null = jugador libre
  esJoya: boolean; // flag interno (no mostrar tal cual al usuario)
  historialGrl: { temporada: number; grl: number }[]; // para el gráfico de evolución
  contratoAniosRestantes: number;
  salario: number;
  estadisticasTemporada: {
    pj: number;
    goles: number;
    asistencias: number;
    // Sistema de tarjetas (pedido explícito): tarjetasAmarillas es
    // acumulado de TODA la temporada (no sólo el último partido) — cada 5
    // amonestaciones dispara una fecha de suspensión (mismo criterio
    // arcade que engine/desgaste.ts con las lesiones: sin pretender el
    // reglamento exacto de ninguna liga real). Opcionales por el mismo
    // motivo que el resto de estos campos — no romper los fixtures de
    // Jugador ya existentes en los tests.
    tarjetasAmarillas?: number;
    tarjetasRojas?: number;
  };
  // No estaba en la sección 3 original, pero la sección 6.2 lo necesita
  // ("el usuario marca un jugador... como transferible") — se agregó acá.
  transferible?: boolean;
  // Lesiones (pedido explícito, versión arcade — ver engine/desgaste.ts):
  // 0/undefined = disponible, >0 = de baja esa cantidad de fechas. Se
  // resetea a 0 en cada pretemporada (evolucionarClub). Opcional (mismo
  // criterio que `transferible` arriba) para no romper los fixtures de
  // jugador ya existentes en los tests — engine/desgaste.ts trata
  // "undefined" como disponible en todos lados.
  partidosLesionRestantes?: number;
  // Sistema de tarjetas (pedido explícito): 0/undefined = disponible, >0
  // = suspendido esa cantidad de fechas — por roja directa, segunda
  // amarilla en el mismo partido, o acumulación de amarillas en la
  // temporada. Mismo criterio arcade y mismo patrón de disponibilidad que
  // partidosLesionRestantes (ver engine/desgaste.ts, estaDisponible ahora
  // chequea los dos campos).
  partidosSuspensionRestantes?: number;
  // Sub-stats granulares (ver comentario de SubStats/SubStatsArquero
  // arriba) — sólo uno de los dos según posicion === 'ARQ'.
  subStats?: SubStats;
  subStatsArquero?: SubStatsArquero;
  piernaHabil?: PiernaHabil;
  // Sistema de dorsales (pedido explícito): 1-99, único dentro del plantel
  // de un mismo club — NO es una propiedad fija del jugador, es del cupo
  // que ocupa (dos jugadores de clubes distintos pueden compartir número
  // sin problema, pero al cambiar de club hay que reasignarlo si choca con
  // alguien ya en el plantel nuevo — ver asignarDorsalLibre en
  // engine/jugadores.ts, que es el único lugar que debe escribir este
  // campo). Opcional por el mismo motivo que el resto de estos campos: no
  // romper los fixtures de Jugador ya existentes en los tests.
  dorsal?: number;
}

// Contrato propio del DT (pedido explícito: "contrato propio del DT" —
// hasta ahora el DT dirigía gratis y para siempre, sin ningún vínculo
// económico con el club). Mismo patrón que el contrato de un Jugador
// (contratoAniosRestantes/salario en engine/contratos.ts) pero mucho más
// simple: no hay cláusulas de rescisión ni mercado de pases de DTs, sólo
// salario + duración. Ver engine/contratoDT.ts.
export interface ContratoDT {
  salarioAnual: number;
  temporadasRestantes: number;
}

export interface DT {
  id: string;
  nombre: string;
  // Flavor puro (pedido explícito del menú de arranque) — no afecta
  // ninguna fórmula, sólo se muestra. Undefined para los DT de la IA.
  nacionalidad?: string;
  tactica: number; // 0-99
  adaptabilidad: number;
  desarrollo: number;
  gestionVestuario: number;
  motivacion: number;
  analisis: number;
  mercado: number;
  reaccion: number;
  mentalidad: number;
  reputacion: number;
  // Opcional por el mismo motivo que el resto de estos campos: no romper
  // los fixtures de DT ya existentes en los tests, ni las carreras
  // guardadas antes de esta mecánica (se rellena solo la primera vez que
  // esa carrera pasa por procesarFinDeTemporada — ver useGameStore.ts).
  contrato?: ContratoDT;
}

export interface Club {
  id: string;
  nombre: string;
  liga: string;
  nc: number; // Nivel de Club, 40-99
  presupuesto: number;
  cohesion: number; // 0-100, versión visible de la "Moral" interna
  plantel: Jugador[]; // todos los jugadores del club (titulares + suplentes + resto)
  formacion: string; // '4-4-2' | '4-3-3' | '3-5-2' | etc.
  titularesIds: string[]; // 11 ids, deben pertenecer a plantel
  suplentesIds: string[]; // 5 ids
  dt: DT;
  esControladoPorUsuario: boolean;
  // Mentalidad de partido (pedido explícito, mecánica 2 de
  // docs/que-le-falta-profundidad.md): opcional — sólo el club del
  // usuario la elige de verdad (ver PantallaArmarEquipo), la IA nunca la
  // setea y engine/partido.ts la trata como 'equilibrado' cuando falta.
  mentalidad?: MentalidadPartido;
}

export interface Liga {
  id: string;
  nombre: string;
  clubIds: string[];
  temporadaActual: number;
  fixture: Partido[];
  tabla: TablaPosiciones[];
}

// Tiros de un equipo en un partido (rediseno-motor-partido.md sección
// 3.6) — `total` es al arco + afuera.
export interface TirosEquipo {
  total: number;
  afuera: number;
  alArco: number;
}

export interface Partido {
  id: string;
  fecha: number; // número de jornada
  localId: string;
  visitanteId: string;
  golesLocal: number | null; // null hasta que se simula
  golesVisitante: number | null;
  partidoImportante: boolean; // clásico, final, definición de descenso/título
  // Detalle de goleador/asistidor por gol (pedido explícito: "que cada
  // jugador afecte la simulación" — ver engine/estadisticasPartido.ts).
  // Opcional para no romper fixtures de Partido ya existentes en los
  // tests que arman el resultado a mano sin este campo.
  goles?: GolPartido[];
  // 0-100, % de posesión del local (rediseno-motor-partido.md fase 1).
  // Opcional por el mismo motivo que `goles` — no rompe partidos armados a
  // mano en los tests.
  posesionLocal?: number;
  // Estadísticas del motor de posesión por zonas (fases 2 y 3 del
  // rediseño) — se guardan en el Partido para poder mostrar el detalle
  // completo al clickear un resultado (pedido explícito), no sólo el
  // marcador y los goles. Opcionales por el mismo motivo que el resto.
  tirosLocal?: TirosEquipo;
  tirosVisitante?: TirosEquipo;
  cornersLocal?: number;
  cornersVisitante?: number;
  faltasLocal?: number;
  faltasVisitante?: number;
  penalesLocal?: number;
  penalesVisitante?: number;
  // Sistema de tarjetas (pedido explícito) — mismo criterio que `goles`:
  // detalle jugador por jugador para el resumen del partido, más los
  // contadores ya sumados (mismo patrón que corners/faltas/penales) para
  // no tener que recalcularlos cada vez que se muestran.
  tarjetas?: TarjetaPartido[];
  tarjetasAmarillasLocal?: number;
  tarjetasAmarillasVisitante?: number;
  tarjetasRojasLocal?: number;
  tarjetasRojasVisitante?: number;
  // xG acumulado (pedido explícito: "xG visible en el detalle de
  // partido") — suma del xG de cada remate real del equipo en todo el
  // partido (engine/partido.ts, ResultadoPartido.xgLocal/xgVisitante).
  // Opcional por el mismo motivo que el resto — no rompe partidos armados
  // a mano en los tests ni los jugados antes de este campo.
  xgLocal?: number;
  xgVisitante?: number;
  // Visualizador de partidos (rediseno-motor-partido_1.md sección 5):
  // secuencia completa de eventos de la simulación, para poder "repasar"
  // el partido zona por zona en vez de sólo ver el resumen. Opcional por
  // el mismo motivo que el resto — no rompe partidos armados a mano en
  // los tests, y los partidos jugados ANTES de este campo simplemente no
  // tienen animación disponible.
  eventos?: EventoPartido[];
  // Cambios (pedido explícito: "sistema de cambios y suplentes en
  // partido") — mismo criterio que `tarjetas`: detalle sale/entra por
  // jugador más los contadores ya sumados.
  cambios?: CambioPartido[];
  cambiosLocal?: number;
  cambiosVisitante?: number;
  // Alargue (pedido explícito) — sólo true en partidos de copa que
  // llegaron empatados al final del tiempo reglamentario y necesitaron
  // 30' extra (ver engine/eliminatoria.ts). No aplica a partidos de liga
  // (ahí un empate es un resultado válido, no se juega alargue).
  huboAlargue?: boolean;
}

export interface TarjetaPartido {
  equipo: 'local' | 'visitante';
  jugadorId: string;
  tipo: 'amarilla' | 'roja';
  minuto: number;
  minutoAgregado?: number;
}

export interface CambioPartido {
  equipo: 'local' | 'visitante';
  jugadorSaleId: string;
  jugadorEntraId: string;
  minuto: number;
  minutoAgregado?: number;
}

export interface GolPartido {
  equipo: 'local' | 'visitante';
  jugadorId: string;
  asistenciaId?: string;
  minuto: number; // 1-90 en tiempo reglamentario, hasta 120 si hubo alargue
  // De qué jugada salió el gol (pedido explícito: "que se sepa quien metió
  // los penales") — undefined para gol de juego abierto (incluye córner).
  origen?: 'penal' | 'falta';
  // Tiempo complementario/descuento (pedido explícito) — ver
  // EventoPartido.minutoAgregado en engine/partido.ts, mismo criterio.
  minutoAgregado?: number;
}

export interface TablaPosiciones {
  clubId: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  pts: number;
}

export interface OfertaTransferencia {
  jugadorId: string;
  clubOfertanteId: string;
  clubVendedorId: string;
  monto: number;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
}

// Sistema de noticias (pedido explícito, ver docs/sistema-noticias.md
// sección 8.4) — el tipo vive acá junto al resto de tipos compartidos;
// `engine/noticias.ts` tiene las funciones puras que arman NoticiaItem[]
// a partir de datos ya calculados (goleadores, fichajes IA-IA, goles de
// un partido, historialGrl). `esRumor` es la única categoría marcada
// como no-confiable a propósito — el resto son siempre datos reales.
// 'contrato' (pedido explícito, "sistema de notificaciones... que se
// renuevan los contratos automaticamente o que se vencen") — ver
// generarNoticiasContrato en engine/noticias.ts.
export type CategoriaNoticia = 'resultado' | 'goleador' | 'destacado' | 'fichaje' | 'rumor' | 'joya' | 'directiva' | 'contrato';

// "Peso del evento" (ver docs de rediseño de UI, sección 5.1): decide qué
// tan grande es el tratamiento visual — rutinario = fade/slide corto,
// relevante = glow + conteo, grande = spotlight con pausa.
export type PesoNoticia = 'rutinario' | 'relevante' | 'grande';

export interface NoticiaItem {
  id: string;
  categoria: CategoriaNoticia;
  peso: PesoNoticia;
  temporada: number;
  fecha: number; // jornada en la que se generó (0 = fuera de fecha, ej. mercado de fin de temporada)
  titulo: string;
  cuerpo: string;
  clubIds: string[];
  jugadorId?: string;
  esRumor?: boolean;
}

// Negociación en rondas (pedido explícito, ver
// docs/sistema-oferta-fichajes.md) — reemplaza el viejo esquema de
// aceptado/rechazado seco tanto para ofertas de fichaje (mercado.ts)
// como para renovaciones de contrato (contratos.ts): `engine/negociacion.ts`
// tiene la función pura que clasifica una ronda en estos 3 resultados a
// partir de la probabilidad de aceptación que cada motor ya calculaba.
export type ResultadoOferta = 'aceptada' | 'rechazada_cerca' | 'rechazada_lejos';

export interface RespuestaOferta {
  resultado: ResultadoOferta;
  // Sólo viene con 'rechazada_cerca' — una cifra orientativa (no exacta)
  // de a cuánto habría que subir la oferta para tener mejor chance en la
  // próxima ronda.
  contraofertaSugerida?: number;
}
