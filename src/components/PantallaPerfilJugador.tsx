// M7 — sección 8.3: perfil de jugador con su evolución de GRL a lo largo
// de las temporadas (recharts, ya estaba instalado y sin usar). Desde
// sub-stats-diseno.md (sección 7.5) también se muestra un radar de las 6
// sub-stats (4 para arqueros) cuando el jugador las tiene — mismo paquete,
// sin dependencias nuevas.

import { useEffect, useState } from 'react';
import {
  CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { claseCuadrado } from '../data/coloresPosicion';
import { formatoMonto } from '../utils/formato';
import { puedeRenovar } from '../engine/contratos';
import { useGameStore } from '../store/useGameStore';
import { NegociacionRenovacion } from './NegociacionRenovacion';
import type { Jugador } from '../types';

function RadarSubStats({ jugador }: { jugador: Jugador }) {
  const datos = jugador.posicion === 'ARQ'
    ? jugador.subStatsArquero && [
      { stat: 'Atajada', valor: jugador.subStatsArquero.atajada },
      { stat: 'Salidas', valor: jugador.subStatsArquero.salidas },
      { stat: 'Juego de pies', valor: jugador.subStatsArquero.juegoDePies },
      { stat: 'Reflejos', valor: jugador.subStatsArquero.reflejos },
    ]
    : jugador.subStats && [
      { stat: 'Ritmo', valor: jugador.subStats.ritmo },
      { stat: 'Tiro', valor: jugador.subStats.tiro },
      { stat: 'Pase', valor: jugador.subStats.pase },
      { stat: 'Regate', valor: jugador.subStats.regate },
      { stat: 'Defensa', valor: jugador.subStats.defensa },
      { stat: 'Físico', valor: jugador.subStats.fisico },
    ];

  if (!datos) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <p className="text-xs font-semibold text-neutral-400 mb-3">Atributos</p>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={datos}>
            <PolarGrid stroke="#404040" />
            <PolarAngleAxis dataKey="stat" stroke="#a3a3a3" fontSize={11} />
            <PolarRadiusAxis domain={[40, 99]} tick={false} axisLine={false} />
            <Radar
              dataKey="valor"
              stroke="#f97316"
              fill="#f97316"
              fillOpacity={0.35}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
            <Tooltip
              contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#a3a3a3' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Barras de atributos (pedido explícito, documento de rediseño sección
// 5.3.5: "las barras de atributos crecen desde 0 al valor al entrar a la
// pantalla") — complementa al radar de arriba (que ya anima el POLÍGONO
// completo, ver `isAnimationActive` de `Radar`) con una lectura rápida
// número a número, mismo criterio que un perfil de jugador de FIFA
// (radar para la forma general + lista de stats para el valor exacto).
// Arranca en 0% y recién en el próximo frame pasa al valor real — el
// salto de "0 a real" en dos pasos es lo que hace que el navegador SÍ
// anime la transición de `width` (si arrancara directo en el valor final
// no habría nada que animar).
function BarraStat({ label, valor, retrasoMs }: { label: string; valor: number; retrasoMs: number }) {
  const [ancho, setAncho] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => setAncho(valor), 50 + retrasoMs);
    return () => window.clearTimeout(id);
  }, [valor, retrasoMs]);

  return (
    <div className="mb-2.5 last:mb-0">
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

function BarrasSubStats({ jugador }: { jugador: Jugador }) {
  const datos = jugador.posicion === 'ARQ'
    ? jugador.subStatsArquero && [
      { stat: 'Atajada', valor: jugador.subStatsArquero.atajada },
      { stat: 'Salidas', valor: jugador.subStatsArquero.salidas },
      { stat: 'Juego de pies', valor: jugador.subStatsArquero.juegoDePies },
      { stat: 'Reflejos', valor: jugador.subStatsArquero.reflejos },
    ]
    : jugador.subStats && [
      { stat: 'Ritmo', valor: jugador.subStats.ritmo },
      { stat: 'Tiro', valor: jugador.subStats.tiro },
      { stat: 'Pase', valor: jugador.subStats.pase },
      { stat: 'Regate', valor: jugador.subStats.regate },
      { stat: 'Defensa', valor: jugador.subStats.defensa },
      { stat: 'Físico', valor: jugador.subStats.fisico },
    ];

  if (!datos) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <p className="text-xs font-semibold text-neutral-400 mb-3">Atributos en detalle</p>
      {datos.map((d, i) => (
        <BarraStat key={d.stat} label={d.stat} valor={d.valor} retrasoMs={i * 60} />
      ))}
    </div>
  );
}

// Sistema de dorsales (pedido explícito: "que el jugador pueda cambiar
// los dorsales si quiere del 1 al 99") — sólo para jugadores del club
// propio (esPropio), mismo criterio que SeccionRenovacion más abajo.
function EditorDorsal({ jugador }: { jugador: Jugador }) {
  const cambiarDorsal = useGameStore((s) => s.cambiarDorsal);
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(jugador.dorsal ?? 1);
  const [error, setError] = useState<string | null>(null);

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => { setValor(jugador.dorsal ?? 1); setEditando(true); setError(null); }}
        className="text-neutral-500 hover:text-orange-400 font-normal text-sm"
        title="Cambiar dorsal"
      >
        #{jugador.dorsal ?? '—'} ✎
      </button>
    );
  }

  function guardar() {
    const ok = cambiarDorsal(jugador.id, valor);
    if (!ok) {
      setError('Ese número ya lo tiene otro jugador del plantel, o no es válido (1-99).');
      return;
    }
    setEditando(false);
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm font-normal">
      <input
        type="number"
        min={1}
        max={99}
        value={valor}
        onChange={(e) => setValor(Number(e.target.value))}
        className="w-14 bg-neutral-800 border border-neutral-700 rounded px-1.5 py-0.5 text-sm"
      />
      <button type="button" onClick={guardar} className="text-orange-400 text-xs font-semibold px-1.5">
        Guardar
      </button>
      <button type="button" onClick={() => setEditando(false)} className="text-neutral-500 text-xs px-1">
        Cancelar
      </button>
      {error && <span className="text-red-400 text-[11px] basis-full">{error}</span>}
    </span>
  );
}

const NOMBRE_PIERNA: Record<'derecha' | 'izquierda' | 'ambidiestro', string> = {
  derecha: 'Diestro',
  izquierda: 'Zurdo',
  ambidiestro: 'Ambidiestro',
};

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-sm font-semibold">{valor}</span>
    </div>
  );
}

export function PantallaPerfilJugador({
  jugador,
  esPropio,
  onVolver,
}: {
  jugador: Jugador;
  esPropio: boolean;
  onVolver: () => void;
}) {
  const historial = jugador.historialGrl;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <h1 className="font-bold">Perfil del jugador</h1>
        <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center gap-4" style={{ animation: 'revealCarta .5s cubic-bezier(.2,.8,.2,1) both' }}>
        <div className={`w-16 h-16 shrink-0 rounded-lg flex items-center justify-center font-black text-2xl ${claseCuadrado(jugador.posicion)}`}>
          {jugador.grl}
        </div>
        <div className="min-w-0">
          <div className="font-bold text-lg flex items-center gap-2 flex-wrap">
            {esPropio ? (
              <EditorDorsal jugador={jugador} />
            ) : (
              jugador.dorsal != null && <span className="text-neutral-500 font-normal">#{jugador.dorsal}</span>
            )}
            {jugador.nombre}
            {jugador.esJoya && (
              <span className="text-[10px] bg-fuchsia-500/20 text-fuchsia-400 rounded px-1.5 py-0.5 font-semibold">
                PROMESA
              </span>
            )}
          </div>
          <div className="text-sm text-neutral-500">
            {jugador.posicion} · {jugador.edad} años
            {jugador.piernaHabil && ` · ${NOMBRE_PIERNA[jugador.piernaHabil]}`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Dato label="Potencial" valor={String(jugador.pot)} />
        <Dato label="Valor de mercado" valor={formatoMonto(jugador.valorMercado)} />
        <Dato label="Salario" valor={`${formatoMonto(jugador.salario)}/temporada`} />
        <Dato label="Contrato" valor={jugador.contratoAniosRestantes > 0 ? `${jugador.contratoAniosRestantes} año(s)` : 'Libre'} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Dato label="Partidos" valor={String(jugador.estadisticasTemporada.pj)} />
        <Dato label="Goles" valor={String(jugador.estadisticasTemporada.goles)} />
        <Dato label="Asistencias" valor={String(jugador.estadisticasTemporada.asistencias)} />
      </div>

      {esPropio && puedeRenovar(jugador) && <NegociacionRenovacion jugador={jugador} />}

      <RadarSubStats jugador={jugador} />
      <BarrasSubStats jugador={jugador} />

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <p className="text-xs font-semibold text-neutral-400 mb-3">Evolución de GRL</p>
        {historial.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-8">
            Todavía no terminó ninguna temporada con este jugador.
          </p>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historial.map((h) => ({ ...h, temporada: `T${h.temporada}` }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="temporada" stroke="#a3a3a3" fontSize={11} />
                <YAxis stroke="#a3a3a3" fontSize={11} domain={[40, 99]} />
                <Tooltip
                  contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#a3a3a3' }}
                />
                <Line
                  type="monotone"
                  dataKey="grl"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive
                  animationDuration={700}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
