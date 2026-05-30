// ============================================================
//  bookings.js — Lógica de reservas
// ============================================================

let bookings = [
  { id: 1, nombre: "María González", tel: "2227-000001", cancha: "Cancha 1", fecha: getFutureDate(0), hora: "09:00", estado: "confirmed" },
  { id: 2, nombre: "Carlos Ruiz",    tel: "2227-000002", cancha: "Cancha 2", fecha: getFutureDate(0), hora: "10:00", estado: "confirmed" },
  { id: 3, nombre: "Ana Pérez",      tel: "2227-000003", cancha: "Cancha 1", fecha: getFutureDate(0), hora: "19:00", estado: "pending"   },
  { id: 4, nombre: "Javier López",   tel: "2227-000004", cancha: "Cancha 2", fecha: getFutureDate(1), hora: "18:00", estado: "confirmed" },
  { id: 5, nombre: "Laura Sosa",     tel: "2227-000005", cancha: "Cancha 1", fecha: getFutureDate(2), hora: "20:00", estado: "confirmed" },
];
let nextId = 6;
let selectedSlot = null;

function getHours() {
  const hours = [];
  for (let h = CONFIG.horarioApertura; h < CONFIG.horarioCierre; h++) {
    hours.push(h.toString().padStart(2, "0") + ":00");
  }
  return hours;
}

function getFutureDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

function updateSlots() {
  const canchaId = document.getElementById("sel-cancha").value;
  const fecha    = document.getElementById("sel-fecha").value;
  selectedSlot   = null;

  document.getElementById("confirm-box").style.display = "none";
  document.getElementById("book-btn").style.display    = "none";
  document.getElementById("success-msg").style.display = "none";

  if (!canchaId || !fecha) {
    document.getElementById("slots-section").style.display = "none";
    return;
  }

  document.getElementById("slots-section").style.display = "block";

  const cname = CONFIG.canchas.find(c => c.id === parseInt(canchaId))?.nombre || "";
  const taken = bookings
    .filter(b => b.cancha === cname && b.fecha === fecha && b.estado !== "cancelled")
    .map(b => b.hora);

  const now     = new Date();
  const isToday = fecha === now.toISOString().split("T")[0];
  const curH    = now.getHours();

  const grid = document.getElementById("slots-grid");
  grid.innerHTML = getHours().map(h => {
    const hNum    = parseInt(h);
    const isTaken = taken.includes(h);
    const isPast  = isToday && hNum <= curH;
    if (isTaken || isPast) {
      return `<div class="slot taken">${h}</div>`;
    }
    return `<div class="slot" onclick="selectSlot('${h}', this)">${h}</div>`;
  }).join("");

  checkForm();
}

function selectSlot(h, el) {
  document.querySelectorAll(".slot").forEach(s => s.classList.remove("selected"));
  el.classList.add("selected");
  selectedSlot = h;

  const canchaId = document.getElementById("sel-cancha").value;
  const fecha    = document.getElementById("sel-fecha").value;
  const cancha   = CONFIG.canchas.find(c => c.id === parseInt(canchaId));

  document.getElementById("c-cancha").textContent = cancha ? `${cancha.nombre} — ${cancha.subtitulo}` : "—";
  document.getElementById("c-fecha").textContent  = new Date(fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("c-hora").textContent   = h + " — " + (parseInt(h) + 1).toString().padStart(2, "0") + ":00";
  document.getElementById("c-nombre").textContent = document.getElementById("inp-nombre").value || "—";
  document.getElementById("c-precio").textContent = "$" + CONFIG.precioPorHora.toLocaleString("es-AR");
  document.getElementById("confirm-box").style.display = "block";

  checkForm();
}

function checkForm() {
  const ok =
    document.getElementById("sel-cancha").value &&
    document.getElementById("sel-fecha").value &&
    document.getElementById("inp-nombre").value.trim() &&
    document.getElementById("inp-tel").value.trim() &&
    selectedSlot;

  document.getElementById("book-btn").style.display = ok ? "block" : "none";

  document.getElementById("step2").classList.toggle("active",
    !!(document.getElementById("sel-cancha").value && document.getElementById("sel-fecha").value));
  document.getElementById("step3").classList.toggle("active", !!ok);
}

function confirmarReserva() {
  const canchaId = document.getElementById("sel-cancha").value;
  const fecha    = document.getElementById("sel-fecha").value;
  const nombre   = document.getElementById("inp-nombre").value.trim();
  const tel      = document.getElementById("inp-tel").value.trim();
  const cancha   = CONFIG.canchas.find(c => c.id === parseInt(canchaId));

  bookings.push({
    id: nextId++, nombre, tel,
    cancha: cancha.nombre, fecha,
    hora: selectedSlot,
    estado: "confirmed",
  });

  document.getElementById("confirm-box").style.display = "none";
  document.getElementById("book-btn").style.display    = "none";
  document.getElementById("success-detail").textContent =
    cancha.nombre + " · " +
    new Date(fecha + "T12:00").toLocaleDateString("es-AR", { day: "numeric", month: "long" }) +
    " " + selectedSlot + " — ¡Te esperamos!";
  document.getElementById("success-msg").style.display = "block";
  updateSlots();
}

function resetBooking() {
  document.getElementById("sel-cancha").value = "";
  document.getElementById("sel-fecha").value  = "";
  document.getElementById("inp-nombre").value = "";
  document.getElementById("inp-tel").value    = "";
  selectedSlot = null;

  ["slots-section","confirm-box","book-btn","success-msg"].forEach(id => {
    document.getElementById(id).style.display = "none";
  });
  document.querySelectorAll(".step").forEach(s => s.classList.remove("active","done"));
  document.getElementById("step1").classList.add("active");
}
