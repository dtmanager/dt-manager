// Slider de montos (pedido explícito, ver docs/sistema-oferta-fichajes.md
// sección 3.3): reemplaza el <input type="number"> de las ofertas de
// fichaje y de renovación — el monto se LEE, no se escribe, con una marca
// en el valor de referencia (1.0x) para ver de un vistazo si la oferta
// actual está por arriba o por debajo de lo esperado. Compartido entre
// PantallaMercado.tsx (fichajes) y PantallaPerfilJugador.tsx/PantallaHub.tsx
// (renovaciones) — mismo componente, no una copia por pantalla.
import { formatoMonto } from '../utils/formato';

const FRACCION_MIN = 0.7;
const FRACCION_MAX = 1.4;

export function SliderMonto({
  valor, valorReferencia, onChange, disabled, etiquetaReferencia = 'referencia',
}: {
  valor: number;
  valorReferencia: number;
  onChange: (valor: number) => void;
  disabled?: boolean;
  etiquetaReferencia?: string;
}) {
  const min = Math.round(valorReferencia * FRACCION_MIN);
  const max = Math.round(valorReferencia * FRACCION_MAX);
  const tickPct = max > min ? ((valorReferencia - min) / (max - min)) * 100 : 50;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xl font-extrabold tabular-nums text-orange-400">{formatoMonto(valor)}</span>
        <span className="text-[10px] text-neutral-500 shrink-0">{etiquetaReferencia}: {formatoMonto(valorReferencia)}</span>
      </div>
      <div className="relative h-5 flex items-center">
        {/* Marca en 1.0x (sección 3.3: "para que se note de un vistazo si
            la oferta está por encima o por debajo de lo esperado"). */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-neutral-500 pointer-events-none z-10"
          style={{ left: `${tickPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={Math.min(max, Math.max(min, valor))}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-orange-500 disabled:opacity-40"
        />
      </div>
    </div>
  );
}
