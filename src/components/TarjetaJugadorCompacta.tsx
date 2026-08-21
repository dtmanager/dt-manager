// Tarjeta de jugador compacta (sección 8.2): para la lista de plantel en
// la pantalla de armar equipo. Arrastrable con @dnd-kit. El potencial no
// se muestra (a propósito — no se supone que el DT lo sepa con certeza);
// la única pista es el tag "PROMESA" cuando esJoya.

import { useDraggable } from '@dnd-kit/core';
import type { Jugador } from '../types';
import { claseCuadrado } from '../data/coloresPosicion';
import { estaDisponible } from '../engine/desgaste';

// Bug reportado ("cuando un jugador se lesiona o está expulsado que no
// te deje volver a ponerlo"): antes se podía arrastrar cualquier jugador
// al 11 titular sin importar si estaba lesionado o suspendido — sólo se
// avisaba (sin bloquear) por jugar fuera de puesto, que es una decisión
// táctica válida, a diferencia de poner a alguien que no puede jugar.
// `disabled` en useDraggable corta el drag de raíz (no llega ni a
// empezar), más defendible que dejarlo soltar y rechazarlo recién ahí.
export function TarjetaJugadorCompacta({ jugador, enUso }: { jugador: Jugador; enUso?: boolean }) {
  const disponible = estaDisponible(jugador);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: jugador.id,
    data: { jugador },
    disabled: !disponible,
  });

  return (
    <div
      ref={setNodeRef}
      {...(disponible ? listeners : {})}
      {...attributes}
      style={
        transform
          ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50, position: 'relative' }
          : undefined
      }
      className={`flex items-center gap-2.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-2 select-none ${
        disponible ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'
      } ${isDragging ? 'opacity-40' : ''} ${enUso ? 'opacity-50' : ''} ${!disponible ? 'opacity-60' : ''}`}
    >
      <div className={`w-9 h-9 shrink-0 rounded flex items-center justify-center font-bold text-sm ${claseCuadrado(jugador.posicion)}`}>
        {jugador.grl}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate flex items-center gap-1.5">
          {jugador.dorsal != null && <span className="text-neutral-500 font-normal">#{jugador.dorsal}</span>}
          {jugador.nombre}
          {jugador.esJoya && (
            <span className="text-[9px] bg-fuchsia-500/20 text-fuchsia-400 rounded px-1 py-0.5 font-semibold">
              PROMESA
            </span>
          )}
          {(jugador.partidosLesionRestantes ?? 0) > 0 && (
            <span className="text-[9px] bg-red-500/20 text-red-400 rounded px-1 py-0.5 font-semibold shrink-0">
              LESIONADO ({jugador.partidosLesionRestantes})
            </span>
          )}
          {(jugador.partidosSuspensionRestantes ?? 0) > 0 && (
            <span className="text-[9px] bg-amber-500/20 text-amber-400 rounded px-1 py-0.5 font-semibold shrink-0">
              SUSPENDIDO ({jugador.partidosSuspensionRestantes})
            </span>
          )}
        </div>
        <div className="text-xs text-neutral-500">
          {jugador.posicion} · {jugador.edad} años
        </div>
      </div>
    </div>
  );
}
