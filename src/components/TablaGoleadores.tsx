// Tabla de goleadores compartida — antes sólo existía en PantallaLiga,
// pedido explícito: sumarla al resto de competiciones (Copa Nacional,
// Libertadores/Sudamericana, Champions/Europa/Conference, Mundial de
// Clubes). Ojo: lee `estadisticasTemporada`, que es un acumulado de TODA
// la temporada del jugador (liga + todas las copas que jugó, ver
// aplicarGolesDeCopaAlClub en useGameStore.ts) — no hay un desglose "sólo
// goles de esta copa" todavía, así que esta tabla siempre muestra el
// total de la temporada, sea cual sea la pantalla desde la que se mire.

import { tablaGoleadores } from '../engine/estadisticasPartido';
import type { Club } from '../types';

export function TablaGoleadores({
  clubes, clubIds, clubUsuarioId, onVerJugador, onVerClub,
}: {
  clubes: Record<string, Club>;
  clubIds: string[];
  clubUsuarioId: string | null;
  onVerJugador: (clubId: string, jugadorId: string) => void;
  onVerClub: (clubId: string) => void;
}) {
  const goleadores = tablaGoleadores(clubes, clubIds);

  if (goleadores.length === 0) {
    return <p className="text-sm text-neutral-500 text-center py-6">Todavía no se jugó ningún partido esta temporada.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs md:text-sm border-collapse">
        <thead>
          <tr className="text-neutral-500 text-left">
            <th className="py-1.5 pr-2">#</th>
            <th className="py-1.5 pr-2">Jugador</th>
            <th className="py-1.5 pr-2">Club</th>
            <th className="py-1.5 px-1.5 text-center">PJ</th>
            <th className="py-1.5 px-1.5 text-center">Goles</th>
            <th className="py-1.5 pl-2 text-center">Asist.</th>
          </tr>
        </thead>
        <tbody>
          {goleadores.map((fila, i) => (
            <tr
              key={fila.jugadorId}
              className={`border-t border-neutral-800 ${fila.clubId === clubUsuarioId ? 'bg-orange-500/10 font-semibold' : ''}`}
            >
              <td className="py-1.5 pr-2 text-neutral-500">{i + 1}</td>
              <td className="py-1.5 pr-2">
                <button
                  type="button"
                  className="hover:text-orange-400 hover:underline text-left"
                  onClick={() => onVerJugador(fila.clubId, fila.jugadorId)}
                >
                  {fila.nombre}
                </button>
              </td>
              <td className="py-1.5 pr-2 text-neutral-400">
                <button type="button" className="hover:text-orange-400 hover:underline text-left" onClick={() => onVerClub(fila.clubId)}>
                  {fila.clubNombre}
                </button>
              </td>
              <td className="py-1.5 px-1.5 text-center">{fila.pj}</td>
              <td className="py-1.5 px-1.5 text-center font-bold">{fila.goles}</td>
              <td className="py-1.5 pl-2 text-center">{fila.asistencias}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
