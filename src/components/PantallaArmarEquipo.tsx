// Pantalla clave de M3 (sección 8.4): drag & drop de jugadores del plantel
// a la cancha (11 titulares según la formación elegida). Estado de
// edición local — recién se guarda en el store al confirmar. Los
// suplentes ya no se arman a mano acá: al confirmar se toma automáticamente
// TODO el resto del plantel que no quedó de titular (sin cupo fijo).

import { useEffect, useMemo, useState } from 'react';
import { DndContext, type DragEndEvent, useDroppable } from '@dnd-kit/core';
import { FORMACIONES, NOMBRES_FORMACION, type NombreFormacion } from '../data/formaciones';
import { TarjetaJugadorCompacta } from './TarjetaJugadorCompacta';
import type { Jugador, Posicion } from '../types';
import type { MentalidadPartido } from '../engine/partido';
import { useGameStore } from '../store/useGameStore';
import { SlotCancha } from './SlotCancha';
import { BUCKET_DE_POSICION, POSICIONES } from '../data/posiciones';
import { grlEfectivoEnPosicion } from '../engine/subStats';
import { estaDisponible } from '../engine/desgaste';
import { inicialesClub } from '../utils/formato';

// A partir de qué caída de aptitud (grl nativo vs. grl efectivo en el
// puesto nuevo) se avisa al usuario — sub-stats-diseno.md sección 7.6,
// umbral marcado ahí como estimación inicial a ajustar jugando.
const UMBRAL_AVISO_APTITUD = 15;

const FILTROS: { id: Posicion | 'TODOS'; label: string }[] = [
  { id: 'TODOS', label: 'Todos' },
  ...POSICIONES.map((id) => ({ id, label: id })),
];

function ListaDroppable({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'banco' });
  return (
    <div ref={setNodeRef} className={`flex flex-col gap-2 rounded-lg p-1 ${isOver ? 'bg-neutral-800/50' : ''}`}>
      {children}
    </div>
  );
}

function promedio(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((acc, v) => acc + v, 0) / valores.length;
}

// Gradiente por color (pedido explícito, rediseño general: "que el juego
// esté terminado") — mismo criterio visual que BarraFinanzas.tsx: arranca
// en 0% y recién al frame siguiente pasa al valor real, así el navegador
// SÍ anima el `width` (si arrancara ya en el valor final no habría nada
// que animar).
function BarraFuerza({ label, valor, gradiente }: { label: string; valor: number; gradiente: string }) {
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setAncho(Math.min(100, valor)), 50);
    return () => window.clearTimeout(id);
  }, [valor]);

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-400">{label}</span>
        <span className="font-bold text-neutral-200">{valor > 0 ? Math.round(valor) : '—'}</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${gradiente} transition-[width] duration-[900ms] ease-out`} style={{ width: `${ancho}%` }} />
      </div>
    </div>
  );
}

const MENTALIDADES: { id: MentalidadPartido; icono: string; label: string; desc: string }[] = [
  { id: 'defensivo', icono: '🛡️', label: 'Defensivo', desc: 'Menos goles a favor, menos en contra' },
  { id: 'equilibrado', icono: '⚖️', label: 'Equilibrado', desc: 'Sin ajuste' },
  { id: 'ofensivo', icono: '⚔️', label: 'Ofensivo', desc: 'Más goles a favor, más en contra' },
];

export function PantallaArmarEquipo({ onListo, onVolver }: { onListo: () => void; onVolver: () => void }) {
  const {
    clubUsuarioId, clubes, actualizarAlineacion, cambiarMentalidad,
  } = useGameStore();
  const club = clubUsuarioId ? clubes[clubUsuarioId] : null;

  const [formacion, setFormacion] = useState<NombreFormacion>((club?.formacion as NombreFormacion) ?? '4-4-2');
  const [titulares, setTitulares] = useState<Record<string, string | null>>(() => {
    const slotsIniciales = FORMACIONES[(club?.formacion as NombreFormacion) ?? '4-4-2'];
    // `club.titularesIds` viene agrupado por posición en el orden del tipo
    // Posicion (armarAlineacionInicial, liga.ts), NO en el orden de los
    // slots de la formación — emparejar por índice de array (como se hacía
    // antes) podía poner a un jugador en un slot de otra posición sin que
    // nadie lo haya arrastrado ahí. Acá se empareja cada slot con un
    // titular de SU MISMA posición nativa, consumiendo la lista de
    // candidatos de a uno por posición.
    const idsPorPosicion = new Map<Posicion, string[]>();
    (club?.titularesIds ?? []).forEach((id) => {
      const j = club?.plantel.find((p) => p.id === id);
      if (!j) return;
      const lista = idsPorPosicion.get(j.posicion) ?? [];
      lista.push(id);
      idsPorPosicion.set(j.posicion, lista);
    });
    const inicial: Record<string, string | null> = {};
    slotsIniciales.forEach((slot) => {
      const disponibles = idsPorPosicion.get(slot.posicion) ?? [];
      inicial[slot.id] = disponibles.shift() ?? null;
    });
    return inicial;
  });
  const [filtro, setFiltro] = useState<Posicion | 'TODOS'>('TODOS');
  const [aviso, setAviso] = useState<string | null>(null);

  const slots = FORMACIONES[formacion];

  const jugadorPorId = useMemo(() => {
    const mapa = new Map<string, Jugador>();
    club?.plantel.forEach((j) => mapa.set(j.id, j));
    return mapa;
  }, [club]);

  const idsEnCancha = useMemo(() => new Set(Object.values(titulares).filter((id): id is string => id != null)), [titulares]);

  const lista = useMemo(() => {
    const todos = club?.plantel ?? [];
    return filtro === 'TODOS' ? todos : todos.filter((j) => j.posicion === filtro);
  }, [club, filtro]);

  // Guarda el par jugador+slot (no sólo el jugador) para poder calcular la
  // fuerza real de cada línea según DÓNDE está parado cada uno, no según
  // su posición nativa — si no, un DEL puesto de emergencia en el fondo
  // seguía sumando al ataque y "vaciaba" la defensa en las barras de abajo
  // aunque esté jugando ahí (pedido explícito: que las barras reflejen la
  // aptitud real, no sólo un aviso al soltar).
  const titularesConSlot = useMemo(
    () =>
      slots
        .map((s) => {
          const id = titulares[s.id];
          const jugador = id ? jugadorPorId.get(id) : undefined;
          return jugador ? { slot: s, jugador } : null;
        })
        .filter((e): e is { slot: (typeof slots)[number]; jugador: Jugador } => e != null),
    [slots, titulares, jugadorPorId],
  );

  const fuerza = useMemo(() => {
    const efectivos = titularesConSlot.map(({ slot, jugador }) => ({
      bucket: BUCKET_DE_POSICION[slot.posicion],
      grlEfectivo: grlEfectivoEnPosicion(jugador, slot.posicion),
    }));
    return {
      // Fuerza por sector se sigue mostrando agregada en 3 barras
      // (Defensa/Mediocampo/Ataque) — el detalle de las 10 posiciones
      // puntuales ya se ve en el filtro de la lista y en la cancha.
      def: promedio(efectivos.filter((e) => e.bucket === 'DEF').map((e) => e.grlEfectivo)),
      med: promedio(efectivos.filter((e) => e.bucket === 'MED').map((e) => e.grlEfectivo)),
      del: promedio(efectivos.filter((e) => e.bucket === 'DEL').map((e) => e.grlEfectivo)),
      general: promedio(efectivos.map((e) => e.grlEfectivo)),
    };
  }, [titularesConSlot]);

  // Bug reportado ("las formaciones no cambian si cambias de forma"): esto
  // antes vaciaba los 11 slots de golpe al cambiar de formación, obligando
  // a rearmar el equipo a mano cada vez — se sentía como que cambiar de
  // formación "no hacía nada" porque lo único visible era perder toda la
  // selección. Ahora intenta CONSERVAR a cada titular actual en un slot de
  // su misma posición nativa dentro de la formación nueva (mismo criterio
  // de emparejamiento que ya usa el estado inicial más arriba) — sólo
  // queda vacío un slot si no sobra ningún titular de esa posición.
  function cambiarFormacion(nueva: NombreFormacion) {
    setFormacion(nueva);
    const nuevosSlots = FORMACIONES[nueva];
    const idsPorPosicion = new Map<Posicion, string[]>();
    Object.values(titulares).forEach((id) => {
      if (!id) return;
      const jugador = jugadorPorId.get(id);
      if (!jugador) return;
      const lista = idsPorPosicion.get(jugador.posicion) ?? [];
      lista.push(id);
      idsPorPosicion.set(jugador.posicion, lista);
    });
    const nuevo: Record<string, string | null> = {};
    nuevosSlots.forEach((slot) => {
      const disponibles = idsPorPosicion.get(slot.posicion) ?? [];
      nuevo[slot.id] = disponibles.shift() ?? null;
    });
    setTitulares(nuevo);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const jugadorId = String(active.id);
    const jugador = jugadorPorId.get(jugadorId);
    const destino = String(over.id);

    if (destino.startsWith('titular-')) {
      const slotId = destino.replace('titular-', '');
      const slot = slots.find((s) => s.id === slotId)!;
      // Bloqueo defensivo (la tarjeta ya no deja ni empezar el drag de un
      // jugador lesionado/suspendido — ver TarjetaJugadorCompacta) por si
      // el evento llega igual desde otro lado.
      if (jugador && !estaDisponible(jugador)) {
        const motivo = (jugador.partidosLesionRestantes ?? 0) > 0 ? 'está lesionado' : 'está suspendido';
        setAviso(`${jugador.nombre} ${motivo}, no puede jugar.`);
        window.setTimeout(() => setAviso(null), 2500);
        return;
      }
      if (jugador && jugador.posicion !== slot.posicion) {
        // Arquero no comparte perfil de sub-stats con el resto — sigue
        // bloqueado del todo (sub-stats-diseno.md sección 7.6: el cálculo
        // de aptitud no da un número con sentido para ese cruce).
        if (jugador.posicion === 'ARQ' || slot.posicion === 'ARQ') {
          setAviso(`${jugador.nombre} es ${jugador.posicion}, no puede jugar de ${slot.posicion}.`);
          window.setTimeout(() => setAviso(null), 2500);
          return;
        }
        // Entre posiciones de cancha ya no se bloquea — se avisa si la
        // aptitud cae mucho, pero se deja confirmar igual.
        const efectivo = grlEfectivoEnPosicion(jugador, slot.posicion);
        if (jugador.grl - efectivo > UMBRAL_AVISO_APTITUD) {
          setAviso(
            `${jugador.nombre} va a rendir peor de ${slot.posicion} (aptitud ${Math.round(efectivo)} vs. ${jugador.grl} en su puesto).`,
          );
          window.setTimeout(() => setAviso(null), 3000);
        }
      }
      setTitulares((actual) => {
        const nuevo = { ...actual };
        // Sacarlo de cualquier otro slot donde estuviera.
        Object.keys(nuevo).forEach((k) => {
          if (nuevo[k] === jugadorId) nuevo[k] = null;
        });
        nuevo[slotId] = jugadorId;
        return nuevo;
      });
    } else if (destino === 'banco') {
      setTitulares((actual) => {
        const nuevo = { ...actual };
        Object.keys(nuevo).forEach((k) => {
          if (nuevo[k] === jugadorId) nuevo[k] = null;
        });
        return nuevo;
      });
    }
  }

  if (!club) return null;

  const titularesCompletos = slots.every((s) => titulares[s.id] != null);

  function confirmar() {
    const titularesIds = slots.map((s) => titulares[s.id]).filter((id): id is string => id != null);
    // Suplentes = todo el resto del plantel que no quedó de titular (sin
    // cupo fijo — pedido explícito).
    const suplentesIds = (club!.plantel ?? [])
      .filter((j) => !titularesIds.includes(j.id))
      .sort((a, b) => b.grl - a.grl)
      .map((j) => j.id);
    actualizarAlineacion(club!.id, { formacion, titularesIds, suplentesIds });
    onListo();
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-screen bg-neutral-950 text-neutral-200 font-sans flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0 topbar-entrada">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center font-black text-xs shadow-lg shadow-orange-500/20">
              {inicialesClub(club.nombre)}
            </div>
            <h1 className="font-bold truncate">Armar equipo — {club.nombre}</h1>
          </div>
          <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200 shrink-0">
            ← Volver
          </button>
        </header>

        {aviso && (
          <div className="bg-red-500/20 text-red-300 text-sm text-center py-2 px-4 shrink-0">{aviso}</div>
        )}

        <div className="flex flex-1 flex-col lg:flex-row gap-4 p-4 min-h-0">
          <div className="lg:w-72 shrink-0 flex flex-col gap-2 min-h-0">
            <div className="flex gap-1 flex-wrap shrink-0">
              {FILTROS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltro(f.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    filtro === f.id ? 'bg-orange-500 text-black border-orange-500' : 'border-neutral-700 text-neutral-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              <ListaDroppable>
                {lista.map((j) => (
                  <TarjetaJugadorCompacta key={j.id} jugador={j} enUso={idsEnCancha.has(j.id)} />
                ))}
              </ListaDroppable>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="relative flex-1 min-h-0 rounded-xl bg-gradient-to-b from-green-800 to-green-900 border-2 border-green-700 overflow-hidden">
              <select
                value={formacion}
                onChange={(e) => cambiarFormacion(e.target.value as NombreFormacion)}
                className="absolute top-2 left-2 z-20 bg-neutral-950/80 border border-neutral-700 rounded px-2 py-1 text-sm"
              >
                {NOMBRES_FORMACION.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              {slots.map((slot) => (
                <SlotCancha
                  key={slot.id}
                  slot={slot}
                  jugador={titulares[slot.id] ? jugadorPorId.get(titulares[slot.id]!) ?? null : null}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={!titularesCompletos}
              onClick={confirmar}
              className="shrink-0 bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg shadow-orange-500/30 disabled:shadow-none disabled:bg-neutral-800 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 hover:brightness-105 text-black font-bold rounded-lg py-3"
            >
              {titularesCompletos ? 'Confirmar equipo' : `Faltan titulares (${slots.filter((s) => !titulares[s.id]).length})`}
            </button>
          </div>

          <div className="lg:w-56 shrink-0 flex flex-col gap-4 overflow-y-auto min-h-0">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-3">
              <p className="text-xs font-semibold text-neutral-300">Fuerza del equipo</p>
              <BarraFuerza label="Defensa" valor={fuerza.def} gradiente="from-blue-600 to-blue-400" />
              <BarraFuerza label="Mediocampo" valor={fuerza.med} gradiente="from-emerald-600 to-emerald-400" />
              <BarraFuerza label="Ataque" valor={fuerza.del} gradiente="from-red-600 to-red-400" />
              <div className="border-t border-neutral-800 pt-2">
                <BarraFuerza label="OVR del equipo" valor={fuerza.general} gradiente="from-orange-600 to-orange-400" />
              </div>
            </div>

            {/* Mentalidad de partido (pedido explícito, mecánica 2 de
                docs/que-le-falta-profundidad.md): queda puesta hasta que se
                vuelva a cambiar, no se elige partido por partido — se
                guarda directo en el club apenas se toca un botón, sin
                pasar por "Confirmar equipo". */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3.5 flex flex-col gap-2">
              <p className="text-xs font-semibold text-neutral-300">Mentalidad</p>
              <div className="flex flex-col gap-1.5">
                {MENTALIDADES.map((m) => {
                  const activa = (club.mentalidad ?? 'equilibrado') === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => cambiarMentalidad(club.id, m.id)}
                      className={`text-left rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                        activa ? 'border-orange-500 bg-orange-500/10 text-orange-300' : 'border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                    >
                      <span className="font-semibold">{m.icono} {m.label}</span>
                      <span className="block text-[10px] text-neutral-500">{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
}
