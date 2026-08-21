// Círculo droppable de la cancha (sección 8.4): muestra el jugador
// asignado o vacío. Color según la posición del slot (ARQ naranja, DEF
// azul, MED verde, DEL rojo) — el color es el del SLOT, no el del
// jugador puesto ahí: desde sub-stats-diseno.md sección 7.6 se puede
// poner a un jugador fuera de su puesto nativo (con aviso de aptitud en
// vez de bloqueo, salvo el cruce ARQ↔resto, ver handleDragEnd).

import { useDroppable } from '@dnd-kit/core';
import type { Jugador } from '../types';
import type { SlotFormacion } from '../data/formaciones';
import { claseCirculo } from '../data/coloresPosicion';
import { grlEfectivoEnPosicion } from '../engine/subStats';

function primerApellido(nombreCompleto: string): string {
  const partes = nombreCompleto.split(' ');
  return partes[partes.length - 1];
}

export function SlotCancha({ slot, jugador }: { slot: SlotFormacion; jugador: Jugador | null }) {
  const { setNodeRef, isOver } = useDroppable({ id: `titular-${slot.id}`, data: { tipo: 'titular', slotId: slot.id } });

  // Fuera de puesto se muestra la aptitud real en ese slot, no el grl
  // nativo — si no, el círculo no reflejaba en nada la penalización que
  // sub-stats-diseno.md §7.6 calcula (el aviso sólo se ve un instante al
  // soltar). En rojo/naranja cuando cae, para que se note a simple vista.
  const fueraDePuesto = jugador != null && jugador.posicion !== slot.posicion;
  const valorMostrado = jugador
    ? (fueraDePuesto ? Math.round(grlEfectivoEnPosicion(jugador, slot.posicion)) : jugador.grl)
    : null;

  return (
    <div
      ref={setNodeRef}
      style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
    >
      <div
        className={`w-14 h-14 rounded-full flex flex-col items-center justify-center text-xs font-bold border-2 transition-colors ${
          isOver ? 'border-white bg-white/20' : claseCirculo(slot.posicion)
        }`}
      >
        {jugador ? (
          <span className={fueraDePuesto ? 'text-red-400' : ''}>{valorMostrado}</span>
        ) : (
          <span className="text-neutral-500">{slot.posicion}</span>
        )}
      </div>
      <span className="text-[10px] text-center max-w-16 truncate text-neutral-300">
        {jugador && jugador.dorsal != null && <span className="text-neutral-500">#{jugador.dorsal} </span>}
        {jugador ? primerApellido(jugador.nombre) : ''}
      </span>
    </div>
  );
}
