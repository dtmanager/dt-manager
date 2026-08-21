// Plantel completo de CUALQUIER club (no sólo el del usuario) — se
// entra clickeando un club en la tabla de la liga. Agrupado por posición
// como el resto de las pantallas de plantel, cada jugador lleva al mismo
// perfil (PantallaPerfilJugador) que ya se usa para el plantel propio.

import type { Club } from '../types';
import { claseCuadrado } from '../data/coloresPosicion';
import { formatoMonto } from '../utils/formato';
import { POSICIONES } from '../data/posiciones';

export function PantallaPlantelClub({
  club,
  clubUsuarioId,
  onVolver,
  onVerJugador,
}: {
  club: Club;
  clubUsuarioId: string | null;
  onVolver: () => void;
  onVerJugador: (jugadorId: string) => void;
}) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <div>
          <h1 className="font-bold">{club.nombre}</h1>
          <p className="text-xs text-neutral-500">{club.liga} · NC {club.nc} · {club.plantel.length} jugadores</p>
        </div>
        <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      {club.id === clubUsuarioId && (
        <p className="text-xs text-orange-400 -mt-2">Este es tu club.</p>
      )}

      <div className="flex flex-col gap-4" style={{ animation: 'fadeIn .35s ease-out both' }}>
        {POSICIONES.map((posicion) => {
          const jugadores = club.plantel
            .filter((j) => j.posicion === posicion)
            .sort((a, b) => b.grl - a.grl);
          if (jugadores.length === 0) return null;

          return (
            <div key={posicion} className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-neutral-400">{posicion}</p>
              {jugadores.map((j) => {
                const esTitular = club.titularesIds.includes(j.id);
                const esSuplente = club.suplentesIds.includes(j.id);
                return (
                  <button
                    type="button"
                    key={j.id}
                    onClick={() => onVerJugador(j.id)}
                    className="flex items-center gap-2.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-2 text-left hover:border-orange-500/40"
                  >
                    <div className={`w-9 h-9 shrink-0 rounded flex items-center justify-center font-bold text-sm ${claseCuadrado(j.posicion)}`}>
                      {j.grl}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate flex items-center gap-1.5">
                        {j.dorsal != null && <span className="text-neutral-500 font-normal">#{j.dorsal}</span>}
                        {j.nombre}
                        {j.esJoya && (
                          <span className="text-[9px] bg-fuchsia-500/20 text-fuchsia-400 rounded px-1 py-0.5 font-semibold shrink-0">
                            PROMESA
                          </span>
                        )}
                        {esTitular && (
                          <span className="text-[9px] bg-orange-500/20 text-orange-400 rounded px-1 py-0.5 font-semibold shrink-0">
                            TITULAR
                          </span>
                        )}
                        {esSuplente && (
                          <span className="text-[9px] bg-neutral-700 text-neutral-300 rounded px-1 py-0.5 font-semibold shrink-0">
                            SUPLENTE
                          </span>
                        )}
                        {(j.partidosLesionRestantes ?? 0) > 0 && (
                          <span className="text-[9px] bg-red-500/20 text-red-400 rounded px-1 py-0.5 font-semibold shrink-0">
                            LESIONADO ({j.partidosLesionRestantes})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500">
                        POT {j.pot} · {j.edad} años · {formatoMonto(j.valorMercado)} · contrato {j.contratoAniosRestantes}a
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
