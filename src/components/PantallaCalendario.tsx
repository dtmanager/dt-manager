// Calendario unificado (pedido explícito: "calendario real con fechas")
// — sólo lectura y navegación: cada fila lleva a la pantalla real de esa
// competencia (donde sí se puede simular). Ver el comentario grande en
// engine/calendario.ts sobre cómo se calcula la "semana" de cada entrada
// (aproximada para copas, exacta para liga) y por qué.

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { type EntradaCalendario, type PantallaDeEntrada } from '../engine/calendario';
import { useProximaSemana } from '../hooks/useProximaSemana';

const COLOR_POR_TIPO: Record<EntradaCalendario['tipo'], string> = {
  pretemporada: 'text-neutral-400',
  liga: 'text-orange-400',
  'copa-nacional': 'text-teal-400',
  'copa-conmebol': 'text-cyan-400',
  'copa-uefa': 'text-violet-400',
  'copa-mundial': 'text-indigo-400',
  mercado: 'text-emerald-400',
};

// Mismos colores que COLOR_POR_TIPO pero como fondo sólido — para los
// puntitos de competencia de la tira de semanas (TiraSemanas).
const PUNTO_POR_TIPO: Record<EntradaCalendario['tipo'], string> = {
  pretemporada: 'bg-neutral-400',
  liga: 'bg-orange-400',
  'copa-nacional': 'bg-teal-400',
  'copa-conmebol': 'bg-cyan-400',
  'copa-uefa': 'bg-violet-400',
  'copa-mundial': 'bg-indigo-400',
  mercado: 'bg-emerald-400',
};

// Exportadas (pedido explícito: rediseño del Hub, documento v2 — "nuevo
// mini-calendario horizontal... mismo patrón que ya tiene la tira de
// semanas del calendario real") — el Hub reusa estos mismos componentes
// para su tira compacta en vez de reimplementar el marcador deslizante.
export function tituloSemana(semana: number): string {
  return semana === 0 ? 'Pretemporada' : `Semana ${semana}`;
}

// Tira horizontal de semanas (pedido explícito: "hace una animacion del
// calendario mientras van pasando los dias que muestre la fecha actual y
// cuando toques siguiente partido pase la animacion de las fechas", con
// las capturas de FM2021 como referencia visual) — el motor no tiene
// fechas reales (ver engine/calendario.ts), así que la unidad acá es la
// "semana" ilustrativa en vez de un día, pero el efecto es el mismo: un
// marcador de "hoy" que se desliza suavemente de una casilla a la
// siguiente cada vez que se simula, en vez de saltar de golpe.
export function TiraSemanas({
  semanas, porSemana, semanaActual, onIrA,
}: {
  semanas: number[];
  porSemana: Map<number, EntradaCalendario[]>;
  semanaActual: number | null;
  onIrA: (pantalla: PantallaDeEntrada) => void;
}) {
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const marcadorRef = useRef<HTMLDivElement | null>(null);
  const celdaRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  // Cada vez que cambia la semana actual (al tocar "Simular próxima
  // semana" o "próximo partido" desde cualquier pantalla de competencia)
  // el marcador recalcula su posición en píxeles y la transición CSS de
  // `transform` hace que se DESLICE hasta ahí en vez de teletransportarse
  // — esa es toda la animación de "paso de fechas" pedida.
  useEffect(() => {
    const contenedor = contenedorRef.current;
    const marcador = marcadorRef.current;
    if (!contenedor || !marcador) return;
    if (semanaActual == null) {
      marcador.style.opacity = '0';
      return;
    }
    const celda = celdaRefs.current.get(semanaActual);
    if (!celda) return;
    marcador.style.opacity = '1';
    const x = celda.offsetLeft + celda.offsetWidth / 2 - marcador.offsetWidth / 2;
    marcador.style.transform = `translateX(${x}px)`;
    celda.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [semanaActual]);

  return (
    // El marcador vive ADENTRO del contenedor con scroll (no afuera) para
    // que se desplace junto con las tarjetas al hacer scroll horizontal
    // — si estuviera afuera, su posición en píxeles quedaría fija
    // mientras las tarjetas se mueven debajo y se desalinearía.
    <div ref={contenedorRef} className="relative flex gap-2 overflow-x-auto pb-4 scroll-smooth snap-x">
      {semanas.map((semana) => {
        const entradas = porSemana.get(semana) ?? [];
        const tiposDelDia = [...new Set(entradas.map((e) => e.tipo))];
        const relevantes = entradas.filter((e) => e.tipo !== 'mercado');
        const jugado = relevantes.length > 0 && relevantes.every((e) => e.jugado);
        const esActual = semana === semanaActual;
        return (
          <button
            type="button"
            key={semana}
            ref={(el) => { if (el) celdaRefs.current.set(semana, el); }}
            onClick={() => { if (relevantes[0]) onIrA(relevantes[0].pantalla); }}
            className={`snap-center shrink-0 w-16 rounded-xl border py-2 px-1.5 flex flex-col items-center gap-1 transition-colors duration-500 ${
              esActual
                ? 'border-orange-500 bg-gradient-to-br from-orange-500/15 to-orange-500/5 shadow-lg shadow-orange-500/10'
                : jugado
                  ? 'border-neutral-800 bg-neutral-900/60 opacity-70'
                  : 'border-neutral-800 bg-neutral-900 hover:border-neutral-600'
            }`}
          >
            <p className={`text-[10px] font-semibold ${esActual ? 'text-orange-400' : 'text-neutral-400'}`}>
              {semana === 0 ? 'Pre' : `S${semana}`}
            </p>
            <div className="flex gap-0.5 flex-wrap justify-center max-w-[40px]">
              {tiposDelDia.length > 0 ? tiposDelDia.map((t) => (
                <span key={t} className={`w-1.5 h-1.5 rounded-full ${PUNTO_POR_TIPO[t]}`} />
              )) : <span className="w-1.5 h-1.5 rounded-full bg-neutral-700" />}
            </div>
            {jugado && <span className="text-[9px] text-emerald-400 leading-none">✓</span>}
          </button>
        );
      })}
      {/* Marcador de "hoy": triángulo que se desliza (transition-transform)
          hasta quedar centrado debajo de la semana actual. Absoluto
          respecto de este mismo contenedor (que ahora es `relative`), así
          que scrollea junto con las tarjetas. */}
      <div
        ref={marcadorRef}
        className="absolute bottom-1 left-0 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[7px] border-b-orange-500 transition-transform duration-700 ease-in-out pointer-events-none"
        style={{ transform: 'translateX(0px)', opacity: 0 }}
      />
    </div>
  );
}

// Orquestador (pedido explícito: "que cada partido pase en el calendario
// como el FM26 y se repartan en el año") — NO le inventa un reloj al
// motor (eso sigue siendo el mismo calendario cosmético de arriba, ver
// engine/calendario.ts): sólo mira qué es lo MÁS TEMPRANO sin jugar en la
// línea de tiempo que ya arma `construirCalendario`, y dispara UN paso de
// cada competencia que tenga algo pendiente esa misma semana, reusando las
// acciones del store que ya existían (una por competencia, cada una a su
// propio ritmo hasta ahora). `mercado` se excluye a propósito: es sólo un
// recordatorio fijo ("abierto toda la temporada", ver
// engine/calendario.ts), nunca pasa a `jugado`, así que dejarlo adentro
// dejaría el botón trabado en la semana 1 para siempre.
// "que muestre la fecha actual" — etiqueta con un fundido corto (opacity)
// cada vez que la semana actual cambia, en vez de reemplazar el texto de
// golpe. Coordinado en el tiempo con el deslizamiento del marcador de
// TiraSemanas de arriba (misma duración aproximada).
export function FechaActual({ semana }: { semana: number | null }) {
  const [mostrado, setMostrado] = useState(semana);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (semana === mostrado) return undefined;
    setVisible(false);
    const id = setTimeout(() => {
      setMostrado(semana);
      setVisible(true);
    }, 300);
    return () => clearTimeout(id);
  }, [semana, mostrado]);

  return (
    <p className={`text-sm font-semibold text-orange-400 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      📍 {mostrado == null ? 'Temporada terminada' : tituloSemana(mostrado)}
    </p>
  );
}

function FilaEntrada({ entrada, onClick }: { entrada: EntradaCalendario; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 py-2.5 px-2 -mx-1 rounded-lg hover:bg-neutral-800/40 transition-colors border-b border-neutral-800/60 last:border-0"
    >
      <span className={`w-1 self-stretch rounded-full shrink-0 ${PUNTO_POR_TIPO[entrada.tipo]}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wide ${COLOR_POR_TIPO[entrada.tipo]}`}>
            {entrada.competencia}
          </span>
          <span className="text-[11px] text-neutral-500">{entrada.etiquetaRonda}</span>
        </div>
        {entrada.rivalNombre && (
          <p className="text-sm truncate">
            {entrada.esLocal ? 'vs' : '@'} {entrada.rivalNombre}
          </p>
        )}
      </div>
      {entrada.jugado ? (
        <span className="font-black tabular-nums px-2.5 py-1 rounded-lg bg-neutral-800 text-sm shrink-0">
          {entrada.golesPropios} - {entrada.golesRival}
        </span>
      ) : entrada.rivalNombre ? (
        <span className="text-[10px] font-bold uppercase tracking-wide text-neutral-500 bg-neutral-800/70 px-2 py-1 rounded-full shrink-0">
          Pendiente
        </span>
      ) : null}
    </button>
  );
}

export function PantallaCalendario({
  onVolver,
  onIrA,
}: {
  onVolver: () => void;
  onIrA: (pantalla: PantallaDeEntrada) => void;
}) {
  const liga = useGameStore((s) => s.liga);
  const {
    entradas, proxima, nombresCompetenciasProxima, simularProximaSemana,
  } = useProximaSemana();

  if (entradas.length === 0 || !liga) return null;

  const porSemana = new Map<number, EntradaCalendario[]>();
  entradas.forEach((e) => {
    const lista = porSemana.get(e.semana) ?? [];
    lista.push(e);
    porSemana.set(e.semana, lista);
  });
  const semanas = [...porSemana.keys()].sort((a, b) => a - b);

  // Semana "actual" para el marcador y la etiqueta de arriba: la próxima
  // pendiente, o — si ya no queda nada por simular — la última semana con
  // algo en la línea de tiempo, para que el marcador no desaparezca sin
  // más al terminar la temporada.
  const semanaActual = proxima ? proxima.semana : (semanas.length > 0 ? semanas[semanas.length - 1] : null);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center text-base shadow-lg shadow-orange-500/20">
            📅
          </div>
          <h1 className="font-bold">Calendario — Temporada {liga.temporadaActual}</h1>
        </div>
        <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      <p className="text-xs text-neutral-500 -mt-2">
        Junta liga, copas, mercado y pretemporada en una sola línea de tiempo. Las semanas de copa son aproximadas
        (el motor no comparte un calendario real entre competencias) — tocá cualquier fila para ir a simularla.
      </p>

      {semanas.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <FechaActual semana={semanaActual} />
          <TiraSemanas semanas={semanas} porSemana={porSemana} semanaActual={semanaActual} onIrA={onIrA} />
        </div>
      )}

      {proxima ? (
        <button
          type="button"
          onClick={simularProximaSemana}
          className="self-start bg-gradient-to-br from-orange-400 to-orange-500 hover:brightness-105 text-black font-bold rounded-xl px-4 py-2.5 text-sm shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-transform"
        >
          ▶ Simular {tituloSemana(proxima.semana)} — {nombresCompetenciasProxima.join(', ')}
        </button>
      ) : (
        <p className="text-sm text-emerald-400 font-medium flex items-center gap-1.5">✓ No queda nada pendiente por simular en el calendario.</p>
      )}

      {semanas.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-8">Todavía no hay nada para mostrar.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {semanas.map((semana) => (
            <div
              key={semana}
              className={`bg-neutral-900 border rounded-xl p-3.5 transition-colors duration-500 ${
                semana === semanaActual ? 'border-orange-500/60 shadow-lg shadow-orange-500/5' : 'border-neutral-800'
              }`}
            >
              <p className={`text-xs font-bold uppercase tracking-wide mb-1.5 ${semana === semanaActual ? 'text-orange-400' : 'text-neutral-400'}`}>
                {tituloSemana(semana)}
              </p>
              <div className="flex flex-col">
                {porSemana.get(semana)!.map((entrada) => (
                  <FilaEntrada key={entrada.id} entrada={entrada} onClick={() => onIrA(entrada.pantalla)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
