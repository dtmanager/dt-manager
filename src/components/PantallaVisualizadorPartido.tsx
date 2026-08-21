// Visualizador de partidos — V1 (rediseno-motor-partido_1.md sección 5,
// pedido explícito: "el visualizador de partidos") + fase 3
// (visualizador-partidos-diseno.md sección 9: "sumar los 22 jugadores
// como puntos animados, no sólo la pelota") + rediseño visual premium
// (visualizador-partidos-diseno_2.md sección 6.1/6.2, pedido explícito:
// "vibrante, dopamina, para que sea viral" con base limpia). No hay
// tracking real de coordenadas (el motor sólo sabe zona 0-5 + franja
// izq/centro/der, ver engine/partido.ts) así que la pelota se anima "a
// los saltos" entre el centroide de cada zona — mismo patrón que
// documenta Hattrick (Live Viewer) para motores sin tracking real: no
// fingir precisión que la simulación no tiene.
//
// Los 22 jugadores NO tienen posición real tampoco (el motor no trackea
// dónde está cada uno) — el que en cada instante "tiene la pelota" se
// calcula acá mismo, no viene del motor: si el evento ya trae jugadorId
// (gol/falta/penal, el pateador puntual) se usa ese directamente; si no
// (avance/tiro/centro/inicio_posesion/perdida/corner/fuera_de_juego), se
// elige al jugador de ESE equipo cuya posición de formación está más
// cerca del punto de la cancha donde ocurre el evento — una aproximación
// razonable (no es "quién de verdad tocó la pelota" según el motor, que
// no expone esa granularidad para juego abierto) pero alcanza para que
// se vea un jugador puntual corriendo/recibiendo/pateando en cada paso,
// no sólo la pelota sola.
//
// IMPORTANTE (corrección, pedido explícito: "se siguen teletransportando,
// no se dan pases"): los 22 jugadores son UN SOLO componente `Jugador2D`
// cada uno, con key=jugador.id estable DESDE EL ARRANQUE DEL PARTIDO
// HASTA QUE SALE DE CANCHA (cambio/roja) — nunca se desmonta sólo porque
// deja o toma la pelota. La primera versión tenía DOS componentes
// (`JugadorEstatico`/`JugadorPortador`) y cambiaba de uno a otro según
// quién tuviera la pelota: eso hacía que, en CADA cambio de posesión, el
// que soltaba la pelota se desmontara de un lado y remontara del otro
// (perdiendo su tween en curso y apareciendo "de golpe" en su posición
// de formación) y el que la recibía hiciera lo mismo al revés
// — dos teletransportes por cada pase, todo el partido. Con un único
// componente persistente, el `target` (posición de la pelota si es él
// quien la tiene, o su lugar en la formación si no) simplemente cambia
// de valor y el mismo `node.to()` de abajo anima la transición como
// corresponde — ahí es donde se ve de verdad "corre a buscarla, la
// lleva, se la pasa a otro que corre a recibirla". El resto del plantel
// (documento sección 6: "puntos estáticos por sector") tiene un
// balanceo/wander orgánico chico y constante mientras no tiene la
// pelota, para que el equipo se sienta vivo incluso lejos de la jugada.
//
// Decisión técnica: la cancha/jugadores/pelota se dibujan con react-konva
// (canvas), no SVG+CSS como en la v1-v2 de este archivo — pedido
// explícito del usuario tras evaluar el trade-off (documento sección
// 5.3/10 lo marcaba como "el punto dulce" recién cuando hace falta animar
// muchos elementos con control fino de la trayectoria, que es
// exactamente lo que se ganó acá: la pelota ahora arquea de verdad en
// vuelo — sube y baja durante el pase/tiro, `Konva.Animation` calculando
// la curva cuadro a cuadro — algo que una transición CSS simple no puede
// hacer (sólo interpola en línea recta). El resto de la pantalla
// (marcador, confetti, toast, destello, paneles, controles) sigue siendo
// HTML/CSS común superpuesto al `<Stage>` de Konva — no hacía falta
// migrar nada de eso, conviven en el mismo árbol de React sin problema.
// Los jugadores en la formación estática siguen moviéndose con un tween
// simple (`node.to()`), sin arco — no tiene sentido que una persona
// corriendo "vuele" como la pelota.
//
// Qué quedó AFUERA de los "9 estados" pedidos, y por qué: no hay sprites
// ni arte de jugador (son círculos), así que "caminar/correr/frenar/
// girar/cambiar de dirección" no son estados discretos separados sino la
// MISMA transición CSS interpretada por el ojo según cuánto se mueve el
// punto — no se ganaría nada dibujando un estado "caminando" puntual
// aparte. Sí están implementados como estados reconocibles: conducir
// (jugador pegado a la pelota moviéndose), pasar/recibir (el jugador
// activo cambia de un evento a otro, dos puntos que se cruzan), rematar
// (evento 'tiro'/'gol', la pelota sale disparada hacia el arco) y
// festejar (el goleador, cuando se conoce — penal/tiro libre, ver
// limitación de datos abajo — pega un salto en su lugar tras el gol).
//
// SEGUNDA CORRECCIÓN (pedido explícito: "los jugadores van dando saltitos
// y se teletransportan también, el resto está estático, quiero que se
// muevan y den pases como el visualizador 2D del FIFA/FM26"). La corrección
// anterior (componente único por jugador, ver más arriba) sacó el
// desmonte/remonte, pero NO sacó la causa real de que el "portador"
// pegara saltos: `jugadorMasCercano` recalculaba desde CERO, en cada
// evento, cuál jugador de la formación estática quedaba más pegado al
// punto del evento — así que en una MISMA corrida (avance -> avance ->
// tiro, todo el mismo jugador driblando hacia el arco en la vida real)
// el "portador" podía saltar de una persona real a OTRA persona real
// distinta de un evento al siguiente, sólo porque la formación estática
// de esa otra persona quedaba más cerca del nuevo punto — el jugador
// anterior "soltaba" la pelota de golpe (saltaba de vuelta a su lugar
// fijo) y otro aparecía de la nada ya con la pelota puesta. Eso es
// literalmente lo que se ve como "teletransportar" y "saltitos": eran DOS
// saltos simultáneos por evento, no un problema del tween. Ahora
// (`carrierRef`, más abajo) el portador tiene CONTINUIDAD: mientras la
// jugada sigue siendo del mismo equipo y es un tramo de conducción
// (avance/centro/tiro — no un cambio de posesión real como
// inicio_posesion/pérdida/córner), se mantiene al MISMO jugador real que
// ya la tenía, salvo que el nuevo punto quede demasiado lejos de donde
// estaba (ahí sí, algo raro pasó y se recalcula el más cercano como
// respaldo). Sumado a esto, el resto del plantel ya NO queda "estático"
// mientras no tiene la pelota: además del corrimiento de bloque por
// equipo (ya existía), cada jugador cercano a la jugada (compañero o
// rival dentro de un radio de "enganche") se acerca un poco al punto del
// evento — compañeros ofreciéndose de apoyo, rivales presionando/marcando
// — así se ven VARIOS puntos reaccionando a cada jugada, no sólo el
// portador puntual saltando solo en un fondo inmóvil.
//
// Limitación de datos heredada (no de esta pasada): un gol de JUEGO
// ABIERTO no trae jugadorId en el evento crudo del motor (sólo se
// resuelve por sorteo ponderado después, en estadisticasPartido.ts, sin
// volver a escribirse en `eventos`) — así que el festejo puntual sólo se
// ve en goles de penal/tiro libre. El resto de los efectos de gol
// (confetti/flash/shake/toast) no dependen de esto y se ven siempre.
//
// Guardado acotado (pedido explícito de no romper localStorage): sólo los
// partidos del club del usuario en la liga doméstica traen `eventos` (ver
// el comentario largo en engine/fixture.ts) — esta pantalla asume que
// quien la abre ya chequeó que `partido.eventos` existe.

import { useCallback, useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import {
  Circle, Ellipse, Group, Layer, Line, Rect, Stage, Text,
} from 'react-konva';
import {
  BUCKET_ANCHO_DE_POSICION, BUCKET_DE_POSICION, type Ancho, type SectorPosicion,
} from '../data/posiciones';
import type { EventoPartido, TipoEvento } from '../engine/partido';
import type { Club, Jugador, Partido } from '../types';
import { formatoMinuto } from '../utils/formato';

const ANCHO_CANCHA = 760;
const ALTO_CANCHA = 420;
const MARGEN = 30;
const ZONAS = 6;

// Un tramo de movimiento entre dos eventos (ver Jugador2D más abajo) —
// `origen` es dónde estaba parado al arrancar este tramo, `objetivo` a
// dónde tiene que llegar, `inicio` el timestamp (performance.now()) en
// que arrancó. El loop compartido interpola entre origen y objetivo en
// función de cuánto pasó desde `inicio`, no de una velocidad fija — así
// TODO tramo, chico o grande, tarda lo mismo en recorrerse (ver comentario
// grande de Jugador2D).
interface TramoMovimiento {
  origen: { x: number; y: number };
  objetivo: { x: number; y: number };
  inicio: number;
  duracion: number;
}

function easeInOutCuadratico(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

// Tope de velocidad (pedido explícito: "reciben la pelota y se
// teletransporta a diferentes zonas") — la duración fija de arriba (casi
// toda la ventana entre eventos) andaba bien para el caso común, un salto
// de una zona (~140px), pero cuando el motor cambia de quién tiene la
// pelota (pérdida/córner/offside/inicio de jugada) el jugador nuevo puede
// estar parado bien lejos, en su lugar de formación — y ese tramo, mucho
// más largo, se seguía animando en la MISMA ventana corta que uno chico:
// una velocidad implícita de cientos de px por segundo, imposible para una
// persona corriendo, que se lee directo como "se teletransportó" aunque
// técnicamente hubiera un tween. Ahora la duración de CADA tramo se
// calcula según su propia distancia: hasta `DISTANCIA_MOVIMIENTO_COMODO`
// (algo más que una zona) entra entero en la ventana normal, sin cambios;
// más lejos que eso, el tramo se estira proporcionalmente (tope en 3x) así
// que un salto grande se sigue viendo como una corrida larga en progreso,
// no como un salto instantáneo — si el próximo evento llega antes de que
// termine, el jugador sigue corriendo desde donde quedó (el origen del
// próximo tramo se lee en vivo del nodo, ver Jugador2D), nunca se corta de
// golpe.
const DISTANCIA_MOVIMIENTO_COMODO = ((ANCHO_CANCHA - MARGEN * 2) / (ZONAS - 1)) * 1.3;
function calcularDuracionTramo(distancia: number, duracionBase: number): number {
  const factor = Math.max(1, distancia / DISTANCIA_MOVIMIENTO_COMODO);
  return Math.min(duracionBase * 3, duracionBase * factor);
}

// Trayectoria curva (pedido explícito: "que no sean líneas rectas") — en
// vez de interpolar en línea recta entre origen y objetivo, se desvía
// perpendicular a esa línea siguiendo una curva seno: 0 en las puntas
// (sale exacto del origen, llega exacto al objetivo — no hace falta
// "corregir" nada al final) y máxima a la mitad del camino. La magnitud
// es proporcional a la distancia del tramo (capada), así un ajuste chico
// de formación casi no se nota y una corrida larga curva de verdad, como
// una persona doblando en carrera en vez de moverse sobre rieles.
// `lado` decide para qué lado se dobla — determinístico por jugador (no
// azar en cada frame, si no temblaría), ver fasePseudoAleatoria.
function puntoCurvado(
  origen: { x: number; y: number },
  objetivo: { x: number; y: number },
  avance: number,
  lado: number,
): { x: number; y: number } {
  const dx = objetivo.x - origen.x;
  const dy = objetivo.y - origen.y;
  const distancia = Math.hypot(dx, dy);
  const base = { x: origen.x + dx * avance, y: origen.y + dy * avance };
  if (distancia < 1) return base;
  const perpX = -dy / distancia;
  const perpY = dx / distancia;
  const magnitud = Math.min(16, distancia * 0.16) * Math.sin(avance * Math.PI) * lado;
  return { x: base.x + perpX * magnitud, y: base.y + perpY * magnitud };
}

// Paleta vibrante (documento sección 6.2: "verdes de césped y acentos...
// más saturados que un tono corporate") — celeste local / rosa-magenta
// visitante / dorado de marcador y efectos de gol.
const COLOR_LOCAL = '#22d3ee';
const COLOR_LOCAL_OSCURO = '#0891b2';
const COLOR_VISITA = '#fb5581';
const COLOR_VISITA_OSCURO = '#e11d48';
const COLOR_ACENTO = '#ffd60a';
const CESPED_A = '#17b352';
const CESPED_B = '#0f9c46';
const FRANJAS_CESPED = 11;

const Y_POR_FRANJA: Record<Ancho, number> = {
  izq: MARGEN + (ALTO_CANCHA - MARGEN * 2) * 0.18,
  centro: ALTO_CANCHA / 2,
  der: MARGEN + (ALTO_CANCHA - MARGEN * 2) * 0.82,
};

// zona 0 = área propia del equipo que tiene la pelota, zona 5 = área
// rival (engine/partido.ts) — local ataca de izquierda a derecha,
// visitante de derecha a izquierda, así que la MISMA zona cae en un lado
// distinto de la cancha según quién tenga la pelota.
function posicionDeEvento(e: EventoPartido): { x: number; y: number } {
  const zonaAbsoluta = e.equipo === 'local' ? e.zona : ZONAS - 1 - e.zona;
  const x = MARGEN + (zonaAbsoluta / (ZONAS - 1)) * (ANCHO_CANCHA - MARGEN * 2);
  const y = Y_POR_FRANJA[e.ancho];
  return { x, y };
}

// Ancho del arco en el dibujo — pedido explícito: "no se ve cuando
// patean al arco". Antes un remate usaba la MISMA `posicionDeEvento` que
// cualquier avance: para una zona 3/4 (fuera del área / borde del área)
// la pelota se quedaba a mitad de camino, y aunque la zona 5 SÍ cae justo
// en la línea de meta, `ancho` (izq/centro/der) podía ubicarla en
// cualquier franja, no necesariamente enfrentando el arco — un remate no
// se distinguía de un pase cualquiera. Esta función da el punto de
// destino de la PELOTA (no del jugador, que se queda parado donde
// remató) para 'tiro'/'gol'/'penal'/'falta' cuando ese evento puntual es
// un intento de gol real (ver `esRemate` más abajo) — siempre en la
// línea de meta del equipo rival, con la franja eligiendo de qué lado del
// arco entra.
const ANCHO_ARCO_PX = (ALTO_CANCHA - MARGEN * 2) * 0.14;
const OFFSET_ARCO_POR_FRANJA: Record<Ancho, number> = { izq: -1, centro: 0, der: 1 };
function puntoDeArco(equipo: 'local' | 'visitante', ancho: Ancho): { x: number; y: number } {
  const arcoDelRivalAlaDerecha = equipo === 'local'; // local ataca hacia la derecha, ver posicionDeEvento
  const x = arcoDelRivalAlaDerecha ? ANCHO_CANCHA - MARGEN : MARGEN;
  const y = ALTO_CANCHA / 2 + OFFSET_ARCO_POR_FRANJA[ancho] * ANCHO_ARCO_PX * 0.5;
  return { x, y };
}

// Remate errado (pedido explícito: "no se diferencia cuando patean
// afuera") — mismo eje X que puntoDeArco (la línea de meta), pero en vez
// de terminar DENTRO del marco (entre los dos palos dibujados en la
// cancha), termina bien pasado el palo del lado que le tocó — así un tiro
// afuera se ve claramente irse de largo en vez de entrar como cualquier
// otro remate. `minuto` sólo se usa para elegir un lado determinístico
// cuando `ancho==='centro'` (no hay franja real que lo decida ahí) — nada
// de Math.random() acá: esto se recalcula en cada render mientras dura el
// evento, así que un valor al azar haría que el tiro "temblara" de lado
// en vez de quedarse quieto afuera del arco.
function puntoFueraDeArco(equipo: 'local' | 'visitante', ancho: Ancho, minuto: number): { x: number; y: number } {
  const arcoDelRivalAlaDerecha = equipo === 'local';
  const x = arcoDelRivalAlaDerecha ? ANCHO_CANCHA - MARGEN : MARGEN;
  const lado = ancho === 'centro' ? (minuto % 2 === 0 ? 1 : -1) : OFFSET_ARCO_POR_FRANJA[ancho];
  const yBruto = ALTO_CANCHA / 2 + lado * ANCHO_ARCO_PX * 1.8;
  const y = Math.min(ALTO_CANCHA - MARGEN - 6, Math.max(MARGEN + 6, yBruto));
  return { x, y };
}

// Córner (pedido explícito: "anclar la pelota al banderín real") — antes
// el evento 'corner' pasaba por el mismo cálculo que un tiro (el motor le
// pone `xg` porque representa la ejecución + el cabezazo, ver
// engine/partido.ts) y la pelota terminaba viajando derecho al arco sin
// pasar nunca por la esquina — visualmente indistinguible de cualquier
// otro remate. Ahora, para ESE evento puntual, la pelota se ancla al
// banderín de la esquina que le toca (línea de meta rival, arriba o abajo
// según `ancho`) — si termina en gol, el próximo evento ('gol') ya vuelve
// a viajar al arco con el cálculo normal.
function puntoDeCorner(equipo: 'local' | 'visitante', ancho: Ancho, minuto: number): { x: number; y: number } {
  const arcoDelRivalAlaDerecha = equipo === 'local';
  const x = arcoDelRivalAlaDerecha ? ANCHO_CANCHA - MARGEN : MARGEN;
  const arriba = ancho === 'centro' ? minuto % 2 === 0 : ancho === 'izq';
  const y = arriba ? MARGEN : ALTO_CANCHA - MARGEN;
  return { x, y };
}

function nombreJugador(club: Club | undefined, jugadorId: string | undefined): string {
  if (!jugadorId) return '';
  return club?.plantel.find((j) => j.id === jugadorId)?.nombre ?? '';
}

// Iniciales tipo "escudo" (no hay imágenes de club reales) — dos letras a
// partir del nombre, mismo criterio que un avatar genérico. "River Plate"
// -> "RP", "Boca Juniors" -> "BJ", nombres de una sola palabra -> sus
// primeras 2 letras.
function inicialesClub(nombre: string | undefined): string {
  if (!nombre) return '??';
  const palabras = nombre.split(/\s+/).filter(Boolean);
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

// Quiénes están efectivamente en cancha para ESE equipo al llegar al
// evento `hasta` (exclusive: el propio evento `hasta` — un cambio o una
// roja — todavía no aplicó, para que el jugador se vea en pantalla el
// instante en que le pasa algo, no ya desaparecido). Arranca de los 11
// titulares del club y reproduce cambios/expulsiones en orden, mismo
// patrón que ya usa este componente para ir sumando el marcador.
function rosterEnCancha(club: Club | undefined, eventosPrevios: EventoPartido[], equipoNombre: 'local' | 'visitante'): Jugador[] {
  if (!club) return [];
  const idsEnCancha = new Set(club.titularesIds);
  eventosPrevios.forEach((e) => {
    if (e.equipo !== equipoNombre) return;
    if (e.tipo === 'cambio' && e.jugadorId && e.jugadorEntraId) {
      idsEnCancha.delete(e.jugadorId);
      idsEnCancha.add(e.jugadorEntraId);
    } else if (e.tipo === 'tarjeta_roja' && e.jugadorId) {
      idsEnCancha.delete(e.jugadorId);
    }
  });
  return [...idsEnCancha]
    .map((id) => club.plantel.find((j) => j.id === id))
    .filter((j): j is Jugador => j != null);
}

// "Forma estática" por sector (documento sección 6) — cada línea
// (ARQ/DEF/MED/DEL, ver BUCKET_DE_POSICION) se ubica a una distancia fija
// del propio arco, y dentro de la línea los jugadores se reparten parejo
// a lo ancho de la cancha ordenados por franja preferida (izq/centro/der,
// BUCKET_ANCHO_DE_POSICION) para que un lateral izquierdo caiga del lado
// izquierdo del dibujo sin necesitar coordenadas reales. Mismo criterio
// de espejado que posicionDeEvento: el local ataca hacia la derecha
// (forma "hacia adelante" a la izquierda de su propio arco), el
// visitante al revés.
const FRACCION_POR_BUCKET: Record<SectorPosicion, number> = {
  ARQ: 0.06, DEF: 0.22, MED: 0.40, DEL: 0.56,
};
const ORDEN_ANCHO: Record<Ancho, number> = { izq: 0, centro: 1, der: 2 };

function posicionesEstaticas(titulares: Jugador[], equipoNombre: 'local' | 'visitante'): Array<{ jugador: Jugador; x: number; y: number }> {
  const porBucket = new Map<SectorPosicion, Jugador[]>();
  titulares.forEach((j) => {
    const bucket = BUCKET_DE_POSICION[j.posicion];
    const lista = porBucket.get(bucket) ?? [];
    lista.push(j);
    porBucket.set(bucket, lista);
  });

  const resultado: Array<{ jugador: Jugador; x: number; y: number }> = [];
  porBucket.forEach((jugadores, bucket) => {
    const ordenados = [...jugadores].sort((a, b) => (
      ORDEN_ANCHO[BUCKET_ANCHO_DE_POSICION[a.posicion]] - ORDEN_ANCHO[BUCKET_ANCHO_DE_POSICION[b.posicion]]
    ));
    const fraccion = FRACCION_POR_BUCKET[bucket];
    const xLocal = MARGEN + fraccion * (ANCHO_CANCHA - MARGEN * 2);
    const x = equipoNombre === 'local' ? xLocal : ANCHO_CANCHA - xLocal;
    ordenados.forEach((jugador, i) => {
      const y = MARGEN + ((ALTO_CANCHA - MARGEN * 2) * (i + 0.5)) / ordenados.length;
      resultado.push({ jugador, x, y });
    });
  });
  return resultado;
}

// Eventos donde el motor ya trae el jugador puntual (el pateador, ver
// comentario grande de arriba de archivo) — a ESE se lo dibuja con la
// pelota. Tarjetas/cambios también traen jugadorId pero significan otra
// cosa (el infractor, el que sale) — esos siguen con su propio resaltado
// (anillo de color / sin mover), no "tiene la pelota".
const TIPOS_PATEADOR_EXPLICITO = new Set<TipoEvento>(['gol', 'falta', 'penal']);
// Eventos de juego abierto donde no sabemos el jugador puntual — se
// aproxima con el más cercano de la formación estática al punto del
// evento (ver comentario grande de arriba de archivo).
const TIPOS_PORTADOR_APROXIMADO = new Set<TipoEvento>(['inicio_posesion', 'avance', 'centro', 'tiro', 'perdida', 'corner', 'fuera_de_juego']);
// Subconjunto de lo anterior que representa "sigue siendo la misma
// conducción" (no un cambio de posesión real) — sólo en estos tipos tiene
// sentido mantener CONTINUIDAD con el portador del evento anterior en vez
// de recalcular el más cercano desde cero (ver "SEGUNDA CORRECCIÓN" en el
// comentario grande de arriba de archivo). `inicio_posesion`/`perdida`/
// `corner`/`fuera_de_juego` sí arrancan de cero a propósito: ahí SÍ suele
// cambiar quién tiene la pelota de verdad.
const TIPOS_CONTINUACION_DE_CONDUCCION = new Set<TipoEvento>(['avance', 'centro', 'tiro']);

function jugadorMasCercano(posiciones: Array<{ jugador: Jugador; x: number; y: number }>, tx: number, ty: number): Jugador | undefined {
  let mejor: Jugador | undefined;
  let mejorDistancia = Infinity;
  posiciones.forEach((p) => {
    const distancia = (p.x - tx) ** 2 + (p.y - ty) ** 2;
    if (distancia < mejorDistancia) {
      mejorDistancia = distancia;
      mejor = p.jugador;
    }
  });
  return mejor;
}

// Fase de wander (documento 6.1/6.2: que el plantel se sienta vivo) —
// determinística a partir del id del jugador (no Math.random(), para que
// no cambie de fase en cada re-render y el movimiento se vea consistente
// entre eventos, no como un tic nervioso).
function fasePseudoAleatoria(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 997;
  return h / 997;
}

// Jugador — UN componente persistente por jugador durante todo el
// partido (ver el comentario grande de arriba de archivo: esto reemplaza
// a los viejos `JugadorEstatico`/`JugadorPortador`, que se turnaban y por
// eso "teletransportaban" en cada cambio de posesión). `conPelota` sólo
// cambia el `target` (x/y) y el estilo — nunca desmonta el nodo, así que
// el jugador siempre anima desde donde realmente está, sea que esté yendo
// a buscar la pelota, llevándola, o volviendo a su lugar en la formación
// después de soltarla.
//
// TERCERA CORRECCIÓN (pedido explícito: "las animaciones siguen siendo
// teletransportadas, los jugadores círculos siguen estando estáticos") —
// antes CADA jugador (22 instancias) tenía su PROPIO `Konva.Animation`
// persiguiendo su propio objetivo, montado en un efecto con deps `[]`
// dentro de este mismo componente. Con 22+ instancias corriendo cada una
// su loop independiente, cualquier hiccup puntual de montaje/timing en
// UNA sola quedaba invisible de depurar y, más importante, dependía de
// que las 22 arrancaran bien solas — nada centralizado para verificar que
// de verdad se estuvieran moviendo. Ahora este componente es puramente
// declarativo (sólo pinta, no anima su propia posición): registra su nodo
// de Konva en `nodosRef` (mapa compartido, ver PantallaVisualizadorPartido
// más abajo) junto con su tramo actual (origen/objetivo/instante de
// arranque) — UN SOLO loop en el componente padre recorre esos mapas
// cuadro a cuadro e interpola a los 22 a la vez.
//
// CUARTA CORRECCIÓN (pedido explícito: "se siguen teletransportando
// evento a evento"): la versión anterior perseguía el objetivo a
// VELOCIDAD ACOTADA (px/segundo fijo, calibrado para cruzar toda la
// cancha en ~1.5 eventos) — para el caso más común, un salto CHICO entre
// dos eventos consecutivos (una zona de diferencia, unos ~145px), esa
// velocidad alta significaba llegar al destino casi instantáneo (bien
// dentro del primer 10-20% de la ventana entre eventos) y quedarse
// QUIETO el resto — un "flick" casi imperceptible seguido de una pausa
// larga, que se lee exactamente como "teletransportar" aunque técnicamente
// hubiera un tween de por medio. Ahora cada tramo usa SIEMPRE casi toda
// la ventana entre eventos para moverse (duración fija, no velocidad
// fija) con un ease-in-out — así un salto chico se mueve DESPACIO y un
// salto grande se mueve RÁPIDO, pero los dos tardan lo mismo en llegar:
// el jugador está en movimiento visible durante TODA la ventana, nunca
// se planta a esperar. Mismo criterio que ya usaba la pelota (Pelota,
// más abajo) para su arco.
function Jugador2D({
  jugadorId, x, y, colorRelleno, colorBorde, anchoBorde, etiqueta, mostrarEtiqueta, festejando, fase, conPelota,
  nodosRef, tramosRef, duracionBaseRef,
}: {
  jugadorId: string; x: number; y: number; colorRelleno: string; colorBorde: string; anchoBorde: number;
  etiqueta: string; mostrarEtiqueta: boolean; festejando: boolean; fase: number; conPelota: boolean;
  nodosRef: React.MutableRefObject<Map<string, Konva.Group>>;
  tramosRef: React.MutableRefObject<Map<string, TramoMovimiento>>;
  duracionBaseRef: React.MutableRefObject<number>;
}) {
  const wanderRef = useRef<Konva.Group>(null);
  // Última posición conocida, actualizada en CADA render (no en un
  // efecto) — mutar un ref durante el render es seguro acá porque nunca
  // se LEE durante el mismo render, sólo de forma imperativa después
  // (callback de ref / el loop del padre); es lo que le permite al
  // callback de más abajo, que se memoiza con deps ESTABLES para no
  // reregistrarse en cada render, seguir teniendo la posición ACTUAL a
  // mano para el snap inicial.
  const posicionActualRef = useRef({ x, y });
  posicionActualRef.current = { x, y };
  const montadoRef = useRef(false);

  useEffect(() => {
    // El ORIGEN del nuevo tramo es donde el jugador está PARADO AHORA
    // (posición real interpolada del nodo, no el objetivo del tramo
    // anterior) — si el usuario scrubea rápido a mitad de una animación,
    // el próximo tramo arranca desde ahí, no desde donde "debería" haber
    // llegado; nunca hay un salto perdido.
    const nodo = nodosRef.current.get(jugadorId);
    const origen = nodo ? nodo.position() : { x, y };
    const distancia = Math.hypot(x - origen.x, y - origen.y);
    const duracionBase = Math.max(60, duracionBaseRef.current * 0.92);
    const duracion = calcularDuracionTramo(distancia, duracionBase);
    tramosRef.current.set(jugadorId, {
      origen, objetivo: { x, y }, inicio: performance.now(), duracion,
    });
  }, [jugadorId, x, y, nodosRef, tramosRef, duracionBaseRef]);

  const registrarNodo = useCallback((nodo: Konva.Group | null) => {
    if (nodo) {
      nodosRef.current.set(jugadorId, nodo);
      if (!montadoRef.current) {
        // Primer montaje de este jugador (arranque del partido o recién
        // entra por un cambio) — se posiciona directo, no persigue desde
        // 0,0.
        nodo.position(posicionActualRef.current);
        montadoRef.current = true;
      }
    } else {
      nodosRef.current.delete(jugadorId);
      tramosRef.current.delete(jugadorId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- posicionActualRef es un ref, no dispara re-registro; jugadorId/nodosRef/tramosRef son las únicas deps reales que importan para mantener este callback estable entre renders
  }, [jugadorId, nodosRef, tramosRef]);

  useEffect(() => {
    const nodo = wanderRef.current;
    if (!nodo) return undefined;
    if (festejando) {
      nodo.scale({ x: 1, y: 1 });
      nodo.position({ x: 0, y: 0 });
      const tween = new Konva.Tween({
        node: nodo, scaleX: 1.35, scaleY: 1.35, y: -6, duration: 0.22, easing: Konva.Easings.EaseInOut, yoyo: true, repeat: 3,
      });
      tween.play();
      return () => tween.destroy();
    }
    if (conPelota) {
      nodo.scale({ x: 1, y: 1 });
      nodo.position({ x: 0, y: 0 });
      return undefined;
    }
    nodo.scale({ x: 1, y: 1 });
    // Amplitud bajada de nuevo (pedido explícito: "van dando saltitos") —
    // ahora que el resto del plantel se mueve de verdad por el "enganche"
    // hacia la jugada (ver más abajo en el archivo), este balanceo vuelve
    // a ser sólo una respiración casi imperceptible en el lugar, no una
    // fuente de movimiento por sí sola — así no compite ni se lee como un
    // salto propio, sólo evita que un jugador lejos de la jugada se vea
    // 100% congelado en un pixel exacto.
    const periodo = 4.2 + fase;
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const t = frame.time / 1000 + fase * 3;
      nodo.position({
        x: Math.sin((t / periodo) * Math.PI * 2) * 0.8,
        y: Math.cos((t / periodo) * Math.PI * 2 * 0.8) * 0.6,
      });
    }, nodo.getLayer());
    anim.start();
    return () => anim.stop();
  }, [festejando, fase, conPelota]);

  return (
    <Group ref={registrarNodo}>
      {/* Sombra elíptica pegada al piso (pedido explícito: "se ven más
          3D") — no se mueve con el wander (queda directamente en el
          grupo de posición, no en el de wander/festejo) para reforzar que
          el jugador "flota" un poco sobre su propia sombra, mismo truco
          que ya usa la pelota (ver Pelota más abajo en el archivo). */}
      <Ellipse radiusX={6} radiusY={2.2} y={6} fill="rgba(0,0,0,0.32)" />
      <Group ref={wanderRef}>
        <Circle radius={7} fill={colorRelleno} stroke={colorBorde} strokeWidth={anchoBorde} />
        {mostrarEtiqueta && (
          <Text
            text={etiqueta}
            x={conPelota ? -30 : -15}
            y={conPelota ? 10 : 9}
            width={conPelota ? 60 : 30}
            align="center"
            fontSize={conPelota ? 10.5 : 7}
            fontStyle={conPelota ? 'bold' : '600'}
            fill={conPelota ? 'white' : 'rgba(255,255,255,0.85)'}
          />
        )}
      </Group>
    </Group>
  );
}

// La pelota — a diferencia de los jugadores, SÍ arquea en vuelo (pedido
// explícito: "más estilo 3D, bien animado"): `Konva.Animation` calcula la
// curva cuadro a cuadro (posición X/Y con easing cuadrático + una
// elevación en Y que sube y baja como seno de la mitad de un período,
// proporcional a la distancia recorrida — un pase/tiro largo arquea más
// que uno corto). El grupo de "altura" mueve sólo el cuerpo+brillo, la
// sombra/glow quedan pegados al piso (no suben con el arco).
function Pelota({
  x, y, duracionMs, colorEquipo, glowPelota, conDesvio,
}: {
  x: number; y: number; duracionMs: number; colorEquipo: string; glowPelota: number; conDesvio: boolean;
}) {
  const grupoRef = useRef<Konva.Group>(null);
  const alturaRef = useRef<Konva.Group>(null);
  const anteriorRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const grupo = grupoRef.current;
    const altura = alturaRef.current;
    if (!grupo || !altura) return undefined;

    if (anteriorRef.current === null) {
      grupo.position({ x, y });
      anteriorRef.current = { x, y };
      return undefined;
    }
    const desde = anteriorRef.current;
    anteriorRef.current = { x, y };
    const distancia = Math.hypot(x - desde.x, y - desde.y);
    const alturaArco = Math.min(22, distancia * 0.18);
    // 92%, no 80% — mismo margen y mismo motivo que el loop de
    // jugadores (ver comentario grande de Jugador2D): usar casi toda la
    // ventana entre eventos para el vuelo, no sólo una fracción, así la
    // pelota tampoco se queda "clavada" esperando el próximo evento.
    const duracionSeg = Math.max(0.05, (duracionMs * 0.92) / 1000);

    let detenido = false;
    const anim = new Konva.Animation((frame) => {
      if (detenido || !frame) return;
      const t = Math.min(1, frame.time / (duracionSeg * 1000));
      const ease = easeInOutCuadratico(t);
      let px = desde.x + (x - desde.x) * ease;
      let py = desde.y + (y - desde.y) * ease;
      // Desvío de "roza el palo" (pedido explícito: "que los tiros
      // también tengan física") — sólo en el último tramo del vuelo
      // (últ. 22%) de un remate errado, un empujón chico y CRECIENTE hacia
      // afuera del arco (mismo signo que el propio destino ya tiene
      // respecto del centro, ver puntoFueraDeArco) para que se vea como
      // que la pelota roza el palo/travesaño y se termina de abrir, en vez
      // de ir en línea perfectamente recta desde que sale el pie.
      if (conDesvio && t > 0.78) {
        const tDesvio = (t - 0.78) / 0.22;
        const desvioEase = tDesvio * tDesvio;
        const signoAfuera = y - ALTO_CANCHA / 2 >= 0 ? 1 : -1;
        py += signoAfuera * 10 * desvioEase;
      }
      grupo.position({ x: px, y: py });
      altura.y(-Math.sin(t * Math.PI) * alturaArco);
      if (t >= 1) {
        detenido = true;
        anim.stop();
      }
    }, grupo.getLayer());
    anim.start();
    return () => { detenido = true; anim.stop(); };
  }, [x, y, duracionMs, conDesvio]);

  return (
    <Group ref={grupoRef}>
      {/* Tamaño real (pedido explícito: "la pelota es gigante") — antes el
          cuerpo tenía radio 9, MÁS GRANDE que un jugador (radio 7); una
          pelota de fútbol real es bastante más chica que una persona, así
          que ahora es claramente el punto más chico de los dos. */}
      <Circle radius={8} fill={COLOR_ACENTO} opacity={glowPelota * 0.32} />
      <Ellipse radiusX={3} radiusY={1.2} y={2} fill="rgba(0,0,0,0.4)" />
      <Group ref={alturaRef}>
        <Circle
          radius={4}
          fillRadialGradientStartPoint={{ x: -1, y: -1.3 }}
          fillRadialGradientStartRadius={0}
          fillRadialGradientEndPoint={{ x: 0, y: 0 }}
          fillRadialGradientEndRadius={4}
          fillRadialGradientColorStops={[0, '#ffffff', 0.55, '#f2f2f2', 1, '#c7c7c7']}
          stroke={colorEquipo}
          strokeWidth={1.4}
        />
        <Circle radius={0.9} x={-1.1} y={-1.1} fill="white" opacity={0.9} />
      </Group>
    </Group>
  );
}

// Ícono puntual (pedido explícito: "mejorar el resto de animaciones de
// todos los eventos") — un marcador chico con un emoji, que aparece con
// un "pop" elástico al montar (Konva.Tween) en el punto del evento.
// Reusado para tarjetas, falta y offside — cada uno se monta con
// key={indice} en el JSX (más abajo) así vuelve a animar el pop cada vez
// que el evento cambia, aunque el tipo se repita.
function IconoEvento({
  x, y, texto, color,
}: { x: number; y: number; texto: string; color: string }) {
  const grupoRef = useRef<Konva.Group>(null);

  useEffect(() => {
    const nodo = grupoRef.current;
    if (!nodo) return undefined;
    nodo.scale({ x: 0, y: 0 });
    const tween = new Konva.Tween({
      node: nodo, scaleX: 1, scaleY: 1, duration: 0.32, easing: Konva.Easings.BackEaseOut,
    });
    tween.play();
    return () => tween.destroy();
  }, []);

  return (
    <Group ref={grupoRef} x={x} y={y}>
      <Circle radius={11} fill="rgba(10,14,22,0.82)" stroke={color} strokeWidth={1.5} />
      <Text text={texto} fontSize={13} x={-11} y={-11} width={22} height={22} align="center" verticalAlign="middle" />
    </Group>
  );
}

function descripcionEvento(e: EventoPartido, clubEquipo: Club | undefined): string {
  const nombre = clubEquipo?.nombre ?? (e.equipo === 'local' ? 'Local' : 'Visitante');
  switch (e.tipo) {
    case 'inicio_posesion':
      return e.contraataque ? `¡Contraataque de ${nombre}!` : `${nombre} arranca una jugada`;
    case 'avance':
      return e.paseFiltrado ? `¡Pase filtrado de ${nombre}! Queda mano a mano con el arquero` : `${nombre} avanza con la pelota`;
    case 'tiro':
      // alArco === false es explícito ("se fue afuera") — undefined pasa
      // por partidos guardados antes de este campo, se asume al arco para
      // no cambiarles el texto de golpe (mismo criterio que el resto de
      // los campos opcionales de EventoPartido).
      return e.alArco === false ? `${nombre} remata... afuera` : `${nombre} remata al arco`;
    case 'centro':
      return `Centro al área de ${nombre}`;
    case 'gol': {
      const jugador = nombreJugador(clubEquipo, e.jugadorId);
      const sufijo = e.origen === 'penal' ? ' (penal)' : e.origen === 'falta' ? ' (tiro libre)' : '';
      return `¡GOOOL de ${nombre}${jugador ? ` — ${jugador}` : ''}${sufijo}!`;
    }
    case 'perdida':
      return `${nombre} pierde la pelota`;
    case 'corner':
      return `Córner para ${nombre}`;
    case 'falta':
      return `Falta a favor de ${nombre}`;
    case 'penal':
      return `¡Penal para ${nombre}!`;
    case 'fuera_de_juego':
      return `Fuera de juego, ${nombre}`;
    case 'tarjeta_amarilla': {
      const jugador = nombreJugador(clubEquipo, e.jugadorId);
      return `🟨 Amonestado: ${jugador || nombre}`;
    }
    case 'tarjeta_roja': {
      const jugador = nombreJugador(clubEquipo, e.jugadorId);
      return `🟥 Expulsado: ${jugador || nombre}`;
    }
    case 'cambio': {
      const sale = nombreJugador(clubEquipo, e.jugadorId);
      const entra = nombreJugador(clubEquipo, e.jugadorEntraId);
      return `🔄 Cambio en ${nombre}: sale ${sale || '?'}, entra ${entra || '?'}`;
    }
    // El motor no genera 'fin_mitad'/'fin_partido' como eventos propios
    // hoy (no team asociado con sentido, a diferencia del resto) — casos
    // explícitos igual, por las dudas se agreguen más adelante, en vez de
    // caer al default (que mostraría sólo el nombre del club a secas).
    case 'fin_mitad':
      return 'Fin del primer tiempo';
    case 'fin_partido':
      return 'Fin del partido';
    default:
      return nombre;
  }
}

const VELOCIDAD_MS = 900;
// visualizador-partidos-diseno.md sección 6: "velocidad (1x/2x/4x, patrón
// estándar de reproductor de replay)".
const VELOCIDADES = [1, 2, 4] as const;
type Velocidad = (typeof VELOCIDADES)[number];

// Keyframes de los efectos de "momento de pago" (documento sección 6.2) —
// inyectados una sola vez con el componente, con nombres con prefijo
// `vp-` para no chocar con animaciones de otras pantallas. Tailwind ya
// cubre paneles/blur/etc. con utilidades normales; esto es sólo lo que
// Tailwind no trae de fábrica (shake, flash, confetti, pulso, toast
// elástico) — mismo patrón de timing que el mockup de referencia.
const KEYFRAMES_EFECTOS = `
@keyframes vp-shake {
  0% { transform: translate(0,0); }
  15% { transform: translate(-6px,3px) rotate(-0.6deg); }
  30% { transform: translate(5px,-4px) rotate(0.6deg); }
  45% { transform: translate(-4px,4px) rotate(-0.4deg); }
  60% { transform: translate(4px,-2px) rotate(0.4deg); }
  75% { transform: translate(-2px,2px); }
  100% { transform: translate(0,0); }
}
@keyframes vp-flash {
  0% { opacity: 0; }
  8% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes vp-confetti-fall {
  0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(420px) translateX(var(--vp-drift,0px)) rotate(var(--vp-spin,540deg)); opacity: 0; }
}
@keyframes vp-score-pulse {
  0% { transform: scale(1); box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
  30% { transform: scale(1.14); box-shadow: 0 8px 34px rgba(255,214,10,0.55); }
  100% { transform: scale(1); box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
}
@keyframes vp-goal-toast {
  0% { opacity: 0; transform: translateY(-10px) scale(0.4); }
  14% { opacity: 1; transform: translateY(0) scale(1.25); }
  22% { transform: translateY(0) scale(1); }
  82% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-6px) scale(0.9); }
}
`;

interface PiezaConfeti {
  id: number;
  left: number;
  color: string;
  drift: number;
  spin: number;
  dur: number;
  delay: number;
  redondo: boolean;
}
const COLORES_CONFETI = [COLOR_ACENTO, COLOR_LOCAL, COLOR_VISITA, '#a3e635', '#fb923c', '#60a5fa'];

export function PantallaVisualizadorPartido({
  partido, clubes, onCerrar,
}: {
  partido: Partido; clubes: Record<string, Club>; onCerrar: () => void;
}) {
  const eventos = partido.eventos ?? [];
  const [indice, setIndice] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  // Arranca en 2x, no 1x (pedido explícito: "que el partido se vea rápido
  // por defecto") — a este ritmo los saltos de portador más largos (ver
  // calcularDuracionTramo) también terminan de correr antes, así que
  // arrancar más rápido de entrada disimula mejor cualquier tramo que
  // todavía se sienta "atrasado" alcanzando a la jugada. Sigue siendo
  // ajustable con los botones 1x/2x/4x de siempre.
  const [velocidad, setVelocidad] = useState<Velocidad>(2);
  // visualizador-partidos-diseno.md sección 2.1: la fricción real de
  // usuarios de FM26 fue justo esto — quedar forzado a la vista 2D sin
  // poder sacarla. Acá se puede "minimizar" a sólo el ticker de texto sin
  // cerrar el repaso (onCerrar sigue siendo la salida completa).
  const [minimizado, setMinimizado] = useState(false);
  // Cámara/zoom/nombres/trayectorias (documento sección 6.1) — controles
  // puramente visuales, no dependen de datos del partido.
  const [tiltFlat, setTiltFlat] = useState(false);
  const [zoomNivel, setZoomNivel] = useState(1);
  const [showNombres, setShowNombres] = useState(true);
  // Arranca en true (a diferencia de la primera versión): el recorrido de
  // la pelota se pidió explícitamente ("se ve el recorrido de la
  // pelota"), no tiene sentido que haya que activarlo a mano cada vez.
  const [showTrails, setShowTrails] = useState(true);
  const [trail, setTrail] = useState<Array<{ x: number; y: number }>>([]);
  // Efectos de "momento de pago" en el gol (documento sección 6.2) —
  // reusados también para roja/penal (pedido explícito: "más animaciones
  // que sean del estilo... bien visuales y dopamínicas"), por eso
  // `flashTipo` guarda DE QUÉ evento es el destello en vez de un booleano
  // simple: cada uno tiñe el destello de un color distinto (dorado gol,
  // rojo tarjeta) sin duplicar el div ni el keyframe.
  const [shake, setShake] = useState(false);
  const [flashTipo, setFlashTipo] = useState<'gol' | 'roja' | null>(null);
  const [pulse, setPulse] = useState(false);
  const [toast, setToast] = useState(false);
  const [slowMo, setSlowMo] = useState(false);
  const [confeti, setConfeti] = useState<PiezaConfeti[]>([]);
  // Festejo puntual del goleador (ver comentario grande de arriba de
  // archivo: sólo se conoce en penal/tiro libre, no en juego abierto).
  const [festejandoId, setFestejandoId] = useState<string | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const confetiIdRef = useRef(0);
  // Qué índice de evento ya disparó el payoff de gol/roja/penal — evita
  // repetir el combo de efectos en cada re-render mientras se está parado
  // en el mismo evento (sólo se dispara al LLEGAR a uno nuevo de ese tipo).
  const golDisparadoRef = useRef<number | null>(null);
  const rojaDisparadaRef = useRef<number | null>(null);
  const penalDisparadoRef = useRef<number | null>(null);
  // Continuidad del portador (ver "SEGUNDA CORRECCIÓN" en el comentario
  // grande de arriba de archivo) — guarda quién tuvo la pelota en el
  // ÚLTIMO evento resuelto, para que una corrida de varios eventos
  // (avance -> avance -> tiro) se dibuje como el MISMO jugador real
  // corriendo, no como una posta al azar entre distintas personas.
  const carrierRef = useRef<{ id: string; equipo: 'local' | 'visitante' } | null>(null);
  // Qué índice fue el último en actualizar `carrierRef` — si el usuario
  // saltea (scrubber / "Próximo gol" / "Anterior"), el índice no avanza de
  // a uno y el "portador anterior" guardado ya no es el predecesor real
  // del nuevo evento; en ese caso se descarta y se recalcula de cero en
  // vez de arrastrar una continuidad que no corresponde.
  const indiceProcesadoRef = useRef<number>(-1);
  const duracionMs = (VELOCIDAD_MS / velocidad) * (slowMo ? 2.6 : 1);

  // Loop único de movimiento de los 22 jugadores (ver comentario grande
  // de Jugador2D, arriba de archivo, "CUARTA CORRECCIÓN") — cada
  // Jugador2D registra acá su nodo de Konva (nodosJugadoresRef) y su
  // tramo actual origen/objetivo/inicio (tramosJugadoresRef); UN SOLO
  // Konva.Animation, montado abajo, recorre ambos mapas cuadro a cuadro e
  // interpola a los 22 a la vez con una DURACIÓN fija (casi toda la
  // ventana entre eventos, duracionJugadoresRef) en vez de una velocidad
  // fija — así un salto chico entre eventos consecutivos no llega
  // "de una" y se queda esperando, se mueve despacio durante toda la
  // ventana, igual que uno grande se mueve rápido pero tarda lo mismo.
  const layerRef = useRef<Konva.Layer>(null);
  const nodosJugadoresRef = useRef<Map<string, Konva.Group>>(new Map());
  const tramosJugadoresRef = useRef<Map<string, TramoMovimiento>>(new Map());
  const duracionJugadoresRef = useRef(VELOCIDAD_MS);

  useEffect(() => {
    duracionJugadoresRef.current = duracionMs;
  }, [duracionMs]);

  useEffect(() => {
    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const ahora = performance.now();
      // Cada tramo trae SU PROPIA duración (ver calcularDuracionTramo,
      // arriba de archivo) — ya no una compartida por todos los nodos: un
      // salto largo (cambio de portador) tarda más que uno chico, en vez
      // de comprimirse en la misma ventana fija y verse "teletransportado".
      nodosJugadoresRef.current.forEach((nodo, id) => {
        const tramo = tramosJugadoresRef.current.get(id);
        if (!tramo) return;
        const t = Math.min(1, (ahora - tramo.inicio) / tramo.duracion);
        const avance = easeInOutCuadratico(t);
        const lado = fasePseudoAleatoria(id) < 0.5 ? -1 : 1;
        nodo.position(puntoCurvado(tramo.origen, tramo.objetivo, avance, lado));
      });
    }, layerRef.current);
    anim.start();
    return () => { anim.stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a propósito: arranca UNA vez al montar y corre todo el partido, lee los mapas/duracionJugadoresRef por referencia mutable
  }, []);

  // Konva necesita un tamaño en píxeles concreto — se mide el ÁREA
  // DISPONIBLE real (ancho Y alto, no sólo ancho) con ResizeObserver y se
  // calcula un tamaño "contain" (la cancha entra COMPLETA, limitada por
  // el lado que más restrinja). Pedido explícito, viendo el video real
  // que mandaste: "se ve feo" — la causa era que esto antes sólo medía el
  // ANCHO del contenedor y estiraba el alto según la relación de aspecto
  // SIN ningún tope — en una ventana ancha y no tan alta (como la del
  // video) la cancha terminaba más alta que la pantalla entera, tapando
  // el header, el marcador con escudos y el panel lateral (quedaban
  // scrolleados fuera de vista, nunca se llegaban a ver) — por eso se
  // veía "sólo pasto con puntitos" en vez del diseño premium que sí está
  // implementado más abajo en este archivo. Ahora la cancha SIEMPRE entra
  // completa en el espacio que le queda entre el header/marcador (arriba)
  // y el ticker/controles (abajo) — nunca empuja nada fuera de la
  // pantalla.
  const areaDisponibleRef = useRef<HTMLDivElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [cajaCancha, setCajaCancha] = useState({ ancho: ANCHO_CANCHA, alto: ALTO_CANCHA });

  useEffect(() => {
    const nodo = areaDisponibleRef.current;
    if (!nodo) return undefined;
    const observer = new ResizeObserver((entradas) => {
      const entrada = entradas[0];
      if (!entrada) return;
      const { width, height } = entrada.contentRect;
      if (width <= 0 || height <= 0) return;
      const escala = Math.min(width / ANCHO_CANCHA, height / ALTO_CANCHA);
      setCajaCancha({ ancho: ANCHO_CANCHA * escala, alto: ALTO_CANCHA * escala });
    });
    observer.observe(nodo);
    return () => observer.disconnect();
  }, []);
  const escalaStage = cajaCancha.ancho / ANCHO_CANCHA;

  const eventoActual: EventoPartido | undefined = eventos[indice];
  const { x, y } = eventoActual ? posicionDeEvento(eventoActual) : { x: ANCHO_CANCHA / 2, y: ALTO_CANCHA / 2 };
  // `x,y` de arriba es dónde está PARADO el jugador (remata desde ahí, no
  // se lo teletransporta al arco) — `xPelota,yPelota` es a dónde VIAJA la
  // pelota, que para un remate real es el arco (puntoDeArco), no la zona
  // del jugador. `xg` viene completo sólo cuando ESE evento puntual fue
  // un intento de gol real (ver el comentario de `EventoPartido.xg` en
  // engine/partido.ts) — 'gol' siempre lo es, tenga o no `xg` seteado.
  const esRemate = eventoActual != null && (eventoActual.tipo === 'gol' || eventoActual.xg != null);
  // Pedido explícito: "no se diferencia cuando patean afuera" — `alArco`
  // (engine/partido.ts) dice si ESE remate puntual entra en el marco o se
  // va afuera; `undefined` es partidos guardados antes de este campo, se
  // asume al arco para no romper su animación (mismo criterio que el
  // resto de campos opcionales de EventoPartido). Un 'gol' siempre entra,
  // tenga o no el campo seteado.
  const vaAlArco = eventoActual?.tipo === 'gol' || eventoActual?.alArco !== false;
  // Córner primero: aunque el evento trae `xg` (así que técnicamente
  // también es esRemate), ESE paso puntual es la ejecución desde la
  // esquina, no el cabezazo — se ancla al banderín en vez de ir directo
  // al arco (ver puntoDeCorner arriba de archivo).
  const { x: xPelota, y: yPelota } = eventoActual && eventoActual.tipo === 'corner'
    ? puntoDeCorner(eventoActual.equipo, eventoActual.ancho, eventoActual.minuto)
    : eventoActual && esRemate
      ? (vaAlArco ? puntoDeArco(eventoActual.equipo, eventoActual.ancho) : puntoFueraDeArco(eventoActual.equipo, eventoActual.ancho, eventoActual.minuto))
      : { x, y };

  useEffect(() => {
    if (!reproduciendo) return undefined;
    intervaloRef.current = setInterval(() => {
      setIndice((i) => {
        if (i >= eventos.length - 1) {
          setReproduciendo(false);
          return i;
        }
        return i + 1;
      });
    }, duracionMs);
    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current);
    };
  }, [reproduciendo, eventos.length, duracionMs]);

  // Trayectoria de la pelota (documento sección 6.1: "mostrar/ocultar
  // trayectorias") — sigue a `xPelota/yPelota` (a dónde VIAJA la pelota),
  // no a `x/y` (dónde está el jugador), para que un remate se vea llegar
  // hasta el arco en la estela. Se resetea en cada 'inicio_posesion'
  // (pedido explícito: "no se dan pases que se ven bien" — antes la
  // estela acumulaba las últimas 20 posiciones de eventos SIN importar si
  // eran de la misma jugada, así que después de un par de cambios de
  // posesión quedaba una maraña de líneas cruzadas de jugadas distintas
  // en vez de leerse como "este es el pase que se está dando ahora").
  useEffect(() => {
    if (!showTrails) {
      setTrail([]);
      return;
    }
    if (eventoActual?.tipo === 'inicio_posesion') {
      setTrail([{ x: xPelota, y: yPelota }]);
      return;
    }
    setTrail((t) => {
      const ultimo = t[t.length - 1];
      if (ultimo && ultimo.x === xPelota && ultimo.y === yPelota) return t;
      const siguiente = [...t, { x: xPelota, y: yPelota }];
      return siguiente.length > 12 ? siguiente.slice(siguiente.length - 12) : siguiente;
    });
  }, [xPelota, yPelota, showTrails, eventoActual?.tipo]);

  // Payoff de gol (documento sección 6.2) — shake + flash + confetti +
  // pulso del marcador + toast elástico + punch de zoom + slow-motion,
  // todo disparado por el mismo evento 'gol' que ya existía, sin datos ni
  // lógica de simulación nueva. Se dispara una sola vez por índice de
  // evento (golDisparadoRef), tanto avanzando normal como saltando con
  // "Próximo gol" o el scrubber.
  useEffect(() => {
    if (!eventoActual || eventoActual.tipo !== 'gol') return undefined;
    if (golDisparadoRef.current === indice) return undefined;
    golDisparadoRef.current = indice;

    setShake(true);
    setFlashTipo('gol');
    setPulse(true);
    setToast(true);
    setSlowMo(true);
    if (eventoActual.jugadorId) setFestejandoId(eventoActual.jugadorId);

    const piezas: PiezaConfeti[] = Array.from({ length: 40 }, () => {
      confetiIdRef.current += 1;
      return {
        id: confetiIdRef.current,
        left: 20 + Math.random() * 60,
        color: COLORES_CONFETI[Math.floor(Math.random() * COLORES_CONFETI.length)],
        drift: Math.random() * 200 - 100,
        spin: 360 + Math.random() * 720,
        dur: 0.9 + Math.random() * 0.9,
        delay: Math.random() * 0.25,
        redondo: Math.random() < 0.5,
      };
    });
    setConfeti((c) => [...c, ...piezas]);

    const zoomPrevio = zoomNivel;
    setZoomNivel(Math.min(1.6, zoomPrevio + 0.09));

    const timers = [
      setTimeout(() => setShake(false), 460),
      setTimeout(() => setFlashTipo(null), 720),
      setTimeout(() => setPulse(false), 620),
      setTimeout(() => setToast(false), 1800),
      setTimeout(() => setSlowMo(false), 1100),
      setTimeout(() => setFestejandoId(null), 1800),
      setTimeout(() => setZoomNivel(zoomPrevio), 190),
      setTimeout(() => setConfeti((c) => c.filter((p) => !piezas.includes(p))), 2200),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo debe reevaluar al cambiar de evento, no en cada cambio de zoomNivel/confeti
  }, [indice, eventoActual]);

  // Payoff de tarjeta roja (pedido explícito: "más animaciones... bien
  // visuales y dopamínicas") — versión más chica del combo de gol de
  // arriba: shake corto + destello ROJO (mismo div/keyframe, tinte
  // distinto vía `flashTipo`), sin confetti/toast/slow-mo (esos son
  // celebración, una expulsión es lo opuesto). Mismo patrón de
  // "disparar una sola vez por índice" que el gol.
  useEffect(() => {
    if (!eventoActual || eventoActual.tipo !== 'tarjeta_roja') return undefined;
    if (rojaDisparadaRef.current === indice) return undefined;
    rojaDisparadaRef.current = indice;

    setShake(true);
    setFlashTipo('roja');

    const timers = [
      setTimeout(() => setShake(false), 380),
      setTimeout(() => setFlashTipo(null), 550),
    ];
    return () => timers.forEach(clearTimeout);
  }, [indice, eventoActual]);

  // Payoff de penal COBRADO (pedido explícito, mismo motivo que arriba) —
  // un pulso corto del marcador + un pequeño punch de zoom (mismo
  // mecanismo que el gol pero más chico) para marcar el momento de tensión
  // antes del remate, sin pisar el combo completo que sí dispara el 'gol'
  // si el penal termina convertido.
  useEffect(() => {
    if (!eventoActual || eventoActual.tipo !== 'penal') return undefined;
    if (penalDisparadoRef.current === indice) return undefined;
    penalDisparadoRef.current = indice;

    setPulse(true);
    const zoomPrevio = zoomNivel;
    setZoomNivel(Math.min(1.6, zoomPrevio + 0.05));

    const timers = [
      setTimeout(() => setPulse(false), 500),
      setTimeout(() => setZoomNivel(zoomPrevio), 550),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo debe reevaluar al cambiar de evento, no en cada cambio de zoomNivel
  }, [indice, eventoActual]);

  if (eventos.length === 0) return null;

  const local = clubes[partido.localId];
  const visitante = clubes[partido.visitanteId];
  const clubDelEvento = eventoActual.equipo === 'local' ? local : visitante;

  let golesLocal = 0;
  let golesVisitante = 0;
  eventos.slice(0, indice + 1).forEach((e) => {
    if (e.tipo === 'gol') {
      if (e.equipo === 'local') golesLocal += 1;
      else golesVisitante += 1;
    }
  });

  const colorEquipo = eventoActual.equipo === 'local' ? COLOR_LOCAL : COLOR_VISITA;

  // visualizador-partidos-diseno.md sección 6: "salto directo a siguiente
  // gol" — mismo patrón que un reproductor de replay.
  const offsetProximoGol = eventos.slice(indice + 1).findIndex((e) => e.tipo === 'gol');
  const proximoGolIdx = offsetProximoGol === -1 ? -1 : indice + 1 + offsetProximoGol;

  // Fase 3 (documento sección 9) — los 22 (o menos, con rojas) puntos de
  // fondo, "forma estática" por sector. `eventosPrevios` es exclusive del
  // evento actual, ver el comentario de rosterEnCancha.
  const eventosPrevios = eventos.slice(0, indice);
  const posicionesLocalBase = posicionesEstaticas(rosterEnCancha(local, eventosPrevios, 'local'), 'local');
  const posicionesVisitanteBase = posicionesEstaticas(rosterEnCancha(visitante, eventosPrevios, 'visitante'), 'visitante');

  // "Forma que sigue a la pelota" (pedido explícito: "los jugadores se
  // mueven" — con sólo la forma estática de arriba, 21 de los 22 puntos
  // quedaban prácticamente congelados en su línea todo el partido, sólo
  // temblando con el wander; esto los hace correr como bloque hacia donde
  // está la pelota, sin necesitar coordenadas reales del motor). `x` ya es
  // la posición en cancha del evento actual (posicionDeEvento, arriba de
  // este componente) — se reutiliza el mismo eje para no inventar una
  // segunda noción de "dónde está jugándose la pelota". El equipo CON
  // pelota se estira más (ataca en bloque), el que no la tiene se corre
  // menos (bloque defensivo más compacto, pero igual sigue la jugada) —
  // AMBOS equipos se corren hacia el MISMO lado: si la pelota está pegada
  // al arco de un equipo, ese equipo defiende profundo ahí Y el rival
  // empuja el bloque ofensivo hasta ahí también, no tiene sentido que uno
  // se mueva y el otro quede pegado en la mitad de cancha.
  // Amplitud bajada de 46 a 30, y el equipo que NO tiene la pelota se
  // mueve bastante menos (0.55 -> 0.32) — pedido explícito: "los
  // jugadores se mueven errático". Con la amplitud vieja, una racha de
  // eventos chicos (avance zona 2 -> avance zona 3 -> tiro, cada uno con
  // su propio salto de zona) hacía que el bloque ENTERO se reacomodara de
  // golpe en cada paso — se notaba como un tirón nervioso más que como un
  // desplazamiento con intención. Más chico y más lento de leer.
  const AMPLITUD_FORMA = 30;
  const factorAvance = (x - ANCHO_CANCHA / 2) / (ANCHO_CANCHA / 2 - MARGEN); // aprox -1 (arco local) .. 1 (arco visitante)
  const desplazamientoLocal = factorAvance * AMPLITUD_FORMA * (eventoActual.equipo === 'local' ? 1 : 0.32);
  const desplazamientoVisitante = factorAvance * AMPLITUD_FORMA * (eventoActual.equipo === 'visitante' ? 1 : 0.32);
  // Pedido explícito: "a veces aparecen en el arco o en la línea afuera de
  // la cancha" — `posicionDeEvento` (arriba de archivo) ubica la zona 5
  // EXACTO sobre la línea de fondo (mismo borde que dibuja el rectángulo
  // de la cancha), así que un jugador rematando desde ahí quedaba
  // literalmente parado sobre la línea/el arco. Estos límites ya existían
  // para el resto del plantel (más abajo); el que tiene la pelota los usa
  // recién ahora también (ver el `<Jugador2D conPelota>` más abajo).
  const limiteX = (px: number) => Math.min(ANCHO_CANCHA - MARGEN - 12, Math.max(MARGEN + 12, px));
  const limiteY = (py: number) => Math.min(ALTO_CANCHA - MARGEN - 10, Math.max(MARGEN + 10, py));

  // "Enganche" hacia la jugada (pedido explícito: "el resto está
  // estático") — además del corrimiento de bloque de arriba (que sólo
  // mueve el eje X, todo el equipo por igual), cada jugador que quede
  // relativamente cerca del punto del evento se acerca un poco más,
  // compañeros más que rivales (se leen como "se ofrece de apoyo" /
  // "sale a marcar"). Es local a cada jugador (usa SU distancia al punto,
  // no la del bloque), así que varios puntos distintos reaccionan visible
  // y distinto en cada evento en vez de moverse todos exactamente igual.
  const RADIO_ENGANCHE = 150;
  function pullHaciaJugada(px: number, py: number, esCompanieroDelEquipoConPelota: boolean): { x: number; y: number } {
    const dx = x - px;
    const dy = y - py;
    const distancia = Math.hypot(dx, dy) || 1;
    if (distancia > RADIO_ENGANCHE) return { x: px, y: py };
    const fuerzaBase = esCompanieroDelEquipoConPelota ? 0.24 : 0.13;
    const fuerza = fuerzaBase * (1 - distancia / RADIO_ENGANCHE);
    return { x: px + dx * fuerza, y: py + dy * fuerza };
  }
  const posicionesLocal = posicionesLocalBase.map((p) => {
    const conShift = { x: limiteX(p.x + desplazamientoLocal), y: p.y };
    const enganchado = pullHaciaJugada(conShift.x, conShift.y, eventoActual.equipo === 'local');
    return { ...p, x: limiteX(enganchado.x), y: limiteY(enganchado.y) };
  });
  const posicionesVisitante = posicionesVisitanteBase.map((p) => {
    const conShift = { x: limiteX(p.x + desplazamientoVisitante), y: p.y };
    const enganchado = pullHaciaJugada(conShift.x, conShift.y, eventoActual.equipo === 'visitante');
    return { ...p, x: limiteX(enganchado.x), y: limiteY(enganchado.y) };
  });
  const todasLasPosiciones = [...posicionesLocal, ...posicionesVisitante];

  // Quién "tiene la pelota" en este evento puntual — se dibuja pegado a
  // la pelota en vez de en su lugar fijo en la formación (ver comentario
  // grande de arriba de archivo: explícito en gol/falta/penal, aproximado
  // por cercanía en el resto de juego abierto, CON continuidad respecto
  // del portador anterior — ver "SEGUNDA CORRECCIÓN" arriba de archivo).
  // El infractor de una tarjeta no está con la pelota (está defendiendo),
  // así que a ese sólo se lo resalta en su lugar fijo con un anillo de
  // color.
  const posicionesDelEquipoDelEvento = eventoActual.equipo === 'local' ? posicionesLocal : posicionesVisitante;
  let jugadorConPelota: Jugador | undefined;
  if (TIPOS_PATEADOR_EXPLICITO.has(eventoActual.tipo) && eventoActual.jugadorId) {
    jugadorConPelota = todasLasPosiciones.find((p) => p.jugador.id === eventoActual.jugadorId)?.jugador
      ?? clubDelEvento?.plantel.find((j) => j.id === eventoActual.jugadorId);
  } else if (TIPOS_PORTADOR_APROXIMADO.has(eventoActual.tipo)) {
    const huboSalto = indiceProcesadoRef.current !== -1 && indiceProcesadoRef.current !== indice - 1;
    const previo = huboSalto ? null : carrierRef.current;
    const puedeContinuar = previo != null
      && previo.equipo === eventoActual.equipo
      && TIPOS_CONTINUACION_DE_CONDUCCION.has(eventoActual.tipo);
    const posicionPrevio = puedeContinuar
      ? posicionesDelEquipoDelEvento.find((p) => p.jugador.id === previo!.id)
      : undefined;
    if (posicionPrevio) {
      // Zona de tolerancia ~2 pasos de zona (ver ZONAS/ANCHO_CANCHA arriba
      // de archivo): si el jugador que ya tenía la pelota sigue siendo una
      // aproximación razonable al nuevo punto, se lo mantiene a ÉL en vez
      // de recalcular el más cercano — así una corrida de varios eventos
      // se ve como la MISMA persona corriendo, no como una posta al azar.
      const pasoDeZona = (ANCHO_CANCHA - MARGEN * 2) / (ZONAS - 1);
      const distanciaPrevio = Math.hypot(posicionPrevio.x - x, posicionPrevio.y - y);
      jugadorConPelota = distanciaPrevio <= pasoDeZona * 2 ? posicionPrevio.jugador : undefined;
    }
    if (!jugadorConPelota) {
      jugadorConPelota = jugadorMasCercano(posicionesDelEquipoDelEvento, x, y);
    }
  }
  // Sólo se actualiza la referencia de continuidad en eventos donde
  // efectivamente se resolvió (o se supo explícitamente que no hay)
  // portador — tarjeta/cambio no tocan esto, para que una amonestación en
  // medio de una corrida no rompa la continuidad del jugador que sigue
  // corriendo con la pelota.
  if (TIPOS_PATEADOR_EXPLICITO.has(eventoActual.tipo) || TIPOS_PORTADOR_APROXIMADO.has(eventoActual.tipo)) {
    carrierRef.current = jugadorConPelota ? { id: jugadorConPelota.id, equipo: eventoActual.equipo } : null;
    indiceProcesadoRef.current = indice;
  }
  const idConPelota = jugadorConPelota?.id;
  const idTarjeta = (eventoActual.tipo === 'tarjeta_amarilla' || eventoActual.tipo === 'tarjeta_roja')
    ? eventoActual.jugadorId
    : undefined;
  const colorTarjeta = eventoActual.tipo === 'tarjeta_roja' ? '#ef4444' : '#eab308'; // red-500 / yellow-500
  const glowPelota = esRemate ? 0.5 : 0.25;

  return (
    <div className="h-screen text-neutral-200 font-sans p-4 flex flex-col gap-3 overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 20%, #10141d 0%, #05070c 70%)' }}>
      {/* eslint-disable-next-line react/no-danger -- keyframes propios del componente, no hay forma más simple de inyectarlos sin CSS global */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_EFECTOS }} />

      <header className="flex items-center justify-between topbar-entrada">
        <h1 className="font-bold">Repaso del partido — Fecha {partido.fecha}</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMinimizado((m) => !m)}
            className="text-sm text-neutral-400 hover:text-neutral-200"
          >
            {minimizado ? '⛶ Ver cancha' : '— Minimizar'}
          </button>
          <button type="button" onClick={onCerrar} className="text-sm text-neutral-400 hover:text-neutral-200">
            ← Volver
          </button>
        </div>
      </header>

      {/* Marcador — pill flotante con escudos (iniciales, no hay imágenes
          de club reales), estilo premium (documento sección 6.1). Se
          pulsa en cada gol (documento sección 6.2). */}
      <div
        className="self-center flex items-center gap-3 px-4 py-2 rounded-2xl border border-white/10 shadow-lg"
        style={{ background: 'rgba(12,16,26,0.62)', backdropFilter: 'blur(14px)', animation: pulse ? 'vp-score-pulse 0.6s ease' : undefined }}
      >
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white" style={{ background: `linear-gradient(160deg, ${COLOR_LOCAL}, ${COLOR_LOCAL_OSCURO})` }}>
          {inicialesClub(local?.nombre)}
        </div>
        <span className="text-xs font-bold uppercase tracking-wide truncate max-w-[9rem]">{local?.nombre ?? partido.localId}</span>
        <span className="font-black text-lg px-2.5 py-0.5 rounded-lg bg-white/10 tabular-nums tracking-wider">
          {golesLocal}&nbsp;–&nbsp;{golesVisitante}
        </span>
        <span className="text-xs font-bold uppercase tracking-wide text-neutral-400 truncate max-w-[9rem]">{visitante?.nombre ?? partido.visitanteId}</span>
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white" style={{ background: `linear-gradient(160deg, ${COLOR_VISITA}, ${COLOR_VISITA_OSCURO})` }}>
          {inicialesClub(visitante?.nombre)}
        </div>
        <span className="text-xs font-bold tabular-nums min-w-[2.5rem] text-center" style={{ color: COLOR_ACENTO }}>
          {formatoMinuto(eventoActual.minuto, eventoActual.minutoAgregado)}
        </span>
      </div>

      {/* visualizador-partidos-diseno.md sección 2.1: la fricción real de
          usuarios de FM26 fue estar forzado a la vista 2D — acá se puede
          minimizar a sólo el ticker de texto (más abajo) sin perder
          controles ni el repaso en curso. */}
      {!minimizado && (
        <div ref={areaDisponibleRef} className="flex-1 min-h-0 flex items-center justify-center">
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            width: cajaCancha.ancho,
            height: cajaCancha.alto,
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
            animation: shake ? 'vp-shake 0.45s ease' : undefined,
          }}
        >
          {/* Cámara: tilt cenital sutil (documento 6.1: "no perspectiva 3D
              ni cámara de transmisión televisiva realista") + zoom. El
              tamaño real (ancho/alto en píxeles) ya lo definió el wrapper
              de afuera vía `cajaCancha` (ver comentario grande del
              ResizeObserver más arriba) — acá sólo queda ocupar el 100%
              de eso, no recalcular una relación de aspecto propia. */}
          <div
            className="relative rounded-2xl overflow-hidden border-2 w-full h-full"
            style={{
              borderColor: 'rgba(23,179,82,0.35)',
              // 9deg -> 13deg (pedido explícito: "se ven más 3D") — sigue
              // siendo la misma cámara cenital inclinada de 6.1 (no pasa a
              // ser una perspectiva de transmisión de TV), sólo un poco más
              // marcada para que la profundidad se note más de un vistazo.
              transform: tiltFlat ? 'perspective(1400px) rotateX(0deg)' : 'perspective(1400px) rotateX(13deg)',
              transformOrigin: '50% 100%',
              transition: 'transform .5s ease',
            }}
          >
            <div style={{ transform: `scale(${zoomNivel})`, transformOrigin: '50% 50%', transition: 'transform .4s ease', width: '100%', height: '100%' }}>
              <div ref={contenedorRef} className="w-full h-full">
                <Stage width={cajaCancha.ancho} height={cajaCancha.alto} scale={{ x: escalaStage, y: escalaStage }} listening={false}>
                  <Layer ref={layerRef}>
                    {/* Franjas de césped (documento 6.1: "el clásico cortado a
                        franjas de estadio real"). */}
                    {Array.from({ length: FRANJAS_CESPED }, (_, i) => {
                      const x0 = MARGEN - 4 + ((ANCHO_CANCHA - MARGEN * 2 + 8) / FRANJAS_CESPED) * i;
                      const ancho = (ANCHO_CANCHA - MARGEN * 2 + 8) / FRANJAS_CESPED;
                      return <Rect key={i} x={x0} y={0} width={ancho + 1} height={ALTO_CANCHA} fill={i % 2 === 0 ? CESPED_A : CESPED_B} />;
                    })}

                    {/* Marcas de cancha — puramente decorativas, no reflejan tracking real. */}
                    <Rect x={MARGEN} y={MARGEN} width={ANCHO_CANCHA - MARGEN * 2} height={ALTO_CANCHA - MARGEN * 2} stroke="rgba(255,255,255,0.92)" strokeWidth={2} />
                    <Line points={[ANCHO_CANCHA / 2, MARGEN, ANCHO_CANCHA / 2, ALTO_CANCHA - MARGEN]} stroke="rgba(255,255,255,0.92)" strokeWidth={2} />
                    <Circle x={ANCHO_CANCHA / 2} y={ALTO_CANCHA / 2} radius={55} stroke="rgba(255,255,255,0.92)" strokeWidth={2} />
                    <Circle x={ANCHO_CANCHA / 2} y={ALTO_CANCHA / 2} radius={2.4} fill="white" />
                    <Rect x={MARGEN} y={ALTO_CANCHA / 2 - 90} width={90} height={180} stroke="rgba(255,255,255,0.92)" strokeWidth={2} />
                    <Rect x={ANCHO_CANCHA - MARGEN - 90} y={ALTO_CANCHA / 2 - 90} width={90} height={180} stroke="rgba(255,255,255,0.92)" strokeWidth={2} />

                    {/* Arcos (pedido explícito: "no se ve cuando patean al
                        arco") — antes no había ninguna marca del arco en sí,
                        sólo el área grande/chica; sin un objetivo dibujado, un
                        remate no tenía "adónde" verse llegando. Línea corta y
                        gruesa sobre la línea de meta, mismo ancho que usa
                        `puntoDeArco` para apuntar los remates. */}
                    <Line
                      points={[MARGEN, ALTO_CANCHA / 2 - ANCHO_ARCO_PX, MARGEN, ALTO_CANCHA / 2 + ANCHO_ARCO_PX]}
                      stroke="rgba(255,255,255,0.95)"
                      strokeWidth={4}
                    />
                    <Line
                      points={[ANCHO_CANCHA - MARGEN, ALTO_CANCHA / 2 - ANCHO_ARCO_PX, ANCHO_CANCHA - MARGEN, ALTO_CANCHA / 2 + ANCHO_ARCO_PX]}
                      stroke="rgba(255,255,255,0.95)"
                      strokeWidth={4}
                    />

                    {/* Trayectoria de la pelota (documento 6.1, toggle
                        "mostrar/ocultar trayectorias"). */}
                    {showTrails && trail.length > 1 && (
                      <Line points={trail.flatMap((t) => [t.x, t.y])} stroke={`${COLOR_ACENTO}59`} strokeWidth={2} dash={[1, 4]} />
                    )}

                    {/* Fase 3 — los 22 (o menos) jugadores (documento sección 6):
                        UN SOLO `.map()` sobre TODOS, no dos listas separadas (ver
                        el comentario grande de arriba de archivo — separarlos era
                        justo lo que causaba el teletransporte en cada cambio de
                        posesión). El que tiene la pelota en este evento puntual se
                        ordena AL FINAL del array (no se saca ni se filtra) sólo
                        para que se dibuje arriba del resto (z-order) — reordenar
                        un array no desmonta nada en React mientras la `key` se
                        mantenga, así que el nodo de Konva y su tween siguen
                        siendo el mismo de siempre. */}
                    {[...todasLasPosiciones]
                      .sort((a, b) => (a.jugador.id === idConPelota ? 1 : 0) - (b.jugador.id === idConPelota ? 1 : 0))
                      .map((p) => {
                        const esTarjeta = p.jugador.id === idTarjeta;
                        const conPelota = p.jugador.id === idConPelota;
                        const etiquetaChica = p.jugador.dorsal != null ? String(p.jugador.dorsal) : p.jugador.posicion;
                        const nombreCompleto = p.jugador.dorsal != null ? `#${p.jugador.dorsal} ${p.jugador.nombre}` : p.jugador.nombre;
                        return (
                          <Jugador2D
                            key={p.jugador.id}
                            jugadorId={p.jugador.id}
                            x={conPelota ? limiteX(x) : p.x}
                            y={conPelota ? limiteY(y + 9) : p.y}
                            nodosRef={nodosJugadoresRef}
                            tramosRef={tramosJugadoresRef}
                            duracionBaseRef={duracionJugadoresRef}
                            colorRelleno={conPelota ? colorEquipo : esTarjeta ? colorTarjeta : (posicionesLocal.includes(p) ? `${COLOR_LOCAL}8c` : `${COLOR_VISITA}8c`)}
                            colorBorde={conPelota ? COLOR_ACENTO : esTarjeta ? colorTarjeta : 'rgba(255,255,255,0.5)'}
                            anchoBorde={conPelota ? 2 : esTarjeta ? 2.5 : 1}
                            etiqueta={conPelota ? nombreCompleto : etiquetaChica}
                            mostrarEtiqueta={conPelota || showNombres}
                            festejando={p.jugador.id === festejandoId}
                            fase={fasePseudoAleatoria(p.jugador.id)}
                            conPelota={conPelota}
                          />
                        );
                      })}

                    {/* Pelota: halo dorado permanente (documento 6.2: "la
                        pelota además lleva un glow sutil permanente... que se
                        intensifica un poco con la altura/velocidad"), sombra,
                        cuerpo con gradiente esférico + brillo (pedido
                        explícito: "más estilo 3D") y un anillo del color de
                        quién la tiene — balón resaltado (documento 6: "para
                        que el ojo lo siga sin ambigüedad"). Arquea de verdad
                        en vuelo (ver Pelota más arriba en el archivo). */}
                    <Pelota
                      x={xPelota}
                      y={yPelota}
                      duracionMs={duracionMs}
                      colorEquipo={colorEquipo}
                      glowPelota={glowPelota}
                      conDesvio={esRemate && !vaAlArco}
                    />

                    {/* Íconos puntuales por tipo de evento (pedido
                        explícito: "mejorar el resto de animaciones de
                        todos los eventos") — antes sólo el ticker de
                        texto los distinguía; ahora cada uno deja una
                        marca propia en la cancha. `key={indice}` fuerza
                        que vuelva a montar (y a hacer el "pop") en cada
                        evento nuevo, aunque el tipo se repita seguido. */}
                    {(eventoActual.tipo === 'tarjeta_amarilla' || eventoActual.tipo === 'tarjeta_roja') && (
                      <IconoEvento
                        key={indice}
                        x={limiteX(x)}
                        y={y - 16}
                        texto={eventoActual.tipo === 'tarjeta_roja' ? '🟥' : '🟨'}
                        color={colorTarjeta}
                      />
                    )}
                    {eventoActual.tipo === 'fuera_de_juego' && (
                      <IconoEvento key={indice} x={limiteX(x)} y={y - 16} texto="🚩" color="rgba(255,255,255,0.6)" />
                    )}
                    {eventoActual.tipo === 'falta' && (
                      <IconoEvento key={indice} x={limiteX(x)} y={y - 20} texto="✋" color="rgba(255,255,255,0.6)" />
                    )}
                    {eventoActual.tipo === 'cambio' && (
                      <IconoEvento
                        key={indice}
                        x={ANCHO_CANCHA / 2}
                        y={eventoActual.equipo === 'local' ? MARGEN - 14 : ALTO_CANCHA - MARGEN + 14}
                        texto="🔄"
                        color={colorEquipo}
                      />
                    )}
                    {/* Córner/penal (pedido explícito: "más animaciones...
                        dopamínicas") — antes eran los únicos dos tipos de
                        remate sin marca propia en la cancha, sólo se
                        distinguían por el texto del ticker. */}
                    {eventoActual.tipo === 'corner' && (
                      <IconoEvento key={indice} x={limiteX(x)} y={y - 16} texto="CK" color={colorEquipo} />
                    )}
                    {eventoActual.tipo === 'penal' && (
                      <IconoEvento key={indice} x={limiteX(x)} y={y - 16} texto="PK" color={COLOR_ACENTO} />
                    )}
                  </Layer>
                </Stage>
              </div>
            </div>
          </div>

          {/* Destello del gol (blanco-dorado) o de la roja (blanco-rojo) —
              mismo div/keyframe para los dos, sólo cambia el tinte según
              `flashTipo` (ver el comentario del payoff de roja más
              arriba). */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: flashTipo === 'roja'
                ? 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(239,68,68,0.4) 45%, rgba(255,255,255,0) 75%)'
                : 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,214,10,0.35) 45%, rgba(255,255,255,0) 75%)',
              opacity: 0,
              animation: flashTipo ? 'vp-flash 0.7s ease-out' : undefined,
            }}
          />

          {/* Confetti del gol (documento 6.2). */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
            {confeti.map((p) => (
              <div
                key={p.id}
                className="absolute -top-2.5"
                style={{
                  left: `${p.left}%`,
                  width: 7,
                  height: 11,
                  opacity: 0.95,
                  borderRadius: p.redondo ? '50%' : 2,
                  background: p.color,
                  animation: `vp-confetti-fall ${p.dur}s cubic-bezier(.25,.46,.45,.94) ${p.delay}s forwards`,
                  ['--vp-drift' as string]: `${p.drift}px`,
                  ['--vp-spin' as string]: `${p.spin}deg`,
                }}
              />
            ))}
          </div>

          {/* Toast "¡GOL!" (documento 6.2: entrada elástica). */}
          {toast && (
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full font-extrabold text-sm pointer-events-none"
              style={{
                background: `linear-gradient(120deg, ${COLOR_ACENTO}, #f59e0b)`,
                color: '#1a1200',
                letterSpacing: '1.5px',
                textShadow: '0 2px 10px rgba(255,180,0,0.6)',
                boxShadow: '0 6px 26px rgba(255,214,10,0.45)',
                animation: 'vp-goal-toast 1.8s cubic-bezier(.34,1.56,.64,1) forwards',
              }}
            >
              ¡GOOOL! ⚡
            </div>
          )}

          {/* Panel lateral: mostrar/ocultar nombres y trayectorias
              (documento 6.1). */}
          <div
            className="absolute top-3 right-3 flex flex-col gap-1.5 p-1.5 rounded-xl border border-white/10"
            style={{ background: 'rgba(12,16,26,0.62)', backdropFilter: 'blur(14px)' }}
          >
            <button
              type="button"
              title="Mostrar/ocultar nombres"
              onClick={() => setShowNombres((v) => !v)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${showNombres ? 'bg-sky-500/25 text-sky-300' : 'text-neutral-400 hover:bg-white/10'}`}
            >
              Aa
            </button>
            <button
              type="button"
              title="Mostrar/ocultar trayectorias"
              onClick={() => setShowTrails((v) => !v)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${showTrails ? 'bg-sky-500/25 text-sky-300' : 'text-neutral-400 hover:bg-white/10'}`}
            >
              ~
            </button>
          </div>
        </div>
        </div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 min-h-[3.5rem] flex items-center justify-center text-center">
        <p className="text-sm font-semibold" style={{ color: colorEquipo }}>
          {descripcionEvento(eventoActual, clubDelEvento)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="range"
          min={0}
          max={eventos.length - 1}
          value={indice}
          onChange={(e) => { setReproduciendo(false); setIndice(Number(e.target.value)); }}
          className="w-full"
        />
        <div className="flex items-center justify-center gap-1">
          {VELOCIDADES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVelocidad(v)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${velocidad === v ? 'bg-orange-500 text-black' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
            >
              {v}x
            </button>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => { setReproduciendo(false); setIndice((i) => Math.max(0, i - 1)); }}
            disabled={indice === 0}
            className="bg-neutral-800 disabled:text-neutral-600 hover:bg-neutral-700 rounded-lg px-3 py-2 text-sm"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={() => {
              if (indice >= eventos.length - 1) {
                setIndice(0);
                setReproduciendo(true);
                return;
              }
              setReproduciendo((r) => !r);
            }}
            className="bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg px-5 py-2 text-sm"
          >
            {reproduciendo ? 'Pausar' : indice >= eventos.length - 1 ? 'Reiniciar' : 'Reproducir'}
          </button>
          <button
            type="button"
            onClick={() => { setReproduciendo(false); setIndice((i) => Math.min(eventos.length - 1, i + 1)); }}
            disabled={indice >= eventos.length - 1}
            className="bg-neutral-800 disabled:text-neutral-600 hover:bg-neutral-700 rounded-lg px-3 py-2 text-sm"
          >
            Siguiente →
          </button>
          <button
            type="button"
            onClick={() => { setReproduciendo(false); setIndice(proximoGolIdx); }}
            disabled={proximoGolIdx === -1}
            className="bg-neutral-800 disabled:text-neutral-600 hover:bg-neutral-700 rounded-lg px-3 py-2 text-sm"
          >
            ⏭ Próximo gol
          </button>
          <span className="w-px h-6 bg-neutral-700 mx-1" />
          <button
            type="button"
            title="Cámara: cenital inclinada / plana"
            onClick={() => setTiltFlat((v) => !v)}
            className={`rounded-lg px-3 py-2 text-sm ${tiltFlat ? 'bg-sky-500/25 text-sky-300' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'}`}
          >
            📷
          </button>
          <button
            type="button"
            title="Alejar"
            onClick={() => setZoomNivel((z) => Math.max(1, z - 0.15))}
            className="bg-neutral-800 hover:bg-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-400"
          >
            −
          </button>
          <button
            type="button"
            title="Acercar"
            onClick={() => setZoomNivel((z) => Math.min(1.6, z + 0.15))}
            className="bg-neutral-800 hover:bg-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-400"
          >
            +
          </button>
        </div>
        <p className="text-center text-xs text-neutral-500">
          Jugada {indice + 1} de {eventos.length}
        </p>
      </div>
    </div>
  );
}
