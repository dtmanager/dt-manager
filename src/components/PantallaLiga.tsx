// M4: tabla de posiciones + simular la próxima fecha o el fixture entero.
// La tabla se recalcula siempre desde el fixture (calcularTabla), nunca se
// guarda aparte, para que no se pueda desincronizar.

import {
  useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react';
import { useGameStore } from '../store/useGameStore';
import { calcularTabla, proximaFechaSinJugar } from '../engine/fixture';
import { PantallaDetallePartido } from './PantallaDetallePartido';
import { ResultadosFecha } from './ResultadosFecha';
import { TablaGoleadores } from './TablaGoleadores';
import type { Partido, TablaPosiciones } from '../types';

// Conteo animado de puntos (mismo criterio que useConteo en PantallaHub —
// duplicado a propósito acá: es chico, y son los dos únicos usos en todo
// el proyecto, no vale la pena un módulo compartido para esto todavía).
function useConteo(valorObjetivo: number, duracionMs = 500): number {
  const [valor, setValor] = useState(valorObjetivo);
  const previoRef = useRef(valorObjetivo);
  const montadoRef = useRef(false);

  useEffect(() => {
    const desde = montadoRef.current ? previoRef.current : valorObjetivo;
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

// Fila de tabla con FLIP (First-Last-Invert-Play, "usar transition de
// posición, no sólo de color" — pedido del documento de rediseño, sección
// 5.3/5.4): en vez de que el navegador simplemente reordene el DOM de
// golpe al simular una fecha (los clubes saltan a su nueva posición sin
// transición), cada fila mide dónde estaba ANTES de este render, calcula
// la diferencia con dónde quedó DESPUÉS, y anima esa diferencia con
// `transform` — se ve la fila "deslizarse" hasta su nuevo puesto en la
// tabla en vez de teletransportarse, mismo criterio que ya usa el
// marcador de "hoy" en la tira de semanas del calendario.
function FilaTabla({
  fila, nombre, indice, esPropio, onVerClub, filaRefs,
}: {
  fila: TablaPosiciones; nombre: string; indice: number; esPropio: boolean; onVerClub: (clubId: string) => void;
  filaRefs: React.MutableRefObject<Map<string, HTMLTableRowElement>>;
}) {
  const pts = useConteo(fila.pts);
  return (
    <tr
      ref={(el) => {
        if (el) filaRefs.current.set(fila.clubId, el);
        else filaRefs.current.delete(fila.clubId);
      }}
      className={`border-t border-neutral-800 ${esPropio ? 'bg-orange-500/10 font-semibold' : ''}`}
    >
      <td className="py-1.5 pr-2 text-neutral-500">{indice + 1}</td>
      <td className="py-1.5 pr-2">
        <button type="button" className="hover:text-orange-400 hover:underline text-left" onClick={() => onVerClub(fila.clubId)}>
          {nombre}
        </button>
      </td>
      <td className="py-1.5 px-1.5 text-center">{fila.pj}</td>
      <td className="py-1.5 px-1.5 text-center">{fila.pg}</td>
      <td className="py-1.5 px-1.5 text-center">{fila.pe}</td>
      <td className="py-1.5 px-1.5 text-center">{fila.pp}</td>
      <td className="py-1.5 px-1.5 text-center">{fila.gf}</td>
      <td className="py-1.5 px-1.5 text-center">{fila.gc}</td>
      <td className="py-1.5 px-1.5 text-center">{fila.gf - fila.gc}</td>
      <td className="py-1.5 pl-2 text-center font-bold tabular-nums">{pts}</td>
    </tr>
  );
}

export function PantallaLiga({
  onVolver,
  onFinDeTemporada,
  onVerClub,
  onVerJugador,
}: {
  onVolver: () => void;
  onFinDeTemporada: () => void;
  onVerClub: (clubId: string) => void;
  onVerJugador: (clubId: string, jugadorId: string) => void;
}) {
  const {
    liga, clubes, clubUsuarioId, procesarFinDeTemporada, ultimasLesiones, ultimasTarjetas,
  } = useGameStore();
  const [vista, setVista] = useState<'posiciones' | 'goleadores'>('posiciones');
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<Partido | null>(null);

  const tabla = useMemo(() => (liga ? calcularTabla(liga.fixture, liga.clubIds) : []), [liga]);
  const proximaFecha = liga ? proximaFechaSinJugar(liga.fixture) : null;
  const totalFechas = liga ? Math.max(...liga.fixture.map((p) => p.fecha)) : 0;

  const fechaJugada = proximaFecha == null ? totalFechas : proximaFecha - 1;
  const ultimosResultados = useMemo(() => {
    if (!liga || fechaJugada < 1) return [];
    return liga.fixture.filter((p) => p.fecha === fechaJugada && p.golesLocal != null);
  }, [liga, fechaJugada]);

  // FLIP de la tabla (pedido explícito: "usar transition de posición, no
  // sólo de color" — documento de rediseño, sección 5.3/5.4): en cada
  // render donde el orden pudo haber cambiado, se mide dónde quedó cada
  // fila DESPUÉS de la actualización del DOM y se compara contra dónde
  // estaba en la medición anterior — la diferencia se aplica como un
  // `transform` instantáneo (sin transición) y al frame siguiente se
  // "suelta" con una transición larga, así el navegador anima la fila
  // deslizándose desde su posición vieja a la nueva en vez de que el
  // reordenamiento del DOM se vea como un salto.
  const filaRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const posicionesPrevias = useRef<Map<string, number>>(new Map());
  // Si se cambia a la pestaña de Goleadores la tabla se desmonta — al
  // volver, las posiciones guardadas quedan viejas (de antes de irse) y
  // compararlas contra las nuevas dispararía un FLIP falso sólo por
  // cambiar de pestaña, no por un simulado real. Se limpia acá para que
  // volver a Posiciones siempre arranque "en blanco" (sin animar).
  useEffect(() => {
    if (vista !== 'posiciones') posicionesPrevias.current.clear();
  }, [vista]);
  useLayoutEffect(() => {
    filaRefs.current.forEach((el, clubId) => {
      const anterior = posicionesPrevias.current.get(clubId);
      if (anterior == null) return;
      const actual = el.getBoundingClientRect().top;
      const delta = anterior - actual;
      if (delta === 0) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${delta}px)`;
      requestAnimationFrame(() => {
        el.style.transition = 'transform 500ms cubic-bezier(.2,.8,.2,1)';
        el.style.transform = '';
      });
    });
    filaRefs.current.forEach((el, clubId) => {
      posicionesPrevias.current.set(clubId, el.getBoundingClientRect().top);
    });
  }, [tabla]);

  if (!liga || !clubUsuarioId) return null;

  if (partidoSeleccionado) {
    return (
      <PantallaDetallePartido
        partido={partidoSeleccionado}
        clubes={clubes}
        onCerrar={() => setPartidoSeleccionado(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <h1 className="font-bold">{liga.nombre} — Temporada {liga.temporadaActual}</h1>
        <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      {/* Pedido explícito: "borra todos los simular fecha que no sean el
          de calendario" — Liga pasa a ser de sólo lectura (tabla/
          resultados); toda la simulación (de a una fecha o de un saque)
          vive en Calendario (paso a paso) y el Hub ("Simular temporada
          completa"). Sólo se queda Cerrar temporada, que no simula nada,
          cierra la que ya terminó. */}
      <div className="flex gap-2 flex-wrap">
        {proximaFecha == null && (
          <button
            type="button"
            onClick={() => {
              // Evoluciona jugadores/contratos/canteranos, cobra el
              // premio/taquilla y paga sueldos, y decide clasificación a
              // la Copa (o descenso). La temporada siguiente (fixture
              // nuevo) recién arranca cuando el usuario confirma en la
              // pantalla de resumen — así el resumen refleja la
              // temporada que acaba de terminar, no la próxima.
              procesarFinDeTemporada();
              onFinDeTemporada();
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg px-4 py-2 text-sm"
          >
            Cerrar temporada
          </button>
        )}
      </div>

      {ultimasLesiones.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-xs font-semibold text-red-400 mb-2">
            Lesiones en tu plantel ({ultimasLesiones.length})
          </p>
          {/* "Simular temporada completa" junta las lesiones de TODAS las
              fechas de una — con tu 11 fijo jugando ~58 fechas seguidas esa
              lista fácil pasa los 20-25 casos, así que scrollea en vez de
              volverse un panel gigante (pedido explícito). */}
          <div className="flex flex-col gap-1 text-sm max-h-56 overflow-y-auto pr-1">
            {ultimasLesiones.map((l, i) => (
              // "Simular temporada completa" junta lesiones de MUCHAS
              // fechas de una — el mismo jugador puede lesionarse más de
              // una vez en ese lote (se recupera y se vuelve a lesionar
              // más adelante), así que jugadorId solo no alcanza como key
              // (encontrado con la key duplicada real, no un problema de
              // generación de ids: ver idUnico en engine/nombres.ts).
              <div key={`${l.jugadorId}-${i}`} className="flex justify-between text-neutral-300">
                <span>{l.nombre}</span>
                <span className="text-red-400">{l.gravedad} · {l.partidosBaja} fechas afuera</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ultimasTarjetas.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-xs font-semibold text-yellow-400 mb-2">
            Suspensiones en tu plantel ({ultimasTarjetas.length})
          </p>
          <div className="flex flex-col gap-1 text-sm max-h-56 overflow-y-auto pr-1">
            {ultimasTarjetas.map((t, i) => (
              // Mismo motivo que la key de ultimasLesiones más abajo: un
              // jugador puede acumular más de una suspensión en un lote de
              // "Simular temporada completa".
              <div key={`${t.jugadorId}-${i}`} className="flex justify-between text-neutral-300">
                <span>{t.nombre}</span>
                <span className="text-yellow-400">{t.tipo === 'roja' ? '🟥 roja' : '🟨 5ta amarilla'} · próxima fecha afuera</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ResultadosFecha
        titulo={`Resultados — Fecha ${fechaJugada}`}
        resultados={ultimosResultados}
        clubes={clubes}
        clubUsuarioId={clubUsuarioId}
        onVerPartido={setPartidoSeleccionado}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setVista('posiciones')}
          className={`text-sm px-3 py-1.5 rounded-full border ${
            vista === 'posiciones' ? 'bg-orange-500 text-black border-orange-500' : 'border-neutral-700 text-neutral-400'
          }`}
        >
          Posiciones
        </button>
        <button
          type="button"
          onClick={() => setVista('goleadores')}
          className={`text-sm px-3 py-1.5 rounded-full border ${
            vista === 'goleadores' ? 'bg-orange-500 text-black border-orange-500' : 'border-neutral-700 text-neutral-400'
          }`}
        >
          Goleadores
        </button>
      </div>

      {vista === 'posiciones' && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm border-collapse">
            <thead>
              <tr className="text-neutral-500 text-left">
                <th className="py-1.5 pr-2">#</th>
                <th className="py-1.5 pr-2">Club</th>
                <th className="py-1.5 px-1.5 text-center">PJ</th>
                <th className="py-1.5 px-1.5 text-center">PG</th>
                <th className="py-1.5 px-1.5 text-center">PE</th>
                <th className="py-1.5 px-1.5 text-center">PP</th>
                <th className="py-1.5 px-1.5 text-center">GF</th>
                <th className="py-1.5 px-1.5 text-center">GC</th>
                <th className="py-1.5 px-1.5 text-center">DG</th>
                <th className="py-1.5 pl-2 text-center">PTS</th>
              </tr>
            </thead>
            <tbody>
              {tabla.map((fila, i) => (
                <FilaTabla
                  key={fila.clubId}
                  fila={fila}
                  nombre={clubes[fila.clubId]?.nombre ?? fila.clubId}
                  indice={i}
                  esPropio={fila.clubId === clubUsuarioId}
                  onVerClub={onVerClub}
                  filaRefs={filaRefs}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {vista === 'goleadores' && (
        <TablaGoleadores
          clubes={clubes}
          clubIds={liga.clubIds}
          clubUsuarioId={clubUsuarioId}
          onVerJugador={onVerJugador}
          onVerClub={onVerClub}
        />
      )}
    </div>
  );
}
