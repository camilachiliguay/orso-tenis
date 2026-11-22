# Orso Tenis – Frontend

Aplicación Next.js para gestionar reservas de canchas.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrí http://localhost:3000. Necesita el backend corriendo (ver README de la raíz).

## Variables de entorno

| Variable              | Descripción        | Valor por defecto       |
| --------------------- | ------------------ | ----------------------- |
| `NEXT_PUBLIC_API_URL` | URL base de la API | `http://localhost:3001` |

## Estructura

- `src/app/reservas/page.js`: pantalla de gestión de reservas.
- `src/components/AvailabilityCalendar.js`: calendario de fechas habilitadas.
- `src/services/reservationService.js`: llamadas a la API.
- `src/config/currentUser.js`: usuario temporal hasta que exista login.
