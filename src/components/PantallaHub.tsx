// Hub principal — rediseño (pedido explícito: investigar UI de FIFA/EA FC
// y Football Manager 26 para rediseñar los menús "con muchas animaciones
// y sensación adictiva"; ver docs/rediseno-ui-menus-animado.md y los dos
// mockups adjuntos — v1 y v2, este último reordenado según un boceto del
// usuario). Reemplaza al viejo `VistaPlantel` de App.tsx.
//
// CAMBIOS DE LA v2 (pedido explícito, sobre la v1 ya implementada):
//  - El botón de avanzar semana pasa a ser EL botón principal, arriba a la
//    derecha — reusa `useProximaSemana` (hooks/useProximaSemana.ts, sacado
//    de PantallaCalendario para no duplicar el switch por competencia).
//  - Se suma la tira de semanas mini (TiraSemanas/FechaActual, REUSADAS
//    tal cual de PantallaCalendario — mismo marcador deslizante, no una
//    reimplementación aparte).
//  - Tarjeta con flip 3D: cara frontal el once inicial (mini cancha), cara
//    trasera el próximo partido — "Simular partido" dispara la simulación
//    REAL de esa fecha (no un mock) y al terminar muestra el resultado con
//    un botón que abre el visualizador 2D de verdad (PantallaDetallePartido
//    ya existente, mismo patrón que usa PantallaLiga).
//  - Panel de noticias: PLACEHOLDER a propósito, sin contenido — pedido
//    explícito del usuario ("panel de noticias... esperá que te digo cómo
//    hacer"), reservado para cuando dé el resto de la especificación.
//  - Los tiles bajan de posición y ahora entran deslizando desde la
//    izquierda (antes desde abajo) y son REPLAYABLES: cada vez que se
//    simula una semana, vuelven a jugar la entrada escalonada (mismo
//    truco que el mockup: `key` que cambia fuerza el remount).
//
// Nota de honestidad (mismo criterio que el resto del proyecto, ver
// comentarios de engine/calendario.ts y PantallaVisualizadorPartido.tsx):
// el mockup mostraba 3 barras de "Ingresos/Sueldos/Gastos" de la semana
// con números inventados para la demo — el motor real NO calcula un
// desglose semanal de economía (sólo presupuesto acumulado + sueldos de
// temporada, y el resto se liquida una vez al año en fin de temporada).
// Se deja el panel de finanzas con datos 100% reales (presupuesto + sueldos
// de temporada) en vez de fabricar ingresos/gastos semanales que no existen
// en la simulación.
//
// CAMBIOS DE LA v3 (pedido explícito, sobre la v2 ya implementada):
//  - Nueva fila de "Accesos rápidos" debajo de la topbar con todas las
//    secciones del juego (antes vivían como pills sueltas en la topbar,
//    ahora quedan agrupadas acá y la topbar se simplifica).
//  - El placeholder fijo de "Panel de noticias" pasa a ser un CARRUSEL de
//    4 paneles (Noticias/Tabla/Perfil/Finanzas) con flechas, puntos de
//    navegación y rotación automática pausable al pasar el mouse — mismo
//    patrón que el mockup v3.
//  - El panel de finanzas (presupuesto + sueldos) deja de ser una franja
//    fija aparte y pasa a vivir sólo dentro del slide "Finanzas" del
//    carrusel.
//  - Nota de honestidad otra vez: el slide de "Noticias" NO es el sistema
//    de noticias real (el usuario pidió esperar para especificarlo aparte,
//    ver tarea #44) — muestra un resumen armado con datos que YA existen
//    (próximo partido, ofertas de cantera pendientes, lesionados), no
//    rumores ni resultados de otros clubes inventados.

import {
  Fragment, useEffect, useRef, useState,
} from 'react';
import { useGameStore } from '../store/useGameStore';
import { calcularSalarioJusto, puedeRenovar, TOPE_PLANTEL } from '../engine/contratos';
import { multiplicadorSalarialDeLiga } from '../engine/economiaLigas';
import { calcularTabla, proximaFechaSinJugar } from '../engine/fixture';
import { formatoMonto, inicialesClub } from '../utils/formato';
import { BarraFinanzas, BarraMini } from './BarraFinanzas';
import { useProximaSemana } from '../hooks/useProximaSemana';
import { FechaActual, TiraSemanas } from './PantallaCalendario';
import { PantallaDetallePartido } from './PantallaDetallePartido';
import { NegociacionRenovacion } from './NegociacionRenovacion';
import { BarraIdolatria } from './BarraIdolatria';
import { TrofeoIcon } from './TrofeoIcon';
import { trofeoDeCompetencia } from '../data/trofeos';
import { FORMACIONES, type NombreFormacion, type SlotFormacion } from '../data/formaciones';
import { claseCirculo } from '../data/coloresPosicion';
import { calcularApodo, type CarreraDT } from '../engine/carreraDT';
import type { EntradaCalendario } from '../engine/calendario';
import type {
  Club, GolPartido, Jugador, NoticiaItem, Partido, Posicion,
} from '../types';

// Conteo animado (documento de investigación, sección 3.3: "los números
// no aparecen, cuentan hasta el valor final — se siente ganado, no
// impreso"). Anima desde el valor ANTERIOR (no desde 0 cada vez que se
// re-renderiza), así un cambio real de presupuesto se lee como un ajuste
// puntual, no como un contador que arranca de cero todo el tiempo.
function useConteo(valorObjetivo: number, duracionMs = 700): number {
  const [valor, setValor] = useState(valorObjetivo);
  const previoRef = useRef(valorObjetivo);
  const montadoRef = useRef(false);

  useEffect(() => {
    const desde = montadoRef.current ? previoRef.current : 0;
    montadoRef.current = true;
    previoRef.current = valorObjetivo;
    if (desde === valorObjetivo) {
      setValor(valorObjetivo);
      return undefined;
    }
    const inicio = performance.now();
    let frame = 0;
    const paso = (ahora: number) => {
      const p = Math.min(1, (ahora - inicio) / duracionMs);
      const ease = 1 - (1 - p) ** 3;
      setValor(Math.round(desde + (valorObjetivo - desde) * ease));
      if (p < 1) frame = requestAnimationFrame(paso);
    };
    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [valorObjetivo, duracionMs]);

  return valor;
}

function ChipTile({ texto, color }: { texto: string; color: string }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${color}`}>
      {texto}
    </span>
  );
}

// Tarjeta de carrera del DT, versión mini para el Hub (pedido explícito,
// mostrando un mockup: "asi lo quiero acomodalo para que quede bien" —
// reemplaza al cluster de 3 números que había antes, muy angosto para
// mostrar el nombre/apodo/país del DT). Versión reducida de
// TarjetaCarreraDT de PantallaPerfilDT.tsx: mismo hero (GRL/nombre/tag DT/
// país) + Partidos/Goles + barra de idolatría con niveles + vitrina, pero
// todo más compacto (pedido explícito: "hacelo mas chico... no como esta
// en el otro menu para que entre todo") — la columna de al lado (accesos +
// tira de semanas) mide bastante menos que la tarjeta completa de
// PantallaPerfilDT.tsx, y como el grid de arriba usa `items-stretch`,
// dejar la tarjeta tan alta como allá le abría un hueco vacío a la
// columna de accesos en vez de quedar simétrico.
function TarjetaCarreraDTMini({
  carrera, club, onClick,
}: { carrera: CarreraDT; club: Club; onClick: () => void }) {
  const apodo = calcularApodo(carrera);
  const { dt } = club;
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-neutral-900 border border-neutral-800 hover:border-orange-500/60 rounded-xl p-3.5 flex flex-col justify-between gap-3 transition-colors"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center font-black text-lg bg-orange-500/20 text-orange-400">
            {dt.reputacion}
          </div>
          <span className="text-[7px] font-bold uppercase tracking-widest text-neutral-500">GRL</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-base truncate">{dt.nombre}</span>
            <span className="text-[9px] font-bold uppercase tracking-wide text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded shrink-0">DT</span>
          </div>
          <p className="text-xs text-neutral-500 truncate">
            {apodo ? <span className="text-orange-400 font-medium">&ldquo;{apodo.apodo}&rdquo; · </span> : null}
            {dt.nacionalidad ? `${dt.nacionalidad} · ` : ''}DT de {club.nombre}
          </p>
        </div>
        {/* Partidos/Goles (pedido explícito: "pone los cuadrados de
            partidos y goles a la derecha del nombre del dt y grl ponele
            emojis") — mismos íconos que ya usa el resto del Hub para estos
            conceptos (⚽ resultado/partido, 🥅 goles, ver
            CATEGORIA_ICONO más abajo). */}
        <div className="flex gap-2 shrink-0">
          <div className="bg-neutral-950 rounded-lg px-3 py-2 text-center">
            <p className="text-xl font-black tabular-nums leading-none">⚽ {carrera.partidosDirigidos}</p>
            <p className="text-[8px] uppercase tracking-wide text-neutral-500 mt-1">Partidos</p>
          </div>
          <div className="bg-neutral-950 rounded-lg px-3 py-2 text-center">
            <p className="text-xl font-black tabular-nums leading-none">🥅 {carrera.golesAFavorCarrera ?? 0}</p>
            <p className="text-[8px] uppercase tracking-wide text-neutral-500 mt-1">Goles</p>
          </div>
        </div>
      </div>

      <BarraIdolatria idolatria={carrera.idolatria} />

      {/* Vitrina (pedido explícito, mostrando una tarjeta de referencia:
          "mejor que se vean mas grandes los trofeos... que la
          informacion de cuando la ganaste sea en el panel de dt mejor")
          — acá sólo el desfile de trofeos grandes, uno por título (los
          repetidos aparecen dos veces, como en la referencia); el
          detalle de en qué temporada/con qué club se ganó cada uno vive
          en la vitrina de PantallaPerfilDT.tsx, no acá. */}
      <div className="border-t border-neutral-800 pt-2">
        {carrera.titulos.length === 0 ? (
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-600">
            <span className="text-base grayscale opacity-40">🏆</span> Vitrina vacía
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {carrera.titulos.map((t, i) => (
              <div key={`${t.competencia}-${t.temporada}-${i}`} className="w-9 h-11 shrink-0">
                <TrofeoIcon {...trofeoDeCompetencia(t.competencia)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// Widget-resumen cuadrado (pedido explícito: "quiero los widgets que
// queden cuadraditos... solo información corta y importante") — ícono +
// un número/texto corto, nada de detalle (el detalle vive en su propia
// pantalla ahora, ver PantallaPlantelPropio). Rojo cuando hay algo
// urgente para ese widget.
function WidgetCuadrado({
  icono, texto, urgente, onClick,
}: { icono: string; texto: string; urgente: boolean; onClick?: () => void }) {
  const clases = `w-20 h-20 shrink-0 rounded-xl border flex flex-col items-center justify-center gap-1 text-center px-1.5 transition-colors ${
    urgente ? 'border-red-500/50 bg-red-500/10' : 'border-neutral-800 bg-neutral-900'
  } ${onClick ? 'hover:border-orange-500 cursor-pointer' : ''}`;
  const contenido = (
    <>
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm leading-none ${urgente ? 'bg-red-500/15' : 'bg-neutral-800'}`}>
        {icono}
      </span>
      <span className="text-[10px] font-bold leading-tight truncate max-w-full">{texto}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={clases}>
        {contenido}
      </button>
    );
  }
  return <div className={clases}>{contenido}</div>;
}

// Renovación rápida desde Plantel (pedido explícito, ver
// docs/sistema-oferta-fichajes.md sección 6): cuando puedeRenovar(jugador)
// es true, la fila muestra una etiqueta "Contrato: N años — renovar" que
// abre la negociación en un modal encima de la lista, sin navegar al
// perfil completo. `onRenovar` es opcional — FilaJugador también se usa
// para clubes rivales (PantallaPlantelClub), donde nunca se puede
// renovar a nadie.
function FilaJugadorHub({
  jugador, onClick, onRenovar,
}: { jugador: Jugador; onClick: () => void; onRenovar?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center justify-between gap-2 py-1.5 px-1 rounded hover:bg-neutral-800/60 transition-colors text-sm"
    >
      <span className="truncate">
        <span className="text-neutral-500">{jugador.posicion}</span> — {jugador.nombre}
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        {onRenovar && puedeRenovar(jugador) && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onRenovar(); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onRenovar(); } }}
            className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 hover:bg-orange-500/25"
          >
            Contrato: {jugador.contratoAniosRestantes} año{jugador.contratoAniosRestantes > 1 ? 's' : ''} — renovar
          </span>
        )}
        <span className="text-xs text-neutral-500 tabular-nums">GRL {jugador.grl}</span>
      </span>
    </button>
  );
}

// Mini cancha del once inicial (cara frontal de la tarjeta flip) —
// REDISEÑO (pedido explícito): antes agrupaba a los titulares en 4 filas
// genéricas (ARQ/DEF/MED/DEL) sin coordenadas reales; ahora usa las
// mismas coordenadas x/y por slot que ya define data/formaciones.ts y
// dibuja PantallaArmarEquipo/SlotCancha — cada jugador aparece en su
// posición real dentro de la formación elegida, con el mismo color por
// posición que el resto del juego (claseCirculo), no una aproximación.
//
// Emparejamiento titular→slot por POSICIÓN NATIVA (no por índice): tras
// una lesión, `reemplazarLesionados` (engine/desgaste.ts) reordena
// `titularesIds` poniendo los reemplazos al final del array, así que
// emparejar por índice con los slots de la formación quedaría
// desalineado — este es el mismo criterio de emparejamiento que ya usa
// PantallaArmarEquipo al cambiar de formación.
function asignarTitularesASlots(club: Club): { slot: SlotFormacion; jugador: Jugador | null }[] {
  const slots = FORMACIONES[club.formacion as NombreFormacion] ?? FORMACIONES['4-4-2'];
  const idsPorPosicion = new Map<Posicion, string[]>();
  club.titularesIds.forEach((id) => {
    const j = club.plantel.find((p) => p.id === id);
    if (!j) return;
    const lista = idsPorPosicion.get(j.posicion) ?? [];
    lista.push(id);
    idsPorPosicion.set(j.posicion, lista);
  });
  return slots.map((slot) => {
    const disponibles = idsPorPosicion.get(slot.posicion) ?? [];
    const id = disponibles.shift();
    const jugador = id ? club.plantel.find((p) => p.id === id) ?? null : null;
    return { slot, jugador };
  });
}

function MiniCancha({ club }: { club: Club }) {
  const asignaciones = asignarTitularesASlots(club);

  return (
    <div className="relative flex-1 rounded-xl border border-emerald-900/50 bg-gradient-to-b from-emerald-950/60 to-neutral-950 overflow-hidden">
      {/* Líneas de cancha (flavor visual, mismo criterio "arquero abajo"
          que data/formaciones.ts) — línea de mitad de cancha + círculo
          central, sutiles para no competir con los jugadores. */}
      <div className="absolute left-0 right-0 top-1/2 border-t border-emerald-100/10" />
      <div className="absolute left-1/2 top-1/2 w-10 h-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-100/10" />

      {asignaciones.map(({ slot, jugador }) => (
        <div
          key={slot.id}
          title={jugador ? `${jugador.nombre} (${jugador.posicion})` : slot.posicion}
          style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
        >
          <div
            className={`w-6 h-6 shrink-0 rounded-full border flex items-center justify-center text-[9px] font-bold ${
              jugador ? claseCirculo(slot.posicion) : 'border-dashed border-yellow-500 text-yellow-400 bg-yellow-500/10'
            }`}
          >
            {jugador ? (jugador.dorsal ?? '?') : '⚠️'}
          </div>
        </div>
      ))}
    </div>
  );
}

// Tarjeta flip (pedido explícito, mockup v2, rediseñada de nuevo por
// pedido explícito: "en vez del botón simular partido que sea ir al
// partido, se da vuelta y ahí sí que sean dos botones"): cara frontal el
// once inicial + info del rival + "Ir al partido" (sólo da vuelta la
// tarjeta, NO simula nada todavía). Cara trasera, ANTES de simular: dos
// botones — "Ver partido" (simula y abre de una el visualizador 2D real
// si es de liga, o navega a la pantalla de la competencia si es
// copa/pretemporada) y "Simular partido" (simula y se queda ACÁ mismo
// mostrando el resultado inline). Después de simular, la cara trasera
// pasa a mostrar el resultado con su propio botón "Ver partido" (revisar
// lo ya jugado, sin disparar una simulación nueva).
//
// Bug reportado ("no aparecen los de copa o champions"): antes esto sólo
// sabía de partidos de LIGA (proximaFecha/rivalProximo eran específicos
// del fixture de liga) — en una semana de copa mostraba "Sin partido"
// aunque hubiera uno. Ahora usa `entradaProxima`/`entradas` (mismo cálculo
// que ya arma useProximaSemana), que cubre CUALQUIER competencia.
// Umbral de diferencia de NC a partir del cual el partido deja de ser
// "parejo" — mismo criterio que UMBRAL_SORPRESA_NC en engine/noticias.ts
// (una sorpresa real necesita esa misma distancia de nivel), reusado acá
// como número, no como import, porque son conceptos vecinos pero
// distintos (uno mide sorpresas post-partido, este mide expectativa
// pre-partido).
const UMBRAL_FAVORITO_NC = 8;

function etiquetaFavorito(diffNc: number): { texto: string; clase: string } {
  if (diffNc >= UMBRAL_FAVORITO_NC) return { texto: 'Favorito', clase: 'text-emerald-400' };
  if (diffNc <= -UMBRAL_FAVORITO_NC) return { texto: 'Difícil', clase: 'text-red-400' };
  return { texto: 'Parejo', clase: 'text-neutral-400' };
}

function TarjetaFlip({
  club, rivalClub, clubes, entradas, entradaProxima, onSimular, onVerPartidoAhora, onVerPartido, onVerEstrategia,
}: {
  club: Club;
  // Rival del PRÓXIMO partido (entradaProxima) — sólo para la info/NC de
  // la cara frontal. El resultado de la cara trasera puede estar
  // mostrando un partido DISTINTO (el que se acaba de jugar, mientras
  // entradaProxima ya apunta al siguiente) — para ESE caso el mini
  // resumen resuelve su propio rival con `clubes` más abajo, no con este
  // prop (bug real encontrado: el mini resumen mostraba "?" en los goles
  // del rival porque buscaba en el club equivocado).
  rivalClub: Club | undefined;
  clubes: Record<string, Club>;
  entradas: EntradaCalendario[];
  entradaProxima: EntradaCalendario | null;
  onSimular: () => void;
  // Simula Y navega directo al visualizador/pantalla de la competencia
  // (pedido explícito: "que sean dos botones de ver partido... y simular
  // partido directamente") — distinto de onVerPartido, que sólo REVISA un
  // partido que YA se jugó (no dispara ninguna simulación nueva).
  onVerPartidoAhora: () => void;
  onVerPartido: (entrada: EntradaCalendario) => void;
  onVerEstrategia: () => void;
}) {
  const [volteada, setVolteada] = useState(false);
  const [entradaJugadaId, setEntradaJugadaId] = useState<string | null>(null);

  // Aviso de 11 incompleto (pedido explícito: "pone escrito en tu once
  // inicial en amarillo y ⚠️ si te falta un jugador... un círculo en 0")
  // — mismo criterio de emparejamiento que MiniCancha (asignarTitularesASlots),
  // no basta con titularesIds.length porque acá importa que CADA slot de
  // la formación tenga alguien, no sólo el conteo total.
  const faltanTitulares = asignarTitularesASlots(club).filter((a) => a.jugador == null).length;

  // Pedido explícito: "en vez del botón simular partido que sea ir al
  // partido, se da vuelta y ahí sí que sean dos botones" — antes un solo
  // click en la cara frontal simulaba Y daba vuelta la tarjeta a la vez;
  // ahora dar vuelta (preview) y simular son dos pasos separados.
  function handleIrAlPartido() {
    if (!entradaProxima) return;
    setVolteada(true);
  }

  function handleSimular() {
    if (!entradaProxima) return;
    setEntradaJugadaId(entradaProxima.id);
    onSimular();
  }

  function handleVerPartidoAhora() {
    if (!entradaProxima) return;
    setEntradaJugadaId(entradaProxima.id);
    onVerPartidoAhora();
  }

  // Bug reportado ("se traba cuando tocás ir a partido y simular"): antes
  // este botón sólo hacía `setVolteada(false)` — `entradaJugadaId` se
  // quedaba pegado en el ÚLTIMO partido simulado para siempre, así que la
  // próxima vez que se volvía a dar vuelta la tarjeta (nuevo click en "Ir
  // al partido") `entradaMostrada` seguía mostrando ESE resultado viejo
  // en vez del próximo partido real — la tarjeta quedaba trabada
  // repitiendo el mismo resultado sin importar cuántas fechas pasaran.
  // Resetear acá (usado tanto por "‹ Volver" como por "✅ Listo") hace que
  // la próxima vuelta ya arranque de cero, siguiendo a `entradaProxima`
  // en vivo otra vez.
  function handleVolver() {
    setEntradaJugadaId(null);
    setVolteada(false);
  }

  function nombreJugadorDelGol(jugadorId: string): string {
    // OJO: el rival del partido MOSTRADO (entradaMostrada) puede ser
    // distinto del rival prop (que sigue a entradaProxima, el PRÓXIMO
    // partido) — ver nota en la firma del componente.
    const rivalDelPartidoMostrado = entradaMostrada?.rivalId ? clubes[entradaMostrada.rivalId] : undefined;
    return club.plantel.find((j) => j.id === jugadorId)?.nombre
      ?? rivalDelPartidoMostrado?.plantel.find((j) => j.id === jugadorId)?.nombre
      ?? '?';
  }

  // La entrada a MOSTRAR sale de buscar por id en `entradas` (prop
  // recalculada en vivo desde el store), no de `entradaProxima` a secas —
  // apenas se simula, el padre ya recalculó "próxima entrada" apuntando a
  // la SIGUIENTE, no a la que se acaba de jugar. Mismo bug real que ya se
  // había encontrado y corregido acá con el prop `rivalProximo` original.
  const entradaMostrada = entradaJugadaId
    ? entradas.find((e) => e.id === entradaJugadaId) ?? entradaProxima
    : entradaProxima;

  return (
    // Bug reportado ("a veces es gigante y le sobra espacio al panel de al
    // lado"): antes era `min-h-[300px]` — con una formación de línea ancha
    // (ej. mediocampo de 5 en un 3-5-2) la tarjeta podía crecer más de lo
    // esperado y desalinear la altura con el carrusel de al lado (la
    // grilla usa items-stretch). Altura FIJA (no mínima) para que nunca
    // crezca de más — el contenido interno se acomoda adentro. Pedido
    // explícito: más angosta (ver grid-cols del hero) y más alta (280→380).
    <div className="flex-1 h-[380px]" style={{ perspective: '1400px' }}>
      <div
        className="relative w-full h-full transition-transform duration-700 ease-out"
        style={{ transformStyle: 'preserve-3d', transform: volteada ? 'rotateY(180deg)' : 'none' }}
      >
        <div
          className="absolute inset-0 rounded-2xl border border-neutral-800 bg-neutral-900 p-3.5 flex flex-col gap-2.5"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className={`text-sm font-semibold truncate ${faltanTitulares > 0 ? 'text-yellow-400' : ''}`}>
              {faltanTitulares > 0 && '⚠️ '}
              Tu once inicial — {club.formacion}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onVerEstrategia}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold px-2.5 py-1.5 rounded-lg"
              >
                🧩 Estrategia
              </button>
              <button
                type="button"
                disabled={entradaProxima == null}
                onClick={handleIrAlPartido}
                className="bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-600 hover:bg-orange-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                Ir al partido ›
              </button>
            </div>
          </div>
          <MiniCancha club={club} />
          {/* Info del próximo rival (pedido explícito: "parece que se
              simula todo y no sabes nada") — antes la cara frontal sólo
              mostraba el once, sin ningún dato del rival hasta DESPUÉS de
              tocar "Simular partido" (recién en la cara trasera). Ahora se
              ve acá abajo, antes de simular nada. */}
          {entradaProxima && (
            <div className="shrink-0 flex items-center justify-between gap-2 rounded-lg bg-neutral-800/50 px-2.5 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 shrink-0 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-[10px] font-black text-black">
                  {inicialesClub(entradaProxima.rivalNombre)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{entradaProxima.rivalNombre ?? 'Rival'}</p>
                  <p className="text-[10px] text-neutral-500 truncate">
                    {entradaProxima.esLocal ? 'Local' : 'Visitante'} · {entradaProxima.competencia}
                  </p>
                </div>
              </div>
              {rivalClub && (
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-neutral-500 tabular-nums">NC {club.nc} vs {rivalClub.nc}</p>
                  <p className={`text-xs font-semibold ${etiquetaFavorito(club.nc - rivalClub.nc).clase}`}>
                    {etiquetaFavorito(club.nc - rivalClub.nc).texto}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="absolute inset-0 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col gap-3"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{entradaMostrada?.jugado ? 'Resultado' : 'Próximo partido'}</h3>
            <button type="button" onClick={handleVolver} className="text-xs text-neutral-400 hover:text-neutral-200">
              ‹ Volver
            </button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-1">
            {entradaMostrada ? (
              <>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-700 flex items-center justify-center text-xl font-black mb-1 text-black">
                  {inicialesClub(entradaMostrada.rivalNombre)}
                </div>
                {entradaMostrada.jugado ? (
                  <>
                    <p className="font-black text-2xl tabular-nums">
                      {entradaMostrada.golesPropios} - {entradaMostrada.golesRival}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {entradaMostrada.esLocal ? 'vs' : '@'} {entradaMostrada.rivalNombre} · {entradaMostrada.competencia}
                    </p>
                    {/* Mini resumen (pedido explícito: "agrega un mini
                        resumen del partido ahí") — quién metió los goles,
                        tal cual los guardó el motor, no un texto aparte
                        inventado. */}
                    {entradaMostrada.goles && entradaMostrada.goles.length > 0 && (
                      <div className="w-full max-h-16 overflow-y-auto text-[11px] leading-relaxed mt-1 px-1">
                        {entradaMostrada.goles.map((g: GolPartido, i) => {
                          const esMiGol = entradaMostrada.esLocal ? g.equipo === 'local' : g.equipo === 'visitante';
                          return (
                            <p key={`${g.jugadorId}-${g.minuto}-${i}`} className={esMiGol ? 'text-emerald-400' : 'text-neutral-500'}>
                              ⚽ {g.minuto}&apos; {nombreJugadorDelGol(g.jugadorId)}
                            </p>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => onVerPartido(entradaMostrada)}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold px-3 py-2 rounded-lg"
                      >
                        🎮 Ver partido
                      </button>
                      <button
                        type="button"
                        onClick={handleVolver}
                        className="bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold px-3 py-2 rounded-lg"
                      >
                        ✅ Listo
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h4 className="font-bold text-lg">{entradaMostrada.rivalNombre}</h4>
                    <p className="text-xs text-neutral-400">
                      {entradaMostrada.esLocal ? 'Local' : 'Visitante'} · {entradaMostrada.competencia}
                    </p>
                    {/* Pedido explícito: acá van los dos botones — "Ver
                        partido" simula Y abre el visualizador de una,
                        "Simular partido" simula y se queda en la tarjeta
                        con el resultado inline (mismo comportamiento de
                        antes). */}
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={handleVerPartidoAhora}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold px-3 py-2 rounded-lg"
                      >
                        🎮 Ver partido
                      </button>
                      <button
                        type="button"
                        onClick={handleSimular}
                        className="bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold px-3 py-2 rounded-lg"
                      >
                        ▶ Simular partido
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-neutral-500">No hay partido pendiente ahora mismo.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Acceso rápido (fila nueva de la v3, reemplaza a las pills sueltas que
// antes vivían en la topbar) — mismo lenguaje visual que el resto
// (hover levanta + borda naranja, feedback inmediato al toque).
function AccesoRapido({
  icono, texto, onClick, badge,
}: {
  icono: string; texto: string; onClick: () => void; badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative shrink-0 w-[74px] flex flex-col items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl px-1 py-2.5 text-neutral-400 hover:-translate-y-0.5 hover:border-orange-500 hover:text-neutral-200 active:scale-95 transition-all duration-150"
    >
      <span className="w-7 h-7 rounded-full bg-neutral-800 group-hover:bg-orange-500/15 flex items-center justify-center text-sm leading-none transition-colors">
        {icono}
      </span>
      <span className="text-[9.5px] font-bold text-center leading-tight">{texto}</span>
      {Boolean(badge) && (
        // Amarillo (pedido explícito, "que salga la notificacion en
        // amarillo en plantel como salen cuando tenes canteranos") —
        // mismo badge para cualquier acceso con pendientes, Cantera y
        // Plantel incluidos, para que se vean igual.
        <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
          {badge}
        </span>
      )}
    </button>
  );
}

// Barra de atributo mini (mismo patrón que BarraStat en
// PantallaPerfilJugador.tsx: arranca en 0% y recién en el próximo frame
// pasa al valor real, así el navegador SÍ anima el `width` — duplicado a
// propósito, es un componente de 6 líneas con un solo uso acá, mismo
// criterio que useConteo).
// Slide "Perfil" rotativo (pedido explícito, bug reportado: "el jugador
// no rota" — antes mostraba siempre al mismo, el de mayor GRL, fijo).
// Rota sola cada 5s entre los mejores jugadores del plantel — timer
// propio (no depende del autoplay del carrusel exterior), mismo patrón
// que el resto de componentes con su propio ciclo de vida acá adentro.
function SlidePerfilRotativo({ jugadores }: { jugadores: Jugador[] }) {
  const [indice, setIndice] = useState(0);

  useEffect(() => {
    if (jugadores.length <= 1) return undefined;
    const id = window.setInterval(() => setIndice((i) => (i + 1) % jugadores.length), 5000);
    return () => window.clearInterval(id);
  }, [jugadores.length]);

  const jugador = jugadores[indice % jugadores.length];
  if (!jugador) return <p className="text-sm text-neutral-500">Sin jugadores en el plantel.</p>;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 flex items-center justify-center text-lg font-black text-orange-400">
        {inicialesClub(jugador.nombre)}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">{jugador.nombre}</p>
        <p className="text-[10px] text-neutral-500">{jugador.posicion} · GRL {jugador.grl}</p>
      </div>
      <div className="w-full">
        <BarraMini label="Ritmo" valor={jugador.subStats?.ritmo ?? jugador.grl} retrasoMs={0} />
        <BarraMini label="Tiro" valor={jugador.subStats?.tiro ?? jugador.grl} retrasoMs={60} />
        <BarraMini label="Pase" valor={jugador.subStats?.pase ?? jugador.grl} retrasoMs={120} />
        <BarraMini label="Físico" valor={jugador.subStats?.fisico ?? jugador.grl} retrasoMs={180} />
      </div>
      {jugadores.length > 1 && (
        <div className="flex items-center gap-1 mt-0.5">
          {jugadores.map((j, i) => (
            <span key={j.id} className={`w-1 h-1 rounded-full ${i === indice ? 'bg-orange-500' : 'bg-neutral-700'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// Carrusel genérico (pedido explícito, mockup v3): reemplaza al
// placeholder fijo de "Panel de noticias" — rota entre los slides que le
// pasen, con flechas, puntos de navegación y autoplay que se pausa al
// pasar el mouse por encima. El contenido de cada slide lo arma
// `PantallaHub` con datos reales (ver slides más abajo) — este componente
// sólo orquesta la rotación, no sabe nada del dominio del juego.
// Modo controlado opcional (pedido explícito: "que se desplacen como en
// noticias" — se reusa este mismo componente para el carrusel de tiles de
// abajo, que necesita poder saltar a un slide puntual desde afuera, ej.
// el acceso rápido "Plantel" de arriba). Sin `indiceControlado`, se
// comporta exactamente igual que antes (estado propio, uncontrolled) —
// cero cambio de comportamiento para el carrusel de Noticias/Tabla/
// Perfil/Finanzas que ya usaba esto.
function Carrusel({
  slides, indiceControlado, onCambiarIndice, alturaClase = 'h-[380px]',
}: {
  slides: { icono: string; titulo: string; contenido: React.ReactNode }[];
  indiceControlado?: number;
  onCambiarIndice?: (indice: number) => void;
  alturaClase?: string;
}) {
  const [indiceInterno, setIndiceInterno] = useState(0);
  const esControlado = indiceControlado !== undefined;
  const indice = esControlado ? indiceControlado : indiceInterno;
  const setIndice = (actualizar: (i: number) => number) => {
    const nuevo = actualizar(indice);
    if (esControlado) onCambiarIndice?.(nuevo);
    else setIndiceInterno(nuevo);
  };
  const pausadoRef = useRef(false);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!pausadoRef.current) setIndice((i) => (i + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, esControlado, indice]);

  return (
    <div
      className={`flex-1 ${alturaClase} rounded-2xl border border-neutral-800 bg-neutral-900 p-4 flex flex-col`}
      onMouseEnter={() => { pausadoRef.current = true; }}
      onMouseLeave={() => { pausadoRef.current = false; }}
    >
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold min-w-0">
          <span className="shrink-0">{slides[indice].icono}</span>
          <span className="truncate">{slides[indice].titulo}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIndice((i) => (i - 1 + slides.length) % slides.length)}
            className="w-5 h-5 rounded-full border border-neutral-800 bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 text-[11px] leading-none flex items-center justify-center transition-colors"
          >
            ‹
          </button>
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.titulo}
                type="button"
                onClick={() => setIndice(() => i)}
                aria-label={s.titulo}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === indice ? 'bg-orange-500 scale-[1.4]' : 'bg-neutral-700'}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIndice((i) => (i + 1) % slides.length)}
            className="w-5 h-5 rounded-full border border-neutral-800 bg-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 text-[11px] leading-none flex items-center justify-center transition-colors"
          >
            ›
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden rounded-lg">
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${indice * 100}%)` }}
        >
          {slides.map((s) => (
            <div key={s.titulo} className="w-full h-full shrink-0 overflow-y-auto">
              {s.contenido}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sistema de noticias (pedido explícito, ver docs/sistema-noticias.md y
// engine/noticias.ts) — un ícono por categoría y un tratamiento visual
// por "peso del evento" (sección 5.1 del documento de rediseño):
// rutinario = fila simple, relevante = borde+glow del acento naranja,
// grande = card propia con badge "GRANDE" (versión acotada del spotlight
// con pausa que describe el documento — un overlay bloqueante para esto
// queda fuera de este alcance, ver nota al usuario).
const ICONO_CATEGORIA_NOTICIA: Record<NoticiaItem['categoria'], string> = {
  resultado: '⚽',
  goleador: '🥅',
  destacado: '⭐',
  fichaje: '💱',
  rumor: '💬',
  joya: '🌱',
  directiva: '🎯',
  contrato: '📋',
};

function FilaNoticia({ noticia }: { noticia: NoticiaItem }) {
  const icono = ICONO_CATEGORIA_NOTICIA[noticia.categoria];
  if (noticia.peso === 'grande') {
    return (
      <div className="rounded-lg border border-orange-500/50 bg-orange-500/10 px-2.5 py-2 mb-2 last:mb-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm">{icono}</span>
          <span className="text-[9px] font-black uppercase tracking-wider text-orange-400">Grande</span>
        </div>
        <p className="text-xs font-semibold text-neutral-100 leading-snug">{noticia.titulo}</p>
        <p className="text-[11px] text-neutral-400 leading-snug mt-0.5">{noticia.cuerpo}</p>
      </div>
    );
  }
  if (noticia.peso === 'relevante') {
    return (
      <div className="border-l-2 border-orange-500/60 pl-2 pb-2 mb-2 last:mb-0 last:pb-0">
        <p className="text-xs font-semibold text-neutral-200 leading-snug">{icono} {noticia.titulo}</p>
        <p className="text-[11px] text-neutral-500 leading-snug">{noticia.cuerpo}</p>
      </div>
    );
  }
  return (
    <p className="text-xs leading-relaxed text-neutral-400 pb-2 border-b border-dashed border-neutral-800 last:border-b-0">
      {icono} {noticia.esRumor ? <span className="italic">{noticia.cuerpo}</span> : noticia.cuerpo}
    </p>
  );
}

// Pantalla de Plantel dedicada (pedido explícito: "eso que hiciste del
// plantel ponelo en la pantalla del plantel") — antes este detalle
// (titulares/suplentes con renovación rápida + desglose de salarios)
// vivía metido en un widget del Hub; ahora es su propia pantalla, a la
// que se llega tocando el acceso rápido "Plantel" de arriba o el
// widget-resumen de abajo. "Estrategia" (armar equipo/formación) sigue
// siendo una pantalla aparte — de acá también se puede ir para allá.
function PantallaPlantelPropio({
  club, sueldosTotales, multiplicadorLiga, jugadoresPorSalario, maxSalarioPlantel,
  lesionadosActivos, tarjetasActivas, contratosPorVencer,
  onVolver, onVerJugador, onArmarEquipo, onRenovar, jugadorParaRenovar, onCerrarRenovacion, onMontarPlantel,
}: {
  club: Club;
  sueldosTotales: number;
  multiplicadorLiga: number;
  jugadoresPorSalario: Jugador[];
  maxSalarioPlantel: number;
  lesionadosActivos: number;
  tarjetasActivas: number;
  contratosPorVencer: number;
  onVolver: () => void;
  onVerJugador: (jugadorId: string) => void;
  onArmarEquipo: () => void;
  onRenovar: (jugadorId: string) => void;
  jugadorParaRenovar: string | null;
  onCerrarRenovacion: () => void;
  // Badge de Plantel (pedido explícito, ver contratoEventosSinVer en
  // useGameStore.ts) — se marcan como vistos apenas se MONTA esta
  // pantalla, sin importar por cuál de los 3 accesos se haya entrado.
  onMontarPlantel: () => void;
}) {
  const jugadorEnNegociacion = jugadorParaRenovar ? club.plantel.find((p) => p.id === jugadorParaRenovar) ?? null : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps -- se llama una
  // sola vez al montar (abrir Plantel), no en cada cambio de club.
  useEffect(() => { onMontarPlantel(); }, []);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 sm:p-6 flex flex-col gap-5">
      <header className="flex items-center justify-between gap-3 topbar-entrada">
        <div>
          <h1 className="font-bold text-lg">Plantel</h1>
          <p className="text-xs text-neutral-500">{club.nombre}</p>
        </div>
        <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        <ChipTile texto={`${club.plantel.length}/${TOPE_PLANTEL}`} color="bg-emerald-500/15 text-emerald-400" />
        {lesionadosActivos + tarjetasActivas > 0 && (
          <ChipTile texto={`⚠️ ${lesionadosActivos} lesionados · ${tarjetasActivas} c/tarjeta`} color="bg-red-500/15 text-red-400" />
        )}
        {contratosPorVencer > 0 && (
          <ChipTile
            texto={`⚠️ ${contratosPorVencer} contrato${contratosPorVencer > 1 ? 's' : ''} por vencer`}
            color="bg-orange-500/15 text-orange-400"
          />
        )}
        <button
          type="button"
          onClick={onArmarEquipo}
          className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
        >
          🧩 Ir a Estrategia
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-6 bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 mb-1">Titulares</p>
          {club.titularesIds.map((id) => {
            const j = club.plantel.find((p) => p.id === id);
            return j ? (
              <FilaJugadorHub key={id} jugador={j} onClick={() => onVerJugador(id)} onRenovar={() => onRenovar(id)} />
            ) : null;
          })}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 mb-1">Suplentes</p>
          {club.suplentesIds.map((id) => {
            const j = club.plantel.find((p) => p.id === id);
            return j ? (
              <FilaJugadorHub key={id} jugador={j} onClick={() => onVerJugador(id)} onRenovar={() => onRenovar(id)} />
            ) : null;
          })}
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 mb-2">Salarios</p>
        <BarraFinanzas
          label="Sueldos totales vs. presupuesto"
          valor={sueldosTotales}
          max={Math.max(sueldosTotales, club.presupuesto, 1)}
          colorClase={
            sueldosTotales > club.presupuesto
              ? 'bg-gradient-to-r from-red-600 to-red-400'
              : 'bg-gradient-to-r from-emerald-600 to-emerald-400'
          }
          retrasoMs={0}
        />
        <p className="text-[10px] text-neutral-500 -mt-1.5 mb-2">
          Presupuesto disponible: {formatoMonto(club.presupuesto)}
        </p>
        <div className="max-h-64 overflow-y-auto pr-1">
          {jugadoresPorSalario.map((j, i) => {
            const salarioJusto = calcularSalarioJusto(j, multiplicadorLiga);
            const ratio = salarioJusto > 0 ? j.salario / salarioJusto : 1;
            const colorClase = ratio <= 0.9
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
              : ratio <= 1.15
                ? 'bg-gradient-to-r from-orange-600 to-orange-400'
                : 'bg-gradient-to-r from-red-600 to-red-400';
            return (
              <BarraFinanzas
                key={j.id}
                label={`${j.nombre} (${j.posicion})`}
                valor={j.salario}
                max={maxSalarioPlantel}
                colorClase={colorClase}
                retrasoMs={Math.min(i * 30, 600)}
              />
            );
          })}
        </div>
      </div>

      {jugadorEnNegociacion && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={onCerrarRenovacion}
        >
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <NegociacionRenovacion jugador={jugadorEnNegociacion} onCerrar={onCerrarRenovacion} />
          </div>
        </div>
      )}
    </div>
  );
}

export function PantallaHub({
  onArmarEquipo,
  onVerLiga,
  onVerMercado,
  onVerCantera,
  onVerCopa,
  onVerCopaNacional,
  onVerCopaConmebol,
  onVerCopaUefa,
  onVerCalendario,
  onVerPerfilDT,
  onVerFinanzas,
  onVerJugador,
  onFinDeTemporada,
}: {
  onArmarEquipo: () => void;
  onVerLiga: () => void;
  onVerMercado: () => void;
  onVerCantera: () => void;
  onVerCopa: () => void;
  onVerCopaNacional: () => void;
  onVerCopaConmebol: () => void;
  onVerCopaUefa: () => void;
  onVerCalendario: () => void;
  onVerPerfilDT: () => void;
  onVerFinanzas: () => void;
  onVerJugador: (jugadorId: string) => void;
  onFinDeTemporada: () => void;
}) {
  const {
    liga, clubes, clubUsuarioId, canteranosOfrecidos, copaMundialClubes, copaNacional, copaConmebol, copaUefa,
    ultimasLesiones, ultimasTarjetas, noticias, resumenTemporada, reiniciarPartida, carreraDT, partidosPretemporada,
    objetivoTemporada, confianzaDirectiva, simularFixtureCompleto, procesarFinDeTemporada, simularPretemporadaCompleta,
    simularCopaNacionalCompleta, simularCopaConmebolCompleta, simularCopaUefaCompleta, simularCopaMundialCompleta,
    contratoEventosSinVer, marcarContratoEventosVistos,
  } = useGameStore();
  const {
    entradas, proxima, simularProximaSemana,
  } = useProximaSemana();
  // Pantalla de Plantel dedicada (pedido explícito: "eso que hiciste del
  // plantel ponelo en la pantalla del plantel") — el detalle completo
  // (titulares/suplentes + renovación + salarios) se movió acá desde el
  // widget de abajo, que ahora es sólo un resumen cortito (ver
  // widgetsResumen más abajo).
  const [mostrarPlantel, setMostrarPlantel] = useState(false);
  const [partidoParaVisualizar, setPartidoParaVisualizar] = useState<Partido | null>(null);
  // Carrusel del hero (Noticias/Tabla/Perfil/Finanzas) — CONTROLADO desde
  // acá (pedido explícito, revisión "mejoras-hub-actual.md" punto 1): así
  // se puede resetear a Noticias (índice 0) cada vez que se simula algo,
  // en vez de dejar que el autoplay lo deje parado en otro slide justo
  // cuando el usuario más quiere ver qué acaba de pasar.
  const [indiceHero, setIndiceHero] = useState(0);
  // Confirmación de "Reiniciar" (pedido explícito, revisión
  // "mejoras-hub-actual.md": "un solo toque borra la carrera entera, sin
  // diálogo") — mismo espíritu que "deshacer" de Gmail, sin modal: el
  // primer toque arma el botón por 3s, recién el segundo toque (mientras
  // sigue armado) ejecuta de verdad.
  const [reiniciarArmado, setReiniciarArmado] = useState(false);
  const timeoutReiniciarRef = useRef<number | null>(null);
  // Renovación rápida desde Plantel (Fase 6, ver docs/sistema-oferta-fichajes.md
  // sección 6) — id del jugador cuya negociación está abierta en el modal,
  // null si no hay ninguna.
  const [jugadorParaRenovar, setJugadorParaRenovar] = useState<string | null>(null);
  const clubUsuario = clubUsuarioId ? clubes[clubUsuarioId] : null;

  const presupuestoAnimado = useConteo(clubUsuario?.presupuesto ?? 0);
  // Widget "Salarios" (revisión "mejoras-hub-actual.md" punto de
  // useConteo): mismo cálculo que `sobrepagados` más abajo, pero hoisteado
  // ACÁ arriba del return temprano porque los hooks no pueden llamarse
  // condicionalmente — duplicación mínima aceptada por esa restricción.
  const multiplicadorLigaParaWidget = clubUsuario ? multiplicadorSalarialDeLiga(clubUsuario.liga) : 1;
  const sobrepagadosParaWidget = clubUsuario
    ? clubUsuario.plantel.filter((j) => {
      const justo = calcularSalarioJusto(j, multiplicadorLigaParaWidget);
      return justo > 0 && j.salario / justo > 1.15;
    }).length
    : 0;
  const sobrepagadosAnimado = useConteo(sobrepagadosParaWidget);

  if (!liga || !clubUsuario) return null;

  if (partidoParaVisualizar) {
    return (
      <PantallaDetallePartido
        partido={partidoParaVisualizar}
        clubes={clubes}
        onCerrar={() => setPartidoParaVisualizar(null)}
      />
    );
  }

  const sueldosTotales = clubUsuario.plantel.reduce((a, j) => a + j.salario, 0);

  // Sección de salarios (Fase 7, ver docs/sistema-oferta-fichajes.md
  // sección 7) — reusa calcularSalarioJusto (ya existe para renovaciones)
  // también para los contratos VIGENTES, no sólo para decidir si una
  // renovación es razonable.
  const multiplicadorLigaUsuario = multiplicadorSalarialDeLiga(clubUsuario.liga);
  const jugadoresPorSalario = [...clubUsuario.plantel].sort((a, b) => b.salario - a.salario);
  const maxSalarioPlantel = jugadoresPorSalario[0]?.salario ?? 1;
  const sobrepagados = clubUsuario.plantel.filter((j) => {
    const justo = calcularSalarioJusto(j, multiplicadorLigaUsuario);
    return justo > 0 && j.salario / justo > 1.15;
  }).length;
  const contratosPorVencer = clubUsuario.plantel.filter((j) => puedeRenovar(j)).length;
  const lesionadosActivos = ultimasLesiones.length;
  const tarjetasActivas = ultimasTarjetas.length;

  if (mostrarPlantel) {
    return (
      <PantallaPlantelPropio
        club={clubUsuario}
        sueldosTotales={sueldosTotales}
        multiplicadorLiga={multiplicadorLigaUsuario}
        jugadoresPorSalario={jugadoresPorSalario}
        maxSalarioPlantel={maxSalarioPlantel}
        lesionadosActivos={lesionadosActivos}
        tarjetasActivas={tarjetasActivas}
        contratosPorVencer={contratosPorVencer}
        onVolver={() => setMostrarPlantel(false)}
        onVerJugador={onVerJugador}
        onArmarEquipo={onArmarEquipo}
        onRenovar={setJugadorParaRenovar}
        jugadorParaRenovar={jugadorParaRenovar}
        onCerrarRenovacion={() => setJugadorParaRenovar(null)}
        onMontarPlantel={marcarContratoEventosVistos}
      />
    );
  }


  function handleSimularSemana() {
    simularProximaSemana();
    setIndiceHero(0);
  }

  // Botón grande del topbar (pedido explícito: "que sea simular toda la
  // temporada, se simule todo y después aparece otro de cerrar
  // temporada") — mismo patrón que ya usa PantallaLiga.tsx (simular
  // fixture completo → Cerrar temporada), reusado acá para no tener dos
  // implementaciones del mismo flujo. Sólo toca el fixture de LIGA (igual
  // que simularFixtureCompleto siempre hizo) — las copas pendientes se
  // siguen resolviendo aparte, desde sus propias pantallas.
  // Bug reportado ("no se simulan las otras competiciones") — antes esto
  // sólo tocaba el fixture de liga (mismo alcance que ya tenía
  // simularFixtureCompleto). Ahora también resuelve de una cualquier copa
  // que esté en juego (cada `simularCopaXCompleta` ya hace su propio
  // loop "hasta que haya campeón", ver useGameStore.ts) — sólo la que
  // exista en ESTE momento; si arranca una nueva a mitad de la corrida
  // (ej. clasificás a la Copa Mundial de Clubes recién al cerrar esta
  // temporada) esa se resuelve el próximo click, no hace falta encadenar
  // acá (procesarFinDeTemporada es quien las genera).
  //
  // Bug reportado ("la pretemporada no se simula"): faltaba acá —
  // "Simular temporada completa" corría liga+copas pero los amistosos de
  // pretemporada quedaban pendientes para siempre a menos que el usuario
  // fuera manualmente a esa pantalla. Van primero (son cronológicamente
  // lo primero de la temporada, semana 0 — ver engine/calendario.ts).
  function handleSimularTemporadaCompleta() {
    simularPretemporadaCompleta();
    simularFixtureCompleto();
    if (copaNacional) simularCopaNacionalCompleta();
    if (copaConmebol) simularCopaConmebolCompleta();
    if (copaUefa) simularCopaUefaCompleta();
    if (copaMundialClubes) simularCopaMundialCompleta();
    setIndiceHero(0);
  }

  function handleCerrarTemporada() {
    procesarFinDeTemporada();
    onFinDeTemporada();
  }

  function handleClickReiniciar() {
    if (reiniciarArmado) {
      if (timeoutReiniciarRef.current != null) window.clearTimeout(timeoutReiniciarRef.current);
      setReiniciarArmado(false);
      reiniciarPartida();
      return;
    }
    setReiniciarArmado(true);
    timeoutReiniciarRef.current = window.setTimeout(() => setReiniciarArmado(false), 3000);
  }

  // Navega a la pantalla de la competencia de una entrada del calendario
  // (mismo mapeo pantalla→callback que ya usa PantallaCalendario/App.tsx).
  // 'plantel' (pretemporada, ver engine/calendario.ts) no tiene callback
  // propio — ya estamos en el Hub, no hace nada.
  function irAPantallaDeEntrada(pantalla: EntradaCalendario['pantalla']) {
    switch (pantalla) {
      case 'liga': onVerLiga(); break;
      case 'copa-nacional': onVerCopaNacional(); break;
      case 'copa-conmebol': onVerCopaConmebol(); break;
      case 'copa-uefa': onVerCopaUefa(); break;
      case 'copa': onVerCopa(); break;
      case 'mercado': onVerMercado(); break;
      default: break;
    }
  }

  // "Ver partido" de la tarjeta flip (bug reportado: "no aparecen los de
  // copa o champions" — antes la tarjeta sólo sabía de partidos de LIGA).
  // `entrada.id` coincide con el id real del Partido (ver
  // entradaDePartido en engine/calendario.ts) — liga y pretemporada abren
  // el visualizador 2D directo (pedido explícito: "borra el menu de
  // pretemporada" — ya no tiene pantalla propia adonde navegar); el resto
  // de las competencias sí navega a su propia pantalla.
  function handleVerPartidoDeEntrada(entrada: EntradaCalendario) {
    if (entrada.tipo === 'liga' && liga) {
      const partido = liga.fixture.find((p) => p.id === entrada.id);
      if (partido) {
        setPartidoParaVisualizar(partido);
        return;
      }
    }
    if (entrada.tipo === 'pretemporada') {
      const partido = partidosPretemporada.find((p) => p.id === entrada.id);
      if (partido) {
        setPartidoParaVisualizar(partido);
        return;
      }
    }
    irAPantallaDeEntrada(entrada.pantalla);
  }

  // "Ver partido" de la tarjeta ANTES de jugarse (pedido explícito: "que
  // sean dos botones de ver partido... y simular partido directamente") —
  // a diferencia de handleVerPartidoDeEntrada (que sólo REVISA un partido
  // YA jugado), esto simula de una y abre el visualizador con el
  // resultado fresco. `entradaProxima` queda capturado ANTES de simular
  // (su id/tipo/pantalla no cambian); el Partido en sí se lee de
  // useGameStore.getState() recién simulado — leer `liga` del closure acá
  // daría el estado VIEJO (React todavía no re-renderizó con el resultado).
  function handleVerPartidoAhora() {
    if (!entradaProxima) return;
    const entrada = entradaProxima;
    simularProximaSemana();
    setIndiceHero(0);
    if (entrada.tipo === 'liga') {
      const partido = useGameStore.getState().liga?.fixture.find((p) => p.id === entrada.id);
      if (partido) {
        setPartidoParaVisualizar(partido);
        return;
      }
    }
    if (entrada.tipo === 'pretemporada') {
      const partido = useGameStore.getState().partidosPretemporada.find((p) => p.id === entrada.id);
      if (partido) {
        setPartidoParaVisualizar(partido);
        return;
      }
    }
    irAPantallaDeEntrada(entrada.pantalla);
  }

  // Próximo partido REAL del usuario, sea de la competencia que sea (bug
  // reportado: la tarjeta sólo consideraba la liga, así que en semana de
  // copa mostraba "Sin partido" aunque hubiera uno). `entradas`/`proxima`
  // salen de useProximaSemana (mismo cálculo que ya usa el botón de
  // simular de la tarjeta) — filtrado por `proxima.tipo` (no cualquier
  // tipo de esa semana) para que lo que se PREVISUALIZA acá sea
  // exactamente lo que "Simular partido"/"Ver partido" van a resolver, ni
  // más ni menos (ver bug de copas y liga simulándose juntas en
  // useProximaSemana.ts). `!e.jugado` es necesario acá (pedido explícito:
  // "los 3 partidos [de pretemporada] se jueguen por separado" —
  // bug real encontrado en el camino: sin este filtro, una vez jugado el
  // PRIMER amistoso de la semana, este `.find()` lo seguía encontrando a
  // ÉL (misma semana/tipo, ya jugado) en vez de pasar al siguiente
  // pendiente — la tarjeta quedaba trabada mostrando siempre el mismo
  // resultado. Para liga/copas no cambia nada (normalmente hay una sola
  // entrada por semana/tipo), pero pretemporada SIEMPRE tiene los 3
  // amistosos en la misma semana (0), así que ahí sí importa.
  const entradaProxima = proxima
    ? entradas.find((e) => e.semana === proxima.semana && e.tipo === proxima.tipo && e.rivalId && !e.jugado) ?? null
    : null;

  const proximaFecha = proximaFechaSinJugar(liga.fixture);
  const proximoPartido = proximaFecha != null
    ? liga.fixture.find((p) => p.fecha === proximaFecha && (p.localId === clubUsuarioId || p.visitanteId === clubUsuarioId))
    : undefined;

  const copasActivas = [
    copaNacional && { nombre: copaNacional.nombre, color: 'text-teal-400', onClick: onVerCopaNacional },
    copaConmebol && {
      nombre: copaConmebol.tipo === 'libertadores' ? 'Copa Libertadores' : 'Copa Sudamericana',
      color: 'text-cyan-400',
      onClick: onVerCopaConmebol,
    },
    copaUefa && { nombre: copaUefa.nombre, color: 'text-violet-400', onClick: onVerCopaUefa },
    copaMundialClubes && { nombre: 'Copa Mundial de Clubes', color: 'text-indigo-400', onClick: onVerCopa },
  ].filter((c): c is { nombre: string; color: string; onClick: () => void } => Boolean(c));

  // Agrupado por semana para la tira mini (mismo cálculo que
  // PantallaCalendario hace para su propia tira, acá en formato
  // compacto).
  const porSemana = new Map<number, EntradaCalendario[]>();
  entradas.forEach((e) => {
    const lista = porSemana.get(e.semana) ?? [];
    lista.push(e);
    porSemana.set(e.semana, lista);
  });
  const semanas = [...porSemana.keys()].sort((a, b) => a - b);
  const semanaActual = proxima ? proxima.semana : (semanas.length > 0 ? semanas[semanas.length - 1] : null);
  // Tira de semanas recortada (pedido explícito, revisión
  // "mejoras-hub-actual.md" punto 5): mostrar sólo un puñado centrado en
  // la semana actual en vez de las ~26 siempre visibles — un vistazo
  // rápido no necesita ver toda la temporada. Se recorta ACÁ, en el Hub
  // (TiraSemanas/PantallaCalendario.tsx no se tocan) para no arriesgar la
  // pantalla de calendario completo, que sí necesita ver todo. Tocar
  // cualquier casilla ya lleva al calendario completo (onIrA), así que no
  // hace falta un botón de "expandir" aparte.
  const RADIO_TIRA_COMPACTA = 5;
  const indiceSemanaActual = semanaActual != null ? semanas.indexOf(semanaActual) : -1;
  // Bug reportado ("al principio aparecen sólo 5"): con la ventana
  // centrada a secas, apenas arranca la temporada (índice 0) el recorte
  // "hacia atrás" no tiene de dónde salir y el total mostrado se queda
  // corto (6 en vez de 11) — se ve angosto sólo al principio/final de la
  // tira. Acá se corre la ventana hacia el lado que SÍ tiene margen para
  // siempre mostrar el total completo cuando la tira alcanza, en vez de
  // dejar que el faltante de un lado simplemente se pierda.
  let desde = indiceSemanaActual - RADIO_TIRA_COMPACTA;
  let hasta = indiceSemanaActual + RADIO_TIRA_COMPACTA + 1;
  if (desde < 0) {
    hasta = Math.min(semanas.length, hasta - desde);
    desde = 0;
  } else if (hasta > semanas.length) {
    desde = Math.max(0, desde - (hasta - semanas.length));
    hasta = semanas.length;
  }
  const semanasCompactas = indiceSemanaActual === -1 ? semanas : semanas.slice(desde, hasta);

  // Accesos rápidos (v3): todas las secciones que ya existen en el juego
  // real, agrupadas en una fila — reemplaza a las pills sueltas que antes
  // vivían en la topbar (ver arriba). "Estrategia" sigue yendo directo a
  // Armar Equipo; "Plantel" ahora abre PantallaPlantelPropio (pedido
  // explícito: "ponelo en la pantalla del plantel") en vez de ir a la
  // misma pantalla que Estrategia — ahí es donde vive la lista con las
  // etiquetas de renovación de contrato.
  //
  // Bug reportado ("aparecen competiciones cuando no clasificaste, por
  // ejemplo Champions jugando en la liga argentina"): las 4 copas de acá
  // abajo antes se mostraban SIEMPRE, sin importar si el club del usuario
  // está jugando esa competencia esta temporada — un club de la liga
  // argentina nunca puede clasificar a la Copa UEFA (Champions/Europa/
  // Conference son sólo para ligas europeas), pero el acceso rápido igual
  // aparecía y llevaba a una pantalla en blanco (PantallaCopaXxx devuelve
  // null si esa copa no está activa). Ahora cada una sólo se agrega si el
  // store realmente tiene esa copa cargada esta temporada — mismo criterio
  // que ya usa `copasActivas` más abajo para el tile de Copas.
  const accesos: { icono: string; texto: string; onClick: () => void; badge?: number }[] = [
    { icono: '🧩', texto: 'Estrategia', onClick: onArmarEquipo },
    { icono: '👥', texto: 'Plantel', onClick: () => setMostrarPlantel(true), badge: contratoEventosSinVer },
    { icono: '🧠', texto: 'DT', onClick: onVerPerfilDT },
    { icono: '🌱', texto: 'Cantera', onClick: onVerCantera, badge: canteranosOfrecidos.length },
    { icono: '🏟️', texto: 'Liga', onClick: onVerLiga },
    copaNacional && { icono: '🥇', texto: 'Copa Nacional', onClick: onVerCopaNacional },
    copaConmebol && {
      icono: '🏆',
      texto: copaConmebol.tipo === 'libertadores' ? 'Libertadores' : 'Sudamericana',
      onClick: onVerCopaConmebol,
    },
    copaUefa && { icono: '⭐', texto: copaUefa.nombre, onClick: onVerCopaUefa },
    copaMundialClubes && { icono: '🌍', texto: 'Mundial de Clubes', onClick: onVerCopa },
    { icono: '💱', texto: 'Mercado', onClick: onVerMercado },
    { icono: '📅', texto: 'Calendario', onClick: onVerCalendario },
    // Presupuesto (pedido explícito: "como uno de esos cuadraditos al lado
    // de calendario") — mismo cuadradito de accesos rápidos que el resto,
    // con el monto animado (presupuestoAnimado) como texto en vez de una
    // etiqueta fija, así de un vistazo ya se ve la plata sin entrar.
    { icono: '💰', texto: formatoMonto(presupuestoAnimado), onClick: onVerFinanzas },
  ].filter((a): a is { icono: string; texto: string; onClick: () => void; badge?: number } => Boolean(a));

  // Slides del carrusel (v3) — datos reales. El de "Noticias" ahora usa
  // el sistema de noticias real (pedido explícito, ver
  // docs/sistema-noticias.md y engine/noticias.ts): resultado/goleador/
  // destacado se generan post-fecha, fichaje/rumor en cada ventana de
  // mercado, joya en cada fin de temporada — `noticias` del store ya
  // viene ordenado de más nueva a más vieja (ver agregarNoticias).
  const tablaLiga = calcularTabla(liga.fixture, liga.clubIds);
  // Perfil rotativo prioriza al destacado de la fecha (pedido explícito,
  // revisión "mejoras-hub-actual.md" punto 6) — antes siempre arrancaba
  // por el de mayor GRL sin importar qué pasó; ahora, si hay una noticia
  // reciente de categoría "destacado" de un jugador del PROPIO plantel
  // (hat-trick, gol+asistencia, valla invicta, goleada), ese jugador va
  // primero — el resto sigue siendo el top 5 por GRL como antes.
  const jugadorDestacadoId = noticias.find(
    (n) => n.categoria === 'destacado' && n.jugadorId && clubUsuario.plantel.some((j) => j.id === n.jugadorId),
  )?.jugadorId;
  const jugadorDestacado = jugadorDestacadoId ? clubUsuario.plantel.find((j) => j.id === jugadorDestacadoId) : undefined;
  const restoPorGrl = [...clubUsuario.plantel].sort((a, b) => b.grl - a.grl).filter((j) => j.id !== jugadorDestacado?.id);
  const mejoresJugadores = (jugadorDestacado ? [jugadorDestacado, ...restoPorGrl] : restoPorGrl).slice(0, 5);
  const noticiasParaMostrar = noticias.slice(0, 10);

  // Bug reportado ("la tabla no llega hasta abajo"): antes se recortaba a
  // un top 6 fijo (con un parche aparte para insertar la fila del usuario
  // si quedaba afuera de ese recorte — pedido explícito anterior, "en
  // tabla aparecen 6 equipos y no el tuyo") — pero eso dejaba la tabla
  // completa inalcanzable desde acá, sin forma de ver el resto de la
  // liga. El slide YA es scrolleable (overflow-y-auto en Carrusel, ver
  // más abajo), así que ahora se listan TODOS los clubes — la fila del
  // usuario se resalta igual (esPropio) y ya no hace falta el separador
  // "···" porque nunca queda afuera.
  const filasTabla = tablaLiga.map((fila, i) => ({ fila, posicion: i + 1, separador: false }));

  const maxResumen = resumenTemporada
    ? Math.max(resumenTemporada.premio, resumenTemporada.taquilla, resumenTemporada.sueldosPagados, 1)
    : 0;

  const slidesCarrusel: { icono: string; titulo: string; contenido: React.ReactNode }[] = [
    {
      icono: '📰',
      titulo: 'Noticias',
      contenido: noticiasParaMostrar.length > 0 ? (
        <div className="flex flex-col">
          {noticiasParaMostrar.map((n) => <FilaNoticia key={n.id} noticia={n} />)}
        </div>
      ) : (
        <p className="text-xs text-neutral-500">
          Todavía no hay noticias — simulá una fecha o una ventana de mercado para que empiecen a aparecer acá.
        </p>
      ),
    },
    {
      icono: '📊',
      titulo: 'Tabla',
      contenido: (
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-neutral-900">
            <tr className="text-neutral-500 text-left">
              <th className="font-semibold py-1 px-1 uppercase text-[9px] tracking-wide">#</th>
              <th className="font-semibold py-1 px-1 uppercase text-[9px] tracking-wide">Equipo</th>
              <th className="font-semibold py-1 px-1 uppercase text-[9px] tracking-wide text-right">PJ</th>
              <th className="font-semibold py-1 px-1 uppercase text-[9px] tracking-wide text-right">Pts</th>
            </tr>
          </thead>
          <tbody>
            {filasTabla.map(({ fila, posicion, separador }) => {
              const esPropio = fila.clubId === clubUsuarioId;
              return (
                <Fragment key={fila.clubId}>
                  {separador && (
                    <tr>
                      <td colSpan={4} className="text-center text-neutral-600 py-0.5 tracking-widest">···</td>
                    </tr>
                  )}
                  <tr className={esPropio ? 'bg-orange-500/10' : undefined}>
                    <td className="py-1 px-1 border-t border-neutral-800">{posicion}</td>
                    <td className="py-1 px-1 border-t border-neutral-800 truncate max-w-[130px]">
                      {clubes[fila.clubId]?.nombre ?? '?'}
                      {esPropio && <span className="text-orange-400"> (vos)</span>}
                    </td>
                    <td className="py-1 px-1 border-t border-neutral-800 text-right tabular-nums">{fila.pj}</td>
                    <td className="py-1 px-1 border-t border-neutral-800 text-right font-bold tabular-nums">{fila.pts}</td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      ),
    },
    {
      icono: '🧑',
      titulo: 'Perfil',
      contenido: <SlidePerfilRotativo jugadores={mejoresJugadores} />,
    },
    {
      icono: '💰',
      titulo: 'Finanzas',
      contenido: (
        <div className="flex flex-col gap-3 h-full justify-center">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-neutral-500">Presupuesto</p>
              <p className={`text-xl font-extrabold tabular-nums ${clubUsuario.presupuesto < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {formatoMonto(presupuestoAnimado)}
              </p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-neutral-500">Sueldos / temporada</p>
              <p className="text-sm font-semibold text-neutral-300">{formatoMonto(sueldosTotales)}</p>
            </div>
          </div>
          {/* Barras reales del último cierre de temporada (pedido
              explícito: "agrega barras animadas con gastos, etc") — a
              diferencia del mockup, que inventaba ingresos/gastos
              semanales que el motor no calcula, estas 3 SÍ son datos
              reales: sólo existen una vez que se cerró al menos una
              temporada (ver resumenTemporada en useGameStore). */}
          {resumenTemporada ? (
            <div className="pt-2 border-t border-neutral-800">
              <p className="text-[9px] uppercase tracking-widest text-neutral-500 mb-2">
                Último cierre de temporada
              </p>
              <BarraFinanzas
                label="Premio por posición"
                valor={resumenTemporada.premio}
                max={maxResumen}
                colorClase="bg-gradient-to-r from-emerald-600 to-emerald-400"
                retrasoMs={0}
              />
              <BarraFinanzas
                label="Taquilla / TV"
                valor={resumenTemporada.taquilla}
                max={maxResumen}
                colorClase="bg-gradient-to-r from-cyan-600 to-cyan-400"
                retrasoMs={80}
              />
              <BarraFinanzas
                label="Sueldos pagados"
                valor={resumenTemporada.sueldosPagados}
                max={maxResumen}
                colorClase="bg-gradient-to-r from-red-600 to-red-400"
                retrasoMs={160}
              />
            </div>
          ) : (
            <p className="text-[10px] text-neutral-600">
              El desglose de premio/taquilla/sueldos aparece acá después de cerrar la primera temporada.
            </p>
          )}
        </div>
      ),
    },
  ];

  // Widgets-resumen de abajo (pedido explícito: "quiero los widgets que
  // queden cuadraditos y se vayan desplazando de izquierda a derecha como
  // un loop infinito además solo información corta y importante") — antes
  // era un carrusel con el detalle completo de cada sección; el detalle
  // de Plantel/Salarios se mudó a PantallaPlantelPropio (pedido explícito:
  // "ponelo en la pantalla del plantel"), así que estos widgets vuelven a
  // ser sólo un pantallazo cortito con ícono+número, tocables para ir a
  // la sección correspondiente.
  const widgetsResumen: { id: string; icono: string; texto: string; urgente: boolean; onClick?: () => void }[] = [
    {
      id: 'semana',
      icono: '📅',
      texto: proximaFecha != null ? `Fecha ${proximaFecha}` : 'Sin fecha',
      urgente: Boolean(proximoPartido?.partidoImportante),
      onClick: onVerCalendario,
    },
    {
      id: 'plantel',
      icono: '👥',
      texto: `${clubUsuario.plantel.length}/${TOPE_PLANTEL}`,
      urgente: lesionadosActivos + tarjetasActivas > 0 || contratosPorVencer > 0,
      onClick: () => setMostrarPlantel(true),
    },
    {
      id: 'copas',
      icono: '🏆',
      texto: copasActivas.length > 0 ? `${copasActivas.length} copa${copasActivas.length > 1 ? 's' : ''}` : 'Sin copas',
      urgente: false,
      onClick: copasActivas[0]?.onClick,
    },
    {
      id: 'salarios',
      icono: '💵',
      texto: sobrepagadosAnimado > 0 ? `${sobrepagadosAnimado} sobre` : 'Al día',
      urgente: sobrepagados > 0 || sueldosTotales > clubUsuario.presupuesto,
      onClick: () => setMostrarPlantel(true),
    },
    // Confianza de la directiva (pedido explícito, mecánica 4 de
    // docs/que-le-falta-profundidad.md — "casi gratis" una vez que existe
    // la mecánica 1, ver engine/objetivos.ts): mismo umbral rojo que ya
    // usa PantallaFinDeTemporada para pintar el número en rojo.
    {
      id: 'confianza',
      icono: '🎯',
      texto: objetivoTemporada ? `Confianza ${confianzaDirectiva}` : 'Sin objetivo',
      urgente: confianzaDirectiva < 35,
      onClick: onVerLiga,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 sm:p-6 flex flex-col gap-5">
      {/* Topbar — cae desde arriba al montar (ver index.css). */}
      <header className="flex items-center justify-between gap-4 flex-wrap topbar-entrada">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center font-black text-sm shadow-lg shadow-orange-500/20">
            {inicialesClub(clubUsuario.nombre)}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm truncate">{clubUsuario.nombre}</h1>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 truncate">
              {liga.nombre} · Temporada {liga.temporadaActual}
            </p>
          </div>
        </div>

        {/* v3: las pills de navegación (Armar equipo/Pretemporada/Cantera)
            se mudaron a la fila de "Accesos rápidos" de abajo — acá sólo
            queda Reiniciar, que es una acción destructiva, no navegación. */}
        <button
          type="button"
          onClick={handleClickReiniciar}
          className={`text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors ${
            reiniciarArmado
              ? 'bg-red-500/15 text-red-400 animate-pulse'
              : 'text-neutral-600 hover:text-red-400 hover:bg-neutral-900'
          }`}
        >
          {reiniciarArmado ? '¿Seguro? Confirmar' : 'Reiniciar'}
        </button>

        {/* Botón grande del topbar (pedido explícito: "que sea simular
            toda la temporada... y después aparece otro de cerrar
            temporada") — atajo para saltar directo al final del fixture
            de liga, mismo patrón que ya usa PantallaLiga.tsx. El avance
            partido a partido/competencia a competencia ahora vive en la
            tarjeta "Tu once inicial" de abajo (Ir al partido → Ver
            partido/Simular partido). */}
        {proximaFecha != null ? (
          <button
            type="button"
            onClick={handleSimularTemporadaCompleta}
            className="shrink-0 bg-gradient-to-br from-orange-400 to-orange-500 hover:brightness-105 text-black font-black text-xs uppercase tracking-wide rounded-xl px-5 py-3 shadow-lg shadow-orange-500/30 active:scale-[0.96] transition-transform"
          >
            ▶ Simular temporada completa
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCerrarTemporada}
            className="shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:brightness-105 text-black font-black text-xs uppercase tracking-wide rounded-xl px-5 py-3 shadow-lg shadow-emerald-500/30 active:scale-[0.96] transition-transform"
          >
            🏁 Cerrar temporada
          </button>
        )}
      </header>

      {/* Fila accesos+semanas (izquierda) / tarjeta de carrera del DT+
          widgets (derecha) — pedido explícito, mostrando un mockup: "asi lo
          quiero acomodalo para que quede bien". Mismas proporciones de
          columna que la fila hero de abajo (md:grid-cols-[1fr_1.15fr],
          tarjeta flip / carrusel) para que el borde derecho quede alineado
          con el del carrusel de Noticias. */}
      <div className="grid md:grid-cols-[1fr_1.15fr] gap-3 items-stretch">
        <div className="flex flex-col gap-3 min-w-0">
          {/* Accesos rápidos (v3) — todas las secciones del juego en una
              fila scrolleable horizontal, mismo lenguaje visual que el
              resto. */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {accesos.map((a) => (
              <AccesoRapido key={a.texto} icono={a.icono} texto={a.texto} onClick={a.onClick} badge={a.badge} />
            ))}
          </div>

          {semanas.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <FechaActual semana={semanaActual} />
              {/* La tira mini es un PREVIEW — tocar cualquier casilla lleva
                  al calendario completo (no hay un router genérico a
                  "cualquier pantalla" acá en el Hub, sólo callbacks
                  puntuales), donde sí se puede navegar a la competencia
                  exacta de esa semana. */}
              <TiraSemanas semanas={semanasCompactas} porSemana={porSemana} semanaActual={semanaActual} onIrA={onVerCalendario} />
            </div>
          )}
        </div>

        {/* Stats de carrera del DT (pedido explícito, ver comentario
            grande de TarjetaCarreraDTMini más arriba). */}
        <TarjetaCarreraDTMini carrera={carreraDT} club={clubUsuario} onClick={onVerPerfilDT} />
      </div>

      {/* Hero: tarjeta flip (once inicial / próximo partido) + carrusel de
          paneles (noticias/tabla/perfil/finanzas — v3, ver nota grande de
          arriba del archivo). Pedido explícito: tarjeta del once inicial
          menos ancha (le cede proporción al carrusel) y las dos más altas
          — ver h-[380px] en TarjetaFlip/Carrusel más abajo. */}
      <div className="grid md:grid-cols-[1fr_1.15fr] gap-3 items-stretch">
        <TarjetaFlip
          club={clubUsuario}
          rivalClub={entradaProxima?.rivalId ? clubes[entradaProxima.rivalId] : undefined}
          clubes={clubes}
          entradas={entradas}
          entradaProxima={entradaProxima}
          onSimular={handleSimularSemana}
          onVerPartidoAhora={handleVerPartidoAhora}
          onVerPartido={handleVerPartidoDeEntrada}
          onVerEstrategia={onArmarEquipo}
        />
        <Carrusel slides={slidesCarrusel} indiceControlado={indiceHero} onCambiarIndice={setIndiceHero} />
      </div>

      {/* Widgets-resumen (pedido explícito: "ponelos fijos" — antes se
          desplazaban solos con un marquee CSS en loop infinito, ahora es
          una fila estática que envuelve si no entra; después: "move los
          widgets... abajo de la tabla" — bajaron de al lado de la tarjeta
          de carrera del DT a su propia fila, debajo del hero). Cada
          cuadradito lleva a su sección real (Plantel/Salarios →
          PantallaPlantelPropio). */}
      <div className="flex flex-wrap justify-center gap-2">
        {widgetsResumen.map((w) => (
          <WidgetCuadrado key={w.id} icono={w.icono} texto={w.texto} urgente={w.urgente} onClick={w.onClick} />
        ))}
      </div>
    </div>
  );
}
