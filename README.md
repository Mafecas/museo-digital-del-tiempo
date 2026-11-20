# ARCHIVO DEL TIEMPO — Memorias reconstruidas en 3D

**Fotografía, memoria y reconstrucción fotogramétrica tridimensional.**

Autores:

- María Fernanda Castro Casallas — Código 20212025102
- Andrés Ricardo Romero Rodríguez — Código 20231025057

Año: 2026

---

## 1. Cómo abrir el portafolio

### Versión B — Portafolio completo 3D (esta carpeta)

El visor 3D carga archivos GLB y módulos JavaScript, por eso el navegador necesita que la página se sirva desde un servidor local (no basta con abrir `index.html` con doble clic).

- **Windows:** doble clic en `INICIAR_PORTAFOLIO.bat`.
- **macOS / Linux:** en una terminal dentro de esta carpeta ejecuta `python3 iniciar.py`.
- **Cualquier sistema con Python 3:** `python iniciar.py`.

El navegador se abre solo en `http://localhost:8000/` (o el siguiente puerto libre). Para detener el servidor cierra la ventana de la consola.

Requisitos: Python 3 (sin librerías adicionales) y un navegador actual con WebGL (Chrome, Edge, Firefox o Safari). No se necesita conexión a internet: Three.js y las tipografías están incluidos en `assets/vendor` y `assets/fonts`.

### Versión A — Portafolio web ligero

`ARCHIVO_DEL_TIEMPO_version_A_ligera.html` es un único archivo que se abre con doble clic, sin servidor ni instalación. Incluye portada, galería, las catorce fichas, las biografías de los autores, las imágenes de reconstrucción, la metodología, los créditos y **vistas previas 3D simplificadas de la versión mejorada** (entre 31 000 y 99 000 triángulos, texturas de 1024–2048 px). El modelo 8K completo se ve en la versión B.

## 2. Estructura

```
archivo-del-tiempo/
├── index.html                 Estructura de la exposición
├── styles.css                 Identidad visual y diseño adaptable
├── script.js                  Datos de la colección, galería, fichas y navegación
├── viewer.js                  Visor 3D (Three.js) y escena de bienvenida
├── ARCHIVO_DEL_TIEMPO_version_A_ligera.html   Versión A (archivo único)
├── assets/
│   ├── models/
│   │   ├── mejorado/                   Modelo completo 8K de cada pieza (botón de descarga)
│   │   ├── web/                        Lo que carga el visor: textura 4096 px y geometría comprimida (meshopt), 2–5 MB
│   │   ├── ligero/                     Modelos livianos de la vitrina y de la versión A
│   │   ├── originales/<objeto>/        OBJ, MTL y JPG de Pix4D, idénticos a los entregados
│   │   └── nubes-de-puntos.bin         Puntos muestreados de las mallas (pantalla de bienvenida)
│   ├── images/                Imágenes de reconstrucción suministradas (sin modificar) y renders de las piezas
│   │   ├── web/                Las mismas imágenes en WebP de 900 px para tarjetas y portada
│   │   ├── autores/            Retratos recortados (WebP con transparencia) y sus mapas de profundidad
│   │   └── televisor/          16 fotografías de referencia del televisor (no se muestran en la página)
│   ├── fonts/                 Playfair Display y Manrope (woff2)
│   └── vendor/three/          Three.js r170 y complementos (licencia MIT)
├── README.md
├── iniciar.py                 Servidor local
└── INICIAR_PORTAFOLIO.bat     Lanzador para Windows
```

Las rutas son relativas: la carpeta puede moverse o copiarse a una memoria USB sin romper enlaces. Cada modelo se descarga únicamente cuando se abre su expediente.

## 3. Modelos 3D: versión mejorada 8K

El visor muestra una sola versión de cada objeto: la **versión mejorada 8K**, presentada sobre un pedestal. Se obtuvo a partir de la malla de Pix4D así:

1. **Orientación:** se detectó el plano de la mesa (RANSAC) y se giró el modelo para que quede derecho, con el eje vertical hacia arriba, centrado sobre su apoyo (rotación y traslación rígidas: la forma no cambia).
2. **Base circular:** la superficie de apoyo se recortó en círculo alrededor del objeto y los espacios de la mesa que no se reconstruyeron se cubrieron con el tono medio de la mesa.
3. **Reparación de motas:** pequeñas manchas claras que la reconstrucción proyectó sobre el objeto (color de la mesa o reflejos) se repintaron con el color de su entorno. No se aplicó al estuche de CD, para no alterar su gráfica impresa.
4. **Textura de 8192 px** con un realce suave de nitidez, contraste y color.
5. **Precisión:** coordenadas y UV guardadas con 16 bits para que la textura no se desplace en las costuras; normales suaves para el modo Relieve.

La geometría del objeto es la reconstruida por Pix4D: las mallas no tenían huecos abiertos ni fragmentos flotantes, así que no se eliminó ninguna cara del objeto. Por defecto el visor usa el modo **Original**, que muestra la textura sin sombreado añadido, como Pix4D (los MTL indican `illum 0`).

En teléfonos (pantallas táctiles pequeñas o GPU con textura máxima menor a 8192 px) el visor reduce la textura a 4096 px dentro del navegador para no agotar la memoria del equipo.

Los archivos OBJ, MTL y JPG originales de Pix4D se incluyen sin modificar en `assets/models/originales/`. Los FBX no se incluyen para mantener el paquete bajo el límite de descarga: contienen la misma malla que el OBJ.

### Tasita indígena: pieza completada

Pix4D reconstruyó el hombro y la panza del cuenco, pero no la parte baja del cuerpo (apoyada en la mesa) ni el interior (boca estrecha). Como es una **pieza de revolución**, el modelo se completó así:

1. Se ajustó por mínimos cuadrados el eje real de la pieza (estaba desplazado 5 mm respecto al centro del recorte).
2. Se midió el perfil del cuerpo en la zona reconstruida, barriendo el meridiano por ángulos.
3. Se prolongó ese perfil hasta una base plana y se modeló el interior, y se giró todo sobre el eje para obtener la pieza completa.
4. La textura original se desenrolló en coordenadas cilíndricas sobre el nuevo cuerpo y se realzó; las zonas sin dato (parte baja, base e interior) se completaron con el color medido en sus bordes. **No se repitió ni se inventó ningún módulo de la decoración.**

### Billetes de 20 y 50 pesos oro

Los billetes se presentan como láminas delgadas que conservan la curvatura y el doblez registrados en la captura. Cada cara (anverso y reverso) lleva su textura en alta resolución (2048 px), con la luz nivelada y la nitidez realzada, de modo que se leen las leyendas, las series, las fechas y las firmas. La mesa se recortó en círculo sobre el pedestal.

### Visor 3D

Rotación libre de 360°, zoom con rueda o pellizco, desplazamiento con clic derecho o dos dedos, giro automático, pausa, centrar, restablecer cámara, pantalla completa, cuatro modos (Original, Relieve, Malla, Geometría) e iluminación configurable (Museo, Estudio, Rasante; intensidad y dirección).

### Experiencia

- **Vitrina 3D:** una sección de la portada muestra cada pieza girando sobre su propio eje, con cambio automático cada 14 segundos; se puede arrastrar para girarla, elegir la pieza en la lista o abrir su expediente.
- **El precio de la historia:** la sección que da sentido al proyecto, con las cifras de la colección (piezas, fotografías y triángulos reconstruidos) animadas al entrar en pantalla.

- **Recorrido guiado:** el botón «Recorrido» (barra superior) o «Recorrido guiado» (portada) abre los expedientes uno tras otro, con giro automático y avance cada 26 segundos; se puede pausar o moverse con las flechas ← →. Pensado para la sustentación.
- **Partículas doradas** en la portada, botones con leve efecto magnético y revelado progresivo de las tarjetas (todo se desactiva con «reducir movimiento»).

### Piezas 10 a 14

- **10 Televisor Sony Trinitron, 11 Radio de mesa, 12 Máquina de escribir y 13 Teléfono de disco** son *modelos de estudio*: modelos 3D digitales con acabado de reconstrucción fotogramétrica estilo Pix4D (malla deformada, grano de superficie, terreno de borde irregular y nube de puntos), entregados ya preparados. No provienen de un registro fotográfico procesado y así se indica en su ficha; la galería los separa con el filtro «Modelos de estudio». Sus fichas son una redacción curatorial a partir de lo que muestran los modelos.
- **14 Imán de Cartagena** es una reconstrucción Pix4D real (548 fotografías con PIX4Dcatch, 535 calibradas). Su ficha usa los datos del informe de Pix4D. El modelo se niveló detectando el plano de la mesa y se recortó una base circular de 11,6 cm alrededor de la pieza; los OBJ, MTL y JPG originales están en `assets/models/originales/cartagena/`.

### Rendimiento

- El visor carga la versión **web** de cada pieza (textura 4096 px, geometría comprimida con meshopt): entre 2 y 5 MB, frente a 7–30 MB del archivo 8K, que queda para el botón de descarga.
- Las tarjetas y la portada usan imágenes WebP de 900 px (362 KB en total, antes 3,2 MB).
- La vitrina descarga cada pieza una sola vez y solo avanza mientras está a la vista. Las secciones fuera de pantalla no se dibujan hasta acercarse, la resolución de render 3D se limita a 1,5× y se quitaron el desplazamiento suave por script, la pieza destacada y los desenfoques de fondo sobre los visores.

### Animaciones y experiencia

- **Autores:** biografía de cada integrante con su retrato en profundidad. El fondo negro se recortó y se generó un mapa de profundidad (contorno del cuerpo y volumen de la cabeza); al mover el cursor, cada píxel se desplaza según su profundidad (paralaje en WebGL), la tarjeta se inclina en perspectiva y un anillo de «cámaras» —como las posiciones de captura de la fotogrametría— pasa por delante y por detrás del retrato.
- Títulos que se revelan palabra por palabra y cursor de lente sobre las imágenes. Todo se desactiva con «reducir movimiento».

## 4. Criterios sobre los datos

- Los datos técnicos de las fichas 01–09 y 14 se transcriben exactamente como fueron suministrados o como los reporta Pix4D.
- Para el carrito, el teléfono y el sombrero la ficha suministrada no incluye georreferenciación ni tamaño del registro; esos campos no se muestran ni se inventan.
- Vértices, caras y resoluciones de textura se leyeron directamente de los archivos.
- El año 1862 se menciona solo como fecha asociada a la marca Barbisio, nunca como fecha de fabricación del sombrero.
- No se atribuye antigüedad, marca, lugar de fabricación ni procedencia a la plancha, al joyero ni al estuche de CD, ni pueblo, región o antigüedad a la tasita indígena.
- De los billetes se transcriben la serie y la fecha que llevan impresas.
- Los datos del informe Pix4D del estuche de CD (fotografías, nitidez, georreferenciación y tamaño) están pendientes y aparecen como «Por confirmar».

## 5. Solución de problemas

- **«El visor 3D necesita un servidor local»:** abre el portafolio con `INICIAR_PORTAFOLIO.bat` o `iniciar.py`, no con doble clic sobre `index.html`.
- **No se encuentra Python en Windows:** instálalo desde python.org marcando «Add Python to PATH», o usa la versión A.
- **El modelo tarda en cargar:** cada modelo pesa entre 7 y 15 MB. Desde el servidor local carga en pocos segundos; la versión A ofrece vistas previas más livianas.
- **Ver el portafolio en el celular:** con el computador y el celular en la misma red Wi-Fi puede adaptarse `iniciar.py` para escuchar en la red local; la forma más simple es abrir la versión A en el teléfono.
- **Accesibilidad:** el sitio respeta la preferencia del sistema «reducir movimiento».

---

Archivo del Tiempo © 2026 — María Fernanda Castro Casallas · Andrés Ricardo Romero Rodríguez
