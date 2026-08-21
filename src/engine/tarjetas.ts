// Sistema de tarjetas — bookkeeping de temporada (pedido explícito). El
// motor de partido (engine/partido.ts) ya genera amarillas/rojas DENTRO
// de un partido puntual (afectan sólo ESE partido: el expulsado juega
// con uno menos el resto del encuentro). Este archivo es la otra mitad:
// las CONSECUENCIAS entre partidos — acumular amarillas de la temporada y
// convertirlas en una fecha de suspensión, y que una roja (directa o
// segunda amarilla) también deje afuera la fecha siguiente. Mismo
// criterio arcade que engine/desgaste.ts con las lesiones (mismo patrón:
// decrementar a quien ya estaba de baja, sortear/cargar nuevas bajas a
// quien jugó) — sin pretender el reglamento exacto de ninguna liga real
// (ahí varía cuántas amarillas hacen falta, si el conteo es por fase de
// grupos o por llave, etc.): acá cada 5 amarillas de temporada = 1 fecha
// afuera, y toda roja = 1 fecha afuera.
import type { Club, Partido } from '../types';

const AMARILLAS_POR_SUSPENSION = 5;
const FECHAS_SUSPENSION_POR_ROJA = 1;
const FECHAS_SUSPENSION_POR_ACUMULACION = 1;

export interface TarjetaOcurrida {
  jugadorId: string;
  nombre: string;
  clubId: string;
  tipo: 'amarilla' | 'roja';
  // true si esta tarjeta puntual disparó una suspensión (roja siempre;
  // amarilla sólo si con ésta se llega a un múltiplo de 5) — para que el
  // store le pueda avisar al usuario "tal jugador se pierde la próxima".
  generaSuspension: boolean;
}

// Después de simular una fecha: a quien ya estaba suspendido se le cuenta
// un partido menos de baja (mismo criterio que partidosLesionRestantes en
// desgaste.ts); a quien recibió una tarjeta en alguno de los partidos
// jugados se le suma a estadisticasTemporada y, si corresponde, se le
// carga partidosSuspensionRestantes. `partidosJugados` es la lista YA
// simulada (con `.tarjetas`, `.localId`, `.visitanteId`) — a diferencia
// de aplicarDesgastePostFecha (que sólo necesita saber quién jugó, se
// llama con el fixture de ANTES de simular) esto necesita el resultado
// real, así que se llama con los partidos DESPUÉS de simular, mismo
// momento que aplicarEstadisticasPostFecha.
export function aplicarTarjetasPostFecha(
  clubes: Record<string, Club>,
  partidosJugados: Partido[],
): { clubes: Record<string, Club>; tarjetas: TarjetaOcurrida[] } {
  const idsQueJugaron = new Set<string>();
  const tarjetasPorClub = new Map<string, { jugadorId: string; tipo: 'amarilla' | 'roja' }[]>();
  partidosJugados.forEach((partido) => {
    idsQueJugaron.add(partido.localId);
    idsQueJugaron.add(partido.visitanteId);
    (partido.tarjetas ?? []).forEach((t) => {
      const clubId = t.equipo === 'local' ? partido.localId : partido.visitanteId;
      const lista = tarjetasPorClub.get(clubId) ?? [];
      lista.push({ jugadorId: t.jugadorId, tipo: t.tipo });
      tarjetasPorClub.set(clubId, lista);
    });
  });

  const tarjetasOcurridas: TarjetaOcurrida[] = [];
  const resultado: Record<string, Club> = {};

  Object.values(clubes).forEach((club) => {
    if (!idsQueJugaron.has(club.id)) {
      resultado[club.id] = club;
      return;
    }
    const tarjetasDelClub = tarjetasPorClub.get(club.id) ?? [];
    const plantel = club.plantel.map((j) => {
      const restantesActuales = j.partidosSuspensionRestantes ?? 0;
      const propias = tarjetasDelClub.filter((t) => t.jugadorId === j.id);

      if (restantesActuales > 0) {
        // Ya estaba de baja — cuenta un partido menos, sin importar si
        // encima recibió otra tarjeta jugando (no debería pasar: un
        // suspendido no debería estar en cancha, pero por las dudas no
        // se pisa la baja existente con una más corta).
        return { ...j, partidosSuspensionRestantes: restantesActuales - 1 };
      }
      if (propias.length === 0) return j;

      let tarjetasAmarillas = j.estadisticasTemporada.tarjetasAmarillas ?? 0;
      let tarjetasRojas = j.estadisticasTemporada.tarjetasRojas ?? 0;
      let suspensionNueva = 0;

      propias.forEach((t) => {
        if (t.tipo === 'roja') {
          tarjetasRojas += 1;
          suspensionNueva = Math.max(suspensionNueva, FECHAS_SUSPENSION_POR_ROJA);
          tarjetasOcurridas.push({
            jugadorId: j.id, nombre: j.nombre, clubId: club.id, tipo: 'roja', generaSuspension: true,
          });
        } else {
          tarjetasAmarillas += 1;
          const disparaSuspension = tarjetasAmarillas % AMARILLAS_POR_SUSPENSION === 0;
          if (disparaSuspension) suspensionNueva = Math.max(suspensionNueva, FECHAS_SUSPENSION_POR_ACUMULACION);
          tarjetasOcurridas.push({
            jugadorId: j.id, nombre: j.nombre, clubId: club.id, tipo: 'amarilla', generaSuspension: disparaSuspension,
          });
        }
      });

      return {
        ...j,
        estadisticasTemporada: { ...j.estadisticasTemporada, tarjetasAmarillas, tarjetasRojas },
        partidosSuspensionRestantes: suspensionNueva,
      };
    });
    resultado[club.id] = { ...club, plantel };
  });

  return { clubes: resultado, tarjetas: tarjetasOcurridas };
}
