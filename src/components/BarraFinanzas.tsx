// Barras de progreso animadas (pedido explícito, rediseño general: "que
// el juego esté terminado" — extraídas de PantallaHub.tsx para poder
// reusarlas en PantallaFinDeTemporada.tsx sin duplicar la lógica de
// animación). Arrancan en 0 y recién al siguiente frame pasan al valor
// real, así el navegador SÍ anima el `width` (si arrancaran ya en el
// valor final no habría transición que animar).
import { useEffect, useState } from 'react';
import { formatoMonto } from '../utils/formato';

export function BarraMini({ label, valor, retrasoMs }: { label: string; valor: number; retrasoMs: number }) {
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setAncho(valor), 50 + retrasoMs);
    return () => window.clearTimeout(id);
  }, [valor, retrasoMs]);

  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
        <span>{label}</span>
        <strong className="text-neutral-200 tabular-nums">{valor}</strong>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-[width] duration-[900ms] ease-out"
          style={{ width: `${ancho}%` }}
        />
      </div>
    </div>
  );
}

// Barra horizontal de un monto real (premio/taquilla/sueldos) — mismo
// patrón de animación que BarraMini, pero el ancho es proporcional al
// mayor de los montos comparados (no a 0-100 fijo) para que se pueda
// comparar de un vistazo entre varias.
export function BarraFinanzas({
  label, valor, max, colorClase, retrasoMs,
}: { label: string; valor: number; max: number; colorClase: string; retrasoMs: number }) {
  const [ancho, setAncho] = useState(0);
  const porcentaje = max > 0 ? Math.min(100, (valor / max) * 100) : 0;
  useEffect(() => {
    const id = window.setTimeout(() => setAncho(porcentaje), 50 + retrasoMs);
    return () => window.clearTimeout(id);
  }, [porcentaje, retrasoMs]);

  return (
    <div className="mb-2 last:mb-0">
      <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
        <span>{label}</span>
        <strong className="text-neutral-200 tabular-nums">{formatoMonto(valor)}</strong>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        <div className={`h-full rounded-full ${colorClase} transition-[width] duration-[900ms] ease-out`} style={{ width: `${ancho}%` }} />
      </div>
    </div>
  );
}
