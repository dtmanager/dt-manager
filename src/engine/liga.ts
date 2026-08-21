// Generación de la liga inicial (M2): clubes, planteles y DTs, a partir de
// una lista de clubes base (sólo nombre). No hay spec de cuántos jugadores
// por puesto tiene un plantel — se eligió una composición típica de un
// plantel profesional chico (25 jugadores) para que alcance para 11
// titulares + 5 suplentes + resto en cualquier formación de las previstas
// en 8.4.

import type {
  Club, DT, Jugador, Liga, Posicion, TablaPosiciones,
} from '../types';
import { asignarDorsalesPlantel, generarJugador } from './jugadores';
import { generarNombreJugador, idUnico } from './nombres';
import {
  clamp, randomEntero, randomNormal, randomUniforme,
} from './random';
import { generarFixture } from './fixture';
import { FORMACIONES, NOMBRES_FORMACION, type NombreFormacion } from '../data/formaciones';
import { tablaEstadistica } from './tablaEstadistica';
import { multiplicadorSalarialDeLiga, presupuestoInicial } from './economiaLigas';
import { contratoDTInicial } from './contratoDT';
import { paisDeLiga } from '../data/ligas';
import type { ClubBase } from '../data/clubesLigaProfesional';

// 22 (pedido explícito, ver docs/calendario-real-y-ventanas-de-mercado.md
// y la investigación de por qué nunca llegaban ofertas: con TOPE_PLANTEL
// en 26 y los clubes generados YA en 26/26, `hayCupo` — engine/contratos.ts
// — bloqueaba a TODA la IA para siempre al arranque de cada carrera, así
// que ninguna oferta podía llegar hasta que algún rival vendiera o
// perdiera un jugador por su cuenta). Ahora cada club nace con 4 lugares
// libres bajo el tope, dejando cupo real desde el primer día para que la
// IA pueda ofertar. Sigue alcanzando para 11 titulares + banco en
// cualquiera de las 21 formaciones de data/formaciones.ts (la que más
// pide de cada posición granular: 3 DFC en las de línea de 3/5, 2 MCD en
// las de doble pivote, 3 MC en el 3-1-3-3, 2 MCO en las de doble
// mediapunta, 2 DEL en las de dos puntas) — ARQ/DFC/MC/DEL quedan con un
// extra de rotación arriba de ese mínimo, LI/LD/EI/ED sin banco directo
// en su posición exacta (el ajuste que se sacrifica para bajar el total).
const COMPOSICION_PLANTEL: Record<Posicion, number> = {
  ARQ: 2,
  DFC: 4,
  LI: 1,
  LD: 1,
  MCD: 3,
  MC: 4,
  MCO: 2,
  EI: 1,
  ED: 1,
  DEL: 3,
};

// Cuántos titulares de cada posición pide una formación puntual — sale de
// contar los slots de data/formaciones.ts (21 formaciones reales), no de
// una tabla hardcodeada aparte que se podría desincronizar de esa lista.
function cantidadPorPosicion(formacion: NombreFormacion): Record<Posicion, number> {
  const conteo: Record<Posicion, number> = {
    ARQ: 0, DFC: 0, LI: 0, LD: 0, MCD: 0, MC: 0, MCO: 0, EI: 0, ED: 0, DEL: 0,
  };
  FORMACIONES[formacion].forEach((slot) => { conteo[slot.posicion] += 1; });
  return conteo;
}

// Formación de arranque de cada club generado (pedido explícito: "que las
// alineaciones del rival se sorteen cuando se genere el club" — antes
// todos, IA incluida, arrancaban fijos en 4-4-2). El club del USUARIO se
// deja en 4-4-2 igual que siempre (lo elige a mano después en "armar
// equipo", M3, entre las 21 formaciones) — sortear también la suya sólo
// cambiaría qué le aparece pre-cargado sin agregar nada, y complicaría
// explicarle por qué su plantel "ya viene" en una formación rara la
// primera vez que entra. Ver generarClub más abajo para el gate por
// esControladoPorUsuario.
function elegirFormacionAlAzar(): NombreFormacion {
  return NOMBRES_FORMACION[randomEntero(0, NOMBRES_FORMACION.length - 1)];
}

// CORRECCIÓN (pedido explícito: "toco las distintas licencias del dt y no
// son consistentes"): con desvío 12, el ruido de cada atributo era tan
// grande que las 3 licencias se pisaban — una tirada floja de
// Intercontinental (base 65-90) podía terminar con la MISMA reputación
// que una tirada afortunada de Nacional (base 35-60), porque ±12 de
// desvío mueve el resultado casi tanto como la diferencia entre licencias.
// Bajado a 6 (la mitad) para que la licencia elegida se note de verdad,
// sin sacarle toda la variedad a los atributos.
function generarStatDT(nc: number): number {
  return Math.round(clamp(nc + randomNormal(0, 6), 20, 99));
}

// Licencia del DT (pedido explícito, menú de arranque: "elegís la
// licencia nacional/continental/intercontinental así tu DT spawnea con
// ciertas stats") — mismo espíritu que las licencias de entrenador reales
// (UEFA A/Pro, etc.): no restringe qué club podés dirigir (acá se elige
// club libremente igual que siempre), sólo el rango base de tus
// atributos de arranque. Sólo se usa para el DT del USUARIO —
// generarClub/generarDT siguen generando DTs de la IA con el rango
// 'nacional' (default) sin este parámetro, no tiene sentido que un
// rival cualquiera "elija" licencia.
export type LicenciaDT = 'nacional' | 'continental' | 'intercontinental';

// Rangos separados con poco solapamiento (antes 35-60/50-75/65-90, con
// zonas de 10-15 puntos compartidas entre licencias vecinas — sumado al
// desvío grande de generarStatDT, hacía que el resultado final apenas
// dependiera de la licencia elegida).
const RANGO_BASE_POR_LICENCIA: Record<LicenciaDT, [number, number]> = {
  nacional: [30, 55],
  continental: [50, 75],
  intercontinental: [70, 95],
};

export function generarDT(nombre: string, presupuestoClub: number, nacionalidad?: string, licencia: LicenciaDT = 'nacional'): DT {
  // Las stats del DT no dependen del NC del club acá — un DT bueno puede
  // dirigir un club chico y viceversa, es parte de la gracia del modo
  // carrera (conseguir un DT mejor de lo que "corresponde").
  const [minBase, maxBase] = RANGO_BASE_POR_LICENCIA[licencia];
  const base = Math.round(randomUniforme(minBase, maxBase));
  return {
    id: idUnico('dt'),
    nombre,
    nacionalidad,
    tactica: generarStatDT(base),
    adaptabilidad: generarStatDT(base),
    desarrollo: generarStatDT(base),
    gestionVestuario: generarStatDT(base),
    motivacion: generarStatDT(base),
    analisis: generarStatDT(base),
    mercado: generarStatDT(base),
    reaccion: generarStatDT(base),
    mentalidad: generarStatDT(base),
    reputacion: generarStatDT(base),
    // Contrato propio del DT (pedido explícito) — ver engine/contratoDT.ts.
    contrato: contratoDTInicial(presupuestoClub),
  };
}

// multiplicadorLiga (pedido explícito, mercado realista — ver
// economiaLigas.ts): se propaga a cada jugador generado para que el
// salario inicial del plantel respete el nivel salarial de la liga del
// club (Premier League paga como Premier League, Liga Profesional paga
// como Liga Profesional, aunque el nc/valorMercado de los jugadores sea
// parecido).
export function generarPlantelClub(nc: number, multiplicadorLiga?: number, pais?: string): Jugador[] {
  const plantel: Jugador[] = [];
  (Object.keys(COMPOSICION_PLANTEL) as Posicion[]).forEach((posicion) => {
    const cantidad = COMPOSICION_PLANTEL[posicion];
    for (let i = 0; i < cantidad; i += 1) {
      // Distribución triangular de edad como en la generación inicial de
      // liga (sección 4.1), moda en 24.
      const edad = Math.round(clamp(randomNormal(24, 5), 17, 35));
      const jugador = generarJugador({
        id: idUnico('jugador'),
        nombre: generarNombreJugador(pais),
        posicion,
        edad,
        nc,
        multiplicadorLiga,
      });
      plantel.push(jugador);
    }
  });
  // Los dorsales del plantel inicial se asignan en generarClub, DESPUÉS de
  // armarAlineacionInicial — necesitan saber quién es titular para el
  // reparto 1-11/12+ (ver asignarDorsalesPlantel en engine/jugadores.ts).
  return plantel;
}

// Arma el 11 titular según los slots que pida la `formacion` dada (ver
// cantidadPorPosicion arriba) + el resto del plantel como suplentes — no
// hay un cupo fijo de banco (pedido explícito: antes se cortaba en 5 y el
// resto del plantel quedaba sin aparecer en ningún lado).
export function armarAlineacionInicial(
  plantel: Jugador[],
  formacion: NombreFormacion = '4-4-2',
): { titularesIds: string[]; suplentesIds: string[] } {
  const titularesIds: string[] = [];
  const usados = new Set<string>();
  const cantidadPorPos = cantidadPorPosicion(formacion);

  (Object.keys(cantidadPorPos) as Posicion[]).forEach((posicion) => {
    const candidatos = plantel
      .filter((j) => j.posicion === posicion)
      .sort((a, b) => b.grl - a.grl);
    const cantidad = cantidadPorPos[posicion];
    candidatos.slice(0, cantidad).forEach((j) => {
      titularesIds.push(j.id);
      usados.add(j.id);
    });
  });

  const suplentesIds = plantel
    .filter((j) => !usados.has(j.id))
    .sort((a, b) => b.grl - a.grl)
    .map((j) => j.id);

  return { titularesIds, suplentesIds };
}

export function generarClub(
  base: ClubBase,
  opciones: {
    liga: string; esControladoPorUsuario: boolean; nombreDT: string; nacionalidadDT?: string; licenciaDT?: LicenciaDT;
  },
): Club {
  const nc = base.nc;
  const multiplicadorLiga = multiplicadorSalarialDeLiga(opciones.liga);
  // El ClubBase de los pools de referencia (Otros CONMEBOL, etc.) ya trae
  // su país real; los de una liga doméstica cargada no lo necesitan porque
  // ya se sabe por `opciones.liga` (ver paisDeLiga).
  const pais = base.pais ?? paisDeLiga(opciones.liga) ?? undefined;
  const plantel = generarPlantelClub(nc, multiplicadorLiga, pais);
  // Sorteo de formación (ver elegirFormacionAlAzar arriba): sólo para
  // clubes de la IA, el del usuario arranca en 4-4-2 fijo.
  const formacion = opciones.esControladoPorUsuario ? '4-4-2' : elegirFormacionAlAzar();
  const { titularesIds, suplentesIds } = armarAlineacionInicial(plantel, formacion);
  asignarDorsalesPlantel(plantel, titularesIds);

  // Mercado realista (pedido explícito, ver economiaLigas.ts): antes era
  // nc*150_000 flat, igual para cualquier liga — un club nc80 de Liga
  // Profesional "valía" lo mismo que uno nc80 de Premier League. Ahora
  // depende de la escala económica real de esa liga.
  const presupuesto = presupuestoInicial(nc, opciones.liga);

  return {
    id: base.id,
    nombre: base.nombre,
    liga: opciones.liga,
    nc,
    presupuesto,
    cohesion: 55,
    plantel,
    formacion,
    titularesIds,
    suplentesIds,
    dt: generarDT(opciones.nombreDT, presupuesto, opciones.nacionalidadDT, opciones.licenciaDT),
    esControladoPorUsuario: opciones.esControladoPorUsuario,
  };
}

export function generarLigaInicial(
  clubesBase: ClubBase[],
  clubUsuarioId: string,
  nombreDTUsuario: string,
  nombreLiga = 'Liga Profesional',
  nacionalidadDTUsuario?: string,
  licenciaDTUsuario?: LicenciaDT,
): { liga: Liga; clubes: Record<string, Club> } {
  const clubes: Record<string, Club> = {};

  const paisLiga = paisDeLiga(nombreLiga) ?? undefined;
  clubesBase.forEach((base) => {
    const esUsuario = base.id === clubUsuarioId;
    clubes[base.id] = generarClub(base, {
      liga: nombreLiga,
      esControladoPorUsuario: esUsuario,
      nombreDT: esUsuario ? nombreDTUsuario : generarNombreJugador(base.pais ?? paisLiga),
      nacionalidadDT: esUsuario ? nacionalidadDTUsuario : undefined,
      licenciaDT: esUsuario ? licenciaDTUsuario : undefined,
    });
  });

  const clubIds = clubesBase.map((c) => c.id);
  const liga: Liga = {
    id: idUnico('liga'),
    nombre: nombreLiga,
    clubIds,
    temporadaActual: 1,
    fixture: generarFixture(clubIds),
    tabla: clubesBase.map((c) => ({
      clubId: c.id, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0,
    })),
  };

  return { liga, clubes };
}

// Ascenso/descenso real (pedido explícito): el club del usuario ya
// existe (con su plantel evolucionado, contratos, presupuesto — todo se
// conserva) y pasa a la liga de destino. Como esa liga no se venía
// simulando en el fondo (para no tener que correr las ~21 ligas del
// juego en paralelo — ver la conversación sobre esto), no hay un club
// real al que "reemplazar": se usa la tabla estadística para sacar a
// uno de los peor rankeados de esa liga (el que estadísticamente hubiera
// descendido/no ascendido igual) y hacerle lugar al del usuario.
export function generarLigaConClubExistente(
  clubesBase: ClubBase[],
  clubUsuarioExistente: Club,
  nombreLiga: string,
  temporadaActual: number,
): { liga: Liga; clubes: Record<string, Club> } {
  const tabla = tablaEstadistica(clubesBase);
  const candidatosADejarAfuera = tabla.slice(-4); // los 4 peor rankeados
  const idAfuera = candidatosADejarAfuera[Math.floor(Math.random() * candidatosADejarAfuera.length)].clubId;
  // CORRECCIÓN (bug encontrado con "ofertas de otros clubes extranjeros"
  // — engine/ofertasDT.ts): cuando el club del usuario YA es uno de los
  // ClubBase reales de `clubesBase` (pasa al aceptar una oferta de un
  // club de OTRA liga: ese club sale justamente de esta misma lista),
  // sin este filtro `resto.forEach` más abajo lo volvía a generar como
  // club de la IA y pisaba la entrada de `clubes[clubUsuarioExistente.id]`
  // ya seteada arriba. Para ascenso/descenso (el uso original) esto
  // nunca pasaba — el club del usuario no está en la lista de la liga a
  // la que se muda — así que el filtro es un no-op ahí.
  const resto = clubesBase.filter((c) => c.id !== idAfuera && c.id !== clubUsuarioExistente.id);

  const clubes: Record<string, Club> = {
    [clubUsuarioExistente.id]: { ...clubUsuarioExistente, liga: nombreLiga, esControladoPorUsuario: true },
  };
  const paisLiga = paisDeLiga(nombreLiga) ?? undefined;
  resto.forEach((base) => {
    clubes[base.id] = generarClub(base, {
      liga: nombreLiga, esControladoPorUsuario: false, nombreDT: generarNombreJugador(base.pais ?? paisLiga),
    });
  });

  const clubIds = [clubUsuarioExistente.id, ...resto.map((c) => c.id)];
  const liga: Liga = {
    id: idUnico('liga'),
    nombre: nombreLiga,
    clubIds,
    temporadaActual,
    fixture: generarFixture(clubIds),
    tabla: clubIds.map((id) => ({
      clubId: id, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0,
    })),
  };

  return { liga, clubes };
}

const CLUBES_QUE_ROTAN = 3; // igual a CLUBES_QUE_DESCIENDEN/CLUBES_QUE_ASCIENDEN de economia.ts

// Ascenso/descenso real de la IA (bug reportado: "el Osasuna queda último
// y la temporada siguiente sigue estando ahí" — antes SÓLO se movía el
// club del usuario cuando ascendía/descendía; el resto de los clubes de
// su liga nunca rotaba, terminaran donde terminaran).
//
// Sólo se llama cuando el usuario NO cambia de liga esta temporada (si
// cambia, generarLigaConClubExistente ya reconstruye toda la liga de
// destino de cero, esto sería redundante — ver useGameStore.ts). Mismo
// criterio arcade que ya se usa para el usuario: la liga inferior no se
// simula de fondo, así que no hay clubes "reales" con historia
// ascendiendo — se eligen los mejor rankeados por tablaEstadistica y se
// generan de cero.
export function aplicarAscensoDescensoIA(
  clubesActuales: Record<string, Club>,
  clubIdsActuales: string[],
  tablaFinal: TablaPosiciones[],
  clubUsuarioId: string,
  nombreLiga: string,
  clubesBaseLigaInferior: ClubBase[],
): { clubIds: string[]; clubes: Record<string, Club> } {
  // Filtro defensivo: si el usuario estuviera en la zona de descenso,
  // procesarFinDeTemporada ya le arma un cambioDeLigaPendiente y
  // finalizarTemporada toma la otra rama (no llega a llamar esta
  // función) — pero se deja el filtro para no duplicar al usuario si
  // algún día cambia ese orden.
  const descienden = tablaFinal
    .slice(-CLUBES_QUE_ROTAN)
    .map((f) => f.clubId)
    .filter((id) => id !== clubUsuarioId);

  if (descienden.length === 0) return { clubIds: clubIdsActuales, clubes: clubesActuales };

  const idsExistentes = new Set(clubIdsActuales);
  const tablaLigaInferior = tablaEstadistica(clubesBaseLigaInferior.filter((c) => !idsExistentes.has(c.id)));
  const ascienden = tablaLigaInferior.slice(0, descienden.length);

  const clubes = { ...clubesActuales };
  descienden.forEach((id) => { delete clubes[id]; });

  const paisLiga = paisDeLiga(nombreLiga) ?? undefined;
  const nuevos = ascienden.map((f) => {
    const base = clubesBaseLigaInferior.find((c) => c.id === f.clubId)!;
    return generarClub(base, {
      liga: nombreLiga, esControladoPorUsuario: false, nombreDT: generarNombreJugador(base.pais ?? paisLiga),
    });
  });
  nuevos.forEach((c) => { clubes[c.id] = c; });

  const clubIds = [...clubIdsActuales.filter((id) => !descienden.includes(id)), ...nuevos.map((c) => c.id)];
  return { clubIds, clubes };
}
