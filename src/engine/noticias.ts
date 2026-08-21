// Sistema de noticias (pedido explícito: "investiga como puede ser el
// sistema de noticias con rumores, jugadores destacados, goleadores,
// etc" — ver docs/sistema-noticias.md sección 8). Funciones puras, mismo
// patrón que estadisticasPartido.ts/mercadoIA.ts: no hay side-effects acá,
// el store decide cuándo llamarlas y qué hacer con el resultado (acumular
// en `noticias`, ver useGameStore.ts).
//
// Nota de honestidad (mismo criterio del resto del proyecto): de las 6
// categorías, sólo "rumor" es narrativa/inventada a propósito (así se
// diseñan los rumores de mercado en la realidad — ver 8.1, tienen que
// fallar seguido para sentirse creíbles). Las otras 5 categorías
// (resultado/goleador/destacado/fichaje/joya) se arman 100% a partir de
// datos que el motor ya calculó — no se inventa ningún resultado,
// estadística ni movimiento de mercado.
import type {
  Club, GolPartido, Jugador, NoticiaItem, Partido, PesoNoticia,
} from '../types';
import type { FilaGoleador } from './estadisticasPartido';
import type { MovimientoMercadoIA } from './mercadoIA';
import { elegirVariosAlAzar } from './random';

// Formato de monto local (mismo criterio que utils/formato.ts, pero
// engine/ no importa de utils/ en ningún otro archivo — se duplica acá a
// propósito para no cruzar esa capa, mismo patrón que useConteo/BarraStat
// se duplican entre componentes de UI).
function formatoMontoCorto(monto: number): string {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`;
  if (monto >= 1_000) return `$${Math.round(monto / 1000)}K`;
  return `$${Math.round(monto)}`;
}

// -------------------- 1. Resultado / partido --------------------

// Diferencia de NC a partir de la cual un resultado se considera
// "sorpresa" (el favorito, definido por NC, terminó perdiendo). Sólo se
// genera noticia de un partido ajeno al usuario si es sorpresa — de otro
// modo el feed se llenaría de resultados rutinarios de equipos que no le
// importan al usuario (ver 8.1: "mejor pocas noticias relevantes que
// muchas genéricas").
const UMBRAL_SORPRESA_NC = 8;
const UMBRAL_SORPRESA_GRANDE_NC = 20;

function noticiaDeResultado(
  partido: Partido,
  clubLocal: Club,
  clubVisitante: Club,
  esDelUsuario: boolean,
  temporada: number,
): NoticiaItem | null {
  if (partido.golesLocal == null || partido.golesVisitante == null) return null;
  const empate = partido.golesLocal === partido.golesVisitante;
  const ganoLocal = partido.golesLocal > partido.golesVisitante;
  const diffGoles = Math.abs(partido.golesLocal - partido.golesVisitante);
  const diffNc = Math.abs(clubLocal.nc - clubVisitante.nc);
  const favoritoEsLocal = clubLocal.nc >= clubVisitante.nc;
  const perdioElFavorito = !empate && (favoritoEsLocal ? !ganoLocal : ganoLocal);
  const esSorpresa = perdioElFavorito && diffNc >= UMBRAL_SORPRESA_NC;

  if (!esDelUsuario && !esSorpresa) return null;

  let peso: PesoNoticia = 'rutinario';
  if (esSorpresa && diffNc >= UMBRAL_SORPRESA_GRANDE_NC) peso = 'grande';
  else if (esSorpresa || (esDelUsuario && diffGoles >= 3)) peso = 'relevante';

  const ganador = empate ? null : (ganoLocal ? clubLocal : clubVisitante);
  const titulo = esSorpresa && ganador
    ? `Sorpresa: ${ganador.nombre} da el golpe`
    : `${clubLocal.nombre} ${partido.golesLocal}-${partido.golesVisitante} ${clubVisitante.nombre}`;
  const cuerpo = esSorpresa
    ? `${clubLocal.nombre} ${partido.golesLocal}-${partido.golesVisitante} ${clubVisitante.nombre} — resultado inesperado por la diferencia de nivel entre los planteles.`
    : `${clubLocal.nombre} ${partido.golesLocal}-${partido.golesVisitante} ${clubVisitante.nombre}.`;

  return {
    id: `resultado-${partido.id}`,
    categoria: 'resultado',
    peso,
    temporada,
    fecha: partido.fecha,
    titulo,
    cuerpo,
    clubIds: [clubLocal.id, clubVisitante.id],
  };
}

// Recorre los partidos recién jugados de una fecha y arma noticias de
// resultado: siempre el del club del usuario (si jugó), y de cualquier
// otro sólo si fue una sorpresa real (ver UMBRAL_SORPRESA_NC).
export function generarNoticiasResultado(
  partidosJugados: Partido[],
  clubes: Record<string, Club>,
  clubUsuarioId: string,
  temporada: number,
): NoticiaItem[] {
  const noticias: NoticiaItem[] = [];
  partidosJugados.forEach((p) => {
    const local = clubes[p.localId];
    const visitante = clubes[p.visitanteId];
    if (!local || !visitante) return;
    const esDelUsuario = p.localId === clubUsuarioId || p.visitanteId === clubUsuarioId;
    const noticia = noticiaDeResultado(p, local, visitante, esDelUsuario, temporada);
    if (noticia) noticias.push(noticia);
  });
  return noticias;
}

// -------------------- 2. Goleador / hito individual --------------------

const HITOS_GOLES = [10, 20, 30, 40];

// Compara la tabla de goleadores antes/después de una fecha: cambio de
// líder (peso relevante) e hitos redondos de goles (10/20/30/40, peso
// relevante). No inventa nada — sólo lee estadisticasTemporada.goles, que
// ya actualiza aplicarEstadisticasPostFecha.
export function generarNoticiasGoleador(
  tablaAntes: FilaGoleador[],
  tablaDespues: FilaGoleador[],
  temporada: number,
  fecha: number,
): NoticiaItem[] {
  const noticias: NoticiaItem[] = [];

  const liderAntes = tablaAntes[0] ?? null;
  const liderDespues = tablaDespues[0] ?? null;
  if (liderDespues && liderDespues.goles > 0 && liderDespues.jugadorId !== liderAntes?.jugadorId) {
    noticias.push({
      id: `goleador-lider-${temporada}-${fecha}`,
      categoria: 'goleador',
      peso: 'relevante',
      temporada,
      fecha,
      titulo: `${liderDespues.nombre} es el nuevo goleador de la liga`,
      cuerpo: `${liderDespues.nombre} (${liderDespues.clubNombre}) toma la punta de la tabla de goleadores con ${liderDespues.goles} gol${liderDespues.goles === 1 ? '' : 'es'}.`,
      clubIds: [liderDespues.clubId],
      jugadorId: liderDespues.jugadorId,
    });
  }

  const golesAntesPorJugador = new Map(tablaAntes.map((f) => [f.jugadorId, f.goles]));
  tablaDespues.forEach((fila) => {
    const golesAntes = golesAntesPorJugador.get(fila.jugadorId) ?? 0;
    const hito = HITOS_GOLES.find((h) => golesAntes < h && fila.goles >= h);
    if (!hito) return;
    noticias.push({
      id: `goleador-hito-${fila.jugadorId}-${hito}`,
      categoria: 'goleador',
      peso: 'relevante',
      temporada,
      fecha,
      titulo: `${fila.nombre} llegó a los ${hito} goles`,
      cuerpo: `${fila.nombre} (${fila.clubNombre}) alcanzó los ${hito} goles en la temporada.`,
      clubIds: [fila.clubId],
      jugadorId: fila.jugadorId,
    });
  });

  return noticias;
}

// -------------------- 3. Jugador destacado de la fecha --------------------

// Heurística simple (no hay un "rating de partido" en el motor todavía,
// ver 8.3 punto 3): hat-trick (peso grande), gol+asistencia en el mismo
// partido, goleador de una goleada (3+ diferencia del equipo ganador), y
// valla invicta del arquero en una victoria — todo sale de GolPartido[],
// que ya trae jugadorId/asistenciaId/equipo por gol.
//
// Nota de ruido (encontrado probando una temporada completa, 58 fechas):
// "gol+asistencia" y "valla invicta" pasan bastante seguido — con TODA la
// liga generándolas cada fecha, terminan copando el tope de noticias
// acumuladas (ver TOPE_NOTICIAS) y desplazan categorías más raras
// (fichaje, joya). Sólo esas dos quedan filtradas al club del usuario;
// hat-trick y goleada son lo bastante infrecuentes como para dejarlas a
// nivel liga completa (mismo criterio que generarNoticiasResultado con
// las "sorpresas" ajenas al usuario).
export function generarNoticiasDestacado(
  partidosJugados: Partido[],
  clubes: Record<string, Club>,
  clubUsuarioId: string,
  temporada: number,
): NoticiaItem[] {
  const noticias: NoticiaItem[] = [];

  const nombreJugador = (clubId: string, jugadorId: string): string | null => {
    const club = clubes[clubId];
    return club?.plantel.find((j) => j.id === jugadorId)?.nombre ?? null;
  };

  partidosJugados.forEach((p) => {
    if (p.golesLocal == null || p.golesVisitante == null || !p.goles || p.goles.length === 0) return;
    const local = clubes[p.localId];
    const visitante = clubes[p.visitanteId];
    if (!local || !visitante) return;
    const esDelUsuario = p.localId === clubUsuarioId || p.visitanteId === clubUsuarioId;

    (['local', 'visitante'] as const).forEach((equipo) => {
      const clubId = equipo === 'local' ? p.localId : p.visitanteId;
      const golesEquipo = p.goles!.filter((g: GolPartido) => g.equipo === equipo);
      if (golesEquipo.length === 0) return;

      const golesPorJugador = new Map<string, number>();
      const asistenciasPorJugador = new Map<string, number>();
      golesEquipo.forEach((g) => {
        golesPorJugador.set(g.jugadorId, (golesPorJugador.get(g.jugadorId) ?? 0) + 1);
        if (g.asistenciaId) asistenciasPorJugador.set(g.asistenciaId, (asistenciasPorJugador.get(g.asistenciaId) ?? 0) + 1);
      });
      const yaDestacado = new Set<string>();

      // Hat-trick (o más) — el más contundente de los destacados.
      golesPorJugador.forEach((cantidad, jugadorId) => {
        if (cantidad < 3) return;
        const nombre = nombreJugador(clubId, jugadorId);
        if (!nombre) return;
        yaDestacado.add(jugadorId);
        noticias.push({
          id: `destacado-hattrick-${p.id}-${jugadorId}`,
          categoria: 'destacado',
          peso: 'grande',
          temporada,
          fecha: p.fecha,
          titulo: `¡Hat-trick de ${nombre}!`,
          cuerpo: `${nombre} anotó ${cantidad} goles en el ${local.nombre} ${p.golesLocal}-${p.golesVisitante} ${visitante.nombre}.`,
          clubIds: [clubId],
          jugadorId,
        });
      });

      // Gol + asistencia en el mismo partido (excluye a quien ya salió
      // arriba por hat-trick, para no duplicar el mismo protagonista).
      // Filtrado al club del usuario (ver nota de ruido arriba).
      if (!esDelUsuario) return;
      golesPorJugador.forEach((goles, jugadorId) => {
        if (yaDestacado.has(jugadorId)) return;
        const asistencias = asistenciasPorJugador.get(jugadorId) ?? 0;
        if (goles < 1 || asistencias < 1) return;
        const nombre = nombreJugador(clubId, jugadorId);
        if (!nombre) return;
        yaDestacado.add(jugadorId);
        noticias.push({
          id: `destacado-golyasistencia-${p.id}-${jugadorId}`,
          categoria: 'destacado',
          peso: 'relevante',
          temporada,
          fecha: p.fecha,
          titulo: `Partidazo de ${nombre}`,
          cuerpo: `${nombre} metió gol y dio asistencia en el ${local.nombre} ${p.golesLocal}-${p.golesVisitante} ${visitante.nombre}.`,
          clubIds: [clubId],
          jugadorId,
        });
      });
    });

    // Goleada (3+ de diferencia): destaca al máximo goleador del equipo
    // ganador de ESE partido.
    const diff = Math.abs(p.golesLocal - p.golesVisitante);
    if (diff >= 3) {
      const ganoLocal = p.golesLocal > p.golesVisitante;
      const equipoGanador = ganoLocal ? 'local' : 'visitante';
      const clubGanadorId = ganoLocal ? p.localId : p.visitanteId;
      const clubGanadorNombre = ganoLocal ? local.nombre : visitante.nombre;
      const golesGanador = p.goles!.filter((g) => g.equipo === equipoGanador);
      if (golesGanador.length > 0) {
        const conteo = new Map<string, number>();
        golesGanador.forEach((g) => conteo.set(g.jugadorId, (conteo.get(g.jugadorId) ?? 0) + 1));
        const [jugadorIdTop] = [...conteo.entries()].sort((a, b) => b[1] - a[1])[0];
        const nombre = nombreJugador(clubGanadorId, jugadorIdTop);
        const yaEsHattrick = (conteo.get(jugadorIdTop) ?? 0) >= 3;
        if (nombre && !yaEsHattrick) {
          noticias.push({
            id: `destacado-goleada-${p.id}`,
            categoria: 'destacado',
            peso: 'relevante',
            temporada,
            fecha: p.fecha,
            titulo: `Goleada de ${clubGanadorNombre}`,
            cuerpo: `${local.nombre} ${p.golesLocal}-${p.golesVisitante} ${visitante.nombre} — ${nombre} fue la figura del equipo ganador.`,
            clubIds: [clubGanadorId],
            jugadorId: jugadorIdTop,
          });
        }
      }
    }

    // Valla invicta del arquero en una victoria — filtrado al club del
    // usuario (ver nota de ruido arriba de la función).
    if (!esDelUsuario) return;
    (['local', 'visitante'] as const).forEach((equipo) => {
      const club = equipo === 'local' ? local : visitante;
      const golesEnContra = equipo === 'local' ? p.golesVisitante! : p.golesLocal!;
      const golesAFavor = equipo === 'local' ? p.golesLocal! : p.golesVisitante!;
      if (golesEnContra !== 0 || golesAFavor === 0) return;
      const arqueroId = club.titularesIds.find((id) => club.plantel.find((j) => j.id === id)?.posicion === 'ARQ');
      const arquero = arqueroId ? club.plantel.find((j) => j.id === arqueroId) : null;
      if (!arquero) return;
      noticias.push({
        id: `destacado-valla-${p.id}-${equipo}`,
        categoria: 'destacado',
        peso: 'relevante',
        temporada,
        fecha: p.fecha,
        titulo: `Valla invicta de ${arquero.nombre}`,
        cuerpo: `${arquero.nombre} no recibió goles en la victoria de ${club.nombre} (${local.nombre} ${p.golesLocal}-${p.golesVisitante} ${visitante.nombre}).`,
        clubIds: [club.id],
        jugadorId: arquero.id,
      });
    });
  });

  return noticias;
}

// -------------------- 4. Fichaje real --------------------

const UMBRAL_FICHAJE_GRANDE = 15_000_000;
const UMBRAL_FICHAJE_RELEVANTE = 4_000_000;

// Techo de cuántos fichajes de una misma ventana se convierten en noticia
// (encontrado probando el cierre de temporada: una liga de 30 clubes deja
// ~30 movimientos IA-IA de una sola vez — generarlos TODOS como noticia
// inunda el tope acumulado y desplaza rumores/joyas, ver TOPE_NOTICIAS).
// Se queda con los de mayor monto — mismo criterio que un feed de
// transferencias real, que cubre los pases importantes, no cada
// movimiento de plantel.
const MAX_FICHAJES_POR_VENTANA = 5;

// Convierte movimientos de mercadoIA.ts (ya EJECUTADOS, no rumores) en
// noticias — el peso escala con el monto (proxy honesto del nivel del
// jugador, ya que no tenemos su nc/grl en MovimientoMercadoIA).
export function generarNoticiasFichaje(
  movimientos: MovimientoMercadoIA[],
  temporada: number,
  fecha: number,
): NoticiaItem[] {
  const masGrandes = [...movimientos].sort((a, b) => b.monto - a.monto).slice(0, MAX_FICHAJES_POR_VENTANA);
  return masGrandes.map((m): NoticiaItem => {
    let peso: PesoNoticia = 'rutinario';
    if (m.monto >= UMBRAL_FICHAJE_GRANDE) peso = 'grande';
    else if (m.monto >= UMBRAL_FICHAJE_RELEVANTE) peso = 'relevante';

    const destino = m.tipo === 'exterior' && m.ligaDestinoNombre
      ? `${m.clubDestinoNombre} (${m.ligaDestinoNombre})`
      : m.clubDestinoNombre;

    return {
      id: `fichaje-${m.jugadorId}-${temporada}-${fecha}`,
      categoria: 'fichaje',
      peso,
      temporada,
      fecha,
      titulo: `${m.jugadorNombre} nuevo refuerzo de ${m.clubDestinoNombre}`,
      cuerpo: `${destino} contrató a ${m.jugadorNombre}, que llega desde ${m.clubOrigenNombre} por ${formatoMontoCorto(m.monto)}.`,
      clubIds: [m.clubOrigenId],
      jugadorId: m.jugadorId,
    };
  });
}

// -------------------- 5. Rumor de mercado --------------------

const CANTIDAD_RUMORES_POR_VENTANA = 2;

// 100% narrativo a propósito (ver nota de honestidad arriba del archivo):
// sortea jugadores YA listados como transferibles (mismo flag que arma
// rotarListadosIA) que NO tuvieron un fichaje real esta ventana, y les
// inventa un club interesado al azar entre los de la liga. Desacoplado
// del motor de mercado real por diseño — la mayoría de estos rumores no
// se va a concretar nunca, que es justamente lo que los hace creíbles
// (ver 8.1: un rumor que siempre se cumple deja de sentirse como rumor).
export function generarRumoresMercado(
  clubes: Record<string, Club>,
  clubIds: string[],
  clubUsuarioId: string,
  movimientosDeEstaVentana: MovimientoMercadoIA[],
  temporada: number,
  fecha: number,
): NoticiaItem[] {
  const idsConMovimientoReal = new Set(movimientosDeEstaVentana.map((m) => m.jugadorId));
  const candidatos: { jugador: Jugador; club: Club }[] = [];
  clubIds.forEach((clubId) => {
    if (clubId === clubUsuarioId) return;
    const club = clubes[clubId];
    if (!club) return;
    club.plantel.forEach((j) => {
      if (j.transferible && !idsConMovimientoReal.has(j.id)) candidatos.push({ jugador: j, club });
    });
  });
  if (candidatos.length === 0) return [];

  const elegidos = elegirVariosAlAzar(candidatos, CANTIDAD_RUMORES_POR_VENTANA);
  const nombresClubes = clubIds.map((id) => clubes[id]?.nombre).filter((n): n is string => Boolean(n));

  return elegidos.map(({ jugador, club }, i): NoticiaItem => {
    const posiblesInteresados = nombresClubes.filter((n) => n !== club.nombre);
    const interesado = posiblesInteresados.length > 0
      ? posiblesInteresados[Math.floor(Math.random() * posiblesInteresados.length)]
      : 'un club de otra liga';
    return {
      id: `rumor-${jugador.id}-${temporada}-${fecha}-${i}`,
      categoria: 'rumor',
      peso: 'rutinario',
      temporada,
      fecha,
      titulo: `Rumor: ${interesado} sondea a ${jugador.nombre}`,
      cuerpo: `Fuentes cercanas al club aseguran que ${interesado} preguntó por ${jugador.nombre}, de ${club.nombre}. Todavía no hay nada confirmado.`,
      clubIds: [club.id],
      jugadorId: jugador.id,
      esRumor: true,
    };
  });
}

// -------------------- 6. Joya en ascenso --------------------

const UMBRAL_SUBA_GRL_JOYA = 5;
const EDAD_MAX_JOYA = 23;

// Compara el plantel de un club ANTES/DESPUÉS de evolucionarClub (fin de
// temporada): un canterano/juvenil cuyo grl subió fuerte, o cualquier
// jugador marcado esJoya que también subió. No mira historialGrl (ya
// tenemos el jugador antes y después a mano en el mismo call site) —
// mismo dato, forma más directa de leerlo.
export function generarNoticiasJoya(
  clubAntes: Club,
  clubDespues: Club,
  temporada: number,
): NoticiaItem[] {
  const noticias: NoticiaItem[] = [];
  const antesPorId = new Map(clubAntes.plantel.map((j) => [j.id, j]));

  clubDespues.plantel.forEach((jugador) => {
    const antes = antesPorId.get(jugador.id);
    if (!antes) return; // canterano recién fichado esta misma temporada, sin "antes" real
    const suba = jugador.grl - antes.grl;
    const esCandidato = jugador.edad <= EDAD_MAX_JOYA || antes.esJoya;
    if (!esCandidato || suba < UMBRAL_SUBA_GRL_JOYA) return;

    noticias.push({
      id: `joya-${jugador.id}-${temporada}`,
      categoria: 'joya',
      peso: 'relevante',
      temporada,
      fecha: 0,
      titulo: `La proyección de ${jugador.nombre} sigue en alza`,
      cuerpo: `${jugador.nombre} (${clubDespues.nombre}, ${jugador.edad} años) subió de ${antes.grl} a ${jugador.grl} de nivel en la última pretemporada.`,
      clubIds: [clubDespues.id],
      jugadorId: jugador.id,
    });
  });

  return noticias;
}

// -------------------- 7. Confianza de la directiva --------------------

// Mecánica 4 de docs/que-le-falta-profundidad.md ("casi gratis" una vez
// que existe la mecánica 1 — objetivo de temporada, ver engine/objetivos.ts
// — es sólo exponerla): una noticia cuando la confianza CRUZA hacia abajo
// el umbral, no cada vez que se recalcula y sigue baja — si no, se repetiría
// idéntica cada temporada mala y perdería el efecto de "evento puntual"
// (mismo criterio de honestidad/no-ruido que el resto del archivo).
const UMBRAL_CONFIANZA_BAJA = 35;

export function generarNoticiaConfianzaDirectiva(
  confianzaAnterior: number,
  confianzaNueva: number,
  clubUsuarioId: string,
  temporada: number,
): NoticiaItem[] {
  const cruzoHaciaAbajo = confianzaAnterior >= UMBRAL_CONFIANZA_BAJA && confianzaNueva < UMBRAL_CONFIANZA_BAJA;
  if (!cruzoHaciaAbajo) return [];
  return [{
    id: `directiva-confianza-baja-${clubUsuarioId}-${temporada}`,
    categoria: 'directiva',
    peso: 'relevante',
    temporada,
    fecha: 0,
    titulo: 'La directiva empieza a mostrarse impaciente',
    cuerpo: `La confianza de la directiva cayó a ${confianzaNueva}/100 después de no cumplir el objetivo de la temporada.`,
    clubIds: [clubUsuarioId],
  }];
}

// -------------------- 8. Contrato (renovación automática / vencimiento) --------------------
//
// Pedido explícito: "sistema de notificaciones... que se renuevan los
// contratos automaticamente o que se vencen los contratos de los
// jugadores". Sólo cubre al club del USUARIO — a la IA nadie le avisa
// nada de esto, no tiene sentido narrar el mercado de un rival con el
// mismo detalle. `renovados` viene de aplicarPisoDePlantel (piso
// obligatorio de plantel, engine/contratos.ts): un jugador que iba a
// quedar libre pero se salvó con una renovación corta. `liberados` viene
// del mismo avanzarContratos — venció el contrato y no había piso que lo
// salvara, se fue.
export function generarNoticiasContrato(
  renovados: Jugador[],
  liberados: Jugador[],
  clubUsuarioId: string,
  temporada: number,
): NoticiaItem[] {
  const noticias: NoticiaItem[] = [];
  renovados.forEach((j) => {
    noticias.push({
      id: `contrato-renovado-${j.id}-${temporada}`,
      categoria: 'contrato',
      peso: 'relevante',
      temporada,
      fecha: 0,
      titulo: `${j.nombre} renovó su contrato`,
      cuerpo: `${j.nombre} (${j.posicion}) firmó una renovación de emergencia — tu plantel se estaba quedando corto para completar un 11 con banco.`,
      clubIds: [clubUsuarioId],
      jugadorId: j.id,
    });
  });
  liberados.forEach((j) => {
    noticias.push({
      id: `contrato-vencido-${j.id}-${temporada}`,
      categoria: 'contrato',
      peso: 'rutinario',
      temporada,
      fecha: 0,
      titulo: `${j.nombre} quedó libre`,
      cuerpo: `Se le venció el contrato a ${j.nombre} (${j.posicion}) y dejó el club.`,
      clubIds: [clubUsuarioId],
      jugadorId: j.id,
    });
  });
  return noticias;
}

// -------------------- acumulación (store) --------------------

export const TOPE_NOTICIAS = 30;

// Antepone las noticias nuevas (más recientes primero) y recorta al tope
// — mismo criterio que el resto del store para listas acotadas, pero acá
// SÍ se acumula (a diferencia de ultimasLesiones/ultimasTarjetas, que se
// pisan) porque el carrusel de noticias necesita contenido para rotar
// aunque el usuario simule fecha por fecha, no sólo la última tanda (ver
// 8.5 del documento de diseño).
export function agregarNoticias(actuales: NoticiaItem[], nuevas: NoticiaItem[]): NoticiaItem[] {
  if (nuevas.length === 0) return actuales;
  return [...nuevas, ...actuales].slice(0, TOPE_NOTICIAS);
}
