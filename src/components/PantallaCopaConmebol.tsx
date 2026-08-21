// Copa Libertadores / Copa Sudamericana ("formato real completo", pedido
// explícito) — 8 grupos de 4 (mismo patrón visual que PantallaLiga/Copa
// Internacional para las tablas), luego playoff de acceso (sólo
// Sudamericana) y knockout ida y vuelta (mismo patrón que
// PantallaCopaNacional, pero mostrando ambos partidos + agregado ya que
// acá casi ninguna llave es a partido único).

import { useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { proximaFechaDeGrupos, tablaDeGrupo, type Grupo } from '../engine/faseDeGrupos';
import { PantallaDetallePartido } from './PantallaDetallePartido';
import { ResultadosFecha } from './ResultadosFecha';
import { BracketRonda } from './BracketRonda';
import { TablaGoleadores } from './TablaGoleadores';
import type { Club, Partido } from '../types';

const NOMBRE_COPA: Record<'libertadores' | 'sudamericana', string> = {
  libertadores: 'Copa Libertadores',
  sudamericana: 'Copa Sudamericana',
};

function TablaGrupo({
  grupo, clubes, clubUsuarioId, onVerClub,
}: { grupo: Grupo; clubes: Record<string, Club>; clubUsuarioId: string | null; onVerClub: (clubId: string) => void }) {
  const tabla = tablaDeGrupo(grupo);
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
      <p className="text-xs font-semibold text-neutral-400 mb-2">{grupo.nombre}</p>
      <table className="w-full text-xs border-collapse">
        <tbody>
          {tabla.map((fila, i) => (
            <tr key={fila.clubId} className={fila.clubId === clubUsuarioId ? 'bg-orange-500/10 font-semibold' : ''}>
              <td className="py-0.5 pr-1.5 text-neutral-500">{i + 1}</td>
              <td className="py-0.5 pr-1.5">
                <button type="button" onClick={() => onVerClub(fila.clubId)} className="hover:text-orange-400 hover:underline text-left">
                  {clubes[fila.clubId]?.nombre ?? fila.clubId}
                </button>
              </td>
              <td className="py-0.5 px-1 text-center text-neutral-400">{fila.pj}</td>
              <td className="py-0.5 pl-1 text-center font-bold">{fila.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export function PantallaCopaConmebol({
  onVolver, onVerClub, onVerJugador,
}: {
  onVolver: () => void; onVerClub: (clubId: string) => void; onVerJugador: (clubId: string, jugadorId: string) => void;
}) {
  const { copaConmebol, clubes: clubesLiga, clubUsuarioId } = useGameStore();
  const [partidoSeleccionado, setPartidoSeleccionado] = useState<Partido | null>(null);
  const [vista, setVista] = useState<'competencia' | 'goleadores'>('competencia');

  // Hooks arriba de cualquier return condicional — copaConmebol puede ser
  // null en el primer render, así que todo lo que depende de él usa
  // encadenado opcional acá.
  const grupos = copaConmebol?.grupos ?? [];
  const proximaFecha = copaConmebol?.fase === 'grupos' ? proximaFechaDeGrupos(grupos) : null;
  const totalFechas = grupos.length > 0 ? Math.max(...grupos[0].fixture.map((p) => p.fecha)) : 0;
  const fechaJugada = proximaFecha == null ? totalFechas : proximaFecha - 1;
  const ultimosResultados = useMemo(() => {
    if (copaConmebol?.fase !== 'grupos' || fechaJugada < 1) return [];
    return grupos.flatMap((g) => g.fixture).filter((p) => p.fecha === fechaJugada && p.golesLocal != null);
  }, [grupos, copaConmebol?.fase, fechaJugada]);

  if (!copaConmebol) return null;
  const {
    tipo, clubes: clubesCopa, fase, usuarioEliminado, playoffAcceso, bracket, campeonId, clubIds,
  } = copaConmebol;
  // La versión EN VIVO (clubesLiga) gana sobre la foto fija de la copa
  // SÓLO para el club del usuario — es el único cuyas estadísticas
  // realmente se mantienen sincronizadas (aplicarGolesDeCopaAlClub en
  // useGameStore.ts). Bug encontrado jugando ("en las competencias
  // internacionales pone (?)"): mezclar clubesLiga ENTERO acá rompía el
  // resto — generarClubesExtranjeros (mercado.ts) arma cada temporada un
  // puñado de clubes al azar de estos mismos pools (Premier League,
  // Brasileirão, etc.) con un plantel NUEVO y un id que puede coincidir
  // con uno de los 32 clubes de esta copa; el spread pisaba el plantel
  // real (con el que se simuló el partido) por ese otro plantel al azar,
  // y nombreJugador ya no encontraba al goleador/pateador → "?".
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

  const grupoUsuario = grupos.find((g) => g.clubIds.includes(clubUsuarioId ?? ''));
  const otrosGrupos = grupos.filter((g) => g !== grupoUsuario);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <h1 className="font-bold">{NOMBRE_COPA[tipo]}</h1>
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
          Quedamos eliminados de la {NOMBRE_COPA[tipo]} — el resto de la competencia sigue en juego.
        </div>
      )}

      {/* Pedido explícito: "borra todos los simular fecha que no sean el
          de calendario" — esta pantalla pasa a ser de sólo lectura
          (grupos/playoff/bracket/goleadores); la simulación vive en
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
          {fase === 'grupos' && grupoUsuario && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3" style={{ animation: 'fadeIn .35s ease-out both' }}>
              <TablaGrupo grupo={grupoUsuario} clubes={clubes} clubUsuarioId={clubUsuarioId} onVerClub={onVerClub} />
              {otrosGrupos.map((g) => (
                <TablaGrupo key={g.nombre} grupo={g} clubes={clubes} clubUsuarioId={clubUsuarioId} onVerClub={onVerClub} />
              ))}
            </div>
          )}

          {fase === 'grupos' && (
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
