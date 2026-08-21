// Repaso de carrera (pedido explícito: "una pantalla de repaso de
// carrera como el ídolo", ampliado varias veces después: "que al final
// de la carrera salga algo asi un resumen de tu carrera stats, todos tus
// premios, etc y un boton para compartir la carrera", después "la
// historia de todos los clubes que pasaste tambien con sus stats... muchos
// mas apodos", y por último "en vez de copiar resumen de carrera que
// ponga compartir carrera y que te copie el link que te lleve a ese
// palmares" — mostrando mockups de otros juegos como referencia de
// estilo/contenido) — se muestra cuando finCarrera se dispara (descenso
// sin liga inferior, despido por dos temporadas seguidas sin cumplir el
// objetivo, o renuncia al no renovar el contrato del DT — ver
// engine/contratoDT.ts): el cierre de la carrera del DT, con sus números
// finales, el historial club por club, el apodo que se ganó jugando (ver
// engine/carreraDT.ts) y un link para compartir ese palmarés (ver
// utils/compartirCarrera.ts — el link codifica los datos en la propia
// URL, no hay backend que los guarde).
//
// El bloque visual (badge, historia, stats, vitrina) vive en
// ResumenCarreraDT.tsx, compartido con PantallaCarreraCompartida.tsx (la
// pantalla de sólo lectura que ve quien abre el link).

import { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { calcularApodo, nivelIdolatria } from '../engine/carreraDT';
import { ResumenCarreraDT } from './ResumenCarreraDT';
import { armarLinkCompartir, type CarreraCompartida } from '../utils/compartirCarrera';

function motivoTexto(motivo: 'despedido' | 'descenso' | 'renuncia'): string {
  switch (motivo) {
    case 'despedido': return 'La directiva perdió la confianza en vos: dos temporadas seguidas sin cumplir el objetivo.';
    case 'descenso': return 'El club te bajó de categoría y no había una liga inferior a la que seguir.';
    case 'renuncia': return 'Se venció tu contrato y decidiste no renovar con el club.';
  }
}

export function PantallaRepasoCarrera({ onVolverAlMenu }: { onVolverAlMenu: () => void }) {
  const { clubUsuarioId, clubes, carreraDT, finCarrera, liga } = useGameStore();
  const club = clubUsuarioId ? clubes[clubUsuarioId] : null;
  const [copiado, setCopiado] = useState(false);
  if (!club || !finCarrera) return null;
  const { dt } = club;
  const apodo = calcularApodo(carreraDT);
  const nivel = nivelIdolatria(carreraDT.idolatria);
  const historialClubes = carreraDT.historialClubes ?? [];

  function handleCompartir() {
    const datos: CarreraCompartida = {
      v: 1,
      dt: dt.nombre,
      club: club!.nombre,
      liga: liga?.nombre,
      apodoId: apodo?.id ?? null,
      motivo: finCarrera!.motivo,
      partidos: carreraDT.partidosDirigidos,
      goles: carreraDT.golesAFavorCarrera ?? 0,
      fichajes: carreraDT.fichajesCarrera,
      canteranos: carreraDT.canteranosCarrera,
      idolatria: carreraDT.idolatria,
      titulos: carreraDT.titulos,
      historial: historialClubes.map((e) => ({
        club: e.clubNombre,
        liga: e.ligaNombre,
        temporadaInicio: e.temporadaInicio,
        temporadaFin: e.temporadaFin,
        partidos: e.partidos,
        goles: e.goles,
        idolatriaFinal: e.idolatriaFinal,
        titulos: e.titulos,
      })),
    };
    navigator.clipboard.writeText(armarLinkCompartir(datos)).then(() => {
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2500);
    });
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans flex flex-col items-center gap-5 p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 topbar-entrada">Se terminó tu carrera</p>

      <ResumenCarreraDT
        dtNombre={dt.nombre}
        clubNombre={club.nombre}
        ligaNombre={liga?.nombre}
        apodo={apodo ? { apodo: apodo.apodo, descripcion: apodo.descripcion } : null}
        nivel={nivel}
        stats={{
          partidos: carreraDT.partidosDirigidos,
          titulos: carreraDT.titulos.length,
          goles: carreraDT.golesAFavorCarrera ?? 0,
          fichajes: carreraDT.fichajesCarrera,
          canteranos: carreraDT.canteranosCarrera,
          idolatria: carreraDT.idolatria,
        }}
        historialClubes={historialClubes}
        titulosVitrina={carreraDT.titulos}
        motivoTexto={motivoTexto(finCarrera.motivo)}
      />

      <div className="flex flex-col items-center gap-2 w-full max-w-sm">
        <button
          type="button"
          onClick={handleCompartir}
          className="w-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:brightness-105 text-white font-bold rounded-lg px-6 py-3"
        >
          {copiado ? '✅ ¡Link copiado!' : '🔗 Compartir carrera'}
        </button>
        <button
          type="button"
          onClick={onVolverAlMenu}
          className="text-sm text-neutral-400 hover:text-neutral-200"
        >
          Volver al menú
        </button>
      </div>
    </div>
  );
}
