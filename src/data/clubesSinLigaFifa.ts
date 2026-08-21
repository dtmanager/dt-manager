// Pool de referencia (NO es una liga seleccionable para "empezar acá" en el menú —
// no registrado en data/ligas.ts). Clubes/campeones de federaciones chicas sin licencia FIFA (Chipre, Serbia,
// Grecia, Bulgaria, Israel, Eslovaquia, Croacia, Chequia, Kazajistán, Eslovenia,
// Bosnia y Herzegovina, Armenia, Finlandia, Macedonia del Norte, Islandia,
// Kosovo, Malta, Gibraltar) — casi todos con `nc` estimado.
// Pensado para alimentar los rivales de las competiciones internacionales (Copa
// Libertadores / Copa Sudamericana / Europa League / Conference League) cuando se
// implementen con formato real — ver el prompt de "copas nacionales e internacionales".
// `nc` sale de la misma planilla de referencia (escala FIFA/EA FC 0-100) que el resto de
// las ligas del juego; los marcados `estimado: true` no tienen licencia FIFA.
import type { ClubBase } from './clubesLigaProfesional';

export const RUTA_ESCUDOS_SIN_LIGA_FIFA = '/assets/escudos/sin-liga-fifa/';

export const CLUBES_SIN_LIGA_FIFA: ClubBase[] = [
  { id: 'sinliga-crvena-zvezda-estrella-roja', nombre: 'Crvena Zvezda (Estrella Roja)', pais: 'Serbia', nc: 68, archivo: 'crvena-zvezda-estrella-roja.svg', estimado: true },
  { id: 'sinliga-aek-atenas', nombre: 'AEK Atenas', pais: 'Grecia', nc: 68, archivo: 'aek-atenas.svg', estimado: true },
  { id: 'sinliga-ludogorets', nombre: 'Ludogorets', pais: 'Bulgaria', nc: 66, archivo: 'ludogorets.svg', estimado: true },
  { id: 'sinliga-maccabi-tel-aviv', nombre: 'Maccabi Tel-Aviv', pais: 'Israel', nc: 66, archivo: 'maccabi-tel-aviv.svg', estimado: true },
  { id: 'sinliga-slovan-bratislava', nombre: 'Slovan Bratislava', pais: 'Eslovaquia', nc: 65, archivo: 'slovan-bratislava.svg', estimado: true },
  { id: 'sinliga-hnk-rijeka', nombre: 'HNK Rijeka', pais: 'Croacia', nc: 64, archivo: 'hnk-rijeka.svg', estimado: true },
  { id: 'sinliga-aek-larnaca', nombre: 'AEK Larnaca', pais: 'Chipre', nc: 63, archivo: 'aek-larnaca.svg', estimado: true },
  { id: 'sinliga-pafos-fc', nombre: 'Pafos FC', pais: 'Chipre', nc: 62, archivo: 'pafos-fc.svg', estimado: true },
  { id: 'sinliga-omonoia', nombre: 'Omonoia', pais: 'Chipre', nc: 62, archivo: 'omonoia.svg', estimado: true },
  { id: 'sinliga-sigma-olomouc', nombre: 'Sigma Olomouc', pais: 'Chequia', nc: 62, archivo: 'sigma-olomouc.svg', estimado: true },
  { id: 'sinliga-kairat-almaty', nombre: 'Kairat Almaty', pais: 'Kazajistán', nc: 60, archivo: 'kairat-almaty.svg', estimado: true },
  { id: 'sinliga-nk-celje', nombre: 'NK Celje', pais: 'Eslovenia', nc: 58, archivo: 'nk-celje.svg', estimado: true },
  { id: 'sinliga-zrinjski-mostar', nombre: 'Zrinjski Mostar', pais: 'Bosnia y Herzegovina', nc: 56, archivo: 'zrinjski-mostar.svg', estimado: true },
  { id: 'sinliga-noah', nombre: 'Noah', pais: 'Armenia', nc: 55, archivo: 'noah.svg', estimado: true },
  { id: 'sinliga-kups-kuopio', nombre: 'KuPS Kuopio', pais: 'Finlandia', nc: 55, archivo: 'kups-kuopio.svg', estimado: true },
  { id: 'sinliga-shkendija', nombre: 'Shkëndija', pais: 'Macedonia del Norte', nc: 54, archivo: 'shkendija.svg', estimado: true },
  { id: 'sinliga-breiablik', nombre: 'Breiðablik', pais: 'Islandia', nc: 52, archivo: 'breiablik.svg', estimado: true },
  { id: 'sinliga-kf-drita', nombre: 'KF Drita', pais: 'Kosovo', nc: 52, archivo: 'kf-drita.svg', estimado: true },
  { id: 'sinliga-hamrun-spartans', nombre: 'Hamrun Spartans', pais: 'Malta', nc: 50, archivo: 'hamrun-spartans.svg', estimado: true },
  { id: 'sinliga-lincoln-red-imps', nombre: 'Lincoln Red Imps', pais: 'Gibraltar', nc: 42, archivo: 'lincoln-red-imps.svg', estimado: true },
];
