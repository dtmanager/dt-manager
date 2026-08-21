// Selector de años de contrato (pedido explícito, "elegir años al
// renovar/fichar" — docs/anios-contrato-y-fichajes.md): mismo lenguaje
// visual chico que SliderMonto, pero como stepper −/+ en vez de barra —
// el rango (1-5) es demasiado corto para que un slider aporte algo, un
// stepper se lee más rápido. Compartido entre NegociacionRenovacion.tsx y
// PantallaOfertaCantera.tsx.
const ANIOS_MIN = 1;
const ANIOS_MAX = 5;

export function SelectorAnios({
  valor, onChange, disabled,
}: {
  valor: number;
  onChange: (valor: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-neutral-500 shrink-0">años</span>
      <button
        type="button"
        disabled={disabled || valor <= ANIOS_MIN}
        onClick={() => onChange(Math.max(ANIOS_MIN, valor - 1))}
        className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 text-neutral-200 text-xs font-bold flex items-center justify-center shrink-0"
      >
        −
      </button>
      <span className="text-sm font-bold tabular-nums w-4 text-center shrink-0">{valor}</span>
      <button
        type="button"
        disabled={disabled || valor >= ANIOS_MAX}
        onClick={() => onChange(Math.min(ANIOS_MAX, valor + 1))}
        className="w-6 h-6 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 text-neutral-200 text-xs font-bold flex items-center justify-center shrink-0"
      >
        +
      </button>
    </div>
  );
}
