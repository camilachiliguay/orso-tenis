# Orso Tenis

Sitio web para reservar canchas de tenis y administrar jugadores. Proyecto final del curso.

- **Frontend:** Next.js (carpeta `frontend/`)
- **Backend:** Node.js + Express, con **Handlebars** como motor de plantillas y **Nodemailer** para el correo (carpeta `backend/`)
- **Base de datos:** MySQL (`database/orso_tenis.sql`)

## Secciones del sitio

| Sección   | Ruta         | Qué hace                                                    |
| --------- | ------------ | ----------------------------------------------------------- |
| Inicio    | `/`          | Portada y accesos a las demás secciones                     |
| Reservas  | `/reservas`  | Crear, ver, editar y cancelar reservas; comprobante en HTML |
| Jugadores | `/jugadores` | ABM completo: listar, agregar, modificar y **eliminar**     |
| Contacto  | `/contacto`  | Formulario que envía un correo a una dirección predefinida  |

## Cumplimiento de la consigna

- **4 secciones navegables:** menú superior y pie de página con enlaces internos.
- **Next.js** en el frontend y **Node.js** en el servidor.
- **Handlebars:** plantilla del correo (`backend/src/templates/emails/contact.hbs`) y vistas del servidor (`backend/src/views/`), por ejemplo el comprobante de reserva `GET /api/reservations/:id/receipt`.
- **Envío de mails:** `POST /api/contact` valida el formulario, genera el HTML con Handlebars y lo envía con Nodemailer a `MAIL_TO`.
- **Leer, escribir, modificar y eliminar:** tabla `players` (`GET`, `POST`, `PUT`, `DELETE /api/players`). Las reservas también se crean, leen, modifican y cancelan.

## Requisitos

- Node.js 20 o superior
- MySQL 8 (o MariaDB 10.5+)

## Instalación rápida

```bash
npm run install:all      # instala backend y frontend
```

Luego seguí los pasos 1 a 3 de abajo (base de datos, `.env` y arranque). Cada parte tiene su propio `package.json`
(`backend/package.json` y `frontend/package.json`) y desde la raíz podés usar `npm run dev:backend` y `npm run dev:frontend`.

## Instalación paso a paso

### 1. Base de datos

Importá `database/orso_tenis.sql`:

```bash
mysql -u root -p < database/orso_tenis.sql
```

(o desde MySQL Workbench: _Server > Data Import > Import from Self-Contained File_). Crea la base `orso_tenis` con datos de ejemplo.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # en Windows: copy .env.example .env
```

Completá el `.env` (base de datos y correo, ver abajo) y ejecutá:

```bash
npm run dev                 # http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local  # en Windows: copy .env.example .env.local
npm run dev                 # http://localhost:3000
```

## Configurar el envío de correos (Gmail)

1. Activá la verificación en 2 pasos en tu cuenta de Google.
2. Creá una **contraseña de aplicación** (Cuenta de Google > Seguridad > Contraseñas de aplicaciones).
3. En `backend/.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tu_cuenta@gmail.com
   SMTP_PASS=la_contraseña_de_aplicación
   MAIL_TO=direccion_que_recibe_los_mensajes@gmail.com
   ```

Nunca subas el `.env` a GitHub (ya está en `.gitignore`).

## Estructura

```
orso-tenis/
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── config/          (database.js, handlebars.js)
│       ├── controllers/     (reservas, jugadores, contacto)
│       ├── routes/
│       ├── middlewares/     (limitador de envíos)
│       ├── templates/emails/ (plantilla Handlebars del correo)
│       └── views/           (vistas Handlebars: comprobante, error)
├── frontend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app/             (páginas: inicio, reservas, jugadores, contacto)
│       ├── components/      (Navbar, Footer, calendario)
│       └── services/        (llamadas a la API)
├── database/orso_tenis.sql
├── docs/guion-video.md
├── package.json             (atajos para instalar y arrancar)
└── README.md
```

## Pendiente / mejoras futuras

- Autenticación: hoy `created_by` y `cancelled_by` usan un usuario fijo (`frontend/src/config/currentUser.js`).

## Usuarios y roles

El sitio tiene login (email + contraseña, sesión con token firmado) y dos roles:

| Rol        | Puede                                                                       |
| ---------- | --------------------------------------------------------------------------- |
| `admin`    | Todo: reservar y cancelar turnos, y agregar, modificar y eliminar jugadores |
| `staff`    | Igual que `admin` en jugadores y reservas (personal del club)               |
| `player`   | Ver jugadores y disponibilidad, reservar y cancelar turnos                  |
| sin sesión | Ver el sitio y enviar el formulario de contacto                             |

Usuarios de prueba (cargados por `database/orso_tenis.sql`):

- `admin@orsotenis.com` / `admin123`
- `juan@gmail.com` / `player123`

Las contraseñas se guardan encriptadas (scrypt). Recordá definir `JWT_SECRET` en `backend/.env`.

## Entrega

- Repositorio público en GitHub (sin `node_modules` ni `.env`).
- `package.json` en la raíz, `backend/` y `frontend/`.
- Base de datos exportada: `database/orso_tenis.sql`.
- Video de demostración: _pegar aquí el link de YouTube_.
