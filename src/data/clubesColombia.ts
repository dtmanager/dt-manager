// Clubes reales de la Categoría Primera A de Colombia para el modo carrera.
// Los `nc` de Atlético Nacional/América de Cali/Atlético Bucaramanga/Once
// Caldas reusan el valor ya cargado en clubesOtrosConmebol.ts (misma
// planilla de referencia FIFA/EA FC) — el resto de los clubes no estaba en
// ese pool y se marca `estimado: true` (estimación razonada, no dato de
// FIFA Index). `archivo` apunta a public/assets/escudos/colombia/ (los
// escudos todavía no están bajados — hay que agregarlos ahí con el nombre
// que indica cada `archivo`; el <img> del menú simplemente no se ve hasta
// entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_COLOMBIA = '/assets/escudos/colombia/';

export const CLUBES_COLOMBIA: ClubBase[] = [
  { id: 'colombia-atletico-nacional', nombre: 'Atlético Nacional', pais: 'Colombia', nc: 72, archivo: 'atletico-nacional.png' },
  { id: 'colombia-millonarios', nombre: 'Millonarios', pais: 'Colombia', nc: 71, archivo: 'millonarios.png', estimado: true },
  { id: 'colombia-america-de-cali', nombre: 'América de Cali', pais: 'Colombia', nc: 70, archivo: 'america-de-cali.png' },
  { id: 'colombia-junior-de-barranquilla', nombre: 'Junior de Barranquilla', pais: 'Colombia', nc: 69, archivo: 'junior-de-barranquilla.png', estimado: true },
  { id: 'colombia-atletico-bucaramanga', nombre: 'Atlético Bucaramanga', pais: 'Colombia', nc: 69, archivo: 'atletico-bucaramanga.png' },
  { id: 'colombia-once-caldas', nombre: 'Once Caldas', pais: 'Colombia', nc: 69, archivo: 'once-caldas.png' },
  { id: 'colombia-deportivo-cali', nombre: 'Deportivo Cali', pais: 'Colombia', nc: 68, archivo: 'deportivo-cali.png', estimado: true },
  { id: 'colombia-independiente-santa-fe', nombre: 'Independiente Santa Fe', pais: 'Colombia', nc: 68, archivo: 'independiente-santa-fe.png', estimado: true },
  { id: 'colombia-deportes-tolima', nombre: 'Deportes Tolima', pais: 'Colombia', nc: 67, archivo: 'deportes-tolima.png', estimado: true },
  { id: 'colombia-independiente-medellin', nombre: 'Independiente Medellín', pais: 'Colombia', nc: 67, archivo: 'independiente-medellin.png', estimado: true },
  { id: 'colombia-la-equidad', nombre: 'La Equidad', pais: 'Colombia', nc: 63, archivo: 'la-equidad.svg', estimado: true },
  { id: 'colombia-envigado', nombre: 'Envigado', pais: 'Colombia', nc: 62, archivo: 'envigado.svg', estimado: true },
  { id: 'colombia-aguilas-doradas', nombre: 'Águilas Doradas', pais: 'Colombia', nc: 62, archivo: 'aguilas-doradas.png', estimado: true },
  { id: 'colombia-deportivo-pasto', nombre: 'Deportivo Pasto', pais: 'Colombia', nc: 62, archivo: 'deportivo-pasto.png', estimado: true },
  { id: 'colombia-alianza-fc', nombre: 'Alianza FC', pais: 'Colombia', nc: 61, archivo: 'alianza-fc.png', estimado: true },
  { id: 'colombia-fortaleza-ceif', nombre: 'Fortaleza CEIF', pais: 'Colombia', nc: 60, archivo: 'fortaleza-ceif.png', estimado: true },
];
