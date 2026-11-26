# ServiRed

Prototipo académico para registrar clientes, recibir solicitudes de servicio,
asignar órdenes de trabajo y consultar su estado. El documento de la Actividad 4
está en [docs/Actividad_4_ServiRed.docx](docs/Actividad_4_ServiRed.docx).

## Ejecutar

Con Node.js 24 o superior, abre una terminal en la carpeta del proyecto.

```sh
npm ci
npm test
npm run build
npm start
```

Abre http://127.0.0.1:3000/ para la aplicación y
http://127.0.0.1:3000/api-docs/ para Swagger UI. La base SQLite se crea
automáticamente y se conserva en `servired.sqlite`. Técnicos de demostración
disponibles: Laura Méndez y Daniel Ruiz.

En desarrollo, conserva `npm start` en una terminal y ejecuta `npm run dev`
en otra. Abre la dirección que indique Vite. El proxy de Vite reenvía las
peticiones de la API al puerto 3000.

## Recorrido de demostración

1. En Administración, registra un cliente ficticio (Paula Demo, 3000000001).
2. En Solicitudes, elige ese cliente y registra «Revisar conexión del router».
3. En Órdenes, selecciona la solicitud y asígnala a Laura Méndez.
4. Cambia la vista a Técnico, selecciona a Laura e inicia la orden. Después,
   finalízala.
5. Cambia a Consulta y filtra las solicitudes por Finalizada. Recarga la página
   para verificar que el estado se conserva. Si la vista vuelve a Administración,
   selecciona nuevamente Consulta.

Las vistas ilustran la experiencia de los tres perfiles. El prototipo usa
datos ficticios y el selector de perfil actúa sobre la interfaz. Para un uso
real se debe implementar inicio de sesión y verificación de permisos en la API.

## Código

| Ubicación | Contenido |
| --- | --- |
| `src/main.jsx` | Pantallas, rutas, formularios y selector de perfiles |
| `src/servicios.jsx` | Context API, hooks, estado de carga y peticiones Axios |
| `src/style.css` | Estilos y adaptación a móvil |
| `server/app.js` | Endpoints y reglas de negocio |
| `server/db.js` | Base de datos y relaciones |
| `server/openapi.json` | Contrato OpenAPI que usa Swagger UI |
| `server/app.test.js` | Pruebas de API con SQLite en memoria |

## Despliegue de demostración

`npm run build` genera el front-end en `dist/`. Express sirve esa carpeta y la
API en el mismo origen. Para instalarlo en un servidor privado, ejecuta los
mismos pasos y configura el puerto con `PORT` y la ruta de almacenamiento con
`DB_PATH`. El valor predeterminado de `HOST` es `127.0.0.1`. Si el acceso será
remoto, utiliza un proxy HTTPS con acceso restringido y un volumen persistente
para la base de datos. GitHub se usa para versionar y compartir el código y el
Word. GitHub Pages por sí solo sirve archivos estáticos y no ejecuta Express.

## Publicación en GitHub

Crea un repositorio privado vacío en tu cuenta de GitHub y agrega sus integrantes
o a la tutora según el esquema de entrega del curso. Desde la carpeta del
proyecto puedes publicar los archivos con Git, después de sustituir
`TU_USUARIO` por tu usuario y verificar que el repositorio se llame `ServiRed`.

```sh
git init -b main
git add .
git commit -m "Actividad 4 de ServiRed"
git remote add origin https://github.com/TU_USUARIO/ServiRed.git
git push -u origin main
```

Verifica que se vean `README.md`, `src/`, `server/` y
`docs/Actividad_4_ServiRed.docx`. Copia el enlace del repositorio en la entrega.
