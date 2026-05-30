// ============================================================
//  bookings.js — Lógica de reservas (mejorado)
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

/* ── Selección de cancha con cards visuales ── */
function selectCourt(courtId, el) {
  document.querySelectorAll(".bk-court-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  document.getElementById("sel-cancha").value = courtId;
  updateSlots();
}

/* ── Fechas rápidas ── */
function initQuickDates() {
  const container = document.getElementById("bk-quick-dates");
  if (!container) return;
  const labels = ["Hoy", "Mañana", "Pasado"];
  container.innerHTML = labels.map((lb, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const val = d.toISOString().split("T")[0];
    return `<button class="bk-quick-btn" onclick="setQuickDate('${val}', this)">${lb}</button>`;
  }).join("");
}

function setQuickDate(val, el) {
  document.querySelectorAll(".bk-quick-btn").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("sel-fecha").value = val;
  updateSlots();
}

/* ── Actualizar disponibilidad hoy en sidebar ── */
function renderAvailToday() {
  const container = document.getElementById("bk-avail-today-content");
  if (!container) return;
  const today = new Date().toISOString().split("T")[0];
  const now   = new Date();
  const curH  = now.getHours();
  const hours = getHours();

  const rows = CONFIG.canchas.map(c => {
    const taken = bookings.filter(b => b.cancha === c.nombre && b.fecha === today && b.estado !== "cancelled").map(b => b.hora);
    const libres = hours.filter(h => !taken.includes(h) && parseInt(h) > curH).length;
    const pct = hours.length > 0 ? Math.round(((hours.length - taken.length) / hours.length) * 100) : 0;
    return `<div class="avail-today-row">
      <span class="avail-court-name">${c.nombre}</span>
      <div class="avail-mini-bar"><div class="avail-mini-fill" style="width:${100 - pct}%"></div></div>
      <span class="avail-court-free">${libres} libres</span>
    </div>`;
  }).join("");
  container.innerHTML = rows || `<p style="color:var(--muted);font-size:13px">Sin datos</p>`;
}

/* ── precio por hora en sidebar ── */
function initBookingPage() {
  const el = document.getElementById("bk-precio-hora");
  if (el) el.textContent = "$" + CONFIG.precioPorHora.toLocaleString("es-AR") + " por hora";
  initQuickDates();
  renderAvailToday();
  const f = document.getElementById("sel-fecha");
  if (!f.value) f.value = new Date().toISOString().split("T")[0];
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

  const allHours = getHours();
  const available = allHours.filter(h => !taken.includes(h) && !(isToday && parseInt(h) <= curH));

  const countEl = document.getElementById("bk-avail-count");
  if (countEl) countEl.textContent = available.length + " disponibles";

  const grid = document.getElementById("slots-grid");
  grid.innerHTML = allHours.map(h => {
    const hNum    = parseInt(h);
    const isTaken = taken.includes(h);
    const isPast  = isToday && hNum <= curH;
    const isMorning = hNum < 12;
    const isAfternoon = hNum >= 12 && hNum < 18;
    const isNight = hNum >= 18;
    const periodIcon = isMorning ? "🌅" : isAfternoon ? "☀️" : "🌙";

    if (isTaken) {
      return `<div class="bk-slot taken" title="${h} — Ocupado">
        <span class="bk-slot-time">${h}</span>
        <span class="bk-slot-icon">✗</span>
      </div>`;
    }
    if (isPast) {
      return `<div class="bk-slot past" title="${h} — Pasado">
        <span class="bk-slot-time">${h}</span>
        <span class="bk-slot-icon">—</span>
      </div>`;
    }
    return `<div class="bk-slot" onclick="selectSlot('${h}', this)" title="${h} — Disponible">
      <span class="bk-slot-period">${periodIcon}</span>
      <span class="bk-slot-time">${h}</span>
    </div>`;
  }).join("");

  checkForm();
}

function selectSlot(h, el) {
  document.querySelectorAll(".bk-slot").forEach(s => s.classList.remove("selected"));
  el.classList.add("selected");
  selectedSlot = h;

  const canchaId = document.getElementById("sel-cancha").value;
  const fecha    = document.getElementById("sel-fecha").value;
  const cancha   = CONFIG.canchas.find(c => c.id === parseInt(canchaId));

  const fechaLabel = new Date(fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const horaFin = (parseInt(h) + 1).toString().padStart(2, "0") + ":00";

  document.getElementById("c-cancha").textContent  = cancha ? cancha.nombre + " (" + cancha.subtitulo + ")" : "—";
  document.getElementById("c-fecha").textContent   = fechaLabel;
  document.getElementById("c-hora").textContent    = h + " – " + horaFin;
  document.getElementById("c-nombre").textContent  = document.getElementById("inp-nombre").value || "—";
  document.getElementById("c-precio").textContent  = "$" + CONFIG.precioPorHora.toLocaleString("es-AR");
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

  document.getElementById("book-btn").style.display = ok ? "flex" : "none";

  // Update confirm-box nombre in realtime
  if (selectedSlot) {
    const nombre = document.getElementById("inp-nombre").value;
    document.getElementById("c-nombre").textContent = nombre || "—";
  }

  // Steps progress
  const hasCancha = !!document.getElementById("sel-cancha").value;
  const hasFecha  = !!document.getElementById("sel-fecha").value;
  const s2 = document.getElementById("step2");
  const s3 = document.getElementById("step3");
  if (s2) s2.classList.toggle("active", !!(hasCancha && hasFecha));
  if (s3) s3.classList.toggle("active", !!ok);
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

  // Animate success
  document.getElementById("confirm-box").style.display = "none";
  document.getElementById("book-btn").style.display    = "none";
  document.getElementById("slots-section").style.display = "none";

  const fechaLabel = new Date(fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("success-detail").textContent =
    cancha.nombre + " · " + fechaLabel + " · " + selectedSlot + " hs — ¡Te esperamos!";
  document.getElementById("success-msg").style.display = "block";

  renderAvailToday();
}

function resetBooking() {
  document.querySelectorAll(".bk-court-card").forEach(c => c.classList.remove("selected"));
  document.getElementById("sel-cancha").value = "";
  document.getElementById("sel-fecha").value  = "";
  document.getElementById("inp-nombre").value = "";
  document.getElementById("inp-tel").value    = "";
  document.querySelectorAll(".bk-quick-btn").forEach(b => b.classList.remove("active"));
  selectedSlot = null;

  ["slots-section","confirm-box","book-btn","success-msg"].forEach(id => {
    document.getElementById(id).style.display = "none";
  });

  document.querySelectorAll(".bk-step").forEach(s => s.classList.remove("active", "done"));
  const s1 = document.getElementById("step1");
  if (s1) s1.classList.add("active");
}