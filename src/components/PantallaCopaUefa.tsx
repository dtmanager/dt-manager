// UEFA Champions/Europa/Conference League ("formato real completo",
// pedido explícito) — fase de liga suiza (una sola tabla, 8 fechas, cada
// club contra rivales distintos), luego playoff de acceso (9no-24to) y
// knockout ida y vuelta. Mismo patrón visual que PantallaCopaConmebol,
// con una tabla única en vez de 8 grupos.

import { useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { proximaFechaSinJugar } from '../engine/fixture';
import { tablaSuiza } from '../engine/ligaSuiza';
import { PantallaDetallePartido } from './PantallaDetallePartido';
import { ResultadosFecha } from './ResultadosFecha';
import { BracketRonda } from './BracketRonda';
import { TablaGoleadores } from './TablaGoleadores';
import type { Partido } from '../types';

const DIRECTOS_A_OCTAVOS = 8;
const CLASIFICADOS_TOTAL = 24; // directos + banda de playoff (9no a 24to)

export function PantallaCopaUefa({
  onVolver, onVerClub, onVerJugador,
}: {
  onVolver: () => void; onVerClub: (clubId: string) => void; onVerJugador: (clubId: string, jugadorId: string) => void;
}) {
  const { copaUefa, clubes: clubesLiga, clubUsuarioId } = useGameStore();
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<Partido | null>(null);
  const [vista, setVista] = useState<'competencia' | 'goleadores'>('competencia');

  // Hooks arriba de cualquier return condicional — copaUefa puede ser
  // null en el primer render.
  const fixtureFaseLiga = copaUefa?.fixtureFaseLiga ?? [];
  const proximaFecha = copaUefa?.fase === 'fase-liga' ? proximaFechaSinJugar(fixtureFaseLiga) : null;
  const totalFechas = fixtureFaseLiga.length > 0 ? Math.max(...fixtureFaseLiga.map((p) => p.fecha)) : 0;
  const fechaJugada = proximaFecha == null ? totalFechas : proximaFecha - 1;
  const ultimosResultados = useMemo(() => {
    if (copaUefa?.fase !== 'fase-liga' || fechaJugada < 1) return [];
    return fixtureFaseLiga.filter((p) => p.fecha === fechaJugada && p.golesLocal != null);
  }, [fixtureFaseLiga, copaUefa?.fase, fechaJugada]);

  if (!copaUefa) return null;
  const {
    nombre, clubes: clubesCopa, clubIds, fase, usuarioEliminado, playoffAcceso, bracket, campeonId,
  } = copaUefa;
  // La versión EN VIVO (clubesLiga) gana sobre la foto fija de la copa
  // SÓLO para el club del usuario — ver el comentario largo en
  // PantallaCopaConmebol.tsx (mismo bug: mezclar clubesLiga entero rompía
  // el nombre de goleadores/pateadores de otros clubes por colisión de id
  // con generarClubesExtranjeros).
  const clubes = clubUsuarioId && clubesLiga[clubUsuarioId]
    ? { ...clubesCopa, [clubUsuarioId]: clubesLiga[clubUsuarioId] }
    : clubesCopa;

  if (partidoSeleccionado) {
    return (
      <PantallaDetallePartido
        partido={partidoSeleccionado}
        clubes={clubes}
        onCerrar={() => setPartidoSeleccionado(null)}
      />
    );
  }

  const tabla = fase === 'fase-liga' || fixtureFaseLiga.some((p) => p.golesLocal != null)
    ? tablaSuiza(fixtureFaseLiga, clubIds)
    : [];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <h1 className="font-bold">{nombre}</h1>
        <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      {campeonId && (
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

      {usuarioEliminado && fase !== 'campeon' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-center text-sm text-neutral-400">
          Quedamos eliminados de la {nombre} — el resto de la competencia sigue en juego.
        </div>
      )}

      {/* Pedido explícito: "borra todos los simular fecha que no sean el
          de calendario" — esta pantalla pasa a ser de sólo lectura
          (fase de liga/playoff/bracket/goleadores); la simulación vive en
          Calendario/Hub. */}
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
        <>
          {tabla.length > 0 && (fase === 'fase-liga' || fase === 'playoff-acceso') && (
            <div className="overflow-x-auto" style={{ animation: 'fadeIn .35s ease-out both' }}>
              <table className="w-full text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="text-neutral-500 text-left">
                    <th className="py-1.5 pr-2">#</th>
                    <th className="py-1.5 pr-2">Club</th>
                    <th className="py-1.5 px-1.5 text-center">PJ</th>
                    <th className="py-1.5 px-1.5 text-center">PG</th>
                    <th className="py-1.5 px-1.5 text-center">PE</th>
                    <th className="py-1.5 px-1.5 text-center">PP</th>
                    <th className="py-1.5 px-1.5 text-center">DG</th>
                    <th className="py-1.5 pl-2 text-center">PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {tabla.map((fila, i) => (
                    <tr
                      key={fila.clubId}
                      className={`border-t border-neutral-800 ${fila.clubId === clubUsuarioId ? 'bg-orange-500/10 font-semibold' : ''} ${
                        i === DIRECTOS_A_OCTAVOS - 1 || i === CLASIFICADOS_TOTAL - 1 ? 'border-b-2 border-b-orange-500/30' : ''
                      }`}
                    >
                      <td className="py-1.5 pr-2 text-neutral-500">{i + 1}</td>
                      <td className="py-1.5 pr-2">
                        <button type="button" onClick={() => onVerClub(fila.clubId)} className="hover:text-orange-400 hover:underline text-left">
                          {clubes[fila.clubId]?.nombre ?? fila.clubId}
                        </button>
                      </td>
                      <td className="py-1.5 px-1.5 text-center">{fila.pj}</td>
                      <td className="py-1.5 px-1.5 text-center">{fila.pg}</td>
                      <td className="py-1.5 px-1.5 text-center">{fila.pe}</td>
                      <td className="py-1.5 px-1.5 text-center">{fila.pp}</td>
                      <td className="py-1.5 px-1.5 text-center">{fila.gf - fila.gc}</td>
                      <td className="py-1.5 pl-2 text-center font-bold">{fila.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-neutral-500 mt-1">1º a 8º: directo a octavos. 9º a 24º: playoff de acceso.</p>
            </div>
          )}

          {fase === 'fase-liga' && (
            <ResultadosFecha
              titulo={`Resultados — Fecha ${fechaJugada}`}
              resultados={ultimosResultados}
              clubes={clubes}
              clubUsuarioId={clubUsuarioId}
              onVerPartido={setPartidoSeleccionado}
            />
          )}

          {fase === 'playoff-acceso' && (
            <BracketRonda
              nombre="Playoff de acceso — ida y vuelta"
              llaves={playoffAcceso}
              clubes={clubes}
              clubUsuarioId={clubUsuarioId}
              onVerPartido={setPartidoSeleccionado}
            />
          )}

          {(fase === 'knockout' || fase === 'campeon') && bracket.length > 0 && (
            <div className="flex flex-col gap-4" style={{ animation: 'fadeIn .35s ease-out both' }}>
              {[...bracket].reverse().map((ronda, i) => (
                <BracketRonda
                  key={`${ronda.nombre}-${bracket.length - i}`}
                  nombre={ronda.nombre}
                  llaves={ronda.llaves}
                  clubes={clubes}
                  clubUsuarioId={clubUsuarioId}
                  onVerPartido={setPartidoSeleccionado}
                />
              ))}
            </div>
          )}
        </>
      )}

      {vista === 'goleadores' && (
        <TablaGoleadores
          clubes={clubes}
          clubIds={clubIds}
          clubUsuarioId={clubUsuarioId}
          onVerJugador={onVerJugador}
          onVerClub={onVerClub}
        />
      )}
    </div>
  );
}
