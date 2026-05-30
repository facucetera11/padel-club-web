// ============================================================
//  config.js — DATOS DEL CLUB (editá todo acá)
// ============================================================

const CONFIG = {

  // --- Identidad ---
  nombre:    "La Pancha Pádel",
  tagline:   "General Las Heras",
  localidad: "General Las Heras, Buenos Aires",

  // --- Precios ---
  precioEfectivo:      8000,   // precio pagando en el club (efectivo)
  precioTransferencia: 7500,   // precio pagando por transferencia (puede ser menor o mayor)

  // --- Horarios ---
  horarioApertura: 7,
  horarioCierre:   23,

  // --- Canchas ---
  canchas: [
    {
      id: 1,
      nombre:    "Cancha 1",
      subtitulo: "Sintetico · Blindex",
      descripcion: "Al aire libre",
      caracteristicas: [
        "Pasto sintético",
        "Paredes de blindex",
        "Iluminación LED nocturna",
        "Al aire libre",
      ]
    },
    {
      id: 2,
      nombre:    "Cancha 2",
      subtitulo: "Sintetico · Blindex",
      descripcion: "Al aire libre",
      caracteristicas: [
        "Pasto sintético",
        "Paredes de blindex",
        "Iluminación LED nocturna",
        "Al aire libre",
      ]
    }
  ],

  // --- WhatsApp ---
  whatsappNumero: "5492227000000",

  // --- Estado del club ---
  clubAbierto:    true,
  mensajeCierre:  "⛈️ Por lluvia, el club está temporalmente cerrado. Seguinos en redes para novedades.",

  // --- Admin ---
  adminUsuario: "admin",
  adminPassword: "padel2025",
};