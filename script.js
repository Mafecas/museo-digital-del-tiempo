/* =========================================================
   ARCHIVO DEL TIEMPO — script.js
   Datos de la colección, navegación, galería y expedientes
   ========================================================= */
import { createIntroScene, ModelViewer, prefersMobileModel, createShowcase, createDepthPortrait } from './viewer.js';

const EDICION = window.AT_EDICION || 'completa';        // 'completa' (versión B) | 'ligera' (versión A)
const EMBED = window.AT_ASSETS || null;                   // recursos incrustados (solo versión A)
const asset = (p) => (EMBED && EMBED[p]) || p;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const inFrame = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();

/* ---------------------------------------------------------
   DATOS DE LA COLECCIÓN
   Los datos de las fichas 01–09 se transcriben tal como fueron suministrados.
   La ficha 10 (televisor) es una redacción curatorial: medidas estimadas del modelo,
   contexto histórico de la tecnología Trinitron y descripción de lo que muestran las fotos.
   Los datos de malla se obtuvieron directamente de los archivos OBJ/JPG/GLB.
   --------------------------------------------------------- */
const OBJECTS = [
  {
    id: 'carrito', n: '01', exp: 'AT-2026-001', name: 'Carrito rojo',
    category: 'Juguete de colección',
    expo: 'Una pequeña máquina de recuerdos',
    phrase: 'Los juguetes guardan la escala exacta de la infancia.',
    card: 'Réplica a escala de un automóvil clásico, con puertas abatibles y llantas de banda blanca.',
    text: [
      'Esta réplica a escala reproduce un automóvil de líneas clásicas: carrocería roja, guardabarros y estribos negros, llantas de banda blanca y puertas que se abren para mostrar el interior en tono crema. En la reconstrucción las puertas quedaron abiertas, lo que permite leer el volumen del habitáculo.',
      'Como objeto de colección, el carrito condensa una memoria afectiva: el juego, la miniatura y la fascinación por los automóviles de otra época. Su registro fotogramétrico conserva la forma y también las pequeñas marcas de la pintura y los relieves de las piezas.',
      'Las superficies brillantes y los huecos estrechos —como el espacio entre las puertas y la carrocería— son un reto habitual para la fotogrametría; un registro denso de fotografías ayuda a cubrir esos ángulos difíciles.',
    ],
    photos: 712, sharp: '99 %',
    sheet: [],
    mesh: { v: 499126, f: 999999, lite: 44771, tris: 808611, mb: '13,9 MB' }, view: { az: 0, el: 38, zoom: 1.0 },
    enh: { spots: 209 }, img: 'assets/images/carrito.png', ar: '526/297',
  },
  {
    id: 'telefono', n: '02', exp: 'AT-2026-002', name: 'Teléfono Sony Ericsson',
    category: 'Memoria tecnológica',
    expo: 'Cuando abrir un teléfono era parte de la conversación',
    phrase: 'Antes de deslizar, se abría: cada llamada empezaba con un gesto.',
    card: 'Teléfono plegable tipo concha, con teclado numérico, bisagra y pantalla interna.',
    text: [
      'Teléfono móvil de formato plegable —conocido como «concha»— reconstruido con la tapa abierta. Se distinguen el teclado numérico, la tecla de navegación central, la bisagra cilíndrica y la pantalla interna.',
      'Sony Ericsson fue la empresa conjunta de Sony y Ericsson que, entre 2001 y 2012, fabricó teléfonos que acompañaron el paso del celular básico al multimedia. Este ejemplar representa una generación en la que abrir el teléfono era el comienzo de cada conversación.',
      'La geometría registra el desgaste de las teclas y del acabado plateado. Las superficies oscuras y reflectivas, como la pantalla, son más difíciles de reconstruir y presentan menos detalle que el cuerpo del teléfono.',
    ],
    photos: 501, sharp: '97 %',
    sheet: [],
    mesh: { v: 499234, f: 999999, lite: 45217, tris: 754984, mb: '14,2 MB' }, view: { az: 135, el: 42, zoom: 1.0 },
    enh: { spots: 256 }, img: 'assets/images/telefono.png', ar: '795/645',
  },
  {
    id: 'sombrero', n: '03', exp: 'AT-2026-003', name: 'Sombrero Barbisio',
    category: 'Indumentaria, identidad y patrimonio',
    expo: 'La identidad también se conserva en los objetos',
    phrase: 'Un sombrero guarda la forma de quien lo llevó.',
    card: 'Sombrero de fieltro oscuro, de copa hendida y ala corta, con cinta en la base de la copa.',
    text: [
      'Sombrero de fieltro oscuro, de copa con hendidura central y ala corta, rodeado por una cinta en la base de la copa. La reconstrucción conserva la textura del fieltro y las deformaciones propias del uso.',
      'Barbisio es una casa sombrerera de origen italiano cuya fundación suele fecharse en 1862 y que estableció fábrica en Bogotá a mediados del siglo XX; sus sombreros forman parte de la memoria del vestir en Colombia. <strong>Esa fecha corresponde a la historia de la marca y no a esta pieza</strong>, cuya fecha de fabricación no está documentada.',
      'Con 703 fotografías y una nitidez reportada del 100 %, es el registro de mayor nitidez de la colección. Algunas zonas del borde del ala, donde el fieltro oscuro ofrece poco contraste, aparecen incompletas en la malla.',
    ],
    photos: 703, sharp: '100 %',
    sheet: [],
    mesh: { v: 499049, f: 1000000, lite: 45815, tris: 833383, mb: '14,4 MB' }, view: { az: 135, el: 50, zoom: 1.0 },
    enh: { spots: 404 }, img: 'assets/images/sombrero.png', ar: '493/387',
  },
  {
    id: 'reloj', n: '04', exp: 'AT-2026-004', name: 'Reloj de pulsera',
    category: 'Tiempo y memoria',
    expo: 'Las horas pasan. Las huellas permanecen.',
    phrase: 'Un reloj mide el tiempo, pero también lo acumula.',
    card: 'Reloj de esfera dorada y correa de cuero oscuro, con las marcas de su uso.',
    text: [
      'Reloj de pulsera de caja redonda, con esfera de tono dorado, índices y agujas, y una correa de cuero oscuro que conserva la curvatura de la muñeca que la llevó.',
      'Más que un instrumento, es un objeto de memoria material: las marcas de uso en la caja, el desgaste de la correa y la pátina de la esfera son huellas del tiempo vivido. La reconstrucción tridimensional permite observarlas desde ángulos que la fotografía convencional no alcanza.',
      'El registro incluye información de georreferenciación en WGS 84 con alturas elipsoidales, reportada en la ficha técnica.',
    ],
    photos: 372, sharp: '99 %',
    sheet: [
      ['Tamaño del registro', '291,18 MB'],
      ['Precisión horizontal GPS', '3,65 m'],
      ['Precisión vertical GPS', '3,09 m'],
      ['Sistema de referencia', 'WGS 84'],
      ['Referencia altimétrica', 'Altura elipsoidal'],
    ],
    mesh: { v: 499502, f: 1000000, lite: 31196, tris: 313640, mb: '9,9 MB' }, view: { az: 270, el: 22, zoom: 1.0 },
    enh: { spots: 48 }, img: 'assets/images/reloj.png', ar: '504/322',
  },
  {
    id: 'plancha', n: '05', exp: 'AT-2026-005', name: 'Plancha antigua',
    category: 'Patrimonio doméstico y memoria cotidiana',
    expo: 'El peso de la historia en un objeto cotidiano',
    phrase: 'Lo cotidiano también es patrimonio: en el trabajo diario se escribe la historia.',
    card: 'Plancha de cuerpo metálico y mango de madera, con las huellas del uso doméstico.',
    text: [
      'Plancha de estructura metálica, con cuerpo hueco, chimenea frontal y mango de madera sostenido por un soporte curvo. El metal muestra manchas, opacidades y pequeñas irregularidades; la madera del mango conserva el desgaste de las manos que la sostuvieron.',
      'Como objeto de patrimonio doméstico, remite al trabajo cotidiano del hogar, con frecuencia ausente de los relatos históricos. <strong>Este expediente no atribuye antigüedad, marca, lugar de fabricación ni procedencia</strong>: documenta lo que el objeto muestra.',
      'El contraste entre el metal y la madera hace visibles sus materiales en el modelo; en el modo «Geometría» del visor puede apreciarse la estructura metálica sin el color de la textura.',
    ],
    photos: 701, sharp: '99 %',
    sheet: [
      ['Tamaño del registro', '365,94 MB'],
      ['Precisión horizontal GPS', '3,49 m'],
      ['Precisión vertical GPS', '4,36 m'],
      ['Sistema de referencia', 'WGS 84'],
      ['Referencia altimétrica', 'Altura elipsoidal'],
    ],
    mesh: { v: 499331, f: 999999, lite: 40747, tris: 574531, mb: '12,2 MB' }, view: { az: 225, el: 18, zoom: 1.05 },
    enh: { spots: 108 }, img: 'assets/images/plancha.png', ar: '478/459',
  },
  {
    id: 'joyero', n: '06', exp: 'AT-2026-006', name: 'Pequeño joyero',
    category: 'Objeto personal y ornamental',
    expo: 'Lo pequeño también guarda lo valioso',
    phrase: 'Un joyero no guarda solo objetos: guarda lo que no queremos perder.',
    card: 'Joyero circular de tapa azul con un motivo de lazos entrelazados en tono claro.',
    text: [
      'Pequeño joyero de forma circular. La tapa presenta un campo azul con un motivo ornamental de lazos entrelazados en tono claro; el cuerpo, de borde redondeado y tono dorado claro, muestra desgaste visible en su superficie.',
      'Como objeto personal, el joyero pertenece al ámbito de lo íntimo: guarda piezas pequeñas cargadas de afecto. <strong>Este expediente no atribuye material, marca, antigüedad ni procedencia</strong>: documenta lo que el objeto muestra.',
      'El registro de 652 fotografías, con una nitidez reportada del 99 %, permite leer el relieve del motivo de la tapa; en el visor puede apreciarse mejor con el modo «Geometría» y la luz rasante.',
    ],
    photos: 652, sharp: '99 %',
    sheet: [
      ['Tamaño del registro', '457,76 MB'],
      ['Precisión horizontal GPS', '4,24 m'],
      ['Precisión vertical GPS', '3,6 m'],
      ['Sistema de referencia', 'WGS 84'],
      ['Referencia altimétrica', 'Altura elipsoidal'],
    ],
    mesh: { v: 499753, f: 1000000, lite: 36315, tris: 121335, mb: '7,4 MB' }, view: { az: 0, el: 40, zoom: 1.0 },
    enh: { spots: 60 }, img: 'assets/images/joyero.png', ar: '327/306',
  },
  {
    id: 'cds', n: '07', exp: 'AT-2026-007', name: 'Estuche de CD «Rincón Bohemio»',
    category: 'Memoria musical',
    expo: 'La música también se guarda en un estuche',
    phrase: 'Hay canciones que solo suenan completas cuando se recuerdan.',
    card: 'Estuche abierto de una colección de discos compactos, con portada impresa: gramófono, caballos y retratos.',
    text: [
      'Estuche impreso de una colección de discos compactos, reconstruido abierto y de pie, en forma de V. La portada muestra el título «Rincón Bohemio», las leyendas «Colección Estelar», «Edición limitada» y «3 CD’s», la ilustración de un gramófono, dos caballos y una fila de retratos bajo el lema «Los más grandes éxitos del recuerdo».',
      'Como objeto de memoria musical, remite a una manera de escuchar y coleccionar música —el disco físico, la portada, la colección como objeto— que las plataformas digitales han ido reemplazando. <strong>Este expediente no atribuye año de edición, sello ni procedencia</strong>: documenta lo que el objeto muestra.',
      'La reconstrucción registra con nitidez la portada y la cara interior impresa del estuche; las zonas que no aparecen en las fotografías no forman parte del modelo. Por tratarse de una superficie impresa con texto e imágenes, en esta pieza no se aplicó la reparación automática de manchas, para no alterar la gráfica.',
    ],
    photos: null, sharp: null, pending: true,
    sheet: [],
    mesh: { v: 498480, f: 999999, lite: 50807, tris: 711119, mb: '12,8 MB' }, view: { az: 315, el: 18, zoom: 1.0 },
    enh: { spots: 0 }, img: 'assets/images/cds.png', ar: '599/519',
  },
  {
    id: 'billetes', n: '08', exp: 'AT-2026-008', name: 'Billetes de 20 y 50 pesos oro',
    category: 'Numismática y memoria económica',
    expo: 'El valor también cambia con el tiempo',
    phrase: 'Un billete fuera de circulación ya no compra nada, pero todavía cuenta una historia.',
    card: 'Dos billetes colombianos de 20 y 50 pesos oro del Banco de la República, de pie sobre la mesa.',
    text: [
      'Dos billetes del Banco de la República, de pie sobre la mesa y con el doblez del uso. El de <strong>50 pesos oro</strong>, en tonos violeta, lleva el retrato de Camilo Torres, el número de serie 45077390 en rojo y la fecha «Bogotá, 7 de agosto de 1981»; en el reverso, orquídeas colombianas y el escudo nacional.',
      'El de <strong>20 pesos oro</strong>, en verde y gris, muestra a Francisco José de Caldas con un globo terráqueo, la serie 33922890 y la fecha «enero 1º de 1983»; su reverso reúne piezas del Museo del Oro y el sello del Banco de la República entre dos medallones verdes con la cifra 20.',
      'Como objetos de memoria económica, recuerdan cuánto cambia el valor del dinero con el tiempo: billetes que circularon en la vida cotidiana y hoy se conservan como piezas de colección. El modelo permite recorrer el anverso y el reverso de cada uno, con las firmas, las guilloches y las marcas del papel.',
    ],
    photos: 700, sharp: '98 %',
    sheet: [
      ['Tamaño del registro', '439,85 MB'],
      ['Precisión horizontal GPS', '12,36 m'],
      ['Precisión vertical GPS', '30 m'],
      ['Sistema de referencia', 'WGS 84'],
      ['Referencia altimétrica', 'Altura elipsoidal'],
    ],
    mesh: { v: 486239, f: 999999, lite: 65388, tris: 651531, mb: '8,1 MB', orig: '2576 × 2576 px', tex: 'Alta resolución · 2048 px por cara' },
    view: { az: 15, el: 12, zoom: 0.75 },
    enh: {
      spots: 0, 
      rows: [
        ['Billetes', 'Láminas delgadas con la curvatura y el doblez registrados'],
        ['Textura', 'Anverso y reverso en alta resolución'],
        ['Detalle legible', 'Leyendas, series, fechas y firmas'],
        ['Base', 'Recorte circular · huecos de la mesa cubiertos'],
      ],
      note: 'Los billetes se presentan como láminas delgadas que conservan la curvatura y el doblez registrados en la captura; cada cara lleva su textura en alta resolución, con la luz nivelada y la nitidez realzada. La mesa se recortó a una base circular sobre el pedestal.',
    },
    img: 'assets/images/billetes.jpg', ar: '720/410', imgLabel: 'Reconstrucción 3D',
  },
  {
    id: 'tasita', n: '09', exp: 'AT-2026-009', name: 'Tasita indígena',
    category: 'Artesanía y memoria ancestral',
    expo: 'La mano que decora también escribe',
    phrase: 'En una pieza pequeña cabe la memoria de un pueblo entero.',
    card: 'Cuenco bajo de boca estrecha, pintado a mano en negro con pétalos y círculos blancos, rojos, amarillos y verdes.',
    text: [
      'Cuenco bajo de cuerpo redondeado y boca estrecha, de unos 7,4 cm de diámetro y 3,5 cm de alto. La superficie está pintada a mano sobre fondo negro: una banda de pétalos puntiagudos en blanco, amarillo, naranja y verde rodea el hombro, y bajo ella una corrida de círculos blancos con un punto rojo en el centro. El interior es de barro ocre, sin pintar.',
      'La decoración, repetida con pequeñas variaciones en cada módulo, muestra el trazo de la mano que la pintó: ningún pétalo es idéntico al siguiente. <strong>Este expediente no atribuye pueblo, región ni antigüedad a la pieza</strong>; documenta su forma, su decoración y su estado.',
      'La captura no alcanzó la parte baja del cuerpo ni el interior, porque la pieza se apoya sobre la mesa y la boca es estrecha. Al ser una pieza de revolución, el modelo se completó girando el perfil medido sobre su propio eje.',
    ],
    photos: 807, sharp: '99 %',
    sheet: [
      ['Tamaño del registro', '342,72 MB'],
      ['Precisión horizontal GPS', '5,53 m'],
      ['Precisión vertical GPS', '4,33 m'],
      ['Sistema de referencia', 'WGS 84'],
      ['Referencia altimétrica', 'Altura elipsoidal'],
    ],
    mesh: { v: 498457, f: 1000000, lite: 98868, tris: 991966, mb: '8,5 MB', orig: '2576 × 2576 px', tex: 'Desenrollado cilíndrico · 2048 px' },
    view: { az: 200, el: 30, zoom: 0.95 },
    enh: {
      spots: 0,
      rows: [
        ['Eje de revolución', 'Ajustado por mínimos cuadrados sobre la malla'],
        ['Perfil', 'Medido entre el hombro y la panza; base e interior completados'],
        ['Textura', 'Desenrollado cilíndrico de la textura original, realzado'],
        ['Decoración', 'La pintada real, sin repetir ni inventar módulos'],
      ],
      note: 'La pieza es una superficie de revolución: se ajustó su eje, se midió el perfil en la zona reconstruida y se completó la parte baja del cuerpo, la base y el interior girando ese perfil. La decoración proviene de la textura original de Pix4D, desenrollada sobre el nuevo cuerpo y realzada en nitidez y color; no se repitió ni se inventó ningún módulo del diseño.',
    },
    img: 'assets/images/tasita.jpg', ar: '700/440', imgLabel: 'Reconstrucción 3D',
  },
  {
    id: 'televisor', n: '10', exp: 'AT-2026-010', name: 'Televisor Sony Trinitron', kind: 'estudio',
    category: 'Memoria audiovisual',
    expo: 'La ventana por la que entraba el mundo',
    phrase: 'Antes de las pantallas planas, la familia se sentaba frente a una caja que pesaba lo que pesaban las noticias.',
    card: 'Televisor de tubo de 14 pulgadas, gabinete gris carbón, panel de control frontal y entradas de audio y video traseras.',
    text: [
      'Televisor de tubo de rayos catódicos (CRT) de 14 pulgadas, con gabinete de plástico gris carbón. Al frente, la pantalla de vidrio ligeramente abombada, el logotipo <strong>SONY</strong> bajo el cristal y la leyenda <strong>Trinitron</strong> en la esquina superior; abajo, una franja reúne las entradas de video y audio, los botones de volumen y de canal y el encendido. A los costados, las rejillas de los parlantes.',
      'Trinitron fue la tecnología de tubo de imagen que Sony presentó en 1968: en lugar de la máscara de agujeros de los televisores convencionales, usaba una rejilla de hilos verticales, lo que daba una imagen más brillante y una pantalla curva solo en sentido horizontal. Los televisores pequeños de este tipo llegaron a las cocinas, los cuartos y los consultorios a finales del siglo XX.',
      'El modelo conserva el aspecto de una reconstrucción fotogramétrica: bordes irregulares, superficies con grano y una base de terreno recortada.',
    ],
    photos: null, sharp: null,
    sheet: [
      ['Tamaño de pantalla', '14″ (35 cm) · relación 4:3'],
      ['Tecnología', 'Tubo de rayos catódicos Trinitron'],
      ['Conectores traseros', 'Antena, RF, video y audio (RCA)'],
      ['Nube de puntos', '258 783 puntos con color (PLY)'],
    ],
    mesh: { v: 313179, f: 551200, mb: '29,1 MB' }, view: { az: 330, el: 16, zoom: 0.95 },
    img: 'assets/images/televisor.jpg', ar: '1000/760', imgLabel: 'Modelo 3D',
  },
  {
    id: 'radio', n: '11', exp: 'AT-2026-011', name: 'Radio de mesa', kind: 'estudio',
    category: 'Memoria sonora',
    expo: 'Cuando la casa entera escuchaba la misma voz',
    phrase: 'Antes de la televisión, las noticias, las radionovelas y los partidos entraban por una caja de madera.',
    card: 'Radio de válvulas con gabinete de madera, dial iluminado, rejilla de tela y tres perillas.',
    text: [
      'Radio de mesa con gabinete de madera de esquinas redondeadas. En el frente, una rejilla de tela cubre el parlante; a su derecha, el dial iluminado muestra la escala de estaciones en onda media y onda corta, y abajo tres perillas oscuras sirven para el volumen, la sintonía y el cambio de banda.',
      'Los receptores de este tipo funcionaban con válvulas de vacío que tardaban unos segundos en calentarse antes de sonar. Durante buena parte del siglo XX ocuparon un lugar fijo en la sala o en la cocina: alrededor de ellos se escucharon radionovelas, transmisiones de fútbol, música popular y los anuncios del país.',
      'El modelo tiene el acabado de una reconstrucción fotogramétrica: la madera conserva sus vetas y su desgaste, el dial su brillo cálido y la base un terreno de borde irregular.',
    ],
    photos: null, sharp: null,
    sheet: [
      ['Material del gabinete', 'Madera'],
      ['Bandas del dial', 'Onda media y onda corta'],
      ['Controles', 'Tres perillas frontales'],
      ['Nube de puntos', '254 194 puntos con color (PLY)'],
    ],
    mesh: { v: 306351, f: 549032, mb: '30,0 MB' }, view: { az: 335, el: 14, zoom: 0.95 },
    img: 'assets/images/radio.jpg', ar: '1000/760', imgLabel: 'Modelo 3D',
  },
  {
    id: 'maquina', n: '12', exp: 'AT-2026-012', name: 'Máquina de escribir', kind: 'estudio',
    category: 'Memoria de la escritura',
    expo: 'Cada letra dejaba una marca que no se podía borrar',
    phrase: 'En una máquina de escribir, equivocarse costaba una hoja entera.',
    card: 'Máquina de escribir de escritorio, cuerpo de hierro negro, teclas redondas y carro con rodillo.',
    text: [
      'Máquina de escribir de escritorio con estructura de hierro fundido pintada de negro y filetes dorados. Al frente, cuatro hileras de teclas redondas con aro metálico; detrás, la canasta de tipos en abanico, la cinta y el carro con su rodillo y la palanca de retorno.',
      'Durante buena parte del siglo XX estas máquinas ocuparon oficinas, notarías, juzgados, redacciones y casas: con ellas se escribieron cartas, contratos, tesis y periódicos. La disposición del teclado, heredada de ellas, sigue presente en los computadores de hoy.',
      'El modelo conserva el aspecto de una reconstrucción fotogramétrica: el metal muestra su desgaste y las teclas la pátina del uso, sobre una base de terreno de borde irregular.',
    ],
    photos: null, sharp: null,
    sheet: [
      ['Estructura', 'Hierro fundido pintado'],
      ['Teclado', 'Cuatro hileras de teclas redondas'],
      ['Mecanismo', 'Canasta de tipos en abanico, carro con rodillo'],
      ['Nube de puntos', '293 664 puntos con color (PLY)'],
    ],
    mesh: { v: 364960, f: 547040, mb: '29,7 MB' }, view: { az: 335, el: 26, zoom: 0.95 },
    img: 'assets/images/maquina.jpg', ar: '1000/760', imgLabel: 'Modelo 3D',
  },
  {
    id: 'telefono-disco', n: '13', exp: 'AT-2026-013', name: 'Teléfono de disco', kind: 'estudio',
    category: 'Memoria tecnológica',
    expo: 'Marcar era girar y esperar a que el disco volviera',
    phrase: 'Cada número tenía su tiempo: el cero era el más largo.',
    card: 'Teléfono rojo de mesa con disco de marcar, auricular sobre la horquilla y cable en espiral.',
    text: [
      'Teléfono de mesa de color rojo con disco giratorio para marcar. El auricular descansa sobre la horquilla y se une a la base con un cable en espiral; en el centro del disco, los diez agujeros dejan ver los números del 1 al 0.',
      'Para marcar se ponía el dedo en el número, se giraba el disco hasta el tope y se soltaba: al regresar, el disco enviaba tantos pulsos como indicaba el número. Estos aparatos fueron el teléfono fijo de muchas casas hasta la llegada de los teclados de botones.',
      'En la colección, este teléfono dialoga con el celular plegable del expediente 02: dos maneras de llamar separadas por pocas décadas.',
    ],
    photos: null, sharp: null,
    sheet: [
      ['Marcación', 'Disco giratorio por pulsos'],
      ['Color', 'Rojo'],
      ['Auricular', 'Sobre horquilla, cable en espiral'],
      ['Nube de puntos', '266 256 puntos con color (PLY)'],
    ],
    mesh: { v: 325873, f: 550502, mb: '26,7 MB' }, view: { az: 330, el: 26, zoom: 0.95 },
    img: 'assets/images/telefono-disco.jpg', ar: '1000/760', imgLabel: 'Modelo 3D',
  },
  {
    id: 'cartagena', n: '14', exp: 'AT-2026-014', name: 'Imán de Cartagena', kind: 'pix4d',
    category: 'Recuerdo de viaje',
    expo: 'Una ciudad entera cabe en la puerta de la nevera',
    phrase: 'Los recuerdos de viaje convierten un lugar en un objeto que se puede tocar.',
    card: 'Imán de recuerdo en relieve metálico dorado: iglesias, una palmera, una figura y la palabra «Cartagena».',
    text: [
      'Imán de recuerdo de unos ocho centímetros, en relieve metálico de acabado dorado envejecido. Sobre un fondo de rayos de sol se recortan las cúpulas y torres de iglesias, una palmera y, a la izquierda, una figura de pie; al frente, la palabra «Cartagena» en letra cursiva corre sobre una cinta rodeada de volutas.',
      'Los imanes de recuerdo condensan una ciudad en unas pocas imágenes reconocibles —la arquitectura colonial, el mar, las palmeras— y viajan de vuelta a casa para quedarse en la puerta de la nevera. <strong>Este expediente no atribuye fabricante ni fecha</strong>: documenta lo que el objeto muestra.',
      'Es la pieza más pequeña y de mayor detalle de la colección: con 548 fotografías tomadas con PIX4Dcatch, la reconstrucción alcanza una resolución de terreno de 0,08 mm por píxel, suficiente para leer el relieve de las fachadas y de las letras.',
    ],
    photos: 548, sharp: '97 %', sharpLabel: 'Imágenes calibradas',
    sheet: [
      ['Imágenes calibradas', '535 de 548'],
      ['Resolución (GSD)', '0,0083 cm por píxel'],
      ['Cámara', 'iPhone · PIX4Dcatch · 1920 × 1440 px'],
      ['Error medio de reproyección', '0,227 px'],
      ['Puntos 3D enlazados', '414 388'],
      ['Sistema de referencia', 'WGS 84 / UTM zona 18N'],
    ],
    mesh: { v: 292464, f: 448878, mb: '11,3 MB', origV: 497606, origF: 1000000 }, view: { az: 0, el: 50, zoom: 1.2 },
    enh: {
      rows: [
        ['Orientación', 'Plano de la mesa por RANSAC, modelo nivelado'],
        ['Base', 'Recorte circular de 11,6 cm alrededor del imán'],
        ['Textura', '8192 px original de Pix4D'],
        ['Geometría del objeto', 'Sin cambios'],
      ],
      note: 'Se detectó el plano de la mesa, se niveló el modelo y se recortó una base circular alrededor del imán (de 1 000 000 a 448 878 caras, sin alterar la pieza). La textura es la original de Pix4D en 8192 px.',
    },
    img: 'assets/images/cartagena.jpg', ar: '1000/760', imgLabel: 'Reconstrucción Pix4D',
  },
];
// tamaños del modelo que carga el visor (textura 4096 px, geometría comprimida) y de la vista previa
const WEB = {
  carrito: [485131, '4,9 MB', 44771], telefono: [452984, '4,8 MB', 45217], sombrero: [500033, '5,2 MB', 45815], reloj: [210224, '3,1 MB', 31196],
  plancha: [418378, '4,4 MB', 40747], joyero: [114910, '2,2 MB', 36315], cds: [496522, '4,9 MB', 50807], billetes: [392054, '5,0 MB', 65388],
  tasita: [595145, '4,6 MB', 98868], televisor: [275600, '4,6 MB', 55114], radio: [274516, '4,7 MB', 54898], maquina: [282095, '4,8 MB', 90447],
  'telefono-disco': [275250, '4,1 MB', 55044], cartagena: [430668, '4,2 MB', 130229],
};
OBJECTS.forEach(o => {
  o.modelEnh = `assets/models/mejorado/${o.id}_mejorado.glb`;     // 8K: descarga
  o.modelWeb = `assets/models/web/${o.id}.glb`;                   // visor del expediente
  o.modelLite = `assets/models/ligero/${o.id}.glb`;               // vitrina y versión A
  o.thumb = `assets/images/web/${o.id}.webp`;                     // tarjetas y portada
  o.web = { tris: WEB[o.id][0], mb: WEB[o.id][1] }; o.mesh.lite = WEB[o.id][2];
  if (!o.kind) o.kind = 'pix4d';
  if (o.kind === 'estudio' && !o.enh) o.enh = {
    label: 'Versión de exhibición',
    rows: [
      ['Acabado', 'Malla y textura con aspecto de reconstrucción'],
      ['Base', 'Terreno de borde irregular con recorte alfa'],
      ['Textura', '8192 px en la descarga · 4096 px en el visor'],
      ['Nube de puntos', o.sheet.find(r => r[0] === 'Nube de puntos')[1]],
    ],
    note: 'Modelo 3D de estudio con acabado de reconstrucción fotogramétrica (estilo Pix4D): se preparó a partir de un modelo 3D digital, con la malla deformada, el grano de superficie, el terreno irregular y la nube de puntos propios de una captura. No proviene de un registro fotográfico procesado.',
  };
});
const PENDING = [];
const fmt = (n) => n.toLocaleString('es-CO');
const scrollToEl = (el) => { if (el) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' }); };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------------------------------------------------------
   BIENVENIDA
   --------------------------------------------------------- */
let intro = null;
const introEl = $('#intro');
const caption = $('#intro-caption');
function startIntro() {
  // nubes de puntos disponibles: las siete primeras piezas y el televisor (mismo orden del archivo .bin)
  const cloudNames = [...OBJECTS.slice(0, 7), ...OBJECTS.slice(9)].map(o => o.name);
  intro = createIntroScene($('#intro-canvas'), asset('assets/models/nubes-de-puntos.bin'), cloudNames, (t) => {
    caption.style.opacity = 0;
    setTimeout(() => { caption.textContent = t; caption.style.opacity = 1; }, 300);
  });
}
function enterExhibition(instant) {
  if (introEl.classList.contains('is-gone')) return;
  document.body.classList.remove('is-locked');
  const done = () => { introEl.classList.add('is-gone'); intro && intro.dispose(); intro = null; };
  if (instant || reduceMotion()) { introEl.style.opacity = 0; setTimeout(done, reduceMotion() ? 300 : 0); }
  else { intro && intro.leave(); setTimeout(() => introEl.classList.add('is-leaving'), 250); setTimeout(done, 1600); }
  setTimeout(() => $$('.hero .reveal').forEach((el, i) => { el.style.setProperty('--d', `${i * 0.08}s`); el.classList.add('in'); }), instant ? 0 : 500);
  window.scrollTo(0, 0);
}
$('#enter').addEventListener('click', () => enterExhibition(false));

/* ---------------------------------------------------------
   PORTADA: composición con profundidad
   --------------------------------------------------------- */
const LAYOUT = [   // collage de 14 piezas en tres filas escalonadas
  { l: '0%', t: '2%', w: '23%', r: '-3deg', d: 0.7, z: 3, fd: '0s' },
  { l: '21%', t: '0%', w: '22%', r: '2deg', d: 1.1, z: 4, fd: '-2s' },
  { l: '42%', t: '3%', w: '20%', r: '-1.5deg', d: 0.9, z: 5, fd: '-4s' },
  { l: '61%', t: '0%', w: '20%', r: '2.5deg', d: 1.3, z: 4, fd: '-6s' },
  { l: '80%', t: '4%', w: '20%', r: '-2deg', d: 0.8, z: 3, fd: '-1s' },
  { l: '6%', t: '33%', w: '21%', r: '1.5deg', d: 1.4, z: 6, fd: '-3s' },
  { l: '28%', t: '30%', w: '20%', r: '-2.5deg', d: 1.0, z: 7, fd: '-5s' },
  { l: '49%', t: '34%', w: '19%', r: '2deg', d: 1.5, z: 8, fd: '-7s' },
  { l: '70%', t: '31%', w: '22%', r: '-1deg', d: 1.15, z: 6, fd: '-8s' },
  { l: '0%', t: '64%', w: '21%', r: '2.5deg', d: 0.85, z: 5, fd: '-9s' },
  { l: '21%', t: '66%', w: '20%', r: '-2deg', d: 1.25, z: 6, fd: '-2.5s' },
  { l: '41%', t: '63%', w: '21%', r: '1deg', d: 0.95, z: 7, fd: '-4.5s' },
  { l: '61%', t: '66%', w: '19%', r: '-3deg', d: 1.35, z: 6, fd: '-6.5s' },
  { l: '80%', t: '62%', w: '20%', r: '2deg', d: 1.05, z: 5, fd: '-8.5s' },
];
const stage = $('#hero-stage');
stage.innerHTML = OBJECTS.map((o, i) => {
  const L = LAYOUT[i];
  return `<a class="plate" href="#expediente-${o.id}" data-depth="${L.d}" style="--l:${L.l};--t:${L.t};--w:${L.w};--r:${L.r};--zi:${L.z};--fd:${L.fd};--ar:${o.ar}" aria-label="Abrir expediente: ${o.name}">
    <figure class="plate__in" style="margin:0"><div class="plate__img"><img src="${asset(o.thumb)}" alt="${o.name}" decoding="async" fetchpriority="low"></div>
    <figcaption><b>${o.n}</b><span>${o.name}</span></figcaption></figure></a>`;
}).join('');
const hero = $('#inicio');
let mx = 0, my = 0, sy = 0;
const updatePlates = () => {
  if (reduceMotion()) return;
  $$('.plate', stage).forEach(p => {
    const d = parseFloat(p.dataset.depth);
    p.style.setProperty('--px', `${mx * d * 26}px`);
    p.style.setProperty('--py', `${my * d * 20 - sy * d * 0.06}px`);
  });
};
hero.addEventListener('pointermove', (e) => {
  const r = hero.getBoundingClientRect();
  mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5;
  hero.style.setProperty('--mx', `${e.clientX - r.left}px`); hero.style.setProperty('--my', `${e.clientY - r.top}px`);
  updatePlates();
});
$('#marquee').innerHTML = [...OBJECTS, ...OBJECTS].map(o => `<span>${o.expo}</span>`).join('');

/* ---------------------------------------------------------
   GALERÍA
   --------------------------------------------------------- */
const ICON_CAM = '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';
const ICON_SHARP = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>';
const ICON_CUBE = '<svg viewBox="0 0 24 24"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9z"/><path d="M4 7.5 12 12l8-4.5M12 12v9"/></svg>';
const ICON_ARROW = '<svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const cards = $('#cards');
cards.innerHTML = OBJECTS.map(o => `
  <article class="card" data-kind="${o.kind}" data-id="${o.id}">
    <div class="card__media">
      <img src="${asset(o.thumb)}" alt="${o.name}" loading="lazy" decoding="async">
      <span class="card__tag mono">${o.exp}</span>
      <span class="badge3d">${ICON_CUBE}Modelo 3D</span>
    </div>
    <div class="card__body">
      <span class="card__cat">${o.category}</span>
      <h3>${o.name}</h3>
      <p class="card__desc">${o.card}</p>
      <div class="card__meta">${o.kind === 'estudio' ? `<span>${ICON_CUBE}Modelo de estudio</span><span>${ICON_SHARP}Acabado <b>Pix4D</b></span>` : o.photos ? `<span>${ICON_CAM}<b>${fmt(o.photos)}</b> fotografías</span><span>${ICON_SHARP}${o.sharpLabel ? 'Calibradas' : 'Nitidez'} <b>${o.sharp}</b></span>` : `<span>${ICON_CAM}Datos de captura por confirmar</span>`}</div>
      <button class="card__open" type="button" data-open="${o.id}">Abrir expediente ${ICON_ARROW}</button>
    </div>
  </article>`).join('') + PENDING.map(p => `
  <article class="card card--pending" data-kind="pendiente" aria-label="Espacio ${p.n}: próxima incorporación">
    <div class="card__media">
      <svg class="pending-art" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" stroke-dasharray="2 4"/><g class="spin"><ellipse cx="50" cy="50" rx="46" ry="16"/><ellipse cx="50" cy="50" rx="16" ry="46"/></g><path d="M50 30 66 39v22l-16 9-16-9V39z"/><path d="M34 39l16 9 16-9M50 48v22"/></svg>
      <span class="card__tag mono">${p.exp}</span>
    </div>
    <div class="card__body">
      <span class="card__cat">Próximamente</span>
      <h3>Próxima incorporación</h3>
      <p class="card__desc">Espacio reservado para un nuevo objeto de la colección, en proceso de documentación.</p>
      <div class="card__meta"><span>Expediente ${p.n} · sin datos aún</span></div>
    </div>
  </article>`).join('');

// inclinación y luz en las tarjetas
$$('.card', cards).forEach(c => {
  c.addEventListener('pointermove', (e) => {
    if (reduceMotion() || e.pointerType !== 'mouse') return;
    const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    c.style.setProperty('--ry', `${(x - 0.5) * 6}deg`); c.style.setProperty('--rx', `${(0.5 - y) * 6}deg`);
    c.style.setProperty('--cx', `${x * 100}%`); c.style.setProperty('--cy', `${y * 100}%`);
  });
  c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
});
cards.addEventListener('click', (e) => {
  const b = e.target.closest('[data-open]');
  const card = e.target.closest('.card[data-id]');
  if (b) openDossier(b.dataset.open);
  else if (card && !e.target.closest('button')) openDossier(card.dataset.id);
});

// filtros
const ink = $('.filter__ink');
const moveInk = () => { const a = $('.filter.is-active'); if (!a) return; ink.style.width = a.offsetWidth + 'px'; ink.style.transform = `translateX(${a.offsetLeft}px)`; };
$$('.filter').forEach(f => f.addEventListener('click', () => {
  $$('.filter').forEach(x => { x.classList.toggle('is-active', x === f); x.setAttribute('aria-selected', x === f); });
  moveInk();
  const k = f.dataset.filter; let i = 0;
  $$('.card', cards).forEach(c => {
    const show = k === 'todos' || c.dataset.kind === k;
    c.classList.toggle('is-hidden', !show);
    c.classList.remove('is-entering');
    if (show) { void c.offsetWidth; c.style.setProperty('--d', `${i++ * 0.05}s`); c.classList.add('is-entering'); }
  });
}));
window.addEventListener('resize', moveInk);
document.fonts && document.fonts.ready.then(moveInk);
setTimeout(moveInk, 300);

/* ---------------------------------------------------------
   REGISTRO FOTOGRÁFICO (metodología)
   --------------------------------------------------------- */
const maxP = Math.max(...OBJECTS.map(o => o.photos || 0));
$('#registry').innerHTML = OBJECTS.filter(o => o.kind === 'pix4d').map((o, i) => `
  <div class="reg-row" data-open="${o.id}" role="button" tabindex="0" aria-label="${o.name}: ${o.photos ? o.photos + ' fotografías, nitidez ' + o.sharp : 'datos de captura por confirmar'}">
    <span class="reg-row__name"><span class="mono">${o.n}</span>${o.name}</span>
    <span class="reg-bar"><span style="--w:${((o.photos || 0) / maxP * 100).toFixed(1)}%;--d:${i * 0.12}s"></span></span>
    <span class="reg-row__v">${o.photos ? `<b>${fmt(o.photos)}</b> fotos` : 'Por confirmar'}</span>
    <span class="reg-row__s">${o.sharp ? (o.sharpLabel ? 'Calibradas ' : 'Nitidez ') + o.sharp : '—'}</span>
  </div>`).join('');
$('#registry').addEventListener('click', (e) => { const r = e.target.closest('[data-open]'); if (r) openDossier(r.dataset.open); });
$('#registry').addEventListener('keydown', (e) => { const r = e.target.closest('[data-open]'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openDossier(r.dataset.open); } });

/* ---------------------------------------------------------
   METODOLOGÍA: etapas interactivas
   --------------------------------------------------------- */
const setStep = (n) => {
  $$('.step').forEach(s => s.classList.toggle('is-active', s.dataset.step == n));
  $$('.dg').forEach(d => d.classList.toggle('is-active', d.dataset.step == n));
};
$$('.step').forEach(s => {
  s.addEventListener('click', () => setStep(s.dataset.step));
  s.addEventListener('mouseenter', () => setStep(s.dataset.step));
  s.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setStep(s.dataset.step); } });
});
const stepIO = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) setStep(e.target.dataset.step); }), { rootMargin: '-45% 0px -45% 0px' });
$$('.step').forEach(s => stepIO.observe(s));

/* ---------------------------------------------------------
   REVELADO, CONTADORES, PROGRESO, NAVEGACIÓN
   --------------------------------------------------------- */
const revealIO = new IntersectionObserver((es) => es.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('in'); revealIO.unobserve(e.target);
  if (e.target.querySelector && e.target.querySelector('.count')) e.target.querySelectorAll('.count').forEach(countUp);
}), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach((el) => { if (!el.closest('.hero')) revealIO.observe(el); });
$$('.value__lines .reveal, .value__figs, .value__foot').forEach((el, i) => el.style.setProperty('--d', `${i * 0.12}s`));
// contadores de la portada
const heroStats = $('.hero .stats');
function countUp(el) {
  if (el.dataset.done) return; el.dataset.done = 1;
  const to = +el.dataset.to, dur = reduceMotion() ? 1 : 1800, t0 = performance.now();
  const tick = (t) => { const p = Math.min(1, (t - t0) / dur); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 4)))); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
// contadores: si la portada ya es visible al ingresar
const heroCountTimer = setInterval(() => { if (introEl.classList.contains('is-gone')) { $$('.count', heroStats).forEach(countUp); clearInterval(heroCountTimer); } }, 300);

const bar = $('#progress-bar'), nav = $('#nav');
const onScroll = () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  nav.classList.toggle('is-solid', scrollY > 30);
  sy = scrollY; if (scrollY < innerHeight * 1.2) updatePlates();
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();

const sections = $$('[data-section]');
const dots = $('#dots');
dots.innerHTML = sections.map(s => `<li data-to="${s.id}" title="${s.dataset.section}"><span>${s.dataset.section}</span></li>`).join('');
dots.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) scrollToEl(document.getElementById(li.dataset.to)); });
const secIO = new IntersectionObserver((es) => es.forEach(e => {
  if (!e.isIntersecting) return;
  $$('li', dots).forEach(li => li.classList.toggle('is-current', li.dataset.to === e.target.id));
  $$('.nav__links a').forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-48% 0px -48% 0px' });
sections.forEach(s => secIO.observe(s));

const toggle = $('#nav-toggle');
toggle.addEventListener('click', () => { const o = nav.classList.toggle('is-open'); toggle.setAttribute('aria-expanded', o); toggle.setAttribute('aria-label', o ? 'Cerrar menú' : 'Abrir menú'); });
$$('.nav__links a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', false); }));

// enlaces internos: desplazamiento sin alterar el hash del expediente
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  if (id.startsWith('expediente-')) { e.preventDefault(); openDossier(id.replace('expediente-', '')); return; }
  const t = document.getElementById(id);
  if (t && !a.hasAttribute('download')) { e.preventDefault(); scrollToEl(t); }
});

/* ---------------------------------------------------------
   EXPEDIENTES
   --------------------------------------------------------- */
const dossier = $('#dossier'), dInner = $('#d-inner'), dScroll = $('#d-scroll');
let viewer = null, currentId = null, lastFocus = null;

function dossierHTML(o, i) {
  const lite = EDICION === 'ligera';
  const prev = OBJECTS[(i + OBJECTS.length - 1) % OBJECTS.length], next = OBJECTS[(i + 1) % OBJECTS.length];
  const hasGeo = o.sheet.length > 0;
  const est = o.kind === 'estudio';
  return `
    <header class="dh">
      <span class="dh__num" aria-hidden="true">${o.n}</span>
      <div>
        <p class="dh__cat">${o.category} · ${o.exp}</p>
        <h1 id="d-title">${o.name}</h1>
        <p class="dh__expo">${o.expo}</p>
      </div>
    </header>
    <div class="viewer" id="viewer"></div>
    <div class="dgrid">
      <div>
        <figure class="dphoto" data-zoom tabindex="0" role="button" aria-label="Ampliar la fotografía de la reconstrucción">
          <img src="${asset(o.thumb)}" data-full="${asset(o.img)}" alt="${o.imgLabel || 'Reconstrucción Pix4D'}: ${o.name}">
          <figcaption><span class="mono">${o.imgLabel || 'Reconstrucción Pix4D'}</span><button class="btn btn--sm btn--ghost" type="button" data-zoom-btn><span>Ampliar imagen</span></button></figcaption>
        </figure>
        <blockquote class="quote quote--d">“${o.phrase}”</blockquote>
      </div>
      <div class="dtext">
        <h2>Lectura del objeto</h2>
        ${o.text.map(p => `<p>${p}</p>`).join('')}
        <section class="sheet" aria-labelledby="sh-${o.id}">
          <div class="sheet__h"><h3 id="sh-${o.id}">${est ? 'Ficha técnica del objeto' : 'Ficha técnica fotogramétrica'}</h3><span class="mono">${o.exp}</span></div>
          <dl>
            ${est
              ? `<div><dt>Tipo de modelo</dt><dd class="big">Estudio 3D</dd></div><div><dt>Acabado</dt><dd class="big">Pix4D</dd></div>`
              : `<div><dt>Fotografías capturadas</dt><dd class="big">${o.photos ? fmt(o.photos) : '<span class="tbd">Por confirmar</span>'}</dd></div><div><dt>${o.sharpLabel || 'Nitidez reportada'}</dt><dd class="big">${o.sharp || '<span class="tbd">Por confirmar</span>'}</dd></div>`}
            <div><dt>Categoría</dt><dd>${o.category}</dd></div>
            <div><dt>${est ? 'Origen' : 'Software de reconstrucción'}</dt><dd>${est ? 'Modelo 3D digital con acabado de captura' : 'Pix4D'}</dd></div>
            ${o.sheet.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
          </dl>
          ${est ? '' : o.pending ? '<p class="sheet__note">Los datos del informe Pix4D de este objeto (fotografías, nitidez, georreferenciación y tamaño del registro) están pendientes de incorporar; no se muestran valores estimados.</p>' : hasGeo ? '' : '<p class="sheet__note">La ficha suministrada para este objeto no incluye datos de georreferenciación ni tamaño del registro; se muestran únicamente los datos reportados.</p>'}
        </section>
        <section class="sheet" aria-labelledby="mh-${o.id}">
          <div class="sheet__h"><h3 id="mh-${o.id}">Modelo tridimensional</h3><span class="mono">datos de los archivos</span></div>
          <dl>
            <div><dt>Vértices · modelo completo</dt><dd>${fmt(o.mesh.v)}</dd></div>
            <div><dt>Caras · modelo completo</dt><dd>${fmt(o.mesh.f)}</dd></div>
            <div><dt>Textura original</dt><dd>${o.mesh.orig || '8192 × 8192 px'}</dd></div>
            <div><dt>Formatos originales</dt><dd>${est ? 'GLB · PLY (nube de puntos)' : 'OBJ · MTL · FBX · JPG'}</dd></div>
            <div><dt>${lite ? 'Vista previa (esta versión)' : 'Modelo del visor'}</dt><dd>${lite ? `${fmt(o.mesh.lite)} triángulos · 1024–2048 px` : `${fmt(o.web.tris)} triángulos · ${o.web.mb}`}</dd></div>
            <div><dt>${lite ? 'Modelo completo' : 'Textura del visor'}</dt><dd>${lite ? 'Incluido en la versión B' : (o.mesh.tex ? '2048 px por cara' : '4096 px') + ' · geometría comprimida'}</dd></div>
          </dl>
          <p class="sheet__note">${lite ? 'Esta versión ligera incluye una vista previa simplificada para abrirse sin servidor. ' : 'El visor carga una versión web, más liviana, para abrir rápido; el botón de descarga entrega el modelo completo. '}${est ? '' : 'Los archivos OBJ, MTL y JPG originales de Pix4D se incluyen sin modificar en el paquete.'}</p>
        </section>
        <section class="sheet sheet--enh" aria-labelledby="eh-${o.id}">
          <div class="sheet__h"><h3 id="eh-${o.id}">${o.enh.label || 'Versión mejorada 8K'}</h3><span class="mono">versión de exhibición</span></div>
          <dl>
            ${(o.enh.rows || [['Motas de color reparadas', o.enh.spots ? fmt(o.enh.spots) : 'No aplicada'], ['Base', 'Recorte circular · huecos de la mesa cubiertos'], ['Textura', '8192 px · nitidez y color realzados'], ['Geometría del objeto', 'Sin cambios']]).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}
          </dl>
          ${o.enh.note ? `<p class="sheet__note">${o.enh.note}</p>` : `<p class="sheet__note">La pieza se presenta sobre un pedestal: la superficie de apoyo se recortó a una base circular y sus espacios sin reconstruir se cubrieron con el tono de la mesa${o.enh.spots ? '; las pequeñas manchas claras que la reconstrucción proyectó sobre el objeto (color de la mesa o reflejos) se repintaron con el color de su entorno' : ''}. La forma del objeto es la reconstruida por Pix4D.</p>`}
        </section>
        <div class="dl-row">
          <a class="btn btn--primary" data-dl href="${asset(lite ? o.modelLite : o.modelEnh)}" download="${o.exp}_${o.id}${lite ? '_ligero' : o.mesh.tex ? '_mejorado' : '_mejorado_8k'}.glb"><span>Descargar modelo 3D (GLB${lite ? ' ligero' : (o.mesh.tex ? ' · ' : ' 8K · ') + o.mesh.mb})</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12m-5-5 5 5 5-5M5 20h14"/></svg></a>
          <button class="btn btn--ghost" type="button" data-full><span>Ver en pantalla completa</span></button>
        </div>
      </div>
    </div>
    <nav class="dfoot" aria-label="Navegación entre expedientes">
      <button type="button" data-go="${prev.id}"><span class="mono">← Anterior · ${prev.n}</span><strong>${prev.name}</strong></button>
      <button type="button" data-go="${next.id}"><span class="mono">Siguiente · ${next.n} →</span><strong>${next.name}</strong></button>
    </nav>`;
}

function renderDossier(id) {
  const i = OBJECTS.findIndex(o => o.id === id); if (i < 0) return;
  const o = OBJECTS[i];
  currentId = id;
  $('#d-id').textContent = `Expediente ${o.exp}`;
  $('#d-count').textContent = `${o.n} / ${String(OBJECTS.length).padStart(2, '0')}`;
  if (viewer) { viewer.dispose(); viewer = null; }
  dInner.innerHTML = dossierHTML(o, i);
  dScroll.scrollTop = 0;
  const lite = EDICION === 'ligera';
  const mobile = !lite && prefersMobileModel();
  viewer = new ModelViewer($('#viewer', dInner), { name: o.name, ...o.view, badge: lite ? 'Vista previa ligera' : 'Vista web · 4K', maxTexture: mobile ? 2048 : undefined, sizeLabel: lite ? 'Vista previa ligera' : `${o.name} · ${o.web.mb}` });
  viewer.el.classList.add('is-enhanced');
  viewer.load(asset(lite ? o.modelLite : o.modelWeb), { pedestal: true });
  document.title = `${o.name} — Archivo del Tiempo`;
}

function openDossier(id, fromHash) {
  if (!OBJECTS.some(o => o.id === id)) return;
  if (!introEl.classList.contains('is-gone')) enterExhibition(true);
  if (!fromHash && location.hash !== '#expediente-' + id) { history.pushState(null, '', '#expediente-' + id); }
  if (dossier.hidden || closing) {
    if (closing) return;
    lastFocus = document.activeElement;
    dossier.hidden = false; document.body.style.overflow = 'hidden';
    renderDossier(id);
    requestAnimationFrame(() => requestAnimationFrame(() => dossier.classList.add('is-open')));
    setTimeout(() => $('#d-close').focus({ preventScroll: true }), 400);
  } else if (id !== currentId) {
    swapDossier(id);
  }
}
function swapDossier(id) {
  if (reduceMotion()) { renderDossier(id); return; }
  dInner.classList.add('is-swapping');
  setTimeout(() => { renderDossier(id); requestAnimationFrame(() => dInner.classList.remove('is-swapping')); }, 380);
}
let closing = false;
function closeDossier(fromHash) {
  if (dossier.hidden || closing) return;
  tourStop();
  closing = true;
  dossier.classList.remove('is-open');
  if (!fromHash) history.pushState(null, '', '#coleccion');
  setTimeout(() => {
    dossier.hidden = true; document.body.style.overflow = '';
    if (viewer) { viewer.dispose(); viewer = null; }
    dInner.innerHTML = ''; currentId = null; closing = false;
    document.title = 'Archivo del Tiempo — Memorias reconstruidas en 3D';
    if (lastFocus && lastFocus.isConnected && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }, reduceMotion() ? 10 : 900);
}
const step = (d) => { tourRestart(); const i = OBJECTS.findIndex(o => o.id === currentId); const n = OBJECTS[(i + d + OBJECTS.length) % OBJECTS.length]; history.replaceState(null, '', '#expediente-' + n.id); swapDossier(n.id); };
$('#d-close').addEventListener('click', () => closeDossier());
$('#d-prev').addEventListener('click', () => step(-1));
$('#d-next').addEventListener('click', () => step(1));
dInner.addEventListener('click', (e) => {
  const go = e.target.closest('[data-go]');
  if (go) { tourRestart(); history.replaceState(null, '', '#expediente-' + go.dataset.go); swapDossier(go.dataset.go); return; }
  if (e.target.closest('[data-full]')) { viewer && viewer.toggleFullscreen(); return; }
  const z = e.target.closest('[data-zoom]');
  if (z) { openLightbox(z.querySelector('img'), OBJECTS.find(o => o.id === currentId)); return; }
  const dl = e.target.closest('[data-dl]');
  if (dl && inFrame) { e.preventDefault(); toast('Las descargas no están disponibles dentro de esta vista. Descarga el paquete del proyecto (versión B) para obtener los modelos GLB.'); }
});
dInner.addEventListener('keydown', (e) => { const z = e.target.closest('[data-zoom]'); if (z && (e.key === 'Enter' || e.key === ' ') && e.target === z) { e.preventDefault(); openLightbox(z.querySelector('img'), OBJECTS.find(o => o.id === currentId)); } });
document.addEventListener('keydown', (e) => {
  if (!$('#lightbox').hidden) { if (e.key === 'Escape') closeLightbox(); return; }
  if (dossier.hidden || (viewer && viewer.el.classList.contains('is-pseudo-fs'))) return;
  if (e.key === 'Escape' && !document.fullscreenElement) closeDossier();
  if (e.target.closest && e.target.closest('input')) return;
  if (e.key === 'ArrowRight' && !e.target.closest('canvas')) step(1);
  if (e.key === 'ArrowLeft' && !e.target.closest('canvas')) step(-1);
});

// enrutamiento por hash (#expediente-carrito)
function route() {
  const h = location.hash.slice(1);
  if (h.startsWith('expediente-')) openDossier(h.replace('expediente-', ''), true);
  else if (!dossier.hidden) closeDossier(true);
}
addEventListener('hashchange', route);
addEventListener('popstate', route);

/* ---------------------------------------------------------
   AMPLIACIÓN DE IMÁGENES
   --------------------------------------------------------- */
const lb = $('#lightbox'), lbImg = $('#lb-img');
let lbSource = null;
function openLightbox(img, o) {
  lbSource = img;
  lbImg.src = img.dataset.full || img.src; lbImg.alt = img.alt;
  $('#lb-cap').textContent = `${o.exp} · ${o.name} · ${o.imgLabel ? o.imgLabel.toLowerCase() : 'reconstrucción fotogramétrica'}`;
  lb.hidden = false;
  requestAnimationFrame(() => {
    lb.classList.add('is-open');
    if (reduceMotion()) return;
    const a = img.getBoundingClientRect(), b = lbImg.getBoundingClientRect();
    lbImg.animate([
      { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})` },
      { transform: 'none' }
    ], { duration: 650, easing: 'cubic-bezier(.22,.8,.2,1)' });
  });
  $('#lb-close').focus({ preventScroll: true });
}
function closeLightbox() {
  const fin = () => { lb.hidden = true; lbSource && lbSource.closest('[data-zoom]') && lbSource.closest('[data-zoom]').focus({ preventScroll: true }); };
  lb.classList.remove('is-open');
  if (reduceMotion() || !lbSource) { fin(); return; }
  const a = lbSource.getBoundingClientRect(), b = lbImg.getBoundingClientRect();
  const an = lbImg.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`, opacity: .4 }], { duration: 450, easing: 'cubic-bezier(.77,0,.18,1)' });
  an.onfinish = fin;
}
$('#lb-close').addEventListener('click', closeLightbox);
lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });


/* ---------------------------------------------------------
   RECORRIDO GUIADO (modo sustentación)
   Abre los expedientes uno tras otro, con giro automático y avance temporizado.
   --------------------------------------------------------- */
const TOUR_MS = 26000;
const tour = { on: false, paused: false, t0: 0, left: TOUR_MS, timer: null, scrollT: null };
const tourBar = $('#tourbar'), tourBtn = $('#d-tour');
function tourSchedule(ms) {
  clearTimeout(tour.timer); clearTimeout(tour.scrollT);
  tour.t0 = performance.now(); tour.left = ms;
  const fill = tourBar.firstElementChild;
  const done = 1 - ms / TOUR_MS;
  fill.style.transition = 'none'; fill.style.transform = `scaleX(${done})`; void fill.offsetWidth;
  fill.style.transition = `transform ${ms}ms linear`; fill.style.transform = 'scaleX(1)';
  tour.timer = setTimeout(() => { if (!tour.on) return; const i = OBJECTS.findIndex(o => o.id === currentId); const n = OBJECTS[(i + 1) % OBJECTS.length]; history.replaceState(null, '', '#expediente-' + n.id); swapDossier(n.id); tourSchedule(TOUR_MS); }, ms);
  if (ms > TOUR_MS * 0.45) tour.scrollT = setTimeout(() => { if (tour.on && !tour.paused) { const v = $('#viewer', dInner); if (v) dScroll.scrollTo({ top: v.offsetTop + v.offsetHeight - 60, behavior: reduceMotion() ? 'auto' : 'smooth' }); } }, ms - TOUR_MS * 0.42);
}
function tourStart() {
  tour.on = true; tour.paused = false;
  tourBar.hidden = false; tourBtn.hidden = false; setTourBtn();
  const first = currentId || OBJECTS[0].id;
  openDossier(first);
  tourSchedule(TOUR_MS);
  toast('Recorrido guiado: cada expediente avanza solo. Usa ← → para moverte, o «Pausar recorrido».');
}
function tourStop() {
  if (!tour.on) return;
  tour.on = false; clearTimeout(tour.timer); clearTimeout(tour.scrollT);
  tourBar.hidden = true; tourBtn.hidden = true;
}
function tourRestart() { if (tour.on && !tour.paused) tourSchedule(TOUR_MS); }
function setTourBtn() {
  tourBtn.innerHTML = tour.paused
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10-6.5z"/></svg><span>Continuar</span>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6v12M15 6v12"/></svg><span>Pausar recorrido</span>';
}
tourBtn.addEventListener('click', () => {
  if (!tour.on) return;
  const fill = tourBar.firstElementChild;
  if (!tour.paused) {
    tour.paused = true; clearTimeout(tour.timer); clearTimeout(tour.scrollT);
    tour.left = Math.max(1000, tour.left - (performance.now() - tour.t0));
    const cur = getComputedStyle(fill).transform; fill.style.transition = 'none'; fill.style.transform = cur;
  } else { tour.paused = false; tourSchedule(tour.left); }
  setTourBtn();
});
$$('[data-tour]').forEach(b => b.addEventListener('click', () => { nav.classList.remove('is-open'); tourStart(); }));

/* ---------------------------------------------------------
   POLVO DE ARCHIVO: partículas doradas en la portada
   --------------------------------------------------------- */
(function dust() {
  const cv = $('#dust'); if (!cv) return;
  const ctx = cv.getContext('2d'); let W = 0, H = 0, pts = [], visible = true, mxp = -999, myp = -999;
  const resize = () => {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(110, W * H / 14000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 0.4 + Math.random() * 1.6, v: 0.08 + Math.random() * 0.28, a: Math.random() * Math.PI * 2, s: 0.004 + Math.random() * 0.01, o: 0.15 + Math.random() * 0.5 }));
  };
  resize(); addEventListener('resize', resize);
  hero.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mxp = e.clientX - r.left; myp = e.clientY - r.top; });
  hero.addEventListener('pointerleave', () => { mxp = myp = -999; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  const draw = () => {
    requestAnimationFrame(draw);
    if (!visible || document.hidden || !introEl.classList.contains('is-gone')) return;
    ctx.clearRect(0, 0, W, H);
    const still = reduceMotion();
    for (const p of pts) {
      if (!still) {
        p.a += p.s; p.y -= p.v; p.x += Math.sin(p.a) * 0.25;
        const dx = p.x - mxp, dy = p.y - myp, d2 = dx * dx + dy * dy;
        if (d2 < 9000) { const f = (9000 - d2) / 9000 * 1.4; p.x += dx / Math.sqrt(d2 + 1) * f; p.y += dy / Math.sqrt(d2 + 1) * f; }
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      }
      const tw = 0.6 + 0.4 * Math.sin(p.a * 3);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(231, 214, 178, ${p.o * tw})`; ctx.fill();
    }
  };
  draw();
})();

/* ---------------------------------------------------------
   BOTONES MAGNÉTICOS Y TARJETAS QUE SE REVELAN
   --------------------------------------------------------- */
if (matchMedia('(pointer: fine)').matches) {
  document.addEventListener('pointermove', (e) => {
    if (reduceMotion()) return;
    const b = e.target.closest('.btn--primary, .btn--ghost, .nav__tour');
    $$('.is-magnet').forEach(x => { if (x !== b) { x.classList.remove('is-magnet'); x.style.translate = ''; } });
    if (!b) return;
    const r = b.getBoundingClientRect();
    b.classList.add('is-magnet');
    b.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.18}px ${(e.clientY - r.top - r.height / 2) * 0.28}px`;
  });
}
const cardIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  const i = $$('.card', cards).indexOf(e.target);
  e.target.style.setProperty('--rd', `${(i % 4) * 0.09}s`);
  e.target.classList.add('is-revealed'); cardIO.unobserve(e.target);
}), { threshold: 0.15 });
$$('.card', cards).forEach(c => cardIO.observe(c));


/* ---------------------------------------------------------
   VITRINA: una pieza girando, con cambio automático
   --------------------------------------------------------- */
(function vitrine() {
  const cv = $('#showcase'); if (!cv) return;
  const list = $('#sc-list'), load = $('#sc-load');
  list.innerHTML = OBJECTS.map((o, i) => `<li${i === 0 ? ' class="is-on"' : ''}><button type="button" data-sc="${i}"><span class="n">${o.n}</span><span class="nm">${o.name}</span><span class="dot"></span></button></li>`).join('');
  let sc = null, cur = -1, timer = null, busy = false;
  const AUTO = 14000;
  let onScreen = false;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(cv);
  const show = (i, user) => {
    if (busy || i === cur) return;
    busy = true; clearTimeout(timer);
    const o = OBJECTS[i];
    $$('li', list).forEach((li, k) => li.classList.toggle('is-on', k === i));
    $('#sc-exp').textContent = `Expediente ${o.exp}`;
    $('#sc-name').textContent = o.name;
    $('#sc-expo').textContent = o.expo;
    $('#sc-open').dataset.id = o.id;
    load.classList.remove('is-off'); load.textContent = cur < 0 ? 'Cargando pieza…' : `Cargando ${o.name.toLowerCase()}…`;
    if (!sc) sc = createShowcase(cv);
    if (!sc) { load.textContent = 'Tu navegador no tiene WebGL activo.'; return; }
    cur = i;
    sc.load(asset(o.modelLite), (err) => {
      busy = false;
      load.classList.toggle('is-off', !err);
      if (err) load.textContent = 'No fue posible cargar la pieza.';
      timer = setTimeout(function next() { if (!onScreen || document.hidden) { timer = setTimeout(next, 1500); return; } show((cur + 1) % OBJECTS.length); }, user ? AUTO * 1.8 : AUTO);
    });
  };
  list.addEventListener('click', (e) => { const b = e.target.closest('[data-sc]'); if (b) show(+b.dataset.sc, true); });
  $('#sc-open').addEventListener('click', () => { const id = $('#sc-open').dataset.id; if (id) openDossier(id); });
  cv.addEventListener('dblclick', () => { const id = $('#sc-open').dataset.id; if (id) openDossier(id); });
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); show(0); } }, { rootMargin: '200px' });
  io.observe(cv);
})();

/* ---------------------------------------------------------
   AUTORES: retratos con profundidad y tarjeta en perspectiva
   --------------------------------------------------------- */
(function bios() {
  $$('[data-depth-stage]').forEach((stage) => {
    const card = $('.bio__card', stage), cv = $('.bio__canvas', stage);
    let portrait = null;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || portrait) return;
      io.disconnect();
      portrait = createDepthPortrait(cv, asset(cv.dataset.img), asset(cv.dataset.depth), () => stage.classList.add('has-depth'));
    }, { rootMargin: '300px' });
    io.observe(stage);
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1, y = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!reduceMotion()) { stage.classList.add('is-live'); card.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`); card.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`); }
      portrait && portrait.point(Math.max(-1, Math.min(1, x)), Math.max(-1, Math.min(1, -y)));
    });
    stage.addEventListener('pointerleave', () => {
      stage.classList.remove('is-live'); card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      portrait && portrait.release();
    });
  });
})();

/* ---------------------------------------------------------
   TÍTULOS: revelado palabra por palabra
   --------------------------------------------------------- */
(function splitHeadings() {
  if (reduceMotion()) return;
  $$('.h2.reveal, .hero__title.reveal').forEach((h) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
      });
    };
    walk(h);
    h.classList.add('split');
  });
})();

/* ---------------------------------------------------------
   CURSOR DE LENTE (solo con ratón)
   --------------------------------------------------------- */
(function lensCursor() {
  const cur = $('#cursor'); if (!cur || !matchMedia('(pointer: fine)').matches || reduceMotion()) return;
  const dot = cur.firstElementChild;
  let x = -100, y = -100, tx = -100, ty = -100;
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY; cur.classList.add('is-on');
    const t = e.target.closest && e.target.closest('[data-cursor], .card[data-id], .plate, .dphoto');
    const label = t ? (t.dataset.cursor || 'Ver') : '';
    cur.classList.toggle('is-view', !!t);
    if (label) dot.dataset.label = label;
  }, { passive: true });
  document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
  (function loop() { x += (tx - x) * 0.2; y += (ty - y) * 0.2; cur.style.transform = `translate3d(${x}px, ${y}px, 0)`; requestAnimationFrame(loop); })();
})();

/* ---------------------------------------------------------
   AVISOS
   --------------------------------------------------------- */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('is-on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 4600); }

/* ---------------------------------------------------------
   INICIO
   --------------------------------------------------------- */
if (EDICION === 'ligera') $('#edition-note').textContent = 'Versión A · portafolio ligero';
else $('#edition-note').textContent = 'Versión B · portafolio completo 3D';
if (location.hash.startsWith('#expediente-')) { enterExhibition(true); route(); }
else startIntro();
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !introEl.classList.contains('is-gone') && document.activeElement === document.body) enterExhibition(false); });
