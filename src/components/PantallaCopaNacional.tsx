// Copa nacional (prompt-copas-manager-app.md): bracket de eliminación
// directa, participan todos los clubes de la liga doméstica. Cada acción
// resuelve la ronda entera (las llaves acá son 1 partido, no tiene
// sentido una pausa "fecha por fecha" como en la liga/grupos).

import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { PantallaDetallePartido } from './PantallaDetallePartido';
import { BracketRonda } from './BracketRonda';
import { TablaGoleadores } from './TablaGoleadores';
import type { Partido } from '../types';

export function PantallaCopaNacional({
  onVolver, onVerClub, onVerJugador,
}: {
  onVolver: () => void; onVerClub: (clubId: string) => void; onVerJugador: (clubId: string, jugadorId: string) => void;
}) {
  const { copaNacional, clubes: clubesLiga, clubUsuarioId } = useGameStore();
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<Partido | null>(null);
  const [vista, setVista] = useState<'competencia' | 'goleadores'>('competencia');

  if (!copaNacional) return null;
  const { nombre, clubes: clubesCopa, rondas, campeonId, clasificadosPendientes } = copaNacional;
  // La versión EN VIVO (clubesLiga) siempre gana sobre la foto fija de la
  // copa — mismo criterio que todosLosClubesVisibles en App.tsx, para que
  // la tabla de goleadores refleje los goles ya sumados en useGameStore.ts.
  const clubes = { ...clubesCopa, ...clubesLiga };
  const clubIdsCompetencia = Object.keys(clubesCopa);

  // Bug reportado ("a veces los nombres de los jugadores aparecen ?"):
  // el detalle de un partido puntual necesita la foto fija de la copa,
  // NO clubesLiga en vivo — si un jugador anotó para un club y DESPUÉS
  // se transfirió a otro, el plantel EN VIVO de ese club ya no lo tiene y
  // nombreJugador() (PantallaDetallePartido.tsx) cae a "?". Mismo bug ya
  // resuelto para Conmebol/Uefa/Mundial (ver el comentario grande en
  // PantallaCopaConmebol.tsx) — acá faltaba aplicarlo. clubesLiga sólo se
  // mezcla para el club del usuario, que es el único que se mantiene
  // sincronizado a propósito.
  const clubesParaDetalle = clubUsuarioId && clubesLiga[clubUsuarioId]
    ? { ...clubesCopa, [clubUsuarioId]: clubesLiga[clubUsuarioId] }
    : clubesCopa;

  if (partidoSeleccionado) {
    return (
      <PantallaDetallePartido
        partido={partidoSeleccionado}
        clubes={clubesParaDetalle}
        onCerrar={() => setPartidoSeleccionado(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <h1 className="font-bold">{nombre}</h1>
        <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      {/* Pedido explícito: "borra todos los simular fecha que no sean el
          de calendario" — esta pantalla pasa a ser de sólo lectura
          (bracket/goleadores); la simulación vive en Calendario/Hub. */}
      {campeonId && (
        // Animación de festejo (pedido explícito, ver .revealCarta en
        // index.css — ya existía en el catálogo del rediseño pero nunca se
        // había conectado a nada) — el mismo momento en las 4 copas
        // (Nacional/Conmebol/Uefa/Mundial) usa este mismo bloque.
        <div
          className="bg-gradient-to-b from-orange-500/20 to-orange-500/5 border border-orange-500/40 rounded-xl p-5 flex flex-col items-center gap-1.5"
          style={{ animation: 'revealCarta .6s cubic-bezier(.2,.8,.2,1) both' }}
        >
          <span className="text-3xl">🏆</span>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-400">Campeón</p>
          <button type="button" onClick={() => onVerClub(campeonId)} className="text-xl font-black hover:text-orange-400 hover:underline">
            {clubes[campeonId]?.nombre ?? campeonId}
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setVista('competencia')}
          className={`text-sm px-3 py-1.5 rounded-full border ${
            vista === 'competencia' ? 'bg-orange-500 text-black border-orange-500' : 'border-neutral-700 text-neutral-400'
          }`}
        >
          Competencia
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

      {vista === 'competencia' && (
        <div className="flex flex-col gap-4" style={{ animation: 'fadeIn .35s ease-out both' }}>
          {[...rondas].reverse().map((ronda, i) => (
            <BracketRonda
              key={`${ronda.nombre}-${rondas.length - i}`}
              nombre={ronda.nombre}
              llaves={ronda.llaves}
              clubes={clubes}
              clubUsuarioId={clubUsuarioId}
              onVerPartido={setPartidoSeleccionado}
            />
          ))}
          {clasificadosPendientes.length > 0 && !campeonId && (
            <p className="text-xs text-neutral-500 flex flex-wrap items-center gap-1">
              Pasan directo a la próxima ronda (sorteo):
              {clasificadosPendientes.map((id, i) => (
                <span key={id}>
                  <button type="button" onClick={() => onVerClub(id)} className="hover:text-orange-400 hover:underline">
                    {clubes[id]?.nombre ?? id}
                  </button>
                  {i < clasificadosPendientes.length - 1 ? ',' : '.'}
                </span>
              ))}
            </p>
          )}
        </div>
      )}

      {vista === 'goleadores' && (
        <TablaGoleadores
          clubes={clubes}
          clubIds={clubIdsCompetencia}
          clubUsuarioId={clubUsuarioId}
          onVerJugador={onVerJugador}
          onVerClub={onVerClub}
        />
      )}
    </div>
  );
}
