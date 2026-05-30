// ============================================================
//  config.js — DATOS DEL CLUB (editá todo acá)
// ============================================================

const CONFIG = {

  // --- Identidad ---
  nombre:    "La Pancha Pádel",
  tagline:   "General Las Heras",
  localidad: "General Las Heras, Buenos Aires",

  // --- Precio y horarios ---
  precioPorHora:   8000,
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

  // --- Admin ---
  adminUsuario: "admin",
  adminPassword: "padel2025",
};