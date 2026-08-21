// Link para compartir la carrera (pedido explícito: "en vez de copiar
// resumen de carrera que ponga compartir carrera y que te copie el link
// que te lleve a ese palmares" — antes copiaba sólo texto plano, ver
// componentes/PantallaRepasoCarrera.tsx). Esta app es 100% cliente (Vite
// + React, sin backend — todo el estado vive en localStorage vía
// zustand/persist), así que no hay dónde guardar un registro server-side
// con un id corto: el link ES los datos, codificados en la propia URL
// (query param `carrera`, JSON directo — `URLSearchParams` ya se encarga
// de percent-encodearlo/decodearlo solo, no hace falta encodeURIComponent
// manual). Cualquiera que abra el link ve el palmarés reconstruido ahí
// mismo (ver PantallaCarreraCompartida.tsx), sin tocar el store ni haber
// jugado la partida.
import type { TituloGanado } from '../engine/carreraDT';

export interface EtapaCompartida {
  club: string;
  liga: string;
  temporadaInicio: number;
  temporadaFin: number;
  partidos: number;
  goles: number;
  idolatriaFinal: number;
  titulos: TituloGanado[];
}

// `v` (versión) por si el formato cambia más adelante — un link viejo con
// una `v` que ya no se reconoce se descarta en vez de romper el render.
export interface CarreraCompartida {
  v: 1;
  dt: string;
  club: string;
  liga?: string;
  apodoId: string | null;
  motivo: 'descenso' | 'despedido' | 'renuncia';
  partidos: number;
  goles: number;
  fichajes: number;
  canteranos: number;
  idolatria: number;
  titulos: TituloGanado[];
  historial: EtapaCompartida[];
}

const PARAM = 'carrera';

export function armarLinkCompartir(datos: CarreraCompartida): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set(PARAM, JSON.stringify(datos));
  return url.toString();
}

export function leerCarreraCompartidaDeUrl(): CarreraCompartida | null {
  const raw = new URLSearchParams(window.location.search).get(PARAM);
  if (!raw) return null;
  try {
    const datos = JSON.parse(raw);
    if (datos?.v !== 1) return null;
    return datos as CarreraCompartida;
  } catch {
    return null;
  }
}
