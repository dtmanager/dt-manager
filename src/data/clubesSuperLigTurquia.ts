// Clubes reales de Süper Lig (Turquía) para el modo carrera. `nc` sale de la misma
// planilla de referencia (escala FIFA/EA FC 0-100, EA Sports FC 26) usada para el resto
// de las ligas del juego. Los clubes marcados `estimado: true` no tienen licencia FIFA
// (no hay valoración oficial) y su `nc` es una estimación razonada, no un dato sacado
// de FIFA Index. `archivo` apunta a public/assets/escudos/super-lig-turquia/ (los escudos
// todavía no están bajados — hay que agregarlos ahí con el nombre que indica cada `archivo`;
// el <img> del menú simplemente no se ve hasta entonces, no rompe nada).
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_SUPER_LIG_TURQUIA = '/assets/escudos/super-lig-turquia/';

export const CLUBES_SUPER_LIG_TURQUIA: ClubBase[] = [
  { id: 'turquia-galatasaray', nombre: 'Galatasaray', pais: 'Turquia', nc: 79, archivo: 'galatasaray.png' },
  { id: 'turquia-fenerbahce', nombre: 'Fenerbahçe', pais: 'Turquia', nc: 78, archivo: 'fenerbahce.png' },
  { id: 'turquia-besiktas', nombre: 'Beşiktaş', pais: 'Turquia', nc: 74, archivo: 'besiktas.png' },
  { id: 'turquia-trabzonspor', nombre: 'Trabzonspor', pais: 'Turquia', nc: 73, archivo: 'trabzonspor.png' },
  { id: 'turquia-samsunspor', nombre: 'Samsunspor', pais: 'Turquia', nc: 71, archivo: 'samsunspor.png' },
  { id: 'turquia-istanbul-basaksehir-fk', nombre: 'İstanbul Başakşehir FK', pais: 'Turquia', nc: 71, archivo: 'istanbul-basaksehir-fk.png' },
  { id: 'turquia-goztepe', nombre: 'Göztepe', pais: 'Turquia', nc: 69, archivo: 'goztepe.png' },
  { id: 'turquia-kocaelispor', nombre: 'Kocaelispor', pais: 'Turquia', nc: 69, archivo: 'kocaelispor.png' },
  { id: 'turquia-konyaspor', nombre: 'Konyaspor', pais: 'Turquia', nc: 69, archivo: 'konyaspor.png' },
  { id: 'turquia-gaziantep-fk', nombre: 'Gaziantep FK', pais: 'Turquia', nc: 69, archivo: 'gaziantep-fk.png' },
  { id: 'turquia-kasmpasa', nombre: 'Kasımpaşa', pais: 'Turquia', nc: 69, archivo: 'kasmpasa.png' },
  { id: 'turquia-antalyaspor', nombre: 'Antalyaspor', pais: 'Turquia', nc: 68, archivo: 'antalyaspor.svg' },
  { id: 'turquia-kayserispor', nombre: 'Kayserispor', pais: 'Turquia', nc: 68, archivo: 'kayserispor.svg' },
  { id: 'turquia-caykur-rizespor', nombre: 'Çaykur Rizespor', pais: 'Turquia', nc: 68, archivo: 'caykur-rizespor.png' },
  { id: 'turquia-corendon-alanyaspor', nombre: 'Corendon Alanyaspor', pais: 'Turquia', nc: 68, archivo: 'corendon-alanyaspor.png' },
  { id: 'turquia-genclerbirligi', nombre: 'Gençlerbirliği', pais: 'Turquia', nc: 67, archivo: 'genclerbirligi.png' },
  { id: 'turquia-fatih-karagumruk-s-k', nombre: 'Fatih Karagümrük S.K.', pais: 'Turquia', nc: 67, archivo: 'fatih-karagumruk-s-k.svg' },
  { id: 'turquia-eyupspor', nombre: 'Eyüpspor', pais: 'Turquia', nc: 65, archivo: 'eyupspor.png' },
];
