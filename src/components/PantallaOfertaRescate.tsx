// Oferta de rescate (pedido explícito: "oferta si te despiden y que te
// lleguen también otras ofertas según tu GRL y tu rendimiento" — ver
// engine/ofertasDT.ts). Se muestra en vez de PantallaRepasoCarrera cuando
// finCarrera se dispara (despido o descenso sin liga inferior) PERO hubo
// suerte y al menos un club de la misma liga te quiere igual — no está
// garantizado (generarOfertasRescate puede devolver un array vacío), así
// que despido/descenso siguen siendo un riesgo real, no un trámite.

import { useGameStore } from '../store/useGameStore';
import { TarjetaOfertaClub } from './TarjetaOfertaClub';

const TEXTO_MOTIVO: Record<'despedido' | 'descenso' | 'renuncia', string> = {
  despedido: 'La directiva te echó, pero no te quedaste sin ofertas.',
  descenso: 'Te descendieron y no había categoría inferior a la que seguir — pero no te quedaste sin ofertas.',
  renuncia: '',
};

export function PantallaOfertaRescate({ onContinuar }: { onContinuar: () => void }) {
  const {
    finCarrera, ofertasRescate, aceptarOfertaRescate, retirarseDT, liga, clubUsuarioId, clubes, carreraDT,
  } = useGameStore();
  if (!finCarrera) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans flex flex-col items-center justify-center gap-5 p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 topbar-entrada">Oferta de rescate</p>

      <div className="text-center" style={{ animation: 'revealCarta .6s cubic-bezier(.2,.8,.2,1) both' }}>
        <p className="text-2xl font-black text-orange-400">¡Todavía hay lugar para vos!</p>
        <p className="text-sm text-neutral-400 mt-2 max-w-xs">{TEXTO_MOTIVO[finCarrera.motivo]}</p>
      </div>

      {/* Fila horizontal (pedido explícito: "las ofertas de contratos
          ponelas asi en horizontal en filita") — mismo criterio que
          PantallaFinDeTemporada.tsx para las ofertas de otros clubes. */}
      <div className="w-full max-w-3xl flex gap-3 overflow-x-auto pb-1 px-1 snap-x snap-mandatory justify-center">
        {ofertasRescate.map((oferta) => (
          <div key={oferta.clubId} className="w-72 shrink-0 snap-start">
            <TarjetaOfertaClub
              clubNombre={oferta.clubNombre}
              clubLiga={liga?.nombre ?? ''}
              clubNc={oferta.clubNc}
              salario={oferta.salarioOfrecido}
              duracion={oferta.duracionOfrecida}
              esRenovacion={false}
              clubActualNombre={clubUsuarioId ? clubes[clubUsuarioId]?.nombre : undefined}
              idolatriaActual={carreraDT.idolatria}
              onAceptar={() => { aceptarOfertaRescate(oferta.clubId); onContinuar(); }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={retirarseDT}
        className="text-sm text-neutral-500 hover:text-neutral-300 mt-2"
      >
        No, gracias — retirarme
      </button>
    </div>
  );
}
