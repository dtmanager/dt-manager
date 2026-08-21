// Barra de idolatría con niveles (pedido explícito: "que la idolatria sea
// una barra y que arranque en 0 y vaya subiendo y tenga niveles querido
// referente idolo leyenda") — compartida entre PantallaPerfilDT.tsx,
// PantallaRepasoCarrera.tsx y el widget del Hub, reemplaza a la barra
// simple que había duplicada en esos archivos. El "arranca en 0 y va
// subiendo" es la animación de montaje (mismo patrón que BarraStat de
// PantallaPerfilJugador.tsx): arranca en 0% y recién 50ms después pasa al
// ancho real, para que el navegador SÍ anime el `width` (un
// requestAnimationFrame directo no alcanza acá — el commit inicial en 0%
// y el cambio a rAF pueden coincidir en el mismo frame y el navegador
// nunca llega a pintar el estado de partida).
import { useEffect, useState } from 'react';
import { NIVELES_IDOLATRIA, nivelIdolatria } from '../engine/carreraDT';

export function BarraIdolatria({ idolatria, compacta = false }: { idolatria: number; compacta?: boolean }) {
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setAncho(idolatria), 50);
    return () => window.clearTimeout(id);
  }, [idolatria]);
  const nivel = nivelIdolatria(idolatria);

  return (
    <div>
      <div className="flex justify-between items-center text-[10px] text-neutral-500 mb-1">
        <span className="uppercase tracking-wide font-bold text-orange-400">{nivel.nombre}</span>
        <span className="tabular-nums text-neutral-300">{idolatria}/100</span>
      </div>
      <div className="relative h-2 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-emerald-400 transition-[width] duration-700 ease-out"
          style={{ width: `${ancho}%` }}
        />
        {NIVELES_IDOLATRIA.filter((n) => n.umbral > 0).map((n) => (
          <span key={n.nombre} className="absolute top-0 bottom-0 w-px bg-neutral-950/70" style={{ left: `${n.umbral}%` }} />
        ))}
      </div>
      {!compacta && (
        <div className="flex justify-between mt-1">
          {NIVELES_IDOLATRIA.map((n) => (
            <span
              key={n.nombre}
              className={`text-[8px] uppercase tracking-wide ${idolatria >= n.umbral ? 'text-orange-400 font-bold' : 'text-neutral-600'}`}
            >
              {n.nombre}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
