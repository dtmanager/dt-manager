// M6 — sección 8.5: oferta de cantera. Antes se veía un canterano por vez
// en una tarjeta centrada (cola que se iba vaciando) — ahora se listan
// TODOS los pendientes agrupados por posición, mismo estilo que el
// plantel de un club (PantallaPlantelClub), con "Sumar" / "Descartar" en
// cada fila. Más fácil de comparar varios candidatos a la vez.
//
// Todavía no hay sistema de evolución de canteranos en cantera ni
// cesiones a otros equipos (pedido explícito: se agrega después) — por
// ahora la única decisión es sumarlo ya al plantel o descartarlo.

import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { claseCuadrado } from '../data/coloresPosicion';
import { formatoMonto } from '../utils/formato';
import { POSICIONES } from '../data/posiciones';
import { SelectorAnios } from './SelectorAnios';
import type { Jugador } from '../types';

// Fila con su propio selector de años (pedido explícito, "elegir años al
// fichar" — docs/anios-contrato-y-fichajes.md): estado LOCAL a cada fila
// porque son varios candidatos en la misma pantalla, cada uno con su
// propia elección independiente — no tiene sentido en el store, no
// sobrevive a cerrar la pantalla.
function FilaCanterano({
  jugador, indice, onSumar, onDescartar,
}: { jugador: Jugador; indice: number; onSumar: (aniosElegidos: number) => void; onDescartar: () => void }) {
  const [anios, setAnios] = useState(3);
  return (
    <div
      className="flex items-center gap-2.5 bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-2"
      style={{ animation: `entradaResultado .35s cubic-bezier(.2,.8,.2,1) both ${Math.min(indice * 40, 400)}ms` }}
    >
      <div className={`w-9 h-9 shrink-0 rounded flex items-center justify-center font-bold text-sm ${claseCuadrado(jugador.posicion)}`}>
        {jugador.grl}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate flex items-center gap-1.5">
          {jugador.nombre}
          {jugador.esJoya && (
            <span className="text-[9px] bg-fuchsia-500/20 text-fuchsia-400 rounded px-1 py-0.5 font-semibold shrink-0">
              ✨ PROMESA
            </span>
          )}
        </div>
        <div className="text-xs text-neutral-500">
          POT {jugador.pot} · {jugador.edad} años · Libre · {formatoMonto(jugador.valorMercado)}
        </div>
      </div>
      <SelectorAnios valor={anios} onChange={setAnios} />
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onSumar(anios)}
          className="bg-gradient-to-br from-orange-400 to-orange-500 shadow shadow-orange-500/20 hover:brightness-105 text-black font-bold rounded-lg px-3 py-1.5 text-xs"
        >
          Sumar
        </button>
        <button
          type="button"
          onClick={onDescartar}
          className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg px-3 py-1.5 text-xs"
        >
          Descartar
        </button>
      </div>
    </div>
  );
}

export function PantallaOfertaCantera({ onListo }: { onListo: () => void }) {
  const { canteranosOfrecidos, aceptarCanterano, descartarCanterano } = useGameStore();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between gap-3 topbar-entrada">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center text-xl shadow-lg shadow-orange-500/20">
            🌱
          </div>
          <div className="min-w-0">
            <h1 className="font-bold truncate">Oferta de cantera</h1>
            <span className="inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 mt-0.5">
              {canteranosOfrecidos.length} candidato{canteranosOfrecidos.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
        <button type="button" onClick={onListo} className="text-sm text-neutral-400 hover:text-neutral-200 shrink-0">
          ← Volver
        </button>
      </header>

      {canteranosOfrecidos.length === 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col items-center gap-1.5 text-center">
          <span className="text-2xl">🌱</span>
          <p className="text-sm text-neutral-400">No hay ofertas de cantera pendientes.</p>
          <p className="text-xs text-neutral-600">Vuelven a aparecer candidatos nuevos cada cierre de temporada.</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {POSICIONES.map((posicion) => {
          const jugadores = canteranosOfrecidos
            .filter((j) => j.posicion === posicion)
            .sort((a: Jugador, b: Jugador) => b.grl - a.grl);
          if (jugadores.length === 0) return null;

          return (
            <div key={posicion} className="flex flex-col gap-2">
              <span className="self-start text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300">
                {posicion}
              </span>
              {jugadores.map((j, i) => (
                <FilaCanterano
                  key={j.id}
                  jugador={j}
                  indice={i}
                  onSumar={(aniosElegidos) => aceptarCanterano(j.id, aniosElegidos)}
                  onDescartar={() => descartarCanterano(j.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
