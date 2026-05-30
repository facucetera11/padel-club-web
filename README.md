# 🎾 Pádel Club — Web Premium

Sitio web completo para un complejo de pádel. Diseño de nivel agencia, listo para vender.

## Cómo abrir
1. Abrí la carpeta `padel-club` en VS Code
2. Abrí `index.html` con **Live Server** (extensión de VS Code)
3. O simplemente hacé doble click en `index.html`

No requiere instalación ni dependencias.

## Estructura

```
padel-club/
├── index.html          ← HTML completo de la app
├── css/
│   └── style.css       ← Todos los estilos
├── js/
│   ├── config.js       ← ⭐ EMPEZÁ ACÁ: nombre, precio, horarios, canchas, admin
│   ├── bookings.js     ← Lógica de reservas
│   ├── admin.js        ← Panel de administración
│   └── app.js          ← Navegación entre páginas
└── README.md
```

## ¿Qué cambiar primero?

### 1. `js/config.js`
Todo el contenido editable está acá:
- Nombre del club, localidad
- Precio por hora
- Horario de apertura y cierre
- Datos de cada cancha
- Usuario y contraseña del admin

### 2. `css/style.css`
Variables de color al inicio del archivo:
```css
--lime:  #D4F53C;  /* Acento principal (verde lima) */
--blue:  #0B1F3A;  /* Fondo azul profundo */
--court: #1C4ED8;  /* Azul de las canchas */
```

### 3. `index.html`
Buscá los comentarios `<!-- EDITAR: ... -->` para encontrar los textos del hero, footer y CTA.

## Páginas incluidas

| Página       | Descripción |
|--------------|-------------|
| Inicio       | Hero pantalla completa, características, CTA band, footer |
| Canchas      | Detalle de cada cancha con diagrama visual |
| Reservar     | Formulario de 3 pasos con slots en tiempo real |
| Admin (login)| Acceso con usuario y contraseña |
| Admin (panel)| Métricas, tabla de reservas, agenda semanal 5 días |

## Credenciales admin

Por defecto: `admin` / `padel2025`

Cambiá estos valores en `js/config.js`:
```js
adminUsuario: "admin",
adminPassword: "padel2025",
```

## Próximos pasos recomendados

- [ ] Agregar fotos reales del complejo (reemplazar los SVG con `<img>`)
- [ ] Conectar a Firebase o Supabase para persistir reservas
- [ ] Agregar notificación por WhatsApp al confirmar turno (API de WhatsApp Business)
- [ ] Subir a Netlify o Vercel (gratis, en minutos)
- [ ] Agregar dominio propio (ej: padelclubbsas.com.ar)
