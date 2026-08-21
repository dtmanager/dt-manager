// DT propio visible y con progreso (pedido explícito, mecánica 5 de
// docs/que-le-falta-profundidad.md: "una pantalla de perfil del propio DT
// (mismo patrón que PantallaPerfilJugador.tsx pero para el DT, no un
// jugador) mostrando sus atributos actuales, y una evolución chica... le
// da sentido de progreso personal al propio manager") — mismo paquete
// (recharts) y mismo lenguaje visual que el perfil de jugador: radar +
// barras, sin dependencias nuevas. La evolución real pasa en
// engine/progresoDT.ts (procesarFinDeTemporada) — acá sólo se muestra el
// estado actual y la actividad que la va a determinar a fin de temporada.

import {
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip,
} from 'recharts';
import { useGameStore } from '../store/useGameStore';
import { calcularApodo, type CarreraDT } from '../engine/carreraDT';
import { BarraIdolatria } from './BarraIdolatria';
import { TrofeoIcon } from './TrofeoIcon';
import { trofeoDeCompetencia } from '../data/trofeos';
import { formatoMonto } from '../utils/formato';
import type { DT } from '../types';

const ATRIBUTOS_DT: { key: keyof Omit<DT, 'id' | 'nombre' | 'nacionalidad' | 'contrato'>; label: string }[] = [
  { key: 'tactica', label: 'Táctica' },
  { key: 'adaptabilidad', label: 'Adaptabilidad' },
  { key: 'desarrollo', label: 'Desarrollo' },
  { key: 'gestionVestuario', label: 'Vestuario' },
  { key: 'motivacion', label: 'Motivación' },
  { key: 'analisis', label: 'Análisis' },
  { key: 'mercado', label: 'Mercado' },
  { key: 'reaccion', label: 'Reacción' },
  { key: 'mentalidad', label: 'Mentalidad' },
  { key: 'reputacion', label: 'Reputación' },
];

function RadarDT({ dt }: { dt: DT }) {
  const datos = ATRIBUTOS_DT.map((a) => ({ stat: a.label, valor: dt[a.key] }));
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <p className="text-xs font-semibold text-neutral-400 mb-3">Atributos</p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={datos}>
            <PolarGrid stroke="#404040" />
            <PolarAngleAxis dataKey="stat" stroke="#a3a3a3" fontSize={10} />
            <PolarRadiusAxis domain={[0, 99]} tick={false} axisLine={false} />
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

// Tarjeta de carrera del DT (pedido explícito, referencia visual: tarjeta
// de jugador tipo "modo Ídolo" con GRL/país, PJ/goles y una vitrina de
// trofeos) — adaptada a lo que tiene sentido para un DT: partidos
// dirigidos, goles a favor de su equipo, idolatría de la hinchada
// (distinta de `confianzaDirectiva` de objetivos.ts — ver nota grande en
// engine/carreraDT.ts) y una vitrina con los títulos ganados (pedido
// explícito: "después vamos a hacer las animaciones de los trofeos y van
// a ir quedando así" — por ahora sólo el layout vacío/lleno). El apodo se
// recalcula en vivo a partir de `CarreraDT`, no se guarda aparte.
function TarjetaCarreraDT({
  carrera, club, onVerVitrina,
}: { carrera: CarreraDT; club: { nombre: string }; onVerVitrina: () => void }) {
  const apodo = calcularApodo(carrera);
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-neutral-400">Carrera</p>
        {apodo && (
          <span className="text-[10px] font-bold uppercase tracking-wide text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
            &ldquo;{apodo.apodo}&rdquo;
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-neutral-950 rounded-lg p-3 text-center">
          <p className="text-2xl font-black tabular-nums">{carrera.partidosDirigidos}</p>
          <p className="text-[9px] uppercase tracking-wide text-neutral-500">Partidos jugados</p>
        </div>
        <div className="bg-neutral-950 rounded-lg p-3 text-center">
          <p className="text-2xl font-black tabular-nums">{carrera.golesAFavorCarrera ?? 0}</p>
          <p className="text-[9px] uppercase tracking-wide text-neutral-500">Goles a favor</p>
        </div>
      </div>
      <BarraIdolatria idolatria={carrera.idolatria} />
      {apodo ? (
        <p className="text-[11px] text-neutral-500">{apodo.descripcion}</p>
      ) : (
        <p className="text-[11px] text-neutral-600 italic">Todavía no dirigiste suficientes partidos para ganarte un apodo.</p>
      )}
      <div className="border-t border-neutral-800 pt-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">🏆 Vitrina</p>
          <button type="button" onClick={onVerVitrina} className="text-[10px] font-semibold text-orange-400 hover:text-orange-300">
            Ver vitrina completa →
          </button>
        </div>
        {carrera.titulos.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-4">
            <span className="text-2xl grayscale opacity-30">🏆</span>
            <span className="text-[10px] uppercase tracking-wide text-neutral-600">Vitrina vacía</span>
          </div>
        ) : (
          carrera.titulos.map((t, i) => {
            const trofeo = trofeoDeCompetencia(t.competencia);
            return (
              <div key={`${t.competencia}-${t.temporada}-${i}`} className="flex items-center gap-3">
                <div className="w-11 h-14 shrink-0">
                  <TrofeoIcon {...trofeo} />
                </div>
                <div className="min-w-0 flex-1 flex flex-col">
                  <span className="text-neutral-200 font-semibold text-sm truncate">{t.competencia}</span>
                  <span className="text-neutral-500 text-xs">Temporada {t.temporada} · {club.nombre}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function BarraAtributo({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="mb-2.5 last:mb-0">
      <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
        <span>{label}</span>
        <strong className="text-neutral-200 tabular-nums">{valor}</strong>
      </div>
      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-400"
          style={{ width: `${valor}%` }}
        />
      </div>
    </div>
  );
}

export function PantallaPerfilDT({
  onVolver, onVerVitrina,
}: { onVolver: () => void; onVerVitrina: () => void }) {
  const {
    clubUsuarioId, clubes, actividadTemporadaDT, carreraDT,
  } = useGameStore();
  const club = clubUsuarioId ? clubes[clubUsuarioId] : null;
  if (!club) return null;
  const { dt } = club;
  const apodoActual = calcularApodo(carreraDT);

  const { fichajesRealizados, canteranosAceptados } = actividadTemporadaDT;
  const sinActividad = fichajesRealizados === 0 && canteranosAceptados === 0;
  const proximaSuba = sinActividad
    ? null
    : fichajesRealizados === canteranosAceptados
      ? 'Mercado y Desarrollo'
      : fichajesRealizados > canteranosAceptados ? 'Mercado' : 'Desarrollo';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <h1 className="font-bold">Perfil del DT</h1>
        <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex items-center gap-4" style={{ animation: 'revealCarta .5s cubic-bezier(.2,.8,.2,1) both' }}>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center font-black text-2xl bg-orange-500/20 text-orange-400">
            {dt.reputacion}
          </div>
          <span className="text-[8px] font-bold uppercase tracking-widest text-neutral-500">GRL</span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-lg">{dt.nombre}</span>
            <span className="text-[9px] font-bold uppercase tracking-wide text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">DT</span>
          </div>
          {apodoActual && <div className="text-orange-400 text-sm font-medium">&ldquo;{apodoActual.apodo}&rdquo;</div>}
          <div className="text-xs text-neutral-500 mt-0.5">
            {dt.nacionalidad ? `${dt.nacionalidad} · ` : ''}DT de {club.nombre}
          </div>
        </div>
      </div>

      {/* Contrato propio del DT (pedido explícito, ver engine/contratoDT.ts)
          — sólo se muestra si ya existe (carreras guardadas antes de esta
          mecánica lo rellenan solas la próxima vez que cierran una
          temporada, ver procesarFinDeTemporada en useGameStore.ts). */}
      {dt.contrato && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-neutral-400">Contrato</p>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Club</span>
            <strong className="text-neutral-200">{club.nombre}</strong>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Salario anual</span>
            <strong className="text-neutral-200">{formatoMonto(dt.contrato.salarioAnual)}</strong>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Temporadas restantes</span>
            <strong className={dt.contrato.temporadasRestantes <= 1 ? 'text-orange-400' : 'text-neutral-200'}>
              {dt.contrato.temporadasRestantes}
            </strong>
          </div>
          {dt.contrato.temporadasRestantes <= 1 && (
            <p className="text-[11px] text-orange-400/80">Se vence a fin de esta temporada — el club te va a ofrecer renovar.</p>
          )}
        </div>
      )}

      <TarjetaCarreraDT carrera={carreraDT} club={club} onVerVitrina={onVerVitrina} />

      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex flex-col gap-2">
        <p className="text-xs font-semibold text-neutral-400">Actividad de esta temporada</p>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Fichajes concretados</span>
          <strong className="text-neutral-200">{fichajesRealizados}</strong>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Canteranos incorporados</span>
          <strong className="text-neutral-200">{canteranosAceptados}</strong>
        </div>
        <p className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-800 mt-1">
          {sinActividad
            ? 'Todavía no hay actividad esta temporada — sin fichajes ni canteranos incorporados, el DT no progresa este cierre.'
            : `A fin de temporada sube: ${proximaSuba}.`}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <RadarDT dt={dt} />
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <p className="text-xs font-semibold text-neutral-400 mb-3">Atributos en detalle</p>
          {ATRIBUTOS_DT.map((a) => (
            <BarraAtributo key={a.key} label={a.label} valor={dt[a.key]} />
          ))}
        </div>
      </div>
    </div>
  );
}
