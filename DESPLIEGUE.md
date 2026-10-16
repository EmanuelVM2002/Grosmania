# Cómo publicar Gro’smania (Cloudflare + D1)

**Con GitHub + Cloudflare conectados (el flujo en uso):**
1. Sube a GitHub **solo el contenido de `heladeria-grosmania/`** (el `.gitignore` ya excluye claves y datos locales). Si subes una carpeta más grande, en Cloudflare pon «Root directory» = `heladeria-grosmania`.
2. Cloudflare → Workers & Pages → **D1 SQL Database → Create** → nombre `grosmania-db`. Copia su **Database ID**.
3. En `wrangler.jsonc` reemplaza `PEGAR-AQUI-EL-ID` por ese ID y sube el cambio (commit + push).
4. Cloudflare → tu Worker → **Settings → Variables and Secrets → Add** (tipo **Secret**): `ADMIN_PASSWORD` (tu contraseña, 10+ caracteres) y `SESSION_SECRET` (texto aleatorio largo, 40+ caracteres).
5. El nombre del Worker en Cloudflare debe ser **`grosmania`** (igual al `name` de `wrangler.jsonc`) y el comando de despliegue `npx wrangler deploy`.
6. Cada push a GitHub vuelve a publicar solo.

**Camino con doble clic (sin GitHub):** doble clic en `Publicar-Grosmania.bat`. Inicia sesión en Cloudflare, crea la base `grosmania-db`,
publica la página y guarda la contraseña del administrador y la clave de sesiones. Se puede repetir para actualizar la página sin perder datos.
Lo de abajo describe lo mismo a mano y la alternativa con Neon.

La página son archivos estáticos + un **Worker** de Cloudflare (`src/worker.js`) que atiende `/api/*` y guarda todo en una base de datos
(clientes, puntos, productos, sabores, comentarios y ajustes). Sin base de datos la carta sigue visible, pero el panel y el Club no funcionan.

## 1. Crear la base de datos en Neon (5 minutos)

1. Entra a <https://neon.com> y crea tu cuenta (gratis). Esto lo haces tú: yo no puedo crear cuentas.
2. **Create project** → nombre `grosmania`. Región: **AWS São Paulo (sa-east-1)** (la más cercana a Colombia).
3. En el panel del proyecto, **Connect** → copia la cadena de conexión (empieza con `postgresql://…`). Es un secreto: no la pegues en chats ni en archivos de la página.
4. No tienes que crear tablas: el Worker las crea solo la primera vez y carga la carta inicial.

> **¿Y la base gratuita de Cloudflare?** Sí existe: **D1**. Es más simple (sin segunda cuenta) y el código ya la soporta.
> Para usarla, sigue la «OPCIÓN B» comentada en `wrangler.jsonc` y omite el paso del `DATABASE_URL`.
> Neon es igual de válida; con el plan gratuito la base «duerme» si nadie la usa y la primera consulta tarda un poco más.

## 2. Publicar en Cloudflare

En una terminal, dentro de la carpeta `heladeria-grosmania`:

```bash
npx wrangler login
npx wrangler secret put DATABASE_URL      # pega la cadena de Neon
npx wrangler secret put ADMIN_PASSWORD    # la contraseña del administrador (larga, que no sea admin123)
npx wrangler secret put SESSION_SECRET    # un texto aleatorio de 40+ caracteres (firma las sesiones)
npx wrangler deploy
```

Opcional: `ADMIN_USER` (por defecto `admin`) se cambia en `wrangler.jsonc` → `"vars": { "ADMIN_USER": "otro" }`.

Al terminar, Wrangler muestra la dirección (`https://grosmania.<tu-subdominio>.workers.dev`). El panel está en **`/admin.html`**.
El nombre `grosmania` en `wrangler.jsonc` reemplaza la versión anterior de la página si usó ese mismo nombre; si no, se crea una dirección nueva.

**Si `npx` falla con errores de certificado** (red de GCO): configura npm con el certificado corporativo (`cafile` en `~/.npmrc`) o ejecuta el comando desde una red sin inspección TLS. No desactives la verificación TLS.

## 3. Primer uso

1. Entra a `/admin.html` con el usuario y la contraseña que guardaste.
2. **Ajustes** → revisa horario (la hora de cierre es un supuesto: 9:00 pm), datos de transferencia, vigencia de puntos y premios.
3. **Productos** y **Sabores** → ajusta precios y activa/desactiva (la carta y los sabores iniciales son un borrador).
4. Cada cambio se ve en la página al instante, sin volver a publicar.

## Probar en tu equipo

- `node test/dev-server.mjs` → <http://localhost:8791> con una base SQLite en memoria (contraseña local `admin123`). No necesita internet ni Neon.
- `node --test test/api.test.mjs` → 19 pruebas del servidor (puntos, vencimiento, canje, sesión, comentarios, carta inicial).
- `npx wrangler dev` → lo mismo pero con el runtime real de Cloudflare; copia `.dev.vars.example` a `.dev.vars` y complétalo.

## Seguridad (resumen)

- La contraseña vive solo como secreto de Cloudflare; el navegador recibe un permiso temporal firmado (12 h). Tras 8 intentos fallidos se bloquea 15 minutos.
- La consulta pública de puntos pide celular **y** fecha de cumpleaños.
- Los comentarios llegan como «pendientes» y no se ven hasta que el administrador los publica.
- Los clientes y su historial están en la base de datos: haz copias desde Neon (ramas / restauración) y exporta el CSV desde el panel cuando quieras.
