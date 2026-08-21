// Vitrina de trofeos (pedido explícito, diseño en
// docs/prompt-vitrina-y-animacion-trofeos.md) — catálogo COMPLETO de
// trofeos posibles (ver data/trofeos.ts), no sólo los que ya ganó el
// usuario: "el jugador tiene que poder ver TODO lo que existe para
// ganar, no sólo lo que ya ganó". Ganados van a color con año(s) y un
// contador si se repitió; los que faltan quedan en silueta gris, nunca
// ocultos. La barra de progreso arranca en 0 y anima hasta el valor
// real al entrar (mismo patrón que BarraIdolatria.tsx).
import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { SECCIONES_TROFEOS, type DefinicionTrofeo, type EntradaTrofeoCatalogo } from '../data/trofeos';
import { TrofeoIcon } from './TrofeoIcon';
import type { TituloGanado } from '../engine/carreraDT';

interface Detalle {
  competencia: string;
  def: DefinicionTrofeo;
  ganado: boolean;
  anios: number[];
}

function TarjetaTrofeo({
  entrada, titulosGanados, onClick,
}: { entrada: EntradaTrofeoCatalogo; titulosGanados: TituloGanado[]; onClick: () => void }) {
  const ganados = titulosGanados.filter((t) => t.competencia === entrada.competencia);
  const ganado = ganados.length > 0;
  const anios = ganados.map((t) => t.temporada);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 bg-neutral-900 border border-neutral-800 hover:border-orange-500/60 rounded-xl p-2.5 transition-colors"
    >
      <div className="relative w-full" style={{ aspectRatio: '4/5' }}>
        <div className={ganado ? 'w-full h-full' : 'w-full h-full grayscale opacity-30'}>
          <TrofeoIcon {...entrada.def} />
        </div>
        {ganado && anios.length > 1 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-black text-[10px] font-black rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
            x{anios.length}
          </span>
        )}
      </div>
      <div className="text-center w-full">
        <p className={`text-[11px] font-semibold truncate ${ganado ? 'text-neutral-200' : 'text-neutral-600'}`}>
          {entrada.competencia}
        </p>
        {ganado && <p className="text-[9.5px] text-neutral-500 mt-0.5">{anios.join(', ')}</p>}
      </div>
    </button>
  );
}

export function PantallaVitrinaTrofeos({ onVolver }: { onVolver: () => void }) {
  const { carreraDT, clubUsuarioId, clubes } = useGameStore();
  const [ancho, setAncho] = useState(0);
  const [detalle, setDetalle] = useState<Detalle | null>(null);

  const totalTrofeos = SECCIONES_TROFEOS.reduce((acc, s) => acc + s.entradas.length, 0);
  const competenciasGanadas = new Set(carreraDT.titulos.map((t) => t.competencia));
  const totalGanados = SECCIONES_TROFEOS.reduce(
    (acc, s) => acc + s.entradas.filter((e) => competenciasGanadas.has(e.competencia)).length,
    0,
  );
  const porcentaje = totalTrofeos > 0 ? Math.round((totalGanados / totalTrofeos) * 100) : 0;

  useEffect(() => {
    const id = window.setTimeout(() => setAncho(porcentaje), 60);
    return () => window.clearTimeout(id);
  }, [porcentaje]);

  const club = clubUsuarioId ? clubes[clubUsuarioId] : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center text-base shadow-lg shadow-orange-500/20">
            🏆
          </div>
          <div>
            <h1 className="font-bold">Vitrina de trofeos</h1>
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">{totalGanados} de {totalTrofeos} trofeos</p>
          </div>
        </div>
        <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 transition-[width] duration-700 ease-out"
          style={{ width: `${ancho}%` }}
        />
      </div>

      {detalle && (
        <div className="bg-neutral-900 border border-orange-500/50 rounded-xl p-3.5 flex items-center gap-3.5">
          <div className="w-11 h-14 shrink-0">
            <div className={detalle.ganado ? 'w-full h-full' : 'w-full h-full grayscale opacity-30'}>
              <TrofeoIcon {...detalle.def} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm truncate">{detalle.competencia}</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {detalle.ganado
                ? `Temporada${detalle.anios.length > 1 ? 's' : ''} ${detalle.anios.join(', ')}${club ? ` · con ${club.nombre}` : ''}`
                : 'Todavía no lo ganaste.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDetalle(null)}
            className="shrink-0 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold px-3 py-1.5 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      )}

      {SECCIONES_TROFEOS.map((seccion) => (
        <div key={seccion.label} className="flex flex-col gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-neutral-500 border-b border-neutral-800 pb-2">
            {seccion.label} ({seccion.entradas.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {seccion.entradas.map((entrada) => (
              <TarjetaTrofeo
                key={entrada.competencia}
                entrada={entrada}
                titulosGanados={carreraDT.titulos}
                onClick={() => {
                  const ganados = carreraDT.titulos.filter((t) => t.competencia === entrada.competencia);
                  setDetalle({
                    competencia: entrada.competencia, def: entrada.def,
                    ganado: ganados.length > 0, anios: ganados.map((t) => t.temporada),
                  });
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
