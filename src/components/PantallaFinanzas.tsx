// Desglose real de Ingresos/Sueldos/Gastos semana a semana (pedido
// explícito) — antes sólo había datos reales a fin de temporada; ahora
// `historialSemanalUsuario` (useGameStore.ts, ver engine/economiaSemanal.ts)
// trae un registro real por cada fecha de liga jugada esta temporada, sin
// inventar ningún número: mismo total anual que ya usaba economia.ts,
// sólo repartido semana a semana en vez de un pelotazo a fin de temporada.

import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useGameStore } from '../store/useGameStore';
import { formatoMonto } from '../utils/formato';

export function PantallaFinanzas({ onVolver }: { onVolver: () => void }) {
  const { clubUsuarioId, clubes, historialSemanalUsuario } = useGameStore();
  const club = clubUsuarioId ? clubes[clubUsuarioId] : null;
  if (!club) return null;

  const totalIngresos = historialSemanalUsuario.reduce((acc, r) => acc + r.ingresos, 0);
  const totalGastos = historialSemanalUsuario.reduce((acc, r) => acc + r.gastos, 0);
  const datosGrafico = historialSemanalUsuario.map((r) => ({
    semana: `S${r.semana}`, Ingresos: r.ingresos, Gastos: -r.gastos,
  }));

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <h1 className="font-bold">Finanzas</h1>
        <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-neutral-500">Presupuesto</span>
          <strong className={`text-sm ${club.presupuesto < 0 ? 'text-red-400' : 'text-neutral-100'}`}>
            {formatoMonto(club.presupuesto)}
          </strong>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-neutral-500">Ingresos (temporada)</span>
          <strong className="text-sm text-emerald-400">+{formatoMonto(totalIngresos)}</strong>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-neutral-500">Sueldos (temporada)</span>
          <strong className="text-sm text-red-400">-{formatoMonto(totalGastos)}</strong>
        </div>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
        <p className="text-xs font-semibold text-neutral-400 mb-1">Semana a semana</p>
        <p className="text-[11px] text-neutral-500 mb-3">
          Taquilla real en cada fecha de local, sueldos reales cada fecha (jugás o no de local) — el premio por
          posición final se suma recién al cerrar la temporada, todavía no está acá.
        </p>
        {datosGrafico.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-8">
            Todavía no se jugó ninguna fecha de liga esta temporada.
          </p>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="semana" stroke="#a3a3a3" fontSize={10} interval="preserveStartEnd" />
                <YAxis stroke="#a3a3a3" fontSize={10} tickFormatter={(v) => formatoMonto(Math.abs(v))} />
                <Tooltip
                  contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#a3a3a3' }}
                  formatter={(valor) => formatoMonto(Math.abs(Number(valor)))}
                />
                <Bar dataKey="Ingresos" fill="#34d399" isAnimationActive animationDuration={600} />
                <Bar dataKey="Gastos" fill="#f87171" isAnimationActive animationDuration={600} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {historialSemanalUsuario.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-neutral-400 mb-1">Últimos movimientos</p>
          {[...historialSemanalUsuario].reverse().slice(0, 10).map((r) => (
            <div key={r.semana} className="flex justify-between items-center text-xs border-t border-neutral-800 pt-1.5 first:border-0 first:pt-0">
              <span className="text-neutral-500">Fecha {r.semana}</span>
              <span className="flex gap-3">
                {r.ingresos > 0 && <span className="text-emerald-400">+{formatoMonto(r.ingresos)}</span>}
                <span className="text-red-400">-{formatoMonto(r.gastos)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
