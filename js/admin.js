// ============================================================
//  admin.js — Panel de administración mejorado
// ============================================================

/* ── Reloj en tiempo real ── */
function startClock() {
  const el = document.getElementById("admin-clock");
  if (!el) return;
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };
  tick();
  setInterval(tick, 1000);
}

/* ── Login / Logout ── */
function adminLogin() {
  const user = document.getElementById("admin-user").value;
  const pass = document.getElementById("admin-pass").value;
  const err  = document.getElementById("login-err");
  if (user === CONFIG.adminUsuario && pass === CONFIG.adminPassword) {
    err.style.display = "none";
    showPage("admin");
  } else {
    err.style.display = "block";
    document.getElementById("login-card").classList.add("shake");
    setTimeout(() => document.getElementById("login-card").classList.remove("shake"), 500);
  }
}

function adminLogout() { showPage("home"); }

/* ── Navegación del panel ── */
const ADMIN_TABS = ["overview", "reservas", "agenda", "nueva", "buscar"];

function showAdminTab(tab) {
  ADMIN_TABS.forEach(t => {
    const el = document.getElementById("admin-" + t);
    if (el) el.style.display = t === tab ? "block" : "none";
  });
  document.querySelectorAll(".anav-btn").forEach((btn, i) => {
    btn.classList.toggle("active", ADMIN_TABS[i] === tab);
  });

  if (tab === "overview") { updateAdminMetrics(); renderOcupacion(); renderProximas(); renderWeeklyChart(); }
  if (tab === "reservas") renderReservas();
  if (tab === "agenda")   renderAgenda();
  if (tab === "nueva")    initNuevaReserva();
  if (tab === "buscar")   document.getElementById("search-input")?.focus();
}

/* ── Métricas ── */
function updateAdminMetrics() {
  const today   = new Date().toISOString().split("T")[0];
  const activas = bookings.filter(b => b.estado !== "cancelled");
  const hoy     = activas.filter(b => b.fecha === today);

  document.getElementById("m-hoy").textContent    = hoy.length;
  document.getElementById("m-hoy-sub").textContent = hoy.length === 1 ? "reserva hoy" : "reservas hoy";
  document.getElementById("m-semana").textContent  = activas.length;
  document.getElementById("m-ingresos").textContent = "$" + (activas.length * CONFIG.precioPorHora).toLocaleString("es-AR");
  document.getElementById("m-ingresos-sub").textContent = "@$" + CONFIG.precioPorHora.toLocaleString("es-AR") + "/hora";

  const now  = new Date();
  const curH = now.getHours();
  const todayHoras = hoy.map(b => parseInt(b.hora));
  const nextFree = getHours().find(h => parseInt(h) > curH && !todayHoras.includes(parseInt(h)));
  document.getElementById("m-libre").textContent     = nextFree || "Mañana";
  document.getElementById("m-libre-sub").textContent = nextFree ? "próximo libre hoy" : "sin turnos libres hoy";
}

/* ── Ocupación visual de hoy por cancha ── */
function renderOcupacion() {
  const today = new Date().toISOString().split("T")[0];
  const hours = getHours();
  const container = document.getElementById("ocu-grid");
  if (!container) return;

  container.innerHTML = CONFIG.canchas.map(c => {
    const taken = bookings
      .filter(b => b.cancha === c.nombre && b.fecha === today && b.estado !== "cancelled")
      .map(b => b.hora);
    const total = hours.length;
    const ocupadas = taken.length;
    const pct = total > 0 ? Math.round((ocupadas / total) * 100) : 0;

    const cells = hours.map(h => {
      const b = bookings.find(x => x.cancha === c.nombre && x.fecha === today && x.hora === h && x.estado !== "cancelled");
      const cls = b ? (b.estado === "pending" ? "ocu-cell pending" : "ocu-cell taken") : "ocu-cell free";
      const tip = b ? b.nombre : "libre";
      return `<div class="${cls}" title="${h} — ${tip}">
        <span class="ocu-h">${h}</span>
        ${b ? `<span class="ocu-name">${b.nombre.split(" ")[0]}</span>` : ""}
      </div>`;
    }).join("");

    return `<div class="ocu-card">
      <div class="ocu-card-head">
        <span class="ocu-card-name">${c.nombre}</span>
        <span class="ocu-pct">${pct}% ocupada</span>
      </div>
      <div class="ocu-bar-wrap"><div class="ocu-bar" style="width:${pct}%"></div></div>
      <div class="ocu-cells">${cells}</div>
    </div>`;
  }).join("");
}

/* ── Próximas reservas (siguientes 8) ── */
function renderProximas() {
  const now = new Date();
  const nowStr = now.toISOString().split("T")[0];
  const curH   = now.getHours();

  const upcoming = bookings
    .filter(b => {
      if (b.estado === "cancelled") return false;
      if (b.fecha > nowStr) return true;
      if (b.fecha === nowStr && parseInt(b.hora) > curH) return true;
      return false;
    })
    .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
    .slice(0, 8);

  document.getElementById("proximas-count").textContent = upcoming.length;
  const container = document.getElementById("proximas-list");
  if (!container) return;

  if (upcoming.length === 0) {
    container.innerHTML = `<div class="proximas-empty">No hay próximas reservas</div>`;
    return;
  }

  container.innerHTML = upcoming.map(b => {
    const fecha = new Date(b.fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
    const cl    = b.estado === "confirmed" ? "status-confirmed" : "status-pending";
    const lb    = b.estado === "confirmed" ? "Confirmado" : "Pendiente";
    return `<div class="proxima-item">
      <div class="proxima-hora">${b.hora}</div>
      <div class="proxima-info">
        <div class="proxima-nombre">${b.nombre}</div>
        <div class="proxima-sub">${b.cancha} · ${fecha}</div>
      </div>
      <div class="proxima-tel"><i class="ti ti-phone"></i> ${b.tel}</div>
      <span class="status-badge ${cl}">${lb}</span>
      <button class="del-btn" onclick="cancelReserva(${b.id}); updateAdminMetrics(); renderOcupacion(); renderProximas();" title="Cancelar">
        <i class="ti ti-x"></i>
      </button>
    </div>`;
  }).join("");
}

/* ── Gráfico semanal (canvas puro) ── */
function renderWeeklyChart() {
  const canvas = document.getElementById("weekly-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const days = [];
  const labels = [];
  const counts = [];
  const base = new Date();

  for (let i = -3; i <= 3; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    days.push(key);
    labels.push(d.toLocaleDateString("es-AR", { weekday: "short" }));
    counts.push(bookings.filter(b => b.fecha === key && b.estado !== "cancelled").length);
  }

  const W = canvas.offsetWidth || 600;
  const H = 100;
  canvas.width  = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const max = Math.max(...counts, 1);
  const barW = Math.floor((W - 60) / counts.length) - 8;
  const padL = 30;
  const todayIdx = 3;

  counts.forEach((v, i) => {
    const x   = padL + i * (barW + 8);
    const bh  = Math.max(4, (v / max) * (H - 36));
    const y   = H - 20 - bh;
    const isToday = i === todayIdx;

    ctx.fillStyle = isToday ? "#D4F53C" : "rgba(255,255,255,0.12)";
    roundRect(ctx, x, y, barW, bh, 4);
    ctx.fill();

    ctx.fillStyle = isToday ? "#D4F53C" : "rgba(255,255,255,0.4)";
    ctx.font = "11px DM Sans, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], x + barW / 2, H - 4);

    if (v > 0) {
      ctx.fillStyle = isToday ? "#0B1F3A" : "rgba(255,255,255,0.7)";
      ctx.font = "bold 11px DM Sans, sans-serif";
      ctx.fillText(v, x + barW / 2, y - 5);
    }
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── Tabla de reservas con filtros ── */
function renderReservas() {
  const filtroEstado = document.getElementById("filter-estado")?.value || "";
  const filtroCancha = document.getElementById("filter-cancha")?.value || "";

  let lista = [...bookings].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  if (filtroEstado) lista = lista.filter(b => b.estado === filtroEstado);
  if (filtroCancha) lista = lista.filter(b => b.cancha === filtroCancha);

  document.getElementById("res-count").textContent = lista.length + " registros";
  const tbody = document.getElementById("reservas-tbody");
  tbody.innerHTML = lista.map(b => {
    const cl = b.estado === "confirmed" ? "status-confirmed" : b.estado === "pending" ? "status-pending" : "status-cancelled";
    const lb = b.estado === "confirmed" ? "Confirmado" : b.estado === "pending" ? "Pendiente" : "Cancelado";
    const fechaStr = new Date(b.fecha + "T12:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
    return `<tr>
      <td><div class="td-name">${b.nombre}</div><div class="td-sub"><i class="ti ti-phone" style="font-size:11px"></i> ${b.tel}</div></td>
      <td>${b.cancha}</td>
      <td>${fechaStr}</td>
      <td>${b.hora}</td>
      <td><span class="status-badge ${cl}">${lb}</span></td>
      <td>
        <div style="display:flex;gap:6px;align-items:center">
          ${b.estado === "pending" ? `<button class="action-btn confirm-btn" onclick="confirmReserva(${b.id})" title="Confirmar"><i class="ti ti-check"></i></button>` : ""}
          ${b.estado !== "cancelled" ? `<button class="del-btn" onclick="cancelReserva(${b.id})" title="Cancelar"><i class="ti ti-x"></i></button>` : ""}
        </div>
      </td>
    </tr>`;
  }).join("");
}

function confirmReserva(id) {
  const b = bookings.find(b => b.id === id);
  if (b) b.estado = "confirmed";
  renderReservas();
  updateAdminMetrics();
}

function cancelReserva(id) {
  const b = bookings.find(b => b.id === id);
  if (b) b.estado = "cancelled";
  renderReservas();
  updateAdminMetrics();
}

/* ── Agenda semanal con navegación ── */
let agendaOffset = 0;

function agendaShift(dir) {
  agendaOffset += dir * 5;
  renderAgenda();
}

function agendaGoToday() {
  agendaOffset = 0;
  renderAgenda();
}

function renderAgenda() {
  const days = [];
  const base = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i + agendaOffset);
    days.push(d);
  }

  // actualizar label de rango
  const from = days[0].toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  const to   = days[4].toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  const label = document.getElementById("agenda-range-label");
  if (label) label.textContent = `${from} — ${to}`;

  const container = document.getElementById("agenda-content");
  const hours = getHours().filter(h => parseInt(h) >= 7);
  const header = `<div class="sched-row sched-header">
    <div class="sched-time"></div>
    ${CONFIG.canchas.map(c => `<div class="sched-court-label">${c.nombre}</div>`).join("")}
  </div>`;

  const today = new Date().toISOString().split("T")[0];

  container.innerHTML = days.map(d => {
    const fKey   = d.toISOString().split("T")[0];
    const isHoy  = fKey === today;
    const label  = d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const dayB   = bookings.filter(b => b.fecha === fKey && b.estado !== "cancelled");
    const rows = hours.map(h => {
      const slots = CONFIG.canchas.map(c => {
        const b = dayB.find(x => x.cancha === c.nombre && x.hora === h);
        if (b) {
          const cl2 = b.estado === "pending" ? "sched-slot occupied pending-slot" : "sched-slot occupied";
          return `<div class="${cl2}">
            <div class="player">${b.nombre}</div>
            <div class="court-tag">${b.tel}</div>
          </div>`;
        }
        return `<div class="sched-slot free">libre</div>`;
      }).join("");
      return `<div class="sched-row"><div class="sched-time">${h}</div>${slots}</div>`;
    }).join("");

    return `<div class="sched-day ${isHoy ? "sched-day-today" : ""}">${isHoy ? "📅 " : ""}${label}${isHoy ? " — <span style='color:var(--lime)'>HOY</span>" : ""}</div>${header}${rows}`;
  }).join("");
}

/* ── Nueva reserva manual ── */
function initNuevaReserva() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("an-fecha").value = today;
  document.getElementById("an-nombre").value = "";
  document.getElementById("an-tel").value = "";
  document.getElementById("an-cancha").value = "";
  document.getElementById("an-hora").innerHTML = "<option value=''>— seleccionar cancha y fecha primero —</option>";
  document.getElementById("an-msg").textContent = "";

  ["an-cancha", "an-fecha"].forEach(id => {
    document.getElementById(id).addEventListener("change", actualizarHorasAdmin);
  });
}

function actualizarHorasAdmin() {
  const canchaId = document.getElementById("an-cancha").value;
  const fecha    = document.getElementById("an-fecha").value;
  const select   = document.getElementById("an-hora");
  if (!canchaId || !fecha) {
    select.innerHTML = "<option value=''>— seleccionar cancha y fecha primero —</option>";
    return;
  }
  const cname = CONFIG.canchas.find(c => c.id === parseInt(canchaId))?.nombre || "";
  const taken = bookings
    .filter(b => b.cancha === cname && b.fecha === fecha && b.estado !== "cancelled")
    .map(b => b.hora);

  const opts = getHours()
    .filter(h => !taken.includes(h))
    .map(h => `<option value="${h}">${h}</option>`)
    .join("");

  select.innerHTML = opts || "<option value=''>Sin turnos disponibles</option>";
}

function adminCrearReserva() {
  const nombre   = document.getElementById("an-nombre").value.trim();
  const tel      = document.getElementById("an-tel").value.trim();
  const canchaId = document.getElementById("an-cancha").value;
  const fecha    = document.getElementById("an-fecha").value;
  const hora     = document.getElementById("an-hora").value;
  const estado   = document.getElementById("an-estado").value;
  const msg      = document.getElementById("an-msg");

  if (!nombre || !tel || !canchaId || !fecha || !hora) {
    msg.textContent = "⚠ Completá todos los campos.";
    msg.className   = "an-msg an-error";
    return;
  }

  const cancha = CONFIG.canchas.find(c => c.id === parseInt(canchaId));
  bookings.push({ id: nextId++, nombre, tel, cancha: cancha.nombre, fecha, hora, estado });

  msg.textContent = `✓ Reserva creada: ${nombre} · ${cancha.nombre} · ${fecha} ${hora}`;
  msg.className   = "an-msg an-success";

  document.getElementById("an-nombre").value = "";
  document.getElementById("an-tel").value    = "";
  actualizarHorasAdmin();
}

/* ── Búsqueda ── */
function renderBuscar() {
  const q = document.getElementById("search-input").value.trim().toLowerCase();
  const container = document.getElementById("search-results");
  if (!q) {
    container.innerHTML = `<p class="search-hint">Escribí para buscar entre las reservas</p>`;
    return;
  }

  const results = bookings.filter(b =>
    b.nombre.toLowerCase().includes(q) || b.tel.toLowerCase().includes(q)
  ).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  if (results.length === 0) {
    container.innerHTML = `<p class="search-hint">Sin resultados para "<strong>${q}</strong>"</p>`;
    return;
  }

  container.innerHTML = results.map(b => {
    const cl = b.estado === "confirmed" ? "status-confirmed" : b.estado === "pending" ? "status-pending" : "status-cancelled";
    const lb = b.estado === "confirmed" ? "Confirmado" : b.estado === "pending" ? "Pendiente" : "Cancelado";
    const fechaStr = new Date(b.fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
    return `<div class="search-result-item">
      <div class="sr-avatar">${b.nombre.charAt(0).toUpperCase()}</div>
      <div class="sr-info">
        <div class="sr-nombre">${b.nombre}</div>
        <div class="sr-sub">${b.tel} · ${b.cancha} · ${fechaStr} ${b.hora}</div>
      </div>
      <span class="status-badge ${cl}">${lb}</span>
      ${b.estado !== "cancelled" ? `<button class="del-btn" onclick="cancelReserva(${b.id}); renderBuscar();" title="Cancelar"><i class="ti ti-x"></i></button>` : ""}
    </div>`;
  }).join("");
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  startClock();
  // Resize chart on window resize
  window.addEventListener("resize", () => {
    if (document.getElementById("admin-overview")?.style.display !== "none") {
      renderWeeklyChart();
    }
  });
});