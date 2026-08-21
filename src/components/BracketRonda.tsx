// Fila de llave de copa (bracket de eliminación, partido único o ida y
// vuelta) — pedido explícito: que el menú/resultados de copas se vea
// "parecido al de fixture de la liga" estéticamente. Antes cada copa
// tenía su propio FilaLlave/FilaLlaveDobleJornada, más angosto y sin
// desglose de goleadores; esto reusa el mismo panel/fila/hover que
// ResultadosFecha (liga) y agrega el desglose de goles debajo del
// marcador igual que ahí.

import type { Club, Partido } from '../types';
import type { Llave, TandaPenales } from '../engine/eliminatoria';
import { formatoMinuto } from '../utils/formato';

function nombreJugador(club: Club | undefined, jugadorId: string): string {
  return club?.plantel.find((j) => j.id === jugadorId)?.nombre ?? '?';
}

function DesgloseGoles({
  clubLocal, clubVisitante, partido,
}: { clubLocal: Club | undefined; clubVisitante: Club | undefined; partido: Partido }) {
  const golesLocal = (partido.goles ?? []).filter((g) => g.equipo === 'local');
  const golesVisitante = (partido.goles ?? []).filter((g) => g.equipo === 'visitante');
  if (golesLocal.length === 0 && golesVisitante.length === 0) return null;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-[11px] text-neutral-500 mt-0.5">
      <div className="text-right flex flex-col gap-0.5">
        {golesLocal.map((g) => (
          <span key={`${g.minuto}-${g.minutoAgregado ?? 0}-${g.jugadorId}`} className="truncate">
            {nombreJugador(clubLocal, g.jugadorId)} {formatoMinuto(g.minuto, g.minutoAgregado)}
            {g.origen === 'penal' && <span className="text-neutral-600"> (pen.)</span>}
            {g.origen === 'falta' && <span className="text-neutral-600"> (t. libre)</span>}
            {g.asistenciaId && <span className="text-neutral-600"> ({nombreJugador(clubLocal, g.asistenciaId)})</span>}
          </span>
        ))}
      </div>
      <div />
      <div className="text-left flex flex-col gap-0.5">
        {golesVisitante.map((g) => (
          <span key={`${g.minuto}-${g.minutoAgregado ?? 0}-${g.jugadorId}`} className="truncate">
            {formatoMinuto(g.minuto, g.minutoAgregado)} {nombreJugador(clubVisitante, g.jugadorId)}
            {g.origen === 'penal' && <span className="text-neutral-600"> (pen.)</span>}
            {g.origen === 'falta' && <span className="text-neutral-600"> (t. libre)</span>}
            {g.asistenciaId && <span className="text-neutral-600"> ({nombreJugador(clubVisitante, g.asistenciaId)})</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

// sistema-penales-diseno.md — pedido explícito: "la lista de quien erró y
// quien metió en las copas". Una fila compacta por pateador, en orden de
// tanda, agrupada por equipo (igual que DesgloseGoles) en vez de
// intercalada, para que se pueda seguir de un vistazo quién le erró a
// quién le tocó romper el empate.
function DesgloseTanda({
  clubLocal, clubVisitante, tanda,
}: { clubLocal: Club | undefined; clubVisitante: Club | undefined; tanda: TandaPenales }) {
  const tirosLocal = tanda.tiros.filter((t) => t.equipo === 'local');
  const tirosVisitante = tanda.tiros.filter((t) => t.equipo === 'visitante');
  const golesLocal = tirosLocal.filter((t) => t.gol).length;
  const golesVisitante = tirosVisitante.filter((t) => t.gol).length;

  return (
    <div className="mt-1 pt-1 border-t border-neutral-800/60">
      <p className="text-[11px] text-neutral-500 text-center mb-0.5">
        Penales {golesLocal}-{golesVisitante}
      </p>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-[11px]">
        <div className="text-right flex flex-col gap-0.5">
          {tirosLocal.map((t, i) => (
            // eslint-disable-next-line react/no-array-index-key -- un jugador puede patear más de una vez (muerte súbita)
            <span key={`${t.ronda}-${i}`} className={t.gol ? 'text-neutral-400' : 'text-red-400/80 line-through'}>
              {nombreJugador(clubLocal, t.jugadorId)} {t.gol ? '✓' : '✗'}
            </span>
          ))}
        </div>
        <div />
        <div className="text-left flex flex-col gap-0.5">
          {tirosVisitante.map((t, i) => (
            // eslint-disable-next-line react/no-array-index-key -- un jugador puede patear más de una vez (muerte súbita)
            <span key={`${t.ronda}-${i}`} className={t.gol ? 'text-neutral-400' : 'text-red-400/80 line-through'}>
              {t.gol ? '✓' : '✗'} {nombreJugador(clubVisitante, t.jugadorId)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function claseNombre(esDelUsuario: boolean, jugado: boolean, esGanador: boolean): string {
  if (esDelUsuario) return 'text-orange-400';
  if (!jugado) return 'text-neutral-300';
  return esGanador ? 'text-neutral-100 font-semibold' : 'text-neutral-500';
}

function FilaLlave({
  llave, clubes, clubUsuarioId, onVerPartido,
}: {
  llave: Llave; clubes: Record<string, Club>; clubUsuarioId: string | null; onVerPartido: (partido: Partido) => void;
}) {
  const partido = llave.partidoVuelta;
  const jugado = partido.golesLocal != null;
  const clubLocal = clubes[llave.localId];
  const clubVisitante = clubes[llave.visitanteId];
  // Bug reportado ("aparecen partidos con los goles y ?"): en la vuelta
  // se invierte la localía respecto a la ida (armarLlave, eliminatoria.ts
  // — "aPartidoUnico" es la única excepción, ahí no hay vuelta separada),
  // así que `partido` (siempre partidoVuelta) puede tener local/visitante
  // AL REVÉS de `llave.localId`/`visitanteId`. DesgloseGoles/DesgloseTanda
  // filtran por `g.equipo === 'local'/'visitante'` DE ESTE PARTIDO, así
  // que necesitan el club que es local/visitante ahí — no el de la llave
  // (que sólo sirve para el encabezado, con la localía fija de la ida).
  const clubLocalPartido = clubes[partido.localId];
  const clubVisitantePartido = clubes[partido.visitanteId];

  let marcador = 'vs';
  if (jugado) {
    if (llave.aPartidoUnico || !llave.partidoIda) {
      marcador = `${partido.golesLocal} - ${partido.golesVisitante}`;
    } else {
      const agLocal = llave.partidoIda.golesLocal! + partido.golesVisitante!;
      const agVisitante = llave.partidoIda.golesVisitante! + partido.golesLocal!;
      marcador = `${llave.partidoIda.golesLocal}-${llave.partidoIda.golesVisitante} / `
        + `${partido.golesLocal}-${partido.golesVisitante} (agg. ${agLocal}-${agVisitante})`;
    }
    if (partido.huboAlargue) marcador += ' (alargue)';
    if (llave.penales) {
      if (llave.detallePenales) {
        const golesTandaLocal = llave.detallePenales.tiros.filter((t) => t.equipo === 'local' && t.gol).length;
        const golesTandaVisitante = llave.detallePenales.tiros.filter((t) => t.equipo === 'visitante' && t.gol).length;
        marcador += ` — pen. ${golesTandaLocal}-${golesTandaVisitante}`;
      } else {
        marcador += ' — pen.';
      }
    }
  }

  const contenido = (
    <>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <span className={`text-right truncate ${claseNombre(llave.localId === clubUsuarioId, jugado, llave.ganadorId === llave.localId)}`}>
          {clubLocal?.nombre ?? llave.localId}
        </span>
        <span className="font-bold px-2 text-center shrink-0 text-xs">{marcador}</span>
        <span className={`text-left truncate ${claseNombre(llave.visitanteId === clubUsuarioId, jugado, llave.ganadorId === llave.visitanteId)}`}>
          {clubVisitante?.nombre ?? llave.visitanteId}
        </span>
      </div>
      {jugado && <DesgloseGoles clubLocal={clubLocalPartido} clubVisitante={clubVisitantePartido} partido={partido} />}
      {/* A diferencia de los goles (que son del `partido` mostrado, con su
          localía propia), la tanda de penales se simula con la localía
          FIJA de la llave (simularTandaPenales(local, visitante) en
          eliminatoria.ts usa clubes[llave.localId]/[llave.visitanteId],
          no las del partido) — acá sí van clubLocal/clubVisitante. */}
      {jugado && llave.detallePenales && (
        <DesgloseTanda clubLocal={clubLocal} clubVisitante={clubVisitante} tanda={llave.detallePenales} />
      )}
    </>
  );

  if (!jugado) {
    return (
      <div className="border-b border-neutral-800/60 last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0 px-1 -mx-1">
        {contenido}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onVerPartido(partido)}
      className="text-left w-full border-b border-neutral-800/60 last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0 hover:bg-neutral-800/40 rounded px-1 -mx-1"
    >
      {contenido}
    </button>
  );
}

export function BracketRonda({
  nombre, llaves, clubes, clubUsuarioId, onVerPartido,
}: {
  nombre: string;
  llaves: Llave[];
  clubes: Record<string, Club>;
  clubUsuarioId: string | null;
  onVerPartido: (partido: Partido) => void;
}) {
  if (llaves.length === 0) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
      <p className="text-xs font-semibold text-neutral-400 mb-2">{nombre}</p>
      <div className="flex flex-col gap-1 text-sm">
        {llaves.map((llave) => (
          <FilaLlave key={llave.id} llave={llave} clubes={clubes} clubUsuarioId={clubUsuarioId} onVerPartido={onVerPartido} />
        ))}
      </div>
    </div>
  );
}
