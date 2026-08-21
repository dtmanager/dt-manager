// Pantalla de sólo lectura para un link de "compartir carrera" (pedido
// explícito: "que te copie el link que te lleve a ese palmares"). No usa
// useGameStore — todo sale de `datos`, reconstruido a partir del query
// param de la URL (ver utils/compartirCarrera.ts, App.tsx la muestra en
// vez del juego normal cuando ese param está presente). Reusa el mismo
// bloque visual que PantallaRepasoCarrera.tsx (ResumenCarreraDT.tsx) para
// que el link se vea IGUAL al palmarés original.
import { apodoPorId, nivelIdolatria } from '../engine/carreraDT';
import { ResumenCarreraDT } from './ResumenCarreraDT';
import type { CarreraCompartida } from '../utils/compartirCarrera';

function motivoTexto(motivo: CarreraCompartida['motivo']): string {
  switch (motivo) {
    case 'despedido': return 'La directiva perdió la confianza: dos temporadas seguidas sin cumplir el objetivo.';
    case 'descenso': return 'El club descendió de categoría y no había una liga inferior a la que seguir.';
    case 'renuncia': return 'El contrato se venció y no se renovó con el club.';
  }
}

export function PantallaCarreraCompartida({ datos, onIrAlMenu }: { datos: CarreraCompartida; onIrAlMenu: () => void }) {
  const apodoDef = datos.apodoId ? apodoPorId(datos.apodoId) : undefined;
  const nivel = nivelIdolatria(datos.idolatria);
  const historialClubes = datos.historial.map((e, i) => ({
    clubId: `${e.club}-${i}`,
    clubNombre: e.club,
    ligaNombre: e.liga,
    temporadaInicio: e.temporadaInicio,
    temporadaFin: e.temporadaFin,
    partidos: e.partidos,
    goles: e.goles,
    idolatriaFinal: e.idolatriaFinal,
    titulos: e.titulos,
  }));

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans flex flex-col items-center gap-5 p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 topbar-entrada">Palmarés compartido</p>

      <ResumenCarreraDT
        dtNombre={datos.dt}
        clubNombre={datos.club}
        ligaNombre={datos.liga}
        apodo={apodoDef ? { apodo: apodoDef.apodo, descripcion: apodoDef.descripcion } : null}
        nivel={nivel}
        stats={{
          partidos: datos.partidos,
          titulos: datos.titulos.length,
          goles: datos.goles,
          fichajes: datos.fichajes,
          canteranos: datos.canteranos,
          idolatria: datos.idolatria,
        }}
        historialClubes={historialClubes}
        titulosVitrina={datos.titulos}
        motivoTexto={motivoTexto(datos.motivo)}
      />

      <button
        type="button"
        onClick={onIrAlMenu}
        className="w-full max-w-sm bg-gradient-to-br from-orange-400 to-orange-500 hover:brightness-105 text-black font-bold rounded-lg px-6 py-3 shadow-lg shadow-orange-500/30"
      >
        ⚽ Jugar DT Manager
      </button>
    </div>
  );
}
