// M5 — mercado de pases (sección 6). Dos pestañas: Ventas (poner
// jugadores propios en el mercado y responder ofertas de la IA) y Compras
// (ofertar por jugadores transferibles de otros clubes).

import { useMemo, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { claseCuadrado } from '../data/coloresPosicion';
import { formatoMonto } from '../utils/formato';
import { calcularVentanaMercado } from '../engine/mercado';
import { puedeLiberarSinRomperPiso } from '../engine/contratos';
import {
  CANTIDAD_MAX_RONDAS, franjaEstimada, hayOfertaRival, type FranjaEstimada,
} from '../engine/negociacion';
import { SliderMonto } from './SliderMonto';
import { NegociacionRenovacion } from './NegociacionRenovacion';
import { buscarRefuerzos, type CandidatoScouting, type FiltroScouting } from '../engine/scouting';
import { POSICIONES } from '../data/posiciones';
import type { Jugador, Posicion, RespuestaOferta } from '../types';

function FilaJugador({ jugador, children }: { jugador: Jugador; children: React.ReactNode }) {
  return (
    <div className="group flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 hover:border-neutral-700 transition-colors">
      <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center font-black text-sm shadow-inner ${claseCuadrado(jugador.posicion)}`}>
        {jugador.grl}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate">
          {jugador.dorsal != null && <span className="text-neutral-500 font-normal">#{jugador.dorsal} </span>}
          {jugador.nombre}
        </div>
        <div className="text-[11px] text-neutral-500 truncate">
          <span className="font-semibold text-neutral-400">{jugador.posicion}</span> · {jugador.edad} años ·{' '}
          <span className="text-emerald-400/90 font-medium">{formatoMonto(jugador.valorMercado)}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function PestanaVentas({ cerrado }: { cerrado: boolean }) {
  const { clubUsuarioId, clubes, ofertasRecibidas, marcarTransferible, aceptarOferta, rechazarOferta } = useGameStore();
  const club = clubUsuarioId ? clubes[clubUsuarioId] : null;
  if (!club) return null;

  return (
    <div className="flex flex-col gap-4">
      {ofertasRecibidas.length > 0 && (
        <div className="bg-gradient-to-br from-orange-500/10 to-neutral-900 border border-orange-500/30 rounded-xl p-3.5 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-400 flex items-center gap-1.5">
            📥 Ofertas recibidas
          </p>
          {/* Agrupadas por jugador (pedido explícito: "si pones muchos
              jugadores al final se terminan mezclando todas") — antes era
              una lista plana de TODAS las ofertas de TODOS los jugadores
              transferibles, sin ningún separador; con 2-3 jugadores
              listados a la vez ya no se distinguía de quién era cada
              oferta salvo por el "por {nombre}" al final de cada renglón.
              Ahora cada jugador tiene su propio bloque con encabezado, y
              las ofertas de ESE jugador se ordenan de mayor a menor monto
              (la mejor arriba, más fácil de decidir). */}
          {Object.entries(
            ofertasRecibidas.reduce<Record<string, typeof ofertasRecibidas>>((grupos, o) => {
              (grupos[o.jugadorId] ??= []).push(o);
              return grupos;
            }, {}),
          ).map(([jugadorId, ofertasDelJugador]) => {
            const jugador = club.plantel.find((j) => j.id === jugadorId);
            if (!jugador) return null;
            // Piso obligatorio de plantel (pedido explícito: "2 arqueros y
            // 11 titulares y 5 suplentes") — se avisa ACÁ por qué el botón
            // está deshabilitado, en vez de que el click no haga nada.
            const rompePiso = !puedeLiberarSinRomperPiso(club, jugadorId);
            // Bug reportado ("si esta la ventana del mercado cerrada
            // porque puedo seguir aceptando ofertas que me llegaron en el
            // pasado"): las ofertas quedan en ofertasRecibidas hasta que
            // se aceptan/rechazan o se saca al jugador del mercado — con
            // la ventana ya cerrada, "Aceptar" seguía cerrando una venta
            // real aunque el banner de arriba diga explícitamente "no
            // empezar ventas ni ofertas nuevas". Rechazar sigue permitido
            // (no es una venta, sólo descarta la oferta vieja).
            const bloqueadoPorVentana = cerrado;
            const ofertasOrdenadas = [...ofertasDelJugador].sort((a, b) => b.monto - a.monto);
            return (
              <div key={jugadorId} className="flex flex-col gap-1.5 bg-neutral-950/40 border border-neutral-800/60 rounded-lg p-2">
                <p className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                  {jugador.nombre}
                  <span className="text-neutral-500 font-normal">
                    · {ofertasOrdenadas.length} oferta{ofertasOrdenadas.length === 1 ? '' : 's'}
                  </span>
                </p>
                <div className="flex flex-col gap-1.5">
                  {ofertasOrdenadas.map((o) => {
                    const ofertante = clubes[o.clubOfertanteId];
                    if (!ofertante) return null;
                    return (
                      <div
                        key={`${o.jugadorId}-${o.clubOfertanteId}`}
                        className="flex items-center justify-between text-sm gap-2 bg-neutral-950/60 rounded-lg px-2.5 py-2"
                      >
                        <span>
                          <strong>{ofertante.nombre}</strong> ofrece{' '}
                          <span className="text-emerald-400 font-semibold">{formatoMonto(o.monto)}</span>
                        </span>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => aceptarOferta(o)}
                            disabled={rompePiso || bloqueadoPorVentana}
                            title={
                              bloqueadoPorVentana
                                ? 'La ventana de mercado está cerrada — podés rechazar esta oferta vieja, pero no cerrar la venta.'
                                : rompePiso
                                  ? 'Vender a este jugador te dejaría por debajo del piso obligatorio (2 arqueros, 16 jugadores en plantel)'
                                  : undefined
                            }
                            className="bg-gradient-to-br from-emerald-500 to-emerald-600 hover:brightness-105 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-white text-xs font-bold px-2.5 py-1.5 rounded-lg"
                          >
                            Aceptar
                          </button>
                          <button
                            type="button"
                            onClick={() => rechazarOferta(o)}
                            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                          >
                            Rechazar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {club.plantel.map((j) => {
          // Sacar a un jugador que ya está listado sigue permitido con
          // la ventana cerrada (no es "fichar nuevo", es retractarse) —
          // sólo se bloquea EMPEZAR una venta nueva, ver el comentario
          // grande del banner de arriba.
          const bloqueado = cerrado && !j.transferible;
          return (
            <FilaJugador key={j.id} jugador={j}>
              <button
                type="button"
                onClick={() => marcarTransferible(j.id, !j.transferible)}
                disabled={bloqueado}
                title={bloqueado ? 'La ventana de mercado está cerrada' : undefined}
                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0 transition-colors ${
                  j.transferible
                    ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-black shadow shadow-orange-500/20'
                    : bloqueado
                      ? 'bg-neutral-900 text-neutral-600 cursor-not-allowed'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {j.transferible ? 'En el mercado' : 'Poner en el mercado'}
              </button>
            </FilaJugador>
          );
        })}
      </div>
    </div>
  );
}

interface RondaHistorial {
  ronda: number;
  monto: number;
  respuesta: RespuestaOferta;
}

function textoRespuesta(respuesta: RespuestaOferta): string {
  if (respuesta.resultado === 'aceptada') return '¡Aceptada!';
  if (respuesta.resultado === 'rechazada_cerca') {
    return `Rechazada, pero cerca — piden algo más (subiendo a ~${formatoMonto(respuesta.contraofertaSugerida ?? 0)} tenés mejor chance)`;
  }
  return 'Rechazada de lleno — no están interesados a este precio';
}

// Negociación en rondas (pedido explícito, ver
// docs/sistema-oferta-fichajes.md secciones 3 y 4): reemplaza al viejo
// input+botón de un solo tiro. El estado de la negociación (rondas,
// consulta, si hay rival) vive acá, LOCAL al componente — se resetea solo
// cada vez que se vuelve a abrir (el padre desmonta esta card al
// cerrarla), no hace falta guardarlo en el store porque no sobrevive a un
// cambio de pantalla ni tiene que persistirse entre sesiones.
function NegociacionFichaje({
  jugador, clubId, cerrado, onCerrar,
}: {
  jugador: Jugador; clubId: string; cerrado: boolean; onCerrar: () => void;
}) {
  const ofertarPorJugador = useGameStore((s) => s.ofertarPorJugador);
  // Contrato post-fichaje (pedido explícito, "elegir años al fichar" —
  // docs/anios-contrato-y-fichajes.md): apenas se cierra la transferencia,
  // el jugador ya está en TU plantel con un contrato piso de 1 año (ver
  // ofertarPorJugador en useGameStore.ts) — se relee acá para poder
  // ofrecerle de una un contrato mejor, reusando NegociacionRenovacion tal
  // cual (puedeRenovar ya da true con 1 año restante).
  const jugadorFichado = useGameStore((s) => (
    s.clubUsuarioId ? s.clubes[s.clubUsuarioId]?.plantel.find((j) => j.id === jugador.id) : undefined
  ));
  const [monto, setMonto] = useState(jugador.valorMercado);
  const [rondas, setRondas] = useState<RondaHistorial[]>([]);
  const [consulta, setConsulta] = useState<FranjaEstimada | null>(null);
  // Se sortea UNA sola vez al abrir la negociación (sección 3.1 punto 4),
  // no en cada ronda.
  const [hayRival] = useState(() => hayOfertaRival(jugador));
  const [aviso, setAviso] = useState<string | null>(null);

  const ultimaRonda = rondas[rondas.length - 1];
  const cerrada = ultimaRonda != null
    && (ultimaRonda.respuesta.resultado !== 'rechazada_cerca' || rondas.length >= CANTIDAD_MAX_RONDAS);
  // A partir de la 2da ronda, el slider se reposiciona sobre la
  // contraoferta sugerida en vez de arrancar de nuevo del valorMercado
  // original (sección 3.3, último punto).
  const valorReferencia = ultimaRonda?.respuesta.contraofertaSugerida ?? jugador.valorMercado;

  function handleOfertar() {
    const respuesta = ofertarPorJugador(jugador.id, clubId, monto, rondas.length + 1, hayRival);
    if (!respuesta) {
      setAviso('No hay presupuesto suficiente o no hay cupo en el plantel para esta oferta.');
      window.setTimeout(() => setAviso(null), 3000);
      return;
    }
    setRondas((r) => [...r, { ronda: r.length + 1, monto, respuesta }]);
    if (respuesta.contraofertaSugerida) setMonto(respuesta.contraofertaSugerida);
  }

  return (
    <div className="bg-gradient-to-br from-orange-500/[0.07] to-neutral-900/70 border border-orange-500/25 rounded-xl p-3.5 flex flex-col gap-2.5 -mt-1 mb-1">
      {aviso && <p className="text-xs text-red-400">{aviso}</p>}

      {hayRival && (
        <p className="text-xs text-amber-400">
          ⚠️ Otro club también está mirando a {jugador.nombre} — mejor no tantear de más.
        </p>
      )}

      {rondas.length === 0 && !consulta && (
        <button
          type="button"
          onClick={() => setConsulta(franjaEstimada(jugador.valorMercado))}
          className="self-start text-xs font-semibold text-neutral-400 hover:text-neutral-200 underline underline-offset-2"
        >
          Consultar precio antes de ofertar
        </button>
      )}
      {consulta && (
        <p className="text-xs text-neutral-400">
          El club estima que pediría entre {formatoMonto(consulta.min)} y {formatoMonto(consulta.max)}.
        </p>
      )}

      {rondas.map((r) => (
        <p key={r.ronda} className="text-xs text-neutral-400">
          Ronda {r.ronda}: ofreciste {formatoMonto(r.monto)} — {textoRespuesta(r.respuesta)}
        </p>
      ))}

      {!cerrada ? (
        <>
          <SliderMonto
            valor={monto}
            valorReferencia={valorReferencia}
            onChange={setMonto}
            disabled={cerrado}
            etiquetaReferencia={ultimaRonda ? 'sugerido' : 'valor de mercado'}
          />
          <button
            type="button"
            onClick={handleOfertar}
            disabled={cerrado}
            title={cerrado ? 'La ventana de mercado está cerrada' : undefined}
            className="self-end bg-gradient-to-br from-orange-400 to-orange-500 hover:brightness-105 disabled:bg-neutral-800 disabled:bg-none disabled:text-neutral-600 disabled:cursor-not-allowed text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow shadow-orange-500/20 disabled:shadow-none active:scale-[0.98] transition-transform"
          >
            {rondas.length === 0 ? 'Ofertar' : `Subir oferta (ronda ${rondas.length + 1} de ${CANTIDAD_MAX_RONDAS})`}
          </button>
        </>
      ) : ultimaRonda.respuesta.resultado === 'aceptada' && jugadorFichado ? (
        <>
          <p className="text-xs text-emerald-400">
            ¡Fichaje cerrado! {jugador.nombre} firmó un contrato mínimo (1 año) — ofrecele uno mejor antes de que se te escape.
          </p>
          <NegociacionRenovacion jugador={jugadorFichado} onCerrar={onCerrar} />
        </>
      ) : (
        <button type="button" onClick={onCerrar} className="self-end text-xs font-semibold text-neutral-400 hover:text-neutral-200">
          Cerrar
        </button>
      )}
    </div>
  );
}

function PestanaCompras({ cerrado }: { cerrado: boolean }) {
  const { clubUsuarioId, clubes } = useGameStore();
  const [abierta, setAbierta] = useState<string | null>(null);

  const disponibles = useMemo(() => {
    const lista: { jugador: Jugador; clubId: string; clubNombre: string }[] = [];
    Object.values(clubes).forEach((c) => {
      if (c.id === clubUsuarioId) return;
      c.plantel.forEach((j) => {
        if (j.transferible) lista.push({ jugador: j, clubId: c.id, clubNombre: c.nombre });
      });
    });
    // Si el jugador que se está negociando ACABA de ficharse (pedido
    // explícito, paso de contrato post-fichaje — ver NegociacionFichaje),
    // `transferible` ya pasó a false y el loop de arriba ya no lo
    // encuentra — se lo reinyecta acá para que la fila (y la negociación
    // que quedó "cerrada" mostrando el paso de contrato) no desaparezcan
    // de golpe antes de que el usuario llegue a verlas/usarlas. Mismo
    // `jugador.id` como key en el .map() de abajo → React NO desmonta el
    // NegociacionFichaje que estaba abierto, conserva sus rondas.
    if (abierta && clubUsuarioId && !lista.some((d) => d.jugador.id === abierta)) {
      const propio = clubes[clubUsuarioId]?.plantel.find((j) => j.id === abierta);
      const clubPropio = clubes[clubUsuarioId];
      if (propio && clubPropio) lista.push({ jugador: propio, clubId: clubUsuarioId, clubNombre: clubPropio.nombre });
    }
    return lista;
  }, [clubes, clubUsuarioId, abierta]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {disponibles.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-6">
            Ningún club puso jugadores en el mercado todavía.
          </p>
        )}
        {disponibles.map(({ jugador, clubId, clubNombre }) => (
          <div key={jugador.id} className="flex flex-col">
            <FilaJugador jugador={jugador}>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-neutral-500 hidden sm:inline">{clubNombre}</span>
                <button
                  type="button"
                  onClick={() => setAbierta((a) => (a === jugador.id ? null : jugador.id))}
                  disabled={cerrado}
                  title={cerrado ? 'La ventana de mercado está cerrada' : undefined}
                  className="bg-gradient-to-br from-orange-400 to-orange-500 hover:brightness-105 disabled:bg-neutral-800 disabled:bg-none disabled:text-neutral-600 disabled:cursor-not-allowed text-black text-xs font-bold px-2.5 py-1.5 rounded-lg shadow shadow-orange-500/20 disabled:shadow-none"
                >
                  {abierta === jugador.id ? 'Ocultar' : 'Negociar'}
                </button>
              </div>
            </FilaJugador>
            {abierta === jugador.id && (
              <NegociacionFichaje
                jugador={jugador}
                clubId={clubId}
                cerrado={cerrado}
                onCerrar={() => setAbierta(null)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Scouting simple (pedido explícito, mecánica 3 de
// docs/que-le-falta-profundidad.md): "un botón 'Buscar refuerzo' con 2-3
// filtros... convierte 'esperar a ver qué apareció' en una decisión
// activa" — a diferencia de PestanaCompras (sólo lo YA listado como
// transferible), esto busca en TODO el plantel de cualquier club, listado
// o no (ver nota de scouting.ts). Reusa NegociacionFichaje tal cual: un
// candidato encontrado acá se negocia exactamente igual que uno de
// Compras.
const FILTROS_POSICION_SCOUTING: { id: Posicion | 'TODOS'; label: string }[] = [
  { id: 'TODOS', label: 'Todas' },
  ...POSICIONES.map((id) => ({ id, label: id })),
];

function PestanaScouting({ cerrado }: { cerrado: boolean }) {
  const { clubUsuarioId, clubes } = useGameStore();
  const club = clubUsuarioId ? clubes[clubUsuarioId] : null;
  const [filtro, setFiltro] = useState<FiltroScouting>({
    posicion: 'TODOS', edadMax: 30, presupuestoMax: club?.presupuesto ?? 10_000_000,
  });
  const [resultados, setResultados] = useState<CandidatoScouting[] | null>(null);
  const [abierta, setAbierta] = useState<string | null>(null);

  if (!club || !clubUsuarioId) return null;

  function buscar() {
    setResultados(buscarRefuerzos(clubes, clubUsuarioId!, filtro));
    setAbierta(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-gradient-to-br from-orange-500/[0.06] to-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-neutral-300 flex items-center gap-1.5">🔎 Buscar refuerzo</p>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-neutral-500">Posición</span>
          <div className="flex gap-1 flex-wrap">
            {FILTROS_POSICION_SCOUTING.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltro((prev) => ({ ...prev, posicion: f.id }))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  filtro.posicion === f.id
                    ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-black border-orange-500 font-semibold'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Edad máxima: <strong className="text-neutral-200">{filtro.edadMax}</strong>
          <input
            type="range"
            min={17}
            max={40}
            value={filtro.edadMax}
            onChange={(e) => setFiltro((prev) => ({ ...prev, edadMax: Number(e.target.value) }))}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-neutral-500">
          Presupuesto máximo: <strong className="text-neutral-200">{formatoMonto(filtro.presupuestoMax)}</strong>
          <input
            type="range"
            min={0}
            max={Math.max(club.presupuesto, filtro.presupuestoMax, 1)}
            step={Math.max(1, Math.round(Math.max(club.presupuesto, filtro.presupuestoMax, 1) / 100))}
            value={filtro.presupuestoMax}
            onChange={(e) => setFiltro((prev) => ({ ...prev, presupuestoMax: Number(e.target.value) }))}
          />
        </label>
        <button
          type="button"
          onClick={buscar}
          className="bg-gradient-to-br from-orange-400 to-orange-500 hover:brightness-105 text-black text-sm font-bold px-3 py-2.5 rounded-lg shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-transform"
        >
          🔎 Buscar refuerzo
        </button>
      </div>

      {resultados != null && (
        <div className="flex flex-col gap-2">
          {resultados.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-6">
              No apareció nadie con esos filtros. Probá ampliarlos.
            </p>
          ) : (
            resultados.map(({ jugador, clubId, clubNombre }) => (
              <div key={jugador.id} className="flex flex-col">
                <FilaJugador jugador={jugador}>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-neutral-500 hidden sm:inline">{clubNombre}</span>
                    <button
                      type="button"
                      onClick={() => setAbierta((a) => (a === jugador.id ? null : jugador.id))}
                      disabled={cerrado}
                      title={cerrado ? 'La ventana de mercado está cerrada' : undefined}
                      className="bg-orange-500 hover:bg-orange-400 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed text-black text-xs font-semibold px-2.5 py-1.5 rounded"
                    >
                      {abierta === jugador.id ? 'Ocultar' : 'Negociar'}
                    </button>
                  </div>
                </FilaJugador>
                {abierta === jugador.id && (
                  <NegociacionFichaje
                    jugador={jugador}
                    clubId={clubId}
                    cerrado={cerrado}
                    onCerrar={() => setAbierta(null)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function PantallaMercado({ onVolver }: { onVolver: () => void }) {
  const [tab, setTab] = useState<'ventas' | 'compras' | 'scouting'>('ventas');
  const { liga } = useGameStore();

  // Ventana de mercado (pedido explícito: "vamos a mejorar el sistema de
  // ofertas... primero el calendario, después mercado de invierno") — ver
  // engine/mercado.ts para el criterio completo. `liga` puede ser null
  // brevísimamente entre pantallas; en ese caso se asume abierto en vez
  // de trabar la UI con un mensaje de "cerrado" falso.
  const infoVentana = liga ? calcularVentanaMercado(liga.fixture) : null;
  const cerrado = infoVentana?.ventana === 'cerrado';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans p-4 flex flex-col gap-4">
      <header className="flex items-center justify-between topbar-entrada">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-orange-500 to-orange-800 flex items-center justify-center text-base shadow-lg shadow-orange-500/20">
            💱
          </div>
          <h1 className="font-bold">Mercado de pases</h1>
        </div>
        <button type="button" onClick={onVolver} className="text-sm text-neutral-400 hover:text-neutral-200">
          ← Volver
        </button>
      </header>

      {infoVentana && (
        cerrado ? (
          <div className="flex items-center gap-3 bg-gradient-to-br from-red-500/10 to-neutral-900 border border-red-500/30 rounded-xl p-3.5 text-sm text-neutral-300">
            <span className="w-9 h-9 shrink-0 rounded-full bg-red-500/15 flex items-center justify-center text-base">🔒</span>
            <p>
              <strong className="text-red-400">Ventana de mercado cerrada.</strong>{' '}
              {infoVentana.semanaActual < infoVentana.semanaAperturaInvierno
                ? `Reabre en la ventana de invierno, alrededor de la semana ${infoVentana.semanaAperturaInvierno}.`
                : 'Reabre en pretemporada de la próxima temporada.'}
              {' '}Podés seguir sacando del mercado a los jugadores que ya tenías listados, pero no empezar ventas ni ofertas nuevas.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-gradient-to-br from-emerald-500/10 to-neutral-900 border border-emerald-500/30 rounded-xl p-3.5 text-sm text-neutral-300">
            <span className="w-9 h-9 shrink-0 rounded-full bg-emerald-500/15 flex items-center justify-center text-base">🟢</span>
            <p>
              <strong className="text-emerald-400">Ventana de {infoVentana.ventana === 'verano' ? 'verano' : 'invierno'} abierta.</strong>{' '}
              Se puede fichar y vender sin restricciones.
            </p>
          </div>
        )
      )}

      <div className="flex gap-1.5 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
        {([
          { id: 'ventas' as const, label: 'Ventas', icono: '💰' },
          { id: 'compras' as const, label: 'Compras', icono: '🛒' },
          { id: 'scouting' as const, label: 'Scouting', icono: '🔎' },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg transition-all ${
              tab === t.id
                ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-black shadow-lg shadow-orange-500/20'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <span>{t.icono}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ventas' && <PestanaVentas cerrado={cerrado} />}
      {tab === 'compras' && <PestanaCompras cerrado={cerrado} />}
      {tab === 'scouting' && <PestanaScouting cerrado={cerrado} />}
    </div>
  );
}
