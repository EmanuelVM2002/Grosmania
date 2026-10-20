/* Datos iniciales. Se cargan en la base SOLO la primera vez (tablas vacías);
   después todo se edita desde el panel de administración.
   Si la base no responde, la página pública sigue funcionando con estos datos.
   La carta viene de las 12 páginas que envió el cliente (15/10/2026). */

export const DEFAULT_SETTINGS = {
  delivery_enabled: true,
  delivery_fee_max: 15500,            // costo máximo del domicilio (pesos): tope del cálculo por metros
  delivery_per_meter: 3,              // pesos por metro de distancia (POR CONFIRMAR). 0 = sin cálculo: se muestra el máximo
  store_lat: 6.2378006,               // ubicación del local (la misma del mapa de la página)
  store_lng: -75.5397747,
  open_time: '13:30',
  close_time: '21:00',                // POR CONFIRMAR: no se conoce la hora de cierre
  open_days: [0, 1, 2, 3, 4, 5, 6],   // 0 = domingo
  status_override: 'auto',            // auto | open | closed
  closed_message: '',
  transfer_info: '',                  // p. ej. «Nequi 300 123 4567». Si está vacío se piden los datos por WhatsApp
  points_per: 1000,
  points_valid_months: 6,
  birthday_gift: 'Un regalo sorpresa en la semana de tu cumpleaños',
  rewards: [
    { id: 'adicion', name: 'Adición gratis', pts: 30 },
    { id: 'cono', name: 'Cucurucho de 1 bola', pts: 60 },
    { id: 'copa', name: 'Copa de la casa', pts: 150 }
  ],
  levels: [
    { name: 'Bronce', min: 0 },
    { name: 'Plata', min: 300 },
    { name: 'Oro', min: 800 }
  ],
  goal_monthly_sales: 0,              // 0 = sin meta
  goal_monthly_members: 0,
  goal_monthly_redeemed: 0
};

/* Claves que ve el público (las metas y demás no salen del panel). */
export const PUBLIC_SETTINGS = [
  'delivery_enabled', 'delivery_fee_max', 'delivery_per_meter', 'store_lat', 'store_lng', 'open_time', 'close_time', 'open_days', 'status_override',
  'closed_message', 'transfer_info', 'points_per', 'points_valid_months', 'birthday_gift', 'rewards', 'levels'
];

export const PHOTOS = [
  // fotos originales
  'fotos/fresas-con-crema.jpg', 'fotos/fresas-con-helado.jpg', 'fotos/ensalada-frutas-especial.jpg',
  'fotos/waffle-oreo-fresas.jpg', 'fotos/mini-waffles-helado.jpg', 'fotos/copa-caramelo-crocante.jpg',
  'fotos/copa-brownie-caramelo.jpg', 'fotos/copa-palmeritas-frutos-rojos.jpg', 'fotos/copa-frutos-rojos.jpg',
  'fotos/copa-ponque-fresas.jpg', 'fotos/vaso-para-llevar.jpg',
  // recortes de la carta (baja resolución: reemplazar por la foto original cuando se tenga)
  'fotos/frutos-amarillos.jpg', 'fotos/duraznos-grande.jpg', 'fotos/fresas-pequenas.jpg', 'fotos/duraznos-pequenos.jpg',
  'fotos/brownie.jpg', 'fotos/banana.jpg', 'fotos/ensalada-frutas.jpg', 'fotos/infantil.jpg',
  'fotos/oblea-queso.jpg', 'fotos/oblea-frutal.jpg', 'fotos/malteada-frutos-rojos.jpg', 'fotos/malteada-brownie.jpg',
  'fotos/malteada-maracumango.jpg', 'fotos/malteada-chocoramo.jpg', 'fotos/malteada-sencilla.jpg',
  'fotos/fondue.jpg', 'fotos/fresas-chocolate.jpg', 'fotos/jugos.jpg', 'fotos/milo.jpg', 'fotos/mascotas.jpg'
];

/* Listas de opciones que se repiten en la carta. */
const SALSAS = ['Chocolate', 'Arequipe', 'Maracuyá', 'Mora', 'Leche condensada'];
const FRUTAS_WAFFLE = ['Banano', 'Durazno', 'Manzana', 'Fresa', 'Mango', 'Piña'];
const TOPPING_WAFFLE = ['Chips de chocolate', 'Chocmelos', 'Mini chips', 'Queso', 'Maní', 'Oreo', 'Corazones de hojaldre',
  'Crispy blanco', 'Masmelos', 'Gusanitos', 'Bolas chokis', 'Gomas clásicas', 'Galleta milo', 'Galletas chokis'];
const TOPPING_DONAS = ['Fresas', 'Banano', 'Chips de chocolate', 'Maní', 'Galleta oreo', 'Galleta mini chips', 'Masmelos',
  'Barquillos piazza', 'Bolas chokis', 'Galletas chokis', 'Galletas milo', 'Chocmelos'];
const JUGOS = ['Frutos rojos', 'Piña - hierbabuena', 'Naranja - piña', 'Mango - maracuyá', 'Frutos amarillos',
  'Mango', 'Guanábana', 'Mandarina', 'Maracuyá'];
const g = (name, count, choices) => ({ name, count, choices });

/* P(id, categoría, nombre, precio, foto, descripción, sabores de helado a elegir, [grupos de opciones], encuadre) */
const P = (id, cat, name, price, img, descr, flavors = 0, groups = [], pos = 'center') =>
  ({ id, cat, name, price, img, descr, flavors, groups, pos, alt: name });

export const SEED_PRODUCTS = [
  /* ---- Copas de helado ---- */
  P('copa-frutos-amarillos', 'Copas', 'Copa Frutos Amarillos', 15500, 'fotos/frutos-amarillos.jpg', 'Dos sabores de helado, mango, piña y duraznos, salsa de maracuyá, chantillí, barquillo y viruta de chocolate.', 2),
  P('copa-frutos-rojos', 'Copas', 'Copa Frutos Rojos', 15500, 'fotos/copa-frutos-rojos.jpg', 'Dos sabores de helado, fresa, cereza, almíbar de mora artesanal, chantillí, barquillo y viruta de chocolate.', 2, [], 'center 50%'),
  P('copa-queso', 'Copas', 'Copa Queso', 15500, '', 'Dos sabores de helado, abundante queso rallado, crema de leche, salsa a tu elección, chantillí, cereza, barquillo y viruta de chocolate.', 2, [g('Salsa', 1, SALSAS)]),
  P('copa-oreo', 'Copas', 'Copa Oreo', 16000, 'fotos/copa-brownie-caramelo.jpg', 'Dos sabores de helado, galleta oreo, bolas chokis, chips de chocolate, salsa de arequipe y chantillí.', 2, [], 'center 25%'),
  P('copa-gelatina', 'Copas', 'Copa Gelatina', 12500, '', 'Gelatina en cubos, queso rallado, crema de leche, un sabor de helado, leche condensada y viruta de chocolate.', 1),
  P('copa-cereza', 'Copas', 'Copa Cereza', 15500, '', 'Dos sabores de helado, cerezas, salsa de mora, chantillí, barquillo y viruta de chocolate.', 2),
  P('copa-brevas', 'Copas', 'Copa Brevas', 15500, '', 'Dos sabores de helado, brevas, queso, crema de leche, salsa de arequipe, chantillí, barquillo y viruta de chocolate.', 2),
  P('copa-crema', 'Copas', 'Copa Crema', 16500, '', 'Crema chantillí acompañada de una fruta a tu elección, salsa, barquillo y viruta de chocolate.', 0, [g('Fruta', 1, ['Duraznos', 'Fresas', 'Brevas']), g('Salsa', 1, SALSAS)]),
  P('sundae', 'Copas', 'Sundae', 14000, '', 'Dos sabores de helado bañados en un delicioso almíbar de mora artesanal, chantillí, barquillo y viruta de chocolate.', 2),
  P('grosmania', 'Copas', 'Gro’smania', 16500, '', 'Dos sabores de helado, brownie en trozos, galletas mini chips, chocmelos, salsa de chocolate, chantillí y viruta de chocolate. Ideal para los amantes del chocolate.', 2),
  P('copa-chocoramo', 'Copas', 'Copa Chocoramo', 17500, 'fotos/copa-ponque-fresas.jpg', 'Nueva creación: dos sabores de helado, chocoramo en trozos, fresas, chantillí y salsa de chocolate.', 2, [], 'center 20%'),
  P('copa-chokis', 'Copas', 'Copa Chokis', 16500, 'fotos/copa-caramelo-crocante.jpg', 'Nueva creación: dos sabores de helado, galletas chokis trituradas, bolas chokis, chantillí y arequipe.', 2, [], 'center 60%'),
  P('copa-milo', 'Copas', 'Copa Milo', 17500, '', 'Nueva creación: dos sabores de helado, milo en polvo, galleta de milo triturada, nuggets de milo, chantillí y arequipe.', 2),
  P('copa-corazon', 'Copas', 'Copa Corazón', 16500, 'fotos/copa-palmeritas-frutos-rojos.jpg', 'Nueva creación: dos sabores de helado bañados en almíbar de mora, corazones de hojaldre, chantillí y arequipe.', 2, [], 'center 22%'),

  /* ---- Fresas y duraznos ---- */
  P('fresas-pequenas', 'Fresas y duraznos', 'Fresas pequeñas', 12000, 'fotos/fresas-pequenas.jpg', 'Un sabor de helado, fresas, crema de leche, leche condensada, chantillí y viruta de chocolate.', 1),
  P('fresas-grandes', 'Fresas y duraznos', 'Fresas grandes', 16000, 'fotos/fresas-con-crema.jpg', 'Dos sabores de helado, fresas, queso rallado, crema de leche, leche condensada, chantillí, barquillo y viruta de chocolate.', 2, [], 'center 40%'),
  P('duraznos-pequenos', 'Fresas y duraznos', 'Duraznos pequeños', 12500, 'fotos/duraznos-pequenos.jpg', 'Un sabor de helado, duraznos, crema de leche, leche condensada, chantillí, barquillo y viruta de chocolate.', 1),
  P('duraznos-grandes', 'Fresas y duraznos', 'Duraznos grandes', 17000, 'fotos/duraznos-grande.jpg', 'Dos sabores de helado, duraznos, queso rallado, crema de leche, leche condensada, chantillí, barquillo y viruta de chocolate.', 2),

  /* ---- Salpicones y ensaladas ---- */
  P('salpicon-especial', 'Ensaladas y salpicones', 'Salpicón especial', 16500, 'fotos/ensalada-frutas-especial.jpg', 'Deliciosas frutas frescas acompañadas de un sabor de helado, queso rallado, chantillí, barquillo y viruta de chocolate.', 1),
  P('salpicon-sencillo', 'Ensaladas y salpicones', 'Salpicón sencillo', 13000, '', 'Deliciosas frutas frescas acompañadas de un sabor de helado, crispy blanco, barquillo y viruta de chocolate.', 1),
  P('salpicon-natural', 'Ensaladas y salpicones', 'Salpicón natural', 11000, '', 'Salpicón de frutas naturales.', 0),
  P('ensalada-pequena', 'Ensaladas y salpicones', 'Ensalada de frutas pequeña (16 oz)', 16000, 'fotos/ensalada-frutas.jpg', 'Piña, mango, manzana, papaya, banano, fresa, cereza, queso rallado, crema de leche, leche condensada, barquillo y viruta. Incluye 1 sabor de helado y queso.', 1),
  P('ensalada-mediana', 'Ensaladas y salpicones', 'Ensalada de frutas mediana (24 oz)', 17500, 'fotos/ensalada-frutas.jpg', 'Piña, mango, manzana, papaya, banano, fresa, cereza, queso rallado, crema de leche, leche condensada, barquillo y viruta. Incluye 1 sabor de helado y 1 porción de queso.', 1),
  P('ensalada-grande', 'Ensaladas y salpicones', 'Ensalada de frutas grande (32 oz)', 21000, 'fotos/ensalada-frutas.jpg', 'Piña, mango, manzana, papaya, banano, fresa, cereza, queso rallado, crema de leche, leche condensada, barquillo y viruta. Incluye 2 sabores de helado y 2 porciones de queso.', 2),

  /* ---- Malteadas ---- */
  P('malteada-sencilla', 'Malteadas', 'Malteada sencilla', 12500, 'fotos/malteada-sencilla.jpg', 'Sabor de helado a elección, chantillí, barquillo Piazza y viruta de chocolate.', 1),
  P('malteada-chokis', 'Malteadas', 'Malteada especial Chokis', 17000, '', 'Deliciosa malteada con helado de vainilla licuada con galletas chokis, terminada con chantillí, arequipe y bolas chokis.'),
  P('malteada-brownie', 'Malteadas', 'Malteada especial Brownie', 17000, 'fotos/malteada-brownie.jpg', 'Deliciosa malteada con helado de brownie o vainilla licuada con brownie, terminada con chantillí, arequipe y trocitos de brownie.', 0, [g('Helado', 1, ['Brownie', 'Vainilla'])]),
  P('malteada-frutos-rojos', 'Malteadas', 'Malteada especial Frutos Rojos', 17000, 'fotos/malteada-frutos-rojos.jpg', 'Deliciosa malteada con helado de frutos rojos, licuada con almíbar de mora, terminada con trocitos de fresa, chantillí y más almíbar.'),
  P('malteada-maracumango', 'Malteadas', 'Malteada especial Maracumango', 17000, 'fotos/malteada-maracumango.jpg', 'Deliciosa malteada con helado de maracuyá licuada con pulpa de maracuyá, terminada con trocitos de mango, chantillí y salsa de maracuyá.'),
  P('malteada-milo', 'Malteadas', 'Malteada especial Milo', 17000, '', 'Deliciosa malteada con helado de vainilla licuada con milo y galletas milo, terminada con trocitos de galleta, chantillí, arequipe y milo en polvo.'),
  P('malteada-chocoramo', 'Malteadas', 'Malteada especial Chocoramo', 17000, 'fotos/malteada-chocoramo.jpg', 'Deliciosa malteada con helado de vainilla y chocolate licuada con chocoramo, terminada con chantillí, trocitos de chocoramo y salsa de chocolate.'),

  /* ---- Postres ---- */
  P('brownie', 'Postres', 'Brownie', 16500, 'fotos/brownie.jpg', 'Brownie caliente o frío acompañado de fresas, banano, un sabor de helado, arequipe y chips de chocolate.', 1, [g('Temperatura del brownie', 1, ['Caliente', 'Frío'])]),
  P('banana-sencilla', 'Postres', 'Banana sencilla', 14500, 'fotos/banana.jpg', 'Tres sabores de helado acompañados de un banano, salsas, chantillí, barquillo y viruta de chocolate.', 3),
  P('banana-especial', 'Postres', 'Banana especial', 17500, 'fotos/banana.jpg', 'Tres sabores de helado acompañados de un banano, brownie en trozos, queso rallado, salsas, chantillí, barquillo y viruta de chocolate.', 3),
  P('fondue', 'Postres', 'Fondue', 28500, 'fotos/fondue.jpg', 'Delicioso chocolate caliente donde podrás sumergir fresas, trozos crujientes de waffle, banano, brownie y dos sabores de helado a tu elección.', 2),
  P('fresas-chocolate', 'Postres', 'Fresas con chocolate', 17000, 'fotos/fresas-chocolate.jpg', 'Deliciosas fresas bañadas con chocolate caliente.'),

  /* ---- Waffles, donas y obleas ---- */
  P('waffle-completo', 'Waffles, donas y obleas', 'Arma tu waffle · Completo', 19500, 'fotos/waffle-oreo-fresas.jpg', '2 frutas, 2 topping, 1 salsa, 1 sabor de helado y chantillí.', 1,
    [g('Fruta', 2, FRUTAS_WAFFLE), g('Topping', 2, TOPPING_WAFFLE), g('Salsa', 1, SALSAS)], 'center 80%'),
  P('waffle-medio', 'Waffles, donas y obleas', 'Arma tu waffle · Medio', 12000, 'fotos/waffle-oreo-fresas.jpg', '1 fruta, 1 topping, 1 salsa y 1 sabor de helado.', 1,
    [g('Fruta', 1, FRUTAS_WAFFLE), g('Topping', 1, TOPPING_WAFFLE), g('Salsa', 1, SALSAS)], 'center 80%'),
  P('donas-6', 'Waffles, donas y obleas', 'Arma tus minidonas · Bandeja de 6', 12500, 'fotos/mini-waffles-helado.jpg', '1 salsa, 2 topping y 1 sabor de helado.', 1,
    [g('Salsa', 1, SALSAS), g('Topping', 2, TOPPING_DONAS)], 'center 70%'),
  P('donas-9', 'Waffles, donas y obleas', 'Arma tus minidonas · Bandeja de 9', 15500, 'fotos/mini-waffles-helado.jpg', '2 salsas, 2 topping y 1 sabor de helado.', 1,
    [g('Salsa', 2, SALSAS), g('Topping', 2, TOPPING_DONAS)], 'center 70%'),
  P('donas-16', 'Waffles, donas y obleas', 'Arma tus minidonas · Bandeja de 16', 25000, 'fotos/mini-waffles-helado.jpg', '3 salsas, 3 topping y 2 sabores de helado.', 2,
    [g('Salsa', 3, SALSAS), g('Topping', 3, TOPPING_DONAS)], 'center 70%'),
  P('oblea-sencilla', 'Waffles, donas y obleas', 'Oblea sencilla', 4500, '', 'Oblea sencilla.'),
  P('oblea-extra-queso', 'Waffles, donas y obleas', 'Oblea extra queso', 12500, 'fotos/oblea-queso.jpg', 'Obleas rellenas con queso rallado, lechera, arequipe, chantillí y viruta de chocolate.'),
  P('oblea-frutal', 'Waffles, donas y obleas', 'Oblea frutal', 12500, 'fotos/oblea-frutal.jpg', 'Obleas rellenas con queso rallado, una fruta a tu elección, lechera, arequipe, chantillí y viruta de chocolate.', 0,
    [g('Fruta', 1, ['Fresa', 'Durazno', 'Mora en almíbar'])]),

  /* ---- Helados ---- */
  P('cucurucho-1', 'Helados', 'Cucurucho · 1 bola', 4000, '', 'Una bola del sabor que elijas en cucurucho.', 1),
  P('cucurucho-2', 'Helados', 'Cucurucho · 2 bolas', 6000, '', 'Dos bolas de helado en cucurucho.', 2),
  P('concha-1', 'Helados', 'Concha · 1 bola', 5000, '', 'Una bola del sabor que elijas en concha.', 1),
  P('concha-2', 'Helados', 'Concha · 2 bolas', 6500, '', 'Dos bolas de helado en concha.', 2),
  P('vaso-helado', 'Helados', 'Vaso de helado', 9000, 'fotos/vaso-para-llevar.jpg', 'Dos sabores de helado con salsa, más chantillí o queso (a tu elección).', 2,
    [g('Acompañamiento', 1, ['Chantillí', 'Queso']), g('Salsa', 1, SALSAS)], 'center 72%'),
  P('infantil', 'Helados', 'Infantil', 9000, 'fotos/infantil.jpg', 'Helado decorado para los más pequeños, con masmelos, gomas y confites.', 2),
  P('litro-helado', 'Helados', '1 litro de helado', 17000, '', 'Un litro de helado del sabor que elijas.', 1),

  /* ---- Bebidas ---- */
  P('jugo-agua', 'Bebidas', 'Jugo natural en agua', 5000, 'fotos/jugos.jpg', 'Combinados o tradicionales: tú eliges la fruta.', 0, [g('Fruta', 1, JUGOS)]),
  P('jugo-leche', 'Bebidas', 'Jugo natural en leche', 6000, 'fotos/jugos.jpg', 'Combinados o tradicionales: tú eliges la fruta.', 0, [g('Fruta', 1, JUGOS)]),
  P('milo', 'Bebidas', 'Milo', 8000, 'fotos/milo.jpg', 'Bebida de milo con borde de chocolate.'),
  P('milo-chantilli', 'Bebidas', 'Milo con chantillí', 10500, 'fotos/milo.jpg', 'Súbele el nivel a tu milo con chantillí.'),

  /* ---- Mascotas ---- */
  P('mascota-pequeno', 'Mascotas', 'Helado para mascotas · Pequeño', 5000, 'fotos/mascotas.jpg', 'Helado especial para perritos.', 0, [g('Sabor', 1, ['Cabano', 'Mango', 'Fresa', 'Galleta'])]),
  P('mascota-grande', 'Mascotas', 'Helado para mascotas · Grande', 6500, 'fotos/mascotas.jpg', 'Helado especial para perritos.', 0, [g('Sabor', 1, ['Cabano', 'Mango', 'Fresa', 'Galleta'])]),
  P('turron-pollo', 'Mascotas', 'Turrón de pollo', 5000, '', 'Snack de pollo para tu mascota.'),

  /* ---- Adiciones (lista compacta) ---- */
  ...[
    ['Una bola de helado', 2000], ['Queso', 4000], ['Brownie', 2500], ['Chips de chocolate', 2500], ['Oreo', 2000],
    ['Gusanitos', 2000], ['Chocmelos', 2500], ['Bolas chokis', 2000], ['Chantillí', 4000], ['Almíbar de mora', 3000],
    ['Chocoramo', 3000], ['Concha', 1500], ['Gelatina', 3000], ['Masmelos', 2000], ['Crispy blanco', 2000],
    ['Piazza', 2000], ['Frutas', 4000], ['Chocolate caliente', 6000], ['Galletas milo', 2000], ['Galletas chokis', 2000],
    ['Nuggets de milo', 3000], ['Corazones de hojaldre', 2000], ['Milo en polvo', 2500], ['Maní', 2500], ['Cucurucho', 1500]
  ].map(([n, pr]) => P('ad-' + n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-'), 'Adiciones', n, pr, '', '', n === 'Una bola de helado' ? 1 : 0))
];

/* BORRADOR: la carta no trae la lista de sabores de helado. Se listan los que menciona la carta y los habituales;
   edítalos en Administración → Sabores. */
export const SEED_FLAVORS = [
  'Vainilla', 'Chocolate', 'Fresa', 'Arequipe', 'Mora', 'Oreo', 'Coco', 'Maracuyá', 'Café', 'Chicle',
  'Brownie', 'Frutos rojos', 'Mango'
];
