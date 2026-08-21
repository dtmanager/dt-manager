// Pantalla de "nueva partida" (pedido explícito: rediseño con el flujo
// nacionalidad del DT → país de la liga → liga → equipo, agrupando las
// ligas por país ahora que hay 21 cargadas). "Al azar" en equipo es el
// default — no hace falta elegir club a mano si no querés.

import { useState } from 'react';
import type { ClubBase } from '../data/clubesLigaProfesional';
import { LIGAS, PAISES_CON_LIGA, type LigaOpcion } from '../data/ligas';
import type { LicenciaDT } from '../engine/liga';
import { useGameStore } from '../store/useGameStore';

// Licencias del DT (pedido explícito: "elegís las licencias del dt
// nacional, continental, intercontinental así tu dt spawnea con ciertas
// stats" — ver RANGO_BASE_POR_LICENCIA en engine/liga.ts). No restringe
// qué club podés dirigir (eso se elige libre igual que siempre, más
// abajo) — sólo el rango de tus atributos de arranque.
const LICENCIAS: { id: LicenciaDT; icono: string; label: string; descripcion: string }[] = [
  { id: 'nacional', icono: '🔰', label: 'Nacional', descripcion: 'Arrancás de abajo — atributos más bajos.' },
  { id: 'continental', icono: '⚙️', label: 'Continental', descripcion: 'Punto medio — el DT "de siempre".' },
  { id: 'intercontinental', icono: '🌟', label: 'Intercontinental', descripcion: 'Ya te hiciste un nombre — atributos altos.' },
];

function GrlBadge({ nc }: { nc: number }) {
  return (
    <span className="flex flex-col items-center justify-center leading-none bg-orange-500/20 text-orange-400 rounded px-1.5 py-1 font-bold text-xs">
      <span className="text-[9px] font-semibold tracking-wide text-orange-300">GRL</span>
      {nc}
    </span>
  );
}

function DropdownOption({
  label,
  seleccionado,
  bloqueada,
  onClick,
  escudo,
  nc,
}: {
  label: string;
  seleccionado: boolean;
  bloqueada?: boolean;
  onClick: () => void;
  escudo?: string;
  nc?: number;
}) {
  return (
    <button
      type="button"
      disabled={bloqueada}
      onClick={onClick}
      className={`flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-md ${
        bloqueada ? 'opacity-40 cursor-not-allowed' : seleccionado ? 'bg-orange-500/20' : 'hover:bg-neutral-800'
      }`}
    >
      {escudo && <img src={escudo} alt="" className="w-6 h-6 shrink-0 object-contain" />}
      <span className="flex-1 text-sm">{label}</span>
      {bloqueada && (
        <span className="text-[10px] text-neutral-500 border border-neutral-700 rounded-full px-2 py-0.5">
          Próximamente
        </span>
      )}
      {nc != null && <GrlBadge nc={nc} />}
    </button>
  );
}

function Selector({
  label,
  abierto,
  onToggle,
  children,
  contenidoToggle,
}: {
  label: string;
  abierto: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  contenidoToggle: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 relative">
      <span className="text-xs text-neutral-400">{label}</span>
      <button
        type="button"
        onClick={onToggle}
        className={`flex items-center gap-2.5 bg-neutral-900 border rounded-lg px-3 py-2.5 text-sm ${
          abierto ? 'border-orange-500' : 'border-neutral-800'
        }`}
      >
        {contenidoToggle}
        <span className="text-neutral-500">▾</span>
      </button>
      {abierto && (
        <div className="absolute top-full mt-1 left-0 right-0 max-h-80 overflow-y-auto bg-neutral-900 border border-orange-500 rounded-lg p-1 z-10">
          {children}
        </div>
      )}
    </div>
  );
}

function elegirAlAzar<T>(lista: T[]): T {
  return lista[Math.floor(Math.random() * lista.length)];
}

const LIGAS_DISPONIBLES = LIGAS.filter((l) => l.disponible);

// Reveal ceremonial de arranque (pedido explícito: investigar FIFA/FM26
// para "dar peso ceremonial al último paso" — documento de rediseño,
// sección 5.4 punto 2: "en FIFA/FM el inicio de carrera tiene peso
// ceremonial (nombre grande, escudo, confirmación con impacto visual);
// acá es un formulario más"). Mismo lenguaje que el spotlight/reveal del
// mockup adjunto (flip 3D + glow), reservado a propósito para ESTE único
// momento — es justo el criterio de la sección 3.4 del documento: "si
// todo se anima igual, nada se siente especial", y no hay otro momento
// más grande que arrancar una carrera nueva.
function RevealArranque({
  club, ruta, nombreDT, ligaNombre, onConfirmar, onVolver,
}: {
  club: ClubBase; ruta: string; nombreDT: string; ligaNombre: string; onConfirmar: () => void; onVolver: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-[fadeIn_.3s_ease_both] p-6">
      <div className="w-full max-w-sm rounded-2xl border border-orange-500/40 bg-gradient-to-b from-neutral-900 to-neutral-950 p-8 text-center shadow-[0_30px_80px_rgba(0,0,0,0.6)] animate-[revealCarta_.6s_cubic-bezier(.2,.9,.25,1.2)_both]">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400">Arrancás tu carrera</span>
        <img src={`${ruta}${club.archivo}`} alt="" className="w-24 h-24 mx-auto my-5 object-contain drop-shadow-[0_0_30px_rgba(249,115,22,0.35)]" />
        <h2 className="text-2xl font-black">{club.nombre}</h2>
        <p className="text-sm text-neutral-400 mt-0.5">{ligaNombre}</p>
        <div className="w-16 h-px bg-neutral-800 mx-auto my-4" />
        <p className="text-[10px] uppercase tracking-widest text-neutral-500">Director técnico</p>
        <p className="text-lg font-bold text-orange-400">{nombreDT || 'DT Sin Nombre'}</p>

        <button
          type="button"
          onClick={onConfirmar}
          className="w-full bg-orange-500 hover:bg-orange-400 text-black font-bold rounded-lg py-3 mt-7"
        >
          Confirmar y arrancar
        </button>
        <button type="button" onClick={onVolver} className="w-full text-xs text-neutral-500 hover:text-neutral-300 mt-3">
          ← Volver a elegir
        </button>
      </div>
    </div>
  );
}

export function MenuScreen() {
  const iniciarPartidaNueva = useGameStore((s) => s.iniciarPartidaNueva);

  const [nombreDT, setNombreDT] = useState('');
  const [nacionalidad, setNacionalidad] = useState<string | null>(null);
  const [licenciaDT, setLicenciaDT] = useState<LicenciaDT>('continental');
  const [pais, setPais] = useState('Argentina');
  const [ligaId, setLigaId] = useState('liga-profesional');
  const [clubId, setClubId] = useState<string | null>(null);

  const [nacionalidadMenuAbierto, setNacionalidadMenuAbierto] = useState(false);
  const [paisMenuAbierto, setPaisMenuAbierto] = useState(false);
  const [ligaMenuAbierto, setLigaMenuAbierto] = useState(false);
  const [clubMenuAbierto, setClubMenuAbierto] = useState(false);
  // Club ya resuelto para el reveal ceremonial — se sortea UNA vez al
  // tocar "Arrancar carrera" (si el usuario dejó "🎲 Al azar" en Equipo)
  // y se congela acá, para que el reveal muestre el mismo club que
  // después arranca de verdad (si se sorteara de nuevo en `confirmar`
  // podría no coincidir con lo que se mostró).
  const [clubParaReveal, setClubParaReveal] = useState<ClubBase | null>(null);

  const ligasDelPais = LIGAS.filter((l) => l.pais === pais);
  const liga = LIGAS.find((l) => l.id === ligaId) ?? LIGAS[0];
  const clubSeleccionado: ClubBase | undefined = liga.clubes.find((c) => c.id === clubId);

  function elegirPais(nuevoPais: string) {
    setPais(nuevoPais);
    const primeraDisponible = LIGAS.find((l) => l.pais === nuevoPais && l.disponible) ?? LIGAS.find((l) => l.pais === nuevoPais);
    if (primeraDisponible) setLigaId(primeraDisponible.id);
    setClubId(null);
    setPaisMenuAbierto(false);
  }

  function elegirLiga(l: LigaOpcion) {
    if (!l.disponible) return;
    setLigaId(l.id);
    setClubId(null); // cambiar de liga invalida el club de la otra
    setLigaMenuAbierto(false);
  }

  function alAzar() {
    const ligaAlAzar = elegirAlAzar(LIGAS_DISPONIBLES);
    const clubAlAzar = elegirAlAzar(ligaAlAzar.clubes);
    setNacionalidad(elegirAlAzar(PAISES_CON_LIGA));
    setPais(ligaAlAzar.pais);
    setLigaId(ligaAlAzar.id);
    setClubId(clubAlAzar.id);
  }

  function arrancar() {
    setClubParaReveal(clubSeleccionado ?? elegirAlAzar(liga.clubes));
  }

  function confirmarInicio() {
    if (!clubParaReveal) return;
    iniciarPartidaNueva(liga.id, clubParaReveal.id, nombreDT.trim() || 'DT Sin Nombre', nacionalidad ?? undefined, licenciaDT);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 flex justify-center p-6 font-sans relative overflow-hidden">
      {/* Glow sutil detrás del título (pedido explícito, rediseño general:
          "que el juego esté terminado") — a propósito NO usa revealCarta,
          que queda reservada para el momento ceremonial de RevealArranque
          más abajo (ver comentario grande de esa función). */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-orange-500/20 to-transparent blur-3xl"
        aria-hidden
      />

      <div className="w-full max-w-xl flex flex-col gap-5 relative">
        <div className="flex items-center justify-between pt-4 pb-2 topbar-entrada">
          <div className="text-center flex-1 flex flex-col gap-1">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-widest">Modo carrera</span>
            <h1 className="text-5xl font-black tracking-tight">DT MANAGER</h1>
          </div>
        </div>

        <button
          type="button"
          onClick={alAzar}
          className="self-end -mt-2 text-xs font-bold text-orange-400 border border-orange-500/40 rounded-full px-3 py-1.5 hover:bg-orange-500/10"
        >
          🎲 Al azar
        </button>

        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 flex flex-col gap-5">
          {/* Grilla de 2 columnas (pedido explícito, mockup): Nombre +
              País de la liga arriba, Nacionalidad + Liga abajo — mismos 4
              campos que antes, sólo cambia el acomodo. El resto
              (Licencia/Equipo/Arrancar) se queda a todo el ancho, son
              controles más anchos (3 pills / dropdown con escudo) que no
              ganan nada angostándose a la mitad. */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-neutral-400">👤 Nombre del DT (vos)</span>
              <input
                type="text"
                value={nombreDT}
                onChange={(e) => setNombreDT(e.target.value)}
                placeholder="Ej: Marcelo Aguirre"
                className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500"
              />
            </label>

            <Selector
              label="🏳️ País de la liga"
              abierto={paisMenuAbierto}
              onToggle={() => setPaisMenuAbierto((v) => !v)}
              contenidoToggle={<span className="flex-1 text-left">{pais}</span>}
            >
              {PAISES_CON_LIGA.map((p) => (
                <DropdownOption key={p} label={p} seleccionado={p === pais} onClick={() => elegirPais(p)} />
              ))}
            </Selector>

            <Selector
              label="🌍 Tu nacionalidad"
              abierto={nacionalidadMenuAbierto}
              onToggle={() => setNacionalidadMenuAbierto((v) => !v)}
              contenidoToggle={
                nacionalidad ? (
                  <span className="flex-1 text-left">{nacionalidad}</span>
                ) : (
                  <span className="flex-1 text-left text-neutral-500">Elegí...</span>
                )
              }
            >
              {PAISES_CON_LIGA.map((p) => (
                <DropdownOption
                  key={p}
                  label={p}
                  seleccionado={p === nacionalidad}
                  onClick={() => {
                    setNacionalidad(p);
                    setNacionalidadMenuAbierto(false);
                  }}
                />
              ))}
            </Selector>

            <Selector
              label="🏆 Liga"
              abierto={ligaMenuAbierto}
              onToggle={() => setLigaMenuAbierto((v) => !v)}
              contenidoToggle={<span className="flex-1 text-left">{liga.nombre}</span>}
            >
              {ligasDelPais.map((l) => (
                <DropdownOption
                  key={l.id}
                  label={l.nombre}
                  seleccionado={l.id === ligaId}
                  bloqueada={!l.disponible}
                  onClick={() => elegirLiga(l)}
                />
              ))}
            </Selector>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-neutral-400">🎖️ Licencia del DT</span>
            <div className="flex gap-1.5">
              {LICENCIAS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLicenciaDT(l.id)}
                  className={`flex-1 text-xs font-semibold rounded-lg px-2 py-2 border transition-colors ${
                    licenciaDT === l.id
                      ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {l.icono} {l.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-500">{LICENCIAS.find((l) => l.id === licenciaDT)?.descripcion}</p>
          </div>

          <Selector
            label="🛡️ Equipo"
            abierto={clubMenuAbierto}
            onToggle={() => setClubMenuAbierto((v) => !v)}
            contenidoToggle={
              clubSeleccionado ? (
                <>
                  <img src={`${liga.ruta}${clubSeleccionado.archivo}`} alt="" className="w-6 h-6 object-contain" />
                  <span className="flex-1 text-left">{clubSeleccionado.nombre}</span>
                  <GrlBadge nc={clubSeleccionado.nc} />
                </>
              ) : (
                <span className="flex-1 text-left text-neutral-500">🎲 Al azar</span>
              )
            }
          >
            <DropdownOption
              label="🎲 Al azar"
              seleccionado={clubId == null}
              onClick={() => {
                setClubId(null);
                setClubMenuAbierto(false);
              }}
            />
            {liga.clubes.map((club) => (
              <DropdownOption
                key={club.id}
                label={club.nombre}
                seleccionado={club.id === clubId}
                escudo={`${liga.ruta}${club.archivo}`}
                nc={club.nc}
                onClick={() => {
                  setClubId(club.id);
                  setClubMenuAbierto(false);
                }}
              />
            ))}
          </Selector>

          <button
            type="button"
            onClick={arrancar}
            className="bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg shadow-orange-500/30 hover:brightness-105 text-black font-bold rounded-lg py-3"
          >
            Arrancar carrera
          </button>
        </div>

        {/* Pedido explícito: "agrega botones en azul de este estilo" —
            mismo estilo pill de la referencia (ícono + texto, redondeado),
            en azul en vez del verde de la referencia. Links reales del
            proyecto, se abren en pestaña nueva (no navegan afuera del
            juego). */}
        <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
          <a
            href="https://cafecito.app/elgrandt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full pl-2 pr-3.5 py-2 transition-colors"
          >
            <span className="w-5 h-5 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-[11px]">☕</span>
            Apoyá el proyecto en Cafecito
          </a>
          <a
            href="https://ko-fi.com/elgrandt"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full pl-2 pr-3.5 py-2 transition-colors"
          >
            <span className="w-5 h-5 shrink-0 rounded-full bg-white/15 flex items-center justify-center text-[11px]">☕</span>
            Apoyá el proyecto en Ko-Fi
          </a>
        </div>
      </div>

      {clubParaReveal && (
        <RevealArranque
          club={clubParaReveal}
          ruta={liga.ruta}
          nombreDT={nombreDT.trim()}
          ligaNombre={liga.nombre}
          onConfirmar={confirmarInicio}
          onVolver={() => setClubParaReveal(null)}
        />
      )}
    </div>
  );
}
