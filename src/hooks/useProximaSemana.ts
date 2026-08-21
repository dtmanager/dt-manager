// Orquestador de "próxima semana" (pedido explícito: "que cada partido
// pase en el calendario como el FM26") — extraído de PantallaCalendario.tsx
// a un hook compartido porque el rediseño del Hub (documento de rediseño
// v2) necesita EL MISMO botón "Simular próxima semana" arriba de todo, no
// una copia paralela que se pueda desincronizar del calendario real.
//
// NO le inventa un reloj al motor (eso sigue siendo el calendario
// cosmético de engine/calendario.ts): sólo mira qué es lo MÁS TEMPRANO sin
// jugar en la línea de tiempo que ya arma `construirCalendario`, y dispara
// UN paso de UNA sola competencia por click (ver ORDEN_PRIORIDAD_TIPO más
// abajo). `mercado` se excluye a propósito: es sólo un recordatorio fijo
// ("abierto toda la temporada", ver engine/calendario.ts), nunca pasa a
// `jugado`, así que dejarlo adentro dejaría el botón trabado en la semana
// 1 para siempre.
//
// Bug reportado ("los partidos de copas y liga los simula a la vez, no
// los separa"): antes, cuando la semana más temprana pendiente tenía MÁS
// DE UNA competencia (ej. liga Y copa nacional la misma semana),
// simularProximaSemana las resolvía TODAS de un solo click — un click
// pensado para "avanzar un partido" terminaba jugando dos partidos
// distintos sin avisar. Ahora sólo se resuelve una (la de mayor
// prioridad, ver ORDEN_PRIORIDAD_TIPO); el resto queda pendiente para el
// próximo click, exactamente igual que si no coincidieran la misma
// semana.

import { useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { construirCalendario, type EntradaCalendario } from '../engine/calendario';

// Orden en el que se resuelve una competencia cuando varias coinciden en
// la misma semana — liga primero (es la que más pesa en la carrera),
// después las copas en el orden en que aparecen en el Hub, pretemporada
// al final (es la única "opcional/sin efecto", ver engine/pretemporada.ts).
const ORDEN_PRIORIDAD_TIPO: EntradaCalendario['tipo'][] = [
  'liga', 'copa-nacional', 'copa-conmebol', 'copa-uefa', 'copa-mundial', 'pretemporada',
];

export function proximaSemanaPendiente(
  entradas: EntradaCalendario[],
): { semana: number; tipo: EntradaCalendario['tipo'] } | null {
  const pendientes = entradas.filter((e) => e.tipo !== 'mercado' && !e.jugado);
  if (pendientes.length === 0) return null;
  const semana = Math.min(...pendientes.map((e) => e.semana));
  const tiposEnEsaSemana = new Set(pendientes.filter((e) => e.semana === semana).map((e) => e.tipo));
  const tipo = ORDEN_PRIORIDAD_TIPO.find((t) => tiposEnEsaSemana.has(t)) ?? [...tiposEnEsaSemana][0];
  return { semana, tipo };
}

export function useProximaSemana() {
  const {
    clubUsuarioId, clubes, liga, partidosPretemporada, copaNacional, copaConmebol, copaUefa, copaMundialClubes,
    simularProximaJornada, simularProximoAmistoso, simularProximaRondaCopaNacional,
    simularProximaFechaCopaConmebol, simularProximaEtapaCopaConmebol,
    simularProximaFechaCopaUefa, simularProximaEtapaCopaUefa,
    simularProximaFechaCopaMundial, simularProximaEtapaCopaMundial,
  } = useGameStore();

  const entradas = useMemo(() => {
    if (!clubUsuarioId || !liga) return [];
    return construirCalendario({
      clubUsuarioId, clubes, liga, partidosPretemporada, copaNacional, copaConmebol, copaUefa, copaMundialClubes,
    });
  }, [clubUsuarioId, clubes, liga, partidosPretemporada, copaNacional, copaConmebol, copaUefa, copaMundialClubes]);

  const proxima = useMemo(() => proximaSemanaPendiente(entradas), [entradas]);
  const nombresCompetenciasProxima = proxima
    ? [...new Set(
      entradas
        .filter((e) => e.semana === proxima.semana && e.tipo === proxima.tipo)
        .map((e) => e.competencia),
    )]
    : [];

  // Un solo paso, de la competencia que ganó la prioridad (ver
  // ORDEN_PRIORIDAD_TIPO) — copa nacional/conmebol/uefa/mundial no
  // comparten "fecha por fecha" con la liga (ver engine/calendario.ts),
  // así que fase de grupos/liga usa la función "próxima fecha" y knockout
  // usa "próxima etapa", mismo criterio que ya usa cada
  // `simularCopaXCompleta` de useGameStore.ts en su propio loop.
  function simularProximaSemana() {
    if (!proxima) return;
    switch (proxima.tipo) {
      case 'pretemporada':
        // Bug reportado ("los 3 amistosos se simulan a la vez") — un solo
        // amistoso por click, mismo criterio que la liga, no
        // simularPretemporadaCompleta (esa la sigue usando "Simular
        // temporada completa" a propósito, para adelantar todo de golpe).
        simularProximoAmistoso();
        break;
      case 'liga':
        simularProximaJornada();
        break;
      case 'copa-nacional':
        simularProximaRondaCopaNacional();
        break;
      case 'copa-conmebol':
        if (copaConmebol?.fase === 'grupos') simularProximaFechaCopaConmebol();
        else simularProximaEtapaCopaConmebol();
        break;
      case 'copa-uefa':
        if (copaUefa?.fase === 'fase-liga') simularProximaFechaCopaUefa();
        else simularProximaEtapaCopaUefa();
        break;
      case 'copa-mundial':
        if (copaMundialClubes?.fase === 'grupos') simularProximaFechaCopaMundial();
        else simularProximaEtapaCopaMundial();
        break;
      default:
        break;
    }
  }

  return {
    entradas, proxima, nombresCompetenciasProxima, simularProximaSemana,
  };
}
