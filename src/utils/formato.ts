export function formatoMonto(monto: number): string {
  if (monto >= 1_000_000) return `$${(monto / 1_000_000).toFixed(1)}M`;
  if (monto >= 1_000) return `$${Math.round(monto / 1000)}K`;
  return `$${Math.round(monto)}`;
}

// Movido acá desde PantallaHub.tsx (pedido explícito, tarjetas de oferta
// de club estilo "El dado trajo estas ofertas" — TarjetaOfertaClub.tsx lo
// necesita para el badge del club, mismo criterio que ya usaba el Hub: no
// duplicar la función en dos archivos.
export function inicialesClub(nombre: string | undefined): string {
  if (!nombre) return '??';
  const palabras = nombre.split(/\s+/).filter(Boolean);
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

// Tiempo complementario/descuento (pedido explícito) — "45+2'" en vez de
// "47'" para no pisar la numeración de la mitad siguiente (ver
// EventoPartido.minutoAgregado / GolPartido.minutoAgregado en
// engine/partido.ts, mismo criterio en los dos lugares que lo muestran:
// PantallaDetallePartido y PantallaVisualizadorPartido).
export function formatoMinuto(minuto: number, minutoAgregado?: number): string {
  return minutoAgregado ? `${minuto}+${minutoAgregado}'` : `${minuto}'`;
}
