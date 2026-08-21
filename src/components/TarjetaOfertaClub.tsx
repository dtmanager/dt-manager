// Tarjeta de oferta de club (pedido explícito: rediseño con estilo
// tarjeta — badge, franja de color, salario grande, comparación de
// idolatría, barra de progreso) — compartida entre las 3 pantallas que
// muestran ofertas de un club: PantallaFinDeTemporada.tsx (ofertaDT de
// otro club + renovacionDT del actual) y PantallaOfertaRescate.tsx
// (ofertasRescate). Antes cada una tenía su propia cardcita de texto
// plano — ahora es UNA sola fuente visual para las tres.
import { BarraIdolatria } from './BarraIdolatria';
import { proximoNivelIdolatria } from '../engine/carreraDT';
import { formatoMonto, inicialesClub } from '../utils/formato';

export function TarjetaOfertaClub({
  clubNombre, clubLiga, clubNc, salario, duracion, esRenovacion, clubActualNombre, idolatriaActual,
  aceptarLabel = 'Aceptar', onAceptar,
}: {
  clubNombre: string;
  clubLiga: string;
  clubNc: number;
  salario: number;
  duracion: number;
  // true: te quedás en el mismo club (renovación) — se muestra el
  // progreso de idolatría actual. false: club nuevo — la idolatría
  // arranca de 0 ahí (pedido explícito, ver aceptarOfertaDT/
  // aceptarOfertaRescate en useGameStore.ts).
  esRenovacion: boolean;
  clubActualNombre?: string;
  idolatriaActual: number;
  aceptarLabel?: string;
  onAceptar: () => void;
}) {
  const proximo = proximoNivelIdolatria(idolatriaActual);

  return (
    <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 w-full">
      <div className={`h-1.5 w-full bg-gradient-to-r ${esRenovacion ? 'from-emerald-500 to-emerald-300' : 'from-orange-500 to-amber-300'}`} />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center font-black text-sm shadow-lg shadow-orange-500/20">
              {inicialesClub(clubNombre)}
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm uppercase tracking-wide truncate">{clubNombre}</p>
              <p className="text-[10px] text-neutral-500 truncate">{clubLiga} · NC {clubNc}</p>
            </div>
          </div>
          {esRenovacion && (
            <span className="text-[9px] font-bold uppercase tracking-wide text-emerald-400 border border-emerald-500/40 rounded-full px-2 py-0.5 shrink-0">
              Renovación
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-emerald-400 tabular-nums">{formatoMonto(salario)}</span>
          <span className="text-xs text-neutral-500">/temporada · {duracion} año{duracion > 1 ? 's' : ''}</span>
        </div>

        {esRenovacion ? (
          <div>
            <BarraIdolatria idolatria={idolatriaActual} compacta />
            <p className="text-[11px] text-neutral-400 mt-1.5">
              {proximo ? `Te faltan ${proximo.faltan} pts para ser ${proximo.nombre}` : 'Ya sos Leyenda acá — el techo.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {clubActualNombre && (
              <p className="text-[11px] text-red-400">
                Dejás {clubActualNombre}: perdés tu idolatría ahí ({idolatriaActual}/100)
              </p>
            )}
            <p className="text-[11px] text-neutral-400">Allá arrancás: Querido (0/100)</p>
          </div>
        )}

        <button
          type="button"
          onClick={onAceptar}
          className="self-end bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold px-4 py-2 rounded-lg"
        >
          {aceptarLabel}
        </button>
      </div>
    </div>
  );
}
