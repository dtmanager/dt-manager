// Lista de resultados de una fecha, clickeables para ver el detalle
// completo (posesión/tiros/córners/faltas/goles) — compartido entre
// PantallaLiga y las fases de grupos/liga de las copas (Conmebol, Uefa,
// Mundial de Clubes), que antes sólo mostraban tablas y no tenían forma
// de ver un partido puntual (pedido explícito: "partidos de copas
// jugados todas las stats").

import type { Club, Partido } from '../types';
import { formatoMinuto } from '../utils/formato';

function nombreJugador(club: Club | undefined, jugadorId: string): string {
  return club?.plantel.find((j) => j.id === jugadorId)?.nombre ?? '?';
}

export function ResultadosFecha({
  titulo, resultados, clubes, clubUsuarioId, onVerPartido,
}: {
  titulo: string;
  resultados: Partido[];
  clubes: Record<string, Club>;
  clubUsuarioId: string | null;
  onVerPartido: (partido: Partido) => void;
}) {
  if (resultados.length === 0) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
      <p className="text-xs font-semibold text-neutral-400 mb-2">{titulo}</p>
      {/* `key={titulo}` fuerza que este bloque se desmonte y remonte
          entero cada vez que cambia la fecha (el título incluye el
          número) — así el reveal escalonado de abajo vuelve a jugar en
          cada fecha nueva simulada, no sólo la primera vez que se monta
          la pantalla (pedido: "jerarquía por peso" del documento de
          rediseño — un resultado rutinario entra con un fade/slide
          corto, sin sonido ni pausa). */}
      <div key={titulo} className="flex flex-col gap-1 text-sm">
        {/* Grid con las dos columnas de nombre a "1fr" (mismo ancho entre
            sí siempre, sin importar el largo de cada nombre) deja el
            marcador de la columna del medio siempre centrado. */}
        {resultados.map((p, i) => {
          const esPropio = p.localId === clubUsuarioId || p.visitanteId === clubUsuarioId;
          const golesLocal = (p.goles ?? []).filter((g) => g.equipo === 'local');
          const golesVisitante = (p.goles ?? []).filter((g) => g.equipo === 'visitante');
          return (
            <button
              type="button"
              key={p.id}
              onClick={() => onVerPartido(p)}
              style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
              className={`resultado-entrada text-left border-b border-neutral-800/60 last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0 hover:bg-neutral-800/40 rounded px-1 -mx-1 transition-colors ${
                esPropio ? 'ring-1 ring-orange-500/30 bg-orange-500/[0.03]' : ''
              }`}
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <span className={`text-right truncate ${esPropio ? 'text-orange-400' : ''}`}>
                  {clubes[p.localId]?.nombre ?? p.localId}
                </span>
                <span className={`px-2 text-center shrink-0 flex flex-col items-center ${esPropio ? 'font-black text-base' : 'font-bold'}`}>
                  <span>{p.golesLocal} - {p.golesVisitante}</span>
                  {p.posesionLocal != null && (
                    <span className="text-[10px] font-normal text-neutral-500">
                      Posesión {p.posesionLocal}% - {100 - p.posesionLocal}%
                    </span>
                  )}
                </span>
                <span className={`text-left truncate ${esPropio ? 'text-orange-400' : ''}`}>
                  {clubes[p.visitanteId]?.nombre ?? p.visitanteId}
                </span>
              </div>
              {(golesLocal.length > 0 || golesVisitante.length > 0) && (
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-[11px] text-neutral-500 mt-0.5">
                  <div className="text-right flex flex-col gap-0.5">
                    {golesLocal.map((g) => (
                      <span key={`${g.minuto}-${g.minutoAgregado ?? 0}-${g.jugadorId}`} className="truncate">
                        {nombreJugador(clubes[p.localId], g.jugadorId)} {formatoMinuto(g.minuto, g.minutoAgregado)}
                        {g.origen === 'penal' && <span className="text-neutral-600"> (pen.)</span>}
                        {g.origen === 'falta' && <span className="text-neutral-600"> (t. libre)</span>}
                        {g.asistenciaId && (
                          <span className="text-neutral-600"> ({nombreJugador(clubes[p.localId], g.asistenciaId)})</span>
                        )}
                      </span>
                    ))}
                  </div>
                  <div />
                  <div className="text-left flex flex-col gap-0.5">
                    {golesVisitante.map((g) => (
                      <span key={`${g.minuto}-${g.minutoAgregado ?? 0}-${g.jugadorId}`} className="truncate">
                        {formatoMinuto(g.minuto, g.minutoAgregado)} {nombreJugador(clubes[p.visitanteId], g.jugadorId)}
                        {g.origen === 'penal' && <span className="text-neutral-600"> (pen.)</span>}
                        {g.origen === 'falta' && <span className="text-neutral-600"> (t. libre)</span>}
                        {g.asistenciaId && (
                          <span className="text-neutral-600"> ({nombreJugador(clubes[p.visitanteId], g.asistenciaId)})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
