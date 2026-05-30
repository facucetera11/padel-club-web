// ============================================================
//  config.js — DATOS DEL CLUB (editá todo acá)
// ============================================================

const CONFIG = {

  // --- Identidad ---
  nombre:    "La Pancha Pádel",
  tagline:   "Marcos Paz",
  localidad: "Marcos Paz, Buenos Aires",

  // --- Precio y horarios ---
  precioPorHora:   8000,
  horarioApertura: 7,
  horarioCierre:   23,

  // --- Canchas ---
  canchas: [
    {
      id: 1,
      nombre:    "Cancha 1",
      subtitulo: "Sintetico azul · Blindex",
      descripcion: "Al aire libre, ideal para partidas y torneos",
      tag: "CANCHA NORTE",
      caracteristicas: [
        "Piso sintético color azul",
        "Paredes de blindex",
        "Iluminación LED nocturna",
        "Al aire libre",
        "Capacidad 4 jugadores",
        "Alquiler de paletas",
      ]
    },
    {
      id: 2,
      nombre:    "Cancha 2",
      subtitulo: "Sintetico azul · Blindex",
      descripcion: "Al aire libre, clásica y rápida",
      tag: "CANCHA SUR",
      caracteristicas: [
        "Piso sintético color azul",
        "Paredes de blindex",
        "Iluminación LED nocturna",
        "Al aire libre",
        "Capacidad 4 jugadores",
        "Zona de calentamiento",
      ]
    }
  ],

  // --- Admin ---
  adminUsuario: "admin",
  adminPassword: "padel2025",
};