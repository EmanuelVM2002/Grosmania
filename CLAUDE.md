# Gro’smania Heladería — contexto del proyecto (leer primero)

Página web de la heladería **Gro’smania**. Frontend en HTML + CSS + JS puro (sin build) y un **Cloudflare Worker** (`src/`) con base de datos
(**Neon** por HTTP, o **D1** si se prefiere). El usuario habla español; textos en español (Colombia). **No es un repositorio git.**
Cómo publicar: `DESPLIEGUE.md`.

## Archivos
- Página pública: `index.html`, `style.css`, `script.js` (carta desde `/api/menu`, sabores, pago, banner de cerrado, domicilios, Club, opiniones). `common.js` = utilidades compartidas (también `storeStatus`, `api`, `openModal`).
- Panel: `admin.html` + `admin.js` (pestañas Resumen, Clientes, Productos, Sabores, Comentarios, Ajustes). El enlace viejo `#admin` redirige a `admin.html`.
- Servidor (`src/`): `worker.js` (API y rutas), `db.js` (acceso a datos + esquema), `ledger.js` (puntos: vencimiento y gasto FIFO), `seed.js` (carta/ajustes iniciales, también respaldo si la base falla).
- `menu-fallback.js`: copia de la carta inicial para abrir `index.html` con doble clic o si el servidor falla. **Se genera**: tras editar `src/seed.js` correr `node test/build-fallback.mjs` (una prueba avisa si quedó desactualizado).
- `test/api.test.mjs` (20 pruebas con SQLite de Node: `node --test test/api.test.mjs`) y `test/dev-server.mjs` (servidor local sin dependencias, puerto 8791, contraseña local `admin123`; entrada «grosmania» en `../.claude/launch.json`).
- `wrangler.jsonc`, `.assetsignore` (lo que no se publica), `.dev.vars.example`, `package.json` (sin dependencias; en este equipo `npm install` falla por el certificado corporativo, por eso no hay ninguna).
- `fotos/`, `logos/`: como antes. `respaldo/`, `propuesta.html`, `Propuesta-Grosmania.pdf`, `mockups/`, `p1/3/4.jpg`: material anterior, **desactualizado y no se publica**.

## Decisiones del cliente
- (14/10/2026) Sin hero; público mayor → letra grande, botones con texto. Sin reservas de mesas. WhatsApp flotante abajo a la izquierda; el pedido se envía por WhatsApp. Mapa/«Cómo llegar» con https://maps.app.goo.gl/c2L7uqFson3YxZ9f8. Crédito «Página creada por Sonetix».
- (15/10/2026) **Forma de pago** en el pedido: Efectivo (opcional «¿con cuánto pagas?») o Transferencia (datos en Ajustes; si están vacíos se piden por WhatsApp).
- **Sabores de helado**: cada producto define cuántos sabores elige el cliente (`flavors`, 0–5); lista de sabores editable. Categoría nueva «Helados».
- **Club**: puntos **solo por el valor de los productos** (sin domicilio), 1 por cada $1.000; **vencen a los 6 meses** de cada compra (se gastan primero los más viejos); un premio por canje, en **un solo producto**, **sin acumular promociones**, máximo un canje por día; cumpleaños una vez al año. Políticas visibles en la sección Club (`script.js` → `renderClubPublic`) y validadas en el servidor.
- **Domicilio**: costo **máximo $15.500** (se interpretó como tope del costo del domicilio; configurable en Ajustes). Interruptor para activar/desactivar domicilios (barra superior del panel).
- (20/10/2026) **Domicilio por metros**: el cliente toca «Compartir mi ubicación» (GPS del navegador) en el pedido; `common.js` mide los metros por calle con OSRM público (`router.project-osrm.org`, sin clave; si no responde usa línea recta × 1,3 y marca «aprox.») y cobra `metros × valor por metro`, redondeado hacia arriba a $100 y **sin pasar del máximo** (`deliveryFee`). Ajustes → «Domicilios y pagos»: `delivery_per_meter` (supuesto **$3/m, por confirmar**; 0 = sin cálculo), `delivery_fee_max` (tope) y `store_lat`/`store_lng` (por defecto las del mapa de la página). El mensaje de WhatsApp lleva el domicilio exacto, los metros y un enlace de Google Maps a la ubicación. **Marcar en el mapa** (`script.js` → `openAddressMap`): el cliente escribe la dirección, el buscador gratuito Nominatim (OpenStreetMap, cerca del local, con «Cra/Cl/Av» expandidas) pone un pin, él lo arrastra o toca el mapa y confirma «Sí, es aquí»; también tiene botón GPS. Mapa con **Leaflet 1.9.4 copiado en `leaflet/`** (hashes verificados, sin CDN) y teselas de OpenStreetMap; se carga solo al abrir el mapa. Las direcciones colombianas casi nunca traen número exacto en OSM, por eso la confirmación manual es obligatoria. Si el cliente no marca ubicación, queda el comportamiento anterior (máximo, se confirma por WhatsApp).
- **Banner de cerrado** según horario (hora de Colombia) o cierre manual desde el panel; con el local cerrado el botón de enviar pedido queda desactivado.
- **Comentarios**: llegan «pendientes»; se publican desde el panel.
- Reportería: puntos emitidos / canjeados / vencidos / disponibles, puntos por mes, metas mensuales (ventas, clientes nuevos, puntos canjeados), premios más canjeados.

- (15/10/2026) **Carta real cargada** (12 páginas que envió el cliente) en `src/seed.js`: 83 productos en 10 categorías (Copas, Fresas y duraznos, Ensaladas y salpicones, Malteadas, Postres, Waffles/donas/obleas, Helados, Bebidas, Mascotas, Adiciones). Cada producto puede pedir **sabores de helado** (`flavors`) y **grupos de opciones** (`groups`: salsa, fruta, topping…, p. ej. «Arma tu waffle», minidonas, jugos). Adiciones se muestran como lista compacta.
- **Precios en la página en formato corto**: 13.000 → `13K`, 15.500 → `15,5K` (`pk()` en `common.js`). El panel y el mensaje de WhatsApp siguen con el valor completo.
- La carpeta `../heladeria` es de *Helados Las Lunas* (otro negocio): **no usar**.

## Pendientes / datos por confirmar
1. **La carta NO trae la lista de sabores de helado**: los 13 de `SEED_FLAVORS` son borrador (los que menciona la carta + habituales). Por confirmar también: sabores de «Infantil» (puse 2) y «1 litro» (puse 1), y qué productos son «Copa de la casa» para el premio. Las **fotos nuevas son recortes de las páginas de la carta** (baja resolución): reemplazar por las originales. Productos sin foto muestran el logo. Todo se corrige desde el panel (Productos / Sabores).
2. Hora de cierre: **21:00 es un supuesto** (solo se sabía «desde la 1:30 pm»).
3. Premios, niveles, vigencia (6 meses) y políticas del Club: **propuestos por nosotros**, por confirmar. El regalo de cumpleaños sigue siendo «sorpresa».
4. `INSTAGRAM_HANDLE` / `INSTAGRAM_URL` supuestos (`@grosmania`). Dirección escrita del local desconocida.
5. **Sin publicar**: hace falta crear la base en Neon (la cuenta la crea el usuario), cargar los 3 secretos (`DATABASE_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`) y `wrangler deploy`. El **cliente nuevo del Club se registra en el panel** (el formulario público solo envía los datos por WhatsApp).
6. El camino a Neon (`db.js`, consulta HTTP `POST https://<host>/sql`) **no se pudo probar contra una base real** en esta sesión (sin red a Neon desde aquí); el resto se probó con SQLite, con el mismo SQL. Probar primero con `/api/menu` y un login tras el despliegue.
7. Las fotos nuevas de productos hay que añadirlas a `fotos/` **y** a `PHOTOS` en `src/seed.js` (el panel solo ofrece esas).
