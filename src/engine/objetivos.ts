// Objetivo de temporada + riesgo de despido (pedido explícito, ver
// docs/que-le-falta-profundidad.md, mecánica 1 — la única de las 5
// propuestas del documento que el usuario eligió implementar). La idea:
// la directiva fija una expectativa según el nivel del plantel, no
// cumplirla baja la confianza, y no cumplirla dos temporadas seguidas
// termina la carrera — mismo patrón que ya usa `FinCarrera` para el
// descenso sin liga inferior, sólo un motivo nuevo.
import type { Club } from '../types';

export type TipoObjetivoTemporada = 'campeon' | 'clasificarCopa' | 'mitadTabla' | 'evitarDescenso';

export interface ObjetivoTemporada {
  tipo: TipoObjetivoTemporada;
  descripcion: string;
}

export const CONFIANZA_INICIAL = 65;
const CONFIANZA_DELTA_CUMPLIDO = 15;
const CONFIANZA_DELTA_INCUMPLIDO = -25;
// Dos temporadas seguidas sin cumplir el objetivo termina la carrera
// (doc: "no cumplirla dos años seguidos termina la carrera igual que hoy
// termina por descenso sin liga inferior").
export const INCUMPLIMIENTOS_PARA_DESPIDO = 2;

// Pedido explícito: "desactiva por ahora que la directiva te eche" — apaga
// el despido por objetivos incumplidos SIN tocar INCUMPLIMIENTOS_PARA_DESPIDO
// de arriba (que sigue documentando la regla real, "2 temporadas seguidas").
// Sólo afecta este motivo puntual — descenso sin liga inferior y renuncia
// por no renovar el contrato del DT siguen terminando la carrera igual que
// antes. Para reactivarlo, volver esto a `true`.
export const DESPIDO_HABILITADO = false;

// El objetivo se arma por RANKING de `nc` dentro de la liga (mismo dato
// que ya usa tablaEstadistica.ts para estimar puntos) en vez de umbrales
// fijos de nc — el nc promedio varía mucho entre una Primera y una liga
// menor, así que un umbral fijo no tendría sentido en las dos.
export function asignarObjetivoTemporada(clubUsuario: Club, clubesLiga: Club[]): ObjetivoTemporada {
  const ordenados = [...clubesLiga].sort((a, b) => b.nc - a.nc);
  const total = ordenados.length || 1;
  const rango = ordenados.findIndex((c) => c.id === clubUsuario.id);
  const posicion0 = rango === -1 ? Math.floor(total / 2) : rango;

  if (posicion0 === 0) {
    return { tipo: 'campeon', descripcion: 'Salir campeón' };
  }
  if (posicion0 / total <= 0.3) {
    const cupo = Math.max(1, Math.round(total * 0.3));
    return { tipo: 'clasificarCopa', descripcion: `Terminar entre los primeros ${cupo}` };
  }
  if (posicion0 / total >= 0.75) {
    return { tipo: 'evitarDescenso', descripcion: 'Evitar el descenso' };
  }
  return { tipo: 'mitadTabla', descripcion: 'Terminar en la mitad superior de la tabla' };
}

// Se recalcula el umbral sobre el `total` REAL de la tabla que acaba de
// terminar (por si la liga cambió de tamaño) en vez de guardar el `total`
// original del objetivo.
export function evaluarObjetivoTemporada(
  objetivo: ObjetivoTemporada,
  posicion0: number,
  total: number,
  descendido: boolean,
): boolean {
  switch (objetivo.tipo) {
    case 'campeon': return posicion0 === 0;
    case 'clasificarCopa': return total > 0 && posicion0 / total <= 0.3;
    case 'evitarDescenso': return !descendido;
    case 'mitadTabla': return total > 0 && posicion0 / total < 0.5;
  }
}

export function actualizarConfianza(confianzaActual: number, cumplido: boolean): number {
  const delta = cumplido ? CONFIANZA_DELTA_CUMPLIDO : CONFIANZA_DELTA_INCUMPLIDO;
  return Math.max(0, Math.min(100, confianzaActual + delta));
}

// Penalización financiera (pedido explícito: "no tengo penalizaciones si
// me paso del presupuesto") — terminar la temporada con presupuesto
// negativo también le resta confianza a la directiva, SUMADO (no en vez
// de) al ajuste por objetivo cumplido/no cumplido de arriba: un club
// puede cumplir el objetivo deportivo y aun así manejar mal la plata (o
// al revés, quedar en rojo con un objetivo cumplido igual pesa menos que
// sumar las dos cosas juntas). Se aplica DESPUÉS de actualizarConfianza,
// sobre el resultado de esa.
const PENALIZACION_CONFIANZA_PRESUPUESTO_ROJO = 10;

export function ajustarConfianzaPorPresupuesto(confianza: number, presupuestoNuevo: number): number {
  if (presupuestoNuevo >= 0) return confianza;
  return Math.max(0, confianza - PENALIZACION_CONFIANZA_PRESUPUESTO_ROJO);
}
