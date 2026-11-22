# Guion para el video de entrega

Duración sugerida: 5 a 7 minutos. Tené abiertos el sitio, la terminal del backend, MySQL Workbench y tu bandeja de entrada.

1. **Presentación (20 s).** Nombre del proyecto y tecnologías: Next.js, Node.js/Express, Handlebars, Nodemailer, MySQL.
2. **Navegación (40 s).** Recorré el menú: Inicio, Reservas, Jugadores, Contacto. Mostrá los enlaces del Inicio y del pie de página. Dejá claro que todos llevan a la página correcta.
3. **Jugadores: las 4 operaciones (2 min).**
   - _Leer:_ el listado.
   - _Escribir:_ agregá un jugador.
   - _Modificar:_ editalo y guardá.
   - _Eliminar:_ borralo. Intentá borrar uno con reservas y mostrá que queda bloqueado. Mostrá la tabla en Workbench antes y después.
4. **Reservas (1,5 min).** Creá una reserva (jugador, cancha, fecha, horario). Intentá reservar el mismo horario y mostrá el aviso. Editala y cancelala. Abrí "Ver" en Comprobante: esa página la genera el servidor con Handlebars.
5. **Contacto y mail (1 min).** Completá el formulario, enviá y mostrá el mensaje de éxito. Abrí tu bandeja y mostrá el correo recibido en la dirección predefinida.
6. **Código (1 min).** Mostrá brevemente `contact.hbs`, `contactController.js` y la carpeta `views/`. Mostrá el repositorio de GitHub con `package.json` y `database/orso_tenis.sql`.
7. **Cierre (10 s).**
