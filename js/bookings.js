// ============================================================
//  bookings.js — Lógica de reservas
// ============================================================

let bookings = [];
let nextId = 1;
let selectedSlot = null;

// Cargar reservas guardadas
(function loadBookings() {
  try {
    const saved = localStorage.getItem("lapancha_bookings");
    if (saved) {
      const data = JSON.parse(saved);
      bookings = data.bookings || [];
      nextId   = data.nextId   || (bookings.length > 0 ? Math.max(...bookings.map(b => b.id)) + 1 : 1);
    }
  } catch(e) {}
})();

function saveBookings() {
  try {
    localStorage.setItem("lapancha_bookings", JSON.stringify({ bookings, nextId }));
  } catch(e) {}
}

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

/* ── Selección de cancha ── */
function selectCourt(courtId, el) {
  document.querySelectorAll(".bk-court-card").forEach(c => c.classList.remove("selected"));
  el.classList.add("selected");
  // Guardar en data attribute del form para no depender de select vacío
  document.getElementById("bk-form-root").dataset.cancha = courtId;
  updateSlots();
}

/* ── Fechas rápidas ── */
function initQuickDates() {
  const container = document.getElementById("bk-quick-dates");
  if (!container) return;
  const today = new Date().toISOString().split("T")[0];
  const labels = ["Hoy", "Mañana", "Pasado"];
  container.innerHTML = labels.map((lb, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const val = d.toISOString().split("T")[0];
    const isActive = val === document.getElementById("sel-fecha").value;
    return `<button class="bk-quick-btn${isActive ? " active" : ""}" onclick="setQuickDate('${val}', this)">${lb}</button>`;
  }).join("");
}

function setQuickDate(val, el) {
  document.querySelectorAll(".bk-quick-btn").forEach(b => b.classList.remove("active"));
  el.classList.add("active");
  document.getElementById("sel-fecha").value = val;
  updateSlots();
}

/* ── Disponibilidad hoy sidebar ── */
function renderAvailToday() {
  const container = document.getElementById("bk-avail-today-content");
  if (!container) return;
  const today = new Date().toISOString().split("T")[0];
  const now   = new Date();
  const curH  = now.getHours();
  const hours = getHours();

  const rows = CONFIG.canchas.map(c => {
    const taken  = bookings.filter(b => b.cancha === c.nombre && b.fecha === today && b.estado !== "cancelled").map(b => b.hora);
    const libres = hours.filter(h => !taken.includes(h) && parseInt(h) > curH).length;
    const pct    = hours.length > 0 ? Math.round(((hours.length - taken.length) / hours.length) * 100) : 0;
    return `<div class="avail-today-row">
      <span class="avail-court-name">${c.nombre}</span>
      <div class="avail-mini-bar"><div class="avail-mini-fill" style="width:${100 - pct}%"></div></div>
      <span class="avail-court-free">${libres} libres</span>
    </div>`;
  }).join("");
  container.innerHTML = rows || `<p style="color:var(--muted);font-size:13px">Sin datos</p>`;
}

/* ── Info sidebar precio ── */
function updatePrecioSidebar() {
  const ef = document.getElementById("bk-precio-efectivo");
  const tr = document.getElementById("bk-precio-transferencia");
  if (ef) ef.textContent = "$" + CONFIG.precioEfectivo.toLocaleString("es-AR");
  if (tr) tr.textContent = "$" + CONFIG.precioTransferencia.toLocaleString("es-AR");
}

/* ── Init página reservar ── */
function initBookingPage() {
  const closedBanner = document.getElementById("bk-closed-banner");
  const bkLayout     = document.querySelector(".bk-layout");
  if (!CONFIG.clubAbierto) {
    if (closedBanner) {
      closedBanner.querySelector(".bk-closed-msg").textContent = CONFIG.mensajeCierre;
      closedBanner.style.display = "flex";
    }
    if (bkLayout) bkLayout.style.display = "none";
    return;
  }
  if (closedBanner) closedBanner.style.display = "none";
  if (bkLayout) bkLayout.style.display = "flex";

  updatePrecioSidebar();
  initQuickDates();
  renderAvailToday();

  const f = document.getElementById("sel-fecha");
  if (!f.value) {
    f.value = new Date().toISOString().split("T")[0];
    // Activar botón "Hoy" por defecto
    const hoyBtn = document.querySelector(".bk-quick-btn");
    if (hoyBtn) hoyBtn.classList.add("active");
  }
}

/* ── Actualizar slots ── */
function updateSlots() {
  const root     = document.getElementById("bk-form-root");
  const canchaId = root ? parseInt(root.dataset.cancha) : 0;
  const fecha    = document.getElementById("sel-fecha").value;
  selectedSlot   = null;

  document.getElementById("confirm-box").style.display  = "none";
  document.getElementById("book-btn").style.display     = "none";
  document.getElementById("success-msg").style.display  = "none";

  if (!canchaId || !fecha) {
    document.getElementById("slots-section").style.display = "none";
    checkSteps();
    return;
  }

  document.getElementById("slots-section").style.display = "block";

  const cname = CONFIG.canchas.find(c => c.id === canchaId)?.nombre || "";
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
    const hNum      = parseInt(h);
    const isTaken   = taken.includes(h);
    const isPast    = isToday && hNum <= curH;
    const isMorning = hNum < 12;
    const isNight   = hNum >= 18;
    const icon      = isMorning ? "🌅" : isNight ? "🌙" : "☀️";

    if (isTaken) return `<div class="bk-slot taken"><span class="bk-slot-period">${icon}</span><span class="bk-slot-time">${h}</span><span class="bk-slot-status">ocupado</span></div>`;
    if (isPast)  return `<div class="bk-slot past"><span class="bk-slot-period">${icon}</span><span class="bk-slot-time">${h}</span><span class="bk-slot-status">pasado</span></div>`;
    return `<div class="bk-slot free" onclick="selectSlot('${h}', this)"><span class="bk-slot-period">${icon}</span><span class="bk-slot-time">${h}</span><span class="bk-slot-status">libre</span></div>`;
  }).join("");

  checkSteps();
}

/* ── Seleccionar horario ── */
function selectSlot(h, el) {
  document.querySelectorAll(".bk-slot.free, .bk-slot.selected").forEach(s => {
    s.classList.remove("selected");
    s.classList.add("free");
    s.querySelector(".bk-slot-status").textContent = "libre";
  });
  el.classList.remove("free");
  el.classList.add("selected");
  el.querySelector(".bk-slot-status").textContent = "elegido";
  selectedSlot = h;

  const root     = document.getElementById("bk-form-root");
  const canchaId = parseInt(root.dataset.cancha);
  const fecha    = document.getElementById("sel-fecha").value;
  const cancha   = CONFIG.canchas.find(c => c.id === canchaId);

  const fechaLabel = new Date(fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const horaFin    = (parseInt(h) + 1).toString().padStart(2, "0") + ":00";

  document.getElementById("c-cancha").textContent = cancha ? cancha.nombre + " (" + cancha.subtitulo + ")" : "—";
  document.getElementById("c-fecha").textContent  = fechaLabel;
  document.getElementById("c-hora").textContent   = h + " – " + horaFin;
  document.getElementById("c-nombre").textContent = document.getElementById("inp-nombre").value || "—";

  // Mostrar ambos precios en el resumen
  document.getElementById("c-precio-ef").textContent = "$" + CONFIG.precioEfectivo.toLocaleString("es-AR");
  document.getElementById("c-precio-tr").textContent = "$" + CONFIG.precioTransferencia.toLocaleString("es-AR");

  document.getElementById("confirm-box").style.display = "block";
  // Scroll suave al resumen en mobile
  document.getElementById("confirm-box").scrollIntoView({ behavior: "smooth", block: "nearest" });

  checkForm();
  checkSteps();
}

/* ── Validar form ── */
function checkForm() {
  const root     = document.getElementById("bk-form-root");
  const canchaId = root ? root.dataset.cancha : "";
  const fecha    = document.getElementById("sel-fecha").value;
  const nombre   = document.getElementById("inp-nombre").value.trim();
  const tel      = document.getElementById("inp-tel").value.trim();
  const ok       = canchaId && fecha && nombre && tel && selectedSlot;

  document.getElementById("book-btn").style.display = ok ? "flex" : "none";

  if (selectedSlot && nombre) {
    document.getElementById("c-nombre").textContent = nombre;
  }
}

function checkSteps() {
  const root     = document.getElementById("bk-form-root");
  const canchaId = root ? root.dataset.cancha : "";
  const fecha    = document.getElementById("sel-fecha").value;
  const s2 = document.getElementById("step2");
  const s3 = document.getElementById("step3");
  if (s2) s2.classList.toggle("active", !!(canchaId && fecha));
  if (s3) s3.classList.toggle("active", !!selectedSlot);
}

/* ── Confirmar reserva ── */
function confirmarReserva() {
  const root     = document.getElementById("bk-form-root");
  const canchaId = parseInt(root.dataset.cancha);
  const fecha    = document.getElementById("sel-fecha").value;
  const nombre   = document.getElementById("inp-nombre").value.trim();
  const tel      = document.getElementById("inp-tel").value.trim();
  const cancha   = CONFIG.canchas.find(c => c.id === canchaId);

  bookings.push({ id: nextId++, nombre, tel, cancha: cancha.nombre, fecha, hora: selectedSlot, estado: "confirmed" });
  saveBookings();

  document.getElementById("confirm-box").style.display  = "none";
  document.getElementById("book-btn").style.display     = "none";
  document.getElementById("slots-section").style.display = "none";

  const fechaLabel = new Date(fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const horaFin = (parseInt(selectedSlot) + 1).toString().padStart(2, "0") + ":00";

  // Armar link WhatsApp
  const msgWpp = encodeURIComponent(
    `Hola! Quiero confirmar mi reserva en La Pancha Pádel 🎾\n\n` +
    `👤 Nombre: ${nombre}\n` +
    `📞 Tel: ${tel}\n` +
    `🏟️ Cancha: ${cancha.nombre}\n` +
    `📅 Fecha: ${fechaLabel}\n` +
    `⏰ Horario: ${selectedSlot} – ${horaFin} hs\n` +
    `💵 Efectivo: $${CONFIG.precioEfectivo.toLocaleString("es-AR")} | 📲 Transferencia: $${CONFIG.precioTransferencia.toLocaleString("es-AR")}\n\n` +
    `¡Gracias!`
  );
  const wppUrl = `https://wa.me/${CONFIG.whatsappNumero}?text=${msgWpp}`;

  // Mostrar éxito con estado "pendiente de confirmación WA"
  document.getElementById("success-detail").textContent =
    cancha.nombre + " · " + fechaLabel + " · " + selectedSlot + " hs";
  document.getElementById("success-msg").style.display = "block";

  // Botón WA siempre visible y destacado como paso obligatorio
  const wppBtn = document.getElementById("success-wpp-btn");
  if (wppBtn) {
    wppBtn.href = wppUrl;
    wppBtn.style.display = "flex";
    wppBtn.innerHTML = `<i class="ti ti-brand-whatsapp"></i> Confirmar por WhatsApp <span style="font-size:11px;opacity:0.8;margin-left:4px">(requerido)</span>`;
  }

  // Abrir WhatsApp automáticamente
  setTimeout(() => { window.open(wppUrl, "_blank", "noopener"); }, 400);

  document.getElementById("success-msg").scrollIntoView({ behavior: "smooth" });
  renderAvailToday();
}

/* ── Reset ── */
function resetBooking() {
  document.querySelectorAll(".bk-court-card").forEach(c => c.classList.remove("selected"));
  const root = document.getElementById("bk-form-root");
  if (root) delete root.dataset.cancha;
  document.getElementById("sel-fecha").value  = new Date().toISOString().split("T")[0];
  document.getElementById("inp-nombre").value = "";
  document.getElementById("inp-tel").value    = "";
  document.querySelectorAll(".bk-quick-btn").forEach((b, i) => { b.classList.toggle("active", i === 0); });
  selectedSlot = null;
  ["slots-section","confirm-box","book-btn","success-msg"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
  const wppBtn = document.getElementById("success-wpp-btn");
  if (wppBtn) wppBtn.style.display = "none";
  document.querySelectorAll(".bk-step").forEach(s => s.classList.remove("active", "done"));
  const s1 = document.getElementById("step1");
  if (s1) s1.classList.add("active");
}