// ============================================================
//  admin.js — Panel de administración v2 (mejorado 200%)
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

/* ── Tabs del panel ── */
const ADMIN_TABS = ["overview", "reservas", "agenda", "nueva", "buscar", "estadisticas", "config"];

function showAdminTab(tab) {
  ADMIN_TABS.forEach(t => {
    const el = document.getElementById("admin-" + t);
    if (el) el.style.display = t === tab ? "block" : "none";
  });
  document.querySelectorAll(".anav-btn").forEach((btn, i) => {
    btn.classList.toggle("active", ADMIN_TABS[i] === tab);
  });

  if (tab === "overview")     { updateAdminMetrics(); renderOcupacion(); renderProximas(); renderWeeklyChart(); renderCourtStatus(); }
  if (tab === "reservas")     renderReservas();
  if (tab === "agenda")       renderAgenda();
  if (tab === "nueva")        initNuevaReserva();
  if (tab === "buscar")       setTimeout(() => document.getElementById("search-input")?.focus(), 50);
  if (tab === "estadisticas") renderEstadisticas();
  if (tab === "config")       renderConfigTab();
}

/* ── Métricas ── */
function updateAdminMetrics() {
  const today   = new Date().toISOString().split("T")[0];
  const activas = bookings.filter(b => b.estado !== "cancelled");
  const hoy     = activas.filter(b => b.fecha === today);

  document.getElementById("m-hoy").textContent     = hoy.length;
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

/* ── Estado de canchas ── */
function renderCourtStatus() {
  const container = document.getElementById("court-status-grid");
  if (!container) return;
  const today = new Date().toISOString().split("T")[0];
  const hours = getHours();
  const now   = new Date();
  const curH  = now.getHours();

  container.innerHTML = CONFIG.canchas.map(c => {
    const taken  = bookings.filter(b => b.cancha === c.nombre && b.fecha === today && b.estado !== "cancelled");
    const ocupadas = taken.length;
    const pct    = hours.length > 0 ? Math.round((ocupadas / hours.length) * 100) : 0;
    const current = taken.find(b => parseInt(b.hora) === curH);
    const statusText = current ? `Ocupada · ${current.nombre}` : "Libre ahora";
    const statusClass = current ? "cs-occupied" : "cs-free";

    return `<div class="court-status-card">
      <div class="cs-header">
        <span class="cs-name">${c.nombre}</span>
        <span class="cs-badge ${statusClass}">${statusText}</span>
      </div>
      <div class="cs-bar-wrap"><div class="cs-bar" style="width:${pct}%"></div></div>
      <div class="cs-stats">
        <span>${ocupadas} ocupadas</span>
        <span>${hours.length - ocupadas} libres</span>
        <span>${pct}% del día</span>
      </div>
    </div>`;
  }).join("");
}

/* ── Ocupación visual de hoy por cancha ── */
function renderOcupacion() {
  const today = new Date().toISOString().split("T")[0];
  const hours = getHours();
  const container = document.getElementById("ocu-grid");
  if (!container) return;
  const now  = new Date();
  const curH = now.getHours();

  container.innerHTML = CONFIG.canchas.map(c => {
    const taken = bookings
      .filter(b => b.cancha === c.nombre && b.fecha === today && b.estado !== "cancelled")
      .map(b => b.hora);
    const total    = hours.length;
    const ocupadas = taken.length;
    const pct      = total > 0 ? Math.round((ocupadas / total) * 100) : 0;

    const cells = hours.map(h => {
      const b     = bookings.find(x => x.cancha === c.nombre && x.fecha === today && x.hora === h && x.estado !== "cancelled");
      const isPast = parseInt(h) < curH;
      const isCurrent = parseInt(h) === curH;
      const cls   = b
        ? (b.estado === "pending" ? "ocu-cell pending" : "ocu-cell taken")
        : (isPast ? "ocu-cell past" : (isCurrent ? "ocu-cell current-hour" : "ocu-cell free"));
      const tip   = b ? b.nombre : (isPast ? "pasado" : "libre");
      return `<div class="${cls}" title="${h} — ${tip}">
        <span class="ocu-h">${h}</span>
        ${b ? `<span class="ocu-name">${b.nombre.split(" ")[0]}</span>` : ""}
        ${isCurrent && !b ? `<span class="ocu-now-dot"></span>` : ""}
      </div>`;
    }).join("");

    return `<div class="ocu-card">
      <div class="ocu-card-head">
        <span class="ocu-card-name">${c.nombre}</span>
        <div style="display:flex;align-items:center;gap:12px">
          <span class="ocu-pct">${pct}% ocupada</span>
          <span style="font-size:11px;color:var(--muted2)">${ocupadas}/${total} turnos</span>
        </div>
      </div>
      <div class="ocu-bar-wrap"><div class="ocu-bar" style="width:${pct}%"></div></div>
      <div class="ocu-cells">${cells}</div>
    </div>`;
  }).join("");
}

/* ── Próximas reservas ── */
function renderProximas() {
  const now    = new Date();
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
    container.innerHTML = `<div class="proximas-empty"><i class="ti ti-calendar-off" style="font-size:24px;display:block;margin-bottom:8px"></i>No hay próximas reservas</div>`;
    return;
  }

  container.innerHTML = upcoming.map(b => {
    const fecha  = new Date(b.fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
    const isHoy  = b.fecha === nowStr;
    const cl     = b.estado === "confirmed" ? "status-confirmed" : "status-pending";
    const lb     = b.estado === "confirmed" ? "Confirmado" : "Pendiente";
    return `<div class="proxima-item">
      <div class="proxima-hora-wrap">
        <div class="proxima-hora">${b.hora}</div>
        ${isHoy ? `<div class="proxima-hoy-tag">HOY</div>` : ""}
      </div>
      <div class="proxima-info">
        <div class="proxima-nombre">${b.nombre}</div>
        <div class="proxima-sub">${b.cancha} · ${fecha}</div>
      </div>
      <div class="proxima-tel"><i class="ti ti-brand-whatsapp" style="color:#25D366"></i> ${b.tel}</div>
      <span class="status-badge ${cl}">${lb}</span>
      <div class="proxima-actions">
        ${b.estado === "pending" ? `<button class="action-btn confirm-btn" onclick="confirmReserva(${b.id}); renderProximas(); updateAdminMetrics();" title="Confirmar"><i class="ti ti-check"></i></button>` : ""}
        <button class="del-btn" onclick="cancelReserva(${b.id}); updateAdminMetrics(); renderOcupacion(); renderProximas(); renderCourtStatus();" title="Cancelar">
          <i class="ti ti-x"></i>
        </button>
      </div>
    </div>`;
  }).join("");
}

/* ── Gráfico semanal ── */
function renderWeeklyChart() {
  const canvas = document.getElementById("weekly-chart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const days = [], labels = [], counts = [];
  const base = new Date();
  for (let i = -2; i <= 4; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    days.push(key);
    labels.push(d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" }));
    counts.push(bookings.filter(b => b.fecha === key && b.estado !== "cancelled").length);
  }

  const W = canvas.offsetWidth || 600;
  const H = 120;
  canvas.width  = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const max  = Math.max(...counts, 1);
  const n    = counts.length;
  const padL = 16, padR = 16, padT = 24, padB = 28;
  const barW = Math.floor((W - padL - padR) / n) - 8;
  const todayIdx = 2;

  counts.forEach((v, i) => {
    const x  = padL + i * (barW + 8);
    const bh = Math.max(4, (v / max) * (H - padT - padB));
    const y  = H - padB - bh;
    const isToday = i === todayIdx;

    // bar
    ctx.fillStyle = isToday ? "#D4F53C" : (i < todayIdx ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)");
    roundRect(ctx, x, y, barW, bh, 5);
    ctx.fill();

    // label día
    ctx.fillStyle = isToday ? "#D4F53C" : "rgba(255,255,255,0.3)";
    ctx.font = `${isToday ? "bold " : ""}10px DM Sans, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(labels[i].split(" ")[0], x + barW / 2, H - padB + 14);

    // valor
    if (v > 0) {
      ctx.fillStyle = isToday ? "#0B1F3A" : "rgba(255,255,255,0.6)";
      ctx.font = `bold ${isToday ? 12 : 10}px DM Sans, sans-serif`;
      ctx.fillText(v, x + barW / 2, y - 6);
    }
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ── Tabla reservas con filtros mejorados ── */
function renderReservas() {
  const filtroEstado = document.getElementById("filter-estado")?.value || "";
  const filtroCancha = document.getElementById("filter-cancha")?.value || "";
  const filtroFecha  = document.getElementById("filter-fecha")?.value || "";

  const today    = new Date().toISOString().split("T")[0];
  const tomorrow = getFutureDate(1);

  let lista = [...bookings].sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
  if (filtroEstado) lista = lista.filter(b => b.estado === filtroEstado);
  if (filtroCancha) lista = lista.filter(b => b.cancha === filtroCancha);
  if (filtroFecha === "today")    lista = lista.filter(b => b.fecha === today);
  if (filtroFecha === "tomorrow") lista = lista.filter(b => b.fecha === tomorrow);
  if (filtroFecha === "week") {
    const end = getFutureDate(7);
    lista = lista.filter(b => b.fecha >= today && b.fecha <= end);
  }

  document.getElementById("res-count").textContent = lista.length + " registros";
  const tbody = document.getElementById("reservas-tbody");
  tbody.innerHTML = lista.map(b => {
    const cl       = b.estado === "confirmed" ? "status-confirmed" : b.estado === "pending" ? "status-pending" : "status-cancelled";
    const lb       = b.estado === "confirmed" ? "Confirmado" : b.estado === "pending" ? "Pendiente" : "Cancelado";
    const fechaStr = new Date(b.fecha + "T12:00").toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
    const isHoy    = b.fecha === today;
    return `<tr class="${b.estado === "cancelled" ? "row-cancelled" : ""}">
      <td style="color:var(--muted2);font-size:12px">#${b.id}</td>
      <td>
        <div class="td-name">${b.nombre}</div>
        <div class="td-sub"><i class="ti ti-brand-whatsapp" style="color:#25D366;font-size:11px"></i> ${b.tel}</div>
      </td>
      <td><span class="td-court-badge">${b.cancha}</span></td>
      <td>
        <div>${fechaStr}</div>
        ${isHoy ? `<div class="td-hoy-tag">HOY</div>` : ""}
      </td>
      <td><span class="td-time-chip">${b.hora}</span></td>
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

/* ── Exportar CSV ── */
function exportCSV() {
  const header = ["ID", "Nombre", "Teléfono", "Cancha", "Fecha", "Hora", "Estado"];
  const rows   = bookings.map(b => [b.id, b.nombre, b.tel, b.cancha, b.fecha, b.hora, b.estado]);
  const csv    = [header, ...rows].map(r => r.join(",")).join("\n");
  const blob   = new Blob([csv], { type: "text/csv" });
  const a      = document.createElement("a");
  a.href       = URL.createObjectURL(blob);
  a.download   = "reservas-lapancha-" + new Date().toISOString().split("T")[0] + ".csv";
  a.click();
}

/* ── Agenda con vistas ── */
let agendaOffset  = 0;
let agendaDays    = 5;

function setAgendaView(days, btn) {
  agendaDays = days;
  document.querySelectorAll(".agenda-view-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderAgenda();
}

function agendaShift(dir) { agendaOffset += dir * agendaDays; renderAgenda(); }
function agendaGoToday()  { agendaOffset = 0; renderAgenda(); }

function renderAgenda() {
  const days = [];
  const base = new Date();
  for (let i = 0; i < agendaDays; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i + agendaOffset);
    days.push(d);
  }

  const from  = days[0].toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  const to    = days[days.length - 1].toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  const label = document.getElementById("agenda-range-label");
  if (label) label.textContent = agendaDays === 1 ? days[0].toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }) : `${from} — ${to}`;

  const container = document.getElementById("agenda-content");
  const hours     = getHours().filter(h => parseInt(h) >= CONFIG.horarioApertura);
  const today     = new Date().toISOString().split("T")[0];
  const now       = new Date();
  const curH      = now.getHours();

  const header = `<div class="sched-row sched-header">
    <div class="sched-time"></div>
    ${CONFIG.canchas.map(c => `<div class="sched-court-label">${c.nombre}</div>`).join("")}
  </div>`;

  container.innerHTML = days.map(d => {
    const fKey  = d.toISOString().split("T")[0];
    const isHoy = fKey === today;
    const dayLabel = d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const dayBookings = bookings.filter(b => b.fecha === fKey && b.estado !== "cancelled");

    const rows = hours.map(h => {
      const hNum    = parseInt(h);
      const isCurr  = isHoy && hNum === curH;
      const slots   = CONFIG.canchas.map(c => {
        const b = dayBookings.find(x => x.cancha === c.nombre && x.hora === h);
        if (b) {
          const cls2 = b.estado === "pending" ? "sched-slot occupied pending-slot" : "sched-slot occupied";
          return `<div class="${cls2}" onclick="showAdminTab('buscar'); setTimeout(() => { document.getElementById('search-input').value='${b.nombre}'; renderBuscar(); }, 50)">
            <div class="player">${b.nombre}</div>
            <div class="slot-tel">${b.tel}</div>
            <button class="slot-del-btn" onclick="event.stopPropagation(); cancelReserva(${b.id}); renderAgenda();" title="Cancelar"><i class="ti ti-x"></i></button>
          </div>`;
        }
        return `<div class="sched-slot free">libre</div>`;
      }).join("");
      return `<div class="sched-row ${isCurr ? "sched-current-row" : ""}">
        <div class="sched-time">${h}${isCurr ? `<span class="sched-now-badge">ahora</span>` : ""}</div>
        ${slots}
      </div>`;
    }).join("");

    return `<div class="sched-day-header ${isHoy ? "sched-day-today" : ""}">
      ${dayLabel}${isHoy ? ` <span class="sched-hoy-chip">HOY</span>` : ""}
      <span class="sched-day-count">${dayBookings.length} reservas</span>
    </div>${header}${rows}`;
  }).join("");
}

/* ── Nueva reserva admin con preview ── */
function initNuevaReserva() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("an-fecha").value   = today;
  document.getElementById("an-nombre").value  = "";
  document.getElementById("an-tel").value     = "";
  document.getElementById("an-cancha").value  = "";
  document.getElementById("an-hora").innerHTML = "<option value=''>— seleccionar cancha y fecha primero —</option>";
  document.getElementById("an-msg").textContent = "";
  const prev = document.getElementById("an-preview");
  if (prev) prev.style.display = "none";

  ["an-cancha", "an-fecha"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => { actualizarHorasAdmin(); updatePreview(); });
  });
  ["an-nombre", "an-tel", "an-hora"].forEach(id => {
    document.getElementById(id).addEventListener("input", updatePreview);
    document.getElementById(id).addEventListener("change", updatePreview);
  });
}

function updatePreview() {
  const nombre   = document.getElementById("an-nombre").value.trim();
  const canchaId = document.getElementById("an-cancha").value;
  const fecha    = document.getElementById("an-fecha").value;
  const hora     = document.getElementById("an-hora").value;
  const prev     = document.getElementById("an-preview");
  if (!prev) return;

  if (!nombre || !canchaId || !fecha || !hora) {
    prev.style.display = "none";
    return;
  }
  const cancha    = CONFIG.canchas.find(c => c.id === parseInt(canchaId));
  const fechaLabel = new Date(fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "long" });

  document.getElementById("prev-nombre").textContent = nombre;
  document.getElementById("prev-cancha").textContent = cancha ? cancha.nombre : "—";
  document.getElementById("prev-turno").textContent  = `${fechaLabel} · ${hora}`;
  document.getElementById("prev-total").textContent  = "$" + CONFIG.precioPorHora.toLocaleString("es-AR");
  prev.style.display = "block";
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
  const taken = bookings.filter(b => b.cancha === cname && b.fecha === fecha && b.estado !== "cancelled").map(b => b.hora);
  const opts  = getHours().filter(h => !taken.includes(h)).map(h => `<option value="${h}">${h}</option>`).join("");
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
  document.getElementById("an-preview") && (document.getElementById("an-preview").style.display = "none");
  actualizarHorasAdmin();
}

/* ── Búsqueda mejorada ── */
function clearSearch() {
  document.getElementById("search-input").value = "";
  document.getElementById("search-clear").style.display = "none";
  renderBuscar();
}

function renderBuscar() {
  const q         = document.getElementById("search-input").value.trim().toLowerCase();
  const clearBtn  = document.getElementById("search-clear");
  const statsEl   = document.getElementById("search-stats");
  const container = document.getElementById("search-results");

  if (clearBtn) clearBtn.style.display = q ? "flex" : "none";

  if (!q) {
    if (statsEl) statsEl.textContent = "";
    container.innerHTML = `<div class="search-empty-state">
      <i class="ti ti-search" style="font-size:40px;color:var(--muted2);margin-bottom:12px;display:block"></i>
      <p style="color:var(--muted);font-size:14px">Escribí un nombre o teléfono para buscar</p>
    </div>`;
    return;
  }

  const results = bookings.filter(b =>
    b.nombre.toLowerCase().includes(q) || b.tel.toLowerCase().includes(q)
  ).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

  if (statsEl) statsEl.textContent = results.length > 0 ? `${results.length} resultado${results.length !== 1 ? "s" : ""} para "${q}"` : "";

  if (results.length === 0) {
    container.innerHTML = `<div class="search-empty-state">
      <i class="ti ti-search-off" style="font-size:40px;color:var(--muted2);margin-bottom:12px;display:block"></i>
      <p style="color:var(--muted);font-size:14px">Sin resultados para "<strong>${q}</strong>"</p>
    </div>`;
    return;
  }

  container.innerHTML = results.map(b => {
    const cl       = b.estado === "confirmed" ? "status-confirmed" : b.estado === "pending" ? "status-pending" : "status-cancelled";
    const lb       = b.estado === "confirmed" ? "Confirmado" : b.estado === "pending" ? "Pendiente" : "Cancelado";
    const fechaStr = new Date(b.fecha + "T12:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
    const highlighted = (str) => str.replace(new RegExp(q, "gi"), m => `<mark style="background:rgba(212,245,60,0.3);color:var(--lime);border-radius:2px;padding:0 2px">${m}</mark>`);
    return `<div class="search-result-item">
      <div class="sr-avatar">${b.nombre.charAt(0).toUpperCase()}</div>
      <div class="sr-info">
        <div class="sr-nombre">${highlighted(b.nombre)}</div>
        <div class="sr-sub">${highlighted(b.tel)} · ${b.cancha} · ${fechaStr} ${b.hora}</div>
      </div>
      <span class="status-badge ${cl}">${lb}</span>
      ${b.estado === "pending" ? `<button class="action-btn confirm-btn" onclick="confirmReserva(${b.id}); renderBuscar();" title="Confirmar"><i class="ti ti-check"></i></button>` : ""}
      ${b.estado !== "cancelled" ? `<button class="del-btn" onclick="cancelReserva(${b.id}); renderBuscar();" title="Cancelar"><i class="ti ti-x"></i></button>` : ""}
    </div>`;
  }).join("");
}

/* ── Estadísticas ── */
function renderEstadisticas() {
  renderStatsWeekday();
  renderStatsHours();
  renderStatsDonut();
  renderStatsSummary();
}

function renderStatsWeekday() {
  const canvas = document.getElementById("stats-weekday");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const counts = Array(7).fill(0);
  bookings.filter(b => b.estado !== "cancelled").forEach(b => {
    const d = new Date(b.fecha + "T12:00");
    counts[d.getDay()]++;
  });
  drawBarChart(ctx, canvas, dias, counts, "#D4F53C");
}

function renderStatsHours() {
  const canvas = document.getElementById("stats-hours");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const hours = getHours();
  const counts = Array(hours.length).fill(0);
  bookings.filter(b => b.estado !== "cancelled").forEach(b => {
    const idx = hours.indexOf(b.hora);
    if (idx !== -1) counts[idx]++;
  });
  const labels = hours.map((h, i) => i % 2 === 0 ? h : "");
  drawBarChart(ctx, canvas, labels, counts, "#1C4ED8");
}

function drawBarChart(ctx, canvas, labels, counts, color) {
  const W = canvas.offsetWidth || 400;
  const H = 160;
  canvas.width = W; canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const max  = Math.max(...counts, 1);
  const n    = labels.length;
  const padL = 12, padR = 12, padT = 20, padB = 24;
  const barW = Math.max(4, Math.floor((W - padL - padR) / n) - 4);

  counts.forEach((v, i) => {
    const x  = padL + i * (barW + 4);
    const bh = Math.max(2, (v / max) * (H - padT - padB));
    const y  = H - padB - bh;

    ctx.fillStyle = v === Math.max(...counts) ? "#D4F53C" : color;
    roundRect(ctx, x, y, barW, bh, 3);
    ctx.fill();

    if (labels[i]) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px DM Sans, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labels[i], x + barW / 2, H - padB + 12);
    }

    if (v > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "bold 9px DM Sans, sans-serif";
      ctx.fillText(v, x + barW / 2, y - 4);
    }
  });
}

function renderStatsDonut() {
  const container = document.getElementById("stats-donut");
  if (!container) return;
  const activas = bookings.filter(b => b.estado !== "cancelled");
  const rows = CONFIG.canchas.map(c => {
    const count = activas.filter(b => b.cancha === c.nombre).length;
    const pct   = activas.length > 0 ? Math.round((count / activas.length) * 100) : 0;
    return `<div class="donut-row">
      <div class="donut-bar-wrap"><div class="donut-bar" style="width:${pct}%;background:${c.id === 1 ? "var(--lime)" : "var(--court)"}"></div></div>
      <span class="donut-label">${c.nombre}</span>
      <span class="donut-count">${count} (${pct}%)</span>
    </div>`;
  }).join("");
  container.innerHTML = rows;
}

function renderStatsSummary() {
  const container = document.getElementById("stats-summary");
  if (!container) return;
  const today    = new Date().toISOString().split("T")[0];
  const activas  = bookings.filter(b => b.estado !== "cancelled");
  const hoy      = activas.filter(b => b.fecha === today);
  const pendientes = bookings.filter(b => b.estado === "pending");
  const ingresos = activas.length * CONFIG.precioPorHora;

  const items = [
    { label: "Total reservas", value: bookings.length, icon: "ti-list" },
    { label: "Confirmadas", value: activas.filter(b => b.estado === "confirmed").length, icon: "ti-check-circle", color: "var(--lime)" },
    { label: "Pendientes", value: pendientes.length, icon: "ti-clock", color: "var(--amber)" },
    { label: "Canceladas", value: bookings.filter(b => b.estado === "cancelled").length, icon: "ti-x-circle", color: "#fca5a5" },
    { label: "Ingresos est.", value: "$" + ingresos.toLocaleString("es-AR"), icon: "ti-currency-dollar", color: "var(--lime)" },
    { label: "Reservas hoy", value: hoy.length, icon: "ti-calendar-today" },
  ];

  container.innerHTML = items.map(it => `
    <div class="stats-sum-row">
      <i class="ti ${it.icon}" style="color:${it.color || "var(--muted)"}"></i>
      <span class="stats-sum-label">${it.label}</span>
      <span class="stats-sum-value" style="color:${it.color || "var(--text)"}">${it.value}</span>
    </div>
  `).join("");
}

/* ── Tab Configuración ── */
function renderConfigTab() {
  const el = document.getElementById("cfg-wpp");
  if (el) el.value = CONFIG.whatsappNumero;
  const msgEl = document.getElementById("cfg-msg-cierre");
  if (msgEl) msgEl.value = CONFIG.mensajeCierre;
  const efEl = document.getElementById("cfg-precio-ef");
  if (efEl) efEl.value = CONFIG.precioEfectivo;
  const trEl = document.getElementById("cfg-precio-tr");
  if (trEl) trEl.value = CONFIG.precioTransferencia;
  updateClubStatusUI();
}

function updateClubStatusUI() {
  const abierto = CONFIG.clubAbierto;
  const badge   = document.getElementById("cfg-status-badge");
  const btnAbrir = document.getElementById("cfg-btn-abrir");
  const btnCerrar = document.getElementById("cfg-btn-cerrar");
  if (badge) {
    badge.textContent = abierto ? "🟢 ABIERTO" : "🔴 CERRADO";
    badge.className   = "cfg-status-badge " + (abierto ? "cfg-open" : "cfg-closed");
  }
  if (btnAbrir)  btnAbrir.disabled  = abierto;
  if (btnCerrar) btnCerrar.disabled = !abierto;
}

function cfgSetClubStatus(abierto) {
  CONFIG.clubAbierto = abierto;
  updateClubStatusUI();
  // Actualizar banner en página reservar si está visible
  const closedBanner = document.getElementById("bk-closed-banner");
  const bkLayout = document.querySelector(".bk-layout");
  if (!abierto) {
    if (closedBanner) { closedBanner.querySelector(".bk-closed-msg").textContent = CONFIG.mensajeCierre; closedBanner.style.display = "flex"; }
    if (bkLayout) bkLayout.style.display = "none";
  } else {
    if (closedBanner) closedBanner.style.display = "none";
    if (bkLayout) bkLayout.style.display = "flex";
  }
  showCfgToast(abierto ? "✅ Club marcado como ABIERTO" : "🔴 Club marcado como CERRADO");
}

function cfgGuardar() {
  const wpp   = document.getElementById("cfg-wpp").value.trim().replace(/\D/g, "");
  const msg   = document.getElementById("cfg-msg-cierre").value.trim();
  const ef    = parseInt(document.getElementById("cfg-precio-ef").value);
  const tr    = parseInt(document.getElementById("cfg-precio-tr").value);

  if (!wpp) { showCfgToast("⚠ Ingresá un número de WhatsApp válido", true); return; }
  if (isNaN(ef) || ef < 0) { showCfgToast("⚠ Ingresá un precio de efectivo válido", true); return; }
  if (isNaN(tr) || tr < 0) { showCfgToast("⚠ Ingresá un precio de transferencia válido", true); return; }

  CONFIG.whatsappNumero      = wpp;
  if (msg) CONFIG.mensajeCierre = msg;
  CONFIG.precioEfectivo      = ef;
  CONFIG.precioTransferencia = tr;

  // Actualizar sidebar de reservas si está visible
  const efEl = document.getElementById("bk-precio-efectivo");
  const trEl = document.getElementById("bk-precio-transferencia");
  if (efEl) efEl.textContent = "$" + ef.toLocaleString("es-AR");
  if (trEl) trEl.textContent = "$" + tr.toLocaleString("es-AR");

  showCfgToast("✅ Configuración guardada");
}

function showCfgToast(text, isError = false) {
  const t = document.getElementById("cfg-toast");
  if (!t) return;
  t.textContent = text;
  t.className = "cfg-toast " + (isError ? "cfg-toast-error" : "cfg-toast-ok") + " cfg-toast-show";
  setTimeout(() => t.classList.remove("cfg-toast-show"), 3000);
}

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  startClock();
  window.addEventListener("resize", () => {
    if (document.getElementById("admin-overview")?.style.display !== "none") renderWeeklyChart();
  });
});