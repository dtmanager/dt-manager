// Bloque visual del palmarés de un DT (badge, historia club por club,
// stats, vitrina) — extraído de PantallaRepasoCarrera.tsx para poder
// reusarlo tal cual en PantallaCarreraCompartida.tsx (pedido explícito:
// "compartir carrera... que te copie el link que te lleve a ese
// palmares" — el link necesita mostrar el MISMO palmarés fuera del
// store, a partir de los datos codificados en la URL, ver
// utils/compartirCarrera.ts). Puramente presentacional: recibe todo por
// props, no toca useGameStore.
import { nivelIdolatria, type EtapaClubDT, type NivelIdolatria, type TituloGanado } from '../engine/carreraDT';
import { BarraIdolatria } from './BarraIdolatria';
import { TrofeoIcon } from './TrofeoIcon';
import { trofeoDeCompetencia } from '../data/trofeos';
import { inicialesClub } from '../utils/formato';

function StatBox({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="bg-neutral-950 rounded-lg p-3 text-center">
      <p className="text-xl font-black tabular-nums">{valor}</p>
      <p className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</p>
    </div>
  );
}

const ICONO_NIVEL: Record<string, string> = {
  Querido: '👍', Referente: '💚', Ídolo: '⭐', Leyenda: '👑',
};
const COLOR_NIVEL: Record<string, string> = {
  Querido: 'text-blue-400', Referente: 'text-emerald-400', Ídolo: 'text-orange-400', Leyenda: 'text-yellow-400',
};
const BARRA_NIVEL: Record<string, string> = {
  Querido: 'bg-gradient-to-r from-blue-600 to-blue-400',
  Referente: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
  Ídolo: 'bg-gradient-to-r from-orange-600 to-orange-400',
  Leyenda: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
};

function FilaEtapaClub({ etapa }: { etapa: EtapaClubDT }) {
  const nivel = nivelIdolatria(etapa.idolatriaFinal);
  const porcentaje = Math.max(0, Math.min(100, etapa.idolatriaFinal));
  return (
    <div className="flex items-start gap-3 border-l-2 border-neutral-800 pl-3 py-1.5">
      <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center font-black text-[11px] mt-0.5">
        {inicialesClub(etapa.clubNombre)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm truncate">{etapa.clubNombre}</span>
          <span className={`text-[10px] font-bold ${COLOR_NIVEL[nivel.nombre] ?? 'text-neutral-400'}`}>
            {ICONO_NIVEL[nivel.nombre] ?? ''} {nivel.nombre} {etapa.idolatriaFinal}/100
          </span>
          <span className="text-[10px] text-neutral-600 ml-auto shrink-0">
            {etapa.temporadaInicio}–{etapa.temporadaFin}
          </span>
        </div>
        <div className="h-1 rounded-full bg-neutral-800 overflow-hidden mt-1.5 max-w-[220px]">
          <div className={`h-full rounded-full ${BARRA_NIVEL[nivel.nombre] ?? 'bg-neutral-600'}`} style={{ width: `${porcentaje}%` }} />
        </div>
        <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-1.5">
          <span>{etapa.partidos} PJ</span>
          <span className="text-emerald-400">⚽ {etapa.goles}</span>
          {etapa.titulos.length > 0 && (
            <span className="text-orange-400 truncate">
              🏆 {etapa.titulos.map((t) => t.competencia).join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export interface DatosResumenCarrera {
  dtNombre: string;
  clubNombre: string;
  ligaNombre?: string;
  apodo: { apodo: string; descripcion: string } | null;
  nivel: NivelIdolatria;
  stats: { partidos: number; titulos: number; goles: number; fichajes: number; canteranos: number; idolatria: number };
  historialClubes: EtapaClubDT[];
  titulosVitrina: TituloGanado[];
  motivoTexto: string;
}

export function ResumenCarreraDT({
  dtNombre, clubNombre, ligaNombre, apodo, nivel, stats, historialClubes, titulosVitrina, motivoTexto,
}: DatosResumenCarrera) {
  return (
    <>
      <div className="text-center flex flex-col items-center gap-2" style={{ animation: 'revealCarta .6s cubic-bezier(.2,.8,.2,1) both' }}>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center font-black text-xl shadow-lg shadow-orange-500/30 mb-1">
          {inicialesClub(clubNombre)}
        </div>
        {/* Pedido explícito ("el campeon de boca" como ejemplo): el apodo
            va con el club baked-in en el propio titular, no suelto — mismo
            criterio que "Fuiste {nivel} de {club}" de la línea de abajo. */}
        <p className="text-2xl font-black italic">
          {apodo ? `"${apodo.apodo} de ${clubNombre}"` : dtNombre}
        </p>
        <p className="text-sm text-neutral-300">
          Fuiste <span className="text-orange-400 font-semibold">{nivel.nombre}</span> de {clubNombre}
          {(nivel.nombre === 'Ídolo' || nivel.nombre === 'Leyenda') && ' ⭐'}
        </p>
        <p className="text-xs text-neutral-500">
          {dtNombre} · DT de {clubNombre}{ligaNombre ? ` · ${ligaNombre}` : ''}
        </p>
      </div>

      {historialClubes.length > 0 && (
        <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-2.5">
          <p className="text-xs font-semibold text-neutral-400 mb-1">
            🗂️ Tu historia, club por club ({historialClubes.length})
          </p>
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {historialClubes.map((etapa, i) => (
              <FilaEtapaClub key={`${etapa.clubId}-${etapa.temporadaInicio}-${i}`} etapa={etapa} />
            ))}
          </div>
        </div>
      )}

      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col gap-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <StatBox label="Partidos" valor={stats.partidos} />
          <StatBox label="Títulos" valor={stats.titulos} />
          <StatBox label="Goles" valor={stats.goles} />
          <StatBox label="Fichajes" valor={stats.fichajes} />
          <StatBox label="Canteranos" valor={stats.canteranos} />
          <StatBox label="Idolatría" valor={stats.idolatria} />
        </div>
        <BarraIdolatria idolatria={stats.idolatria} />
        {apodo && <p className="text-xs text-neutral-500 text-center">{apodo.descripcion}</p>}
      </div>

      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-neutral-400 mb-1">🏆 Vitrina ({titulosVitrina.length})</p>
        {titulosVitrina.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-3">
            <span className="text-2xl grayscale opacity-30">🏆</span>
            <span className="text-[10px] uppercase tracking-wide text-neutral-600">Vitrina vacía</span>
          </div>
        ) : (
          titulosVitrina.map((t, i) => {
            const trofeo = trofeoDeCompetencia(t.competencia);
            return (
              <div key={`${t.competencia}-${t.temporada}-${i}`} className="flex items-center gap-3">
                <div className="w-11 h-14 shrink-0">
                  <TrofeoIcon {...trofeo} />
                </div>
                <div className="min-w-0 flex-1 flex flex-col">
                  <span className="font-semibold text-sm truncate">{t.competencia}</span>
                  <span className="text-neutral-500 text-xs">Temporada {t.temporada}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="text-sm text-neutral-400 text-center max-w-xs">{motivoTexto}</p>
    </>
  );
}
