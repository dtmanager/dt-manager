// Animación de "ganaste un trofeo" (pedido explícito, diseño en
// docs/prompt-vitrina-y-animacion-trofeos.md): fantasma→aparición→glow
// sobre un fondo oscurecido (spotlight), montado una sola vez en
// App.tsx para que tape cualquier pantalla de abajo sin importar dónde
// esté navegando el usuario cuando se resuelve el título — mismo
// criterio que ya usan los reveals de campeón/ascenso, pero como overlay
// en vez de vivir adentro de una pantalla puntual.
//
// Cola, no una animación suelta: `celebracionesPendientes` (useGameStore)
// puede tener más de un título a la vez — "simular temporada completa"
// puede resolver liga + copa nacional + copa continental de un solo
// click. Acá siempre se muestra sólo el PRIMERO de la cola; al terminar
// su ciclo se llama consumirCelebracion() (saca el primero, el
// siguiente pasa a ser el nuevo primero) — nunca se superponen dos.
import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { TrofeoIcon } from './TrofeoIcon';
import { trofeoDeCompetencia } from '../data/trofeos';

const DURACION_CICLO_MS = 900;
const ESPERA_LECTURA_MS = 1300; // tiempo extra después del glow antes de pasar al siguiente

export function AnimacionTrofeoOverlay() {
  const celebracionesPendientes = useGameStore((s) => s.celebracionesPendientes);
  const consumirCelebracion = useGameStore((s) => s.consumirCelebracion);
  const actual = celebracionesPendientes[0] ?? null;
  const key = actual ? `${actual.competencia}-${actual.temporada}` : null;

  useEffect(() => {
    if (!actual) return undefined;
    const id = window.setTimeout(consumirCelebracion, DURACION_CICLO_MS + ESPERA_LECTURA_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!actual) return null;
  const trofeo = trofeoDeCompetencia(actual.competencia);
  const titulo = `¡CAMPEÓN DE ${trofeo.bandText}!`;

  return (
    <div
      key={key}
      onClick={consumirCelebracion}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 cursor-pointer"
      style={{ animation: 'fadeIn .3s ease-out both' }}
    >
      <div className="absolute inset-0 bg-neutral-950" style={{ opacity: 0.85 }} />

      <div className="relative w-32 h-40 flex items-center justify-center">
        <div
          className="absolute w-56 h-56 rounded-full trofeo-glow"
          style={{ background: `radial-gradient(circle, ${trofeo.metal === 'gold' ? 'rgba(253,230,138,0.55)' : 'rgba(229,231,235,0.5)'}, transparent 70%)` }}
        />
        <div className="absolute w-44 h-44 rounded-full border-2 border-orange-500 trofeo-anillo" />
        <div className="relative w-full h-full trofeo-reveal">
          <TrofeoIcon {...trofeo} />
        </div>
      </div>

      <div className="relative text-center trofeo-nombre">
        <p className="text-xs uppercase tracking-[0.2em] text-orange-400 font-bold">{actual.competencia}</p>
        <p className="text-2xl font-black text-white mt-1">
          {titulo.split('').map((letra, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <span key={i} className="trofeo-letra" style={{ animationDelay: `${700 + i * 28}ms` }}>
              {letra === ' ' ? ' ' : letra}
            </span>
          ))}
        </p>
        <p className="text-xs text-neutral-500 mt-2">Temporada {actual.temporada}</p>
      </div>
    </div>
  );
}
