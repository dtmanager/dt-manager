// Detalle de un partido ya jugado (pedido explícito: poder clickear un
// resultado y ver todas las estadísticas, no sólo el marcador). Consume
// los campos que fixture.ts ya guarda en el Partido desde el rediseño del
// motor de posesión (posesionLocal, tirosLocal/tirosVisitante,
// corners/faltas) — no dispara ninguna simulación nueva, sólo muestra lo
// que ya se calculó.

import { useState } from 'react';
import type { Club, Partido, TirosEquipo } from '../types';
import { PantallaVisualizadorPartido } from './PantallaVisualizadorPartido';
import { formatoMinuto } from '../utils/formato';

function nombreJugador(club: Club | undefined, jugadorId: string): string {
  return club?.plantel.find((j) => j.id === jugadorId)?.nombre ?? '?';
}

function FilaComparativa({
  label, valorLocal, valorVisitante,
}: {
  label: string;
  valorLocal: number | string;
  valorVisitante: number | string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm py-1">
      <span className="text-right font-semibold">{valorLocal}</span>
      <span className="text-neutral-500 text-xs px-2">{label}</span>
      <span className="text-left font-semibold">{valorVisitante}</span>
    </div>
  );
}

function textoTiros(t: TirosEquipo | undefined): string {
  if (!t) return '—';
  return `${t.total} (${t.alArco} al arco, ${t.afuera} afuera)`;
}

function textoTarjetas(amarillas: number, rojas: number): string {
  if (amarillas === 0 && rojas === 0) return '—';
  const partes = [];
  if (amarillas > 0) partes.push(`${amarillas} 🟨`);
  if (rojas > 0) partes.push(`${rojas} 🟥`);
  return partes.join(' ');
}

export function PantallaDetallePartido({
  partido,
  clubes,
  onCerrar,
}: {
  partido: Partido;
  clubes: Record<string, Club>;
  onCerrar: () => void;
}) {
  const local = clubes[partido.localId];
  const visitante = clubes[partido.visitanteId];
  const golesLocal = (partido.goles ?? []).filter((g) => g.equipo === 'local');
  const golesVisitante = (partido.goles ?? []).filter((g) => g.equipo === 'visitante');
  const hayStatsDetalladas = partido.tirosLocal != null;
  const [verAnimacion, setVerAnimacion] = useState(false);

  if (verAnimacion) {
    return (
      <PantallaVisualizadorPartido partido={partido} clubes={clubes} onCerrar={() => setVerAnimacion(false)} />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <h1 className="font-bold">Detalle del partido — Fecha {partido.fecha}</h1>
        <button type="button" onClick={onCerrar} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      {(partido.eventos?.length ?? 0) > 0 && (
        <button
          type="button"
          onClick={() => setVerAnimacion(true)}
          className="bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg px-4 py-2 text-sm self-center"
        >
          ▶ Repasar el partido
        </button>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 resultado-entrada">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <span className="text-right font-bold text-lg truncate">{local?.nombre ?? partido.localId}</span>
          <span className="font-black text-2xl px-3 shrink-0">
            {partido.golesLocal} - {partido.golesVisitante}
          </span>
          <span className="text-left font-bold text-lg truncate">{visitante?.nombre ?? partido.visitanteId}</span>
        </div>
        {partido.huboAlargue && (
          <p className="text-center text-xs text-amber-500 font-semibold mt-1">tras alargue</p>
        )}
      </div>

      {partido.posesionLocal != null && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-neutral-400 mb-2 text-center">Posesión</p>
          <div className="h-2.5 rounded-full bg-neutral-800 overflow-hidden flex">
            <div className="h-full bg-orange-500" style={{ width: `${partido.posesionLocal}%` }} />
            <div className="h-full bg-sky-500" style={{ width: `${100 - partido.posesionLocal}%` }} />
          </div>
          <div className="flex justify-between text-xs text-neutral-400 mt-1">
            <span>{partido.posesionLocal}%</span>
            <span>{100 - partido.posesionLocal}%</span>
          </div>
        </div>
      )}

      {hayStatsDetalladas ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 divide-y divide-neutral-800">
          {partido.xgLocal != null && (
            <FilaComparativa label="xG" valorLocal={partido.xgLocal.toFixed(2)} valorVisitante={(partido.xgVisitante ?? 0).toFixed(2)} />
          )}
          <FilaComparativa label="Tiros" valorLocal={textoTiros(partido.tirosLocal)} valorVisitante={textoTiros(partido.tirosVisitante)} />
          <FilaComparativa label="Córners" valorLocal={partido.cornersLocal ?? 0} valorVisitante={partido.cornersVisitante ?? 0} />
          <FilaComparativa label="Faltas" valorLocal={partido.faltasLocal ?? 0} valorVisitante={partido.faltasVisitante ?? 0} />
          <FilaComparativa label="Penales" valorLocal={partido.penalesLocal ?? 0} valorVisitante={partido.penalesVisitante ?? 0} />
          <FilaComparativa
            label="Tarjetas"
            valorLocal={textoTarjetas(partido.tarjetasAmarillasLocal ?? 0, partido.tarjetasRojasLocal ?? 0)}
            valorVisitante={textoTarjetas(partido.tarjetasAmarillasVisitante ?? 0, partido.tarjetasRojasVisitante ?? 0)}
          />
          {(partido.cambiosLocal != null || partido.cambiosVisitante != null) && (
            <FilaComparativa label="Cambios" valorLocal={partido.cambiosLocal ?? 0} valorVisitante={partido.cambiosVisitante ?? 0} />
          )}
        </div>
      ) : (
        <p className="text-xs text-neutral-500 text-center py-2">
          Este partido se jugó antes del rediseño del motor — no tiene estadísticas detalladas de tiros/córners/faltas.
        </p>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <p className="text-xs font-semibold text-neutral-400 mb-3 text-center">Goles</p>
        {golesLocal.length === 0 && golesVisitante.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-2">Sin goles en este partido.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col gap-1 text-right">
              {golesLocal.map((g) => (
                <span key={`${g.minuto}-${g.minutoAgregado ?? 0}-${g.jugadorId}`}>
                  {nombreJugador(local, g.jugadorId)} {formatoMinuto(g.minuto, g.minutoAgregado)}
                  {g.origen === 'penal' && <span className="text-neutral-500"> (pen.)</span>}
                  {g.origen === 'falta' && <span className="text-neutral-500"> (t. libre)</span>}
                  {g.asistenciaId && <span className="text-neutral-500"> ({nombreJugador(local, g.asistenciaId)})</span>}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1 text-left">
              {golesVisitante.map((g) => (
                <span key={`${g.minuto}-${g.minutoAgregado ?? 0}-${g.jugadorId}`}>
                  {formatoMinuto(g.minuto, g.minutoAgregado)} {nombreJugador(visitante, g.jugadorId)}
                  {g.origen === 'penal' && <span className="text-neutral-500"> (pen.)</span>}
                  {g.origen === 'falta' && <span className="text-neutral-500"> (t. libre)</span>}
                  {g.asistenciaId && <span className="text-neutral-500"> ({nombreJugador(visitante, g.asistenciaId)})</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {(partido.tarjetas?.length ?? 0) > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-neutral-400 mb-3 text-center">Tarjetas</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col gap-1 text-right">
              {(partido.tarjetas ?? []).filter((t) => t.equipo === 'local').map((t, i) => (
                // eslint-disable-next-line react/no-array-index-key -- un jugador puede recibir dos tarjetas (amarilla y después roja) en el mismo minuto
                <span key={`${t.minuto}-${t.jugadorId}-${i}`}>
                  {nombreJugador(local, t.jugadorId)} {formatoMinuto(t.minuto, t.minutoAgregado)} {t.tipo === 'roja' ? '🟥' : '🟨'}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1 text-left">
              {(partido.tarjetas ?? []).filter((t) => t.equipo === 'visitante').map((t, i) => (
                // eslint-disable-next-line react/no-array-index-key -- un jugador puede recibir dos tarjetas (amarilla y después roja) en el mismo minuto
                <span key={`${t.minuto}-${t.jugadorId}-${i}`}>
                  {formatoMinuto(t.minuto, t.minutoAgregado)} {t.tipo === 'roja' ? '🟥' : '🟨'} {nombreJugador(visitante, t.jugadorId)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {(partido.cambios?.length ?? 0) > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-neutral-400 mb-3 text-center">Cambios</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex flex-col gap-1 text-right">
              {(partido.cambios ?? []).filter((c) => c.equipo === 'local').map((c, i) => (
                // eslint-disable-next-line react/no-array-index-key -- no hay otro campo único disponible
                <span key={`${c.minuto}-${c.jugadorSaleId}-${i}`}>
                  🔻{nombreJugador(local, c.jugadorSaleId)} 🔺{nombreJugador(local, c.jugadorEntraId)} {formatoMinuto(c.minuto, c.minutoAgregado)}
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-1 text-left">
              {(partido.cambios ?? []).filter((c) => c.equipo === 'visitante').map((c, i) => (
                // eslint-disable-next-line react/no-array-index-key -- no hay otro campo único disponible
                <span key={`${c.minuto}-${c.jugadorSaleId}-${i}`}>
                  {formatoMinuto(c.minuto, c.minutoAgregado)} 🔻{nombreJugador(visitante, c.jugadorSaleId)} 🔺{nombreJugador(visitante, c.jugadorEntraId)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
