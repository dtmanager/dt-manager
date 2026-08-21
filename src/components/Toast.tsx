// Toasts globales (pedido explícito: "sistema de notificaciones... la
// animacion como el ejemplo de html el cuadrado ese" — mockup de
// referencia rediseno-ui-mockup_2.html, función lanzarToast/.toast).
// Montado UNA vez en App.tsx (mismo patrón que AnimacionTrofeoOverlay),
// consume useToastStore.ts. Cada tarjeta entra deslizándose desde la
// derecha, se queda ~3.6s, y sale — igual que el mockup, con una fase de
// salida propia (no un unmount seco) para que la animación de salida
// llegue a verse.
import { useEffect, useState } from 'react';
import { useToastStore, type ToastItem } from '../store/useToastStore';

const DURACION_VISIBLE_MS = 3600;
const DURACION_SALIDA_MS = 350;

function Tarjeta({ toast, onTerminar }: { toast: ToastItem; onTerminar: (id: string) => void }) {
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    const idVisible = window.setTimeout(() => setSaliendo(true), DURACION_VISIBLE_MS);
    return () => window.clearTimeout(idVisible);
  }, []);

  useEffect(() => {
    if (!saliendo) return undefined;
    const idSalida = window.setTimeout(() => onTerminar(toast.id), DURACION_SALIDA_MS);
    return () => window.clearTimeout(idSalida);
  }, [saliendo, toast.id, onTerminar]);

  return (
    <div
      className={`bg-neutral-900 border border-neutral-800 border-l-[3px] border-l-orange-500 rounded-lg px-3.5 py-2.5 text-xs min-w-[230px] max-w-xs shadow-[0_10px_24px_rgba(0,0,0,0.4)] ${
        saliendo ? 'toast-salida' : 'toast-entrada'
      }`}
    >
      <p className="font-bold text-neutral-100 mb-0.5">{toast.titulo}</p>
      <p className="text-neutral-400">{toast.texto}</p>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, descartarToast } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none [&>*]:pointer-events-auto">
      {toasts.map((t) => (
        <Tarjeta key={t.id} toast={t} onTerminar={descartarToast} />
      ))}
    </div>
  );
}
