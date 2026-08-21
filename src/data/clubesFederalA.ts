// Clubes reales de Torneo Federal A (tercera división del interior del
// país — pedido explícito: "agrega el federal a... con sus respectivos
// trofeos"). Sin valoración FIFA para esta categoría (`estimado: true` en
// todos, mismo criterio que clubesChampionshipInglaterra.ts) — nc
// estimado a ojo, en el mismo escalón que Primera B Metropolitana (ambas
// son la tercera división real, en zonas paralelas — acá se cargan como
// dos ligas jugables aparte, no como ida y vuelta de ascenso/descenso
// entre sí, porque el motor de ascenso/descenso (competicionesConfig.ts,
// LIGA_INFERIOR_DE) sólo soporta UNA liga inferior por superior, no dos en
// paralelo). `archivo` apunta a public/assets/escudos/torneo-federal-a/
// (todavía no están bajados los escudos, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_FEDERAL_A = '/assets/escudos/torneo-federal-a/';

export const CLUBES_FEDERAL_A: ClubBase[] = [
  { id: 'federal-gimnasia-mendoza', nombre: 'Gimnasia y Esgrima (Mendoza)', pais: 'Argentina', nc: 45, archivo: 'gimnasia-mendoza.png', estimado: true },
  { id: 'federal-sportivo-belgrano', nombre: 'Sportivo Belgrano (San Francisco)', pais: 'Argentina', nc: 42, archivo: 'sportivo-belgrano.png', estimado: true },
  { id: 'federal-sportivo-estudiantes', nombre: 'Sportivo Estudiantes (San Luis)', pais: 'Argentina', nc: 40, archivo: 'sportivo-estudiantes.png', estimado: true },
  { id: 'federal-deportivo-roca', nombre: 'Deportivo Roca', pais: 'Argentina', nc: 41, archivo: 'deportivo-roca.png', estimado: true },
  { id: 'federal-camioneros', nombre: 'Camioneros', pais: 'Argentina', nc: 43, archivo: 'camioneros.png', estimado: true },
  { id: 'federal-independiente-chivilcoy', nombre: 'Independiente (Chivilcoy)', pais: 'Argentina', nc: 39, archivo: 'independiente-chivilcoy.png', estimado: true },
  { id: 'federal-boca-unidos', nombre: 'Boca Unidos', pais: 'Argentina', nc: 44, archivo: 'boca-unidos.png', estimado: true },
  { id: 'federal-sarmiento-resistencia', nombre: 'Sarmiento (Resistencia)', pais: 'Argentina', nc: 40, archivo: 'sarmiento-resistencia.png', estimado: true },
  { id: 'federal-crucero-del-norte', nombre: 'Crucero del Norte', pais: 'Argentina', nc: 42, archivo: 'crucero-del-norte.png', estimado: true },
  { id: 'federal-guarani-antonio-franco', nombre: 'Guaraní Antonio Franco', pais: 'Argentina', nc: 40, archivo: 'guarani-antonio-franco.png', estimado: true },
  { id: 'federal-sol-de-america', nombre: 'Sol de América (Formosa)', pais: 'Argentina', nc: 38, archivo: 'sol-de-america.png', estimado: true },
  { id: 'federal-juventud-unida-universitario', nombre: 'Juventud Unida Universitario', pais: 'Argentina', nc: 41, archivo: 'juventud-unida-universitario.png', estimado: true },
  { id: 'federal-union-sunchales', nombre: 'Unión (Sunchales)', pais: 'Argentina', nc: 39, archivo: 'union-sunchales.png', estimado: true },
  { id: 'federal-sportivo-penarol', nombre: 'Sportivo Peñarol (San Juan)', pais: 'Argentina', nc: 42, archivo: 'sportivo-penarol.png', estimado: true },
  { id: 'federal-desamparados', nombre: 'Desamparados (San Juan)', pais: 'Argentina', nc: 41, archivo: 'desamparados.png', estimado: true },
  { id: 'federal-douglas-haig', nombre: 'Douglas Haig', pais: 'Argentina', nc: 40, archivo: 'douglas-haig.png', estimado: true },
  { id: 'federal-kimberley', nombre: 'Kimberley', pais: 'Argentina', nc: 41, archivo: 'kimberley.png', estimado: true },
  { id: 'federal-racing-olavarria', nombre: 'Racing (Olavarría)', pais: 'Argentina', nc: 39, archivo: 'racing-olavarria.png', estimado: true },
  { id: 'federal-huracan-las-heras', nombre: 'Huracán Las Heras', pais: 'Argentina', nc: 38, archivo: 'huracan-las-heras.png', estimado: true },
  { id: 'federal-villa-mitre', nombre: 'Villa Mitre', pais: 'Argentina', nc: 40, archivo: 'villa-mitre.png', estimado: true },
  { id: 'federal-alvarado', nombre: 'Alvarado (Mar del Plata)', pais: 'Argentina', nc: 43, archivo: 'alvarado.png', estimado: true },
  { id: 'federal-sportivo-las-parejas', nombre: 'Sportivo Las Parejas', pais: 'Argentina', nc: 38, archivo: 'sportivo-las-parejas.png', estimado: true },
  { id: 'federal-9-de-julio-rafaela', nombre: '9 de Julio (Rafaela)', pais: 'Argentina', nc: 39, archivo: '9-de-julio-rafaela.png', estimado: true },
  { id: 'federal-defensores-villa-ramallo', nombre: 'Defensores de Villa Ramallo', pais: 'Argentina', nc: 37, archivo: 'defensores-villa-ramallo.png', estimado: true },
];
