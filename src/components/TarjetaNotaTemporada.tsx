// Resumen de temporada estilo "portada de diario" (pedido explícito: "al
// final de la temporada hace un resumen de esta con nota de tu temporada,
// estadisticas, goleadores, etc de ese estilo con mucha info" — mostrando
// un mockup de un diario deportivo ficticio: masthead rojo, titular grande
// en itálica, caja de "NOTA DE LA TEMPORADA" y una lista de datos con
// viñetas de color). Se agrega ARRIBA de PantallaFinDeTemporada, como una
// tarjeta más, no como paso nuevo (decisión explícita del usuario) — el
// resto de la pantalla (balance, objetivo, ofertas) sigue igual, esto es
// sólo el resumen "de un vistazo" antes de bajar al detalle.
//
// record/goleadorPropio salen de ResumenTemporada (ver comentario grande
// en engine/economia.ts) en vez de recalcularse acá — para cuando esta
// pantalla se muestra, evolucionarClub ya reseteó estadisticasTemporada
// para la temporada que arranca, así que leerlos de state.clubes/liga.
// fixture en este punto siempre habría dado 0.
import { bajadaTemporada, calcularNotaTemporada, tituloTemporada } from '../engine/notaTemporada';
import type { ResumenTemporada } from '../engine/economia';
import { formatoMonto } from '../utils/formato';

export function TarjetaNotaTemporada({ resumen, clubNombre }: { resumen: ResumenTemporada; clubNombre: string }) {
  const { record, goleadorPropio } = resumen;
  const nota = calcularNotaTemporada(resumen);
  const titulo = tituloTemporada(resumen);
  const bajada = bajadaTemporada(resumen, clubNombre);

  const colorTitulo = resumen.campeon
    ? 'text-orange-400'
    : resumen.ascendido
      ? 'text-emerald-400'
      : resumen.descendido
        ? 'text-red-500'
        : 'text-neutral-100';
  const colorNota = nota >= 8 ? 'text-emerald-400' : nota >= 5 ? 'text-orange-400' : 'text-red-400';

  const items: { color: string; icono: string; texto: string }[] = [
    goleadorPropio && {
      color: 'border-l-orange-400',
      icono: '⚽',
      texto: `${goleadorPropio.nombre} fue el goleador del plantel: ${goleadorPropio.goles} goles y ${goleadorPropio.asistencias} asistencias en ${goleadorPropio.pj} partidos.`,
    },
    {
      color: 'border-l-blue-400',
      icono: '📊',
      texto: `${record.pg}V-${record.pe}E-${record.pp}D en ${record.pj} partidos · ${record.gf} goles a favor, ${record.gc} en contra.`,
    },
    {
      color: resumen.objetivoCumplido ? 'border-l-emerald-400' : 'border-l-red-400',
      icono: '🎯',
      texto: `Objetivo de la directiva (${resumen.objetivoDescripcion}): ${resumen.objetivoCumplido ? 'cumplido' : 'no cumplido'}.`,
    },
    {
      color: 'border-l-emerald-500',
      icono: '💰',
      texto: `Ganó ${formatoMonto(resumen.premio + resumen.taquilla)} entre premio y taquilla esta temporada.`,
    },
  ].filter((x): x is { color: string; icono: string; texto: string } => Boolean(x));

  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden w-full topbar-entrada">
      <div className="px-4 pt-3 pb-2 border-b-2 border-red-600/60">
        <p className="text-[10px] font-semibold text-neutral-500">Temporada {resumen.temporada}</p>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div>
          <h2 className={`text-2xl font-black italic leading-none ${colorTitulo}`}>{titulo}</h2>
          <p className="text-xs text-neutral-400 mt-1.5">{bajada}</p>
        </div>

        <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Nota de la temporada</p>
          <p className={`text-2xl font-black tabular-nums ${colorNota}`}>{nota.toFixed(1)}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          {items.map((it) => (
            <p key={it.icono} className={`text-xs text-neutral-300 border-l-2 ${it.color} pl-2.5 py-0.5`}>
              <span className="mr-1">{it.icono}</span>
              {it.texto}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
