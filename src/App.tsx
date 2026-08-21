import { useState } from 'react';
import { useGameStore } from './store/useGameStore';
import { MenuScreen } from './components/MenuScreen';
import { PantallaHub } from './components/PantallaHub';
import { PantallaArmarEquipo } from './components/PantallaArmarEquipo';
import { PantallaLiga } from './components/PantallaLiga';
import { PantallaMercado } from './components/PantallaMercado';
import { PantallaOfertaCantera } from './components/PantallaOfertaCantera';
import { PantallaCopaMundialClubes } from './components/PantallaCopaMundialClubes';
import { PantallaCopaNacional } from './components/PantallaCopaNacional';
import { PantallaCopaConmebol } from './components/PantallaCopaConmebol';
import { PantallaCopaUefa } from './components/PantallaCopaUefa';
import { PantallaFinDeTemporada } from './components/PantallaFinDeTemporada';
import { PantallaPerfilJugador } from './components/PantallaPerfilJugador';
import { PantallaPerfilDT } from './components/PantallaPerfilDT';
import { PantallaFinanzas } from './components/PantallaFinanzas';
import { PantallaPlantelClub } from './components/PantallaPlantelClub';
import { PantallaCalendario } from './components/PantallaCalendario';
import { AnimacionTrofeoOverlay } from './components/AnimacionTrofeoOverlay';
import { PantallaVitrinaTrofeos } from './components/PantallaVitrinaTrofeos';
import { ToastContainer } from './components/Toast';
import { PantallaCarreraCompartida } from './components/PantallaCarreraCompartida';
import { leerCarreraCompartidaDeUrl } from './utils/compartirCarrera';
import type { PantallaDeEntrada } from './engine/calendario';

// Wrapper de nivel superior (pedido explícito: la animación de "ganaste
// un trofeo" tiene que taparlo TODO, sin importar a qué pantalla esté
// navegando el usuario cuando se resuelve el título) — AppScreens tiene
// muchos `return` tempranos por pantalla, así que en vez de tocar cada
// uno el overlay se monta acá afuera, como hermano fijo que se
// superpone via position:fixed cuando hay algo en la cola. ToastContainer
// (pedido explícito, sistema de notificaciones) va con el mismo criterio.
//
// Link de "compartir carrera" (pedido explícito, ver
// utils/compartirCarrera.ts): se chequea ACÁ, antes que nada — no
// depende de useGameStore ni de haber jugado la partida, así que se
// resuelve incluso si no hay ninguna carrera guardada en este dispositivo.
function App() {
  const [carreraCompartida, setCarreraCompartida] = useState(() => leerCarreraCompartidaDeUrl());
  if (carreraCompartida) {
    return (
      <PantallaCarreraCompartida
        datos={carreraCompartida}
        onIrAlMenu={() => {
          const url = new URL(window.location.href);
          url.search = '';
          window.history.replaceState(null, '', url.toString());
          setCarreraCompartida(null);
        }}
      />
    );
  }
  return (
    <>
      <AnimacionTrofeoOverlay />
      <ToastContainer />
      <AppScreens />
    </>
  );
}

function AppScreens() {
  const liga = useGameStore((s) => s.liga);
  const clubes = useGameStore((s) => s.clubes);
  const clubUsuarioId = useGameStore((s) => s.clubUsuarioId);
  // Las copas internacionales (Mundial de Clubes, Libertadores/Sudamericana,
  // Champions/Europa/Conference) traen rivales de OTRAS ligas que no están
  // en `clubes` (eso sólo tiene la liga doméstica activa + mercado
  // internacional) — cada una guarda su propio snapshot de clubes. Para que
  // "clickear un equipo" funcione desde cualquier copa, se busca en todas
  // las fuentes a la vez (los ids son únicos en todo el juego).
  //
  // `clubes` (versión en vivo) gana sobre la foto fija de una copa para
  // los clubes DOMÉSTICOS (liga.clubIds, incluye a los de copaNacional) y
  // para el club del usuario — esos sí siguen jugando/evolucionando en
  // `clubes` y la foto vieja de la copa quedaría desactualizada. Bug
  // encontrado jugando ("en las competencias internacionales pone (?)"):
  // el comentario original asumía "los ids son únicos en todo el juego",
  // pero NO lo son — generarClubesExtranjeros (mercado.ts) arma cada
  // temporada un puñado de clubes al azar de los MISMOS pools que usan
  // Mundial de Clubes/Libertadores-Sudamericana/Champions-Europa-Conference
  // (Premier League, Brasileirão, etc.), con un plantel nuevo pero el
  // mismo id que el club "real" de esa liga. Con `clubes` pisando TODO al
  // final, un club de mercado que coincidía en id con un rival de la copa
  // reemplazaba su plantel simulado por uno al azar sin relación, y
  // nombreJugador ya no encontraba al goleador/pateador → "?". Filtrar acá
  // a sólo clubes domésticos + el del usuario evita ese choque sin volver
  // a la staleness que arregló el fix original.
  const copaMundialClubes = useGameStore((s) => s.copaMundialClubes);
  const copaNacional = useGameStore((s) => s.copaNacional);
  const copaConmebol = useGameStore((s) => s.copaConmebol);
  const copaUefa = useGameStore((s) => s.copaUefa);
  const idsClubesEnVivoRelevantes = new Set([...(liga?.clubIds ?? []), ...(clubUsuarioId ? [clubUsuarioId] : [])]);
  const clubesEnVivoRelevantes = Object.fromEntries(
    Object.entries(clubes).filter(([id]) => idsClubesEnVivoRelevantes.has(id)),
  );
  const todosLosClubesVisibles = {
    ...(copaNacional?.clubes ?? {}),
    ...(copaMundialClubes?.clubes ?? {}),
    ...(copaConmebol?.clubes ?? {}),
    ...(copaUefa?.clubes ?? {}),
    ...clubesEnVivoRelevantes,
  };
  const [pantalla, setPantalla] = useState<
    | 'armar' | 'plantel' | 'liga' | 'mercado' | 'cantera' | 'copa' | 'copa-nacional' | 'copa-conmebol' | 'copa-uefa'
    | 'resumen' | 'club' | 'jugador' | 'calendario' | 'perfil-dt' | 'finanzas' | 'vitrina-trofeos'
  >('armar');
  const [clubSeleccionadoId, setClubSeleccionadoId] = useState<string | null>(null);
  const [jugadorSeleccionadoId, setJugadorSeleccionadoId] = useState<string | null>(null);
  // A qué pantalla vuelve el perfil de jugador: desde el plantel propio
  // (hub), desde el plantel de un club cualquiera, o desde la tabla de
  // goleadores de la liga o de cualquier copa (clickeás un jugador
  // directo ahí, sin pasar primero por su club) — mismos valores que
  // origenClub, así "volver" lleva de nuevo a la pantalla exacta de donde
  // se clickeó.
  const [origenJugador, setOrigenJugador] = useState<
    'plantel' | 'club' | 'liga' | 'copa' | 'copa-nacional' | 'copa-conmebol' | 'copa-uefa'
  >('plantel');
  // A qué pantalla vuelve el plantel de un club — se puede clickear un
  // equipo desde la liga o desde cualquiera de las copas (pedido
  // explícito: mismo comportamiento "clickeable" en todos lados).
  const [origenClub, setOrigenClub] = useState<
    'liga' | 'copa' | 'copa-nacional' | 'copa-conmebol' | 'copa-uefa'
  >('liga');

  function verClub(clubId: string, origen: typeof origenClub) {
    setClubSeleccionadoId(clubId);
    setOrigenClub(origen);
    setPantalla('club');
  }

  if (!liga) return <MenuScreen />;
  if (pantalla === 'armar') {
    return <PantallaArmarEquipo onListo={() => setPantalla('plantel')} onVolver={() => setPantalla('plantel')} />;
  }
  if (pantalla === 'liga') {
    // "Cerrar temporada" ya no vuelve directo al hub: pasa primero por el
    // resumen (premio/taquilla/sueldos, campeón o descenso).
    return (
      <PantallaLiga
        onVolver={() => setPantalla('plantel')}
        onFinDeTemporada={() => setPantalla('resumen')}
        onVerClub={(clubId) => verClub(clubId, 'liga')}
        onVerJugador={(clubId, jugadorId) => {
          setClubSeleccionadoId(clubId);
          setJugadorSeleccionadoId(jugadorId);
          setOrigenJugador('liga');
          setPantalla('jugador');
        }}
      />
    );
  }
  if (pantalla === 'mercado') {
    return <PantallaMercado onVolver={() => setPantalla('plantel')} />;
  }
  if (pantalla === 'cantera') {
    return <PantallaOfertaCantera onListo={() => setPantalla('plantel')} />;
  }
  if (pantalla === 'calendario') {
    return (
      <PantallaCalendario
        onVolver={() => setPantalla('plantel')}
        onIrA={(destino: PantallaDeEntrada) => setPantalla(destino)}
      />
    );
  }
  function verJugador(clubId: string, jugadorId: string, origen: typeof origenJugador) {
    setClubSeleccionadoId(clubId);
    setJugadorSeleccionadoId(jugadorId);
    setOrigenJugador(origen);
    setPantalla('jugador');
  }

  if (pantalla === 'copa') {
    return (
      <PantallaCopaMundialClubes
        onVolver={() => setPantalla('plantel')}
        onVerClub={(clubId) => verClub(clubId, 'copa')}
        onVerJugador={(clubId, jugadorId) => verJugador(clubId, jugadorId, 'copa')}
      />
    );
  }
  if (pantalla === 'copa-nacional') {
    return (
      <PantallaCopaNacional
        onVolver={() => setPantalla('plantel')}
        onVerClub={(clubId) => verClub(clubId, 'copa-nacional')}
        onVerJugador={(clubId, jugadorId) => verJugador(clubId, jugadorId, 'copa-nacional')}
      />
    );
  }
  if (pantalla === 'copa-conmebol') {
    return (
      <PantallaCopaConmebol
        onVolver={() => setPantalla('plantel')}
        onVerClub={(clubId) => verClub(clubId, 'copa-conmebol')}
        onVerJugador={(clubId, jugadorId) => verJugador(clubId, jugadorId, 'copa-conmebol')}
      />
    );
  }
  if (pantalla === 'copa-uefa') {
    return (
      <PantallaCopaUefa
        onVolver={() => setPantalla('plantel')}
        onVerClub={(clubId) => verClub(clubId, 'copa-uefa')}
        onVerJugador={(clubId, jugadorId) => verJugador(clubId, jugadorId, 'copa-uefa')}
      />
    );
  }
  if (pantalla === 'resumen') {
    return <PantallaFinDeTemporada onContinuar={() => setPantalla('plantel')} />;
  }
  if (pantalla === 'club') {
    const club = clubSeleccionadoId ? todosLosClubesVisibles[clubSeleccionadoId] : null;
    if (!club) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans flex items-center justify-center">
          <button type="button" onClick={() => setPantalla(origenClub)} className="text-orange-400 hover:underline">
            ← Volver
          </button>
        </div>
      );
    }
    return (
      <PantallaPlantelClub
        club={club}
        clubUsuarioId={clubUsuarioId}
        onVolver={() => setPantalla(origenClub)}
        onVerJugador={(jugadorId) => {
          setJugadorSeleccionadoId(jugadorId);
          setOrigenJugador('club');
          setPantalla('jugador');
        }}
      />
    );
  }
  if (pantalla === 'jugador') {
    // Todo origen menos 'plantel' llegó clickeando un jugador puntual (no
    // necesariamente el club del usuario) — usa el club seleccionado. Los
    // valores de origenJugador coinciden 1 a 1 con nombres de pantalla
    // (mismo patrón que origenClub), así que volverA es directo.
    const clubDelJugador = origenJugador === 'plantel' ? clubUsuarioId : clubSeleccionadoId;
    const club = clubDelJugador ? todosLosClubesVisibles[clubDelJugador] : null;
    const jugador = club?.plantel.find((j) => j.id === jugadorSeleccionadoId);
    const volverA = origenJugador;
    if (!jugador) {
      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans flex items-center justify-center">
          <button type="button" onClick={() => setPantalla(volverA)} className="text-orange-400 hover:underline">
            ← Volver
          </button>
        </div>
      );
    }
    return <PantallaPerfilJugador jugador={jugador} esPropio={club?.id === clubUsuarioId} onVolver={() => setPantalla(volverA)} />;
  }
  if (pantalla === 'perfil-dt') {
    return <PantallaPerfilDT onVolver={() => setPantalla('plantel')} onVerVitrina={() => setPantalla('vitrina-trofeos')} />;
  }
  if (pantalla === 'vitrina-trofeos') {
    return <PantallaVitrinaTrofeos onVolver={() => setPantalla('perfil-dt')} />;
  }
  if (pantalla === 'finanzas') {
    return <PantallaFinanzas onVolver={() => setPantalla('plantel')} />;
  }
  return (
    <PantallaHub
      onArmarEquipo={() => setPantalla('armar')}
      onVerLiga={() => setPantalla('liga')}
      onVerMercado={() => setPantalla('mercado')}
      onVerCantera={() => setPantalla('cantera')}
      onVerCopa={() => setPantalla('copa')}
      onVerCopaNacional={() => setPantalla('copa-nacional')}
      onVerCopaConmebol={() => setPantalla('copa-conmebol')}
      onVerCopaUefa={() => setPantalla('copa-uefa')}
      onVerCalendario={() => setPantalla('calendario')}
      onVerPerfilDT={() => setPantalla('perfil-dt')}
      onVerFinanzas={() => setPantalla('finanzas')}
      onFinDeTemporada={() => setPantalla('resumen')}
      onVerJugador={(jugadorId) => {
        setClubSeleccionadoId(clubUsuarioId);
        setJugadorSeleccionadoId(jugadorId);
        setOrigenJugador('plantel');
        setPantalla('jugador');
      }}
    />
  );
}

export default App;
