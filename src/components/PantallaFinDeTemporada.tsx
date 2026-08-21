// Resumen de fin de temporada (pedido explícito): posición final, premio +
// taquilla - sueldos, y el momento dramático de campeón/ascenso/descenso.
// Ascenso y descenso son reales cuando el país tiene 2 divisiones cargadas
// (nuevaLiga) — la carrera sigue en la liga de destino. Si el país no
// tiene categoría inferior, el descenso termina la carrera (finCarrera).
//
// Objetivo de temporada + riesgo de despido (pedido explícito, ver
// docs/que-le-falta-profundidad.md y engine/objetivos.ts): además del
// descenso sin liga inferior, dos temporadas seguidas sin cumplir el
// objetivo de la directiva también termina la carrera (finCarrera con
// motivo 'despedido').

import { useGameStore } from '../store/useGameStore';
import { formatoMonto } from '../utils/formato';
import { PantallaRepasoCarrera } from './PantallaRepasoCarrera';
import { PantallaOfertaRescate } from './PantallaOfertaRescate';
import { TarjetaOfertaClub } from './TarjetaOfertaClub';
import { TarjetaNotaTemporada } from './TarjetaNotaTemporada';
import { BarraFinanzas } from './BarraFinanzas';

export function PantallaFinDeTemporada({ onContinuar }: { onContinuar: () => void }) {
  const {
    resumenTemporada, finCarrera, finalizarTemporada, reiniciarPartida, liga, movimientosMercado, campeonesDelMundo,
    ofertasDT, aceptarOfertaDT, rechazarOfertaDT, clubUsuarioId, clubes, carreraDT,
    renovacionDT, aceptarRenovacionDT, rechazarRenovacionDT,
    ofertasRescate,
  } = useGameStore();

  // Repaso de carrera (pedido explícito: "una pantalla de repaso de
  // carrera como el ídolo") — reemplaza el mensaje corto de antes cuando
  // la carrera termina (despido o descenso sin liga inferior). Oferta de
  // rescate (pedido explícito: "que si te despiden... te llegue una
  // oferta" — ver engine/ofertasDT.ts): si hay al menos una, se resuelve
  // ANTES del repaso — aceptar continúa la carrera en otro club, así que
  // nunca llega a mostrarse (finCarrera se limpia solo).
  if (finCarrera) {
    return ofertasRescate.length > 0
      ? <PantallaOfertaRescate onContinuar={onContinuar} />
      : <PantallaRepasoCarrera onVolverAlMenu={reiniciarPartida} />;
  }

  if (!resumenTemporada) return null;
  const {
    posicion, totalClubes, campeon, descendido, ascendido, nuevaLiga, premio, taquilla, sueldosPagados, sueldoDT, presupuestoNuevo,
    objetivoDescripcion, objetivoCumplido, confianzaNueva,
  } = resumenTemporada;

  return (
    // Bug reportado ("esta todo muy abajo tenes que scrolear mucho"): antes
    // era una sola columna angosta (max-w-xs, 320px) con cada tarjeta
    // apilada — en una pantalla ancha eso desperdicia todo el espacio de
    // los costados. Ahora el contenido va en un contenedor más ancho
    // (max-w-3xl) con las tarjetas de detalle en una grilla de 2 columnas
    // en pantallas medianas+ (se apila en una sola en mobile), así se ve
    // la mitad de alto sin perder nada.
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans flex flex-col items-center gap-5 p-6">
      <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 topbar-entrada">
        Fin de temporada {resumenTemporada.temporada} — {liga?.nombre}
      </p>

      {/* Animación de festejo/golpe (pedido explícito: "¿están las
          animaciones de cuando ganás un título?" — no estaban; ver
          .revealCarta en index.css, mismo tratamiento que las 4 pantallas
          de copa y el reveal de arranque de MenuScreen). */}
      <div className="text-center" style={{ animation: (campeon || ascendido || descendido) ? 'revealCarta .6s cubic-bezier(.2,.8,.2,1) both' : undefined }}>
        {campeon && <p className="text-3xl font-black text-orange-400">🏆 ¡CAMPEÓN!</p>}
        {ascendido && <p className="text-3xl font-black text-emerald-400">⬆️ ¡ASCENSO!</p>}
        {descendido && <p className="text-3xl font-black text-red-500">⬇️ DESCENSO</p>}
        {!campeon && !ascendido && !descendido && (
          <p className="text-2xl font-bold">
            Terminaste {posicion}° de {totalClubes}
          </p>
        )}
        {(campeon || ascendido || descendido) && (
          <p className="text-sm text-neutral-400 mt-1">
            Terminaste {posicion}° de {totalClubes}
          </p>
        )}
        {nuevaLiga && (
          <p className="text-sm text-neutral-300 mt-1">
            {ascendido ? 'Subís a' : 'Bajás a'} <strong>{nuevaLiga}</strong>
          </p>
        )}
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-4">
        {/* Resumen "portada de diario" (pedido explícito: "hace un resumen
            de esta con nota de tu temporada, estadisticas, goleadores, etc
            de ese estilo con mucha info") — arriba del resto, ocupa todo
            el ancho (es la tarjeta "titular", no compite por espacio con
            las demás). */}
        {clubUsuarioId && clubes[clubUsuarioId] && (
          <TarjetaNotaTemporada resumen={resumenTemporada} clubNombre={clubes[clubUsuarioId].nombre} />
        )}

        {/* Bug reportado ("el cuadrado de fichajes de la liga esta mas
            abajo... asi queda todo simetrico y cuadrado"): con las 4
            tarjetas como items sueltos de un mismo grid de 2 columnas,
            una fila más alta que la otra (acá, "Balance" es más alta que
            "Objetivo" por las barras) empuja a las dos tarjetas de la
            fila siguiente A LA MISMA altura — Fichajes quedaba con un
            hueco vacío arriba porque su compañera de fila (Campeones)
            "esperaba" a Balance en la columna de al lado. Con 2 columnas
            EXPLÍCITAS (cada una su propio flex-col), cada tarjeta se
            apila pegada a la de arriba de SU misma columna, sin importar
            cuánto mida la columna vecina. */}
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col gap-4">
            <div
              className={`bg-neutral-900 border border-neutral-800 border-l-2 ${
                objetivoCumplido ? 'border-l-emerald-400' : 'border-l-red-400'
              } rounded-xl p-4 flex flex-col gap-2 text-sm`}
            >
              <p className="text-xs font-semibold text-neutral-400 mb-1">🎯 Objetivo de la directiva</p>
              <div className="flex justify-between items-center">
                <span className="text-neutral-300">{objetivoDescripcion || '—'}</span>
                <strong className={objetivoCumplido ? 'text-emerald-400' : 'text-red-400'}>
                  {objetivoCumplido ? 'Cumplido' : 'No cumplido'}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Confianza de la directiva</span>
                <strong className={confianzaNueva < 35 ? 'text-red-400' : 'text-neutral-200'}>{confianzaNueva}/100</strong>
              </div>
            </div>

            {movimientosMercado.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between items-baseline mb-1">
                  <p className="text-xs font-semibold text-neutral-400">Fichajes de la liga ({movimientosMercado.length})</p>
                  <p className="text-xs text-neutral-500">
                    Movió <strong className="text-emerald-400">{formatoMonto(movimientosMercado.reduce((a, m) => a + m.monto, 0))}</strong>
                  </p>
                </div>
                {/* Resumen completo, no sólo los destacados (pedido explícito) —
                    con hasta ~30 clubes por liga puede haber muchos movimientos
                    en una temporada, así que la lista scrollea en vez de cortar. */}
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                  {[...movimientosMercado]
                    .sort((a, b) => b.monto - a.monto)
                    .map((m) => (
                      <div key={m.jugadorId} className="flex flex-col text-xs border-t border-neutral-800 pt-2 first:border-0 first:pt-0">
                        <span className="text-neutral-200 font-medium">{m.jugadorNombre}</span>
                        <span className="text-neutral-500">
                          {m.clubOrigenNombre} → {m.clubDestinoNombre}
                          {m.tipo === 'exterior' && m.ligaDestinoNombre ? ` (${m.ligaDestinoNombre})` : ''}
                          {' · '}
                          <strong className="text-emerald-400">{formatoMonto(m.monto)}</strong>
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-1 text-sm">
              <p className="text-xs font-semibold text-neutral-400 mb-1">💰 Balance de la temporada</p>
              {/* Mismo componente/criterio visual que la pestaña Finanzas del
                  Hub (pedido explícito, rediseño general) — barras proporcionales
                  entre sí en vez de sólo el número, para ver de un vistazo qué
                  pesó más. */}
              <BarraFinanzas
                label="Premio por posición"
                valor={premio}
                max={Math.max(premio, taquilla, sueldosPagados, 1)}
                colorClase="bg-gradient-to-r from-emerald-600 to-emerald-400"
                retrasoMs={0}
              />
              <BarraFinanzas
                label="Taquilla / TV"
                valor={taquilla}
                max={Math.max(premio, taquilla, sueldosPagados, 1)}
                colorClase="bg-gradient-to-r from-cyan-600 to-cyan-400"
                retrasoMs={80}
              />
              <BarraFinanzas
                label="Sueldos pagados"
                valor={sueldosPagados}
                max={Math.max(premio, taquilla, sueldosPagados, 1)}
                colorClase="bg-gradient-to-r from-red-600 to-red-400"
                retrasoMs={160}
              />
              <div className="flex justify-between pt-1">
                <span className="text-neutral-400">Tu sueldo (DT)</span>
                <strong className="text-red-400">-{formatoMonto(sueldoDT)}</strong>
              </div>
              <div className="flex justify-between border-t border-neutral-800 pt-2 mt-1">
                <span className="text-neutral-300 font-semibold">Presupuesto</span>
                <strong className={presupuestoNuevo < 0 ? 'text-red-400' : 'text-white'}>{formatoMonto(presupuestoNuevo)}</strong>
              </div>
            </div>

            {campeonesDelMundo.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col gap-2 text-sm">
                <p className="text-xs font-semibold text-neutral-400 mb-1">Campeones del resto del mundo</p>
                {/* Pura data de sabor (pedido explícito): copas que el usuario no
                    jugó de verdad esta temporada, con un campeón sorteado por nc
                    (mismo criterio que tablaEstadistica) — no se simuló un solo
                    partido de estas competiciones. */}
                <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {campeonesDelMundo.map((c) => (
                    <div key={c.competicion} className="flex justify-between text-xs gap-2">
                      <span className="text-neutral-500">{c.competicion}</span>
                      <span className="text-neutral-200 font-medium text-right">{c.campeonNombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ofertas de otros clubes (pedido explícito, "por lo menos 4, 5
            opciones" — ver engine/ofertasDT.ts, y "ponelas asi en
            horizontal en filita" — antes se apilaban una debajo de la
            otra, ahora es una fila scrolleable) — se resuelve ACÁ, antes
            de "Arrancar temporada": aceptar UNA cambia clubUsuarioId, y
            finalizarTemporada (más abajo) tiene que arrancar la temporada
            nueva para el club correcto, no para el que se está dejando. */}
        {ofertasDT.length > 0 && clubUsuarioId && (
          <div className="w-full flex flex-col items-center gap-3">
            <p className="self-start text-xs font-semibold uppercase tracking-widest text-orange-400">
              Ofertas de otros clubes ({ofertasDT.length})
            </p>
            <div className="w-full flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory">
              {ofertasDT.map((oferta) => (
                <div key={oferta.clubId} className="w-72 shrink-0 snap-start">
                  <TarjetaOfertaClub
                    clubNombre={oferta.clubNombre}
                    clubLiga={oferta.clubLiga}
                    clubNc={oferta.clubNc}
                    salario={oferta.salarioOfrecido}
                    duracion={oferta.duracionOfrecida}
                    esRenovacion={false}
                    clubActualNombre={clubes[clubUsuarioId]?.nombre}
                    idolatriaActual={carreraDT.idolatria}
                    onAceptar={() => aceptarOfertaDT(oferta.clubId)}
                  />
                </div>
              ))}
            </div>
            {/* Pedido explícito: "el boton de quedarme en el club que se
                vea mas" — antes era texto gris casi invisible al lado de
                4-5 tarjetas de oferta bien vistosas; ahora es un botón
                real con borde, mismo nivel que las opciones que compite. */}
            <button
              type="button"
              onClick={rechazarOfertaDT}
              className="text-sm font-semibold text-neutral-300 border border-neutral-700 hover:border-neutral-500 hover:text-white rounded-lg px-4 py-2 transition-colors"
            >
              Quedarme en {clubes[clubUsuarioId]?.nombre}
            </button>
          </div>
        )}

        {/* Contrato propio del DT (pedido explícito, ver engine/contratoDT.ts):
            se vence acá, no en ofertasDT.ts — es el MISMO club preguntando si
            seguís, no uno nuevo. Se resuelve antes de poder avanzar, mismo
            patrón que ofertasDT (botón "Arrancar temporada" deshabilitado). */}
        {renovacionDT && clubUsuarioId && (
          <div className="w-full flex flex-col items-center gap-2">
            <p className="self-start text-xs font-semibold uppercase tracking-widest text-orange-400">Se venció tu contrato</p>
            <div className="w-72">
              <TarjetaOfertaClub
                clubNombre={clubes[clubUsuarioId]?.nombre ?? ''}
                clubLiga={liga?.nombre ?? ''}
                clubNc={clubes[clubUsuarioId]?.nc ?? 0}
                salario={renovacionDT.salarioOfrecido}
                duracion={renovacionDT.duracionOfrecida}
                esRenovacion
                idolatriaActual={carreraDT.idolatria}
                aceptarLabel="Renovar"
                onAceptar={aceptarRenovacionDT}
              />
            </div>
            <button type="button" onClick={rechazarRenovacionDT} className="text-xs text-neutral-500 hover:text-neutral-300">
              Rechazar — mi carrera acá termina
            </button>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 mt-2">
          {!objetivoCumplido && (
            <p className="text-xs text-red-400 text-center max-w-xs">
              Otra temporada sin cumplir el objetivo y la directiva te echa.
            </p>
          )}
          <button
            type="button"
            disabled={ofertasDT.length > 0 || Boolean(renovacionDT)}
            onClick={() => {
              finalizarTemporada();
              onContinuar();
            }}
            className="bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg shadow-orange-500/30 disabled:shadow-none disabled:bg-neutral-800 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 hover:brightness-105 text-black font-bold rounded-lg px-6 py-3"
          >
            {nuevaLiga ? `Arrancar en ${nuevaLiga}` : `Arrancar temporada ${resumenTemporada.temporada + 1}`}
          </button>
        </div>
      </div>
    </div>
  );
}
