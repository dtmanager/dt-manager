// Negociación de renovación en rondas (pedido explícito, ver
// docs/sistema-oferta-fichajes.md secciones 3 y 6) — mismo flujo de
// rondas + slider que NegociacionFichaje (PantallaMercado.tsx), pero
// contra `ofertarRenovacion` y sin presión de oferta rival (no aplica,
// es tu propio jugador). Compartido entre PantallaPerfilJugador.tsx (el
// perfil completo sigue teniendo esta sección) y PantallaHub.tsx (Fase 6:
// renovación rápida desde la lista de Plantel, sin salir del Hub).
import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { calcularSalarioJusto } from '../engine/contratos';
import { CANTIDAD_MAX_RONDAS, franjaEstimada, type FranjaEstimada } from '../engine/negociacion';
import { SliderMonto } from './SliderMonto';
import { SelectorAnios } from './SelectorAnios';
import { formatoMonto } from '../utils/formato';
import type { Jugador, RespuestaOferta } from '../types';

interface RondaHistorial {
  ronda: number;
  monto: number;
  respuesta: RespuestaOferta;
}

function textoRespuesta(respuesta: RespuestaOferta): string {
  if (respuesta.resultado === 'aceptada') return '¡Aceptada!';
  if (respuesta.resultado === 'rechazada_cerca') {
    return `Rechazada, pero cerca — pide algo más (subiendo a ~${formatoMonto(respuesta.contraofertaSugerida ?? 0)} tenés mejor chance)`;
  }
  return 'Rechazada de lleno';
}

export function NegociacionRenovacion({ jugador, onCerrar }: { jugador: Jugador; onCerrar?: () => void }) {
  const ofertarRenovacion = useGameStore((s) => s.ofertarRenovacion);
  // Presupuesto en rojo (pedido explícito: "si no me queda presupuesto
  // puedo seguir renovando jugadores... no tengo penalizaciones") — se
  // avisa ACÁ, antes de intentar ofertar, en vez de dejar que el club
  // clickee y recién ahí se entere por el aviso genérico de "no se pudo
  // enviar la oferta" (mismo store ya rechaza esto, ver ofertarRenovacion
  // en useGameStore.ts).
  const presupuesto = useGameStore((s) => (s.clubUsuarioId ? s.clubes[s.clubUsuarioId]?.presupuesto ?? 0 : 0));
  const sinPresupuesto = presupuesto <= 0;
  const salarioJusto = calcularSalarioJusto(jugador);
  const [monto, setMonto] = useState(salarioJusto);
  const [anios, setAnios] = useState(3);
  const [rondas, setRondas] = useState<RondaHistorial[]>([]);
  const [consulta, setConsulta] = useState<FranjaEstimada | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const ultimaRonda = rondas[rondas.length - 1];
  const cerrada = ultimaRonda != null
    && (ultimaRonda.respuesta.resultado !== 'rechazada_cerca' || rondas.length >= CANTIDAD_MAX_RONDAS);
  const valorReferencia = ultimaRonda?.respuesta.contraofertaSugerida ?? salarioJusto;

  function handleOfertar() {
    const respuesta = ofertarRenovacion(jugador.id, monto, anios);
    if (!respuesta) {
      setAviso('No se pudo enviar la oferta.');
      window.setTimeout(() => setAviso(null), 3000);
      return;
    }
    setRondas((r) => [...r, { ronda: r.length + 1, monto, respuesta }]);
    if (respuesta.contraofertaSugerida) setMonto(respuesta.contraofertaSugerida);
  }

  return (
    <div className="bg-neutral-900 border border-orange-500/40 rounded-lg p-4 flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-orange-400">
          Contrato por vencer ({jugador.contratoAniosRestantes} año{jugador.contratoAniosRestantes > 1 ? 's' : ''}) — ofrecé una renovación
        </p>
        {onCerrar && (
          <button type="button" onClick={onCerrar} className="text-xs text-neutral-400 hover:text-neutral-200 shrink-0">
            ✕
          </button>
        )}
      </div>

      {aviso && <p className="text-xs text-red-400">{aviso}</p>}

      {sinPresupuesto && (
        <p className="text-xs text-red-400">
          El club está en números rojos — no podés ofrecer renovaciones nuevas hasta salir del presupuesto negativo.
        </p>
      )}

      {rondas.length === 0 && !consulta && (
        <button
          type="button"
          onClick={() => setConsulta(franjaEstimada(salarioJusto))}
          className="self-start text-xs font-semibold text-neutral-400 hover:text-neutral-200 underline underline-offset-2"
        >
          Consultar antes de ofertar
        </button>
      )}
      {consulta && (
        <p className="text-xs text-neutral-400">
          {jugador.nombre} espera algo entre {formatoMonto(consulta.min)} y {formatoMonto(consulta.max)} por temporada.
        </p>
      )}

      {rondas.map((r) => (
        <p key={r.ronda} className="text-xs text-neutral-400">
          Ronda {r.ronda}: ofreciste {formatoMonto(r.monto)}/temporada — {textoRespuesta(r.respuesta)}
        </p>
      ))}

      {!cerrada ? (
        <>
          <SliderMonto
            valor={monto}
            valorReferencia={valorReferencia}
            onChange={setMonto}
            etiquetaReferencia={ultimaRonda ? 'sugerido' : 'lo justo'}
          />
          <div className="flex items-center justify-between gap-2">
            <SelectorAnios valor={anios} onChange={setAnios} />
            <span className="text-[10px] text-neutral-500">
              {anios} año{anios > 1 ? 's' : ''} · {formatoMonto(monto)}/temporada
            </span>
          </div>
          <button
            type="button"
            onClick={handleOfertar}
            disabled={sinPresupuesto}
            title={sinPresupuesto ? 'El club está en números rojos — no se pueden ofrecer renovaciones nuevas.' : undefined}
            className="self-end bg-orange-500 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed hover:bg-orange-400 text-black text-xs font-bold px-3 py-1.5 rounded"
          >
            {rondas.length === 0 ? 'Ofertar renovación' : `Subir oferta (ronda ${rondas.length + 1} de ${CANTIDAD_MAX_RONDAS})`}
          </button>
        </>
      ) : (
        <p className="text-xs text-neutral-400">
          {ultimaRonda.respuesta.resultado === 'aceptada'
            ? `¡${jugador.nombre} renovó por ${formatoMonto(ultimaRonda.monto)}/temporada, ${anios} año${anios > 1 ? 's' : ''}!`
            : `${jugador.nombre} no aceptó esta vez — probá de nuevo más adelante.`}
        </p>
      )}
    </div>
  );
}
