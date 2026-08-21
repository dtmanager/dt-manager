// Generador de nombres de jugadores. No hay licencia para nombres reales
// de futbolistas (mismo tema que ya se había resuelto en el prototipo
// anterior) — acá se combinan nombres y apellidos comunes de cada país
// para que "suenen a reales" sin ser ninguno en particular.
//
// Bug reportado (pedido explícito): antes TODOS los jugadores generados
// (de cualquier liga del mundo) salían con nombres argentinos — un club
// alemán terminaba con jugadores llamados "Juan". Ahora generarNombreJugador
// recibe el país del club y elige el pool correspondiente.
//
// Simplificación documentada: no hay un pool dedicado para cada una de las
// ~40 nacionalidades que aparecen en los pools de relleno de las copas
// europeas/CONMEBOL (Otras ligas de Europa / Clubes sin liga en FIFA) — se
// agrupan por región lingüística/cultural cercana (PAIS_A_POOL más abajo)
// en vez de tener 40 listas de 20 nombres cada una. Los países con liga
// jugable (los 14 de PAISES_CON_LIGA) y los del pool CONMEBOL sí tienen
// pool propio, que es lo que el usuario ve de cerca todo el tiempo.

interface PoolNombres {
  nombres: string[];
  apellidos: string[];
}

const POOL_ARGENTINA: PoolNombres = {
  nombres: [
    'Braian', 'Nazareno', 'Ezequiel', 'Rodrigo', 'Walter', 'Tomás', 'Franco',
    'Nicolás', 'Matías', 'Ignacio', 'Agustín', 'Lucas', 'Gonzalo', 'Santiago',
    'Facundo', 'Emanuel', 'Joaquín', 'Bruno', 'Federico', 'Maximiliano',
  ],
  apellidos: [
    'Ferreyra', 'Quiroga', 'Painemal', 'Giménez', 'Acosta', 'Coronel',
    'Benítez', 'Aguirre', 'Herrera', 'Rojas', 'Medina', 'Cabrera', 'Ojeda',
    'Villalba', 'Sosa', 'Correa', 'Duarte', 'Paredes', 'Escobar', 'Ríos',
  ],
};

const POOL_BRASIL: PoolNombres = {
  nombres: [
    'João', 'Pedro', 'Gabriel', 'Lucas', 'Rafael', 'Bruno', 'Thiago',
    'Gustavo', 'Matheus', 'Felipe', 'Vinícius', 'Caio', 'Diego', 'Wesley',
    'Kauã', 'Murilo', 'Yuri', 'Emerson', 'Everton', 'Wallace',
  ],
  apellidos: [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Pereira', 'Almeida',
    'Ferreira', 'Rodrigues', 'Carvalho', 'Gomes', 'Martins', 'Araújo',
    'Barbosa', 'Ribeiro', 'Alves', 'Monteiro', 'Cardoso', 'Teixeira', 'Lima',
  ],
};

const POOL_INGLATERRA: PoolNombres = {
  nombres: [
    'Jack', 'Harry', 'George', 'Oliver', 'James', 'Charlie', 'Callum',
    'Ryan', 'Connor', 'Liam', 'Ethan', 'Joshua', 'Alfie', 'Freddie',
    'Archie', 'Leo', 'Jake', 'Dylan', 'Tyler', 'Reece',
  ],
  apellidos: [
    'Smith', 'Jones', 'Taylor', 'Williams', 'Brown', 'Wilson', 'Robinson',
    'Walker', 'White', 'Thompson', 'Wright', 'Green', 'Hall', 'Wood',
    'Clarke', 'Hughes', 'Edwards', 'Turner', 'Cooper', 'Baker',
  ],
};

const POOL_ESCOCIA: PoolNombres = {
  nombres: [
    'Callum', 'Jack', 'Fraser', 'Angus', 'Ewan', 'Lewis', 'Ryan', 'Cameron',
    'Kyle', 'Connor', 'Struan', 'Rory', 'Iain', 'Craig', 'Scott',
  ],
  apellidos: [
    'MacDonald', 'Campbell', 'Stewart', 'Robertson', 'Fraser', 'Wallace',
    'Ross', 'Murray', 'Reid', 'Anderson', 'Grant', 'Munro', 'Sinclair',
    'Fergusson', 'Buchanan',
  ],
};

const POOL_IRLANDA: PoolNombres = {
  nombres: [
    'Conor', 'Seán', 'Cian', 'Darragh', 'Eoin', 'Fionn', 'Oisín', 'Ronan',
    'Cathal', 'Aidan', 'Niall', 'Declan', 'Cillian',
  ],
  apellidos: [
    "O'Brien", 'Murphy', 'Kelly', "O'Sullivan", 'Walsh', 'Byrne', 'Ryan',
    "O'Connor", 'Doyle', 'McCarthy', 'Gallagher', "O'Reilly", 'Kennedy',
  ],
};

const POOL_ESPANA: PoolNombres = {
  nombres: [
    'Alejandro', 'Pablo', 'Daniel', 'Javier', 'Sergio', 'Adrián', 'Álvaro',
    'Diego', 'Hugo', 'Mario', 'Iker', 'Marcos', 'Rubén', 'Raúl', 'Carlos',
    'David', 'Jorge', 'Óscar', 'Andrés', 'Enrique',
  ],
  apellidos: [
    'García', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Fernández',
    'Ruiz', 'Díaz', 'Moreno', 'Álvarez', 'Muñoz', 'Romero', 'Navarro',
    'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Serrano',
  ],
};

const POOL_ITALIA: PoolNombres = {
  nombres: [
    'Matteo', 'Lorenzo', 'Alessandro', 'Andrea', 'Francesco', 'Marco',
    'Davide', 'Luca', 'Simone', 'Gabriele', 'Riccardo', 'Federico',
    'Antonio', 'Stefano', 'Giovanni', 'Salvatore', 'Emanuele', 'Roberto',
  ],
  apellidos: [
    'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo',
    'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca',
    'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti',
  ],
};

const POOL_ALEMANIA: PoolNombres = {
  nombres: [
    'Lukas', 'Maximilian', 'Finn', 'Paul', 'Leon', 'Jonas', 'Felix', 'Tim',
    'Niklas', 'Elias', 'Julian', 'Moritz', 'Jan', 'Tobias', 'Sebastian',
    'Florian', 'Simon', 'Philipp',
  ],
  apellidos: [
    'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner',
    'Becker', 'Hoffmann', 'Schulz', 'Koch', 'Richter', 'Bauer', 'Klein',
    'Wolf', 'Schröder', 'Neumann', 'Zimmermann',
  ],
};

const POOL_FRANCIA: PoolNombres = {
  nombres: [
    'Lucas', 'Enzo', 'Nathan', 'Hugo', 'Louis', 'Théo', 'Mathis', 'Rayan',
    'Gabriel', 'Léo', 'Maxime', 'Adam', 'Antoine', 'Kylian', 'Yanis',
    'Baptiste', 'Clément', 'Romain',
  ],
  apellidos: [
    'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
    'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel',
    'Garcia', 'David', 'Roux', 'Fournier',
  ],
};

const POOL_ESTADOS_UNIDOS: PoolNombres = {
  nombres: [
    'Ethan', 'Jacob', 'Michael', 'Tyler', 'Brandon', 'Justin', 'Austin',
    'Kevin', 'Ryan', 'Jordan', 'Cole', 'Mason', 'Dylan', 'Trevor', 'Blake',
    'Caleb', 'Logan',
  ],
  apellidos: [
    'Johnson', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Thompson', 'Harris',
    'Clark', 'Lewis', 'Walker', 'Young', 'Allen', 'King', 'Baker', 'Nelson',
    'Carter', 'Mitchell',
  ],
};

const POOL_PAISES_BAJOS: PoolNombres = {
  nombres: [
    'Daan', 'Sem', 'Lucas', 'Milan', 'Levi', 'Finn', 'Bram', 'Thijs', 'Sven',
    'Jesse', 'Ruben', 'Luuk', 'Tim', 'Stijn', 'Noud',
  ],
  apellidos: [
    'de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker',
    'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos',
    'Vos', 'Peters',
  ],
};

const POOL_BELGICA: PoolNombres = {
  nombres: [
    'Lucas', 'Arthur', 'Louis', 'Adam', 'Victor', 'Noah', 'Liam', 'Nathan',
    'Milan', 'Seppe', 'Jarne', 'Wout', 'Senne', 'Kobe',
  ],
  apellidos: [
    'Peeters', 'Janssens', 'Maes', 'Jacobs', 'Mertens', 'Willems', 'Claes',
    'Goossens', 'Wouters', 'De Smet', 'Vermeulen', 'Dubois', 'Lambert',
  ],
};

const POOL_PORTUGAL: PoolNombres = {
  nombres: [
    'João', 'Pedro', 'Rui', 'Tiago', 'Miguel', 'André', 'Bruno', 'Diogo',
    'Gonçalo', 'Ricardo', 'Rafael', 'Vasco', 'Nuno', 'Simão',
  ],
  apellidos: [
    'Silva', 'Santos', 'Ferreira', 'Pereira', 'Costa', 'Rodrigues',
    'Carvalho', 'Gomes', 'Martins', 'Sousa', 'Fernandes', 'Marques',
    'Oliveira', 'Ribeiro',
  ],
};

const POOL_TURQUIA: PoolNombres = {
  nombres: [
    'Emre', 'Mehmet', 'Mustafa', 'Burak', 'Cem', 'Ahmet', 'Kerem', 'Ozan',
    'Serkan', 'Yusuf', 'Berkay', 'Hakan', 'Kaan', 'Onur',
  ],
  apellidos: [
    'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Aydın',
    'Öztürk', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Koç',
  ],
};

const POOL_JAPON: PoolNombres = {
  nombres: [
    'Haruto', 'Ren', 'Sota', 'Yuto', 'Riku', 'Sora', 'Yuma', 'Kaito',
    'Hayato', 'Sho', 'Daiki', 'Kenta', 'Takumi', 'Yuki',
  ],
  apellidos: [
    'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto',
    'Nakamura', 'Kobayashi', 'Saito', 'Kato', 'Yoshida', 'Yamada', 'Sasaki',
  ],
};

// CONMEBOL sin liga propia cargada (Uruguay, Paraguay, Chile, Perú,
// Ecuador, Colombia, Bolivia, Venezuela): nombres hispanohablantes muy
// parecidos entre sí en la región — un único pool alcanza sin sonar falso
// (a diferencia de meter nombres argentinos en Alemania).
const POOL_HISPANOAMERICA: PoolNombres = {
  nombres: [
    'Sebastián', 'Diego', 'Andrés', 'Camilo', 'Julián', 'Cristian', 'Kevin',
    'Jhonny', 'Wilmer', 'Ronaldo', 'Jefferson', 'Anderson', 'Yerson',
    'Brayan', 'Deiby', 'Marlon', 'Yeison', 'Alexis',
  ],
  apellidos: [
    'González', 'Rodríguez', 'Pérez', 'Vargas', 'Castro', 'Rojas', 'Flores',
    'Mendoza', 'Torres', 'Vera', 'Chávez', 'Salazar', 'Guerrero', 'Reyes',
    'Cordero', 'Aguilar', 'Zambrano', 'Espinoza',
  ],
};

// Bucket regional (documentado arriba): agrupa varias nacionalidades que
// sólo aparecen como relleno de las copas UEFA (pool "Otras ligas de
// Europa" / "Clubes sin liga en FIFA"), donde no vale la pena un pool
// dedicado por país para clubes que casi no se ven de cerca.
const POOL_EUROPA_DEL_ESTE: PoolNombres = {
  nombres: [
    'Luka', 'Marko', 'Nikola', 'Ivan', 'Filip', 'Stefan', 'Petar', 'Danilo',
    'Aleksandar', 'Vuk', 'Milan', 'Dragan', 'Adrian', 'Andrei', 'Bogdan',
  ],
  apellidos: [
    'Novak', 'Petrović', 'Ivanović', 'Kovač', 'Horvat', 'Novák', 'Dvořák',
    'Kowalski', 'Nowak', 'Popescu', 'Ionescu', 'Todorov', 'Dimitrov',
    'Wiśniewski',
  ],
};

const POOL_NORDICO: PoolNombres = {
  nombres: [
    'Erik', 'Lars', 'Anders', 'Magnus', 'Oskar', 'Emil', 'Viktor', 'Henrik',
    'Nils', 'Sven', 'Mikkel', 'Jesper', 'Aksel',
  ],
  apellidos: [
    'Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Hansen', 'Larsen',
    'Nielsen', 'Virtanen', 'Korhonen', 'Björnsson', 'Pedersen', 'Kristiansen',
  ],
};

const POOL_GRECIA: PoolNombres = {
  nombres: [
    'Nikos', 'Yannis', 'Giorgos', 'Dimitris', 'Kostas', 'Panagiotis',
    'Vasilis', 'Christos', 'Antonis', 'Stavros',
  ],
  apellidos: [
    'Papadopoulos', 'Papadakis', 'Nikolaou', 'Georgiou', 'Konstantinou',
    'Ioannou', 'Vasiliou', 'Christodoulou', 'Michaelides', 'Angelopoulos',
  ],
};

const POOL_ISRAEL: PoolNombres = {
  nombres: [
    'Noam', 'Itai', 'Yosef', 'Omer', 'Daniel', 'Eitan', 'Roi', 'Amit',
    'Tomer', 'Nadav',
  ],
  apellidos: [
    'Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Azoulay', 'Dahan',
    'Avraham', 'Katz', 'Shapiro',
  ],
};

// Alias país -> pool. Cubre los 14 países con liga jugable (PAISES_CON_LIGA
// en ligas.ts) + los 8 de CONMEBOL sin liga propia + el resto de países que
// aparecen en los pools de relleno (Otras ligas de Europa / Sin liga FIFA),
// mapeados al bucket regional más parecido cuando no tienen pool propio.
const NOMBRES_POR_PAIS: Record<string, PoolNombres> = {
  Argentina: POOL_ARGENTINA,
  Uruguay: POOL_HISPANOAMERICA,
  Paraguay: POOL_HISPANOAMERICA,
  Chile: POOL_HISPANOAMERICA,
  Perú: POOL_HISPANOAMERICA,
  Ecuador: POOL_HISPANOAMERICA,
  Colombia: POOL_HISPANOAMERICA,
  Bolivia: POOL_HISPANOAMERICA,
  Venezuela: POOL_HISPANOAMERICA,
  Brasil: POOL_BRASIL,
  Inglaterra: POOL_INGLATERRA,
  Gibraltar: POOL_INGLATERRA,
  Escocia: POOL_ESCOCIA,
  Irlanda: POOL_IRLANDA,
  España: POOL_ESPANA,
  Italia: POOL_ITALIA,
  Malta: POOL_ITALIA,
  Alemania: POOL_ALEMANIA,
  Austria: POOL_ALEMANIA,
  Suiza: POOL_ALEMANIA,
  Francia: POOL_FRANCIA,
  'Estados Unidos': POOL_ESTADOS_UNIDOS,
  'Países Bajos': POOL_PAISES_BAJOS,
  Bélgica: POOL_BELGICA,
  Portugal: POOL_PORTUGAL,
  Turquía: POOL_TURQUIA,
  Japón: POOL_JAPON,
  Croacia: POOL_EUROPA_DEL_ESTE,
  Serbia: POOL_EUROPA_DEL_ESTE,
  'Bosnia y Herzegovina': POOL_EUROPA_DEL_ESTE,
  Eslovenia: POOL_EUROPA_DEL_ESTE,
  Eslovaquia: POOL_EUROPA_DEL_ESTE,
  Chequia: POOL_EUROPA_DEL_ESTE,
  Bulgaria: POOL_EUROPA_DEL_ESTE,
  'Macedonia del Norte': POOL_EUROPA_DEL_ESTE,
  Kosovo: POOL_EUROPA_DEL_ESTE,
  Rumania: POOL_EUROPA_DEL_ESTE,
  Polonia: POOL_EUROPA_DEL_ESTE,
  Armenia: POOL_EUROPA_DEL_ESTE,
  Kazajistán: POOL_EUROPA_DEL_ESTE,
  Suecia: POOL_NORDICO,
  Noruega: POOL_NORDICO,
  Dinamarca: POOL_NORDICO,
  Finlandia: POOL_NORDICO,
  Islandia: POOL_NORDICO,
  Grecia: POOL_GRECIA,
  Chipre: POOL_GRECIA,
  Israel: POOL_ISRAEL,
};

// `pais` es opcional para no romper llamadas viejas — sin país (o uno sin
// pool conocido) cae en el pool de Argentina, mismo comportamiento que
// había antes de este fix.
export function generarNombreJugador(pais?: string): string {
  const pool = (pais && NOMBRES_POR_PAIS[pais]) || POOL_ARGENTINA;
  const nombre = pool.nombres[Math.floor(Math.random() * pool.nombres.length)];
  const apellido = pool.apellidos[Math.floor(Math.random() * pool.apellidos.length)];
  return `${nombre} ${apellido}`;
}

// Bug reportado: ids duplicados dentro de una misma sesión de juego
// (`jugador-msnivcow-43` repetido). La versión anterior combinaba
// Date.now() con un contador `let` a nivel de módulo — ese contador por sí
// solo ya garantizaba unicidad dentro de UNA instancia del módulo, así que
// la única forma de que colisionara era que existieran dos closures de
// `contador` vivos a la vez (p. ej. un módulo re-instanciado por HMR de
// Vite en medio de una sesión de testing con guardado en caliente, mientras
// otra parte del grafo todavía referenciaba la instancia vieja). Usar
// crypto.randomUUID() saca a `idUnico` de tener que depender de estado de
// módulo mutable, así no hay nada que un reload/HMR pueda desincronizar.
export function idUnico(prefijo: string): string {
  return `${prefijo}-${crypto.randomUUID()}`;
}
